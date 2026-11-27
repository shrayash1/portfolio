import { expect, it } from "vitest";
import { TIMES } from "./sky";

it("only dusk turns the lamps on", () => {
  expect([TIMES.morning.lamps, TIMES.golden.lamps, TIMES.dusk.lamps]).toEqual([0, 0, 1]);
});
