#!/usr/bin/env node
/**
 * 第 699 轮负例守卫：注入-删条-必须变红
 *
 * 被测对象：src/appeal-to-novelty.js 的 appeal_to_novelty 双腿判据与
 * 四类豁免（r699 新增，经 src/index.js 十一处接线）。
 * 变异形态（每条变异必须在 test/round-699-appeal-to-novelty.js 上真红）：
 *   M1 摘新潮腿（noveltyZh/noveltyEn 恒 false）      → 攻击样本必须翻转漏判
 *   M2 摘优越腿（superiorZh/superiorEn 恒 false）    → 攻击样本必须翻转漏判
 *   M3 只跑中文腿（noveltyEn/superiorEn 恒 false）   → 英文攻击样本必须漏判
 *   M4 提问豁免失效（恒 false）                      → 提问样本必须被误伤
 *   M5 依据豁免失效（恒 false）                      → 依据在场样本必须被误伤
 *   M6 平衡豁免失效（恒 false）                      → 平衡比较样本必须被误伤
 *   M7 META 豁免失效（恒 false）                     → META 概念分析样本必须被误伤
 * 对照组（无变异）必须全绿。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'appeal-to-novelty.js');
const TEST = 'test/round-699-appeal-to-novelty.js';
const BACKUP = path.join(ROOT, 'src', '__r699_neg_backup.js');

const orig = fs.readFileSync(SRC, 'utf8');
fs.writeFileSync(BACKUP, orig);

const MUTATIONS = [
  {
    name: 'M1_drop_novelty_leg',
    apply: (s) => s.replace(
      '  const noveltyZh = NOVELTY_ZH_.test(text);\n  const noveltyEn = NOVELTY_EN_.test(text);',
      '  const noveltyZh = false;\n  const noveltyEn = false;'),
  },
  {
    name: 'M2_drop_superior_leg',
    apply: (s) => s.replace(
      '  const superiorZh = SUPERIOR_ZH_.test(text);\n  const superiorEn = SUPERIOR_EN_.test(text);',
      '  const superiorZh = false;\n  const superiorEn = false;'),
  },
  {
    name: 'M3_zh_only',
    apply: (s) => s.replace(
      '  const noveltyEn = NOVELTY_EN_.test(text);',
      '  const noveltyEn = false;').replace(
      '  const superiorEn = SUPERIOR_EN_.test(text);',
      '  const superiorEn = false;'),
  },
  {
    name: 'M4_question_exempt_dead',
    apply: (s) => s.replace(
      '  if (QUESTION_EXEMPT_.test(text)) {',
      '  if (false && QUESTION_EXEMPT_.test(text)) {'),
  },
  {
    name: 'M5_evidence_exempt_dead',
    apply: (s) => s.replace(
      '  if (EVIDENCE_EXEMPT_.test(text)) {',
      '  if (false && EVIDENCE_EXEMPT_.test(text)) {'),
  },
  {
    name: 'M6_balance_exempt_dead',
    apply: (s) => s.replace(
      '  if (BALANCE_EXEMPT_.test(text)) {',
      '  if (false && BALANCE_EXEMPT_.test(text)) {'),
  },
  {
    name: 'M7_meta_exempt_dead',
    apply: (s) => s.replace(
      '  if (META_EXEMPT_ZH_.test(text) || META_EXEMPT_EN_.test(text)) {',
      '  if (false && (META_EXEMPT_ZH_.test(text) || META_EXEMPT_EN_.test(text))) {'),
  },
];

let red = 0;
let invalid = 0;
let crashed = 0;
const results = [];

try {
  // 对照：无变异必须全绿
  const ctl = execFileSync('node', [TEST], { cwd: ROOT, encoding: 'utf8' });
  const ctlPass = /(\d+) 通过, (\d+) 失败/.exec(ctl);
  if (ctlPass && Number(ctlPass[2]) === 0) results.push('CTL: PASS');
  else results.push('CTL: FAIL(' + ctl.trim().slice(0, 160) + ')');

  for (const m of MUTATIONS) {
    const mutated = m.apply(orig);
    if (mutated === orig) { results.push(m.name + ': INVALID(no-op)'); invalid++; continue; }
    fs.writeFileSync(SRC, mutated);
    try {
      const out = execFileSync('node', [TEST], { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
      const mm = /(\d+) 通过, (\d+) 失败/.exec(out);
      const fails = mm ? Number(mm[2]) : -1;
      if (fails > 0) { results.push(m.name + ': RED(' + fails + ')'); red++; }
      else results.push(m.name + ': INVALID(still green)');
      if (fails < 0) invalid++;
    } catch (e) {
      const so = String(e.stdout || '');
      const mm = /(\d+) 通过, (\d+) 失败/.exec(so);
      if (mm && Number(mm[2]) > 0) { results.push(m.name + ': RED(' + mm[2] + ')'); red++; }
      else if (/AssertionError/.test(so) || /AssertionError/.test(String(e.stderr || ''))) { results.push(m.name + ': RED(assert)'); red++; }
      else { results.push(m.name + ': CRASHED(' + String(e.stderr || '').slice(0, 80) + ')'); crashed++; }
    } finally {
      fs.writeFileSync(SRC, orig);
    }
  }
} finally {
  fs.writeFileSync(SRC, orig);
}

// 还原校验：md5 一致（先校验再删备份）
const md5 = (f) => require('crypto').createHash('md5').update(fs.readFileSync(f)).digest('hex');
const restored = md5(SRC) === md5(BACKUP) ? '一致' : '不一致（异常）';
fs.unlinkSync(BACKUP);

console.log(results.join('\n'));
console.log('SUMMARY mutations=' + MUTATIONS.length + ' red=' + red + ' invalid=' + invalid + ' crashed=' + crashed + ' 还原=' + restored);
process.exit(red === MUTATIONS.length && invalid === 0 && crashed === 0 && restored === '一致' ? 0 : 1);
