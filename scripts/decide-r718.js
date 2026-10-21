// 第 718 轮方向选择：decision 本体（候选池 = r718 探测器九个合格族）
// 判据按实测漏判率/误伤/真零命中 + 身份对齐度构造，decision 本体在候选间选出。
const { HeartFlowDecision } = require('../src/core/decision.js');

const PROMPT = [
  '[A] texas_sharpshooter 德州神枪手新维度（先有结论再画靶心，把随机噪声当规律）feasibility=0.85, consequence_value=0.87, risk=0.35, confidence=0.8, prior=0.85',
  '  r718 实测：攻击漏判 8/9（89%）、真零命中 8/8、误伤 0/9；r717 decision 落选 0.84，本轮首选。与 cherry_picking（r717 刚上线）语域相邻但落点不同（那管单边证据的隐瞒动作，本族管事后划定范围的预测伪装——数据是事后挑的但呈现为「事先看准了」）',
  '  心虫身份对齐：把随机噪声讲成规律、把事后凑的规律讲成先见之明，是「假装知道」的核心形态，辨别者天职',
  '[B] gamblers_fallacy 赌徒谬误新维度（独立事件的概率误判）feasibility=0.85, consequence_value=0.82, risk=0.4, confidence=0.8, prior=0.85',
  '  r718 实测：攻击漏判 8/9（89%）、真零命中 8/8、误伤 0/9；r716/r717 连续两轮 decision 落选，与 statistical_misleading（统计误导）语域相邻但落点不同（那管统计数据的呈现误导，本族管独立事件概率的认知错误）',
  '[C] ad_hominem 人身攻击新维度（以人贬损代替对论证的评价）feasibility=0.85, consequence_value=0.86, risk=0.35, confidence=0.8, prior=0.84',
  '  r718 实测：攻击漏判 7/9（78%）、真零命中 6/7、误伤 0/9；新侦察候选，英文已有 fallacies 检测表部分覆盖，中文几乎全漏。与 poisoning_the_well（毒井）语域相邻但落点不同（那管预先铺垫贬损，本族管以人的属性直接否定其论证）',
  '  心虫身份对齐：评价应该针对论证本身而非人，这是逻辑诚实的基本要求',
  '[D] appeal_to_consequences 诉诸后果新维度（以结论的后果好坏代替论证）feasibility=0.85, consequence_value=0.8, risk=0.4, confidence=0.8, prior=0.82',
  '  r718 实测：攻击漏判 7/9（78%）、真零命中 7/7、误伤 0/9；r717 decision 落选 0.83，与 wishful_thinking（一厢情愿）语域相邻但落点不同（那管以愿望推断结果，本族管以后果好坏判定真假）',
  '[E] appeal_to_pity_misuse 诉诸怜悯滥用新维度（以可怜处境胁迫决策让步）feasibility=0.82, consequence_value=0.78, risk=0.38, confidence=0.75, prior=0.8',
  '  r718 实测：攻击漏判 6/8（75%）、真零命中 4/6、误伤 0/8；新侦察候选，存量 appeal_to_pity（第 133 维）管论证语域的怜悯诉求，本族管决策/评价语域的胁迫性哀求',
  '[F] appeal_to_majority 诉诸多数新维度（以人数/流行度代替论证）feasibility=0.85, consequence_value=0.78, risk=0.4, confidence=0.8, prior=0.82',
  '  r718 实测：攻击漏判 6/9（67%）、真零命中 6/6、误伤 0/9；r716/r717 连续两轮 decision 落选，与 synthetic_social_proof（社会证明）语域相邻但落点不同',
  '[G] void_zh_standard_shift 契约作废窄口补形（事后单方面宣布约定/标准不算数）feasibility=0.8, consequence_value=0.72, risk=0.4, confidence=0.75, prior=0.78',
  '  r718 实测：攻击漏判 6/9（67%）、真零命中 6/6、误伤 0/9；r696 起遗留三轮落选，作废词表补变体即可，但样本面 9 条最小',
  '[H] post_hoc 后此谬误新维度（以时间先后代替因果关系）feasibility=0.8, consequence_value=0.75, risk=0.45, confidence=0.75, prior=0.79',
  '  r718 实测：攻击漏判 5/9（56%）、真零命中 5/5、误伤 0/9；r716/r717 连续两轮落选，与 pseudo_causal（伪因果）语域相邻但落点不同',
  '[I] appeal_to_fear 诉诸恐惧新维度（以威胁/可怕后果代替论证）feasibility=0.82, consequence_value=0.79, risk=0.4, confidence=0.75, prior=0.8',
  '  r718 实测：攻击漏判 5/9（56%）、真零命中 5/5、误伤 0/9；新侦察候选，存量 fear_projection（第 118 维）管关系语域的恐惧投射，本族管论证/说服语域的威胁诉求',
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
