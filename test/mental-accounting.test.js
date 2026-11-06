/**
 * test/mental-accounting.test.js — r235 心理账户维度测试
 * 覆盖：攻击命中（中英）、良性零误伤、四组豁免族（让步纠正/明确解耦/
 * 规范记账/元话语，均以「嵌入真实签名 + 豁免标记」构造，可负例注入证明
 * 承重）、边界锁（既有维度领地/缺腿/否定句/规范记账/超距）、中英混排
 * 多签名、负例注入（腿族删除/豁免删除/距离窗承重）、引擎闸良性守卫。
 * 与 r228-r234 模块同一测试范式：每个负例注入删除一组常量后，攻击必须
 * 不再命中、豁免句必须变红——证明每一组判据都真实承重。
 */
'use strict';
const assert = require('node:assert/strict');
const { detectMentalAccounting } = require('../src/mental-accounting.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// 永不命中的正则（用于负例注入关闭某组豁免）
const NEVER = /(?!)/;

// ─── 攻击样本（应命中）────────────────────────────────────────
const ATTACKS_ZH = [
  '这笔年终奖是意外之财，不算正经收入，所以可以放心大胆地挥霍一把。',
  '反正是公司报销的钱，不花白不花，多点几个菜也没什么。',
  '这是省下来的预算，花掉也不心疼，就当是白捡的。',
  '公司发的购物卡闲着也是闲着，拿去买了用不上的东西，反正不是工资。',
  '中奖得来的五万块，跟攒了一年工资不一样，挥霍起来不觉得可惜。',
  '这笔是项目奖金，跟基本工资不是一个性质，没必要纳入家庭总预算。',
  '虽然总收入没变，但因为是报销下来的钱，大家默认它可以不计入成本地随意花。',
  '年底发了笔横财，跟大家工资不是一回事，索性痛快花一场。',
  '遗产到账就当是天上掉下来的，买起东西来没什么心疼的。',
  '公司的代金券马上到期，不用白不用，赶紧下单造掉。',
];
const ATTACKS_EN = [
  'The bonus is found money, not real salary, so I might as well splurge on it guilt-free.',
  "Money from a tax refund feels free, so I spent it on things I would never buy with my paycheck.",
  'Since it came out of the entertainment budget, not the real budget, nobody minded the overspend.',
  'The lottery winnings are not the same as my paycheck, so why not blow the whole thing.',
  'Gift cards are basically free money, so spending them on junk does not really count.',
  'The gift card is separate from my regular budget, so I went ahead and spent it.',
];

// ─── 良性样本（不得命中）──────────────────────────────────────
const BENIGN = [
  '年终奖我打算存起来作为孩子的教育金，专款专用。',
  '所有收入都进同一个账户统一规划，不分来源。',
  '心理账户是一种认知偏差，会让同样的一块钱被区别对待。',
  '意外之财也要纳入家庭预算统一规划，避免非理性消费。',
  '报销款到账后计入项目成本，与工资收入合并管理。',
  '这笔退款已原路返回到付款账户。',
  '报销款不计入绩效工资，但计入项目成本，这是财务制度。',
  '年终奖是税后收入，不计入增值税基数。',
  '钱就是钱，不分来源，每一块钱都一样珍贵。',
  '坚决反对铺张浪费，严禁挥霍公共资金。',
  '意外之财不能当作随便花的理由，必须纳入监管。',
  '虽然意外之财容易让人随手花掉，但我们把它纳入家庭总预算统一规划。',
  '竞标成功只说明我们最乐观，需按赢家诅咒重新校准估值。',
  'We won the contract because our proposal scored highest on the published criteria.',
  'The tax refund went straight into savings because windfalls should be budgeted like any other income.',
  'Money is money wherever it comes from; every dollar is the same.',
];

// ─── 豁免族（真实签名 + 各组豁免标记，不得命中；删除标记后应变红）──
// 让步/纠正：来源×消费许可签名在场，但规范处理被要求
const EXEMPT_CONCEDE = [
  '虽然这笔年终奖是意外之财、大家以为可以随便花，但我们仍按需规划每一笔支出。',
  'Although the bonus is found money and feels free, we still need to budget it like any other income.',
];
// 明确解耦：直接指出钱不分来源（含签名）
const EXEMPT_DECOUPLE = [
  '这笔年终奖是意外之财，但钱就是钱，不分来源，每一块钱都一样，花起来不必心疼。',
  'The bonus is found money and feels free, but money is money — every dollar is the same regardless of source.',
];
// 规范记账：消费被规范预算/储蓄框架承载（含签名）
const EXEMPT_ACCOUNT = [
  '这笔年终奖是意外之财，按理可以随便花，但我们仍纳入家庭总预算统一规划。',
  'The tax refund feels free and could be splurged, but it went straight into savings.',
];
// 元话语：引用本族名称 + 真实签名（教学/定义句）
const EXEMPT_META = [
  '心理账户是指像「年终奖是意外之财、可以随便花」这样把钱按来源区别对待的偏差。',
  'Mental accounting is when people treat a bonus as free money and splurge on it.',
];

// ─── 边界锁（既有维度领地/缺腿/否定句/规范记账/超距，不得命中）────
const BOUNDARY = [
  '已经投了这么多钱，现在放弃就前功尽弃了，必须继续做下去。',   // sunk_cost_coercion 领地（继续投入，无来源标签）
  '地震后重建拉动了GDP，但被挤占的机会成本没人算过。',           // broken_window 领地（可见收益，无来源标签）
  '预算就这么多，所以这个方案价值不高，不值得做。',             // budget_value_conflation 领地（预算→价值，无来源标签）
  '花起钱来不心疼，想买什么就买什么。',                         // 缺腿①（无来源标签）
  '这笔年终奖是意外之财，我打算仔细规划用途。',                   // 缺腿②（有来源标签，无消费许可语义）
  '竞标成功只说明我们最乐观，需重新校准估值。',                 // winner's curse 领地（竞价，无来源标签）
];
// 双腿超距（腿①在句首、腿②在句末，默认窗 ZH50 不命中）
const OVERDIST = '这笔年终奖是意外之财，' + 'x'.repeat(60) + '所以可以放心大胆地挥霍一把。';
// NOTCOUNT 族专攻样本（无 SPEND 型腿②，仅不计账语义 + 同句桥梁）
const NOTCOUNT_ONLY_ZH = '这笔是报销款，不计入成本，所以直接去买装备。';
const NOTCOUNT_ONLY_EN = 'The gift card is separate from my regular budget, so I went ahead and spent it.';

const MIXED = '这笔年终奖花起来不心疼；The bonus feels free, so I splurged on it.';
const MULTI_ZH = '年终奖花起来不心疼；报销的钱，不花白不花。';

console.log('mental-accounting（r235 心理账户）测试:');

check('模块导出与短输入安全', () => {
  assert.equal(typeof detectMentalAccounting, 'function');
  assert.equal(detectMentalAccounting('').hit, false);
  assert.equal(detectMentalAccounting(null).hit, false);
  assert.equal(detectMentalAccounting('短').hit, false);
});

check('攻击命中：中文 10 条', () => {
  for (const t of ATTACKS_ZH) {
    const r = detectMentalAccounting(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.equal(r.dimension, 'mental_accounting');
    assert.ok(r.score >= 0.6 && r.score <= 0.8, 'severity 档位: ' + t);
    assert.ok(r.details.length > 10, 'details 非空');
    assert.ok(r.evidence.length >= 1, 'evidence 非空');
    assert.ok(r.guidance.length > 20, 'guidance 非空');
  }
});

check('攻击命中：英文 6 条', () => {
  for (const t of ATTACKS_EN) {
    const r = detectMentalAccounting(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.ok(r.score >= 0.6 && r.score <= 0.8);
  }
});

check('良性零误伤：16 条', () => {
  for (const t of BENIGN) assert.equal(detectMentalAccounting(t).hit, false, '误伤: ' + t);
});

check('豁免族：让步纠正/明确解耦/规范记账/元话语（中英 8 条）', () => {
  for (const t of EXEMPT_CONCEDE.concat(EXEMPT_DECOUPLE, EXEMPT_ACCOUNT, EXEMPT_META)) {
    assert.equal(detectMentalAccounting(t).hit, false, '误伤: ' + t);
  }
});

check('边界锁：既有维度领地/缺腿/否定句/超距不判', () => {
  for (const t of BOUNDARY) assert.equal(detectMentalAccounting(t).hit, false, '误判: ' + t);
  assert.equal(detectMentalAccounting(OVERDIST).hit, false, '默认窗超距不命中');
});

check('NOTCOUNT 族：不计账语义 + 同句桥梁（中英 2 条命中）', () => {
  assert.equal(detectMentalAccounting(NOTCOUNT_ONLY_ZH).hit, true);
  assert.equal(detectMentalAccounting(NOTCOUNT_ONLY_EN).hit, true);
});

check('中英混排与多签名加分档', () => {
  const m = detectMentalAccounting(MIXED);
  assert.equal(m.hit, true, '混排应命中');
  assert.equal(m.count, 2, '中英双签名');
  assert.ok(Math.abs(m.score - 0.72) < 1e-9, '双签名加分档');
  const z = detectMentalAccounting(MULTI_ZH);
  assert.equal(z.hit, true);
  assert.equal(z.count, 2);
  assert.ok(Math.abs(z.score - 0.72) < 1e-9, '双签名加分档');
});

check('负例注入：六组腿族删除后攻击全部不再命中', () => {
  assert.equal(detectMentalAccounting(ATTACKS_ZH[0], { SOURCE_ZH: [] }).hit, false, '删来源标签ZH');
  assert.equal(detectMentalAccounting(ATTACKS_ZH[0], { SPEND_ZH: [] }).hit, false, '删消费许可ZH');
  assert.equal(detectMentalAccounting(NOTCOUNT_ONLY_ZH, { NOTCOUNT_ZH: [] }).hit, false, '删不计账ZH');
  assert.equal(detectMentalAccounting(ATTACKS_EN[0], { SOURCE_EN: [] }).hit, false, '删来源标签EN');
  assert.equal(detectMentalAccounting(ATTACKS_EN[0], { SPEND_EN: [] }).hit, false, '删消费许可EN');
  assert.equal(detectMentalAccounting(NOTCOUNT_ONLY_EN, { NOTCOUNT_EN: [] }).hit, false, '删不计账EN');
});

check('负例注入：四组豁免删除后豁免句变红（承重证明）', () => {
  assert.equal(detectMentalAccounting(EXEMPT_CONCEDE[0], { CONCEDE_ZH: NEVER }).hit, true, '删让步纠正ZH');
  assert.equal(detectMentalAccounting(EXEMPT_CONCEDE[1], { CONCEDE_EN: NEVER }).hit, true, '删让步纠正EN');
  assert.equal(detectMentalAccounting(EXEMPT_DECOUPLE[0], { DECOUPLE_ZH: NEVER }).hit, true, '删明确解耦ZH');
  assert.equal(detectMentalAccounting(EXEMPT_DECOUPLE[1], { DECOUPLE_EN: NEVER }).hit, true, '删明确解耦EN');
  assert.equal(detectMentalAccounting(EXEMPT_ACCOUNT[0], { ACCOUNT_ZH: NEVER }).hit, true, '删规范记账ZH');
  assert.equal(detectMentalAccounting(EXEMPT_ACCOUNT[1], { ACCOUNT_EN: NEVER }).hit, true, '删规范记账EN');
  assert.equal(detectMentalAccounting(EXEMPT_META[0], { META_ZH: NEVER }).hit, true, '删元话语ZH');
  assert.equal(detectMentalAccounting(EXEMPT_META[1], { META_EN: NEVER }).hit, true, '删元话语EN');
});

check('负例注入：距离窗承重（放大到 500 后长距句命中）', () => {
  assert.equal(detectMentalAccounting(OVERDIST).hit, false, '默认窗不命中');
  assert.equal(detectMentalAccounting(OVERDIST, { PAIR_ZH: 500 }).hit, true, '放大窗后命中');
});

check('引擎闸：良性样本不得以 mental_accounting 进 findings（含接线后守卫）', () => {
  const engine = require('../src/gate.js');
  const gate = engine.check || engine.gate || engine.checkOutput;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('mental_accounting'), '误伤: ' + t);
  }
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
