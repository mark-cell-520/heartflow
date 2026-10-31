/**
 * test/round-177-hindsight-bias.js — r177 第 175 维度 hindsight_bias
 * （事后聪明偏差 / hindsight bias / 后见之明 / knew-it-all-along）轮测。
 *
 * 判据三形任一（命中即判）：
 *   腿① HS 事后框架：成语形（事后诸葛亮/马后炮）单腿；弱形（事后/如今/
 *     现在回想/回过头/回望；EN in hindsight / looking back / in retrospect）
 *     必须与腿②共现；
 *   腿② PRED 注定/事前可预见断言：强形（早就注定/从一开始就注定/命定/
 *     不出所料/明眼人/一眼就能看穿；EN was always going to / doomed /
 *     inevitable / should have known / knew it all along / saw it coming /
 *     signs were there / only a matter of time）单腿可命中；POST 子集
 *     （早就知道/伏笔/本可预见/意料之中/命中注定…）与腿③共现；弱形
 *     （注定/迟早/早晚/必然；EN bound to / obvious / predictable）只与
 *     腿①共现；
 *   腿③ OUT 已发生结果事件（失败/倒闭/崩溃/爆雷/翻车/危机/背叛/夺冠/
 *     落榜/没有未来…；EN failed / collapse / bankrupt / betrayed…）。
 * 豁免：概念教学 / 正确的事后学习（承认信息边界）/ 事前正当评价 /
 *   推理否定劝诫 / 对冲 / 疑问句。
 */
'use strict';
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { checkHindsightBias, __internals } = require(path.join(ROOT, 'src/hindsight-bias.js'));

let pass = 0, fail = 0;
function ok(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch (e) { fail++; console.log('  ✗ ' + name + ' — ' + e.message); }
}

// ─── 正向：攻击样本（中英双语 / 裸名词 / 带修饰 / 倒装 / 长句）──────────
const ATTACK_ZH = [
  '这件事早就注定会失败，明眼人一开始都能看出来',
  '我早就知道他会背叛我们，一切都在意料之中',
  '结果不出所料，这件事从一开始就是注定的',
  '事后看来这一切都很明显，当时我们太迟钝了',
  '这场危机早就埋下了伏笔，聪明人一眼就能看穿',
  '他早就看出这家公司没有未来',
  '如今看来，这个项目的失败是必然的',
  '事后诸葛亮地说，当初谁都能看出这个骗局',
  '这家公司的倒闭早在意料之中，谁让你当初不听劝',
  '事后回望，那场股灾的爆发是不可避免的，信号早就写在墙上',
  '他命中注定要栽这个跟头，当初谁都看得出来',
  '我早就预见到这场危机会爆发，可惜没人信我',
];
const ATTACK_EN = [
  'This was always going to fail; anyone could have seen it coming.',
  'I knew it all along — the outcome was inevitable from the start.',
  'Hindsight makes it obvious, but we should have known better.',
  'we all knew this project would collapse eventually',
  'It was only a matter of time before the company went bankrupt.',
  'Looking back, the signs were there all along.',
  'The collapse was a foregone conclusion — anyone could have predicted it.',
];

// ─── 正向：良性样本（含边缘良性：正确多因陈述 / 真预见 / 赛前打气）─────
const BENIGN_ZH = [
  '事后看来我们当时的决策确实存在问题，这是新的信息带来的认识',
  '通过复盘我们才发现，之前忽略了几个关键风险因素',
  '回顾历史，这场战争的发生是多重因素长期共同作用的结果',
  '这场比赛我们注定会赢',
  '我早就知道会下雨，所以出门带了伞',
  '不要做事后诸葛亮，要总结事前可以改进的流程',
  '事前诸葛亮难做，当时谁也想不到会出这种事',
  '以当时的条件，这个决定是合理的',
  '公司明年可能会倒闭，需要提前准备风险预案',
  '事后聪明偏差是决策研究里最经典的认知偏差之一',
  '事后诸葛亮不可取，关键是建立更完善的事前评估机制',
  '他早就提醒过风险，可惜管理层没有采纳',
];
const BENIGN_EN = [
  'It is easy to say in hindsight, but the information was not available at the time.',
  'Hindsight bias is a well-documented cognitive bias in decision research.',
  'Based on what we knew then, the failure was entirely predictable.',
  'With hindsight the collapse was obvious, though nobody could have known.',
  'Looking ahead, the merger was bound to face regulatory scrutiny.',
  'We identified the risks in advance and hedged accordingly.',
];

