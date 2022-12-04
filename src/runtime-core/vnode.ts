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

  //  根元素的真实节点
  el?: Record<string, any>;
}

export function createVNode(type: VNodeTypes, props?, children?): VNode {
  const vnode = {
    type,
    props,
    children,
  };

  return vnode;
}
