import { expect, it } from "vitest";
import { CHAPTERS } from "./chapters";

it("has 7 chapters, 1-5 available and 6-7 coming soon", () => {
  expect(CHAPTERS).toHaveLength(7);
  expect(CHAPTERS[0]).toEqual({
    id: 1, en: "School days", dv: "बाल्यकाल", place: "Gyaneshwor, Kathmandu", years: "Childhood",
    era: "school", available: true,
  });
  expect(CHAPTERS.map((c) => c.available)).toEqual([true, true, true, true, true, false, false]);
});

it("chapters 2-7 have the right titles, eras and places", () => {
  const rest = CHAPTERS.slice(1);
  expect(rest.map((c) => c.en)).toEqual(["Engineer in training", "First studio", "Team lead", "The yeti", "Take-off", "Now"]);
  expect(rest.map((c) => c.era)).toEqual(["college", "college", "college", "me", "me", "me"]);
  expect(rest.map((c) => c.place)).toEqual(["NCIT, Lalitpur", "Neo Digital, Maitidevi", "Danson, Gairidhara", "DarkMatter, Baneshwor", "Kathmandu → USA", "Maryland"]);
});

it("has the agreed years and Devanagari titles", () => {
  expect(CHAPTERS.map((c) => c.years)).toEqual(["Childhood", "2017–2022", "2022–2023", "2023", "2024", "2024", "2024–now"]);
  expect(CHAPTERS.map((c) => c.dv)).toEqual(["बाल्यकाल", "शिक्षा", "पहिलो काम", "नेतृत्व", "यती", "बिदाइ", "अहिले"]);
});
