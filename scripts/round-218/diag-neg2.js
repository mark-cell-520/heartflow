'use strict';
// [r218] NEGOTIATION_PROC 中性化后逐句归因
const fs = require('fs');
const src = fs.readFileSync('C:/Users/USER782663/heartflow-engine/src/false-balance.js', 'utf8');
const anchor = '斡旋|调停';
const i = src.indexOf(anchor);
console.log('anchor idx:', i);
const start = src.lastIndexOf('/', i);
console.log('literal start ctx:', JSON.stringify(src.slice(start, start + 60)));
let end = -1;
for (let j = i; j < src.length; j++) {
  if (src[j] === '/') { let k = j + 1; while (k < src.length && /[a-z]/.test(src[k])) k++; end = k; break; }
}
console.log('end:', end, 'flags ctx:', JSON.stringify(src.slice(end - 3, end + 3)));
const neutralized = src.slice(0, start) + '/(?!x)x/' + src.slice(end);
fs.writeFileSync('C:/Users/USER782663/AppData/Local/hermes/cache/scratch/fb-neutralized.js', neutralized);
const fb = require('C:/Users/USER782663/AppData/Local/hermes/cache/scratch/fb-neutralized.js');
const s = '谈判中双方各让一步，最终敲定了分期付款方案。';
console.log('after neutralize hit =', fb.checkFalseBalance(s).hit);
