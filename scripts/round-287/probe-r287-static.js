'use strict';
const __HF = require('path').join(__dirname, '', '..', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
// round-287：验证「去行注释 + ] 锚定」静态口径能否数对三个 Set
const fs = require('fs');
const src = fs.readFileSync(__HF + '/src/index.js', 'utf8');
const stripped = src.replace(/^\s*\/\/.*$/gm, '');
const dimsOf = name => {
  const m = stripped.match(new RegExp('const ' + name + ' = new Set\\(\\[([\\s\\S]*?)\\]\\)'));
  return m ? (m[1].match(/['"][a-z_]+['"]/g) || []).map(s => s.slice(1, -1)) : [];
};
const b = dimsOf('BLOCK_DIMS'), r = dimsOf('REWRITE_DIMS'), v = dimsOf('VERIFY_DIMS');
console.log('block  :', b.length, b.includes('reward_hacking') ? 'rh✓' : 'rh✗');
console.log('rewrite:', r.length);
console.log('verify :', v.length);
console.log('ALL    :', new Set([...b, ...r, ...v]).size);
