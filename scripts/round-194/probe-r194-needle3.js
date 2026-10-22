// 第 194 轮： definif byte-level diagnosis of needle vs source escaping
'use strict';
const fs = require('fs');
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = fs.readFileSync(path.join(HF, 'src/dangerous-instruction.js'), 'utf8');

// Source L703 slice (the object-first mirror branch)
const srcL703 = SRC.split('\n')[702];
console.log('=== src L703 length:', srcL703.length);
const i0 = srcL703.indexOf('prod');
console.log('around prod:', JSON.stringify(srcL703.slice(i0 - 2, i0 + 12)));
// count backslashes in a 20-char window
let win = srcL703.slice(srcL703.indexOf('(?='), srcL703.indexOf('(?=') + 30);
console.log('assert window:', JSON.stringify(win));

// Now build candidate strings WITHOUT any guesswork, using char codes
function bs(n) { return '\\'.repeat(n); }
console.log('\n=== candidates for n backslashes in [^。Xn] pattern ===');
for (let n = 1; n <= 3; n++) {
  const cand = '(?:生产|线上|正式|prod' + bs(n) + 'b|production|live)(?![^。' + bs(n) + 'n]{0,24}';
  console.log(`  n=${n} backslash -> inSrc: ${SRC.includes(cand)}`);
}

// The existing passing needle NL_BAK from the test file
const TEST = fs.readFileSync(path.join(HF, 'test/dangerous-instruction-backup-evidence-round190.test.js'), 'utf8');
const tl = TEST.split('\n');
const bakLine = tl.find(l => l.includes('const NL_BAK'));
console.log('\n=== test NL_BAK source line ===');
console.log(JSON.stringify(bakLine.slice(0, 120)));
const mirrorLine = tl.find(l => l.includes('const NL_BAK_MIRROR'));
console.log('=== test NL_BAK_MIRROR source line ===');
console.log(JSON.stringify(mirrorLine.slice(0, 120)));
