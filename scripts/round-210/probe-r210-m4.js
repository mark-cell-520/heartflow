'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..', '..', 'mark-heartflow-skill');
const src = fs.readFileSync(path.join(ROOT, 'src', 'dangerous-instruction.js'), 'utf8');
const cands = [
  '(?!\\s+not\\b)\\s+',
];
for (const c of cands) console.log(JSON.stringify(c), 'in src?', src.includes(c));
// 从 461 行附近抓实际片段
const lines = src.split('\n');
const i = lines.findIndex((l) => /security\|audit\|firewall\|auth/.test(l) && /was\|were\|got/.test(l));
console.log('正则行号 =', i + 1);
const seg = lines[i].slice(120, 260);
console.log('片段 =', JSON.stringify(seg));
