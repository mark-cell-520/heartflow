// test/overclaim-wiring.test.js — 守卫 overclaim 真接进 discriminate()
// 铁律：声明了模块 ≠ 接上了线。本测试防「overclaim-checker.js 存在但从不可达」。
// 修 2026-10-08：zip 手包里 overclaim 模块+接线齐全，但远端 6.8.0 实测
//   count=0 —— 说明这类「写好了没接线」的缺口真实发生过，必须有守卫。

'use strict';
const assert = require('assert');
const path = require('path');

const idx = require(path.join(__dirname, '..', 'src', 'index.js'));

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); passed++; console.log('  OK  ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ': ' + e.message); }
}

const OVERCLAIM_TEXT = '纳维-斯托克斯方程已被 AI 彻底解决';
const BENIGN_TEXT = '纳维-斯托克斯方程已被 AI 解决，但仅覆盖 Clay C/D 带外力情形';

t('index.js 导出 checkOverclaim', () => {
  assert.strictEqual(typeof idx.checkOverclaim, 'function', '必须被导出');
});

t('discriminate() 返回 overclaim 维度', () => {
  const d = idx.discriminate(OVERCLAIM_TEXT, [], 'general');
  const oc = d.dimensions && d.dimensions.overclaim;
  assert.ok(oc, 'dimensions.overclaim 必须存在（接线守卫）');
  assert.strictEqual(oc.count, 1, '该句必须被计 1 次');
  assert.ok(oc.severity > 0, 'severity 必须 > 0 才能影响 gate');
  assert.strictEqual(typeof oc.summary, 'string');
});

t('overclaim 命中进 findings（可被 caller 追溯）', () => {
  const d = idx.discriminate(OVERCLAIM_TEXT, [], 'general');
  const f = (d.findings || []).filter(x => /overclaim/i.test(x.dimension || x.name || ''));
  assert.ok(f.length >= 1, 'findings 里必须有 overclaim 条目');
});

t('过度宣称不得被判「可信」放行', () => {
  const d = idx.discriminate(OVERCLAIM_TEXT, [], 'general');
  // 实测修复前 verdict 为可信、overallScore 1.0；修复后必须转严
  assert.notStrictEqual(d.verdict, '可信', '无保留完成态不能被判可信放行');
  assert.ok(d.gate && d.gate.action === 'verify', `gate 应要求复核，实得 ${d.gate && d.gate.action}`);
});

t('带限定的真话不误伤', () => {
  const d = idx.discriminate(BENIGN_TEXT, [], 'general');
  const oc = d.dimensions && d.dimensions.overclaim;
  assert.ok(oc, 'overclaim 维度仍应存在');
  assert.strictEqual(oc.count, 0, '带限定的真话 count 必须为 0（误报控制）');
});

t('普通文本 overclaim 干净', () => {
  const d = idx.discriminate('今天团队开了一个会', [], 'general');
  const oc = d.dimensions && d.dimensions.overclaim;
  assert.ok(oc);
  assert.strictEqual(oc.count, 0);
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed > 0 ? 1 : 0);
