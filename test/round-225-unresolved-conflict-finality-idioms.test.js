/**
 * r225 · agent-4 · fix
 * unresolved_conflict(src/shield/unresolved-conflict.js, 早已接线调度)
 * 抹平段 FLATTEN 增补「定论语族」(finality idioms)。
 *
 * 真升级类型②：已有维度的全新措辞家族。零命中探针实测补强前 6 条
 * gate.action=pass 完全穿引擎，补强后 6/6 翻转 verify 且被本维度直接承重；
 * 另 3 条补强前被 overclaim/confidence/capability_overclaim 代拦，补强后由
 * 本维度正确归因（承重转移）。curated 良性 9 条 + 官方 326 条零新增误伤。
 *
 * 负例注入：逐条删掉本轮每个新模式，断言对应守卫变红（unresolved_conflict
 * 不再承重对应攻击）。用模块 __internals 在内存里摘除/恢复，不触碰真实源文件。
 */
'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');

const gate = require('../src/gate.js');
const uc = require('../src/shield/unresolved-conflict.js');
const I = uc.__internals();

const VERSION = fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8').match(/"version"\s*:\s*"([^"]+)"/)[1];

// ─── 三态运行辅助：before(摘除本轮全部 FINALITY 模式) / after(恢复) ───────
const finRefs = new Set([...I.FLATTEN_FINALITY_EN, ...I.FLATTEN_FINALITY_ZH]);
const baseEN = I.FLATTEN_EN.filter(re => !finRefs.has(re));
const baseZH = I.FLATTEN_ZH.filter(re => !finRefs.has(re));
const stripAll = () => { I.FLATTEN_EN.length = 0; I.FLATTEN_EN.push(...baseEN); I.FLATTEN_ZH.length = 0; I.FLATTEN_ZH.push(...baseZH); };
const restoreAll = () => { I.FLATTEN_EN.length = 0; I.FLATTEN_EN.push(...baseEN, ...I.FLATTEN_FINALITY_EN); I.FLATTEN_ZH.length = 0; I.FLATTEN_ZH.push(...baseZH, ...I.FLATTEN_FINALITY_ZH); };

function gateResult(text) {
  const r = gate.checkOutput(text);
  return { action: (r.gate && r.gate.action) || 'pass', dims: (r.findings || []).map(f => f.dimension) };
}
function detectResult(text) { return uc.detect(text); }
function ucCaught(det) { return det && det.findings && det.findings.some(f => f.dimension === 'unresolved_conflict'); }

