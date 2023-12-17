import { it, expect, describe } from "vitest";
import { parser } from "../parser";

describe("parser", () => {
  it("should work on simple tag", () => {
    const templateAST = parser(`<div>app</div>`);
    expect(templateAST).toEqual({
      type: "Root",
      children: [
        {
          type: "Element",
          tag: "div",
          children: [
            {
              type: "Text",
              content: "app",
            },
          ],
        },
      ],
    });
  });

  it("should work on tree tag", () => {
    const templateAST = parser(`<div><p>Vue</p><p>Template</p></div>`);
    expect(templateAST).toEqual({
      type: "Root",
      children: [
        {
          type: "Element",
          tag: "div",
          children: [
            {
              type: "Element",
              tag: "p",
              children: [
                {
                  type: "Text",
                  content: "Vue",
                },
              ],
            },
            {
              type: "Element",
              tag: "p",
              children: [
                {
                  type: "Text",
                  content: "Template",
                },
              ],
            },
          ],
        },
      ],
    });
  });
});
