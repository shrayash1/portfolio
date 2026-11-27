import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { CHILD, DAMP, MAP, retarget } from "./retarget";

const AVATURN_BONES = [
  "Hips", "Spine", "Spine1", "Spine2", "Neck", "Head", "HeadTop_End",
  ...["Left", "Right"].flatMap((s) => [
    `${s}Shoulder`, `${s}Arm`, `${s}ForeArm`, `${s}Hand`, `${s}UpLeg`, `${s}Leg`, `${s}Foot`, `${s}ToeBase`, `${s}Toe_End`,
    ...["Thumb", "Index", "Middle", "Ring", "Pinky"].flatMap((f) => [1, 2, 3, 4].map((k) => `${s}Hand${f}${k}`)),
  ]),
];

const bone = (name: string, y = 0) => { const b = new THREE.Bone(); b.name = name; b.position.set(0, y, 0); return b; };
const chain = (a: string, b: string) => { const root = new THREE.Group(), p = bone(a, 1), c = bone(b, 0.5); root.add(p); p.add(c); return { root, p, c }; };

describe("retarget tables", () => {
  it("MAP only targets avatar bones", () => {
    for (const v of Object.values(MAP)) expect(AVATURN_BONES).toContain(v);
  });
  it("CHILD only uses MAP keys", () => {
    for (const [k, v] of Object.entries(CHILD)) { expect(MAP).toHaveProperty(k); expect(MAP).toHaveProperty(v); }
  });
});

describe("retarget", () => {
  it("applies the damped spine rotation to the target bone", () => {
    const src = chain("pelvis", "spine_01"), tgt = chain("Hips", "Spine");
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(30));
    // 2 s clip peaking at 30 degrees at t = 1 s (a looping clip wraps back to rest at its very end)
    const clip = new THREE.AnimationClip("t", 2, [new THREE.QuaternionKeyframeTrack("spine_01.quaternion", [0, 1, 2], [0, 0, 0, 1, q.x, q.y, q.z, q.w, 0, 0, 0, 1])]);
    const [out] = retarget(tgt.root, src.root, [clip], 30);
    expect(DAMP.spine_01).toBe(0.7);
    const track = out.tracks.find((t) => t.name === `${tgt.c.uuid}.quaternion`)!;
    expect(track).toBeDefined();
    const v = track.values.slice(30 * 4, 30 * 4 + 4); // frame at t = 1 s
    const deg = THREE.MathUtils.radToDeg(new THREE.Quaternion().fromArray(v as unknown as number[]).angleTo(new THREE.Quaternion()));
    expect(Math.abs(deg - 21)).toBeLessThan(0.5);
  });
});
