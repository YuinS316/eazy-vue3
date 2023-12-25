import { it, expect, describe, vi } from "vitest";
import { ElementNode, parser, TextNode } from "../parser";
import { Context, transformer, transform } from "../transformer";

describe("transform", () => {
  describe("basic transformer", () => {
    //  替换标签类型
    function replaceElementType(node: ElementNode, context: Context) {
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
    function repeatTextContent(node: TextNode, context: Context) {
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
        nodeTransforms: [replaceElementType],
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
        nodeTransforms: [replaceElementType, repeatTextContent],
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

  describe("transform", () => {
    it("should transform work for single dom", () => {
      const ast = parser(`<div><p>Vue</p></div>`);

      //  ==》
      // function render() {
      //   return h("div", [
      //     h("p", "Vue")
      //   ])
      // }

      transform(ast);

      expect(ast.jsNode).toEqual({
        type: "FunctionDeclaration",
        id: {
          type: "Identifier",
          name: "render",
        },
        params: [],
        body: [
          {
            type: "ReturnStatement",
            return: {
              type: "CallExperssion",
              callee: {
                type: "Identifier",
                name: "h",
              },
              arguments: [
                {
                  type: "StringLiteral",
                  value: "div",
                },
                {
                  type: "CallExperssion",
                  callee: {
                    type: "Identifier",
                    name: "h",
                  },
                  arguments: [
                    {
                      type: "StringLiteral",
                      value: "p",
                    },
                    {
                      type: "StringLiteral",
                      value: "Vue",
                    },
                  ],
                },
              ],
            },
          },
        ],
      });
    });

    it("should transform work for multiple dom", () => {
      const ast = parser(`<div><p>Vue</p><p>Template</p></div>`);

      //  ==》
      // function render() {
      //   return h("div", [
      //     h("p", "Vue"),
      //     h("p", "Template")
      //   ])
      // }

      transform(ast);

      expect(ast.jsNode).toEqual({
        type: "FunctionDeclaration",
        id: {
          type: "Identifier",
          name: "render",
        },
        params: [],
        body: [
          {
            type: "ReturnStatement",
            return: {
              type: "CallExperssion",
              callee: {
                type: "Identifier",
                name: "h",
              },
              arguments: [
                {
                  type: "StringLiteral",
                  value: "div",
                },
                {
                  type: "ArrayExperssion",
                  elements: [
                    {
                      type: "CallExperssion",
                      callee: {
                        type: "Identifier",
                        name: "h",
                      },
                      arguments: [
                        {
                          type: "StringLiteral",
                          value: "p",
                        },
                        {
                          type: "StringLiteral",
                          value: "Vue",
                        },
                      ],
                    },
                    {
                      type: "CallExperssion",
                      callee: {
                        type: "Identifier",
                        name: "h",
                      },
                      arguments: [
                        {
                          type: "StringLiteral",
                          value: "p",
                        },
                        {
                          type: "StringLiteral",
                          value: "Template",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        ],
      });
    });
  });
});
