import * as THREE from "three";
import type { SequenceSpec } from "../chapters/types";

const curves = new WeakMap<SequenceSpec, { pos: THREE.CatmullRomCurve3; look: THREE.CatmullRomCurve3 }>();
const make = (p: [number, number, number][]) => new THREE.CatmullRomCurve3(p.map((v) => new THREE.Vector3(...v)).concat(p.length === 1 ? [new THREE.Vector3(...p[0])] : []));

/** Where the rail camera is at time t (seconds): position, look target, the subtitle line in force, and progress 0..1. Pure. */
export function sampleSequence(spec: SequenceSpec, t: number) {
  let c = curves.get(spec);
  if (!c) curves.set(spec, (c = { pos: make(spec.points), look: make(spec.look.length ? spec.look : spec.points) }));
  const t01 = spec.duration > 0 ? THREE.MathUtils.clamp(t / spec.duration, 0, 1) : 1;
  let line: { who: string; text: string } | null = null;
  for (const l of spec.lines ?? []) if (l.at <= t) line = { who: l.who, text: l.text };
  return { pos: c.pos.getPoint(t01), look: c.look.getPoint(t01), line, t01 };
}
