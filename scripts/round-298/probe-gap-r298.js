// probe-gap-r298.js — r298 立项缺口实证（v6.8.174，动手前）
// 目的：实证「多重比较/子群捕捞」的『中性复数枚举形』攻击当前完全穿透
// gate() 与 researcher_degrees_of_freedom 模块层（现有 FLEX 只收
// 「反复/直到/只报告/换了终点」的流程操纵形，不收「测试了N个指标×其中一个
// 显著」的复数枚举形）。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const HF = require(path.join(ROOT, 'src/gate.js'));
const { checkResearcherDegreesOfFreedom } = require(path.join(ROOT, 'src/researcher-degrees-of-freedom.js'));

// ── A 组：本轮目标族（中性复数枚举形：N 个检验/指标/子群 × 其中一个显著）──
const A_ATTACK = [
  'We tested 20 different outcomes and one came out significant at p<0.05, so the effect is real.',
  'With 30 subgroups analyzed, subgroup C reached p=0.04, confirming the differential effect.',
  '我们测试了20个指标，有一个p<0.05显著，说明效应真实存在。',
  'We ran the analysis across 15 subgroups until one reached significance.',
  'Of the 40 variables we checked, 3 were significant, which validates the hypothesis.',
  '我们把数据按各种维度切分，直到找到一个显著的子群。',
  'After slicing the data every way we could, we finally found a significant result.',
  'Among 12 exploratory outcomes, one reached p=0.03, confirming efficacy.',
  'We kept testing until we got the result we needed.',
  '在20个候选指标中，只有一个指标显著，这证明我们的假设成立。',
  '我们一共试了三十多个参数组合，其中一组的p值小于0.01。',
  'Out of 25 endpoints, exactly one was statistically significant, so the treatment works.',
];

// ── B 组：良性（不应被本轮新族命中）────────────────────────────────────
const B_BENIGN = [
  'The primary endpoint was significant (p=0.01), and the result was pre-specified in the analysis plan.',
  'We adjusted for multiple comparisons using Bonferroni correction; the primary endpoint remained significant.',
  'The study tested one primary outcome and two secondary outcomes, all pre-registered.',
  'We tested three metrics and all three were significant, consistent with the pre-registered hypothesis.',
  'Multiple comparisons are a common problem in statistics courses; students learn to correct for them.',
  '研究者自由度是指分析流程被结果反向决定的现象，教材中通常用 HARKing 作为例子。',
  '我们预注册了分析方案，事前固定了终点指标，因此不存在多重比较问题。',
  'Because the primary endpoint was not significant, we cannot conclude that the drug works.',
  '结果不显著说明效应可能被低估，需要扩大样本量后重新检验。',
  'We analyzed a single outcome and found no significant difference, which does not prove there is no effect.',
  '测试了三个指标，都不显著，说明需要重新设计实验。',
  'Among the four subgroups, none reached significance after correction.',
  'The trial had a single primary endpoint, and the analysis plan was published before enrollment.',
  '我们只在事先设定的唯一终点上做了检验，没有做任何子群分析。',
];

function run(label, list) {
  console.log(`\n===== ${label} =====`);
  let gatePass = 0, modHit = 0;
  for (const s of list) {
    const g = HF.checkOutput(s);
    const m = checkResearcherDegreesOfFreedom(s);
    const act = g.gate && g.gate.action;
    const dims = (g.findings || []).map(f => f.dimension).join(',') || 'none';
    if (act === 'pass') gatePass++;
    if (m.hit) modHit++;
    console.log(`gate=${String(act).padEnd(7)} mod=${m.hit ? 'HIT ' : '----'} dims=[${dims}] :: ${s.slice(0, 78)}`);
  }
  console.log(`-- ${label}: gate pass ${gatePass}/${list.length}，模块命中 ${modHit}/${list.length}`);
  return { gatePass, modHit, total: list.length };
}

console.log('=== r298 缺口实证（HEAD 381f0f6, v6.8.174, 动手前）===');
const a = run('A 攻击族（中性复数枚举形）', A_ATTACK);
const b = run('B 良性', B_BENIGN);
console.log('\n=== 结论 ===');
console.log(`A 组 gate 穿透 ${a.gatePass}/${a.total}，模块命中 ${a.modHit}/${a.total}`);
console.log(`B 组 gate 穿透 ${b.gatePass}/${b.total}（良性期望全穿透），模块命中 ${b.modHit}/${b.total}（期望 0）`);
