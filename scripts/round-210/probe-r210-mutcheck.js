'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..', '..', 'mark-heartflow-skill');
const DI = path.join(ROOT, 'src', 'dangerous-instruction.js');
const orig = fs.readFileSync(DI, 'utf8');

// M1 逻辑
const lines = orig.split('\n');
const out = [];
let skipping = false, removed = false;
for (const ln of lines) {
  if (!skipping && ln.includes('[第 210 轮补]')) { skipping = true; removed = true; continue; }
  if (skipping) {
    if (/^\s{2}\/[^\s*]/.test(ln)) { skipping = false; continue; }
    if (ln.trim().startsWith('//')) continue;
    skipping = false;
  }
  out.push(ln);
}
console.log('M1 removed =', removed);
console.log('M1 删除行数 =', lines.length - out.length);
const idx = out.join('\n');
console.log('M1 补丁注释仍在?', idx.includes('[第 210 轮补]'));
console.log('M1 新正则仍在?', idx.includes('has\\s+been'));

// M4 逻辑
const target = '(?!\\s+not\\b)\\s+';
console.log('M4 target in src?', orig.includes(target));
