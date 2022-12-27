import { ShapeFlags } from "@/shared/ShapeFlags";

export type VNodeTypes = string | VNode;

export type VNodeProps = {
  key?: string | number | symbol;
};

type VNodeChildAtom =
  | VNode
  | string
  | number
  | boolean
  | null
  | undefined
  | void;

export type VNodeArrayChildren = Array<VNodeArrayChildren | VNodeChildAtom>;

export type VNodeNormalizedChildren = string | VNodeArrayChildren | null;

export interface VNode<ExtraProps = { [key: string]: any }> {
  type: VNodeTypes;
  props: (VNodeProps & ExtraProps) | null;
  children: VNodeNormalizedChildren;
  setup?: any;
  render?: Function;
  shapeFlag: number;

  //  根元素的真实节点
  el?: Record<string, any>;
}

export function createVNode(type: VNodeTypes, props?, children?): VNode {
  const vnode: VNode = {
    type,
    props,
    children,
    shapeFlag: getShapeFlag(type),
  };

  if (typeof vnode.children === "string") {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(vnode.children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }

  return vnode;
}

function getShapeFlag(type: VNodeTypes) {
  if (typeof type === "string") {
    return ShapeFlags.ELEMENT;
  }
  return ShapeFlags.STATEFUL_COMPONENT;
}
