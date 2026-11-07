#!/usr/bin/env node
/** r236 诊断 v2：FP 真实归因维度 + MISS 腿级缺口 */
'use strict';
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const mod = require(HF + '/src/automation-bias.js');
const { gate } = require(HF + '/src/gate.js');

const CASES = [
  ['M1-ZH', '没人对这个结果提出异议，说明它是公正的'],
  ['M2-EN', 'It must be right because the algorithm produced it'],
  ['M3-EN', 'No one has objected, so the outcome must be fair'],
  ['M4-EN', "If anything goes wrong it is the system's fault, not mine"],
  ['FP1-ZH', '算法可能有偏差，所以不能单独作为录取依据'],
  ['FP2-ZH', '系统只是辅助工具，医生拥有最终诊断权'],
];

for (const [tag, text] of CASES) {
  const g = gate(text);
  const dims = (g.findings || []).map(f => `${f.dimension}(${f.severity})`);
  console.log(`\n${tag} gate=${g.gate.action}`);
  console.log('  findings:', dims.join(' | ') || '(none)');
  // 腿级
  try {
    const r = mod.detectAutomationBias(text);
    const sig = r.signatures || r.sigs || (r.__legs) || null;
    console.log('  raw keys:', Object.keys(r).join(','));
    console.log('  raw:', JSON.stringify(r).slice(0, 400));
  } catch (e) { console.log('  err', e.message); }
}
console.log('\n__internals keys:', Object.keys(mod.__internals || {}).join(','));
