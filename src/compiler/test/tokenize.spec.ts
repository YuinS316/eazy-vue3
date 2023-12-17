import { it, expect, describe } from "vitest";
import { tokenize } from "../tokenize";

describe("tokenize", () => {
  it("should work on simple tag", () => {
    const tokens = tokenize(`<p>Vue</p>`);
    expect(tokens).toEqual([
      { type: "tag", name: "p" },
      { type: "text", content: "Vue" },
      { type: "tagEnd", name: "p" },
    ]);
  });

  it("should work on tree", () => {
    const tokens = tokenize(`<div><p>Vue</p><p>Template</p></div>`);
    expect(tokens).toEqual([
      { type: "tag", name: "div" },
      { type: "tag", name: "p" },
      { type: "text", content: "Vue" },
      { type: "tagEnd", name: "p" },
      { type: "tag", name: "p" },
      { type: "text", content: "Template" },
      { type: "tagEnd", name: "p" },
      { type: "tagEnd", name: "div" },
    ]);
  });
});
