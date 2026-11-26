import { MOTION } from "./motion";

// One place for page scrolling, so it goes through Lenis (smooth scrolling) when it is running.
type Smooth = { scrollTo: (y: number) => void } | null;
let smooth: Smooth = null;

export const setSmoothScroller = (s: Smooth) => { smooth = s; };

export function scrollToY(y: number) {
  if (smooth) smooth.scrollTo(y);
  else scrollTo({ top: y, behavior: MOTION.on ? "smooth" : "auto" });
}

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
