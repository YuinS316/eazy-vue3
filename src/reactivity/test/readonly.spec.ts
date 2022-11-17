import { describe, it, expect, vi } from "vitest";
import { readonly } from "../reactive";
import { effect } from "../effect";

describe("readonly", () => {
  it("happy path", () => {
    const origin = {
      foo: 1,
    };

    const observed = readonly({
      foo: 1,
    });

    expect(origin).not.toBe(observed);
    expect(observed.foo).toBe(1);
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
});
