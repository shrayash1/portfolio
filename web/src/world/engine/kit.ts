import * as THREE from "three";
import { put, rbox, tint } from "./build";

// Interior kit: rooms and furniture drawn into the shared put() buckets, vertex-coloured, so a furnished room merges
// into about six meshes. Inside: "k-in" (matte), "k-in-metal", "k-floor", "k-screen", "k-glow" (lamps and window
// panes, unlit). Outside (shell): "vc", "vc-metal", "k-glass", which chapters share for their own scenery.
// A chapter merges with { ...kitMats(), ...its own mats }.

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

const BOX = new THREE.BoxGeometry(1, 1, 1), DARK = 0x1d2026, FABRIC = 0x2c4566, METAL = 0x8e949c;

/** Draws the room (walls in the inside colour, floor, skirting, ceiling lamps) and returns its colliders. shell() dresses the outside. */
export function room(r: RoomSpec, o: { wall?: number; floor?: number } = {}): THREE.Box3[] {
  const boxes = roomBoxes(r), s = new THREE.Vector3(), c = new THREE.Vector3(), wall = o.wall ?? 0xd6cab4;
  for (const b of boxes) { b.getSize(s); b.getCenter(c); put("k-in", tint(BOX, wall), c.x, c.y, c.z, 0, 0, 0, s.x, s.y, s.z); }
  put("k-floor", tint(new THREE.PlaneGeometry(r.w, r.d), o.floor ?? 0x5c6066), r.x, 0.021, r.z, 0, -Math.PI / 2);
  for (const dz of [-r.d / 2 + 0.015, r.d / 2 - 0.015]) put("k-in", tint(BOX, 0x6b5a48), r.x, 0.06, r.z + dz, 0, 0, 0, r.w, 0.12, 0.03); // skirting
  // two rows of ceiling light panels, each in a metal trim
  const n = Math.max(1, Math.round(r.w / 3));
  for (let i = 0; i < n; i++) for (const dz of [-r.d / 4, r.d / 4]) {
    const x = r.x + (i - (n - 1) / 2) * 3;
    put("k-in-metal", tint(BOX, METAL), x, r.h - 0.012, r.z + dz, 0, 0, 0, 1.3, 0.02, 0.4);
    put("k-glow", tint(BOX, 0xfff1dc), x, r.h - 0.03, r.z + dz, 0, 0, 0, 1.2, 0.02, 0.3);
  }
  return boxes;
}

/** The room's outside, in the language of a modern college block: cladding, a plinth, framed glass window bands
 *  (not on the door side), a trim band over the door and a parapet. `accent` colours the trim and parapet. */
export function shell(r: RoomSpec, o: { wall?: number; accent?: number } = {}) {
  const t = r.t ?? 0.3, x0 = r.x - r.w / 2 - t, x1 = r.x + r.w / 2 + t, z0 = r.z - r.d / 2 - t, z1 = r.z + r.d / 2 + t, top = r.h + t;
  const wall = o.wall ?? 0xd8d2c6, accent = o.accent ?? 0x1f4e8c, frameC = 0x2b2f35;
  const door = r.door, dc = (door.side === "n" || door.side === "s" ? r.x : r.z) + (door.at ?? 0), hw = door.width / 2;
  // a strip on a side's outer face: along a0..a1, height y0..y1, from off0 to off1 metres out from the face
  const strip = (key: string, color: number, side: Side, a0: number, a1: number, y0: number, y1: number, off0: number, off1: number) => {
    const alongX = side === "n" || side === "s", face = { n: z0, s: z1, w: x0, e: x1 }[side], out = side === "n" || side === "w" ? -1 : 1;
    const f0 = face + out * off0, f1 = face + out * off1, fc = (f0 + f1) / 2, fs = Math.abs(f1 - f0), ac = (a0 + a1) / 2, as = a1 - a0;
    put(key, tint(BOX, color), alongX ? ac : fc, (y0 + y1) / 2, alongX ? fc : ac, 0, 0, 0, alongX ? as : fs, y1 - y0, alongX ? fs : as);
  };
  for (const side of ["n", "s", "e", "w"] as Side[]) {
    const alongX = side === "n" || side === "s", ext = alongX ? 0.1 : 0; // n/s strips wrap the corners
    const a0 = (alongX ? x0 : z0) - ext, a1 = (alongX ? x1 : z1) + ext;
    const runs: [number, number][] = side === door.side ? [[a0, dc - hw], [dc + hw, a1]] : [[a0, a1]];
    for (const [b0, b1] of runs) {
      strip("vc", wall, side, b0, b1, 0, top, 0, 0.03); // cladding
      strip("vc", 0x8f8a80, side, b0, b1, 0, 0.5, 0, 0.07); // plinth
    }
    if (side === door.side) strip("vc", wall, side, dc - hw, dc + hw, door.height, top, 0, 0.03);
    strip("vc", accent, side, a0, a1, 2.55, 2.68, 0, 0.08); // trim band
    strip("vc", accent, side, a0, a1, top - 0.05, top + 0.42, -0.25, 0.1); // parapet
    if (side === door.side) continue;
    const g0 = a0 + ext + 0.7, g1 = a1 - ext - 0.7; // the framed window band
    strip("k-glass", 0x22303a, side, g0, g1, 1.0, 2.3, 0.03, 0.05);
    for (const y of [0.95, 2.3]) strip("vc-metal", frameC, side, g0 - 0.03, g1 + 0.03, y, y + 0.05, 0.03, 0.08);
    const n = Math.max(1, Math.round((g1 - g0) / 1.4));
    for (let k = 0; k <= n; k++) { const a = g0 + ((g1 - g0) * k) / n; strip("vc-metal", frameC, side, a - 0.03, a + 0.03, 1.0, 2.3, 0.03, 0.08); }
  }
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
  p("k-in", tint(rbox(1.5, 0.05, 0.75, 0.02), 0xb08a5e), 0, 0.735, 0);
  for (const [lx, lz] of [[-0.7, -0.32], [0.7, -0.32], [-0.7, 0.32], [0.7, 0.32]]) p("k-in-metal", tint(BOX, METAL), lx, 0.36, lz, 0.04, 0.72, 0.04);
  p("k-in", tint(BOX, 0x7d6a55), 0, 0.45, -0.34, 1.4, 0.35, 0.02); // modesty panel
  p("k-in", tint(BOX, DARK), 0.5, 0.22, -0.05, 0.2, 0.42, 0.45); // tower under the desk
}

