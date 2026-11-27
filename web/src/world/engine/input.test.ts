// @vitest-environment jsdom
import { expect, it } from "vitest";
import { createInput, stickVector } from "./input";

const ptr = (el: Element, type: string, id: number, x: number, y: number, pointerType = "touch") => {
  const e = new MouseEvent(type, { clientX: x, clientY: y, bubbles: true });
  Object.defineProperty(e, "pointerId", { value: id });
  Object.defineProperty(e, "pointerType", { value: pointerType });
  el.dispatchEvent(e);
};

it("stickVector clamps to the radius", () => {
  expect(stickVector(100, 0)).toEqual({ x: 1, y: 0 });
  expect(stickVector(25, 0)).toEqual({ x: 0.5, y: 0 });
});

it("releases keys on window blur", () => {
  const input = createInput(document.createElement("div"));
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "w" }));
  expect(input.state().move.y).toBe(1);
  window.dispatchEvent(new Event("blur"));
  expect(input.state().move.y).toBe(0);
  input.dispose();
});

it("lifting the stick finger leaves the look finger working", () => {
  const el = document.createElement("div");
  (el as any).setPointerCapture = () => {};
  const input = createInput(el);
  const w = window.innerWidth;
  ptr(el, "pointerdown", 1, w * 0.2, 300); // stick
  ptr(el, "pointerdown", 2, w * 0.8, 300); // look
  ptr(el, "pointermove", 1, w * 0.2 + 50, 300);
  expect(input.state().move.x).toBe(1);
  ptr(el, "pointerup", 1, w * 0.2 + 50, 300);
  expect(input.state().move.x).toBe(0);
  ptr(el, "pointermove", 2, w * 0.8 + 10, 310);
  expect(input.state().lookDX).toBe(10);
  expect(input.state().lookDY).toBe(10);
  input.consumeLook();
  expect(input.state().lookDX).toBe(0);
  input.dispose();
});
