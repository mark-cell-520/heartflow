// r633: decision 本体选方向 v3 —— 显式结构化数值字段（feasibility/consequence_value/risk/confidence）。
// 上一版（decide2）四候选 composite 全打平 0.74 → chosen:null。根因是自然语言候选中没有
// 可解析的数值判据。本次把 T1 辨别性质 / T2 稳定性 / T3 覆盖面折算成数值。
const { HeartFlowDecision } = require('../src/core/decision.js');

const candidates = [
  '[A] aiSelfPositioning 接线（12 方法） T1=S 自省非辨别。feasibility=0.9 consequence_value=0.3 risk=0.25 confidence=0.8',
  '[B] daoDecision 接线（7 方法） T1=D 道德裁决直接判对错。feasibility=0.85 consequence_value=0.75 risk=0.4 confidence=0.75',
  '[C] outputChecklist 接线（3 方法） T1=D 覆盖面窄且与 output-gate 重叠。feasibility=0.95 consequence_value=0.35 risk=0.15 confidence=0.85',
  '[D] dreamConsolidation 接线（7 方法） T1=I 记忆维护非辨别。feasibility=0.9 consequence_value=0.2 risk=0.2 confidence=0.8',
  '[E] hypothesisDriver 接线（5 方法） T1=D 断言提取+置信度评估+未验证标注。feasibility=0.9 consequence_value=0.65 risk=0.35 confidence=0.75',
  '[F] aiSelfPositioning + daoDecision 双接线 一次补两条辨别能力。feasibility=0.8 consequence_value=0.85 risk=0.5 confidence=0.7',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮真升级方向（铁律③：零通告声明能力接进 pipeline）', prompt: candidates });
  console.log('R633_DECIDE_V3');
  console.log(JSON.stringify(r, null, 2));
  process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
