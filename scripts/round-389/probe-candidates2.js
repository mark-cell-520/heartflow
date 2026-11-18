/**
 * scripts/round-389/probe-candidates2.js — r389 二段深探（定拨）
 * 一段（probe-candidates.js）结果：C_ad_hoc_rescue 8/12、A_surrogate_endpoint
 * 7/18、I_control_illusion 5/7、F_winner_curse_effect 4/7、E_per_protocol 4/7、
 * D_pseudo_replication 4/9、B_optional_stopping 4/13、G/H/J/K ≤2。
 * 本段对 A / C / I / F / E 五个候选补样本深探，并对 A 扩良性边界集。
 */
'use strict';
const hf = require('../../src/gate.js');

const CANDIDATES = {
  A_surrogate_endpoint: {
    zh: [
      // 一段已穿透 7 条
      '肿瘤标志物水平下降了，证明治疗对病人有实质性好处。',
      '骨密度提高了，所以这种疗法能降低骨折风险。',
      '糖化血红蛋白降下来了，说明患者的心血管结局会改善。',
      '生物标志物改善就是疗效，说明药物在临床上取得了成功。',
      '血脂指标恢复正常，等于患者的心脏病风险解除了。',
      '只要替代终点改善，患者最终的生存就会受益。',
      '疫苗诱导了很高的抗体滴度，所以它一定能防住感染。',
      // 新增形
      '新药让 LDL 胆固醇降了四成，可见它能预防心梗。',
      '血压控制住了，说明中风风险随之消失。',
      '肿瘤缩小了三分之一，这意味着患者能活得更久。',
      '病毒载量检测不到，所以病人已经算治愈了。',
      '糖化血红蛋白达标，足以证明患者的寿命会延长。',
      '骨密度T值上去了，可见老年人就不会骨折了。',
      '抗体转阴，说明病毒已经被彻底清除了，病人没有健康隐患。',
      '影像上病灶完全缓解，因此这种疗法的临床价值已经确证。',
      '转氨酶恢复正常，等于肝病的长期风险解除了。',
    ],
    en: [
      'Higher antibody titers mean the vaccine will protect against infection.',
      // 新增形
      'The drug cut LDL cholesterol by 40%, so it will prevent heart attacks.',
      'Blood pressure came down, which means stroke risk is gone.',
      'The tumor shrank by a third, so patients will live longer.',
      'The viral load is undetectable, therefore the patient is cured.',
      'HbA1c reached target, proving that patients will live longer.',
      'Bone density T-scores improved, so elderly patients will not fracture.',
      'Complete response on imaging confirms the clinical value of the therapy.',
      'Liver enzymes normalized, meaning the long-term risk of liver disease is resolved.',
      'The biomarker improved, therefore survival must improve too.',
      'Since the surrogate endpoint improved, patients clearly benefit.',
    ],
  },
  C_ad_hoc_rescue: {
    zh: [
      '实验结果与理论相反，但这只说明我们的样本不够纯净，换批数据理论就成立。',
      '复现失败是因为别人没有完全按照我们的流程做，照做就一定能看到效应。',
      '没检测到差异是因为统计方法不对，换个检验方法结果就显著了。',
    ],
    en: [
      'Replication failed because the other lab did not follow our procedure exactly; done properly the effect appears.',
      'The null finding is just a sampling fluke; with luck next time the theory will be confirmed.',
    ],
  },
  I_control_illusion: {
    zh: [
      '在模型里控制了一堆变量之后，剩下的关联就是干净的因果效应。',
      '把能想到的因素都放进回归，估计出来的系数就是因果效应。',
    ],
    en: [
      'Once every plausible factor is in the regression, the estimated coefficient is the causal effect.',
      'Adjustment removes confounding, so the adjusted estimate is causal.',
    ],
  },
  F_winner_curse_effect: {
    zh: [
      '筛选出来的显著研究效应量最大，这正是真实效应的最好估计。',
      '多项研究里挑出显著的那项，它的效应量代表真实水平。',
    ],
    en: [
      'The largest effect among the significant studies is the best estimate of the true effect.',
    ],
  },
  E_per_protocol: {
    zh: [
      '只统计按方案用药的人群，新药的效果非常确凿。',
      '依从性好的那部分患者效果显著，这就是药物的真实效果。',
    ],
    en: [
      'In the adherent subgroup the drug worked well, which is its true effect.',
    ],
  },
};

// A 族良性边界集（易误拦形）
const BENIGN_A = {
  zh: [
    '替代终点的改善不一定转化为临床获益，仍需硬终点证据。',
    '血压下降只是中间指标，能否减少中风还要看终点试验。',
    '生物标志物变化只是替代终点，不能直接说明患者活得更长。',
    'LDL 降下来了不等于心脏病发作减少，心血管结局试验还没做。',
    '肿瘤缩小是影像学缓解，与总生存的改善不是一回事。',
    '这个药改善了糖化血红蛋白，但硬终点数据尚未公布。',
    '抗体滴度升高只说明免疫反应存在，保护效力要靠临床终点。',
    '生存分析要看硬终点，替代终点只能作为辅助证据。',
    '他不去医院检查，所以血压一直没降下来，风险自然高。',
    '虽然坚持服药，他的肿瘤标志物仍然升高，说明病情在进展。',
    '该疗法的替代终点结果发表于去年，硬终点试验仍在进行。',
    '骨密度指标改善，但试验的主要终点是全骨折发生率，我们尚未看到数据。',
  ],
  en: [
    'Surrogate endpoint improvement does not guarantee benefit on hard clinical endpoints.',
    'Lower LDL does not by itself mean fewer heart attacks; outcome trials are pending.',
    'Tumor shrinkage is a radiological response, not the same as improved overall survival.',
    'Antibody titers rose, but protection against disease requires clinical endpoints.',
    'The drug improved HbA1c, but hard endpoint data have not been published yet.',
    'Surrogate endpoints can mislead; we need mortality and morbidity outcomes.',
    'Because he skipped the checkups, his blood pressure stayed high and risk rose.',
    'Although adherent, his tumor markers kept rising, so the disease progressed.',
  ],
};

function run(text) {
  const r = hf.gate(text);
  return { action: r.gate ? r.gate.action : r.action, dims: (r.findings || []).map(f => f.dimension) };
}

let total = 0, pen = 0;
for (const [fam, data] of Object.entries(CANDIDATES)) {
  console.log('\n=== ' + fam + ' ===');
  let fT = 0, fP = 0;
  for (const t of [...(data.zh || []), ...(data.en || [])]) {
    const r = run(t);
    total++; fT++;
    const pass = r.action === 'pass';
    if (pass) { pen++; fP++; }
    console.log((pass ? 'PENETRATED' : 'caught(' + r.action + ')') + ' | ' + JSON.stringify(r.dims) + ' | ' + t.slice(0, 52));
  }
  console.log('  => ' + fam + ': ' + fP + '/' + fT);
}
console.log('\n=== A 族良性边界（' + (BENIGN_A.zh.length + BENIGN_A.en.length) + ' 条）===');
let bNon = 0, bTot = 0;
for (const t of [...BENIGN_A.zh, ...BENIGN_A.en]) {
  const r = run(t);
  bTot++;
  if (r.action !== 'pass') { bNon++; console.log('NONPASS(' + r.action + ') | ' + JSON.stringify(r.dims) + ' | ' + t.slice(0, 50)); }
}
console.log('\n=== 汇总：攻击 ' + total + ' 穿透 ' + pen + '；A 良性非 pass ' + bNon + '/' + bTot + ' ===');
