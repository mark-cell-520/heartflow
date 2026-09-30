// scripts/negative-test-ppf-benshen-r298.js
// 注入-删条验证：把「本身」加回 src/index.js 8755 行判据的 B 侧词表，
// 守卫测试必须变红；移除注入后恢复全绿。证明守卫确实在保护这条判据。
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TARGET = path.join(ROOT, 'src', 'index.js');
const TEST = 'test/doubt-ppf-benshen-r298.test.js';

// 注入目标：8755 行判据 B 侧词表（本轮已剔除「本身」的那条）。
// 在「味道」后插回「本身」，即恢复修复前的错误词表。
// 注意：源码里是 \uXXXX 转义字面量，needle 必须逐字符对应用双反斜杠。
const NEEDLE = '\\u5473\\u9053|\\u5168\\u90e8';
const INJECT = '\\u5473\\u9053|\\u672c\\u8eab|\\u5168\\u90e8';

function restore() {
  execFileSync('git', ['checkout', '--', 'src/index.js'], { cwd: ROOT });
}
function runTest() {
  try {
    const out = execFileSync('node', [TEST], { cwd: ROOT, encoding: 'utf8' });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: (e.stdout || '') + (e.stderr || '') };
  }
}

// 0) 基线：恢复原状后必须全绿
restore();
const base = runTest();
if (!base.ok) { console.log('BASE_NOT_GREEN'); process.exit(1); }
console.log('① 基线（无注入）: 全绿  ' + base.out.trim().split('\n').pop());

// 1) 注入：把「本身」加回词表 → 必须变红
const before = fs.readFileSync(TARGET, 'utf8');
if (before.indexOf(NEEDLE) === -1) { console.log('NEEDLE_MISSING'); restore(); process.exit(1); }
fs.writeFileSync(TARGET, before.split(NEEDLE).join(INJECT), 'utf8');
const injected = runTest();
console.log('② 注入「本身」后: ' + (injected.ok ? '未变红（守卫失效！）' : '变红（守卫有效）'));
const r1 = injected.ok ? 'NO_RED' : 'RED';

restore();

// 2) 移除注入 → 恢复全绿
const after = runTest();
const r2 = after.ok ? 'GREEN' : 'NOT_GREEN';
console.log('③ 移除注入后: ' + (after.ok ? '恢复全绿' : '未恢复（有残留）'));

// 3) 判定
if (r1 === 'RED' && r2 === 'GREEN') {
  console.log('\n=== 注入-删条验证通过 ===');
  process.exit(0);
}
console.log('\n=== 注入-删条验证失败: ' + r1 + ' / ' + r2 + ' ===');
process.exit(1);
