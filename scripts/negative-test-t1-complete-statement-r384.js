#!/usr/bin/env node
/**
 * scripts/negative-test-t1-complete-statement-r384.js
 *
 * r384 负例守卫：验证「删掉排除代码 → 守卫必须变红」。
 * 参照 scripts/negative-test-absolute-claim-en.js 的注入/还原模式。
 * 还原点：src/premature-termination.js 的排除分支判定条件。
 *
 * 注意：test/ 下的守卫文件是 module.exports = function({test}) 工厂格式，
 * 直接 node test/xxx.js 不会执行（本轮已实测过），故本脚本用同套 harness
 * 在**同进程**内 require 后运行，注入变异后清缓存重跑。
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src/premature-termination.js');
const GATE = path.join(ROOT, 'src/gate.js');
const GUARD = path.join(ROOT, 'test/round-384-t1-complete-statement.test.js');
const BACKUP = SRC + '.r384bak';

const ANCHOR = "if (isZh && T1_COMPLETE_STATEMENT_ZH.test(trimmed)) {";
const REPLACE = "if (false) {";

function runGuardOnce() {
  // 清掉 src 与 test 的模块缓存，确保读到刚写入的变异版
  for (const k of Object.keys(require.cache)) {
    if (k === SRC || k === GATE || k === GUARD || k.startsWith(ROOT + path.sep + 'node_modules')) delete require.cache[k];
  }
  let pass = 0, fail = 0;
  const failures = [];
  const test = (name, fn) => {
    try { fn(); pass++; }
    catch (e) { fail++; failures.push(name + ' :: ' + (e && e.message)); }
  };
  const factory = require(GUARD);
  factory({ test });
  return { pass, fail, failures };
}

function report(tag, r) {
  console.log(tag + ' PASS=' + r.pass + ' FAIL=' + r.fail);
  for (const x of r.failures) console.log('   RED ' + x);
}

console.log('── baseline（不删条）──');
const before = runGuardOnce();
report('baseline', before);
if (before.fail > 0) { console.error('FAIL: 未删条时守卫不应红'); process.exit(1); }

fs.copyFileSync(SRC, BACKUP);
try {
  const orig = fs.readFileSync(SRC, 'utf8');
  if (!orig.includes(ANCHOR)) { console.error('FAIL: 找不到锚点: ' + ANCHOR); process.exit(1); }
  fs.writeFileSync(SRC, orig.replace(ANCHOR, REPLACE));
  console.log('── 注入变异（排除条件恒假）──');
  const after = runGuardOnce();
  report('mutated', after);
  if (after.fail === 0) { console.error('FAIL: 删条后守卫未红 —— 守卫不是真守卫'); process.exit(1); }
} finally {
  fs.copyFileSync(BACKUP, SRC);
  fs.unlinkSync(BACKUP);
}

console.log('── restore 后复跑 ──');
const restored = runGuardOnce();
report('restored', restored);
if (restored.fail > 0) { console.error('FAIL: 还原后守卫仍红'); process.exit(1); }
console.log('PASS: 删条即红 / 还原即绿，守卫有效，文件已还原');
