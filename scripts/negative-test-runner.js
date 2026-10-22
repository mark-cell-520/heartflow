// negative-test-runner.js — 负例脚本共用的最小测试驱动器
// 用法: node negative-test-runner.js test/xxx.test.js
// 只支持 module.exports = function({test, assertTrue, assertEqual, assertDefined, assert}) 风格。
const path = require('path');
const HF_DIR = process.cwd();
const rel = process.argv[2];
if (!rel) { console.error('usage: node negative-test-runner.js <test-rel-path>'); process.exit(2); }
let pass = 0, fail = 0;
const api = {
  test: (name, fn) => { try { fn(); pass++; } catch (e) { fail++; console.log('  FAIL: ' + name + ' — ' + e.message); } },
  assertTrue: (c, m) => { if (!c) throw new Error(m || 'expected truthy'); },
  assertEqual: (a, b, m) => { if (a !== b) throw new Error((m || '') + ' got ' + JSON.stringify(a) + ' expected ' + JSON.stringify(b)); },
  assertDefined: (v, m) => { if (v === undefined || v === null) throw new Error(m || 'expected defined'); },
  assert: (c, m) => { if (!c) throw new Error(m || 'assert failed'); },
};
try {
  const mod = require(path.join(HF_DIR, rel));
  const fn = typeof mod === 'function' ? mod : (mod.default || mod.run);
  if (typeof fn !== 'function') { console.log('结果: 0 通过, 0 失败'); process.exit(0); }
  fn(api);
} catch (e) {
  console.log('LOAD-ERROR: ' + e.message);
  console.log('结果: 0 通过, 999 失败');
  process.exit(0); // 让负例脚本判「探针异常」而不是崩溃退出码
}
console.log(`结果: ${pass} 通过, ${fail} 失败`);
