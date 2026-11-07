/**
 * test/round-249-denominator-swap.js
 * 第 224 维度 denominator_swap（分母替换谬误 / denominator swap / incomparable
 * base sizes）——负例注入测试 + 豁免陷阱翻转 + 两腿承重。
 *
 * 判别族：拿**不同分母的绝对计数**直接做**优劣/安全/多少比较**并下结论，
 * 忽略人口、样本量、暴露规模等基数不同。
 *   「A 城发生了十起事故，B 城只发生了一起，可见 B 城更安全」
 *   「City A had 10 accidents and city B had 1, so city B is safer」
 *
 * 判据为**三腿共现（缺一不判）**：
 *   腿① ABSOLUTE 绝对计数（中英双语，含裸名词量词形态——r161 教训）
 *   腿② COMPARE  比较结论（更/最/高于/低于；safer/better/more…）
 *   腿③ SUBJECT  主体对置（≥2 个不同主体指称）
 * 豁免：比率/统一口径语言在场、同分母明示、元陈述（指出分母问题）、
 *       纯列举明说不作比较。
 *
 * 与既有维度边界：
 *   base_rate_neglect(169) 管单个阳性信号→个体高置信度结论，可全程无数字、
 *     无两个比较主体；本族要件是两个主体的绝对计数对置、错在分母不可比。
 *   percentage_overflow 管百分比之和越界；本族可无百分比，只比绝对数。
 *   selection_bias(168) 管受限样本→总体推广；本族两个计数可都是全量真数。
 */
'use strict';

const assert = require('assert');
const path = require('path');
const { checkDenominatorSwap, __internals } = require(path.join(__dirname, '..', 'src', 'denominator-swap.js'));
const { gate } = require(path.join(__dirname, '..', 'src', 'gate.js'));

let pass = 0, fail = 0;
function ok(cond, label) { if (cond) { pass++; } else { fail++; console.log('  ❌ ' + label); } }

// ── 攻击样本：中英双语 / 裸名词 / 带修饰 / 倒装 / 长句 ──────────────
const ATTACK = [
  // 中文
  'A 城发生了十起事故，B 城只发生了一起，可见 B 城更安全',
  '我们店收到了十封投诉，隔壁店只收到一封，所以我们的服务更差',
  '这个方案去年被十个人否决，另一个方案只有一个人否决，所以另一个方案更好',
  '甲厂今年发生了五起工伤，乙厂只发生了一起，可见乙厂更安全',
  '我们团队记录了十个缺陷，他们团队只记录了一个，所以他们的代码质量更高',
  '本市去年发生了三十起投诉，邻市只有三起，可见邻市的治理水平更高',
  'A 公司上报了十二起故障，B 公司只上报了两起，显然 A 公司的系统更不稳定',
  // 英文
  'City A had 10 accidents and city B had 1, so city B is safer',
  'Our team logged 10 bugs while theirs logged 1, so their code is better',
  'City A reported 20 incidents last year and city B reported 2, so city B is cleaner',
  'Our store got 15 complaints and their store got 3, so our service is worse',
  'Team A had 8 failures and team B had 1, therefore team B is more reliable',
  'Region A recorded 25 crimes and region B recorded 4, so region B is more secure',
];

// ── 良性样本：含边缘良性与正确多因/比率陈述 ───────────────────────
const BENIGN = [
  // 无比较结论
  'A 城发生了十起事故，B 城只发生了一起，均已结案',
  '我们店收到了十封投诉，隔壁店只收到一封，两店都在整改',
  'Both cities reported accidents last year',
  // 比率/统一口径在场
  'B 城更安全，因为它的交通事故率只有 A 城的十分之一',
  'A 城每万人事故率是 3.2，B 城是 1.1，所以 B 城更安全',
  'The accident rate per capita is lower in city B, so city B is safer',
  'Comparing deaths per million people, region B outperformed region A',
  // 同分母明示
  '两城人口规模相近，A 城十起事故 B 城一起，B 城确实更安全',
  'City A and city B have similar population sizes: 10 vs 1 accidents, so B is safer',
  // 元陈述：指出分母问题（正是本维度要教的正确判别）
  '这个比较分母不同，A 城人口是 B 城的五倍，不能直接比',
  '不同分母不能直接比较，要看人均事故率',
  'Our city had 10 accidents and theirs had 1, but populations differ so it is not comparable',
  'Different denominators make this comparison invalid; use incidence rates',
  // 无绝对计数
  'B 城更安全',
  '这个方案更好一些',
];

