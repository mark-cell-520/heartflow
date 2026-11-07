/**
 * test/prosecutors-fallacy.test.js — r247 检察官谬误维度测试
 * 覆盖：攻击命中（中英 pair 型：强证据词腿 / 弱证据词×极端比率值腿）、
 * 良性零误伤（含疑难 FP 压力样本）、概念讨论/正当做法两组豁免族
 * （嵌入真实签名，可负例注入证明承重）、边界锁（单腿/邻接维度领地/
 * 否定前缀/超距）、中英混排多签名、负例注入（腿①强证据词/腿①弱证据
 * 词/极端比率值/腿②假设侧结论逐族删除 + 两组豁免删除 + 距离窗承重）、
 * 引擎闸。与 r218-r246 模块同一测试范式：每个负例注入删除一组常量后，
 * 攻击必须不再命中、豁免句必须变红——证明每一组判据都真实承重。
 */
'use strict';
const assert = require('node:assert/strict');
const { detectProsecutorsFallacy } = require('../src/prosecutors-fallacy.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// 永不命中的正则（用于负例注入关闭某组常量）
const NEVER = /(?!)/;

// ─── 攻击样本 pair 型：腿① = 强证据词（误报率/准确率/比中…，无比率值也成腿）
const ATTACK_STRONG_ZH = [
  '这种误报率下，仪器说是就是，几乎不可能错',
  '错判率只有万分之一，所以系统给出的结论可信度就是万分之九九九九',
  '命中率百分之九十九点九，那说有病就基本没跑',
  '这种检测误判率只有百万分之三，检测说有问题就一定有问题',
  '检出率百分之九十八，健康人里也有百分之九十八会被判阳性',
  '检测的准确率是 99%，所以说它有病的人 99% 真有病',
  '在千人数据库里比中，他恰好是无辜的概率同样很低',
  '误报率千分之三，阳性就可以直接确诊',
];
// ─── 攻击样本 pair 型：腿① = 弱证据词 × 极端比率值（无强证据词）
const ATTACK_WEAK_ZH = [
  '证据出现的概率那么低，他是清白的概率一样低',
  '无罪的人身上出现这种证据的概率极低，所以他无罪的概率同样极低',
  '比对上的概率小到可以忽略，那没比对上的可能也小到可以忽略，凶手就是他',
  '巧合的概率那么小，所以这绝不可能是巧合',
  '现场留下这种痕迹的概率微乎其微，他不是凶手的概率也微乎其微',
];
// ─── 攻击样本 pair 型：双腿①路径并存（强证据词 + 弱证据词×比率值）
const ATTACK_DUAL_ZH = [
  'DNA 匹配的概率只有百万分之一，所以他是无辜的概率也只有百万分之一',
  '配型成功的概率只有十万分之一，他不是凶手的概率也就那么低',
  'DNA 比对吻合的概率只有百万分之一，所以他是凶手的概率也只有百万分之一',
  '这种指纹吻合的概率微乎其微，所以吻合就是铁证',
];
// ─── 攻击样本 pair 型：英文（强证据词腿）
const ATTACK_EN_STRONG = [
  'The false positive rate is 0.1%, so the test is right 99.9% of the time',
  'A test with a 1% error rate means a positive result is wrong only 1% of the time',
  'The false negative rate is only 2%, so a negative result is right 98% of the time',
];
// ─── 攻击样本 pair 型：英文（弱证据词 × 极端比率值腿）
const ATTACK_EN_WEAK = [
  'The evidence appeared with a probability of one in a billion, so he must be guilty',
  'The chance of a coincidence is astronomically small, so it cannot be a coincidence',
];
// ─── 攻击样本 pair 型：英文（双腿①路径并存）
const ATTACK_EN_DUAL = [
  'The probability of this evidence if he were innocent is one in a million, so the probability he is innocent is also one in a million',
  'Since the odds of a coincidence are tiny, coincidence is ruled out',
  'The match probability is tiny, so the probability that it is not a match is equally tiny',
  'The odds of a coincidence are so small that coincidence is impossible',
  'The likelihood of this fingerprint if he were not the source is one in a billion, so he is the source',
];
const ATTACK_ALL = ATTACK_STRONG_ZH.concat(ATTACK_WEAK_ZH, ATTACK_DUAL_ZH, ATTACK_EN_STRONG, ATTACK_EN_WEAK, ATTACK_EN_DUAL);

// ─── 良性样本（不得命中：含疑难 FP 压力样本）────────────────────
const BENIGN_HARD = [
  // 概念讨论/学术讨论（条件概率方向本身）
  '匹配概率再低，也要先看基础比率，这是贝叶斯推理的基本要求',
  '错把条件概率的方向弄反，是庭审统计里最常见的错误',
  '如果先验概率很高，即使匹配概率只是中等，也能提供很强的证据',
  '他把 P(E|H) 当成了 P(H|E)，这正是检察官谬误的定义',
  'The likelihood ratio expresses the strength of evidence without inverting the conditional',
  'This is the prosecutor\'s fallacy: the likelihood of the evidence given innocence is not the probability of innocence',
  // 正当推理（指出不可混用/要求复测/给出基础比率）
  '准确率 99% 的检测用在患病率很低的人群中，阳性结果多数是假阳性',
  '不能把证据出现的概率当成嫌疑人无罪的概率，二者不可混用',
  '这类案件的基础比率极低，单看匹配率会严重高估有罪可能',
  '阳性结果需要复测确认，一次检测不足以确诊',
  'In a low-prevalence population, even a very accurate test yields mostly false positives',
  'DNA 数据库比中之后，还要看基础比率和现场证据的独立性',
  '无罪推定意味着控方必须证明到排除合理怀疑的程度',
  // 其他统计族的正当句（本模块不应越界）
  '该模型的准确率达到 95%，但在长尾样本上仍有明显短板',
  '误报率高的系统会把大量正常流量标记为异常，需要调阈值',
  '这种巧合的概率虽然低，但样本一大就必然出现几次',
  'The probability of rain is only 30%, so I will take an umbrella just in case',
  // 单腿：只有证据侧概率陈述，无假设侧倒置结论
  '这套系统的误报率只有千分之二，我们打算再观察一个季度。',
  // 单腿：只有假设侧结论，无证据侧概率陈述（且与腿①零距重叠，不成交距对）
  '在没有任何证据的情况下，他是无辜的概率本来就不低。',
  // 邻接维度领地正当句
  '见过几个人这样，就断定所有人都这样，证据不足',
  '已经连输十把，下一把赢的概率并不会变大',
  '连续三年增长是事实，但能否持续要看驱动因素是否还在',
  // 否定前缀
  '误报率虽然低，却并不能说明检测结果就一定可靠。',
];

// ─── 豁免族 A：概念讨论（真实签名 + 概念标记，不得命中；删除标记后应变红）
const EXEMPT_CONCEPT = [
  '老师在课堂上讲检察官谬误：DNA 匹配的概率只有百万分之一，所以他是无辜的概率也只有百万分之一——这就是把条件概率方向弄反的典型。',
  'The lecture on the transposed conditional: the match probability is tiny, so the probability that it is not a match is equally tiny.',
];
// ─── 豁免族 B：正当做法（真实签名 + 正当标记，不得命中；删除后应变红）
// 注意：两句只含 CORRECTIVE 标记、不含 CONCEPT 标记，保证删除 CORRECTIVE 后
// 能单独变红（若同时含「基础比率/条件概率」等概念词，删 CORRECTIVE 仍会被
// CONCEPT 豁免，负例注入就失去了隔离性）。
const EXEMPT_CORRECTIVE = [
  'DNA 匹配的概率只有百万分之一，所以他是无辜的概率也只有百万分之一——不过一次检测不足以定罪，需要复测和独立验证。',
  'The match probability is tiny, so the probability that it is not a match is equally tiny, but a single test is not enough and we need a second sample.',
];

// ─── 边界锁 ────────────────────────────────────────────────────
const BOUNDARY = [
  ['单腿-只有证据侧概率', '这套系统的误报率只有千分之二，我们打算再观察一个季度。'],
  ['单腿-只有假设侧结论', '在没有任何证据的情况下，他是无辜的概率本来就不低。'],
  ['邻接-hasty_generalization', '见过几个人这样，就断定所有人都这样，证据不足'],
  ['邻接-gamblers_fallacy', '已经连输十把，下一把赢的概率并不会变大'],
  ['邻接-趋势外推', '连续三年增长是事实，但能否持续要看驱动因素是否还在'],
  ['否定前缀-并不能说明', '误报率虽然低，却并不能说明检测结果就一定可靠。'],
];
// 双腿超距（默认邻近窗 ZH60：证据侧陈述与假设侧结论拉开 >60 不命中）
const OVERDIST = '检测误报率只有千分之二，相关部门随后组织了多轮检查，逐项核对原始记录与现场取证材料，并邀请独立第三方重新比对了全流程数据，最终结论认为他是无辜的概率也同样很低。';

const MIXED = 'DNA 匹配的概率只有百万分之一，所以他是无辜的概率也只有百万分之一；the match probability is tiny so the probability that it is not a match is equally tiny.';
const MULTI_ZH = 'DNA 匹配的概率只有百万分之一，所以他是无辜的概率也只有百万分之一；这种检测误判率只有百万分之三，检测说有问题就一定有问题。';

console.log('prosecutors-fallacy（r247 检察官谬误）测试:');

check('模块导出与短输入安全', () => {
  assert.equal(typeof detectProsecutorsFallacy, 'function');
  assert.equal(detectProsecutorsFallacy('').hit, false);
  assert.equal(detectProsecutorsFallacy(null).hit, false);
  assert.equal(detectProsecutorsFallacy('短').hit, false);
});

check('攻击命中：中文 pair 型·强证据词腿 8 条', () => {
  for (const t of ATTACK_STRONG_ZH) {
    const r = detectProsecutorsFallacy(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.equal(r.dimension, 'prosecutors_fallacy');
    assert.ok(r.score >= 0.6 && r.score <= 0.8, 'severity 档位: ' + t);
    assert.ok(r.details.length > 10, 'details 非空');
    assert.ok(r.evidence.length >= 1, 'evidence 非空');
    assert.ok(r.guidance.length > 20, 'guidance 非空');
  }
});

check('攻击命中：中文 pair 型·弱证据词×极端比率值腿 5 条', () => {
  for (const t of ATTACK_WEAK_ZH) {
    const r = detectProsecutorsFallacy(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.ok(r.score >= 0.6 && r.score <= 0.8);
  }
});

check('攻击命中：中文双腿①路径并存 4 条 + 英文 10 条', () => {
  for (const t of ATTACK_DUAL_ZH.concat(ATTACK_EN_STRONG, ATTACK_EN_WEAK, ATTACK_EN_DUAL)) {
    const r = detectProsecutorsFallacy(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.ok(r.score >= 0.6 && r.score <= 0.8);
  }
});

check('良性零误伤：24 条（含疑难 FP 压力样本）', () => {
  for (const t of BENIGN_HARD) assert.equal(detectProsecutorsFallacy(t).hit, false, '误伤: ' + t);
});

check('豁免族：概念讨论（中英 2 条）', () => {
  for (const t of EXEMPT_CONCEPT) assert.equal(detectProsecutorsFallacy(t).hit, false, '误伤: ' + t);
});

check('豁免族：正当做法（中英 2 条）', () => {
  for (const t of EXEMPT_CORRECTIVE) assert.equal(detectProsecutorsFallacy(t).hit, false, '误伤: ' + t);
});

check('边界锁：单腿/邻接/否定前缀/超距不判', () => {
  for (const [k, t] of BOUNDARY) assert.equal(detectProsecutorsFallacy(t).hit, false, '误判[' + k + ']: ' + t);
  assert.equal(detectProsecutorsFallacy(OVERDIST).hit, false, '默认邻近窗超距不命中');
});

check('中英混排与多签名加分档', () => {
  const m = detectProsecutorsFallacy(MIXED);
  assert.equal(m.hit, true, '混排应命中');
  assert.ok(m.count >= 2, '多签名（中英双腿各自成签名）');
  assert.ok(Math.abs(m.score - 0.76) < 1e-9, '双签名加分档');
  const z = detectProsecutorsFallacy(MULTI_ZH);
  assert.equal(z.hit, true);
  assert.ok(z.count >= 2, '多签名');
  assert.ok(Math.abs(z.score - 0.76) < 1e-9, '双签名加分档');
});

check('负例注入：腿①整族删除（中英）后 pair 型攻击全部不再命中', () => {
  for (const t of ATTACK_ALL) {
    const zh = /[\u4e00-\u9fa5]/.test(t);
    assert.equal(detectProsecutorsFallacy(t, zh
      ? { STRONG_ZH: [], WEAK_ZH: [] }
      : { STRONG_EN: [], WEAK_EN: [] }).hit, false, '删腿①: ' + t.slice(0, 20));
  }
});

check('负例注入：极端比率值删除后弱证据词腿攻击全部不再命中', () => {
  for (const t of ATTACK_WEAK_ZH) assert.equal(detectProsecutorsFallacy(t, { RATE_ZH: NEVER }).hit, false, '删比率值ZH: ' + t.slice(0, 20));
  for (const t of ATTACK_EN_WEAK) assert.equal(detectProsecutorsFallacy(t, { RATE_EN: NEVER }).hit, false, '删比率值EN: ' + t.slice(0, 20));
});

check('负例注入：腿①强证据词删除后强证据词腿攻击全部不再命中', () => {
  for (const t of ATTACK_STRONG_ZH) assert.equal(detectProsecutorsFallacy(t, { STRONG_ZH: [] }).hit, false, '删强证据词ZH: ' + t.slice(0, 20));
  for (const t of ATTACK_EN_STRONG) assert.equal(detectProsecutorsFallacy(t, { STRONG_EN: [] }).hit, false, '删强证据词EN: ' + t.slice(0, 20));
});

check('负例注入：腿②假设侧倒置结论（中英）删除后 pair 型攻击全部不再命中', () => {
  for (const t of ATTACK_ALL) {
    const zh = /[\u4e00-\u9fa5]/.test(t);
    assert.equal(detectProsecutorsFallacy(t, zh ? { INVERTED_ZH: [] } : { INVERTED_EN: [] }).hit, false, '删假设侧: ' + t.slice(0, 20));
  }
});

check('负例注入：概念讨论豁免删除后豁免句变红（承重证明）', () => {
  assert.equal(detectProsecutorsFallacy(EXEMPT_CONCEPT[0], { CONCEPT_ZH: NEVER }).hit, true, '删概念讨论ZH');
  assert.equal(detectProsecutorsFallacy(EXEMPT_CONCEPT[1], { CONCEPT_EN: NEVER }).hit, true, '删概念讨论EN');
});

check('负例注入：正当做法豁免删除后豁免句变红（承重证明）', () => {
  assert.equal(detectProsecutorsFallacy(EXEMPT_CORRECTIVE[0], { CORRECTIVE_ZH: NEVER }).hit, true, '删正当做法ZH');
  assert.equal(detectProsecutorsFallacy(EXEMPT_CORRECTIVE[1], { CORRECTIVE_EN: NEVER }).hit, true, '删正当做法EN');
});

check('负例注入：邻近距离窗承重（放大到 500 后超距句命中）', () => {
  assert.equal(detectProsecutorsFallacy(OVERDIST).hit, false, '默认窗不命中');
  assert.equal(detectProsecutorsFallacy(OVERDIST, { PAIR_ZH: 500 }).hit, true, '放大窗后命中');
});

check('引擎闸：良性样本不得以 prosecutors_fallacy 进 findings', () => {
  const engine = require('../src/gate.js');
  const gate = engine.check || engine.gate || engine.checkOutput;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN_HARD) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('prosecutors_fallacy'), '误伤: ' + t);
  }
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
