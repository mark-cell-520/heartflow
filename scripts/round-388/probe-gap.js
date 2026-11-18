// r388 缺口实证探针（修正版，按 r386 轮测范式）
// 三层：模块级 detectCensoringNeglect / gate 层 mainGate.gate / 插件层
const path = require('path');
const ROOT = '/root/hermes1/skills/ai/mark-heartflow-skill';
const mainGate = require(ROOT + '/src/gate.js');
const gcheck = mainGate.gate || mainGate.check;
const plugin = require(ROOT + '/src/plugins/econ-reasoning-check/index.js');
const { detectCensoringNeglect } = require(ROOT + '/src/censoring-neglect.js');
const econGate = require(ROOT + '/src/econ-reasoning-gate.js');

const attacks = [
  '新药组观察满一年时无一人死亡，可见这种新药的一年生存率是100%，疗效完胜对照组。',
  '该疫苗试验才进行到第三年，但早期无一人出现感染，这说明数据已经证明疫苗是安全有效的。',
  '这项研究只跟踪了患者六个月，期间没有发生一例心梗，所以这种药能彻底预防心梗。',
  '随访刚满十八个月，尚无复发报告，可以认为新疗法已经实现了临床治愈。',
  '观察期内这些患者一个都没出事，足以证明这个方案没有任何长期风险。',
  '该队列目前失访率还很高，但已入组的病例全部存活，因此该人群的预后非常好。',
  'Patients in the treatment arm were followed for only 12 months and none had died, so one-year survival is 100% and the drug is clearly superior.',
  'The trial is only in its third year, but with zero infections in the early data, we can declare the vaccine safe and effective.',
  'With six months of follow-up and no cardiovascular events recorded, this medication completely prevents heart attacks.',
  'Eighteen months in, there have been no recurrences, so the new therapy has achieved a clinical cure.',
];

const benigns = [
  '新药组观察满一年时无死亡病例，但随访期太短、删失比例也高，现在还远不能下结论，需要更长随访和生存分析。',
  '本研究为概念性讨论：删失数据与随访完整性是生存分析中的核心方法学问题，本文梳理其处理方式。',
  '该试验已完成五年随访，全部患者结局明确，五年生存率为62%，这是完整的终点数据。',
  '虽然早期无一人死亡，但大量患者尚未到期或失访，早期零事件结论只在该随访窗口内成立。',
  'Patients were followed for 12 months with no deaths, but the follow-up is incomplete and censoring is substantial, so we cannot draw conclusions yet.',
  'This paper is a methodological review of censoring and follow-up completeness in survival analysis.',
  'The trial completed five-year follow-up for all patients; the overall five-year survival rate of 62% is based on complete outcome data.',
];

console.log('=== A 模块级 detectCensoringNeglect ===');
let aHit = 0;
attacks.forEach((t, i) => {
  const r = detectCensoringNeglect(t);
  if (r.hit) aHit++;
  console.log(`A${i + 1} hit=${r.hit} score=${r.score} count=${r.count}`);
});
console.log(`模块级命中 ${aHit}/${attacks.length}`);

console.log('\n=== B gate 层归因（action != pass 且含 censoring_neglect）===');
let bRed = 0;
attacks.forEach((t, i) => {
  const r = gcheck(t);
  const dims = (r.findings || []).map(f => f.dimension);
  const hasCN = dims.includes('censoring_neglect');
  const isRed = r.gate && r.gate.action !== 'pass';
  if (isRed) bRed++;
  console.log(`A${i + 1} action=${r.gate.action} cn=${hasCN} dims=[${dims.join(',')}]`);
});
console.log(`gate 层变红 ${bRed}/${attacks.length}`);

console.log('\n=== C 良性误伤 ===');
let cBlock = 0;
benigns.forEach((t, i) => {
  const r = gcheck(t);
  const dims = (r.findings || []).map(f => f.dimension);
  const isRed = r.gate && r.gate.action !== 'pass';
  if (isRed) cBlock++;
  console.log(`B${i + 1} action=${r.gate.action} dims=[${dims.join(',')}] ${isRed ? 'FALSE-BLOCK' : 'clean'}`);
});
console.log(`良性被拦 ${cBlock}/${benigns.length}`);

console.log('\n=== D 插件层注册检查 ===');
const fams = plugin.__internals ? plugin.__internals() : null;
console.log('plugin version=' + (plugin.version || 'n/a'));
const keys = fams && fams.families ? fams.families.map(f => f.key) : null;
console.log('families 数=' + (keys ? keys.length : 'n/a'));
console.log('censoring_neglect 已注册: ' + (keys ? keys.includes('censoring_neglect') : 'unknown'));