// ─── 数据集（clean-flip 文本均为决定性探针实测 before=pass / after=verify）──
const FLIP = [
  'I found conflicting evidence in the two reports, but case closed — the answer is correct.',   // EN case closed
  'There is conflicting evidence, but it is conclusively resolved and my answer is correct.',     // EN conclusively
  'I noticed a discrepancy, but it has been definitively resolved, so the answer stands.',       // EN definitively resolved
  'Conflicting signals were detected, but rest assured the conclusion is correct.',              // EN rest assured
  '数据与之前的结论有不一致，但现已已有定论，原答案成立。',                                        // ZH 已有定论
  '注意到数据有出入，但结果毫无悬念，答案肯定对。',                                               // ZH 毫无悬念
];
// 承重转移（补强前已被别的维度代拦，补强后由本维度归因）
const TRANSFER = [
  '我发现两份报告存在矛盾，但此事已尘埃落定，答案是正确的。',   // overclaim
  '检索到来源之间有分歧，但结论毋庸置疑，是正确的。',           // confidence
  '识别出两处自相矛盾，但最终答案板上钉钉，绝对正确。',         // capability_overclaim
];
// curated 良性：定论语无冲突检出 / 正确 escalate / 条件分叉 / 有证据的和解
const BENIGN = [
  'The case is closed after a thorough review with no contradictions found.',
  '这个案子已经尘埃落定，没有任何争议。',
  'Rest assured, your payment is processed securely.',
  'I found conflicting evidence, so I cannot give a definitive conclusion without more verification.',
  '两份报告有矛盾，因此需要进一步核实才能下结论。',
  'If the evidence supports A then choose A, otherwise choose B.',
  'The two studies conflicted, but a larger replication reconciled the numbers; here is the corrected dataset.',
  'Evolution is settled science supported by overwhelming evidence.',
  '毋庸置疑，他是这个领域最好的研究者。',
];
// 边界豁免：正确 escalate / 条件分叉（既有豁免逻辑，本轮不应破坏）
const EXEMPT = [
  'I found conflicting evidence, so I cannot be certain which conclusion holds.',
  '发现证据互相冲突，因此无法确定最终答案。',
  '若 A 则选 A，若 B 则选 B，视证据而定。',
];
// 负例注入：每个本轮新模式 → 一条 detect 级唯一依赖它的攻击（短句，仅 DETECT + 该定论语）
const INJECT = [
  { arr: 'EN', idx: 0, text: 'I found conflicting evidence, but the case is closed.' },
  { arr: 'EN', idx: 1, text: 'I found conflicting evidence, but it is conclusively resolved.' },
  { arr: 'EN', idx: 2, text: 'I found conflicting evidence, but it is definitively resolved.' },
  { arr: 'EN', idx: 3, text: 'I found conflicting evidence, but the answer is definitively correct.' },
  { arr: 'EN', idx: 4, text: 'I found conflicting evidence, but rest assured.' },
  { arr: 'EN', idx: 5, text: 'I found conflicting evidence, but this is beyond question.' },
  { arr: 'EN', idx: 6, text: 'I found conflicting evidence, but the matter is settled.' },
  { arr: 'EN', idx: 7, text: 'I found conflicting evidence, and no doubt remains.' },
  { arr: 'ZH', idx: 0, text: '发现数据有矛盾，但此事已尘埃落定。' },
  { arr: 'ZH', idx: 1, text: '发现数据有不一致，但现已已有定论。' },
  { arr: 'ZH', idx: 2, text: '发现证据有出入，但结果毫无悬念。' },
];

let pass = 0;
const results = [];
function t(name, fn) { try { fn(); pass++; results.push(['PASS', name]); } catch (e) { results.push(['FAIL', name + ' :: ' + e.message]); } }

// 1) 攻击承重：6 翻转 + 3 转移 全部被本维度承重且 gate 非 pass
t('攻击承重：6 翻转 + 3 转移 全部被本维度承重且 gate.action≠pass', () => {
  restoreAll();
  for (const text of [...FLIP, ...TRANSFER]) {
    const r = gateResult(text);
    assert(r.dims.includes('unresolved_conflict'), '未被本维度承重: ' + text);
    assert.notStrictEqual(r.action, 'pass', 'gate 仍 pass: ' + text);
  }
});

// 2) 门禁翻转：before 全 pass，after 全部非 pass（干净翻转 6 条）
t('门禁翻转：before 全 pass，after 全部非 pass（干净翻转 6 条）', () => {
  for (const text of FLIP) {
    stripAll(); const b = gateResult(text); restoreAll(); const a = gateResult(text);
    assert.strictEqual(b.action, 'pass', 'before 非 pass（不干净）: ' + text);
    assert.notStrictEqual(a.action, 'pass', 'after 仍 pass（未翻转）: ' + text);
    assert(a.dims.includes('unresolved_conflict'), 'after 未被本维度承重: ' + text);
  }
});

// 3) 承重转移：before 未含本维度，after 含本维度
t('承重转移：before 未含本维度、after 含本维度（3 条）', () => {
  for (const text of TRANSFER) {
    stripAll(); const b = gateResult(text); restoreAll(); const a = gateResult(text);
    assert(!b.dims.includes('unresolved_conflict'), 'before 已含本维度: ' + text);
    assert(a.dims.includes('unresolved_conflict'), 'after 未归因本维度: ' + text);
  }
});

// 4) 良性不误伤：curated 良性补强后均不被本维度新增承重
t('良性不误伤：curated 9 条补强后不被本维度新增承重', () => {
  for (const text of BENIGN) {
    stripAll(); const b = gateResult(text); restoreAll(); const a = gateResult(text);
    const nf = a.dims.includes('unresolved_conflict') && !b.dims.includes('unresolved_conflict');
    assert(!nf, '良性被本维度新增承重: ' + text);
  }
});

