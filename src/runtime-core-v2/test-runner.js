const cases = [];
const beforeEachCb = [];
const afterEachCb = [];
const spyMap = new WeakMap();

//  清除
function cleanup() {
  cases.length = 0;
  beforeEachCb.length = 0;
  afterEachCb.length = 0;
}

export async function runner(unitName) {
  let runCases = cases.filter((c) => c.options.skip !== true);

  let onlyCases = cases.filter((c) => c.options.only === true);

  if (onlyCases.length > 0) {
    runCases = onlyCases;
  }

  let successNums = 0;
  let failNums = 0;
  let total = runCases.length;

  console.log(`======== ${unitName} start ========`);

  for (const cases of runCases) {
    const { name, cb } = cases;
    console.log(` ===== ${name} start ====`);

    beforeEachCb.forEach((fn) => {
      fn();
    });

    try {
      await cb();
      console.log(" | > 结果：测试通过");
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
  }

  console.log(`======== ${unitName} end ========`);
  console.log(`共成功用例 ${successNums} / ${total}`);
  cleanup();
  console.log("\n");
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
export function it(
  name,
  cb,
  options = {
    only: false,
    skip: false,
  }
) {
  cases.push({
    name,
    cb,
    options,
  });
}

it.only = function (name, cb) {
  it(name, cb, {
    only: true,
    skip: false,
  });
};

it.skip = function (name, cb) {
  it(name, cb, {
    only: false,
    skip: true,
  });
};

const type = (target) => {
  const type = Object.prototype.toString.call(target);

  return type.slice(8, -1);
};

const isEqual = (source, target) => {
  if (type(source) !== type(target)) {
    return false;
  }

  switch (type(target)) {
    case "Array": {
      if (target.length !== source.length) {
        return false;
      }

      let flag = true;

      for (let i = 0; i < source.length; i++) {
        const expValue = source[i];
        const toEqualValue = target[i];
        flag = flag && isEqual(expValue, toEqualValue);
      }

      return flag;
    }
    case "Object": {
      let flag = true;
      for (const key in source) {
        const expValue = source[key];
        const toEqualValue = target[key];
        flag = flag && isEqual(expValue, toEqualValue);
      }
      return flag;
    }
    case "Null":
    case "Undefined":
    case "Number":
    case "String": {
      return Object.is(target, source);
    }
    default: {
      return false;
    }
  }
};

export const vi = {
  fn(cb) {
    if (!spyMap[cb]) {
      spyMap[cb] = 0;
    }
    return function (...args) {
      spyMap[cb]++;
      cb(...args);
    };
  },
};

/**
 *
 * @param {any} value
 */
export const expect = (value) => {
  //  是否开启not
  let isSetNot = false;

  return {
    get not() {
      isSetNot = true;
      return this;
    },
    toBe(val) {
      if (!isSetNot && value !== val) {
        throw new Error(`expect "${val}" but got "${value}"`);
      } else if (isSetNot && value === val) {
        throw new Error(`expect not to be "${val}" but got "${value}"`);
      }
    },
    toContain(val) {
      if (typeof value === "string" || Array.isArray(value)) {
        if (!isSetNot && !value.includes(val)) {
          throw new Error(`expect "${value}" contains "${val}" but not`);
        } else if (isSetNot && value.includes(val)) {
          throw new Error(`expect "${value}" should not contains "${val}"`);
        }
      } else {
        throw new Error(`toContain should used in type string or array`);
      }
    },
    toEqual(val) {
      const flag = isEqual(value, val);
      if (!isSetNot && !flag) {
        throw new Error(`expect ${val} but got ${value}`);
      } else if (isSetNot && flag) {
        throw new Error(
          `expect not to be equal to "${val}" but "${value}" does`
        );
      }
    },
    toHaveBeenCalled() {
      const callTimes = spyMap[value] || 0;
      if (!isSetNot && callTimes <= 0) {
        throw new Error(`expect function called but not`);
      } else if (isSetNot && callTimes > 0) {
        throw new Error(`expect function not to be called but it does`);
      }
    },
    toHaveBeenCalledTimes(times) {
      const callTimes = spyMap[value] || 0;
      if (!isSetNot && callTimes !== times) {
        throw new Error(
          `expect function called "${times}" times but called "${callTimes}" times actually`
        );
      } else if (isSetNot && callTimes === times) {
        throw new Error(
          `expect function not to be called "${times}" times but it called "${callTimes}" times actually`
        );
      }
    },
  };
};
