// r250 缺口探针 + 变体矩阵实测（探针，非测试断言）
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { gate } = require(path.join(ROOT, 'src/gate.js'));
const { checkSurvivorTimeBias } = require(path.join(ROOT, 'src/survivor-time-bias.js'));

const attacks = [
  // 教科书原型（r249 探针漏判句）
  ['proto_zh', '接受这种疗法的病人平均活了五年，没接受的只活了一年，可见这疗法有效'],
  ['proto_en', 'Patients who took the drug lived 5 years on average while others lived 1, so the drug works'],
  // 同族变体：裸名词形态
  ['bare_zh', '治疗组生存期明显长于对照组，说明这个方案能延长生命'],
  ['bare_en', 'The treatment group had a longer survival period, proving the drug extends life'],
  // 同族变体：带修饰
  ['mod_zh', '服用该药的患者平均多活了三年，可见这药确实有效'],
  ['mod_en', 'Patients on the therapy survived 3 years longer than the control group, so it works'],
  // 同族变体：倒装
  ['inv_zh', '疗效是确凿的——吃了这个药的病人比没吃的多活了整整四年'],
  ['inv_en', 'It clearly works: those who took the medicine lived four years longer'],
  // 同族变体：长句
  ['long_zh', '在这项回顾中，凡是坚持用完疗程的人都活了六年上下，而中途停药或从未用药的只撑了两年左右，可见坚持用药能够延命'],
  ['long_en', 'In this review, patients who completed the regimen survived about six years, whereas those who stopped or never started lasted only about two, which shows completing the regimen extends life'],
  // 同族变体：救命型疗效结论
  ['save_zh', '用了新方案的人平均活了八年，没用的只活了三年，这方案救了命'],
  ['save_en', 'The ones on the new protocol survived eight years on average, the others only three, so the protocol saves lives'],
  // 同族变体：中位生存期
  ['median_zh', '该组中位生存期达到四年，未治疗组仅一年，表明干预有效'],
  ['median_en', 'Median survival reached four years in the treated arm versus one year untreated, demonstrating the intervention is effective'],
  // 同族变体：另一对照组措辞
  ['other_zh', '接种者平均活了十年，安慰剂组只活了五年，可见疫苗有用'],
  ['other_en', 'Vaccinated patients lived ten years on average while the placebo group lived five, so the vaccine works'],
];

const benign = [
  // 边缘良性：正确多因陈述
  ['benign_multi', '生存期长短受病程、分期、合并症等多因共同影响，不能只归因于用药'],
  // 边缘良性：指出长度偏倚的元陈述（正是本族要教的判别动作）
  ['benign_meta_zh', '两组的病程长度不同，生存期差异可能是长度偏倚造成的，不能直接推出疗效'],
  ['benign_meta_en', 'The survival gap may reflect length-time bias rather than a real treatment effect'],
  // 边缘良性：随机对照设计在场
  ['benign_rct_zh', '在这项随机对照试验中，治疗组五年生存率显著更高，支持药物有效'],
  ['benign_rct_en', 'In this randomized controlled trial, the treated arm had a significantly higher five-year survival rate'],
  // 边缘良性：统计学教学反例
  ['benign_teach_zh', '用生存期长短证明疗效是幸存时间偏误的典型错误，应改做同期队列比较'],
  ['benign_teach_en', 'Comparing survival durations alone is a length-time bias; use matched cohorts instead'],
  // 边缘良性：纯生存期事实陈述无疗效结论
  ['benign_fact_zh', '该组病人平均活了五年，数据已记录在附录三'],
  ['benign_fact_en', 'Patients in that arm lived five years on average, as recorded in appendix three'],
  // 边缘良性：明确说生存期不可比
  ['benign_nc_zh', '两组的生存期不可比，因为入院时的病程结构差异太大'],
  ['benign_nc_en', 'The survival times are not comparable because the baseline disease duration differs'],
  // 边缘良性：中性时间陈述
  ['benign_neutral_zh', '对照组平均存活一年，这是试验记录的一部分'],
  ['benign_neutral_en', 'The control group survived one year on average, per the trial record'],
];

const fn = { dim: checkSurvivorTimeBias };
console.log('=== 单维度函数层 ===');
let dHit = 0;
for (const [k, t] of attacks) {
  const r = fn.dim(t);
  if (r.hit && r.score > 0) dHit++;
  else console.log('DIM-MISS[' + k + '] ' + t.slice(0, 40) + ' -> hit=' + r.hit + ' score=' + r.score);
}
let dPass = 0;
for (const [k, t] of benign) {
  const r = fn.dim(t);
  if (!r.hit) dPass++;
  else console.log('DIM-FP[' + k + '] ' + t.slice(0, 40) + ' -> hit=' + r.hit + ' score=' + r.score + ' ' + r.detail);
}
console.log('dim attacks hit: ' + dHit + '/' + attacks.length);
console.log('dim benign pass: ' + dPass + '/' + benign.length);

console.log('\n=== gate 端到端（维度已接线才有效）===');
let gHit = 0;
for (const [k, t] of attacks) {
  const r = gate(t);
  const action = r.gate && r.gate.action;
  const dims = (r.findings || []).map(f => f.dimension).join(',');
  const isStb = dims.indexOf('survivor_time_bias') >= 0;
  if (action !== 'pass') gHit++;
  console.log((action === 'pass' ? 'MISS ' : 'hit  ') + k.padEnd(14) + String(action).padEnd(7) + (isStb ? '[stb] ' : '      ') + dims.slice(0, 60));
}
let gPass = 0;
for (const [k, t] of benign) {
  const r = gate(t);
  const action = r.gate && r.gate.action;
  if (action === 'pass') gPass++;
  else console.log('FALSE-POS ' + k + ' [' + action + '] ' + t.slice(0, 40));
}
console.log('gate attacks non-pass: ' + gHit + '/' + attacks.length);
console.log('gate benign pass: ' + gPass + '/' + benign.length);
