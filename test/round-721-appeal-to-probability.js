/**
 * test/round-721-appeal-to-probability.js
 * [r721] appeal_to_probability（诉诸概率/可能性误当必然，第 152 维度）轮次验收测试。
 * 形态纪律（同 r720）：
 * - 攻击样本 20 条（中英各 10），模块层 checkAppealToProbability 必须 count>0
 * - 良性样本 21 条，模块层必须零命中
 * - 边界锁：只有基数腿无必然断言不得判；只有必然断言无论据不得判；
 *   元话语/正确概率陈述在场不得判
 * - 分工边界锁：样本走 gate.checkOutput()，动作必须非 pass（归属维度真兜底）
 * - gate 登记断言：维度键集合含 appeal_to_probability
 * 注意：本文件不带 .test.js 后缀（run-all 不自动发现，按纪律单独跑）。
 */
'use strict';

const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const apbMod = require(path.join(ROOT, 'src', 'appeal-to-probability.js'));
const gate = require(path.join(ROOT, 'src', 'gate.js'));

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fails.push(name + ': ' + e.message); }
}
const hit = (s) => apbMod.checkAppealToProbability(s).count > 0;

// ── 1. 攻击样本：中英各 10 ──────────────────────────────────────
const attacksZh = [
  '宇宙这么大，肯定有外星人',                                        // R1 规模×必然
  '世上无难事，只要肯试，试多了总能成',                              // R1
  '航班天天飞，出事的才几起，我肯定赶不上',                          // R1 侥幸
  '选择题四个选项，蒙个十道八道总能对几道，考试稳了',                // R1 蒙题
  '概率再低，只要重复次数够多就一定发生',                            // R1 大数幻觉
  '中国有十四亿人，什么样的事不可能发生？',                          // R1 反问必然
  '投了这么多份简历，总有一家会要我吧',                              // R1 求职
  '海投了三百份，按概率也能中几个 offer，肯定有戏',                  // R1
  '试了这么多次，总有一次能成的',                                    // R1
  '失败是成功之母，我都失败这么多次了，成功还会远吗',                // R1
];
const attacksEn = [
  'With so many tickets sold, someone has to win — why not me?',           // R2
  'I have applied to hundreds of jobs; one of them is bound to say yes.',  // R2
  'The universe is so vast, there must be intelligent life.',             // R2
  'Given enough time, anything that can happen will happen.',             // R2
  'If I keep playing, I am bound to win sooner or later.',                // R2
  'Do it enough times and success is guaranteed eventually.',             // R2
  'With billions of people playing, someone has to win, so my odds are fine.', // R2
  'I have tried so many times, one of these attempts is guaranteed to work.',  // R2
  'So many people apply every year; one of them is sure to be me.',       // R2
  'There are millions of tickets out there, mine has to be the winner.',  // R2
];
attacksZh.forEach((s, i) => t('攻击ZH-' + (i + 1), () => assert.ok(hit(s), '未命中: ' + s)));
attacksEn.forEach((s, i) => t('攻击EN-' + (i + 1), () => assert.ok(hit(s), '未命中: ' + s)));

// ── 2. 良性样本 21 ─────────────────────────────────────────────
const benign = [
  // 正确概率陈述（豁免：陈述概率原理是在破除谬误）
  '概率虽然低但不是零，我们还是要做好预案',
  '买彩票中奖概率极低，当作娱乐可以，当投资不行',
  '不能排除这种可能性，但需要证据支持',
  'Low probability does not mean impossible; we still need a backup plan.',
  'Winning the lottery is improbable; play for fun, not for income.',
  '再低的概率乘以足够多的次数也会发生，所以不能心存侥幸',
  '样本量大能摊薄误差，但不改变小概率事件本身',
  '重复次数多可以提高总体命中率，但单次结果仍然随机',
  'There is a real possibility of life elsewhere, but we have no evidence yet.',
  'Someone will win the lottery for sure, but the odds say it will not be me.',
  // 元陈述 / 概念讲解
  '诉诸概率是指把基数大当成必然的逻辑错误',
  'Appeal to probability is a common logical fallacy.',
  // 规模陈述无必然断言（缺腿②）
  '宇宙很大，存在外星生命的概率不低，但目前没有直接证据',
  '中国有十四亿人，什么样的事都可能发生，也都不一定',
  '航班天天飞，但每趟的安检都一样严格',
  'Flights take off every day, and every one of them goes through the same checks.',
  // 只有基数腿无反推断
  '坚持尝试能提高成功率，但成功不是必然的',
  '只要坚持练，水平会提高，但不能保证一定成功',
  'Air travel is statistically very safe, though no single flight is risk-free.',
];
benign.forEach((s, i) => t('良性-' + (i + 1), () => assert.ok(!hit(s), '误伤: ' + s)));

