// r384 临时 runner：跑 premature-termination 三个测试文件（不走 run-all）
'use strict';
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
let pass = 0, fail = 0;
const failures = [];
function test(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; failures.push(name + ' :: ' + (e && e.message)); }
}
const assertDefined = (v, m) => { if (v === undefined || v === null) throw new Error(m || 'assertDefined failed'); };
const assertTrue = (v, m) => { if (!v) throw new Error(m || 'assertTrue failed'); };
const assertEqual = (a, b, m) => { if (a !== b) throw new Error(m || ('expected ' + b + ' got ' + a)); };
function factory(f, harness) {
  try { f(harness); return true; }
  catch (e) { failures.push('(factory) ' + (e && e.message)); fail++; return false; }
}
for (const f of ['test/premature-termination.test.js', 'test/premature-termination-gate.test.js', 'test/round-338-premature-erasure-guard.test.js']) {
  const mod = require(path.join(ROOT, f));
  const harness = { test, t: test, assert: { defined: assertDefined, true: assertTrue, equal: assertEqual }, assertDefined, assertTrue, assertEqual };
  if (typeof mod !== 'function') { console.log('(skip non-factory) ' + f); continue; }
  factory(mod, harness);
}
console.log('PASS=' + pass + ' FAIL=' + fail);
for (const x of failures) console.log('  FAIL ' + x);
