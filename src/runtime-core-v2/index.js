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
  function patch(n1, n2, container) {
    //  节点类型不匹配
    if (n1 && n1.type !== n2.type) {
      unmount(n1);
      n1 = null;
    }

    const { type } = n2;

    if (typeof type === "string") {
      if (!n1) {
        //  n1不存在，表示挂载
        mountElement(n2, container);
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
  function mountElement(vnode, container) {
    // const el = document.createElement(vnode.type);
    // const el = createElement(vnode.type);

    //  让vnode记录记录下真实节点
    const el = (vnode.el = createElement(vnode.type));

    if (typeof vnode.children === "string") {
      // el.textContent = vnode.children;
      setElementText(el, vnode.children);
    } else if (Array.isArray(vnode.children)) {
      vnode.children.forEach((child) => {
        patch(null, child, el);
      });
    }

    if (vnode.props) {
      for (const key in vnode.props) {
        // el.setAttribute(key, vnode.props[key]);
        patchProps(el, key, null, vnode.props[key]);
      }
    }

    // container.appendChild(el);
    insert(el, container);
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
        //  新旧节点都是children，需要diff算法
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
      type: "div",
      props: {
        onClick() {
          console.log("父元素 click");
        },
      },
      children: [
        {
          type: "p",
          children: "children",
          props: {
            onClick() {
              flag = true;
              console.log("子元素 click");
            },
            // onMousedown: [
            //   () => {
            //     console.log("onMousedown--1");
            //   },
            //   () => {
            //     console.log("onMousedown--2");
            //   },
            // ],
          },
        },
      ],
    },
  ],
};

renderer.render(vnode, document.querySelector("#app"));

// setTimeout(() => {
//   renderer.render(null, document.querySelector("#app"));
// }, 5000);
