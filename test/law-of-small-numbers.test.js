/**
 * test/law-of-small-numbers.test.js — r246 小数定律维度测试
 * 覆盖：攻击命中（中英 pair 型/豁免主张型）、良性零误伤（含疑难 FP
 * 压力样本）、概念讨论/正当统计两组豁免族（嵌入真实签名，可负例
 * 注入证明承重）、边界锁（单腿/邻接维度领地/否定前缀/超距）、
 * 中英混排多签名、负例注入（腿①小样本锚点/腿②a样本量豁免/
 * 腿②b总体性裁定逐族删除/窄范围族/豁免删除/距离窗承重）、引擎闸。
 * 与 r218-r245 模块同一测试范式：每个负例注入删除一组常量后，攻击
 * 必须不再命中、豁免句必须变红——证明每一组判据都真实承重。
 */
'use strict';
const assert = require('node:assert/strict');
const { detectLawOfSmallNumbers } = require('../src/law-of-small-numbers.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// 永不命中的正则（用于负例注入关闭某组常量）
const NEVER = /(?!)/;

// ─── 攻击样本 pair 型（小样本锚点 × 总体性裁定 近距共现）────────
const ATTACK_PAIR_ZH = [
  '抛了三次硬币都是正面，这枚硬币明显是偏的',
  '这个村出了三个百岁老人，这里的水土就是养人',
  '我问了五个人，四个说支持，民意已经很清楚了',
  '试了几次都不行，这个方法肯定有问题',
  '才看了三个案例，规律已经很明显了',
  '采访了十几个人，说法都差不多，可见大家都这么想',
  '头几只股票都赚了，我的选股逻辑是对的',
  '三次实验重复出来了，这就是铁律',
  '问了身边一圈人，没人反对，等于全员同意',
  '看了五个病人的效果，这药肯定有效',
  '前几个客户都签了，这方案十拿九稳',
  '见了两三个人这样，全天下的人都一个样',
];
const ATTACK_PAIR_EN = [
  'Three coin flips came up heads, so this coin is clearly biased',
  'I asked five colleagues and all of them agreed, so the whole office feels this way',
  'I tried it three times and it worked every time, so it always works',
  'A handful of users reported the bug, so it affects everyone',
  'The first five reviews were glowing, so the product is a hit',
  'The two cases I know are identical, so the pattern is universal',
];

// ─── 攻击样本豁免主张型（样本量显式豁免，单独成句即判）──────────
const ATTACK_EXEMPT_ZH = [
  '样本小才真实，大样本都是注水注出来的',
  '这么小的样本恰恰最干净，大样本早被污染了',
];
const ATTACK_EXEMPT_EN = [
  'Small samples are the honest ones; big surveys are all rigged',
  'Five data points are all you need to see the pattern',
];

// ─── 良性样本（不得命中：含疑难 FP 压力样本）────────────────────
const BENIGN_HARD = [
  // 概念教学/学术讨论（无总体性裁定）
  '小数定律告诉我们，小样本的波动很大，不能直接外推总体',
  '心理学教材在讲小数定律：人们会高估小样本的代表性，特维斯基和卡尼曼有专门论述',
  'The law of small numbers describes how people overtrust small samples.',
  // 正当统计做法（承认样本不足/扩大样本/当假设）
  '只抛三次就下结论不严谨，样本量太小，需要几千次试验才能判断',
  '虽然只问了五个人，但这个结果和全国调查一致，可以互相印证',
  '只有三个样本不足为凭，先把样本量提上去再说',
  '三次都成功可能只是巧合，样本量远远不够',
  '先小规模试点，验证后再放量',
  '三个案例的结论已经在一万人的数据里复现',
  '初步看了五个样本，全面结论要等完整统计',
  '样本量已经扩到三千人，结论相当稳健',
  '样本量扩大到五万之后，趋势依然稳定',
  '不能只凭三个案例就下结论，证据还远远不够',
  '三个城市的数据不足以推断全国，我们只用它提出假设',
  '虽然样本不大，但置信区间足够窄，效应量也很稳定',
  '我们随机抽取了三千个样本，统计显著，结论可以推广到总体',
  'Only three samples is not enough, we need thousands of trials before concluding',
  'I surveyed three friends and they all liked it, but that hardly proves anything about the market.',
  'A couple of early users reported issues, so we are expanding testing before any conclusion.',
  // 单腿：只有小样本锚点，无总体性裁定
  '我们访谈了三位用户，逐条记录了他们的反馈。',
  // 单腿：只有总体性裁定，无小样本锚点
  '规律已经很明显了，数据不会说谎。',
  // 非辩护性的小样本陈述（不为小样本辩护）
  '小样本研究也有小样本研究的长处，关键看研究问题是否匹配。',
  // 邻接维度正当用法（hasty / anecdote / clustering 领地的正当句）
  '基于三次访谈就归纳全部用户需求，这是证据不足的泛化。',
  '他给我讲了一个朋友的亲身经历，可那只是一个故事，说明不了整体。',
  '不能因为三个差评就说产品不行，我们看到的是长期口碑数据。',
  // 否定前缀
  '样本量确实不大，但趋势并不能说明全部问题，还要继续观察。',
];

// ─── 豁免族 A：概念讨论（真实签名 + 概念标记，不得命中；删除标记后应变红）
const EXEMPT_CONCEPT = [
  '老师在课堂上讲小数定律：抛了三次硬币都是正面，这枚硬币明显是偏的——这就是小样本迷信的典型。',
  'The lecture on the law of small numbers: three coin flips came up heads, so this coin is clearly biased.',
];

// ─── 豁免族 B：正当统计做法（真实签名 + 正当标记，不得命中；删除后应变红）
const EXEMPT_CORRECTIVE = [
  '抛了三次硬币都是正面，这枚硬币明显是偏的——不过样本量远远不够，先扩大试验次数再说。',
  'Three coin flips came up heads, so this coin is clearly biased, but the sample is too small, we need more data.',
];

// ─── 边界锁 ────────────────────────────────────────────────────
const BOUNDARY = [
  ['单腿-有小样本无裁定', '我们访谈了三位用户，逐条记录了他们的反馈。'],
  ['单腿-有裁定无小样本', '规律已经很明显了，数据不会说谎。'],
  ['单腿-非辩护的小样本陈述', '小样本研究也有小样本研究的长处，关键看研究问题是否匹配。'],
  ['邻接-hasty_generalization', '基于三次访谈就归纳全部用户需求，这是证据不足的泛化。'],
  ['邻接-anecdotal_as_proof', '他给我讲了一个朋友的亲身经历，可那只是一个故事，说明不了整体。'],
  ['否定前缀-并不能说明', '样本量确实不大，但趋势并不能说明全部问题，还要继续观察。'],
];
// 双腿超距（默认邻近窗 ZH60：小样本锚点与总体性裁定拉开 >60 不命中）
const OVERDIST = '才看了三个案例，调研团队随后进驻现场，开展了为期数周的持续跟踪调查，逐户走访并核对了大量原始凭证，整理出完整的台账记录，交叉比对了历年的统计数据，至此规律已经很明显了。';

const MIXED = '抛了三次硬币都是正面，这枚硬币明显是偏的；three coin flips came up heads so this coin is clearly biased.';
const MULTI_ZH = '抛了三次硬币都是正面，这枚硬币明显是偏的；试了几次都不行，这个方法肯定有问题。';

console.log('law-of-small-numbers（r246 小数定律）测试:');

check('模块导出与短输入安全', () => {
  assert.equal(typeof detectLawOfSmallNumbers, 'function');
  assert.equal(detectLawOfSmallNumbers('').hit, false);
  assert.equal(detectLawOfSmallNumbers(null).hit, false);
  assert.equal(detectLawOfSmallNumbers('短').hit, false);
});

check('攻击命中：中文 pair 型 12 条', () => {
  for (const t of ATTACK_PAIR_ZH) {
    const r = detectLawOfSmallNumbers(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.equal(r.dimension, 'law_of_small_numbers');
    assert.ok(r.score >= 0.6 && r.score <= 0.8, 'severity 档位: ' + t);
    assert.ok(r.details.length > 10, 'details 非空');
    assert.ok(r.evidence.length >= 1, 'evidence 非空');
    assert.ok(r.guidance.length > 20, 'guidance 非空');
  }
});

check('攻击命中：英文 pair 型 6 条', () => {
  for (const t of ATTACK_PAIR_EN) {
    const r = detectLawOfSmallNumbers(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.ok(r.score >= 0.6 && r.score <= 0.8);
  }
});

check('攻击命中：样本量显式豁免主张型（中英 4 条，单独成句即判）', () => {
  for (const t of ATTACK_EXEMPT_ZH.concat(ATTACK_EXEMPT_EN)) {
    assert.equal(detectLawOfSmallNumbers(t).hit, true, '应命中: ' + t);
  }
});

check('良性零误伤：26 条（含疑难 FP 压力样本）', () => {
  for (const t of BENIGN_HARD) assert.equal(detectLawOfSmallNumbers(t).hit, false, '误伤: ' + t);
});

check('豁免族：概念讨论（中英 2 条）', () => {
  for (const t of EXEMPT_CONCEPT) assert.equal(detectLawOfSmallNumbers(t).hit, false, '误伤: ' + t);
});

check('豁免族：正当统计做法（中英 2 条）', () => {
  for (const t of EXEMPT_CORRECTIVE) assert.equal(detectLawOfSmallNumbers(t).hit, false, '误伤: ' + t);
});

check('边界锁：单腿/邻接/否定前缀/超距不判', () => {
  for (const [k, t] of BOUNDARY) assert.equal(detectLawOfSmallNumbers(t).hit, false, '误判[' + k + ']: ' + t);
  assert.equal(detectLawOfSmallNumbers(OVERDIST).hit, false, '默认邻近窗超距不命中');
});

check('中英混排与多签名加分档', () => {
  const m = detectLawOfSmallNumbers(MIXED);
  assert.equal(m.hit, true, '混排应命中');
  assert.ok(m.count >= 2, '多签名（中英双腿各自成签名）');
  assert.ok(Math.abs(m.score - 0.72) < 1e-9, '双签名加分档');
  const z = detectLawOfSmallNumbers(MULTI_ZH);
  assert.equal(z.hit, true);
  assert.ok(z.count >= 2, '多签名');
  assert.ok(Math.abs(z.score - 0.72) < 1e-9, '双签名加分档');
});

check('负例注入：腿①小样本锚点（中英）删除后 pair 型攻击全部不再命中', () => {
  for (const t of ATTACK_PAIR_ZH) assert.equal(detectLawOfSmallNumbers(t, { SMALL_N_ZH: [] }).hit, false, '删小样本锚点ZH: ' + t.slice(0, 20));
  for (const t of ATTACK_PAIR_EN) assert.equal(detectLawOfSmallNumbers(t, { SMALL_N_EN: [] }).hit, false, '删小样本锚点EN: ' + t.slice(0, 20));
});

check('负例注入：腿②b总体性裁定（中英）删除后 pair 型攻击全部不再命中', () => {
  for (const t of ATTACK_PAIR_ZH) assert.equal(detectLawOfSmallNumbers(t, { UNIVERSAL_ZH: [] }).hit, false, '删总体裁定ZH: ' + t.slice(0, 20));
  for (const t of ATTACK_PAIR_EN) assert.equal(detectLawOfSmallNumbers(t, { UNIVERSAL_EN: [] }).hit, false, '删总体裁定EN: ' + t.slice(0, 20));
});

check('负例注入：腿②a样本量豁免（中英）删除后豁免主张攻击全部不再命中', () => {
  for (const t of ATTACK_EXEMPT_ZH) assert.equal(detectLawOfSmallNumbers(t, { EXEMPT_ZH: [] }).hit, false, '删样本量豁免ZH: ' + t.slice(0, 20));
  for (const t of ATTACK_EXEMPT_EN) assert.equal(detectLawOfSmallNumbers(t, { EXEMPT_EN: [] }).hit, false, '删样本量豁免EN: ' + t.slice(0, 20));
});

check('负例注入：隐式窄范围族（身边/亲戚）删除后窄范围攻击不命中', () => {
  const I = require('../src/law-of-small-numbers.js').__internals();
  const keepNumeric = I.SMALL_N_ZH.slice(0, 3); // 只留数字量词/几个/十几个三族，删窄范围族
  const t = '问了身边一圈人，没人反对，等于全员同意';
  assert.equal(detectLawOfSmallNumbers(t).hit, true, '默认应命中');
  assert.equal(detectLawOfSmallNumbers(t, { SMALL_N_ZH: keepNumeric }).hit, false, '删窄范围族后不命中');
});

check('负例注入：概念讨论豁免删除后豁免句变红（承重证明）', () => {
  assert.equal(detectLawOfSmallNumbers(EXEMPT_CONCEPT[0], { CONCEPT_ZH: NEVER }).hit, true, '删概念讨论ZH');
  assert.equal(detectLawOfSmallNumbers(EXEMPT_CONCEPT[1], { CONCEPT_EN: NEVER }).hit, true, '删概念讨论EN');
});

check('负例注入：正当统计做法豁免删除后豁免句变红（承重证明）', () => {
  assert.equal(detectLawOfSmallNumbers(EXEMPT_CORRECTIVE[0], { CORRECTIVE_ZH: NEVER }).hit, true, '删正当统计ZH');
  assert.equal(detectLawOfSmallNumbers(EXEMPT_CORRECTIVE[1], { CORRECTIVE_EN: NEVER }).hit, true, '删正当统计EN');
});

check('负例注入：邻近距离窗承重（放大到 500 后超距句命中）', () => {
  assert.equal(detectLawOfSmallNumbers(OVERDIST).hit, false, '默认窗不命中');
  assert.equal(detectLawOfSmallNumbers(OVERDIST, { PAIR_ZH: 500 }).hit, true, '放大窗后命中');
});

check('引擎闸：良性样本不得以 law_of_small_numbers 进 findings', () => {
  const engine = require('../src/gate.js');
  const gate = engine.check || engine.gate || engine.checkOutput;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN_HARD) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('law_of_small_numbers'), '误伤: ' + t);
  }
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
