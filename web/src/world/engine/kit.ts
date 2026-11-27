import * as THREE from "three";
import { put, rbox } from "./build";

// Interior kit: rooms and furniture drawn into the shared put() buckets under "k-" keys, so a whole room merges into
// a handful of meshes. A chapter merges with { ...its own mats, ...kitMats() }.

export type Side = "n" | "s" | "e" | "w"; // n = -z, s = +z, e = +x, w = -x
export interface RoomSpec {
  x: number; z: number; // centre of the floor
  w: number; d: number; h: number; // inner width (x), depth (z), height
  t?: number; // wall thickness, default 0.3 (see BODY_R in camera.ts: thinner walls could let the camera out)
  door: { side: Side; width: number; height: number; at?: number }; // at = offset of the door centre along its wall
}

/** The room's wall boxes (door gap and lintel left open) plus its ceiling slab: camera and player colliders. Pure. */
export function roomBoxes(r: RoomSpec): THREE.Box3[] {
  const t = r.t ?? 0.3, x0 = r.x - r.w / 2, x1 = r.x + r.w / 2, z0 = r.z - r.d / 2, z1 = r.z + r.d / 2, top = r.h;
  const B = (ax: number, ay: number, az: number, bx: number, by: number, bz: number) =>
    new THREE.Box3(new THREE.Vector3(Math.min(ax, bx), ay, Math.min(az, bz)), new THREE.Vector3(Math.max(ax, bx), by, Math.max(az, bz)));
  // each wall as [from, to] along its run (z for e/w, x for n/s, corners included) and its fixed coordinate span
  const walls: Record<Side, { along: [number, number]; fixed: [number, number]; alongX: boolean }> = {
    n: { along: [x0 - t, x1 + t], fixed: [z0 - t, z0], alongX: true },
    s: { along: [x0 - t, x1 + t], fixed: [z1, z1 + t], alongX: true },
    w: { along: [z0, z1], fixed: [x0 - t, x0], alongX: false },
    e: { along: [z0, z1], fixed: [x1, x1 + t], alongX: false },
  };
  const out: THREE.Box3[] = [];
  const seg = (s: Side, a: number, b: number, y0: number, y1: number) => {
    if (b - a < 1e-6) return;
    const { fixed: [f0, f1], alongX } = walls[s];
    out.push(alongX ? B(a, y0, f0, b, y1, f1) : B(f0, y0, a, f1, y1, b));
  };
  for (const s of ["n", "s", "e", "w"] as Side[]) {
    const [a, b] = walls[s].along;
    if (s !== r.door.side) { seg(s, a, b, 0, top); continue; }
    const c = (walls[s].alongX ? r.x : r.z) + (r.door.at ?? 0), hw = r.door.width / 2;
    seg(s, a, c - hw, 0, top); seg(s, c + hw, b, 0, top); seg(s, c - hw, c + hw, r.door.height, top);
  }
  out.push(B(x0 - t, top, z0 - t, x1 + t, top + t, z1 + t)); // ceiling / roof slab
  return out;
}

const BOX = new THREE.BoxGeometry(1, 1, 1);

/** Draws the room (walls, floor, ceiling lamps) and returns its colliders. */
export function room(r: RoomSpec): THREE.Box3[] {
  const boxes = roomBoxes(r), s = new THREE.Vector3(), c = new THREE.Vector3();
  for (const b of boxes) { b.getSize(s); b.getCenter(c); put("k-wall", BOX, c.x, c.y, c.z, 0, 0, 0, s.x, s.y, s.z); }
  put("k-floor", new THREE.PlaneGeometry(r.w, r.d), r.x, 0.021, r.z, 0, -Math.PI / 2);
  put("k-wall", BOX, r.x, 0.06, r.z - r.d / 2 + 0.01, 0, 0, 0, r.w, 0.12, 0.03); // skirting
  // two rows of ceiling light panels
  for (let i = 0; i < Math.max(1, Math.round(r.w / 3)); i++) for (const dz of [-r.d / 4, r.d / 4]) {
    put("k-lamp", rbox(1.2, 0.04, 0.3, 0.015), r.x + (i - (Math.round(r.w / 3) - 1) / 2) * 3, r.h - 0.03, r.z + dz);
  }
  return boxes;
}

// a local frame: offsets (lx, lz) rotated by ry about y, then moved to (x, z); local -z is "front"
function frame(x: number, z: number, ry: number) {
  const cs = Math.cos(ry), sn = Math.sin(ry);
  return (key: string, geo: THREE.BufferGeometry, lx: number, y: number, lz: number, sx = 1, sy = 1, sz = 1, lry = 0, lrx = 0) =>
    put(key, geo, x + lx * cs + lz * sn, y, z - lx * sn + lz * cs, ry + lry, lrx, 0, sx, sy, sz);
}

/** A lab desk, its user sitting on the +z side facing -z (before ry). */
export function desk(x: number, z: number, ry = 0) {
  const p = frame(x, z, ry);
  p("k-wood", rbox(1.5, 0.05, 0.75, 0.02), 0, 0.735, 0);
  for (const [lx, lz] of [[-0.7, -0.32], [0.7, -0.32], [-0.7, 0.32], [0.7, 0.32]]) p("k-metal", BOX, lx, 0.36, lz, 0.04, 0.72, 0.04);
  p("k-metal", BOX, 0, 0.45, -0.34, 1.4, 0.35, 0.02); // modesty panel
  p("k-dark", rbox(0.2, 0.42, 0.45, 0.02), 0.5, 0.22, -0.05); // tower under the desk
}

