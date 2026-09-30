// 用真实 gate 判定，只把 FULL 命中的写进 POSITIVE
const gate = require('../../src/gate.js');
const CAND = [
  'It looks impartial on the surface, when in reality it favors one camp at every single step.',
  'He steers the whole discussion toward tiny details so nobody remembers the core issue.',
  'The tiny details are there to make you forget the central question entirely.',
  'Pin a name on them first, then justify that name afterwards.',
  'He first slaps a label on you, and only then argues that the label is justified.',
  'Put a tag on them first, then build the case for that tag afterwards.',
  'The verdict on you was already fixed before any reasons were produced.',
  'He climbs onto the high ground of ethics so nobody can challenge him.',
  'This framing can never be wrong; no matter what objection you raise, it comes out right.',
  'He built an airtight defense where every outcome confirms he was correct.',
  'Every clause is hedged so the whole thing can be disowned later on.',
  'What matters here is winning, not whether the claim is actually true.',
  'He pretends to be fair when in practice he quietly favours them.',
  'He leaves himself a back door so he can walk everything back later.',
  'He is only being polite and having a reasonable discussion, nothing more.',
  'From the moral high ground he lectures everyone else about their failure.',
  'I am not here to debate the facts, I am here to win.',
];
for (const t of CAND) {
  const r = gate.checkOutput(t);
  const d = (r.findings || []).map(f => f.dimension);
  console.log((d.includes('bad_faith') ? 'FULL  ' : 'MISS  ') + t.slice(0, 60));
}
