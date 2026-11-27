import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ChapterSelect } from "./ChapterSelect";

it("with Milestone 1 progress, Ch.1 is Completed and Ch.2-5 are enabled", () => {
  const html = renderToStaticMarkup(<ChapterSelect done={[1]} onPick={() => {}} onBack={() => {}} />);
  const tiles = html.split("<li").slice(1);
  expect(tiles).toHaveLength(7);
  expect(tiles[0]).toContain("Completed");
  expect(tiles[0]).not.toContain("disabled");
  for (const i of [1, 2, 3, 4]) expect(tiles[i]).not.toContain("disabled");
  for (const i of [5, 6]) { expect(tiles[i]).toContain("disabled"); expect(tiles[i]).toContain("Coming soon"); }
});
