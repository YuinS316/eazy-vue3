import {
  effect,
  reactive,
  shallowReactive,
  shallowReadonly,
  proxyRefs,
} from "../../lib/reactivity.js";
//  渲染器
function createRenderer(options) {
  const {
    createElement,
    setElementText,
    insert,
    patchProps,
    createText,
    setText,
    createComment,
  } = options;

  function render(vnode, container) {
    if (vnode) {
      //  如果新的vnode存在，与旧的vnode一起传递给patch打补丁
      patch(container._vnode, vnode, container);
    } else {
      //  新的vnode不存在，但是旧的_vnode存在，表示卸载
      //  只需要清空就可以
      if (container._vnode) {
        // container.innerHTML = "";

        //  不能这么粗暴
        //  1、因为你还要依次调用组件的beforeMount等钩子
        //  2、如果有自定义指令，还要依次调用自定义指令
        //  3、如果之前有绑定事件，还要去移除事件监听

        unmount(container._vnode);
      }
    }

    //  存储旧_vnode
    container._vnode = vnode;
  }

  function unmount(vnode) {
    if (vnode.type === Fragment) {
      vnode.children.forEach((c) => unmount(c));
      return;
    }

    const parent = vnode.el.parentNode;
    if (parent) {
      parent.removeChild(vnode.el);
    }
  }

  /**
   * 更新函数
   *
   * @param n1 旧的节点
   * @param n2 新的节点
   * @param container 要挂载的容器
   */
  function patch(n1, n2, container, anchor) {
    //  节点类型不匹配
    if (n1 && n1.type !== n2.type) {
      unmount(n1);
      n1 = null;
    }

    const { type } = n2;

    if (typeof type === "string") {
      if (!n1) {
        //  n1不存在，表示挂载
        mountElement(n2, container, anchor);
      } else {
        //  n1存在，表示打补丁
        patchElement(n1, n2, container);
      }
    } else if (type === Text) {
      if (!n1) {
        const el = (n2.el = createText(n2.children));
        insert(el, container);
      } else {
        const el = (n2.el = n1.el);
        if (n2.children !== n1.children) {
          setText(el, n2.children);
        }
      }
    } else if (type === Comment) {
      if (!n1) {
        const el = (n2.el = createComment(n2.children));
        insert(el, container);
      } else {
        const el = (n2.el = n1.el);
        if (n2.children !== n1.children) {
          setText(el, n2.children);
        }
      }
    } else if (type === Fragment) {
      if (!n1) {
        n2.children.forEach((c) => patch(null, c, container));
      } else {
        patchChildren(n1, n2, container);
      }
    } else if (typeof type === "object") {
      //  组件
      if (!n1) {
        //  挂载组件
        mountComponent(n2, container, anchor);
      } else {
        patchComponent(n1, n2, container);
      }
    } else {
      // 其他
    }
  }

  /**
   * 处理接收到的props， 除了预先定义的props还有attrs
   * @param {*} options  组件定义的props
   * @param {*} propsData  实际接受到的props
   */
  function resolveProps(options, propsData) {
    const props = {};
    const attrs = {};

    for (const key in propsData) {
      if (key in options || key.startsWith("on")) {
        props[key] = propsData[key];
      } else {
        attrs[key] = propsData[key];
      }
    }

    return {
      props,
      attrs,
    };
  }

  /**
   * 挂载组件
   *
   * @param {*} vnode
   * @param {*} container
   * @param {*} anchor
   */
  function mountComponent(vnode, container, anchor) {
    //  获取选项对象
    const componentOptions = vnode.type;

    //  获取render
    const {
      render,
      props: propsOption,
      data,
      beforeCreate,
      created,
      beforeMounted,
      mounted,
      beforeUpdate,
      updated,
      setup,
    } = componentOptions;

    const isDataFunction = typeof data === "function";

    //  调用beforeCreate钩子，此时无法访问数据
    beforeCreate && beforeCreate();

    const state = reactive(isDataFunction ? data() : data || {});

    const { props, attrs } = resolveProps(propsOption || {}, vnode.props || {});

    //  调用created钩子，此时可访问数据，但无法访问dom
    created && created();

    //  实例
    const instance = {
      state,
      props: shallowReactive(props),
      //  记录是初次挂载还是更新
      isMounted: false,
      //  存储虚拟dom
      subTree: null,
    };

    function emit(evName, ...payloads) {
      const handler = instance.props[evName];
      if (handler) {
        handler(...payloads);
      } else {
        console.warn(`You are trying to cal a unregisted function`);
      }
    }

    const setupContext = { attrs, emit };

    let setupResult = {};
    let setupState = {};
    if (setup) {
      setupResult = setup(shallowReadonly(props), setupContext);
      //  暂时默认其返回对象而不是渲染函数
      setupState = proxyRefs(setupResult);
    }

    //  创建渲染上下文，需要能访问的到state, props等
    const renderContext = new Proxy(instance, {
      get(target, key, reveiver) {
        const { state, props } = target;

        if (props && key in props) {
          return props[key];
        } else if (state && key in state) {
          return state[key];
        } else if (setupState && key in setupState) {
          return setupState[key];
        } else {
          console.warn("You are trying to access a undefined key:" + key);
          return undefined;
        }
      },
      set(target, key, value, receiver) {
        const { state, props } = target;

        if (props && key in props) {
          props[key] = value;
        } else if (state && key in state) {
          state[key] = value;
        } else if (setupState && key in setupState) {
          setupState[key] = value;
        } else {
          console.warn("You are trying to change a undefined key:" + key);
        }
      },
    });

    vnode.component = instance;

    instance.update = effect(
      () => {
        const subTree = render.call(renderContext, renderContext);

        if (!instance.isMounted) {
          beforeMounted && beforeMount.call(renderContext);
          //  初次挂载
          patch(null, subTree, container, anchor);

          instance.isMounted = true;

          //  已挂载，可以访问dom
          mounted && mounted();
        } else {
          beforeUpdate && beforeUpdate.call(renderContext);
          //  更新
          patch(instance.subTree, subTree, container, anchor);

          //  已更新
          updated && updated.call(renderContext);
        }

        instance.subTree = subTree;
        vnode.el = subTree.el;
      },
      {
        scheduler() {
          queueJob(instance.update);
        },
      }
    );
  }

  /**
   * 检测props是否发生变化
   *
   * @param {*} prevProps
   * @param {*} nextProps
   */
  function hasPropsChanged(prevProps, nextProps) {
    //  对比props的数量是否发生变化
    if (Object.keys(prevProps).length !== Object.keys(nextProps).length) {
      return true;
    }

    //  如果对应的key的值不一样
    for (const key in nextProps) {
      if (nextProps[key] !== prevProps[key]) {
        return true;
      }
    }

    return false;
  }

  /**
   * 更新组件
   *
   * @param {*} n1
   * @param {*} n2
   * @param {*} container
   */
  function patchComponent(n1, n2, container) {
    //  获取组件实例，让新的虚拟节点也指向同一个实例
    const instance = (n2.component = n1.component);

    //  获取当前的props
    const { props } = instance;

    //  这是指的父组件传递的props是否发生变化
    const hasChanged = hasPropsChanged(n1.props, n2.props);

    n2.el = n1.el;

    //  只有变化了才需要更新
    if (hasChanged) {
      const { props: nextProps } = resolveProps(n2.type.props, n2.props);

      //  更新props
      for (const key in nextProps) {
        props[key] = nextProps[key];
      }

      //  删除不存在的props
      for (const key in props) {
        if (!(key in nextProps)) {
          delete props[key];
        }
      }
    } else {
    }
  }

  /**
   * 挂载元素
   *
   * @param vnode
   * @param container
   */
  function mountElement(vnode, container, anchor) {
    // const el = document.createElement(vnode.type);
    // const el = createElement(vnode.type);

    //  让vnode记录记录下真实节点
    const el = (vnode.el = createElement(vnode.type));

    if (typeof vnode.children === "string") {
      // el.textContent = vnode.children;
      setElementText(el, vnode.children);
    } else if (Array.isArray(vnode.children)) {
      vnode.children.forEach((child) => {
        patch(null, child, el, anchor);
      });
    }

    if (vnode.props) {
      for (const key in vnode.props) {
        // el.setAttribute(key, vnode.props[key]);
        patchProps(el, key, null, vnode.props[key]);
      }
    }

    // container.appendChild(el);
    insert(el, container, anchor);
  }

  /**
   * 打补丁
   *
   * @param {*} n1
   * @param {*} n2
   * @param {*} container
   */
  function patchElement(n1, n2, container) {
    const el = (n2.el = n1.el);

    const oldProps = n1.props;
    const newProps = n2.props;

    //  更新props
    for (const key in newProps) {
      if (newProps[key] !== oldProps[key]) {
        patchProps(el, key, oldProps[key], newProps[key]);
      }
    }

    //  新的没有，旧的有的props就移除掉
    for (const key in oldProps) {
      if (!(key in newProps)) {
        patchProps(el, key, oldProps[key], null);
      }
    }

    //  更新children
    //  我们需要考虑的情况如下
    //  没有子节点 / 文本子节点 / 多个子节点 的排列组合共(3*3种情况)
    patchChildren(n1, n2, el);
  }

  /**
   * 对子节点打补丁
   *
   * @param {*} n1
   * @param {*} n2
   * @param {*} container
   */
  function patchChildren(n1, n2, container) {
    if (typeof n2.children === "string") {
      //  这是最简单的一种情况，除了多个子节点的情况下要先去一个个去Unmount
      //  然后直接设置文本即可
      if (Array.isArray(n1.children)) {
        n1.children.forEach((c) => unmount(c));
      }

      setElementText(container, n2.children);
    } else if (Array.isArray(n2.children)) {
      if (Array.isArray(n1.children)) {
        // violentDiff(n1, n2, container);
        // simpleDiff(n1, n2, container);
        // twoSideDiff(n1, n2, container);
        fastDiff(n1, n2, container);
      } else {
        //  此时旧节点是文本节点或者空节点，这时候内容清空再循环把新节点挂上去即可
        setElementText(container, "");
        n2.children.forEach((c) => patch(null, c, container));
      }
    } else {
      //  新节点为空，把旧节点全部移除掉
      if (Array.isArray(n1.children)) {
        n1.children.forEach((c) => unmount(c));
      } else if (typeof n1.children === "string") {
        setElementText(container, "");
      }
      //  如果本来就是空的，不用管
    }
  }

  /**
   * 暴力diff
   *
   * @param {*} n1
   * @param {*} n2
   * @param {*} container
   */
  function violentDiff(n1, n2, container) {
    const oldChildren = n1.children;
    const newChildren = n2.children;

    const oldLen = oldChildren.length;
    const newLen = newChildren.length;
    const commonLength = Math.min(oldLen, newLen);

    //  取双方较短的一方，新节点多出来就挂载，旧节点多出来的就卸载
    for (let i = 0; i < commonLength; i++) {
      patch(oldChildren[i], newChildren[i], container);
    }

    if (newLen > oldLen) {
      for (let i = commonLength; i < newLen; i++) {
        patch(null, newChildren[i], container);
      }
    } else if (oldLen > newLen) {
      for (let i = commonLength; i < oldLen; i++) {
        unmount(oldChildren[i]);
      }
    }
  }

  /**
   * 简单diff
   *
   * @param {*} n1
   * @param {*} n2
   * @param {*} container
   */
  function simpleDiff(n1, n2, container) {
    const oldChildren = n1.children;
    const newChildren = n2.children;

    //  用来记录寻找过程中遇到的最大索引值
    let lastIndex = 0;
    for (let i = 0; i < newChildren.length; i++) {
      const newVNode = newChildren[i];

      //  判断是否能在旧的vdom中找到，找不到说明新的vdom有新节点
      let find = false;
      for (let j = 0; j < oldChildren.length; j++) {
        const oldVNode = oldChildren[j];

        if (newVNode.key === oldVNode.key) {
          find = true;
          //  复用节点，更新内容
          patch(oldVNode, newVNode, container);

          //  复用节点，移动位置
          if (j < lastIndex) {
            const prevNode = newChildren[i - 1];
            if (prevNode) {
              const anchor = prevNode.el.nextSibling;
              insert(newVNode.el, container, anchor);
            }
          } else {
            lastIndex = j;
          }
          break;
        }
      }

      //  新的vdom中有新的节点
      if (!find) {
        const prevNode = newChildren[i - 1];
        let anchor = null;
        if (prevNode) {
          anchor = prevNode.el.nextSibling;
        } else {
          anchor = container.firstChild;
        }
        patch(null, newVNode, container, anchor);
      }
    }

    //  反向的从旧节点里面找新节点，没有的话说明是需要移除的
    for (let i = 0; i < oldChildren.length; i++) {
      const oldVnode = oldChildren[i];

      const has = newChildren.find((v) => v.key === oldVnode.key);

      if (!has) {
        unmount(oldVnode);
      }
    }
  }

  /**
   * 双端diff
   *
   * @param {*} n1
   * @param {*} n2
   * @param {*} container
   */
  function twoSideDiff(n1, n2, container) {
    const oldChildren = n1.children;
    const newChildren = n2.children;

    //  索引
    let oldStartIndex = 0;
    let oldEndIndex = oldChildren.length - 1;
    let newStartIndex = 0;
    let newEndIndex = newChildren.length - 1;

    //  节点
    let oldStartVNode = oldChildren[oldStartIndex];
    let oldEndVNode = oldChildren[oldEndIndex];
    let newStartVNode = newChildren[newStartIndex];
    let newEndVNode = newChildren[newEndIndex];

    while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
      //  下面我们有处理过的节点会被设为undefined，这时继续移动即可

      if (!oldStartVNode) {
        oldStartVNode = oldChildren[++oldStartIndex];
      } else if (!oldEndVNode) {
        oldEndVNode = oldChildren[--oldEndIndex];
      }
      //  首尾对比
      else if (oldStartVNode.key === newStartVNode.key) {
        patch(oldStartVNode, newStartVNode, container);

        oldStartVNode = oldChildren[++oldStartIndex];
        newStartVNode = newChildren[++newStartIndex];
      } else if (oldEndVNode.key === newEndVNode.key) {
        patch(oldEndVNode, newEndVNode, container);

        oldEndVNode = oldChildren[--oldEndIndex];
        newEndVNode = newChildren[--newEndIndex];
      } else if (oldStartVNode.key === newEndVNode.key) {
        patch(oldStartVNode, newEndVNode, container);

        //  把旧的头部节点，插入到旧的尾部节点后面
        insert(oldStartVNode.el, container, oldEndVNode.el.nextSibling);

        oldStartVNode = oldChildren[++oldStartIndex];
        newEndVNode = newChildren[--newEndIndex];
      } else if (oldEndVNode.key === newStartVNode.key) {
        //  旧节点由尾节点成为头节点

        //  更新内容
        patch(oldEndVNode, newStartVNode, container);

        //  移动节点，把旧的尾部节点，插入到旧的头部节点前面
        insert(oldEndVNode.el, container, oldStartVNode.el);

        //  移动完成后，更新索引值和节点
        oldEndVNode = oldChildren[--oldEndIndex];
        newStartVNode = newChildren[++newStartIndex];
      } else {
        //  上面4种情况只是理想情况下的，更多时候是双端找不到，这时候需要处理
        const idxInOld = oldChildren.findIndex(
          (node) => node.key === newStartVNode.key
        );

        //  为什么不考虑0，因为0已经是上面4种情况中的头相等
        if (idxInOld > 0) {
          const vnodeInOld = oldChildren[idxInOld];
          patch(vnodeInOld, newStartVNode, container);

          //  插入到旧的头部节点之前
          insert(vnodeInOld.el, container, oldStartVNode.el);

          //  此处节点对应的真实dom已经移动，设为undefined
          oldChildren[idxInOld] = undefined;

          //  最后更新newStartIndex到下一个位置
          newStartVNode = newChildren[++newStartIndex];
        }
      }
    }
  }

  /**
   * 快速diff
   *
   * @description 尽可能的找到多相同的部分
   *
   * @param {*} n1
   * @param {*} n2
   * @param {*} container
   */
  function fastDiff(n1, n2, container) {
    const oldChildren = n1.children;
    const newChildren = n2.children;

    //  更新相同的前置节点
    let j = 0;
    let oldVNode = oldChildren[j];
    let newVNode = newChildren[j];

    let commonLength =
      oldChildren.length < newChildren.length
        ? oldChildren.length
        : newChildren.length;

    //  向右遍历，直到遇到key不同的节点
    while (oldVNode.key === newVNode.key && j < commonLength - 1) {
      //  更新节点
      patch(oldVNode, newVNode, container);
      j++;
      oldVNode = oldChildren[j];
      newVNode = newChildren[j];
    }

    //  更新相同的后置节点
    let oldEnd = oldChildren.length - 1;
    let newEnd = newChildren.length - 1;
    oldVNode = oldChildren[oldEnd];
    newVNode = newChildren[newEnd];

    while (oldVNode.key === newVNode.key && oldEnd > 0 && newEnd > 0) {
      //  更新节点
      patch(oldVNode, newVNode, container);
      oldEnd--;
      newEnd--;
      oldVNode = oldChildren[oldEnd];
      newVNode = newChildren[newEnd];
    }

    //  判断是否有新节点需要挂载
    if (j > oldEnd && j <= newEnd) {
      //  此时旧节点已经遍历完,剩下新节点需要挂载
      const anchorIndex = newEnd + 1;
      let anchor;

      //  选取尾坐标的后一位作为锚点，但是可能尾坐标后一位是空的
      if (anchorIndex >= newChildren.length + 1) {
        anchor = null;
      } else {
        anchor = newChildren[anchorIndex].el;
      }

      while (j <= newEnd) {
        patch(null, newChildren[j++], container, anchor);
      }
    } else if (j > newEnd && j <= oldEnd) {
      //  判断是否有旧节点需要卸载
      while (j <= oldEnd) {
        unmount(oldChildren[j++]);
      }
    } else {
      //  上述都是理想化的例子，剩下的是思考是否有节点可以通过移动来尽可能的复用
      const count = newEnd - j + 1;

      //  已经处理完了，不需要操作
      if (count <= 0) {
        return;
      }

      //  新的一组节点来记录未处理节点在旧节点中的位置
      const source = new Array(count).fill(-1);

      const oldStart = j;
      const newStart = j;

      //  是否需要移动
      let moved = false;
      //  像简单diff中的记录最大索引，如果索引是呈递增趋势的，则不需要移动
      let pos = 0;

      //  key在新节点中的 key -> index 索引表
      const keyInNewChildrenIndex = {};

      //  记录更新过的节点
      let patched = 0;

      for (let i = newStart; i <= newEnd; i++) {
        keyInNewChildrenIndex[newChildren[i].key] = i;
      }

      for (let i = oldStart; i <= oldEnd; i++) {
        const oldVNode = oldChildren[i];

        if (patched <= count) {
          const k = keyInNewChildrenIndex[oldVNode.key];
          if (k !== undefined) {
            const newVNode = newChildren[k];
            patch(oldVNode, newVNode, container);
            patched++;

            source[k - newStart] = i;

            //  判断是否移动
            if (k < pos) {
              moved = true;
            } else {
              pos = k;
            }
          } else {
            //  key不存在，代表该节点需要移除
            unmount(oldVNode);
          }
        } else {
          //  如果更新过的节点超过需要更新的节点，则卸载多余的节点
          unmount(oldVNode);
        }
      }

      //  需要移动
      if (moved) {
        //  获取最长递增子序列，找不需要移动的元素的索引
        //  source = [2,3,1,-1] -> [2,3] -> [0,1]
        const seq = getSequence(source);

        //  s 指向最长递增子序列的最后一个元素
        let s = seq.length - 1;
        //  i 指向新的一组节点的最后一个元素
        let i = count - 1;

        //  倒序遍历，如果i不在seq中，说明需要移动
        for (i; i >= 0; i--) {
          if (source[i] === -1) {
            //  -1 表示该节点需要挂载
            const pos = newStart + i;
            const newVNode = newChildren[pos];

            const nextPos = pos + 1;

            const anchor =
              nextPos < newChildren.length ? newChildren[nextPos].el : null;
            patch(null, newVNode, container, anchor);
          } else if (i != seq[s]) {
            //  移动元素
            const pos = newStart + i;
            const newVNode = newChildren[pos];

            const nextPos = pos + 1;

            const anchor =
              nextPos < newChildren.length ? newChildren[nextPos].el : null;
            insert(newVNode.el, container, anchor);
          } else {
            s--;
          }
        }
      }
    }
  }

  function hydrate(vnode, container) {}

  return { render, hydrate };
}

