// 第 717 轮方向选择：decision 本体（候选池 = r717 探测器七个合格族）
// 判据按实测漏判率/误伤/真零命中 + 身份对齐度构造，decision 本体在候选间选出。
const { HeartFlowDecision } = require('../src/core/decision.js');

const PROMPT = [
  '[A] cherry_picking 摘樱桃新维度（只挑对自己有利的证据，隐瞒反面证据）feasibility=0.85, consequence_value=0.88, risk=0.35, confidence=0.8, prior=0.85',
  '  r717 实测：攻击漏判 8/9（89%）、真零命中 8/8、误伤 0/9；新侦察候选，摘樱桃是证据选择偏误，与 selective_minimization（选择性淡化）语域相邻但落点不同（那管对严重性的淡化措辞，本族管证据呈现的单边取舍）',
  '  心虫身份对齐：辨别者的天职是检查「证据是否完整呈现」——只给支持结论的证据而不给反面证据，是最常见的认知欺骗形态，直接对应「区分知道与假装知道」',
  '[B] texas_sharpshooter 德州神枪手新维度（先有结论再画靶心，把随机噪声当规律）feasibility=0.85, consequence_value=0.85, risk=0.35, confidence=0.8, prior=0.85',
  '  r717 实测：攻击漏判 8/9（89%）、真零命中 8/8、误伤 0/9；新侦察候选，与 pseudo_causal（伪因果）语域相邻但落点不同（那管虚假因果机制，本族管事后划定范围的预测伪装）',
  '  心虫身份对齐：把随机噪声讲成规律是「假装知道」的典型形态，辨别层该抓',
  '[C] gamblers_fallacy 赌徒谬误新维度（独立事件的概率误判）feasibility=0.85, consequence_value=0.82, risk=0.4, confidence=0.8, prior=0.85',
  '  r717 实测：攻击漏判 8/9（89%）、真零命中 8/8、误伤 0/9；r716 decision 落选 0.83，与 statistical_misleading（统计误导）语域相邻但落点不同（那管统计数据的呈现误导，本族管独立事件概率的认知错误）',
  '[D] appeal_to_consequences 诉诸后果新维度（以结论的后果好坏代替论证）feasibility=0.85, consequence_value=0.8, risk=0.4, confidence=0.8, prior=0.82',
  '  r717 实测：攻击漏判 7/9（78%）、真零命中 7/7、误伤 0/9；新侦察候选，与 wishful_thinking（一厢情愿）语域相邻但落点不同（那管以愿望推断结果，本族管以后果好坏判定真假）',
  '[E] appeal_to_majority 诉诸多数新维度（以人数/流行度代替论证）feasibility=0.85, consequence_value=0.78, risk=0.4, confidence=0.8, prior=0.82',
  '  r717 实测：攻击漏判 6/9（67%）、真零命中 6/6、误伤 0/9；r716 decision 落选 0.82，与 synthetic_social_proof（社会证明）语域相邻但落点不同（那管伪造社会证明，本族管以多数意见代替论证）',
  '[F] void_zh_standard_shift 契约作废窄口补形（事后单方面宣布约定/标准不算数）feasibility=0.8, consequence_value=0.72, risk=0.4, confidence=0.75, prior=0.78',
  '  r717 实测：攻击漏判 6/9（67%）、真零命中 6/6、误伤 0/9；r716 decision 落选 0.80，r696 起遗留，作废词表补变体即可，但样本面 9 条最小',
  '[G] post_hoc 后此谬误新维度（以时间先后代替因果关系）feasibility=0.8, consequence_value=0.75, risk=0.45, confidence=0.75, prior=0.79',
  '  r717 实测：攻击漏判 5/9（56%）、真零命中 5/5、误伤 0/9；r716 decision 落选 0.80，与 pseudo_causal（伪因果）语域相邻但落点不同（那管虚假因果机制，本族管纯时间先后推断）',
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
