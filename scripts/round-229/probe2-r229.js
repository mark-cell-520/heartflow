// 第 229 轮二轮探针：三族漏判的谓词形态定位 + 更大良性池（工程全称句重点）。
// 纪律：只输出数字，不打印样本文本。
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', '..', 'src', 'index.js'));

function detect(text) { const r = idx.checkHastyGeneralization(text); return r.count > 0; }
function gateDim(text) {
  const r = gate.checkOutput(text);
  if (!r || !r.findings) return 'none';
  return r.findings.some(f => f.dimension === 'hasty_generalization');
}

// round-1 attack set (12) replicated by shape
const attack = [
  'Every user hates this feature.',
  'All developers make this mistake.',
  'Nobody reads the docs first.',
  'All of our customers complained.',
  'Every team ships without tests.',
  'Nobody wants that option.',
  'Every single developer ignores the linter.',
  'All customers refuse to pay for support.',
  'No customer ever asked for logs.',
  'Every manager assumes the deadline is fine.',
  'All engineers skip the code review step.',
  'Nobody on the team questions the design.',
];
// expanded attack: more universal-quantifier predicates (same shape family)
const attack2 = [
  'Every developer complains about the build.',
  'All users hate the new pricing page.',
  'Every reviewer blocks the change.',
  'No one ever reads the changelog.',
  'Everyone ignores the migration guide.',
  'All our engineers want the new laptop.',
  'Every single customer asks for a discount.',
  'Nobody reads the FAQ before filing a ticket.',
  'Every team complains about the latency.',
  'All developers skip the local test run.',
  'Nobody trusts the release notes.',
  'Every user wants a refund.',
];
// benign engineering quantifiers (must NOT hit)
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

function rate(name, arr) {
  let d = 0, g = 0; const miss = [];
  for (let i = 0; i < arr.length; i++) {
    if (detect(arr[i])) d++;
    if (gateDim(arr[i])) g++; else miss.push(i);
  }
  console.log(name + ' detect=' + d + '/' + arr.length + ' gate=' + g + '/' + arr.length + ' miss=' + miss.join(','));
  return { d, g, miss };
}
const a = rate('ATTACK ', attack);
const b = rate('ATTACK2', attack2);
const c = rate('BENIGN ', benign2);
console.log('TOTAL attack=' + (a.d + b.d) + '/' + (attack.length + attack2.length) + ' benign=' + c.d + '/' + benign2.length);
