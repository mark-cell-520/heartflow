// r373 模块层自测：extraordinary_claims
const path = require('path');
const REPO = '/data/home/heartflow';
const { detectExtraordinaryClaims } = require(path.join(REPO, 'src/extraordinary-claims.js'));

const ATTACK = [
  '这个疗法能治愈晚期癌症，虽然只有三例个案和一句朋友证言，但已经足够可信了。',
  '他发明了永动机，即便没有任何可复现证据，仅凭理论自洽就值得颁授最高奖。',
  '这项惊人发现只有一篇未经同行评议的预印本，但结论太重要，应直接写进教科书。',
  '这款神药号称能根治糖尿病，虽说没有对照试验，可用户的口碑已经足以证明一切。',
  '有人说这口泉水能包治百病，仅凭几个村民的转述，就足以让我们相信它的神力。',
  'The device cures every disease; a few testimonials and a plausible story are enough to trust it.',
  'He built a perpetual motion machine; with no replication but a beautiful theory, we should accept it.',
  'This astonishing remedy reverses aging, and a single case report is enough to prove it works.',
  'The groundbreaking pill has only two users so far, yet the results are already conclusive.',
];
const BENIGN = [
  '非凡的主张需要非凡的证据，这是评估惊人发现的常识。',
  '对于惊人的声明，我们应要求独立复现和严格的同行评议。',
  '这是突破性疗法，已经过多轮大规模随机对照试验验证。',
  '初步只有少量病例支持这一常规改良，还需更多数据。',
  '虽然只有几例个例报告有效，但还需大规模试验才能下结论。',
  '该疗法目前证据不足，需要随机对照试验才能确认。',
  '惊人疗法在早期研究中显示潜力，但仍待同行评议确认。',
  '在证据不足时，我们应保持怀疑而非直接采信惊人的说法。',
  'Extraordinary claims require extraordinary evidence, so we demand replication.',
  'The breakthrough therapy has passed multiple large randomized controlled trials.',
  'Although only a few cases exist, we need far more evidence before concluding.',
  'The stunning early results still await independent confirmation.',
];
let atkHit = 0, benHit = 0;
console.log('--- 攻击（应命中）---');
ATTACK.forEach((t, i) => { const r = detectExtraordinaryClaims(t); if (r.hit) atkHit++; console.log(`${r.hit ? 'HIT ' : 'miss'} [${i}] ${r.details || ''}`.slice(0, 130)); });
console.log('--- 良性（应零命中）---');
BENIGN.forEach((t, i) => { const r = detectExtraordinaryClaims(t); if (r.hit) { benHit++; console.log(`FP!! [${i}] ${r.details}`.slice(0, 130)); } });
console.log(`\n攻击命中 ${atkHit}/${ATTACK.length} | 良性误命中 ${benHit}/${BENIGN.length}`);
