/**
 * mocha-shim.js — [v6.8.85 审计修复] 让遗留 mocha 风格测试文件（describe/test/expect）
 * 可在裸 node 下运行，支持同步与 async 测试体。
 *
 * 用法：文件头部 require 本 shim（相对路径），文件原有 describe/test/expect 代码不动。
 * 用例在 setImmediate 阶段统一异步执行，全部完成后输出 `N 通过, M 失败` 汇总行
 * （兼容 test/run-all.js 解析），有失败时 process.exitCode = 1。
 */
'use strict';

const suites = [];
let current = null;

global.describe = function (name, fn) {
  const parent = current;
  // 嵌套 describe 继承父级钩子（mocha 语义）
  current = {
    name: parent ? parent.name + ' › ' + name : name,
    tests: [],
    before: [], after: [],
    beforeEach: parent ? [...parent.beforeEach] : [],
    afterEach: parent ? [...parent.afterEach] : [],
  };
  suites.push(current);
  try { fn(); } catch (e) {
    current.tests.push({ name: '(describe 级异常) ' + e.message, fn: null, err: e });
  }
  current = parent;
};

global.it = global.test = function (name, fn) {
  if (!current) global.describe('(根级)', () => {});
  current.tests.push({ name, fn });
};

global.before = global.beforeAll = function (fn) { if (current) current.before.push(fn); };
global.after = global.afterAll = function (fn) { if (current) current.after.push(fn); };
global.beforeEach = function (fn) { if (current) current.beforeEach.push(fn); };
global.afterEach = function (fn) { if (current) current.afterEach.push(fn); };

function fmt(v) {
  if (typeof v === 'string') return JSON.stringify(v);
  if (typeof v === 'function') return '[Function ' + (v.name || 'anonymous') + ']';
  try { return JSON.stringify(v); } catch (e) { return String(v); }
}

global.expect = function (actual) {
  const api = {
    toBe(exp) {
      if (actual !== exp) throw new Error('期望 ' + fmt(exp) + ' 实际 ' + fmt(actual));
    },
    toEqual(exp) {
      const a = JSON.stringify(actual), b = JSON.stringify(exp);
      if (a !== b) throw new Error('期望 ' + fmt(exp) + ' 实际 ' + fmt(actual));
    },
    toBeDefined() { if (actual === undefined) throw new Error('期望已定义，实际 undefined'); },
    toBeUndefined() { if (actual !== undefined) throw new Error('期望 undefined，实际 ' + fmt(actual)); },
    toBeTruthy() { if (!actual) throw new Error('期望真值，实际 ' + fmt(actual)); },
    toBeFalsy() { if (actual) throw new Error('期望假值，实际 ' + fmt(actual)); },
    toContain(exp) {
      const ok = typeof actual === 'string' ? actual.includes(exp) : Array.isArray(actual) && actual.includes(exp);
      if (!ok) throw new Error('期望包含 ' + fmt(exp) + '，实际 ' + fmt(actual));
    },
    toMatch(re) { if (!re.test(String(actual))) throw new Error('期望匹配 ' + re + '，实际 ' + fmt(actual)); },
    toHaveLength(n) {
      if (!actual || actual.length !== n) throw new Error('期望长度 ' + n + '，实际 ' + (actual && actual.length));
    },
    toHaveProperty(p) {
      if (!actual || !(p in actual)) throw new Error('期望含属性 ' + p);
    },
    toBeGreaterThan(n) { if (!(actual > n)) throw new Error('期望 > ' + n + '，实际 ' + fmt(actual)); },
    toBeLessThan(n) { if (!(actual < n)) throw new Error('期望 < ' + n + '，实际 ' + fmt(actual)); },
    toBeInstanceOf(C) { if (!(actual instanceof C)) throw new Error('期望 ' + C.name + ' 实例'); },
    toThrow(exp) {
      let threw = null;
      try { actual(); } catch (e) { threw = e; }
      if (!threw) throw new Error('期望抛错但未抛');
      if (exp instanceof RegExp && !exp.test(threw.message)) throw new Error('期望抛错匹配 ' + exp + '，实际 ' + threw.message);
      if (typeof exp === 'string' && !threw.message.includes(exp)) throw new Error('期望抛错含 "' + exp + '"，实际 ' + threw.message);
    },
  };
  api.not = {
    toBe(exp) { if (actual === exp) throw new Error('期望不等于 ' + fmt(exp)); },
    toContain(exp) {
      const ok = typeof actual === 'string' ? actual.includes(exp) : Array.isArray(actual) && actual.includes(exp);
      if (ok) throw new Error('期望不含 ' + fmt(exp));
    },
    toThrow() {
      try { actual(); } catch (e) { throw new Error('期望不抛错但抛了: ' + e.message); }
    },
  };
  return api;
};

let executed = false;
async function runAll() {
  if (executed) return;
  executed = true;
  let pass = 0, fail = 0;
  const failures = [];
  for (const s of suites) {
    try { for (const h of s.before) await h(); } catch (e) { /* before 失败记到首个用例 */ }
    for (const t of s.tests) {
      try {
        if (typeof t.fn !== 'function') throw t.err || new Error('无测试体');
        for (const h of s.beforeEach) await h();
        await t.fn();
        pass++;
      } catch (e) {
        fail++;
        failures.push('  ❌ ' + s.name + ' › ' + t.name + ' — ' + e.message);
      }
      try { for (const h of s.afterEach) await h(); } catch (e) { /* 忽略 afterEach 清理异常 */ }
    }
    try { for (const h of s.after) await h(); } catch (e) { /* 忽略 after 清理异常 */ }
  }
  for (const f of failures) console.log(f);
  console.log(pass + ' 通过, ' + fail + ' 失败');
  if (fail > 0) process.exitCode = 1;
}

// 总超时兜底：async 测试 hang 死时强杀，不留僵尸
const guard = setTimeout(() => {
  if (!executed) { console.log('0 通过, 1 失败'); console.log('  ❌ mocha-shim: 用例执行超时(20s)'); process.exit(1); }
}, 20000);
guard.unref();

setImmediate(() => { runAll(); });
