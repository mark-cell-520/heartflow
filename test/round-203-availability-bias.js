/**
 * test/round-203-availability-bias.js — 第 200 维度 availability_bias
 * （可得性偏差：availability bias / availability heuristic——
 * 可得性线索×频率推断两腿结构）负例注入测试 + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入后，依赖该腿的攻击必须停止命中；依赖某豁免的陷阱
 *      样本在抹掉它后必须转为命中（证明豁免承重）。
 *
 * 161 轮教训：负例全绿≠不漏——裸名词/带修饰/倒装/长句变体与边缘良性另在
 * variant-matrix 段用真实 gate() 复量（≥5 攻击变体全部 gate.action 非 pass
 * 且 availability_bias 维度承重，≥5 良性全部 pass）。本族枚举刻意收裸名词
 * 形态（「老听说」「刷到」「满屏都是」「热搜」「听得多了」去后缀仍命中）；
 * 腿②的「很常见/越来越普遍」等裸频率词带否定前缀 lookbehind 保护
 * （「不代表真的多」是正确判别，不判）。
 *
 * 立项证据：grep -ril '可得性偏差|可得性启发|availability heuristic|老听说|
 * 满屏都是' src/ 仅命中 fallacy_fallacy 概念豁免清单与 selection-bias 注释，
 * 无任何维度以「可得性线索×频率推断」两腿结构覆盖本族；gate() 实测攻击
 * 样本 5 条全 pass（真零命中）、良性 5 条 pass。外部搜索无纯规则成熟方案
 * 可集成，判据为心虫自有纯规则实现。
 */
