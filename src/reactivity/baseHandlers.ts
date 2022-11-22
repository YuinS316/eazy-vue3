import { extend, hasChanged, hasOwn, isObject } from "@/shared";
import { track, trigger, ITERATE_KEY } from "./effect";
import { reactive, ReactiveFlags, readonly } from "./reactive";
import { TriggerOpTypes } from "./operations";

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
    } else if (key === ReactiveFlags.RAW) {
      return target;
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
    let oldVal = target[key];

    let isArray = Array.isArray(target);

    //  判断是否是数组
    //  数组：判断访问的下标是否超过数组的长度
    //  对象：判断访问的键是否存在对象当中
    const type = isArray
      ? +key < target.length
        ? TriggerOpTypes.SET
        : TriggerOpTypes.ADD
      : hasOwn(target, key)
      ? TriggerOpTypes.SET
      : TriggerOpTypes.ADD;

    const res = Reflect.set(target, key, newValue, receiver);

    //  优化点：当给代理对象新增属性，但是该对象的原型有该属性时，会触发多次
    //  receiver 永远指向代理对象，target则不一定是被代理对象。
    //  通过上面的这个特性，访问raw属性 再判断返回的对象即可
    if (target === receiver[ReactiveFlags.RAW]) {
      //  优化点：旧值与新值完全一样的时候，不需要触发依赖
      if (hasChanged(oldVal, newValue)) {
        // 触发依赖
        trigger(target, key, type, newValue);
      }
    }
    return res;
  };
}

/**
 * @description 处理 key in obj 的读取情况
 *
 * @param target
 * @param key
 * @returns
 */
function has(target: object, key: string): boolean {
  track(target, key);
  const res = Reflect.has(target, key);

  return res;
}

/**
 * @description 处理遍历key的情况
 * @param target
 */
function ownKeys(target: object) {
  track(target, ITERATE_KEY);
  return Reflect.ownKeys(target);
}

/**
 * @description 处理属性被删除的情况
 * @param target
 * @param key
 */
function deleteProperty(target, key) {
  //  检查被删除的key是不是对象自己的
  const hadKey = hasOwn(target, key);

  const res = Reflect.deleteProperty(target, key);

  if (res && hadKey) {
    trigger(target, key, TriggerOpTypes.DELETE);
  }

  return res;
}

export const mutableHandler = {
  get,
  set,
  has,
  ownKeys,
  deleteProperty,
};

export const shallowReactiveHandler = extend({}, mutableHandler, {
  get: shallowReactiveGet,
});

export const readonlyHandler = {
  get: readonlyGet,
  set(target, key, newValue, receiver) {
    console.warn(`${String(key)} can't be set, beacase ${target} is readonly.`);
    return true;
  },
  deleteProperty(target, key) {
    console.warn(`${String(key)} can't be set, beacase ${target} is readonly.`);
    return true;
  },
};

export const shallowReadonlyHanlder = extend({}, readonlyHandler, {
  get: shallowReadonlyGet,
});