// ── 3. 边界锁 ──────────────────────────────────────────────────
t('边界-缺必然腿不判', () => {
  // 只有腿①基数/规模在场、无必然断言：正确规模陈述
  assert.ok(!hit('宇宙这么大，值得继续探索'), '缺必然断言腿不应判');
});
t('边界-缺基数腿不判', () => {
  // 只有腿②必然断言在场、无论据来源：归 wishful_thinking/confidence
  assert.ok(!hit('这事一定能成，我相信'), '缺基数腿不应判');
  assert.ok(!hit('Everything will be fine eventually, I am sure.'), '缺基数腿不应判');
});
t('边界-元话语豁免', () => {
  assert.ok(!hit('老师课上讲，诉诸概率就是把可能性当成必然'), '元话语不应判');
});
t('边界-正确概率陈述豁免', () => {
  assert.ok(!hit('基数大不等于个体概率高，这是大数定律的基本常识'), '正确陈述不应判');
});
t('边界-非字符串返回零', () => {
  assert.strictEqual(apbMod.checkAppealToProbability(undefined).count, 0);
  assert.strictEqual(apbMod.checkAppealToProbability('').count, 0);
  assert.strictEqual(apbMod.checkAppealToProbability(null).count, 0);
});
t('边界-空输入不标 zeroHit', () => {
  // 空输入是守卫路径，不应伪装成"扫描过但没命中"
  assert.strictEqual(apbMod.checkAppealToProbability(undefined).zeroHit, false);
});
t('边界-常量可注入', () => {
  // 负例脚本注入能力：清空 BASE_ZH 后中文路由必须失效
  const r = apbMod.checkAppealToProbability('宇宙这么大，肯定有外星人', { BASE_ZH: [], CERTAIN_ZH: [] });
  assert.strictEqual(r.hit, false, '清空双腿常量后应失效');
  const r2 = apbMod.checkAppealToProbability('宇宙这么大，肯定有外星人', { BASE_ZH: [] });
  assert.strictEqual(r2.hit, false, '清空基数腿后应失效');
  const r3 = apbMod.checkAppealToProbability('宇宙这么大，肯定有外星人', { CERTAIN_ZH: [] });
  assert.strictEqual(r3.hit, false, '清空必然腿后应失效');
});

// ── 4. 分工边界锁（gate 层必须非 pass）────────────────────────
t('分工-gate对规模必然句判非pass', () => {
  const r = gate.checkOutput('宇宙这么大，肯定有外星人');
  assert.notStrictEqual(r.gate.action, 'pass', '归属维度必须兜底');
});
t('分工-gate对侥幸句判非pass', () => {
  const r = gate.checkOutput('航班天天飞，出事的才几起，我肯定赶不上');
  assert.notStrictEqual(r.gate.action, 'pass');
});
t('分工-gate对EN样本判非pass', () => {
  const r = gate.checkOutput('With so many tickets sold, someone has to win — why not me?');
  assert.notStrictEqual(r.gate.action, 'pass');
});
t('分工-gate对良性句放行', () => {
  const r = gate.checkOutput('概率虽然低但不是零，我们还是要做好预案');
  assert.strictEqual(r.gate.action, 'pass');
});

// ── 5. gate 登记断言 ───────────────────────────────────────────
t('登记-维度键含appeal_to_probability', () => {
  const keys = Object.keys(gate.discriminate('probe').dimensions);
  assert.ok(keys.includes('appeal_to_probability'), '维度键未登记');
});
t('登记-index导出checkAppealToProbability', () => {
  const idx = require(path.join(ROOT, 'src', 'index.js'));
  assert.strictEqual(typeof idx.checkAppealToProbability, 'function');
});
t('登记-VERIFY_DIMS含appeal_to_probability', () => {
  // VERIFY_DIMS 是 index.js 内部 Set 不导出，用源码段断言登记
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  const m = src.match(/const VERIFY_DIMS = new Set\(\[([\s\S]*?)\]\);/);
  assert.ok(m, 'VERIFY_DIMS 定义段未找到');
  assert.ok(m[1].includes("'appeal_to_probability'"), 'VERIFY_DIMS 未登记 appeal_to_probability');
});
t('登记-verify级在gate生效', () => {
  // appeal_to_probability 命中必须让 verdict 落到「需验证」或更差（良性句保持可信）
  const r1 = gate.checkOutput('中国有十四亿人，什么样的事不可能发生？');
  assert.notStrictEqual(r1.verdict, '可信');
  const r2 = gate.checkOutput('概率虽然低但不是零，我们还是要做好预案');
  assert.strictEqual(r2.verdict, '可信');
});
t('登记-维度总数155', () => { // 第 721 轮落笔时引擎 152 维，r722/r723/r724 各 +1 → 155（10-25 合并并入 void_zh_standard_shift 第 155 维度，GATE-2 总数断言随合并更新）
  const keys = Object.keys(gate.discriminate('probe').dimensions);
  assert.strictEqual(keys.length, 155, '维度键数应为 154，实际 ' + keys.length);
});

console.log('passed: ' + pass + ', failed: ' + fails.length);
fails.forEach((f) => console.log('  FAIL ' + f));
process.exit(fails.length ? 1 : 0);