/** A monitor + keyboard for a desk at (x, z, ry); the screen faces the user (+z). Skip `screen` for a hero screen drawn separately. */
export function monitor(x: number, z: number, ry = 0, screen = true) {
  const p = frame(x, z, ry);
  p("k-dark", rbox(0.62, 0.38, 0.035, 0.012), 0, 1.03, -0.2);
  p("k-dark", BOX, 0, 0.83, -0.22, 0.05, 0.16, 0.03);
  p("k-dark", rbox(0.22, 0.015, 0.16, 0.005), 0, 0.768, -0.22);
  if (screen) p("k-screen", new THREE.PlaneGeometry(0.57, 0.33), 0, 1.03, -0.181);
  p("k-dark", rbox(0.44, 0.02, 0.14, 0.008), 0, 0.77, 0.1); // keyboard
  p("k-dark", rbox(0.06, 0.02, 0.1, 0.01), 0.32, 0.77, 0.12); // mouse
}

/** An office chair at (x, z); its sitter faces -z (before ry). */
export function chair(x: number, z: number, ry = 0) {
  const p = frame(x, z, ry);
  p("k-fabric", rbox(0.46, 0.07, 0.46, 0.03), 0, 0.47, 0);
  p("k-fabric", rbox(0.44, 0.5, 0.06, 0.03), 0, 0.82, 0.23, 1, 1, 1, 0, -0.1);
  p("k-metal", new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), 0, 0.25, 0);
  for (let k = 0; k < 5; k++) p("k-metal", BOX, 0, 0.05, 0, 0.04, 0.03, 0.52, (k / 5) * Math.PI * 2); // star base
}

/** A potted plant. */
export function plant(x: number, z: number, s = 1) {
  put("k-pot", new THREE.CylinderGeometry(0.18 * s, 0.14 * s, 0.36 * s, 12), x, 0.18 * s, z);
  for (let k = 0; k < 4; k++) put("k-leaf", new THREE.IcosahedronGeometry(0.2 * s, 1), x + Math.sin(k * 2.4) * 0.1 * s, (0.5 + k * 0.1) * s, z + Math.cos(k * 2.4) * 0.1 * s);
}

/** A window in a wall of thickness t; (x, y, z) is the centre of its inner face and ry the way it faces into the room
 *  (+z when ry = 0): a daylight-bright pane inside, dark glass on the outer face. */
export function windowLight(x: number, y: number, z: number, ry: number, w: number, h: number, t = 0.3) {
  const p = frame(x, z, ry);
  p("k-window", new THREE.PlaneGeometry(w, h), 0, y, 0.012);
  p("k-glass", new THREE.PlaneGeometry(w, h), 0, y, -t - 0.012, 1, 1, 1, Math.PI);
  for (const ly of [-h / 2, h / 2]) p("k-metal", BOX, 0, y + ly, 0.02, w + 0.08, 0.06, 0.05);
  for (const lx of [-w / 2, 0, w / 2]) p("k-metal", BOX, lx, y, 0.02, 0.05, h, 0.05);
}

/** A canvas texture (signs, screens, posters). */
export function canvasTexture(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  draw(cv.getContext("2d")!);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

/** A flat poster or board facing ry (+z when ry = 0), added straight to the scene (one draw call). */
export function poster(scene: THREE.Scene, x: number, y: number, z: number, ry: number, w: number, h: number, tex: THREE.Texture, glow = 0) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: glow ? 0xffffff : 0, emissiveMap: glow ? tex : null, emissiveIntensity: glow }));
  mesh.position.set(x, y, z); mesh.rotation.y = ry; mesh.receiveShadow = true; scene.add(mesh);
  return mesh;
}

// an editor full of code, shared by every ordinary lab screen
function codeScreen(c: CanvasRenderingContext2D) {
  c.fillStyle = "#14171f"; c.fillRect(0, 0, 256, 148);
  c.fillStyle = "#1d2230"; c.fillRect(0, 0, 34, 148);
  const cols = ["#c792ea", "#82aaff", "#c3e88d", "#ffcb6b", "#89ddff", "#f07178"];
  let seed = 3;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let l = 0; l < 13; l++) {
    let x = 42 + (l % 4 === 0 ? 0 : 12 * (1 + Math.floor(rnd() * 2)));
    for (let k = 0; k < 1 + Math.floor(rnd() * 4); k++) {
      const w = 14 + rnd() * 46;
      c.fillStyle = cols[Math.floor(rnd() * cols.length)]; c.fillRect(x, 8 + l * 10.5, w, 5);
      x += w + 6;
    }
  }
}

export function kitMats(): Record<string, THREE.Material> {
  const M = (color: number, o: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o });
  const code = canvasTexture(256, 148, codeScreen);
  return {
    "k-wall": M(0xe8e1d2, { roughness: 0.92 }),
    "k-floor": M(0x7d858c, { roughness: 0.45 }), // vinyl, a little sheen from the windows and lamps
    "k-wood": M(0xc9a77c, { roughness: 0.55 }),
    "k-metal": M(0x9ea4ac, { roughness: 0.35, metalness: 0.8 }),
    "k-dark": M(0x1d2026, { roughness: 0.45 }),
    "k-screen": M(0x05070a, { roughness: 0.2, emissive: 0xffffff, emissiveMap: code, emissiveIntensity: 0.9 }),
    "k-fabric": M(0x2c4a72, { roughness: 0.95 }),
    "k-lamp": M(0xfff6e8, { emissive: 0xfff0d4, emissiveIntensity: 2.2 }),
    "k-window": M(0xdfeeff, { emissive: 0xd4e6ff, emissiveIntensity: 1.1 }),
    "k-glass": M(0x22303a, { roughness: 0.08, metalness: 0.6 }),
    "k-leaf": M(0x4f8a4a, { roughness: 0.8 }),
    "k-pot": M(0xb0583a),
  };
}
