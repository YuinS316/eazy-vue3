import { TrackOpTypes, TriggerOpTypes } from "./operations";

export interface ReactiveEffectOptions {
  lazy?: boolean;
  scheduler?: EffectScheduler;
  onStop?: Function;
}

export interface ReactiveEffectRunner<T = any> {
  (): T;
  effect: ReactiveEffect;
}

export const ITERATE_KEY = Symbol();

let activeEffect: ReactiveEffect | null = null;

//  用栈来存储当前激活的effect, 避免嵌套的时候effect不正确
let effectStack: ReactiveEffect[] = [];

export type EffectScheduler = (...args: any[]) => any;

export class ReactiveEffect {
  private _fn: Function;

  public deps: Dep[] = [];

  onStop?: () => void;

  constructor(fn: Function, public scheduler: EffectScheduler | null = null) {
    this._fn = fn;
  }

  run() {
    //  分支切换
    cleanupEffect(this);
    effectStack.push(this);
    activeEffect = this;
    let res = this._fn();
    effectStack.pop();

    activeEffect = effectStack[effectStack.length - 1];
    return res;
  }

  stop() {
    cleanupEffect(this);
    if (this.onStop) {
      this.onStop();
    }
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
  effectFn.deps.length = 0;
}

type Dep = Set<ReactiveEffect>;
type KeyToDepMap = Map<any, Dep>;
let targetMap = new WeakMap<any, KeyToDepMap>();

/**
 * @description 收集依赖
 * @param target
 * @param key
 * @returns
 */
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

  //  如果已经收集过了，就不需要再次收集
  if (dep.has(activeEffect)) return;

  //	双向收集，依赖收集副作用函数集合
  dep.add(activeEffect);
  //	副作用收集依赖
  activeEffect.deps.push(dep);
}

/**
 * @description 触发依赖
 * @param target
 * @param key
 * @param type 类型，区分是set 还是 add
 * @returns
 */
export function trigger(target, key, type: TriggerOpTypes, newValue?) {
  let depsMap = targetMap.get(target);
  if (!depsMap) return;

  let effects = depsMap.get(key);

  //  判断当前执行的是不是activeEffect，如果是的话就不要继续执行，会死循环
  // const depToRun = new Set(dep);
  // depToRun.forEach((e) => e.run());

  const effectsToRun = new Set<ReactiveEffect>();
  effects?.forEach((e) => {
    if (e !== activeEffect) {
      effectsToRun.add(e);
    }
  });

  //  优化点: 区分是添加属性还是修改属性，修改属性就不需要遍历
  //  添加和删除都影响遍历，所以都需要去触发
  if (type === TriggerOpTypes.ADD || type === TriggerOpTypes.DELETE) {
    //  取得因遍历key而收集的副作用函数
    let iterateEffects = depsMap.get(ITERATE_KEY);
    iterateEffects?.forEach((e) => {
      if (e !== activeEffect) {
        effectsToRun.add(e);
      }
    });
  }

  //  当操作类型是Add且对象是数组时，需要取出与length相关的副作用函数执行
  if (type === TriggerOpTypes.ADD && Array.isArray(target)) {
    let lengthEffects = depsMap.get("length");
    lengthEffects?.forEach((e) => {
      if (e !== activeEffect) {
        effectsToRun.add(e);
      }
    });
  }

  //  如果直接修改length，需要把收集到的索引（即key）大于等于length的元素的
  //  相关索引取出并执行其副作用函数
  if (Array.isArray(target) && key === "length") {
    const newLength = Number(newValue);
    depsMap.forEach((effects, key) => {
      if (key >= newLength) {
        effects.forEach((e) => {
          if (e !== activeEffect) {
            effectsToRun.add(e);
          }
        });
      }
    });
  }

  effectsToRun.forEach((e) => {
    if (e.scheduler) {
      e.scheduler();
    } else {
      e.run();
    }
  });
}

export function effect(
  fn,
  options?: ReactiveEffectOptions
): ReactiveEffectRunner {
  const _effect = new ReactiveEffect(fn);

  if (options) {
    Object.assign(_effect, options);
  }

  if (!options?.lazy) {
    _effect.run();
  }

  let runner = _effect.run.bind(_effect) as ReactiveEffectRunner;
  runner.effect = _effect;

  return runner;
}

export function stop(runner: ReactiveEffectRunner) {
  runner.effect.stop();
}
