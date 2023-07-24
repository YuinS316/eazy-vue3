import {
  it,
  expect,
  runner,
  beforeEach,
  afterEach,
  vi,
  trigger,
} from "./test-runner.js";
import {
  renderer,
  getSequence,
  Text,
  Comment,
  Fragment,
  nextTick,
} from "./index.js";
import { ref } from "../../lib/reactivity.js";

beforeEach(() => {});

afterEach(() => {
  renderer.render(null, document.querySelector("#app"));
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

it("setup", () => {
  const MyComponent = {
    name: "MyComponent",
    props: {
      foo: String,
    },
    setup(props, setupContext) {
      const { attrs } = setupContext;

      return {
        bar: attrs.bar,
      };
    },
    render() {
      return {
        type: "div",
        children: [
          {
            type: "div",
            children: `foo: ${this.foo}`,
          },
          {
            type: "div",
            children: `bar: ${this.bar}`,
          },
        ],
      };
    },
  };
  const VNode = {
    type: MyComponent,
    props: {
      foo: "hello world",
      bar: "attr bar",
    },
  };
  renderer.render(VNode, document.querySelector("#app"));
  let realInnerHTML = document.querySelector("#app").innerHTML;
  expect(realInnerHTML).toBe(
    `<div><div>foo: hello world</div><div>bar: attr bar</div></div>`
  );
});

it("emit", async () => {
  const MyComponent = {
    name: "MyComponent",
    props: {
      foo: String,
      onUpdateFoo: Function,
    },
    setup(props, setupContext) {
      const { emit } = setupContext;
      const handleUpdateFoo = () => {
        emit("onUpdateFoo", "update foo");
      };
      return {
        handleUpdateFoo,
      };
    },
    render() {
      return {
        type: "div",
        props: {
          onClick: this.handleUpdateFoo,
        },
        children: `foo: ${this.foo}`,
      };
    },
  };

  const AppComponent = {
    name: "App",
    setup() {
      let foo = ref("hello world");
      const handleUpdateFoo = (str) => {
        console.log("receive--", str);
        foo.value = str;
      };
      return {
        foo,
        handleUpdateFoo,
      };
    },
    render() {
      return {
        type: MyComponent,
        props: {
          foo: this.foo,
          onUpdateFoo: this.handleUpdateFoo,
        },
      };
    },
  };

  const VNode = {
    type: AppComponent,
  };
  renderer.render(VNode, document.querySelector("#app"));
  let realInnerHTML = document.querySelector("#app").innerHTML;
  expect(realInnerHTML).toBe(`<div>foo: hello world</div>`);

  trigger(document.querySelector("#app").firstElementChild, "click");

  await nextTick();
  realInnerHTML = document.querySelector("#app").innerHTML;
  expect(realInnerHTML).toBe(`<div>foo: update foo</div>`);
});

it.only("test slots", () => {
  const AppComponent = {
    name: "App",
    setup() {
      let foo = ref("hello world");
      return {
        foo,
      };
    },
    render() {
      return {
        type: "div",
        children: [
          {
            type: "div",
            children: [this.$slots.default()],
          },
          {
            type: "div",
            children: [this.$slots.body()],
          },
        ],
      };
    },
  };

  const VNode = {
    type: AppComponent,
    children: {
      default() {
        return {
          type: Text,
          children: "this is default",
        };
      },
      body() {
        return {
          type: Text,
          children: "this is body",
        };
      },
    },
  };

  renderer.render(VNode, document.querySelector("#app"));
  let realInnerHTML = document.querySelector("#app").innerHTML;
  expect(realInnerHTML).toBe(
    `<div><div>this is default</div><div>this is body</div></div>`
  );
});

runner("component");
