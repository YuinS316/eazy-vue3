import { describe, it, expect } from "vitest";
import { reactive } from "../reactive";

describe("reactive", () => {
  it("happy path", () => {
    const origin = {
      foo: 1,
    };

    const observed = reactive({
      foo: 1,
    });

    expect(origin).not.toBe(observed);
    expect(observed.foo).toBe(1);
  });
});
