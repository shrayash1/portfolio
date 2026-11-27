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

/** A non-indexed copy of geo with one vertex colour, for the vertex-coloured buckets (many colours, one draw call). */
export function tint(geo: THREE.BufferGeometry, color: number): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo.clone(), c = new THREE.Color(color), n = g.getAttribute("position").count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3);
  g.setAttribute("color", new THREE.BufferAttribute(a, 3));
  return g;
}

// flat or far things that never need to cast a shadow (each caster is drawn again in the shadow pass)
const NO_CAST = ["ground", "road", "mountain", "snow", "far1", "far2", "far3", "hill", "hill2", "flat", "far", "glow", "pool", "foam", "k-floor", "k-screen", "k-glow", "k-glass"];
const NO_RECEIVE = ["mountain", "snow", "bulb", "far", "glow", "k-glow", "k-screen"];

// one mesh per material, added to the scene; the buckets are emptied. "key@area" merges apart from "key" (so a far-off
// area is frustum-culled on its own) but uses mats[key] and key's shadow rules
export function mergeBuckets(scene: THREE.Scene, mats: Record<string, THREE.Material>) {
  for (const key of Object.keys(buckets)) {
    const base = key.split("@")[0];
    const mesh = new THREE.Mesh(mergeGeometries(buckets[key])!, mats[key] ?? mats[base]);
    mesh.castShadow = !NO_CAST.includes(base);
    mesh.receiveShadow = !NO_RECEIVE.includes(base);
    scene.add(mesh);
    delete buckets[key];
  }
}
