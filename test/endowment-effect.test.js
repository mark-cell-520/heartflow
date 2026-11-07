/**
 * test/endowment-effect.test.js — r241 禀赋效应维度测试
 * 覆盖：攻击命中（中英）、良性零误伤（含 12 条疑难 FP 压力样本）、
 * 概念讨论/纠正陈述两组豁免族（嵌入真实签名，可负例注入证明承重）、
 * 边界锁（既有维度领地/单腿/否定前缀/非交易框架/超距）、
 * 中英混排多签名、负例注入（双腿族逐族删除/交易框架删除/豁免删除/
 * 距离窗承重）、引擎闸良性守卫。
 * 与 r228-r240 模块同一测试范式：每个负例注入删除一组常量后，攻击必须
 * 不再命中、豁免句必须变红——证明每一组判据都真实承重。
 */
'use strict';
const assert = require('node:assert/strict');
const { detectEndowmentEffect } = require('../src/endowment-effect.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// 永不命中的正则（用于负例注入关闭某组豁免）
const NEVER = /(?!)/;

// ─── 攻击样本（应命中：所有权锚点 × 交易框架内估值推高/拒交易）────
const ATTACKS_ZH = [
  '这把吉他是我的，陪了我十年，别说三千，五千我都不卖。',
  '我的旧车虽然市价只值两万，但对我而言它值五万，低于这个价免谈。',
  '房子是我一手装修起来的，每个角落都有我的心思，市场价再高也反映不了它的价值。',
  '我这个摊位干了十五年，早就不是钱的问题了，给多少钱都代表不了它在我心里的价值。',
  '这幅画挂在我客厅二十年了，画廊出多少价我都不会考虑，它早就不是商品。',
  '咖啡馆是我从一张桌子开始做起来的，连锁品牌给的收购价再高，也买不走这家店。',
  '这串手机号我挑了十几年，别人出价再高也是我的，运气早就绑在一起了。',
];
const ATTACKS_EN = [
  'This watch is mine, I have had it for twenty years, no amount under ten thousand will buy it.',
  'He would not sell his grandfather\u2019s desk at any market price — it is his, so it is worth more than that.',
  'The team built this product line from scratch, so no acquisition offer on the table can reflect what it is worth to us.',
  'The cabin has been in my family for generations; whatever the land is appraised at, we are not selling.',
  'My first guitar is not for sale at any price — the offer would have to be insultingly high to even start a conversation.',
  'This cottage belongs to our family; no developer offer on the table can reflect what it means to us.',
];

// ─── 良性样本（不得命中：含 12 条疑难 FP 压力样本）──────────────
const BENIGN_HARD = [
  // 市场价为基准的理性决策
  '这套设备虽然买的时候贵，但二手行情只值三成，该更新就更新，不能感情用事。',
  '藏品估价要参考近期拍卖成交记录，业主的情感估值不能作为鉴定依据。',
  '情感价值与市场价值可以并存，但理性决策应当以市场价值为基准。',
  '业主因急售报价低于市场价也接受，先把资金回笼再说。',
  '收藏者按拍卖行情低买高卖，从不因为喜欢就在出价上让步。',
  // 非所有权动因/第三方客观陈述
  '他拒绝出售是出于合同限制与竞业条款，与估值高低无关。',
  '公司资产按会计准则计提折旧，账面价值与市场价值之间的差异需要在附注中说明。',
  '业主联名提交了异议，补偿方案还在协商。',
  '这块表是父亲留给我的，我按拍卖行估价入了保险，该赔多少赔多少。',
  // 概念性/描述性（第三人称）
  'He values his late father\u2019s watch far above its market price for sentimental reasons, but he knows exactly what it is worth.',
  'Owners typically demand more to give up an item than they would pay to acquire it, a robust experimental finding.',
  // 交易框架在场但无估值腿/纠正族
  '这是我的看法，价格问题我们再核算一遍。',
  '我们的报价已经是底线了，再低公司确实做不了。',
  '我的房子市场价涨了两成，但这跟卖不卖没关系，先自住着。',
  '我的手机屏幕碎了，卖不出价，干脆自己用着。',
  '责任问题免谈，这是我的底线。',
  '我的想法不值这个价，你们按市场行情来定就好。',
  'He knows exactly what his collection is worth and prices it accordingly.',
  'Our asking price reflects the recent comparable sales in the neighborhood.',
];
const BENIGN_NORMAL = [
  '公司资产处置经过评估和挂牌交易程序，与个人感情无关。',
  '遗产分割时，继承人可以协商情感优先的方案，同时接受专业估价作为参考。',
];

// ─── 豁免族 A：概念讨论（真实签名 + 豁免标记，不得命中；删除标记后应变红）
const EXEMPT_CONCEPT = [
  '心理学教材在讲禀赋效应：这把吉他是我的，陪了我十年，别说三千，五千我都不卖——教科书案例。',
  '行为经济学用禀赋效应解释：我的旧车市价只值两万，但对我而言它值五万，低于这个价免谈。',
  'The textbook defines the endowment effect: my first guitar is not for sale at any price, no matter the offer.',
];

// ─── 豁免族 B：纠正/分离陈述（真实签名 + 纠正标记，不得命中；删除后应变红）
const EXEMPT_CORRECTIVE = [
  '我的旧电脑给多少钱都不卖，留着给孩子上网课。',
  'My cottage is not for sale at any price right now — we are keeping it for personal use and renting it out in summer.',
];

// ─── 边界锁（既有维度领地/单腿/否定前缀/非交易框架/超距，不得命中）──
const BOUNDARY = [
  ['沉没成本领地', '这个项目已经投了两百万，现在停掉前面的钱就全打水飘了，只能硬着头皮做完。'],
  ['努力正当化领地', '我们熬了几个月做出来的方案，质量肯定没问题。'],
  ['心理账户领地', '年终奖发下来我花得特别痛快，反正不是工资，花着不心疼。'],
  ['处置效应领地', '我这只票涨了四成，先落袋为安，套牢的那只再拿拿，总能涨回来的。'],
  ['赢家诅咒领地', '我们竞标成功，说明这块地确实被低估了。'],
  ['单腿-只所有权无估值腿', '这是我的底线，责任问题免谈。'],
  ['单腿-只估值腿无所有权', '市场价再高也反映不了这幅作品的艺术价值。'],
  ['非交易框架表态', '我们的条件免谈，这是团队的决定。'],
  ['否定前缀-ZH', '这把吉他不是我的，市场价多少我都愿意卖。'],
  ['否定前缀-EN', 'This desk is not mine and I would happily sell it at any market price.'],
];
// 双腿超距（默认邻近窗 ZH60 不命中）
const OVERDIST = '这把吉他是我的。' + '各'.repeat(200) + '市场价再高也反映不了它的价值，反正我不卖。';

const MIXED = '这把吉他是我的，低于这个价免谈；My first guitar is not for sale at any price.';
const MULTI_ZH = '这把吉他是我的，低于这个价免谈；那串手机号我挑了十几年，出价再高也是我的。';

console.log('endowment-effect（r241 禀赋效应）测试:');

check('模块导出与短输入安全', () => {
  assert.equal(typeof detectEndowmentEffect, 'function');
  assert.equal(detectEndowmentEffect('').hit, false);
  assert.equal(detectEndowmentEffect(null).hit, false);
  assert.equal(detectEndowmentEffect('短').hit, false);
});

check('攻击命中：中文 7 条', () => {
  for (const t of ATTACKS_ZH) {
    const r = detectEndowmentEffect(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.equal(r.dimension, 'endowment_effect');
    assert.ok(r.score >= 0.6 && r.score <= 0.8, 'severity 档位: ' + t);
    assert.ok(r.details.length > 10, 'details 非空');
    assert.ok(r.evidence.length >= 1, 'evidence 非空');
    assert.ok(r.guidance.length > 20, 'guidance 非空');
  }
});

check('攻击命中：英文 6 条', () => {
  for (const t of ATTACKS_EN) {
    const r = detectEndowmentEffect(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.ok(r.score >= 0.6 && r.score <= 0.8);
  }
});

check('良性零误伤：22 条（含 18 条疑难 FP 压力样本）', () => {
  for (const t of BENIGN_HARD) assert.equal(detectEndowmentEffect(t).hit, false, '误伤: ' + t);
  for (const t of BENIGN_NORMAL) assert.equal(detectEndowmentEffect(t).hit, false, '误伤: ' + t);
});

check('豁免族：概念讨论（中英 3 条）', () => {
  for (const t of EXEMPT_CONCEPT) assert.equal(detectEndowmentEffect(t).hit, false, '误伤: ' + t);
});

check('豁免族：纠正/分离陈述（中英 2 条）', () => {
  for (const t of EXEMPT_CORRECTIVE) assert.equal(detectEndowmentEffect(t).hit, false, '误伤: ' + t);
});

check('边界锁：既有维度领地/单腿/否定前缀/非交易框架/超距不判', () => {
  for (const [k, t] of BOUNDARY) assert.equal(detectEndowmentEffect(t).hit, false, '误判[' + k + ']: ' + t);
  assert.equal(detectEndowmentEffect(OVERDIST).hit, false, '默认邻近窗超距不命中');
});

check('中英混排与多签名加分档', () => {
  const m = detectEndowmentEffect(MIXED);
  assert.equal(m.hit, true, '混排应命中');
  assert.ok(m.count >= 2, '多签名（中英双腿链各自成签名）');
  assert.ok(Math.abs(m.score - 0.72) < 1e-9, '双签名加分档');
  const z = detectEndowmentEffect(MULTI_ZH);
  assert.equal(z.hit, true);
  assert.ok(z.count >= 2, '多签名');
  assert.ok(Math.abs(z.score - 0.72) < 1e-9, '双签名加分档');
});

check('负例注入：中文双腿族+交易框架删除后攻击全部不再命中', () => {
  assert.equal(detectEndowmentEffect(ATTACKS_ZH[0], { OWN_ZH: [] }).hit, false, '删所有权锚点ZH');
  assert.equal(detectEndowmentEffect(ATTACKS_ZH[2], { INFLATE_ZH: [] }).hit, false, '删估值推高ZH');
  assert.equal(detectEndowmentEffect(ATTACKS_ZH[0], { REFUSE_ZH: [] }).hit, false, '删拒交易ZH');
  assert.equal(detectEndowmentEffect(ATTACKS_ZH[0], { TXN_ZH: NEVER }).hit, false, '删交易框架ZH');
});

check('负例注入：英文双腿族+交易框架删除后攻击全部不再命中', () => {
  assert.equal(detectEndowmentEffect(ATTACKS_EN[0], { OWN_EN: [] }).hit, false, '删所有权锚点EN');
  assert.equal(detectEndowmentEffect(ATTACKS_EN[2], { INFLATE_EN: [] }).hit, false, '删估值推高EN');
  assert.equal(detectEndowmentEffect(ATTACKS_EN[1], { REFUSE_EN: [] }).hit, false, '删拒交易EN');
  assert.equal(detectEndowmentEffect(ATTACKS_EN[1], { TXN_EN: NEVER }).hit, false, '删交易框架EN');
});

check('负例注入：概念讨论豁免删除后豁免句变红（承重证明）', () => {
  assert.equal(detectEndowmentEffect(EXEMPT_CONCEPT[0], { CONCEPT_ZH: NEVER }).hit, true, '删概念讨论ZH');
  assert.equal(detectEndowmentEffect(EXEMPT_CONCEPT[2], { CONCEPT_EN: NEVER }).hit, true, '删概念讨论EN');
});

check('负例注入：纠正陈述豁免删除后豁免句变红（承重证明）', () => {
  assert.equal(detectEndowmentEffect(EXEMPT_CORRECTIVE[0], { CORRECTIVE_ZH: NEVER }).hit, true, '删纠正陈述ZH');
  assert.equal(detectEndowmentEffect(EXEMPT_CORRECTIVE[1], { CORRECTIVE_EN: NEVER }).hit, true, '删纠正陈述EN');
});

check('负例注入：邻近距离窗承重（放大到 500 后长距句命中）', () => {
  assert.equal(detectEndowmentEffect(OVERDIST).hit, false, '默认窗不命中');
  assert.equal(detectEndowmentEffect(OVERDIST, { PAIR_ZH: 500 }).hit, true, '放大窗后命中');
});

check('引擎闸：良性样本不得以 endowment_effect 进 findings（含接线后守卫）', () => {
  const engine = require('../src/gate.js');
  const gate = engine.check || engine.gate || engine.checkOutput;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN_HARD.concat(BENIGN_NORMAL)) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('endowment_effect'), '误伤: ' + t);
  }
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
