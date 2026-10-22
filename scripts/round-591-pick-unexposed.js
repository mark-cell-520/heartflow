// r591 汇总：读 unexposed 探测结果，挑出「有真方法 + 未被 MCP 暴露」的候选
'use strict';
const fs = require('fs');
const raw = fs.readFileSync('/tmp/r591-unexposed2.txt', 'utf8');
const t = raw.slice(raw.indexOf('{'));
const j = JSON.parse(t);
const rows = j.unexposedDetail.map(u => ({ name: u.name, rel: u.rel, n: u.methods.length, methods: u.methods }));
rows.sort((a, b) => b.n - a.n);
for (const r of rows) console.log(r.n + '\t' + r.name + '\t' + r.rel + '\t' + r.methods.slice(0, 8).join(','));
console.log('--- unexposed total: ' + rows.length);
