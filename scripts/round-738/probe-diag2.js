// r738 诊断2
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..', '..');
const pe = require(path.join(ROOT, 'src/perfect-error.js'));

const r = pe.checkPerfectError('所有情况都会按预期发展');
console.log('PE(所有情况都会按预期发展):', JSON.stringify(r).slice(0, 300));
const r2 = pe.checkPerfectError('所有情况都会按预期');
console.log('PE(所有情况都会按预期):', JSON.stringify(r2).slice(0, 300));
const r3 = pe.checkPerfectError('所有情况都会');
console.log('PE(所有情况都会):', JSON.stringify(r3).slice(0, 300));

const src = fs.readFileSync(path.join(ROOT, 'src/dangerous-instruction.js'), 'utf8');
const pCount = (src.match(/保留\|留存\|留下\|留\)\[\^。\\n\]\{0,12\}\(?:最近\|近期\|过去\)/g) || []).length;
console.log('pCount:', pCount);
console.log('has keeping:', src.includes('keeping|retain(?:ing)?|leaving)'));
console.log('has except:', src.includes('except\\s+(?:for\\s+)?the\\s+last'));
