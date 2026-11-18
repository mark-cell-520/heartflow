/**
 * scripts/round-389/selftest.js — surrogate_endpoint_misread 模块层自检
 * 攻击集（探针穿透 24/45 的样本）+ 良性边界集 + 射程隔离集（既有族攻击句）。
 */
'use strict';
const M = require('../../src/surrogate-endpoint-misread.js');
const det = M.detectSurrogateEndpointMisread;

const ATTACK = [
  // ZH（一段穿透 7 + 二段新增）
  '肿瘤标志物水平下降了，证明治疗对病人有实质性好处。',
  '骨密度提高了，所以这种疗法能降低骨折风险。',
  '糖化血红蛋白降下来了，说明患者的心血管结局会改善。',
  '生物标志物改善就是疗效，说明药物在临床上取得了成功。',
  '血脂指标恢复正常，等于患者的心脏病风险解除了。',
  '只要替代终点改善，患者最终的生存就会受益。',
  '疫苗诱导了很高的抗体滴度，所以它一定能防住感染。',
  '新药让 LDL 胆固醇降了四成，可见它能预防心梗。',
  '血压控制住了，说明中风风险随之消失。',
  '肿瘤缩小了三分之一，这意味着患者能活得更久。',
  '病毒载量检测不到，所以病人已经算治愈了。',
  '糖化血红蛋白达标，足以证明患者的寿命会延长。',
  '骨密度T值上去了，可见老年人就不会骨折了。',
  '抗体转阴，说明病毒已经被彻底清除了，病人没有健康隐患。',
  '影像上病灶完全缓解，因此这种疗法的临床价值已经确证。',
  '转氨酶恢复正常，等于肝病的长期风险解除了。',
  // EN
  'Higher antibody titers mean the vaccine will protect against infection.',
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
];

const BENIGN = [
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
  'Surrogate endpoint improvement does not guarantee benefit on hard clinical endpoints.',
  'Lower LDL does not by itself mean fewer heart attacks; outcome trials are pending.',
  'Tumor shrinkage is a radiological response, not the same as improved overall survival.',
  'Antibody titers rose, but protection against disease requires clinical endpoints.',
  'The drug improved HbA1c, but hard endpoint data have not been published yet.',
  'Surrogate endpoints can mislead; we need mortality and morbidity outcomes.',
  'Because he skipped the checkups, his blood pressure stayed high and risk rose.',
  'Although adherent, his tumor markers kept rising, so the disease progressed.',
];

// 射程隔离集：既有族攻击句（本模块必须零命中）
const RANGE = [
  ['proxy_metric_goal', 'DAU 和点击率涨了，说明产品目标已经达成，用户需求被满足了。'],
  ['proxy_metric_goal', '免疫接种覆盖率上去了，说明公共卫生问题已经解决了。'],
  ['confounding_by_indication', '医生倾向于给病情更重的人用新药，两组结局不同说明新药有效。'],
  ['healthy_user_bias', '吃维生素的人更健康，所以维生素能让人更健康。'],
  ['weak_evidence_strong_claim', '只有三个病例，但足以证明这个疗法彻底治愈了癌症。'],
  ['effect_measure_misread', 'OR=2.1，说明风险是普通人的2.1倍。'],
  ['significance_verdict_misread', 'p=0.049，说明效应确实存在。'],
  ['censoring_neglect', '随访满一年全部健在，可以宣告新药更安全。'],
  ['relative_risk_individual_transfer', '人群相对风险翻倍，所以你得病的概率就是别人的两倍。'],
];

let aHit = 0;
for (const t of ATTACK) {
  const r = det(t);
  if (r.hit) aHit++;
  else console.log('MISS | ' + t.slice(0, 50));
}
console.log('ATTACK hit: ' + aHit + '/' + ATTACK.length);

let bHit = 0;
for (const t of BENIGN) {
  const r = det(t);
  if (r.hit) { bHit++; console.log('BENIGN-HIT | ' + t.slice(0, 50)); }
}
console.log('BENIGN non-pass(module): ' + bHit + '/' + BENIGN.length);

let rHit = 0;
for (const [fam, t] of RANGE) {
  const r = det(t);
  if (r.hit) { rHit++; console.log('RANGE-HIT[' + fam + '] | ' + t.slice(0, 50)); }
}
console.log('RANGE cross-hit: ' + rHit + '/' + RANGE.length);
console.log('total: ' + (aHit === ATTACK.length && bHit === 0 && rHit === 0 ? 'PASS' : 'NEEDS-WORK'));
