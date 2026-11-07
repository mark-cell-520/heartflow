// r242 负例注入探针（agent-4）：逐条删掉本轮每组判据常量，
// 断言守卫必须变红（攻击不再命中 / 豁免句变红），证明每组判据真实承重。
// 运行：node coordination/agent4/probes/r242-negative-injection.js
'use strict';
const path = require('path');
const { detectAnchoringEffect } = require(path.join(__dirname, '..', '..', '..', 'src', 'anchoring-effect.js'));

const NEVER = /(?!)/;
const ATTACKS_ZH = [
  '这套房标价五百万，房东降了二十万就催着我定，我觉得占了便宜。',
  '谈判时对方开价八千，我砍到六千五就签了，没去想这东西其实只值三千。',
  '原价九千九的东西现在卖一千二，怎么看都划算，反正比标价省了八千多。',
  '招聘时第一个候选人期望薪资说了两万，后面每个人我都拿这个数去比，怎么也跳不出这个范围。',
  '起拍价一万二，最后两万八落锤，我现在觉得这瓷瓶也就值这个价。',
  '对方先把薪资开到一万五，我本来想谈两万二，结果顺着这个数就谈了。',
  '标价三千二的外套打三折，我试都没试就刷卡了，感觉不买就是亏。',
  '中介先说这套房市场价八百万，之后每看一套房我都拿这个数在比。',
  '销售第一句报了原价一万九，后面砍价我就在这个数上让了两千，压根没独立估过。',
  '报价单上第一个项目写了八万，后面几个项目我都照着这个量级批的。',
];
const ATTACKS_EN = [
  'The sticker said ten thousand, so when the salesman offered seven I felt I was getting a great deal.',
  'They opened at ninety, I countered at seventy, and we settled without ever questioning whether it was worth fifty.',
  'The list price was three hundred, and the fifty percent discount made the purchase feel like a win regardless of quality.',
  'The bid opened at fifty, and by the close at two hundred everything still felt cheap against that opening number.',
  'She quoted twelve thousand first, so my counter of ten thousand felt generous even though the repair was worth six at most.',
  'The first price I heard was two hundred, and every offer after that stayed inside the orbit of that number.',
  'Once he named the six-figure salary, our budget discussion never escaped that range.',
];
const EXEMPT_CONCEPT = [
  '心理学教材在讲锚定效应：这套房标价五百万，房东降了二十万就催着我定，我觉得占了便宜——教科书案例。',
  '判断与决策研究用锚定效应解释：谈判时对方开价八千，我砍到六千五就签了，没去想它其实只值三千。',
  'The textbook defines the anchoring effect: the list price was three hundred, and the discount made the purchase feel like a win.',
];
const EXEMPT_CORRECTIVE = [
  '这件大衣吊牌价两千八，打完折一千二，虽然觉得划算，但我是按比价网站的历史低价和面料行情定的，六百拿下。',
  '对方开价八千，我砍到六千五就签了——签字前我做了独立评估，心理底线是七千，这个价低于独立估价。',
  'The list price was three hundred and the discount felt like a win, but I valued it from comparable sales and the wholesale cost before buying.',
];
const OVERDIST = '这套房标价五百万。' + '各'.repeat(200) + '我觉得占了便宜。';

// 每个注入点：[说明, 句子, inject, 期望]
// 期望 false = 删除该组后攻击必须不再命中；true = 删除该组后豁免句必须变红。
const injections = [
  ['删 ANCHOR_ZH（锚点呈现-中）', ATTACKS_ZH[0], { ANCHOR_ZH: [] }, false],
  ['删 ORBIT_ZH（围绕锚点-中）', ATTACKS_ZH[3], { ORBIT_ZH: [] }, false],
  ['删 DEAL_ZH（划算感-中）', ATTACKS_ZH[0], { DEAL_ZH: [] }, false],
  ['删 WORTH_ZH（估值即锚点-中）', ATTACKS_ZH[1], { WORTH_ZH: [] }, false],
  ['删 NUM_ZH（数字在场-中）', ATTACKS_ZH[0], { NUM_ZH: NEVER }, false],
  ['删 ANCHOR_EN（锚点呈现-英）', ATTACKS_EN[0], { ANCHOR_EN: [] }, false],
  ['删 DOMINATED_EN（估计被支配-英）', ATTACKS_EN[1], { DOMINATED_EN: [] }, false],
  ['删 NUM_EN（数字在场-英）', ATTACKS_EN[0], { NUM_EN: NEVER }, false],
  ['删 CONCEPT_ZH（概念讨论豁免-中）', EXEMPT_CONCEPT[0], { CONCEPT_ZH: NEVER }, true],
  ['删 CONCEPT_EN（概念讨论豁免-英）', EXEMPT_CONCEPT[2], { CONCEPT_EN: NEVER }, true],
  ['删 CORRECTIVE_ZH（纠正陈述豁免-中）', EXEMPT_CORRECTIVE[0], { CORRECTIVE_ZH: NEVER }, true],
  ['删 CORRECTIVE_EN（纠正陈述豁免-英）', EXEMPT_CORRECTIVE[2], { CORRECTIVE_EN: NEVER }, true],
  ['PAIR_ZH 60→500（距离窗承重）', OVERDIST, { PAIR_ZH: 500 }, true],
];

let ok = 0, bad = 0;
for (const [name, text, inject, expectHit] of injections) {
  const base = detectAnchoringEffect(text).hit;
  const after = detectAnchoringEffect(text, inject).hit;
  const pass = (after === expectHit) && (base !== expectHit || name.startsWith('PAIR'));
  if (pass) { ok++; console.log(`✓ ${name}: 基线=${base} 注入后=${after}（期望 ${expectHit}）`); }
  else { bad++; console.log(`✗ ${name}: 基线=${base} 注入后=${after}（期望 ${expectHit}）`); }
}
console.log(`\n注入 ${injections.length} 个：${ok} 个按预期，${bad} 个未按预期`);
process.exit(bad > 0 ? 1 : 0);
