import { createApp, h, renderSlots, createTextVNode } from "../../lib/runtime-core.js";

const Foo = {
  setup(props) {
    return {}
  },

  render() {
    console.log("this.$slots==", this.$slots)
    const foo = h("p", {}, "foo");

    //  普通插槽
    // const slot = renderSlots(this.$slots);
    // return h("div", {}, [foo, slot]);

    //  具名插槽
    // const header = renderSlots(this.$slots, "header");
    // const footer = renderSlots(this.$slots, "footer");
    // return h("div", {}, [header, foo, footer]);

    //  作用域插槽
    const age = 18;

    const header = renderSlots(this.$slots, "header", { age });
    const footer = renderSlots(this.$slots, "footer");
    return h("div", {}, [header, foo, footer]);
  },
};

const App = {
  setup() {
    return {

    };
  },

  render() {
    const app = h("div", {}, "App");

    //  普通插槽(已禁用)
    // const foo = h(Foo, {}, "123");

    //  具名插槽
    // const foo = h(Foo, {}, {
    //   header: h("p", {}, "header"),
    //   footer: h("p", {}, "footer")
    // });

    //  作用域插槽
    const foo = h(Foo, {}, {
      header: ({ age }) => [h("p", {}, "header" + age), createTextVNode('text123')],
      footer: () => h("p", {}, "footer")
    });

    return h(
      "div",
      {

      },
      [app, foo]
    );
  },
};

const el = document.querySelector("#app");

createApp(App).mount(el);
