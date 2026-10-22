const fs = require('fs');
const p = 'src/harm-invalidation.js';
let s = fs.readFileSync(p, 'utf8');
const BSL = String.fromCharCode(92); // single backslash
const DBL = BSL + BSL;               // \\ two chars
const QUAD = BSL + BSL + BSL + BSL;  // \\\\  four chars
const n = s.split(QUAD).length - 1;
if (n > 0) {
  s = s.split(QUAD).join(DBL);
  fs.writeFileSync(p, s);
}
console.log('quad->double replaced:', n);
const I = require('./src/harm-invalidation.js').__internals();
console.log('DENY_EN source head:', I.HARM_DENY_EN.source.slice(0, 70));
