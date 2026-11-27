import * as THREE from "three";
import type { ChapterScene } from "./types";
import { buildStreet, ROAD, WALK, CAFE_Z, TEA_Z, GATE_Z } from "./ch1-street";
import { loadCreature } from "../engine/characters";

const NPC = (name: string) => `journey/npcs/${name}.glb`;
const DOG: [number, number, number] = [2.1, 0.01, -18]; // asleep at the edge of the road
let street: ReturnType<typeof buildStreet> | null = null;
let dog: { update(dt: number): void } | null = null;

export const chapter1: ChapterScene = {
  id: 1,
  time: "golden",
  colliders: [],
  async build(scene) {
    street = buildStreet(scene);
    chapter1.colliders!.length = 0;
    chapter1.colliders!.push(...street.colliders);
    dog = null;
    // the dog is scenery: if it fails to load, the street still plays
    await loadCreature("journey/animals/dog.glb", "journey/animals/dog-sleep.glb", 0.55)
      .then((d) => { d.root.position.set(...DOG); d.root.rotation.y = 2.2; scene.add(d.root); dog = d; })
      .catch((e) => console.warn("street dog failed to load", e));
  },
  setLamps(level) {
    if (!street) return;
    street.glass.emissiveIntensity = level * 2.2;
    street.bulb.emissiveIntensity = level * 4;
  },
  update(t, dt) { street?.updateFlags(t); dog?.update(dt); },
  spawn: new THREE.Vector3(0.8, 0.16, 8),
  bounds: { minX: -(WALK - 0.4), maxX: WALK - 0.4, minZ: GATE_Z + 1.5, maxZ: 14 },
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
        { who: "You", text: "Just a quick look, dai. I promise." },
        { who: "Tea-shop owner", text: "Ha! That's what you said yesterday." },
      ],
    },
    {
      id: "cyber-cafe", label: "Peek into the cyber café", position: [4, 0.16, CAFE_Z], radius: 4.6, completes: "cyber-cafe",
      dialogue: [
        { who: "Café owner", text: "Ten rupees for fifteen minutes. The new one's on machine three." },
        { who: "You", text: "A whole world inside a screen… how do people even make these?" },
        { who: "You", text: "Someday I'm going to make one." },
      ],
    },
    {
      id: "school-gate", label: "Go through the Galaxy Public School gate", position: [0, 0.01, GATE_Z + 1.5], radius: 3.2, completes: "walk-to-school",
      dialogue: [
        { who: "Friend", text: "There you are! Did you go to the café again?" },
        { who: "You", text: "Maybe. You have to see it. I'm going to make games one day." },
        { who: "Friend", text: "Sure. After you finish your homework." },
        { who: "You", text: "That was the day it started. I just didn't know it yet." },
      ],
    },
    { id: "t-spawn", label: "", position: [0.8, 0.16, 8], radius: 3, auto: true, thought: "Golden light on the bricks again. Another school day in Kathmandu." },
    { id: "t-flags", label: "", position: [0, 0.01, -2], radius: 3, auto: true, thought: "The flags are snapping in the wind today. They say every flutter carries a prayer up the valley." },
    { id: "t-bikes", label: "", position: [2.7, 0.16, -8.5], radius: 3, auto: true, thought: "One day I'll ride one of these all the way to the hills." },
    { id: "t-dog", label: "", position: [DOG[0], DOG[1], DOG[2]], radius: 3, auto: true, thought: "Even the street dog is in less of a hurry than me." },
    { id: "t-stupa", label: "", position: [-2, 0.01, -30], radius: 5, auto: true, thought: "The stupa's eyes watch over the whole street. Feels like they're watching me too." },
  ],
  npcs: [
    { url: NPC("male-32"), position: [-3.6, 0.16, TEA_Z], rotationY: Math.PI / 2, motion: "talk" }, // the tea-shop dai
    { url: NPC("male-05"), position: [-3.9, 0.16, -42], rotationY: Math.PI / 2, motion: "walk", patrol: { axis: "z", range: 8 } },
    { url: NPC("female-08"), position: [3.8, 0.16, -26], rotationY: -Math.PI / 2, motion: "walk", patrol: { axis: "z", range: 6 } },
    { url: NPC("male-10"), position: [3.7, 0.16, -8.7], rotationY: -Math.PI / 2, motion: "idle" },
    { url: NPC("female-31"), position: [2.3, 0.16, GATE_Z - 1.2], rotationY: Math.PI, motion: "idle" }, // the school friend
  ],
};
