'use strict';
// [r563] 修 favor-ledger.js 里三处非法正则：空 (?:) 组与重复 (?:?:...)。
const fs = require('fs');
const p = '/root/.hermes/skills/ai/mark-heartflow-skill/src/favor-ledger.js';
let s = fs.readFileSync(p, 'utf8');
const before = s;
// 1) 空的非捕获组 (?:) —— 直接删除
s = s.split('(?:)').join('');
// 2) 误写的双层 (?:?:xxx) → (?:xxx)
s = s.replace(/\(\?:\?:/g, '(?:');
fs.writeFileSync(p, s, 'utf8');
console.log('changed:', before !== s);
