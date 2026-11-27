import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { roomBoxes, type RoomSpec } from "./kit";

const LAB: RoomSpec = { x: 0, z: 0, w: 10, d: 8, h: 3.4, t: 0.3, door: { side: "e", width: 1.8, height: 2.4 } };
const hit = (boxes: THREE.Box3[], from: THREE.Vector3, dir: THREE.Vector3) => {
  const ray = new THREE.Ray(from, dir.clone().normalize()), p = new THREE.Vector3();
  let best: number | null = null;
  for (const b of boxes) if (ray.intersectBox(b, p)) { const d = p.distanceTo(from); if (best === null || d < best) best = d; }
  return best;
};

describe("roomBoxes", () => {
  const boxes = roomBoxes(LAB), head = new THREE.Vector3(0, 1.6, 0);

  it("walls the room in: rays from inside hit the walls at the inner faces", () => {
    expect(hit(boxes, head, new THREE.Vector3(-1, 0, 0))).toBeCloseTo(5);
    expect(hit(boxes, head, new THREE.Vector3(0, 0, 1))).toBeCloseTo(4);
    expect(hit(boxes, head, new THREE.Vector3(0, 0, -1))).toBeCloseTo(4);
    expect(hit(boxes, head, new THREE.Vector3(0, 1, 0))).toBeCloseTo(1.8); // the ceiling
  });

  it("leaves the doorway open, with a lintel above it", () => {
    expect(hit(boxes, head, new THREE.Vector3(1, 0, 0))).toBeNull();
    expect(hit(boxes, new THREE.Vector3(0, 2.8, 0), new THREE.Vector3(1, 0, 0))).toBeCloseTo(5);
    expect(hit(boxes, head, new THREE.Vector3(1, 0, 0.3))).not.toBeNull(); // beside the door is wall
  });

  it("no horizontal ray from the middle escapes except through the door", () => {
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2, dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      const throughDoor = Math.abs(Math.tan(a) * 5) < 0.9 && dir.x > 0;
      if (!throughDoor) expect(hit(boxes, head, dir)).not.toBeNull();
    }
  });

  it("puts the door on any side, offset along that wall", () => {
    const n = roomBoxes({ ...LAB, door: { side: "n", width: 1.8, height: 2.4, at: 2 } });
    expect(hit(n, new THREE.Vector3(2, 1.6, 0), new THREE.Vector3(0, 0, -1))).toBeNull();
    expect(hit(n, new THREE.Vector3(0, 1.6, 0), new THREE.Vector3(0, 0, -1))).toBeCloseTo(4);
    expect(hit(n, head, new THREE.Vector3(1, 0, 0))).toBeCloseTo(5);
  });
});
