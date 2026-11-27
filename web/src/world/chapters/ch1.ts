import * as THREE from "three";
import type { ChapterScene } from "./types";
import { buildStreet, ROAD, WALK, SZ, CAFE_Z, TEA_Z, GATE_Z } from "./ch1-street";

const BASE = "journey/npcs/base.glb", FEMALE = "journey/npcs/mannequin-female.glb";
let street: ReturnType<typeof buildStreet> | null = null;

export const chapter1: ChapterScene = {
  id: 1,
  time: "golden",
  async build(scene) { street = buildStreet(scene); },
  setLamps(level) {
    if (!street) return;
    street.glass.emissiveIntensity = level * 1.4;
    street.bulb.emissiveIntensity = level * 4;
  },
  update(t) { street?.updateFlags(t); },
  spawn: new THREE.Vector3(0.8, 0.16, 8),
  bounds: { minX: -(WALK - 0.4), maxX: WALK - 0.4, minZ: SZ + 15, maxZ: 14 },
  groundY: (x) => (Math.abs(x) > ROAD ? 0.16 : 0.01),
  objectives: [
    { id: "walk-to-school", text: "Walk to school" },
    { id: "cyber-cafe", text: "Optional: the cyber café is open early today", optional: true },
  ],
  interactables: [
    {
      id: "tea-shop", label: "Talk to the tea-shop owner", position: [-3.6, 0.16, TEA_Z], radius: 2.5,
      dialogue: [
        { who: "Tea-shop owner", text: "Running late again? Go on, but they say the cyber café got a new game this week…" },
      ],
    },
    {
      id: "cyber-cafe", label: "Peek into the cyber café", position: [4, 0.16, CAFE_Z], radius: 2.5, completes: "cyber-cafe",
      dialogue: [
        { who: "Shrayash", text: "Rows of glowing screens, and somebody is already winning. Five more minutes… no. School first." },
      ],
    },
    {
      id: "school-gate", label: "Go through the school gate", position: [0, 0.01, GATE_Z + 1], radius: 3.2, completes: "walk-to-school",
      dialogue: [
        { who: "Shrayash", text: "The gate, the stupa behind it, and the bell about to ring. Made it." },
      ],
    },
  ],
  npcs: [
    { url: BASE, position: [-3.6, 0.16, TEA_Z], rotationY: Math.PI / 2, motion: "talk", tint: { Main: 0x8a3b2a } },
    { url: BASE, position: [-3.9, 0.16, -51], rotationY: Math.PI / 2, motion: "walk", tint: { Main: 0x5d7f86 }, patrol: { axis: "z", range: 8 } },
    { url: FEMALE, position: [3.8, 0.16, -63], rotationY: -Math.PI / 2, motion: "walk", tint: { "M_Main.001": 0xa64a42, "M_Joints.001": 0x8a5a3c }, patrol: { axis: "z", range: 8 } },
    { url: BASE, position: [3.7, 0.16, -8.7], rotationY: -Math.PI / 2, motion: "idle", tint: { Main: 0x6f7a55 } },
  ],
};
