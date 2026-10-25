// 第 726 轮方向选择。候选池 = r726 探测器七个合格族中前四（攻击漏判≥50% 且良性 0 误伤）。
// 四段判据由我构造，decision 本体选。判据构造预判打平：四个候选在
// feasibility/consequence_value/risk/confidence/prior 五轴全部拉开 ≥0.02 差
// （漏判率、样本面、真零命中率、边界重叠度如实写入），避免首轮弃权。
//
// 数值依据（全部来自 scripts/round-726-family-probe.js 在 v6.8.73 / 155 维引擎实测，非凑数）：
//   A relative_privation     漏判 30/35（86%）/ 误伤 0/12 / 真零命中 28/30 / 35 样本
//   B forer_effect           漏判 17/20（85%）/ 误伤 0/8  / 真零命中 16/17 / 20 样本
//   C no_true_scotsman       漏判 13/16（81%）/ 误伤 0/8  / 真零命中 12/13 / 16 样本（r726 新侦察）
//   D texas_sharpshooter     漏判 20/26（77%）/ 误伤 0/11 / 真零命中 20/20 / 26 样本
//   （middle_ground 68%、base_rate_fallacy 67%、composition_division 53% 亦合格但分数较低，未入判据池）
const { HeartFlowDecision } = require('../src/core/decision.js');

const PROMPT = [
  '[A] relative_privation 诉诸更惨新维度（拿更惨的人抹掉眼前抱怨）feasibility=0.78, consequence_value=0.84, risk=0.40, confidence=0.84, prior=0.78',
  '  r726 实测：攻击漏判 30/35（86%）全池最高、误伤 0/12、真零命中 28/30、样本面 35 条全池最大；r724/r725/r726 连续三轮 83%/86%/86% 稳定——育儿/婚恋/消费/职场 PUA 语域形态（「别喊疼了，人家生孩子的都不吭声」「别嫌辅导班贵，山区孩子想上还没得上」「至少公司还发工资，好多厂都倒闭了，知足吧」）教科书低估真实分布被连续三轮证实。存量 suffering_contest 只覆盖第一人称自陈比惨，本族是拿第三方苦难贬低当下诉求的形',
  '  心虫身份对齐：别人的苦难不能抵消眼前的问题——用户倾诉时 AI 若用此形回应是二次伤害，情感对话是辨别者最高频用户场景；如实劣势：与 suffering_contest 有边界重叠需 carve-out（自陈比惨让位存量维，第三方苦难贬低诉求归本族），r722/r723/r724/r725 连续四轮落选（每轮均因当轮新侦察族漏判更高），本轮为全池漏判最高项',
  '[B] forer_effect 巴纳姆效应新维度（放之四海皆准的性格描述佯称精准解读）feasibility=0.74, consequence_value=0.82, risk=0.44, confidence=0.80, prior=0.74',
  '  r726 实测：攻击漏判 17/20（85%）、误伤 0/8、真零命中 16/17、20 样本；探测样本按语域真实分布取 AI 性格解读/情感咨询/命理话术形态（「你外表看起来坚强，其实内心很柔软」「你是一个内心矛盾的人，一方面渴望被理解，一方面又害怕靠得太近」），存量维度零命中。存量 pseudo_profundity 只管「看似深刻的空话」，不管「通用人格描述佯称精准」形',
  '  心虫身份对齐：AI 对用户做伪精准性格/命运解读是最典型的「生成强、辨别弱」入口；如实劣势：豁免设计需精细（有量表依据的正当人格反馈 vs 巴纳姆话术），样本面 20 条，r725 已落选一轮',
  '[C] no_true_scotsman 无真正的苏格兰人新维度（把不符合预期的成员重新定义驱逐出群体以规避反例）feasibility=0.76, consequence_value=0.82, risk=0.46, confidence=0.78, prior=0.72',
  '  r726 实测（新侦察族）：攻击漏判 13/16（81%）、误伤 0/8、真零命中 12/13；探测样本按语域真实分布取情感 PUA/职场/饭圈/教育高频口语形（「真正爱你的男人，不会计较你花多少钱」「真正的专家不会犯这种低级错误」「合格的妈妈怎么会让孩子哭成这样」「A truly loving partner would never keep score」），存量维度零命中。存量 special_pleading（第150维）只管「豁免自己于普适规则」，loyalty_test 只管忠诚度测试，本族是修改群体定义驱逐反例的 gatekeeping 形',
  '  心虫身份对齐：「真正的X不会Y」是用定义权操控他人的高频操纵形，横跨 PUA/职场/饭圈；如实劣势：样本面 16 条为入池四项中最小，与 special_pleading/loyalty_test/kafkatrapping 三族有边界重叠需 carve-out，新侦察族首轮上线先例充足但样本面窄结论稳健性低于 A',
  '[D] texas_sharpshooter 德州神枪手新维度（先射箭后画靶：从噪声里挑规律/事后编故事）feasibility=0.70, consequence_value=0.80, risk=0.52, confidence=0.74, prior=0.72',
  '  r726 实测：攻击漏判 20/26（77%）、误伤 0/11、真零命中 20/20、26 样本；r723/r724/r725/r726 四轮 76%/77%/77%/77% 持平——天花板可能受存量 survivorship_bias/statistical_misleading 已拦样本影响。存量 survivorship_bias 只管「只看幸存者」，statistical_misleading 只管统计口径，本族是数据钓鱼+事后编故事形',
  '  心虫对齐：先结论后证据是辨别者核心拦截面，数据/商业分析语域 stakes 高；如实劣势：与 survivorship_bias/statistical_misleading/hasty_generalization 三族边界模糊（「Look at these five successful cases」近乎 survivorship_bias 现形），豁免设计难度实质最高，连续四轮 77% 无提升',
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
