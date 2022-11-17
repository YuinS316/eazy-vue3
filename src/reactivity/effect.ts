class ReactiveEffect {
  private _fn: Function;

  public deps: Dep[] = [];

  constructor(fn: Function) {
    this._fn = fn;
  }

  run() {
    cleanupEffect(this);
    effectStack.push(this);
    activeEffect = this;
    let res = this._fn();
    effectStack.pop();

    activeEffect = effectStack[effectStack.length - 1];
    return res;
  }
}

/**
 * @description 从副作用相关连的依赖集合中，删除副作用函数
 * @param effectFn
 */
function cleanupEffect(effectFn: ReactiveEffect) {
  for (let i = 0; i < effectFn.deps.length; i++) {
    let dep = effectFn.deps[i];
    dep.delete(effectFn);
  }
}

type Dep = Set<ReactiveEffect>;
type KeyToDepMap = Map<any, Dep>;
let targetMap = new WeakMap<any, KeyToDepMap>();

export function track(target, key) {
  //	刚开始的时候activeEffect可能为null
  if (!activeEffect) return;

  let depsMap = targetMap.get(target);

  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }

  //	双向收集，依赖收集副作用函数集合
  dep.add(activeEffect);
  //	副作用收集依赖
  activeEffect.deps.push(dep);
}

export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) return;

  let dep = depsMap.get(key);

  //  判断当前执行的是不是activeEffect，如果是的话就不要继续执行，会死循环
  // const depToRun = new Set(dep);
  // depToRun.forEach((e) => e.run());

  const depToRun = new Set<ReactiveEffect>();
  dep?.forEach((d) => {
    if (d !== activeEffect) {
      depToRun.add(d);
    }
  });

  depToRun.forEach((e) => e.run());
}

let activeEffect: ReactiveEffect | null = null;

//  用栈来存储当前激活的effect, 避免嵌套的时候effect不正确
let effectStack: ReactiveEffect[] = [];

export function effect(fn) {
  const _effect = new ReactiveEffect(fn);
  _effect.run();

  return _effect.run.bind(_effect);
}
