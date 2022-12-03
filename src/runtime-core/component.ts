import { isObject } from "@/shared";
import { VNode } from "./vnode";

export type Data = Record<string, unknown>;

export interface ComponentInternalInstance {
  vnode: VNode;
  type: VNode["type"];
  setupState: Data | null;

  //  render中通过this访问的都会通过这里
  proxy: Data | null;
}

export function createComponentInstance(vnode: VNode) {
  const instance: ComponentInternalInstance = {
    vnode,
    type: vnode.type,
    setupState: null,
    proxy: null,
  };

  return instance;
}

export function setupComponent(instance: ComponentInternalInstance) {
  //  TODO: initProps

  //  TODO: initSlots

  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: ComponentInternalInstance) {
  const Component = instance.type as VNode;

  const { setup } = Component;

  if (setup) {
    const setupResult = setup();

    instance.proxy = new Proxy(
      {},
      {
        get(target, key) {
          const { setupState } = instance;
          if (setupState && key in setupState) {
            return setupState[key as string];
          }
        },
      }
    );

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
