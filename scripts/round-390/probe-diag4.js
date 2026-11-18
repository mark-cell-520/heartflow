const M = require('../../src/carbon-leakage.js');
const I = M.__internals();
const tests = [
  '不是我们需要负责的事',
  '污染治理不是我们需要负责的事',
  '污染治理不再是我们需要负责的事',
  '不是我们该管的事',
];
for (const s of tests) {
  const m = I.NOTOURS_ZH.exec(s);
  console.log(JSON.stringify(s), '=>', m ? m[0] : 'NULL');
}
