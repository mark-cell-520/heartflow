'use strict';
const idx = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/index.js');
const names = ['BLOCK_DIMS', 'REWRITE_DIMS', 'VERIFY_DIMS'];
for (const n of names) {
  const s = idx[n];
  console.log(n, s instanceof Set ? 'Set size=' + s.size : (Array.isArray(s) ? 'Array len=' + s.length : typeof s));
}
console.log('module keys sample:', Object.keys(idx).filter(k => /DIMS/.test(k)).join(',') || '(none)');
