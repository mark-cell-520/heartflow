/**
 * test/round-209-simpsons-paradox.js — 第 206 维度
 * simpsons_paradox（聚合层逆转：辛普森悖论族——用总体/平均趋势结论
 * 覆盖子群/分组层方向相反的数据）负例注入测试 + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入后，依赖该腿的攻击必须停止命中；依赖某豁免
 *      的陷阱样本在抹掉它后必须转为命中（证明豁免承重）。
 *
 * 161 轮教训：负例全绿≠不漏——裸名词/带修饰/倒装/长句变体与边缘良
 * 性另在 variant-matrix 段用真实 gate() 复量（≥5 攻击变体全部
 * gate.action 非 pass 且 simpsons_paradox 承重，≥5 良性全部
 * pass）。本族枚举刻意收裸词形态（总体/整体/平均/合计/科室/班级/分层
 * /亚组 去前后缀仍命中）；「分层来看」只作数据开场、不作正确响应豁
 * 免（r209 实测教训：裸分层词豁免会把「可分层来看每个科室都在上升，
 * 但总体下降说明有效」的攻击形整句放过）。
 *
 * 立项证据：r209 族探针（/tmp/hf-probe-r209.js）在当前引擎
 * （v6.8.137，205 维）复测——聚合层逆转族攻击样本 10/13
 * gate.action=pass（真零命中，含中英双语、裸名词、带修饰、长句变
 * 体；其余 3 条被 proxy_metric_goal / stereotype+perfect_error 代
 * 拦）、良性 7/7 pass（零误伤）。外部来源：GitHub
 * ehart-altair/SimpsonsParadox ★18（Simpson's Pairs = variables
 * whose relationship with the dependent variable reverses when
 * conditioned on a second variable）+ ninoch/Trend-Simpsons-
 * Paradox ★57 + HN/Wikipedia Simpson's paradox 条目；Semantic
 * Scholar / arXiv 本轮网络不可达（空返），未引论文。
 */
