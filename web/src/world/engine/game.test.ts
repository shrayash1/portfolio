import { describe, expect, it, vi, beforeEach } from "vitest";
import * as THREE from "three";

const inp = { move: { x: 0, y: 0 }, run: false, lookDX: 0, lookDY: 0, interact: false, pause: false };
vi.mock("./input", () => ({
  createInput: () => ({ state: () => ({ ...inp }), consumeLook() {}, dispose() {} }),
}));
vi.mock("./renderer", () => ({
  createRenderer: () => ({ ok: true, renderer: { dispose() {}, domElement: { addEventListener() {}, removeEventListener() {} } }, setQuality() {}, render() {}, resize() {} }),
}));
vi.mock("./sky", () => ({ createSky: () => ({ setTime: () => 0.5, followShadow() {}, sunDir: new THREE.Vector3() }) }));
const fake = () => ({ root: new THREE.Group(), setMotion() {}, play() {}, update() {} });
vi.mock("./characters", () => ({ loadPlayer: vi.fn(async () => fake()), loadNpc: vi.fn(async () => fake()) }));

vi.stubGlobal("innerWidth", 800);
vi.stubGlobal("innerHeight", 600);
vi.stubGlobal("addEventListener", () => {});
vi.stubGlobal("removeEventListener", () => {});
vi.stubGlobal("requestAnimationFrame", () => 1);
vi.stubGlobal("cancelAnimationFrame", () => {});
vi.stubGlobal("document", { hidden: false });

import { Game } from "./game";
import { loadNpc, loadPlayer } from "./characters";
import { store } from "../store";
import type { ChapterScene } from "../chapters/types";

const chapter: ChapterScene = {
  id: 1, time: "golden", build: async () => {}, spawn: new THREE.Vector3(0, 0, 0),
  bounds: { minX: -1, maxX: 1, minZ: -5, maxZ: 5 },
  interactables: [{ id: "a", label: "Talk", position: [0, 0, -1], dialogue: [{ who: "A", text: "hi" }], completes: "o1" }],
  objectives: [{ id: "o1", text: "Meet A" }, { id: "o2", text: "Then B" }],
  npcs: [],
};

