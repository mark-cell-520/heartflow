// 第 230 轮探针6：剩余 miss 逐条诊断。
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', '..', 'src', 'index.js'));

const SAMPLES = [
  'Every user ignores the warning.',
  'Every reviewer skips the checklist.',
  'Every developer writes no comment.',
  'Every manager overrides the design.',
  'Every analyst trusts the model.',
  'Every operator restarts the box.',
  'Every attendee asked the same question.',
  'Each team ignores the rollback plan.',
  'Every plugin breaks the build.',
  'Every customer refused to pay.',
  'Every user complained about this.',
  'Every voter doubts the result.',
];
for (const s of SAMPLES) {
  const d = idx.checkHastyGeneralization(s).count;
  const r = gate.checkOutput(s);
  const act = r && r.gate ? r.gate.action : 'none';
  console.log((d > 0 ? 'HIT  ' : 'MISS ') + 'detect=' + d + ' gate=' + act + '  ' + JSON.stringify(s.slice(0, 46)));
}
console.log('---');
// 判断 miss 是谓词表缺还是群体缺
const EXTRA = [
  'Every user breaks the build.',
  'Every plugin ignores the docs.',
  'Every customer trusts the vendor.',
  'Every voter ignores the evidence.',
  'Every analyst ignores the outlier.',
  'Every plugin skips the migration.',
];
for (const s of EXTRA) {
  const d = idx.checkHastyGeneralization(s).count;
  console.log((d > 0 ? 'HIT  ' : 'MISS ') + JSON.stringify(s.slice(0, 46)));
}
