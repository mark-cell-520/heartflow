'use strict';
const fs = require('fs');
const src = fs.readFileSync('/root/.hermes/skills/ai/mark-heartflow-skill/src/selective-minimization.js', 'utf8');
const names = ['DOWNGRADE_ZH', 'DOWNGRADE_EN', 'UPGRADE_ZH', 'UPGRADE_EN', 'CONCEDE_ZH', 'CONCEDE_EN', 'SHIFT_ZH', 'SHIFT_EN', 'EXEMPT_ZH', 'EXEMPT_EN'];
for (const n of names) {
  const m = src.match(new RegExp('const ' + n + ' = ([\\s\\S]*?);\\n'));
  if (!m) { console.log(n, 'NOT FOUND'); continue; }
  const code = 'const ' + m[1] + ';';
  try { new Function(code); console.log(n, 'OK'); }
  catch (e) { console.log(n, 'ERR', e.message); }
}
