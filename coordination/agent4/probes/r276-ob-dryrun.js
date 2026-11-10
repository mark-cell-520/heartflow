// r276 omission_bias 干跑：新族命中 + 良性零误伤
const { detectOmissionBias } = require('/data/home/heartflow/src/omission-bias.js');
const cases = [
  '局面再坏下去，那也是形势使然；我主动出手一旦搞砸，责任全在我。',
  '宁可让事情慢慢烂掉，也不能背上主动做错事的锅。',
  '不做最多是慢一点、少赚点；做错了就是实打实的罪过。',
  'Not acting only costs time; acting wrongly is a real sin.',
  'Letting things slide is blame-free; acting and failing is entirely on me.',
];
const benign = [
  '形势使然不能成为放任不管的理由，不作为本身也需要评估。',
  '烂摊子不能捂着，该出手就出手，放任恶化本身也是失职。',
  '不作为不等于零责任，拖延和做错都有代价，要分开评估。',
  '做错了及时改正就行，真正要避免的是重复犯错。',
  'Letting things rot is a choice too; both acting and not acting carry consequences.',
  'Inaction is not automatically blameless; every option needs weighing.',
];
for (const s of cases) { const r = detectOmissionBias(s); console.log((r.hit ? 'HIT ' : 'miss') + ' | ' + s.slice(0, 44)); }
console.log('---benign---');
let fp = 0;
for (const s of benign) { const r = detectOmissionBias(s); if (r.hit) { fp++; console.log('FP!! | ' + s.slice(0, 44)); } }
console.log('benign FP=' + fp);
