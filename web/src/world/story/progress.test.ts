import { afterEach, expect, it, vi } from "vitest";
import { loadProgress, nextChapter, pickChapter, saveProgress } from "./progress";
import { CHAPTERS } from "./chapters";

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

it("nextChapter is the following chapter only when it is registered and available", () => {
  expect(nextChapter(1, { 1: {}, 2: {} }, CHAPTERS)).toBe(2);
  expect(nextChapter(1, { 1: {} }, CHAPTERS)).toBeNull(); // not registered yet
  expect(nextChapter(5, { 5: {}, 6: {} }, CHAPTERS)).toBeNull(); // coming soon
  expect(nextChapter(7, { 7: {} }, CHAPTERS)).toBeNull();
});
