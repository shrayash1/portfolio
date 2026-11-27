// "The square that jumps": the owner's first game, as a tiny pure simulation. Units are canvas pixels on a W × H
// screen; y is the square's height above the ground (up is +). step() mutates the state and returns it.
export const W = 320, H = 180, GROUND = 146; // GROUND: the screen row the ground line is drawn at
export const PX = 56, SIZE = 18; // the square's left edge and size
export const GRAVITY = 1500, JUMP = 520, SPEED = 150; // px/s², px/s, px/s
export const GOAL = 5;
const START_GAP = 170;

export interface Block { x: number; w: number; h: number; passed: boolean }
export interface Jumper { y: number; vy: number; blocks: Block[]; score: number; won: boolean; gap: number; seed: number; flash: number; t: number }

export const create = (seed = 1): Jumper => ({ y: 0, vy: 0, blocks: [], score: 0, won: false, gap: START_GAP, seed, flash: 0, t: 0 });

const rnd = (s: Jumper) => (s.seed = (s.seed * 16807) % 2147483647 || 1) / 2147483647;

export function step(s: Jumper, dt: number, jump: boolean): Jumper {
  if (s.won) return s;
  dt = Math.min(dt, 0.05);
  s.t += dt;
  s.flash = Math.max(0, s.flash - dt);
  // the square: jump from the ground only, then fall
  if (jump && s.y <= 0) s.vy = JUMP;
  if (s.y > 0 || s.vy > 0) {
    s.vy -= GRAVITY * dt; s.y += s.vy * dt;
    if (s.y <= 0) { s.y = 0; s.vy = 0; }
  }
  // the blocks scroll in from the right, spaced by a random gap
  if ((s.gap -= SPEED * dt) <= 0) {
    s.blocks.push({ x: W, w: 12 + Math.round(rnd(s) * 12), h: 16 + Math.round(rnd(s) * 18), passed: false });
    s.gap = 150 + rnd(s) * 120;
  }
  for (const b of s.blocks) {
    b.x -= SPEED * dt;
    // a hit (with 2 px of forgiveness): the run starts over
    if (PX + 2 < b.x + b.w && PX + SIZE - 2 > b.x && s.y + 2 < b.h) {
      Object.assign(s, { y: 0, vy: 0, blocks: [], score: 0, gap: START_GAP, flash: 0.6 });
      return s;
    }
    if (!b.passed && b.x + b.w < PX) {
      b.passed = true;
      if (++s.score >= GOAL) { s.won = true; return s; }
    }
  }
  s.blocks = s.blocks.filter((b) => b.x + b.w > 0);
  return s;
}
