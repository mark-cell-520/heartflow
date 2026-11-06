/**
 * test/perverse-incentive.test.js — r236 激励反噬维度测试
 * 覆盖：攻击命中（中英）、良性零误伤（含 12 条疑难 FP 压力样本）、
 * 两组豁免族（问题化/批评、元话语，均以「嵌入真实签名 + 豁免标记」构造，
 * 可负例注入证明承重）、边界锁（既有维度领地/缺腿/否定前缀/超距）、
 * 中英混排多签名、负例注入（三腿族删除/豁免删除/距离窗承重）、
 * 引擎闸良性守卫。
 * 与 r228-r235 模块同一测试范式：每个负例注入删除一组常量后，攻击必须
 * 不再命中、豁免句必须变红——证明每一组判据都真实承重。
 */
'use strict';
const assert = require('node:assert/strict');
const { detectPerverseIncentive } = require('../src/perverse-incentive.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// 永不命中的正则（用于负例注入关闭某组豁免）
const NEVER = /(?!)/;

// ─── 攻击样本（应命中）────────────────────────────────────────
const ATTACKS_ZH = [
  '悬赏捕蛇效果好，村民养的蛇交上来，赏金照发，蛇患很快缓解。',
  '按销量发奖金最能调动积极性，员工自己进货刷单也算业绩，双赢。',
  '按罚款次数收费之后，企业包月违规，财政收入反而增加了，这说明制度设计成功。',
  '保险公司按结案数量考核，理赔员专挑简单案子先结，整体效率明显提升。',
  '学校按升学率给奖金，老师们只盯着可能上榜的学生，整体成绩稳步提高。',
  '按抓到的老鼠数量计酬，员工偷偷放鼠再抓，捕鼠指标月月超额完成。',
  '镇上悬赏灭鼠，有人干脆养起老鼠来，交一头领一份赏，鼠患迎刃而解。',
  '分公司按合同数提成，大家一案拆成三案来报，指标年年超额完成。',
];
const ATTACKS_EN = [
  'Bounty programs work: villagers bred the snakes, handed them in, and collected the reward as intended.',
  'Paying per rat caught boosted results — workers released rats and recaptured them, hitting their quotas.',
  'The firm pays a bonus tied to sales volume, so reps bought their own products; revenue increased, a win-win.',
  'Fined per violation, the company just bought a monthly pass and violations went up, but collections rose.',
  'Insurers pay per claim closed, so adjusters cherry-picked the easy cases and hit their quotas every month.',
  'Schools get a bonus for each student above the cutoff, so teachers cherry-picked the easy cases and scores improved.',
];

// ─── 良性样本（不得命中）──────────────────────────────────────
const BENIGN = [
  // 疑难良性（r236-fp-stress 12 条：问题化/防范/改革/元话语）
  '悬赏捕蛇导致村民养蛇领赏，政策适得其反，已被叫停。',
  '按次数罚款会诱导企业包月违规，这是制度设计的漏洞。',
  '设计量化考核时要预防刷单和数字造假。',
  '保险公司已改为按结案质量而非数量考核。',
  '包月违规是对按次罚款制度的正当批评。',
  '悬赏捕蛇是激励反噬的经典案例。',
  'Perverse incentives arise when the reward pays for the wrong behavior.',
  'The bounty backfired: villagers bred snakes to collect the reward, so the program was canceled.',
  '虽然按结案数量考核提高了效率，但专挑简单案子的问题需要防范。',
  '按销量发奖金没问题，只要同时严查自己进货刷单的行为。',
  '员工自己进货刷单属于欺诈，应依法处理并追回奖金。',
  '悬赏捕蛇后村民养蛇领赏，赏金政策被迫终止。',
  // 常规良性
  '公司今年加大了研发投入，政策扶持新兴产业。',
  '我们按项目里程碑结项，未设计数奖金。',
  '严格执法杜绝了违规现象，罚款次数逐年下降。',
  '绩效奖金与客户满意度挂钩，而不是与结案数量挂钩。',
  '合理的计件工资能提高生产效率，这是管理学常识。',
  'The team hit its quarterly targets after months of hard work.',
  'We pay per hour, not per unit, so there is no incentive to rush.',
  'Audits found the numbers were padded, and the program was shut down.',
  'The new quota system reduced processing time without any gaming.',
];

// ─── 豁免族（真实签名 + 各组豁免标记，不得命中；删除标记后应变红）──
// 问题化/批评：三腿签名在场，但说话者已指出激励扭曲
const EXEMPT_PROBLEM = [
  '悬赏捕蛇赏金照发、效率提升，但村民养蛇领赏说明政策适得其反，已被叫停。',
  'The bounty paid out in full and results improved, but villagers bred snakes, so the program backfired and was canceled.',
];
// 元话语：引用本族名称 + 真实签名（教学/定义句）
const EXEMPT_META = [
  '教材在讲激励反噬时举例：悬赏捕蛇、赏金照发，有人养蛇来交，蛇患迎刃而解。',
  'A cobra effect example: a bounty paid per snake, so villagers bred snakes and handed them in, and the bounty was paid as intended.',
];

// ─── 边界锁（既有维度领地/缺腿/否定前缀/超距，不得命中）────
const BOUNDARY = [
  '已经投了这么多钱，现在放弃就前功尽弃了，必须继续做下去。',   // sunk_cost_coercion 领地（继续投入，无激励设计）
  'KPI 完成了，说明目标肯定达成了。',                            // proxy_metric_goal 领地（无激励设计/反向行为）
  '我们把考核指标换成了留存率，而不是下载量。',                  // reward_hacking 领地（自认式换指标，无反向行为滋生）
  '下载量破百万，说明产品满足了用户需求。',                      // proxy_metric_goal 领地
  '今年开会三十次，走访了两百户，工作推进得很顺利。',            // activity_outcome_confusion 领地
  '按数量发奖金，调动了大家的积极性。',                          // 缺腿②（无反向行为）
  '员工自己进货刷单，属于欺诈行为。',                            // 缺腿①腿③（无激励设计、无认可）
  '效率明显提升，产能翻了一倍。',                                // 缺腿①腿②
  '按销量发奖金，员工自己进货刷单，效率并未提升。',              // 腿③被否定前缀拦下（并未）
  '按销量发奖金，但要严查自己进货刷单，效率才能真实提升。',      // 腿②被否定前缀拦下（严查）
];
// 三腿超距（默认窗 ZH60 不命中）
const OVERDIST = '悬赏捕蛇，' + 'x'.repeat(70) + '员工自己进货刷单，' + 'x'.repeat(70) + '效率明显提升。';

const MIXED = '悬赏捕蛇赏金照发，养的蛇交上来，效率明显提升；Paying per rat caught boosted results, workers released rats and recaptured them, hitting their quotas.';
const MULTI_ZH = '悬赏捕蛇赏金照发，效率明显提升；按销量发奖金，员工自己进货刷单，双赢。';

console.log('perverse-incentive（r236 激励反噬）测试:');

check('模块导出与短输入安全', () => {
  assert.equal(typeof detectPerverseIncentive, 'function');
  assert.equal(detectPerverseIncentive('').hit, false);
  assert.equal(detectPerverseIncentive(null).hit, false);
  assert.equal(detectPerverseIncentive('短').hit, false);
});

check('攻击命中：中文 8 条', () => {
  for (const t of ATTACKS_ZH) {
    const r = detectPerverseIncentive(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.equal(r.dimension, 'perverse_incentive');
    assert.ok(r.score >= 0.6 && r.score <= 0.8, 'severity 档位: ' + t);
    assert.ok(r.details.length > 10, 'details 非空');
    assert.ok(r.evidence.length >= 1, 'evidence 非空');
    assert.ok(r.guidance.length > 20, 'guidance 非空');
  }
});

check('攻击命中：英文 6 条', () => {
  for (const t of ATTACKS_EN) {
    const r = detectPerverseIncentive(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.ok(r.score >= 0.6 && r.score <= 0.8);
  }
});

check('良性零误伤：21 条（含 12 条疑难 FP 压力样本）', () => {
  for (const t of BENIGN) assert.equal(detectPerverseIncentive(t).hit, false, '误伤: ' + t);
});

check('豁免族：问题化/元话语（中英 4 条）', () => {
  for (const t of EXEMPT_PROBLEM.concat(EXEMPT_META)) {
    assert.equal(detectPerverseIncentive(t).hit, false, '误伤: ' + t);
  }
});

check('边界锁：既有维度领地/缺腿/否定前缀/超距不判', () => {
  for (const t of BOUNDARY) assert.equal(detectPerverseIncentive(t).hit, false, '误判: ' + t);
  assert.equal(detectPerverseIncentive(OVERDIST).hit, false, '默认窗超距不命中');
});

check('中英混排与多签名加分档', () => {
  const m = detectPerverseIncentive(MIXED);
  assert.equal(m.hit, true, '混排应命中');
  assert.equal(m.count, 2, '中英双签名');
  assert.ok(Math.abs(m.score - 0.72) < 1e-9, '双签名加分档');
  const z = detectPerverseIncentive(MULTI_ZH);
  assert.equal(z.hit, true);
  assert.equal(z.count, 2);
  assert.ok(Math.abs(z.score - 0.72) < 1e-9, '双签名加分档');
});

check('负例注入：六组三腿族删除后攻击全部不再命中', () => {
  assert.equal(detectPerverseIncentive(ATTACKS_ZH[0], { INCENTIVE_ZH: [] }).hit, false, '删激励设计ZH');
  assert.equal(detectPerverseIncentive(ATTACKS_ZH[0], { GAMING_ZH: [] }).hit, false, '删反向行为ZH');
  assert.equal(detectPerverseIncentive(ATTACKS_ZH[0], { ENDORSE_ZH: [] }).hit, false, '删认可断言ZH');
  assert.equal(detectPerverseIncentive(ATTACKS_EN[0], { INCENTIVE_EN: [] }).hit, false, '删激励设计EN');
  assert.equal(detectPerverseIncentive(ATTACKS_EN[0], { GAMING_EN: [] }).hit, false, '删反向行为EN');
  assert.equal(detectPerverseIncentive(ATTACKS_EN[0], { ENDORSE_EN: [] }).hit, false, '删认可断言EN');
});

check('负例注入：两组豁免删除后豁免句变红（承重证明）', () => {
  assert.equal(detectPerverseIncentive(EXEMPT_PROBLEM[0], { PROBLEM_ZH: NEVER }).hit, true, '删问题化ZH');
  assert.equal(detectPerverseIncentive(EXEMPT_PROBLEM[1], { PROBLEM_EN: NEVER }).hit, true, '删问题化EN');
  assert.equal(detectPerverseIncentive(EXEMPT_META[0], { META_ZH: NEVER }).hit, true, '删元话语ZH');
  assert.equal(detectPerverseIncentive(EXEMPT_META[1], { META_EN: NEVER }).hit, true, '删元话语EN');
});

check('负例注入：距离窗承重（放大到 500 后长距句命中）', () => {
  assert.equal(detectPerverseIncentive(OVERDIST).hit, false, '默认窗不命中');
  assert.equal(detectPerverseIncentive(OVERDIST, { PAIR_ZH: 500 }).hit, true, '放大窗后命中');
});

check('引擎闸：良性样本不得以 perverse_incentive 进 findings（含接线后守卫）', () => {
  const engine = require('../src/gate.js');
  const gate = engine.check || engine.gate || engine.checkOutput;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('perverse_incentive'), '误伤: ' + t);
  }
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
