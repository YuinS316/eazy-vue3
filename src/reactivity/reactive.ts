import { baseHandler, readonlyHandler } from "./baseHandlers";

export function reactive(raw) {
  return baseHandler(raw);
}

export function readonly(raw) {
  return readonlyHandler(raw);
}
