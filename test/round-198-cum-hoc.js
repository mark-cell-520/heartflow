/**
 * test/round-198-cum-hoc.js — 第 195 维度 cum_hoc（相关≠因果谬误：
 * cum hoc ergo propter hoc——显式相关标记×前向因果动词两腿结构）
 * 负例注入测试 + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入后，依赖该腿的攻击必须停止命中；依赖某豁免的陷阱
 *      样本在抹掉它后必须转为命中（证明豁免承重）。
 *
 * 161 轮教训：负例全绿≠不漏——裸名词/带修饰/倒装/长句变体与边缘良性另在
 * variant-matrix 段用真实 gate() 复量（≥5 攻击变体全部 gate.action 非 pass
 * 且 cum_hoc 维度承重，≥5 良性全部 pass）。本族枚举刻意收裸名词形态
 * （「相关」「同步」「成正比」「关联」去后缀仍命中）；结果动词（提升/提高/
 * 增加/降低/减少）须带因果模态前缀（能够/会/将/使…），既收「能够提升」又不
 * 误收「努力提高」这类目标表述。
 *
 * 立项证据：三层研究 + 引擎差距实测——grep -ril 'cum_hoc|cum-hoc' src/ 0
 * 命中（194 维无一覆盖「相关→因果」族：post_hoc 管时序、reverse_causation
 * 管反应型×负面、common_cause 管第三变量、pseudo_causal 管精确倍数）。
 * 侦察落盘 /tmp/hf-scout-<ts>.txt（GitHub 命中 NAACL 2025 faina
 * aclanthology.org/2025.naacl-long.34/ 20 类谬误标注作分类学参考；
 * Semantic Scholar 连续 429 空返，如实记录——判据纯规则自有实现）。
 */
