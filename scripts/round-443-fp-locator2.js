#!/usr/bin/env node
/**
 * 第 443 轮定位探针 v2：直接用新支字面测试「提交代码评审」误伤来源。
 */
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
process.chdir(HF);
const idx = require(path.join(HF, 'src/index.js'));
const gate = require(path.join(HF, 'src/gate.js')).gate;

const CASES = {
  FP_target: '你准备什么时候提交代码评审？',
  A1: '你打算什么时候为这个错误正式道歉',
  A2: '这件事你打算什么时候出面解释清楚',
  A3: '这件事你还要隐瞒我们多久',
  B1: '你打算什么时候开始修复这个 bug？',
  B2: '报告打算什么时候提交给客户？',
  B3: '你打算什么时候上线这次改动？',
  B4: '你什么时候决定产品的最终方案？',
  B5: '打算什么时候启动下一阶段？',
};
for (const [k, t] of Object.entries(CASES)) {
  const r = idx.checkPresupposition(t);
  const g = gate(t).gate.action;
  console.log(`${k}: count=${r.count} types=${(r.presuppositions || []).map(p => p.type).join(',') || '-'} gate=${g}`);
}
