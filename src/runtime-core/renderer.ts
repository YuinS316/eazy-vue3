import { isArray, isObject, isString } from "@/shared";
import {
  ComponentInternalInstance,
  createComponentInstance,
  setupComponent,
} from "./component";
import { VNode, VNodeArrayChildren } from "./vnode";

export interface RendererNode {
  [key: string]: any;
}

export interface RendererElement extends RendererNode {}

export function render(vnode: VNode, container: RendererElement) {
  patch(vnode, container);
}

export function patch(vnode: VNode, container: RendererElement) {
  //  如何区分是component还是element，看vnode的type是否是对象
  if (typeof vnode.type === "string") {
    processElement(vnode, container);
  } else if (isObject(vnode.type)) {
    processComponent(vnode, container);
  }
}

function processElement(vnode: VNode, container: RendererElement) {
  mountElement(vnode, container);
}

function mountElement(vnode: VNode, container: RendererElement) {
  const { type, props, children } = vnode;

  let el = document.createElement(type as string);

  vnode.el = el;

  for (const key in props) {
    el.setAttribute(key, props[key]);
  }

  if (isString(children)) {
    el.textContent = children;
  } else if (isArray(children)) {
    mountChildren(children, el);
  }

  container.appendChild(el);
}

function mountChildren(
  children: VNodeArrayChildren,
  container: RendererElement
) {
  children.forEach((v) => {
    patch(v as VNode, container);
  });
}

function processComponent(vnode: VNode, container: RendererElement) {
  mountComponent(vnode, container);

  //  TODO: updateComponent
}

function mountComponent(vnode: VNode, container: RendererElement) {
  const instance = createComponentInstance(vnode);

  setupComponent(instance);
  setupRenderEffect(instance, vnode, container);
}

function setupRenderEffect(
  instance: ComponentInternalInstance,
  vnode: VNode,
  container: RendererElement
) {
  const subtree: VNode = instance.render!.call(instance.proxy);
  patch(subtree, container);

  vnode.el = subtree.el;
}