const assert = require('assert');
const { checkCumHoc } = require('../src/cum-hoc.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}
const NEVER = /(?!x)x/; // 永不匹配

// ─── 攻击样本（中文×5 / 英文×3 / 含裸名词、带修饰、倒装、长句）────────
const ATTACK = [
  '冰淇淋销量和溺水死亡率高度相关，所以吃冰淇淋会导致溺水。',                     // 相关 + 导致（裸词）
  '国家的人均巧克力消费量与诺贝尔奖得主数量呈显著正相关，由此可见吃巧克力能够提升国民智力。', // 带修饰长句 + 正相关 + 能够提升
  'A和B这两项指标多年来一直同步波动，可见A的增长直接带来了B的提升。',               // 同步 + 带来（结果动词裸形）
  '说到底B的崛起是因为A，你看这两个变量长年一直成正比，A直接带来了B的崛起。',   // 倒装归因前置 + 成正比 + 带来
  '睡眠不足和记忆力下降总是伴随出现，可见睡眠不足会造成记忆力下降。',               // 伴随 + 造成
  'Iced tea sales are correlated with drowning deaths, so iced tea causes drowning.', // EN correlated + causes
  'Countries with more Nobel laureates consume more chocolate; the correlation is striking, therefore chocolate boosts intelligence.', // EN 长句 + boosts
  'Hours of practice are strongly associated with skill level, which means practice leads to mastery.', // EN associated + leads to
];

// ─── 良性样本（边缘良性：觉察/元讨论/证据/仅相关/共同因素/仅因果/对冲/目标句）──
const BENIGN = [
  '冰淇淋销量和溺水率相关，但这不代表吃冰淇淋会导致溺水，可能只是巧合。',       // 推理否定/觉察 + 对冲
  '这两项指标相关，但并不构成因果。',                                       // 觉察（awareness）
  '随机对照试验表明，这项干预确实导致了污染下降。',                             // 实验证据（有因果动词但受控设计豁免）
  '这两个变量长年同步波动，相关性很强。',                                     // 仅相关无因果腿
  'A和B相关，其实背后是C这个共同因素在起作用。',                               // 正确共同因素解释（无前向因果动词）
  '这项政策直接导致了污染下降，与其他指标的变化无关。',                           // 仅因果无相关腿
  'A和B相关，可能会导致B上升，具体还要看后续数据。',                             // 对冲
  'A和B相关，我们要进一步努力提高数据采集的质量。',                             // 边缘良性：相关 + 「努力提高」目标句（无因果模态前缀）
  'The two variables are correlated, but that does not mean one causes the other.', // EN 觉察
  'A randomized controlled trial confirmed that the treatment reduces mortality.', // EN 实验证据
];

// ─── 陷阱（证豁免承重：抹掉豁免后必须转为命中）──────────────────────
const TRAP_META = '统计学告诉我们：冰淇淋销量和溺水死亡率高度相关，所以吃冰淇淋会导致溺水。';
const TRAP_EVID = '随机对照试验显示冰淇淋销量和溺水死亡率相关，所以吃冰淇淋导致溺水。';
const TRAP_NEG  = '冰淇淋销量和溺水率相关，但并不代表吃冰淇淋导致溺水。';

console.log('\n[正向：攻击命中 / 良性放行]');
for (const s of ATTACK) t('攻击命中: ' + s.slice(0, 24), () => {
  const r = checkCumHoc(s); assert.ok(r.hit, '应命中却漏判'); assert.ok(r.score >= 0.6, 'score 应 ≥0.6');
});
for (const s of BENIGN) t('良性放行: ' + s.slice(0, 24), () => {
  assert.ok(!checkCumHoc(s).hit, '应放行却误判');
});
t('元讨论陷阱：放行', () => assert.ok(!checkCumHoc(TRAP_META).hit, '元讨论应放行'));
t('实验证据陷阱：放行', () => assert.ok(!checkCumHoc(TRAP_EVID).hit, '实验证据应放行'));
t('推理否定陷阱：放行', () => assert.ok(!checkCumHoc(TRAP_NEG).hit, '推理否定应放行'));

console.log('\n[承重：逐常量注入]');
t('抹掉相关标记腿（中英）→ 全部攻击停止命中（证 CORRELATION 腿承重）', () => {
  const inject = { CORRELATION_ZH: [NEVER], CORRELATION_EN: [NEVER] };
  for (const s of ATTACK) assert.ok(!checkCumHoc(s, inject).hit, '相关腿被抹后应停止命中: ' + s.slice(0, 24));
});
t('抹掉因果动词腿（中英）→ 全部攻击停止命中（证 CAUSAL 腿承重）', () => {
  const inject = { CAUSAL_ZH: [NEVER], CAUSAL_EN: [NEVER] };
  for (const s of ATTACK) assert.ok(!checkCumHoc(s, inject).hit, '因果腿被抹后应停止命中: ' + s.slice(0, 24));
});
t('抹掉元讨论豁免 → 元讨论陷阱转为命中（证 EXEMPT_META 承重）', () => {
  const r = checkCumHoc(TRAP_META, { EXEMPT_META_ZH: [NEVER], EXEMPT_META_EN: [NEVER] });
  assert.ok(r.hit, '抹掉元讨论豁免后陷阱应转为命中');
});
t('抹掉实验证据豁免 → 实验证据陷阱转为命中（证 EXEMPT_EVID 承重）', () => {
  const r = checkCumHoc(TRAP_EVID, { EXEMPT_EVID_ZH: [NEVER], EXEMPT_EVID_EN: [NEVER] });
  assert.ok(r.hit, '抹掉实验证据豁免后陷阱应转为命中');
});
t('抹掉推理否定豁免 → 推理否定陷阱转为命中（证 EXEMPT_NEG 承重）', () => {
  const r = checkCumHoc(TRAP_NEG, { EXEMPT_NEG_ZH: [NEVER], EXEMPT_NEG_EN: [NEVER] });
  assert.ok(r.hit, '抹掉推理否定豁免后陷阱应转为命中');
});
t('只抹掉英文相关腿 → 英文攻击停止命中，中文攻击仍命中（证中英逐侧独立）', () => {
  const inject = { CORRELATION_EN: [NEVER] };
  for (const i of [5, 6, 7]) assert.ok(!checkCumHoc(ATTACK[i], inject).hit, '英文攻击应停止命中');
  assert.ok(checkCumHoc(ATTACK[0], inject).hit, '中文攻击应仍命中');
});

console.log('\n[变体矩阵：真实 gate() 复量（161 轮教训）]');
for (const s of ATTACK) t('矩阵攻击 gate.action≠pass 且 cum_hoc 承重: ' + s.slice(0, 22), () => {
  const g = gate(s);
  assert.notStrictEqual(g.gate.action, 'pass', '攻击变体应非 pass');
  assert.ok((g.findings || []).some(f => f.dimension === 'cum_hoc'), 'cum_hoc 应承重进入 findings');
});
for (const s of BENIGN) t('矩阵良性 gate.action=pass: ' + s.slice(0, 22), () => {
  assert.strictEqual(gate(s).gate.action, 'pass', '良性变体应 pass');
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
