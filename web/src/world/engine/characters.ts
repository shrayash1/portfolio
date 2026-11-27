import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { Era } from "../story/types";
import { retarget } from "./retarget";

export type Motion = "idle" | "walk" | "jog" | "talk";
export interface Character {
  root: THREE.Group;
  setMotion(speed: number): void;
  play(name: Motion): void;
  update(dt: number): void;
}

const NAMES: Motion[] = ["idle", "walk", "jog", "talk"];
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder); // all models and clips are meshopt-compressed

// the four Mesh2Motion clips, loaded once
let clipsP: Promise<{ scene: THREE.Object3D; clips: THREE.AnimationClip[] }> | null = null;
const loadClips = () =>
  (clipsP ??= Promise.all(NAMES.map((n) => loader.loadAsync(`journey/${n}.glb`)))
    .then((g) => ({ scene: g[0].scene, clips: g.map((x) => x.animations[0]) }))
    .catch((e) => { clipsP = null; throw e; }));

// a model plus its four clips (indexed like NAMES), cached by URL
interface Prepared { model: THREE.Object3D; clips: THREE.AnimationClip[]; shared: boolean }
const cache = new Map<string, Promise<Prepared>>();

function prepare(url: string): Promise<Prepared> {
  let p = cache.get(url);
  if (!p) {
    p = (async () => {
      const [{ scene, clips }, gltf] = await Promise.all([loadClips(), loader.loadAsync(url)]);
      const model = gltf.scene;
      model.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
      // Mesh2Motion models share the clips' rig, so they play them as they are
      const shared = !!model.getObjectByName("pelvis");
      return { model, clips: shared ? clips : retarget(model, scene, clips), shared };
    })();
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return p;
}

// extra looping clips (sitting, driving, cheering...), loaded once per URL
const loops = new Map<string, Promise<THREE.AnimationClip>>();
function loadLoop(url: string): Promise<THREE.AnimationClip> {
  let p = loops.get(url);
  if (!p) {
    p = loader.loadAsync(url).then((g) => g.animations[0]);
    p.catch(() => loops.delete(url));
    loops.set(url, p);
  }
  return p;
}

function build(model: THREE.Object3D, clips: THREE.AnimationClip[], loop?: THREE.AnimationClip): Character {
  model.rotation.y = Math.PI; // the rig faces +z; the player group faces -z
  const root = new THREE.Group(); root.add(model);
  const mixer = new THREE.AnimationMixer(model);
  const actions = Object.fromEntries(NAMES.map((n, i) => [n, mixer.clipAction(clips[i])])) as Record<Motion, THREE.AnimationAction>;
  let current = loop ? mixer.clipAction(loop) : actions.idle; current.play();
  const play = (name: Motion) => {
    const next = actions[name];
    if (next === current) return;
    next.reset().play(); current.crossFadeTo(next, 0.25, false); current = next;
  };
  return {
    root, play,
    setMotion(speed) {
      play(speed < 0.25 ? "idle" : speed < 3 ? "walk" : "jog");
      if (current === actions.walk) current.timeScale = speed / 1.8;
      if (current === actions.jog) current.timeScale = Math.max(1, speed / 4.5);
    },
    update: (dt) => mixer.update(dt),
  };
}

export async function loadPlayer(era: Era, onNote: (text: string) => void): Promise<Character> {
  try {
    const { model, clips } = await prepare(`journey/${era}.glb`);
    return build(model, clips); // ponytail: one live player per era (retargeted tracks are tied to this model's bones)
  } catch (e) {
    onNote(`Couldn't load your avatar (${(e as Error)?.message ?? e}). Showing the stand-in figure.`);
    return standIn();
  }
}

/** An NPC; with `clip` (a URL in journey/clips/) it loops that clip from the start instead of idle. */
export async function loadNpc(url: string, tint?: Record<string, number>, clip?: string): Promise<Character> {
  const [{ model, clips, shared }, loop] = await Promise.all([prepare(url), clip ? loadLoop(clip) : undefined]);
  // each NPC gets its own skeleton; the clips address bones by name, so they carry over
  const copy = cloneSkinned(model);
  if (tint) {
    // clone the materials first: the cached model's are shared with every other NPC
    copy.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.material = (Array.isArray(m.material) ? m.material : [m.material]).map((mat) => {
        const c = (mat as THREE.MeshStandardMaterial).clone();
        if (c.name in tint) { c.color.setHex(tint[c.name]); c.map = null; }
        return c;
      }) as THREE.Material[];
      if (m.material.length === 1) m.material = m.material[0];
    });
  }
  return build(copy, clips, shared ? loop : undefined); // ponytail: loops are Mesh2Motion-rig only; retarget them if a non-M2M NPC ever needs one
}