/**
 * 判断props是否需要通过dom attribute去设置
 *
 * @param {*} el
 * @param {*} key
 * @param {*} value
 * @returns {boolean}
 */
function shouldSetAsProps(el, key, value) {
  //  <input form="form1" />  这个在el.form中是只读的，只能通过setAttribute
  if (key === "form" && el.tagName === "INPUT") return false;

  return key in el;
}

/**
 * 格式化类名
 *
 * @param {string | Array | object} cls
 * @returns
 */
function normalizeClass(cls) {
  if (Array.isArray(cls)) {
    let str = "";
    cls.forEach((key) => {
      str += normalizeClass(key) + " ";
    });
    return str;
  } else if (typeof cls === "string") {
    return cls;
  } else if (typeof cls === "object") {
    let truthyCls = Object.keys(cls).filter((item) => cls[item]);
    return truthyCls.join(" ");
  }

  return "";
}

export const renderer = createRenderer({
  //  创建元素
  createElement(tag) {
    return document.createElement(tag);
  },

  //  给元素设置文本节点
  setElementText(el, text) {
    el.textContent = text;
  },

  //  用于给定的parent添加指定元素 / 移动元素
  insert(el, parent, anchor = null) {
    parent.insertBefore(el, anchor);
  },

  createText(text) {
    return document.createTextNode(text);
  },

  setText(el, text) {
    el.nodeValue = text;
  },

  createComment(text) {
    return document.createComment(text);
  },

  patchProps(el, key, prevValue, nextValue) {
    const isEvent = /^on/.test(key);

    if (key === "class") {
      // 性能上来说 el.className > classList.add > el.setAttribute

      el.className = normalizeClass(nextValue) || "";
    } else if (isEvent) {
      // const eventName = key.slice(2).toLowerCase();

      // //  更新事件，需要先把之前的事件卸载掉，再挂上新事件
      // prevValue && el.removeEventListener(eventName, prevValue);

      // el.addEventListener(eventName, nextValue);

      //  优化版本
      //  我们可以绑定一个伪造的事件处理函数 invoker, 然后把真正的事件处理函数
      //  设置为invoker.value 属性的值，这样当更新事件的时候，我们将不再需要调用removeEventListener
      //  而是直接更新上一次绑定的值

      //  不过，我们需要考虑到，我们会给同一个元素绑上不同的事件, input change focus等，所以需要对象结构
      //  另外，就算同一个事件名也会有多个，所以需要数组。
      //  这个设计与订阅发布很像。

      //  vei -> vue event inkovers
      const invokers = el._vei || (el._vei = {});

      const eventName = key.slice(2).toLowerCase();

      let invoker = invokers[key];

      //  要注意一件事情：
      //  在更新的时候，事件冒泡会比事件绑定慢（详情看p202）
      //  解决方案：屏蔽所有绑定时间晚于事件触发时间的时间处理函数的执行

      if (nextValue) {
        if (!invoker) {
          invoker = el._vei[key] = (e) => {
            if (e.timeStamp < invoker.attached) return;

            if (Array.isArray(invoker.value)) {
              invoker.value.forEach((fn) => fn(e));
            } else {
              invoker.value(e);
            }
          };
          invoker.value = nextValue;
          //  记录事件处理函数被绑定的事件
          invoker.attached = performance.now();
          el.addEventListener(eventName, invoker);
        } else {
          invoker.value = nextValue;
        }
      } else if (invoker) {
        el.removeEventListener(eventName, invoker);
      }
    } else if (shouldSetAsProps(el, key, nextValue)) {
      const type = typeof el[key];

      //  做矫正，例如 <div disabled> => disabled: ""->disabled: false 和 {disabled: false} => disabled: "false"
      //  上面两种都是歧义，需要人工做矫正

      if (type === "boolean" && nextValue === "") {
        el[key] = true;
      } else {
        el[key] = nextValue;
      }
    } else {
      el.setAttribute(key, nextValue);
    }
  },
});

