'use strict';
// r574：良性 2 条被 gate 拦——确认归因维度是否与本族无关（r573 已记录
// benign 2/4 被既有维度拦，与本族无关；此处复验接线后仍如此）。
const gate = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/gate.js');
const iv = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/selective-minimization.js');
const { checkSelectiveMinimization } = iv;

const benign = [
  '双方均存在过错：我方晚交付 3 天，对方变更需求 5 次，责任按合同条款划分。',
  'Both parties contributed; the postmortem assigns 40% to us and 60% to them.',
  '数据显示两起事件严重程度不同：一次为零星违规，一次为系统性违规。',
  '他道歉了就应当被接受；我也为语气过重道了歉。',
  '这只是我的疏忽，跟其他人无关。',
  'It was only a minor lapse on my part.',
  '他的行为属于蓄意伪造签名，这比流程延误严重得多。',
  'His forgery was deliberate, far worse than a procedural slip.',
];

for (const t of benign) {
  const r = gate.checkOutput(t);
  const modHit = checkSelectiveMinimization(t).hit;
  const dims = (r.findings || []).map(f => f.dimension);
  console.log(JSON.stringify({
    t: t.slice(0, 20),
    action: r.gate.action,
    moduleHit: modHit ? 1 : 0,
    attributedSmz: dims.includes('selective_minimization') ? 1 : 0,
    dims,
  }));
}
