/**
 * test/significance-effect-size.test.js — r250 显著性≠重要性维度测试
 * 覆盖：攻击命中（中英）、良性零误伤（含疑难 FP 压力样本）、口径意识/
 * 概念教学两组豁免族（嵌入真实签名，可负例注入证明承重）、边界锁（单腿/
 * 邻接维度领地/限定性「只说明」/并列陈述无推断/阈值设定句/超距）、中英
 * 混排多签名、负例注入（腿①显著性陈述族/腿②四族裁定/推断标记/距离窗
 * 双向承重/两组豁免/限定性守卫逐组删除）、引擎闸。
 * 与 r218-r249 模块同一测试范式：每个负例注入删除一组常量后，攻击必须
 * 不再命中、豁免句必须变红——证明每一组判据都真实承重。
 */
'use strict';
const assert = require('node:assert/strict');
const { detectSignificanceEffectSize } = require('../src/significance-effect-size.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// 永不命中的正则（用于负例注入关闭某组常量）
const NEVER = /(?!)/;

// ─── 攻击样本（腿①显著性陈述 × 腿②实质性裁定 + 推断标记）────────
const ATTACK_ZH = [
  // p 值锚族
  'p 小于 0.05，所以这个药有效，可以全面推广',
  'p 值只有 0.01，效果当然非常显著，可以直接上',
  'p=0.03，说明新教材的效果更好，可以写进指南',
  'p 值低于 0.05，因此效应很大，可以马上线',
  'p 值只有 0.001，证明这个发现是重大突破',
  'p 值达标，说明新配方确实好很多',
  'p 值小于 0.05，说明新疗法确实更强，应该全面推广',
  // 统计显著措辞族
  '差异显著，说明新方法明显更好',
  '实验组显著优于对照组，这证明改进很大',
  '统计上显著，所以这个效应值得重视',
  '检验结果显著，结论就是新政策起作用了',
  '两组差异在统计上成立，说明新工艺确实强得多',
  '统计显示差异显著，因此这个干预措施效果很好，值得大规模推广',
  '显著性检验通过了，说明这个发现意义重大',
  '两组比较差异显著，可见新工艺确实更强',
  '检验结果达到统计意义，说明这个药明显有效',
];
const ATTACK_EN = [
  'p < 0.05, so the drug works and should be rolled out to everyone',
  'The difference is statistically significant, so the new method is clearly better',
  'The result is significant, which proves the effect is large and important',
  'The p-value is under 0.05, so the improvement is obviously substantial',
  'Significant at the 5% level, so the new feature clearly wins',
  'The significance test passed, so the new policy clearly works',
  'p = 0.02, therefore the effect is large and worth rolling out',
  'The difference was significant, so the new design is much better',
  'The p-value was below 0.05, which means the effect is a major finding',
  'Results were statistically significant, so the treatment definitely works',
  'The test came back significant, so the improvement is big enough to ship',
  'p<0.05, so the new feature is clearly better and should be rolled out',
];

// ─── 良性样本（不得命中：含疑难 FP 压力样本）────────────────────
const BENIGN_HARD = [
  // 给出效应量/置信区间/样本量的正当陈述
  'p 小于 0.05，但效应量很小，实际意义有限',
  '差异显著，不过置信区间宽，还要看效应量',
  'p=0.03 只是刚过线，效应量接近于零，不宜推广',
  '虽然显著，但样本量太小，结论要谨慎',
  'The effect was significant yet small; practical value remains unclear',
  'p < 0.05, but the effect size is tiny and probably not practically important',
  '实验组显著优于对照组，效应量 d=0.2，属于小效应',
  '检验结果显著，但差异只有 0.1 分，实际意义不大',
  'The result is significant, but the difference is too small to matter',
  'p=0.04，效果存在但幅度有限，需要更多研究',
  'p 值小于 0.05，说明两组确有差异，但是否重要还要看效应量',
  'The difference was significant; whether it matters depends on the effect size',
  // 概念教学（点名显著性与重要性的区别）
  '统计显著不等于重要，得结合效应量和样本量一起看',
  'Statistical significance alone does not tell us how large the effect is',
  '统计显著只是说明差异不太可能是偶然，不代表差异有实际意义',
  'The p-value only tells you about noise, not about how big the effect is',
  'p<0.05 只代表差异可检出，检出不等于重要',
  // 限定性「只说明」句式（推断标记被限定，非推断）
  'p 值小于 0.05 只说明差异不太可能是噪声，重要的是可重复性',
  'p 值小于 0.05 仅表示差异可检出，不表示差异有多大',
  // 并列陈述两件事而无推断（显著性只是并列事实）
  '新方法明显更好，而且 p 值也小于 0.05',
  'The new method is better, and the p-value is also under 0.05',
  // 阈值设定 / 教科书句（同形结构，宁缺勿滥）
  '显著性水平通常取 0.05，这个选择很重要',
  'p 值只是其中一个指标，更重要的是效应量和置信区间',
  // 单腿句
  'p 值小于 0.05',
  '新方法在速度和准确率上都更好',
  'The p-value is 0.04, yet the confidence interval spans zero',
  '样本量只有三十，p 值不足为凭',
  '他连显著性检验都没做就下结论',
  'p 值 0.049 和 0.051 没有本质区别，0.05 这条线太任意',
];

// ─── 豁免族 A：口径意识（真实签名 + 效应量/区间标记，不得命中）──
const EXEMPT_CORRECTIVE = [
  'p 小于 0.05，所以新药有效，不过效应量只有 0.1',
  'The difference was significant, so the new method is clearly better, but the effect size is small',
];

// ─── 豁免族 B：概念教学（真实签名 + 概念标记，不得命中）─────────
const EXEMPT_CONCEPT = [
  '统计显著不等于重要，但很多人拿它说明新方法明显更好',
  'Statistical significance does not mean importance, so people wrongly conclude the effect is large',
];

// ─── 边界锁 ────────────────────────────────────────────────────
const BOUNDARY = [
  ['单腿-只有显著性陈述', 'p 值小于 0.05。'],
  ['单腿-只有实质性裁定', '新方法明显更好。'],
  ['邻接-statistical_misleading', '基数太小，三个里的两个就是百分之六十七。'],
  ['邻接-base_rate_neglect', '这种病患病率只有万分之一，检测阳性就认定得了，太武断。'],
  ['邻接-ecological_fallacy', '统计显示甲地区人均预期寿命比乙地区高，所以随便挑一个甲地区的人也比乙地区的人长寿。'],
  ['邻接-hasty_generalization', '问了三个朋友都说好，这东西肯定靠谱。'],
  ['邻接-p_hacking', '试了三十种配方，有一种 p 值显著，就它了。'],
  ['邻接-law_of_small_numbers', '小样本里连续三次显著，不能推广到总体。'],
  ['邻接-count_rate_conflation', '这家店外卖单量是街角那家的五倍，味道肯定更好。'],
  ['邻接-false_precision', '数据精确到小数点后四位，其实是估的。'],
  ['限定性-只说明', 'p 值只说明差异可检出，新方法明显更好还要看长期数据。'],
  ['并列陈述-无推断', '新方法明显更好，而且 p 值也小于 0.05。'],
  ['阈值设定句', '显著性水平通常取 0.05，这个选择很重要。'],
];
// 双腿超距（默认 W_ZH=40：显著性陈述与裁定拉开 >40 不命中）
const OVERDIST = 'p 值小于 0.05，随后研究团队又花了整整一年时间在不同城市的不同医院里反复验证，收集了上万份随访记录并逐条核对，所以最后才得出新方法明显更好的结论。';

const MIXED = 'p 小于 0.05，所以这个药有效，可以全面推广；p < 0.05, so the drug works and should be rolled out to everyone.';
const MULTI_ZH = 'p 值小于 0.05，说明新疗法确实更强，应该全面推广；差异显著，因此新工艺明显更好，可以写进指南。';

console.log('significance-effect-size（r250 显著性≠重要性）测试:');

check('模块导出与短输入安全', () => {
  assert.equal(typeof detectSignificanceEffectSize, 'function');
  assert.equal(detectSignificanceEffectSize('').hit, false);
  assert.equal(detectSignificanceEffectSize(null).hit, false);
  assert.equal(detectSignificanceEffectSize('短').hit, false);
});

check('攻击命中：中文 16 条', () => {
  for (const t of ATTACK_ZH) {
    const r = detectSignificanceEffectSize(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.equal(r.dimension, 'significance_effect_size');
    assert.ok(r.score >= 0.6 && r.score <= 0.8, 'severity 档位: ' + t);
    assert.ok(r.details.length > 10, 'details 非空');
    assert.ok(r.evidence.length >= 1, 'evidence 非空');
    assert.ok(r.guidance.length > 20, 'guidance 非空');
  }
});

check('攻击命中：英文 12 条', () => {
  for (const t of ATTACK_EN) {
    const r = detectSignificanceEffectSize(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.ok(r.score >= 0.6 && r.score <= 0.8);
  }
});

check('良性零误伤：29 条（含疑难 FP 压力样本）', () => {
  for (const t of BENIGN_HARD) assert.equal(detectSignificanceEffectSize(t).hit, false, '误伤: ' + t);
});

check('豁免族：口径意识（中英 2 条）', () => {
  for (const t of EXEMPT_CORRECTIVE) assert.equal(detectSignificanceEffectSize(t).hit, false, '误伤: ' + t);
});

check('豁免族：概念教学（中英 2 条）', () => {
  for (const t of EXEMPT_CONCEPT) assert.equal(detectSignificanceEffectSize(t).hit, false, '误伤: ' + t);
});

check('边界锁：单腿/邻接/限定性/并列/阈值句/超距不判', () => {
  for (const [k, t] of BOUNDARY) assert.equal(detectSignificanceEffectSize(t).hit, false, '误判[' + k + ']: ' + t);
  assert.equal(detectSignificanceEffectSize(OVERDIST).hit, false, '默认邻近窗超距不命中');
});

check('中英混排与多签名加分档', () => {
  const m = detectSignificanceEffectSize(MIXED);
  assert.equal(m.hit, true, '混排应命中');
  assert.ok(m.count >= 2, '多签名（中英双腿各自成签名）');
  assert.ok(Math.abs(m.score - 0.72) < 1e-9, '双签名加分档');
  const z = detectSignificanceEffectSize(MULTI_ZH);
  assert.equal(z.hit, true);
  assert.ok(z.count >= 2, '多签名');
  assert.ok(Math.abs(z.score - 0.72) < 1e-9, '双签名加分档');
});

check('负例注入：腿①显著性陈述（中英）删除后攻击全部不再命中', () => {
  for (const t of ATTACK_ZH) assert.equal(detectSignificanceEffectSize(t, { SIG_ZH: [] }).hit, false, '删显著性陈述ZH: ' + t.slice(0, 20));
  for (const t of ATTACK_EN) assert.equal(detectSignificanceEffectSize(t, { SIG_EN: [] }).hit, false, '删显著性陈述EN: ' + t.slice(0, 20));
});

check('负例注入：腿②实质性裁定（中英四族）删除后攻击全部不再命中', () => {
  for (const t of ATTACK_ZH) assert.equal(detectSignificanceEffectSize(t, { IMPORTANCE_ZH: [], SUPERIOR_ZH: [], SCALE_ZH: [], MAGNITUDE_ZH: [] }).hit, false, '删裁定ZH: ' + t.slice(0, 20));
  for (const t of ATTACK_EN) assert.equal(detectSignificanceEffectSize(t, { IMPORTANCE_EN: [], SUPERIOR_EN: [], SCALE_EN: [], MAGNITUDE_EN: [] }).hit, false, '删裁定EN: ' + t.slice(0, 20));
});

check('负例注入：腿②重要性族单独删除后重要性族攻击不再命中', () => {
  for (const t of ['统计上显著，所以这个效应值得重视', '显著性检验通过了，说明这个发现意义重大', 'p 值只有 0.001，证明这个发现是重大突破']) {
    assert.equal(detectSignificanceEffectSize(t).hit, true, '默认应命中: ' + t);
    assert.equal(detectSignificanceEffectSize(t, { IMPORTANCE_ZH: [] }).hit, false, '删重要性族后应失配: ' + t);
  }
});

check('负例注入：推断标记（中英）删除后攻击全部不再命中', () => {
  for (const t of ATTACK_ZH) assert.equal(detectSignificanceEffectSize(t, { INFER_ZH: NEVER }).hit, false, '删推断标记ZH: ' + t.slice(0, 20));
  for (const t of ATTACK_EN) assert.equal(detectSignificanceEffectSize(t, { INFER_EN: NEVER }).hit, false, '删推断标记EN: ' + t.slice(0, 20));
});

check('负例注入：距离窗双向承重（默认窗超距不命中，放大到 500 后命中）', () => {
  assert.equal(detectSignificanceEffectSize(OVERDIST).hit, false, '默认 W_ZH=40 超距不命中');
  assert.equal(detectSignificanceEffectSize(OVERDIST, { W_ZH: 500 }).hit, true, '放大窗后命中（窗承重）');
});

check('负例注入：腿①×腿②距离窗收紧到 0 后攻击全部不再命中', () => {
  for (const t of ATTACK_ZH) assert.equal(detectSignificanceEffectSize(t, { W_ZH: 0 }).hit, false, 'W_ZH=0: ' + t.slice(0, 20));
  for (const t of ATTACK_EN) assert.equal(detectSignificanceEffectSize(t, { W_EN: 0 }).hit, false, 'W_EN=0: ' + t.slice(0, 20));
});

check('负例注入：口径意识豁免删除后豁免句变红（承重证明）', () => {
  assert.equal(detectSignificanceEffectSize(EXEMPT_CORRECTIVE[0], { CORRECTIVE_ZH: NEVER }).hit, true, '删口径意识ZH');
  assert.equal(detectSignificanceEffectSize(EXEMPT_CORRECTIVE[1], { CORRECTIVE_EN: NEVER }).hit, true, '删口径意识EN');
});

check('负例注入：概念教学豁免删除后豁免句变红（承重证明）', () => {
  assert.equal(detectSignificanceEffectSize(EXEMPT_CONCEPT[0], { CONCEPT_ZH: NEVER }).hit, true, '删概念教学ZH');
  assert.equal(detectSignificanceEffectSize(EXEMPT_CONCEPT[1], { CONCEPT_EN: NEVER }).hit, true, '删概念教学EN');
});

check('负例注入：限定性守卫删除后「只说明」句变红（承重证明）', () => {
  const t = 'p 值只说明差异可检出，新方法明显更好还要看长期数据';
  assert.equal(detectSignificanceEffectSize(t).hit, false, '限定性守卫下不命中');
  assert.equal(detectSignificanceEffectSize(t, { RESTRICTIVE_BEFORE: NEVER }).hit, true, '删限定性守卫后命中');
});

check('引擎闸：良性样本不得以 significance_effect_size 进 findings', () => {
  const engine = require('../src/gate.js');
  const gate = engine.gate;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN_HARD) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
    assert.ok(!dims.includes('significance_effect_size'), '误伤: ' + t);
  }
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
