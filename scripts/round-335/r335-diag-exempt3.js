'use strict';
// r335 点名探针第三轮诊断：尾串形态变量
const path = require('node:path');
const ROOT = path.join(__dirname, '..', '..');
const { checkImmortalTimeBias, __internals } = require(path.join(ROOT, 'src', 'immortal-time-bias.js'));

const cases = [
  ['full', '新的分期标准把一部分晚期患者重新划入中期，早期和中期生存率都上升了，说明新标准显著改善了预后——这是典型的 Will Rogers 现象。'],
  ['no-tail', '新的分期标准把一部分晚期患者重新划入中期，早期和中期生存率都上升了，说明新标准显著改善了预后。'],
  ['tail-no-period', '新的分期标准把一部分晚期患者重新划入中期，早期和中期生存率都上升了，说明新标准显著改善了预后——这是典型的 Will Rogers 现象'],
  ['tail-dash-removed', '新的分期标准把一部分晚期患者重新划入中期，早期和中期生存率都上升了，说明新标准显著改善了预后这是典型的 Will Rogers 现象。'],
];
for (const [tag, s] of cases) {
  const r1 = checkImmortalTimeBias(s);
  const r2 = checkImmortalTimeBias(s, { EXEMPT_WR_ZH: [], EXEMPT_WR_EN: [] });
  console.log(tag, '| full hit=', r1.hit, '| exempt-empty hit=', r2.hit, '| detail=', r2.detail || '-');
}
// 逐豁免元素命中检查（full 句上，看哪些元素命中）
const I = __internals();
const s = cases[0][1];
I.EXEMPT_WR_ZH.forEach((re, i) => { if (re.test(s)) console.log('EXEMPT_WR_ZH[' + i + '] hits:', re.source.slice(0, 40)); });
// 三条腿在尾串上的最早匹配（看 CLAIM 腿是否被尾串污染）
const legs = [['RECLASS_ZH', I.RECLASS_ZH], ['BOTH_UP_ZH', I.BOTH_UP_ZH], ['CLAIM_ZH', I.CLAIM_ZH]];
for (const [name, list] of legs) {
  let b = -1, bi = -1;
  list.forEach((re, i) => { const m = s.search(re); if (m >= 0 && (b < 0 || m < b)) { b = m; bi = i; } });
  console.log(name, 'first=', b, 'elem=', bi);
}
