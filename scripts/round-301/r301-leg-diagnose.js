'use strict';
// r301 缺口定位探针：逐样本分解 incentive-blind-spot 三子族两腿命中情况
const ibs = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/incentive-blind-spot.js');
const gateModule = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');
const gate = typeof gateModule === 'function' ? gateModule : gateModule.gate;
const I = ibs.__internals();

const CASES = [
  ['EN ②-h no meaningful difference', 'Across the pool there is no meaningful difference in default rates.'],
  ['EN ②-i no reason to', 'There is no reason for additional screening of the applicants.'],
  ['EN ②-i no grounds', 'There are no grounds for closer monitoring of the insured.'],
  ['ZH ②-h 定价本就正确', '这个机制下定价本就是正确的，不用再测算。'],
];

function legScan(label, list, text) {
  const hits = [];
  for (const re of list) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      hits.push(m[0]);
      if (m.index === g.lastIndex) g.lastIndex++;
    }
  }
  return hits;
}

for (const [label, text] of CASES) {
  console.log('=== ' + label + ' ===');
  console.log('  text: ' + text);
  const r = gate(text);
  const dims = (r.findings || []).map(f => f.dimension);
  console.log('  gate.action=' + r.gate.action + ' dims=[' + dims.join(',') + '] ibs_hit=' + dims.includes('incentive_blind_spot'));
  // 模块直调（绕过 gate 的 dimMap 键名——注意：模块返回 adverse_selection/moral_hazard/free_rider 三个子键）
  const m = ibs.detectIncentiveBlindSpot(text);
  console.log('  module.hit=' + m.hit + ' sub=' + (m.dimension || '-'));
  // 两腿分解（EN 侧）
  console.log('  -- leg A (POOL_EN) hits: ' + JSON.stringify(legScan('POOL_EN', I.POOL_EN, text)));
  console.log('  -- leg A (SHIELD_EN) hits: ' + JSON.stringify(legScan('SHIELD_EN', I.SHIELD_EN, text)));
  console.log('  -- leg A (COLLECTIVE_EN) hits: ' + JSON.stringify(legScan('COLLECTIVE_EN', I.COLLECTIVE_EN, text)));
  console.log('  -- leg B (NODISTORT_EN) hits: ' + JSON.stringify(legScan('NODISTORT_EN', I.NODISTORT_EN, text)));
  console.log('  -- leg B (NOCHANGE_EN) hits: ' + JSON.stringify(legScan('NOCHANGE_EN', I.NOCHANGE_EN, text)));
  console.log('  -- leg B (ABSTAIN_EN) hits: ' + JSON.stringify(legScan('ABSTAIN_EN', I.ABSTAIN_EN, text)));
  // ZH 侧
  console.log('  -- leg A (POOL_ZH) hits: ' + JSON.stringify(legScan('POOL_ZH', I.POOL_ZH, text)));
  console.log('  -- leg B (NODISTORT_ZH) hits: ' + JSON.stringify(legScan('NODISTORT_ZH', I.NODISTORT_ZH, text)));
  console.log('');
}
