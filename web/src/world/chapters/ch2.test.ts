import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import * as THREE from "three";

// the scenery needs a browser (canvas signs); the chapter logic does not
vi.mock("./ch2-scene", async (orig) => ({ ...(await orig<typeof import("./ch2-scene")>()), buildCampus: () => ({ update() {} }) }));
vi.mock("../engine/characters", () => ({ loadNpc: vi.fn(() => Promise.reject(new Error("404"))) }));

import { chapter2, RIDE } from "./ch2";
import { LAB } from "./ch2-scene";
import { followCamera, pullInDistance, BODY_R } from "../engine/camera";
import type { ChapterApi } from "./types";

const it_ = (id: string) => chapter2.interactables.find((i) => i.id === id)!;
const fakeApi = () => {
  const log: string[] = [];
  const api = {
    complete: vi.fn((id: string) => { log.push(`complete:${id}`); }),
    moment: vi.fn(async (m: { title: string }) => { log.push(`moment:${m.title}`); }),
    sequence: vi.fn(async () => { log.push("sequence"); }),
    thought: vi.fn((t: string) => { log.push(`thought:${t}`); }),
    dialogue: vi.fn(async (lines: { text: string }[]) => { log.push(`dialogue:${lines[0].text}`); }),
    setTime: vi.fn(),
  };
  return { api: api as unknown as ChapterApi & typeof api, log };
};
const flush = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };

