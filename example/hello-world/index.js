import { createApp, h } from "../../lib/index.js";

const App = {
  setup() {},

  render() {
    return h(
      "div",
      {
        id: "hello",
      },
      [
        h("div", { class: "red" }, "hello "),
        h("div", { class: "blue" }, "world"),
      ]
    );
  },
};

const el = document.querySelector("#app");

createApp(App).mount(el);
