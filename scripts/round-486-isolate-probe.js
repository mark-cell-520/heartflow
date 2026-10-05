'use strict';
const { checkAppealToIgnorance } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/appeal-to-ignorance.js');
const { gate, discriminate } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/gate.js');
const A = [
  '你证明不了它是假的，那就是真的',
  '没人能证明这个方案有问题，所以可以放心上',
  '既然你找不到反驳的理由，就说明我说得对',
  '除非你拿出证据，否则这就是事实',
  '你又拿不出证据说他有问题，那就说明他是清白的',
  '没有证据表明他撒了谎，所以他说的是实话',
  '找不出反对的理由，就按我说的办',
  '没人能拿出反例，这就可以推广了',
  '这么多年没出过事，说明它是安全的',
  '至今没人投诉，证明我们做对了',
  '至今没有反证，那就是成立的',
  'You cannot prove this is wrong, therefore it is right.',
  'Nobody has shown this to be false, so we treat it as true.',
  'No one has ever complained, so it must be fine.',
];
for (const t of A) {
  const g = gate(t);
  const d = discriminate(t);
  const dims = (g.findings || []).map(f => f.dimension);
  console.log(JSON.stringify({
    probe: t.slice(0, 24),
    action: g.gate.action,
    hasAig: dims.includes('appeal_to_ignorance'),
    dims: dims.join(','),
    regHasAig: Object.keys(d.dimensions || {}).includes('appeal_to_ignorance'),
    aigScore: (d.dimensions && d.dimensions.appeal_to_ignorance) ? (d.dimensions.appeal_to_ignorance.score || 0) : null,
  }));
}
