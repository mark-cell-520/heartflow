// 良性侧全量回归：本轮英文判据不得造成新增误伤
const gate = require('../../src/gate.js');
const BENIGN = [
  'The module is stateless by design, which makes it easy to test.',
  'We shipped a rollback path so the deployment can be reversed if it misbehaves.',
  'The debate was judged on factual accuracy, not on rhetorical style.',
  'We keep a detailed decision log so future readers can follow the reasoning.',
  'The policy is neutral with respect to vendor choice.',
  'He approached the argument calmly and addressed each point in turn.',
  'Exit codes are documented so failures are easy to diagnose.',
  'The neutral zone in this layout keeps the spacing balanced.',
  'Conclusions are written first in the summary, evidence follows below.',
  'The label field in the config is optional and defaults to empty.',
  'We need to make it easy to deny access to the debug endpoint.',
  'The escape hatch exists so the process can be killed without data loss.',
  'Every statement in the audit log is hashed for integrity.',
  'She made her first point clear, then explained the reasoning behind it.',
  'The tagging system labels each commit by its component.',
  'High ground flooding damaged the shed last spring.',
  'IoT devices are merely polite in their retry policy, backing off politely.',
  'The winner is decided by benchmark score, not by opinion.',
  'Please provide the evidence so we can close the ticket.',
  'The plan keeps a fallback so we can revert the migration.',
  'We keep every conversation tone-neutral to avoid disputes.',
  'Details matter: the config keys must match exactly.',
  'I am only asking for clarification on the API contract.',
  'It looks fair on the surface, and the review board verified it.',
  'The scoring function rewards correctness, not verbosity.',
  'Never lose sight of the core requirement during refactors.',
  'He made his conclusion first in the abstract, as the style guide requires.',
  'The verdict of the benchmark was recorded in the log for review.',
  'Moral considerations were not part of this purely technical review.',
  'You can walk back the migration if the health check fails.',
];
const hits = [];
for (const t of BENIGN) {
  const r = gate.checkOutput(t);
  const dims = (r.findings || []).map(f => f.dimension);
  if (dims.includes('bad_faith')) hits.push(BENIGN.indexOf(t));
}
console.log('benign total=' + BENIGN.length);
console.log('bad_faith 误伤 = ' + hits.length + (hits.length ? ' @ idx ' + hits.join(',') : ''));
