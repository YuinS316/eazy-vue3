import { baseHandler, readonlyHandler } from "./baseHandlers";

export function reactive(raw) {
  return createReactiveObject(raw, baseHandler);
}

export function readonly(raw) {
  return createReactiveObject(raw, readonlyHandler);
}

function createReactiveObject(raw, handler) {
  return new Proxy(raw, handler);
}
