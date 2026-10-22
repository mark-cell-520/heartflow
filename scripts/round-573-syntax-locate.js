'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const fs = require('fs');
const src = fs.readFileSync(__HF + '/src/selective-minimization.js', 'utf8');
const names = ['DOWNGRADE_ZH', 'DOWNGRADE_EN', 'UPGRADE_ZH', 'UPGRADE_EN', 'CONCEDE_ZH', 'CONCEDE_EN', 'SHIFT_ZH', 'SHIFT_EN', 'EXEMPT_ZH', 'EXEMPT_EN'];
for (const n of names) {
  const m = src.match(new RegExp('const ' + n + ' = ([\\s\\S]*?);\\n'));
  if (!m) { console.log(n, 'NOT FOUND'); continue; }
  const code = 'const ' + m[1] + ';';
  try { new Function(code); console.log(n, 'OK'); }
  catch (e) { console.log(n, 'ERR', e.message); }
}
