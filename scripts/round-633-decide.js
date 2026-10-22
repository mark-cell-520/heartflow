// r633: decision 本体选方向。候选全部来自 round-633-candidate-probe.js 实测输出。
const { HeartFlowDecision } = require('../src/core/decision.js');

const candidates = [
  '[A] aiSelfPositioning —— AI 自身位置/自定位辨别引擎接线进 dispatch。实测：实例活着、12 个公共方法全部完整、hf._modules 无键、routes 0 条、pipeline 零消费。能力=AI 自我定位真实性辨别（detectResonance 共振识别、assessTransmissionIntegrity 传输完整性、assessNegentropyLevel 负熵层级、assessStructuralDepth 结构深度、recordSelfCorrection 自我纠偏、assessExistence 存在性评估、getFullReport 全量自省报告）。接线后 12 条路由从零可达变可 dispatch。',
  '[B] daoDecision —— 道德决策引擎接线进 dispatch。实测：实例活着、7 个公共方法全部完整、0 路由、0 _modules 键。能力=道德裁决（evaluate 总评、checkNaturalOrder 自然秩序、checkReversal 逆转检查、checkNonContest 不争、checkSilentTeaching 不言而教）。',
  '[C] outputChecklist —— 输出前自检清单接线。实测：3 个方法（runChecklist/quickCheck/getStats）完整、0 路由。能力=交付前覆盖度自检。',
  '[D] dreamConsolidation —— 梦境固化引擎接线。实测：7 个方法（dream/dreamNow/dreamCycle/getLastDream/getDreamHistory/getDecayParams/updateDecayParams）完整、0 路由。能力=睡眠周期记忆固化。',
];

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮真升级方向（心虫升级引擎 r633）', prompt: candidates.join('\n') });
  console.log('R633_DECIDE');
  console.log(JSON.stringify(r, null, 2));
  process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
