import { describe, it, expect } from "vitest";
import { reactive, isReactive } from "../reactive";

describe("reactive", () => {
  it("happy path", () => {
    const original = {
      foo: 1,
    };

    const observed = reactive({
      foo: 1,
    });

    expect(original).not.toBe(observed);
    expect(observed.foo).toBe(1);
    expect(isReactive(original)).toBe(false);
    expect(isReactive(observed)).toBe(true);
  });

  it("nested reactives", () => {
    const original = {
      nested: {
        foo: 1,
      },
      // array: [{ bar: 2 }]
    };
    const observed = reactive(original);
    expect(isReactive(observed)).toBe(true);
    expect(isReactive(observed.nested)).toBe(true);

    observed.nested.foo = 2;
    expect(observed.nested.foo).toBe(2);

    observed.nested = "nested";
    expect(observed.nested).toBe("nested");
    // expect(isReactive(observed.array)).toBe(true)
    // expect(isReactive(observed.array[0])).toBe(true)
  });
});
