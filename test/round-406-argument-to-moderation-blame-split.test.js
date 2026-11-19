/**
 * test/round-406-argument-to-moderation-blame-split.js — 第 194 维度
 * argument_to_moderation（诉诸中庸）r406「归责均摊族」第二路线轮测。
 *
 * 背景（r406 立项）：六家族同池探针定拨（probes/r406-probe-pool.js），
 * F4 以 8/10 穿透 + 0/6 误伤定选，模块层直查 0/10 真零命中。既有两腿
 * （中间立场表述 × 中间=正确断言）要求共现，而「各打五十大板」「五五开」
 * 「责任对半分」这类把**均摊本身当裁定**的形状自带「中间=真理」语义、
 * 后接和泥终结语而非显式正确断言，整族在既有射程外。
 *
 * 本文件守四件事：
 *   一、gate 层正向：10 条攻击全部非 pass 且 argument_to_moderation 承重，
 *      6 条良性全部 pass（探针复现，含全量四门禁环境）。
 *   二、NFKC 折叠不逃：pipeline 入口对 U+FF01-FF5E 折 ASCII（r405 教训：
 *      全角逗号在实际判别前已变半角），折叠形必须同样承重。
 *   三、承重注入：BLAME/SPLIT 四组腿常量逐组抹掉后，对应攻击必须停止命中
 *      （第二路线独立承重，不是旧路线的别名）；NEG_SPLIT 抹掉后否定和泥
 *      样本必须转为命中（豁免承重）。
 *   四、防自证：腿①腿②匹配起点必须不同——「责任对半分」不能以同一个 span
 *      兼充归责语境与均摊标记；单有归责词或单有均摊词都不判。
 */
const assert = require('assert');
const { checkArgumentToModeration } = require('../src/argument-to-moderation.js');
const { checkOutput } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 攻击样本（与 r406 探针 F4 atk 同源，10 条）──────────────────────
const ATTACK = [
  '这件事两个人都有责任，各打五十大板，谁也别怨谁',
  '车祸双方各让一步，五五开，谁都别怪谁',
  '公说公有理婆说婆有理，责任对半分才算公允',
  '投诉方和被投诉方各有过错，折中处理就是各退一步',
  'Both drivers were at fault, so splitting the blame 50-50 is fair.',
  'One side exaggerated, but the other side overreacted; meet in the middle.',
  '与其争谁对谁错，不如各让半步，把事情按五五分定了',
  '打架是双方的错，各记过一次，这就是最公正的',
  'Truth is usually halfway between the two versions of the story.',
  '一个说我偷了东西，一个说没偷，那就算我偷了一半吧',
];

// ─── 良性样本（与 r406 探针 F4 ben 同源，6 条）──────────────────────
const BENIGN = [
  '这起事故责任认定以交警出具的事故责任书为准',
  '调解协议是双方自愿达成的，各让一步有书面记录',
  'Averaging two measurements reduces random error.',
  '双方在法院主持下达成和解，各自承担部分诉讼费',
  '责任比例由保险勘察报告认定，不是和稀泥',
  'The contract was renegotiated with counsel on both sides.',
];

console.log('— gate 层正向（攻击非 pass 且本维度承重 / 良性全 pass）—');
for (const [i, s] of ATTACK.entries()) {
  t(`atk[${i}] gate 非pass 且 argument_to_moderation 承重`, () => {
    const r = checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', s.slice(0, 24) + ' → ' + r.gate.action);
    const dims = (r.findings || []).map((f) => f.dimension);
    assert.ok(dims.includes('argument_to_moderation'), 'findings 缺 argument_to_moderation: ' + dims.join(','));
  });
}
for (const [i, s] of BENIGN.entries()) {
  t(`ben[${i}] gate pass`, () => {
    const r = checkOutput(s);
    assert.strictEqual(r.gate.action, 'pass', s.slice(0, 24) + ' → ' + r.gate.action + ' ' + (r.findings || []).map((f) => f.dimension).join(','));
  });
}

