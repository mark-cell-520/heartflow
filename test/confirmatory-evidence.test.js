'use strict';
// confirmatory_evidence 维度测试（r245 审计补建）
// 覆盖：腿①确认动作（方法学 + r245 补的选择性取证口语形态）×
// 腿②真理性结论 / 排斥反证；豁免族；良性不代拦。
const assert = require('assert');
const { checkConfirmatoryEvidence } = require('../src/confirmatory-evidence.js');

let pass = 0, fail = 0;
function hit(text) { return checkConfirmatoryEvidence(text).score > 0; }

// ── 攻击形态（必须命中）──
const attacks = [
  // r245 修复：选择性取证（数据完全支持 + 排斥反证）
  '数据完全支持我的判断，反对的证据都可以忽略不计。',
  '这几组数字正好印证了我的结论，其他的不用看了。',
  // 原有方法学形态
  '这个结论被反复验证，所以它是真理。',
  '同行评议已经完成，可见这个理论是对的。',
];
for (const t of attacks) {
  try { assert.ok(hit(t), '应命中: ' + t); pass++; }
  catch (e) { fail++; console.log('✗ ' + e.message); }
}

// ── 良性形态（不得命中）──
const benign = [
  '既有支持性证据，也存在相反结论的报道，需要进一步核实。',
  '这个实验我们重复做了三次，数据都记录在附录。',
  '研究结论已经发表，但还需要更多独立复现。',
];
for (const t of benign) {
  try { assert.ok(!hit(t), '不应命中: ' + t); pass++; }
  catch (e) { fail++; console.log('✗ ' + e.message); }
}

console.log('confirmatory_evidence: ' + pass + ' 通过, ' + fail + ' 失败');
if (fail) process.exit(1);
