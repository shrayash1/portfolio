import * as THREE from "three";
import { put, tint } from "./build";

// Outdoor scenery made of vertex-coloured geometry (one draw call per bucket): heightfield terrain, a mountain range,
// broad-leaf trees. Everything is deterministic (seeded), so a chapter looks the same every visit.

const smooth = (a: number, b: number, x: number) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
/** Smooth value in 0..1 from a few crossed sine waves: cheap, seeded, no lattice artefacts at this scale. */
export const wave = (x: number, z: number, seed: number) =>
  0.5 + 0.22 * Math.sin(x * 0.071 + seed) * Math.cos(z * 0.053 - seed * 1.3) + 0.18 * Math.sin((x + z) * 0.031 + seed * 2.1) + 0.1 * Math.sin(x * 0.19 - z * 0.17 + seed * 0.7);

/** Height at (x, z) of hills that leave a flat cut `flat` m either side of the road and reach full height `rise` m out. */
export function roadCut(road: THREE.Curve<THREE.Vector3>, o: { flat: number; rise: number; height: number; seed: number }) {
  const pts = road.getSpacedPoints(240);
  return (x: number, z: number) => {
    let d2 = Infinity;
    for (const p of pts) { const dx = p.x - x, dz = p.z - z, q = dx * dx + dz * dz; if (q < d2) d2 = q; }
    const d = Math.sqrt(d2);
    return smooth(o.flat, o.rise, d) * o.height * (0.75 + 0.5 * wave(x, z, o.seed)) + smooth(o.rise, o.rise * 3, d) * 10 * wave(z, x, o.seed + 3) - 0.08;
  };
}

/** A w × d heightfield centred on (cx, cz), coloured per vertex by height and slope (steep = rock). */
export function heightfield(cx: number, cz: number, w: number, d: number, sx: number, sz: number, h: (x: number, z: number) => number, color: (y: number, steep: number, x: number, z: number) => number) {
  const g = new THREE.PlaneGeometry(w, d, sx, sz); g.rotateX(-Math.PI / 2);
  const p = g.getAttribute("position");
  for (let i = 0; i < p.count; i++) p.setY(i, h(p.getX(i) + cx, p.getZ(i) + cz));
  g.computeVertexNormals();
  const n = g.getAttribute("normal"), col = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { c.setHex(color(p.getY(i), 1 - n.getY(i), p.getX(i) + cx, p.getZ(i) + cz)); col.set([c.r, c.g, c.b], i * 3); }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.translate(cx, 0, cz);
  return g;
}

const lerpHex = (a: number, b: number, t: number) => new THREE.Color(a).lerp(new THREE.Color(b), THREE.MathUtils.clamp(t, 0, 1)).getHex();
/** Grass that turns to rock on steep cuts, with some patchiness. */
export const grassRock = (seed: number) => (y: number, steep: number, x: number, z: number) =>
  lerpHex(lerpHex(0x4d7a3a, 0x7a9a4a, wave(x * 2, z * 2, seed)), lerpHex(0x6e665c, 0x8a8174, wave(z, x, seed)), smooth(0.28, 0.5, steep) + (y > 22 ? 0.2 : 0));

/** A snowy range: ridged peaks along x, falling away toward its front edge; rock below, snow on the tops. */
export function mountainRange(cx: number, cz: number, w: number, d: number, peak: number, seed: number) {
  const ridge = (x: number) => {
    let v = 0;
    for (const [f, a] of [[0.004, 1], [0.011, 0.5], [0.027, 0.22]]) v += a * (1 - Math.abs(Math.sin(x * f + seed * a * 7)));
    return v / 1.72;
  };
  return heightfield(cx, cz, w, d, Math.round(w / 12), 24, (x, z) => {
    const across = 1 - Math.abs((z - cz) / (d / 2)); // 0 at the front and back edges, 1 on the crest line
    return peak * ridge(x) ** 1.6 * smooth(0, 0.75, across) * (0.85 + 0.3 * wave(x, z, seed)) - 6;
  }, (y, steep, x, z) => (y > peak * (0.42 + 0.12 * wave(x, z, seed + 5)) - steep * peak * 0.25 ? 0xeef1f8 : lerpHex(0x6d6a86, 0x8d86ad, wave(x, z, seed))));
}

// one canopy blob: an icosahedron with sphere normals (soft shading) and its surface pushed in and out a little
let blobGeo: THREE.BufferGeometry | null = null;
function blob() {
  if (blobGeo) return blobGeo;
  const g = new THREE.IcosahedronGeometry(1, 1), p = g.getAttribute("position"), n = g.getAttribute("normal"), v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize(); n.setXYZ(i, v.x, v.y, v.z);
    v.multiplyScalar(1 + 0.14 * Math.sin(3.1 * v.x + 1.7 * v.y) * Math.cos(2.3 * v.z + 0.5));
    p.setXYZ(i, v.x, v.y, v.z);
  }
  return (blobGeo = g);
}
const TRUNK = new THREE.CylinderGeometry(0.55, 1, 1, 8, 1); // tapered: the radii are scaled per tree

/** A broad-leaf tree (trunk, two limbs, a cluster of squashed leafy blobs in varied greens) into the vertex-coloured bucket `key`. */
export function broadleaf(key: string, x: number, y: number, z: number, s: number, rnd: () => number) {
  const h = (2.6 + rnd() * 1.2) * s, r = 0.2 * s;
  put(key, tint(TRUNK, 0x4a3426), x, y + h / 2, z, 0, 0, 0, r, h, r);
  for (const a of [rnd() * 6, rnd() * 6]) // limbs lean out toward (-cos a, sin a): tilted about z, then turned by a
    put(key, tint(TRUNK, 0x4a3426), x - Math.cos(a) * 0.3 * s, y + h * 0.8, z + Math.sin(a) * 0.3 * s, a, 0, 0.75, r * 0.5, h * 0.45, r * 0.5);
  const n = 5 + Math.floor(rnd() * 3), greens = [0x3f6b34, 0x4d7d3b, 0x5b8a40, 0x6a9446, 0x47733a];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + rnd(), out = k === 0 ? 0 : (0.7 + rnd() * 0.6) * s, br = (1.0 + rnd() * 0.6) * s * (k === 0 ? 1.25 : 1);
    put(key, tint(blob(), greens[Math.floor(rnd() * greens.length)]), x + Math.sin(a) * out, y + h + (k === 0 ? 0.9 : 0.3 + rnd() * 0.9) * s, z + Math.cos(a) * out, rnd() * 6, 0, 0, br, br * 0.78, br);
  }
}
