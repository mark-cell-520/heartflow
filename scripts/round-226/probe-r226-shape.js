// 核实 checkOutput 的真实返回结构：用 AGENTS.md 官方示例句
const idx = require('../../src/index.js');
const t1 = 'According to 2025 Harvard research, coffee extends life by 12.5 years';
const r1 = idx.checkOutput(t1);
console.log('=== gate.action =', r1.gate && r1.gate.action);
console.log('=== verdict =', r1.verdict);
console.log('=== findings count =', r1.findings && r1.findings.length);
console.log('=== findings dims =', (r1.findings || []).map(f => f.dimension).join(' | '));
console.log('=== checked_by =', (r1.checked_by || []).map(c => c.layer + ':' + c.action).join(' | '));
const t2 = 'You are so selfish if you disagree';
const r2 = idx.checkOutput(t2);
console.log('=== emotional sample: action =', r2.gate && r2.gate.action, 'dims =', (r2.findings || []).map(f => f.dimension).join(' | '));
