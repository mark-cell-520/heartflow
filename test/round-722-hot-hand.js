/**
 * test/round-722-hot-hand.js
 * [r722] hot_hand（热手谬误：把连胜势头当成下一局胜率的保证，第 153 维度）
 * 轮次验收测试。形态纪律（同 r720/r721）：
 * - 攻击样本 15 条（探测器全族：中 10 + 英 5），模块层 checkHotHand 必须 count>0
 * - 良性样本 8 条（探测器全族），模块层必须零命中
 * - 边界锁：缺延续断言腿不判；缺势头腿不判；元话语/证据语境/教学转述豁免；
 *   赌徒方向（连胜之后该反转）归 gamblers_fallacy，本族不判
 * - 分工边界锁：样本走 gate.checkOutput()，动作必须非 pass（归属维度真兜底）
 * - gate 登记断言：维度键集合含 hot_hand、总数 153、VERIFY_DIMS/DIM_GUIDANCE/
 *   exports/summary 九处接线齐全
 * - r722 存量误伤修复验证：post_hoc 对 "…let us renegotiate." 的 got⊂renegotiate
 *   子串误判已清零（修复前该良性句被 gate 判 rewrite）
 * 注意：本文件不带 .test.js 后缀（run-all 不自动发现，按纪律单独跑）。
 */
'use strict';

const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const hhMod = require(path.join(ROOT, 'src', 'hot-hand.js'));
const gate = require(path.join(ROOT, 'src', 'gate.js'));

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fails.push(name + ': ' + e.message); }
}
const hit = (s) => hhMod.checkHotHand(s).count > 0;

// ── 1. 攻击样本：中 10 + 英 5（r722 探测器全族）────────────────────
const attacksZh = [
  '我手感正旺，下一把肯定中',                    // R1 手感×肯定
  '今天连赢五把，趁热打铁再来一局',              // R1 连赢×再来一局
  '最近状态好，这个月业绩肯定还会涨',            // R1 状态好×肯定还会
  '连胜之后势头在我，决赛肯定也赢',              // R1 连胜/势头×肯定也赢
  '我已经连对十题了，下一道也一定对',            // R1 连对×下一道也一定
  '我正走运呢，现在表白肯定成',                  // R1 走运×肯定
  '连红三把了，房费都是我的，继续押',            // R1 连红×继续押
  '我这阵子手气旺，再买几注肯定还有',            // R1 手气旺×再买几注肯定
  '最近面试全过，这家肯定也成',                  // R1 全过×肯定也
  '我这个月签了三单，下个月肯定更多',            // R1 签了三单×肯定
];
const attacksEn = [
  'I am on a hot streak, so the next hand is mine.',                              // R2
  'I have won five in a row; I should ride the momentum.',                        // R2
  'Things are going my way lately, so the next one will work out too.',           // R2
  'I am in the zone, so this next shot is definitely going in.',                  // R2
  'Three wins in a row — the momentum is clearly on my side.',                    // R2
];
attacksZh.forEach((s, i) => t('攻击ZH-' + (i + 1), () => assert.ok(hit(s), '未命中: ' + s)));
attacksEn.forEach((s, i) => t('攻击EN-' + (i + 1), () => assert.ok(hit(s), '未命中: ' + s)));

// ── 2. 良性样本 8（探测器全族，模块层零命中）────────────────────────
const benign = [
  '连胜可能提升信心，但每局概率独立，该复盘复盘',                    // 证据语境
  '状态好确实有帮助，但不能保证下一把的结果',                        // 有势头无延续断言
  'Winning five in a row feels great; let us review what worked.',   // EN 正当复盘
  '势头是心理感受，不影响下一局的随机结果',                          // 证据语境
  'I feel confident, but I will stick to my strategy and odds.',     // 无势头腿
  '连对十题可能是运气，考试还是得每题认真做',                        // 有势头无延续断言
  'Momentum is real in sports, but each game still has to be played.', // EN 元陈述
  '连胜值得高兴，总结原因比凭感觉加注靠谱',                          // 正当复盘
];
benign.forEach((s, i) => t('良性-' + (i + 1), () => assert.ok(!hit(s), '误伤: ' + s)));

