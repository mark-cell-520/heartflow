/**
 * test/incentive-blind-spot.test.js — r296 信息与激励盲区维度测试
 * 覆盖：三子族攻击命中（中英）、良性零误伤（含 10 条疑难 FP 压力样本）、
 * 纠偏豁免族（内嵌真实签名 + 豁免标记，可负例注入证明承重）、
 * 边界锁（既有维度领地/缺腿/翻转否定/超距）、
 * 中英混排多签名、负例注入（三子族两腿族删除/豁免删除/距离窗承重）、
 * 引擎闸良性守卫。
 * 与 r237-r295 模块同一测试范式：每个负例注入删除一组常量后，攻击必须
 * 不再命中、豁免句必须变红——证明每一组判据都真实承重。
 */
'use strict';
const assert = require('node:assert/strict');
const {
  detectAdverseSelection,
  detectMoralHazard,
  detectFreeRider,
  detectIncentiveBlindSpot,
} = require('../src/incentive-blind-spot.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// 永不命中的正则（用于负例注入关闭某组豁免/腿）
const NEVER = /(?!)/;

// ─── 攻击样本（应命中）────────────────────────────────────────
const ATTACKS = {
  adverse_selection: [
    // ZH
    '保险池自然会同时吸引低风险和高风险的人，这对保费没有影响。',
    '贷款会自然覆盖各种信用等级的借款人，所以坏账率不会有差别。',
    '医保把各类人群都纳入进来，风险分布相互抵消，统筹基金没有压力。',
    '二手车市场天然会聚拢各种车况的卖家，这对交易价格没有影响。',
    // EN
    'Insurance pools naturally attract a balanced mix of low and high risk people, so premiums stay stable.',
    'Loans naturally reach borrowers of every credit grade, so defaults will not differ.',
    'The used-car market brings in vehicles of every condition, which has no effect on prices.',
  ],
  moral_hazard: [
    // ZH
    '全额兜底不会让机构去承担更多风险。',
    '有了全额保险，人们开车不会有什么变化，该多小心还是多小心。',
    '失业金发得够高，也不会削弱求职者找工作的努力。',
    '政府注资之后，企业的经营方式不会有任何改变。',
    // EN
    'Full insurance coverage does not change how carefully people drive.',
    'Government bailouts will not affect future risk-taking by the banks.',
    'Generous unemployment benefits do not reduce the effort job seekers put into finding work.',
  ],
  free_rider: [
    // ZH
    '公共事务总会有人站出来管，我个人不用参与。',
    '别人会捐款的，我不用掏钱，坐享其成没什么丢人的。',
    '社区绿化是大伙的事，凭什么要我出面出力。',
    '团队项目总有人做，我用不着动手。',
    // EN
    "Someone else will always contribute to the public good, so I don't need to do my part.",
    'Others will donate to the community project, so I do not need to chip in.',
    'Every other tenant will handle the repairs, so why should I contribute?',
  ],
};

// ─── 良性样本（不得命中）──────────────────────────────────────
const BENIGN = [
  // 正确概念陈述（信息经济学正解）
  '保险市场存在逆选择，保险公司通过核保和免赔额来筛选风险。',
  '为防止逆选择，医保设置起付线和封顶线，按风险分层定价。',
  'The insurance market suffers from adverse selection, which underwriters mitigate with deductibles.',
  'Guard against adverse selection by screening applicants before underwriting the pool.',
  '保险行业存在道德风险，免赔额可以让投保人保持谨慎。',
  '全额赔付可能诱发道德风险，需要共付机制来对冲。',
  'Deposit insurance can create moral hazard, so regulators impose capital requirements.',
  'To mitigate moral hazard, the bailout came with strict conditions and clawbacks.',
  '公共事务需要大家共同参与，我也报名做了志愿者。',
  '为防止搭便车，业委会设计了按户分摊的强制缴费机制。',
  'The free-rider problem explains why public goods tend to be undersupplied.',
  'To combat free-riding, the club requires every member to contribute hours each month.',
  // 疑难良性（FP 压力）
  '保险公司今年推出了新的重疾险产品，覆盖一百种疾病。',
  '失业保险金的替代率设计要平衡保障水平与求职激励。',
  '有了保险之后，出门旅行更安心了。',
  '大家一起把社区建设得更好。',
  '政府为低保家庭提供补助，体现了兜底保障。',
  'The regulator requires insurers to file risk-based capital reports.',
  'Public transit reduces congestion and emissions in the metro area.',
  'The community garden is maintained by volunteers every weekend.',
  // 常规良性
  '根据成本加成定价，这批货的出厂价是每件三十七块五，含原材料、人工和合理利润。',
  '样本选择上我们只纳入了完成全程随访的患者，并用逆概率加权纠正了失访偏倚。',
  '结论：心虫引擎的辨别维度共 246 个，覆盖逻辑谬误、因果推理与统计素养等家族。',
  'The regression controls for age, income, and baseline health status.',
];

// ─── 豁免族：纠偏表述（内嵌真实签名 + 豁免标记，不得命中；删除标记后应变红）
const EXEMPT = [
  '为防范逆选择，精算假设要先验证：风险分布自然均衡、对保费没有影响，这类假设恰恰最危险。',
  'To guard against moral hazard, the memo assumes full coverage does not change driver behavior—an assumption worth stress-testing.',
];

// ─── 边界锁（既有维度领地/缺腿/翻转否定/超距，不得命中）────
const BOUNDARY = [
  '保险公司今年推出了新的重疾险产品，覆盖一百种疾病。',          // 缺腿②（只报保险事实）
  '这个结论对整体没有什么影响。',                                // 缺腿①（无池/兜底/集体语境）
  '全额兜底并非不会改变机构的风险承担。',                        // 翻转否定（并非）
  '兜底不等于不会改变行为，道德风险是真实存在的。',              // 翻转否定（不等于）
  'It is not that insurance fails to change behavior; moral hazard is real.', // EN 翻转
  '这项政策对大家都有好处，欢迎报名参与。',                      // 集体语境但无退出断言
  '公司今年加大了研发投入，政策扶持新兴产业。',                  // 完全无关
];
// 两腿超距（默认窗 ZH60 不命中；腿②不含腿①池名词）
const OVERDIST = '保险池的结构，' + '补'.repeat(70) + '这对统筹基金没有压力。';

const MIXED = '保险池自然会吸引各类风险的人，这对保费没有影响；Insurance pools naturally attract a balanced mix of low and high risk people, so premiums stay stable.';
const MULTI_ZH = '全额兜底不会让机构去承担更多风险；有了全额保险，人们开车不会有什么变化。';

console.log('incentive-blind-spot（r296 信息与激励盲区）测试:');

check('模块导出与短输入安全', () => {
  assert.equal(typeof detectAdverseSelection, 'function');
  assert.equal(typeof detectMoralHazard, 'function');
  assert.equal(typeof detectFreeRider, 'function');
  assert.equal(typeof detectIncentiveBlindSpot, 'function');
  for (const fn of [detectAdverseSelection, detectMoralHazard, detectFreeRider, detectIncentiveBlindSpot]) {
    assert.equal(fn('').hit, false);
    assert.equal(fn(null).hit, false);
    assert.equal(fn('短').hit, false);
  }
});

for (const [dim, list] of Object.entries(ATTACKS)) {
  check(`攻击命中：${dim} 中英 ${list.length} 条`, () => {
    for (const t of list) {
      const r = detectIncentiveBlindSpot(t);
      assert.equal(r.hit, true, '应命中: ' + t);
      assert.equal(r.dimension, dim, '维度归属: ' + t);
      assert.ok(r.score >= 0.6 && r.score <= 0.8, 'severity 档位: ' + t);
      assert.ok(r.details.length > 10, 'details 非空');
      assert.ok(r.evidence.length >= 1, 'evidence 非空');
      assert.ok(r.guidance.length > 20, 'guidance 非空');
    }
  });
}

check(`良性零误伤：${BENIGN.length} 条（含 10 条疑难 FP 压力样本）`, () => {
  for (const t of BENIGN) assert.equal(detectIncentiveBlindSpot(t).hit, false, '误伤: ' + t);
});

check('豁免族：纠偏表述（中英 2 条）', () => {
  for (const t of EXEMPT) assert.equal(detectIncentiveBlindSpot(t).hit, false, '误伤: ' + t);
});

check('边界锁：缺腿/翻转否定/超距不判', () => {
  for (const t of BOUNDARY) assert.equal(detectIncentiveBlindSpot(t).hit, false, '误判: ' + t);
  assert.equal(detectIncentiveBlindSpot(OVERDIST).hit, false, '默认窗超距不命中');
});

check('中英混排与多签名加分档', () => {
  const m = detectIncentiveBlindSpot(MIXED);
  assert.equal(m.hit, true, '混排应命中');
  assert.equal(m.dimension, 'adverse_selection');
  assert.ok(m.count >= 2, '中英双签名');
  const z = detectIncentiveBlindSpot(MULTI_ZH);
  assert.equal(z.hit, true);
  assert.ok(z.count >= 2, '多签名');
  assert.ok(Math.abs(z.score - 0.72) < 1e-9, '双签名加分档');
});

check('负例注入：三子族两腿族删除后攻击全部不再命中', () => {
  const INJ = [
    [detectAdverseSelection, ATTACKS.adverse_selection[0], 'POOL_ZH'],
    [detectAdverseSelection, ATTACKS.adverse_selection[0], 'NODISTORT_ZH'],
    [detectAdverseSelection, ATTACKS.adverse_selection[4], 'POOL_EN'],
    [detectAdverseSelection, ATTACKS.adverse_selection[4], 'NODISTORT_EN'],
    [detectMoralHazard, ATTACKS.moral_hazard[0], 'SHIELD_ZH'],
    [detectMoralHazard, ATTACKS.moral_hazard[0], 'NOCHANGE_ZH'],
    [detectMoralHazard, ATTACKS.moral_hazard[4], 'SHIELD_EN'],
    [detectMoralHazard, ATTACKS.moral_hazard[4], 'NOCHANGE_EN'],
    [detectFreeRider, ATTACKS.free_rider[0], 'COLLECTIVE_ZH'],
    [detectFreeRider, ATTACKS.free_rider[0], 'ABSTAIN_ZH'],
    [detectFreeRider, ATTACKS.free_rider[4], 'COLLECTIVE_EN'],
    [detectFreeRider, ATTACKS.free_rider[4], 'ABSTAIN_EN'],
  ];
  for (const [fn, text, key] of INJ) {
    const inject = {}; inject[key] = [];   // 删除该组腿（空数组）
    assert.equal(fn(text, inject).hit, false, `删 ${key} 后应不命中: ${text}`);
    const inject2 = {}; inject2[key] = NEVER; // 兼容 /(?!)/ 形态注入
    assert.equal(fn(text, inject2).hit, false, `删 ${key}（/(?!) 形态）后应不命中: ${text}`);
  }
});

check('负例注入：纠偏豁免删除后豁免句变红（承重证明）', () => {
  assert.equal(detectIncentiveBlindSpot(EXEMPT[0], { ANTIDOTE_ZH: NEVER }).hit, true, '删纠偏豁免ZH');
  assert.equal(detectIncentiveBlindSpot(EXEMPT[1], { ANTIDOTE_EN: NEVER }).hit, true, '删纠偏豁免EN');
});

check('负例注入：距离窗承重（放大到 500 后长距句命中）', () => {
  assert.equal(detectIncentiveBlindSpot(OVERDIST).hit, false, '默认窗不命中');
  assert.equal(detectIncentiveBlindSpot(OVERDIST, { PAIR_ZH: 500 }).hit, true, '放大窗后命中');
});

check('引擎闸：良性样本不得以三子族进 findings', () => {
  const engine = require('../src/gate.js');
  const gate = engine.check || engine.gate || engine.checkOutput;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension);
    for (const dim of ['adverse_selection', 'moral_hazard', 'free_rider']) {
      assert.ok(!dims.includes(dim), '误伤: ' + t);
    }
  }
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
