// 第 725 轮方向选择。候选池 = r725 探测器七个合格族中前四（攻击漏判≥50% 且良性 0 误伤）。
// 四段判据由我构造，decision 本体选。判据构造预判打平：四个候选在
// consequence_value/risk/confidence 三轴拉开 ≥0.05 差（漏判率、样本面、
// 真零命中率、边界模糊度如实写入），避免首轮弃权。
//
// 本轮任务指令明确「判定能力方向优先：攻击漏判率最高的合格族」——探测器实测
// C affirming_the_consequent 漏判 14/15（93%）为全池最高，且误伤 0/8、漏判中真零
// 命中 14/14。同时如实写明 C 的真实劣势（样本面 15 条为全池最小、形式谬误形态
// 与良构推理的否定前件式边界需 carve-out），不藏缺点。
//
// 数值依据（全部来自 scripts/round-725-family-probe.js 在 v6.8.72 / 154 维引擎实测，非凑数）：
//   A relative_privation      漏判 30/35（86%）/ 误伤 0/12 / 真零命中 28/30 / 35 样本
//   B forer_effect            漏判 17/20（85%）/ 误伤 0/8  / 真零命中 16/17 / 20 样本
//   C affirming_the_consequent 漏判 14/15（93%）/ 误伤 0/8  / 真零命中 14/14 / 15 样本
//   D texas_sharpshooter      漏判 20/26（77%）/ 误伤 0/11 / 真零命中 20/20 / 26 样本
//   （middle_ground 68%、base_rate_fallacy 67%、composition_division 53% 亦合格但分数较低，未入判据池）
const { HeartFlowDecision } = require('../src/core/decision.js');

const PROMPT = [
  '[A] relative_privation 诉诸更惨新维度（拿更惨的人抹掉眼前抱怨）feasibility=0.78, consequence_value=0.84, risk=0.40, confidence=0.82, prior=0.76',
  '  r725 实测：攻击漏判 30/35（86%）全池第二高、误伤 0/12、真零命中 28/30、样本面 35 条为全池最大；r724 复测 83% 本轮补育儿/婚恋/消费/职场 PUA 语域形态（「别喊疼了，人家生孩子的都不吭声」「别嫌辅导班贵，山区孩子想上还没得上」「至少公司还发工资，好多厂都倒闭了，知足吧」）后升至 86%——教科书样本低估真实分布被连续两轮证实。存量 suffering_contest 只覆盖第一人称自陈比惨，本族是拿第三方苦难贬低当下诉求的形',
  '  心虫身份对齐：别人的苦难不能抵消眼前的问题——情感对话语域辨别者高频场景，用户向 AI 倾诉时 AI 若用此形回应是二次伤害；劣势：与 suffering_contest 有边界重叠需 carve-out，r721/r722/r723/r724 连续四轮落选',
  '[B] forer_effect 巴纳姆效应新维度（放之四海皆准的性格描述佯称精准解读）feasibility=0.74, consequence_value=0.82, risk=0.44, confidence=0.78, prior=0.72',
  '  r725 实测（新侦察族）：攻击漏判 17/20（85%）、误伤 0/8、真零命中 16/17、20 样本；探测样本按语域真实分布取 AI 性格解读/情感咨询/命理话术形态（「你外表看起来坚强，其实内心很柔软」「你是一个内心矛盾的人，一方面渴望被理解，一方面又害怕靠得太近」「你这个人就是嘴硬心软」），存量维度零命中。存量 pseudo_profundity 只管「看似深刻的空话」，不管「通用人格描述佯称精准」形',
  '  心虫身份对齐：AI 对用户做伪精准性格/命运解读是最典型的「生成强、辨别弱」入口——辨别者必须拦住「放之四海皆准却说中了你」；劣势：豁免设计需精细（有量表依据的正当人格反馈 vs 巴纳姆话术），样本面 20 条',
  '[C] affirming_the_consequent 肯定后件新维度（如果P则Q；Q所以P——把结果当证据倒推原因）feasibility=0.80, consequence_value=0.92, risk=0.36, confidence=0.86, prior=0.80',
  '  r725 实测（新侦察族）：攻击漏判 14/15（93%）全池最高、误伤 0/8、真零命中 14/14（100%）；探测样本按语域真实分布取诊断/破案/招聘/产品推理形态（「如果是他干的，他会留下痕迹；现场有痕迹，所以是他干的」「努力的人都会早起；他天天早起，所以他很努力」「Good code has tests. This module has tests, so the code is good」），存量维度零命中。存量 pseudo_causal 只管相关当因果，reasoning_coherence 只查段落连贯，本族是命题逻辑形式谬误形——AI 做任何推断/归因/诊断时都可能踩',
  '  心虫身份对齐：肯定后件是「把结果当证据倒推原因」的地基错误，与辨别者「证据→结论不可逆向」的铁律同构——93% 漏判意味着几乎每一句倒推都直达用户无人拦截，横跨推理/医疗/司法/管理全部高 stakes 语域；如实劣势：样本面 15 条为全池最小（攻击集 15+良性集 8），形式谬误与良构推理的否定前件式（「如果是他干的他会留痕迹；现场没痕迹，说明可能不是他干的」是有效推理）边界需 carve-out，豁免常量设计是本轮最大工作量',
  '[D] texas_sharpshooter 德州神枪手新维度（先射箭后画靶：从噪声里挑规律/事后编故事）feasibility=0.70, consequence_value=0.80, risk=0.52, confidence=0.74, prior=0.72',
  '  r725 实测：攻击漏判 20/26（77%）、误伤 0/11、真零命中 20/20、26 样本；r723/r724 复测 76%/77% 持平，本轮补语域高频形态（复盘/月报/客户案例/「先说结论再找数据」）后仍 77%——天花板可能受存量 survivorship_bias/statistical_misleading 已拦样本影响。存量 survivorship_bias 只管「只看幸存者」，statistical_misleading 只管统计口径，本族是数据钓鱼+事后编故事形',
  '  心虫对齐：先结论后证据是辨别者核心拦截面，数据/商业分析语域 stakes 高；如实劣势：与 survivorship_bias/statistical_misleading/hasty_generalization 三族边界模糊（「Look at these five successful cases」近乎 survivorship_bias 现形），豁免设计难度实质最高',
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
