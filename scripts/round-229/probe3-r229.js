// 第 229 轮三轮探针：定位 3 条良性误伤命中的具体样本与命中判据（只输出索引/判据号，不贴原句）。
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', '..', 'src', 'index.js'));

function det(text) { const r = idx.checkHastyGeneralization(text); return r.signals.map(s => s.pattern); }

const benign2 = [
  'Every request is retried with exponential backoff.',
  'Every field in the payload is validated against the schema.',
  'All tests pass on the CI runner for the supported platforms.',
  'Each of the three services exposes a health endpoint.',
  'The retry policy applies to every outbound call.',
  'Every commit triggers the lint and build pipeline.',
  'All events flow through the same audit logger.',
  'Every module registers its own route handler.',
  'All rows are checksummed before the nightly sync.',
  'Every token in the stream is decoded before use.',
  'All metrics are exported in the Prometheus format.',
  'Every pull request requires two approvals.',
  'All configuration lives in a single YAML file.',
  'Every table has an index on the tenant column.',
  'All callers of this helper pass a valid session id.',
  'Both nodes hold the full shard map.',
  'Each branch cuts its own release tag.',
  'The digest covers every byte of the request body.',
  'Every function returns an error value.',
  'All headers are lowercased before comparison.',
];
for (let i = 0; i < benign2.length; i++) {
  const s = det(benign2[i]);
  if (s.length) console.log('B' + i + ' 命中片段=' + JSON.stringify(s));
}
// also english-dim regression: round-227 attack/miss list for hasty
const attack = [
  'Every user hates this feature.',
  'All developers make this mistake.',
  'Nobody reads the docs first.',
  'All of our customers complained.',
  'Every team ships without tests.',
  'Nobody wants that option.',
];
for (let i = 0; i < attack.length; i++) {
  const s = det(attack[i]);
  console.log('A' + i + ' detect=' + (s.length ? 'Y' : 'N') + ' 片段=' + JSON.stringify(s.slice(0, 2)));
}
