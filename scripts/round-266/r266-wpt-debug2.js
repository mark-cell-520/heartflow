const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
const wpt = require(path.join(REPO, 'src/whole-part-transfer.js'));
const I = wpt.__internals();
const olds = [
  '每个队员个人能力都很强，所以这支球队一定很强。',
  'Every player on the roster is elite, so the team is guaranteed to win.',
  '每个人都是精英，所以这个团队很强。',
  '所有零件都用的顶级材料，因此这台设备的性能一定极其出色。',
  '这支球队是世界顶级的，所以每个球员都是世界顶级水平。',
  'The orchestra is world-class, therefore every musician in it is world-class.',
];
for (const t of olds) console.log(JSON.stringify(wpt.checkWholePartTransfer(t)), '|', t.slice(0, 32));
const en = 'Every player on the roster is elite, so the team is guaranteed to win.';
console.log('PQ_EN hits:', I.PART_QUANT_EN.map(r => (en.match(new RegExp(r.source, 'gi')) || []).join('|')).join(' ;; '));
console.log('WHOLE_EN hits:', I.WHOLE_EN.map(r => (en.match(new RegExp(r.source, 'gi')) || []).join('|')).join(' ;; '));
console.log('QUALITY_EN hits:', I.QUALITY_EN.map(r => (en.match(new RegExp(r.source, 'gi')) || []).join('|')).join(' ;; '));
console.log('TAIL_EN hits:', I.TAIL_EN.map(r => (en.match(new RegExp(r.source, 'gi')) || []).join('|')).join(' ;; '));
console.log('EXEMPT_EN hits:', I.EXEMPT_EN.map(r => (en.match(new RegExp(r.source, 'gi')) || []).join('|')).join(' ;; '));
console.log('EXEMPT_NEG_EN hits:', I.EXEMPT_NEG_EN.map(r => (en.match(new RegExp(r.source, 'gi')) || []).join('|')).join(' ;; '));
