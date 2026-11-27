import * as THREE from "three";
import type { ChapterScene, SequenceSpec, Moment } from "./types";
import type { DialogueLine } from "../story/types";
import { buildCampus, LAB, COLLEGE, DESK_X, ROW_A, ROW_B, HERO_X, GATE_Z, ROAD, FALLS, Y } from "./ch2-scene";
import { motorbikeGeometry, bikeMaterial } from "./ch1-street";
import { roomBoxes } from "../engine/kit";
import { loadNpc, type Character } from "../engine/characters";

const NPC = (name: string) => `journey/npcs/${name}.glb`;
const CLIP = (name: string) => `journey/clips/${name}.glb`;
const RIDER_Y = 0.4; // lifts a "driving" rider (pelvis 0.54 m up in the clip) onto the bike seat (0.87 m)

const LAB_LINES: DialogueLine[] = [
  { who: "You", text: "Okay… a square that jumps. That counts as a game, right?" },
  { who: "You", text: "It works. It actually works!" },
];
const GATE_LINES: DialogueLine[] = [
  { who: "Friend", text: "Lockdown's finally over! Six of us, Simba Falls, today." },
  { who: "Friend", text: "You're bringing the camera for the vlog, right?" },
  { who: "You", text: "Already charged. Let's go." },
];
const NOT_YET: DialogueLine[] = [{ who: "Friend", text: "Finish your game first, then we ride!" }];
const GRADUATION: Moment = { title: "Graduation day", sub: "B.E. Software Engineering · First Class Honors · NCIT", kind: "graduation" };
const AFTER = "Five years ago it was a square that jumped. Now it's a degree.";

// the ride: the camera is you, filming as you ride; the two friends ride ahead along the same road
const CAM_END = 0.86; // how far along the road the camera gets (the falls clearing is at 1)
const AHEAD = [{ lead: 0.05, side: 0.9 }, { lead: 0.08, side: -0.9 }]; // each friend: road share ahead of the camera, metres off centre
const smooth = (a: number, b: number, x: number) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const N = 28;
const rail = Array.from({ length: N + 1 }, (_, i) => i / N);
let riders: THREE.Group[] = [];

export const RIDE: SequenceSpec = {
  rec: true,
  title: "Shrayash's Vlogs · Way to Simba Falls",
  duration: 14,
  // eye height on the bike, with a little handheld bob
  points: rail.map((t, i) => { const p = ROAD.getPointAt(t * CAM_END); return [p.x, 1.45 + Math.sin(i * 2.3) * 0.035, p.z]; }),
  // look down the road, then up at the falls as the clearing opens
  look: rail.map((t) => {
    const a = ROAD.getPointAt(Math.min(1, t * CAM_END + 0.06)), w = smooth(0.7, 1, t);
    return [a.x + (FALLS[0] - a.x) * w, 1.2 + (FALLS[1] - 1.2) * w, a.z + (FALLS[2] - a.z) * w];
  }),
  lines: [
    { at: 1, who: "You", text: "Hey everyone, welcome back to the channel!" },
    { at: 5, who: "Friend", text: "Wave for the camera!" },
    { at: 10, who: "You", text: "Worth every bump on that road." },
  ],
  onFrame(t01) { riders.forEach((g, k) => placeRider(g, t01, k)); },
};

function placeRider(g: THREE.Group, t01: number, k: number) {
  const { lead, side } = AHEAD[k], u = Math.min(1, t01 * CAM_END + lead), p = ROAD.getPointAt(u), t = ROAD.getTangentAt(u);
  g.position.set(p.x + t.z * side, p.y, p.z - t.x * side);
  g.rotation.y = Math.atan2(-t.x, -t.z);
}

