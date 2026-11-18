// r389 诊断：carbon_leakage 穿透样本逐条打印腿①/腿②命中情况
const M = require('../../src/carbon-leakage.js');
const I = M.__internals();
const samples = [
  '我们把高污染工厂都迁到了东南亚，本地的污染问题就算解决了。',
  '把产能外包出去以后，这些碳排放就不再算在我们头上了。',
  '关闭了本国的钢铁厂，全球的钢铁碳排放自然就下降了。',
  '工厂搬去规制更松的国家，我们这里空气变好，问题就算解决了。',
  '产业转移到海外，污染治理就不再是我们需要负责的事。',
  'Moving production offshore means those emissions are no longer our responsibility.',
];
const ZS = [I.SHIFT_VERB_ZH, I.SHIFT_NOUN_ZH, I.SHIFT_OUT_ZH];
const ES = [I.SHIFT_ABROAD_EN, I.SHIFT_OUTSRC_EN, I.SHIFT_TOCOUNTRIES_EN, I.SHIFT_SHIP_EN];
const Z2 = [...I.SOLVED_ZH_ARR, ...I.NOTOURS_ZH_ARR];
const E2 = [...I.SOLVED_EN_ARR, ...I.NOTOURS_EN_ARR];
const t = (re, s) => { const m = re.exec(s); return m ? m[0] : null; };
for (const s of samples) {
  const isZh = /[\u4e00-\u9fff]/.test(s);
  const l1 = isZh ? ZS.map((r,i)=>['VERB','NOUN','OUT'][i]+':'+(t(r,s)||'-')).join(' ') : ES.map((r,i)=>['ABROAD','OUTSRC','TOC','SHIP'][i]+':'+(t(r,s)||'-')).join(' ');
  const l2 = isZh ? Z2.map((r,i)=>i+':'+(t(r,s)||'-')).join(' ') : E2.map((r,i)=>i+':'+(t(r,s)||'-')).join(' ');
  const hit = M.detectCarbonLeakage(s);
  console.log(`\n样本: ${s.slice(0,45)}`);
  console.log(`  腿①: ${l1}`);
  console.log(`  腿②: ${l2}`);
  console.log(`  hit=${hit.hit} concept=${I.CONCEPT_ZH.test(s)||I.CONCEPT_EN.test(s)} correct=${I.CORRECT_ZH.test(s)||I.CORRECT_EN.test(s)}`);
}
