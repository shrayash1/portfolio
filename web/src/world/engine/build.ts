import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

// geometry buckets: every static piece is merged into one mesh per material (few draw calls, fast on phones)
const buckets: Record<string, THREE.BufferGeometry[]> = {};
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();

export function put(key: string, geo: THREE.BufferGeometry, x: number, y: number, z: number, ry = 0, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone(); // merge needs every piece in the same (non-indexed) form
  _m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
  g.applyMatrix4(_m);
  (buckets[key] ||= []).push(g);
}

export const rbox = (w: number, h: number, d: number, r = 0.08) =>
  new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.1, h / 2.1, d / 2.1));

const NO_CAST = ["ground", "road", "mountain", "snow", "far1", "far2", "far3", "hill", "hill2"], NO_RECEIVE = ["mountain", "snow", "bulb"];

// one mesh per material, added to the scene; the buckets are emptied
export function mergeBuckets(scene: THREE.Scene, mats: Record<string, THREE.Material>) {
  for (const key of Object.keys(buckets)) {
    const mesh = new THREE.Mesh(mergeGeometries(buckets[key])!, mats[key]);
    mesh.castShadow = !NO_CAST.includes(key);
    mesh.receiveShadow = !NO_RECEIVE.includes(key);
    scene.add(mesh);
    delete buckets[key];
  }
}
