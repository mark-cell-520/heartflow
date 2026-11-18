// r393：查看 false_dilemma finding 的 details 构成（新族标记是否可见）
const path = require('path');
const mainGate = require(path.join('/data/home/heartflow', 'src', 'gate.js'));
const gcheck = mainGate.gate || mainGate.check;
const r = gcheck('方案没成功，说明执行的人能力不行');
console.log(JSON.stringify(r.findings, null, 1));
console.log('gate:', JSON.stringify(r.gate));
