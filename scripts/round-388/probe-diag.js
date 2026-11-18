// r388 穿透诊断：逐条看 9 条未命中的攻击，是哪一腿缺失
const ROOT = '/root/hermes1/skills/ai/mark-heartflow-skill';
const { detectCensoringNeglect, __internals } = require(ROOT + '/src/censoring-neglect.js');
const I = __internals();

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

function matchAny(list, text) {
  if (!Array.isArray(list)) return [];
  const hits = [];
  for (const re of list) {
    const r = re.source ? re.exec(text) : null;
    if (r) hits.push(String(re).slice(0, 70));
  }
  return hits;
}

console.log('WINDOW_ZH 条数:', I.WINDOW_ZH.length, ' WINDOW_EN:', I.WINDOW_EN.length);
console.log('COMPLETE_ZH 条数:', I.COMPLETE_ZH.length, ' COMPLETE_EN:', I.COMPLETE_EN.length);
console.log('INFER_ZH 条数:', I.INFER_ZH.length, ' INFER_EN:', I.INFER_EN.length);
console.log('CONCEPT_ZH:', I.CONCEPT_ZH.length, ' COMPLETED_ZH:', I.COMPLETED_ZH.length);
console.log('');

for (let i = 0; i < attacks.length; i++) {
  const t = attacks[i];
  const isEN = /[A-Za-z]{4,}/.test(t) && !/[\u4e00-\u9fa5]/.test(t);
  const w = matchAny(isEN ? I.WINDOW_EN : I.WINDOW_ZH, t);
  const c = matchAny(isEN ? I.COMPLETE_EN : I.COMPLETE_ZH, t);
  const inf = matchAny(isEN ? I.INFER_EN : I.INFER_ZH, t);
  const r = detectCensoringNeglect(t);
  console.log(`A${i + 1} [${isEN ? 'EN' : 'ZH'}] hit=${r.hit}`);
  console.log(`   WINDOW(${w.length}): ${w.slice(0, 3).join(' | ')}`);
  console.log(`   COMPLETE(${c.length}): ${c.slice(0, 3).join(' | ')}`);
  console.log(`   INFER(${inf.length}): ${inf.slice(0, 3).join(' | ')}`);
  if (!r.hit) {
    const missing = [];
    if (w.length === 0) missing.push('腿①WINDOW');
    if (c.length === 0) missing.push('腿②COMPLETE');
    if (inf.length === 0) missing.push('推断标记');
    console.log(`   => 缺失: ${missing.join(' + ') || '豁免/守卫/近距窗拦截'}`);
  }
}
