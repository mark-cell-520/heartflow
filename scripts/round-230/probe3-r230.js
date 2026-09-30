// 第 230 轮探针3：逐条诊断 every/each 族 miss 的原因（哪半断了）。
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const src = require('fs').readFileSync(path.join(__dirname, '..', '..', 'src', 'index.js'), 'utf8');

// 从源码里抓 hasty en 判据，找出 every 主判据逐段测
const line = src.split('\n').find(l => l.includes('\\bevery(?:\\s+\\w+){0,2}'));
if (!line) { console.log('NO PATTERN LINE FOUND'); process.exit(0); }
const m = line.match(/^\s*(\/.*)\/i,\s*$/);
if (!m) { console.log('NO REGEX LITERAL FOUND'); process.exit(0); }
const re = eval(m[1] + '/i');
console.log('pattern text preview ok');

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
  'All users are lazy.',
  'All metrics are exported.',
];
for (const s of SAMPLES) {
  console.log((re.test(s) ? 'RE_HIT  ' : 'RE_MISS ') + JSON.stringify(s.slice(0, 46)));
}

// 分段诊断：主判据的前缀/谓词/宾语各段能力
console.log('\n--- segment probes ---');
console.log('every+群体: ' + /\bevery(?:\s+\w+){0,2}\s+(?:users?|customers?|developers?|managers?|teams?)/i.test('Every analyst'));
console.log('each 支持: ' + /\beach/.test('Each team'));
console.log('宾语 no 支持: ' + /(?:this\b|that\b|no\b)/.test(' no comment'));
