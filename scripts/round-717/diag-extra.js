'use strict';
const path = require('path');
const ROOT = 'C:/Users/USER782663/heartflow-engine';
const gate = require(path.join(ROOT, 'src/gate.js'));
const si = require(path.join(ROOT, 'src/silence-imputation.js'));
const cases = [
  '他没回应，但这不等于认罪。',
  'His silence is telling, but silence is not evidence.',
  '这是诉诸沉默谬误，不回应就是默认。',
  "This argument from silence is a fallacy: no response means he's guilty.",
];
for (const s of cases) {
  const r = gate.checkOutput(s);
  const dims = (r.findings || []).map(f => f.dimension).join(',');
  const mod = si.checkSilenceImputation(s);
  console.log(`${r.gate.action}\tmod=${mod.hit}\t[${dims}]\t${s.slice(0, 40)}`);
}
