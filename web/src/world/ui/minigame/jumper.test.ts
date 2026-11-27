import { describe, expect, it } from "vitest";
import { create, step, GOAL, GRAVITY, JUMP, PX, SIZE } from "./jumper";

const run = (s: ReturnType<typeof create>, secs: number, jump = (_: ReturnType<typeof create>) => false) => {
  for (let t = 0; t < secs; t += 1 / 60) step(s, 1 / 60, jump(s));
  return s;
};

describe("the square that jumps", () => {
  it("jumps only from the ground and lands again", () => {
    const s = create(1);
    step(s, 1 / 60, true);
    expect(s.vy).toBeCloseTo(JUMP - GRAVITY / 60); // launched, with this frame's gravity already applied
    expect(s.y).toBeGreaterThan(0);
    run(s, 0.2);
    const vy = s.vy;
    step(s, 1 / 60, true); // no double jump
    expect(s.vy).toBeLessThan(vy);
    expect(s.y).toBeGreaterThan(30);
    run(s, 1);
    expect(s.y).toBe(0);
    expect(s.vy).toBe(0);
  });

  it("a hit restarts the run: score back to 0, blocks gone", () => {
    const s = create(1);
    s.score = 3;
    s.blocks.push({ x: PX + 2, w: 16, h: 24, passed: false });
    step(s, 1 / 60, false);
    expect(s.score).toBe(0);
    expect(s.blocks).toHaveLength(0);
    expect(s.flash).toBeGreaterThan(0);
  });

  it("scores a block once it is behind the square", () => {
    const s = create(1);
    s.y = 200; // well above it
    s.blocks.push({ x: PX - 17, w: 16, h: 24, passed: false });
    step(s, 1 / 60, false);
    expect(s.score).toBe(1);
    step(s, 1 / 60, false);
    expect(s.score).toBe(1);
  });

  it(`wins at ${GOAL} blocks with sensible timing, then stops`, () => {
    const s = create(7);
    const bot = (q: typeof s) => q.blocks.some((b) => b.x - (PX + SIZE) > 0 && b.x - (PX + SIZE) < 20);
    run(s, 60, bot);
    expect(s.won).toBe(true);
    expect(s.score).toBe(GOAL);
    const before = JSON.stringify(s);
    step(s, 0.5, true);
    expect(JSON.stringify(s)).toBe(before);
  });

  it("never wins if you never jump", () => {
    expect(run(create(3), 30).won).toBe(false);
  });
});