ok('攻击样本全部命中（中文 12）', () => {
  for (const s of ATTACK_ZH) assert(checkHindsightBias(s).hit, '漏判: ' + s);
});
ok('攻击样本全部命中（英文 7）', () => {
  for (const s of ATTACK_EN) assert(checkHindsightBias(s).hit, '漏判: ' + s);
});
ok('良性样本全部放行（中文 12）', () => {
  for (const s of BENIGN_ZH) assert(!checkHindsightBias(s).hit, '误判: ' + s);
});
ok('良性样本全部放行（英文 6）', () => {
  for (const s of BENIGN_EN) assert(!checkHindsightBias(s).hit, '误判: ' + s);
});

// ─── 常量负例注入承重（置空后对应攻击必须不再命中）─────────────────────
const I = __internals();
ok('常量负例注入承重：PRED_STRONG_ZH', () => {
  assert(!checkHindsightBias('这件事早就注定会失败，谁也无法挽回', { PRED_STRONG_ZH: [] }).hit);
});
ok('常量负例注入承重：HS_ZH（hs×pred 腿）', () => {
  assert(!checkHindsightBias('事后看来这一切都很明显，当时我们太迟钝了', { HS_ZH: [] }).hit);
});
ok('常量负例注入承重：OUT_ZH（out×post 腿）', () => {
  assert(!checkHindsightBias('他早就看出这家公司没有未来', { OUT_ZH: [] }).hit);
});
ok('常量负例注入承重：PRED_POST_ZH（out×post 腿）', () => {
  assert(!checkHindsightBias('他早就看出这家公司没有未来', { PRED_POST_ZH: [] }).hit);
});
ok('常量负例注入承重：PRED_STRONG_EN', () => {
  assert(!checkHindsightBias('This was always going to fail; anyone could have seen it coming.', { PRED_STRONG_EN: [] }).hit);
});
ok('常量负例注入承重：HS_EN（hs×pred 腿）', () => {
  assert(!checkHindsightBias('Looking back, this was bound to happen.', { HS_EN: [] }).hit);
});
ok('常量负例注入承重：OUT_EN（out×post 腿）', () => {
  assert(!checkHindsightBias('The crisis was entirely predictable.', { OUT_EN: [] }).hit);
});
ok('常量负例注入承重：PRED_WEAK_ZH（hs×pred 腿）', () => {
  assert(!checkHindsightBias('如今看来，这个项目的失败是必然的', { PRED_WEAK_ZH: [], PRED_POST_ZH: [], PRED_STRONG_ZH: [] }).hit);
});

// ─── 豁免陷阱翻转（置空豁免后良性必须翻成命中——豁免真实承重）──────────
ok('豁免翻转：EXEMPT_NEWINFO_ZH', () => {
  assert(checkHindsightBias('事后看来一切都很明显，但这要归功于后来才知道的新信息', { EXEMPT_NEWINFO_ZH: [] }).hit);
});
ok('豁免翻转：EXEMPT_NEWINFO_EN', () => {
  assert(checkHindsightBias('With hindsight the collapse was obvious, though nobody could have known.', { EXEMPT_NEWINFO_EN: [] }).hit);
});
ok('豁免翻转：EXEMPT_META_ZH', () => {
  assert(checkHindsightBias('事后聪明偏差的经典表现，是人们总认为失败早在意料之中', { EXEMPT_META_ZH: [] }).hit);
});
ok('豁免翻转：EXEMPT_META_EN', () => {
  assert(checkHindsightBias('Hindsight bias makes people believe the collapse was obvious in hindsight.', { EXEMPT_META_EN: [] }).hit);
});
ok('豁免翻转：EXEMPT_EXANTE_ZH', () => {
  assert(checkHindsightBias('在当时的信息条件下，这场危机本可预见', { EXEMPT_EXANTE_ZH: [] }).hit);
});
ok('豁免翻转：EXEMPT_EXANTE_EN', () => {
  assert(checkHindsightBias('Based on what we knew then, the failure was entirely predictable.', { EXEMPT_EXANTE_EN: [] }).hit);
});
ok('豁免翻转：EXEMPT_NEG_ZH', () => {
  assert(checkHindsightBias('别把失败归因于当初能预见，事后诸葛亮要不得，明眼人一眼就能看穿', { EXEMPT_NEG_ZH: [] }).hit);
});
ok('豁免翻转：EXEMPT_HEDGE_ZH', () => {
  assert(checkHindsightBias('这场危机可能从一开始就埋下了伏笔', { EXEMPT_HEDGE_ZH: [] }).hit);
});
ok('豁免翻转：疑问句（摘问号后命中）', () => {
  const q = '这件事早就注定会失败，明眼人一开始都能看出来吗？';
  assert(!checkHindsightBias(q).hit);
  assert(checkHindsightBias(q.replace(/[?？]/g, '')).hit);
});

