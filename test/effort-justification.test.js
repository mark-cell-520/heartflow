/**
 * test/effort-justification.test.js — r234 努力正当化维度测试
 * 覆盖：攻击命中（中英）、良性零误伤、四组豁免族（让步举证/明确解耦/
 * 独立举证/元话语，均以"嵌入真实签名 + 豁免标记"构造，可负例注入证明
 * 承重）、边界锁（既有维度领地/缺腿/成就动词/超距）、中英混排多签名、
 * 负例注入（腿族删除/豁免删除/距离窗承重）、引擎闸良性守卫。
 * 与 r228-r233 模块同一测试范式：每个负例注入删除一组常量后，攻击必须
 * 不再命中、豁免句必须变红——证明每一组判据都真实承重。
 */
'use strict';
const assert = require('node:assert/strict');
const { detectEffortJustification } = require('../src/effort-justification.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// 永不命中的正则（用于负例注入关闭某组豁免）
const NEVER = /(?!)/;

// ─── 攻击样本（应命中）────────────────────────────────────────
const ATTACKS_ZH = [
  '我们熬了几个月做出来的方案，质量肯定没问题。',
  '投入了这么多研发经费，产品不可能失败。',
  '团队这么努力，成绩一定好。',
  '他为这个课题呕心沥血多年，结论想必是对的。',
  '模型耗费了巨量算力训练这么久，结果质量一定高。',
  '我们夜以继日奋战数月，这个设计肯定是靠谱的。',
  '砸了这么多钱下去，这东西不可能错。',
  '大家拼了命赶工，成果必然错不了。',
  '深耕这个领域十几年，我们的判断肯定是对的。',
  '花了这么大精力打磨，答案一定是正确的。',
];
const ATTACKS_EN = [
  'We worked on this for months, so it has to be correct.',
  'After all that effort, the conclusion has to be sound.',
  'They poured their blood, sweat, and tears into it, so the design must be reliable.',
  'We invested so much time and resources, therefore the product cannot be wrong.',
  'Countless sleepless nights went into this, so the result is certainly right.',
];

// ─── 良性样本（不得命中）──────────────────────────────────────
const BENIGN = [
  '团队攻坚三个月，独立第三方测试全部通过，产品质量可靠。',
  '虽然投入了大量精力，但方案仍需通过 A/B 实验验证才能上线。',
  '我们做了充分的市场调研和用户访谈，据此判断产品有市场。',
  '模型在标准 benchmark 上达到了 95% 准确率。',
  '反复实验上千次，数据表明这个配方是稳定的。',
  '花时间多少和结论正不正确没有必然联系，要看证据。',
  '参考文献综述显示，多数研究支持这一结论。',
  '经过同行评议，这篇论文的结论被认为是可靠的。',
  '我们为这个项目投入了很多精力，但还在评估阶段。',
  '团队熬了好几个通宵，目前正在排查问题。',
  '经过反复试验，我们终于实现了目标精度。',
  'We ran extensive tests and the benchmark numbers confirm the system is reliable.',
  'The team worked hard and the product passed all certifications.',
];

// ─── 豁免族（真实签名 + 各组豁免标记，不得命中；删除标记后应变红）──
// 让步/举证：努力×推断性质量签名在场，但质量被要求独立验证
const EXEMPT_CONCEDE = [
  '我们虽然熬了几个月、容易以为质量肯定没问题，但仍需独立测试验证才能定论。',
  'Although we poured months into it and it must be right, we still need to validate it independently.',
];
// 明确解耦：直接指出投入与质量/对错无关（含签名）
const EXEMPT_DECOUPLE = [
  '我们熬了几个月，但精力投入和质量高低没有必然联系，不能说质量肯定对。',
  'We invested so much time, so it must be correct, but effort has no bearing on correctness.',
];
// 独立举证：质量由测试/验证承载，而非付出（含签名）
const EXEMPT_EVIDENCE = [
  '我们熬了几个月，经第三方测试合格，质量肯定可靠。',
  'We worked for months, and it passed the benchmark tests, so it is certainly reliable.',
];
// 元话语：引用本族名称 + 真实签名（教学/定义句）
const EXEMPT_META = [
  '努力正当化是指像"熬了几个月所以质量肯定没问题"这样把投入当成质量证据的谬误。',
  'The IKEA effect is when people treat "we worked for months so it must be correct" as proof of quality.',
];

// ─── 边界锁（既有维度领地/缺腿/成就动词/超距，不得命中）────────
const BOUNDARY = [
  '已经投了这么多钱，现在放弃就前功尽弃了，必须继续做下去。',   // sunk_cost 领地（继续投入，无质量推论）
  '这位诺贝尔奖得主说这个结论是对的，所以可信。',               // appeal_to_authority 领地（人类权威，非付出）
  '这个方案质量肯定没问题。',                                   // 缺腿①（无投入锚点）
  '我们为这个项目投入了大量精力。',                             // 缺腿②（有投入，无推断性质量结论）
  '经过反复试验，我们终于实现了高精度。',                       // 成就动词（终于实现，非"付出→质量"推论）
  '他准备得很充分，而且实验数据也支持这个结论。',               // 正当举证（数据支持，非付出推断）
];
// 双腿超距（腿①在句首、腿②在句末，默认窗 ZH50 不命中）
const OVERDIST = '我们为了这个方案呕心沥血、日夜奋战，经历了无数次推翻重来；与此同时，团队在需求分析、架构设计、代码实现、性能调优、安全加固等方方面面都下足了功夫，每一个环节都反复推敲、精益求精，力求尽善尽美，所以最终交付的这套系统质量肯定是过硬的、靠谱的。';

const MIXED = '我们熬了几个月，质量肯定没问题；We worked for months, so it has to be correct.';
const MULTI_ZH = '团队这么努力，成绩一定好；投入这么多经费，产品不可能失败。';

console.log('effort-justification（r234 努力正当化）测试:');

check('模块导出与短输入安全', () => {
  assert.equal(typeof detectEffortJustification, 'function');
  assert.equal(detectEffortJustification('').hit, false);
  assert.equal(detectEffortJustification(null).hit, false);
  assert.equal(detectEffortJustification('短').hit, false);
});

check('攻击命中：中文 10 条', () => {
  for (const t of ATTACKS_ZH) {
    const r = detectEffortJustification(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.equal(r.dimension, 'effort_justification');
    assert.ok(r.score >= 0.6 && r.score <= 0.8, 'severity 档位: ' + t);
    assert.ok(r.details.length > 10, 'details 非空');
    assert.ok(r.evidence.length >= 1, 'evidence 非空');
    assert.ok(r.guidance.length > 20, 'guidance 非空');
  }
});

check('攻击命中：英文 5 条', () => {
  for (const t of ATTACKS_EN) {
    const r = detectEffortJustification(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.ok(r.score >= 0.6 && r.score <= 0.8);
  }
});

check('良性零误伤：13 条', () => {
  for (const t of BENIGN) assert.equal(detectEffortJustification(t).hit, false, '误伤: ' + t);
});

check('豁免族：让步举证/明确解耦/独立举证/元话语（中英 8 条）', () => {
  for (const t of EXEMPT_CONCEDE.concat(EXEMPT_DECOUPLE, EXEMPT_EVIDENCE, EXEMPT_META)) {
    assert.equal(detectEffortJustification(t).hit, false, '误伤: ' + t);
  }
});

check('边界锁：既有维度领地/缺腿/成就动词/超距不判', () => {
  for (const t of BOUNDARY) assert.equal(detectEffortJustification(t).hit, false, '误判: ' + t);
  assert.equal(detectEffortJustification(OVERDIST).hit, false, '默认窗超距不命中');
});

check('中英混排与多签名加分档', () => {
  const m = detectEffortJustification(MIXED);
  assert.equal(m.hit, true, '混排应命中');
  assert.equal(m.count, 2, '中英双签名');
  assert.ok(Math.abs(m.score - 0.72) < 1e-9, '双签名加分档');
  const z = detectEffortJustification(MULTI_ZH);
  assert.equal(z.hit, true);
  assert.equal(z.count, 2);
  assert.ok(Math.abs(z.score - 0.72) < 1e-9, '双签名加分档');
});

check('负例注入：四组腿族删除后攻击全部不再命中', () => {
  assert.equal(detectEffortJustification(ATTACKS_ZH[0], { EFFORT_ZH: [] }).hit, false, '删投入锚点ZH');
  assert.equal(detectEffortJustification(ATTACKS_ZH[0], { QUALITY_ZH: [] }).hit, false, '删质量结论ZH');
  assert.equal(detectEffortJustification(ATTACKS_EN[0], { EFFORT_EN: [] }).hit, false, '删投入锚点EN');
  assert.equal(detectEffortJustification(ATTACKS_EN[0], { QUALITY_EN: [] }).hit, false, '删质量结论EN');
});

check('负例注入：四组豁免删除后豁免句变红（承重证明）', () => {
  assert.equal(detectEffortJustification(EXEMPT_CONCEDE[0], { CONCEDE_ZH: NEVER }).hit, true, '删让步举证ZH');
  assert.equal(detectEffortJustification(EXEMPT_CONCEDE[1], { CONCEDE_EN: NEVER }).hit, true, '删让步举证EN');
  assert.equal(detectEffortJustification(EXEMPT_DECOUPLE[0], { DECOUPLE_ZH: NEVER }).hit, true, '删明确解耦ZH');
  assert.equal(detectEffortJustification(EXEMPT_DECOUPLE[1], { DECOUPLE_EN: NEVER }).hit, true, '删明确解耦EN');
  assert.equal(detectEffortJustification(EXEMPT_EVIDENCE[0], { EVIDENCE_ZH: NEVER }).hit, true, '删独立举证ZH');
  assert.equal(detectEffortJustification(EXEMPT_EVIDENCE[1], { EVIDENCE_EN: NEVER }).hit, true, '删独立举证EN');
  assert.equal(detectEffortJustification(EXEMPT_META[0], { META_ZH: NEVER }).hit, true, '删元话语ZH');
  assert.equal(detectEffortJustification(EXEMPT_META[1], { META_EN: NEVER }).hit, true, '删元话语EN');
});

check('负例注入：距离窗承重（放大到 500 后长距句命中）', () => {
  assert.equal(detectEffortJustification(OVERDIST).hit, false, '默认窗不命中');
  assert.equal(detectEffortJustification(OVERDIST, { PAIR_ZH: 500 }).hit, true, '放大窗后命中');
});

check('引擎闸：良性样本不得以 effort_justification 进 findings（含接线后守卫）', () => {
  const engine = require('../src/gate.js');
  const gate = engine.check || engine.gate || engine.checkOutput;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('effort_justification'), '误伤: ' + t);
  }
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
