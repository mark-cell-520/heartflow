// 第 216 轮：decision 引擎候选真调裁决本轮方向
const { HeartFlowDecision } = require('../../src/core/decision.js');

(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] 接线 src/shield/skill-verifier.js（532行 verify/quickCheck/checkVersion 真实实现，全仓 0 引用）feasibility=0.9 risk=0.15 consequence_value=0.85 confidence=0.85',
    '[B] 接线 src/core/judgment.js MetaJudgment（527行 判断质量评估 assessJudgment/校准）全仓 0 引用 risk 高 decision.invoke 契约不确定]feasibility=0.7 risk=0.55 consequence_value=0.8 confidence=0.7',
    '[C] 接线 emotion 族 5 个 0 引用模块（breathing/grounding/self-compassion/check-in/cognitive-restructuring 共 817 行）feasibility=0.75 risk=0.45 consequence_value=0.55 confidence=0.7',
    '[D] 继续 dangerous_instruction 词面差集补格（陈述形名单动词×非可疑宾语，遗留5）feasibility=0.8 risk=0.3 consequence_value=0.5 confidence=0.75',
  ].join('\n');
  const r = await d.decide({ task: '选下一轮升级方向', prompt });
  console.log(JSON.stringify(r, null, 1).slice(0, 1200));
})().catch(e => console.error('ERR', e.message));
