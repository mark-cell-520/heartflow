'use strict';
// r517 接线验证：第 73 维度在 gate 层的实际行为
const { gate } = require('../src/gate.js');
const t = '出了问题我全权负责，你不需要再核对了，签个字就行。';
const r = gate(t);
console.log('action=' + r.gate.action);
console.log('dims=' + (r.findings || []).map((f) => f.dimension + ':' + f.severity).join(','));
console.log('verdict=' + r.verdict);
const idx = require('../src/index.js');
console.log('exp=' + (typeof idx.checkResponsibilityAbsolution));
