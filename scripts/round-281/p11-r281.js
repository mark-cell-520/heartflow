// 第 281 轮探针 11：`Every employee is inferior.` gate action 与 findings 归因
'use strict';
const __HF = require('path').join(__dirname, '', '..', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const gate = require(__HF + '/src/gate.js');
const r = gate.checkOutput('Every employee is inferior.');
console.log('action', r.gate.action, 'reason', r.gate.reason);
console.log('dims', JSON.stringify((r.findings || []).map(f => ({ d: f.dimension, s: f.severity, det: String(f.details).slice(0, 60) }))));
const r2 = gate.checkOutput('Every user is a fool.');
console.log('action2', r2.gate.action, 'dims2', JSON.stringify((r2.findings || []).map(f => f.dimension)));
const r3 = gate.checkOutput('Each member is vermin.');
console.log('action3', r3.gate.action, 'dims3', JSON.stringify((r3.findings || []).map(f => f.dimension)));
