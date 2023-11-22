import {
  it,
  expect,
  runner,
  beforeEach,
  afterEach,
  vi,
} from "../test-runner.js";
import { renderer, getSequence, Text, Comment, Fragment } from "../index.js";

beforeEach(() => {});

afterEach(() => {
  renderer.render(null, document.querySelector("#app"));
});

it("mount Text", () => {
  const oldVNode = {
    type: Text,
    props: {},
    children: ["old text"],
  };

  renderer.render(oldVNode, document.querySelector("#app"));
  let realInnerHTML = document.querySelector("#app").innerHTML;
  expect(realInnerHTML).toBe(`old text`);

  const newVNode = {
    type: Text,
    props: {},
    children: ["new text"],
  };

  renderer.render(newVNode, document.querySelector("#app"));
  realInnerHTML = document.querySelector("#app").innerHTML;
  expect(realInnerHTML).toBe(`new text`);
});

it("test function call", () => {
  let a = 0;

  const onClick = (e) => {
    a = 10;
  };

  const mockClick = vi.fn(onClick);

  //  test add event listener
  const oldVNode = {
    type: "div",
    props: {
      id: "btn",
      onClick: mockClick,
    },
    children: ["button"],
  };
  renderer.render(oldVNode, document.querySelector("#app"));
  let el = document.querySelector("#btn");
  el && el.click();

  expect(onClick).toHaveBeenCalledTimes(1);
  expect(a).toBe(10);

  //  test change event listener
  const newOnClick = (e) => {
    a = 20;
  };

  const mockNewClick = vi.fn(newOnClick);

  const newVNode = {
    type: "div",
    props: {
      id: "btn",
      onClick: mockNewClick,
    },
    children: ["button"],
  };

  renderer.render(newVNode, document.querySelector("#app"));
  el = document.querySelector("#btn");
  el && el.click();

  expect(onClick).toHaveBeenCalledTimes(1);
  expect(onClick).toHaveBeenCalledTimes(1);
  expect(a).toBe(20);

  //  test remove event listener

  a = 0;

  const noEventVNode = {
    type: "div",
    props: {
      id: "btn",
    },
    children: ["button"],
  };

  renderer.render(noEventVNode, document.querySelector("#app"));
  el = document.querySelector("#btn");
  el && el.click();

  expect(onClick).toHaveBeenCalledTimes(1);
  expect(onClick).toHaveBeenCalledTimes(1);
  expect(a).toBe(0);
});

it("test string className", () => {
  //  test string class
  const stringClassVNode = {
    type: "div",
    props: {
      class: "abc d e",
    },
    children: [""],
  };

  renderer.render(stringClassVNode, document.querySelector("#app"));
  let className = document.querySelector("#app").firstElementChild.className;
  expect(className).toBe(`abc d e`);
});

it("test string array className", () => {
  //  test string class
  const stringClassVNode = {
    type: "div",
    props: {
      class: ["asd", "qwe"],
    },
    children: [""],
  };

  renderer.render(stringClassVNode, document.querySelector("#app"));
  let className = document.querySelector("#app").firstElementChild.className;
  expect(className).toBe(`asd qwe `);
});

it("test object array className", () => {
  //  test string class
  const stringClassVNode = {
    type: "div",
    props: {
      class: {
        asdf: true,
        qwer: false,
      },
    },
    children: [""],
  };

  renderer.render(stringClassVNode, document.querySelector("#app"));
  let className = document.querySelector("#app").firstElementChild.className;
  expect(className).toBe(`asdf`);
});

it("test mixed array className", () => {
  //  test string class
  const stringClassVNode = {
    type: "div",
    props: {
      class: [
        "qwert",
        {
          asdf: true,
          zxcv: false,
        },
      ],
    },
    children: [""],
  };

  renderer.render(stringClassVNode, document.querySelector("#app"));
  let className = document.querySelector("#app").firstElementChild.className;
  expect(className).toBe(`qwert asdf `);
});

runner("dom");
