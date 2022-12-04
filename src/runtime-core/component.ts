import { isObject } from "@/shared";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { VNode } from "./vnode";

export type Data = Record<string, unknown>;

export interface ComponentInternalInstance {
  vnode: VNode;
  type: VNode["type"];
  setupState: Data | null;
  render: Function | null;

  //  render中通过this访问的都会通过这里
  proxy: Data | null;
}

export function createComponentInstance(vnode: VNode) {
  const instance: ComponentInternalInstance = {
    vnode,
    type: vnode.type,
    setupState: null,
    render: null,
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

    //  通过this访问的，都会挂载到instance.proxy上
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);

    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance: ComponentInternalInstance, setupResult) {
  if (isObject(setupResult)) {
    instance.setupState = setupResult;
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance: ComponentInternalInstance) {
  const Component = instance.type;
  if (typeof Component !== "string" && Component.render) {
    instance.render = Component.render;
  }
}
