import type * as THREE from "three";
import type { Preset, TimeName } from "../engine/sky";
import type { DialogueLine, Interactable, Objective } from "../story/types";

export interface NpcSpec {
  url: string;
  position: [number, number, number];
  rotationY: number;
  motion: "idle" | "talk" | "walk";
  tint?: Record<string, number>; // material name -> flat colour, so shared models look like different people
  patrol?: { axis: "z"; range: number };
  clip?: string; // a looping clip from journey/clips/ (e.g. sitting-writing) played instead of `motion`
}

export type Moment = { title: string; sub?: string; image?: string; kind?: "graduation" | "launch" | "billboard" | "wall" };

// placeholder shape: Task 2 adds the player and the behaviour
export type SequenceSpec = { points: [number, number, number][]; look: [number, number, number][]; duration: number; rec?: boolean; title?: string; lines?: { at: number; who: string; text: string }[]; onFrame?(t01: number): void };

export interface ChapterApi {
  complete(objectiveId: string): void;
  moment(m: Moment): Promise<void>;
  sequence(s: SequenceSpec): Promise<void>;
  thought(text: string): void;
  dialogue(lines: DialogueLine[]): Promise<void>;
  setTime(name: TimeName): void;
  miniGame(): Promise<boolean>; // the lab PC's "square that jumps": true on a win, false on Quit / Esc
}

export interface ChapterScene {
  id: number;
  time: TimeName;
  sky?: Partial<Record<TimeName, Partial<Preset>>>; // this chapter's own fog / exposure / light per time of day
  build(scene: THREE.Scene): Promise<void>;
  spawn: THREE.Vector3;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  interactables: Interactable[];
  objectives: Objective[];
  npcs: NpcSpec[];
  colliders?: THREE.Box3[]; // static wall boxes the camera must not pass through
  setLamps?(level: number): void; // 0 = lamps off (day), 1 = fully lit (dusk)
  update?(t: number, dt: number): void; // per-frame scenery, e.g. fluttering flags
  onInteract?(id: string, api: ChapterApi): boolean | void; // return true = handled: skips the default dialogue/complete
  groundY?(x: number, z: number): number; // feet height at a spot; defaults to spawn.y
}
