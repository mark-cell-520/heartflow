#!/usr/bin/env node
/**
 * r410 复现探针：r409 补丁的自锁告警分支是否可达
 *
 * 疑点：补丁先断言 `文档 passing === total(=passed+failed)`，
 * 再 `if (M.testFailed > 0) throw 自锁告警`。
 * 当缓存 failed=3 时 total=passed+3 ≠ 文档 passing → strictEqual 先挂，
 * 自锁告警变成死代码，报错信息退回「文档漂移」误导归因。
 *
 * 本探针只改 data/test-count.json 的 failed 字段（doc-numbers 只读缓存），
 * 跑完原样还原。不改任何代码、不写任何文档。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CACHE = path.join(ROOT, 'data/test-count.json');
const TEST = path.join(ROOT, 'test/doc-numbers-accuracy.test.js');

const original = fs.readFileSync(CACHE, 'utf8');
const j = JSON.parse(original);
console.log('[基线]', original.trim().replace(/\s+/g, ' '));

function runOnce(label) {
  const r = cp.spawnSync('node', [TEST], { cwd: ROOT, encoding: 'utf8', timeout: 180000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const failedLines = out.split('\n').filter(l => /✗|✖|Error:|AssertionError|not ok|失败/.test(l));
  console.log(`\n── ${label} (rc=${r.status}) ──`);
  console.log(failedLines.slice(0, 6).map(l => '   ' + l.trim().slice(0, 160)).join('\n'));
  return { rc: r.status, out };
}

try {
  // 变异 1：failed=3（模拟 r409 实测的自锁态）
  j.failed = 3;
  fs.writeFileSync(CACHE, JSON.stringify(j, null, 2));
  const a = runOnce('缓存 failed=3（自锁态）');

  // 判定：报错是否命中自锁告警（关键词「自锁」「遗留」「恢复命令」）
  const hitLockMsg = /自锁|遗留 .* 个失败|恢复命令/.test(a.out);
  const hitTotalMsg = /实测共 \d+ 个用例/.test(a.out);
  console.log(`\n[判定] 命中自锁告警文案 = ${hitLockMsg}`);
  console.log(`[判定] 命中 total 比对文案  = ${hitTotalMsg}`);
  console.log(`[判定] 自锁分支可达         = ${hitLockMsg && !hitTotalMsg}`);
} finally {
  fs.writeFileSync(CACHE, original);
  console.log('\n[还原] data/test-count.json 已还原');
}
