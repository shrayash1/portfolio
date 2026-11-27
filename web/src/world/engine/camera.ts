import * as THREE from "three";

export const clampDt = (dt: number) => Math.min(dt, 0.05);

/** How far from the head the camera may sit: unchanged when nothing is in the way, else just in front of the wall (never closer than 0.8 m). */
export function pullInDistance(hit: number | null, desired: number): number {
  return hit === null || hit >= desired ? desired : Math.min(desired, Math.max(0.8, hit - 0.3));
}

// third-person camera behind the player's shoulder, looking a little ahead of them
export function followCamera(player: THREE.Vector3, yaw: number, pitch: number, dist: number) {
  const pos = new THREE.Vector3(
    player.x + Math.sin(yaw) * dist * Math.cos(pitch) + Math.cos(yaw) * 0.45,
    player.y + 1.7 + Math.sin(pitch) * dist,
    player.z + Math.cos(yaw) * dist * Math.cos(pitch) - Math.sin(yaw) * 0.45,
  );
  const look = new THREE.Vector3(player.x - Math.sin(yaw) * 2, player.y + 1.6, player.z - Math.cos(yaw) * 2);
  return { pos, look };
}

// how wide the player's body is against walls; the pulled-in camera sits at most 0.8 - BODY_R (0.25 m) past a wall's
// inner face, so walls 0.3 m thick (the kit's rooms) always keep it inside the room
export const BODY_R = 0.55;

/** Moves a body standing at p (radius r, feet at p.y) out of every wall box it overlaps at body height. Mutates p. */
export function pushOut(p: THREE.Vector3, boxes: THREE.Box3[], r: number): void {
  for (const b of boxes) {
    if (b.min.y > p.y + 1.7 || b.max.y < p.y + 0.3) continue; // lintels and ceilings are overhead
    const cx = THREE.MathUtils.clamp(p.x, b.min.x, b.max.x), cz = THREE.MathUtils.clamp(p.z, b.min.z, b.max.z);
    const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
    if (d >= r) continue;
    if (d > 1e-6) { p.x = cx + (dx / d) * r; p.z = cz + (dz / d) * r; continue; }
    // the centre is inside the box: leave by the nearest side
    const out = [[b.min.x - r - p.x, 0], [b.max.x + r - p.x, 0], [0, b.min.z - r - p.z], [0, b.max.z + r - p.z]];
    const [mx, mz] = out.reduce((a, o) => (Math.abs(o[0] + o[1]) < Math.abs(a[0] + a[1]) ? o : a));
    p.x += mx; p.z += mz;
  }
}
