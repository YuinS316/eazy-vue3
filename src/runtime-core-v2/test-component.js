import {
  it,
  expect,
  runner,
  beforeEach,
  afterEach,
  vi,
} from "./test-runner.js";
import {
  renderer,
  getSequence,
  Text,
  Comment,
  Fragment,
  nextTick,
} from "./index.js";

beforeEach(() => {});

afterEach(() => {
  // renderer.render(null, document.querySelector("#app"));
  // document.querySelector("#app").innerHTML = "";
});

it("mount component", () => {
  const MyComponent = {
    name: "MyComponent",
    render() {
      return {
        type: "div",
        children: "I'm MyComponent",
      };
    },
  };
  const VNode = {
    type: MyComponent,
  };
  renderer.render(VNode, document.querySelector("#app"));
  let realInnerHTML = document.querySelector("#app").innerHTML;
  expect(realInnerHTML).toBe(`<div>I'm MyComponent</div>`);
});

it("stateful component", () => {
  const MyComponent = {
    name: "MyComponent",
    data() {
      return {
        foo: "hello world",
      };
    },
    render() {
      return {
        type: "div",
        children: `foo: ${this.foo}`,
      };
    },
  };
  const VNode = {
    type: MyComponent,
  };
  renderer.render(VNode, document.querySelector("#app"));
  let realInnerHTML = document.querySelector("#app").innerHTML;
  expect(realInnerHTML).toBe(`<div>foo: hello world</div>`);
});

it("props component", () => {
  const MyComponent = {
    name: "MyComponent",
    props: {
      foo: String,
    },
    data() {
      return {};
    },
    render() {
      return {
        type: "div",
        children: `foo: ${this.foo}`,
      };
    },
  };
  const VNode = {
    type: MyComponent,
    props: {
      foo: "hello world",
    },
  };
  renderer.render(VNode, document.querySelector("#app"));
  let realInnerHTML = document.querySelector("#app").innerHTML;
  expect(realInnerHTML).toBe(`<div>foo: hello world</div>`);
});

it("props changed", async () => {
  const MyComponent = {
    name: "MyComponent",
    props: {
      foo: String,
    },
    data() {
      return {};
    },
    render() {
      return {
        type: "div",
        children: `foo: ${this.foo}`,
      };
    },
  };
  const VNode = {
    type: MyComponent,
    props: {
      foo: "hello world",
    },
  };
  renderer.render(VNode, document.querySelector("#app"));
  let realInnerHTML = document.querySelector("#app").innerHTML;
  expect(realInnerHTML).toBe(`<div>foo: hello world</div>`);

  const DifferentComponent = {
    name: "DifferentComponent",
    props: {
      foo: String,
    },
    data() {
      return {};
    },
    render() {
      return {
        type: "p",
        children: `foo: ${this.foo}`,
      };
    },
  };

  const newVNode = {
    type: DifferentComponent,
    props: {
      foo: "hello new world",
    },
  };
  renderer.render(newVNode, document.querySelector("#app"));

  await nextTick();
  realInnerHTML = document.querySelector("#app").innerHTML;
  expect(realInnerHTML).toBe(`<p>foo: hello new world</p>`);
});

runner("component");
