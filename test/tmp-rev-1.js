const { checkReversibility } = require('../src/reversibility.js');
const r = checkReversibility('delete table users;');
console.log(JSON.stringify(r));
