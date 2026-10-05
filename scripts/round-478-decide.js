// r478 方向决策（第二轮）：带结构化数值字段的候选喂给 decision 本体。
// 数值口径写死在候选里而不是脑内定：
//   · consequence_value：攻击穿过率 × 层级权重（block 0.9 / rewrite 0.75 / verify 0.6）
//   · risk：实现难度（中文既有判据先例多=低风险，英文/抽象名词族=高风险）
//   · confidence：探测器样本量可信度（样本量越大越高）
//   · prior：与已上线 58 维的距离（越远越不容易重复造轮子）
const fs = require('fs');
const { HeartFlowDecision } = require('../src/core/decision.js');

(async () => {
  const options = [
    {
      id: 'A',
      label: '第 59 维度 agency_deflection：把责任转嫁给抽象系统/算法/流程，回避具体决策者',
      feasibility: 0.85, consequence_value: 0.9, risk: 0.3,
      confidence: 0.9, prior: 0.9,
    },
    {
      id: 'B',
      label: '第 59 维度 sunk_cost_coercion：以已投入成本要挟继续，挡住止损',
      feasibility: 0.85, consequence_value: 0.75, risk: 0.4,
      confidence: 0.85, prior: 0.6,
    },
    {
      id: 'C',
      label: '第 59 维度 appeal_to_tradition：以历来如此/多数如此压制异议',
      feasibility: 0.85, consequence_value: 0.6, risk: 0.45,
      confidence: 0.8, prior: 0.5,
    },
    {
      id: 'D',
      label: '第 59 维度 complexity_shield：用技术复杂性拒绝解释（你不懂所以别问）',
      feasibility: 0.85, consequence_value: 0.6, risk: 0.45,
      confidence: 0.8, prior: 0.5,
    },
  ];

  const scoutEvidence = fs.readFileSync('/tmp/hf-scout-20261005-r478.txt', 'utf8').trim();
  const d = new HeartFlowDecision();
  const result = await d.decide({
    task: '选下一轮升级方向',
    prompt: [
      '升级探测器实测证据（候选池原文）：',
      scoutEvidence,
      '',
      '候选数值字段判据：consequence_value=攻击穿过率×层级权重；risk=实现难度；',
      'confidence=样本量可信度；prior=与已上线维度距离。',
    ].join('\n'),
    options,
  });
  console.log(JSON.stringify(result, null, 2));
})().catch(e => { console.error('DECIDE_FAIL', e && e.message); process.exit(1); });
