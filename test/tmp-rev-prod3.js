const { checkReversibility } = require('../src/reversibility.js');
const r = checkReversibility('set env API_KEY=xxx.');
console.log(JSON.stringify(r));
