/**
 * 转换器，将templateAST转换为JavascriptAST
 * @param templateAST
 */
export function transformer(templateAST, initContext?: Partial<Context>) {
  const context: Context = {
    currentNode: null,
    currentNodeStack: [],
    parent: null,
    childIndex: 0,
    replaceNode(node) {
      context.parent.children[context.childIndex] = node;
      context.currentNode = node;
    },
    removeNode() {
      if (context.parent) {
        context.parent.children.splice(context.childIndex, 1);
        context.currentNode = null;
      }
    },
    nodeTransforms: [],
  };

  if (initContext) {
    Object.assign(context, initContext);
  }

  traverseNode(templateAST, context);
}

/**
 * 使用深度优先遍历ast
 * @param templateAST
 */
function traverseNode(templateAST, context: Context) {
  context.currentNode = templateAST;

  //  添加退出阶段的回调函数执行
  const exitFns: Function[] = [];

  const { nodeTransforms } = context;

  for (let i = 0; i < nodeTransforms.length; i++) {
    const onExit = nodeTransforms[i](context.currentNode, context);

    if (onExit) {
      exitFns.push(onExit);
    }

    //  可能执行节点移除，这时候检查一下currentNode是否有值就可以判断是否中断
    if (!context.currentNode) return;
  }

  const children = context.currentNode.children;

  if (children) {
    context.currentNodeStack.push(context.currentNode);
    for (let i = 0; i < children.length; i++) {
      //  更新处理的父节点
      // context.parent = context.currentNode;
      //  为什么用栈去存储，因为它深度遍历的时候，currentNode被换掉了，导致parent不准确
      context.parent =
        context.currentNodeStack[context.currentNodeStack.length - 1];

      //  更新当前children的位置
      context.childIndex = i;
      traverseNode(children[i], context);
    }
    context.currentNodeStack.pop();
  }

  //  反序执行
  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}

//  node transform function
export type NodeTransformFunc = (
  node: any,
  context: Context
) => (() => void) | void;

export interface Context {
  //  当前操作的节点
  currentNode: any;
  //  进行子节点遍历的时候，用栈去存储
  currentNodeStack: any[];
  //  父节点
  parent: any;
  //  当前父节点的children中的位置索引
  childIndex: number;
  //  替换节点的函数
  replaceNode(node): void;
  //  移除节点
  removeNode(): void;
  //  转换函数
  nodeTransforms: NodeTransformFunc[];
}
