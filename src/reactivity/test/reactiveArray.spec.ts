import { describe, it, expect, vi, test } from "vitest";
import { effect } from "../effect";
import { isReactive, reactive } from "../reactive";

describe("reactivity/reactive/Array", () => {
  test("should make Array reactive", () => {
    const original = [{ foo: 1 }];
    const observed = reactive(original);
    expect(observed).not.toBe(original);
    expect(isReactive(observed)).toBe(true);
    expect(isReactive(original)).toBe(false);
    expect(isReactive(observed[0])).toBe(true);
    // get
    expect(observed[0].foo).toBe(1);
    // has
    expect(0 in observed).toBe(true);
    // ownKeys
    expect(Object.keys(observed)).toEqual(["0"]);
  });

  test("length change should trigger", () => {
    const original = ["foo"];
    const observed = reactive(original);
    let len;
    effect(() => {
      len = observed.length;
    });
    expect(len).toBe(1);
    observed[1] = "bar";
    expect(len).toBe(2);
  });

  test("set length should trigger", () => {
    const original = ["foo"];
    const observed = reactive(original);
    let dummy;
    effect(() => {
      dummy = observed[0];
    });
    expect(dummy).toBe("foo");
    observed.length = 0;
    expect(dummy).toBe(undefined);
  });
});
