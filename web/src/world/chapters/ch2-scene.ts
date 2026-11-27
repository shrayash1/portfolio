import * as THREE from "three";
import { put, rbox, mergeBuckets } from "../engine/build";
import { room, desk, monitor, chair, plant, windowLight, poster, canvasTexture, kitMats, type RoomSpec } from "../engine/kit";
import { motorbikeGeometry, bikeMaterial } from "./ch1-street";

// NCIT, Lalitpur: a campus lawn, the college block, the computer lab, the gate with the bikes;
// and Simba Falls far off-map (x ≈ 400), seen only by the ride's camera
export const Y = 0.025; // top of the paths and floors: where feet stand
export const LAB: RoomSpec = { x: -9, z: -4, w: 10, d: 8, h: 3.4, t: 0.3, door: { side: "e", width: 1.8, height: 2.4 } }; // inner x -14..-4, z -8..0
export const DESK_X = [-12.4, -10.5, -8.6, -6.7];
export const ROW_A = -6.6, ROW_B = -2.2; // desk centres (z); every desk faces -z, its chair 0.75 m behind it
export const HERO_X = DESK_X[2]; // the glowing computer, row A
export const COLLEGE = new THREE.Box3(new THREE.Vector3(-14, 0, -28), new THREE.Vector3(14, 12.4, -17));
export const GATE_Z = 5.2, WALL_X = 14.7; // the gate is in the east compound wall
// the hill road to Simba Falls, ending in the waterfall clearing
export const ROAD = new THREE.CatmullRomCurve3([[400, 95], [410, 66], [397, 38], [404, 10], [416, -18], [408, -44], [401, -62], [400, -74]].map(([x, z]) => new THREE.Vector3(x, 0.03, z)));
export const FALLS: [number, number, number] = [400, 9, -94]; // where the camera ends up looking

const BOX = new THREE.BoxGeometry(1, 1, 1);

