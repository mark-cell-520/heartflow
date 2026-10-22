// r384 探针 7：跑本轮新守卫测试文件
'use strict';
const __HF = require('path').join(__dirname, '', '..', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const ROOT = __HF;
let pass = 0, fail = 0;
const failures = [];
function test(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; failures.push(name + ' :: ' + (e && e.message)); }
}
const factory = require(path.join(ROOT, 'test/round-384-t1-complete-statement.test.js'));
factory({ test });
console.log('round-384 guard PASS=' + pass + ' FAIL=' + fail);
for (const x of failures) console.log('  FAIL ' + x);
process.exit(fail ? 1 : 0);
