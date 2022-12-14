export const extend = Object.assign;

export const isArray = Array.isArray;

export const isString = (val: unknown): val is string =>
  typeof val === "string";

export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === "object";

const hasOwnProperty = Object.prototype.hasOwnProperty;

export const hasOwn = (val: object, key: string): key is keyof typeof val =>
  hasOwnProperty.call(val, key);

export const hasChanged = (value: any, oldValue: any) =>
  !Object.is(value, oldValue);
