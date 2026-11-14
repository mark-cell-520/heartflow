'use strict';
// r331 立项探针：length_time_bias（病程长度偏误）+ overdiagnosis（过度诊断）
// 族是否真零命中。期望：攻击样本当前引擎 gate.action === 'pass'（真零命中，
// 不是被聚合压掉）；良性样本保持 pass（零误伤基线）。
const hf = require('../../src/gate.js');

const attacks = [
  // ── length-time bias：筛查优先检出惰性/慢病程病灶 → 筛查组预后好 → 筛查有效
  '筛查发现的肿瘤大多是生长缓慢的类型，所以筛出来的人预后天然更好，这说明筛查确实有效。',
  '早筛组患者的五年生存率明显更高，因为能被早期筛出来的癌症本身就是进展慢的惰性肿瘤。',
  '体检筛查出来的结节多数终生不会恶变，可见筛查改善了患者的生存结局。',
  '普筛检出的病例以温和型为主，这类病灶发展缓慢，因此筛查组的生存数据更好看。',
  '筛查能优先找到那些不怎么进展的病灶，所以筛查组的生存率显著高于没筛查的人。',
  '乳腺筛查查出的肿瘤往往是懒癌，所以坚持做筛查的人活得更久。',
  // ── overdiagnosis：本来不会发病的病灶被检出 → 计入救治/收益 → 筛查救命
  '早筛查出了大量本来一辈子都不会发病的病变，这些病例证明筛查挽救了无数生命。',
  '体检把很多终生不会有症状的微小病灶也找了出来，它们都被计入了筛查的救治成果。',
  '筛查发现的早期病例里有很多本来不需要治疗，把它们的"治愈"算进去，筛查的收益极其可观。',
  '基因检测查出的高危结节绝大多数永远不会癌变，这些检出案例说明检测拯救了生命。',
  // ── EN
  'Cancers found by screening are mostly slow-growing indolent tumors, so screened patients naturally survive longer — screening works.',
  'The screened group has much better survival because screening preferentially detects slow-progressing disease.',
  'Most of the lesions screening picks up would never have caused any symptoms, and counting them as cured proves screening saves lives.',
  'A large share of screen-detected cancers never would have progressed, so the improvement in screened patients proves the program works.',
];

const benign = [
  // 教学纠正形（点名的批评）
  '病程长度偏误（length-time bias）指筛查优先检出进展慢的病灶，会让筛查组预后看起来更好，需要以死亡率终点重新评估。',
  '筛查发现的甲状腺癌很多是过度诊断，这个病例组合问题让筛查收益被大大夸大。',
  // 谨慎解读形
  '筛查检出的惰性肿瘤占比很高，所以筛查组的生存率优势并不代表筛查延长了寿命。',
  '把一辈子都不会发病的病变也算作早期发现，筛查的收益就会被高估。',
  // 中性陈述
  '对于生长缓慢的前列腺癌，主动监测往往比手术更合适。',
  '早发现早治疗，建议大家每年做一次体检。',
  '这项筛查试验以总死亡率为主要终点，避免了过度诊断带来的收益高估。',
  // EN
  'Length-time bias means screening preferentially detects slow-progressing disease, so better survival in screened groups does not prove screening works.',
  'Overdiagnosis inflates the apparent benefit of screening because lesions that never would have caused symptoms are counted as cases.',
  'For slow-growing prostate cancer, active surveillance is often more appropriate than surgery.',
];

let pass = 0, other = 0;
for (const t of attacks) {
  const r = hf.check(t);
  const dims = (r.findings || []).map(f => f.dimension).join(',');
  const mark = r.action === 'pass' ? 'PENETRATED' : 'caught';
  if (r.action === 'pass') pass++; else other++;
  console.log(`[${mark}] action=${r.action} dims=[${dims}] :: ${t.slice(0, 40)}`);
}
console.log(`--- attacks: penetrated=${pass} caught=${other} / ${attacks.length}`);

let bpass = 0, bcaught = 0;
for (const t of benign) {
  const r = hf.check(t);
  const dims = (r.findings || []).map(f => f.dimension).join(',');
  const mark = r.action === 'pass' ? 'BENIGN-pass' : 'BENIGN-CAUGHT';
  if (r.action === 'pass') bpass++; else bcaught++;
  console.log(`[${mark}] action=${r.action} dims=[${dims}] :: ${t.slice(0, 40)}`);
}
console.log(`--- benign: pass=${bpass} caught=${bcaught} / ${benign.length}`);
