// 第 719 轮方向选择：decision 本体（候选池 = r719 探测器七个合格族）
// 判据按实测漏判率/误伤/真零命中 + 身份对齐度构造，decision 本体在候选间选出。
const { HeartFlowDecision } = require('../src/core/decision.js');

const PROMPT = [
  '[A] gamblers_fallacy 赌徒谬误新维度（独立事件的概率误判：连输后「该赢了」）feasibility=0.85, consequence_value=0.82, risk=0.4, confidence=0.8, prior=0.85',
  '  r719 实测：攻击漏判 8/9（89%）、真零命中 8/8、误伤 0/9；r716/r717/r718 连续三轮 decision 落选，r718 交接簿点名的下轮首选。与 statistical_misleading（统计误导）语域相邻但落点不同（那管统计数据的呈现误导，本族管独立事件概率的认知错误）',
  '[B] ad_hominem 人身攻击新维度（以对人贬损代替对论证的评价）feasibility=0.85, consequence_value=0.86, risk=0.35, confidence=0.8, prior=0.84',
  '  r719 实测：攻击漏判 7/9（78%）、真零命中 6/7、误伤 0/9；r718 第一轮与选中项打平后落选。中文侧 6/6 全漏，英文侧 fallacies 检测表已覆盖 2/3。与 poisoning_the_well（毒井）语域相邻但落点不同（那管预先铺垫贬损，本族管以人的属性直接否定其论证）',
  '  心虫身份对齐：评价应该针对论证本身而非人，这是逻辑诚实的基本要求',
  '[C] appeal_to_consequences 诉诸后果新维度（以结论的后果好坏代替论证真假）feasibility=0.85, consequence_value=0.8, risk=0.4, confidence=0.8, prior=0.82',
  '  r719 实测：攻击漏判 7/9（78%）、真零命中 7/7、误伤 0/9；r717/r718 连续两轮 decision 落选。与 wishful_thinking（一厢情愿）语域相邻但落点不同（那管以愿望推断结果，本族管以后果好坏判定真假）',
  '[D] special_pleading 特殊豁免新维度（规则只约束别人不约束自己的双标）feasibility=0.85, consequence_value=0.84, risk=0.35, confidence=0.8, prior=0.83',
  '  r719 实测：攻击漏判 7/9（78%）、真零命中 7/7、误伤 0/9；新侦察候选（本轮首次进正式探测器）。与 standard_shift（标准漂移）/cost_externalization（成本外化）语域相邻但落点不同（那管规则/标准本身被改变或成本转移，本族管自称对规则拥有豁免权）',
  '  心虫身份对齐：辨别者的天职是检查「规则对自己也适用吗」——双重标准是最常见的不诚实形态',
  '[E] appeal_to_majority 诉诸多数新维度（以人数/流行度代替论证）feasibility=0.85, consequence_value=0.78, risk=0.4, confidence=0.8, prior=0.82',
  '  r719 实测：攻击漏判 6/9（67%）、真零命中 6/6、误伤 0/9；r716/r717/r718 连续三轮 decision 落选。与 synthetic_social_proof（社会证明）语域相邻但落点不同',
  '[F] appeal_to_pity_misuse 诉诸怜悯滥用新维度（以可怜处境胁迫决策让步）feasibility=0.82, consequence_value=0.78, risk=0.38, confidence=0.75, prior=0.8',
  '  r719 实测：攻击漏判 6/8（75%）、真零命中 4/6、误伤 0/8；r718 新侦察落选。存量 appeal_to_pity（第 133 维）管论证语域的怜悯诉求，本族管决策/评价语域的胁迫性哀求',
  '[G] guilt_by_association 连坐定罪新维度（因关联关系代替本人行为的评判）feasibility=0.82, consequence_value=0.76, risk=0.4, confidence=0.75, prior=0.79',
  '  r719 实测：攻击漏判 6/9（67%）、真零命中 5/6、误伤 0/9；新侦察候选（本轮首次进正式探测器）。与 genetic_fallacy（起源谬误）/stereotype（刻板印象）语域相邻但落点不同（那管以来源/出身判定内容，本族管以人际关系圈判定本人品行）',
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
