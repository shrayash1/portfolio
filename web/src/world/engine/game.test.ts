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
vi.mock("./characters", () => ({ loadPlayer: async () => fake(), loadNpc: async () => fake() }));

vi.stubGlobal("innerWidth", 800);
vi.stubGlobal("innerHeight", 600);
vi.stubGlobal("addEventListener", () => {});
vi.stubGlobal("removeEventListener", () => {});
vi.stubGlobal("requestAnimationFrame", () => 1);
vi.stubGlobal("cancelAnimationFrame", () => {});
vi.stubGlobal("document", { hidden: false });

import { Game } from "./game";
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
    g = new Game({ host: {} as HTMLElement, era: "school" });
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
    const g2 = new Game({ host: {} as HTMLElement, era: "school" });
    await g2.start({ ...chapter, bounds: { minX: -5, maxX: 5, minZ: -5, maxZ: 5 }, groundY: (x) => (Math.abs(x) > 3.2 ? 0.16 : 0.01) });
    g2.step(0.016);
    expect(g2.player.position.y).toBe(0.01);
    inp.move = { x: 1, y: 0 };
    for (let i = 0; i < 100; i++) g2.step(0.05);
    expect(g2.player.position.y).toBe(0.16);
  });

  it("does not start after dispose", async () => {
    const g3 = new Game({ host: {} as HTMLElement, era: "school" });
    const p = g3.start({ ...chapter, build: async () => { g3.dispose(); } });
    await p;
    expect((g3 as unknown as { pc?: unknown }).pc).toBeUndefined();
  });

  it("calls the optional setLamps and update hooks", async () => {
    const setLamps = vi.fn(), update = vi.fn();
    const g4 = new Game({ host: {} as HTMLElement, era: "school" });
    await g4.start({ ...chapter, setLamps, update });
    expect(setLamps).toHaveBeenCalledWith(0.5);
    g4.step(0.25);
    expect(update).toHaveBeenLastCalledWith(expect.any(Number), 0.25);
  });

  it("clamps the player to the chapter bounds", () => {
    inp.move = { x: 1, y: 0 };
    for (let i = 0; i < 100; i++) g.step(0.05);
    expect(g.player.position.x).toBeLessThanOrEqual(1);
  });
});
