import { createVNode } from "./vnode";
import { render } from "./renderer";

export function createApp(component) {
  return {
    mount(rootContainer) {
      const vnode = createVNode(component);
      render(vnode, rootContainer);
    },
  };
}
