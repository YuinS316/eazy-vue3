import {
  it,
  expect,
  runner,
  beforeEach,
  afterEach,
  vi,
  trigger,
} from "../test-runner.js";
import {
  renderer,
  getSequence,
  Text,
  Comment,
  Fragment,
  nextTick,
  onMounted,
  defaultAsyncComponent,
} from "../index.js";
import { ref } from "../../../lib/reactivity.js";

beforeEach(() => {
  // vi.useFakeTimers();
});

afterEach(() => {
  // vi.useRealTimers();
  // renderer.render(null, document.querySelector("#app"));
  // document.querySelector("#app").innerHTML = "";
});

it("happy path", async () => {
  const MyComponent = {
    name: "MyComponent",
    render() {
      return {
        type: "div",
        children: "I'm MyComponent",
      };
    },
  };

  const AsyncComp = defaultAsyncComponent({
    loader: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(MyComponent);
          setTimeout(() => {
            expect(app.firstChild.textContent).toBe("I'm MyComponent");
          });
        }, 0);
      });
    },
  });

  const VNode = {
    type: AsyncComp,
  };

  renderer.render(VNode, document.querySelector("#app"));
  const app = document.querySelector("#app");
  expect(app.firstChild.textContent).toBe("loading");
});

it.only("timeout & errorComponent", async () => {
  const MyComponent = {
    name: "MyComponent",
    render() {
      return {
        type: "div",
        children: "I'm MyComponent",
      };
    },
  };

  const ErrorComponent = {
    name: "ErrorComponent",
    props: {
      error: Error,
    },
    setup(props) {
      return () => ({
        type: "div",
        children: props.error.message,
      });
    },
  };

  const AsyncComp = defaultAsyncComponent({
    loader: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(MyComponent);
        }, 500);
      });
    },
    errorComponent: ErrorComponent,
    timeout: 300,
  });

  const VNode = {
    type: AsyncComp,
  };

  renderer.render(VNode, document.querySelector("#app"));
  const app = document.querySelector("#app");

  expect(app.firstChild.textContent).toBe("loading");

  setTimeout(() => {
    expect(app.firstChild.textContent).toBe("loading");
  }, 200);

  setTimeout(() => {
    expect(app.firstChild.textContent).toBe(
      "Async component  timed out after 300 ms"
    );
  }, 400);

  setTimeout(() => {
    expect(app.firstChild.textContent).toBe("I'm MyComponent");
  }, 600);
});

runner("async component");
