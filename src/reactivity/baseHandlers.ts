import { track, trigger } from "./effect";

const get = createGetter();
const set = createSetter();

const readonlyGet = createGetter(true);

function createGetter(isReadOnly = false) {
  return function get(target, key) {
    const res = Reflect.get(target, key);

    if (!isReadOnly) {
      // 依赖收集
      track(target, key);
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

export const readonlyHandler = {
  get: readonlyGet,
  set(target, key, newValue, receiver) {
    console.warn(`${String(key)} can't be set, beacase ${target} is readonly.`);
    return true;
  },
};