const assert = require('assert');
const { checkAvailabilityBias } = require('../src/availability-bias.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}
const NEVER = /(?!x)x/; // 永不匹配

// ─── 攻击样本（中文×6 / 英文×3 / 含裸名词、带修饰、倒装、长句）────────
const ATTACK = [
  '最近老听到坠机新闻，看来坐飞机越来越危险了。',                                   // 老听说 + 越来越（裸名词+频率推断）
  '打开社交媒体满屏都是诈骗案，可见这类案件如今比比皆是。',                         // 满屏都是 + 比比皆是（倒装长句）
  '电视里天天放车祸视频，所以车祸一定大幅增加了。',                                 // 电视里天天放 + 大幅增加（媒体轰炸族）
  '身边朋友全在聊基金亏损，八成现在散户都在亏钱。',                                 // 身边全是 + 八成（概率模态）
  '热搜上天天都是明星塌房，足见演艺圈已然道德沦丧成风。',                           // 热搜 + 成风（带修饰）
  '媒体连篇累牍报道食品安全问题，这说明此类事件近期激增，老百姓恐怕早已见怪不怪。', // 连篇累牍 + 激增 + 见怪不怪（长句三段）
  "I keep hearing about plane crashes on the news, so flying must be getting more dangerous.", // EN keep hearing + must be getting
  'All I see on my feed is crypto scams — it must be rampant everywhere by now.',   // EN all I see + must be rampant
  'Terrorist attacks keep coming up in the news, which proves such incidents are happening all the time.', // EN 长句
];

// ─── 良性样本（边缘良性：数据依据/求证/概念讨论/缺腿/疑问）──────────────
const BENIGN = [
  '最近多地通报了类似案例，建议排查系统性问题。',                                   // 多地通报=真实证据（无主观曝光词、无推断腿）
  '我最近老刷到萌宠视频，很解压。',                                                 // 缺推断腿（只有主观体验）
  '官方统计显示诈骗报案量同比上升，需要加强预警。',                                 // 数据依据在场（无曝光线索）
  '我天天听到邻居吵架，但不代表小区离婚率真的上升了。',                             // 可得性 + 否认推断（正确判别）
  '这节课讲「可得性偏差」：把容易回忆的事当成高发事件，是常见的认知陷阱。',         // 概念/教学转述
  '最近老听到这事，是不是变多了？',                                                 // 疑问句（问的是趋势本身）
  '虽然新闻里地震报道很多，但我们要看历史频率数据才能判断趋势。',                   // 媒体曝光 + 主动求证（正确判别）
  '这项研究统计了三十年的数据，表明事故率其实在下降。',                             // 统计依据（无曝光线索）
  "I keep hearing about layoffs, but I should check the actual employment statistics before drawing any conclusions.", // EN 可得性 + 求证
];

// ─── 豁免陷阱（含豁免放行 → 抹掉豁免转命中）───────────────────────────
t('豁免陷阱：数据在场放行，抹掉统计词转命中', () => {
  const withExempt = '最近老听说坠机新闻，据统计显示，近年来这类报道越来越多，看来坐飞机越来越危险了。';
  assert.strictEqual(checkAvailabilityBias(withExempt).hit, false, '含数据依据应放行');
  const stripped = '最近老听说坠机新闻，近年来这类报道越来越多，看来坐飞机越来越危险了。';
  assert.strictEqual(checkAvailabilityBias(stripped).hit, true, '抹掉「据统计显示」后应命中');
});

t('豁免陷阱：求证在场放行，抹掉求证词转命中', () => {
  const withExempt = '最近老听说坠机新闻，看来坐飞机越来越危险了，但这不代表真的如此，要以数据为准。';
  assert.strictEqual(checkAvailabilityBias(withExempt).hit, false, '含求证陈述应放行');
  const stripped = '最近老听说坠机新闻，看来坐飞机越来越危险了。';
  assert.strictEqual(checkAvailabilityBias(stripped).hit, true, '抹掉「不代表/以数据为准」后应命中');
});

t('豁免陷阱：概念转述放行，抹掉概念词转命中', () => {
  const withExempt = '最近老听说坠机新闻，看来坐飞机越来越危险了，这就是典型的可得性偏差。';
  assert.strictEqual(checkAvailabilityBias(withExempt).hit, false, '概念讨论应放行');
  const stripped = '最近老听说坠机新闻，看来坐飞机越来越危险了。';
  assert.strictEqual(checkAvailabilityBias(stripped).hit, true, '抹掉概念词后应命中');
});

t('豁免陷阱：疑问句放行，去问号转命中', () => {
  const q = '最近老听说坠机，是不是越来越危险了？';
  assert.strictEqual(checkAvailabilityBias(q).hit, false, '疑问句应放行');
  const s = '最近老听说坠机，看来是越来越危险了。';
  assert.strictEqual(checkAvailabilityBias(s).hit, true, '去问号转断言后应命中');
});

// ─── 腿常量负例注入承重（逐侧）───────────────────────────────────────
t('注入：AVAIL_ZH 置空 → 中文攻击全部停判', () => {
  for (const s of ATTACK.slice(0, 6)) {
    assert.strictEqual(checkAvailabilityBias(s, { AVAIL_ZH: [] }).hit, false, s);
  }
});

t('注入：FREQ_ZH 置空 → 中文攻击全部停判', () => {
  for (const s of ATTACK.slice(0, 6)) {
    assert.strictEqual(checkAvailabilityBias(s, { FREQ_ZH: [] }).hit, false, s);
  }
});

t('注入：AVAIL_EN 置空 → 英文攻击全部停判', () => {
  for (const s of ATTACK.slice(6)) {
    assert.strictEqual(checkAvailabilityBias(s, { AVAIL_EN: [] }).hit, false, s);
  }
});

t('注入：FREQ_EN 置空 → 英文攻击全部停判', () => {
  for (const s of ATTACK.slice(6)) {
    assert.strictEqual(checkAvailabilityBias(s, { FREQ_EN: [] }).hit, false, s);
  }
});

t('注入：EXEMPT_EVIDENCE_ZH 置空 → 证据型良性转命中', () => {
  const s = '最近老听说坠机新闻，据统计显示近年来这类报道越来越多。';
  assert.strictEqual(checkAvailabilityBias(s).hit, false);
  assert.strictEqual(checkAvailabilityBias(s, { EXEMPT_EVIDENCE_ZH: [] }).hit, true);
});

t('注入：EXEMPT_VERIFY_ZH 置空 → 求证型良性转命中', () => {
  const s = '最近老听说坠机新闻，看来真的越来越多，但这不代表真的变多了。';
  assert.strictEqual(checkAvailabilityBias(s).hit, false);
  assert.strictEqual(checkAvailabilityBias(s, { EXEMPT_VERIFY_ZH: [] }).hit, true);
});

t('注入：EXEMPT_META_ZH 置空 → 概念型良性转命中', () => {
  const s = '可得性偏差最近老听说坠机新闻，看来坐飞机越来越危险了。';
  assert.strictEqual(checkAvailabilityBias(s).hit, false);
  assert.strictEqual(checkAvailabilityBias(s, { EXEMPT_META_ZH: [] }).hit, true);
});

// ─── 结构性不判（缺腿 / 邻近窗外）────────────────────────────────────
t('结构：缺腿①（只有频率结论，无论及曝光来源）不判', () => {
  assert.strictEqual(checkAvailabilityBias('这类案件现在很常见，需要引起重视。').hit, false);
});

t('结构：缺腿②（只有曝光线索，无频率推断）不判', () => {
  assert.strictEqual(checkAvailabilityBias('最近老听到这首歌，旋律还不错。').hit, false);
});

t('结构：邻近窗 60 字外的跨段共现不判', () => {
  const far = '最近老听说有人中彩票的消息。' + '话说回来，' .repeat(20) + '由此可见，如今中彩票的人想必越来越多了。';
  assert.strictEqual(checkAvailabilityBias(far).hit, false, '两腿距离超窗应不判');
});

t('结构：短文本（<6 字符）不判', () => {
  assert.strictEqual(checkAvailabilityBias('老听说').hit, false);
});

// ─── 正向汇总 ────────────────────────────────────────────────────────
t('正向：全部攻击样本命中（无注入态）', () => {
  for (const s of ATTACK) {
    const r = checkAvailabilityBias(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.score > 0 && r.detail, 'score/detail 应非空: ' + s);
  }
});

t('正向：全部良性样本放行（无注入态）', () => {
  for (const s of BENIGN) {
    assert.strictEqual(checkAvailabilityBias(s).hit, false, '误伤: ' + s);
  }
});

// ─── gate 层变体矩阵（真实 gate() 复量，非仅模块自检）────────────────
t('gate 矩阵：攻击变体全部 action≠pass 且 availability_bias 承重', () => {
  const variants = [
    '最近老听到坠机新闻，看来坐飞机越来越危险了。',                     // 标准形态
    '满屏都是诈骗的消息，可见这类案件比比皆是。',                       // 裸名词（满屏都是）
    '电视新闻里天天播车祸，足见路上车祸一定激增。',                     // 媒体轰炸
    '身边同事全在聊裁员，八成行业要大裁员了。',                         // 环境线索 + 概率
    '我一想就能想起好多明星塌房的例子，难怪大家觉得这行当道德沦丧已蔚然成风。', // 记忆提取 + 长句
    'I keep hearing about data breaches in the news, so they must be increasingly common.', // EN 标准
    'All I hear about these days is layoffs — it must be rampant everywhere.',            // EN 裸名词
  ];
  for (const s of variants) {
    const g = gate(s);
    assert.notStrictEqual(g.gate.action, 'pass', '变体被放行: ' + s + ' → ' + g.gate.action);
    const hit = (g.findings || []).some(f => f.dimension === 'availability_bias');
    assert.ok(hit, 'availability_bias 未承重: ' + s + ' → ' + g.gate.action);
  }
});

t('gate 矩阵：良性变体全部 pass', () => {
  const variants = [
    '最近多地通报了类似案例，建议排查系统性问题。',
    '我最近老刷到萌宠视频，很解压。',
    '我天天听到邻居吵架，但不代表小区离婚率真的上升了。',
    '官方统计显示诈骗报案量同比上升，需要加强预警。',
    '战争是多因共同造成的。',
    "I keep hearing about layoffs, but I should check the actual employment statistics first.",
  ];
  for (const s of variants) {
    const g = gate(s);
    assert.strictEqual(g.gate.action, 'pass', '良性被拦: ' + s + ' → ' + g.gate.action + ' / ' + (g.findings || []).map(f => f.dimension).join(','));
  }
});

// ─── 汇总 ────────────────────────────────────────────────────────────
console.log('\nround-203 availability_bias: ' + pass + ' passed / ' + fail + ' failed');
if (fail > 0) process.exit(1);
