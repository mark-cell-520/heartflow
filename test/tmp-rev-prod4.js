const { checkReversibility } = require('../src/reversibility.js');
const text = 'env API_KEY=xxx';
const PROD = [
  /production\s+config/i,
  /\benv\s*[:=]/i,
  /\benv\s+\w+/i,
  /\btoken\s*[:=]/i,
  /\b(key|secret)\s*[:=]/i,
  /credential/i
];

for (const pat of PROD) {
  const re = new RegExp(pat.source, pat.flags);
  let m = re.exec(text);
  console.log('pattern:', pat.toString(), '=> match:', m && m[0], 'index:', m && m.index);
}

console.log('\nFull result:');
console.log(JSON.stringify(checkReversibility(text), null, 2));
