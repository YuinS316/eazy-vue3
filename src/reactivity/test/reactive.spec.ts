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
});