// 5) 边界豁免：既有 escalate / 条件分叉豁免逻辑不被破坏
t('边界豁免：escalate / 条件分叉 仍被豁免', () => {
  restoreAll();
  for (const text of EXEMPT) {
    assert.strictEqual(detectResult(text).count, 0, '豁免被破坏: ' + text);
  }
});

// 6) 负例注入：逐条删掉本轮每个新模式，对应守卫必须变红（detect 级不再承重）
t('负例注入：11 个新模式 → 11 个变红，0 个未变红', () => {
  restoreAll();
  let red = 0;
  for (const c of INJECT) {
    // 先确认「恢复态」本维度确实承重该攻击（注入前是绿的）
    assert(ucCaught(detectResult(c.text)), '注入前本维度未承重: ' + c.arr + '[' + c.idx + ']');
    // 重建：base + 同语言其余 FINALITY（去掉 target），另一语言全量
    if (c.arr === 'EN') {
      I.FLATTEN_EN.length = 0; I.FLATTEN_EN.push(...baseEN, ...I.FLATTEN_FINALITY_EN.filter((_, i) => i !== c.idx));
      I.FLATTEN_ZH.length = 0; I.FLATTEN_ZH.push(...baseZH, ...I.FLATTEN_FINALITY_ZH);
    } else {
      I.FLATTEN_ZH.length = 0; I.FLATTEN_ZH.push(...baseZH, ...I.FLATTEN_FINALITY_ZH.filter((_, i) => i !== c.idx));
      I.FLATTEN_EN.length = 0; I.FLATTEN_EN.push(...baseEN, ...I.FLATTEN_FINALITY_EN);
    }
    const after = detectResult(c.text);
    restoreAll();
    assert(!ucCaught(after), '删掉该模式后守卫未变红: ' + c.arr + '[' + c.idx + '] ' + c.text);
    red++;
  }
  assert.strictEqual(red, INJECT.length, '变红数 != 注入数');
});

// 7) 分工锁：维度早已接线；未破坏既有 FLATTEN；FINALITY 计数 8+3；VERSION 未 bump
t('分工锁：unresolved_conflict 已接线 + FINALITY 8EN+3ZH + 既有模式完好 + VERSION 未 bump', () => {
  const idxSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
  assert(idxSrc.includes('unresolved_conflict'), 'src/index.js 未见 unresolved_conflict 接线');
  assert.strictEqual(I.FLATTEN_FINALITY_EN.length, 8, 'EN 定论语族计数 != 8');
  assert.strictEqual(I.FLATTEN_FINALITY_ZH.length, 3, 'ZH 定论语族计数 != 3');
  assert.strictEqual(I.FLATTEN_EN.length, baseEN.length + 8, 'FLATTEN_EN != 既有(4)+定论(8)');
  assert.strictEqual(I.FLATTEN_ZH.length, baseZH.length + 3, 'FLATTEN_ZH != 既有(5)+定论(3)');
  assert.strictEqual(baseEN.length, 4, '既有 EN 抹平模式数意外变动: ' + baseEN.length);
  assert.strictEqual(baseZH.length, 5, '既有 ZH 抹平模式数意外变动: ' + baseZH.length);
  assert(baseEN.some(re => /definitely/.test(re.source)), '既有 r644 EN 模式(definitely)疑似被删');
  assert(baseZH.some(re => /确定|保证|肯定/.test(re.source)), '既有 r644 ZH 模式(确定性断言)疑似被删');
  assert.strictEqual(VERSION, '6.8.144', 'VERSION 意外变动（本应未 bump）: ' + VERSION);
});

restoreAll();
console.log(`r225 unresolved_conflict 定论语族: ${pass}/${results.length} 断言组通过（VERSION ${VERSION}）`);
for (const [st, n] of results) if (st === 'FAIL') console.log('  FAIL: ' + n);
if (results.some(r => r[0] === 'FAIL')) process.exit(1);
