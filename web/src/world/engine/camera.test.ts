import { expect, it } from "vitest";
import * as THREE from "three";
import { followCamera, clampDt, pullInDistance, pushOut, BODY_R } from "./camera";

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
it("pushes the body out of a wall box at body height", () => {
  const wall = new THREE.Box3(new THREE.Vector3(-5, 0, -1.2), new THREE.Vector3(5, 3, -1));
  const p = new THREE.Vector3(0.2, 0, -0.8);
  pushOut(p, [wall], BODY_R);
  expect(p.z).toBeCloseTo(-1 + BODY_R);
  expect(p.x).toBeCloseTo(0.2);
  const clear = new THREE.Vector3(0, 0, 0);
  pushOut(clear, [wall], BODY_R);
  expect(clear.toArray()).toEqual([0, 0, 0]);
});
it("ignores boxes above the head (a lintel, a ceiling) and pushes a centre inside a box out the nearest side", () => {
  const lintel = new THREE.Box3(new THREE.Vector3(-1, 2.4, -1), new THREE.Vector3(1, 3.4, 1));
  const p = new THREE.Vector3(0, 0, 0);
  pushOut(p, [lintel], BODY_R);
  expect(p.toArray()).toEqual([0, 0, 0]);
  const block = new THREE.Box3(new THREE.Vector3(-1, 0, -1), new THREE.Vector3(1, 2, 1));
  const q = new THREE.Vector3(0.9, 0, 0.1);
  pushOut(q, [block], BODY_R);
  expect(q.x).toBeCloseTo(1 + BODY_R);
  expect(q.z).toBeCloseTo(0.1);
});
it("the body is wide enough that a pulled-in camera never leaves a 0.3 m wall", () => {
  expect(0.8 - BODY_R).toBeLessThan(0.3);
});
