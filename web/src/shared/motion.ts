// Motion is on by default, even when the device asks for reduced motion; the switch on the page turns it off.
// The choice is saved in this browser. Read once per page load; flipping the switch reloads the page.

function read() {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem("sp-motion");
  } catch {
    /* storage blocked: motion stays on */
  }
  return { on: saved !== "off" };
}

export const MOTION = read();
document.documentElement.classList.toggle("still", !MOTION.on);

export function setMotion(on: boolean) {
  try {
    localStorage.setItem("sp-motion", on ? "on" : "off");
  } catch {
    /* ignore: the page simply reloads with motion on */
  }
  location.reload();
}

/** Waits, but barely at all when motion is off. */
export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, MOTION.on ? ms : Math.min(ms, 60)));

/** True on phones and tablets (no mouse hover). */
export const TOUCH = !matchMedia("(hover: hover)").matches;
