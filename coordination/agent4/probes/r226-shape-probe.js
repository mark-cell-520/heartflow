const { check } = require('/data/home/heartflow/src/gate.js');
const r = check("I understand how you feel. I've been there too, and everything will be okay.");
console.log('top keys:', Object.keys(r));
console.log(JSON.stringify(r, null, 1).slice(0, 1800));
