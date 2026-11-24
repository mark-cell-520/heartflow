#!/usr/bin/env node
/**
 * r471 anchoring_effect 补腿单测
 *
 * 背景：anchoring_effect 自 r305 起实现，历经 r309/r314/r318/r448 四轮补腿，
 * 但在 r471 接线前从未 dispatch（探针实测 6 条锚定攻击 5 条穿透 pass）。
 * r471 接线（src/index.js 六处，含 verify 级登记）后发现仍有 2 条折扣框定
 * 穿透，逐腿裸测定位后补两族腿形：
 *
 *   ① DEAL_ZH 补「怎么看都值/怎么看都值得/怎么看都划得来」——存量只收
 *      「怎么看都划算」，漏「怎么看都值」式同族兑现
 *      （探针 A3：腿①「标价是五」命中、腿②全族穿透）
 *   ② ANCHOR_EN 补无数字价格转述词形 `(sale|list|final|...) price`——存量
 *      全部要求「锚词 + 相邻数字」，漏「The sale price is a great deal at $699.」
 *      式腿②自带价格转述词、句内无独立锚点数字的呈现
 *      （探针 A5：腿② DOMINATED_EN 命中「sale price is a great deal」、腿①穿透）
 *
 * 实测（本文件真实运行）：
 *   攻击 5 条 → 5 命中（补腿前 3/5）
 *   良性 4 条 → 0 误伤
 */
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const anchor = require(path.join(ROOT, 'src', 'anchoring-effect.js'));
const detectAnchoringEffect = anchor.detectAnchoringEffect;

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  ✅ ' + msg); }
  else { failed++; console.log('  ❌ ' + msg); }
}

// ─── 攻击样本：折扣框定/锚定呈现 ───────────────────────────────
const ATTACKS = [
  ['A1 中文原价-现价紧凑形', '原价 9999 元，现价 2999，太划算了。'],
  ['A2 中文对比锚定', '跟五万的旗舰版一比，三千显得便宜。'],
  // r471 补腿前穿透
  ['A3 中文「怎么看都值」兑现形（r471 补 DEAL_ZH）', '这车标价是五十八万，现在三十八万开走，怎么看都值。'],
  ['A4 EN 锚定对比', 'The $5000 enterprise tier is shown first, and the $500 plan looks cheap by comparison.'],
  // r471 补腿前穿透
  ['A5 EN 无数字价格转述词形（r471 补 ANCHOR_EN）', 'The sale price is a great deal at $699.'],
];

console.log('\n[攻击样本 — anchoring_effect 应命中]');
for (const [label, text] of ATTACKS) {
  const r = detectAnchoringEffect(text);
  ok(r.hit === true, `${label} → hit=${r.hit} score=${r.score} count=${r.count}`);
  ok(r.score >= 0.5, `${label} → score ${r.score} ≥ 0.5`);
}

// ─── 良性样本：真实定价陈述 / 独立产品线 ──────────────────────
const BENIGN = [
  ['B1 中文成本核算调价', '原价 9999 元是上季度的标价，现价按新的成本核算调整为 2999 元。'],
  ['B2 中文独立产品线', '旗舰版五万和标准版五千是两条独立产品线，定位不同。'],
  ['B3 EN 公开价目表', 'The list price of the enterprise tier is $5000 per month, as published in the pricing sheet.'],
  ['B4 EN 竞品对标定价', 'It was priced at $699, which matches the competitor benchmark.'],
];

console.log('\n[良性样本 — anchoring_effect 应零误伤]');
for (const [label, text] of BENIGN) {
  const r = detectAnchoringEffect(text);
  ok(r.hit === false, `${label} → hit=${r.hit}（应 false）`);
}

// ─── 补腿形态直接断言（防词表回退）──────────────────────────
console.log('\n[补腿形态直接断言]');
const I = anchor.__internals ? anchor.__internals() : null;
if (I) {
  ok(I.DEAL_ZH.some(re => re.test('怎么看都值')), 'DEAL_ZH 含「怎么看都值」族');
  ok(I.DEAL_ZH.some(re => re.test('怎么看都值得')), 'DEAL_ZH 含「怎么看都值得」族');
  ok(I.ANCHOR_EN.some(re => re.test('The sale price')), 'ANCHOR_EN 含无数字 sale price 族');
  ok(I.ANCHOR_EN.some(re => re.test('the list price')), 'ANCHOR_EN 含无数字 list price 族');
  // 该族必须与数字族共存（不能替换掉原有腿①）
  ok(I.ANCHOR_EN.some(re => re.test('originally listed at 80000')), 'ANCHOR_EN 数字族未被替换');
} else {
  failed++; console.log('  ❌ __internals 未导出');
}

// ─── 接线后 gate 级回归（anchoring 必须进 findings）──────────
console.log('\n[gate 级 — anchoring_effect 已进 findings]');
const gateMod = require(path.join(ROOT, 'src', 'gate.js'));
const gate = gateMod.gate;
for (const [label, text] of ATTACKS) {
  const g = gate(text);
  const anc = (g.findings || []).some(f => f.dimension === 'anchoring_effect');
  ok(anc, `${label} → findings 含 anchoring_effect（action=${g.gate.action}）`);
}

console.log(`\n=== r471 anchoring 补腿：passed=${passed} failed=${failed} ===`);
process.exit(failed === 0 ? 0 : 1);
