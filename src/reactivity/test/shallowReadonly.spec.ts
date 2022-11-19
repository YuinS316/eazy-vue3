import { describe, it, test, vi, expect } from "vitest";
import { isReactive, isReadonly, shallowReadonly, readonly } from "../reactive";

describe("shallowReadonly", () => {
  test("should not make non-reactive properties reactive", () => {
    const props = shallowReadonly({ n: { foo: 1 } });
    expect(isReactive(props.n)).toBe(false);
  });

  test("should make root level properties readonly", () => {
    console.warn = vi.fn();
    const props = shallowReadonly({ n: 1 });
    props.n = 2;
    expect(props.n).toBe(1);
    expect(console.warn).toBeCalled();
  });

  test("should NOT make nested properties readonly", () => {
    console.warn = vi.fn();
    const props = shallowReadonly({ n: { foo: 1 } });

    props.n.foo = 2;
    expect(props.n.foo).toBe(2);
    expect(console.warn).not.toBeCalled();
  });

  test("should differentiate from normal readonly calls", () => {
    const original = { foo: {} };
    const shallowProxy = shallowReadonly(original);
    const reactiveProxy = readonly(original);
    expect(shallowProxy).not.toBe(reactiveProxy);
    expect(isReadonly(shallowProxy.foo)).toBe(false);
    expect(isReadonly(reactiveProxy.foo)).toBe(true);
  });
});
