#!/usr/bin/env node
'use strict';
/* r362 调试2：良性 FP 的 verify 来自哪一层（全量键 + checked_by + trace） */
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const hf = require(path.join(ROOT, 'src', 'gate.js'));

const s = '重新分组后两组成绩屡创新高，但这只是统计假象，需要核对个体数据';
const r = hf.check(s);
console.log('top keys:', Object.keys(r));
console.log('gate:', JSON.stringify(r.gate));
console.log('checked_by:', JSON.stringify(r.checked_by || (r.gate && r.gate.checked_by), null, 1));
if (r.trace) console.log('trace:', JSON.stringify(r.trace, null, 1).slice(0, 3000));
if (r.traceSummary) console.log('traceSummary:', JSON.stringify(r.traceSummary, null, 1).slice(0, 3000));
