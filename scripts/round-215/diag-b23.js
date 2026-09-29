// 验证 B2-3 形是命中 E7a 还是别支
const t = 'The allowlist has 12 entries and none of them are suspicious.';
const { checkDangerousInstruction } = require('../../src/dangerous-instruction.js');
const r = checkDangerousInstruction(t);
console.log('count=' + r.count, JSON.stringify(r.hits));
