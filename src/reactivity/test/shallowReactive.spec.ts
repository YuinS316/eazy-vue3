import { describe, test, vi, expect } from "vitest";
import {
  shallowReactive,
  isReactive,
  reactive,
  isShallow,
  shallowReadonly,
} from "../reactive";

describe("shallowReactive", () => {
  test("should not make non-reactive properties reactive", () => {
    const props = shallowReactive({ n: { foo: 1 } });
    expect(isReactive(props.n)).toBe(false);
  });

  test("should keep reactive properties reactive", () => {
    const props: any = shallowReactive({ n: reactive({ foo: 1 }) });
    props.n = reactive({ foo: 2 });
    expect(isReactive(props.n)).toBe(true);
  });

  test("should allow shallow and normal reactive for same target", () => {
    const original = { foo: {} };
    const shallowProxy = shallowReactive(original);
    const reactiveProxy = reactive(original);
    expect(shallowProxy).not.toBe(reactiveProxy);
    expect(isReactive(shallowProxy.foo)).toBe(false);
    expect(isReactive(reactiveProxy.foo)).toBe(true);
  });

  test("isShallow", () => {
    expect(isShallow(shallowReactive({}))).toBe(true);
    expect(isShallow(shallowReadonly({}))).toBe(true);
  });
});
