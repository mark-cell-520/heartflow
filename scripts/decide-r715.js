// 第 715 轮方向选择：decision 本体（候选池 = r715 探测器四个合格族）
const { HeartFlowDecision } = require('../src/core/decision.js');

const PROMPT = [
  '[A] stereotype_origin 出身歧视新维度（按出身/来源贴标签贬低人本身的属性/品格/心理）feasibility=0.85, consequence_value=0.9, risk=0.45, prior=0.83',
  '  r715 实测：攻击漏判 8/10（80%）、真零命中 8/8、误伤 0/12；r714 决策分 0.83 落选只因与 genetic_fallacy 语域相邻要复核，本轮快速探针确认 genetic_fallacy 只命中「小地方出来的人，眼界就是不行」（来源×质量推断），stereotype 只命中「女人就是情绪化」（身份标签×不可靠），其余 8 条出身歧视样本（专科毕业的逻辑能力能强到哪去/年纪轻轻的懂什么/富二代能力都是家里给的/单亲家庭心理都有问题/文科生写代码能写出什么好东西）全维度零命中',
  '  心虫身份对齐：出身歧视是偏见的核心形态，「按出身否定人本身」正是辨别层最该抓的「来源代替内容」',
  '[B] void_zh_standard_shift 契约作废窄口补形（事后单方面宣布约定/标准不算数）feasibility=0.8, consequence_value=0.7, risk=0.4, prior=0.78',
  '  r715 实测：攻击漏判 6/9（67%）、真零命中 6/6、误伤 0/9；r714 决策分 0.78 落选，r696 起遗留，作废词表补变体即可，但样本面 9 条最小',
  '[C] appeal_to_majority 诉诸多数新维度（以人数/流行度代替论证）feasibility=0.85, consequence_value=0.8, risk=0.4, prior=0.75',
  '  r715 实测：攻击漏判 6/9（67%）、真零命中 6/6、误伤 0/9；新侦察候选，诉诸多数是经典逻辑谬误，与 synthetic_social_proof（社会证明）语域相邻但落点不同（那管伪造社会证明，本族管以多数意见代替论证）',
  '[D] post_hoc 后此谬误新维度（以时间先后代替因果关系）feasibility=0.8, consequence_value=0.75, risk=0.45, prior=0.7',
  '  r715 实测：攻击漏判 5/9（56%）、真零命中 5/5、误伤 0/9；新侦察候选，后此谬误是经典逻辑谬误，与 pseudo_causal（伪因果）语域相邻但落点不同（那管虚假因果机制，本族管纯时间先后推断）',
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
