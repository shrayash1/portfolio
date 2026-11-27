import { expect, it } from "vitest";
import * as THREE from "three";
import { roadCut } from "./nature";

it("terrain is cut flat along a road and rises into hills away from it", () => {
  const road = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 50), new THREE.Vector3(0, 0, -50)]);
  const h = roadCut(road, { flat: 4.5, rise: 16, height: 20, seed: 1 });
  expect(h(0, 0)).toBeLessThanOrEqual(0);
  expect(h(4, 10)).toBeLessThanOrEqual(0);
  expect(h(30, 0)).toBeGreaterThan(8);
  expect(h(-30, 0)).toBeGreaterThan(8);
  expect(h(30, 0)).toBe(h(30, 0)); // deterministic
});
