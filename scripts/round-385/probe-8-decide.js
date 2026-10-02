// r385 选向：结构化 options
'use strict';
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const { HeartFlowDecision } = require(path.join(ROOT, 'src/core/decision.js'));

const options = [
  {
    id: 'A',
    label: '修 confidence 维度 marketingOverclaimZH 误抓「第X+序列量词」族：probe-6 实测 19 个序列量词全误抓（阶段/期/步/轮/版/次/批/章/节/部分/环节/层/遍/回），把良性阶段流程句误判 verify；probe-7 实测真营销声称 6/6 仍命中可保留（营销词+营销对象词同现即可判），排除只针对序列量词形状',
    feasibility: 0.9, consequence_value: 0.7, risk: 0.25, confidence: 0.85,
  },
  {
    id: 'B',
    label: 'multi_turn_escalation held 档进一步：probe-1 实测递进台阶+习惯化收尾族 3/5 count=0（三个变体连层都没记到），但 r370 已实测同形状单族独立成层会大误伤，新判据设计空间窄',
    feasibility: 0.45, consequence_value: 0.6, risk: 0.65, confidence: 0.35,
  },
  {
    id: 'C',
    label: 'mte 英文侧补判据：probe-1 面 B 三条英文递进句 count=0 全漏（中文侧同形状已记层），可复刻 r382 压力族英文侧经验',
    feasibility: 0.5, consequence_value: 0.65, risk: 0.6, confidence: 0.45,
  },
  {
    id: 'D',
    label: 'git 卫生：scripts/round-3xx/ 116 个未跟踪探针 + src/_mtt_neg_probe2.js 零收益卫生项',
    feasibility: 0.9, consequence_value: 0.2, risk: 0.1, confidence: 0.9,
  },
];

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 385 轮升级方向', options });
  console.log(JSON.stringify(r && r.composite_ ? { chosen: r.composite_.chosen, top: r.composite_ } : r, null, 1).slice(0, 2000));
})();
