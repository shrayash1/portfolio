import * as THREE from "three";

// Mesh2Motion uses Unreal-style bone names, the avatar uses Mixamo-style ones, so each clip is
// retargeted once at load: every frame, each source bone's world rotation change from its rest pose
// is applied to the matching avatar bone (after lining the avatar's rest pose up with the source's).
export const MAP: Record<string, string> = { pelvis: "Hips", spine_01: "Spine", spine_02: "Spine1", spine_03: "Spine2", neck_01: "Neck", head: "Head", head_leaf: "HeadTop_End" };
for (const [s, side] of [["l", "Left"], ["r", "Right"]]) {
  Object.assign(MAP, {
    [`clavicle_${s}`]: `${side}Shoulder`, [`upperarm_${s}`]: `${side}Arm`, [`lowerarm_${s}`]: `${side}ForeArm`, [`hand_${s}`]: `${side}Hand`,
    [`thigh_${s}`]: `${side}UpLeg`, [`calf_${s}`]: `${side}Leg`, [`foot_${s}`]: `${side}Foot`, [`ball_${s}`]: `${side}ToeBase`, [`ball_leaf_${s}`]: `${side}Toe_End`,
  });
  for (const f of ["thumb", "index", "middle", "ring", "pinky"]) {
    const F = f[0].toUpperCase() + f.slice(1);
    for (let k = 1; k <= 3; k++) MAP[`${f}_0${k}_${s}`] = `${side}Hand${F}${k}`;
    MAP[`${f}_04_leaf_${s}`] = `${side}Hand${F}4`;
  }
}
const INV: Record<string, string> = Object.fromEntries(Object.entries(MAP).map(([s, t]) => [t, s]));

// the child each bone points at, used to line the rest poses up
export const CHILD: Record<string, string> = { spine_01: "spine_02", spine_02: "spine_03", spine_03: "neck_01", neck_01: "head", head: "head_leaf" };
for (const s of ["l", "r"]) {
  Object.assign(CHILD, {
    [`clavicle_${s}`]: `upperarm_${s}`, [`upperarm_${s}`]: `lowerarm_${s}`, [`lowerarm_${s}`]: `hand_${s}`, [`hand_${s}`]: `middle_01_${s}`,
    [`thigh_${s}`]: `calf_${s}`, [`calf_${s}`]: `foot_${s}`, [`foot_${s}`]: `ball_${s}`, [`ball_${s}`]: `ball_leaf_${s}`,
  });
  for (const f of ["thumb", "index", "middle", "ring", "pinky"]) {
    CHILD[`${f}_01_${s}`] = `${f}_02_${s}`; CHILD[`${f}_02_${s}`] = `${f}_03_${s}`; CHILD[`${f}_03_${s}`] = `${f}_04_leaf_${s}`;
  }
}

// share of each clip's torso movement to keep: Mesh2Motion's idle and walk carry a slouched upper back that
// rolled the avatar's shoulders forward; the avatar's own upright posture wins, the sway still comes through
export const DAMP: Record<string, number> = { spine_01: 0.7, spine_02: 0.45, spine_03: 0.35, neck_01: 0.4, head: 0.5, clavicle_l: 0.5, clavicle_r: 0.5 };
export const ARM_FORWARD_DEG = 6; // how far the upper arms hang forward of the source's arm line
export const SHOULDER_FORWARD_DEG = 20; // how far the collarbones bring the shoulder joints forward
const IDENT = new THREE.Quaternion();

