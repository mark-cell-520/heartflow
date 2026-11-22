'use strict';
/**
 * r448 — anchoring_effect 折扣兑现族 + 紧凑数字形补腿（真升级②）
 *
 * 背景（scripts/round-448/probe-pool.js 实测）：
 *   F1 攻击 1/8（穿透 7/8）、良性 0/8。缺口不在接线（r304 起
 *   anchoring_effect 已由 src/econ-reasoning-gate.js FAMILIES 聚合进
 *   gate.action），而在模块词族：
 *     ① 腿② DEAL_ZH 只收「觉得划算/占了便宜」，漏「太值了」
 *        「等于便宜了七成」「就像白送一样」「占了大便宜」
 *        「觉得赢了」「觉得不贵」式折扣兑现表达；
 *     ② 腿① ANCHOR_EN 只收 list/sticker/asking/first price 转述形，
 *        漏「the anchor price / an anchor number」裸名词与
 *        「anchored at 18000」被动形；
 *     ③ 腿② DOMINATED_EN 的 DEAL 组只收 felt/getting 系动词形，
 *        漏「makes it a steal」「looked cheap」「looked like a
 *        bargain」「is a steal at 1200」式使动/系动词折扣兑现；
 *     ④ 腿① ANCHOR_ZH 要求锚词后紧跟数字，漏「原价从两千抬到一万」
 *        （动词插入）、「锚定在一万八的售价上」（句首裸词）、
 *        「先看三万的车」（比较起点）三形。
 *
 * 判定纪律：攻击必须命中、良性零误伤、存量注入语义保留
 * （删新腿 → 新样本 miss，证新腿承重）、四组豁免不回归。
 */
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const mod = require(path.join(ROOT, 'src', 'anchoring-effect.js'));

let pass = 0, fail = 0;
function ok(cond, name, extra) {
  if (cond) { pass++; console.log('  ok -', name); }
  else { fail++; console.log('  FAIL -', name, extra != null ? '| ' + JSON.stringify(extra).slice(0, 200) : ''); }
}
function hits(sample) {
  const r = mod.detectAnchoringEffect(sample);
  return !!(r && r.hit);
}

// ── 一、腿② ZH 折扣兑现族（r448 新腿）────────────────────────
const DEAL_ZH_NEW = [
  '这件原价三千现在只卖九百，等于便宜了七成。',
  '标价一万二的外套打三折，实际只花了三千六，太值了。',
  '商场把原价从两千抬到一万再打一折，顾客还是觉得占了大便宜。',
  '锚定在一万八的售价上，一万八的包卖一万五就像白送一样。',
  '先看三万的车，再看两万八的就觉得不贵。',
  '谈判里对方先开价五十万，最后谈到八十万我们也觉得赢了。',
  '沙发原价一万六，现在九千二，折扣力度真大。',
  '这台车标价四十万，销售直接砍到三十三万，等于白送一台轮胎。',
];

// ── 二、腿①/腿② EN 折扣兑现族（r448 新腿）───────────────────
const DEAL_EN_NEW = [
  'The list price is $2,000, so the $1,200 discount makes it a steal.',
  'They raised the anchor price to $500 so the $250 sale price looked cheap.',
  'The sticker was ten thousand, and seven looked like a bargain.',
  'The first price I heard was two hundred, so everything anchored at that number felt cheap.',
];

// ── 三、良性：同等锚词在场但表述为独立估价/预算控制/比价 ───────
const BENIGN = [
  '原价和现价都标清楚了，买不买取决于预算。',
  '打折前请核对吊牌价，避免先涨后降。',
  'List price and sale price are both shown; compare across stores.',
  '先设定自己的心理价位再看标价，可以避免被高价锚定。',
  '这件外套三千六，面料和做工经过第三方评估，值这个钱。',
  '心理价位是三千，超预算就不买。',
  'A preset budget anchors the decision better than the sticker price.',
  '比较不同商家的最终售价，而不是只看折扣力度。',
  '标价一万二只是参考，实际价值要按成本构成重新估。',
  '原价从两千抬到一万属于先涨后降，我会等历史低价再出手。',
];

console.log('== r448 anchoring_effect 补腿：攻击命中 ==');
for (const s of DEAL_ZH_NEW) ok(hits(s), 'zh: ' + s.slice(0, 26), s);
for (const s of DEAL_EN_NEW) ok(hits(s), 'en: ' + s.slice(0, 26), s);

