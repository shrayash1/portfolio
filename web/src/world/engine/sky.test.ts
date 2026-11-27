import { expect, it } from "vitest";
import { TIMES, preset } from "./sky";

it("only dusk turns the lamps on", () => {
  expect([TIMES.morning.lamps, TIMES.golden.lamps, TIMES.dusk.lamps]).toEqual([0, 0, 1]);
});

it("a chapter can override parts of a preset (fog, exposure...) without touching the shared table", () => {
  expect(preset("morning", { dens: 0.001, exp: 0.5 })).toEqual({ ...TIMES.morning, dens: 0.001, exp: 0.5 });
  expect(preset("golden")).toEqual(TIMES.golden);
  expect(TIMES.morning.dens).toBe(0.0019);
});
