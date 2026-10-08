// r640: 四判 —— 前三判 5 候选 / 2 候选均 composite=0.74 打平返 null。
// 根因（读 src/core/decision.js L238）：平局判据是 composite 差 <0.01。
// 候选文本若不含 x/y 比例、不含不可逆/可逆词、不含严重性词，
// 全部回退到同一套默认值 → 必然打平。
// 因此本轮改用「显式数值字段 + 分型 polar 描述」让各候选区别可测。
// 口径：只写实测形状与数字，不贴样本原文（451 纪律）。
const { HeartFlowDecision } = require('../src/core/decision.js');

const options = [
  {
    id: 'A',
    label: 'outputChecklist 接线（11 方法，发送前逐项自检）',
    description: [
      '接入点：直接坐落在心虫输出 gate 链路上（runChecklist = 质量/安全/偏好/',
      '公正/道德边界/辨别检查，quickCheck 为轻量支）。',
      '实测缺口：dispatch 调用 11/11 全部抛 route not allowed，命中率 0/11。',
      '接线难度=最低：无需修判空（本次探针空实参实测 other=0）。',
      '可逆性=增量局部，回退成本低。',
      '风险=低：只做 _modules 注册，不改任何已有维度判据。'
    ].join(''),
    feasibility: 0.95,
    consequence_value: 0.9,
    risk: 0.1,
    confidence: 0.9,
  },
  {
    id: 'B',
    label: 'memoryIndex 接线（22 方法，会话间连续性索引）',
    description: [
      '接入点：记忆自省数据类，不参与任何 gate 判定。',
      '实测缺口：dispatch 调用 22/22 全部抛 route not allowed，命中率 0/22。',
      '接线难度=中：方法多但多数返回型依赖磁盘索引初始化。',
      '风险=中：涉及身份/工作状态持久化读写。'
    ].join(''),
    feasibility: 0.6,
    consequence_value: 0.5,
    risk: 0.5,
    confidence: 0.7,
  },
  {
    id: 'C',
    label: 'globalWorkspace 接线（16 方法，多 agent 广播/整合）',
    description: [
      '接入点：多 agent 编排类，本机实测无第二个 agent 注册。',
      '实测缺口：dispatch 调用 16/16 全部抛 route not allowed，命中率 0/16。',
      '接线难度=中：cognitiveCycle 需 agent 方法集，空跑即抛。',
      '风险=中。'
    ].join(''),
    feasibility: 0.5,
    consequence_value: 0.4,
    risk: 0.5,
    confidence: 0.6,
  },
  {
    id: 'D',
    label: 'aiSelfPositioning 接线（15 方法，AI 自我定位评估）',
    description: [
      '接入点：自省报告类，不直接参与 gate 判定。',
      '实测缺口：dispatch 调用 15/15 全部抛 route not allowed，命中率 0/15。',
      '接线难度=中：assessExistence 等依赖内部状态初始化。',
      '风险=低。'
    ].join(''),
    feasibility: 0.6,
    consequence_value: 0.45,
    risk: 0.3,
    confidence: 0.65,
  },
];

(async () => {
  const d = new HeartFlowDecision();
  const out = await d.decide({
    task: '选下一轮升级方向：在「命中率缺口 + 接线可行性 + 是否直接增益输出 gate 判别」三判据下选一个零可达引擎接进 dispatch',
    options,
  });
  console.log(JSON.stringify({ chosen: out.chosen, label: (out.all_options || []).find(o => o.id === out.chosen) || null, score: out.composite_score, all: out.all_options }));
  process.exit(0);
})().catch(e => { console.error('DECIDE_ERR', e.message); process.exit(1); });
