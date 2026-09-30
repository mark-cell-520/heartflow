#!/usr/bin/env node
/**
 * 维度数自动记账 [v6.7.126 第 286 轮]
 *
 * 为什么写它（结构性死锁，与 v6.7.126 第 58 轮 README 测试数记账同家族）：
 *   维度数由引擎代码决定（机器），AGENTS.md / README.md / SKILL.md 却写在
 *   硬边界「不写这三份文档」里（人不许改）。数字漂移时每轮 finish 都报
 *   objection，而 agent 无权修 —— 第 286 轮实测就是这个形状：
 *   三份文档写 50，引擎实测 57，objection 连续出现却无人能改。
 *
 *   机器能判定的记账必须由机器做，不占 LLM 迭代预算。
 *
 * 口径：与 scripts/measure-claimed-numbers.js 完全同源（v6.7.111 修正）——
 * 跑 discriminate() 数 dimensions 键。**不用**「index.js 顶层 function check*
 *   计数」：那个口径漏计判别函数定义在外置模块的维度（实测漏 7 个：
 *   perfect_error / phishing_coercion / induced_trust / coverup_induction /
 *   dangerous_instruction / reward_hacking / premature_termination），
 *   v6.7.111 的源码注释明确记载过这次修法。
 *
 * 同步范围：三份文档中**所有**陈述当前维度数的位置（横幅、章节标题、
 * 表格引用项）。不碰 README 的 Version history 历史记录区——那里的数字
 * 是当时的真实事实（同 v6.7.87 对 README 测试数的处置）。
 *
 * 用法：
 *   node scripts/sync-doc-dimensions.js          # 同步
 *   node scripts/sync-doc-dimensions.js --check  # 只查不改（不一致时退出码 1）
 */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DOCS = ['AGENTS.md', 'README.md', 'SKILL.md'];

/** 运行时实测维度数（唯一真相，量不到就拒绝记账） */
function measureDims() {
  const r = cp.spawnSync('node', ['-e', [
    "const {discriminate}=require(" + JSON.stringify(path.join(ROOT, 'src/index.js')) + ");",
    "const d=discriminate('neutral baseline text');",
    "const k=Object.keys(d.dimensions||{});",
    "console.log(k.length);",
  ].join('\n')], { encoding: 'utf8', timeout: 120000 });
  const n = parseInt((r.stdout || '').trim().split('\n')[0], 10);
  if (!n) throw new Error('discriminate() 未返回 dimensions 键，拒绝记账——宁可不改也不猜）');
  return n;
}

/**
 * 「N dimensions」在当前文档语境下的合法写法。
 * 每条 = 一个精确的上下文锚点，锚点中的数字组就是要同步的目标。
 * 只列真实出现过的形状；历史记录区不在这份清单里。
 */
const PATTERNS = [
  // AGENTS.md 横幅：**Zero LLM dependency.** 50 dimensions, 137 modules, ...
  /(\*\*Zero LLM dependency\.\*\*\s+)(\d+)( dimensions,)/,
  // README / SKILL 横幅：50 discrimination dimensions × 11-layer pipeline
  /(\s)(\d+)( discrimination dimensions)/,
  // README / SKILL 章节标题：## The 50 dimensions
  /(## The )(\d+)( dimensions)/,
  // README / SKILL 表格项：`checkOutput` / `discriminate` (50 dimensions)
  /(`discriminate` \()(\d+)( dimensions\))/,
];

/** README 的 Version history 之后是历史记录，其中的数字是当时的事实，不碰 */
function splitHistory(file, src) {
  if (file !== 'README.md') return { live: src, history: '' };
  const i = src.indexOf('## Version history');
  if (i < 0) return { live: src, history: '' };
  return { live: src.slice(0, i), history: src.slice(i) };
}

function syncFile(file, want, checkOnly) {
  const fp = path.join(ROOT, file);
  let src;
  try { src = fs.readFileSync(fp, 'utf8'); } catch (e) {
    return { file, error: `读不到（${e.message}）`, hits: [], missing: [] };
  }
  const { live, history } = splitHistory(file, src);

  const hits = [];     // 真的改了/发现不一致的位置
  const missing = [];  // 该出现但没出现的位置（格式可能变了）
  let out = live;

  for (const re of PATTERNS) {
    // 用 replace 回调：找到的就是要改的
    let matched = false;
    out = out.replace(re, (full, pre, num, post) => {
      matched = true;
      const before = num;
      const after = String(want);
      if (before !== after) hits.push({ re: String(re).slice(0, 46), before, after });
      return pre + after + post;
    });
    // 「## The N dimensions」类标题在 AGENTS.md 不存在属正常，不记 missing
  }

  // 存在性体检：文档里必须至少有一处「N dimensions」权威数字
  if (!/\d+ discrimination dimensions|\d+ dimensions,/.test(out)) {
    missing.push('活跃区找不到任何「N dimensions」横幅写法');
  }

  if (hits.length && !checkOnly) fs.writeFileSync(fp, out + history);
  return { file, hits, missing };
}

function main() {
  const checkOnly = process.argv.includes('--check');
  let want;
  try { want = measureDims(); } catch (e) {
    console.error('实测失败：' + e.message);
    process.exit(2);
  }
  console.log(`实测维度数（discriminate dimensions 键）= ${want}\n`);

  const problems = [];
  let totalHits = 0;
  for (const file of DOCS) {
    const r = syncFile(file, want, checkOnly);
    if (r.error) { problems.push(`${file}: ${r.error}`); continue; }
    for (const m of r.missing) problems.push(`${file}: ${m}`);
    if (r.hits.length === 0) {
      console.log(`  ✅ ${file}: 已一致（${want}）`);
    } else {
      for (const h of r.hits) {
        console.log(`  ${checkOnly ? '❌' : '✅'} ${file}: ${h.before} → ${h.after}`);
      }
      totalHits += r.hits.length;
    }
  }

  console.log(`\n${checkOnly ? '检查' : '记账'}完成：${totalHits} 处不一致${checkOnly ? '（未改）' : '已同步'}`);
  if (problems.length) {
    console.log('\n需人工确认：');
    for (const p of problems) console.log('  ⚠️ ' + p);
  }
  if (checkOnly) process.exit(totalHits || problems.length ? 1 : 0);
}

main();
