import { expect, it } from "vitest";
import { Dialogue } from "./dialogue";

it("steps through lines then finishes", () => {
  const a = { who: "A", text: "1" }, b = { who: "B", text: "2" };
  const d = new Dialogue([a, b]);
  expect(d.current()).toBe(a);
  expect(d.next()).toBe(b);
  expect(d.done).toBe(false);
  expect(d.next()).toBeNull();
  expect(d.done).toBe(true);
});
