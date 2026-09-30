#!/usr/bin/env node
/**
 * 负例守卫：第 286 轮 doc-numbers 维度口径（scripts/sync-doc-dimensions.js）
 *
 * 守什么：如果引擎的 dimensions 键少了任何一个维度，本脚本必须报红；
 * 如果记账脚本的口径退化成「静态数函数」（v6.7.126 第 286 轮修的 bug），
 * 也必须报红。
 *
 * 变异设计（每支都先证明「删它真能改变行为」再当真变异）：
 *   M1 真变异：从 src/index.js 删掉 1 个外置 require（phishing_coercion）
 *      → dimensions 键应变 57 → 56，口径若有效必然变红
 *   M2 真变异：把记账脚本的运行时实测改成静态函数计数
 *      → 回退到 50，对 57 的文档必然变红
 *   M3 无效变异对照：只改注释文字 → 必须全绿（证明红不是噪声）
 *   RESTORE：全部还原后必须回到基线绿
 */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const ROOT = path.join(HF, 'scripts');
const SCRIPT = path.join(ROOT, 'sync-doc-dimensions.js');

function sh(cmd) {
  const r = cp.spawnSync('bash', ['-c', cmd], { encoding: 'utf8', timeout: 180000, cwd: ROOT });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

/** 跑 --check，返回是否通过（退出码 0） */
function checkPasses() {
  const r = cp.spawnSync('node', [SCRIPT, '--check'], { encoding: 'utf8', timeout: 180000, cwd: ROOT });
  return r.status === 0;
}

const results = [];
function record(name, ok, note) {
  results.push({ name, ok, note });
  console.log(`  ${ok ? '✅' : '❌'} ${name}${note ? ' — ' + note : ''}`);
}

const IDX = path.join(HF, 'src', 'index.js');

console.log('\n=== 负例守卫：维度口径（第 286 轮）===\n');

// ── 基线 ──
const base = checkPasses();
record('基线：--check 通过', base, base ? '退出码 0' : '退出码非 0（文档与实现不一致？）');
if (!base) {
  console.log('\n基线就不绿，先修再跑守卫。');
  process.exit(1);
}

// ── M1：删掉一个外置维度的 require ──
// 选 checkPhishingCoercion（走 _mt.checkPhishingCoercion，src/index.js:402）
const M1_ANCHOR = 'const phc = _dual(_mt.checkPhishingCoercion);';
let src = fs.readFileSync(IDX, 'utf8');
if (!src.includes(M1_ANCHOR)) {
  record('M1 真变异：外置 require 锚点', false, `src/index.js 找不到锚点（形状可能已变，需人工更新守卫）`);
} else {
  fs.writeFileSync(IDX, src.replace(M1_ANCHOR + '\n', ''));
  const red = !checkPasses();
  record('M1 真变异：摘掉一个外置维度 → 记账必须报红', red, red ? '如预期变红' : '未变红 = 口径抓不到维度丢失');
  fs.writeFileSync(IDX, src); // 立即还原
  record('M1 还原', checkPasses(), '还原后恢复绿');
}

// ── M2：把运行时实测退化成静态函数计数 ──
const M2_OLD = "const n = parseInt((r.stdout || '').trim().split('\\n')[0], 10);";
const M2_NEW = "const n = (fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8').match(/^function (check[A-Z]\\w*)\\s*\\(/gm) || []).length;";
let scriptSrc = fs.readFileSync(SCRIPT, 'utf8');
if (!scriptSrc.includes(M2_OLD)) {
  record('M2 真变异：口径退化锚点', false, '记账脚本里找不到运行时实测行（形状可能已变）');
} else {
  fs.writeFileSync(SCRIPT, scriptSrc.replace(M2_OLD, M2_NEW));
  const red = !checkPasses();
  record('M2 真变异：口径退回静态函数计数 → 记账必须报红', red, red ? '如预期变红（50 vs 57）' : '未变红 = 守卫抓不到自己的口径退化');
  fs.writeFileSync(SCRIPT, scriptSrc);
  record('M2 还原', checkPasses(), '还原后恢复绿');
}

// ── M3 无效变异对照：只改注释，必须全绿 ──
const M3_OLD = " * 用法：";
const M3_NEW = " * 用法（注释被无意义改动，行为必须不变）:";
scriptSrc = fs.readFileSync(SCRIPT, 'utf8');
fs.writeFileSync(SCRIPT, scriptSrc.replace(M3_OLD, M3_NEW));
const green = checkPasses();
record('M3 无效变异对照：只改注释 → 必须仍绿', green, green ? '如预期全绿（证明红不是噪声）' : '变红了 = 守卫有假阳性');
fs.writeFileSync(SCRIPT, scriptSrc);

// ── 总结 ──
const fails = results.filter(r => !r.ok).length;
console.log(`\n结果: ${results.length - fails} 通过, ${fails} 失败, 共 ${results.length} 个`);
process.exit(fails === 0 ? 0 : 1);
