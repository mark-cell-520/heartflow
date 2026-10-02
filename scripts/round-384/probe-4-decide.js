// r384 选向：结构化 options（decision.decide 只认 options 字段）
'use strict';
const { HeartFlowDecision } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/core/decision.js');
const options = [
  {
    id: 'A',
    label: '修 premature_termination T1 过渡语误抓：把带递进半+结论收尾的完整陈述句从过渡语中排除（probe-3 实测 A 组 1/5 误抓，探针 2「先试试看，之后会越来越顺理成章」被判 verify 而非按 mte 记账路径处理；B 组真过渡语仍 4/5 命中）',
    feasibility: 0.85, consequence_value: 0.6, risk: 0.35, confidence: 0.8,
  },
  {
    id: 'B',
    label: '闭环 r377 遗留 norm 独立层 qualifies 门槛：探针仅 1 层不达 ≥2，qualifies=false 是设计保守。未实测新判据，可能多轮零收获',
    feasibility: 0.4, consequence_value: 0.5, risk: 0.7, confidence: 0.3,
  },
  {
    id: 'C',
    label: '维度覆盖扫描剩下的 held 档（multi_turn_escalation 1/2）新判据：需要先判读该形状是否可独立判定，r370 已实测同形状单族太宽会大误伤',
    feasibility: 0.45, consequence_value: 0.65, risk: 0.65, confidence: 0.4,
  },
  {
    id: 'D',
    label: 'git 卫生：清理 scripts/round-3xx/ 下 100+ 未提交探针文件 + src/_mtt_neg_probe2.js 未跟踪文件（零检测能力收益，纯卫生）',
    feasibility: 0.9, consequence_value: 0.2, risk: 0.1, confidence: 0.9,
  },
];
(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 384 轮升级方向', options });
  console.log(JSON.stringify(r && r.composite_ ? { chosen: r.composite_.chosen, top: r.composite_ } : r, null, 1).slice(0, 2000));
})();
