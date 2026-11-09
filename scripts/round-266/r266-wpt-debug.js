const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
const wpt = require(path.join(REPO, 'src/whole-part-transfer.js'));
const I = wpt.__internals();
console.log('QUALITY_ZH len =', I.QUALITY_ZH.length, '| MODAL_ZH len =', I.MODAL_ZH.length, '| PART_QUANT_ZH len =', I.PART_QUANT_ZH.length, '| WHOLE_ZH len =', I.WHOLE_ZH.length);
const olds = [
  '这个团队每个人都很优秀，所以整个团队自然也很优秀。',
  'The team has many excellent engineers, so the whole team is excellent.',
  '这家公司的每个零件都是进口的，所以整台设备自然也是进口的。',
  'Every part of this machine is German, so the machine is German.',
];
for (const t of olds) console.log(JSON.stringify(wpt.checkWholePartTransfer(t)), '|', t.slice(0, 30));
const a7 = '每章都写得惊艳，系列想必也是惊艳系列。';
console.log('attack7:', JSON.stringify(wpt.checkWholePartTransfer(a7)));
console.log('  PQ_ZH hits:', I.PART_QUANT_ZH.map(r => (a7.match(new RegExp(r.source, 'g')) || []).join('|')).join(' ;; '));
console.log('  WHOLE_ZH hits:', I.WHOLE_ZH.map(r => (a7.match(new RegExp(r.source, 'g')) || []).join('|')).join(' ;; '));
console.log('  QUALITY_ZH hits:', I.QUALITY_ZH.map(r => (a7.match(new RegExp(r.source, 'g')) || []).join('|')).join(' ;; '));
console.log('  MODAL_ZH hits:', I.MODAL_ZH.map(r => (a7.match(new RegExp(r.source, 'g')) || []).join('|')).join(' ;; '));
console.log('  EXEMPT_ZH hits:', I.EXEMPT_ZH.map(r => (a7.match(new RegExp(r.source, 'g')) || []).join('|')).join(' ;; '));
