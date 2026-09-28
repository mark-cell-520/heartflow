'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..', '..', 'mark-heartflow-skill');
const L = fs.readFileSync(path.join(ROOT, 'src', 'dangerous-instruction.js'), 'utf8').split('\n');
const i = L.findIndex((l) => l.includes('[第 210 轮补]'));
console.log('起始行号 =', i + 1);
for (let j = i + 1; j < i + 24; j++) {
  const ln = L[j];
  const kind = /^\s{2}\/[^\s*]/.test(ln) ? 'REGEX' : (ln.trim().startsWith('//') ? 'COMMENT' : 'OTHER');
  console.log(j + 1, kind, JSON.stringify(ln).slice(0, 70));
}
