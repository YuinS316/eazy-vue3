import { it, expect, runner, beforeEach, afterEach } from "./test-runner.js";
import { renderer, getSequence } from "./index.js";

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
  expect(realInnerHTML).toBe(`<div><p>1</p><p>2</p><p>3</p><p>4</p></div>`);

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

it("test moved", () => {
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
      {
        type: "p",
        key: 6,
        children: "6",
      },
      {
        type: "p",
        key: 5,
        children: "5",
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
        key: 3,
        children: "C",
      },
      {
        type: "p",
        key: 4,
        children: "D",
      },
      {
        type: "p",
        key: 2,
        children: "B",
      },
      {
        type: "p",
        key: 7,
        children: "G",
      },
      {
        type: "p",
        key: 5,
        children: "E",
      },
    ],
  };

  renderer.render(oldVNode, document.querySelector("#app"));
  let realInnerHTML = document.querySelector("#app").innerHTML;
  expect(realInnerHTML).toBe(
    `<div><p>1</p><p>2</p><p>3</p><p>4</p><p>6</p><p>5</p></div>`
  );

  renderer.render(newVNode, document.querySelector("#app"));
  realInnerHTML = document.querySelector("#app").innerHTML;
  expect(realInnerHTML).toBe(
    `<div><p>A</p><p>C</p><p>D</p><p>B</p><p>G</p><p>E</p></div>`
  );
});

it("test getSeqence", () => {
  const source = [3, 2, 8, 9, 5, 6, 7, 11, 15, 4];
  const result = getSequence(source);

  expect(result).toEqual([1, 4, 5, 6, 7, 8]);
});

runner("diff");
