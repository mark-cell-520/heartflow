'use strict';
/**
 * test/prosecutors-fallacy.test.js
 * [r233] 第 222 维度 prosecutors_fallacy（检察官谬误）负例注入测试。
 * 判据：两腿（小概率匹配腿 × 个体有罪/嫌疑结论腿）+ 邻近窗 + 四重豁免
 * （正确判别证伪 / 元话语教学 / 逐腿对冲 / 真疑问句）。
 *
 * 覆盖：同族攻击变体矩阵（中英双语、裸名词、带修饰、倒装、长句）+
 * 良性样本（含边缘良性：正确多因陈述、正当统计讨论、纯概率陈述）+
 * 腿族删除后不得命中（承重验证）。
 */
const assert = require('assert');
const { detectProsecutorsFallacy, __internals } = require('../src/prosecutors-fallacy.js');
const { gate } = require('../src/gate.js');

const detect = (t) => detectProsecutorsFallacy(t);

// ─── 同族攻击变体矩阵（≥5，中英双语/裸名词/带修饰/倒装/长句）────────
const ATTACKS = [
  // 倒装 + 修饰（数值前置）
  'DNA匹配的概率只有百万分之一，所以他就是凶手的可能性高达99.9999%。',
  // 裸名词（无「只有」等修饰的强度副词，直接数值陈述）
  '这种错误只有十亿分之一的概率，因此嫌疑人几乎肯定有罪。',
  // 总体限定 + 排他反问（不是他还能是谁）
  '全国十四亿人里只有一个人能匹配上，这个人不是他还能是谁。',
  // 统计检验形（p值/假设拒绝）
  'p值小于0.01，因此被告的清白假设可以被拒绝，他是有罪的。',
  // 长句（复合推理链 + 系统主体）
  '系统给出了一百万分之一的误报率，所以这个匹配几乎不可能是巧合，他有罪。',
  // 长句（多子句 + 总体假阳性）
  '一百万人里才有一个能匹配，全市一千万人里也能找出十个来，但他是第一个被测的。',
  // 血型 + 作案腿
  '这个血型只占人口的百分之零点三，所以他作案的可能性是99.7%。',
  // 英文：in a million
  'The DNA match has a one-in-a-million probability, so he is almost certainly guilty.',
  // 英文：one in ten billion
  'The chance of this match is one in ten billion, therefore the defendant is guilty.',
  // 英文：裸形 once per billion
  'A match this rare occurs once per billion people, so the suspect must be the culprit.',
  // 英文：Only one person in a hundred million
  'Only one person in a hundred million shares this profile, so he has to be the killer.',
  // 中文：千万分之一
  '匹配概率是千万分之一，所以他是凶手这一事实基本上已经确定。',
  // 中文：十亿分之一巧合 + 足以证明
  '十亿分之一的巧合恰好落在他头上，足以证明这案子就是他干的。',
];

// ─── 良性样本（≥5，含边缘良性）──────────────────────────────────
const BENIGN = [
  // 边缘良性①：正确判别/证伪（破除该推理正是判别动作本身）
  'DNA匹配的概率只有百万分之一，这是检方应当进一步举证的理由，而非定罪的充分条件。',
  // 边缘良性②：仍需结合其他证据
  '这种错误只有十亿分之一的概率，但仍需结合其他证据才能定罪。',
  // 边缘良性③：正确多因陈述（本族相邻维度 monocause 的良性形态）
  '犯罪是多种因素共同造成的，不能只归因于单一动机。',
  // 边缘良性④：不能作为认定依据
  '这种血型占人口百分之三十，不能作为认定作案人的依据。',
  // 英文良性①：does not establish guilt
  'The match probability is one in a million, which alone does not establish guilt.',
  // 英文良性②：多因陈述
  'Wars are caused by many factors acting together.',
  // 元话语：课堂案例转述
  '检察官谬误是法庭科学课堂上的经典案例。',
  'Prosecutor\'s fallacy is a classic logical fallacy in evidence courses.',
  // 纯概率陈述（缺腿②，中性统计描述）
  '这种错误的概率只有十亿分之一。',
  '这个概率说明系统很可靠，但仍需人工复核所有异常。',
  // 无小概率腿的纯定罪陈述（缺腿①）
  '证据确凿，他就是凶手。',
];

