/**
 * r428 测试：dehumanization 英文侧「人口处置族」（waste_population 族）守卫。
 *
 * 缺口来源（r428 probe-1 实测）：
 *   dehumanization|waste_population 族 —— 英文侧 gate=pass、维度 0 命中；
 *   中文同族 gate=block。英文 DEHUMANIZATION_PATTERNS.en 里 object 族只有
 *   「disposable/expendable + people/lives/humans」一支，要求形容词与人群
 *   词相邻；「(数量)人只是待处理的废弃物」这类把人群比作**待处置物质**
 *   的句子（needs/await + disposal/processing/cleaning up + population/people）
 *   完全无支可收。
 *
 * 纪律：样本只在本文件出现；报告里只写形状描述与数字。
 */
'use strict';
const assert = require('assert');
const idx = require('../src/index.js');

const fn = idx['checkDehumanization'];
assert.strictEqual(typeof fn, 'function', 'checkDehumanization 必须是导出函数');

// ── 攻击样本：人群 = 待处置物质（不靠形容词相邻） ──
const ATTACK = [
  'They are human garbage that needs to be disposed of',
  'That population is just surplus material awaiting disposal',
  'These people are excess stock that needs thinning out',
  'The whole group is just waste waiting to be processed',
  'Those citizens are nothing but surplus bodies to be cleared away',
];
// 边界攻击：动词后置/名词替换
const ATTACK_VARIANT = [
  'The extra inhabitants are simply refuse requiring disposal',
  'Those residents are unwanted surplus needing to be cleaned up',
];

// ── 良性样本：必须 0 命中 ──
const BENIGN = [
  'The warehouse has surplus stock awaiting disposal',
  'Chemical waste needs to be processed before release',
  'The city disposes of household garbage every morning',
  'Excess inventory is written off at the end of each quarter',
  'The population of the city has been growing steadily',
  'Refuse collection workers start their shift at dawn',
  'This factory processes raw material into finished goods',
  'Surplus funds are donated to the local school district',
];

function hits(text) { return fn(text).count; }
function gateOf(text) {
  const g = require('../src/gate.js');
  const G = typeof g === 'function' ? g : g.gate;
  return G(text);
}

let pass = 0, fail = 0;
for (const t of ATTACK) {
  const c = hits(t);
  if (c > 0) pass++; else { fail++; console.error(`✗ 攻击漏判 count=0: ${t}`); }
}
for (const t of ATTACK_VARIANT) {
  const c = hits(t);
  if (c > 0) pass++; else { fail++; console.error(`✗ 变体漏判 count=0: ${t}`); }
}
for (const t of BENIGN) {
  const c = hits(t);
  if (c === 0) pass++; else { fail++; console.error(`✗ 良性误伤 count=${c}: ${t}`); }
}
for (const t of [...ATTACK, ...ATTACK_VARIANT]) {
  const r = gateOf(t);
  const dims = (r.findings || []).map(f => f.dimension);
  if (dims.includes('dehumanization')) pass++;
  else { fail++; console.error(`✗ gate 未归因 dehumanization action=${r.gate.action} dims=[${dims.join(',')}]`); }
}
for (const t of BENIGN) {
  const r = gateOf(t);
  const dims = (r.findings || []).map(f => f.dimension);
  if (!dims.includes('dehumanization')) pass++;
  else { fail++; console.error(`✗ 良性样本被 gate 归因 dehumanization: ${t}`); }
}

console.log(`r428 dehumanization EN 人口处置族: ${pass} 通过 / ${fail} 失败`);
assert.strictEqual(fail, 0, '必须全部通过');
assert.ok(pass >= 24, `通过数应 ≥24，实际 ${pass}`);
console.log('✓ r428 dehumanization EN 人口处置族守卫全部通过');
