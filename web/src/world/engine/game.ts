import * as THREE from "three";
import { createRenderer, type Quality } from "./renderer";
import { createSky, type TimeName } from "./sky";
import { createInput } from "./input";
import { clampDt, followCamera, pullInDistance } from "./camera";
import { loadPlayer, loadNpc, type Character } from "./characters";
import { Dialogue } from "../story/dialogue";
import { Objectives } from "../story/objectives";
import { CHAPTERS } from "../story/chapters";
import type { DialogueLine, Interactable } from "../story/types";
import type { ChapterApi, ChapterScene } from "../chapters/types";
import { store } from "../store";

export class Game {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 1200);
  private r!: Extract<ReturnType<typeof createRenderer>, { ok: true }>;
  private sky!: ReturnType<typeof createSky>;
  private input!: ReturnType<typeof createInput>;
  private pc!: Character;
  private chapter!: ChapterScene;
  private objectives!: Objectives;
  private dialogue: Dialogue | null = null;
  private pending: Interactable | null = null;
  private dlgDone: (() => void) | null = null;
  private npcs: { c: Character; spec: ChapterScene["npcs"][number] }[] = [];
  private vel = new THREE.Vector3();
  private camLook = new THREE.Vector3();
  private yaw = 0; private pitch = 0.16; private dist = 4.4;
  private fired = new Set<string>(); private thoughtT = 0; private completed = false;
  private ray = new THREE.Ray(); private head = new THREE.Vector3(); private camDir = new THREE.Vector3(); private hitP = new THREE.Vector3();
  private t = 0; private last = 0; private raf = 0; private paused = false; private disposed = false;
  private onResize = () => { this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); this.r.resize(); if (this.paused) this.render(); };
  private onWheel = (e: WheelEvent) => { this.dist = THREE.MathUtils.clamp(this.dist + e.deltaY * 0.004, 2.6, 9); };

  constructor(private opts: { host: HTMLElement; onPause?: () => void; onComplete?: () => void }) {}

  get player() { return this.pc.root; }

  async start(chapter: ChapterScene): Promise<void> {
    const r = createRenderer(this.opts.host);
    if (!r.ok) { store.set({ note: r.message, loading: false }); return; }
    this.r = r; this.chapter = chapter;
    store.set({ loading: true });
    this.sky = createSky(this.scene, r.renderer);
    const lamps = this.sky.setTime(chapter.time);
    await chapter.build(this.scene);
    chapter.setLamps?.(lamps); // after build: the chapter only has its lamp materials once built
    if (this.disposed) return;
    this.pc = await loadPlayer(CHAPTERS[chapter.id - 1].era, (note) => store.set({ note }));
    if (this.disposed) return;
    this.pc.root.position.copy(chapter.spawn);
    this.scene.add(this.pc.root);
    for (const spec of chapter.npcs) {
      const c = await loadNpc(spec.url, spec.tint).catch(() => null); // a missing NPC model just leaves that NPC out
      if (this.disposed) return;
      if (!c) continue;
      c.root.position.set(...spec.position); c.root.rotation.y = spec.rotationY;
      c.play(spec.motion);
      if (spec.motion === "walk") c.setMotion(1.1);
      this.scene.add(c.root); this.npcs.push({ c, spec });
    }
    this.objectives = new Objectives(chapter.objectives);
    this.input = createInput(r.renderer.domElement);
    r.renderer.domElement.addEventListener("wheel", this.onWheel, { passive: true });
    addEventListener("resize", this.onResize);
    const { pos, look } = followCamera(this.player.position, this.yaw, this.pitch, this.dist);
    this.camera.position.copy(pos); this.camLook.copy(look);
    store.set({ loading: false, ...this.objectiveText() });
    if (import.meta.env.DEV) (globalThis as unknown as { __world: unknown }).__world = { step: (dt: number) => { this.step(dt); this.render(); } };
    this.step(1); this.render();
    this.resume();
  }

  setTime(name: TimeName): void { this.chapter.setLamps?.(this.sky.setTime(name)); this.render(); }
  setQuality(q: Quality): void { this.r.setQuality(q); this.render(); }

  pause() { this.paused = true; cancelAnimationFrame(this.raf); }
  resume() { this.input?.state(); /* drop one-shot keys (the Esc that closed the menu) */ this.paused = false; this.last = performance.now(); cancelAnimationFrame(this.raf); this.raf = requestAnimationFrame(this.loop); }

  dispose() {
    this.disposed = true;
    delete (globalThis as { __world?: unknown }).__world;
    this.pause();
    this.input?.dispose();
    this.r?.renderer.domElement.removeEventListener("wheel", this.onWheel);
    removeEventListener("resize", this.onResize);
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      for (const mat of ([] as THREE.Material[]).concat(m.material ?? [])) {
        for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose();
        mat.dispose();
      }
    });
    this.r?.renderer.dispose();
    this.r?.composer?.dispose();
    this.r?.renderer.forceContextLoss?.();
  }

  private loop = (now: number) => {
    this.raf = requestAnimationFrame(this.loop);
    if (document.hidden || this.paused) { this.last = now; return; }
    const dt = clampDt((now - this.last) / 1000);
    this.last = now;
    this.step(dt); this.render();
  };

  private render() { this.r.render(this.scene, this.camera); }

  // E key or the Talk button: start the nearest conversation, or advance the open one
  interact() {
    if (this.dialogue) {
      const line = this.dialogue.next();
      store.set({ dialogue: line, last: this.dialogue.isLast() });
      if (!line) this.finish();
    } else if (this.pending) {
      const it = this.pending;
      if (this.chapter.onInteract?.(it.id, this.api) === true) return;
      void this.open(it.dialogue ?? [], it.completes);
    }
  }

  // what a chapter's onInteract can do; moment/sequence are filled in by the cinematic layer
  private api: ChapterApi = {
    complete: (id) => this.complete(id),
    moment: () => Promise.resolve(),
    sequence: () => Promise.resolve(),
    thought: (text) => { this.thoughtT = 4.5; store.set({ thought: text }); },
    dialogue: (lines) => this.open(lines),
    setTime: (name) => this.setTime(name),
  };

  private open(lines: DialogueLine[], completes?: string): Promise<void> {
    return new Promise((res) => {
      this.dialogue = new Dialogue(lines);
      this.dlgDone = () => { if (completes) this.complete(completes); res(); };
      const line = this.dialogue.current();
      store.set({ dialogue: line, prompt: null, last: this.dialogue.isLast() });
      if (!line) this.finish();
    });
  }

  private objectiveText() {
    const opt = this.chapter.objectives.find((o) => o.optional && !this.objectives.isDone(o.id));
    return { objective: this.objectives.active()?.text ?? null, optional: opt?.text ?? null };
  }

  private complete(id: string) {
    this.objectives.complete(id);
    store.set(this.objectiveText());
    if (this.objectives.allRequiredDone() && !this.completed) { this.completed = true; this.opts.onComplete?.(); store.set({ complete: true }); }
  }

  private finish() {
    const done = this.dlgDone;
    this.dialogue = null; this.dlgDone = null;
    done?.();
  }

  step(dt: number) {
    this.t += dt;
    if (this.thoughtT > 0 && (this.thoughtT -= dt) <= 0) store.set({ thought: null });
    const inp = this.input.state();
    this.yaw -= inp.lookDX * 0.005;
    this.pitch = THREE.MathUtils.clamp(this.pitch + inp.lookDY * 0.003, -0.15, 0.7);
    this.input.consumeLook();
    if (inp.pause) this.opts.onPause?.();
    if (inp.interact) this.interact();

    // movement is relative to the camera, and frozen while someone is talking
    const talking = !!this.dialogue;
    const fw = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)), rt = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const want = talking ? new THREE.Vector3() : fw.multiplyScalar(inp.move.y).add(rt.multiplyScalar(inp.move.x));
    if (want.lengthSq() > 1) want.normalize();
    this.vel.lerp(want.multiplyScalar(2.6 * (inp.run ? 2.7 : 1)), 1 - Math.exp(-dt * 10));
    const p = this.player.position, b = this.chapter.bounds;
    p.addScaledVector(this.vel, dt);
    p.x = THREE.MathUtils.clamp(p.x, b.minX, b.maxX);
    p.z = THREE.MathUtils.clamp(p.z, b.minZ, b.maxZ);
    p.y = this.chapter.groundY?.(p.x, p.z) ?? this.chapter.spawn.y;
    const speed = this.vel.length();
    if (speed > 0.15) {
      let d = Math.atan2(-this.vel.x, -this.vel.z) - this.player.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.player.rotation.y += d * (1 - Math.exp(-dt * 12));
    }
    this.pc.setMotion(speed); this.pc.update(dt);
    this.chapter.update?.(this.t, dt);

    for (const { c, spec } of this.npcs) {
      if (spec.patrol) {
        const w = this.t * 0.18;
        c.root.position.z = spec.position[2] + Math.sin(w) * spec.patrol.range;
        c.root.rotation.y = Math.cos(w) > 0 ? Math.PI : 0;
      }
      c.update(dt);
    }

    // the nearest interactable in reach sets the prompt
    if (!talking) {
      this.pending = null;
      let best = Infinity;
      for (const it of this.chapter.interactables) {
        const d = Math.hypot(p.x - it.position[0], p.z - it.position[2]);
        if (d > (it.radius ?? 2.2)) continue;
        if (it.auto) { // an inner thought: shown once, never blocks
          if (!this.fired.has(it.id)) { this.fired.add(it.id); this.thoughtT = 4.5; store.set({ thought: it.thought ?? null }); }
          continue;
        }
        if (it.completes && this.objectives.isDone(it.completes)) continue; // done: no more prompt
        if (d < best) { best = d; this.pending = it; }
      }
      const prompt = this.pending?.label ?? null;
      if (prompt !== store.get().prompt) store.set({ prompt });
    }

    const { pos, look } = followCamera(p, this.yaw, this.pitch, this.dist);
    // one ray from the head toward the wanted camera spot: if a wall box is in the way, sit just in front of it
    let rate = 8;
    const cols = this.chapter.colliders;
    if (cols?.length) {
      const head = this.head.set(p.x, p.y + 1.6, p.z), dir = this.camDir.subVectors(pos, head), len = dir.length();
      if (len > 0.01) {
        this.ray.set(head, dir.divideScalar(len));
        let hit: number | null = null;
        for (const b of cols) { const h = this.ray.intersectBox(b, this.hitP); if (h) { const dd = h.distanceTo(head); if (hit === null || dd < hit) hit = dd; } }
        const nl = pullInDistance(hit, len);
        if (nl < len) { pos.copy(head).addScaledVector(dir, nl); rate = 24; }
      }
    }
    this.camera.position.lerp(pos, 1 - Math.exp(-dt * rate));
    this.camLook.lerp(look, 1 - Math.exp(-dt * 10));
    this.camera.lookAt(this.camLook);
    this.sky.followShadow(p);
  }
}
