'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
// [r563] 修 favor-ledger.js 里三处非法正则：空 (?:) 组与重复 (?:?:...)。
const fs = require('fs');
const p = __HF + '/src/favor-ledger.js';
let s = fs.readFileSync(p, 'utf8');
const before = s;
// 1) 空的非捕获组 (?:) —— 直接删除
s = s.split('(?:)').join('');
// 2) 误写的双层 (?:?:xxx) → (?:xxx)
s = s.replace(/\(\?:\?:/g, '(?:');
fs.writeFileSync(p, s, 'utf8');
console.log('changed:', before !== s);
