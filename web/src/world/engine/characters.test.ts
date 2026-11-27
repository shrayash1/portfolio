import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";

// fake GLB files: a url maps to a scene + clips; anything else is a 404
const h = vi.hoisted(() => ({ files: {} as Record<string, () => unknown>, loads: [] as string[] }));
vi.mock("three/examples/jsm/libs/meshopt_decoder.module.js", () => ({ MeshoptDecoder: {} }));
vi.mock("three/examples/jsm/loaders/GLTFLoader.js", () => ({
  GLTFLoader: class {
    setMeshoptDecoder() { return this; }
    loadAsync(url: string) { h.loads.push(url); const f = h.files[url]; return f ? Promise.resolve(f()) : Promise.reject(new Error("404")); }
  },
}));

import { loadNpc, loadPlayer } from "./characters";

describe("loadPlayer", () => {
  it("falls back to the stand-in and says so when loading fails", async () => {
    const notes: string[] = [];
    const c = await loadPlayer("me", (t) => notes.push(t));
    expect(notes).toHaveLength(1);
    expect(notes[0].startsWith("Couldn't load your avatar")).toBe(true);
    expect(c.root.children.length).toBeGreaterThan(0);
    c.setMotion(1); c.update(0.1); c.play("talk"); // must not throw
  });
});

describe("loadNpc with its own looping clip", () => {
  // a Mesh2Motion-style rig: one "pelvis" bone; each clip parks the pelvis at its own x
  const rig = () => { const s = new THREE.Group(); const b = new THREE.Bone(); b.name = "pelvis"; s.add(b); return s; };
  const clip = (x: number) => new THREE.AnimationClip("c", 1, [new THREE.VectorKeyframeTrack("pelvis.position", [0, 1], [x, 0, 0, x, 0, 0])]);
  for (const [i, n] of ["idle", "walk", "jog", "talk"].entries()) h.files[`journey/${n}.glb`] = () => ({ scene: rig(), animations: [clip(i + 1)] });
  h.files["npc.glb"] = () => ({ scene: rig(), animations: [] });
  h.files["journey/clips/sit.glb"] = () => ({ scene: rig(), animations: [clip(7)] });
  const pelvisX = (c: { root: THREE.Object3D }) => c.root.getObjectByName("pelvis")!.position.x;

  it("loops the given clip instead of idle", async () => {
    const a = await loadNpc("npc.glb", undefined, "journey/clips/sit.glb");
    a.update(0.1);
    expect(pelvisX(a)).toBeCloseTo(7);
    const b = await loadNpc("npc.glb");
    b.update(0.1);
    expect(pelvisX(b)).toBeCloseTo(1); // no clip: the idle clip
  });

  it("loads each clip once, however many people use it", async () => {
    await loadNpc("npc.glb", undefined, "journey/clips/sit.glb");
    await loadNpc("npc.glb", undefined, "journey/clips/sit.glb");
    expect(h.loads.filter((u) => u === "journey/clips/sit.glb")).toHaveLength(1);
  });

  it("rejects when the clip is missing, so the caller can leave that person out", async () => {
    await expect(loadNpc("npc.glb", undefined, "journey/clips/none.glb")).rejects.toThrow("404");
  });
});
