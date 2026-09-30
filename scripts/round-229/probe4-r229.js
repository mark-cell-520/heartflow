// 第 229 轮四轮探针：②族归因定位 + 三良性样本的旧判据来源。
'use strict';
const path = require('path');
const idx = require(path.join(__dirname, '..', '..', 'src', 'index.js'));
const src = require('fs').readFileSync(path.join(__dirname, '..', '..', 'src', 'index.js'), 'utf8');

// 取出 en 表末尾本轮三条新判据的源码用于归因展示
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
  if (s.length) console.log('B' + i + ' -> ' + JSON.stringify(s));
}
// 单判据测试：单独跑新 ② 族正则在三良性句上
const engExcl = '(?!exported|imported|validated|logged|indexed)';
const r2 = new RegExp('\\ball\\s+(?:of\\s+)?(?:the\\s+)?(?:our\\s+|their\\s+|your\\s+)?(?:users?|customers?|developers?|managers?|teams?|engineers?|employees?|workers?|students?|members?|people|reviewers?|maintainers?|admins?|clients?|patients?|drivers?|players?|voters?|readers?)\\s+(?!exported|imported|validated|logged|indexed|partitioned|hashed|encrypted|truncated|deduplicated|rotated|archived|compressed|cached|queued|pipelined|migrated|backfilled|retried|throttled|serialized|deserialized|normalized|tokenized|escaped|wrapped|streamed|sharded|replicated|snapshotted|checksummed|rendered|templated|compiled|bundled|minified|transpiled|linted|formatted|lowercased|uppercased|trimmed|sorted|filtered|mapped|reduced|grouped|aggregated|paged|paginated)\\w*(?:\\s+(?:me|us|them|him|her|you)\\b|\\s+(?:have|has|had)\\b|\\s+(?:about|so|too|already|still|never|always|all)\\b)', 'i');
for (let i = 0; i < benign2.length; i++) {
  console.log('R2 B' + i + ' = ' + (r2.test(benign2[i]) ? 'HIT' : '-'));
}
// 旧判据 each of the three / all of / both nodes
const old = [
  /\ball\s+\w+\s+are\b/i,
  /\ball\s+\w+\s+do\b/i,
  /\bevery\s+single\b/i,
  /\bthe\s+whole\s+\w+\s+(does|is|has)/i,
  /\bno\s+\w+\s+ever\b/i,
  /\bnobody\s+ever\b/i,
];
for (const p of old) {
  const hits = benign2.map((t, i) => p.test(t) ? i : -1).filter(i => i >= 0);
  if (hits.length) console.log('旧判据 ' + p.source.slice(0, 40) + ' 命中 B' + hits.join(',B'));
}
