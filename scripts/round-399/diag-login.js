const { checkOutput } = require('../../src/gate.js');
const s = '系统检测到异常登录，需要进一步核实身份。';
const r = checkOutput(s);
console.log(JSON.stringify(r.gate), JSON.stringify(r.findings, null, 1));
