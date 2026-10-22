#!/usr/bin/env node
/**
 * 第 698 轮负例守卫：注入-删条-必须变红
 *
 * 被测对象：src/poisoning-the-well.js 的 poisoning_the_well 双腿判据与
 * 三类豁免（r698 新增，经 src/index.js 十处接线）。
 * 变异形态（每条变异必须在 test/round-698-poisoning-the-well.js 上真红）：
 *   M1 摘污名腿（smearZh/smearEn 恒 false）        → 攻击样本必须翻转漏判
 *   M2 摘拒绝腿（dismissZh/dismissEn 恒 false）    → 攻击样本必须翻转漏判
 *   M3 只跑中文腿（smearEn/dismissEn 恒 false）    → 英文攻击样本必须漏判
 *   M4 META 豁免失效（恒 false）                   → META 概念分析样本必须被误伤
 *   M5 反诈豁免失效（恒 false）                    → 反诈提醒样本必须被误伤
 *   M6 匿名消息源豁免失效（恒 false）              → 匿名消息源样本必须被误伤
 * 对照组（无变异）必须全绿。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'poisoning-the-well.js');
const TEST = 'test/round-698-poisoning-the-well.js';
const BACKUP = path.join(ROOT, 'src', '__r698_neg_backup.js');

const orig = fs.readFileSync(SRC, 'utf8');
fs.writeFileSync(BACKUP, orig);

const MUTATIONS = [
  {
    name: 'M1_drop_smear_leg',
    apply: (s) => s.replace(
      '  const smearZh = SMEAR_ZH_.test(text);\n  const smearEn = SMEAR_EN_.test(text);',
      '  const smearZh = false;\n  const smearEn = false;'),
  },
  {
    name: 'M2_drop_dismiss_leg',
    apply: (s) => s.replace(
      '  const dismissZh = DISMISS_ZH_.test(text);\n  const dismissEn = DISMISS_EN_.test(text);',
      '  const dismissZh = false;\n  const dismissEn = false;'),
  },
  {
    name: 'M3_zh_only',
    apply: (s) => s.replace(
      '  const smearEn = SMEAR_EN_.test(text);',
      '  const smearEn = false;').replace(
      '  const dismissEn = DISMISS_EN_.test(text);',
      '  const dismissEn = false;'),
  },
  {
    name: 'M4_meta_exempt_dead',
    apply: (s) => s.replace(
      '  if (META_EXEMPT_ZH_.test(text) || META_EXEMPT_EN_.test(text)) {',
      '  if (false && (META_EXEMPT_ZH_.test(text) || META_EXEMPT_EN_.test(text))) {'),
  },
  {
    name: 'M5_antifraud_exempt_dead',
    apply: (s) => s.replace(
      '  if (ANTIFRAUD_EXEMPT_.test(text)) {',
      '  if (false && ANTIFRAUD_EXEMPT_.test(text)) {'),
  },
  {
    name: 'M6_anon_source_exempt_dead',
    apply: (s) => s.replace(
      '  if (ANON_SOURCE_EXEMPT_.test(text)) {',
      '  if (false && ANON_SOURCE_EXEMPT_.test(text)) {'),
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
