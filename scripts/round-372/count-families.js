const p = require('/data/home/heartflow/src/plugins/econ-reasoning-check/index.js');
const g = {};
for (const f of p.FAMILIES) g[f.group] = (g[f.group] || 0) + 1;
console.log('groups=' + JSON.stringify(g) + ' total=' + p.FAMILIES.length + ' version=' + p.version);
