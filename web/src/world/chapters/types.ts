import type * as THREE from "three";
import type { TimeName } from "../engine/sky";
import type { Interactable, Objective } from "../story/types";

export interface NpcSpec {
  url: string;
  position: [number, number, number];
  rotationY: number;
  motion: "idle" | "talk" | "walk";
  tint?: Record<string, number>; // material name -> flat colour, so shared models look like different people
  patrol?: { axis: "z"; range: number };
}

export interface ChapterScene {
  id: number;
  time: TimeName;
  build(scene: THREE.Scene): Promise<void>;
  spawn: THREE.Vector3;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  interactables: Interactable[];
  objectives: Objective[];
  npcs: NpcSpec[];
  setLamps?(level: number): void; // 0 = lamps off (day), 1 = fully lit (dusk)
  update?(t: number, dt: number): void; // per-frame scenery, e.g. fluttering flags
  groundY?(x: number, z: number): number; // feet height at a spot; defaults to spawn.y
}
