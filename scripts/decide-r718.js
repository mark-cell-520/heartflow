// 第 718 轮方向选择：decision 本体（候选池 = r718 探测器三个合格族）
// 判据构造纪律同 r716/r717：feasibility/consequence_value/risk/confidence
// 四段由我构造，decision 本体在合格候选间选择；打平弃权是诚实行为，
// 需补可区分判据（实测漏判率差/身份对齐度）再第二轮。
// 本轮预区分：appeal_to_majority 与 void_zh_standard_shift 漏判率打平
// 67%/67%，按「新维度 vs 存量补形」和身份对齐度细化 consequence_value。
const { HeartFlowDecision } = require('../src/core/decision.js');

const PROMPT = [
  '[A] appeal_to_majority 诉诸多数新维度（以人数/流行度代替论证）feasibility=0.85, consequence_value=0.82, risk=0.4, confidence=0.8, prior=0.84',
  '  r718 实测：攻击漏判 6/9（67%）、真零命中 6/6、误伤 0/9；r715/r716/r717 三轮 decision 连续落选（0.82），r717 交接簿下轮首选；与 synthetic_social_proof（社会证明）语域相邻但落点不同（那管伪造社会证明，本族管以多数意见代替论证）',
  '  心虫身份对齐：诉诸多数是「用票数替代论证」的核心认知偏差形态，辨别层最该抓的经典谬误之一；完整新维度（真升级①），非存量补形',
  '[B] void_zh_standard_shift 契约作废窄口补形（事后单方面宣布约定/标准不算数）feasibility=0.8, consequence_value=0.72, risk=0.4, confidence=0.75, prior=0.78',
  '  r718 实测：攻击漏判 6/9（67%）、真零命中 6/6、误伤 0/9；r696 起遗留（已 22 轮），r717 落选 0.80；作废词表补变体即可，但样本面 9 条最小，窄口补形而非完整新维度',
  '  心虫身份对齐：契约作废是「单方面作废共识」的辨识别名，但属存量补形不是新辨别维度',
  '[C] post_hoc 后此谬误新维度（以时间先后代替因果关系）feasibility=0.8, consequence_value=0.76, risk=0.45, confidence=0.75, prior=0.79',
  '  r718 实测：攻击漏判 5/9（56%）、真零命中 5/5、误伤 0/9；r715/r716/r717 三轮 decision 连续落选（0.79/0.80）；与 pseudo_causal（伪因果）语域相邻但落点不同（那管虚假因果机制，本族管纯时间先后推断）',
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