describe("Game", () => {
  let g: Game;
  beforeEach(async () => {
    inp.interact = false; inp.move = { x: 0, y: 0 };
    g = new Game({ host: {} as HTMLElement });
    await g.start(chapter);
  });

  it("prompts near an interactable, talks, completes the objective", () => {
    expect(store.get().objective).toBe("Meet A");
    g.step(0.016);
    expect(store.get().prompt).toBe("Talk");
    inp.interact = true; g.step(0.016); inp.interact = false;
    expect(store.get().dialogue).toEqual({ who: "A", text: "hi" });
    inp.interact = true; g.step(0.016); inp.interact = false;
    expect(store.get().dialogue).toBeNull();
    expect(store.get().objective).toBe("Then B");
  });

  it("lifts the player onto the sidewalk using groundY", async () => {
    const g2 = new Game({ host: {} as HTMLElement });
    await g2.start({ ...chapter, bounds: { minX: -5, maxX: 5, minZ: -5, maxZ: 5 }, groundY: (x) => (Math.abs(x) > 3.2 ? 0.16 : 0.01) });
    g2.step(0.016);
    expect(g2.player.position.y).toBe(0.01);
    inp.move = { x: 1, y: 0 };
    for (let i = 0; i < 100; i++) g2.step(0.05);
    expect(g2.player.position.y).toBe(0.16);
  });

  it("does not start after dispose", async () => {
    const g3 = new Game({ host: {} as HTMLElement });
    const p = g3.start({ ...chapter, build: async () => { g3.dispose(); } });
    await p;
    expect((g3 as unknown as { pc?: unknown }).pc).toBeUndefined();
  });

  it("calls the optional setLamps and update hooks", async () => {
    const setLamps = vi.fn(), update = vi.fn();
    const g4 = new Game({ host: {} as HTMLElement });
    await g4.start({ ...chapter, setLamps, update });
    expect(setLamps).toHaveBeenCalledWith(0.5);
    g4.step(0.25);
    expect(update).toHaveBeenLastCalledWith(expect.any(Number), 0.25);
  });

  it("setTime re-lights the lamps and setQuality reaches the renderer", async () => {
    const setLamps = vi.fn();
    const g5 = new Game({ host: {} as HTMLElement });
    await g5.start({ ...chapter, setLamps });
    setLamps.mockClear();
    g5.setTime("dusk");
    expect(setLamps).toHaveBeenCalledWith(0.5);
    expect(() => g5.setQuality("lite")).not.toThrow();
  });

  it("calls setLamps only after build has run", async () => {
    const order: string[] = [];
    const g5 = new Game({ host: {} as HTMLElement });
    await g5.start({ ...chapter, build: async () => { order.push("build"); }, setLamps: () => { order.push("lamps"); } });
    expect(order).toEqual(["build", "lamps"]);
  });

  it("clamps the player to the chapter bounds", () => {
    inp.move = { x: 1, y: 0 };
    for (let i = 0; i < 100; i++) g.step(0.05);
    expect(g.player.position.x).toBeLessThanOrEqual(1);
  });

  it("starts without an NPC whose model fails to load", async () => {
    vi.mocked(loadNpc).mockRejectedValueOnce(new Error("404"));
    const g6 = new Game({ host: {} as HTMLElement });
    await g6.start({ ...chapter, npcs: [{ url: "x.glb", position: [0, 0, 0], rotationY: 0, motion: "idle" }] });
    expect(store.get().loading).toBe(false);
  });

  it("fires an auto thought once, not again on re-entry", async () => {
    const g7 = new Game({ host: {} as HTMLElement });
    store.set({ thought: null });
    await g7.start({ ...chapter, interactables: [{ id: "th", label: "", position: [0, 0, 0], auto: true, thought: "hm" }] });
    expect(store.get().thought).toBe("hm");
    store.set({ thought: null });
    g7.step(0.016);
    expect(store.get().thought).toBeNull();
    inp.move = { x: 1, y: 0 };
    for (let i = 0; i < 40; i++) g7.step(0.05);
    inp.move = { x: -1, y: 0 };
    for (let i = 0; i < 40; i++) g7.step(0.05);
    expect(store.get().thought).toBeNull();
  });

  it("marks the chapter complete once and stops re-prompting a finished spot", () => {
    const onComplete = vi.fn();
    store.set({ complete: false });
    const g8 = new Game({ host: {} as HTMLElement, onComplete });
    return g8.start({ ...chapter, objectives: [{ id: "o1", text: "Meet A" }] }).then(() => {
      g8.step(0.016);
      inp.interact = true; g8.step(0.016); inp.interact = false;
      inp.interact = true; g8.step(0.016); inp.interact = false;
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(store.get().complete).toBe(true);
      g8.step(0.016);
      expect(store.get().prompt).toBeNull();
    });
  });

  it("loads the avatar for the chapter's era", async () => {
    const g9 = new Game({ host: {} as HTMLElement });
    await g9.start({ ...chapter, id: 5 });
    expect(vi.mocked(loadPlayer)).toHaveBeenLastCalledWith("me", expect.any(Function));
    await new Game({ host: {} as HTMLElement }).start({ ...chapter, id: 2 });
    expect(vi.mocked(loadPlayer)).toHaveBeenLastCalledWith("college", expect.any(Function));
  });

  it("onInteract returning true suppresses the default dialogue", async () => {
    const onInteract = vi.fn(() => true);
    const g10 = new Game({ host: {} as HTMLElement });
    store.set({ dialogue: null });
    await g10.start({ ...chapter, onInteract });
    g10.step(0.016);
    inp.interact = true; g10.step(0.016); inp.interact = false;
    expect(onInteract).toHaveBeenCalledWith("a", expect.objectContaining({ complete: expect.any(Function), dialogue: expect.any(Function) }));
    expect(store.get().dialogue).toBeNull();
  });

  it("api.complete marks the objective and fires onComplete once", async () => {
    const onComplete = vi.fn();
    store.set({ complete: false });
    const g11 = new Game({ host: {} as HTMLElement, onComplete });
    await g11.start({ ...chapter, objectives: [{ id: "o1", text: "Meet A" }], onInteract: (_id, api) => { api.complete("o1"); api.complete("o1"); return true; } });
    g11.step(0.016);
    inp.interact = true; g11.step(0.016); inp.interact = false;
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(store.get().complete).toBe(true);
  });

  it("api.dialogue resolves after the last line is closed", async () => {
    let done = false;
    const g12 = new Game({ host: {} as HTMLElement });
    await g12.start({ ...chapter, onInteract: (_id, api) => { void api.dialogue([{ who: "A", text: "1" }, { who: "A", text: "2" }]).then(() => { done = true; }); return true; } });
    g12.step(0.016);
    inp.interact = true; g12.step(0.016); inp.interact = false;
    expect(store.get().dialogue).toEqual({ who: "A", text: "1" });
    inp.interact = true; g12.step(0.016); inp.interact = false;
    await Promise.resolve();
    expect(done).toBe(false);
    inp.interact = true; g12.step(0.016); inp.interact = false;
    await Promise.resolve();
    expect(done).toBe(true);
    expect(store.get().dialogue).toBeNull();
  });

  it("api.thought shows an inner thought and setTime reaches the sky", async () => {
    let api!: import("../chapters/types").ChapterApi;
    const g13 = new Game({ host: {} as HTMLElement });
    await g13.start({ ...chapter, onInteract: (_id, a) => { api = a; return true; } });
    g13.step(0.016);
    inp.interact = true; g13.step(0.016); inp.interact = false;
    api.thought("hm");
    expect(store.get().thought).toBe("hm");
    expect(() => api.setTime("dusk")).not.toThrow();
    await expect(api.moment({ title: "x" })).resolves.toBeUndefined();
    await expect(api.sequence({ points: [], look: [], duration: 1 })).resolves.toBeUndefined();
  });
});
