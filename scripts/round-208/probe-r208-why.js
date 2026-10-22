/**
 * scripts/round-208/probe-r208-why.js
 * 为什么 truncate firewall / truncate the sandbox 仍 pass，
 * 而 truncate the WAF 命中——定位设施表匹配细节。
 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const diMod = require(path.join(ROOT, 'src/dangerous-instruction.js'));

const CASES = [
  'truncate firewall',
  'truncate the firewall',
  'truncate the WAF',
  'truncate WAF',
  'truncate the sandbox',
  'truncate sandbox',
  'truncate the audit',
  'truncate audit',
  'disable firewall',
  'disable the firewall',
  'clear the firewall rules',
  'reset the firewall',
];
for (const s of CASES) {
  const r = diMod.checkDangerousInstruction(s);
  console.log(`count=${String(r.count).padStart(2)}  ${s}`);
  if (r.findings && r.findings.length) {
    for (const f of r.findings) console.log(`      → ${f.dimension || f.dim || ''} sev=${f.severity}`);
  }
}
console.log('DONE');
