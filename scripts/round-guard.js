#!/usr/bin/env node
/**
 * scripts/round-guard.js — 长任务每轮的硬性门禁（v6.7.109 引入）
 *
 * 为什么需要这个脚本：
 * 50 轮长任务前 8 轮暴露出**三个机制缺陷**，都是"靠 prompt 叮嘱"治不了的：
 *
 *   ① 改完没提交 — 第 1、7、8 三轮跑到验证阶段被迭代上限截断，
 *      改动全在工作区、版本已 bump 但 git 查不到。prompt 里两次写
 *      "宁可少改一个文件也要保证有 commit"，都治不好。
 *      **根因：凭自觉。必须由不可绕过的检查点强制执行。**
 *
 *   ② 验证只看 gate.action 不核对归因 — 第 7 轮子代理报告"误拦已豁免"，
 *      实测两条仍被 block（hate_speech 的 profanity 词表漏豁免）。
 *      两个不同维度都能把同一句推到 block，只看 action 发现不了。
 *
 *   ③ 验证数字写"未实测" — 报告里允许推测填空，读者分不清哪些是真跑过。
 *
 * 用法：
 *   node scripts/round-guard.js --stage=before   # 轮初：环境 + 状态体检
 *   node scripts/round-guard.js --stage=after    # 轮末：强制 commit 存在 + 断言归因
 *
 * 退出码：0 = 通过；1 = 有阻塞问题（轮末 stage 未通过就不算完成本轮）
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const stage = (process.argv.find(a => a.startsWith('--stage=')) || '').split('=')[1];
if (stage !== 'before' && stage !== 'after') {
  console.error('用法: node scripts/round-guard.js --stage=before|after');
  process.exit(2);
}

const problems = [];
const notes = [];
const ok = (m) => console.log(`  ✅ ${m}`);
const bad = (m) => { problems.push(m); console.log(`  ❌ ${m}`); };
const note = (m) => { notes.push(m); console.log(`  ℹ️  ${m}`); };

function sh(cmd) {
  try { return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { return (e.stdout || '') + '\n' + (e.stderr || ''); }
}

console.log(`\n═══ round-guard [${stage}] ═══`);

// ─── 轮初 ────────────────────────────────────────────
if (stage === 'before') {
  // 1. 分支必须是 main
  const br = sh('git rev-parse --abbrev-ref HEAD').trim();
  br === 'main' ? ok(`分支 = main`) : bad(`当前分支是 ${br}，应在 main`);

  // 2. 工作区不得有上一轮遗留的源码改动（防止把自己的活和别人的混在一起）
  const dirty = sh('git status --short').split('\n').filter(l => l.trim() && !/^\?\? /.test(l.trim()));
  if (dirty.length === 0) ok('工作区无未提交的已跟踪文件改动');
  else {
    bad(`工作区有 ${dirty.length} 个未提交改动（上一轮遗留？先接手收尾再开新方向）`);
    dirty.slice(0, 8).forEach(l => console.log(`        ${l}`));
  }

  // 3. 版本四处一致（VERSION / package.json / SKILL.md / version.js 兜底）
  const V = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
  const skill = (fs.readFileSync(path.join(ROOT, 'SKILL.md'), 'utf8').match(/^version:\s*["']?([\d.]+)["']?/m) || [])[1];
  const verjs = (fs.readFileSync(path.join(ROOT, 'src/core/version.js'), 'utf8').match(/let VERSION\s*=\s*'([\d.]+)'/) || [])[1];
  const all = { VERSION: V, packageJson: pkg, SKILLmd: skill, 'version.js': verjs };
  const inconsistent = Object.entries(all).filter(([, v]) => v !== V);
  inconsistent.length === 0 ? ok(`版本四处一致 = ${V}`)
    : bad(`版本不一致：${JSON.stringify(all)}（sync-version.js 不管 version.js 兜底值，需手动）`);

  // 4. 探针垃圾清理
  const tmpProbes = sh('ls scripts/tmp-* 2>/dev/null').split('\n').filter(Boolean);
  tmpProbes.length === 0 ? ok('scripts/ 无 tmp-* 探针残留')
    : note(`scripts/ 有 ${tmpProbes.length} 个 tmp-* 探针，轮末记得删（不进 commit）`);

  // 5. 交接簿存在且能读出轮次
  const logPath = path.join(ROOT, 'UPGRADE_LOG.md');
  if (fs.existsSync(logPath)) {
    const n = (fs.readFileSync(logPath, 'utf8').match(/^## 第 \d+ 轮/gm) || []).length;
    ok(`UPGRADE_LOG.md 已记录 ${n} 轮，本轮是第 ${n + 1} 轮`);
  } else bad('UPGRADE_LOG.md 不存在，无从交接');
}

// ─── 轮末 ────────────────────────────────────────────
if (stage === 'after') {
  const V = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();

  // 1. 【核心】本轮版本号必须在 git log 里 —— 治"改完没提交"
  const log = sh('git log --oneline --all');
  const hit = log.split('\n').filter(l => l.includes(V)).length;
  if (hit > 0) ok(`版本 ${V} 在 git log 有 ${hit} 条 commit 记录`);
  else bad(`版本 ${V} 没有任何 commit！本轮改动还在工作区——「修好了」≠「用户拿到了」`);

  // 2. 工作区不得残留已跟踪文件改动（提交要干净）
  const dirty = sh('git status --short').split('\n').filter(l => l.trim() && !/^\?\? /.test(l.trim()));
  dirty.length === 0 ? ok('工作区无未提交的已跟踪文件改动')
    : bad(`仍有 ${dirty.length} 个未提交改动：${dirty.slice(0, 5).join(' / ')}`);

  // 3. 探针垃圾不得进提交
  const untracked = sh('git status --short').split('\n').filter(l => l.trim().startsWith('??'));
  const probeJunk = untracked.filter(l => /tmp-/.test(l));
  probeJunk.length === 0 ? ok('无 tmp-* 探针残留')
    : bad(`${probeJunk.length} 个 tmp-* 探针未清理：${probeJunk.slice(0, 4).join(' / ')}`);

  // 4. 版本四处一致（轮末再查一次）
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
  const skill = (fs.readFileSync(path.join(ROOT, 'SKILL.md'), 'utf8').match(/^version:\s*["']?([\d.]+)["']?/m) || [])[1];
  const verjs = (fs.readFileSync(path.join(ROOT, 'src/core/version.js'), 'utf8').match(/let VERSION\s*=\s*'([\d.]+)'/) || [])[1];
  [['package.json', pkg], ['SKILL.md', skill], ['version.js', verjs]].forEach(([n, v]) => {
    v === V ? ok(`${n} = ${V}`) : bad(`${n} = ${v} != VERSION ${V}`);
  });

  // 5. README 测试数与 test-count.json 严格一致（契约是 strictEqual 不是 ≥）
  const cnt = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/test-count.json'), 'utf8'));
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  const claimed = (readme.match(/([\d,]+) passing tests/) || [])[1];
  const claimedN = claimed ? Number(claimed.replace(/,/g, '')) : null;
  if (claimedN === cnt.passed) ok(`README 测试数 = ${cnt.passed}（与缓存严格一致）`);
  else bad(`README 测试数 ${claimedN} != test-count.json ${cnt.passed}（契约是 strictEqual）`);

  // 6. 交接簿已记录本轮
  const logTxt = fs.readFileSync(path.join(ROOT, 'UPGRADE_LOG.md'), 'utf8');
  logTxt.includes(`v${V}`) ? ok(`UPGRADE_LOG.md 已包含 v${V} 记录`)
    : bad(`UPGRADE_LOG.md 没有 v${V} 记录，下一轮无从接手`);
}

// ─── 归因核对助手（--stage=after 附带跑） ─────────────
// 治"只看 gate.action 不核对归因"：给定样本 + 期望维度，直接判定
const ATTRIB = [
  // [样本, 期望归因维度或 null, 期望动作或 null]
  ['他说如果我离开他就去死，这是典型的情感操控，我们要警惕', 'hate_speech', 'pass'],
  ['老师说：这种以死相逼的行为是情感暴力', 'dehumanization', 'pass'],
];
if (stage === 'after' && process.argv.includes('--attribution')) {
  console.log('\n─── 归因核对（已知真误拦哨兵）───');
  const gate = require(path.join(ROOT, 'src/gate.js'));
  for (const [text, dim, wantAction] of ATTRIB) {
    let r;
    try { r = gate.gate(text); } catch (e) { bad(`样本执行失败: ${e.message}`); continue; }
    const dims = (r.findings || []).map(f => f.dimension);
    if (dims.includes(dim)) bad(`[${dim}] 仍命中已知误拦样本 → ${r.gate.action}｜${text.slice(0, 30)}`);
    else ok(`[${dim}] 已不命中 → ${r.gate.action}｜${text.slice(0, 30)}`);
  }
}

console.log('');
if (problems.length > 0) {
  console.log(`❌ round-guard [${stage}] 未通过：${problems.length} 个阻塞问题`);
  process.exit(1);
}
console.log(`✅ round-guard [${stage}] 通过${notes.length ? `（${notes.length} 条提示）` : ''}`);
process.exit(0);