export function buildCampus(scene: THREE.Scene) {
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const M = (color: number, o: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o });
  const mats: Record<string, THREE.Material> = {
    ground: M(0x6f9a52, { roughness: 1 }), paving: M(0xc8bfae, { roughness: 0.8 }), asphalt: M(0x4a4a4c, { roughness: 0.9 }),
    concrete: M(0xd8d3ca, { roughness: 0.75 }), band: M(0x9a958c, { roughness: 0.7 }), accent: M(0x1f4e8c, { roughness: 0.5 }),
    glass: M(0x2a3b4c, { roughness: 0.06, metalness: 0.7 }), frame: M(0x2b2f35, { roughness: 0.4, metalness: 0.6 }),
    brick: M(0x9a4632), cap: M(0xbdb5a6), hedge: M(0x3f6e3a, { roughness: 0.95 }), leaf: M(0x4f7d45), bark: M(0x5a3a22),
    wood: M(0x7a5232, { roughness: 0.7 }), steel: M(0xb9bcc2, { roughness: 0.35, metalness: 0.8 }), bike: bikeMaterial(),
    hill: M(0x5f7d4a, { roughness: 1 }), hill2: M(0x8a96a8, { roughness: 1 }), mountain: M(0x8d86ad, { roughness: 1 }), snow: M(0xf4f1ff, { roughness: 0.9 }),
    road: M(0x57524c, { roughness: 0.92 }), dirt: M(0x8a7458, { roughness: 1 }), pine: M(0x2f5a3a, { roughness: 0.9 }),
    rock: M(0x6b6660, { roughness: 0.95 }), cliff: M(0x5a544e, { roughness: 1 }), pool: M(0x2f6f7a, { roughness: 0.06, metalness: 0.2 }),
    foam: M(0xf2f7fa, { roughness: 0.6, emissive: 0xdfefff, emissiveIntensity: 0.25 }),
  };
  const tree = (x: number, z: number, s = 1) => {
    put("bark", new THREE.CylinderGeometry(0.15 * s, 0.24 * s, 3.2 * s, 8), x, 1.6 * s, z);
    for (let k = 0; k < 7; k++) put("leaf", new THREE.IcosahedronGeometry((1.1 + rnd() * 0.7) * s, 1), x + (rnd() - 0.5) * 2 * s, (3.4 + rnd() * 1.8) * s, z + (rnd() - 0.5) * 2 * s);
  };
  const pine = (x: number, z: number, s = 1, y0 = 0) => {
    put("bark", new THREE.CylinderGeometry(0.12 * s, 0.18 * s, 1.6 * s, 6), x, y0 + 0.8 * s, z);
    put("pine", new THREE.ConeGeometry(1.5 * s, 3.6 * s, 7), x, y0 + 2.8 * s, z, rnd() * 3);
    put("pine", new THREE.ConeGeometry(1.05 * s, 2.8 * s, 7), x, y0 + 4.4 * s, z, rnd() * 3);
  };

  // ---------- campus ----------
  put("ground", new THREE.PlaneGeometry(1400, 1400), 200, 0, 0, 0, -Math.PI / 2); // reaches the falls too
  put("paving", BOX, 0, Y / 2, -0.5, 0, 0, 0, 3, Y, 33); // main path, spawn → college
  put("paving", BOX, -2.6, Y / 2, LAB.z, 0, 0, 0, 2.2, Y, 2.2); // to the lab door
  put("paving", BOX, 8.1, Y / 2, GATE_Z, 0, 0, 0, 13.2, Y, 2.4); // to the gate
  put("asphalt", BOX, 11.6, Y / 2 - 0.002, 9.1, 0, 0, 0, 4.8, Y, 2.8); // the bike parking
  for (let z = 15; z > -16; z -= 1.5) put("band", BOX, 0, Y + 0.001, z, 0, 0, 0, 3, 0.002, 0.04); // paving joints

  // the college block: three storeys, glass bands, an NCIT sign on the parapet
  {
    const { min, max } = COLLEGE, fz = max.z, w = max.x - min.x, d = max.z - min.z, fh = 3.8;
    put("concrete", rbox(w, 11.4, d, 0.12), 0, 5.7, (min.z + max.z) / 2);
    put("accent", rbox(w + 0.3, 1.0, d + 0.3, 0.06), 0, 11.9, (min.z + max.z) / 2); // parapet band
    put("band", BOX, 0, 0.3, fz + 0.03, 0, 0, 0, w + 0.05, 0.6, 0.08); // plinth
    for (let f = 0; f < 3; f++) {
      const y = f * fh + 2.0;
      put("glass", BOX, 0, y, fz + 0.04, 0, 0, 0, w - 1.6, 2.2, 0.08);
      put("frame", BOX, 0, y + 1.12, fz + 0.1, 0, 0, 0, w - 1.5, 0.08, 0.1);
      put("frame", BOX, 0, y - 1.12, fz + 0.1, 0, 0, 0, w - 1.5, 0.08, 0.1);
      for (let x = -w / 2 + 0.8; x <= w / 2 - 0.8 + 1e-6; x += 1.6) put("frame", BOX, x, y, fz + 0.1, 0, 0, 0, 0.07, 2.2, 0.1);
      put("band", BOX, 0, f * fh + 3.55, fz + 0.12, 0, 0, 0, w + 0.05, 0.5, 0.25); // floor slab edge
    }
    put("concrete", rbox(6, 0.3, 2.6, 0.05), 0, 3.25, fz + 1.3); // entrance canopy
    for (const dx of [-2.6, 2.6]) put("concrete", new THREE.CylinderGeometry(0.14, 0.14, 3.1, 12), dx, 1.55, fz + 2.3);
    put("frame", rbox(3.2, 2.6, 0.1, 0.02), 0, 1.3, fz + 0.06); // the glass doors' frame
    for (const dx of [-0.8, 0.8]) put("glass", BOX, dx, 1.25, fz + 0.12, 0, 0, 0, 1.45, 2.3, 0.04);
    for (const x of [-9, 6]) put("frame", rbox(2.4, 1.2, 1.6, 0.06), x, 12.0, (min.z + max.z) / 2); // rooftop units
    const sign = canvasTexture(1024, 128, (c) => {
      c.fillStyle = "#1f4e8c"; c.fillRect(0, 0, 1024, 128);
      c.fillStyle = "#ffffff"; c.textBaseline = "middle";
      c.font = "800 86px Arial, sans-serif"; c.fillText("NCIT", 24, 68);
      c.font = "500 34px Arial, sans-serif"; c.fillStyle = "#dfe8f5"; c.fillText("Nepal College of Information Technology", 270, 68);
    });
    poster(scene, 0, 11.9, fz + 0.17, 0, 7.6, 0.95, sign, 0.35);
    for (const x0 of [-13.2, 1.8]) put("hedge", rbox(11.4, 0.8, 0.8, 0.3), x0 + 5.7, 0.4, -16.2); // hedges along the front
  }

  // the computer lab: one room, an open doorway on its east side
  {
    room(LAB);
    const x1 = LAB.x + LAB.w / 2, t = LAB.t!;
    for (const [dz, h] of [[-1.0, 2.5], [1.0, 2.5]] as const) put("frame", BOX, x1 + t + 0.03, h / 2, LAB.z + dz, 0, 0, 0, 0.08, h, 0.12); // door frame
    put("frame", BOX, x1 + t + 0.03, 2.46, LAB.z, 0, 0, 0, 0.08, 0.12, 2.1);
    put("accent", BOX, LAB.x, LAB.h + t + 0.08, LAB.z, 0, 0, 0, LAB.w + 0.7, 0.16, LAB.d + 0.7); // roof edge
    for (const x of [-12, -9, -6]) windowLight(x, 1.75, LAB.z + LAB.d / 2, Math.PI, 1.9, 1.2, t); // south wall windows
    for (const z of [-6.2, -1.8]) windowLight(LAB.x - LAB.w / 2, 1.75, z, Math.PI / 2, 1.6, 1.2, t); // west wall windows
    for (const [row, x] of DESK_X.flatMap((x) => [ROW_A, ROW_B].map((r) => [r, x] as const))) {
      desk(x, row); monitor(x, row, 0, !(row === ROW_A && x === HERO_X)); chair(x, row + 0.75);
    }
    plant(LAB.x - LAB.w / 2 + 0.4, LAB.z - LAB.d / 2 + 0.4);
    plant(x1 - 0.4, LAB.z - LAB.d / 2 + 0.4, 1.2);
    // the whiteboard, a poster, the lab sign over the door
    const board = canvasTexture(512, 192, (c) => {
      c.fillStyle = "#f6f6f2"; c.fillRect(0, 0, 512, 192);
      c.strokeStyle = "#9aa0a8"; c.lineWidth = 6; c.strokeRect(3, 3, 506, 186);
      c.fillStyle = "#2a55a8"; c.font = "600 30px 'Comic Sans MS', 'Segoe Print', cursive"; c.fillText("Lab 2: Game Loop", 24, 48);
      c.fillStyle = "#333"; c.font = "24px 'Courier New', monospace";
      ["while (running) {", "  input(); update(); draw();", "}"].forEach((l, i) => c.fillText(l, 34, 92 + i * 30));
      c.fillStyle = "#c0392b"; c.font = "600 24px 'Segoe Print', cursive"; c.fillText("Due Friday!!", 340, 170);
    });
    poster(scene, LAB.x, 1.6, LAB.z - LAB.d / 2 + 0.015, 0, 3.4, 1.28, board);
    const hello = canvasTexture(192, 256, (c) => {
      const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, "#1b0f2e"); g.addColorStop(1, "#e8407e");
      c.fillStyle = g; c.fillRect(0, 0, 192, 256);
      c.fillStyle = "#fff6e6"; c.font = "800 30px Arial, sans-serif"; c.textAlign = "center";
      c.fillText("HELLO,", 96, 110); c.fillText("WORLD", 96, 146);
      c.font = "16px 'Courier New', monospace"; c.fillText("printf(\"...\");", 96, 200);
    });
    poster(scene, LAB.x - LAB.w / 2 + 0.015, 1.7, LAB.z, Math.PI / 2, 0.9, 1.2, hello);
    const labSign = canvasTexture(256, 64, (c) => {
      c.fillStyle = "#1f4e8c"; c.fillRect(0, 0, 256, 64);
      c.fillStyle = "#fff"; c.font = "600 30px Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("Computer Lab 2", 128, 34);
    });
    poster(scene, x1 + t + 0.02, 2.95, LAB.z, Math.PI / 2, 1.8, 0.45, labSign, 0.2);
    // the one glowing screen: the square that jumps
    const game = canvasTexture(256, 148, (c) => {
      c.fillStyle = "#0e1a2e"; c.fillRect(0, 0, 256, 148);
      c.fillStyle = "#29d17a"; c.fillRect(0, 112, 256, 36);
      c.fillStyle = "#1f9e5c"; for (let x = 0; x < 256; x += 32) c.fillRect(x, 112, 16, 6);
      c.fillStyle = "#ffd447"; c.fillRect(92, 50, 30, 30);
      c.fillStyle = "rgba(255,212,71,.35)"; c.fillRect(92, 84, 30, 4); c.fillRect(92, 94, 30, 3);
      c.fillStyle = "#e8407e"; c.fillRect(190, 88, 18, 24);
      c.fillStyle = "#ffffff"; c.font = "700 14px 'Courier New', monospace"; c.fillText("SCORE 0001", 10, 20);
    });
    const hero = new THREE.Mesh(new THREE.PlaneGeometry(0.57, 0.33), new THREE.MeshBasicMaterial({ map: game, color: new THREE.Color(1.5, 1.5, 1.5), toneMapped: false }));
    hero.position.set(HERO_X, 1.03, ROW_A - 0.181); scene.add(hero);
    const glow = new THREE.PointLight(0x9fd8ff, 1.4, 3, 2); glow.position.set(HERO_X, 1.1, ROW_A + 0.2);
    // warm room light under the ceiling panels (the roof shades the room from the sun)
    const warm = [-2.5, 2.5].map((dx) => { const l = new THREE.PointLight(0xffd7a8, 7, 10, 1.6); l.position.set(LAB.x + dx, LAB.h - 0.4, LAB.z); return l; });
    scene.add(glow, ...warm);
  }

  // the compound wall and the gate
  {
    const wall = (x: number, z: number, sx: number, sz: number) => { put("brick", BOX, x, 0.9, z, 0, 0, 0, sx, 1.8, sz); put("cap", BOX, x, 1.85, z, 0, 0, 0, sx + 0.1, 0.1, sz + 0.1); };
    wall(WALL_X, (-17 + GATE_Z - 1.4) / 2, 0.3, GATE_Z - 1.4 + 17); wall(WALL_X, (GATE_Z + 1.4 + 17.4) / 2, 0.3, 17.4 - GATE_Z - 1.4);
    wall(0, 17.4, WALL_X * 2, 0.3); wall(-WALL_X, 0.2, 0.3, 34.4);
    for (const dz of [-1.6, 1.6]) { put("brick", rbox(0.7, 3.2, 0.7, 0.05), WALL_X, 1.6, GATE_Z + dz); put("cap", rbox(0.85, 0.2, 0.85, 0.04), WALL_X, 3.3, GATE_Z + dz); }
    put("accent", rbox(0.4, 0.5, 3.9, 0.05), WALL_X, 3.7, GATE_Z);
    const gateSign = canvasTexture(512, 64, (c) => {
      c.fillStyle = "#1f4e8c"; c.fillRect(0, 0, 512, 64);
      c.fillStyle = "#fff"; c.font = "700 34px Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("NCIT · Balkumari, Lalitpur", 256, 34);
    });
    poster(scene, WALL_X - 0.21, 3.7, GATE_Z, -Math.PI / 2, 3.7, 0.46, gateSign, 0.2);
    // five parked motorbikes (the friends' and yours)
    [0xa83a2e, 0x1b1b22, 0x2f5f9a, 0xe9e4da, 0x1b1b22].forEach((c, i) => put("bike", motorbikeGeometry(c), 9.8 + i * 0.9, Y, 9.1 + (i % 2) * 0.15, 0.08 * (i - 2)));
  }

  // lawn: trees, a bench
  for (const [x, z, s] of [[-6.5, 9, 1], [-11, 13, 1.15], [-11.5, 5, 0.9], [5.5, 12.5, 1.1], [6.5, -2.5, 1], [9.5, -11, 1.2], [-2.8, -12.5, 0.85], [12, -4, 0.95]]) tree(x, z, s);
  put("wood", rbox(1.8, 0.08, 0.45, 0.02), -4.6, 0.45, 10.5, Math.PI / 2);
  for (const dz of [-0.7, 0.7]) put("steel", BOX, -4.6, 0.22, 10.5 + dz, 0, 0, 0, 0.45, 0.44, 0.06);

  // Lalitpur beyond the wall: valley hills and the far Himalayas
  for (let i = 0; i < 16; i++) {
    const far = i % 2, a = (i / 16) * Math.PI * 2 + rnd() * 0.3, dist = 130 + far * 110 + rnd() * 50, sx = 60 + rnd() * 50;
    put(far ? "hill2" : "hill", new THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), Math.sin(a) * dist, -1, Math.cos(a) * dist, 0, 0, 0, sx, 20 + rnd() * 26 + far * 14, sx);
  }
  for (let i = 0; i < 10; i++) {
    const x = -700 + i * 150 + (rnd() - 0.5) * 80, z = -520 - rnd() * 120, h = 240 + rnd() * 180, r = 150 + rnd() * 80;
    put("mountain", new THREE.ConeGeometry(r, h, 7, 1), x, h / 2 - 5, z, rnd() * 3);
    put("snow", new THREE.ConeGeometry(r * 0.34, h * 0.34, 7, 1), x, h - h * 0.17 - 4.5, z, rnd() * 3);
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
    put("dirt", ribbon(3.6, 0.015), 0, 0, 0);
    put("road", ribbon(2.4, 0.03), 0, 0, 0);
    for (let i = 0; i <= 16; i++) for (const s of [-1, 1]) { // the hills the road winds through
      const u = i / 16, p = ROAD.getPointAt(u), t = ROAD.getTangentAt(u), off = s * (30 + rnd() * 16), sx = 18 + rnd() * 12;
      put("hill", new THREE.SphereGeometry(1, 14, 9, 0, Math.PI * 2, 0, Math.PI / 2), p.x + t.z * off, -1, p.z - t.x * off, 0, 0, 0, sx, 12 + rnd() * 16, sx);
    }
    for (let i = 0; i < 70; i++) { // pines along the road
      const u = rnd() * 0.92, p = ROAD.getPointAt(u), t = ROAD.getTangentAt(u), off = (rnd() < 0.5 ? -1 : 1) * (5 + rnd() * 12);
      pine(p.x + t.z * off, p.z - t.x * off, 0.8 + rnd() * 0.6);
    }
    // the clearing: a pool, rocks, the cliff and the falling water
    const [fx, , fz] = FALLS;
    put("pool", new THREE.CircleGeometry(9, 40), fx, 0.04, fz + 8, 0, -Math.PI / 2);
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * Math.PI * 2, r = 9 + rnd() * 1.2;
      if (Math.sin(a) > 0.55) continue; // leave the near side open, toward the road
      put("rock", new THREE.DodecahedronGeometry(0.6 + rnd() * 1.1, 0), fx + Math.cos(a) * r, 0.3, fz + 8 - Math.sin(a) * r, rnd() * 3, rnd() * 3, 0, 1, 0.7, 1);
    }
    put("cliff", rbox(56, 26, 10, 0.8), fx, 13, fz - 6);
    for (let k = 0; k < 14; k++) {
      const r = 3.5 + rnd() * 3.5, x = fx + (k % 2 ? 1 : -1) * (4 + r + rnd() * 18); // clear of the water
      put("cliff", new THREE.DodecahedronGeometry(r, 0), x, 2 + rnd() * 24, fz - 1.2 + rnd() * 1.5, rnd() * 3, rnd() * 3, 0, 1, 1.2, 0.6);
    }
    for (let k = 0; k < 16; k++) pine(fx + (rnd() - 0.5) * 54, fz - 4 - rnd() * 6, 0.9 + rnd() * 0.5, 26);
    put("foam", new THREE.CircleGeometry(3.4, 24), fx, 0.06, fz + 1.6, 0, -Math.PI / 2, 0, 1.3, 1, 1);
    for (let k = 0; k < 8; k++) put("foam", new THREE.IcosahedronGeometry(0.5 + rnd() * 0.5, 1), fx + (rnd() - 0.5) * 5, 0.2, fz + 1 + rnd() * 1.5);
  }

  mergeBuckets(scene, { ...mats, ...kitMats() });

  // the water: a plane with streaks scrolling down, and a little mist at the bottom
  const [fx, , fz] = FALLS;
  const streaks = canvasTexture(128, 256, (c) => {
    c.fillStyle = "rgba(225,240,250,0.85)"; c.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(255,255,255,${0.4 + rnd() * 0.6})`; c.fillRect(rnd() * 128, rnd() * 256, 1 + rnd() * 3, 20 + rnd() * 60); }
    for (let i = 0; i < 20; i++) { c.fillStyle = "rgba(150,190,210,0.5)"; c.fillRect(rnd() * 128, rnd() * 256, 1 + rnd() * 2, 30 + rnd() * 50); }
  });
  streaks.wrapS = streaks.wrapT = THREE.RepeatWrapping; streaks.repeat.set(1, 3);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(6, 24), new THREE.MeshStandardMaterial({ map: streaks, transparent: true, roughness: 0.15, emissive: 0xcfe8ff, emissiveIntensity: 0.3, depthWrite: false }));
  water.position.set(fx, 12.4, fz - 0.6); scene.add(water);
  const blob = canvasTexture(64, 64, (c) => {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g; c.fillRect(0, 0, 64, 64);
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
