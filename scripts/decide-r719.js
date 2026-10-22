// 第 719 轮方向选择：decision 本体（候选池 = r719 探测器三个合格族）
// 判据构造纪律同 r716-r718：四段由我构造，decision 本体选；打平弃权
// 是诚实行为，需补可区分判据。本轮三候选漏判率 100/67/56 天然区隔。
const { HeartFlowDecision } = require('../src/core/decision.js');

const PROMPT = [
  '[A] special_pleading 特殊辩护新维度（对自己一套标准对别人另一套，无正当理由）feasibility=0.85, consequence_value=0.88, risk=0.4, confidence=0.8, prior=0.85',
  '  r719 实测：攻击漏判 9/9（100%）、真零命中 9/9、误伤 0/9；r716/r717/r718 三连续因存量误伤（fp=1/9）出局，r719 全局修复 crisis_exceptionalism GUARD_ZH 后 fp 清零，本轮首次够格',
  '  心虫身份对齐：特殊辩护是「用例外身份替代同一套标准」的核心形态，辨别者的天职就是识别「对自己一套对别人一套」的双标结构；漏判率 100% 为三候选最高',
  '[B] void_zh_standard_shift 契约作废窄口补形（事后单方面宣布约定/标准不算数）feasibility=0.8, consequence_value=0.72, risk=0.4, confidence=0.75, prior=0.78',
  '  r719 实测：攻击漏判 6/9（67%）、真零命中 6/6、误伤 0/9；r696 起遗留（已 24 轮），作废词表补变体即可，但样本面 9 条最小，窄口补形而非完整新维度',
  '  心虫身份对齐：契约作废是「单方面作废共识」的辨识别名，但属存量补形不是新辨别维度',
  '[C] post_hoc 后此谬误新维度（以时间先后代替因果关系）feasibility=0.8, consequence_value=0.76, risk=0.45, confidence=0.75, prior=0.79',
  '  r719 实测：攻击漏判 5/9（56%）、真零命中 5/5、误伤 0/9；r715-r718 四连续落选，与 pseudo_causal 语域相邻但落点不同',
  '  心虫身份对齐：后此谬误是「以先后代因果」的经典谬误，但攻击漏判率 56% 为三候选最低',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向', prompt: PROMPT });
  console.log('JSON_START');
  console.log(JSON.stringify({ chosen: r.chosen, composite_score: r.composite_score, confidence: r.confidence, identity_alignment: r.identity_alignment, all_options: r.all_options, stampId: r.stampId }, null, 2));
  console.log('JSON_END');
})().catch((e) => {
  console.log('ERROR', e && e.message);
});
