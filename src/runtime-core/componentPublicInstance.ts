import { hasOwn } from "@/shared";
import { ComponentInternalInstance } from "./component";

export interface ComponentRenderContext {
  [key: string]: any;
  _: ComponentInternalInstance;
}

export type PublicPropertiesMap = Record<
  string,
  (i: ComponentInternalInstance) => any
>;

//  后续一些特殊的属性，可以在这里添加即可
export const publicPropertiesMap: PublicPropertiesMap = {
  $el: (i) => i.vnode.el,
  $slots: (i) => i.slots,
};

export const PublicInstanceProxyHandlers: ProxyHandler<any> = {
  get({ _: instance }: ComponentRenderContext, key: string) {
    const { setupState, props } = instance;

    if (props && hasOwn(props, key)) {
      return props[key];
    } else if (setupState && hasOwn(setupState, key)) {
      return setupState[key as string];
    }

    // if (props && key in props) {
    //   return props[key];
    // }

    // if (setupState && key in setupState) {
    //   return setupState[key as string];
    // }

    const publicGetter = publicPropertiesMap[key];

    if (publicGetter) {
      return publicGetter(instance);
    }
  },
};
