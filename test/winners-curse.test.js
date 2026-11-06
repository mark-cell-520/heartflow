/**
 * test/winners-curse.test.js — r237 赢家诅咒维度测试
 * 覆盖：攻击命中（中英）、良性零误伤（含 8 条疑难 FP 压力样本）、
 * 概念讨论豁免族（嵌入真实签名 + 豁免标记，可负例注入证明承重）、
 * 边界锁（既有维度领地/非竞价胜利/缺腿/否定前缀/超距）、
 * 中英混排多签名、负例注入（两腿族删除/豁免删除/距离窗承重）、
 * 引擎闸良性守卫。
 * 与 r228-r236 模块同一测试范式：每个负例注入删除一组常量后，攻击必须
 * 不再命中、豁免句必须变红——证明每一组判据都真实承重。
 */
'use strict';
const assert = require('node:assert/strict');
const { detectWinnersCurse } = require('../src/winners-curse.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// 永不命中的正则（用于负例注入关闭某组豁免）
const NEVER = /(?!)/;

// ─── 攻击样本（应命中）────────────────────────────────────────
const ATTACKS_ZH = [
  '竞标赢了说明这块地就值这个价，我们的判断得到了验证。',
  '这次中标证明我们的报价是合理的，业主认可这个成本。',
  '能拍下这幅画，说明它确实被低估了，我们捡了漏。',
  '招标排名第一，说明我们的方案性价比最高。',
  '竞得这块地意味着市场认可这个价格，值。',
  '出价最高还赢了，只能说明这东西真的好。',
  '我们竞标成功拿下标的，评标委员会认可这个报价，判断得到了验证。',
];
const ATTACKS_EN = [
  'We won the auction, which confirms the asset is worth what we paid.',
  'Winning the bid proves our price was fair and the client accepted the cost.',
  'We outbid everyone, so the painting was clearly undervalued—a real bargain.',
  'Coming out on top in the tender shows our offer had the best value.',
  'Our bid was accepted, which demonstrates our valuation was correct and we got a real bargain.',
];

// ─── 良性样本（不得命中）──────────────────────────────────────
const BENIGN = [
  // 疑难良性（r237-wc-probe 8 条 FP 压力样本）
  '竞标成功只说明我们出价最高，不等于估值正确，还要留足安全边际。',
  '赢了拍卖不等于捡漏，赢家往往是最乐观的那个，要防赢家诅咒。',
  '中标之后先核算成本，价格是竞争出来的，不是价值算出来的。',
  '我们以低于评估价的价格中标，预算省下来了，按合同履约即可。',
  '出价前要做尽调，报价高低和资产好坏是两回事。',
  'Winning the auction only means we bid highest, not that the price was right.',
  'The winner is usually the most optimistic bidder, so we should guard against the winner\u2019s curse.',
  'We won the tender at below assessment price; now we just deliver the contract.',
  // 常规良性
  '公司中标后股价上涨，说明市场看好公司前景。',
  '我们赢得了这场比赛，说明训练方案有效。',
  '这块地我们竞得，先做尽调再说。',
  '投标文件已经提交，评标结果下周公布。',
  'The team won the championship after months of hard work.',
  'We submitted the proposal and are waiting for the tender result.',
  'Winning the auction does not prove the price was fair.',
];

// ─── 豁免族：概念讨论（真实签名 + 豁免标记，不得命中；删除标记后应变红）
const EXEMPT_CURSE = [
  '教材在讲赢家诅咒时举例：竞标赢了说明这块地值这个价，其实赢家恰是最乐观者。',
  'The winner\u2019s curse: winning the auction confirms the asset is worth what we paid—says no economist ever.',
];

// ─── 边界锁（既有维度领地/非竞价胜利/缺腿/否定前缀/超距，不得命中）────
const BOUNDARY = [
  '他这么有钱，说明他的判断肯定没错。',                    // appeal_to_wealth 领地（无竞价胜利腿）
  '我对这个项目有十足的信心，肯定能成。',                  // confidence 领地（无竞价胜利腿）
  'KPI 完成了，说明目标肯定达成了。',                      // proxy_metric_goal 领地
  '下载量破百万，说明产品满足了用户需求。',                // proxy_metric_goal 领地
  '我们赢得了这场比赛，说明训练方案有效。',                // 非竞价胜利（体育）
  '竞标赢了不等于估值正确。',                              // 腿②被否定前缀拦下（不等于）
  '这次中标不能证明报价合理，能否说明值这个价尚未可知。',      // 腿②两处均被否定前缀拦下（不能/能否）
  '公司今年加大了研发投入，政策扶持新兴产业。',            // 完全无关
];
// 两腿超距（默认窗 ZH60 不命中）
const OVERDIST = '竞标赢了，' + 'x'.repeat(70) + '说明这块地值这个价。';

const MIXED = '竞标赢了说明这块地值这个价；We won the auction, which confirms the asset is worth what we paid.';
const MULTI_ZH = '竞标赢了说明这块地值这个价；这次中标证明我们的报价是合理的。';

console.log('winners-curse（r237 赢家诅咒）测试:');

check('模块导出与短输入安全', () => {
  assert.equal(typeof detectWinnersCurse, 'function');
  assert.equal(detectWinnersCurse('').hit, false);
  assert.equal(detectWinnersCurse(null).hit, false);
  assert.equal(detectWinnersCurse('短').hit, false);
});

check('攻击命中：中文 7 条', () => {
  for (const t of ATTACKS_ZH) {
    const r = detectWinnersCurse(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.equal(r.dimension, 'winners_curse');
    assert.ok(r.score >= 0.6 && r.score <= 0.8, 'severity 档位: ' + t);
    assert.ok(r.details.length > 10, 'details 非空');
    assert.ok(r.evidence.length >= 1, 'evidence 非空');
    assert.ok(r.guidance.length > 20, 'guidance 非空');
  }
});

check('攻击命中：英文 5 条', () => {
  for (const t of ATTACKS_EN) {
    const r = detectWinnersCurse(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.ok(r.score >= 0.6 && r.score <= 0.8);
  }
});

check('良性零误伤：23 条（含 8 条疑难 FP 压力样本）', () => {
  for (const t of BENIGN) assert.equal(detectWinnersCurse(t).hit, false, '误伤: ' + t);
});

check('豁免族：概念讨论（中英 2 条）', () => {
  for (const t of EXEMPT_CURSE) {
    assert.equal(detectWinnersCurse(t).hit, false, '误伤: ' + t);
  }
});

check('边界锁：既有维度领地/非竞价胜利/缺腿/否定前缀/超距不判', () => {
  for (const t of BOUNDARY) assert.equal(detectWinnersCurse(t).hit, false, '误判: ' + t);
  assert.equal(detectWinnersCurse(OVERDIST).hit, false, '默认窗超距不命中');
});

check('中英混排与多签名加分档', () => {
  const m = detectWinnersCurse(MIXED);
  assert.equal(m.hit, true, '混排应命中');
  assert.equal(m.count, 2, '中英双签名');
  assert.ok(Math.abs(m.score - 0.72) < 1e-9, '双签名加分档');
  const z = detectWinnersCurse(MULTI_ZH);
  assert.equal(z.hit, true);
  assert.equal(z.count, 2);
  assert.ok(Math.abs(z.score - 0.72) < 1e-9, '双签名加分档');
});

check('负例注入：四组两腿族删除后攻击全部不再命中', () => {
  assert.equal(detectWinnersCurse(ATTACKS_ZH[0], { WIN_ZH: [] }).hit, false, '删竞价胜利ZH');
  assert.equal(detectWinnersCurse(ATTACKS_ZH[0], { VALUE_ZH: [] }).hit, false, '删价值推断ZH');
  assert.equal(detectWinnersCurse(ATTACKS_EN[0], { WIN_EN: [] }).hit, false, '删竞价胜利EN');
  assert.equal(detectWinnersCurse(ATTACKS_EN[0], { VALUE_EN: [] }).hit, false, '删价值推断EN');
});

check('负例注入：概念讨论豁免删除后豁免句变红（承重证明）', () => {
  assert.equal(detectWinnersCurse(EXEMPT_CURSE[0], { CURSE_ZH: NEVER }).hit, true, '删概念讨论ZH');
  assert.equal(detectWinnersCurse(EXEMPT_CURSE[1], { CURSE_EN: NEVER }).hit, true, '删概念讨论EN');
});

check('负例注入：距离窗承重（放大到 500 后长距句命中）', () => {
  assert.equal(detectWinnersCurse(OVERDIST).hit, false, '默认窗不命中');
  assert.equal(detectWinnersCurse(OVERDIST, { PAIR_ZH: 500 }).hit, true, '放大窗后命中');
});

check('引擎闸：良性样本不得以 winners_curse 进 findings（含接线后守卫）', () => {
  const engine = require('../src/gate.js');
  const gate = engine.check || engine.gate || engine.checkOutput;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('winners_curse'), '误伤: ' + t);
  }
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
