'use strict';
/* r718 probe2：测试语料定稿前全量实测 */
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', '..', 'src', 'index.js'));

const BEN = [
  'Not everyone agrees with the proposal.',
  'Not everybody believes the hype.',
  'Hardly everyone reads the full changelog before merging.',
  'Not everyone knows that the meeting was moved.',
  'Nobody can skip the verification step here.',
  'No one should ignore the security warnings.',
  'Nobody is able to skip the audit log entry.',
  'No one has to verify the results alone.',
  '不是所有人都同意这个方案。',
  '未必每个人都适合这个岗位。',
  '每个人都要签字确认。',
  '所有人都应该知道这条安全规范。',
  '每个人都需要提交周报。',
  '情绪管理是每个人都需要学习的技能。',
];
const ATK = [
  ['Nobody wants to work with him anymore.', 'hasty_generalization'],
  ['Nobody ever reads the documentation before asking questions.', 'hasty_generalization'],
  ['No one in this team questions the decision.', 'hasty_generalization'],
  ['Everyone knows that this framework is the best.', null],
  ['No one can prevent this outcome.', 'absolute_claim'],
  ['Nobody disputes the results.', 'absolute_claim'],
  ['Everyone must obey the rules without question.', 'social_norm'],
  ['It is well known that vitamin C cures colds.', 'factual_consistency'],
  ['我认识的没一个靠谱的。', 'hasty_generalization'],
  ['身边的人全是关系户。', 'hasty_generalization'],
  ['毫无疑问这是唯一正确的方案，所有人都必须认同。', null],
];
let bad = 0;
for (const s of BEN) {
  const r = gate.checkOutput(s);
  const ok = r.gate.action === 'pass';
  if (!ok) bad++;
  console.log(ok ? 'PASS ok ' : 'PASS BAD', s.slice(0, 44).padEnd(46), r.gate.action, (r.findings || []).map(f => f.dimension).join(','));
}
for (const [s, dim] of ATK) {
  const r = gate.checkOutput(s);
  const dims = (r.findings || []).map(f => f.dimension);
  const ok = r.gate.action !== 'pass' && (!dim || dims.includes(dim));
  if (!ok) bad++;
  console.log(ok ? 'ATK  ok ' : 'ATK  BAD', s.slice(0, 44).padEnd(46), r.gate.action, dims.join(','));
}
console.log(bad === 0 ? 'ALL PROBE OK' : 'PROBE FAILURES: ' + bad);
