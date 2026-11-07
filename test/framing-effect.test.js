/**
 * test/framing-effect.test.js — r244 框架效应维度测试
 * 覆盖：攻击命中（中英）、良性零误伤（含 26 条疑难 FP 压力样本）、
 * 概念讨论/并列呈现两组豁免族（嵌入真实签名，可负例注入证明承重）、
 * 边界锁（既有维度领地/单框架无反转/单反转无框架/单侧框架名词/
 * 否定前缀/超距）、中英混排多签名、负例注入（框架对/框架动词/
 * 响应词逐族删除/豁免删除/距离窗承重）、引擎闸良性守卫。
 * 与 r228-r243 模块同一测试范式：每个负例注入删除一组常量后，攻击
 * 必须不再命中、豁免句必须变红——证明每一组判据都真实承重。
 */
'use strict';
const assert = require('node:assert/strict');
const { detectFramingEffect } = require('../src/framing-effect.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// 永不命中的正则（用于负例注入关闭某组常量）
const NEVER = /(?!)/;

// ─── 攻击样本（应命中：等价双框架表述 × 决策评价反转）──────────
const ATTACKS_ZH = [
  '说成活留率九成就愿意做这个手术，说成死亡率一成怎么都不肯做。',
  '同一批数据，包装成成功率高就显得值得投，换成失败率就没人肯签字。',
  '换成乐观的说法团队就支持，换成悲观的措辞同一个方案就被否了。',
  '肉质说的是瘦肉占比多少大家就抢着买，说成脂肪占比多少就没人要。',
  '医生说成功率百分之九十五我立刻签字，说失败率百分之五我马上想换家医院。',
  '同一份体检报告，写指标正常率九成家属就安心，写异常率一成家属就炸了。',
  '政策说成惠及九成群众大家拥护，说成一成群众不受益大家就上街。',
  '招聘启事写每年淘汰率百分之十没人来，写成留存率百分之九十挤破头。',
  '产品介绍写满意度百分之九十好评如潮，写差评率百分之十就被冲了。',
  '九成好评的说法让人放心，一成差评的说法让人警惕，明明是同一批评价。',
];
const ATTACKS_EN = [
  'described as ninety percent survival the patients consented, as ten percent mortality they refused.',
  'the same numbers felt acceptable framed as gains and unacceptable framed as losses.',
  'the proposal died when phrased as failure rate and sailed through as success rate.',
  'phrased as a ten percent failure the same surgery was rejected outright, while the ninety percent survival version was accepted.',
  'the plan sailed when framed as mostly success and died when framed as partly failure.',
  'the ninety percent survival number brought acceptance, the ten percent mortality number brought refusal.',
];

// ─── 良性样本（不得命中：30 条，含 21 条疑难 FP 压力样本）──────
const BENIGN_HARD = [
  // 框架概念教学/学术讨论（无反转响应对）
  '框架效应是 Kahneman 和 Tversky 提出的经典发现。',
  '同一组数字用收益框架和损失框架呈现，是研究框架效应的标准做法。',
  '这份报告同时列出了存活率和死亡率，避免单向框架误导。',
  '前景理论指出损失段的效用曲线比收益段更陡峭。',
  '成功率和失败率是同一枚硬币的两面。',
  '问卷两种问法都跑了，交叉验证结论不受措辞影响。',
  'This is a well-documented finding in decision research: framing changes choices.',
  'the report lists both survival and mortality rates without spin.',
  'doctors explain risks in both survival and mortality terms so patients can compare.',
  'the wording was changed but the decision stayed the same.',
  'survey respondents were split between the two phrasings.',
  'the surgery was described as risky, and many patients asked for a second opinion.',
  // 只有框架没有反转
  '坏消息也要如实说，不能包装成好消息。',
  '换个说法也改变不了事实本身。',
  '这段话换个说法再讲一遍，让大家更容易理解。',
  // 只有反转没有框架
  '这个方案有人赞成有人反对，投票五五开。',
  '有人赞成有人反对，讨论很激烈。',
  // 单侧框架名词 + 单侧响应（缺对即无族形状）
  '调查报告的异常率上升引起了管理层警惕。',
  '留存率下滑让运营团队连夜开会。',
  '通过率提高大家很安心，未通过的同学决定补考。',
  '死亡率数据要如实公布，遮遮掩掩只会失去信任。',
  '好评和差评都要看，只看一边会误判。',
  // 既有维度领地
  '把裁员说成人员优化，把降薪说成薪酬结构调整。',
  '报告只引用支持结论的数据，反面证据全部略过。',
  '年终奖花下来花得特别痛快，反正不是工资，花着不心疼。',
  '这个项目已经投了两百万，现在停掉前面的钱就全打水漂了，只能硬着头皮做完。',
  '评估这笔投资时，我们把下行空间和上行空间分别测算后再加权。',
  '谈判中双方各让一步，条款逐条敲定。',
  '他说得再好听我也不接受，换成别的说法我也不会拒绝。',
  '实验预注册可以有效降低分析中的确认偏误。',
];

// ─── 豁免族 A：概念讨论（真实签名 + 豁免标记，不得命中；删除标记后应变红）
const EXEMPT_CONCEPT = [
  '心理学教材在讲框架效应：说成活留率九成就愿意做手术，说成死亡率一成怎么都不肯做——经典案例。',
  'The textbook describes the framing effect: the proposal died when phrased as failure rate and sailed through as success rate.',
];

// ─── 豁免族 B：并列呈现两种框架供比较（真实签名 + 并列标记，不得命中；删除后应变红）
const EXEMPT_CORRECTIVE = [
  '汇报材料同时列出存活率和死亡率，受试者在存活率表述下愿意签字、在死亡率表述下不肯签字，我们据此改写了呈现方式。',
  'The study lists both the survival and mortality descriptions; participants accepted the survival wording and refused the mortality wording.',
];

// ─── 边界锁（既有维度领地/单框架无反转/单反转无框架/单侧/否定/超距）──
const BOUNDARY = [
  ['既有维度领地-粉饰遮盖', '把裁员说成人员优化，把降薪说成薪酬结构调整。'],
  ['既有维度领地-选择性呈现', '报告只引用支持结论的数据，反面证据全部略过。'],
  ['既有维度领地-沉没成本', '这个项目已经投了两百万，现在停掉前面的钱就全打水漂了，只能硬着头皮做完。'],
  ['单框架无反转', '这段话换个说法再讲一遍，让大家更容易理解。'],
  ['单反转无框架', '有人赞成有人反对，讨论很激烈，投票五五开。'],
  ['单侧框架名词+单侧响应', '调查报告的异常率上升引起了管理层警惕。'],
  ['否定前缀-ZH', '他说得再好听我也不接受，换成别的说法我也不会拒绝。'],
];
// 双腿超距（默认邻近窗 ZH60 不命中）
const OVERDIST = '说成活留率九成就愿意签字。' + '各'.repeat(80) + '说成死亡率一成怎么都不肯做。';

const MIXED = '说成活留率九成就愿意签字，说成死亡率一成怎么都不肯做；the proposal died when phrased as failure rate and sailed through as success rate.';
const MULTI_ZH = '说成活留率九成就愿意签字，说成死亡率一成怎么都不肯做；写成好评率九成大家就放心，换成差评率一成就炸了。';

console.log('framing-effect（r244 框架效应）测试:');

check('模块导出与短输入安全', () => {
  assert.equal(typeof detectFramingEffect, 'function');
  assert.equal(detectFramingEffect('').hit, false);
  assert.equal(detectFramingEffect(null).hit, false);
  assert.equal(detectFramingEffect('短').hit, false);
});

check('攻击命中：中文 10 条', () => {
  for (const t of ATTACKS_ZH) {
    const r = detectFramingEffect(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.equal(r.dimension, 'framing_effect');
    assert.ok(r.score >= 0.6 && r.score <= 0.8, 'severity 档位: ' + t);
    assert.ok(r.details.length > 10, 'details 非空');
    assert.ok(r.evidence.length >= 1, 'evidence 非空');
    assert.ok(r.guidance.length > 20, 'guidance 非空');
  }
});

check('攻击命中：英文 6 条', () => {
  for (const t of ATTACKS_EN) {
    const r = detectFramingEffect(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.ok(r.score >= 0.6 && r.score <= 0.8);
  }
});

check('良性零误伤：30 条（含 21 条疑难 FP 压力样本）', () => {
  for (const t of BENIGN_HARD) assert.equal(detectFramingEffect(t).hit, false, '误伤: ' + t);
});

check('豁免族：概念讨论（中英 2 条）', () => {
  for (const t of EXEMPT_CONCEPT) assert.equal(detectFramingEffect(t).hit, false, '误伤: ' + t);
});

check('豁免族：并列呈现两种框架（中英 2 条）', () => {
  for (const t of EXEMPT_CORRECTIVE) assert.equal(detectFramingEffect(t).hit, false, '误伤: ' + t);
});

check('边界锁：既有维度领地/单框架/单反转/单侧/否定前缀/超距不判', () => {
  for (const [k, t] of BOUNDARY) assert.equal(detectFramingEffect(t).hit, false, '误判[' + k + ']: ' + t);
  assert.equal(detectFramingEffect(OVERDIST).hit, false, '默认邻近窗超距不命中');
});

check('中英混排与多签名加分档', () => {
  const m = detectFramingEffect(MIXED);
  assert.equal(m.hit, true, '混排应命中');
  assert.ok(m.count >= 2, '多签名（中英双腿链各自成签名）');
  assert.ok(Math.abs(m.score - 0.72) < 1e-9, '双签名加分档');
  const z = detectFramingEffect(MULTI_ZH);
  assert.equal(z.hit, true);
  assert.ok(z.count >= 2, '多签名');
  assert.ok(Math.abs(z.score - 0.72) < 1e-9, '双签名加分档');
});

check('负例注入：中文互补框架对删除后纯对句全部不再命中', () => {
  assert.equal(detectFramingEffect(ATTACKS_ZH[4], { POS_FRAME_ZH: [] }).hit, false, '删正面框架名词ZH');
  assert.equal(detectFramingEffect(ATTACKS_ZH[4], { NEG_FRAME_ZH: [] }).hit, false, '删负面框架名词ZH');
  assert.equal(detectFramingEffect(ATTACKS_ZH[5], { POS_FRAME_ZH: [] }).hit, false, '删正面框架名词ZH-2');
  assert.equal(detectFramingEffect(ATTACKS_ZH[9], { NEG_FRAME_ZH: [] }).hit, false, '删负面框架名词ZH-2');
});

check('负例注入：中文框架表述动词删除后纯动词句不再命中', () => {
  assert.equal(detectFramingEffect(ATTACKS_ZH[2], { FRAME_VERB_ZH: [] }).hit, false, '删框架动词ZH');
  assert.equal(detectFramingEffect(ATTACKS_ZH[6], { FRAME_VERB_ZH: [] }).hit, false, '删框架动词ZH-2');
});

check('负例注入：中文响应词族删除后攻击全部不再命中', () => {
  assert.equal(detectFramingEffect(ATTACKS_ZH[0], { FLIP_POS_ZH: [] }).hit, false, '删正面响应词ZH');
  assert.equal(detectFramingEffect(ATTACKS_ZH[0], { FLIP_NEG_ZH: [] }).hit, false, '删负面响应词ZH');
  assert.equal(detectFramingEffect(ATTACKS_ZH[7], { FLIP_POS_ZH: [] }).hit, false, '删正面响应词ZH-2');
  assert.equal(detectFramingEffect(ATTACKS_ZH[7], { FLIP_NEG_ZH: [] }).hit, false, '删负面响应词ZH-2');
});

check('负例注入：英文四族删除后攻击全部不再命中', () => {
  assert.equal(detectFramingEffect(ATTACKS_EN[5], { POS_FRAME_EN: [] }).hit, false, '删正面框架名词EN');
  assert.equal(detectFramingEffect(ATTACKS_EN[5], { NEG_FRAME_EN: [] }).hit, false, '删负面框架名词EN');
  assert.equal(detectFramingEffect(ATTACKS_EN[0], { FRAME_VERB_EN: [] }).hit, false, '删框架动词EN');
  assert.equal(detectFramingEffect(ATTACKS_EN[2], { FLIP_POS_EN: [] }).hit, false, '删正面响应词EN');
  assert.equal(detectFramingEffect(ATTACKS_EN[2], { FLIP_NEG_EN: [] }).hit, false, '删负面响应词EN');
});

check('负例注入：概念讨论豁免删除后豁免句变红（承重证明）', () => {
  assert.equal(detectFramingEffect(EXEMPT_CONCEPT[0], { CONCEPT_ZH: NEVER }).hit, true, '删概念讨论ZH');
  assert.equal(detectFramingEffect(EXEMPT_CONCEPT[1], { CONCEPT_EN: NEVER }).hit, true, '删概念讨论EN');
});

check('负例注入：并列呈现豁免删除后豁免句变红（承重证明）', () => {
  assert.equal(detectFramingEffect(EXEMPT_CORRECTIVE[0], { CORRECTIVE_ZH: NEVER }).hit, true, '删并列呈现ZH');
  assert.equal(detectFramingEffect(EXEMPT_CORRECTIVE[1], { CORRECTIVE_EN: NEVER }).hit, true, '删并列呈现EN');
});

check('负例注入：邻近距离窗承重（放大到 500 后长距句命中）', () => {
  assert.equal(detectFramingEffect(OVERDIST).hit, false, '默认窗不命中');
  assert.equal(detectFramingEffect(OVERDIST, { PAIR_ZH: 500 }).hit, true, '放大窗后命中');
});

check('引擎闸：良性样本不得以 framing_effect 进 findings', () => {
  const engine = require('../src/gate.js');
  const gate = engine.check || engine.gate || engine.checkOutput;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN_HARD) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('framing_effect'), '误伤: ' + t);
  }
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
