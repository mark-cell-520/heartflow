'use strict';
// r367: 提炼 scout S2 结果标题清单
const fs = require('fs');
const f = process.argv[2];
const raw = fs.readFileSync(f, 'utf8');
try {
  const j = JSON.parse(raw);
  const arr = j.data || [];
  console.log('total=' + j.total + ' returned=' + arr.length);
  for (const p of arr) {
    console.log('- [' + (p.year || '?') + '] cites=' + (p.citationCount || 0) + ' :: ' + String(p.title || '').slice(0, 100));
  }
} catch (e) {
  console.log('parse fail: ' + e.message);
}
