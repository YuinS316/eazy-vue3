import { describe, it, expect, vi } from "vitest";
import { readonly, isReadonly, isReactive } from "../reactive";
import { effect } from "../effect";

describe("readonly", () => {
  it("happy path", () => {
    const original = {
      foo: 1,
    };

    const observed = readonly({
      foo: 1,
    });

    expect(original).not.toBe(observed);
    expect(observed.foo).toBe(1);
    expect(isReadonly(original)).toBe(false);
    expect(isReadonly(observed)).toBe(true);
  });

  it("should not trigger effects", () => {
    console.warn = vi.fn();

    const wrapped: any = readonly({ a: 1 });
    let dummy;
    effect(() => {
      dummy = wrapped.a;
    });
    expect(dummy).toBe(1);
    wrapped.a = 2;
    expect(wrapped.a).toBe(1);
    expect(dummy).toBe(1);
    expect(console.warn).toBeCalled();
    // expect(`target is readonly`).toHaveBeenWarned()
  });

  it("should make nested values readonly", () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = readonly(original);
    expect(wrapped).not.toBe(original);
    expect(isReactive(wrapped)).toBe(false);
    expect(isReadonly(wrapped)).toBe(true);
    expect(isReactive(original)).toBe(false);
    expect(isReadonly(original)).toBe(false);
    expect(isReactive(wrapped.bar)).toBe(false);
    expect(isReadonly(wrapped.bar)).toBe(true);
    expect(isReactive(original.bar)).toBe(false);
    expect(isReadonly(original.bar)).toBe(false);
    // get
    expect(wrapped.foo).toBe(1);
    // has
    expect("foo" in wrapped).toBe(true);
    // ownKeys
    expect(Object.keys(wrapped)).toEqual(["foo", "bar"]);
  });
});
