import { ShapeFlags } from "@/shared/ShapeFlags";
import { RawSlots } from "./componentSlots";

export const Fragment = Symbol.for("v-fgt");
export const Text = Symbol.for("v-txt");

export type VNodeTypes = string | VNode | typeof Fragment | typeof Text;

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

export type VNodeNormalizedChildren =
  | string
  | VNodeArrayChildren
  | RawSlots
  | null;

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

  //  组件 且 children是对象类型的 判断为slots
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (typeof children === "object") {
      vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN;
    }
  }

  return vnode;
}

//  创建文本节点
export function createTextVNode(text: string) {
  return createVNode(Text, {}, text);
}

function getShapeFlag(type: VNodeTypes) {
  if (typeof type === "string") {
    return ShapeFlags.ELEMENT;
  }
  return ShapeFlags.STATEFUL_COMPONENT;
}