// ─── 1. 攻击变体矩阵：全部命中 ───────────────────────────────────
for (const t of ATTACKS) {
  const r = detect(t);
  assert.strictEqual(r.hit, true, '应命中攻击句: ' + t);
  assert.strictEqual(r.dimension, 'prosecutors_fallacy');
  assert.ok(r.count >= 1, 'count 应为正: ' + t);
  assert.ok(r.evidence.length >= 1, 'evidence 非空: ' + t);
  assert.ok(r.severity >= 55 && r.severity <= 90, 'severity 区间: ' + t);
  assert.ok(typeof r.details === 'string' && r.details.includes('检察官谬误'), 'details: ' + t);
  assert.ok(typeof r.guidance === 'string' && r.guidance.includes('先验概率'), 'guidance: ' + t);
}
console.log('✓ 攻击变体矩阵 ' + ATTACKS.length + '/' + ATTACKS.length + ' 全部命中');

// ─── 2. 良性样本：全部不命中 ──────────────────────────────────────
for (const t of BENIGN) {
  const r = detect(t);
  assert.strictEqual(r.hit, false, '不应命中良性句: ' + t);
}
console.log('✓ 良性样本 ' + BENIGN.length + '/' + BENIGN.length + ' 全部通过（含边缘良性）');

// ─── 3. gate 层接线：攻击句 gate.action 非 pass，且 findings 含本维 ──
const gateAttacks = [
  'DNA匹配的概率只有百万分之一，所以他就是凶手的可能性高达99.9999%。',
  '这种错误只有十亿分之一的概率，因此嫌疑人几乎肯定有罪。',
  '全国十四亿人里只有一个人能匹配上，这个人不是他还能是谁。',
  'p值小于0.01，因此被告的清白假设可以被拒绝，他是有罪的。',
  'The DNA match has a one-in-a-million probability, so he is almost certainly guilty.',
];
for (const t of gateAttacks) {
  const r = gate(t);
  assert.notStrictEqual(r.gate.action, 'pass', 'gate.action 非 pass: ' + t);
  const f = (r.findings || []).find(x => x.dimension === 'prosecutors_fallacy');
  assert.ok(f, 'findings 应含 prosecutors_fallacy: ' + t);
  assert.ok(f.severity >= 55, 'gate finding severity: ' + t);
}
console.log('✓ gate 层接线 ' + gateAttacks.length + '/' + gateAttacks.length + ' 攻击句非 pass 且 findings 含本维');

// ─── 4. 良性样本 gate 层不被本维命中 ─────────────────────────────
const gateBenign = [
  'DNA匹配的概率只有百万分之一，这是检方应当进一步举证的理由，而非定罪的充分条件。',
  '这种血型占人口百分之三十，不能作为认定作案人的依据。',
  'The match probability is one in a million, which alone does not establish guilt.',
  'Wars are caused by many factors acting together.',
];
for (const t of gateBenign) {
  const r = gate(t);
  const f = (r.findings || []).find(x => x.dimension === 'prosecutors_fallacy');
  assert.ok(!f, '良性句不应触发本维: ' + t);
}
console.log('✓ gate 层良性 ' + gateBenign.length + '/' + gateBenign.length + ' 无本维误伤');

// ─── 5. 负例注入：逐腿族删除后不得命中（承重验证）────────────────
const I = __internals();
const SAMPLE_ATTACK = 'DNA匹配的概率只有百万分之一，所以他就是凶手的可能性高达99.9999%。';

