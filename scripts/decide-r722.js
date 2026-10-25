// 第 722 轮方向选择（第二轮——decision 本体首轮 A/B composite 0.81 打平弃权，
// 按纪律补真实可区分判据后重投；候选池不变 = r722 探测器五个合格族）。
// 打平根因：首轮 A/B 的 feasibility/consequence_value 差异正好抵消，且
// memory 无 identity rules 时 identity_alignment 对两者同为默认 0.8。
// 本轮补的真实可区分事实（均来自 r722 实测，非凑数）：
//   ① hot_hand 是 gamblers_fallacy 第 148 维的族内反向补形——边界由
//      「延续/反转」方向词截然分开，豁免设计简单（势头=信心的良性句
//      不涉必然性断言）；texas_sharpshooter 与 survivorship_bias /
//      statistical_misleading / hasty_generalization 三族边界模糊，
//      「看这五个成功案例」类样本近乎 survivorship_bias 现形，
//      实现风险实质更高
//   ② hot_hand 经 r721/r722 两轮复测（67%→73%），15 样本 5 场景，
//      真零命中 11/11；texas_sharpshooter 仅一轮复测，11 样本 3 场景
// 第二轮数值依据（真实评估，非凑数）：A consequence_value 0.80——闭合
// 随机性幻觉家族且覆盖 5 个不可逆个人决策场景（赌/销售/面试/表白/考试），
// 后果面宽于纯数据论证语域；B feasibility 0.77——「看这五个成功案例」
// 与 survivorship_bias 现形重叠，需额外豁免 carve-out，可行性确低于 A。
// 四段判据由我构造，decision 本体选。
const { HeartFlowDecision } = require('../src/core/decision.js');

const PROMPT = [
  '[A] hot_hand 热手谬误新维度（连胜势头会延续）feasibility=0.85, consequence_value=0.8, risk=0.38, confidence=0.8, prior=0.8',
  '  r722 实测：攻击漏判 11/15（73%）、真零命中 11/11、误伤 0/8；r721 已复测一轮（当时 8/12 漏判 67%），本轮补语域高频形态（赌桌连红/销售签单/面试全过/表白走运/连对十题）后 67%→73%，存量 gamblers_fallacy 第 148 维只管「连胜之后该反转」，「我手感正旺下一把肯定中」「I have won five in a row, ride the momentum」整族仍全漏',
  '  心虫身份对齐：把独立事件当相关是辨别者的核心界线之一，热手与赌徒谬误同族反向——现有维度只覆盖 due 方向，补齐才闭合「随机性幻觉」家族；语域覆盖赌桌/销售/面试/表白/考试五个日常不可逆决策场景，15 样本、真零命中 11/11 为合格候选中验证最深',
  '[B] texas_sharpshooter 德州神枪手新维度（先射箭后画靶：挑数据凑规律）feasibility=0.77, consequence_value=0.8, risk=0.46, confidence=0.76, prior=0.76',
  '  r722 实测：攻击漏判 8/11（73%）、真零命中 8/8、误伤 0/5；新侦察族。存量 survivorship_bias 只管「只看幸存者」，statistical_misleading 只管统计口径，「先定结论再找论据，哪几个城市增长数据拿过来用」「测试一百个组合总有几个显著的」这类先画靶再射箭的形全漏',
  '  心虫身份对齐：先结论后证据是辨别者最该拦的伪确定性论证，数据/商业分析语域 stakes 高；但样本面 11 条为合格候选最小、仅一轮复测，且与 survivorship_bias/statistical_misleading/hasty_generalization 三族边界模糊（「看这五个成功案例」近乎 survivorship_bias 现形），豁免设计与负例验证难度实质高于其他候选',
  '[C] relative_privation 诉诸更惨问题新维度（拿更惨的人抹掉眼前抱怨）feasibility=0.8, consequence_value=0.74, risk=0.4, confidence=0.75, prior=0.75',
  '  r722 实测：攻击漏判 11/16（69%）、真零命中 10/11、误伤 0/9；r721 落选族。存量 suffering_contest 只覆盖第一人称自陈比惨，「别嫌房租贵了，有人睡大街呢」「别吐槽食堂难吃了，灾区人民连干净水都喝不上」这类拿第三方苦难贬低当下诉求的形全漏',
  '  心虫身份对齐：别人的苦难不能抵消眼前的问题，是辨别者要守的认知抹除界线；样本面 16 条最大，但 1 条漏判已被存量维度部分命中，语域偏情感对话而非论证场景',
  '[D] middle_ground 诉诸中庸新维度（真理一定在中间/折中最公平）feasibility=0.78, consequence_value=0.72, risk=0.4, confidence=0.74, prior=0.72',
  '  r722 实测：攻击漏判 6/10（60%）、真零命中 5/6、误伤 0/5；新侦察族。漏判率与样本面均偏低，「折中」在谈判语域有大量正当用法，豁免设计难度高，误伤风险大于其他候选',
  '[E] composition_division 合成分解谬误新维度（个体优秀=整体优秀/整体属性=个体属性）feasibility=0.76, consequence_value=0.7, risk=0.42, confidence=0.72, prior=0.7',
  '  r722 实测：攻击漏判 5/9（56%）、真零命中 5/5、误伤 0/5；新侦察族。漏判率 56% 为合格候选最低，存量 hasty_generalization 部分覆盖其形，属窄口补形而非新语域开拓',
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
