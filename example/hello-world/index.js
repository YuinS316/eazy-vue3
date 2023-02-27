import { createApp, h } from "../../lib/index.js";

const Foo = {
  setup(props) {
    console.log("props---", props);

    //  不可设置
    props.count++;
  },

  render() {
    return h("div", {}, "count is " + this.count);
  },
};

const App = {
  setup() {
    return {
      msg: "eazy-vue",
    };
  },

  render() {
    window._this = this;
    return h(
      "div",
      {
        id: "hello",
        onClick() {
          console.log("click");
        },
      },
      [h("p", {}, "from App"), h(Foo, { count: 1 })]
    );
  },
};

const el = document.querySelector("#app");

createApp(App).mount(el);
