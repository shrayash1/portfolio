import { afterEach, expect, it, vi } from "vitest";
import { loadProgress, pickChapter, saveProgress } from "./progress";

afterEach(() => vi.unstubAllGlobals());

it("survives a throwing localStorage", () => {
  const boom = () => { throw new Error("blocked"); };
  vi.stubGlobal("localStorage", { getItem: boom, setItem: boom });
  expect(loadProgress()).toEqual({ lastChapter: 1, done: [] });
  expect(() => saveProgress({ lastChapter: 2, done: [1] })).not.toThrow();
});

it("round-trips progress", () => {
  const m = new Map<string, string>();
  vi.stubGlobal("localStorage", { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) });
  saveProgress({ lastChapter: 2, done: [1] });
  expect(loadProgress()).toEqual({ lastChapter: 2, done: [1] });
});

it("saveProgress keeps chapters done earlier", () => {
  const m = new Map<string, string>();
  vi.stubGlobal("localStorage", { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) });
  saveProgress({ lastChapter: 1, done: [1] });
  saveProgress({ lastChapter: 2, done: [2] });
  expect(loadProgress()).toEqual({ lastChapter: 2, done: [1, 2] });
});

it("pickChapter falls back to 1 for an unknown saved chapter", () => {
  expect(pickChapter(1, { 1: {} })).toBe(1);
  expect(pickChapter(9, { 1: {} })).toBe(1);
  expect(pickChapter(2, { 1: {}, 2: {} })).toBe(2);
});
