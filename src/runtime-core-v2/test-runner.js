const cases = [];
const beforeEachCb = [];
const afterEachCb = [];

let isLock = false;

export function runner(unitName) {
  let successNums = 0;
  let failNums = 0;
  let total = cases.length;

  console.log(`======== ${unitName} start ========`);

  cases.forEach(({ name, cb }) => {
    console.log(` ===== ${name} start ====`);

    beforeEachCb.forEach((fn) => {
      fn();
    });

    try {
      cb();
      console.log("测试通过");
      successNums++;
    } catch (error) {
      console.error(error);
      failNums++;
    } finally {
      afterEachCb.forEach((fn) => {
        fn();
      });
    }

    console.log(` ===== ${name} end ====`);
  });

  console.log(`======== ${unitName} end ========`);
  console.log(`共成功用例 ${successNums} / ${total}`);
}

export const beforeEach = (cb) => {
  beforeEachCb.push(cb);
};

export const afterEach = (cb) => {
  afterEachCb.push(cb);
};

/**
 * @param {string} name
 * @param {Function} cb
 */
export function it(name, cb) {
  if (isLock) {
    return;
  }
  cases.push({
    name,
    cb,
  });
}

it.only = function (name, cb) {
  it(name, cb);
  isLock = true;
};

it.skip = function (name, cb) {};

/**
 *
 * @param {any} value
 */
export const expect = (value) => {
  return {
    toBe(val) {
      if (value === val) {
        return true;
      } else {
        throw new Error(`expect ${value} but got ${val}`);
      }
    },
    toContain(val) {
      if (typeof value === "string" || Array.isArray(value)) {
        if (!value.includes(val)) {
          throw new Error(`expect ${value} contains ${val} but not`);
        }
      }
    },
  };
};
