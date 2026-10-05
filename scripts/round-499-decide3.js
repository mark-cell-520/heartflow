// 第 499 轮 decision 第三轮：结构化 options + 显式数值通道
// （_scoreOption 契约：显式 feasibility/consequence_value/risk/confidence 优先于文本推断）
// 候选为本轮实探测针 10 个真实缺口族，这里按「与已有维度重叠面 / 良性误伤面 / 可行性」排序。
'use strict';
const { HeartFlowDecision } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/core/decision.js');

const opts = [
  {
    id: 'A',
    label: 'loyalty_test 忠诚度测试（立场审查替代事实讨论）',
    description: '第 67 维度候选。缺口 100%（本轮实测 6/6 攻击样本穿过硬闸门，良性 0/2 误伤）。与已有维度重叠低：false_urgency 管时间压力、manufactured_consent 管程序短路、social_norm 管从众，本族核心是「以站队资格审查替代证据讨论」，形状是「立场质询×不信任推定×撤出对话」。可行性高（三条件可正则可交叉）。可逆增量（新增模块，不改既有判据）。风险低（良性协作陈述会给出具名职责或流程依据，与立场胁迫形状正交）。后果：修复人际操纵最常见的立场审查族漏判，减少错误。',
    feasibility: 0.9, consequence_value: 0.88, risk: 0.2, confidence: 0.85,
  },
  {
    id: 'B',
    label: 'proportionality_distortion 报复性比例失衡（把轻微冒犯升级为同等伤害）',
    description: '第 67 维度候选。缺口 100%（本轮实测 5/5 穿过，良性 0/2 误伤）。与已有维度重叠低：hasty_generalization 管样本外推、false_equivalence 管类比失衡，本族核心是「轻微过错×要求同等量级报复」，形状是「小过失×整体否定/作废/清算」。可行性中高（需轻微量词词表 + 清算动词词表）。可逆增量。风险中（纪律处分语境里「全部作废」属正当描述，需豁免「按制度记过」类合规句式）。后果：修复情绪对等报复族漏判。',
    feasibility: 0.8, consequence_value: 0.85, risk: 0.3, confidence: 0.8,
  },
  {
    id: 'C',
    label: 'fault_line_amplification 放大固有分歧线（把可协商差异固化为对立）',
    description: '第 67 维度候选。缺口 100%（本轮实测 5/5 穿过，良性 0/2 误伤）。与已有维度重叠中：stereotype 管群体标签、bad_faith 管恶意揣测，本族核心是「宣布分歧不可协商」，形状是「分歧×判定为立场/本质/骨子里差异×断言沟通无效」。可行性中高。可逆增量。风险中低（良性语境常给出复评安排与共同基准，可作豁免）。后果：修复对话关闭族漏判。',
    feasibility: 0.78, consequence_value: 0.82, risk: 0.35, confidence: 0.75,
  },
  {
    id: 'D',
    label: 'selective_minimization 选择性淡化过错',
    description: '第 67 维度候选。缺口 100%（本轮实测 5/5 穿过，良性 0/2 误伤）。与已有维度重叠中高：normalization_of_deviation 已管「既往偏差免处置」，本族是「当次过错降级描述」，边界需细抠，工作量约为 A 的 1.6 倍。可行性中。风险中（合规自查里「轻微违规」是正当定级用语，误伤面大于 A）。后果：复述部分重叠，边际收益低于 A。',
    feasibility: 0.65, consequence_value: 0.78, risk: 0.45, confidence: 0.7,
  },
  {
    id: 'E',
    label: 'urgency_fabrication 捏造时间窗口',
    description: '与已上线第 25 维 false_urgency 同名近义，重叠极高（可能 80% 命中重复计数），本轮排除。缺口 100%。可行性高但属重复建设。',
    feasibility: 0.85, consequence_value: 0.5, risk: 0.4, confidence: 0.5,
  },
  {
    id: 'F',
    label: 'retroactive_justification 事后补造正当性',
    description: '缺口 60%（本轮实测 3/5 穿过）。与已上线 perfect_error / unsupported_claim 有部分重叠（都在判「结论与证据脱节」），本族特有的是「事后叙事改写初衷」。可行性中。verify 级。边际收益低于 A。',
    feasibility: 0.7, consequence_value: 0.72, risk: 0.35, confidence: 0.7,
  },
  {
    id: 'G',
    label: 'identity_fusion_attack 身份与集体熔合',
    description: '缺口 60%（本轮实测 3/5 穿过）。与 dehumanization / social_norm 边界较近（都在处理个体消解），本族特有的是「自我价值完全系于集体」。可行性中。风险中（团队凝聚力正当论述里「我们是一体的」高频出现，误伤面大）。',
    feasibility: 0.62, consequence_value: 0.7, risk: 0.5, confidence: 0.65,
  },
  {
    id: 'H',
    label: 'helplessness_induction 习得性无助引诱',
    description: '缺口 80%（本轮实测 4/5 穿过）。与已上线 info_deprivation（剥夺行动信息）部分重叠。可行性中。风险中高（心理健康与合规讨论里「你个人无法改变」是事实陈述，误伤面大）。',
    feasibility: 0.6, consequence_value: 0.72, risk: 0.5, confidence: 0.65,
  },
];

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第499轮升级方向', options: opts });
  console.log(JSON.stringify(r, null, 2));
  require('fs').writeFileSync('/tmp/hf-round499-decide-result-v3.json', JSON.stringify(r, null, 2));
})().then(() => process.exit(0)).catch((e) => { console.error('ERR', e.message); process.exit(1); });
