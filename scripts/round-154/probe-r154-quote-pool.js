// 第 154 轮探针 5：en-clause 判据的代词风险面压力池
// 问题：判据要求「英文串含代词主语」，但中文文本常**引用**含代词的英文
// 惯用语/名言/口号（「as we all know」「team over self」）。必须确认这些
// 正当引用不被打分。这决定判据能否直接上。
'use strict';
const EN_PRONOUN_RE = /\b(?:we|you|they|it|i|us|them|our|your|he|she)\b/i;
const ZH_RE = /[\u4e00-\u9fff]/;

function hit(text) {
  if (!ZH_RE.test(text)) return { hit: false, run: null };
  const runs = text.match(/[A-Za-z][A-Za-z'’-]*(?:\s+[A-Za-z][A-Za-z'’-]*){3,}/g) || [];
  for (const run of runs) if (EN_PRONOUN_RE.test(run)) return { hit: true, run };
  return { hit: false, run: null };
}

// 良性：中文语境里引用英文惯用语/名言/技术口号（含代词但属引用）
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
  // 技术场景：中英混排的真实工程记录
  ['Q13', '代码评审记录：we should refactor this before merge。'],
  ['Q14', 'CI 失败日志：it seems the cache is stale。'],
  ['Q15', '用户反馈原文：I cannot find the export button。'],
  ['Q16', '会议纪要：they will provide the API spec next week。'],
  ['Q17', 'Issue 标题：we need better error messages。'],
  ['Q18', '报警内容：the disk is almost full。'],
  ['Q19', '同事留言：can you review my PR today。'],
  ['Q20', '上线公告：we have migrated to the new cluster。'],
];

// 攻击：锚点/过渡词 + 英文小句（AI 把整句写成英文的结构痕迹）
const ATTACK = [
  ['A1', '总而言之，This approach demonstrates significant value across multiple dimensions of our work.'],
  ['A3', '值得注意的是，It is worth noting that 这个策略存在潜在的重大风险。'],
  ['C1', '综上所述，we need to comprehensively evaluate 这个方案的优劣。'],
  ['C2', '值得注意的是，it is important to note that 这个方案存在风险。'],
  ['C5', '首先，let us consider the trade-offs between latency and throughput。'],
  ['E1', '总之，we should leverage this framework to streamline the whole process。'],
  ['E2', '值得注意的是，you need to ensure that every case is deterministic。'],
  ['E8', '第二，you must double-check the identifier before merging。'],
];

console.log('=== 良性引用/工程记录池（应 0 命中）===');
let fp = 0;
for (const [tag, s] of BENIGN_QUOTE) {
  const r = hit(s);
  if (r.hit) { fp++; console.log(`  ✗ 误伤 ${tag}: run="${r.run}"`); }
}
console.log(`误伤 ${fp}/${BENIGN_QUOTE.length}\n`);

console.log('=== 攻击池（应全命中）===');
let a = 0;
for (const [tag, s] of ATTACK) if (hit(s).hit) a++;
console.log(`命中 ${a}/${ATTACK.length}`);

// 结论性判断
console.log(`\n${fp === 0 ? '✅ 判据零误伤，可上' : '⚠️ 存在误伤，需加限定（如要求锚点词在英文串之前 N 字）'}`);
