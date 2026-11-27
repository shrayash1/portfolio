export interface InputState { move: { x: number; y: number }; run: boolean; lookDX: number; lookDY: number; interact: boolean; pause: boolean }

export function stickVector(dx: number, dy: number, radius = 50) {
  const l = Math.hypot(dx, dy);
  const k = l > radius ? radius / l : 1;
  return { x: (dx * k) / radius, y: (dy * k) / radius };
}

const FWD = ["w", "arrowup"], BACK = ["s", "arrowdown"], RIGHT = ["d", "arrowright"], LEFT = ["a", "arrowleft"];

export function createInput(el: HTMLElement) {
  const keys = new Set<string>();
  const joy = { id: -1, ox: 0, oy: 0, x: 0, y: 0 };
  const look = { id: -1, x: 0, y: 0 };
  let lookDX = 0, lookDY = 0, interact = false, pause = false;
  const any = (ks: string[]) => (ks.some((k) => keys.has(k)) ? 1 : 0);

  const onKeyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
    if (k === "e" && !e.repeat) interact = true;
    if (k === "escape" && !e.repeat) pause = true;
    keys.add(k);
  };
  const onKeyUp = (e: KeyboardEvent) => void keys.delete(e.key.toLowerCase());
  const onBlur = () => keys.clear();
  const onDown = (e: PointerEvent) => {
    el.setPointerCapture?.(e.pointerId);
    if (e.pointerType === "touch" && e.clientX < innerWidth / 2 && joy.id < 0) Object.assign(joy, { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: 0, y: 0 });
    else if (look.id < 0) Object.assign(look, { id: e.pointerId, x: e.clientX, y: e.clientY });
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerId === joy.id) Object.assign(joy, stickVector(e.clientX - joy.ox, e.clientY - joy.oy));
    else if (e.pointerId === look.id) {
      lookDX += e.clientX - look.x; lookDY += e.clientY - look.y;
      look.x = e.clientX; look.y = e.clientY;
    }
  };
  const onUp = (e: PointerEvent) => {
    if (e.pointerId === joy.id) Object.assign(joy, { id: -1, x: 0, y: 0 });
    if (e.pointerId === look.id) look.id = -1;
  };

  addEventListener("keydown", onKeyDown); addEventListener("keyup", onKeyUp); addEventListener("blur", onBlur);
  el.addEventListener("pointerdown", onDown as EventListener); el.addEventListener("pointermove", onMove as EventListener);
  el.addEventListener("pointerup", onUp as EventListener); el.addEventListener("pointercancel", onUp as EventListener);

  return {
    // interact and pause are one-shot: reading them clears them
    state(): InputState {
      const s = {
        move: { x: any(RIGHT) - any(LEFT) + joy.x, y: any(FWD) - any(BACK) - joy.y },
        run: keys.has("shift"), lookDX, lookDY, interact, pause,
      };
      interact = pause = false;
      return s;
    },
    consumeLook() { lookDX = lookDY = 0; },
    dispose() {
      removeEventListener("keydown", onKeyDown); removeEventListener("keyup", onKeyUp); removeEventListener("blur", onBlur);
      el.removeEventListener("pointerdown", onDown as EventListener); el.removeEventListener("pointermove", onMove as EventListener);
      el.removeEventListener("pointerup", onUp as EventListener); el.removeEventListener("pointercancel", onUp as EventListener);
    },
  };
}
