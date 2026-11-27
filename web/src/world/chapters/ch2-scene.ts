import * as THREE from "three";
import { put, rbox, mergeBuckets, tint } from "../engine/build";
import { room, shell, desk, monitor, chair, plant, windowLight, poster, canvasTexture, kitMats, type RoomSpec } from "../engine/kit";
import { broadleaf, heightfield, mountainRange, roadCut, grassRock, wave } from "../engine/nature";
import { motorbikeGeometry, bikeMaterial, farCity } from "./ch1-street";

// NCIT, Lalitpur: a campus lawn, the college block, the computer lab, the gate with the bikes, Lalitpur and the valley
// rim beyond the wall; and Simba Falls far off-map (x ≈ 400), seen only by the ride's camera. Nearly everything is
// vertex-coloured and merged: campus buckets plain ("vc"), the falls' with "@falls" so each area is culled on its own.
export const Y = 0.025; // top of the paths and floors: where feet stand
export const LAB: RoomSpec = { x: -9, z: -4, w: 10, d: 8, h: 3.4, t: 0.3, door: { side: "e", width: 1.8, height: 2.4 } }; // inner x -14..-4, z -8..0
export const DESK_X = [-12.4, -10.5, -8.6, -6.7];
export const ROW_A = -6.6, ROW_B = -2.2; // desk centres (z); every desk faces -z, its chair 0.75 m behind it
export const HERO_X = DESK_X[2]; // the glowing computer, row A
// solid lab furniture for the body and camera: each desk row (desks + chairs, out to the walls behind and to the west)
// is one box, plus the big plant by the door; the aisle between the rows and the east end stay free
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
export const LAB_FURNITURE = [
  new THREE.Box3(V(LAB.x - LAB.w / 2, 0, LAB.z - LAB.d / 2), V(Math.max(...DESK_X) + 0.75, 1.3, ROW_A + 1.01)),
  new THREE.Box3(V(LAB.x - LAB.w / 2, 0, ROW_B - 0.375), V(Math.max(...DESK_X) + 0.75, 1.3, LAB.z + LAB.d / 2)),
  new THREE.Box3(V(LAB.x + LAB.w / 2 - 0.65, 0, LAB.z - LAB.d / 2), V(LAB.x + LAB.w / 2, 1.1, LAB.z - LAB.d / 2 + 0.65)),
];
export const COLLEGE = new THREE.Box3(new THREE.Vector3(-14, 0, -28), new THREE.Vector3(14, 12.4, -17));
export const GATE_Z = 5.2, WALL_X = 14.7; // the gate is in the east compound wall
// the hill road to Simba Falls, ending in the waterfall clearing
export const ROAD = new THREE.CatmullRomCurve3([[400, 95], [410, 66], [397, 38], [404, 10], [416, -18], [408, -44], [401, -62], [400, -74]].map(([x, z]) => new THREE.Vector3(x, 0.03, z)));
export const FALLS: [number, number, number] = [400, 9, -94]; // where the camera ends up looking
const POOL_Z = FALLS[2] + 8;

const BOX = new THREE.BoxGeometry(1, 1, 1);
const smooth = (a: number, b: number, x: number) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// the falls' hills: cut flat along the road, flattened around the pool, a plateau above the cliff behind the falls
const cut = roadCut(ROAD, { flat: 5, rise: 18, height: 22, seed: 4 });
export const fallsHeight = (x: number, z: number) => {
  const h = cut(x, z) * smooth(11, 22, Math.hypot(x - FALLS[0], z - POOL_Z));
  return Math.max(h, 27 * smooth(-95.5, -100, z) * (0.9 + 0.2 * wave(x, z, 9)) - 0.08);
};

