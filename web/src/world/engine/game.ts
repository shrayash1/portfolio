import * as THREE from "three";
import { createRenderer } from "./renderer";
import { createSky } from "./sky";
import { createInput } from "./input";
import { clampDt, followCamera } from "./camera";
import { loadPlayer, loadNpc, type Character } from "./characters";
import { Dialogue } from "../story/dialogue";
import { Objectives } from "../story/objectives";
import type { Era, Interactable } from "../story/types";
import type { ChapterScene } from "../chapters/types";
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
  private npcs: { c: Character; spec: ChapterScene["npcs"][number] }[] = [];
  private vel = new THREE.Vector3();
  private camLook = new THREE.Vector3();
  private yaw = 0; private pitch = 0.16; private dist = 4.4;
  private t = 0; private last = 0; private raf = 0; private paused = false; private disposed = false;
  private onResize = () => { this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); this.r.resize(); };
  private onWheel = (e: WheelEvent) => { this.dist = THREE.MathUtils.clamp(this.dist + e.deltaY * 0.004, 2.6, 9); };

  constructor(private opts: { host: HTMLElement; era: Era }) {}

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
    this.pc = await loadPlayer(this.opts.era, (note) => store.set({ note }));
    if (this.disposed) return;
    this.pc.root.position.copy(chapter.spawn);
    this.scene.add(this.pc.root);
    for (const spec of chapter.npcs) {
      const c = await loadNpc(spec.url);
      if (this.disposed) return;
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
    store.set({ loading: false, objective: this.objectives.active()?.text ?? null });
    if (import.meta.env.DEV) (globalThis as unknown as { __world: unknown }).__world = { step: (dt: number) => { this.step(dt); this.render(); } };
    this.step(1); this.render();
    this.resume();
  }

  pause() { this.paused = true; cancelAnimationFrame(this.raf); }
  resume() { this.paused = false; this.last = performance.now(); cancelAnimationFrame(this.raf); this.raf = requestAnimationFrame(this.loop); }

  dispose() {
    this.disposed = true;
    delete (globalThis as { __world?: unknown }).__world;
    this.pause();
    this.input?.dispose();
    this.r?.renderer.domElement.removeEventListener("wheel", this.onWheel);
    removeEventListener("resize", this.onResize);
    this.r?.renderer.dispose();
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
      store.set({ dialogue: line });
      if (!line) this.finish();
    } else if (this.pending) {
      this.dialogue = new Dialogue(this.pending.dialogue ?? []);
      const line = this.dialogue.current();
      store.set({ dialogue: line, prompt: null });
      if (!line) this.finish();
    }
  }

  private finish() {
    if (this.pending?.completes) this.objectives.complete(this.pending.completes);
    this.dialogue = null;
    store.set({ objective: this.objectives.active()?.text ?? null });
  }

  step(dt: number) {
    this.t += dt;
    const inp = this.input.state();
    this.yaw -= inp.lookDX * 0.005;
    this.pitch = THREE.MathUtils.clamp(this.pitch + inp.lookDY * 0.003, -0.15, 0.7);
    this.input.consumeLook();
    if (inp.interact) this.interact();

    // movement is relative to the camera, and frozen while someone is talking
    const talking = !!this.dialogue;
    const fw = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)), rt = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const want = talking ? new THREE.Vector3() : fw.multiplyScalar(inp.move.y).add(rt.multiplyScalar(inp.move.x));
    if (want.lengthSq() > 1) want.normalize();
    this.vel.lerp(want.multiplyScalar(2.2 * (inp.run ? 2.1 : 1)), 1 - Math.exp(-dt * 10));
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
        if (d <= (it.radius ?? 2.2) && d < best) { best = d; this.pending = it; }
      }
      const prompt = this.pending?.label ?? null;
      if (prompt !== store.get().prompt) store.set({ prompt });
    }

    const { pos, look } = followCamera(p, this.yaw, this.pitch, this.dist);
    this.camera.position.lerp(pos, 1 - Math.exp(-dt * 8));
    this.camLook.lerp(look, 1 - Math.exp(-dt * 10));
    this.camera.lookAt(this.camLook);
    this.sky.followShadow(p);
  }
}