console.log('== 攻击样本（期望全部命中）');
for (const s of ATTACK) ok(checkDenominatorSwap(s).hit, 'attack: ' + s.slice(0, 40));

console.log('== 良性样本（期望全部放行）');
for (const s of BENIGN) ok(!checkDenominatorSwap(s).hit, 'benign: ' + s.slice(0, 40));

console.log('== 两腿承重（负例注入：按语言抹掉该语言的腿组后攻击不再命中）');
const I = __internals();
const all = {}; for (const k of Object.keys(I)) all[k] = [];
ok(!checkDenominatorSwap(ATTACK[0], all).hit, '全常量抹空后不命中');
// 中文攻击句：抹中文三腿组
const zhLegs = { ABSOLUTE_ZH: [], COMPARE_ZH: [], SUBJECT_ZH: [] };
ok(!checkDenominatorSwap(ATTACK[0], zhLegs).hit, '抹中文腿组（绝对+比较+主体）后中文攻击句不命中');
// 逐腿抹（同语言内单腿，应不命中）
for (const k of ['ABSOLUTE_ZH', 'COMPARE_ZH', 'SUBJECT_ZH']) {
  const one = {}; one[k] = [];
  ok(!checkDenominatorSwap(ATTACK[0], one).hit, '抹 ' + k + ' 后中文攻击句不命中');
}
// 英文攻击句：抹英文三腿组 + 逐腿
const enLegs = { ABSOLUTE_EN: [], COMPARE_EN: [], SUBJECT_EN: [] };
ok(!checkDenominatorSwap(ATTACK[7], enLegs).hit, '抹英文腿组后英文攻击句不命中');
for (const k of ['ABSOLUTE_EN', 'COMPARE_EN', 'SUBJECT_EN']) {
  const one = {}; one[k] = [];
  ok(!checkDenominatorSwap(ATTACK[7], one).hit, '抹 ' + k + ' 后英文攻击句不命中');
}
// 豁免表承重：抹掉豁免表后，对应的豁免良性样本应转为命中
{
  const rateSample = 'A 城每万人事故率是 3.2，B 城是 1.1，所以 B 城更安全';
  ok(checkDenominatorSwap(rateSample, { EXEMPT_RATE_ZH: [] }).hit,
     '抹 EXEMPT_RATE_ZH 后「每万人事故率」良性转命中（比率豁免承重）');
  const baseSample = '两城人口规模相近，A 城十起事故 B 城一起，B 城确实更安全';
  ok(checkDenominatorSwap(baseSample, { EXEMPT_SAMEBASE_ZH: [] }).hit,
     '抹 EXEMPT_SAMEBASE_ZH 后「人口规模相近」良性转命中（同分母豁免承重）');
}

console.log('== 豁免陷阱翻转（元陈述/比率在场必须放行，抹掉后应命中）');
{
  const one = { EXEMPT_SAMEBASE_ZH: [], EXEMPT_RATE_ZH: [], EXEMPT_RATE_EN: [] };
  ok(checkDenominatorSwap('不同分母不能直接比较，A 城十起事故，B 城一起，A 城更严重', one).hit,
     '抹掉同分母豁免后元陈述形转为命中（说明原豁免真在拦它）');
}

console.log('== gate 层集成（新维度必须真实改变 gate.action）');
for (const s of ATTACK.slice(0, 5)) {
  const r = gate(s);
  const hit = (r.findings || []).some(f => f.dimension === 'denominator_swap');
  ok(hit && r.gate.action !== 'pass', 'gate: ' + s.slice(0, 30) + ' => ' + r.gate.action);
}
for (const s of BENIGN.slice(0, 6)) {
  const r = gate(s);
  const hit = (r.findings || []).some(f => f.dimension === 'denominator_swap');
  ok(!hit, 'gate benign 无本维误伤: ' + s.slice(0, 30));
}

console.log('\n结果: ' + pass + ' 通过, ' + fail + ' 失败');
assert.strictEqual(fail, 0, 'round-249 denominator_swap 测试未全绿');
console.log('✅ round-249 denominator_swap 全部通过');
