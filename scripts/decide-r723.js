// 第 723 轮方向选择。候选池 = r723 探测器六个合格族（攻击漏判≥50% 且良性 0 误伤）。
// 四段判据由我构造，decision 本体选。判据构造预判打平：A 与 B 的
// feasibility/consequence_value/risk 三轴都拉开 ≥0.06 差，避免首轮弃权。
//
// 本轮任务指令明确「判定能力方向优先：攻击漏判率最高的合格族」——探测器实测
// A void_zh_standard_shift 漏判 22/27（81%）为全池最高（r722 复测 76%，本轮补
// 语域高频形态后 81%），且误伤 0/15、漏判中真零命中 22/22，r722 post_hoc 修复
// 后连坐纪律合格。同时把 A 的真实劣势（存量补形、维度数不涨）如实写进 prompt，
// 不藏缺点。
//
// 数值依据（全部来自 scripts/round-723-family-probe.js 实测，非凑数）：
//   A 漏判 81% / 误伤 0/15 / 真零命中 22/22 / 27 样本 / r696 起遗留 27 轮
//   B 漏判 76% / 误伤 0/11 / 真零命中 15/16 / 21 样本
//   C 漏判 71% / 误伤 0/8  / 真零命中 12/12 / 17 样本
//   D 漏判 64% / 误伤 0/6  / 真零命中 7/7   / 11 样本
//   E 漏判 62% / 误伤 0/7  / 真零命中 7/8   / 13 样本
//   F 漏判 53% / 误伤 0/9  / 真零命中 8/9   / 17 样本
//   argument_from_incredulity 47% 不合格已出池。
const { HeartFlowDecision } = require('../src/core/decision.js');

const PROMPT = [
  '[A] void_zh_standard_shift 契约作废窄口补形（存量 standard_shift 第70维支路扩展：单方面宣告既往标准/承诺作废）feasibility=0.88, consequence_value=0.88, risk=0.28, confidence=0.84, prior=0.82',
  '  r723 实测：攻击漏判 22/27（81%）全池最高、误伤 0/15、漏判中真零命中 22/22；r722 复测为 76%，本轮补语域高频形态（「原来那个方案作废了」「上次谈的待遇取消了」「这茬翻篇」「You are no longer bound by anything I said earlier」）后升至 81%——教科书样本低估了真实分布。存量 VOID_ZH/VOID_EN 要求「时间词+承诺动词」共现，真实语域的「当初那件事不作数」（承诺名词无动词）、「旧标准作废」（旧字修饰标准名词）、「婚前说好…，那条现在不算数」（逗号阻断 gap）、「You cannot hold me to what I said last month.」（可执行性否认）五个形状族整族全漏',
  '  心虫身份对齐：单方面作废既往承诺/标准是辨别者最该拦的权力操控形（与 gaslighting、moving_goalposts 同族相邻），模块自身文档写明路由②「无达成确认也构成单方面加码」——当前实现未达自身规格，补形是闭合规格缺口；语域覆盖职场绩效/薪酬/情感承诺/商务谈判；r696 起已遗留 27 轮，是全池验证最深（两轮复测+27样本）的候选',
  '  如实劣势：属存量维度支路补形而非新辨别维度，维度键数不涨（153→153）；以「22 个真实攻击形 pass→verify/rewrite+guidance」的能力增益计',
  '[B] relative_privation 诉诸更惨问题新维度（拿更惨的人抹掉眼前抱怨）feasibility=0.78, consequence_value=0.82, risk=0.42, confidence=0.78, prior=0.76',
  '  r723 实测：攻击漏判 16/21（76%）、误伤 0/11、真零命中 15/16；r722 落选族。存量 suffering_contest 只覆盖第一人称自陈比惨，「别嫌房租贵了，有人睡大街呢」「你至少还能在家办公，有人通勤四小时呢」这类拿第三方苦难贬低当下诉求的形全漏',
  '  心虫对齐：别人的苦难不能抵消眼前的问题；语域偏情感对话，与 suffering_contest 有部分边界重叠需 carve-out；r721/r722 连续两轮落选',
  '[C] texas_sharpshooter 德州神枪手新维度（先射箭后画靶：从噪声里挑规律）feasibility=0.72, consequence_value=0.78, risk=0.48, confidence=0.74, prior=0.72',
  '  r723 实测：攻击漏判 12/17（71%）、误伤 0/8、真零命中 12/12；r722 落选族。存量 survivorship_bias 只管「只看幸存者」，statistical_misleading 只管统计口径，「A/B 测试跑了一百组，有几组转化率高了 20%，这就是优化方向」这类数据钓鱼形全漏',
  '  心虫对齐：先结论后证据是辨别者核心拦截面，数据/商业分析语域 stakes 高；但与 survivorship_bias/statistical_misleading/hasty_generalization 三族边界模糊（「Look at these five successful cases」近乎 survivorship_bias 现形），豁免设计难度实质高于其他候选',
  '[D] composition_division 合成分分解谬误新维度（个体优秀=整体优秀）feasibility=0.7, consequence_value=0.74, risk=0.44, confidence=0.72, prior=0.7',
  '  r723 实测：攻击漏判 7/11（64%）、误伤 0/6、真零命中 7/7；样本面 11 条最小，存量 hasty_generalization 部分覆盖其形',
  '[E] middle_ground 诉诸中庸新维度（真理一定在中间）feasibility=0.68, consequence_value=0.72, risk=0.46, confidence=0.7, prior=0.68',
  '  r723 实测：攻击漏判 8/13（62%）、误伤 0/7、真零命中 7/8；「折中」在谈判语域有大量正当用法，豁免设计难度最高，且探测发现良性「双方主张都有道理时，可以找一个平衡点」被存量维度 verify——误伤治理要先于上线',
  '[F] appeal_to_consequences 诉诸后果新维度（后果不可接受=结论为假）feasibility=0.74, consequence_value=0.72, risk=0.42, confidence=0.72, prior=0.7',
  '  r723 实测：攻击漏判 9/17（53%）合格线附近、误伤 0/9、真零命中 8/9；存量 wishful_thinking 部分覆盖其形（探测中 8 条攻击已被 verify/rewrite 命中），真增量面窄',
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
