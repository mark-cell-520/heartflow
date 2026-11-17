/**
 * scripts/round-387/probe-candidates.js — r387 统计素养轮候选族零命中探针
 * 在 v6.8.192 合并树上对 gate 全量 findings 实跑。
 * 攻击穿透 = action 仍为 pass，或 findings 无任何统计素养维度承重。
 */
'use strict';
const hf = require('../../src/gate.js');
const gate = hf.gate;

const CANDIDATES = {
  A_borderline_significance: {
    zh: [
      '结果接近显著水平（p = 0.06），说明干预措施确实有效。',
      '该效应呈现边缘显著的趋势，可以认为处理组更优。',
      'p 值达到 0.07，已经接近统计显著，我们有理由相信存在真实效应。',
      '差异虽未达显著，但已接近显著阈值，方向符合预期。',
      '统计上勉强接近显著水平，这提示治疗可能改善预后。',
      '结果处于显著性的边缘，基本可以认定新方法更好。',
      '两组差异趋向显著，趋势明确，说明方案有效。',
      '检验结果接近 0.05 的临界值，效应方向与假设一致，可以采信。',
      '疗效差异接近统计学意义，可以认为新药优于安慰剂。',
      '该指标几乎达到显著水平，说明策略确实起了作用。',
    ],
    en: [
      'The result approached significance (p = 0.06), showing the intervention works.',
      'The effect showed a borderline significant trend, so the treatment group can be considered superior.',
      'At p = 0.07 the finding approaches statistical significance, giving us reason to believe a real effect exists.',
      'The difference was marginally significant and in the expected direction.',
      'Results hovered on the brink of significance, essentially confirming the hypothesis.',
      'The trend approached significance, indicating a clear effect of the policy.',
      'The finding fell just short of significance but the direction supports our theory.',
      'A definite trend toward significance was observed, so the effect is real.',
      'The effect was close to significance, which supports our hypothesis.',
      'A marginal trend toward significance suggests the program is effective.',
    ],
  },
  B_nonsig_no_effect: {
    zh: [
      'p 值大于 0.05，说明两组之间没有差异，该药物无效。',
      '差异不显著，证明这个因素没有影响，可以排除。',
      '统计检验未达显著，说明两者之间不存在关系。',
      '结果不显著，因此该干预没有任何效果。',
      'p = 0.32 表明变量之间毫无关联，假设被否定。',
      '检验不显著，说明暴露与结局之间没有联系，无需进一步研究。',
      '不显著即无效：该疗法对存活率没有作用。',
      '由于 p 值不显著，我们可以断定不存在效应。',
      'p 值未达显著，证明疫苗不能预防感染。',
      '检验结果不显著，说明该方法没有效果，应当放弃。',
    ],
    en: [
      'p > 0.05, so there is no difference between the two groups and the drug does not work.',
      'The difference was not significant, proving this factor has no effect and can be ruled out.',
      'The test was not significant, showing there is no relationship between the two variables.',
      'The result was not significant, so the intervention had no effect whatsoever.',
      'p = 0.32 indicates no association between the variables, so the hypothesis is refuted.',
      'Because the test was not significant we can conclude there is no effect.',
      'The p-value exceeded 0.05, demonstrating that the treatment is ineffective.',
      'No significant difference was found, so the policy has no impact.',
    ],
  },
};

const TARGET = {
  A_borderline_significance: 'borderline_significance',
  B_nonsig_no_effect: 'nonsignificant_no_effect',
};

let totalAtt = 0, penetrate = 0;
for (const [key, fam] of Object.entries(CANDIDATES)) {
  console.log(`\n=== ${key} (目标维度: ${TARGET[key]}) ===`);
  for (const [lang, arr] of Object.entries(fam)) {
    arr.forEach((t, i) => {
      totalAtt++;
      let r;
      try { r = gate(t); } catch (e) { console.log(`  ${key}/${lang}/${i} CRASH ${e.message}`); penetrate++; return; }
      const action = r.gate ? r.gate.action : r.action;
      const dims = (r.findings || []).map(f => f.dimension);
      const hit = dims.includes(TARGET[key]);
      const status = (action !== 'pass' && hit) ? 'HIT' : (action !== 'pass' ? 'OTHER-DIM' : 'PASS');
      if (status !== 'HIT') penetrate++;
      console.log(`  ${status} ${lang}[${i}] action=${action} dims=${JSON.stringify(dims)}`);
      console.log(`      text: ${t.slice(0, 64)}`);
    });
  }
}
console.log(`\n=== 汇总：攻击 ${totalAtt} 条，穿透 ${penetrate} 条（命中 ${totalAtt - penetrate}）===`);
