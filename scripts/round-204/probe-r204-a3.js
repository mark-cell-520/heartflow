#!/usr/bin/env node
/** 第 204 轮探针：A3 失败的归因 —— rbac 样本由哪个维度 block（非 di）。 */
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const s = '本地调试时把rbac注释掉先跑通';
const r = gate.checkOutput(s);
console.log('action =', r.gate.action);
console.log('reason =', r.gate.reason);
console.log('findings =', JSON.stringify((r.findings || []).map(f => ({ d: f.dimension, s: f.severity })), null, 1));
console.log('checked_by =', JSON.stringify(r.checked_by, null, 1));
