// probe-module-wesc-r304.js — 模块级直调探针：证明新族在既有 weak_evidence_strong_claim
// 模块内真零命中（而非被引擎其他维度代拦），并预跑良性面。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const { checkWeakEvidenceStrongClaim } = require(path.join(ROOT, 'src/weak-evidence-strong-claim.js'));

const ATTACKS = [
  // AI 模型输出作为信源（中文）
  'ChatGPT 说这款药百分百有效，你赶紧买。',
  'AI 说这个币下周肯定翻倍，我准备全仓。',
  '我问过大模型了，它说这个方法一定能瘦。',
  '豆包说这支股票必然会涨，你就放心买。',
  // 平台/AI 中介（英文）
  'ChatGPT says this drug is guaranteed safe for everyone.',
  'The AI says this crypto will definitely 10x before December.',
  'A YouTuber said this method is guaranteed to make you lose ten jin.',
  'I saw on TikTok that this stock will certainly double next week.',
  // 短视频/直播/博主作为信源（中文）
  '短视频上说这家公司的股票一定翻倍，我朋友也刷到了。',
  '博主说这款面膜保证三天见效，我已经下单了。',
  '直播间里说这款保健品百分百有效，主播自己都在吃。',
  '小红书上说这个方法一定能瘦，我亲测有效。',
  '网上都在传这个课程包治百病，效果特别好。',
  // EN influencer/stream
  'Everyone in the livestream says this mask works 100 percent.',
  'A streamer said this supplement always works, guaranteed.',
];

const BENIGNS = [
  // 无绝对化断言的普通陈述（只有新腿①，无腿②）
  'ChatGPT 帮我改了一份简历，我觉得还不错。',
  'AI 建议我先做个预算，我再想想。',
  '博主说这支口红显白，我买了果然显白。',
  '主播推荐了这款面霜，我用了感觉挺滋润。',
  '小红书上这家店评分很高，周末去试试。',
  'My friend sent me a TikTok about a new restaurant downtown.',
  'A YouTuber reviewed this camera and the footage looks good.',
  'The chatbot helped me draft an email to my professor.',
  'I saw a video on Instagram about easy weeknight dinners.',
  // 正确响应形（标注未证实）
  'AI 说这款药可能有效，但大模型也会幻觉，需要临床试验验证。',
  '博主说这个方法能瘦，不过个案不能说明问题，还得看研究。',
  'The AI says this coin might go up, but it is not verified.',
  // 已具名信源
  '临床研究表明该药对二型糖尿病有明确疗效。',
  // 疑问句
  'ChatGPT 说这款药百分百有效，真的吗？',
];

let miss = 0;
for (const t of ATTACKS) {
  const r = checkWeakEvidenceStrongClaim(t);
  if (!r.hit) { miss++; console.log('MISS ' + JSON.stringify(t.slice(0, 40))); }
}
console.log(`攻击 ${ATTACKS.length - miss}/${ATTACKS.length} 命中（模块直调，动手前）`);

let fp = 0;
for (const t of BENIGNS) {
  const r = checkWeakEvidenceStrongClaim(t);
  if (r.hit) { fp++; console.log('FP ' + JSON.stringify(t.slice(0, 40))); }
}
console.log(`良性 ${BENIGNS.length - fp}/${BENIGNS.length} 干净（模块直调，动手前）`);
