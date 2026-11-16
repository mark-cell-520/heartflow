'use strict';
// r357 轮测前边界实测：确认边界锁断言的真实行为再写测试。
const path = require('node:path');
const ROOT = '/data/home/heartflow';
const { checkImmortalTimeBias, __internals: immortalInternals } = require(path.join(ROOT, 'src', 'immortal-time-bias.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const hitI = (t, inj) => checkImmortalTimeBias(t, inj).hit === true;

const cases = [
  ['日臻成熟边界', '检测技术日臻成熟让更多病例被重新发现，这说明患病率真的在上升。', {}],
  ['一路上行(ZH2)', '检查普及让更多病例被重新发现，患病率一路上行。', {}],
  ['一路上行(ZH4删)', '检查普及让更多病例被重新发现，患病率一路上行。', { INCIDENCE_CLAIM_ZH4: [] }],
  ['节节走高(legacy)', '检查普及让更多病例被重新发现，患病率节节走高。', {}],
  ['节节走高(ZH4删)', '检查普及让更多病例被重新发现，患病率节节走高。', { INCIDENCE_CLAIM_ZH4: [] }],
  ['用户数屡创新高', '产品迭代后，用户数屡创新高，营收随之增长。', {}],
  ['股价狂飙', '财报发布后股价狂飙，投资者情绪高涨。', {}],
  ['销量井喷', '促销期间销量井喷，库存为之一空。', {}],
  ['检查人次屡创新高', '筛查普及以来，检查人次屡创新高，门诊压力显著增大。', {}],
  ['否定后置-抬头', '检查普及让更多病例被重新发现，患病率可能并没有抬头。', {}],
  ['否定后置-回升', '检查普及让更多病例被重新发现，患病率谈不上止跌回升。', {}],
  ['被重新发现(ZH3删)', '检查普及以来，众多隐匿病灶被重新发现，说明患病率真的在上升。', { CASE_SURGE_ZH3: [] }],
  ['被猛然发现(ZH6删)', '检查普及以来，众多隐匿病灶被猛然发现，说明患病率真的在上升。', { CASE_SURGE_ZH6: [] }],
  ['新增病例激增(ZH7删)', '筛查普及以来，新增病例激增，说明患病率真的在上升。', { CASE_SURGE_ZH7: [] }],
  ['新增病例激增(legacy删)', '筛查普及以来，新增病例激增，说明患病率真的在上升。', { CASE_SURGE_ZH: [] }],
  ['检测手段进步(ZH7删)', '检测手段的进步让更多病例被查出，这说明患病率真的在上升。', { DETECT_UP_ZH7: [] }],
  ['检测手段进步(ZH删)', '检测手段的进步让更多病例被查出，这说明患病率真的在上升。', { DETECT_UP_ZH: [] }],
  ['更新换代(ZH7删)', '检测手段更新换代让更多病例被重新发现，这说明患病率真的在上升。', { DETECT_UP_ZH7: [] }],
  ['更新换代(ZH6删)', '检测手段更新换代让更多病例被重新发现，这说明患病率真的在上升。', { DETECT_UP_ZH6: [] }],
  ['真的在上升(ZH4删)', '检查普及让更多病例被重新发现，患病率真的在上升。', { INCIDENCE_CLAIM_ZH4: [] }],
  ['一路攀升(ZH4删)', '检查普及让更多病例被重新发现，患病率一路攀升。', { INCIDENCE_CLAIM_ZH4: [] }],
  ['一路走强(ZH4删)', '检查普及让更多病例被重新发现，患病率一路走强。', { INCIDENCE_CLAIM_ZH4: [] }],
];
for (const [tag, t, inj] of cases) {
  const h = hitI(t, inj);
  const r = gate(t);
  console.log((h ? 'HIT ' : 'pass') + ' | ' + tag.padEnd(22) + ' | ' + t.slice(0, 36));
}
// 官方四基准语料路径 h 全量
function flatten(mod) {
  const out = []; const src = mod.SAMPLES || mod.samples || mod.CATEGORIES;
  if (Array.isArray(src)) out.push(...src);
  else if (src && typeof src === 'object') for (const v of Object.values(src)) { if (Array.isArray(v)) out.push(...v); else if (v && Array.isArray(v.samples)) out.push(...v.samples); }
  return out.filter(s => typeof s === 'string');
}
let n = 0, fp = 0; const hits = [];
for (const f of ['gate-benchmark.js', 'gate-benchmark-extended.js', 'vertical-benign-benchmark.js', 'benign-mixed-benchmark.js']) {
  for (const s of flatten(require(path.join(ROOT, 'test', f)))) {
    n++;
    const r = checkImmortalTimeBias(s);
    if (r.hit && (r.detail.includes('过度诊断发生率误读') || r.detail.includes('overdiagnosis-incidence'))) { fp++; hits.push(s.slice(0, 60)); }
  }
}
console.log('官方语料 ' + n + ' 条 -> 路径 h 误伤 ' + fp + (hits.length ? ' :: ' + hits.join(' | ') : ''));
