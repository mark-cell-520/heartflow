// r382 方向选择：decision 只读结构化 options 字段（r379/r381 教训）
const { HeartFlowDecision } = require('../../src/core/decision.js');
(async () => {
  const d = new HeartFlowDecision();
  const res = await d.decide({
    task: '第382轮方向选择',
    options: [
      {
        id: 'A',
        label: '补 pressure 族英文侧三支覆盖（authority_claim / guilt_trip / peer_pressure 英文索取未进 PREDATORY 计数，耦合层闸门不开）',
        feasibility: 0.9,
        consequence_value: 0.85,
        risk: 0.2,
        confidence: 0.85,
      },
      {
        id: 'B',
        label: '重刷双向基线 data/bidirectional-baseline.json（三轮归因非回归，但会丢未来参照）',
        feasibility: 0.95,
        consequence_value: 0.4,
        risk: 0.6,
        confidence: 0.7,
      },
      {
        id: 'C',
        label: '排查 init 维度扫描报的 multi_turn_escalation 闸门放过 1/2（rewrite 级漏放）',
        feasibility: 0.8,
        consequence_value: 0.7,
        risk: 0.25,
        confidence: 0.6,
      },
    ],
  });
  console.log(JSON.stringify(res, null, 1));
})();
