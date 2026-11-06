/**
 * test/p-hacking.test.js — r232 多重比较/数据挖掘维度测试
 * 覆盖：攻击命中（中英）、良性零误伤、五组豁免族、边界锁、负例注入。
 * 与 r228-r231 模块同一测试范式：每个负例注入删除一组常量后，
 * 攻击必须不再命中、豁免句必须变红——证明每一组判据都真实承重。
 */
'use strict';
const assert = require('node:assert/strict');
const { detectPHacking } = require('../src/p-hacking.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// ─── 攻击样本（应命中）────────────────────────────────────────
const ATTACKS_ZH = [
  '我们试了20种用户分组，终于发现95后用户的付费率显著更高。',
  '测试了30个参数组合，有一组p值终于小于0.05，说明策略有效。',
  '换了5种统计方法，其中一种显示结果显著，假设成立。',
  '调研了40个城市，挑出那个销售额大涨的城市作为证据。',
  '我们分析了上百个变量，终于找到与股价相关的那个指标。',
  '把数据按不同年龄段切了十几刀，有一组呈现出强相关。',
  '反复调整实验条件，第12次运行终于出现了我们预期的效应。',
  '在几十种配色方案中，有一种的转化率明显高，就用它。',
  '我们扫描了全部 subgroup，找到了那个支持结论的细分人群。',
  '试遍了各种统计口径，终于有一个能证明产品有效。',
];
const ATTACKS_EN = [
  'We tested twenty subgroups and finally found one with a significant effect.',
  'After trying thirty parameter combinations, one set finally gave p < 0.05.',
  'We reran the experiment twelve times until the expected effect appeared.',
  'Out of forty cities surveyed, one showed a big sales jump, proving the strategy works.',
];

// ─── 良性样本（不得命中）──────────────────────────────────────
const BENIGN = [
  '该药将风险从4%降到2%，相对降低50%，绝对下降2个百分点。',
  '感染率从万分之一上升到万分之二，绝对值仍然很低。',
  '我们预设了主要终点，只报告预设的那一个，不做事后挑选。',
  '我们对多重比较做了Bonferroni校正，显著性阈值调整为0.005。',
  '这个结论是在独立样本中重复验证过的，不是一次实验的偶然显著。',
  '样本只有30人，结论需更大规模研究确认。',
  '虽然只访谈了5位用户，但这是定性研究，只用于提出假设。',
  'The drug reduces risk from 4% to 2%, a 50% relative reduction.',
  'We corrected for multiple comparisons before reporting the result.',
  'The finding replicated in an independent sample.',
  '我们试了20种分组，没有一种显示显著相关。',
  '分析了上百个变量，未发现任何显著效应。',
  '我们做了一次实验，结果显著，论文已投稿。',
  '代码改了十几遍，终于跑通了全部测试。',
];

// ─── 豁免族（双腿齐备 + 各组豁免标记，不得命中）────────────────
const EXEMPT_PREREG = [
  '我们试了20种分组，终于发现主要终点显著——但这是预注册时预设的唯一终点，未做事后挑选。',
  'We tested twenty subgroups and finally found one with a significant effect — but that was the pre-registered primary endpoint.',
];
const EXEMPT_CORRECTION = [
  '换了5种统计方法，其中一种显示显著，我们按多重比较校正后阈值仍达标。',
  'We tried thirty parameter combinations and one set finally gave p < 0.05, but we corrected for multiple comparisons.',
];
const EXEMPT_REPLICATION = [
  '反复调整条件后第12次运行终于出现预期效应，但更换独立样本后稳定复现。',
  'We reran the experiment twelve times until the expected effect appeared, and the finding replicated in an independent sample.',
];
const EXEMPT_DISAVOW = [
  '试了20种分组，终于有一个显著，但避免数据挖掘是基本纪律，必须报告全部搜索空间。',
  'We tested twenty subgroups and finally found one significant, but no data dredging — we report the full search space.',
];
const EXEMPT_META = [
  '把「试了20种终于显著」当成证据，是 p-hacking 的典型表现。',
  'P-hacking is what you call testing twenty subgroups and finally reporting only the significant one.',
];

// ─── 边界锁（既有维度领地/缺腿/超窗，不得命中）────────────────
const BOUNDARY = [
  '我们只引用了那些支持我们假设的研究，这证明理论是正确的。',                    // cherry_picking 领地
  'We only cited the studies that supported our hypothesis, which proves the theory is correct.', // cherry_picking 领地 EN
  '随机数据里也能看出规律，这不是巧合。',                                        // clustering_illusion 领地
  '采访了3个用户，100%都说好用，产品肯定没问题。',                               // hasty_generalization 领地
  '结果终于显著了，假设成立。',                                                  // 无腿①
  '我们试了20种分组方式。',                                                      // 无腿②
  '我们试了20种用户分组方式，从年龄段、地域、消费频次、活跃时段、设备类型到会员等级逐一翻了个底朝天，每一种组合的结果都记在了附录A的附表里供事后查阅，团队会议上大家逐条讨论过所有呈现出来的数字，最后终于发现95后群体的付费率显著更高。', // 双腿超距
];

const MIXED = '我们试了20种分组，终于发现95后付费率显著更高；We tested twenty subgroups and finally found one significant.';
const MULTI_ZH = '我们试了20种用户分组，终于发现95后付费率显著更高；换了5种统计口径，其中一种显示结果显著。';

console.log('p-hacking（r232 多重比较/数据挖掘）测试:');

check('模块导出与短输入安全', () => {
  assert.equal(typeof detectPHacking, 'function');
  assert.equal(detectPHacking('').hit, false);
  assert.equal(detectPHacking(null).hit, false);
  assert.equal(detectPHacking('短').hit, false);
});

check('攻击命中：中文 10 条', () => {
  for (const t of ATTACKS_ZH) {
    const r = detectPHacking(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.equal(r.dimension, 'p_hacking');
    assert.ok(r.score >= 0.6 && r.score <= 0.8, 'severity 档位: ' + t);
    assert.ok(r.details.length > 10, 'details 非空');
    assert.ok(r.evidence.length >= 1, 'evidence 非空');
    assert.ok(r.guidance.length > 20, 'guidance 非空');
  }
});

check('攻击命中：英文 4 条', () => {
  for (const t of ATTACKS_EN) {
    const r = detectPHacking(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.ok(r.score >= 0.6 && r.score <= 0.8);
  }
});

check('良性零误伤：14 条', () => {
  for (const t of BENIGN) assert.equal(detectPHacking(t).hit, false, '误伤: ' + t);
});

check('豁免族：预注册/校正/复现/纪律否定/元话语（中英 10 条）', () => {
  for (const t of EXEMPT_PREREG.concat(EXEMPT_CORRECTION, EXEMPT_REPLICATION, EXEMPT_DISAVOW, EXEMPT_META)) {
    assert.equal(detectPHacking(t).hit, false, '误伤: ' + t);
  }
});

check('边界锁：既有维度领地/缺腿/超距不判', () => {
  for (const t of BOUNDARY) assert.equal(detectPHacking(t).hit, false, '误判: ' + t);
});

check('中英混排与多签名加分档', () => {
  const m = detectPHacking(MIXED);
  assert.equal(m.hit, true, '混排应命中');
  assert.equal(m.count, 2, '中英双签名');
  assert.ok(Math.abs(m.score - 0.75) < 1e-9, '双签名加分档');
  const z = detectPHacking(MULTI_ZH);
  assert.equal(z.hit, true);
  assert.equal(z.count, 2);
  assert.ok(Math.abs(z.score - 0.75) < 1e-9, '双签名加分档');
});

check('负例注入：六组腿族删除后攻击全部不再命中', () => {
  // 每组只注入单一空数组（不混入其他腿族删除），确保断言失败原因唯一
  assert.equal(detectPHacking(ATTACKS_ZH[1], { SEARCH_ZH: [] }).hit, false);
  assert.equal(detectPHacking(ATTACKS_EN[0], { SEARCH_EN: [] }).hit, false);
  assert.equal(detectPHacking(ATTACKS_ZH[0], { WINNER_ZH: [] }).hit, false);
  assert.equal(detectPHacking(ATTACKS_EN[0], { WINNER_EN: [] }).hit, false);
  assert.equal(detectPHacking(ATTACKS_ZH[0], { SIGNIF_ZH: [] }).hit, false);
  assert.equal(detectPHacking(ATTACKS_EN[0], { SIGNIF_EN: [] }).hit, false);
});

check('负例注入：五组豁免删除后豁免句变红', () => {
  assert.equal(detectPHacking(EXEMPT_PREREG[0], { EXEMPT_PREREG_ZH: [] }).hit, true);
  assert.equal(detectPHacking(EXEMPT_PREREG[1], { EXEMPT_PREREG_EN: [] }).hit, true);
  assert.equal(detectPHacking(EXEMPT_CORRECTION[0], { EXEMPT_CORRECTION_ZH: [] }).hit, true);
  assert.equal(detectPHacking(EXEMPT_CORRECTION[1], { EXEMPT_CORRECTION_EN: [] }).hit, true);
  assert.equal(detectPHacking(EXEMPT_REPLICATION[0], { EXEMPT_REPLICATION_ZH: [] }).hit, true);
  assert.equal(detectPHacking(EXEMPT_REPLICATION[1], { EXEMPT_REPLICATION_EN: [] }).hit, true);
  assert.equal(detectPHacking(EXEMPT_DISAVOW[0], { EXEMPT_DISAVOW_ZH: [] }).hit, true);
  assert.equal(detectPHacking(EXEMPT_DISAVOW[1], { EXEMPT_DISAVOW_EN: [] }).hit, true);
  assert.equal(detectPHacking(EXEMPT_META[0], { EXEMPT_META_ZH: [] }).hit, true);
  assert.equal(detectPHacking(EXEMPT_META[1], { EXEMPT_META_EN: [] }).hit, true);
});

check('负例注入：距离窗承重（放大到 120 后长距句命中）', () => {
  assert.equal(detectPHacking(BOUNDARY[6]).hit, false, '默认窗不命中');
  assert.equal(detectPHacking(BOUNDARY[6], { WIN_PAIR_ZH: 120 }).hit, true, '放大窗后命中');
});

check('引擎闸：良性样本不得以 p_hacking 进 findings', () => {
  const engine = require('../src/gate.js');
  const gate = engine.check || engine.gate || engine.checkOutput;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('p_hacking'), '误伤: ' + t);
  }
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
