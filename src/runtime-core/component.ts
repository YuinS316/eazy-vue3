import { isObject } from "@/shared";
import { VNode } from "./vnode";

export function createComponentInstance(vnode: VNode) {
  const instance = {
    vnode,
    type: vnode.type,
  };

  return instance;
}

export function setupComponent(instance) {
  //  TODO: initProps

  //  TODO: initSlots

  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  const Component = instance.type;

  const { setup } = Component;

  if (setup) {
    const setupResult = setup();

    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance, setupResult) {
  if (isObject(setupResult)) {
    instance.setupState = setupResult;
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
  const Component = instance.type;
  if (Component.render) {
    instance.render = Component.render;
  }
}