// ── 3. 边界锁 ──────────────────────────────────────────────────
t('边界-缺延续断言腿不判', () => {
  // 只有腿①势头语境、无延续断言：正当状态陈述
  assert.ok(!hit('我最近手感不错，下次继续努力'), '缺延续断言腿不应判');
  assert.ok(!hit('He is on a hot streak this season.'), '缺延续断言腿不应判');
});
t('边界-缺势头腿不判', () => {
  // 只有腿②延续断言、无势头来源：归 wishful_thinking/confidence 家族
  assert.ok(!hit('下一把肯定中，我相信运气'), '缺势头腿不应判');
  assert.ok(!hit('The next hand will definitely be mine, I just know it.'), '缺势头腿不应判');
});
t('边界-元话语豁免', () => {
  assert.ok(!hit('热手谬误指连胜之后还认为下一局肯定还会赢'), '概念转述不应判');
  assert.ok(!hit('The hot hand fallacy is treating a streak as a guarantee.'), '概念转述不应判');
});
t('边界-证据语境豁免', () => {
  assert.ok(!hit('连胜之后下一局肯定还会赢，但每局概率独立'), '证据语境不应判');
  assert.ok(!hit('A hot streak does not affect the next round; these are independent events.'), '证据语境不应判');
});
t('边界-教学转述豁免', () => {
  assert.ok(!hit('教授在课堂上说，连胜之后下一局肯定还会赢，这是经典错误'), '教学转述不应判');
  assert.ok(!hit('The textbook explains that a streak never guarantees the next result.'), '教学转述不应判');
});
t('边界-赌徒方向不判（反转归 gamblers_fallacy）', () => {
  // 「连胜之后该输了/该赢了」是 due 方向，归第 148 维 gamblers_fallacy
  assert.ok(!hit('连胜这么多了，下一把该输了'), '反转方向不应由本族判');
  assert.ok(!hit('连开五把大，下把肯定开小'), '反转方向不应由本族判');
});
t('边界-非字符串返回零', () => {
  assert.strictEqual(hhMod.checkHotHand(undefined).count, 0);
  assert.strictEqual(hhMod.checkHotHand('').count, 0);
  assert.strictEqual(hhMod.checkHotHand(null).count, 0);
});
t('边界-空输入不标 zeroHit', () => {
  // 空输入是守卫路径，不应伪装成「扫描过但没命中」
  assert.strictEqual(hhMod.checkHotHand(undefined).zeroHit, false);
});
t('边界-常量注入点齐全（__internals）', () => {
  // 负例注入（scripts/negative-test-hot-hand.js 源码替换机制）依赖这些常量
  const I = hhMod.__internals;
  for (const k of ['STREAK_ZH', 'CONTINUE_ZH', 'STREAK_EN', 'CONTINUE_EN', 'META_NOUN', 'EVIDENCE_PRESENT', 'THIRD_PERSON_EXEMPT']) {
    assert.ok(Array.isArray(I[k]) && I[k].length > 0, '缺少注入常量: ' + k);
  }
  assert.ok(I.STREAK_ZH_RE instanceof RegExp, 'STREAK_ZH_RE 应为正则');
  assert.ok(I.STREAK_EN_RE instanceof RegExp, 'STREAK_EN_RE 应为正则');
});

// ── 4. 分工边界锁（gate 层必须非 pass，归属维度真兜底）────────────
t('分工-gate对ZH攻击判非pass', () => {
  const r = gate.checkOutput('我手感正旺，下一把肯定中');
  assert.notStrictEqual(r.gate.action, 'pass', '归属维度必须兜底');
  assert.ok((r.findings || []).some((f) => f.dimension === 'hot_hand'), 'findings 应含 hot_hand');
});
t('分工-gate对EN攻击判非pass', () => {
  const r = gate.checkOutput('I have won five in a row; I should ride the momentum.');
  assert.notStrictEqual(r.gate.action, 'pass');
});
t('分工-gate对良性句放行', () => {
  const r = gate.checkOutput('连胜可能提升信心，但每局概率独立，该复盘复盘');
  assert.strictEqual(r.gate.action, 'pass');
});
t('分工-post_hoc存量误伤已修复（renegotiate 句不再误判）', () => {
  // r722 复量发现的存量误伤：post_hoc R2 的 INTERVENE_EN 裸词 'got'
  // 子串命中 'renegotiate'（ne-got-iate）× CHANGE_EN 'no longer' →
  // 良性谈判建议句被 gate 判 rewrite。词边界修复后应放行。
  const r = gate.checkOutput('If the old terms no longer work for you, let us renegotiate.');
  assert.strictEqual(r.gate.action, 'pass', '存量误伤未清零: ' + r.gate.reason);
});

// ── 5. gate 登记断言（九处接线）────────────────────────────────
t('登记-维度键含hot_hand', () => {
  const keys = Object.keys(gate.discriminate('probe').dimensions);
  assert.ok(keys.includes('hot_hand'), '维度键未登记');
});
t('登记-维度总数154', () => { // 第 722 轮落笔时引擎 153 维，r723/r724 各 +1 → 154（GATE-2 总数断言预期过期，非回归）
  const keys = Object.keys(gate.discriminate('probe').dimensions);
  assert.strictEqual(keys.length, 154, '维度键数应为 154，实际 ' + keys.length);
});
t('登记-index导出checkHotHand', () => {
  const idx = require(path.join(ROOT, 'src', 'index.js'));
  assert.strictEqual(typeof idx.checkHotHand, 'function');
});
t('登记-VERIFY_DIMS含hot_hand', () => {
  // VERIFY_DIMS 是 index.js 内部 Set 不导出，用源码段断言登记
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  const m = src.match(/const VERIFY_DIMS = new Set\(\[([\s\S]*?)\]\);/);
  assert.ok(m, 'VERIFY_DIMS 定义段未找到');
  assert.ok(m[1].includes("'hot_hand'"), 'VERIFY_DIMS 未登记 hot_hand');
});
t('登记-DIM_GUIDANCE含hot_hand条目', () => {
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(src.includes("'hot_hand': \"不得把**连胜势头**"), 'DIM_GUIDANCE 未登记 hot_hand 条目');
});
t('登记-summary命中可见', () => {
  // 第九处接线：summary 串必须带「处热手谬误」
  const d = require(path.join(ROOT, 'src', 'index.js')).discriminate('我手感正旺，下一把肯定中');
  assert.ok(String(d.summary).includes('处热手谬误'), 'summary 未登记热手谬误: ' + d.summary);
});
t('登记-verify级在gate生效', () => {
  // hot_hand 命中必须让 verdict 落到非可信（良性句保持可信）
  const r1 = gate.checkOutput('我手感正旺，下一把肯定中');
  assert.notStrictEqual(r1.verdict, '可信');
  const r2 = gate.checkOutput('连胜可能提升信心，但每局概率独立，该复盘复盘');
  assert.strictEqual(r2.verdict, '可信');
});

console.log('passed: ' + pass + ', failed: ' + fails.length);
fails.forEach((f) => console.log('  FAIL ' + f));
process.exit(fails.length ? 1 : 0);
