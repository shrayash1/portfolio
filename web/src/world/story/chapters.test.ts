import { expect, it } from "vitest";
import { CHAPTERS } from "./chapters";

it("has 7 chapters, only the first available", () => {
  expect(CHAPTERS).toHaveLength(7);
  expect(CHAPTERS[0]).toEqual({
    id: 1, en: "School days", dv: "बाल्यकाल", place: "Kathmandu", years: "",
    era: "school", available: true,
  });
  expect(CHAPTERS.slice(1).every((c) => !c.available)).toBe(true);
});

it("chapters 2-7 have the right titles, eras and places", () => {
  const rest = CHAPTERS.slice(1);
  expect(rest.map((c) => c.en)).toEqual(["Engineer in training", "First studio", "Team lead", "The yeti", "Take-off", "Now"]);
  expect(rest.map((c) => c.era)).toEqual(["college", "college", "college", "me", "me", "me"]);
  expect(rest.map((c) => c.place)).toEqual(["NCIT, Lalitpur", "Neo Digital, Maitidevi", "Danson, Gairidhara", "DarkMatter, Baneshwor", "Kathmandu → USA", "Maryland"]);
});
