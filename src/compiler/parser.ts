import { tokenize } from "./tokenize";

export interface RootNode {
  type: "Root";
  children: ASTNode[];
}

export interface ElementNode {
  type: "Element";
  tag: string;
  children: ASTNode[];
}

export interface TextNode {
  type: "Text";
  content: string;
}

export type ASTNode = RootNode | ElementNode | TextNode;

/**
 * 解释器，将template转成template AST
 * @param template
 */
export function parser(template: string) {
  const tokens = tokenize(template);

  //  创建根节点
  const root: RootNode = {
    type: "Root",
    children: [],
  };

  //  需要一个栈去存储当前处理的token对应的节点
  const elementStack: ASTNode[] = [root];

  //  持续处理tokens，直到tokens被处理完
  while (tokens.length) {
    //  获取当前栈顶元素为父节点
    const parent = elementStack[elementStack.length - 1];
    const token = tokens[0];
    switch (token.type) {
      case "tag": {
        const elementNode: ElementNode = {
          type: "Element",
          tag: token.name,
          children: [],
        };
        (parent as ElementNode).children.push(elementNode);
        elementStack.push(elementNode);
        break;
      }
      case "text": {
        const textNode: TextNode = {
          type: "Text",
          content: token.content,
        };
        (parent as ElementNode).children.push(textNode);
        break;
      }
      case "tagEnd": {
        elementStack.pop();
        break;
      }
    }

    tokens.shift();
  }

  return root;
}
