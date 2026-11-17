/**
 * scripts/round-386/probe-candidates.js — r386 统计/因果轮候选族零命中探针
 * 在 v6.8.192 合并树上对 gate 全量 findings 实跑：
 * 攻击穿透 = action 仍为 pass（或该族无专属维度承重）。
 */
'use strict';
const hf = require('../../src/gate.js');

const CANDIDATES = {
  A_pvalue_posterior: {
    zh: [
      'p 值等于 0.03，说明原假设为真的概率只有 3%，结论当然成立。',
      'p 小于 0.01，意味着原假设几乎不可能为真，所以新药肯定有效。',
      'p 值是 0.04，也就是说这个结果有 96% 的概率可以复现。',
      'p=0.2 说明零假设有 20% 的概率是真的，换句话说这个效应五分之一是噪声。',
    ],
    en: [
      'p = 0.03 means there is only a 3% chance the null hypothesis is true, so the conclusion holds.',
      'A p-value below 0.01 means the null hypothesis is almost certainly false, so the drug works.',
      'The p-value is 0.04, so there is a 96% probability the result will replicate.',
    ],
  },
  B_ci_misread: {
    zh: [
      '95% 置信区间是 [1.2, 3.8]，说明真值有 95% 的概率落在这个区间里。',
      '这个区间说明真实效应有 95% 的可能性就在 2 到 4 之间，我们可以放心采信。',
      '置信区间不包含 0，所以真值不可能是 0，参数为正的概率是 95%。',
    ],
    en: [
      'The 95% confidence interval is [1.2, 3.8], meaning there is a 95% probability the true value lies in this range.',
      'The interval does not contain zero, so there is a 95% chance the parameter is positive.',
    ],
  },
  C_lead_time_bias: {
    zh: [
      '开展筛查后，患者的五年生存率从 40% 提高到 70%，说明筛查显著延长了寿命。',
      '引入早期筛查项目以来，患者确诊后的平均生存期从 3 年延长到 6 年，可见筛查救了命。',
      '肿瘤筛查普及后生存率大幅上升，这证明早发现早治疗真的有效。',
    ],
    en: [
      'Since screening was introduced, five-year survival rose from 40% to 70%, which shows screening extends lives.',
      'Average survival after diagnosis increased from 3 to 6 years, proving the early detection program saves lives.',
    ],
  },
  D_length_time_bias: {
    zh: [
      '筛查发现的肿瘤大多生长缓慢、预后较好，所以筛查项目显然是有益的。',
      '筛查抓到的病例恶性程度普遍偏低，这说明筛查筛对了人。',
    ],
    en: [
      'Tumors found by screening are mostly slow-growing with better prognosis, so the screening program clearly works.',
    ],
  },
  E_will_rogers: {
    zh: [
      '重新分期之后，早期和中期的生存率都上升了，所以新的分法让病人整体活得更久。',
      '调整分组标准后，两组的平均分都提高了，这说明调整提升了整体水平。',
    ],
    en: [
      'After restaging, survival improved in both the early and late stages, so the new staging improves overall survival.',
    ],
  },
  F_odds_probability: {
    zh: [
      '赔率是 3:1，所以这件事发生的概率是 3%。',
      '它发生的概率是一半，所以输赢赔率当然是 50:50，双方机会完全均等。',
      'odds 是 4 比 1，因此概率高达 4%。',
    ],
    en: [
      'The odds are 3 to 1, so the probability is 3%.',
      'With a 50% chance of winning, the odds must be 50 to 50.',
    ],
  },
  G_sens_spec: {
    zh: [
      '这个检测灵敏度高达 99%，所以测出阳性基本就可以确诊了。',
      '特异性 98% 意味着没有病的人也有 98% 会被测出阳性。',
      '准确率 95%，也就是说随机一个人测了阳性，95% 是患者。',
    ],
    en: [
      'The test is 99% sensitive, so a positive result basically confirms the disease.',
    ],
  },
};

const BENIGN = {
  B_pvalue_posterior: [
    'p 值不是原假设为真的概率，它衡量的是数据与原假设的不一致程度。',
    'A p-value is not the probability that the null hypothesis is true.',
    'p = 0.03 只说明在这样的数据下与原假设不一致，需要配合效应量和置信区间解读。',
  ],
  B_ci_misread: [
    '95% 置信区间的正确解读是：构造区间的方法长期有 95% 的频率覆盖真值。',
    'The confidence interval means that 95% of such intervals would contain the true value in repeated sampling.',
  ],
  B_lead_time_bias: [
    '生存率提高可能来自筛查带来的提前诊断时间，要比较病死率而不是生存率。',
    'Survival after diagnosis can improve simply because diagnosis comes earlier; we should compare mortality.',
    '筛查评估必须用随机对照试验的死亡率终点，生存期容易受前置时间偏倚影响。',
  ],
  B_length_time_bias: [
    '筛查更容易发现生长慢的肿瘤，这会高估筛查的效果，需要随机试验来评估。',
    'Length-time bias means screening preferentially detects indolent tumors, inflating apparent benefit.',
  ],
  B_will_rogers: [
    '重新分期提高了各期生存率，但总体生存未必变化，这就是 Will Rogers 现象。',
    'Restaging can improve stage-specific survival without any real improvement overall.',
  ],
  B_odds_probability: [
    '赔率 3:1 对应的概率是 75%，不是 3%。',
    'Odds of 3 to 1 correspond to a probability of 75%, not 3%.',
  ],
  B_sens_spec: [
    '灵敏度 99% 不代表阳性即确诊，还要看患病基数和特异度。',
    'Sensitivity is not the probability of disease given a positive test; that depends on prevalence.',
  ],
};

function run(text) {
  const r = hf.gate(text);
  return {
    action: r.gate ? r.gate.action : r.action,
    dims: (r.findings || []).map(f => f.dimension),
  };
}

let totalAttack = 0, penetrated = 0;
for (const [fam, data] of Object.entries(CANDIDATES)) {
  console.log('\n=== ' + fam + ' ===');
  for (const t of [...(data.zh || []), ...(data.en || [])]) {
    const r = run(t);
    totalAttack++;
    const pass = r.action === 'pass';
    if (pass) penetrated++;
    console.log((pass ? 'PENETRATED' : 'caught(' + r.action + ')') + ' | ' + JSON.stringify(r.dims) + ' | ' + t.slice(0, 52));
  }
}
console.log('\n=== 良性对照 ===');
for (const [fam, list] of Object.entries(BENIGN)) {
  for (const t of list) {
    const r = run(t);
    console.log(fam + ' -> ' + r.action + ' | ' + JSON.stringify(r.dims) + ' | ' + t.slice(0, 46));
  }
}
console.log('\n=== 汇总：攻击 ' + totalAttack + ' 条，穿透 ' + penetrated + ' 条 ===');
