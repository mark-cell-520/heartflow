'use strict';
// r335 点名探针精细诊断：逐腿独立测 + 豁免元素匹配
const path = require('node:path');
const ROOT = path.join(__dirname, '..', '..');
const { checkImmortalTimeBias, __internals } = require(path.join(ROOT, 'src', 'immortal-time-bias.js'));

const ZN = '新的分期标准把一部分晚期患者重新划入中期，早期和中期生存率都上升了，说明新标准显著改善了预后——这是典型的 Will Rogers 现象。';
const EN = 'Under the new staging criteria, some advanced cases were reclassified as intermediate, and survival rates rose in both groups — proof the new protocol works. This is the classic Will Rogers phenomenon.';
const I = __internals();

// 1) 原句（带 Will Rogers）——逐腿命中位置
for (const [tag, s, l1, l2, l3] of [['ZH', ZN, I.RECLASS_ZH, I.BOTH_UP_ZH, I.CLAIM_ZH], ['EN', EN, I.RECLASS_EN, I.BOTH_UP_EN, I.CLAIM_EN]]) {
  const first = (list) => { let b = -1, bi = -1; list.forEach((re, i) => { const m = s.search(re); if (m >= 0 && (b < 0 || m < b)) { b = m; bi = i; } }); return [b, bi]; };
  console.log(tag, 'leg1=', first(l1), 'leg2=', first(l2), 'leg3=', first(l3));
  console.log(tag, 'hit(full)=', checkImmortalTimeBias(s).hit, 'hit(exempt empty)=', checkImmortalTimeBias(s, tag === 'ZH' ? { EXEMPT_WR_ZH: [] } : { EXEMPT_WR_EN: [] }).hit);
  // 2) 剥掉豁免尾巴后（纯攻击形）
  const stripped = tag === 'ZH' ? s.replace(/——这是典型的 Will Rogers 现象。$/, '。') : s.replace(/ This is the classic Will Rogers phenomenon\.$/, '.');
  console.log(tag, 'hit(stripped)=', checkImmortalTimeBias(stripped).hit);
  // 3) 只保留腿①+腿②+腿③的精简句（无任何豁免词）
  if (tag === 'ZH') {
    console.log('ZH minimal hit=', checkImmortalTimeBias('把晚期患者重新划入中期，生存率都上升了，说明新标准显著改善。').hit);
  } else {
    console.log('EN minimal hit=', checkImmortalTimeBias('Some cases were reclassified as intermediate, and survival rose in both groups — proof it works.').hit);
  }
}