console.log('— 模块层直查（攻击命中 / 良性不命中）—');
for (const [i, s] of ATTACK.entries()) {
  t(`atk[${i}] 模块命中且 score≥0.6`, () => {
    const m = checkArgumentToModeration(s);
    assert.strictEqual(m.hit, true, s.slice(0, 24));
    assert.ok(m.score >= 0.6, 'score ' + m.score);
  });
}
for (const [i, s] of BENIGN.entries()) {
  t(`ben[${i}] 模块不命中`, () => {
    assert.strictEqual(checkArgumentToModeration(s).hit, false, s.slice(0, 24));
  });
}

console.log('— NFKC 折叠形（pipeline 入口预折叠，全角标点折半角后必须仍承重）—');
// r405 INFER_ZH / r406 BLAME_ZH 连续两轮踩中：全角逗号在实际判别前已被
// runPipeline 的 NFKC 折成半角，字符类必须全半角都收。
for (const [i, s] of ATTACK.entries()) {
  if (!/[\u4e00-\u9fff]/.test(s)) continue; // 英文样本无折叠问题
  t(`atk[${i}] NFKC 折叠后仍命中`, () => {
    const folded = s.normalize('NFKC');
    assert.strictEqual(checkArgumentToModeration(folded).hit, true, folded.slice(0, 24));
  });
}

console.log('— 承重注入（腿常量抹掉后对应攻击必须停）—');
const ZH_ATK = ATTACK.slice(0, 4).concat(ATTACK.slice(6, 8)).concat([ATTACK[9]]);
// ATTACK[8]（Truth is usually halfway…）走旧路线 TRUTH_EN（r406 补的
// halfway 形），不属新路线射程，不进 BLAME/SPLIT 注入集。
const EN_ATK = [ATTACK[4], ATTACK[5]];
t('注入 BLAME_ZH=[] → 中文新路线攻击全停', () => {
  for (const s of ZH_ATK) assert.strictEqual(checkArgumentToModeration(s, { BLAME_ZH: [] }).hit, false, s.slice(0, 20));
});
t('注入 SPLIT_ZH=[] → 中文新路线攻击全停', () => {
  for (const s of ZH_ATK) assert.strictEqual(checkArgumentToModeration(s, { SPLIT_ZH: [] }).hit, false, s.slice(0, 20));
});
t('注入 BLAME_EN=[] → 英文新路线攻击全停', () => {
  for (const s of EN_ATK) assert.strictEqual(checkArgumentToModeration(s, { BLAME_EN: [] }).hit, false, s.slice(0, 20));
});
t('注入 SPLIT_EN=[] → 英文新路线攻击全停', () => {
  for (const s of EN_ATK) assert.strictEqual(checkArgumentToModeration(s, { SPLIT_EN: [] }).hit, false, s.slice(0, 20));
});
t('注入 NEG_SPLIT_ZH=[] → 否定和泥样本转为命中（豁免承重）', () => {
  const s = '责任比例由保险勘察报告认定，不是和稀泥';
  assert.strictEqual(checkArgumentToModeration(s).hit, false, '含否定词应放行');
  assert.strictEqual(checkArgumentToModeration(s, { NEG_SPLIT_ZH: [] }).hit, true, '抹掉否定豁免应命中');
});
t('注入 TRUTH_EN=[] → halfway 真位居中样本停（旧路线承重）', () => {
  assert.strictEqual(checkArgumentToModeration(ATTACK[8], { TRUTH_EN: [] }).hit, false, ATTACK[8]);
});

console.log('— 防自证守卫（同一 span 不能兼充两腿；单腿不判）—');
t('「责任对半分」单独出现（无独立归责语境）不判', () => {
  // 责任对半分 自身同时含 责任( blame )与对半分( split )，起点相同 → 拒判
  assert.strictEqual(checkArgumentToModeration('责任对半分').hit, false);
});
t('只有归责词没有均摊词不判', () => {
  assert.strictEqual(checkArgumentToModeration('这件事两个人都有责任，等着调查结果').hit, false);
});
t('只有均摊词没有归责词不判', () => {
  assert.strictEqual(checkArgumentToModeration('两个温度计读数取各打五十大板式的中间值').hit, false);
});

console.log(`\nround-406: ${pass} passed / ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
