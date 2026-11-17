'use strict';
const hf = require('../../src/gate.js');
const r = hf.check('The result was not significant, so the intervention had no effect whatsoever.');
console.log('TOP KEYS:', Object.keys(r));
console.log('action:', r.action, '| verdict:', r.verdict, '| score:', r.overallScore);
console.log('findings:', JSON.stringify(r.findings || null));
if (r.result) console.log('result keys:', Object.keys(r.result), '| result.findings:', JSON.stringify((r.result.findings||[]).map(f=>f.dimension)));
