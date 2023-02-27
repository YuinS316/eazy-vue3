import { ComponentInternalInstance, Data } from "./component";

export function initProps(instance: ComponentInternalInstance, rawProps: Data) {
  instance.props = rawProps;
}
