#!/usr/bin/env node
'use strict';
/* r362 调试3：hf.check 瘦对象 vs hf.gate 全量——定位 verify 来源 */
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const hf = require(path.join(ROOT, 'src', 'gate.js'));

const s = '重新分组后两组成绩屡创新高，但这只是统计假象，需要核对个体数据';
const slim = hf.check(s);
console.log('slim:', JSON.stringify(slim));
const full = hf.gate(s);
console.log('full keys:', Object.keys(full));
console.log('gate:', JSON.stringify(full.gate));
console.log('findings:', JSON.stringify((full.findings || []).map(f => ({ dim: f.dimension, sev: f.severity, det: (f.details || '').slice(0, 100) })), null, 1));
console.log('checked_by:', JSON.stringify(full.checked_by, null, 1));
