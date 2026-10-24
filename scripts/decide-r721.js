// 第 721 轮方向选择：decision 本体（候选池 = r721 探测器三个合格族）
// 判据构造纪律同 r716-r720：四段由我构造，decision 本体选；打平弃权
// 是诚实行为，需补可区分判据。本轮三候选漏判率 75/71/67 天然区隔，
// 样本面 16/14/12 亦区隔，另有身份对齐差异（核心概率界线 vs 情感贬损
// vs 相邻谬误反向补形）。
const { HeartFlowDecision } = require('../src/core/decision.js');

const PROMPT = [
  '[A] appeal_to_probability 可能性误当必然新维度（基数大/重复多/样本大=一定会发生）feasibility=0.82, consequence_value=0.78, risk=0.42, confidence=0.78, prior=0.8',
  '  r721 实测：攻击漏判 12/16（75%）、真零命中 12/12、误伤 0/10；r720 落选族（当时 5/8 漏判 63%），本轮样本扩到语域真实分布（航班安全/蒙题/十四亿人口/keep playing bound to win）后漏判率 63%→75%，存量 wishful_thinking 只管「坚信→必将」，gamblers_fallacy 只管「连胜→该反转」，「宇宙这么大肯定有外星人」「Given enough time anything that can happen will happen」整族仍全漏',
  '  心虫身份对齐：可能≠必然是辨别者的核心界线之一，「概率当保证」的伪确定性遍布彩票/创业/考试/投资话术；漏判率与样本面均为三候选最高，新维度键 +1',
  '[B] relative_privation 诉诸更惨问题新维度（拿更惨的人抹掉眼前抱怨）feasibility=0.8, consequence_value=0.74, risk=0.4, confidence=0.75, prior=0.75',
  '  r721 实测：攻击漏判 10/14（71%）、真零命中 9/10、误伤 0/9；新侦察族。存量 suffering_contest 只覆盖第一人称自陈比惨（「我比你更惨」），「你至少还有学上，非洲的孩子连饭都吃不上」「别嫌房租贵了，有人睡大街呢」这类拿第三方苦难贬低当下诉求的形全漏',
  '  心虫身份对齐：诉诸更惨是「用更大的苦难抵消具体问题」的认知抹除，辨别者要守住「别人的苦难不能否定眼前的问题」；但 1 条漏判样本已被存量维度部分命中（真零命中 9/10），语域偏情感对话',
  '[C] hot_hand 热手谬误新维度（连胜势头会延续）feasibility=0.78, consequence_value=0.72, risk=0.38, confidence=0.72, prior=0.72',
  '  r721 实测：攻击漏判 8/12（67%）、真零命中 8/8、误伤 0/8；新侦察族。gamblers_fallacy 第 148 维只覆盖「连胜之后该反转」（due 方向），META_NOUN 里热手谬误仅作豁免概念词出现；「手感正旺下一把肯定中」「I have won five in a row, ride the momentum」整族全漏',
  '  心虫身份对齐：热手谬误与赌徒谬误同属「把独立事件当相关」，是第 148 维的自然反向补形；但漏判率 67% 与样本面 12 条均为三候选最低，属相邻族补形而非新语域开拓',
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
