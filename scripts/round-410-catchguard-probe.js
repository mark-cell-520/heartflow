#!/usr/bin/env node
/**
 * r410 复现探针 3：checkTests catch 分支缺 passed>0 保护
 *
 * 疑点（r409 交接说「catch 分支正则比 try 分支少了 共 N 个」）：
 * 实测读码发现两条路径正则逐字相同，真正的差异在 ok 判据：
 *   try   : ok = failed===0 && passed>0
 *   catch : ok = failed===0          <-- 无 passed>0
 * 若 run-all 抛异常退出且输出恰好含 "0 通过, 0 失败"，catch 分支
 * 会判「全量测试 ✅ 0 通过, 0 失败」—— 一条全绿的空壳检查项。
 *
 * 本探针不跑 run-all（那要 400 秒）。它做的是：
 *   1. 抽取 guard-abilities.js 里 checkTests 的两条正则，验证是否逐字相同
 *   2. 用真实 run-all 输出尾部形态（从最近一次 /tmp 日志取）喂给两套逻辑
 *   3. 直接验证「0 通过, 0 失败」输入下 catch 逻辑的判定结果
 */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const GA = path.join(ROOT, 'scripts/guard-abilities.js');
const src = fs.readFileSync(GA, 'utf8');

// 1. 抽取两个 match 调用体
const grabAll = src.match(/(\d+)\\s\*通过\[,\\s\]\+\(\\d\+\)\\s\*失败\[,\\s\]\+\(\?:共\\s\*\)\?\(\\d\+\)\\s\*个|\\s\*通过\[,\\s\]\+\(\d\+\)\\s\*失败\[,\\s\]\+\(\?:共\\s\*\)\?\(\\d\+\)\\s\*个/g) || [];
console.log('[正则字面量出现次数]', grabAll.length, '=> 两条路径正则一致:', grabAll.length >= 2 && grabAll.every(g => g === grabAll[0]));

// 2. 提取两个 ok 表达式，看 passed>0 保护是否对称
const tryOk = src.match(/ok:\s*failed === 0 && passed > 0/);
const catchOk = src.match(/ok:\s*failed === 0(?!\s*&&)/);
console.log('[try 分支含 passed>0]', Boolean(tryOk));
console.log('[catch 分支缺 passed>0]', Boolean(catchOk));

// 3. 用模拟输入实测两套判定
function decide(line, withPassedGuard) {
  const m = line.match(/(\d+)\s*通过[,\s]+(\d+)\s*失败[,\s]+(?:共\s*)?(\d+)\s*个/)
    || line.match(/(\d+)\s*passed[,\s]+(\d+)\s*failed/);
  if (!m) return null;
  const passed = parseInt(m[1], 10), failed = parseInt(m[2], 10);
  return withPassedGuard ? (failed === 0 && passed > 0) : (failed === 0);
}
const CASES = [
  { label: '正常全绿', line: '17349 通过, 0 失败, 共 17349 个' },
  { label: '空壳 0/0', line: '0 通过, 0 失败, 共 0 个' },
  { label: '真失败', line: '17346 通过, 3 失败, 共 17349 个' },
  { label: '英文形态 0/0', line: '0 passed, 0 failed' },
];
console.log('\n[输入 -> try判定 / catch判定]');
let vulnerable = false;
for (const c of CASES) {
  const a = decide(c.line, true);
  const b = decide(c.line, false);
  const diff = a !== b;
  if (diff) vulnerable = true;
  console.log(`  ${c.label.padEnd(12)} "${c.line}"  try=${a} catch=${b}${diff ? '   <== 口径不一致' : ''}`);
}
console.log(`\n[判定] catch 分支会被空壳 0/0 判绿: ${vulnerable}`);
