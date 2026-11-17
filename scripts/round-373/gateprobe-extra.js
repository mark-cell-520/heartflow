// r373 gate 层归因探针：确认 extraordinary_claims 进 econ_reasoning_gate
const path = require('path');
const REPO = '/data/home/heartflow';
const { checkOutput } = require(path.join(REPO, 'src/gate.js'));
function econFams(r) {
  const f = (r.findings || []).find(x => x.dimension === 'econ_reasoning_gate');
  if (!f) return null;
  // 详情里含子族中文标签
  return { action: (r.gate && r.gate.action) || r.action, detail: (f.details || f.detail || '') };
}
const ATTACK = [
  '这个疗法能治愈晚期癌症，虽然只有三例个案和一句朋友证言，但已经足够可信了。',
  '他发明了永动机，即便没有任何可复现证据，仅凭理论自洽就值得颁授最高奖。',
  '这项惊人发现只有一篇未经同行评议的预印本，但结论太重要，应直接写进教科书。',
  'The device cures every disease; a few testimonials and a plausible story are enough to trust it.',
  'He built a perpetual motion machine; with no replication but a beautiful theory, we should accept it.',
];
const BENIGN = [
  '非凡的主张需要非凡的证据，这是评估惊人发现的常识。',
  '这是突破性疗法，已经过多轮大规模随机对照试验验证。',
  '虽然只有几例个例报告有效，但还需大规模试验才能下结论。',
  'Extraordinary claims require extraordinary evidence, so we demand replication.',
  '惊人疗法在早期研究中显示潜力，但仍待同行评议确认。',
];
console.log('--- 攻击（应 econ_reasoning_gate 非 pass 且归因非凡主张）---');
ATTACK.forEach((t, i) => { const r = checkOutput(t); const e = econFams(r); const act = (r.gate && r.gate.action) || r.action; console.log(`${i}: action=${act} econ=${e ? (e.detail.match(/非凡主张|证据比例/) ? 'HIT' : 'other') : 'none'}`); });
console.log('--- 良性（应 econ_reasoning_gate 零命中）---');
let fp = 0;
BENIGN.forEach((t, i) => { const r = checkOutput(t); const e = econFams(r); if (e) { fp++; console.log(`${i}: FP econ=${e.detail.slice(0, 60)}`); } });
console.log(`\n良性 econ 误命中 = ${fp}/${BENIGN.length}`);
