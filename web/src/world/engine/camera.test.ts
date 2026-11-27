import { expect, it } from "vitest";
import * as THREE from "three";
import { followCamera, clampDt } from "./camera";

it("sits behind a player facing -z, with the shoulder offset", () => {
  const { pos } = followCamera(new THREE.Vector3(), 0, 0, 4.4);
  expect(pos.z).toBeCloseTo(4.4);
  expect(pos.x).toBeCloseTo(0.45);
});
it("clamps dt to 0.05", () => {
  expect(clampDt(300)).toBe(0.05);
  expect(clampDt(0.01)).toBe(0.01);
});
