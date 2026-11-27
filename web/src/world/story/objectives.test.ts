import { expect, it } from "vitest";
import { Objectives } from "./objectives";

it("tracks required and optional objectives", () => {
  const o = new Objectives([
    { id: "walk-to-school", text: "Walk to school" },
    { id: "cyber-cafe", text: "Visit the cyber cafe", optional: true },
  ]);
  expect(o.active()?.id).toBe("walk-to-school");
  expect(o.allRequiredDone()).toBe(false);
  o.complete("nope");
  expect(o.isDone("nope")).toBe(false);
  o.complete("walk-to-school");
  expect(o.isDone("walk-to-school")).toBe(true);
  expect(o.allRequiredDone()).toBe(true);
});
