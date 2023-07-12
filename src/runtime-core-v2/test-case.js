import { it, expect, runner, beforeEach, afterEach } from "./test-runner.js";
import { renderer } from "./index.js";

beforeEach(() => {});

afterEach(() => {
  renderer.render(null, document.querySelector("#app"));
});

it("happy path", () => {
  const oldVNode = {
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
      // {
      //   type: "p",
      //   key: 3,
      //   children: "3",
      // },
      {
        type: "p",
        key: 4,
        children: "4",
      },
    ],
  };

  const newVNode = {
    type: "div",
    children: [
      {
        type: "p",
        key: 1,
        children: "A",
      },
      {
        type: "p",
        key: 2,
        children: "B",
      },
      {
        type: "p",
        key: 3,
        children: "C",
      },
      {
        type: "p",
        key: 4,
        children: "D",
      },
    ],
  };

  renderer.render(oldVNode, document.querySelector("#app"));
  let realInnerHTML = document.querySelector("#app").innerHTML;
  expect(realInnerHTML).toBe(`<div><p>1</p><p>2</p><p>4</p></div>`);

  renderer.render(newVNode, document.querySelector("#app"));
  realInnerHTML = document.querySelector("#app").innerHTML;
  expect(realInnerHTML).toBe(`<div><p>A</p><p>B</p><p>C</p><p>D</p></div>`);
});

it("remove more", () => {
  const oldVNode = {
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

  const newVNode = {
    type: "div",
    children: [
      {
        type: "p",
        key: 1,
        children: "A",
      },
      {
        type: "p",
        key: 2,
        children: "B",
      },
      // {
      //   type: "p",
      //   key: 3,
      //   children: "C",
      // },
      {
        type: "p",
        key: 4,
        children: "D",
      },
    ],
  };

  renderer.render(oldVNode, document.querySelector("#app"));
  let realInnerHTML = document.querySelector("#app").innerHTML;
  expect(realInnerHTML).toBe(`<div><p>1</p><p>2</p><p>3</p><p>4</p></div>`);

  renderer.render(newVNode, document.querySelector("#app"));
  realInnerHTML = document.querySelector("#app").innerHTML;
  expect(realInnerHTML).toBe(`<div><p>A</p><p>B</p><p>D</p></div>`);
});

it("mount more", () => {
  const oldVNode = {
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
      // {
      //   type: "p",
      //   key: 3,
      //   children: "3",
      // },
      {
        type: "p",
        key: 4,
        children: "4",
      },
    ],
  };

  const newVNode = {
    type: "div",
    children: [
      {
        type: "p",
        key: 1,
        children: "A",
      },
      {
        type: "p",
        key: 2,
        children: "B",
      },
      {
        type: "p",
        key: 3,
        children: "C",
      },
      {
        type: "p",
        key: 4,
        children: "D",
      },
    ],
  };

  renderer.render(oldVNode, document.querySelector("#app"));
  let realInnerHTML = document.querySelector("#app").innerHTML;
  expect(realInnerHTML).toBe(`<div><p>1</p><p>2</p><p>4</p></div>`);

  renderer.render(newVNode, document.querySelector("#app"));
  realInnerHTML = document.querySelector("#app").innerHTML;
  expect(realInnerHTML).toBe(`<div><p>A</p><p>B</p><p>C</p><p>D</p></div>`);
});

runner("diff");
