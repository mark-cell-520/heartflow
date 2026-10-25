// 第 720 轮方向选择：decision 本体（候选池 = r720 探测器三个合格族）
// 判据构造纪律同 r716-r719：四段由我构造，decision 本体选；打平弃权
// 是诚实行为，需补可区分判据。本轮三候选漏判率 75/71/63 天然区隔，
// 另有「新维度 vs 存量补形」的身份对齐差异。
const { HeartFlowDecision } = require('../src/core/decision.js');

const PROMPT = [
  '[A] void_zh_standard_shift 契约作废窄口补形（给存量 standard_shift 第70维补「事后单方面宣布约定作废」词表变体，非新维度键）feasibility=0.75, consequence_value=0.7, risk=0.35, confidence=0.75, prior=0.8',
  '  r720 实测：攻击漏判 12/16（75%）、真零命中 12/12、误伤 0/12；r696 起遗留（已 25 轮），DIM_GUIDANCE 已声明该语域归 standard_shift 管但实际判据射程未覆盖（教科书句 3 条命中、语域变体全漏）',
  '  心虫身份对齐：契约作废是「单方面作废共识」的辨识别名，但属存量补形不是新辨别维度，验收维度键数不变',
  '[B] post_hoc 后此谬误新维度（以时间先后代替因果关系）feasibility=0.8, consequence_value=0.78, risk=0.45, confidence=0.75, prior=0.78',
  '  r720 实测：攻击漏判 10/14（71%）、真零命中 10/10、误伤 0/10；r715-r719 五连续落选，本轮补语域高频形态（杀毒软件/手机号/加班缺席/椅子玄学）后漏判率从 56% 升到 71%，与 pseudo_causal 语域相邻但落点是纯时间归因',
  '  心虫身份对齐：后此谬误是「以先后代因果」的经典谬误，辨别者的天职就是识破「因为发生在前面所以是原因」的伪因果；漏判率 71% 且为新维度',
  '[C] appeal_to_probability 可能性误当必然新维度（基数大/重复多=一定会发生）feasibility=0.8, consequence_value=0.75, risk=0.45, confidence=0.72, prior=0.76',
  '  r720 实测：攻击漏判 5/8（63%）、真零命中 5/5、误伤 0/7；新侦察族。已确认 wishful_thinking/gamblers_fallacy 存量维度只覆盖「坚持买一定中」形（3 条 HIT），「宇宙这么大肯定有外星人」「试多了总能成」「Given enough time anything can happen will happen」整族全漏',
  '  心虫身份对齐：可能性误当必然是「把概率当保证」的伪确定性，辨别者要守住「可能≠必然」的界线；但漏判率 63% 为三候选最低、样本面 8 条最小',
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