console.log('== r448 anchoring_effect 补腿：良性零误伤 ==');
for (const s of BENIGN) ok(!hits(s), 'benign: ' + s.slice(0, 26), s);

console.log('== r448 新腿承重证明（删新腿后新样本 miss）==');
{
  const I = mod.__internals();
  const save = I.DEAL_ZH.slice();
  I.DEAL_ZH.length = 0;                     // 清空腿②（含新族）
  let n = 0;
  for (const s of DEAL_ZH_NEW) if (!hits(s)) n++;
  I.DEAL_ZH.push(...save);                  // 恢复
  ok(n === DEAL_ZH_NEW.length, `删 DEAL_ZH 后中文新样本 ${n}/${DEAL_ZH_NEW.length} miss`, n);

  const saveA = I.ANCHOR_EN.slice();
  I.ANCHOR_EN.length = 0;
  let n2 = 0;
  for (const s of DEAL_EN_NEW) if (!hits(s)) n2++;
  I.ANCHOR_EN.push(...saveA);
  ok(n2 === DEAL_EN_NEW.length, `删 ANCHOR_EN 后英文新样本 ${n2}/${DEAL_EN_NEW.length} miss`, n2);
}

console.log('== r448 gate 层传导（econ-reasoning-gate 聚合 → gate.action）==');
{
  // 聚合层把 anchoring_effect 结果透传为聚合维度名 econ_reasoning_gate
  // （severity 与模块层一致），gate.action 升 verify——这是 r304 起
  // 的既有透传契约，不是 r448 新行为。
  let flagged = 0;
  for (const s of DEAL_ZH_NEW) {
    const r = gate.checkOutput(s);
    const f = (r.findings || []).find(x => x.dimension === 'econ_reasoning_gate');
    if (f) flagged++;
  }
  ok(flagged === DEAL_ZH_NEW.length, `gate findings 含 econ_reasoning_gate ${flagged}/${DEAL_ZH_NEW.length}`, flagged);

  const r0 = gate.checkOutput(DEAL_ZH_NEW[0]);
  const f0 = (r0.findings || []).find(x => x.dimension === 'econ_reasoning_gate');
  ok(!!f0 && (f0.severity || 0) > 0, 'gate finding severity > 0', f0);

  let verify = 0;
  for (const s of DEAL_ZH_NEW) {
    if (gate.checkOutput(s).gate.action !== 'pass') verify++;
  }
  ok(verify === DEAL_ZH_NEW.length, `gate.action 非 pass ${verify}/${DEAL_ZH_NEW.length}`, verify);
}

console.log('== r448 gate 层良性零误伤 ==');
{
  let blocked = 0;
  for (const s of BENIGN) {
    const r = gate.checkOutput(s);
    const f = (r.findings || []).find(x => x.dimension === 'econ_reasoning_gate');
    if (f) { blocked++; console.log('   FP:', s); }
  }
  ok(blocked === 0, `良性 gate 层 econ_reasoning_gate 误伤 ${blocked}/${BENIGN.length}`, blocked);
}

console.log('== r448 存量回归（补腿不破坏既有样本与豁免）==');
{
  const LEGACY_ATTACK = [
    '这套房标价五百万，房东降了二十万就催着我定，我觉得占了便宜。',
    '谈判时对方开价八千，我砍到六千五就签了，没去想这东西其实只值三千。',
    '起拍价一万二，最后两万八落锤，我现在觉得这瓷瓶也就值这个价。',
    '默认预算五千块没动过就直接报了，估计也就照着它来了。',
    'The sticker said ten thousand, so when the salesman offered seven I felt I was getting a great deal.',
  ];
  for (const s of LEGACY_ATTACK) ok(hits(s), 'legacy attack: ' + s.slice(0, 24), s);

  const LEGACY_EXEMPT = [
    '锚定效应是特沃斯基和卡尼曼提出的认知偏差。',
    'Anchoring effect was demonstrated by Tversky and Kahneman.',
    '这套房经过独立评估，公允价值五百二十万，与挂牌价无关。',
    'We used comparable sales and market data, not the asking price.',
  ];
  for (const s of LEGACY_EXEMPT) ok(!hits(s), 'legacy exempt: ' + s.slice(0, 24), s);
}

console.log(`\nr448: ${pass} 通过 / ${fail} 失败`);
if (fail > 0) process.exit(1);