export function buildCampus(scene: THREE.Scene) {
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const c = (key: string, geo: THREE.BufferGeometry, color: number, ...a: number[]) => put(key, tint(geo, color), ...(a as [number, number, number]));
  const mats: Record<string, THREE.Material> = {
    ground: new THREE.MeshStandardMaterial({ color: 0x62874a, roughness: 1 }),
    terrain: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }),
    pool: new THREE.MeshStandardMaterial({ color: 0x2b6470, roughness: 0.05, metalness: 0.25 }),
    bike: bikeMaterial(),
  };

  // ---------- campus ----------
  put("ground", new THREE.PlaneGeometry(1400, 1400), 200, 0, 0, 0, -Math.PI / 2); // reaches the falls too
  // the lawn inside the compound: patchy greens, not one flat colour
  put("flat", heightfield(0, 0.2, WALL_X * 2, 34.8, 36, 42, () => 0.005, (_y, _s, x, z) =>
    new THREE.Color(0x55823f).lerp(new THREE.Color(0x7c9a52), wave(x * 5, z * 5, 3)).lerp(new THREE.Color(0x4a7239), 0.35 * wave(z * 11, x * 9, 8)).getHex()), 0, 0, 0);
  c("flat", BOX, 0x9d958a, 0, Y / 2, -0.5, 0, 0, 0, 3, Y, 33); // main path, spawn → college
  c("flat", BOX, 0x9d958a, -2.6, Y / 2, LAB.z, 0, 0, 0, 2.2, Y, 2.2); // to the lab door
  c("flat", BOX, 0x9d958a, 8.1, Y / 2, GATE_Z, 0, 0, 0, 13.2, Y, 2.4); // to the gate
  c("flat", BOX, 0x3f4044, 11.6, Y / 2 - 0.002, 9.1, 0, 0, 0, 4.8, Y, 2.8); // the bike parking
  for (let z = 15; z > -16; z -= 1.5) c("flat", BOX, 0x7f786d, 0, Y + 0.001, z, 0, 0, 0, 3, 0.002, 0.04); // paving joints
  for (const s of [-1, 1]) c("flat", BOX, 0x8a847a, s * 1.56, 0.04, -0.5, 0, 0, 0, 0.12, 0.08, 33); // kerbs

  // the college block: three storeys, glass bands, an NCIT sign on the parapet
  {
    const { min, max } = COLLEGE, fz = max.z, w = max.x - min.x, d = max.z - min.z, fh = 3.8, cz = (min.z + max.z) / 2;
    c("vc", rbox(w, 11.4, d, 0.12), 0xd8d3ca, 0, 5.7, cz);
    c("vc", rbox(w + 0.3, 1.0, d + 0.3, 0.06), 0x1f4e8c, 0, 11.9, cz); // parapet band
    c("vc", BOX, 0x8f8a80, 0, 0.3, fz + 0.03, 0, 0, 0, w + 0.05, 0.6, 0.08); // plinth
    for (let f = 0; f < 3; f++) {
      const y = f * fh + 2.0;
      c("k-glass", BOX, 0x2a3b4c, 0, y, fz + 0.04, 0, 0, 0, w - 1.6, 2.2, 0.08);
      for (const dy of [-1.12, 1.12]) c("vc-metal", BOX, 0x2b2f35, 0, y + dy, fz + 0.1, 0, 0, 0, w - 1.5, 0.08, 0.1);
      for (let x = -w / 2 + 0.8; x <= w / 2 - 0.8 + 1e-6; x += 1.6) c("vc-metal", BOX, 0x2b2f35, x, y, fz + 0.1, 0, 0, 0, 0.07, 2.2, 0.1);
      c("vc", BOX, 0x9a958c, 0, f * fh + 3.55, fz + 0.12, 0, 0, 0, w + 0.05, 0.5, 0.25); // floor slab edge
    }
    c("vc", rbox(6, 0.3, 2.6, 0.05), 0xd8d3ca, 0, 3.25, fz + 1.3); // entrance canopy
    for (const dx of [-2.6, 2.6]) c("vc", new THREE.CylinderGeometry(0.14, 0.14, 3.1, 12), 0xd8d3ca, dx, 1.55, fz + 2.3);
    c("vc-metal", rbox(3.2, 2.6, 0.1, 0.02), 0x2b2f35, 0, 1.3, fz + 0.06); // the glass doors' frame
    for (const dx of [-0.8, 0.8]) c("k-glass", BOX, 0x2a3b4c, dx, 1.25, fz + 0.12, 0, 0, 0, 1.45, 2.3, 0.04);
    for (const x of [-9, 6]) c("vc-metal", rbox(2.4, 1.2, 1.6, 0.06), 0x6d7076, x, 12.0, cz); // rooftop units
    const sign = canvasTexture(1024, 128, (g) => {
      g.fillStyle = "#1f4e8c"; g.fillRect(0, 0, 1024, 128);
      g.fillStyle = "#ffffff"; g.textBaseline = "middle";
      g.font = "800 86px Arial, sans-serif"; g.fillText("NCIT", 24, 68);
      g.font = "500 34px Arial, sans-serif"; g.fillStyle = "#dfe8f5"; g.fillText("Nepal College of Information Technology", 270, 68);
    });
    poster(scene, 0, 11.9, fz + 0.17, 0, 7.6, 0.95, sign, 0.35);
    for (const x0 of [-13.2, 1.8]) c("vc", rbox(11.4, 0.8, 0.8, 0.3), 0x3f6e3a, x0 + 5.7, 0.4, -16.2); // hedges along the front
  }

  // the computer lab: a room with an open doorway on its east side, dressed outside like the college block
  {
    room(LAB);
    shell(LAB);
    const x1 = LAB.x + LAB.w / 2, t = LAB.t!, ox = x1 + t + 0.03; // ox: the cladding's outer face
    for (const dz of [-1.0, 1.0]) c("vc-metal", BOX, 0x2b2f35, ox + 0.04, 1.25, LAB.z + dz, 0, 0, 0, 0.08, 2.5, 0.12); // door frame
    c("vc-metal", BOX, 0x2b2f35, ox + 0.04, 2.46, LAB.z, 0, 0, 0, 0.08, 0.12, 2.1);
    c("flat", BOX, 0x8f8a80, ox + 0.5, 0.06, LAB.z, 0, 0, 0, 1.0, 0.12, 2.4); // doorstep
    for (const x of [-12, -9, -6]) windowLight(x, 1.65, LAB.z + LAB.d / 2, Math.PI, 1.9, 1.2); // south wall windows
    for (const z of [-6.2, -1.8]) windowLight(LAB.x - LAB.w / 2, 1.65, z, Math.PI / 2, 1.6, 1.2); // west wall windows
    for (const [row, x] of DESK_X.flatMap((x) => [ROW_A, ROW_B].map((r) => [r, x] as const))) {
      desk(x, row); monitor(x, row, 0, !(row === ROW_A && x === HERO_X)); chair(x, row + 0.75);
    }
    plant(LAB.x - LAB.w / 2 + 0.4, LAB.z - LAB.d / 2 + 0.4);
    plant(x1 - 0.4, LAB.z - LAB.d / 2 + 0.4, 1.2);
    // the whiteboard, a poster, the lab sign beside the door
    const board = canvasTexture(512, 192, (g) => {
      g.fillStyle = "#f2f1ea"; g.fillRect(0, 0, 512, 192);
      g.strokeStyle = "#9aa0a8"; g.lineWidth = 6; g.strokeRect(3, 3, 506, 186);
      g.fillStyle = "#2a55a8"; g.font = "600 30px 'Comic Sans MS', 'Segoe Print', cursive"; g.fillText("Lab 2: Game Loop", 24, 48);
      g.fillStyle = "#333"; g.font = "24px 'Courier New', monospace";
      ["while (running) {", "  input(); update(); draw();", "}"].forEach((l, i) => g.fillText(l, 34, 92 + i * 30));
      g.fillStyle = "#c0392b"; g.font = "600 24px 'Segoe Print', cursive"; g.fillText("Due Friday!!", 340, 170);
    });
    poster(scene, LAB.x, 1.6, LAB.z - LAB.d / 2 + 0.015, 0, 3.4, 1.28, board, 0, true);
    const hello = canvasTexture(192, 256, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#1b0f2e"); gr.addColorStop(1, "#e8407e");
      g.fillStyle = gr; g.fillRect(0, 0, 192, 256);
      g.fillStyle = "#fff6e6"; g.font = "800 30px Arial, sans-serif"; g.textAlign = "center";
      g.fillText("HELLO,", 96, 110); g.fillText("WORLD", 96, 146);
      g.font = "16px 'Courier New', monospace"; g.fillText("printf(\"...\");", 96, 200);
    });
    poster(scene, LAB.x - LAB.w / 2 + 0.015, 1.7, LAB.z, Math.PI / 2, 0.9, 1.2, hello, 0, true);
    const labSign = canvasTexture(256, 96, (g) => {
      g.fillStyle = "#1f4e8c"; g.fillRect(0, 0, 256, 96);
      g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
      g.font = "700 30px Arial, sans-serif"; g.fillText("Computer Lab", 128, 38);
      g.font = "500 20px Arial, sans-serif"; g.fillStyle = "#dfe8f5"; g.fillText("Room 2 · Ground floor", 128, 70);
    });
    poster(scene, ox + 0.01, 1.75, LAB.z + 1.65, Math.PI / 2, 0.9, 0.34, labSign, 0.15);
    // the one glowing screen: the square that jumps
    const game = canvasTexture(256, 148, (g) => {
      g.fillStyle = "#0e1a2e"; g.fillRect(0, 0, 256, 148);
      g.fillStyle = "#29d17a"; g.fillRect(0, 112, 256, 36);
      g.fillStyle = "#1f9e5c"; for (let x = 0; x < 256; x += 32) g.fillRect(x, 112, 16, 6);
      g.fillStyle = "#ffd447"; g.fillRect(92, 50, 30, 30);
      g.fillStyle = "rgba(255,212,71,.35)"; g.fillRect(92, 84, 30, 4); g.fillRect(92, 94, 30, 3);
      g.fillStyle = "#e8407e"; g.fillRect(190, 88, 18, 24);
      g.fillStyle = "#ffffff"; g.font = "700 14px 'Courier New', monospace"; g.fillText("SCORE 0001", 10, 20);
    });
    const hero = new THREE.Mesh(new THREE.PlaneGeometry(0.57, 0.33), new THREE.MeshBasicMaterial({ map: game, color: new THREE.Color(1.5, 1.5, 1.5), toneMapped: false }));
    hero.position.set(HERO_X, 1.03, ROW_A - 0.181); scene.add(hero);
    const glow = new THREE.PointLight(0x9fd8ff, 1.4, 3, 2); glow.position.set(HERO_X, 1.1, ROW_A + 0.2);
    // warm room light under the ceiling panels (the roof shades the room from the sun)
    const warm = [-2.5, 2.5].map((dx) => { const l = new THREE.PointLight(0xffd2a0, 8, 10, 1.6); l.position.set(LAB.x + dx, LAB.h - 0.4, LAB.z); return l; });
    scene.add(glow, ...warm);
  }

  // the compound wall and the gate
  {
    const wall = (x: number, z: number, sx: number, sz: number) => {
      c("vc", BOX, 0x9a4632, x, 0.9, z, 0, 0, 0, sx, 1.8, sz);
      c("vc", BOX, 0xbdb5a6, x, 1.85, z, 0, 0, 0, sx + 0.1, 0.1, sz + 0.1);
    };
    wall(WALL_X, (-17 + GATE_Z - 1.4) / 2, 0.3, GATE_Z - 1.4 + 17); wall(WALL_X, (GATE_Z + 1.4 + 17.4) / 2, 0.3, 17.4 - GATE_Z - 1.4);
    wall(0, 17.4, WALL_X * 2, 0.3); wall(-WALL_X, 0.2, 0.3, 34.4);
    for (const dz of [-1.6, 1.6]) { c("vc", rbox(0.7, 3.2, 0.7, 0.05), 0x9a4632, WALL_X, 1.6, GATE_Z + dz); c("vc", rbox(0.85, 0.2, 0.85, 0.04), 0xbdb5a6, WALL_X, 3.3, GATE_Z + dz); }
    c("vc", rbox(0.4, 0.5, 3.9, 0.05), 0x1f4e8c, WALL_X, 3.7, GATE_Z);
    const gateSign = canvasTexture(512, 64, (g) => {
      g.fillStyle = "#1f4e8c"; g.fillRect(0, 0, 512, 64);
      g.fillStyle = "#fff"; g.font = "700 34px Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("NCIT · Balkumari, Lalitpur", 256, 34);
    });
    poster(scene, WALL_X - 0.21, 3.7, GATE_Z, -Math.PI / 2, 3.7, 0.46, gateSign, 0.2);
    // five parked motorbikes (the friends' and yours)
    [0xa83a2e, 0x1b1b22, 0x2f5f9a, 0xe9e4da, 0x1b1b22].forEach((col, i) => put("bike", motorbikeGeometry(col), 9.8 + i * 0.9, Y, 9.1 + (i % 2) * 0.15, 0.08 * (i - 2)));
  }

  // the lawn: broad-leaf trees and a bench
  for (const [x, z, s] of [[-6.5, 9, 1], [-11, 13, 1.15], [-11.5, 5, 0.9], [5.5, 12.5, 1.1], [6.5, -2.5, 1], [9.5, -11, 1.2], [-2.8, -12.5, 0.85], [12, -4, 0.95]]) broadleaf("vc", x, 0, z, s, rnd);
  c("vc", rbox(1.8, 0.08, 0.45, 0.02), 0x7a5232, -4.6, 0.45, 10.5, Math.PI / 2);
  for (const dz of [-0.7, 0.7]) c("vc-metal", BOX, 0x9ea4ac, -4.6, 0.22, 10.5 + dz, 0, 0, 0, 0.45, 0.44, 0.06);

  // Lalitpur beyond the wall (Ch.1's layered city), the valley rim, the far Himalayas
  {
    // Ch.1's city, pushed out to 120–200 m either side and flattened to just over half height in hazy tones, so it
    // reads as valley rooftops low on the horizon, never as buildings next door
    const FAR: Record<string, number> = { far1: 0x9c8074, far2: 0xab968e, far3: 0xb6abb4, gold: 0xc9a24a };
    const CITY_OUT = 95, CITY_Y = 0.55;
    let sd = 99;
    farCity((key, geo, x, y, z, ry = 0, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) =>
      put("far", tint(geo, FAR[key]), Math.sign(x) * (CITY_OUT + Math.abs(x)), y * CITY_Y - 1, z * 1.1 - 20, ry, rx, rz, sx, sy * CITY_Y, sz),
    () => (sd = (sd * 16807) % 2147483647) / 2147483647);
    put("far", heightfield(0, -40, 640, 640, 64, 64, (x, z) => {
      const r = Math.hypot(x, z + 40);
      return r < 150 ? -2 : smooth(150, 270, r) * (38 + 48 * wave(x, z, 2)) + 6 * wave(z * 3, x * 3, 6) - 2;
    }, (y, steep, x, z) => new THREE.Color(0x4f7a3e).lerp(new THREE.Color(0x7b8f5a), wave(x * 2, z * 2, 1)).lerp(new THREE.Color(0x6c6a5e), steep > 0.45 ? 0.6 : 0).getHex()), 0, 0, 0);
    put("far", mountainRange(100, -640, 2400, 260, 380, 5), 0, 0, 0);
  }

  // ---------- Simba Falls (off-map) ----------
  {
    const ribbon = (half: number, y: number) => {
      const n = 180, pos: number[] = [], idx: number[] = [];
      for (let i = 0; i <= n; i++) {
        const p = ROAD.getPointAt(i / n), t = ROAD.getTangentAt(i / n);
        pos.push(p.x + t.z * half, y, p.z - t.x * half, p.x - t.z * half, y, p.z + t.x * half);
        if (i < n) idx.push(2 * i, 2 * i + 2, 2 * i + 1, 2 * i + 1, 2 * i + 2, 2 * i + 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      g.setAttribute("uv", new THREE.Float32BufferAttribute(new Array((n + 1) * 4).fill(0), 2));
      g.computeVertexNormals();
      if (g.attributes.normal.getY(0) < 0) { idx.reverse(); g.setIndex(idx); g.computeVertexNormals(); } // face up
      return g;
    };
    c("flat@falls", ribbon(3.6, 0.015), 0x8a7458, 0, 0, 0);
    c("flat@falls", ribbon(2.4, 0.03), 0x4e4b47, 0, 0, 0);
    put("terrain@falls", heightfield(400, -10, 150, 250, 75, 125, fallsHeight, grassRock(4)), 0, 0, 0);
    for (let i = 0; i < 46; i++) { // trees on the slopes either side of the road
      const u = rnd() * 0.9, p = ROAD.getPointAt(u), t = ROAD.getTangentAt(u), off = (rnd() < 0.5 ? -1 : 1) * (6 + rnd() * 14);
      const x = p.x + t.z * off, z = p.z - t.x * off;
      broadleaf("vc@falls", x, fallsHeight(x, z) - 0.2, z, 0.9 + rnd() * 0.7, rnd);
    }
    for (let i = 0; i < 10; i++) { // boulders on the cut
      const u = rnd(), p = ROAD.getPointAt(u), t = ROAD.getTangentAt(u), off = (rnd() < 0.5 ? -1 : 1) * (4.6 + rnd() * 2), x = p.x + t.z * off, z = p.z - t.x * off;
      c("vc@falls", new THREE.DodecahedronGeometry(0.5 + rnd() * 0.9, 1), 0x77706a, x, Math.max(0, fallsHeight(x, z)) + 0.2, z, rnd() * 3, rnd() * 3, 0, 1, 0.7, 1);
    }
    // the clearing: a pool, rocks, the cliff and the falling water
    const [fx, , fz] = FALLS;
    put("pool@falls", new THREE.CircleGeometry(9, 40), fx, 0.04, POOL_Z, 0, -Math.PI / 2);
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * Math.PI * 2, r = 9 + rnd() * 1.2;
      if (Math.sin(a) > 0.55) continue; // leave the near side open, toward the road
      c("vc@falls", new THREE.DodecahedronGeometry(0.6 + rnd() * 1.1, 1), [0x6b6660, 0x7a736a, 0x5e5953][k % 3], fx + Math.cos(a) * r, 0.3, POOL_Z - Math.sin(a) * r, rnd() * 3, rnd() * 3, 0, 1, 0.7, 1);
    }
    c("vc@falls", rbox(56, 26, 10, 0.8), 0x5a544e, fx, 13, fz - 6);
    for (let k = 0; k < 14; k++) {
      const r = 3.5 + rnd() * 3.5, x = fx + (k % 2 ? 1 : -1) * (4 + r + rnd() * 18); // clear of the water
      c("vc@falls", new THREE.DodecahedronGeometry(r, 1), [0x5a544e, 0x635c55, 0x514c47][k % 3], x, 2 + rnd() * 24, fz - 1.2 + rnd() * 1.5, rnd() * 3, rnd() * 3, 0, 1, 1.2, 0.6);
    }
    for (let k = 0; k < 12; k++) { const x = fx + (rnd() - 0.5) * 54, z = fz - 8 - rnd() * 20; broadleaf("vc@falls", x, fallsHeight(x, z) - 0.2, z, 0.9 + rnd() * 0.5, rnd); }
    c("vc@falls", new THREE.CircleGeometry(3.4, 24), 0xf2f7fa, fx, 0.06, fz + 1.6, 0, -Math.PI / 2, 0, 1.3, 1, 1); // foam
    for (let k = 0; k < 8; k++) c("vc@falls", new THREE.IcosahedronGeometry(0.5 + rnd() * 0.5, 1), 0xf2f7fa, fx + (rnd() - 0.5) * 5, 0.2, fz + 1 + rnd() * 1.5);
  }

  mergeBuckets(scene, { ...kitMats(), ...mats });

  // the water: a plane with streaks scrolling down, and a little mist at the bottom
  const [fx, , fz] = FALLS;
  const streaks = canvasTexture(128, 256, (g) => {
    g.fillStyle = "rgba(225,240,250,0.85)"; g.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${0.4 + rnd() * 0.6})`; g.fillRect(rnd() * 128, rnd() * 256, 1 + rnd() * 3, 20 + rnd() * 60); }
    for (let i = 0; i < 20; i++) { g.fillStyle = "rgba(150,190,210,0.5)"; g.fillRect(rnd() * 128, rnd() * 256, 1 + rnd() * 2, 30 + rnd() * 50); }
  });
  streaks.wrapS = streaks.wrapT = THREE.RepeatWrapping; streaks.repeat.set(1, 3);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(6, 24), new THREE.MeshStandardMaterial({ map: streaks, transparent: true, roughness: 0.15, emissive: 0xcfe8ff, emissiveIntensity: 0.3, depthWrite: false }));
  water.position.set(fx, 12.4, fz - 0.6); scene.add(water);
  const blob = canvasTexture(64, 64, (g) => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  });
  const mist = [0, 0.33, 0.66].map((off) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: blob, transparent: true, depthWrite: false, opacity: 0 }));
    sp.position.set(fx, 1, fz + 1.5); scene.add(sp); return { sp, off };
  });

  return {
    update(t: number) {
      streaks.offset.y = t * 0.9;
      for (const { sp, off } of mist) {
        const ph = (t * 0.25 + off) % 1;
        sp.position.y = 0.8 + ph * 3; sp.position.x = fx + Math.sin((t + off * 9) * 0.7) * 1.2; sp.scale.setScalar(4 + ph * 5);
        (sp.material as THREE.SpriteMaterial).opacity = Math.sin(ph * Math.PI) * 0.45;
      }
    },
  };
}
