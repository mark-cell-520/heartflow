// 轮 200：方向 A 的精确边界分析
// S1（边界样本）的三票：anchor-mix(18) + double-connective(18) + transitions(10)
// R1 折叠后仍 score 0.46 —— 两票是 anchor-mix（中文套话锚 + 英文词）与
// transitions（英文连接词），确实是两个不同来源的判据。
// 问题：这两个判据本身都异常吗？量化锚词与连接词在正当技术文档中的共现。
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const { detect } = require(path.join(HF, 'src/shield/ai-writing-tell.js'));

// 正当的中英对照写作形状（学术/技术文档的中英术语对照、课堂讲义）
const CASES = [
  // 锚词单独在场（无英文词）→ 应 0
  '总之，这个方案可以上线；此外，要补监控。',
  '总体来说，我们需要 firstly 明确 SLA 目标，其次决定重试次数。',
  // 连接词对单独在场（≥2 对）→ 第 50 轮攻击池同型，应命中
  '首先，Firstly 我们要明确目标；其次，Secondly 要制定计划。',
  // 锚 + ≤1 个英文词 → anchor-mix 不触发
  '总之，overall 这个方案可以上线。',
  // 锚 + ≥2 个英文词（无连接词对）→ anchor-mix 单触发
  '总之，overall 这个方案涉及 retry 与 timeout 两类失败，此外要补监控。',
  // 边界样本形状：锚 + 连接词对 x2
  '总之，overall 这个方案可以上线；此外，moreover 要补监控。',
];

const ZH_AI_ANCHOR = /(总而言之|综上所述|值得注意的?是|首先|其次|总的来说|总之|更重要(?:的|是)?|换句话说|一方面|另一方面|第一|第二)/;

CASES.forEach((s, i) => {
  const r = detect(s);
  const anchor = s.match(ZH_AI_ANCHOR);
  const enAfter = anchor ? (s.slice(s.indexOf(anchor[0]) + anchor[0].length, s.indexOf(anchor[0]) + anchor[0].length + 140).match(/[a-zA-Z]{2,}/g) || []).length : 0;
  const rows = (r.findings || []).map(f => `${f.dimension.replace(/^ai-tell-/, '')}(${f.severity})${f.zhEnSrc ? '@' + f.zhEnSrc : ''}`);
  console.log(`C${i + 1}: score=${r.score.toFixed(2)} fams=${r.familiesHit} anchor=${anchor ? anchor[0] : '-'} enAfter=${enAfter} | ${rows.join(' + ')}`);
});