export function retarget(target: THREE.Object3D, source: THREE.Object3D, clips: THREE.AnimationClip[], fps = 30): THREE.AnimationClip[] {
  const V = () => new THREE.Vector3(), Q = () => new THREE.Quaternion();
  const S = (n: string) => source.getObjectByName(n);
  const desc = (o: THREE.Object3D, name: string) => { let hit: THREE.Object3D | null = null; o.traverse((c) => { if (!hit && c !== o && c.name === name) hit = c; }); return hit as THREE.Object3D | null; };
  source.updateMatrixWorld(true); target.updateMatrixWorld(true);
  const bones: THREE.Object3D[] = []; target.traverse((o) => { if ((o as THREE.Bone).isBone && INV[o.name] && S(INV[o.name])) bones.push(o); }); // parents before children
  // line the avatar's rest pose up with the source's, but only for arms, legs and fingers: the torso, neck
  // and head keep the avatar's own posture (its neck has three bones where the source has one, and forcing
  // those directions to match tipped the head forward into a hunch)
  // (collarbones too: matching them pulled the shoulders back)
  const KEEP_OWN = new Set(["spine_01", "spine_02", "spine_03", "neck_01", "head", "clavicle_l", "clavicle_r"]);
  for (const t of bones) {
    const sn = INV[t.name], sc = CHILD[sn]; if (!sc || KEEP_OWN.has(sn)) continue;
    const s = S(sn), s2 = S(sc), t2 = desc(t, MAP[sc]); if (!s || !s2 || !t2) continue;
    const dS = s2.getWorldPosition(V()).sub(s.getWorldPosition(V())).normalize();
    const dT = t2.getWorldPosition(V()).sub(t.getWorldPosition(V())).normalize();
    const w = Q().setFromUnitVectors(dT, dS).multiply(t.getWorldQuaternion(Q()));
    t.quaternion.copy(t.parent!.getWorldQuaternion(Q()).invert().multiply(w)); t.updateMatrixWorld(true);
  }
  // bring the arms slightly forward from the shoulder so they hang and swing in front of the body line
  // (the avatar faces +z here, so a turn about -x tips the arm towards +z)
  // first roll the collarbones forward (the shoulder tips come forward), then tip the upper arms forward;
  // the avatar's left side is +x, so the left collarbone turns by -angle about +y and the right by +angle
  const up = new THREE.Vector3(0, 1, 0);
  for (const t of bones) {
    const side = INV[t.name] === "clavicle_l" ? -1 : INV[t.name] === "clavicle_r" ? 1 : 0;
    if (!side) continue;
    const w = Q().setFromAxisAngle(up, side * THREE.MathUtils.degToRad(SHOULDER_FORWARD_DEG)).multiply(t.getWorldQuaternion(Q()));
    t.quaternion.copy(t.parent!.getWorldQuaternion(Q()).invert().multiply(w)); t.updateMatrixWorld(true);
  }
  const tilt = Q().setFromAxisAngle(new THREE.Vector3(-1, 0, 0), THREE.MathUtils.degToRad(ARM_FORWARD_DEG));
  for (const t of bones) if (INV[t.name] === "upperarm_l" || INV[t.name] === "upperarm_r") {
    // undo the collarbone's turn on the arm itself: the shoulder joint moves forward, the arm keeps its hang
    const side = INV[t.name] === "upperarm_l" ? -1 : 1;
    const undo = Q().setFromAxisAngle(up, -side * THREE.MathUtils.degToRad(SHOULDER_FORWARD_DEG));
    const w = tilt.clone().multiply(undo).multiply(t.getWorldQuaternion(Q()));
    t.quaternion.copy(t.parent!.getWorldQuaternion(Q()).invert().multiply(w)); t.updateMatrixWorld(true);
  }
  const restT = new Map(bones.map((t) => [t, t.getWorldQuaternion(Q())]));
  const restS = new Map(bones.map((t) => [t, S(INV[t.name])!.getWorldQuaternion(Q()).invert()]));
  const sHip = S("pelvis")!, tHip = bones.find((b) => b.name === "Hips")!;
  const sHip0 = sHip.getWorldPosition(V()), tHip0 = tHip.getWorldPosition(V()), ratio = tHip0.y / Math.max(sHip0.y, 0.01);
  return clips.map((clip) => {
    const mixer = new THREE.AnimationMixer(source); mixer.clipAction(clip).play();
    const n = Math.max(2, Math.round(clip.duration * fps) + 1), times = new Float32Array(n);
    const qv = new Map(bones.map((t) => [t, new Float32Array(n * 4)])), hip = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const time = Math.min(clip.duration, i / fps); times[i] = time;
      mixer.setTime(time); source.updateMatrixWorld(true);
      for (const t of bones) {
        // how far this bone turned from its rest pose in the clip, in world space
        const delta = S(INV[t.name])!.getWorldQuaternion(Q()).multiply(restS.get(t)!);
        const k = DAMP[INV[t.name]];
        if (k !== undefined) delta.slerp(IDENT, 1 - k); // keep only part of the clip's slouch on the torso
        const tw = delta.multiply(restT.get(t)!);
        t.quaternion.copy(t.parent!.getWorldQuaternion(Q()).invert().multiply(tw)); t.updateMatrixWorld(true);
        qv.get(t)!.set(t.quaternion.toArray(), i * 4);
      }
      const p = tHip.parent!.worldToLocal(tHip0.clone().add(sHip.getWorldPosition(V()).sub(sHip0).multiplyScalar(ratio)));
      tHip.position.copy(p); tHip.updateMatrixWorld(true); hip.set(p.toArray(), i * 3);
    }
    mixer.stopAllAction(); mixer.uncacheRoot(source);
    const tracks: THREE.KeyframeTrack[] = [...qv].map(([t, v]) => new THREE.QuaternionKeyframeTrack(`${t.uuid}.quaternion`, times as unknown as number[], v as unknown as number[]));
    tracks.push(new THREE.VectorKeyframeTrack(`${tHip.uuid}.position`, times as unknown as number[], hip as unknown as number[]));
    return new THREE.AnimationClip(clip.name, clip.duration, tracks);
  });
}
