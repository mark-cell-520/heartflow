// 第 154 轮探针 6：en-clause + 锚点共现限定版（最终候选）
// 关键限定：英文小句（含代词、≥4 词）必须**紧跟中文 AI 套话锚**
// （锚点到英文串起点 ≤25 字）——中文文本光是引用英文句（留言/名言/工单）
// 不等于 AI 腔；把「总而言之，…」这种套话锚后面直接接英文主谓小句，
// 才是「连主语都懒得译」的结构性翻译腔痕迹。
'use strict';
const ZH_AI_ANCHOR = /(总而言之|综上所述|值得注意的?是|首先|其次|总的来说|总之|更重要(?:的|是)?|换句话说|一方面|另一方面|第一|第二)/;
const EN_RUN_RE = /[A-Za-z][A-Za-z'’-]*(?:\s+[A-Za-z][A-Za-z'’-]*){3,}/g;
const EN_PRONOUN_RE = /\b(?:we|you|they|it|i|us|them|our|your|he|she)\b/i;

function hit(text, maxGap) {
  if (!/[\u4e00-\u9fff]/.test(text)) return { hit: false, run: null, gap: null };
  const runs = text.match(EN_RUN_RE) || [];
  for (const run of runs) {
    if (!EN_PRONOUN_RE.test(run)) continue;
    const runStart = text.indexOf(run);
    // 找英文串之前最近的锚点
    const am = text.slice(0, runStart).match(new RegExp(ZH_AI_ANCHOR.source, 'g'));
    if (!am) continue;
    const lastAnchor = text.slice(0, runStart).lastIndexOf(am[am.length - 1]);
    const gap = runStart - (lastAnchor + am[am.length - 1].length);
    if (gap <= maxGap) return { hit: true, run, gap };
  }
  return { hit: false, run: null, gap: null };
}

const BENIGN_QUOTE = [
  ['Q1', '俗话说 as we all know，质量是设计出来的。'],
  ['Q2', '他留下一句 we will see 就走了。'],
  ['Q3', '论文标题就是 What We Cannot Know。'],
  ['Q4', '海报上印着 Yes We Can 三个词。'],
  ['Q5', '那句话我记到现在：we are not alone。'],
  ['Q6', '白板写着 do what you love，大家会心一笑。'],
  ['Q7', '教程原文：when in doubt, use brute force。'],
  ['Q8', '注释里写着 FIXME we need to clean this up later。'],
  ['Q9', 'README 引用了一句 keep it simple, stupid。'],
  ['Q10', '邮件里他写 sorry I missed your call。'],
  ['Q11', '标语：you are not a drop in the ocean。'],
  ['Q12', '文档写明 when we say stable we mean no API changes。'],
  ['Q13', '代码评审记录：we should refactor this before merge。'],
  ['Q14', 'CI 失败日志：it seems the cache is stale。'],
  ['Q15', '用户反馈原文：I cannot find the export button。'],
  ['Q16', '会议纪要：they will provide the API spec next week。'],
  ['Q17', 'Issue 标题：we need better error messages。'],
  ['Q18', '报警内容：the disk is almost full。'],
  ['Q19', '同事留言：can you review my PR today。'],
  ['Q20', '上线公告：we have migrated to the new cluster。'],
  // 套话锚 + 但英文串短/无代词（正当混排）
  ['Q21', '总之，overall 这个方案可以上线；此外，moreover 要补监控。'],
  ['Q22', '综上所述，方案 encompassing 了 all critical aspects。'],
  ['Q23', '首先，我们需要 firstly 明确 SLA 目标。'],
  ['Q24', '值得注意的是，latency 与 throughput 两项指标都达标。'],
];

const ATTACK = [
  ['A1', '总而言之，This approach demonstrates significant value across multiple dimensions of our work.'],
  ['A3', '值得注意的是，It is worth noting that 这个策略存在潜在的重大风险。'],
  ['C1', '综上所述，we need to comprehensively evaluate 这个方案的优劣。'],
  ['C2', '值得注意的是，it is important to note that 这个方案存在风险。'],
  ['C5', '首先，let us consider the trade-offs between latency and throughput。'],
  ['E1', '总之，we should leverage this framework to streamline the whole process。'],
  ['E2', '值得注意的是，you need to ensure that every case is deterministic。'],
  ['E3', '综上，they plan to refactor the module before the release。'],
  ['E4', '首先，it is crucial that we validate all edge cases。'],
  ['E5', '换句话说，we can avoid this by caching the parsed result。'],
  ['E6', '总的来说，this approach requires us to rethink the data model。'],
  ['E7', '一方面，our team needs to balance latency against throughput。'],
  ['E8', '第二，you must double-check the identifier before merging。'],
  ['A6', '换句话说，we need to delve into the intricate details of the design.'],
];

for (const maxGap of [10, 20, 30]) {
  let fp = 0; const fps = [];
  for (const [tag, s] of BENIGN_QUOTE) { const r = hit(s, maxGap); if (r.hit) { fp++; fps.push(`${tag}(gap=${r.gap})`); } }
  let a = 0;
  for (const [, s] of ATTACK) if (hit(s, maxGap).hit) a++;
  console.log(`锚距 ≤${maxGap}: 命中 ${a}/${ATTACK.length} | 误伤 ${fp}/${BENIGN_QUOTE.length} ${fps.length ? fps.join(' ') : ''}`);
}
