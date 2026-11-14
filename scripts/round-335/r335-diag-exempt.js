'use strict';
// r335 豁免点名探针诊断：三腿位置 + 跨腿跨度
const path = require('node:path');
const ROOT = path.join(__dirname, '..', '..');
const { checkImmortalTimeBias, __internals } = require(path.join(ROOT, 'src', 'immortal-time-bias.js'));

const ZN = '新的分期标准把一部分晚期患者重新划入中期，早期和中期生存率都上升了，说明新标准显著改善了预后——这是典型的 Will Rogers 现象。';
const EN = 'Under the new staging criteria, some advanced cases were reclassified as intermediate, and survival rates rose in both groups — proof the new protocol works. This is the classic Will Rogers phenomenon.';
for (const [tag, s] of [['ZH', ZN], ['EN', EN]]) {
  const r = checkImmortalTimeBias(s);
  console.log(tag, 'hit=', r.hit, 'detail=', r.detail || '-');
  const inj = checkImmortalTimeBias(s, tag === 'ZH' ? { EXEMPT_WR_ZH: [] } : { EXEMPT_WR_EN: [] });
  console.log(tag, 'inj-empty-exempt hit=', inj.hit, 'detail=', inj.detail || '-');
  const I = __internals();
  const legs = tag === 'ZH'
    ? [['RECLASS_ZH', I.RECLASS_ZH], ['BOTH_UP_ZH', I.BOTH_UP_ZH], ['CLAIM_ZH', I.CLAIM_ZH]]
    : [['RECLASS_EN', I.RECLASS_EN], ['BOTH_UP_EN', I.BOTH_UP_EN], ['CLAIM_EN', I.CLAIM_EN]];
  const pos = [];
  for (const [name, list] of legs) {
    let best = -1;
    for (const re of list) { const m = s.search(re); if (m >= 0 && (best < 0 || m < best)) best = m; }
    pos.push([name, best]);
  }
  const idxs = pos.map(p => p[1]);
  console.log(tag, 'legs=', JSON.stringify(pos), 'span=', (idxs.every(i => i >= 0) ? Math.max(...idxs) - Math.min(...idxs) : 'N/A'));
}
