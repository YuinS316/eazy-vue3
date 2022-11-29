import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
  patch(vnode, container);
}

export function patch(vnode, container) {
  //  TODO: processElement

  processComponent(vnode, container);
}
function processComponent(vnode, container) {
  mountComponent(vnode, container);

  //  TODO: updateComponent
}

function mountComponent(vnode, container) {
  const instance = createComponentInstance(vnode);

  setupComponent(instance);
  setupRenderEffect(instance, container);
}

function setupRenderEffect(instance, container) {
  const subtree = instance.render();
  patch(subtree, container);
}
