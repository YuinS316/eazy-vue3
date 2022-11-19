import { extend, isObject } from "@/shared";
import { track, trigger } from "./effect";
import { reactive, ReactiveFlags, readonly } from "./reactive";

const get = createGetter();
const set = createSetter();

const shallowReactiveGet = createGetter(false, true);

const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);

function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    } else if (key === ReactiveFlags.IS_SHALLOW) {
      return shallow;
    }

    const res = Reflect.get(target, key);

    if (!isReadonly) {
      // 依赖收集
      track(target, key);
    }

    if (shallow) {
      return res;
    }

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }

    return res;
  };
}

function createSetter() {
  return function set(target, key, newValue, receiver) {
    const res = Reflect.set(target, key, newValue, receiver);

    // 触发依赖
    trigger(target, key);
    return res;
  };
}

export const baseHandler = {
  get,
  set,
};

export const shallowReactiveHandler = extend({}, baseHandler, {
  get: shallowReactiveGet,
});

export const readonlyHandler = {
  get: readonlyGet,
  set(target, key, newValue, receiver) {
    console.warn(`${String(key)} can't be set, beacase ${target} is readonly.`);
    return true;
  },
};

export const shallowReadonlyHanlder = extend({}, readonlyHandler, {
  get: shallowReadonlyGet,
});
