import * as THREE from "three";

export const clampDt = (dt: number) => Math.min(dt, 0.05);

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