// an animal (or any model) looping one clip made for its own rig, e.g. the Mesh2Motion dog asleep
export async function loadCreature(url: string, clipUrl: string, scale = 1): Promise<{ root: THREE.Object3D; update(dt: number): void }> {
  const [gltf, anim] = await Promise.all([loader.loadAsync(url), loader.loadAsync(clipUrl)]);
  const root = gltf.scene;
  root.scale.setScalar(scale);
  root.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.frustumCulled = false; } });
  const mixer = new THREE.AnimationMixer(root);
  mixer.clipAction(anim.animations[0]).play();
  return { root, update: (dt) => mixer.update(dt) };
}

// ---------- the simple figure shown while (or instead of) the avatar ----------
export function standIn(): Character {
  const M = (color: number, roughness = 0.85) => new THREE.MeshStandardMaterial({ color, roughness });
  const skin = M(0xc98d68, 0.6), shirt = M(0xa9c7e4), pants = M(0x1f2a44), hair = M(0x17110e, 0.55), shoe = M(0x1b1b1f, 0.5);
  const rbox = (w: number, h: number, d: number, r: number) => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.1, h / 2.1, d / 2.1));
  const root = new THREE.Group();
  const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; parent.add(m); return m;
  };
  const legs: THREE.Group[] = [], arms: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * 0.1, 0.94, 0); root.add(hip); legs.push(hip);
    add(hip, new THREE.CapsuleGeometry(0.075, 0.74, 4, 10), pants, 0, -0.44, 0);
    add(hip, rbox(0.12, 0.09, 0.27, 0.04), shoe, 0, -0.88, -0.04);
    const sh = new THREE.Group(); sh.position.set(s * 0.215, 1.44, 0); root.add(sh); arms.push(sh);
    add(sh, new THREE.CapsuleGeometry(0.062, 0.2, 4, 10), shirt, 0, -0.12, 0);
    add(sh, new THREE.CapsuleGeometry(0.048, 0.32, 4, 10), skin, 0, -0.4, 0);
    add(sh, new THREE.SphereGeometry(0.05, 10, 8), skin, 0, -0.62, 0);
  }
  add(root, new THREE.CapsuleGeometry(0.16, 0.36, 6, 14), shirt, 0, 1.26, 0, 1.05, 1, 0.64);
  add(root, new THREE.CylinderGeometry(0.05, 0.055, 0.12, 10), skin, 0, 1.55, 0);
  add(root, new THREE.SphereGeometry(0.112, 20, 16), skin, 0, 1.68, 0, 0.9, 1.08, 0.98);
  add(root, new THREE.SphereGeometry(0.12, 20, 12, 0, Math.PI * 2, 0, 1.75), hair, 0, 1.7, 0.012, 0.94, 0.95, 1.02);
  add(root, rbox(0.3, 0.38, 0.14, 0.05), M(0x2b3a55), 0, 1.27, 0.16);

  let speed = 0, phase = 0;
  return {
    root,
    setMotion: (s) => { speed = s; },
    play: () => {}, // the stand-in only walks or stands
    update(dt) {
      phase += dt * (3 + speed * 1.6);
      const a = Math.min(1, speed / 2.2) * 0.6;
      legs[0].rotation.x = Math.sin(phase) * a; legs[1].rotation.x = -Math.sin(phase) * a;
      arms[0].rotation.x = -Math.sin(phase) * a * 0.8; arms[1].rotation.x = Math.sin(phase) * a * 0.8;
    },
  };
}
