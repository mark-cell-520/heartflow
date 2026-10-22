'use strict';
const __HF = require('path').join(__dirname, '', '..', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const idx = require(__HF + '/src/index.js');
const names = ['BLOCK_DIMS', 'REWRITE_DIMS', 'VERIFY_DIMS'];
for (const n of names) {
  const s = idx[n];
  console.log(n, s instanceof Set ? 'Set size=' + s.size : (Array.isArray(s) ? 'Array len=' + s.length : typeof s));
}
console.log('module keys sample:', Object.keys(idx).filter(k => /DIMS/.test(k)).join(',') || '(none)');
