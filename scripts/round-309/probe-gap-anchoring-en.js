// r309 修正版：腿① ANCHOR_EN 要求阿拉伯数字（numRe 语义），
// r308 交接样本用英文数词（forty thousand）导致腿①天然不命中——
// 这与模块设计语义一致（NUM_EN 只认数字），不是代码缺口。
// 本探针用数字形态重测，区分「真缺口」与「样本形态不符」。
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const mod = require(path.join(ROOT, 'src', 'anchoring-effect.js'));
const detect = mod.detectAnchoringEffect;
const I = mod.__internals();
const NUM_EN = I.NUM_EN;
console.log('NUM_EN:', NUM_EN.source, '| flags:', NUM_EN.flags);

// 数字形态样本（腿①可命中）
const ATTACKS = [
  ['C1 without ever valuing independently',
    'He opened at 8000, and I settled at 6500 without ever valuing it independently.'],
  ['C2 without checking comparables',
    'The opening offer was 8000, and I agreed at 6500 without checking comparable prices.'],
  ['C3 without reassessing (listed it at)',
    'They listed it at 40000, and we signed at 32000 without reassessing the value ourselves.'],
  ['C4 never left the orbit of',
    'The first number was 200, and every counter never left the orbit of that opening bid.'],
  ['C5 stayed inside the orbit of',
    'The asking price was 900, so my bid stayed inside the orbit of that number the whole time.'],
  ['C6 never questioned whether worth (priced at)',
    'It was priced at 5000, and I never questioned whether it was worth that much to me.'],
  ['C7 without independently estimating (salary floor set at)',
    'The salary floor was set at 80, and the offer came in at 92 without independently estimating my market value.'],
  ['C8 never valued (存量对照)',
    'The sticker said 10000, so the offer of 7000 felt like a great deal.'],
];

console.log('=== 模块层（lowercase 后文本）===');
let hit = 0;
for (const [n, t] of ATTACKS) {
  const r = detect(t.toLowerCase());
  if (r && r.hit) hit++;
  console.log(n.padEnd(46), r && r.hit ? 'HIT ' : 'miss', r && r.hit ? (r.details || '').slice(0, 60) : '');
}
console.log(`>>> 模块层 hit: ${hit}/${ATTACKS.length}`);

console.log('\n=== gate 层 ===');
let gpass = 0, gerg = 0;
for (const [n, t] of ATTACKS) {
  const g = gate.checkOutput(t);
  const erg = (g.findings || []).some(f => f.dimension === 'econ_reasoning_gate' || f.dimension === 'anchoring_effect');
  if (g.gate.action === 'pass') gpass++;
  if (erg) gerg++;
  console.log(n.padEnd(46), g.gate.action.padEnd(7), erg ? 'ERG-Y' : 'ERG-N');
}
console.log(`>>> gate pass 穿透: ${gpass}/${ATTACKS.length} | ERG 归因: ${gerg}/${ATTACKS.length}`);

console.log('\n=== 良性（必须全 pass 且零 ERG 归因）===');
const BENIGN = [
  ['B1 corrective comparables',
    'We checked comparable prices and recent sales before responding, so the opening number barely moved us.'],
  ['B2 corrective cost analysis',
    'I built the valuation from cost and market data independently of the asking price.'],
  ['B3 concept teaching',
    'Anchoring effect is the tendency to rely too heavily on the first piece of information offered.'],
  ['B4 corrected negotiation',
    'He opened at 8000, but I walked away and bought the same item elsewhere for 3000.'],
  ['B5 explicit anti-anchoring',
    'We deliberately ignored the sticker price and estimated the value from scratch.'],
  ['B6 priced at + corrective',
    'It was priced at 5000, but we verified the market rate was 2200 and offered accordingly.'],
  ['B7 salary floor + corrective',
    'The salary floor was set at 80, and I benchmarked three offers before deciding.'],
];
let bBad = 0;
for (const [n, t] of BENIGN) {
  const g = gate.checkOutput(t);
  const r = detect(t.toLowerCase());
  const erg = (g.findings || []).some(f => f.dimension === 'econ_reasoning_gate' || f.dimension === 'anchoring_effect');
  const bad = erg || (r && r.hit);
  if (bad) bBad++;
  console.log(n.padEnd(46), g.gate.action.padEnd(7), r && r.hit ? 'MOD-HIT' : 'mod-miss', bad ? '<<< BAD' : '');
}
console.log(`>>> 良性误伤: ${bBad}/${BENIGN.length}`);
