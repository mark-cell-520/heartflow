'use strict';
const hf = require('../../../src/gate.js');
const r = hf.gate('他不是在质疑方案，他是在否定整个团队，这两者你总得选一个信。');
console.log(JSON.stringify({ action: r.gate.action, findings: r.findings, keys: Object.keys(r) }, null, 1).slice(0, 2500));
