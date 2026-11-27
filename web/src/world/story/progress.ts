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

export function saveProgress(p: Progress): void {
  const done = [...new Set([...loadProgress().done, ...p.done])].sort((a, b) => a - b); // never forget a finished chapter
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...p, done }));
  } catch {
    /* storage unavailable: progress just isn't kept */
  }
}