// ─── 腿缺位自查：良性不靠豁免兜底（注入全部豁免置空仍不命中）──────────
ok('腿缺位：良性不依赖豁免（注定+无 OUT 是赛前打气）', () => {
  const inj = {}; Object.keys(I).forEach(k => { if (k.startsWith('EXEMPT')) inj[k] = []; });
  for (const s of ['这场比赛我们注定会赢', '我早就知道会下雨，所以出门带了伞', '公司明年可能会倒闭，需要提前准备风险预案']) {
    assert(!checkHindsightBias(s, inj).hit, '靠豁免兜底: ' + s);
  }
});

// ─── 登记断言 ──────────────────────────────────────────────────────────
ok('登记断言：index.js 九处接线在位', () => {
  const idx = require('fs').readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
  for (const frag of [
    "const { checkHindsightBias } = require('./hindsight-bias.js');",
    'checkHindsightBias(_normText), "hindsight_bias"',
    "{score: hb.score, name:'hindsight_bias'},",
    'hindsight_bias: hb,',
    "'hindsight_bias',",
    "checkHindsightBias,",
  ]) assert(idx.includes(frag), '接线缺失: ' + frag);
});
ok('登记断言：hindsight_bias 在 VERIFY_DIMS', () => {
  const idx = require('fs').readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
  const m = idx.match(/VERIFY_DIMS\s*=\s*new Set\(\[([\s\S]*?)\]\)/);
  assert(m && m[1].includes("'hindsight_bias'"), 'VERIFY_DIMS 缺 hindsight_bias');
});
ok('登记断言：dimMap 含 hindsight_bias 键', () => {
  const src = require('fs').readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
  assert(src.includes("name:'hindsight_bias'"), 'dimMap/allDims 未登记 hindsight_bias');
  assert(src.includes('hindsight_bias: hb,'), 'dimMap 缺 hindsight_bias 键');
});
ok('登记断言：DIM_GUIDANCE 含 hindsight_bias 引导', () => {
  const idx = require('fs').readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
  assert(/'hindsight_bias':\s*"不得/.test(idx), 'DIM_GUIDANCE 缺 hindsight_bias');
});

// ─── gate 层变体矩阵（真实 gate()，161 轮强制项）──────────────────────
ok('gate 层变体矩阵：攻击全非 pass 且含 hindsight_bias', () => {
  const { gate } = require(path.join(ROOT, 'src/gate.js'));
  const ATTACK = [
    '这件事早就注定会失败，明眼人一开始都能看出来',
    '我早就知道他会背叛我们，一切都在意料之中',
    '结果不出所料，这件事从一开始就是注定的',
    '事后看来这一切都很明显，当时我们太迟钝了',
    '这场危机早就埋下了伏笔，聪明人一眼就能看穿',
    'This was always going to fail; anyone could have seen it coming.',
    'I knew it all along — the outcome was inevitable from the start.',
  ];
  for (const s of ATTACK) {
    const r = gate(s);
    assert(r.gate.action !== 'pass', 'gate 放行: ' + s + ' -> ' + r.gate.action);
    const dims = (r.findings || []).map(f => f.dimension);
    assert(dims.includes('hindsight_bias'), 'findings 缺 hindsight_bias: ' + s + ' -> ' + dims.join(','));
  }
});
ok('gate 层变体矩阵：良性全 pass 且零 hindsight_bias', () => {
  const { gate } = require(path.join(ROOT, 'src/gate.js'));
  const BENIGN = [
    '事后看来我们当时的决策确实存在问题，这是新的信息带来的认识',
    '通过复盘我们才发现，之前忽略了几个关键风险因素',
    '回顾历史，这场战争的发生是多重因素长期共同作用的结果',
    '这场比赛我们注定会赢',
    '不要做事后诸葛亮，要总结事前可以改进的流程',
    'It is easy to say in hindsight, but the information was not available at the time.',
    'Hindsight bias is a well-documented cognitive bias in decision research.',
  ];
  for (const s of BENIGN) {
    const r = gate(s);
    assert.strictEqual(r.gate.action, 'pass', '误拦: ' + s + ' -> ' + r.gate.action + ' ' + (r.findings || []).map(f => f.dimension).join(','));
    const dims = (r.findings || []).map(f => f.dimension);
    assert(!dims.includes('hindsight_bias'), '良性误命中 hindsight_bias: ' + s);
  }
});

console.log(`\n[r177] 结果: ${pass} 通过 / ${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