describe("chapter 2", () => {
  beforeEach(async () => { vi.spyOn(console, "warn").mockImplementation(() => {}); vi.useFakeTimers(); await chapter2.build(new THREE.Scene()); }); // build resets the chapter's state (the riders 404 here)
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it("is NCIT in the morning light with the three objectives", () => {
    expect(chapter2.id).toBe(2);
    expect(chapter2.time).toBe("morning");
    expect(chapter2.objectives).toEqual([
      { id: "lab", text: "Build your first game in the lab" },
      { id: "ride", text: "Meet your friends at the gate" },
      { id: "classmate", text: "Say hi to a classmate", optional: true },
    ]);
  });

  it("has the lab computer, the classmate and the gate, plus the two thoughts", () => {
    expect(chapter2.interactables.filter((i) => !i.auto).map((i) => i.id)).toEqual(["lab-pc", "classmate", "gate-friend"]);
    expect(it_("t-spawn").thought).toBe("NCIT. Four years of code, deadlines and too much chiya start here.");
    expect(it_("t-lab").thought).toBe("The lab smells like warm computers.");
    expect(it_("lab-pc").completes).toBe("lab");
    expect(it_("lab-pc").dialogue).toEqual([
      { who: "You", text: "Okay… a square that jumps. That counts as a game, right?" },
      { who: "You", text: "It works. It actually works!" },
    ]);
    expect(it_("classmate").completes).toBe("classmate");
    expect(it_("classmate").dialogue).toEqual([
      { who: "Classmate", text: "Did you sleep at all? Your eyes are the same colour as the error messages." },
      { who: "You", text: "Sleep is a feature for version two." },
    ]);
    expect(it_("gate-friend").completes).toBe("ride");
  });

  it("the lab computer and the thought at the door are inside / at the lab", () => {
    const [x, , z] = it_("lab-pc").position;
    expect(Math.abs(x - LAB.x)).toBeLessThan(LAB.w / 2);
    expect(Math.abs(z - LAB.z)).toBeLessThan(LAB.d / 2);
    expect(it_("t-lab").position[0]).toBeGreaterThan(LAB.x + LAB.w / 2); // just outside the east doorway
  });

  it("the gate friend waits until the lab game is done", async () => {
    const { api, log } = fakeApi();
    expect(chapter2.onInteract?.("gate-friend", api)).toBe(true);
    await flush();
    expect(log).toEqual(["dialogue:Finish your game first, then we ride!"]);
    expect(api.sequence).not.toHaveBeenCalled();
  });

  it("lab → gate: dialogue, the ride, graduation, the thought, then the chapter completes", async () => {
    const { api, log } = fakeApi();
    expect(chapter2.onInteract?.("lab-pc", api)).toBe(true);
    await flush();
    expect(log).toEqual(["dialogue:Okay… a square that jumps. That counts as a game, right?", "complete:lab"]);
    log.length = 0;
    expect(chapter2.onInteract?.("gate-friend", api)).toBe(true);
    await flush();
    expect(api.dialogue).toHaveBeenLastCalledWith([
      { who: "Friend", text: "Lockdown's finally over! Six of us, Simba Falls, today." },
      { who: "Friend", text: "You're bringing the camera for the vlog, right?" },
      { who: "You", text: "Already charged. Let's go." },
    ]);
    expect(api.sequence).toHaveBeenCalledWith(RIDE);
    expect(api.moment).toHaveBeenCalledWith({ title: "Graduation day", sub: "B.E. Software Engineering · First Class Honors · NCIT", kind: "graduation" });
    expect(api.complete).not.toHaveBeenCalledWith("ride"); // the thought gets a moment on screen first
    chapter2.onInteract?.("gate-friend", api); // pressing E again mid-way does not restart the ride
    await vi.advanceTimersByTimeAsync(5000);
    expect(log).toEqual([
      "dialogue:Lockdown's finally over! Six of us, Simba Falls, today.",
      "sequence",
      "moment:Graduation day",
      "thought:Five years ago it was a square that jumped. Now it's a degree.",
      "complete:ride",
    ]);
  });

  it("a new play-through starts with the gate locked again", async () => {
    const { api } = fakeApi();
    chapter2.onInteract?.("lab-pc", api); await flush();
    await chapter2.build(new THREE.Scene());
    chapter2.onInteract?.("gate-friend", api); await flush();
    expect(api.sequence).not.toHaveBeenCalled();
  });

  it("leaves the classmate to the default dialogue", () => {
    const { api } = fakeApi();
    expect(chapter2.onInteract?.("classmate", api)).toBeFalsy();
  });

  it("the ride is a ≥12 s vlog with the three lines, ending at Simba Falls", () => {
    expect(RIDE.rec).toBe(true);
    expect(RIDE.title).toBe("Shrayash's Vlogs · Way to Simba Falls");
    expect(RIDE.duration).toBeGreaterThanOrEqual(12);
    expect(RIDE.lines).toEqual([
      { at: 1, who: "You", text: "Hey everyone, welcome back to the channel!" },
      { at: 5, who: "Friend", text: "Wave for the camera!" },
      { at: 10, who: "You", text: "Worth every bump on that road." },
    ]);
    expect(RIDE.points.every((p) => p[0] > 300)).toBe(true); // off-map, out by the falls
    expect(() => { RIDE.onFrame?.(0); RIDE.onFrame?.(0.5); RIDE.onFrame?.(1); }).not.toThrow(); // riders failed to load: still fine
  });

  it("casts young students and friends: male-10 and male-06 at the gate, female-09 at a lab desk", () => {
    const url = (n: string) => `journey/npcs/${n}.glb`;
    const urls = chapter2.npcs.map((n) => n.url);
    expect(urls).toEqual(expect.arrayContaining(["male-10", "male-06", "female-09", "male-05", "male-15", "female-08"].map(url)));
    expect(urls).not.toContain(url("male-32"));
    expect(urls).not.toContain(url("female-31"));
    expect(chapter2.npcs.every((n) => !n.tint)).toBe(true);
    const cm = chapter2.npcs.find((n) => n.url === url("female-09"))!;
    expect(cm.clip).toBe("journey/clips/sitting-writing.glb");
    const [x, , z] = it_("classmate").position;
    expect(Math.hypot(cm.position[0] - x, cm.position[2] - z)).toBeLessThan(2.5);
  });

  it("inside the lab the follow camera never ends up outside the walls (Review Focus 5)", () => {
    const cols = chapter2.colliders!, ray = new THREE.Ray(), hp = new THREE.Vector3();
    const minX = LAB.x - LAB.w / 2 - LAB.t!, maxX = LAB.x + LAB.w / 2 + LAB.t!, minZ = LAB.z - LAB.d / 2 - LAB.t!, maxZ = LAB.z + LAB.d / 2 + LAB.t!;
    const spots = [[LAB.x, LAB.z], [LAB.x - LAB.w / 2 + BODY_R, LAB.z], [LAB.x - LAB.w / 2 + BODY_R, LAB.z - LAB.d / 2 + BODY_R], [LAB.x + 1, LAB.z + LAB.d / 2 - BODY_R]];
    for (const [px, pz] of spots) for (let k = 0; k < 16; k++) for (const pitch of [0.16, 0.7]) {
      const p = new THREE.Vector3(px, 0.02, pz), yaw = (k / 16) * Math.PI * 2;
      const { pos } = followCamera(p, yaw, pitch, 4.4);
      const head = new THREE.Vector3(p.x, p.y + 1.6, p.z), dir = pos.clone().sub(head), len = dir.length();
      ray.set(head, dir.divideScalar(len));
      let best: number | null = null;
      for (const b of cols) if (ray.intersectBox(b, hp)) { const d = hp.distanceTo(head); if (best === null || d < best) best = d; }
      const cam = head.clone().addScaledVector(dir, pullInDistance(best, len));
      const inside = cam.x > minX && cam.x < maxX && cam.z > minZ && cam.z < maxZ && cam.y < LAB.h + LAB.t!;
      const outDoor = cam.x > LAB.x + LAB.w / 2 && Math.abs(cam.z - LAB.z) < 3; // looking in through the open doorway is fine
      expect(inside || outDoor, `spot ${px},${pz} yaw ${k}/16 pitch ${pitch}`).toBe(true);
    }
  });

  it("keeps the player in the campus and the lab", () => {
    const b = chapter2.bounds;
    expect(b.minX).toBeLessThan(LAB.x - LAB.w / 2 + 1);
    expect(chapter2.spawn.z).toBeLessThan(b.maxZ);
    expect(it_("t-spawn").position[2]).toBeCloseTo(chapter2.spawn.z);
  });
});
