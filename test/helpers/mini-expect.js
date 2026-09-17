/**
 * Minimal zero-dependency describe/it/expect shim.
 *
 * Several test files under test/ were written against mocha + chai. The repo
 * deliberately ships zero runtime dependencies (and no devDependencies), so
 * those files crashed with "describe is not defined" / "Cannot find module
 * 'chai'" instead of actually running. This shim provides the subset of the
 * mocha/chai API those files use, so they execute for real.
 *
 * Usage:
 *   const { describe, it, expect, run } = require('./helpers/mini-expect.js');
 */
'use strict';

const _suites = [];
let _current = null;

function describe(name, fn) {
  const prev = _current;
  _current = { name: prev ? `${prev.name} › ${name}` : name, tests: [] };
  _suites.push(_current);
  try {
    fn();
  } finally {
    _current = prev;
  }
}

function it(name, fn) {
  if (_current) _current.tests.push({ name, fn });
}

function _fail(msg) {
  const e = new Error(msg);
  e.isAssertion = true;
  throw e;
}

function expect(actual) {
  const api = {
    to: null, be: null, been: null, is: null, that: null, which: null,
    and: null, has: null, have: null, with: null, at: null, of: null,
  };
  // 链式别名指向自身
  for (const k of Object.keys(api)) api[k] = api;

  api.equal = (expected) => {
    if (actual !== expected) _fail(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  };
  api.eql = api.deep = (expected) => {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    if (a !== b) _fail(`expected ${b}, got ${a}`);
  };
  api.oneOf = (arr) => {
    if (!Array.isArray(arr) || !arr.includes(actual)) {
      _fail(`expected one of ${JSON.stringify(arr)}, got ${JSON.stringify(actual)}`);
    }
  };
  api.include = (needle) => {
    const ok = typeof actual === 'string' ? actual.includes(needle)
      : Array.isArray(actual) ? actual.includes(needle)
      : false;
    if (!ok) _fail(`expected ${JSON.stringify(actual)} to include ${JSON.stringify(needle)}`);
  };

  const truthy = () => { if (!actual) _fail(`expected truthy, got ${JSON.stringify(actual)}`); };
  const falsy = () => { if (actual) _fail(`expected falsy, got ${JSON.stringify(actual)}`); };

  api.ok = truthy;
  api.true = truthy;
  api.false = falsy;
  api.null = () => { if (actual !== null) _fail(`expected null, got ${JSON.stringify(actual)}`); };
  api.undefined = () => { if (actual !== undefined) _fail(`expected undefined, got ${JSON.stringify(actual)}`); };
  api.exist = () => { if (actual === null || actual === undefined) _fail('expected value to exist'); };
  api.a = (type) => {
    const t = type.toLowerCase();
    const got = Array.isArray(actual) ? 'array' : typeof actual;
    if (t === 'array' ? got !== 'array' : got !== t) _fail(`expected type ${type}, got ${got}`);
  };
  api.above = (n) => { if (!(actual > n)) _fail(`expected ${actual} > ${n}`); };
  api.below = (n) => { if (!(actual < n)) _fail(`expected ${actual} < ${n}`); };
  api.greaterThan = (n) => { if (!(actual > n)) _fail(`expected ${actual} > ${n}`); };
  api.lessThan = (n) => { if (!(actual < n)) _fail(`expected ${actual} < ${n}`); };
  api.least = (n) => { if (!(actual >= n)) _fail(`expected ${actual} >= ${n}`); };
  api.most = (n) => { if (!(actual <= n)) _fail(`expected ${actual} <= ${n}`); };
  api.gte = api.least;
  api.lte = api.most;
  api.lengthOf = (n) => {
    if (!actual || actual.length !== n) _fail(`expected length ${n}, got ${actual && actual.length}`);
  };
  // chai 的链式写法：expect(x).to.have.length.greaterThan(0)
  Object.defineProperty(api, 'length', {
    get: () => expect(actual == null ? undefined : actual.length),
    configurable: true,
  });
  // chai 属性断言：expect(obj).to.have.property('k') / .property('k', v)
  api.property = (key, ...rest) => {
    if (actual == null || !(key in Object(actual))) {
      _fail(`expected object to have property '${key}'`);
    }
    if (rest.length > 0 && actual[key] !== rest[0]) {
      _fail(`expected property '${key}' to equal ${JSON.stringify(rest[0])}, got ${JSON.stringify(actual[key])}`);
    }
    // 允许继续链式断言该属性的值
    return expect(actual[key]);
  };
  api.ownProperty = api.property;
  api.keys = (keys) => {
    const want = Array.isArray(keys) ? keys : Object.keys(keys || {});
    const have = Object.keys(Object(actual));
    const missing = want.filter(k => !have.includes(k));
    if (missing.length) _fail(`expected keys ${JSON.stringify(want)}, missing ${JSON.stringify(missing)}`);
  };

  return api;
}

/**
 * 运行所有已注册的套件，输出与 test/run-all.js 兼容的汇总行。
 * @returns {{passed:number, failed:number, failures:Array}}
 */
function run() {
  let passed = 0;
  const failures = [];
  for (const suite of _suites) {
    for (const t of suite.tests) {
      try {
        t.fn();
        passed++;
      } catch (e) {
        failures.push({ name: `${suite.name} › ${t.name}`, error: e.message });
      }
    }
  }
  for (const f of failures) {
    console.log(`  ✗ ${f.name}`);
    console.log(`    ${f.error}`);
  }
  console.log(`\n测试结果: ${passed} 通过, ${failures.length} 失败, 共 ${passed + failures.length} 个`);
  if (failures.length) process.exitCode = 1;
  return { passed, failed: failures.length, failures };
}

module.exports = { describe, it, expect, run };
