import { baseHandler, readonlyHandler } from "./baseHandlers";

export const enum ReactiveFlags {
  SKIP = "__v_skip",
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
  IS_SHALLOW = "__v_isShallow",
  RAW = "__v_raw",
}

export function reactive(raw) {
  return createReactiveObject(raw, baseHandler);
}

export function readonly(raw) {
  return createReactiveObject(raw, readonlyHandler);
}

function createReactiveObject(raw, handler) {
  return new Proxy(raw, handler);
}

/**
 * @description 判断是否是reactive
 */
export function isReactive(raw) {
  //  为什么用!!，是因为如果是原始对象，它并没有改key，会返回undefined，需要转成boolean
  return !!raw[ReactiveFlags.IS_REACTIVE];
}

export function isReadOnly(raw) {
  return !!raw[ReactiveFlags.IS_READONLY];
}
