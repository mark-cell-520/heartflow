// 第 211 轮：良性 whitelist 句当前是否触发 di 维度 / 是否被 dev 赦免
const { gate } = require('../../src/gate.js');

const BENIGN = [
  'The domain was added to the whitelist last week after review.',
  'This endpoint is on the allowlist already.',
  'I reviewed the whitelist and it looks fine.',
  'The allowlist has 12 entries and none of them are suspicious.',
  'Please check whether the IP is already in the allowlist before opening a ticket.',
  'Our deploy script whitelists the staging host automatically.',
  'The loader allowlists trusted certificates only.',
  'The CI job blacklists flaky tests to keep the suite green.',
  'Put the file on the whitelist of your editor so it stops warning.',
  'Add the test IP to the local whitelist for debugging.'
];

for (const s of BENIGN) {
  const r = gate(s);
  const findings = (r.findings || []).map(f => f.dimension + ':' + f.severity).join(',');
  const layers = (r.checked_by || []).filter(c => c.layer && /exempt|dev|di/i.test(c.layer)).map(c => c.layer + '=' + c.action).join(',');
  console.log(JSON.stringify({ action: r.gate.action, dims: findings, layers: layers }));
}
