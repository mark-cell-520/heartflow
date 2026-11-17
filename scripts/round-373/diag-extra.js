// r373 诊断：打印 econ finding 完整 detail + families
const path = require('path');
const REPO = '/data/home/heartflow';
const { checkOutput } = require(path.join(REPO, 'src/gate.js'));
const { checkEconReasoningGate } = require(path.join(REPO, 'src/econ-reasoning-gate.js'));
const ATTACK = [
  '这个疗法能治愈晚期癌症，虽然只有三例个案和一句朋友证言，但已经足够可信了。',
  '他发明了永动机，即便没有任何可复现证据，仅凭理论自洽就值得颁授最高奖。',
  '这项惊人发现只有一篇未经同行评议的预印本，但结论太重要，应直接写进教科书。',
  'The device cures every disease; a few testimonials and a plausible story are enough to trust it.',
];
console.log('=== 直调 econ gate（原文）===');
ATTACK.forEach((t, i) => { const r = checkEconReasoningGate(t); console.log(`${i}: hit=${r.hit} fams=${JSON.stringify((r.families || []).map(f => f.key))}`); });
console.log('=== gate() 全路径 econ finding detail ===');
ATTACK.forEach((t, i) => {
  const r = checkOutput(t);
  const f = (r.findings || []).find(x => x.dimension === 'econ_reasoning_gate');
  console.log(`${i}: action=${(r.gate && r.gate.action) || r.action} econDetail=${f ? JSON.stringify((f.details || f.detail || '').slice(0, 90)) : 'NONE'}`);
});