/** A monitor + keyboard for a desk at (x, z, ry); the screen faces the user (+z). Skip `screen` for a hero screen drawn separately. */
export function monitor(x: number, z: number, ry = 0, screen = true) {
  const p = frame(x, z, ry);
  p("k-in", tint(rbox(0.62, 0.38, 0.035, 0.012), DARK), 0, 1.03, -0.2);
  p("k-in", tint(BOX, DARK), 0, 0.83, -0.22, 0.05, 0.16, 0.03);
  p("k-in", tint(BOX, DARK), 0, 0.768, -0.22, 0.22, 0.015, 0.16);
  if (screen) p("k-screen", new THREE.PlaneGeometry(0.57, 0.33), 0, 1.03, -0.181);
  p("k-in", tint(BOX, DARK), 0, 0.77, 0.1, 0.44, 0.02, 0.14); // keyboard
  p("k-in", tint(BOX, DARK), 0.32, 0.77, 0.12, 0.06, 0.02, 0.1); // mouse
}

/** An office chair at (x, z); its sitter faces -z (before ry). */
export function chair(x: number, z: number, ry = 0) {
  const p = frame(x, z, ry);
  p("k-in", tint(rbox(0.46, 0.07, 0.46, 0.03), FABRIC), 0, 0.47, 0);
  p("k-in", tint(rbox(0.44, 0.5, 0.06, 0.03), FABRIC), 0, 0.82, 0.23, 1, 1, 1, 0, -0.1);
  p("k-in-metal", tint(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), METAL), 0, 0.25, 0);
  for (let k = 0; k < 5; k++) p("k-in-metal", tint(BOX, 0x3a3d42), 0, 0.05, 0, 0.04, 0.03, 0.52, (k / 5) * Math.PI * 2); // star base
}

/** A potted plant. */
export function plant(x: number, z: number, s = 1) {
  put("k-in", tint(new THREE.CylinderGeometry(0.18 * s, 0.14 * s, 0.36 * s, 12), 0x9a4e34), x, 0.18 * s, z);
  for (let k = 0; k < 4; k++) put("k-in", tint(new THREE.IcosahedronGeometry(0.2 * s, 1), [0x3f6b34, 0x4d7d3b, 0x5b8a40][k % 3]), x + Math.sin(k * 2.4) * 0.1 * s, (0.5 + k * 0.1) * s, z + Math.cos(k * 2.4) * 0.1 * s);
}

/** A window's inside: (x, y, z) is the centre of the wall's inner face and ry the way it faces into the room (+z when
 *  ry = 0): a daylight-bright pane in a metal frame. The outside glass comes from shell(). */
export function windowLight(x: number, y: number, z: number, ry: number, w: number, h: number) {
  const p = frame(x, z, ry);
  p("k-glow", tint(new THREE.PlaneGeometry(w, h), 0xc4d8ea), 0, y, 0.012);
  for (const ly of [-h / 2, h / 2]) p("k-in-metal", tint(BOX, METAL), 0, y + ly, 0.02, w + 0.08, 0.06, 0.05);
  for (const lx of [-w / 2, 0, w / 2]) p("k-in-metal", tint(BOX, METAL), lx, y, 0.02, 0.05, h, 0.05);
}

/** A canvas texture (signs, screens, posters). */
export function canvasTexture(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  draw(cv.getContext("2d")!);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

/** A flat poster or board facing ry (+z when ry = 0), added straight to the scene (one draw call). */
export function poster(scene: THREE.Scene, x: number, y: number, z: number, ry: number, w: number, h: number, tex: THREE.Texture, glow = 0, indoor = false) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: glow ? 0xffffff : 0, emissiveMap: glow ? tex : null, emissiveIntensity: glow, envMapIntensity: indoor ? 0.35 : 1 }));
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
  const V = (o: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, ...o });
  const code = canvasTexture(256, 148, codeScreen);
  return {
    // shared outdoor vertex-coloured materials
    vc: V(), "vc-metal": V({ roughness: 0.35, metalness: 0.75 }), flat: V({ roughness: 0.9 }), far: V({ roughness: 1 }),
    // inside: the sky's image light is turned down, so the room reads darker than outdoors and its lamps and screens show
    "k-in": V({ roughness: 0.8, envMapIntensity: 0.35 }),
    "k-in-metal": V({ roughness: 0.4, metalness: 0.7, envMapIntensity: 0.4 }),
    "k-floor": V({ roughness: 0.42, envMapIntensity: 0.35 }),
    "k-screen": new THREE.MeshStandardMaterial({ color: 0x05070a, roughness: 0.2, emissive: 0xffffff, emissiveMap: code, emissiveIntensity: 0.9, envMapIntensity: 0.3 }),
    "k-glow": new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
    "k-glass": V({ roughness: 0.06, metalness: 0.7 }),
  };
}
