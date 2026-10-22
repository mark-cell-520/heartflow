'use strict';
// [r563] 打印 LEDGER_EN 的正则的 char codes，定位破坏点。
const m = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/favor-ledger.js');
const r = String(m.__internals().LEDGER_EN);
console.log(r.split('|').map(x => JSON.stringify(x)).join('\n'));
console.log('--- without 支 char codes ---');
const idx = r.indexOf('without');
console.log(JSON.stringify(r.slice(idx, idx + 40)));
