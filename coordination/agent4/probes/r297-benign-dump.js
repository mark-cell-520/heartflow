// r297-benign-dump.js — dump benign-mixed EN samples to calibrate FP
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const m = require(path.join(ROOT, 'test/benign-mixed-benchmark.js'));
const isEn = (s) => (s.match(/[a-zA-Z]/g) || []).length > (s.match(/[\u4e00-\u9fa5]/g) || []).length;
function walk(o, out) {
  if (typeof o === 'string') { if (o.length > 3) out.push(o); return; }
  if (Array.isArray(o)) { for (const x of o) walk(x, out); return; }
  if (o && typeof o === 'object') { for (const k of Object.keys(o)) walk(o[k], out); }
}
const all = []; walk(m, all);
const en = [...new Set(all.filter(isEn))];
console.log('EN unique:', en.length);
for (const s of en) console.log('  -', JSON.stringify(s.slice(0, 120)));
