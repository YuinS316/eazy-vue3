import { hasChanged, isObject } from "@/shared";
import { track, trigger } from "./effect";
import { TriggerOpTypes } from "./operations";
import { isReactive, reactive, toRaw, toReactive } from "./reactive";

export function ref(value?: any) {
  if (isRef(value)) {
    return value;
  }
  return createRef(value);
}

function createRef(value) {
  return new RefImpl(value);
}

class RefImpl {
  private _value;
  private _rawValue;
  public readonly __v_isRef = true;

  constructor(value) {
    this._rawValue = toRaw(value);
    this._value = toReactive(value);
  }

  get value() {
    track(this, "value");
    return this._value;
  }

  set value(newValue) {
    newValue = toRaw(newValue);
    if (hasChanged(newValue, this._rawValue)) {
      this._rawValue = newValue;
      this._value = toReactive(newValue);
      trigger(this, "value", TriggerOpTypes.SET);
    }
  }
}

export function isRef(r) {
  return !!(r && r.__v_isRef === true);
}

export function toRef(object, key, defaultValue?) {
  const val = object[key];
  return isRef(val) ? val : new ObjectRefImpl(object, key, defaultValue);
}

export function toRefs(object): any {
  const tmp = {};

  for (const key in object) {
    tmp[key] = toRef(object, key);
  }
  return tmp;
}

class ObjectRefImpl {
  public readonly __v_isRef = true;

  constructor(
    private readonly _object,
    private readonly _key,
    private readonly _defaultValue?
  ) {}

  get value() {
    const val = this._object[this._key];
    return val === undefined ? this._defaultValue : val;
  }

  set value(newVal) {
    this._object[this._key] = newVal;
  }
}

export function unref(r) {
  return isRef(r) ? r.value : r;
}

export function proxyRefs(r) {
  return isReactive(r)
    ? r
    : new Proxy(r, {
        get(target, key, receiver) {
          return unref(Reflect.get(target, key, receiver));
        },
        set(tareget, key, value, receiver) {
          let oldValue = tareget[key];
          if (isRef(oldValue) && !isRef(value)) {
            oldValue.value = value;
            return true;
          } else {
            return Reflect.set(tareget, key, value, receiver);
          }
        },
      });
}
