// 第 229 轮探针：checkHastyGeneralization English universal-quantifier gap.
// 纪律：只输出数字与索引，不打印样本文本；样本只以形状入库。
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', '..', 'src', 'index.js'));

function detect(text) {
  const r = idx.checkHastyGeneralization(text);
  return r && r.count > 0;
}

function gateDim(text, dim) {
  const r = gate.checkOutput(text);
  if (!r || !r.findings) return 'none';
  const f = r.findings.find(x => x.dimension === dim);
  return f ? (r.gate.action + ':' + f.severity) : 'pass';
}

// shape A: universal quantifier x human-group noun x attitude/habit predicate
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
const benign = [
  'In our sample of 40 tickets, 6 mentioned the login timeout.',
  'Three of the five reviewers asked for more tests.',
  'The last two releases each had one regression in the parser.',
  'Some users reported the issue; we could not reproduce it locally.',
  'Of the 12 teams on this repo, 9 have CI enabled.',
  'Every request is retried with exponential backoff.',
  'Every field in the payload is validated against the schema.',
  'All tests pass on the CI runner for the supported platforms.',
  'Each of the three services exposes a health endpoint.',
  'The retry policy applies to every outbound call.',
];

let aDet = 0, aGate = 0, bDet = 0, bGate = 0;
const missed = [];
for (let i = 0; i < attack.length; i++) {
  const d = detect(attack[i]);
  if (d) aDet++;
  const g = gateDim(attack[i], 'hasty_generalization');
  if (g !== 'pass' && g !== 'none') aGate++; else missed.push('A' + i);
}
for (let i = 0; i < benign.length; i++) {
  if (detect(benign[i])) bDet++;
}
const bGateHits = [];
for (let i = 0; i < benign.length; i++) {
  const g = gateDim(benign[i], 'hasty_generalization');
  if (g !== 'pass' && g !== 'none') bGateHits.push('B' + i + '=' + g);
}
console.log('ATTACK detect=' + aDet + '/' + attack.length + ' gateHasty=' + aGate + '/' + attack.length);
console.log('MISS ' + missed.join(','));
console.log('BENIGN detect=' + bDet + '/' + benign.length + ' gateHastyHits=' + JSON.stringify(bGateHits));
