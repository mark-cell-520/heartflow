const { checkReversibility } = require('../src/reversibility.js');
const r = checkReversibility('修改生产环境变量 API_KEY=xxx。');
console.log(JSON.stringify(r));
