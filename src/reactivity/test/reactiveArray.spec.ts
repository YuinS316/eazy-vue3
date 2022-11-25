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

  test("track length on for ... in iteration", () => {
    const array = reactive([1]);
    let length = "";
    effect(() => {
      length = "";
      for (const key in array) {
        length += key;
      }
    });
    expect(length).toBe("0");
    array.push(1);
    expect(length).toBe("01");
    array[100] = "bar";
    expect(length).toBe("01100");
    array.length = 0;
    expect(length).toBe("");
  });

  test("track length on for ... of iteration", () => {
    const array = reactive([1]);
    let total = 0;
    effect(() => {
      total = 0;
      for (const val of array) {
        total += val;
      }
    });
    expect(total).toBe(1);
    array.push(2);
    expect(total).toBe(3);
    array[2] = 100;
    expect(total).toBe(103);
    array.length = 0;
    expect(total).toBe(0);
  });

  test("cloned reactive Array should point to observed values", () => {
    const original = [{ foo: 1 }];
    const observed = reactive(original);
    const clone = observed.slice();
    expect(isReactive(clone[0])).toBe(true);
    expect(clone[0]).not.toBe(original[0]);
    expect(clone[0]).toBe(observed[0]);
  });

  test.skip("pass orginal value should get observed", () => {
    const obj = {};
    const observed = reactive([obj]);
    expect(observed.includes(obj)).toBe(true);
  });
});
