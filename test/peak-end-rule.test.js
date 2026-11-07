/**
 * test/peak-end-rule.test.js — r245 峰终定律维度测试
 * 覆盖：攻击命中（中英）、良性零误伤（含疑难 FP 压力样本）、
 * 概念讨论/均衡评价两组豁免族（嵌入真实签名，可负例注入证明承重）、
 * 边界锁（既有维度领地/有峰终无正面裁定/有裁定无时长折让/单侧/否定/
 * 而非对比否定/超距）、中英混排多签名、负例注入（峰终锚点/整体裁定/
 * 时长折让逐族删除/豁免删除/距离窗承重）、引擎闸良性守卫。
 * 与 r218-r244 模块同一测试范式：每个负例注入删除一组常量后，攻击
 * 必须不再命中、豁免句必须变红——证明每一组判据都真实承重。
 */
'use strict';
const assert = require('node:assert/strict');
const { detectPeakEndRule } = require('../src/peak-end-rule.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// 永不命中的正则（用于负例注入关闭某组常量）
const NEVER = /(?!)/;

// ─── 攻击样本（应命中：峰终锚点 × 整体正面裁定 × 时长折让 三要素共现）──
const ATTACKS_ZH = [
  '全程都挺无聊的，就结尾特别惊艳，我觉得这趟旅行值了。',
  '虽然过程很煎熬，但最后那一刻特别美好，整件事我就算它成功。',
  '这部电影前面昏昏欲睡，结尾一击致命，我直接给满分。',
  '假期大半时间在排队，就最后两天痛快，回忆里全是美好。',
  '开头混乱、中途平淡，可收官那一刻堪称完美，整场演出我认为非常成功。',
  '尽管前面两个小时都在赶路，最后看到日出的那一秒，这趟就值了。',
  '手术过程别提多受罪，缝完针那一刻轻松了，整体我就给它好评。',
  '培训前半段枯燥得很，结业时发了张证书，整个过程瞬间觉得有意义。',
  '这部电影高光全在最后一幕，前面再拖我也愿意给高分。',
  '开会又长又闷，好在散会前领导表扬了我，这场会开得还算舒心。',
  '这顿饭除了最后那道甜点惊艳，前面寡淡无味，但整体体验我给满分。',
  '旅行一路上舟车劳顿，就登顶那几分钟震撼，回忆里整趟都发光。',
];
const ATTACKS_EN = [
  'The whole trip was dull except the stunning ending, so I say it was worth it.',
  'The procedure was agony, but it ended well, so overall it went fine.',
  'Most of the movie dragged, but the final scene redeemed the entire experience.',
  'The conference dragged for hours, but the closing keynote was brilliant, so the whole event was a success.',
  'The recovery was brutal, yet the moment they removed the cast felt great, so overall it went well.',
  'Most of the vacation was stressful, but the final sunset made the entire trip unforgettable.',
  'The first three quarters were dismal, but the last-minute goal made the whole game worth watching.',
];

// ─── 良性样本（不得命中：含疑难 FP 压力样本）────────────────────
const BENIGN_HARD = [
  // 概念教学/学术讨论（无正面整体裁定）
  '峰终定律说明人容易只凭最高潮和结尾给一段体验定性，从而忽略它的长短。',
  '卡恩曼提出的峰终定律，是体验评价里持续时间被忽视的经典案例。',
  'The peak-end rule shows people judge experiences by their peak and end, neglecting duration.',
  // 均衡评价/考量时长（有峰终有时长折让，但无正面整体裁定）
  '虽然结尾很惊艳，但整个过程拖沓，综合时长和节奏我只能给中等。',
  '不能只因为收尾漂亮就忽略中间数小时的乏味，整体评价要打折扣。',
  '最后的高光值得记住，但也不该抹杀前面大部分时间的平淡。',
  '尽管结局圆满，前半段的煎熬同样真实，我会把整体评为中上而非完美。',
  'The finale was strong, but the slow middle means the whole thing is merely average.',
  'A single climactic moment cannot carry a review that ignores the rest of the runtime.',
  // 邻接维度正当用法（hasty / outcome）
  '他逢人就夸那家店，不过是基于一次经历就下结论，证据并不充分。',
  '因为项目结果好，就断定当初的决策必然正确，这是典型的结果偏差。',
  // 单腿：有峰终无正面整体裁定
  '这次旅行一塌糊涂，全程都不满意。',
  '结尾确实精彩，但整体乏善可陈。',
  // 单腿：有正面裁定无时长折让（可能真好）
  '全程都很满意，结尾尤其好，这趟非常值。',
  // 单腿：单侧峰终名词+单侧裁定，无时长
  '这部电影结局很圆满。',
  // 既有维度/邻接领地锁
  '我们统计了全年每一天的满意度，按时间加权得到整体体验分。',
  '评价课程要综合课前课中课后全周期，而不是只看结课那一刻。',
  '完整的用户旅程包含每一个触点，结尾的顺畅不能替代全程的顺畅。',
  'We averaged satisfaction across every session, not just the first and last.',
];

// ─── 豁免族 A：概念讨论（真实签名 + 豁免标记，不得命中；删除标记后应变红）
const EXEMPT_CONCEPT = [
  '心理学教材在讲峰终定律：全程都挺无聊的，就结尾特别惊艳，我觉得这趟旅行值了——经典案例。',
  'The textbook on the peak-end rule: the whole trip was dull except the stunning ending, so I say it was worth it.',
];

// ─── 豁免族 B：均衡评价/考量时长（真实签名 + 均衡标记，不得命中；删除后应变红）
const EXEMPT_CORRECTIVE = [
  '结尾确实惊艳，虽然全程乏味煎熬，但综合时长与整体分布来看，这趟依然值得。',
  'The whole trip dragged except the ending, but weighing the full duration, overall it was worth it.',
];

// ─── 边界锁 ────────────────────────────────────────────────────
const BOUNDARY = [
  ['有峰终无正面整体裁定', '这次旅行一塌糊涂，全程都不满意。'],
  ['有正面裁定无时长折让', '全程都很满意，结尾尤其好，这趟非常值。'],
  ['单侧峰终名词+单侧裁定', '这部电影结局很圆满。'],
  ['邻接维度-hasty_generalization', '他逢人就夸那家店，不过是基于一次经历就下结论，证据并不充分。'],
  ['邻接维度-outcome_bias', '因为项目结果好，就断定当初的决策必然正确，这是典型的结果偏差。'],
  ['否定前缀-而非对比否定', '尽管结局圆满，前半段的煎熬同样真实，我会把整体评为中上而非完美。'],
  ['否定前缀-强化词别提多', '过程别提多受罪，但整体我并不觉得值。'],
];
// 三要素超距（默认邻近窗 ZH60：时长折让与峰终锚点拉开 >60 不命中）
const OVERDIST = '过程煎熬漫长又乏味。' + '啊'.repeat(80) + '结尾惊艳，整趟旅行都值了。';

const MIXED = '全程都挺无聊的，就结尾特别惊艳，我觉得这趟旅行值了；the whole trip was dull except the stunning ending so I say it was worth it.';
const MULTI_ZH = '全程都挺无聊的，就结尾特别惊艳，我觉得这趟旅行值了；前半段昏昏欲睡，收官一击致命，我直接给满分。';

console.log('peak-end-rule（r245 峰终定律）测试:');

check('模块导出与短输入安全', () => {
  assert.equal(typeof detectPeakEndRule, 'function');
  assert.equal(detectPeakEndRule('').hit, false);
  assert.equal(detectPeakEndRule(null).hit, false);
  assert.equal(detectPeakEndRule('短').hit, false);
});

check('攻击命中：中文 12 条', () => {
  for (const t of ATTACKS_ZH) {
    const r = detectPeakEndRule(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.equal(r.dimension, 'peak_end_rule');
    assert.ok(r.score >= 0.6 && r.score <= 0.8, 'severity 档位: ' + t);
    assert.ok(r.details.length > 10, 'details 非空');
    assert.ok(r.evidence.length >= 1, 'evidence 非空');
    assert.ok(r.guidance.length > 20, 'guidance 非空');
  }
});

check('攻击命中：英文 7 条', () => {
  for (const t of ATTACKS_EN) {
    const r = detectPeakEndRule(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.ok(r.score >= 0.6 && r.score <= 0.8);
  }
});

check('良性零误伤：21 条（含疑难 FP 压力样本）', () => {
  for (const t of BENIGN_HARD) assert.equal(detectPeakEndRule(t).hit, false, '误伤: ' + t);
});

check('豁免族：概念讨论（中英 2 条）', () => {
  for (const t of EXEMPT_CONCEPT) assert.equal(detectPeakEndRule(t).hit, false, '误伤: ' + t);
});

check('豁免族：均衡评价/考量时长（中英 2 条）', () => {
  for (const t of EXEMPT_CORRECTIVE) assert.equal(detectPeakEndRule(t).hit, false, '误伤: ' + t);
});

check('边界锁：有峰终无裁定/有裁定无时长/单侧/邻接/否定前缀/超距不判', () => {
  for (const [k, t] of BOUNDARY) assert.equal(detectPeakEndRule(t).hit, false, '误判[' + k + ']: ' + t);
  assert.equal(detectPeakEndRule(OVERDIST).hit, false, '默认邻近窗超距不命中');
});

check('中英混排与多签名加分档', () => {
  const m = detectPeakEndRule(MIXED);
  assert.equal(m.hit, true, '混排应命中');
  assert.ok(m.count >= 2, '多签名（中英三要素各自成签名）');
  assert.ok(Math.abs(m.score - 0.72) < 1e-9, '双签名加分档');
  const z = detectPeakEndRule(MULTI_ZH);
  assert.equal(z.hit, true);
  assert.ok(z.count >= 2, '多签名');
  assert.ok(Math.abs(z.score - 0.72) < 1e-9, '双签名加分档');
});

check('负例注入：中文峰终锚点删除后攻击全部不再命中', () => {
  for (const t of ATTACKS_ZH) assert.equal(detectPeakEndRule(t, { PEAK_END_ZH: [] }).hit, false, '删峰终锚点ZH: ' + t.slice(0, 20));
});

check('负例注入：中文整体裁定删除后攻击全部不再命中', () => {
  for (const t of ATTACKS_ZH) assert.equal(detectPeakEndRule(t, { WHOLE_VERDICT_ZH: [] }).hit, false, '删整体裁定ZH: ' + t.slice(0, 20));
});

check('负例注入：中文时长折让删除后攻击全部不再命中', () => {
  for (const t of ATTACKS_ZH) assert.equal(detectPeakEndRule(t, { DURATION_ZH: [] }).hit, false, '删时长折让ZH: ' + t.slice(0, 20));
});

check('负例注入：英文三族删除后攻击全部不再命中', () => {
  for (const t of ATTACKS_EN) assert.equal(detectPeakEndRule(t, { PEAK_END_EN: [] }).hit, false, '删峰终锚点EN: ' + t.slice(0, 20));
  for (const t of ATTACKS_EN) assert.equal(detectPeakEndRule(t, { WHOLE_VERDICT_EN: [] }).hit, false, '删整体裁定EN: ' + t.slice(0, 20));
  for (const t of ATTACKS_EN) assert.equal(detectPeakEndRule(t, { DURATION_EN: [] }).hit, false, '删时长折让EN: ' + t.slice(0, 20));
});

check('负例注入：概念讨论豁免删除后豁免句变红（承重证明）', () => {
  assert.equal(detectPeakEndRule(EXEMPT_CONCEPT[0], { CONCEPT_ZH: NEVER }).hit, true, '删概念讨论ZH');
  assert.equal(detectPeakEndRule(EXEMPT_CONCEPT[1], { CONCEPT_EN: NEVER }).hit, true, '删概念讨论EN');
});

check('负例注入：均衡评价豁免删除后豁免句变红（承重证明）', () => {
  assert.equal(detectPeakEndRule(EXEMPT_CORRECTIVE[0], { CORRECTIVE_ZH: NEVER }).hit, true, '删均衡评价ZH');
  assert.equal(detectPeakEndRule(EXEMPT_CORRECTIVE[1], { CORRECTIVE_EN: NEVER }).hit, true, '删均衡评价EN');
});

check('负例注入：邻近距离窗承重（放大到 500 后超距句命中）', () => {
  assert.equal(detectPeakEndRule(OVERDIST).hit, false, '默认窗不命中');
  assert.equal(detectPeakEndRule(OVERDIST, { PAIR_ZH: 500 }).hit, true, '放大窗后命中');
});

check('引擎闸：良性样本不得以 peak_end_rule 进 findings', () => {
  const engine = require('../src/gate.js');
  const gate = engine.check || engine.gate || engine.checkOutput;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN_HARD) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('peak_end_rule'), '误伤: ' + t);
  }
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
