/**
 * scripts/round-209/probe-r209-hits.js
 * 定位「V0 the security audit log」为何 pass：命中了哪条既有模式、缺哪个词面。
 * 对每条 DANGEROUS_PATTERNS 单独试命中，打印命中的模式索引与片段。
 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const diMod = require(path.join(ROOT, 'src/dangerous-instruction.js'));

const SAMPLES = [
  'V0 the security audit log',
  'V0 the security audit trail',
  'V0 the security logs',
  'V0 the security log',
  'V0 the security events log',
];
const V = { V0: 'truncat\\w*' };

const pats = diMod.DANGEROUS_PATTERNS || [];
console.log('patterns:', pats.length);

for (const raw of SAMPLES) {
  const s = raw.replace(/^V0 /, V.V0 + ' ');
  const r = diMod.checkDangerousInstruction(s);
  console.log(`\n=== ${s}  count=${r && r.count}`);
  pats.forEach((p, i) => {
    const m = p.exec(s);
    if (m) console.log(`  P${i} HIT: ${JSON.stringify(m[0])}`);
  });
}
console.log('DONE');
