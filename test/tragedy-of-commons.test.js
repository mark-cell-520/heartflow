/**
 * test/tragedy-of-commons.test.js — r238 公地悲剧维度测试
 * 覆盖：攻击命中（中英）、良性零误伤（含 32 条疑难 FP 压力样本）、
 * 概念讨论豁免族（嵌入真实签名 + 豁免标记，可负例注入证明承重）、
 * 边界锁（既有维度领地/缺腿/否定前缀/资源属性句/超距）、
 * 中英混排多签名、负例注入（三腿族删除/豁免删除/距离窗承重）、
 * 引擎闸良性守卫。
 * 与 r228-r237 模块同一测试范式：每个负例注入删除一组常量后，攻击必须
 * 不再命中、豁免句必须变红——证明每一组判据都真实承重。
 */
'use strict';
const assert = require('node:assert/strict');
const { detectTragedyOfCommons } = require('../src/tragedy-of-commons.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// 永不命中的正则（用于负例注入关闭某组豁免）
const NEVER = /(?!)/;

// ─── 攻击样本（应命中）────────────────────────────────────────
const ATTACKS_ZH = [
  '这片草场是公共的，每家多养几只羊自己就多挣一份，至于草场退化那是大家一起承担的。',
  '地下水不要钱，我们村多种一季稻就多一季收入，谁节省谁吃亏。',
  '渔场是大家的，每条船都加大捕捞量，最后资源枯竭，可每条船的选择都是理性的。',
  '这片林子的野菜是大家一起采的，谁采得多谁占便宜，采秃了也是全体村民一起承受。',
  '公共车位不收费，每位车主都想方设法长时间占着，最后谁也别想停上车。',
  '公园的草坪是给大家的，人人都多踩两条近路，最后草全秃了，谁也别想散步。',
  '草原没有围栏，每个牧户都尽可能多地放牧，草场退化的代价是全社会一起扛。',
];
const ATTACKS_EN = [
  'The pasture is shared, so each family that adds more cattle earns more, and the overgrazing cost falls on everyone.',
  'The aquifer is free, so every farm that pumps more this season gains, even though the water table keeps dropping.',
  'Each trawler expanded its catch because the fish stock belonged to no one, and that was the rational choice for every captain.',
  'Since the fishery is open to all, every boat that fishes harder this season profits more, and the depleted stock is everyone\u2019s problem.',
  'The river is a free dumping ground, so each factory that discharges more saves on treatment costs while the pollution is shared by all.',
  'Since the meadow is open to everyone, each shepherd grazes as many extra sheep as possible, and the degraded pasture is a cost everyone shares.',
  'Public airwaves are free for all broadcasters, so every network grabs as much bandwidth as it can—the congestion is every viewer\u2019s problem.',
];

// ─── 良性样本（不得命中）──────────────────────────────────────
const BENIGN_HARD = [
  // 中性机制描述 + 治理结果（正确分析，正是本族解药）
  '公地悲剧指的是无主资源容易被过度使用，哈丁1968年提出这个概念，至今仍有争议。',
  '牧场公有确实诱发了过度放牧，后来实行承包到户，退化才止住。',
  '公共资源治理有奥斯特罗姆总结的自主治理范式，并非必然走向悲剧。',
  'Overfishing depleted the stock because no single fisherman had an incentive to conserve—the textbook commons problem.',
  'The village manages its commons through quotas and rotation, which has avoided depletion.',
  // 治理方案句（缺腿③理性化断言）
  '公共草场需要定额放牧，超载的部分按户罚款，退化就能控制住。',
  '这片渔场由村里统一轮捕，休渔期严格执行，二十年来资源稳定。',
  'Shared pastures need grazing quotas and per-household penalties, or the grassland degrades.',
  '共有资源容易耗竭，所以才需要确权和配额管理。',
  // 否定/纠偏形
  '草场并不是无主的，每户都有明确的承包界线，超载要罚款。',
  '多养几只羊也未必划算，草料成本和疫病风险都在上升。',
  'The aquifer is not free to use—pumping permits are capped per farm.',
  // 概念讨论
  '这堂课讲公地悲剧：共享资源上的个体理性如何汇成集体非理性。',
  'Hardin\u2019s tragedy of the commons explains why open fisheries collapse.',
  // r238 扩充高难度良性
  '公海捕鱼要遵守国际配额，超载的船只需接受处罚。',
  '公共道路上不能乱停车，这是基本规则。',
  '村里的水井是共用的，但每户都按定额打水，从来没有抢过。',
  '人人都想住大房子，这是人之常情，不算过度索取。',
  '共享单车方便了大家，但也带来了乱停放的问题。',
  '公共WiFi谁都可以用，但下载大文件请避开高峰。',
  '村里共同分担修路费用，账目每季度公示一次。',
  'The open sea is governed by international quotas; overloaded vessels are penalized.',
  'The village well is shared, but every household draws a fixed ration.',
  'Everyone wants a bigger house; that is a normal preference, not over-extraction.',
  // 共享资源上的正当规范句（有锚点有规范，无过度取用行为腿）
  '公共频道谁都能用，但每家公司都按规定额度发送，干扰由监管部门统一协调。',
];
const BENIGN_NORMAL = [
  '公司今年加大了研发投入，政策扶持新兴产业。',
  '我们村去年安装了光伏，人均收入提高了两成。',
  '公共图书馆周末人很多，需要提前预约座位。',
  '地下水超采已经引起地面沉降，水利部门出台了限采令。',
  'The company increased R&D spending and launched three new products.',
  'City parking is free on weekends, which keeps the downtown busy.',
  'Households saved more last year and bank deposits rose sharply.',
  'The fishery collapsed decades ago; today strict quotas have rebuilt the stock.',
];

// ─── 豁免族：概念讨论（真实签名 + 豁免标记，不得命中；删除标记后应变红）
const EXEMPT_CONCEPT = [
  '教材在讲公地悲剧时举例：草场是公共的，每家多养羊自己多挣钱，退化大家一起扛。',
  'Tragedy of the commons: the pasture is shared, so each family that adds more cattle earns more—textbook material.',
];

// ─── 边界锁（既有维度领地/缺腿/否定前缀/资源属性句/超距，不得命中）────
const BOUNDARY = [
  '排污成本转嫁给下游居民，工厂自己省了处理费。',            // cost_externalization 领地（无共享资源取用结构）
  '悬赏捕蛇，结果有人养蛇领赏，蛇患反而更严重了。',          // perverse_incentive 领地（量化奖惩设计）
  '他这么有钱，说明他的判断肯定没错。',                      // appeal_to_wealth 领地
  '每个人都应该为集体着想，不能只考虑自己。',                // 道德呼吁（无过度取用行为腿）
  '草场是公共的。',                                          // 缺腿②③
  '每家都多养了几只羊。',                                    // 缺腿①（资源属性未出现）
  '成本最后由大家一起承担。',                                // 缺腿①②
  '草场并不是公共的，每家多养羊自己多挣钱。',                // 腿①被否定前缀拦下（并不是）
];
// 三腿超距（默认窗 ZH60 不命中）
const OVERDIST = '这片草场是公共的，' + '各'.repeat(70) + '，每家都多养羊自己多挣钱。';

const MIXED = '草场是公共的，每家多养羊自己多挣钱；The pasture is shared, so each family that adds more cattle earns more.';
const MULTI_ZH = '这片草场是公共的，每家多养羊自己多挣一份；地下水不要钱，谁节省谁吃亏，大家都多抽。';

console.log('tragedy-of-commons（r238 公地悲剧）测试:');

check('模块导出与短输入安全', () => {
  assert.equal(typeof detectTragedyOfCommons, 'function');
  assert.equal(detectTragedyOfCommons('').hit, false);
  assert.equal(detectTragedyOfCommons(null).hit, false);
  assert.equal(detectTragedyOfCommons('短').hit, false);
});

check('攻击命中：中文 7 条', () => {
  for (const t of ATTACKS_ZH) {
    const r = detectTragedyOfCommons(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.equal(r.dimension, 'tragedy_of_commons');
    assert.ok(r.score >= 0.6 && r.score <= 0.8, 'severity 档位: ' + t);
    assert.ok(r.details.length > 10, 'details 非空');
    assert.ok(r.evidence.length >= 1, 'evidence 非空');
    assert.ok(r.guidance.length > 20, 'guidance 非空');
  }
});

check('攻击命中：英文 7 条', () => {
  for (const t of ATTACKS_EN) {
    const r = detectTragedyOfCommons(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.ok(r.score >= 0.6 && r.score <= 0.8);
  }
});

check('良性零误伤：33 条（含 26 条疑难 FP 压力样本）', () => {
  for (const t of BENIGN_HARD) assert.equal(detectTragedyOfCommons(t).hit, false, '误伤: ' + t);
  for (const t of BENIGN_NORMAL) assert.equal(detectTragedyOfCommons(t).hit, false, '误伤: ' + t);
});

check('豁免族：概念讨论（中英 2 条）', () => {
  for (const t of EXEMPT_CONCEPT) {
    assert.equal(detectTragedyOfCommons(t).hit, false, '误伤: ' + t);
  }
});

check('边界锁：既有维度领地/缺腿/否定前缀/超距不判', () => {
  for (const t of BOUNDARY) assert.equal(detectTragedyOfCommons(t).hit, false, '误判: ' + t);
  assert.equal(detectTragedyOfCommons(OVERDIST).hit, false, '默认窗超距不命中');
});

check('中英混排与多签名加分档', () => {
  const m = detectTragedyOfCommons(MIXED);
  assert.equal(m.hit, true, '混排应命中');
  assert.equal(m.count, 2, '中英双签名');
  assert.ok(Math.abs(m.score - 0.72) < 1e-9, '双签名加分档');
  const z = detectTragedyOfCommons(MULTI_ZH);
  assert.equal(z.hit, true);
  assert.ok(z.count >= 2, '多签名（双腿配对在 60 字窗内可组合出多签名）');
  assert.ok(Math.abs(z.score - 0.72) < 1e-9, '双签名加分档');
});

check('负例注入：六组三腿族删除后攻击全部不再命中', () => {
  assert.equal(detectTragedyOfCommons(ATTACKS_ZH[0], { A_ZH: [] }).hit, false, '删共享资源ZH');
  assert.equal(detectTragedyOfCommons(ATTACKS_ZH[0], { B_ZH: [] }).hit, false, '删过度取用ZH');
  assert.equal(detectTragedyOfCommons(ATTACKS_ZH[0], { C_ZH: [] }).hit, false, '删理性化断言ZH');
  assert.equal(detectTragedyOfCommons(ATTACKS_EN[0], { A_EN: [] }).hit, false, '删共享资源EN');
  assert.equal(detectTragedyOfCommons(ATTACKS_EN[0], { B_EN: [] }).hit, false, '删过度取用EN');
  assert.equal(detectTragedyOfCommons(ATTACKS_EN[0], { C_EN: [] }).hit, false, '删理性化断言EN');
});

check('负例注入：概念讨论豁免删除后豁免句变红（承重证明）', () => {
  assert.equal(detectTragedyOfCommons(EXEMPT_CONCEPT[0], { CONCEPT_ZH: NEVER }).hit, true, '删概念讨论ZH');
  assert.equal(detectTragedyOfCommons(EXEMPT_CONCEPT[1], { CONCEPT_EN: NEVER }).hit, true, '删概念讨论EN');
});

check('负例注入：距离窗承重（放大到 500 后长距句命中）', () => {
  assert.equal(detectTragedyOfCommons(OVERDIST).hit, false, '默认窗不命中');
  assert.equal(detectTragedyOfCommons(OVERDIST, { PAIR_ZH: 500 }).hit, true, '放大窗后命中');
});

check('引擎闸：良性样本不得以 tragedy_of_commons 进 findings（含接线后守卫）', () => {
  const engine = require('../src/gate.js');
  const gate = engine.check || engine.gate || engine.checkOutput;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN_HARD.concat(BENIGN_NORMAL)) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('tragedy_of_commons'), '误伤: ' + t);
  }
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
