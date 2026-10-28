// test/core/path-guard.test.js — 路径穿越防护测试
const { guardPath, safeWriteSync, safeReadSync } = require('../../src/core/path-guard.js');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('path-guard tests...');

// [v6.8.85 审计修复] 平台自适应：Windows 下 path.resolve('/tmp') 解析为 <盘>:\tmp，
// 原断言 startsWith('/tmp') 在 Windows 副本必挂。用解析后的期望值比较，双平台成立。
const TMP_ROOT = path.resolve('/tmp');
const TMP_FILE = path.join(TMP_ROOT, 'heartflow_test_' + Date.now() + '.txt');

// 1. 合法路径
const r1 = guardPath(path.join(TMP_ROOT, 'test.txt'), [TMP_ROOT]);
assert.strictEqual(r1.safe, true, '合法路径应通过');
assert.strictEqual(r1.resolved.startsWith(TMP_ROOT), true, '合法路径应解析到临时目录');

// 2. 越界路径
const r2 = guardPath('/etc/passwd');
assert.strictEqual(r2.safe, false, '/etc/passwd应被拒绝');
assert.ok(r2.reason.includes('outside allowed roots'), '应提示越界');

// 3. 路径遍历
const r3 = guardPath('../../../etc/shadow');
assert.strictEqual(r3.safe, false, '路径遍历应被拒绝');

// 4. 空输入
const r4 = guardPath('');
assert.strictEqual(r4.safe, false, '空路径应被拒绝');

// 5. safeWriteSync 写入+读取
safeWriteSync(TMP_FILE, 'test content', 'utf8', [TMP_ROOT]);
const content = safeReadSync(TMP_FILE, 'utf8', [TMP_ROOT]);
assert.strictEqual(content, 'test content', '写入和读取应一致');
fs.unlinkSync(TMP_FILE);

// 6. safeWriteSync 拒绝越界写入
let caught = false;
try {
  safeWriteSync('/etc/should_fail.txt', 'x');
} catch (e) {
  caught = true;
}
assert.strictEqual(caught, true, '越界写入应抛异常');

console.log('path-guard: ALL PASSED ✅');
