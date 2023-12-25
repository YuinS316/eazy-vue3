export interface StringLiteral {
  type: "StringLiteral";
  value: string;
}

export interface Identifier {
  type: "Identifier";
  name: string;
}

export interface CallExperssion {
  type: "CallExperssion";
  callee: Identifier;
  arguments: any[];
}

export interface FunctionDeclaration {
  type: "FunctionDeclaration";
  id: Identifier;
  params: any[];
  body: any[];
}

/**
 * Literal字面量，源代码中直接表示某个固定值的表达式或符号
 *
 * let stringLiteral = "Hello, World!"; 中的 "Hello, World!"
 * @param value
 * @returns
 */
export function createStringLiteral(value: string): StringLiteral {
  return {
    type: "StringLiteral",
    value,
  };
}

/**
 * Identifier是一种节点类型，表示代码中的标识符，也就是变量名或属性名等
 *
 * let stringLiteral = "Hello, World!"; 中的stringLiteral是一个节点
 * @param name
 * @returns
 */
export function createIdentifier(name: string): Identifier {
  return {
    type: "Identifier",
    name,
  };
}

/**
 * ArrayExpression 是一种节点类型，用于表示数组字面量的表达式
 * @param elements
 * @returns
 */
export function createArrayExperssion(elements: any[]) {
  return {
    type: "ArrayExperssion",
    elements,
  };
}

/**
 * CallExpression 是一种节点类型，用于表示函数调用的表达式
 * @param callee
 * @param args
 * @returns
 */
export function createCallExperssion(
  callee: string,
  args: any[]
): CallExperssion {
  return {
    type: "CallExperssion",
    callee: createIdentifier(callee),
    arguments: args,
  };
}
