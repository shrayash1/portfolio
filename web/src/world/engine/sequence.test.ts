import { describe, expect, it } from "vitest";
import { sampleSequence } from "./sequence";

const spec = {
  points: [[0, 1, 0], [4, 2, 4], [8, 1, 0]] as [number, number, number][],
  look: [[0, 0, 0], [8, 0, 0]] as [number, number, number][],
  duration: 10,
  lines: [{ at: 2, who: "A", text: "one" }, { at: 6, who: "B", text: "two" }],
};

describe("sampleSequence", () => {
  it("starts on the first point and ends on the last", () => {
    const a = sampleSequence(spec, 0), b = sampleSequence(spec, 10);
    expect(a.pos.toArray()).toEqual([0, 1, 0]);
    b.pos.toArray().forEach((v, i) => expect(v).toBeCloseTo([8, 1, 0][i]));
    expect(a.look.toArray()).toEqual([0, 0, 0]);
    expect(b.look.toArray()).toEqual([8, 0, 0]);
    expect([a.t01, b.t01]).toEqual([0, 1]);
  });
  it("clamps time outside the sequence", () => {
    expect(sampleSequence(spec, -3).t01).toBe(0);
    expect(sampleSequence(spec, 99).t01).toBe(1);
  });
  it("picks the latest line with at <= t, or none before the first", () => {
    expect(sampleSequence(spec, 1).line).toBeNull();
    expect(sampleSequence(spec, 2).line).toEqual({ who: "A", text: "one" });
    expect(sampleSequence(spec, 7).line).toEqual({ who: "B", text: "two" });
  });
});
