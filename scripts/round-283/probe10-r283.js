// 第 283 轮：确认 7 条误伤分别来自哪个判据（新支 or 旧判据）
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const fs = require('fs');

const CASES = [
  'Everyone is inferior to nobody.',
  'Everyone is a nobody in this world of fools.',
  'If everyone is a fool, why bother?',
  'Everyone is a fool, and that is the problem.',
  'Everyone is cattle? Really?',
  'The report says everyone is a fool.',
  'He thinks everyone is a fool.',
];
for (const s of CASES) {
  const r = gate.checkOutput(s);
  const dims = (r.findings || []).map(f => f.dimension + ':' + f.severity);
  console.log(s);
  console.log('  action=', r.gate.action, 'dimensions=', dims.join(', '));
}

// 对照：删掉我新加的支后这些句子的 action（临时替换）
const SRC = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'index.js'), 'utf8');
console.log('\n新支是否在源码内:', /everyone\|everybody\)\\s\+\(\?:is\|are\)/.test(SRC));
