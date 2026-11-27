import type { DialogueLine } from "./story/types";

export type UiState = { objective: string | null; prompt: string | null; dialogue: DialogueLine | null; note: string | null; loading: boolean };

let state: UiState = { objective: null, prompt: null, dialogue: null, note: null, loading: false };
const subs = new Set<(s: UiState) => void>();

export const store = {
  get: () => state,
  set(p: Partial<UiState>) {
    state = { ...state, ...p };
    subs.forEach((fn) => fn(state));
  },
  subscribe(fn: (s: UiState) => void) {
    subs.add(fn);
    return () => void subs.delete(fn);
  },
};