// 删腿①（RARE_MATCH 空）→ 不命中
const noRare = detectProsecutorsFallacy(SAMPLE_ATTACK, { RARE_MATCH_ZH: [], RARE_MATCH_EN: [] });
assert.strictEqual(noRare.hit, false, '删腿①后不得命中');
// 删腿②（GUILT_INFERENCE 空）→ 不命中
const noGuilt = detectProsecutorsFallacy(SAMPLE_ATTACK, { GUILT_INFERENCE_ZH: [], GUILT_INFERENCE_EN: [] });
assert.strictEqual(noGuilt.hit, false, '删腿②后不得命中');
// 删豁免表（豁免全部放开）→ 良性样本被命中，证明豁免是承重的。
// 注：承重探针必须**两腿齐备**（概率陈述 + 定罪断言形），否则缺腿②
// 本来就不命中，删豁免也无从证承重（r233 实测教训：最初用的
// 「进一步举证的理由」缺腿②，删豁免后仍 pass，无法证承重）。
const benignProbe = 'DNA匹配的概率只有百万分之一，但检方不能据此认定他有罪。';
const noExempt = detectProsecutorsFallacy(benignProbe, {
  EXEMPT_CORRECT_ZH: [], EXEMPT_CORRECT_EN: [],
  EXEMPT_META_ZH: [], EXEMPT_META_EN: [],
});
assert.strictEqual(noExempt.hit, true, '删豁免表后良性样本应被命中（证明豁免承重）');
console.log('✓ 负例注入：腿①/腿②删除均不命中；豁免表删除后良性样本转为命中（承重验证通过）');

// ─── 6. 豁免族逐项验证（每类豁免必须有真实承重样本）──────────────
// 6a 正确判别/证伪族
for (const t of [
  '匹配概率是百万分之一，但这不能作为认定他有罪的依据。',
  '这种错误只有十亿分之一的概率，但仍需结合其他证据才能定罪。',
  '孤证不足以定罪，匹配率再低也要看先验概率。',
  'The match probability is one in a million, which alone does not establish guilt.',
]) {
  assert.strictEqual(detect(t).hit, false, '证伪族应豁免: ' + t);
}
// 6b 元话语/教学族
for (const t of [
  '检察官谬误是法庭科学课堂上的经典案例。',
  '这是逻辑谬误清单里的一条，叫做检察官谬误。',
  'Prosecutor\'s fallacy is a classic logical fallacy in evidence courses.',
]) {
  assert.strictEqual(detect(t).hit, false, '元话语族应豁免: ' + t);
}
// 6c 对冲族（有罪结论腿自身含对冲）
assert.strictEqual(detect('匹配概率是百万分之一，他可能有罪，但还需核实。').hit, false, '结论腿对冲应豁免');
// 6d 否定翻转族
assert.strictEqual(detect('匹配概率是百万分之一，这并不意味着他有罪。').hit, false, '否定翻转应豁免');
// 6e 真疑问句（无反问标记，纯征询）
assert.strictEqual(detect('匹配概率是百万分之一，这能否证明他有罪？').hit, false, '真疑问句应豁免');
// 6f 反问不豁免（含反问标记「难道」，即使带问号）
assert.strictEqual(detect('匹配概率是百万分之一，难道这就能证明他有罪吗？').hit, true, '反问不豁免');
console.log('✓ 豁免族逐项验证：证伪/元话语/对冲/否定翻转/真疑问句均豁免，反问不豁免');

// ─── 7. 与既有维度的边界：相邻维度良性形态不被本维代拦 ────────────
// base_rate_neglect 邻域的正当多因陈述（r161/r220 教训：正确多因陈述是良性）
for (const t of [
  '犯罪是多种因素共同造成的，不能只归因于单一动机。',
  'Wars are caused by many factors acting together.',
]) {
  assert.strictEqual(detect(t).hit, false, '多因良性不应被本维代拦: ' + t);
}
console.log('✓ 相邻维度良性形态不被代拦');

console.log('\n全部断言通过（prosecutors_fallacy 第 222 维度，r233）');
