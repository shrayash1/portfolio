import type * as THREE from "three";
import type { TimeName } from "../engine/sky";
import type { Interactable, Objective } from "../story/types";

export interface NpcSpec {
  url: string;
  position: [number, number, number];
  rotationY: number;
  motion: "idle" | "talk" | "walk";
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
}
