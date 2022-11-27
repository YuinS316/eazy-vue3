import { describe, it, expect, test } from "vitest";
import { effect } from "../effect";
import { reactive } from "../reactive";
import { isRef, proxyRefs, ref, toRef, toRefs } from "../ref";

describe("reactivity/ref", () => {
  it("should hold a value", () => {
    const a = ref(1);
    expect(a.value).toBe(1);
    a.value = 2;
    expect(a.value).toBe(2);
  });

  it("should be reactive", () => {
    const a = ref(1);
    let dummy;
    let calls = 0;
    effect(() => {
      calls++;
      dummy = a.value;
    });
    expect(calls).toBe(1);
    expect(dummy).toBe(1);
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
    // same value should not trigger
    a.value = 2;
    expect(calls).toBe(2);
  });

  it("should work without initial value", () => {
    const a = ref();
    let dummy;
    effect(() => {
      dummy = a.value;
    });
    expect(dummy).toBe(undefined);
    a.value = 2;
    expect(dummy).toBe(2);
  });

  it("should make nested properties reactive", () => {
    const a = ref({
      count: 1,
    });
    let dummy;
    effect(() => {
      dummy = a.value.count;
    });
    expect(dummy).toBe(1);
    a.value.count = 2;
    expect(dummy).toBe(2);
  });

  test("isRef", () => {
    expect(isRef(ref(1))).toBe(true);

    expect(isRef(0)).toBe(false);
    expect(isRef(1)).toBe(false);
    // an object that looks like a ref isn't necessarily a ref
    expect(isRef({ value: 0 })).toBe(false);
  });

  test("toRef", () => {
    const a = reactive({
      x: 1,
    });
    const x = toRef(a, "x");
    expect(isRef(x)).toBe(true);
    expect(x.value).toBe(1);

    // source -> proxy
    a.x = 2;
    expect(x.value).toBe(2);

    // proxy -> source
    x.value = 3;
    expect(a.x).toBe(3);

    // reactivity
    let dummyX;
    effect(() => {
      dummyX = x.value;
    });
    expect(dummyX).toBe(x.value);

    // mutating source should trigger effect using the proxy refs
    a.x = 4;
    expect(dummyX).toBe(4);

    // should keep ref
    const r = { x: ref(1) };
    expect(toRef(r, "x")).toBe(r.x);
  });

  test("toRef default value", () => {
    const a: { x: number | undefined } = { x: undefined };
    const x = toRef(a, "x", 1);
    expect(x.value).toBe(1);

    a.x = 2;
    expect(x.value).toBe(2);

    a.x = undefined;
    expect(x.value).toBe(1);
  });

  test("toRefs", () => {
    const a = reactive({
      x: 1,
      y: 2,
    });

    const { x, y } = toRefs(a);

    expect(isRef(x)).toBe(true);
    expect(isRef(y)).toBe(true);
    expect(x.value).toBe(1);
    expect(y.value).toBe(2);

    // source -> proxy
    a.x = 2;
    a.y = 3;
    expect(x.value).toBe(2);
    expect(y.value).toBe(3);

    // proxy -> source
    x.value = 3;
    y.value = 4;
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);

    // reactivity
    let dummyX, dummyY;
    effect(() => {
      dummyX = x.value;
      dummyY = y.value;
    });
    expect(dummyX).toBe(x.value);
    expect(dummyY).toBe(y.value);

    // mutating source should trigger effect using the proxy refs
    a.x = 4;
    a.y = 5;
    expect(dummyX).toBe(4);
    expect(dummyY).toBe(5);
  });

  test("proxyRefs", () => {
    let obj = reactive({
      foo: 1,
      bar: 2,
    });

    let newObj = proxyRefs({
      ...toRefs(obj),
    });

    expect(newObj.foo).toBe(1);
    expect(newObj.bar).toBe(2);

    newObj.foo = 3;
    expect(newObj.foo).toBe(3);
    expect(obj.foo).toBe(3);
  });
});
