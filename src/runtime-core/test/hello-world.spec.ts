/**
 * @vitest-environment happy-dom
 */

import { describe, it, test, expect, beforeEach } from "vitest";
import { createApp, h } from "../index";
import { Window } from "happy-dom";

interface LocalTestContext {
  window: Window;
  document: Window["document"];
}

describe("basis", () => {
  // beforeEach(async <LocalTestContext>(context) => {
  //   const window = new Window();
  //   context.window = window;
  //   context.document = window.document;
  //   document.body.innerHTML = `<div id="app"></div>`;
  // });
  // it<LocalTestContext>("hello-world", ({ window, document }) => {
  //   const App = {
  //     setup() {},
  //     render() {
  //       return h(
  //         "div",
  //         {
  //           id: "hello",
  //         },
  //         [
  //           h("div", { class: "red" }, "hello "),
  //           h("div", { class: "blue" }, "world"),
  //         ]
  //       );
  //     },
  //   };
  //   const el = document.querySelector("#app");
  //   createApp(App).mount(el);
  //   expect(el.innerHTML).toContain(`<div class="red">hello</div>`);
  // });
});
