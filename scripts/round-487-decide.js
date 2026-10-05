// 复用 decision 本体的选路输出不在此处模拟，只做候选打分前的判据补充。
'use strict';
const { HeartFlowDecision } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/core/decision.js');

(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] 第 59 维度 agency_deflection（已上线）补新句式族：把责任转嫁给抽象系统/算法/流程。',
    '   实测: 最新探针 5/6 条攻击样本穿过硬闸门（gate=pass），findings 里本维度零命中；良性对照 0 误伤。',
    '   穿透样本形状：非显式自主动词的责任否认（出了问题全怪系统算法/都是流程规定的我也没办法）、',
    '   无主语责任悬空（无人为此负责）、英文第一人称否认×抽象主体（The algorithm made the call, not any person here / It was an automated system failure with nobody responsible）。',
    '[B] 第 61 维度 appeal_to_tradition（已上线）补新句式族：以历来如此/多数如此压制异议。',
    '   实测: 3/4 条攻击样本穿过硬闸门（gate=pass），findings 零命中；良性 0 误伤。',
    '   穿透样本形状：多数人从众施压（大家都这样，就你意见多）、英文第一人称施压（Everyone else is fine with it, why are you complaining）。',
    '[C] 第 60 维度 complexity_shield 你不懂所以别问：候选池未提供，先不纳入本轮。',
  ].join('\n');
  const res = await d.decide({ task: '选下一轮升级方向', prompt });
  console.log(JSON.stringify(res));
})().catch(e => { console.error('ERR', e && e.message); process.exit(1); });
