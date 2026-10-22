// r633: decision 本体选方向 v4 —— 收敛为 3 个候选（纪律：一个方向做完就 finish，不做双接线）。
// v3 平局根因：F（双接线 0.82）与 B（单 daoDecision 0.81）差距 <0.01。
// 本轮把候选改成互斥的单方向，且每个的 consequence_value 直接反映「给引擎新增的辨别能力档次」。
const { HeartFlowDecision } = require('../src/core/decision.js');

const candidates = [
  '[A] daoDecision 道德裁决接线 —— 7 方法。自然秩序/逆转/不争/不言而教四则+总评。新增辨别力=对「道德叙事是否违反自然法则」的独立判别维度，此前对任何 dispatch 调用方完全不可达。feasibility=0.9 consequence_value=0.9 risk=0.35 confidence=0.85',
  '[B] hypothesisDriver 假设抽取接线 —— 5 方法。断言提取+置信度评估+未验证标注。新增辨别力=把「未验证断言」显式标出，属对输出的证据标注能力，已有 verifier 部分重叠。feasibility=0.92 consequence_value=0.6 risk=0.3 confidence=0.8',
  '[C] outputChecklist 交付自检接线 —— 3 方法。新增辨别力=漏项检出，覆盖面窄且 output-gate 已覆盖大部分。feasibility=0.95 consequence_value=0.35 risk=0.12 confidence=0.85',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮真升级方向（铁律③：零通告声明能力接进 pipeline，单选不双做）', prompt: candidates });
  console.log('R633_DECIDE_V4');
  console.log(JSON.stringify(r, null, 2));
  process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