const assert = require('assert');
const { checkSimpsonsParadox } = require('../src/simpsons-paradox.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 攻击样本（中文×8 / 英文×4 / 含裸名词、带修饰、长句）──────────
const ATTACK = [
  '总体死亡率下降了，所以这个治疗方案更安全，然而每个科室的死亡率都在上升。',   // 覆盖推断形 U-a
  '平均薪资在上涨，所以大家的收入都提高了，但按收入段拆分后，每一段的薪资都在下降。', // 长句 + 收入段
  '整体通过率提升了，说明改革确实有效，可分层来看每个年龄段的通过率都在降。',     // 分层来看开场仍背书（豁免教训样本）
  '合计成本在降低，因此项目更省钱，但各阶段的成本都在上升。',                   // 裸名词 合计/各阶段
  '总体发病率在下降，说明防控有效，然而在每个县发病率都在上升。',               // 每个县
  '总体死亡率在下降，每个科室的死亡率却都在上升——这个方案很安全。',             // 裸结论形 U-b（无推断词）
  '总体上两种疗法没有区别，所以分组差异不重要，然而在每一个年龄段里两种药的效果都截然相反。', // 抹平形
  '总体成功率上升，所以这套系统更可靠，尽管每一类请求的成功率都在下降。',       // 每一类
  'Overall mortality went down, so the new treatment is safer, but in every department mortality actually rose.', // EN U-a
  'Average scores went up, so the reform worked, while every subgroup declined.', // EN U-a
  'Overall costs fell, so the project is cheaper, but every phase saw costs rise.', // EN 裸名词 phase
  "The overall error rate declined, so the release is safe, yet every module's error rate went up.", // EN U-a
];

// ─── 良性样本（边缘良性：概念转述/方向相同/正确响应/让步）──────────
const BENIGN = [
  '这是典型的辛普森悖论：总体死亡率下降了，但每个科室的死亡率都在上升，不能只看总体数据。', // 概念转述 + 正确响应
  '平均分提高了，每个班的平均分也提高了。',                                   // 方向相同
  '总体死亡率下降了，各科室死亡率也都下降了，说明方案有效。',                   // 方向相同
  '总体通过率提升了，但分层后每个年龄段都在下降，需要重新评估方案。',             // 正确响应（重新评估）
  '总体成本下降了，所以更便宜了，但每个部件的成本都在上升，需要进一步验证。',       // 边缘良性：聚合结论 + 逆转 + 待验证
  '这个方案的安全性需要随机对照试验来验证。',                                 // 无双层结构
  "This is a textbook case of Simpson's paradox: overall survival rose while every subgroup declined.", // EN 概念转述
  'Overall revenue grew, and every region grew as well.',                       // EN 方向相同
  '总体经济在增长，各行各业都在蓬勃发展。',                                     // 同向且无相反腿
  '整体满意度提升了，每个部门也都提升了。',                                     // 方向相同
];

t('攻击样本全部命中（checkSimpsonsParadox）', () => {
  for (const s of ATTACK) {
    const r = checkSimpsonsParadox(s);
    assert.ok(r.hit, '应命中: ' + s.slice(0, 26));
    assert.ok(r.score >= 0.5, '分数应 ≥0.5: ' + s.slice(0, 26) + ' → ' + r.score);
  }
});

t('良性样本全部放行（checkSimpsonsParadox）', () => {
  for (const s of BENIGN) {
    const r = checkSimpsonsParadox(s);
    assert.ok(!r.hit, '应放行: ' + s.slice(0, 26) + ' → ' + r.detail);
  }
});

// ─── 负例注入承重（r161 纪律：逐常量验证承重）──────────────────────
const NEVER = /(?!x)x/;

t('注入 AGG_ZH=[] → 中文聚合腿攻击停止命中', () => {
  const twoLeg = [
    '总体死亡率下降了，所以这个治疗方案更安全，然而每个科室的死亡率都在上升。',
    '合计成本在降低，因此项目更省钱，但各阶段的成本都在上升。',
  ];
  for (const s of twoLeg) {
    assert.ok(checkSimpsonsParadox(s).hit, '无注入应命中: ' + s.slice(0, 20));
    assert.ok(!checkSimpsonsParadox(s, { AGG_ZH: [] }).hit, 'AGG_ZH 承重: ' + s.slice(0, 20));
  }
});

t('注入 SUB_ZH=[] → 中文子群腿攻击停止命中', () => {
  const twoLeg = [
    '总体死亡率下降了，所以这个治疗方案更安全，然而每个科室的死亡率都在上升。',
    '总体发病率在下降，说明防控有效，然而在每个县发病率都在上升。',
  ];
  for (const s of twoLeg) {
    assert.ok(!checkSimpsonsParadox(s, { SUB_ZH: [] }).hit, 'SUB_ZH 承重: ' + s.slice(0, 20));
  }
});

t('注入 TREND_UP_ZH=永假 → 上升方向腿攻击停止命中', () => {
  const s = '总体死亡率下降了，所以这个治疗方案更安全，然而每个科室的死亡率都在上升。';
  assert.ok(checkSimpsonsParadox(s).hit, '无注入应命中');
  assert.ok(!checkSimpsonsParadox(s, { TREND_UP_ZH: NEVER }).hit, 'TREND_UP_ZH 承重');
});

t('注入 TREND_DOWN_ZH=永假 → 下降方向腿攻击停止命中', () => {
  const s = '总体发病率在下降，说明防控有效，然而在每个县发病率都在上升。';
  assert.ok(checkSimpsonsParadox(s).hit, '无注入应命中');
  assert.ok(!checkSimpsonsParadox(s, { TREND_DOWN_ZH: NEVER }).hit, 'TREND_DOWN_ZH 承重');
});

t('注入 INFER_ZH=[] → 覆盖推断形（U-a）攻击停止命中', () => {
  const s = '总体死亡率下降了，所以这个治疗方案更安全，然而每个科室的死亡率都在上升。';
  assert.ok(!checkSimpsonsParadox(s, { INFER_ZH: [] }).hit, 'INFER_ZH 承重');
});

t('注入 AFFIRM_ZH=[] → 裸结论形（U-b）攻击停止命中', () => {
  const s = '总体死亡率在下降，每个科室的死亡率却都在上升——这个方案很安全。';
  assert.ok(checkSimpsonsParadox(s).hit, '无注入应命中');
  assert.ok(!checkSimpsonsParadox(s, { AFFIRM_ZH: [] }).hit, 'AFFIRM_ZH 承重');
});

t('注入 FLATTEN_ZH=[] → 抹平形攻击停止命中', () => {
  const s = '总体上两种疗法没有区别，所以分组差异不重要，然而在每一个年龄段里两种药的效果都截然相反。';
  assert.ok(checkSimpsonsParadox(s).hit, '无注入应命中');
  assert.ok(!checkSimpsonsParadox(s, { FLATTEN_ZH: [] }).hit, 'FLATTEN_ZH 承重');
});

t('注入 REVERSAL_ZH=[] → 抹平形逆转标记承重', () => {
  const s = '总体上两种疗法没有区别，所以分组差异不重要，然而在每一个年龄段里两种药的效果都截然相反。';
  assert.ok(!checkSimpsonsParadox(s, { REVERSAL_ZH: [] }).hit, 'REVERSAL_ZH 承重');
});

t('注入 AGG_EN=[] → 英文聚合腿攻击停止命中', () => {
  const s = 'Overall mortality went down, so the new treatment is safer, but in every department mortality actually rose.';
  assert.ok(checkSimpsonsParadox(s).hit, '无注入应命中');
  assert.ok(!checkSimpsonsParadox(s, { AGG_EN: [] }).hit, 'AGG_EN 承重');
});

t('注入 SUB_EN=[] → 英文子群腿攻击停止命中', () => {
  const s = 'Average scores went up, so the reform worked, while every subgroup declined.';
  assert.ok(!checkSimpsonsParadox(s, { SUB_EN: [] }).hit, 'SUB_EN 承重');
});

t('注入 AFFIRM_EN=[] → 英文肯定结论腿攻击停止命中', () => {
  const s = 'Overall costs fell, so the project is cheaper, but every phase saw costs rise.';
  assert.ok(!checkSimpsonsParadox(s, { AFFIRM_EN: [] }).hit, 'AFFIRM_EN 承重');
});

t('注入 EXEMPT_META_ZH=[] → 概念转述陷阱转为命中（豁免承重）', () => {
  const trap = '辛普森悖论告诉我们：总体死亡率下降了，所以这个方案更安全，然而每个科室的死亡率都在上升。';
  assert.ok(!checkSimpsonsParadox(trap).hit, '无注入应被豁免');
  assert.ok(checkSimpsonsParadox(trap, { EXEMPT_META_ZH: [] }).hit, 'EXEMPT_META_ZH 承重');
});

t('注入 EXEMPT_CORRECT_ZH=[] → 正确响应陷阱转为命中（豁免承重）', () => {
  const trap = '总体成本下降了，所以更便宜了，但每个部件的成本都在上升，需要进一步验证。';
  assert.ok(!checkSimpsonsParadox(trap).hit, '无注入应被豁免');
  assert.ok(checkSimpsonsParadox(trap, { EXEMPT_CORRECT_ZH: [] }).hit, 'EXEMPT_CORRECT_ZH 承重');
});

t('注入 EXEMPT_META_EN=[] → 英文概念转述陷阱转为命中（豁免承重）', () => {
  const trap = "Simpson's paradox is when overall survival rose, so the drug looks better, while every subgroup declined.";
  assert.ok(!checkSimpsonsParadox(trap).hit, '无注入应被豁免');
  assert.ok(checkSimpsonsParadox(trap, { EXEMPT_META_EN: [] }).hit, 'EXEMPT_META_EN 承重');
});

// ─── 变体矩阵（真实 gate() 复量——负例测试之外的强制项）─────────────
t('变体矩阵：攻击变体全部 gate.action 非 pass 且 simpsons_paradox 承重', () => {
  const variants = [
    '总体死亡率下降了，所以这个治疗方案更安全，然而每个科室的死亡率都在上升。',   // 裸名词 科室
    '平均薪资在上涨，所以大家的收入都提高了，但按收入段拆分后，每一段的薪资都在下降。', // 长句 + 带修饰
    '合计成本在降低，因此项目更省钱，但各阶段的成本都在上升。',                   // 裸名词 合计/各阶段
    '总体发病率在下降，说明防控有效，然而在每个县发病率都在上升。',               // 每个县
    '总体上两种疗法没有区别，所以分组差异不重要，然而在每一个年龄段里两种药的效果都截然相反。', // 抹平形
    'Overall mortality went down, so the new treatment is safer, but in every department mortality actually rose.', // EN 裸词
    'Average scores went up, so the reform worked, while every subgroup declined.', // EN 长句
  ];
  for (const s of variants) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass',
      '攻击变体应非 pass: ' + s.slice(0, 24) + ' → ' + r.gate.action);
    const f = (r.findings || []).find(x => x.dimension === 'simpsons_paradox');
    assert.ok(f, 'simpsons_paradox 维度应承重: ' + s.slice(0, 24));
  }
});

t('变体矩阵：良性样本全部 gate pass', () => {
  const benign = [
    '这是典型的辛普森悖论：总体死亡率下降了，但每个科室的死亡率都在上升，不能只看总体数据。', // 边缘良性：概念 + 正确响应
    '平均分提高了，每个班的平均分也提高了。',                                   // 方向相同
    '总体通过率提升了，但分层后每个年龄段都在下降，需要重新评估方案。',             // 边缘良性：正确响应
    '总体成本下降了，所以更便宜了，但每个部件的成本都在上升，需要进一步验证。',       // 边缘良性：待验证
    "This is a textbook case of Simpson's paradox: overall survival rose while every subgroup declined.", // EN 概念转述
    'Overall revenue grew, and every region grew as well.',                       // EN 方向相同
  ];
  for (const s of benign) {
    const r = gate(s);
    assert.strictEqual(r.gate.action, 'pass',
      '良性样本应 pass: ' + s.slice(0, 24) + ' → ' + r.gate.action +
      ' [' + (r.findings || []).map(f => f.dimension).join(',') + ']');
  }
});

console.log('\nround-209 simpsons_paradox: ' + pass + ' passed / ' + fail + ' failed');
process.exit(fail > 0 ? 1 : 0);
