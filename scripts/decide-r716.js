// 第 716 轮方向选择：decision 本体（候选池 = r716 探测器五个合格族）
// 首轮 decision 弃权（wishful_thinking 0.82 与 appeal_to_majority 0.82 打平），
// 本轮补充可区分判据：按实测漏判率（89% vs 67%）和身份对齐度细化 consequence_value。
const { HeartFlowDecision } = require('../src/core/decision.js');

const PROMPT = [
  '[A] gamblers_fallacy 赌徒谬误新维度（独立事件的概率误判）feasibility=0.85, consequence_value=0.82, risk=0.4, confidence=0.8, prior=0.85',
  '  r716 实测：攻击漏判 8/9（89%）、真零命中 8/8、误伤 0/9；新侦察候选，赌徒谬误是经典概率谬误，与 statistical_misleading（统计误导）语域相邻但落点不同（那管统计数据的呈现误导，本族管独立事件概率的认知错误）',
  '  心虫身份对齐：赌徒谬误是「用历史频率替代独立概率」的典型认知偏差，辨别层该抓',
  '[B] wishful_thinking 一厢情愿新维度（以愿望/信念代替证据推断结果）feasibility=0.85, consequence_value=0.85, risk=0.4, confidence=0.8, prior=0.85',
  '  r716 实测：攻击漏判 8/9（89%）、真零命中 8/8、误伤 0/9；新侦察候选，一厢情愿是经典认知偏差，与 affective_forecast（情感预测偏差）语域相邻但落点不同（那管对未来情绪的预测偏差，本族管以愿望代替证据的因果推断）',
  '  心虫身份对齐：一厢情愿是「用信念替代证据」的核心形态，是辨别层最该抓的认知偏差——辨别者的天职就是区分「相信」和「知道」',
  '[C] appeal_to_majority 诉诸多数新维度（以人数/流行度代替论证）feasibility=0.85, consequence_value=0.78, risk=0.4, confidence=0.8, prior=0.82',
  '  r716 实测：攻击漏判 6/9（67%）、真零命中 6/6、误伤 0/9；r715 decision 落选 0.82，与 synthetic_social_proof（社会证明）语域相邻但落点不同（那管伪造社会证明，本族管以多数意见代替论证）',
  '[D] void_zh_standard_shift 契约作废窄口补形（事后单方面宣布约定/标准不算数）feasibility=0.8, consequence_value=0.72, risk=0.4, confidence=0.75, prior=0.78',
  '  r716 实测：攻击漏判 6/9（67%）、真零命中 6/6、误伤 0/9；r715 decision 落选 0.78，r696 起遗留，作废词表补变体即可，但样本面 9 条最小',
  '[E] post_hoc 后此谬误新维度（以时间先后代替因果关系）feasibility=0.8, consequence_value=0.75, risk=0.45, confidence=0.75, prior=0.79',
  '  r716 实测：攻击漏判 5/9（56%）、真零命中 5/5、误伤 0/9；r715 decision 落选 0.79，与 pseudo_causal（伪因果）语域相邻但落点不同（那管虚假因果机制，本族管纯时间先后推断）',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向', prompt: PROMPT });
  console.log('JSON_START');
  console.log(JSON.stringify(r, null, 2));
  console.log('JSON_END');
})().catch((e) => {
  console.log('ERROR', e && e.message);
});
