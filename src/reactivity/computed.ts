import { ReactiveEffect, track, trigger } from "./effect";
import { TriggerOpTypes } from "./operations";

export type ComputedGetter<T> = (...args: any[]) => T;
export type ComputedSetter<T> = (v: T) => void;

class ComputedRefImpl<T> {
  private _value!: T;
  private _dirty = true;
  public readonly effect: ReactiveEffect;

  constructor(getter: ComputedGetter<T>) {
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
        trigger(this, "value", TriggerOpTypes.SET);
      }
    });
  }

  get value() {
    if (this._dirty) {
      this._value = this.effect.run();
      this._dirty = false;
    }
    track(this, "value");
    return this._value;
  }
}

export function computed<T>(getter: ComputedGetter<T>) {
  return new ComputedRefImpl(getter);
}
