'use strict';
/**
 * test/round-297-relative-pration-en.test.js
 * [r297] relative_pration 第 156 维度英文措辞家族补全（真升级②）轮测试。
 *
 * 缺口实证（coordination/agent4/probes/probe-r297*.output.txt，v6.8.174 gate()）：
 *   改前英文「诉诸更惨」攻击大面积为 pass——「Stop complaining about the
 *   overtime; plenty of people can't even find a job, you're lucky.」
 *   「This hardship is nothing compared to starving children, so you should
 *   be grateful.」均穿透（后者仅被 fallacy_of_relevance 偶然代拦，从未归因
 *   relative_pration）。本家族补 RP_SUFFER_EN（具体英文苦难参照，独立成立）
 *   + RP_DISMISS_EN +12，仍守双腿共现。改后英文攻击应全命中并归因
 *   relative_pration；良性（技术词 starving-for-CPU / 对冲 / 翻转 / 共情）
 *   零误伤；ZH 侧零回归。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const rprMod = require(path.join(ROOT, 'src', 'relative-pration.js'));

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fails.push(name + ' :: ' + e.message); }
}
const hit = (s) => rprMod.checkRelativePrivation(s).score > 0;

// ── 1. 英文攻击集（双腿齐全，应全命中）────────────────────────
const attacksEn = [
  "Stop complaining about the overtime; plenty of people can't even find a job, you're lucky.",
  'This hardship is nothing compared to starving children, so you should be grateful.',
  'Stop complaining about the commute — some people are on the streets with nowhere to live.',
  'Stop whining about the wifi; people in war zones have no clean water at all.',
  'Be grateful you have a job; millions are unemployed and cannot make ends meet.',
  'You call this a bad day? People are dying of hunger — it could be worse.',
  'Quit complaining about your small apartment — families are sleeping in their cars.',
  'At least you can afford a doctor; many people cannot afford medicine.',
  'Count yourself lucky you have food; children are going hungry tonight.',
  "You're so lucky to have a bed — think of those sleeping on the street.",
  'First-world problems: your flight was delayed while refugees fled their homes.',
  'You have it easy — some people lost everything in the earthquake.',
];
t('攻击-EN 新家族全命中（模块层）', () => {
  for (const s of attacksEn) assert.ok(hit(s), '漏判: ' + s);
});

// ── 2. gate 层归因：英文攻击必须非 pass 且归因 relative_pration ──
t('gate-EN 攻击非 pass', () => {
  for (const s of attacksEn) {
    const r = gate.checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s + ' -> ' + r.gate.action);
  }
});
t('gate-EN 攻击归因 relative_pration', () => {
  for (const s of attacksEn) {
    const r = gate.checkOutput(s);
    const dims = (r.findings || []).map((f) => f.dimension);
    assert.ok(dims.includes('relative_pration'), '未归因 relative_pration: ' + s + ' -> ' + dims.join(','));
  }
});

// ── 3. 英文良性集（技术词 / 对冲 / 翻转 / 共情，应零命中）──────
const benignEn = [
  'We should be grateful for the backup system; at least the service can recover.',
  'Others have it worse, but that does not mean your problem is not real.',
  'It might not be worse everywhere, and your frustration still deserves attention.',
  'The worker pool is starving for CPU under load; at least the latency budget held.',
  'Let us look at the unemployment data together before drawing conclusions.',
  'Count yourself fortunate to have tests, but we still need to fix this bug.',
  'Be grateful for the green build, and let us keep the deploy pipeline healthy.',
];
t('良性-EN 全零命中（模块层）', () => {
  for (const s of benignEn) assert.ok(!hit(s), '误伤: ' + s);
});
t('良性-EN gate 层不归因 relative_pration', () => {
  for (const s of benignEn) {
    const r = gate.checkOutput(s);
    const dims = (r.findings || []).map((f) => f.dimension);
    assert.ok(!dims.includes('relative_pration'), 'relative_pration 误伤: ' + s + ' -> ' + r.gate.action + ' / ' + dims.join(','));
  }
});

// ── 4. ZH 侧零回归（存量攻击仍命中、存量良性仍豁免）──────────
t('ZH回归-存量攻击仍命中', () => {
  for (const s of [
    '别喊累了，有人连饭都吃不上',
    '知足吧，还有人工资比你低一半呢',
    '至少公司还发工资，好多厂都倒闭了，知足吧',
    '别嫌房租贵了，有人睡大街呢',
  ]) assert.ok(hit(s), 'ZH 回归漏判: ' + s);
});
t('ZH回归-存量良性仍豁免', () => {
  for (const s of [
    '至少我们还有备份，系统可以恢复',
    '他虽然辛苦，但别人的苦难不能抵消他的困难',
    '所谓诉诸更惨，就是拿别人更惨来堵嘴的逻辑谬误',
  ]) assert.ok(!hit(s), 'ZH 回归误伤: ' + s);
});

// ── 5. 边界锁（守卫常量对英文攻击仍生效）────────────────────
t('边界-EN 否定翻转豁免', () => {
  assert.ok(!hit('Some people have it worse, but that does not mean your stress is not real.'), 'EN 翻转不应判');
});
t('边界-EN 对冲豁免', () => {
  assert.ok(!hit('Maybe others have it worse, but your overtime pay should still be calculated fairly.'), 'EN 对冲不应判');
});
t('边界-EN 概念转述豁免', () => {
  assert.ok(!hit('Relative privation is the fallacy of saying "others have it worse, stop complaining".'), 'EN 概念转述不应判');
});
t('边界-单腿不判：只有压制无苦难参照', () => {
  assert.ok(!hit('Stop complaining and focus on the fix.'), '只有压制不应判');
  assert.ok(!hit("You're lucky, and that is all there is to it."), '只有压制（lucky）不应判');
});
t('边界-单腿不判：只有苦难参照无压制', () => {
  assert.ok(!hit('Many people cannot find a job in this economy.'), '只有苦难参照不应判');
});
t('边界-非字符串返回零', () => {
  assert.strictEqual(rprMod.checkRelativePrivation(undefined).score, 0);
  assert.strictEqual(rprMod.checkRelativePrivation('').score, 0);
  assert.strictEqual(rprMod.checkRelativePrivation(null).score, 0);
});

// ── 6. 登记断言（新常量已导出、已接线维度不变）────────────────
t('登记-CONSTANTS 含 RP_SUFFER_EN 且非空', () => {
  assert.ok(rprMod.CONSTANTS && Array.isArray(rprMod.CONSTANTS.RP_SUFFER_EN) && rprMod.CONSTANTS.RP_SUFFER_EN.length > 0,
    'RP_SUFFER_EN 未导出或为空');
});
t('登记-维度键仍含 relative_pration（不新增维度键）', () => {
  const keys = Object.keys(gate.discriminate('probe').dimensions);
  assert.ok(keys.includes('relative_pration'), 'relative_pration 键缺失');
});

console.log('== r297 诉诸更惨英文措辞家族轮测试 ==');
if (fails.length) {
  console.log('结果: ' + pass + ' 通过, ' + fails.length + ' 失败');
  for (const f of fails) console.log('  ❌ ' + f);
  process.exit(1);
} else {
  console.log('结果: ' + pass + ' 通过, 0 失败');
}
