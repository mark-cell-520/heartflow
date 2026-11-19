#!/usr/bin/env node
'use strict';
// r411 审计修复单测：homogeneity_assumption 豁免组①否定剥离表补齐
// 2026-11-19 22:30 每日审计发现并修复的 P1 缺陷：
//   「没区别/没差别/没什么两样」是「没有区别/没有差别」的口语缩合，
//   语义与已收的否定前缀完全同族，但 _DIFF_NEG_ZH 未收 `没` 字裸形，
//   导致「同村的人都没区别，想法一样。」整句被豁免组①误杀
//   （detail=exempt:diff-ack，gate=pass）。
// 修复：剥离表补 `没` 裸形 + 「并无二致」。
// 本测固化：①缩合否定形不再误杀；②正向差异承认仍豁免；
//          ③r404 存量攻击/良性基线零回归。

const assert = require('assert');
const {
  checkHomogeneityAssumption,
  HOMOGENEITY_ZH,
  SHARED_ATTR_ZH,
} = require('../src/homogeneity-assumption.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ok - ' + name); }
  catch (e) { fail++; console.log('  FAIL - ' + name + '\n    ' + e.message); }
}

// ── ① 缩合否定形：不再被豁免组①误杀，必须承重命中 ──────────────
t('没区别缩合形承重命中', () => {
  const r = checkHomogeneityAssumption('同村的人都没区别，想法一样。');
  assert.strictEqual(r.hit, true, `应命中，实际 detail=${r.detail}`);
  assert.ok(!String(r.detail).includes('exempt'), '不得走豁免路径');
});

t('没差别缩合形承重命中', () => {
  const r = checkHomogeneityAssumption('同一届毕业生能力都没差别。');
  assert.strictEqual(r.hit, true, `应命中，实际 detail=${r.detail}`);
});

t('没什么两样缩合形承重命中', () => {
  const r = checkHomogeneityAssumption('同班同学性格都没什么两样。');
  assert.strictEqual(r.hit, true, `应命中，实际 detail=${r.detail}`);
});

t('并无二致缩合形承重命中', () => {
  const r = checkHomogeneityAssumption('同乡之间其实并无二致，想法完全一致。');
  assert.strictEqual(r.hit, true, `应命中，实际 detail=${r.detail}`);
});

t('没区别 + EN 侧不受影响', () => {
  const r = checkHomogeneityAssumption('Everyone in the same village has no difference in temperament.');
  // EN 侧未改，本句不在 EN 腿表内则不命中；此处只要求不崩溃且返回结构化
  assert.ok(typeof r.hit === 'boolean');
});

// ── ② 正向差异承认：仍必须豁免（防修复过冲）────────────────────
t('正向「有差别」仍豁免', () => {
  const r = checkHomogeneityAssumption('这项调查显示同班同学之间差别很大，个体差异明显。');
  assert.strictEqual(r.hit, false, '差异承认句不得命中');
  assert.strictEqual(r.detail, 'exempt:diff-ack', `应走 diff-ack 豁免，实际 ${r.detail}`);
});

t('「不无差别」不得被剥成攻击', () => {
  // 「不无差别」= 有差别（正向承认），不应进入否定剥离表
  const r = checkHomogeneityAssumption('同届毕业生之间不无差别，各人路径不同。');
  assert.strictEqual(r.hit, false, `不无差别是正向承认，实际 hit=${r.hit} detail=${r.detail}`);
});

t('统计检验口径仍豁免', () => {
  const r = checkHomogeneityAssumption('我们对同班同学做了方差分析，差异不显著。');
  assert.strictEqual(r.hit, false, '统计检验句不得命中');
});

// ── ③ 腿②「脾气/性格」名词族（原 miss 补入）───────────────────
t('腿②收「一个脾气」名词宾语形', () => {
  assert.ok(HOMOGENEITY_ZH.test('全都一个脾气'), '应命中「一个脾气」');
  assert.ok(HOMOGENEITY_ZH.test('都是一个性格'), '应命中「一个性格」');
});

t('腿①腿②邻近窗校验仍在', () => {
  const r = checkHomogeneityAssumption('同村的人全都一个脾气。');
  assert.strictEqual(r.hit, true, `应命中，实际 detail=${r.detail}`);
  assert.ok(SHARED_ATTR_ZH.test('同村'), '腿①应命中同村');
});

// ── ④ 远距两腿仍不判（防邻近窗被绕过）───────────────────────
t('远距两腿不判', () => {
  const r = checkHomogeneityAssumption(
    '同村的人在这里生活了很久，他们有着各自的职业、家庭和朋友圈子，每天早出晚归忙忙碌碌，说起来其实全都一个脾气。'
  );
  // 间距超出 WIN_ZH=80 时不得命中（far 短路）
  assert.strictEqual(r.hit, false, `远距应不判，实际 hit=${r.hit} detail=${r.detail}`);
});

console.log(`\nround-411 diff-ack negation: ${pass} passed / ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
