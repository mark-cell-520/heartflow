#!/usr/bin/env node
/**
 * scripts/auto-commit-round.js — 每轮开始时自动把上一轮的遗留改动落盘（v6.7.113）
 *
 * 为什么需要它（12 轮实测诊断）：
 *   12 轮里有 3 轮（第 1/7/8 轮）**零提交**，全部因为同一个死法：
 *   跑到验证阶段被迭代上限截断，改动留在工作区。prompt 里两次写
 *   「改完第一个文件就立刻 commit」，治不好——因为子代理按顺序执行标准动作
 *   （验证 20+ 步），等到想 commit 时迭代已经用尽。
 *
 *   **这不是自觉问题，是执行顺序问题。** 解法是把 commit 从"人的自觉"
 *   变成"环境的职责"：每轮开始第一件事，由脚本自动把工作区里
 *   「上一轮留下的、未提交的改动」打包成一个 commit。
 *
 * 设计原则：
 *   ① **只打包，不判断**。脚本不验证代码质量，不决定要不要提交——
 *      它只保证「上一轮的活不会因为迭代耗尽而丢失」。质量由本轮 agent 负责。
 *   ② **安全护栏**：绝不在以下情况提交——
 *      - 工作区无已跟踪文件改动（无事可做）
 *      - 当前不在 main 分支
 *      - VERSION 三处不一致时也只提交已跟踪文件、不 bump（bump 是 agent 的活）
 *      只 git add 已跟踪的修改文件（M/D），不 add 未跟踪文件（?? 很可能是探针垃圾）
 *   ③ **幂等**：跑第二次什么都没做。
 *   ④ commit message 自动含 VERSION（S2 守卫查 git log/tag 是否命中版本号）。
 *
 * 退出码：0 = 成功（含"无事可做"）；1 = 有阻塞问题（该停下来让人看）
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

function sh(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}
function trySh(cmd) {
  try { return sh(cmd); } catch (e) { return (e.stdout || '') + '\n' + (e.stderr || ''); }
}

// ① 必须在 main 分支
const branch = trySh('git rev-parse --abbrev-ref HEAD').trim();
if (branch !== 'main') {
  console.log(`[auto-commit] 当前分支是 ${branch}，不是 main —— 不自动提交，退出`);
  process.exit(1);
}

// ② 收集已跟踪的改动（M/D），排除未跟踪（?? = 探针垃圾）
const status = trySh('git status --short').split('\n').filter(l => l.trim());
const tracked = status
  .filter(l => /^\s*[MADRCU]/.test(l))
  .map(l => l.slice(3).trim().split(' -> ').pop());
const untracked = status.filter(l => /^\?\?/.test(l));

if (tracked.length === 0) {
  console.log('[auto-commit] 工作区无已跟踪文件改动 —— 无需自动提交');
  process.exit(0);
}

// ③ commit message 必须含 VERSION（S2 守卫）
const V = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
const logHas = trySh('git log --oneline --all').split('\n').some(l => l.includes(V));
const suffix = logHas ? '' : `（本轮版本 ${V} 尚未提交过，本条为其 git 痕迹）`;
const msg = [
  `chore(auto): ${V} — 自动落盘上一轮遗留改动（防止迭代耗尽导致零提交）`,
  '',
  '本 commit 由 scripts/auto-commit-round.js 生成，不替代人工验证。',
  '触发原因：上一轮改动未提交即被迭代上限截断（12 轮实测 3 轮死于此）。',
  suffix,
].filter(Boolean).join('\n');

const msgFile = path.join(ROOT, '.git', 'AUTO_COMMIT_MSG');
fs.writeFileSync(msgFile, msg);
try {
  console.log(`[auto-commit] 上一轮遗留 ${tracked.length} 个已跟踪文件，自动落盘为 ${V}`);
  tracked.forEach(f => console.log(`    M ${f}`));
  trySh(`git add -- ${tracked.map(f => JSON.stringify(f)).join(' ')}`);
  const out = trySh(`git -c user.name="HeartFlow" -c user.email="heartflow@local" commit -F ${JSON.stringify(msgFile)}`);
  console.log('[auto-commit] ' + out.split('\n').filter(l => l.trim()).slice(-1)[0]);
} finally {
  fs.unlinkSync(msgFile);
}

// ④ 探针垃圾只提示，不动（防止误删别人正在用的东西）
if (untracked.length) {
  console.log(`[auto-commit] 另有 ${untracked.length} 个未跟踪文件（探针？）未动，需人工判断:`);
  untracked.slice(0, 6).forEach(l => console.log(`    ${l.trim()}`));
}

process.exit(0);
