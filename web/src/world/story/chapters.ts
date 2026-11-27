import type { ChapterInfo } from "./types";

// `years` and chapter 2-7 `dv` are placeholders until the owner supplies real text.
export const CHAPTERS: ChapterInfo[] = [
  { id: 1, en: "School days", dv: "बाल्यकाल", place: "Kathmandu", years: "", era: "school", available: true },
  { id: 2, en: "Engineer in training", dv: "", place: "NCIT, Lalitpur", years: "", era: "college", available: false },
  { id: 3, en: "First studio", dv: "", place: "Neo Digital, Maitidevi", years: "", era: "college", available: false },
  { id: 4, en: "Team lead", dv: "", place: "Danson, Gairidhara", years: "", era: "college", available: false },
  { id: 5, en: "The yeti", dv: "", place: "DarkMatter, Baneshwor", years: "", era: "me", available: false },
  { id: 6, en: "Take-off", dv: "", place: "Kathmandu → USA", years: "", era: "me", available: false },
  { id: 7, en: "Now", dv: "", place: "Maryland", years: "", era: "me", available: false },
];
