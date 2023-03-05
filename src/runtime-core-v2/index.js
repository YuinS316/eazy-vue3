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
    } else {
      // 其他
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
        twoSideDiff(n1, n2, container);
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
      str += normalizeClass(key);
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

const renderer = createRenderer({
  //  创建元素
  createElement(tag) {
    return document.createElement(tag);
  },

  //  给元素设置文本节点
  setElementText(el, text) {
    el.textContent = text;
  },

  //  用于给定的parent添加指定元素
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

      el.className = nextValue || "";
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

const Text = Symbol();

const Comment = Symbol();

const Fragment = Symbol();

let flag = false;

const vnode = {
  type: "div",
  children: [
    {
      type: "p",
      key: 1,
      children: "1",
    },
    {
      type: "p",
      key: 2,
      children: "2",
    },
    {
      type: "p",
      key: 3,
      children: "3",
    },
    {
      type: "p",
      key: 4,
      children: "4",
    },
  ],
};

const vnode2 = {
  type: "div",
  children: [
    {
      type: "p",
      key: 2,
      children: "B",
    },
    {
      type: "p",
      key: 4,
      children: "D",
    },
    {
      type: "p",
      key: 1,
      children: "A",
    },
    {
      type: "p",
      key: 3,
      children: "C",
    },
  ],
};

renderer.render(vnode, document.querySelector("#app"));

setTimeout(() => {
  console.log("change--");
  renderer.render(vnode2, document.querySelector("#app"));
}, 3000);
