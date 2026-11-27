export interface Progress {
  lastChapter: number;
  done: number[];
}

const KEY = "journey-progress";

export function loadProgress(): Progress {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (p && typeof p.lastChapter === "number" && Array.isArray(p.done)) return p;
  } catch {
    /* blocked or corrupt storage: start fresh */
  }
  return { lastChapter: 1, done: [] };
}

/** Saved progress may name a chapter that no longer exists: fall back to chapter 1. */
export const pickChapter = (id: number, scenes: Record<number, unknown>): number => (scenes[id] ? id : 1);

export function saveProgress(p: Progress): void {
  const done = [...new Set([...loadProgress().done, ...p.done])].sort((a, b) => a - b); // never forget a finished chapter
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...p, done }));
  } catch {
    /* storage unavailable: progress just isn't kept */
  }
}

/** The chapter after `id`, only if it is built (registered) and available; else null. */
export const nextChapter = (id: number, scenes: Record<number, unknown>, chapters: { id: number; available: boolean }[]): number | null =>
  scenes[id + 1] && chapters.find((c) => c.id === id + 1)?.available ? id + 1 : null;
