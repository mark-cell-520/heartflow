/**
 * test/anchoring-effect.test.js — r242 锚定效应维度测试
 * 覆盖：攻击命中（中英）、良性零误伤（含 22 条疑难 FP 压力样本）、
 * 概念讨论/纠正独立估价两组豁免族（嵌入真实签名，可负例注入证明承重）、
 * 边界锁（既有维度领地/单腿/否定前缀/超距）、中英混排多签名、
 * 负例注入（双腿族逐族删除/数字在场删除/豁免删除/距离窗承重）、
 * 引擎闸良性守卫。
 * 与 r228-r241 模块同一测试范式：每个负例注入删除一组常量后，攻击必须
 * 不再命中、豁免句必须变红——证明每一组判据都真实承重。
 */
'use strict';
const assert = require('node:assert/strict');
const { detectAnchoringEffect } = require('../src/anchoring-effect.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// 永不命中的正则（用于负例注入关闭某组常量）
const NEVER = /(?!)/;

// ─── 攻击样本（应命中：锚点呈现 × 估计被锚点支配 + 数字在场）────
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

// ─── 良性样本（不得命中：22 条，含 15 条疑难 FP 压力样本）───────
const BENIGN_HARD = [
  // 以独立信息为基准的估价
  '这款吸尘器历史低价是899，现在降到749，比价网站的数据显示值得入手。',
  '我们按成本加成定价，原材料涨了三成，出厂价相应上调，不受采购商报价影响。',
  '谈判前我们做了独立评估，心理底线是四百万，对方开价再高再低都不影响我们的报价。',
  '这件大衣吊牌价两千八，按面料行情和做工，合理价位在六百左右，三折入手不亏。',
  'We ran a formal valuation from the cash flows and set our ceiling before the negotiation started, so the opening bid was irrelevant.',
  'The asking price is public information; I discounted it for the deferred maintenance listed in the inspection report.',
  '吊牌价只是参考，我按二手平台近三个月的成交行情重新评估了这台设备的价值。',
  '报价虚高是常态，我以成本加合理利润为基准反推，报出的价格不随对方开价走。',
  'We ignored the asking price and valued the company from its cash flows before deciding what to bid.',
  'The discount was computed from the wholesale cost, and the final price still leaves a healthy margin.',
  // 概念讨论
  '锚定效应解释了为什么第一个出现的数字会影响后续判断，实验研究中常通过随机锚点验证。',
  'Anchoring is one of the most robust findings in judgment and decision making, replicated across cultures and domains.',
  '锚定效应指初始数值对后续估计的影响，谈判中应当以独立估价为锚而非对方开价。',
  // 第三方转述/纠正
  '他就是被商家的原价锚定了，我劝他按二手行情重新估一遍再决定。',
  'After comparing four independent estimates we set the budget ourselves; the vendor quote only served as a data point.',
  // 纯描述（无判断腿）
  '该商品详情页标注原价999元、活动价99元，活动截止到周日。',
  'The listing shows an MSRP of three hundred and a sale price of one twenty; shipping is free over fifty.',
  '起拍价只是程序设定的起始点，真正决定成交价的是竞买人对藏品的一致估价。',
  'The opening bid is procedural; the final price reflects what bidders actually think the item is worth.',
  // 谈判纪律
  '报价环节我们要求供应商提供成本构成，横向对比三家之后再议价，避免被任何一家的开价带偏。',
  // 常规良性
  '公司季度采购经过三家比价和成本核算，报价高于市场行价的供应商直接出局。',
  '房价走势需要参考近期成交案例，不能凭中介的第一句话下结论。',
];

// ─── 豁免族 A：概念讨论（真实签名 + 豁免标记，不得命中；删除标记后应变红）
const EXEMPT_CONCEPT = [
  '心理学教材在讲锚定效应：这套房标价五百万，房东降了二十万就催着我定，我觉得占了便宜——教科书案例。',
  '判断与决策研究用锚定效应解释：谈判时对方开价八千，我砍到六千五就签了，没去想它其实只值三千。',
  'The textbook defines the anchoring effect: the list price was three hundred, and the discount made the purchase feel like a win.',
];

// ─── 豁免族 B：纠正/独立估价陈述（真实签名 + 纠正标记，不得命中；删除后应变红）
const EXEMPT_CORRECTIVE = [
  '这件大衣吊牌价两千八，打完折一千二，虽然觉得划算，但我是按比价网站的历史低价和面料行情定的，六百拿下。',
  '对方开价八千，我砍到六千五就签了——签字前我做了独立评估，心理底线是七千，这个价低于独立估价。',
  'The list price was three hundred and the discount felt like a win, but I valued it from comparable sales and the wholesale cost before buying.',
];

// ─── 边界锁（既有维度领地/单腿/否定前缀，不得命中）────────────
const BOUNDARY = [
  ['禀赋效应领地', '这把吉它是我的，陪了我十年，别说三千，五千我都不卖。'],
  ['赢家诅咒领地', '我们竞标成功，说明这块地确实被低估了。'],
  ['诉诸财富领地', '他有钱所以他说的肯定对，没钱的人懂什么。'],
  ['虚假精度领地', '这个估计精确到小数点后三位，不代表它真的准。'],
  ['沉没成本领地', '这个项目已经投了两百万，现在停掉前面的钱就全打水漂了，只能硬着头皮做完。'],
  ['心理账户领地', '年终奖发下来我花得特别痛快，反正不是工资，花着不心疼。'],
  ['处置效应领地', '我这只票涨了四成，先落袋为安，套牢的那只再拿拿，总能涨回来的。'],
  ['统计领地', '样本量太小，这个比例说明不了什么。'],
  ['单腿-只锚点无支配腿', '这件商品原价999元，现价199元，页面还有满减活动。'],
  ['单腿-只支配腿无锚点', '我觉得今天不买就是亏，逛街不能空手回去。'],
  ['否定前缀-ZH', '虽然原价标得很高，我并不觉得划算，按行情估完根本不值。'],
  ['否定前缀-EN', 'The list price looked high, but I never felt it was a deal after checking the comparable sales.'],
];
// 双腿超距（默认邻近窗 ZH60 不命中）
const OVERDIST = '这套房标价五百万。' + '各'.repeat(200) + '我觉得占了便宜。';

const MIXED = '这套房标价五百万，我觉得占了便宜；The sticker said ten thousand, so the offer of seven felt like a great deal.';
const MULTI_ZH = '这套房标价五百万，我觉得占了便宜；对方开价八千，我砍到六千五就签了。';

console.log('anchoring-effect（r242 锚定效应）测试:');

check('模块导出与短输入安全', () => {
  assert.equal(typeof detectAnchoringEffect, 'function');
  assert.equal(detectAnchoringEffect('').hit, false);
  assert.equal(detectAnchoringEffect(null).hit, false);
  assert.equal(detectAnchoringEffect('短').hit, false);
});

check('攻击命中：中文 10 条', () => {
  for (const t of ATTACKS_ZH) {
    const r = detectAnchoringEffect(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.equal(r.dimension, 'anchoring_effect');
    assert.ok(r.score >= 0.6 && r.score <= 0.8, 'severity 档位: ' + t);
    assert.ok(r.details.length > 10, 'details 非空');
    assert.ok(r.evidence.length >= 1, 'evidence 非空');
    assert.ok(r.guidance.length > 20, 'guidance 非空');
  }
});

check('攻击命中：英文 7 条', () => {
  for (const t of ATTACKS_EN) {
    const r = detectAnchoringEffect(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.ok(r.score >= 0.6 && r.score <= 0.8);
  }
});

check('良性零误伤：22 条（含 15 条疑难 FP 压力样本）', () => {
  for (const t of BENIGN_HARD) assert.equal(detectAnchoringEffect(t).hit, false, '误伤: ' + t);
});

check('豁免族：概念讨论（中英 3 条）', () => {
  for (const t of EXEMPT_CONCEPT) assert.equal(detectAnchoringEffect(t).hit, false, '误伤: ' + t);
});

check('豁免族：纠正/独立估价陈述（中英 3 条）', () => {
  for (const t of EXEMPT_CORRECTIVE) assert.equal(detectAnchoringEffect(t).hit, false, '误伤: ' + t);
});

check('边界锁：既有维度领地/单腿/否定前缀/超距不判', () => {
  for (const [k, t] of BOUNDARY) assert.equal(detectAnchoringEffect(t).hit, false, '误判[' + k + ']: ' + t);
  assert.equal(detectAnchoringEffect(OVERDIST).hit, false, '默认邻近窗超距不命中');
});

check('中英混排与多签名加分档', () => {
  const m = detectAnchoringEffect(MIXED);
  assert.equal(m.hit, true, '混排应命中');
  assert.ok(m.count >= 2, '多签名（中英双腿链各自成签名）');
  assert.ok(Math.abs(m.score - 0.72) < 1e-9, '双签名加分档');
  const z = detectAnchoringEffect(MULTI_ZH);
  assert.equal(z.hit, true);
  assert.ok(z.count >= 2, '多签名');
  assert.ok(Math.abs(z.score - 0.72) < 1e-9, '双签名加分档');
});

check('负例注入：中文四组腿族+数字在场删除后攻击全部不再命中', () => {
  assert.equal(detectAnchoringEffect(ATTACKS_ZH[0], { ANCHOR_ZH: [] }).hit, false, '删锚点呈现ZH');
  assert.equal(detectAnchoringEffect(ATTACKS_ZH[3], { ORBIT_ZH: [] }).hit, false, '删围绕锚点ZH');
  assert.equal(detectAnchoringEffect(ATTACKS_ZH[0], { DEAL_ZH: [] }).hit, false, '删划算感ZH');
  assert.equal(detectAnchoringEffect(ATTACKS_ZH[1], { WORTH_ZH: [] }).hit, false, '删估值即锚点ZH');
  assert.equal(detectAnchoringEffect(ATTACKS_ZH[0], { NUM_ZH: NEVER }).hit, false, '删数字在场ZH');
});

check('负例注入：英文双腿族+数字在场删除后攻击全部不再命中', () => {
  assert.equal(detectAnchoringEffect(ATTACKS_EN[0], { ANCHOR_EN: [] }).hit, false, '删锚点呈现EN');
  assert.equal(detectAnchoringEffect(ATTACKS_EN[1], { DOMINATED_EN: [] }).hit, false, '删估计被支配EN');
  assert.equal(detectAnchoringEffect(ATTACKS_EN[0], { NUM_EN: NEVER }).hit, false, '删数字在场EN');
});

check('负例注入：概念讨论豁免删除后豁免句变红（承重证明）', () => {
  assert.equal(detectAnchoringEffect(EXEMPT_CONCEPT[0], { CONCEPT_ZH: NEVER }).hit, true, '删概念讨论ZH');
  assert.equal(detectAnchoringEffect(EXEMPT_CONCEPT[2], { CONCEPT_EN: NEVER }).hit, true, '删概念讨论EN');
});

check('负例注入：纠正陈述豁免删除后豁免句变红（承重证明）', () => {
  assert.equal(detectAnchoringEffect(EXEMPT_CORRECTIVE[0], { CORRECTIVE_ZH: NEVER }).hit, true, '删纠正陈述ZH');
  assert.equal(detectAnchoringEffect(EXEMPT_CORRECTIVE[2], { CORRECTIVE_EN: NEVER }).hit, true, '删纠正陈述EN');
});

check('负例注入：邻近距离窗承重（放大到 500 后长距句命中）', () => {
  assert.equal(detectAnchoringEffect(OVERDIST).hit, false, '默认窗不命中');
  assert.equal(detectAnchoringEffect(OVERDIST, { PAIR_ZH: 500 }).hit, true, '放大窗后命中');
});

check('引擎闸：良性样本不得以 anchoring_effect 进 findings（含接线后守卫）', () => {
  const engine = require('../src/gate.js');
  const gate = engine.check || engine.gate || engine.checkOutput;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN_HARD) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('anchoring_effect'), '误伤: ' + t);
  }
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