let campus: ReturnType<typeof buildCampus> | null = null;
let chars: Character[] = [];
let labDone = false, riding = false;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const chapter2: ChapterScene = {
  id: 2,
  time: "morning",
  colliders: [...roomBoxes(LAB), COLLEGE],
  async build(scene) {
    labDone = false; riding = false; riders = []; chars = [];
    campus = buildCampus(scene);
    // the two friends on their bikes, waiting off-map at the start of the falls road; a rider that fails to load is left out
    const mat = bikeMaterial();
    await Promise.all(["male-10", "male-06"].map((name, k) =>
      loadNpc(NPC(name), undefined, CLIP("driving"))
        .then((c) => {
          const g = new THREE.Group(), bike = new THREE.Mesh(motorbikeGeometry(k ? 0x2f5f9a : 0xa83a2e), mat);
          bike.castShadow = true; c.root.position.y = RIDER_Y; g.add(bike, c.root);
          placeRider(g, 0, k); scene.add(g); riders[k] = g; chars.push(c); // sparse if one fails: forEach skips the hole, k stays right
        })
        .catch((e) => console.warn("rider failed to load", e))));
  },
  update(t, dt) { campus?.update(t); for (const c of chars) c.update(dt); },
  spawn: new THREE.Vector3(0, Y, 12),
  bounds: { minX: LAB.x - LAB.w / 2 + 0.4, maxX: 13.6, minZ: -15.2, maxZ: 16 },
  objectives: [
    { id: "lab", text: "Build your first game in the lab" },
    { id: "ride", text: "Meet your friends at the gate" },
    { id: "classmate", text: "Say hi to a classmate", optional: true },
  ],
  interactables: [
    { id: "lab-pc", label: "Sit at the glowing computer", position: [HERO_X, Y, ROW_A + 1.1], radius: 1.4, completes: "lab", dialogue: LAB_LINES },
    {
      id: "classmate", label: "Say hi to your classmate", position: [DESK_X[1], Y, ROW_B - 1.1], radius: 1.6, completes: "classmate",
      dialogue: [
        { who: "Classmate", text: "Did you sleep at all? Your eyes are the same colour as the error messages." },
        { who: "You", text: "Sleep is a feature for version two." },
      ],
    },
    { id: "gate-friend", label: "Talk to your friends at the gate", position: [11.4, Y, GATE_Z + 0.8], radius: 2.4, completes: "ride", dialogue: GATE_LINES },
    { id: "t-spawn", label: "", position: [0, Y, 12], radius: 3, auto: true, thought: "NCIT. Four years of code, deadlines and too much chiya start here." },
    { id: "t-lab", label: "", position: [LAB.x + LAB.w / 2 + 1, Y, LAB.z], radius: 1.6, auto: true, thought: "The lab smells like warm computers." },
  ],
  onInteract(id, api) {
    if (id === "lab-pc") {
      void api.dialogue(LAB_LINES).then(() => { labDone = true; api.complete("lab"); });
      return true;
    }
    if (id !== "gate-friend") return;
    if (riding) return true; // already on the way
    if (!labDone) { void api.dialogue(NOT_YET); return true; }
    riding = true;
    void (async () => {
      await api.dialogue(GATE_LINES);
      await api.sequence(RIDE);
      await api.moment(GRADUATION);
      api.thought(AFTER);
      await wait(3500); // let the thought be read before the chapter-complete card
      api.complete("ride");
    })();
    return true;
  },
  npcs: [
    { url: NPC("male-10"), position: [11.0, Y, 6.9], rotationY: Math.PI / 2 + 0.6, motion: "talk" }, // the friends at the gate
    { url: NPC("male-06"), position: [12.1, Y, 7.3], rotationY: Math.PI / 2 - 0.2, motion: "idle" },
    { url: NPC("female-09"), position: [DESK_X[1], Y, ROW_B + 0.75], rotationY: 0, motion: "idle", clip: CLIP("sitting-writing") }, // the classmate
    { url: NPC("male-15"), position: [DESK_X[0], Y, ROW_A + 0.75], rotationY: 0, motion: "idle", clip: CLIP("sitting-writing") },
    { url: NPC("male-05"), position: [0.9, Y, 2], rotationY: 0, motion: "walk", patrol: { axis: "z", range: 5 } },
    { url: NPC("female-08"), position: [4.5, Y, 10], rotationY: 2.4, motion: "idle", clip: CLIP("idle-talkingphone") },
  ],
};
