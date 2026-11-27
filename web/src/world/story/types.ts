export type Era = "school" | "college" | "me";

export interface ChapterInfo {
  id: number;
  en: string;
  dv: string;
  place: string;
  years: string;
  era: Era;
  available: boolean;
}

export interface DialogueLine {
  who: string;
  text: string;
}

export interface Objective {
  id: string;
  text: string;
  optional?: boolean;
}

export interface Interactable {
  id: string;
  label: string;
  position: [number, number, number];
  radius?: number; // defaults to 2.2 where used
  dialogue?: DialogueLine[];
  completes?: string; // objective id completed when triggered
}
