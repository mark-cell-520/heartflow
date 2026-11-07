#!/usr/bin/env node
/** r236 缺口诊断：4 个 MISS + 2 个 FP 的腿级归因 */
'use strict';
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const mod = require(HF + '/src/automation-bias.js');
const { gate } = require(HF + '/src/gate.js');

// 取模块内部词表（通过 inject 暴露的 R 或直接 require 后取导出）
const keys = Object.keys(mod);
console.log('exports:', keys.join(', '));

const CASES = [
  ['M1-ZH', '没人对这个结果提出异议，说明它是公正的'],
  ['M2-EN', 'It must be right because the algorithm produced it'],
  ['M3-EN', 'No one has objected, so the outcome must be fair'],
  ['M4-EN', "If anything goes wrong it is the system's fault, not mine"],
  ['FP1-ZH', '算法可能有偏差，所以不能单独作为录取依据'],
  ['FP2-ZH', '系统只是辅助工具，医生拥有最终诊断权'],
  ['OK-ZH', '算法没有偏见，HR的招聘环节可以省掉'],
];

for (const [tag, text] of CASES) {
  let raw = null;
  try { raw = mod.detectAutomationBias(text); } catch (e) { console.log(tag, 'detect err', e.message); }
  const g = gate(text);
  const ab = (g.findings || []).filter(f => f.dimension === 'automation_bias');
  console.log(`${tag} gate=${g.gate.action} score=${raw && raw.score != null ? raw.score : 'n/a'} abFindings=${ab.length}`);
  if (raw && raw.detail) console.log('   detail:', String(raw.detail).slice(0, 220));
  if (raw && raw.legs) console.log('   legs:', JSON.stringify(raw.legs).slice(0, 300));
}
