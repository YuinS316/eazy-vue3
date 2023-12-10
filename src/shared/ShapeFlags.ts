export const enum ShapeFlags {
  //  原生的dom
  ELEMENT = 1,
  //  组件
  STATEFUL_COMPONENT = 1 << 1,
  //  文字类型的children
  TEXT_CHILDREN = 1 << 2,
  //  数组类型的children
  ARRAY_CHILDREN = 1 << 3,
  //  slots children
  SLOTS_CHILDREN = 1 << 4,
}
