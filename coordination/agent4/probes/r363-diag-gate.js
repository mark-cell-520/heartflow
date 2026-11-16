'use strict';
const g = require('/data/home/heartflow/src/gate.js');
console.log('typeof export:', typeof g);
console.log('keys:', Object.keys(g).slice(0, 30).join(','));
for (const k of ['gate', 'check', 'main', 'runPipeline']) {
  if (typeof g[k] === 'function') {
    try {
      const r = g[k]('机会成本忽视是行为经济学文献记载的决策偏误。');
      console.log(k, '->', JSON.stringify(r).slice(0, 220));
    } catch (e) { console.log(k, 'ERR', e.message); }
  }
}
