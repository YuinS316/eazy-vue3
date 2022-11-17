import { describe, it, expect, vi } from "vitest";
import { effect } from "../effect";
import { reactive } from "../reactive";

describe("reactivity/effect", () => {
  it("should run the passed function once (wrapped by a effect)", () => {
    const fnSpy = vi.fn(() => {});
    effect(fnSpy);
    expect(fnSpy).toHaveBeenCalledTimes(1);
  });
  it("should observe basic properties", () => {
    let dummy;
    const counter = reactive({ num: 0 });
    effect(() => (dummy = counter.num));

    expect(dummy).toBe(0);
    counter.num = 7;
    expect(dummy).toBe(7);
  });
  it("should observe multiple properties", () => {
    let dummy;
    const counter = reactive({ num1: 0, num2: 0 });
    effect(() => (dummy = counter.num1 + counter.num1 + counter.num2));

    expect(dummy).toBe(0);
    counter.num1 = counter.num2 = 7;
    expect(dummy).toBe(21);
  });

  it("should handle multiple effects", () => {
    let dummy1, dummy2;
    const counter = reactive({ num: 0 });
    effect(() => (dummy1 = counter.num));
    effect(() => (dummy2 = counter.num));

    expect(dummy1).toBe(0);
    expect(dummy2).toBe(0);
    counter.num++;
    expect(dummy1).toBe(1);
    expect(dummy2).toBe(1);
  });

  it("should not be triggered by mutating a property, which is used in an inactive branch", () => {
    let dummy;
    const obj = reactive({ prop: "value", run: true });

    const conditionalSpy = vi.fn(() => {
      dummy = obj.run ? obj.prop : "other";
    });
    effect(conditionalSpy);

    expect(dummy).toBe("value");
    expect(conditionalSpy).toHaveBeenCalledTimes(1);
    obj.run = false;
    expect(dummy).toBe("other");
    expect(conditionalSpy).toHaveBeenCalledTimes(2);
    obj.prop = "value2";
    expect(dummy).toBe("other");
    expect(conditionalSpy).toHaveBeenCalledTimes(2);
  });

  it("should return runner when call effect", () => {
    let foo = 10;

    const runner = effect(() => {
      foo++;
      return "foo";
    });

    expect(foo).toBe(11);
    const r = runner();
    expect(foo).toBe(12);
    expect(r).toBe("foo");
  });

  it("should allow nested effects", () => {
    const obj = reactive({
      foo: true,
      bar: true,
    });

    let tmp1, tmp2;

    const effectFn2 = vi.fn(() => {
      console.log("fn2 trigger--");
      tmp2 = obj.bar;
    });

    const effectFn1 = vi.fn(() => {
      console.log("fn1 trigger--");
      effect(effectFn2);
      tmp1 = obj.foo;
    });

    effect(effectFn1);
    expect(effectFn1).toHaveBeenCalledTimes(1);
    expect(effectFn2).toHaveBeenCalledTimes(1);

    obj.foo = false;
    //  我们的期望是 foo的更新 会执行 effectFn1，但是实际的情况并非这样
    expect(effectFn1).toHaveBeenCalledTimes(2);
  });
});
