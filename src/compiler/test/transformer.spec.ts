import { it, expect, describe, vi } from "vitest";
import { ElementNode, parser, TextNode } from "../parser";
import { Context, transformer } from "../transformer";

describe("transformer", () => {
  //  替换标签类型
  function transformElement(node: ElementNode, context: Context) {
    if (node.type === "Element" && node.tag === "p") {
      // node.tag = "h1";
      context.replaceNode({
        ...node,
        type: "Element",
        tag: "h1",
      });
    }
  }

  //  文本内容重复
  function transformText(node: TextNode, context: Context) {
    if (node.type === "Text") {
      node.content = node.content.repeat(2);
    }
  }

  //  移除掉
  function removeTextNode(node: TextNode, context: Context) {
    if (node.type === "Text" && node.content === "Vue") {
      context.removeNode();
    }

    return () => {
      console.log("remove");
    };
  }

  it("should transformElement work", () => {
    const templateAST = parser(`<div><p>Vue</p><p>Template</p></div>`);
    transformer(templateAST, {
      nodeTransforms: [transformElement],
    });
    expect(templateAST).toEqual({
      type: "Root",
      children: [
        {
          type: "Element",
          tag: "div",
          children: [
            {
              type: "Element",
              tag: "h1",
              children: [
                {
                  type: "Text",
                  content: "Vue",
                },
              ],
            },
            {
              type: "Element",
              tag: "h1",
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

  it("should transformText work", () => {
    const templateAST = parser(`<div><p>Vue</p><p>Template</p></div>`);
    transformer(templateAST, {
      nodeTransforms: [transformElement, transformText],
    });
    expect(templateAST).toEqual({
      type: "Root",
      children: [
        {
          type: "Element",
          tag: "div",
          children: [
            {
              type: "Element",
              tag: "h1",
              children: [
                {
                  type: "Text",
                  content: "VueVue",
                },
              ],
            },
            {
              type: "Element",
              tag: "h1",
              children: [
                {
                  type: "Text",
                  content: "TemplateTemplate",
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it("should removeNode work", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const templateAST = parser(`<div><p>Vue</p><p>Template</p></div>`);
    transformer(templateAST, {
      nodeTransforms: [removeTextNode],
    });
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
              children: [],
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
    expect(log).toBeCalled();
  });
});
