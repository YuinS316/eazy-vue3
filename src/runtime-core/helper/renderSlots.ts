import { createVNode } from "../vnode";

export function renderSlots(slots, name = "default", props = {}) {
  //  我们会获取到slots是一个对象

  const slot = slots[name];

  if (slot) {
    if (typeof slot === "function") {
      return createVNode("div", {}, slot(props));
    }
    return createVNode("div", {}, slot);
  } else {
    return {};
  }
}
