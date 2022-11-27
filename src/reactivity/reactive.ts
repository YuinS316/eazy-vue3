import { isObject } from "@/shared";
import {
  mutableHandler,
  readonlyHandler,
  shallowReactiveHandler,
  shallowReadonlyHanlder,
} from "./baseHandlers";

export const enum ReactiveFlags {
  SKIP = "__v_skip",
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
  IS_SHALLOW = "__v_isShallow",
  RAW = "__v_raw",
}

export interface Target {
  [ReactiveFlags.SKIP]?: boolean;
  [ReactiveFlags.IS_REACTIVE]?: boolean;
  [ReactiveFlags.IS_READONLY]?: boolean;
  [ReactiveFlags.IS_SHALLOW]?: boolean;
  [ReactiveFlags.RAW]?: any;
}

export const reactiveMap = new WeakMap<Target, any>();
export const shallowReactiveMap = new WeakMap<Target, any>();
export const readonlyMap = new WeakMap<Target, any>();
export const shallowReadonlyMap = new WeakMap<Target, any>();

export function reactive(target) {
  return createReactiveObject(target, false, mutableHandler, reactiveMap);
}

export function shallowReactive(target) {
  return createReactiveObject(
    target,
    false,
    shallowReactiveHandler,
    shallowReactiveMap
  );
}

export function readonly(target) {
  return createReactiveObject(target, true, readonlyHandler, readonlyMap);
}

export function shallowReadonly(target) {
  return createReactiveObject(
    target,
    true,
    shallowReadonlyHanlder,
    shallowReadonlyMap
  );
}

function createReactiveObject(
  target,
  isReadonly: boolean,
  baseHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<Target, any>
) {
  //  非对象，直接返回
  if (!isObject(target)) {
    console.warn(`value cannot be made reactive: ${String(target)}`);
    return target;
  }

  //  已经是代理对象了，直接返回
  //  除非对reactive代理过的调用readonly
  if (
    target[ReactiveFlags.RAW] &&
    !(isReadonly && target[ReactiveFlags.IS_REACTIVE])
  ) {
    return target;
  }

  //  代理过的对象都存在表里面，下次直接拿出来
  //  处理的问题是：通过代理对象访问元素值时如果还能被代理，那么得到的是新的代理对象。
  //  这时这两个对象是不相等的，所以要用一个表来存起来，再访问时直接用target获取代理对象。
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }

  const proxy = new Proxy(target, baseHandlers);
  proxyMap.set(target, proxy);

  return proxy;
}

/**
 * @description 返回被代理对象
 */
export function toRaw(observed) {
  const raw = observed && observed[ReactiveFlags.RAW];
  //  raw可能会是深层代理的
  return raw ? toRaw(raw) : observed;
}

export const toReactive = <T extends unknown>(value: T): T =>
  isObject(value) ? reactive(value) : value;

/**
 * @description 判断是否是reactive
 */
export function isReactive(target) {
  //  为什么用!!，是因为如果是原始对象，它并没有改key，会返回undefined，需要转成boolean
  return !!target[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(target) {
  return !!target[ReactiveFlags.IS_READONLY];
}

export function isShallow(target) {
  return !!target[ReactiveFlags.IS_SHALLOW];
}

export function isProxy(target) {
  return isReadonly(target) || isReactive(target);
}
