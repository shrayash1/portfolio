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

  it("has the three interactables", () => {
    expect(chapter1.interactables.map((i) => i.id)).toEqual(["tea-shop", "cyber-cafe", "school-gate"]);
    const tea = chapter1.interactables[0];
    expect(tea.dialogue?.[0].who).toBe("Tea-shop owner");
    expect(tea.dialogue?.[0].text).toContain("Running late again?");
  });

  it("the school gate completes walk-to-school", () => {
    expect(chapter1.interactables.find((i) => i.id === "school-gate")?.completes).toBe("walk-to-school");
  });

  it("places four NPCs from the two CC0 models", () => {
    expect(chapter1.npcs).toHaveLength(4);
    expect(chapter1.npcs.filter((n) => n.motion === "walk")).toHaveLength(2);
    expect(chapter1.npcs.map((n) => n.motion).sort()).toEqual(["idle", "talk", "walk", "walk"]);
    expect(new Set(chapter1.npcs.map((n) => n.url))).toEqual(new Set(["journey/npcs/base.glb", "journey/npcs/mannequin-female.glb"]));
  });

  it("walks on the sidewalks and the road", () => {
    expect(chapter1.groundY?.(4, 0)).toBe(0.16);
    expect(chapter1.groundY?.(0.8, 0)).toBe(0.01);
    const b = chapter1.bounds;
    expect([b.minX, b.maxX, b.minZ, b.maxZ].map((v) => Math.round(v * 100) / 100)).toEqual([-4.2, 4.2, -143, 14]);
    expect(chapter1.spawn.toArray()).toEqual([0.8, 0.16, 8]);
  });
});
