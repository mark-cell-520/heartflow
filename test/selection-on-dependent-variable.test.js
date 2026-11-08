/**
 * test/selection-on-dependent-variable.test.js — r252 选择依赖变量维度测试
 * 覆盖：攻击命中（双腿型中英 + 倒装）、疑难良性零误伤、两组豁免族（概念教学 /
 * 正确因果对冲，嵌入真实签名，可负例注入证明承重）、边界锁（单腿句 / 邻接
 * 维度领地 survivorship·illicit_conversion·collider/RCT / 超距）、多签名档位、
 * 负例注入（腿①逐语 / 腿②逐语 / 距离窗双向承重 / 两组豁免逐语删除）、官方
 * 良性语料 272、引擎闸。与 r218-r251 模块同一测试范式。
 */
'use strict';
const assert = require('node:assert/strict');
const { detectSelectionOnDependentVariable, __internals } = require('../src/selection-on-dependent-variable.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

const NEVER = /(?!)/;
const D = detectSelectionOnDependentVariable;

// ─── 攻击样本 A：双腿型（腿①结果选择群体 × 腿②因果归因，邻近共现）─────
// 注入 NO_SELECT / NO_CAUSE / W=0 均应失配
const ATTACK_ZH = [
  '能活下来的公司都融过资，所以融资能救命',
  '活到九十岁的老人都坚持早起，所以早起能让人长寿',
  '上岸的考生都报过这个班，所以报这个班就能考上',
  '战胜癌症的人都心态乐观，所以乐观就能战胜癌症',
  '熬过寒冬的企业都囤过现金，所以囤现金让企业活了下来',
  '中了彩票的人都坚持买号，所以坚持买号就能中奖',
  '所以融资能救命——你看，能活下来的公司都融过资',       // 倒装：结论在前
  '凡是成功活过寒冬的企业，无一例外都囤过大量现金，可见囤现金让企业活了下来',
  '闯出来的创业者都敢赌，因此敢赌造就了他们的成功',
  '康复的患者都心态平和，可见平和的心态让他们康复',
];
const ATTACK_EN = [
  'Among the companies that survived, all had raised funding, so raising funding is what saves companies',
  'Everyone who beat the illness had tried this treatment, so the treatment is the cure',
  'The startups that made it all worked eighty-hour weeks, so working eighty hours is what makes a startup succeed',
  'Those who reached the summit had trained at altitude, so altitude training is why they summited',
  'The students who passed all had used this app, so the app is what gets students to pass',
  'All the survivors of the crash had worn helmets, which proves helmets are what saved them',
];

// ─── 疑难良性压力样本（提到幸存群体+共性但不下因果断言 / 要求对照）─────
const BENIGN_HARD = [
  '能活下来的公司有个共同点：都融过资，这值得研究，但不能就此断定融资是原因',
  '活到九十岁的老人普遍早起，不过长寿可能和基因、医疗、饮食都有关',
  '战胜癌症的人里乐观者居多，可这和治疗效果谁是因谁是果还不清楚',
  '上岸的考生很多报过这个班，但报班和考上都可能是准备充分的体现',
  '存活患者都用过偏方，可偏方也许只在轻症里被用，得看重症的数据',
  '中彩票的人确实常买号，但买号只是必要条件，说明不了它导致中奖',
  '夺冠球队多请过心理教练，可这更可能是结果——成绩好了才请得起',
  'Among the survivors all wore seatbelts, which is expected, but we still need a controlled comparison',
  'These patients all recovered and all took the drug, but recovery could reflect spontaneous remission',
  'Everyone who passed used the app, though app use may just mark already-motivated students',
  'The lottery winners bought regularly, but that is necessary, not sufficient — we cannot infer it causes winning',
  'Those who summited trained at altitude, yet altitude training may correlate with resources rather than cause the summit',
];

// ─── 单腿句（缺任一条腿 → 不判）────────────────────────────────────
const SINGLE_LEG = [
  '能活下来的公司都融过资，这是它们的共同点。',            // 只有腿①，无因果断语
  '只要肯坚持就能成功，努力是成功的钥匙。',                // 只有腿②，无结果选择群体
  '活下来的公司普遍现金流健康，值得进一步分析。',          // 腿① + 良性评论，无腿②因果动词
];

// ─── 邻接领地边界锁（应 miss：由其它维度代拦，本模块不越界）──────────
const ADJACENT = {
  survivorship: [
    '比尔·盖茨辍学创业成了世界首富，所以你也该退学',
    'Steve Jobs dropped out and built Apple, so college is unnecessary',
  ],
  illicit_conversion: [
    '夺冠的球队都请过心理教练，所以心理教练是夺冠的关键',   // 主谓同位形式 → 归 167
    '闯出来的创业者都敢赌，所以敢赌正是他们闯出来的原因',
  ],
  collider_RCT: [
    '随机对照试验显示，用药组存活率显著更高，所以药提高了存活率',  // 条件对比 → 归 209
    'In a randomized trial the treatment group survived longer, so the treatment improves survival',
    '控制了年龄和病情后，用药仍与更高存活率相关，这支持药物的作用',
  ],
};

// ─── 豁免族样本（嵌入真实签名，删对应豁免后必须变红）────────────────
// 概念教学：含 concept 标记 + 真实签名，且不含 correctiive 标记
const CONCEPT_SAMPLES = [
  { zh: '选择依赖变量的教科书案例：能活下来的公司都融过资，所以融资能救命，这就是按结果选择样本的谬误。', key: 'CONCEPT_ZH' },
  { en: 'This textbook selection bias example shows: among the companies that survived, all had raised funding, so raising funding is what saves companies.', key: 'CONCEPT_EN' },
];
// 正确因果与对冲：含 correctiive 标记 + 真实签名，且不含 concept 标记
const CORRECTIVE_SAMPLES = [
  { zh: '能活下来的公司都融过资，所以融资能救命，但这只是相关，不能就此断定因果，需要对照组。', key: 'CORRECTIVE_ZH' },
  { en: 'Among the companies that survived, all had raised funding, so raising funding is what saves companies, but we still need a controlled comparison.', key: 'CORRECTIVE_EN' },
];

// 超距样本：两腿在同一句内但相距 > W_ZH=60（删默认窗放大到 500 后命中）
const OVERDIST = '能活下来的公司都融过资，' +
  '他们在过去十年里经历了完整的融资周期和多轮市场波动与资本寒冬的反复考验，也见证了同行在没有外部注资情况下的生死存亡与命运沉浮，' +
  '所以融资能救命。';

// ─── 测试 ───────────────────────────────────────────────────────
check('函数存在 + 返回结构（命中时字段齐全）', () => {
  assert.equal(typeof D, 'function');
  const r = D('能活下来的公司都融过资，所以融资能救命');
  assert.equal(r.hit, true);
  assert.equal(r.dimension, 'selection_on_dependent_variable');
  assert.ok(r.details && r.details.includes('选择依赖变量'));
  assert.ok(r.guidance && r.guidance.length > 50);
  assert.ok(Array.isArray(r.evidence) && r.evidence.length >= 1);
  assert.ok(Array.isArray(r.tags) && r.tags.includes('selection-on-the-dependent-variable'));
});

check('攻击命中：双腿型 中英', () => {
  for (const t of ATTACK_ZH) assert.equal(D(t).hit, true, 'ZH: ' + t);
  for (const t of ATTACK_EN) assert.equal(D(t).hit, true, 'EN: ' + t);
});

check('疑难良性零误伤', () => {
  for (const t of BENIGN_HARD) assert.equal(D(t).hit, false, '误伤: ' + t);
});

check('单腿句不判（缺任一条腿）', () => {
  for (const t of SINGLE_LEG) assert.equal(D(t).hit, false, '单腿误判: ' + t);
});

check('邻接领地边界锁：survivorship / illicit_conversion / collider_RCT 均不判', () => {
  for (const [k, arr] of Object.entries(ADJACENT))
    for (const t of arr) assert.equal(D(t).hit, false, k + ' 越界: ' + t);
});

check('多签名档位：单签名 0.62 / 多签名 0.72', () => {
  const one = D('能活下来的公司都融过资，所以融资能救命');
  assert.equal(one.count, 1);
  assert.ok(Math.abs(one.score - 0.62) < 1e-9, '单签名 0.62');
  const multi = D('能活下来的公司都融过资，所以融资能救命；能上岸的考生都报过班，所以报班就能考上。');
  assert.ok(multi.count >= 2, '多签名 count=' + multi.count);
  assert.ok(Math.abs(multi.score - 0.72) < 1e-9, '多签名 0.72');
  const mixed = D('能活下来的公司都融过资，所以融资能救命；those who passed all had used this app, so the app is what gets students to pass');
  assert.ok(mixed.count >= 2, '中英混排 count=' + mixed.count);
  assert.ok(Math.abs(mixed.score - 0.72) < 1e-9, '中英混排 0.72');
});

check('负例注入：删腿①（SELECT_ZH/EN=[]）后双腿攻击全部失配', () => {
  for (const t of ATTACK_ZH) assert.equal(D(t, { SELECT_ZH: [] }).hit, false, '删腿①ZH: ' + t);
  for (const t of ATTACK_EN) assert.equal(D(t, { SELECT_EN: [] }).hit, false, '删腿①EN: ' + t);
});

check('负例注入：删腿②（CAUSE_ZH/EN=[]）后双腿攻击全部失配', () => {
  for (const t of ATTACK_ZH) assert.equal(D(t, { CAUSE_ZH: [] }).hit, false, '删腿②ZH: ' + t);
  for (const t of ATTACK_EN) assert.equal(D(t, { CAUSE_EN: [] }).hit, false, '删腿②EN: ' + t);
});

check('负例注入：距离窗双向承重（默认窗超距不命中，放大到 500 命中）', () => {
  assert.equal(D(OVERDIST).hit, false, '默认 W_ZH=60 超距不命中');
  assert.equal(D(OVERDIST, { W_ZH: 500 }).hit, true, '放大窗后命中（窗承重）');
});

check('负例注入：距离窗收紧到 0 后双腿攻击全部失配', () => {
  for (const t of ATTACK_ZH) assert.equal(D(t, { W_ZH: 0 }).hit, false, 'W_ZH=0: ' + t);
  for (const t of ATTACK_EN) assert.equal(D(t, { W_EN: 0 }).hit, false, 'W_EN=0: ' + t);
});

check('负例注入：概念教学豁免（中英）删除后豁免句变红（承重证明）', () => {
  for (const s of CONCEPT_SAMPLES) {
    const t = s.zh || s.en;
    assert.equal(D(t).hit, false, '概念教学默认豁免: ' + t.slice(0, 24));
    assert.equal(D(t, { [s.key]: NEVER }).hit, true, '删 ' + s.key + ' 后变红');
  }
});

check('负例注入：正确因果对冲豁免（中英）删除后豁免句变红（承重证明）', () => {
  for (const s of CORRECTIVE_SAMPLES) {
    const t = s.zh || s.en;
    assert.equal(D(t).hit, false, '正确因果默认豁免: ' + t.slice(0, 24));
    assert.equal(D(t, { [s.key]: NEVER }).hit, true, '删 ' + s.key + ' 后变红');
  }
});

check('边界：空输入 / 非字符串 / 过短文本不崩', () => {
  for (const v of [undefined, null, '', '   ', 123, {}, [], '活']) {
    assert.equal(D(v).hit, false, '不得命中: ' + JSON.stringify(v));
  }
});

check('官方良性语料 272 条零误命中', () => {
  const path = require('node:path');
  const ROOT = path.join(__dirname, '..');
  const corpora = [];
  const push = (src, t) => { if (typeof t === 'string' && t.trim()) corpora.push({ src, text: t }); };
  const pick = (it) => (typeof it === 'string' ? it : (it && typeof it === 'object' ? (it.text || it.sample || it.input || it.prompt || it.content) : null));
  const gb = require(path.join(ROOT, 'test', 'gate-benchmark.js'));
  for (const [cat, arr] of Object.entries(gb.SAMPLES || {})) if (Array.isArray(arr)) for (const it of arr) push('gb:' + cat, pick(it));
  const ext = require(path.join(ROOT, 'test', 'gate-benchmark-extended.js'));
  for (const [k, v] of Object.entries(ext)) if (Array.isArray(v)) for (const it of v) push('ext:' + k, pick(it));
  const vb = require(path.join(ROOT, 'test', 'vertical-benign-benchmark.js'));
  for (const [cat, arr] of Object.entries(vb.CATEGORIES || {})) if (Array.isArray(arr)) for (const it of arr) push('vert:' + cat, pick(it));
  const bm = require(path.join(ROOT, 'test', 'benign-mixed-benchmark.js'));
  for (const [k, v] of Object.entries(bm)) if (Array.isArray(v)) for (const it of v) push('mixed:' + k, pick(it));
  assert.ok(corpora.length >= 270, '语料规模 ' + corpora.length);
  let hits = 0;
  for (const c of corpora) if (D(c.text).hit) { hits++; console.log('    [误命中] (' + c.src + ') ' + c.text.slice(0, 90)); }
  assert.equal(hits, 0, '官方良性语料误命中 ' + hits + ' 条');
});

check('引擎闸：模块未接线时 gate() 不得出现 selection_on_dependent_variable findings', () => {
  const engine = require('../src/gate.js');
  const gate = engine.gate;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN_HARD) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
    assert.ok(!dims.includes('selection_on_dependent_variable'), '误伤: ' + t);
  }
  // 模块未接线（provisional 240），接线规格由 1 号按报告补全；此处只锁定
  // 「不因本模块引入新误伤」与「gate 返回结构完整」。
  const out = gate('能活下来的公司都融过资，所以融资能救命');
  assert.ok(out && typeof out.gate === 'object', 'gate 返回结构完整');
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
