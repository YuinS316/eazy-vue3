import { createApp, h } from "../../lib/index.js";

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
      [
        h("div", { class: "red" }, "hello "),
        h("div", { class: "blue" }, "world"),
        h("div", {}, this.msg),
      ]
    );
  },
};

const el = document.querySelector("#app");

createApp(App).mount(el);
