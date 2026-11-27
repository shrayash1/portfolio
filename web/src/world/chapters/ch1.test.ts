import { describe, expect, it } from "vitest";
import { chapter1 } from "./ch1";

describe("chapter 1", () => {
  it("is golden hour with the two objectives", () => {
    expect(chapter1.time).toBe("golden");
    expect(chapter1.objectives).toEqual([
      { id: "walk-to-school", text: "Walk to school" },
      { id: "cyber-cafe", text: "Optional: the cyber café is open early today", optional: true },
    ]);
  });

  it("has the three talk spots and the auto thoughts", () => {
    expect(chapter1.interactables.filter((i) => !i.auto).map((i) => i.id)).toEqual(["tea-shop", "cyber-cafe", "school-gate"]);
    expect(chapter1.interactables.filter((i) => i.auto).every((i) => i.thought)).toBe(true);
    expect(chapter1.interactables.find((i) => i.id === "t-spawn")?.thought).toContain("Golden light");
    const gate = chapter1.interactables.find((i) => i.id === "school-gate")!;
    expect(gate.position).toEqual([0, 0.01, -62]);
    expect(gate.dialogue).toHaveLength(4);
    expect(chapter1.interactables.find((i) => i.id === "cyber-cafe")?.radius).toBeGreaterThanOrEqual(4.5);
    const tea = chapter1.interactables[0];
    expect(tea.dialogue?.[0].who).toBe("Tea-shop owner");
    expect(tea.dialogue?.[0].text).toContain("Running late again?");
  });

  it("the school gate completes walk-to-school", () => {
    expect(chapter1.interactables.find((i) => i.id === "school-gate")?.completes).toBe("walk-to-school");
  });

  it("places six different CC0 Mesh2Motion people", () => {
    expect(chapter1.npcs).toHaveLength(6);
    expect(chapter1.npcs.filter((n) => n.motion === "walk")).toHaveLength(2);
    expect(chapter1.npcs.map((n) => n.motion).sort()).toEqual(["idle", "idle", "idle", "talk", "walk", "walk"]);
    expect(new Set(chapter1.npcs.map((n) => n.url))).toEqual(new Set(["male-32", "male-15", "female-08", "male-10", "male-05", "female-31"].map((n) => `journey/npcs/${n}.glb`)));
  });

  it("walks on the sidewalks and the road", () => {
    expect(chapter1.groundY?.(4, 0)).toBe(0.16);
    expect(chapter1.groundY?.(0.8, 0)).toBe(0.01);
    const b = chapter1.bounds;
    expect([b.minX, b.maxX, b.minZ, b.maxZ].map((v) => Math.round(v * 100) / 100)).toEqual([-4.2, 4.2, -62, 14]);
    expect(chapter1.spawn.toArray()).toEqual([0.8, 0.16, 8]);
  });
});
