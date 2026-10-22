'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { checkCostExternalization, __internals } = require('../src/cost-externalization.js');
const I = __internals();

const attacks = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'round-524-cost-externalization-samples.json'), 'utf8'));
const benign = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'round-524-cost-externalization-benign.json'), 'utf8'));

function normHints(text) {
  // 逐支报告哪一侧命中
  return {
    DZH: I.DISTANCE_ZH.test(text), DEN: I.DISTANCE_EN.test(text),
    SZH: I.DISMISS_ZH.test(text), SEN: I.DISMISS_EN.test(text),
    LZH: I.LIGHT_ZH.test(text), LEN: I.LIGHT_EN.test(text),
    XZH: I.EXEMPT_ZH.test(text), XEN: I.EXEMPT_EN.test(text),
  };
}

console.log('== 攻击样本 ==');
attacks.forEach((s, i) => {
  const r = checkCostExternalization(s);
  const h = normHints(s);
  const sides = Object.entries(h).filter(([, v]) => v).map(([k]) => k).join(',') || '(none)';
  console.log(`#${i} ${r.hit ? 'HIT ' : 'MISS'}  sides: ${sides}`);
});

console.log('\n== 良性样本：置空 EXEMPT 后哪些由 miss 变 hit ==');
for (const [name, decl] of [['EXEMPT_ZH', 'EXEMPT_ZH'], ['EXEMPT_EN', 'EXEMPT_EN']]) {
  console.log(`-- ${name} 置空后 --`);
  benign.forEach((s, i) => {
    const before = checkCostExternalization(s).hit;
    const h = normHints(s);
    // 若该良性含该侧 EXEMPT 词，且疏离/动作/消解侧有命中，则置空后会 hit
    const relevant = name === 'EXEMPT_ZH' ? h.XZH : h.XEN;
    const core = h.DZH || h.DEN || h.SZH || h.SEN || h.LZH || h.LEN;
    console.log(`  b#${i} exemptSide=${relevant} coreSide=${core} base=${before ? 'hit' : 'miss'} sides: ${Object.entries(h).filter(([,v])=>v).map(([k])=>k).join(',')||'(none)'}`);
  });
}
