import { MOTION, setMotion } from "./motion";

/** Turns the site animations off (or back on); the choice is saved in this browser. */
export function MotionToggle({ className = "mtoggle" }: { className?: string }) {
  const label = MOTION.on ? "Motion on" : "Motion off · turn on";
  return (
    <button type="button" className={className} aria-pressed={MOTION.on} onClick={() => setMotion(!MOTION.on)}>
      <i />
      <span>{label}</span>
    </button>
  );
}
