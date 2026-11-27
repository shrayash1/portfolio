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
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable: progress just isn't kept */
  }
}
