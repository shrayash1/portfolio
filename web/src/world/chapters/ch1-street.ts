import * as THREE from "three";
import { put, rbox, mergeBuckets } from "../engine/build";

// Kathmandu street at golden hour, ported from the approved look test (seed 7, same layout)
export const ROAD = 3.2; // road half-width
export const WALK = 4.6; // building line
export const SZ = -158; // stupa centre z
export const CAFE_Z = -58.5, TEA_Z = -14, GATE_Z = -140;

export function buildStreet(scene: THREE.Scene) {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];

  const M = (color: number, o: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o });
  const mats = {
    brickA: M(0x9a4632), brickB: M(0xb0583a), brickC: M(0x8a3e2e), plaster: M(0xd9c4a3), plaster2: M(0xc9b08a),
    trim: M(0x6e3a26), wood: M(0x4a2a18, { roughness: 0.7 }), glass: M(0x1c1612, { roughness: 0.35, emissive: 0xffa04a, emissiveIntensity: 0 }),
    roof: M(0x5a2a1c), tank: M(0x1d1f24, { roughness: 0.5 }), concrete: M(0x9a948a), road: M(0xa0826a, { roughness: 0.95 }),
    sidewalk: M(0xb8a88e), ground: M(0xb69a74), white: M(0xf4efe6, { roughness: 0.7 }), gold: M(0xd9a937, { roughness: 0.35, metalness: 0.75 }),
    wire: M(0x1b1416, { roughness: 0.6 }), shutterB: M(0x3a6a9a), shutterG: M(0x3f7a52), shutterR: M(0xa83a2e), awning: M(0xc8402e), sign: M(0x2a4a6a),
    mountain: M(0x8d86ad, { roughness: 1 }), snow: M(0xf4f1ff, { roughness: 0.9 }), leaf: M(0x4f7d45), bark: M(0x5a3a22),
    bulb: M(0xfff1c8, { emissive: 0xffd28a, emissiveIntensity: 0 }),
  };
  const BOX = new THREE.BoxGeometry(1, 1, 1);

  // ground, road, sidewalks
  put("ground", new THREE.PlaneGeometry(900, 900), 0, 0, -300, 0, -Math.PI / 2);
  put("road", new THREE.PlaneGeometry(ROAD * 2, 200), 0, 0.01, -70, 0, -Math.PI / 2);
  for (const s of [-1, 1]) put("sidewalk", rbox(WALK - ROAD, 0.16, 200, 0.04), s * (ROAD + (WALK - ROAD) / 2), 0.08, -70);
  for (let z = 10; z > -165; z -= 2.2) put("sidewalk", BOX, 0, 0.015, z, 0, 0, 0, ROAD * 2, 0.01, 0.06); // paving joints

  // houses: two rows of Newari-style brick buildings
  for (const side of [-1, 1]) {
    let z = 6;
    while (z > -138) {
      const w = 5 + rnd() * 3.5, d = 9, floors = 2 + Math.floor(rnd() * 3), fh = 3.1, h = floors * fh + 0.6;
      const cx = side * (WALK + d / 2), cz = z - w / 2;
      const body = pick(["brickA", "brickB", "brickC", "brickA", "plaster"]);
      put(body, rbox(d, h, w - 0.08, 0.1), cx, h / 2, cz);
      const face = side * WALK; // street-facing wall plane
      for (let f = 1; f <= floors; f++) {
        put("trim", rbox(0.18, 0.16, w - 0.1, 0.04), face - side * 0.06, f * fh, cz); // floor bands
        if (f === 1) continue;
        const n = w > 7 ? 3 : 2;
        for (let k = 0; k < n; k++) {
          const wz = cz + (k - (n - 1) / 2) * (w / n);
          put("wood", rbox(0.22, 1.55, 1.05, 0.03), face - side * 0.08, (f - 1) * fh + 1.6, wz); // carved wooden frame
          put("glass", BOX, face - side * 0.12, (f - 1) * fh + 1.55, wz, 0, 0, 0, 0.1, 1.2, 0.75);
          put("wood", BOX, face - side * 0.2, (f - 1) * fh + 1.55, wz, 0, 0, 0, 0.06, 1.2, 0.06); // mullion
          put("wood", BOX, face - side * 0.16, (f - 1) * fh + 2.5, wz, 0, 0, 0, 0.3, 0.14, 1.25); // lintel
        }
        if (rnd() < 0.35) { // balcony
          put("wood", rbox(0.9, 0.12, Math.min(3, w - 1), 0.03), face - side * 0.45, (f - 1) * fh + 0.9, cz);
          for (let b = -1; b <= 1; b += 0.5) put("wood", BOX, face - side * 0.85, (f - 1) * fh + 1.25, cz + b * Math.min(1.4, w / 2 - 0.6), 0, 0, 0, 0.06, 0.7, 0.06);
          put("wood", BOX, face - side * 0.85, (f - 1) * fh + 1.6, cz, 0, 0, 0, 0.06, 0.06, Math.min(3, w - 1));
        }
      }
      // ground floor shop: shutter, awning, sign
      if (rnd() < 0.7) {
        const sh = pick(["shutterB", "shutterG", "shutterR", "plaster2"]);
        put(sh, BOX, face - side * 0.05, 1.25, cz, 0, 0, 0, 0.12, 2.3, w * 0.7);
        if (rnd() < 0.6) put("awning", BOX, face - side * 0.7, 2.75, cz, 0, 0, side * -0.32, 1.5, 0.06, w * 0.75);
        put("sign", BOX, face - side * 0.12, 2.95, cz, 0, 0, 0, 0.08, 0.5, w * 0.55);
      }
      // roof: pagoda tiers on some, flat roof with water tanks and railings on most (very Kathmandu)
      if (rnd() < 0.3) {
        const r1 = new THREE.ConeGeometry(Math.max(d, w) * 0.78, 2.2, 4, 1);
        put("roof", r1, cx, h + 1.1, cz, Math.PI / 4, 0, 0, d / Math.max(d, w), 1, w / Math.max(d, w));
      } else {
        put("trim", rbox(d, 0.25, w - 0.08, 0.05), cx, h + 0.12, cz);
        put("tank", new THREE.CylinderGeometry(0.55, 0.55, 1.1, 14), cx + side * 1.5, h + 0.8, cz + (rnd() - 0.5) * (w - 2));
        if (rnd() < 0.5) put("tank", new THREE.CylinderGeometry(0.45, 0.45, 0.9, 14), cx - side * 1.2, h + 0.7, cz + (rnd() - 0.5) * (w - 2));
        put("wire", BOX, face - side * 0.1, h + 0.75, cz, 0, 0, 0, 0.05, 0.05, w - 0.2);
      }
      z -= w + (rnd() < 0.15 ? 2.5 : 0);
    }
  }

  // the stupa at the end of the street
  for (let i = 0; i < 3; i++) put("white", rbox(26 - i * 5, 1.1, 26 - i * 5, 0.15), 0, 0.55 + i * 1.1, SZ);
  put("white", new THREE.SphereGeometry(9, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), 0, 3.3, SZ);
  put("gold", new THREE.ConeGeometry(2.4, 10, 24, 1, true), 0, 17.3, SZ);
  for (let i = 0; i < 9; i++) put("gold", new THREE.TorusGeometry(2.2 - i * 0.2, 0.12, 6, 24), 0, 13 + i * 1, SZ, 0, Math.PI / 2);
  put("gold", new THREE.ConeGeometry(1.5, 0.6, 24), 0, 22.6, SZ);
  // the painted eyes on the harmika, drawn once into a canvas texture
  const eyes = document.createElement("canvas"); eyes.width = 256; eyes.height = 256;
  {
    const c = eyes.getContext("2d")!;
    c.fillStyle = "#f4efe6"; c.fillRect(0, 0, 256, 256);
    c.lineCap = "round";
    for (const s of [-1, 1]) {
      c.strokeStyle = "#1a1a2a"; c.lineWidth = 7; c.beginPath(); c.moveTo(128 + s * 18, 92); c.quadraticCurveTo(128 + s * 52, 70, 128 + s * 88, 96); c.stroke();
      c.fillStyle = "#ffffff"; c.beginPath(); c.ellipse(128 + s * 52, 118, 34, 15, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#1a1a2a"; c.lineWidth = 4; c.stroke();
      c.fillStyle = "#2a3e8a"; c.beginPath(); c.arc(128 + s * 50, 120, 11, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#111"; c.beginPath(); c.arc(128 + s * 50, 120, 5, 0, Math.PI * 2); c.fill();
    }
    c.strokeStyle = "#d0502a"; c.lineWidth = 8; c.beginPath(); c.moveTo(128, 140); c.bezierCurveTo(150, 150, 150, 185, 128, 200); c.stroke();
    c.fillStyle = "#d0502a"; c.beginPath(); c.arc(128, 64, 8, 0, Math.PI * 2); c.fill();
  }
  const eyeTex = new THREE.CanvasTexture(eyes); eyeTex.colorSpace = THREE.SRGBColorSpace;
  const harmika = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.6, 4.2), new THREE.MeshStandardMaterial({ map: eyeTex, roughness: 0.8 }));
  harmika.position.set(0, 13.2 - 1.8 + 0.1, SZ); harmika.castShadow = true; scene.add(harmika);

  // Himalayas far away (haze makes them pale)
  for (let i = 0; i < 14; i++) {
    const x = -900 + i * 140 + (rnd() - 0.5) * 80, z = -650 - rnd() * 200, h = 160 + rnd() * 170, r = 150 + rnd() * 90;
    put("mountain", new THREE.ConeGeometry(r, h, 7, 1), x, h / 2 - 5, z, rnd() * 3);
    put("snow", new THREE.ConeGeometry(r * 0.34, h * 0.34, 7, 1), x, h - h * 0.17 - 5 + 0.5, z, rnd() * 3);
  }

  // utility poles + tangled power lines
  const poles: THREE.Vector3[] = [];
  for (let z = 2; z > -140; z -= 22) for (const s of [-1, 1]) {
    const x = s * (ROAD + 0.6), zz = z + (s > 0 ? -11 : 0);
    put("concrete", new THREE.CylinderGeometry(0.11, 0.16, 9, 8), x, 4.5, zz);
    put("concrete", BOX, x, 8.4, zz, 0, 0, 0, 1.6, 0.12, 0.12);
    poles.push(new THREE.Vector3(x, 8.4, zz));
  }
  function catenary(a: THREE.Vector3, b: THREE.Vector3, sag: number, r = 0.018) {
    const mid = a.clone().lerp(b, 0.5); mid.y -= sag;
    put("wire", new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 16, r, 4, false), 0, 0, 0);
  }
  const L = poles.filter((p) => p.x < 0), R = poles.filter((p) => p.x > 0);
  for (const row of [L, R]) for (let i = 0; i < row.length - 1; i++) for (let k = 0; k < 4; k++) {
    const o = new THREE.Vector3((k - 1.5) * 0.35, 0, 0);
    catenary(row[i].clone().add(o), row[i + 1].clone().add(o), 0.9 + k * 0.35);
  }
  for (let i = 0; i < Math.min(L.length, R.length); i++) for (let k = 0; k < 3; k++)
    catenary(L[i].clone().add(new THREE.Vector3(0.4, -k * 0.25, 0)), R[i].clone().add(new THREE.Vector3(-0.4, -k * 0.3, 0)), 1.2 + k * 0.4);

  // street lamps (light up at dusk)
  for (let z = -8; z > -140; z -= 26) for (const s of [-1, 1]) {
    const x = s * (ROAD + 0.4), zz = z + (s > 0 ? -13 : 0);
    put("concrete", new THREE.CylinderGeometry(0.06, 0.08, 5.2, 8), x, 2.6, zz);
    put("concrete", BOX, x - s * 0.5, 5.15, zz, 0, 0, 0, 1, 0.08, 0.08);
    put("bulb", new THREE.SphereGeometry(0.18, 12, 8), x - s * 0.95, 4.95, zz);
  }

  // trees
  for (const [x, z] of [[-7, 8], [7.5, -40], [-6.5, -88], [8, -120], [11, -152], [-11, -150]]) {
    put("bark", new THREE.CylinderGeometry(0.16, 0.24, 3.2, 8), x, 1.6, z);
    for (let k = 0; k < 5; k++) put("leaf", new THREE.IcosahedronGeometry(1.3 + rnd() * 0.7, 1), x + (rnd() - 0.5) * 1.8, 3.6 + rnd() * 1.6, z + (rnd() - 0.5) * 1.8);
  }

  // the school gate across the road, in front of the stupa
  for (const s of [-1, 1]) {
    put("plaster", rbox(0.8, 4.2, 0.8, 0.08), s * 3.6, 2.1, GATE_Z);
    put("gold", new THREE.SphereGeometry(0.28, 12, 8), s * 3.6, 4.4, GATE_Z);
  }
  put("trim", rbox(8.2, 0.7, 0.7, 0.06), 0, 3.95, GATE_Z);
  put("sign", BOX, 0, 3.95, GATE_Z + 0.37, 0, 0, 0, 5.6, 0.45, 0.04);

  // the tea shop on the left sidewalk: a counter under an awning
  put("wood", rbox(0.7, 1, 2.4, 0.04), -4.25, 0.66, TEA_Z);
  put("awning", BOX, -4.0, 2.7, TEA_Z, 0, 0, 0.3, 1.6, 0.06, 3);

  // the cyber café's glowing doorway (unlit material, so it glows by day)
  const glow = new THREE.MeshBasicMaterial({ color: 0xffc46b });
  const door = new THREE.Mesh(BOX, glow); door.scale.set(0.12, 2.2, 1.4); door.position.set(WALK - 0.18, 1.26, CAFE_Z);
  const cafeSign = new THREE.Mesh(BOX, glow); cafeSign.scale.set(0.1, 0.4, 2.2); cafeSign.position.set(WALK - 0.15, 3.4, CAFE_Z);
  scene.add(door, cafeSign);

  mergeBuckets(scene, mats);

  // prayer flags across the street (instanced, they flutter)
  const FLAG_COLORS = [0x1e5bb8, 0xf5f1e6, 0xd8262e, 0x2f9e44, 0xf4c20d].map((c) => new THREE.Color(c));
  const flagSpots: { p: THREE.Vector3; dir: THREE.Vector3; c: THREE.Color; ph: number; big?: boolean }[] = [];
  for (let z = 0; z > -130; z -= 13) {
    const a = new THREE.Vector3(-WALK + 0.2, 8.6 + rnd() * 1.5, z), b = new THREE.Vector3(WALK - 0.2, 8.2 + rnd() * 1.5, z - 4 - rnd() * 4);
    const mid = a.clone().lerp(b, 0.5); mid.y -= 1.4;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.012, 4, false), mats.wire));
    const n = 18;
    for (let i = 1; i < n; i++) flagSpots.push({ p: curve.getPoint(i / n), dir: curve.getTangent(i / n), c: FLAG_COLORS[i % 5], ph: rnd() * 6 });
  }
  // stupa flag lines (spire to the ground, like Boudha)
  for (let k = 0; k < 8; k++) {
    const ang = (k / 8) * Math.PI * 2;
    const a = new THREE.Vector3(0, 21, SZ), b = new THREE.Vector3(Math.sin(ang) * 15, 3.4, SZ + Math.cos(ang) * 15);
    const curve = new THREE.QuadraticBezierCurve3(a, a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, -2, 0)), b);
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.02, 4, false), mats.wire));
    for (let i = 1; i < 22; i++) flagSpots.push({ p: curve.getPoint(i / 22), dir: curve.getTangent(i / 22), c: FLAG_COLORS[i % 5], ph: rnd() * 6, big: true });
  }
  const flagGeo = new THREE.PlaneGeometry(0.34, 0.42); flagGeo.translate(0, -0.21, 0);
  const flags = new THREE.InstancedMesh(flagGeo, new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide }), flagSpots.length);
  flags.castShadow = true;
  flagSpots.forEach((f, i) => flags.setColorAt(i, f.c));
  scene.add(flags);
  const fm = new THREE.Matrix4(), fq = new THREE.Quaternion(), fe = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), big = new THREE.Vector3(1.6, 1.6, 1.6);
  function updateFlags(t: number) {
    flagSpots.forEach((f, i) => {
      const yaw = Math.atan2(f.dir.x, f.dir.z) + Math.PI / 2;
      fe.set(Math.sin(t * 2.2 + f.ph) * 0.35, yaw, 0);
      fm.compose(f.p, fq.setFromEuler(fe), f.big ? big : one);
      flags.setMatrixAt(i, fm);
    });
    flags.instanceMatrix.needsUpdate = true;
  }

  // a resting cow and a few parked motorbikes
  {
    const cow = new THREE.Group();
    const cm = M(0xeee7dc), dm = M(0x3a2a22);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.1, 6, 14), cm); body.rotation.z = Math.PI / 2; body.position.y = 0.42; body.scale.set(1, 1, 0.85);
    const head = new THREE.Mesh(rbox(0.36, 0.38, 0.55, 0.1), cm); head.position.set(0.95, 0.68, 0);
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.22, 6), dm); horn.position.set(0.95, 0.92, 0.12);
    const horn2 = horn.clone(); horn2.position.z = -0.12;
    [body, head, horn, horn2].forEach((m) => { m.castShadow = true; cow.add(m); });
    cow.position.set(1.4, 0.01, -18); cow.rotation.y = 2.2; scene.add(cow);
  }
  for (const [x, z, c] of [[2.7, -8, 0xa83a2e], [2.75, -9.4, 0x1b1b22], [-2.7, -33, 0x2f5f9a]]) {
    const b = new THREE.Group();
    const wheel = new THREE.TorusGeometry(0.28, 0.08, 8, 20);
    for (const dz of [-0.62, 0.62]) { const w = new THREE.Mesh(wheel, mats.tank); w.position.set(0, 0.36, dz); w.rotation.y = Math.PI / 2; b.add(w); }
    const bd = new THREE.Mesh(rbox(0.26, 0.32, 1.0, 0.08), M(c, { roughness: 0.35, metalness: 0.3 })); bd.position.set(0, 0.62, 0.05); b.add(bd);
    const st = new THREE.Mesh(rbox(0.24, 0.1, 0.6, 0.04), mats.tank); st.position.set(0, 0.82, 0.25); b.add(st);
    const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6), mats.concrete); hb.rotation.x = Math.PI / 2; hb.rotation.y = Math.PI / 2; hb.position.set(0, 1.0, -0.5); b.add(hb);
    b.children.forEach((m) => (m.castShadow = true));
    b.position.set(x, 0.01, z); b.rotation.y = 0.15; scene.add(b);
  }

  return { glass: mats.glass, bulb: mats.bulb, updateFlags };
}
