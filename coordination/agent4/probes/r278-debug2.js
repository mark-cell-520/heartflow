const m = require('/data/home/heartflow/src/appeal-tradition.js');
const I = m.__internals();
const samples = [
  '千百年来都是这么过来的，还能有错？',
  '老法子传了这么多代人，别瞎折腾。',
  '入乡随俗，老规矩还是得守。',
];
for (const s of samples) {
  console.log('---', s);
  console.log('  result:', JSON.stringify(m.checkAppealToTradition(s)));
  console.log('  TRADITION_ZH:', JSON.stringify((s.match(I.TRADITION_ZH) || [])[0]));
  console.log('  SUPPRESS_ZH:', JSON.stringify((s.match(I.SUPPRESS_ZH) || [])[0]));
  console.log('  HEDGE_EVIDENCE_ZH test:', I.HEDGE_EVIDENCE_ZH.test(s));
  console.log('  HEDGE_EVIDENCE_ZH source:', I.HEDGE_EVIDENCE_ZH.source.slice(0, 80));
}
