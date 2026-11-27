import { expect, it } from "vitest";
import * as THREE from "three";
import { followCamera, clampDt, pullInDistance } from "./camera";

it("sits behind a player facing -z, with the shoulder offset", () => {
  const { pos } = followCamera(new THREE.Vector3(), 0, 0, 4.4);
  expect(pos.z).toBeCloseTo(4.4);
  expect(pos.x).toBeCloseTo(0.45);
});
it("clamps dt to 0.05", () => {
  expect(clampDt(300)).toBe(0.05);
  expect(clampDt(0.01)).toBe(0.01);
});
it("pulls the camera in front of a wall, never closer than 0.8 m", () => {
  expect(pullInDistance(null, 4.4)).toBe(4.4);
  expect(pullInDistance(6, 4.4)).toBe(4.4);
  expect(pullInDistance(3, 4.4)).toBeCloseTo(2.7);
  expect(pullInDistance(0.5, 4.4)).toBe(0.8);
});
