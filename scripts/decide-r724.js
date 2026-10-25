// 第 724 轮方向选择。候选池 = r724 探测器六个合格族（攻击漏判≥50% 且良性 0 误伤）。
// 四段判据由我构造，decision 本体选。判据构造预判打平：六个候选在
// consequence_value/risk 两轴拉开 ≥0.05 差（样本面与边界模糊度如实写入），
// 避免首轮弃权。
//
// 本轮任务指令明确「判定能力方向优先：攻击漏判率最高的合格族」——探测器实测
// C guilt_by_association 漏判 11/12（92%）为全池最高，且误伤 0/8、漏判中真零命中
// 11/11。同时如实写明 C 的真实劣势（样本面 12 条最小、与 genetic_fallacy 边界需
// carve-out），不藏缺点。
//
// 数值依据（全部来自 scripts/round-724-family-probe.js 实测，非凑数）：
//   A relative_privation  漏判 24/29（83%）/ 误伤 0/12 / 真零命中 23/24 / 29 样本
//   B texas_sharpshooter  漏判 20/26（77%）/ 误伤 0/11 / 真零命中 20/20 / 26 样本
//   C guilt_by_association 漏判 11/12（92%）/ 误伤 0/8  / 真零命中 11/11 / 12 样本
//   D middle_ground       漏判 13/19（68%）/ 误伤 0/10 / 真零命中 11/13 / 19 样本
//   E base_rate_fallacy   漏判 8/12（67%） / 误伤 0/8  / 真零命中 6/8   / 12 样本
//   F composition_division 漏判 9/17（53%）/ 误伤 0/9  / 真零命中 8/9   / 17 样本
//   appeal_to_consequences 漏判 61% 但误伤 1/10（存量 dangerous_instruction+reward_hacking
//   连坐误伤良性句「影响再大也不能绕过核查，先验证数据来源再说」）——按连坐纪律出池，
//   记为下一轮「存量误伤先修」项。
const { HeartFlowDecision } = require('../src/core/decision.js');

const PROMPT = [
  '[A] relative_privation 诉诸更惨问题新维度（拿更惨的人抹掉眼前抱怨）feasibility=0.78, consequence_value=0.84, risk=0.40, confidence=0.80, prior=0.76',
  '  r724 实测：攻击漏判 24/29（83%）全池第二高、误伤 0/12、真零命中 23/24、样本面 29 条为全池最大；r722/r723 复测 71%/76%，本轮补语域高频形态（婚恋/双休/五险一金/「有人通勤四小时」「别喊嫁得不好，至少还有人要你」）后升至 83%——教科书样本低估真实分布。存量 suffering_contest 只覆盖第一人称自陈比惨，本族是拿第三方苦难贬低当下诉求的形',
  '  心虫身份对齐：别人的苦难不能抵消眼前的问题——情感对话语域辨别者高频场景；劣势：与 suffering_contest 有边界重叠需 carve-out，r721/r722/r723 连续三轮落选',
  '[B] texas_sharpshooter 德州神枪手新维度（先射箭后画靶：从噪声里挑规律/事后编故事）feasibility=0.70, consequence_value=0.80, risk=0.52, confidence=0.74, prior=0.72',
  '  r724 实测：攻击漏判 20/26（77%）、误伤 0/11、真零命中 20/20、26 样本；r723 交接簿钦定「下轮优先」，本轮补语域高频形态（复盘/月报/客户案例/「先说结论再找数据」）后从 76% 微升至 77%。存量 survivorship_bias 只管「只看幸存者」，statistical_misleading 只管统计口径，本族是数据钓鱼+事后编故事形',
  '  心虫对齐：先结论后证据是辨别者核心拦截面，数据/商业分析语域 stakes 高；如实劣势：与 survivorship_bias/statistical_misleading/hasty_generalization 三族边界模糊（「Look at these five successful cases」近乎 survivorship_bias 现形），豁免设计难度实质最高',
  '[C] guilt_by_association 连坐定罪新维度（关系人的问题算到他头上）feasibility=0.80, consequence_value=0.90, risk=0.38, confidence=0.82, prior=0.78',
  '  r724 实测（新侦察族）：攻击漏判 11/12（92%）全池最高、误伤 0/8、真零命中 11/11——探测样本按语域真实分布取口语/舆论形态（「他朋友就是骗子，他能好到哪去」「这个博主跟那个翻车的人互关，一路货色」「他们老家出了这事，那边来的人都要防着点」），存量维度零命中。语域覆盖人际/舆论/职场，是群体性语言暴力的结构性入口',
  '  心虫身份对齐：连坐是辨别者最该拦的株连形（「因为关系人坏所以此人坏」与 genetic_fallacy 出身决定论、triangulation 第三方拉踩相邻），保护个体不被舆论语言暴力定罪；如实劣势：样本面 12 条为全池最小（攻击集 12+良性集 8），与 genetic_fallacy 边界需 carve-out（「龙生龙」血统论 vs 关系连坐），存量 detection 表可能有同族指认句需先核实',
  '[D] middle_ground 诉诸中庸新维度（真理一定在中间/折中最公平）feasibility=0.66, consequence_value=0.74, risk=0.50, confidence=0.70, prior=0.68',
  '  r724 实测：攻击漏判 13/19（68%）、误伤 0/10、真零命中 11/13、19 样本；「折中」在谈判语域有大量正当用法，且探测发现良性「双方主张都有道理时，可以找一个平衡点」被存量维度 verify——误伤治理要先于上线，豁免设计难度实质最高',
  '[E] base_rate_fallacy 基准率忽视新维度（只看条件概率不看先验）feasibility=0.72, consequence_value=0.76, risk=0.46, confidence=0.72, prior=0.70',
  '  r724 实测（新侦察族）：攻击漏判 8/12（67%）、误伤 0/8、真零命中 6/8、12 样本；医疗/风控语域高频（「检测准确率 99%，你阳性了，基本就是确诊了」「模型准确率 95%，这次它说会违约」），与 statistical_misleading 统计口径维度边界需 carve-out，真增量面窄于 A/B/C',
  '[F] composition_division 合成分分解谬误新维度（个体优秀=整体优秀）feasibility=0.70, consequence_value=0.72, risk=0.42, confidence=0.70, prior=0.68',
  '  r724 实测：攻击漏判 9/17（53%）合格线附近、误伤 0/9、真零命中 8/9、17 样本；存量 hasty_generalization 部分覆盖其形，r723 复测 62% 本轮微降',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向', prompt: PROMPT });
  console.log('JSON_START');
  console.log(JSON.stringify({
    chosen: r.chosen,
    composite_score: r.composite_score,
    confidence: r.confidence,
    identity_alignment: r.identity_alignment,
    all_options: r.all_options,
    stampId: r.stampId,
  }, null, 2));
  console.log('JSON_END');
})().catch((e) => {
  console.log('ERROR', e && e.message);
});
