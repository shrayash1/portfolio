import { describe, expect, it, vi } from "vitest";

vi.mock("three/examples/jsm/libs/meshopt_decoder.module.js", () => ({ MeshoptDecoder: {} }));
vi.mock("three/examples/jsm/loaders/GLTFLoader.js", () => ({
  GLTFLoader: class {
    setMeshoptDecoder() { return this; }
    loadAsync() { return Promise.reject(new Error("404")); }
  },
}));

import { loadPlayer } from "./characters";

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
