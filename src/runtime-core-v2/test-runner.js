const cases = [];
const beforeEachCb = [];
const afterEachCb = [];

export function runner(unitName) {
  let runCases = cases.filter((c) => c.options.skip !== true);

  let onlyCases = cases.filter((c) => c.options.only === true);

  if (onlyCases.length > 0) {
    runCases = onlyCases;
  }

  let successNums = 0;
  let failNums = 0;
  let total = runCases.length;

  console.log(`======== ${unitName} start ========`);

  runCases.forEach(({ name, cb }) => {
    console.log(` ===== ${name} start ====`);

    beforeEachCb.forEach((fn) => {
      fn();
    });

    try {
      cb();
      console.log("结果：测试通过");
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

/**
 *
 * @param {any} value
 */
export const expect = (value) => {
  return {
    toBe(val) {
      if (value === val) {
        console.log("pass");
        return true;
      } else {
        throw new Error(`expect ${val} but got ${value}`);
      }
    },
    toContain(val) {
      if (typeof value === "string" || Array.isArray(value)) {
        if (!value.includes(val)) {
          throw new Error(`expect ${value} contains ${val} but not`);
        }
      }
    },
    toEqual(val) {
      const flag = isEqual(value, val);
      if (!flag) {
        throw new Error(`expect ${val} but got ${value}`);
      }
    },
  };
};