export const Text = Symbol();

export const Comment = Symbol();

export const Fragment = Symbol();

/**
 * 最长递增子序列
 *
 * @param {number[]} arr 索引数组
 * @returns {number[]} 最长递增子序列的索引
 */
export function getSequence(arr) {
  if (arr.length <= 0) return [];

  //  有数据的情况下必定包含一项
  //  记录arr的索引
  const result = [0];

  //  记录当每一项i修改result时,result的前一项是什么
  //  然后从后往前遍历，因为最后一项必定是最大的
  let p = arr.slice();

  //  记录结果数组中的最后一项，如果遍历发现比他大的则push
  let resultLast;

  for (let i = 0; i < arr.length; i++) {
    const arrI = arr[i];

    //  -1 表示是要新增的，这边不需要处理
    if (arrI !== -1) {
      const last = result.length - 1;
      resultLast = result[last];

      if (arrI > arr[resultLast]) {
        result.push(i);
        p[i] = resultLast;
        continue;
      }

      //  二分查找，找到当前项在result中比他大的一项
      let start = 0,
        end = result.length - 1,
        middle;

      while (start < end) {
        middle = (start + end) >> 1;

        if (arr[result[middle]] < arrI) {
          start = middle + 1;
        } else {
          end = middle;
        }
      }

      if (arr[result[end]] > arrI) {
        result[end] = i;
        p[i] = result[end - 1];
      }
    }
  }

  let i = result.length;
  let last = result[i - 1];

  while (i-- > 0) {
    result[i] = last;
    last = p[last];
  }

  return result;
}

//  任务缓存队列
const queue = new Set();
//  是否正在处理任务队列
let isFlushing = false;

const p = Promise.resolve();

function queueJob(job) {
  queue.add(job);
  if (!isFlushing) {
    isFlushing = true;
    p.then(() => {
      try {
        queue.forEach((j) => j());
      } catch (e) {
        console.log("[QueueJob Error]: ", e);
      } finally {
        isFlushing = false;
      }
    });
  }
}

export function nextTick(cb) {
  return p.then(() => {
    cb && cb();
  });
}
