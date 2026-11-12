// r299 诊断：5 条 MISS 的模块层直测（绕过 gate）
const ibs = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/incentive-blind-spot.js');
const internals = ibs.__internals();

const cases = [
  ['M1 ZH 混合池', '保险公司把各类风险混合在一起自然就会均衡，不需要额外评估。'],
  ['M2 ZH 自抵消', '只要参保的人足够多，保费自然就是合理的，风险会自己抵消。'],
  ['M3 ZH 混合池裸', '混合池里高风险和低风险的人自然平衡，定价不用担心。'],
  ['M4 EN balance out', 'A large pool of borrowers will naturally balance out the risky ones.'],
  ['M5 EN settle themselves', 'Once everyone is enrolled in the same plan, the premiums will settle themselves without any need for risk-based pricing.'],
  ['M6 EN not monitor', 'The deposit insurance means depositors will not monitor the bank, and the bank faces no extra risk.'],
  ['M7 EN no need for me', 'Someone else will step in and do the work, so there is no need for me to contribute.'],
];

function which(text) {
  const out = {};
  out.adverse = ibs.detectAdverseSelection(text).hit;
  out.moral = ibs.detectMoralHazard(text).hit;
  out.free = ibs.detectFreeRider(text).hit;
  return out;
}

console.log('=== 模块层直测 ===');
for (const [label, text] of cases) {
  const w = which(text);
  const r = ibs.detectIncentiveBlindSpot(text);
  console.log(`${r.hit ? 'HIT ' : 'MISS'} ${label.padEnd(24)} adverse=${w.adverse} moral=${w.moral} free=${w.free}`);
}

console.log('\n=== 常量命中诊断（M1/M2/M3 中文腿） ===');
const I = internals;
const diag = (text, list, name) => {
  const hits = list.filter(re => re.test(text)).map(re => re.source.slice(0, 40));
  console.log(`  ${name}: ${hits.length ? hits.join(' | ') : 'NONE'}`);
};
for (const [label, text] of cases.slice(0, 3)) {
  console.log(`\n[${label}] ${text}`);
  diag(text, I.POOL_ZH, 'POOL_ZH');
  diag(text, I.NODISTORT_ZH, 'NODISTORT_ZH');
  diag(text, I.SHIELD_ZH, 'SHIELD_ZH');
  diag(text, I.NOCHANGE_ZH, 'NOCHANGE_ZH');
  diag(text, I.COLLECTIVE_ZH, 'COLLECTIVE_ZH');
  diag(text, I.ABSTAIN_ZH, 'ABSTAIN_ZH');
}
for (const [label, text] of cases.slice(3)) {
  console.log(`\n[${label}] ${text}`);
  diag(text, I.POOL_EN, 'POOL_EN');
  diag(text, I.NODISTORT_EN, 'NODISTORT_EN');
  diag(text, I.SHIELD_EN, 'SHIELD_EN');
  diag(text, I.NOCHANGE_EN, 'NOCHANGE_EN');
  diag(text, I.COLLECTIVE_EN, 'COLLECTIVE_EN');
  diag(text, I.ABSTAIN_EN, 'ABSTAIN_EN');
}
