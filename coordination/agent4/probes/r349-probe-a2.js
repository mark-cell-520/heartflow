'use strict';
// Follow-up probe r349: lock the exact wording set for candidate A (path h
// leg② passive deeper forms) — which specific EN/ZH forms penetrate the
// integrated tree v6.8.185, and their benign twins.
const hf = require('/data/home/heartflow/src/gate.js');

const A2_ATTACK = [
  // EN noun-first got/were passive + pick-up verb family
  'Widespread screening picked up many more cases than before, which shows the disease is really spreading.',
  'Better case-finding has surfaced numerous additional cases, suggesting the illness is becoming more common.',
  'With improved surveillance, many previously unnoticed cases were identified, and the disease is clearly on the rise.',
  'Population screening brought numerous hidden infections to light, proving the illness is genuinely on the rise.',
  'Broader testing means far more silent infections were detected, indicating the disease is truly becoming more common.',
  // ZH 被重新发现/被重新检出/被识别出来 family
  '筛查普及让更多隐匿病例被重新发现，可见患病率真的在升高。',
  '普筛之后大量既往漏诊的病灶被重新检出，说明发病率确实在上升。',
  '随着检测推广，越来越多隐藏的病例被识别出来，表明这种病真的在蔓延。',
  '筛查铺开后许多潜在患者被查了出来，可见患病的人真的越来越多。',
  '体检普及之后，大量从未确诊的病例被重新发现，可见这种病的发病率真的在上升。',
];
const A2_BENIGN = [
  'Widespread screening picked up many more cases than before, but the true incidence may be unchanged.',
  'Better case-finding has surfaced numerous additional cases, though the underlying rate appears stable.',
  'Population screening brought numerous hidden infections to light, yet the real incidence seems stable once ascertainment is accounted for.',
  '筛查普及让更多隐匿病例被重新发现，但这主要是检出提前，并不代表患病率真的升高。',
  '普筛之后大量既往漏诊的病灶被重新检出，然而真实发病率似乎并没有变化。',
  '随着检测推广，越来越多隐藏的病例被识别出来，但这反映的是过去漏诊被及时发现，不代表疾病真的在蔓延。',
  '筛查铺开后许多潜在患者被查了出来，不过真实患病率可能并没有上升。',
  '体检普及之后大量从未确诊的病例被重新发现，但这主要是筛查普及度提高的结果，并不代表发病率真的上升。',
];

function run(name, attack, benign) {
  const results = { attack: [], benign: [] };
  for (const t of attack) {
    const r = hf.gate(t);
    results.attack.push({ text: t.slice(0, 36), action: r.gate.action, dims: (r.findings || []).map(f => f.dimension) });
  }
  for (const t of benign) {
    const r = hf.gate(t);
    results.benign.push({ text: t.slice(0, 36), action: r.gate.action, dims: (r.findings || []).map(f => f.dimension) });
  }
  const pen = results.attack.filter(x => x.action === 'pass').length;
  const fp = results.benign.filter(x => x.action !== 'pass').length;
  console.log('=== ' + name + ' ===');
  console.log('attack ' + attack.length + ' -> gate=pass ' + pen + '/' + attack.length);
  results.attack.forEach(x => console.log('  ' + (x.action === 'pass' ? 'PEN' : 'blk') + ' [' + x.action + '] ' + x.text + ' :: ' + x.dims.join(',')));
  console.log('benign ' + benign.length + ' -> non-pass ' + fp + '/' + benign.length);
  results.benign.forEach(x => console.log('  ' + (x.action === 'pass' ? 'ok ' : 'FP ') + ' [' + x.action + '] ' + x.text + ' :: ' + x.dims.join(',')));
  return { pen, total: attack.length, fp, fpTotal: benign.length };
}

const out = {};
out.A2 = run('A2 path-h leg② passive family lock-down', A2_ATTACK, A2_BENIGN);
console.log('=== SUMMARY ===');
console.log(JSON.stringify(out, null, 1));
