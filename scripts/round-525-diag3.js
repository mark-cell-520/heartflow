'use strict';
const fs = require('node:fs');
const path = require('node:path');
const tn = require('../src/text-normalizer.js');
const { checkCostExternalization, __internals } = require('../src/cost-externalization.js');
const I = __internals();

const attacks = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'round-524-cost-externalization-samples.json'), 'utf8'));

console.log('== 归一化后各支命中 ==');
attacks.forEach((s, i) => {
  const n = tn.normalize(s);
  const t = (n.normalized && n.normalized !== s) ? n.normalized : s;
  const h = {
    DZH: I.DISTANCE_ZH.test(t), DEN: I.DISTANCE_EN.test(t),
    SZH: I.DISMISS_ZH.test(t), SEN: I.DISMISS_EN.test(t),
    LZH: I.LIGHT_ZH.test(t), LEN: I.LIGHT_EN.test(t),
    XZH: I.EXEMPT_ZH.test(t), XEN: I.EXEMPT_EN.test(t),
  };
  const sides = Object.entries(h).filter(([, v]) => v).map(([k]) => k).join(',') || '(none)';
  console.log(`#${i} ${checkCostExternalization(t).hit ? 'HIT ' : 'MISS'} changed=${t !== s} sides:${sides}`);
});
