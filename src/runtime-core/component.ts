import { shallowReadonly } from "@/reactivity/reactive";
import { isObject } from "@/shared";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots, InternalSlots } from "./componentSlots";
import { VNode } from "./vnode";

export type Data = Record<string, unknown>;

export interface ComponentInternalInstance {
  vnode: VNode;
  type: VNode["type"];
  setupState: Data;
  render: Function | null;

  //  render中通过this访问的都会通过这里
  proxy: Data;
  props: Data;
  slots: InternalSlots;
}

export function createComponentInstance(vnode: VNode) {
  const instance: ComponentInternalInstance = {
    vnode,
    type: vnode.type,
    setupState: {},
    render: null,
    proxy: {},
    props: {},
    slots: {},
  };

  return instance;
}

export function setupComponent(instance: ComponentInternalInstance) {
  //  TODO: initProps
  initProps(instance, instance.vnode.props || {});

  //  TODO: initSlots
  initSlots(instance, instance.vnode.children);

  //  处理setup状态和props的访问
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: ComponentInternalInstance) {
  const Component = instance.type as VNode;

  const props = instance.props;

  const { setup } = Component;

  if (setup) {
    const setupResult = setup(shallowReadonly(props));

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
  if (typeof Component === "object" && Component.render) {
    instance.render = Component.render;
  }
}
