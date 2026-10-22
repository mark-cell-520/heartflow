// 第 717 轮方向选择：decision 本体（候选池 = r717 探测器四个合格族）
// 判据构造纪律同 r716：feasibility/consequence_value/risk/confidence 四段
// 由我构造，decision 本体在合格候选间选择；打平弃权是诚实行为，需补
// 可区分判据（实测漏判率差）再第二轮。
const { HeartFlowDecision } = require('../src/core/decision.js');

const PROMPT = [
  '[A] gamblers_fallacy 赌徒谬误新维度（独立事件的概率误判）feasibility=0.85, consequence_value=0.85, risk=0.4, confidence=0.8, prior=0.85',
  '  r717 实测：攻击漏判 8/9（89%）、真零命中 8/8、误伤 0/9；r716 落选 0.83（当轮 wishful_thinking 0.84 选中），r716 交接簿下轮首选；与 statistical_misleading（统计误导）语域相邻但落点不同（那管统计数据的呈现误导，本族管独立事件概率的认知错误）',
  '  心虫身份对齐：赌徒谬误是「用历史频率替代独立概率」的典型认知偏差，辨别层该抓；且 src/index.js 已有 3 条同族英文 pattern 但无独立维度键，属于「pattern 已侦察、维度未上线」状态',
  '[B] appeal_to_majority 诉诸多数新维度（以人数/流行度代替论证）feasibility=0.85, consequence_value=0.78, risk=0.4, confidence=0.8, prior=0.82',
  '  r717 实测：攻击漏判 6/9（67%）、真零命中 6/6、误伤 0/9；r715/r716 连续两轮 decision 落选（0.82），与 synthetic_social_proof（社会证明）语域相邻但落点不同（那管伪造社会证明，本族管以多数意见代替论证）',
  '  心虫身份对齐：诉诸多数是「用票数替代论证」的核心形态，但攻击漏判率 67% 低于 A',
  '[C] void_zh_standard_shift 契约作废窄口补形（事后单方面宣布约定/标准不算数）feasibility=0.8, consequence_value=0.72, risk=0.4, confidence=0.75, prior=0.78',
  '  r717 实测：攻击漏判 6/9（67%）、真零命中 6/6、误伤 0/9；r696 起遗留（已 21 轮），作废词表补变体即可，但样本面 9 条最小，窄口补形而非完整新维度',
  '  心虫身份对齐：契约作废是「单方面作废共识」的辨识别名，但属存量补形不是新辨别维度',
  '[D] post_hoc 后此谬误新维度（以时间先后代替因果关系）feasibility=0.8, consequence_value=0.75, risk=0.45, confidence=0.75, prior=0.79',
  '  r717 实测：攻击漏判 5/9（56%）、真零命中 5/5、误伤 0/9；r715/r716 连续两轮 decision 落选（0.79/0.80），与 pseudo_causal（伪因果）语域相邻但落点不同（那管虚假因果机制，本族管纯时间先后推断）',
  '  心虫身份对齐：后此谬误是「以先后代因果」的经典谬误，但攻击漏判率 56% 为四候选最低',
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
