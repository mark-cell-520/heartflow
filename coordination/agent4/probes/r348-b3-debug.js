'use strict';
// r348 B3 排查：Case counts jumped after the screening program, suggesting the
// illness is on an upward trend. —— 三腿逐腿直调定位。
const { checkImmortalTimeBias, __internals } = require('/data/home/heartflow/src/immortal-time-bias.js');
const I = __internals();
const s = 'Case counts jumped after the screening program, suggesting the illness is on an upward trend.';
const r = checkImmortalTimeBias(s);
console.log('module hit:', r.hit, JSON.stringify(r));
for (const [k, v] of Object.entries(I)) {
  if (!Array.isArray(v)) continue;
  for (let i = 0; i < v.length; i++) {
    const re = new RegExp(v[i].source, v[i].flags.includes('g') ? v[i].flags : v[i].flags + 'g');
    const m = s.match(re);
    if (m) console.log('HIT', k, 'elem#' + i, JSON.stringify(m[0]));
  }
}
