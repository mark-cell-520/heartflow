/**
 * test/round-193-ad-nauseam.js — 第 191 维度
 * ad_nauseam（诉诸重复：把同一断言复读多遍、以重复频率冒充论据强度）
 * 负例注入测试 + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入后，依赖该腿的攻击必须停止命中（证明不是装饰）；
 *      依赖某豁免的陷阱样本在抹掉它后必须转为命中（证明豁免承重）。
 *
 * 161 轮教训：负例全绿≠不漏——裸名词/带修饰/倒装/长句变体与边缘良性另在
 * variant-matrix 段用真实 gate() 复量（≥5 攻击变体全部 gate.action 非 pass
 * 且 ad_nauseam 维度承重，≥5 良性全部 pass）。本族以「子句」为重复单元，
 * 天然覆盖裸名词形与倒装/嵌套/部分重复形。
 *
 * 立项证据：现有 190 维全为单句内容型谬误，无一覆盖重复密度型论证缺陷；
 * 侦察落盘 /tmp/hf-scout-<ts>.txt（arXiv:2405.02318；GitHub fallacy-detection
 * 仓库全为 LLM 方案，无可复用纯规则代码）。
 */
const assert = require('assert');
const { checkAdNauseam } = require('../src/ad-nauseam.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}
const NEVER = /(?!x)x/; // 永不匹配

// ─── 攻击样本（中文裸名词×3 / 嵌套倒装 / 长句 / 英文×3 / 标记+重复）────────
const ATTACK = [
  '这个方案绝对安全。这个方案绝对安全。这个方案绝对安全。',                 // 中文裸名词 ×3
  '事实证明这家公司值得信赖，这家公司值得信赖，事实证明这家公司值得信赖。',   // 嵌套/倒装（短单元被长句夹住）
  '我们必须现在立刻采取行动。我们必须现在立刻采取行动。我们必须现在立刻采取行动。', // 长句 ×3
  'The policy will work. The policy will work. The policy will work.',      // 英文 ×3
  'This approach works well. This approach works well. This approach works well.', // 英文 ×3
  '我已经反复强调过，数据从来不会说谎。数据从来不会说谎。数据从来不会说谎。',   // 标记 + 重复
];
// 仅靠标记腿命中的攻击（出现 2 次 + 显式重复标记）——用于证标记腿承重
const ATTACK_MARKER_ONLY = [
  '我已经反复强调过，数据是真实的。数据是真实的。',
  "As I've said many times, the plan is solid. The plan is solid.",
];

// ─── 良性样本（边缘良性：正确多因 / 证据累积 / 元讨论 / 劝止 / 引文复读）──
const BENIGN = [
  '战争是多因共同造成的，既有资源争夺，也有宗教与民族因素。',             // 边缘良性：正确多因陈述
  '实验一验证了方案甲，实验二验证了方案乙，实验三验证了方案丙，三个独立实验结论一致。',           // 证据累积（各子句不同）
  '这个方案经过充分论证，我们提供了三项独立证据支持这一结论。',             // 实质性论证
  'Study 1 found X. Study 2 found Y. Study 3 found Z.',                    // 英文证据累积
  '重复论证是一种逻辑谬误，又称诉诸重复。',                                 // 元讨论
  '请不要重复同样的错误，换一个方法再试。',                                 // 劝止（否定）
  '他反复引用：「这个方案绝对安全。这个方案绝对安全。这个方案绝对安全。」',   // 引文内复读（转述）
];
// 抹掉引文剥离后必须转为命中的陷阱（证 QUOTE_STRIP 豁免承重）
const TRAP_QUOTE = '他引用原话：「这个方案绝对安全。这个方案绝对安全。这个方案绝对安全。」';

console.log('\n[正向：攻击命中 / 良性放行]');
for (const s of ATTACK) t('攻击命中: ' + s.slice(0, 24), () => {
  const r = checkAdNauseam(s); assert.ok(r.hit, '应命中却漏判'); assert.ok(r.score >= 0.6, 'score 应 ≥0.6');
});
for (const s of ATTACK_MARKER_ONLY) t('标记腿攻击命中: ' + s.slice(0, 24), () => {
  assert.ok(checkAdNauseam(s).hit, '应经标记腿命中');
});
for (const s of BENIGN) t('良性放行: ' + s.slice(0, 24), () => {
  assert.ok(!checkAdNauseam(s).hit, '应放行却误判');
});
t('引文复读陷阱：剥离后放行', () => assert.ok(!checkAdNauseam(TRAP_QUOTE).hit, '引文内复读应放行'));

console.log('\n[承重：逐常量注入]');
t('抹掉重复标记 → 标记腿攻击停止命中（证标记腿承重）', () => {
  for (const s of ATTACK_MARKER_ONLY) {
    const r = checkAdNauseam(s, { REPEAT_MARKER_ZH: [], REPEAT_MARKER_EN: [] });
    assert.ok(!r.hit, '标记腿被抹后应停止命中: ' + s.slice(0, 24));
  }
});
t('抬高纯路径次数门槛 → 纯复读攻击停止命中（证 COUNT 腿承重）', () => {
  const r = checkAdNauseam(ATTACK[0], { cfg: { MIN_COUNT_PURE: 99, MIN_COUNT_MARKER: 99 } });
  assert.ok(!r.hit, 'COUNT 门槛抬高后应停止命中');
});
t('抬高中文长度门槛 → 中文攻击停止命中（证 UNIT 长度腿承重）', () => {
  const r = checkAdNauseam(ATTACK[0], { cfg: { MIN_LEN_ZH_CJK: 99 } });
  assert.ok(!r.hit, '中文长度门槛抬高后应停止命中');
});
t('抬高英文词数门槛 → 英文攻击停止命中（证 UNIT 词数腿承重）', () => {
  const r = checkAdNauseam(ATTACK[3], { cfg: { MIN_WORDS_EN: 99 } });
  assert.ok(!r.hit, '英文词数门槛抬高后应停止命中');
});
t('抹掉引文剥离 → 引文复读陷阱转为命中（证 QUOTE_STRIP 豁免承重）', () => {
  const r = checkAdNauseam(TRAP_QUOTE, { QUOTE_STRIP: [NEVER] });
  assert.ok(r.hit, '抹掉引文剥离后陷阱应转为命中');
});

console.log('\n[变体矩阵：真实 gate() 复量（161 轮教训）]');
const MATRIX_ATK = [
  '这个方案绝对安全。这个方案绝对安全。这个方案绝对安全。',
  '事实证明这家公司值得信赖，这家公司值得信赖，事实证明这家公司值得信赖。',
  '我们必须现在立刻采取行动。我们必须现在立刻采取行动。我们必须现在立刻采取行动。',
  'The policy will work. The policy will work. The policy will work.',
  'This approach works well. This approach works well. This approach works well.',
  '我已经反复强调过，数据从来不会说谎。数据从来不会说谎。数据从来不会说谎。',
];
const MATRIX_BEN = [
  '战争是多因共同造成的，既有资源争夺，也有宗教与民族因素。',
  '实验一验证了方案甲，实验二验证了方案乙，实验三验证了方案丙，三个独立实验结论一致。',
  '这个方案经过充分论证，我们提供了三项独立证据支持这一结论。',
  'Study 1 found X. Study 2 found Y. Study 3 found Z.',
  '第一步：收集数据。第二步：清洗数据。第三步：分析数据。',
  '重复论证是一种逻辑谬误，又称诉诸重复，应当避免。',
];
for (const s of MATRIX_ATK) t('矩阵攻击 gate.action≠pass 且 ad_nauseam 承重: ' + s.slice(0, 22), () => {
  const g = gate(s);
  assert.notStrictEqual(g.gate.action, 'pass', '攻击变体应非 pass');
  assert.ok((g.findings || []).some(f => f.dimension === 'ad_nauseam'), 'ad_nauseam 应承重进入 findings');
});
for (const s of MATRIX_BEN) t('矩阵良性 gate.action=pass: ' + s.slice(0, 22), () => {
  assert.strictEqual(gate(s).gate.action, 'pass', '良性变体应 pass');
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
