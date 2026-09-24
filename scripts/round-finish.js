#!/usr/bin/env node
/**
 * scripts/round-finish.js — 轮末兜底：commit + 自检 + 交接簿提醒（v6.7.113）
 *
 * 为什么需要它（v6.7.113 引入 auto-commit-round 后立刻发现的缺口）：
 *   auto-commit-round 只在**轮初**跑（由 cron script 参数在 LLM 开工前执行）。
 *   但第 13 轮证明：改动是在 LLM 运行**期间**产生的——轮初工作区是干净的，
 *   auto-commit 报「无需提交」，等 LLM 干完活迭代已耗尽 → 还是零提交。
 *
 *   **轮末必须也有兜底。** 否则只解决了一半。
 *
 * 与 round-guard --stage=after 的分工：
 *   round-guard  = 检查器（报红，不修）
 *   round-finish = 修复器 + 检查器（先 commit 再检查，尽量让 agent 通过）
 *   两者都退出非 0 才算本轮真有问题。
 *
 * 动作顺序（刻意如此）：
 *   ① 先跑 auto-commit-round 把改动落盘（如果还有）
 *   ② 再跑 round-guard --stage=after 做完整检查
 *   ③ 检查 leftover 未提交项，明确告诉 agent 还差什么
 */
'use strict';

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const sh = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const trySh = (cmd) => { try { return sh(cmd); } catch (e) { return (e.stdout || '') + '\n' + (e.stderr || ''); } };

console.log('══════ 轮末兜底：① 自动落盘 ══════');
console.log(trySh('node scripts/auto-commit-round.js').trim());

console.log('\n══════ 轮末兜底：② round-guard 自检 ══════');
let guardOut = '';
let guardRc = 0;
try { guardOut = sh('node scripts/round-guard.js --stage=after'); guardRc = 0; }
catch (e) { guardOut = (e.stdout || '').toString(); guardRc = e.status || 1; }
console.log(guardOut.trim());

console.log('\n══════ 轮末兜底：③ 归因哨兵 ════');
try {
  const at = sh('node scripts/round-guard.js --stage=after --attribution');
  console.log(at.trim());
} catch (e) { console.log('  (哨兵核对未通过，见上)'); }

console.log('\n══════ 轮末兜底：④ 交接簿 ════');
const logPath = path.join(ROOT, 'UPGRADE_LOG.md');
const V = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
if (fs.existsSync(logPath)) {
  const n = (fs.readFileSync(logPath, 'utf8').match(/^## 第 \d+ 轮/gm) || []).length;
  const logged = fs.readFileSync(logPath, 'utf8').includes(`v${V}`);
  console.log(`  UPGRADE_LOG.md 记录 ${n} 轮；当前版本 v${V} ${logged ? '已记录 ✅' : '未记录 ❌ ← 必须补'}`);
} else {
  console.log('  ❌ UPGRADE_LOG.md 不存在');
}

console.log('\n══════ 轮末兜底：⑤ 遗留未提交项 ════');
const status = trySh('git status --short').split('\n').filter(l => l.trim());
const tracked = status.filter(l => /^\s*[MADRCU]/.test(l));
const untracked = status.filter(l => /^\?\?/.test(l));
if (tracked.length === 0) console.log('  ✅ 工作区无未提交的已跟踪文件');
else {
  console.log(`  ❌ ${tracked.length} 个已跟踪文件仍未提交（auto-commit 为何没救下？）:`);
  tracked.slice(0, 8).forEach(l => console.log(`     ${l.trim()}`));
}
if (untracked.length) {
  const probes = untracked.filter(l => /tmp-/.test(l));
  console.log(`  ⚠️ ${untracked.length} 个未跟踪文件，其中 ${probes.length} 个是 tmp-* 探针（该删）`);
  untracked.slice(0, 6).forEach(l => console.log(`     ${l.trim()}`));
}

const blocking = tracked.length > 0 || guardRc !== 0;
console.log('');
if (blocking) {
  console.log('❌ 轮末兜底未过：还有未提交改动或 round-guard 报红 —— 本轮不算完成');
  process.exit(1);
}
console.log('✅ 轮末兜底通过');
process.exit(0);
