import { IfAny } from "@/shared/typeUtils";
import type { ComponentInternalInstance } from "./component";
import type { VNode, VNodeNormalizedChildren } from "./vnode";

export type Slot<T extends any = any> = (
  ...args: IfAny<T, any[], [T] | (T extends undefined ? [] : never)>
) => VNode[];

export type InternalSlots = {
  [name: string]: Slot | undefined;
};

export type RawSlots = {
  [name: string]: unknown;
};

export function initSlots(
  instance: ComponentInternalInstance,
  children: VNodeNormalizedChildren
) {
  //  先粗暴的实现
  const slots = {};

  const isArrayChildren = Array.isArray(children);
  const isStringChildren = typeof children === "string";
  const isRenderToDefault = isArrayChildren || isStringChildren;

  if (isRenderToDefault) {
    //  默认渲染到default中
    slots["default"] = children;
  } else if (children !== null) {
    normalizeObjectSlots(children, slots);
  }

  instance.slots = slots;
}

function normalizeObjectSlots(children: RawSlots, slots) {
  for (const key in children) {
    const value = children[key];

    if (typeof value === "function") {
      slots[key] = (props) => normalizeSlotValue(value(props));
    } else {
      slots[key] = normalizeSlotValue(value);
    }
  }
}

function normalizeSlotValue(value: unknown) {
  return Array.isArray(value) ? value : [value];
}
