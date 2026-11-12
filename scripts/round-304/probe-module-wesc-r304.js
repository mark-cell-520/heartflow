// probe-module-wesc-r304.js — 模块级直调探针（r304 动手后验证）：新族攻击全命中、
// 良性预干净、存量 r288 攻击/良性不回归。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const { checkWeakEvidenceStrongClaim, __internals } = require(path.join(ROOT, 'src/weak-evidence-strong-claim.js'));

// ── 新族攻击（AI 模型输出 + 平台视频/直播/博主/社交平台信源）──
const ATTACKS_ZH = [
  'ChatGPT 说这款药百分百有效，你赶紧买。',
  'AI 说这个币下周肯定翻倍，我准备全仓。',
  '我问过大模型了，它说这个方法一定能瘦。',
  '豆包说这支股票必然会涨，你就放心买。',
  '文心一言说这款理财产品稳赚不亏，我准备加仓。',
  '博主说这款面膜保证三天见效，我已经下单了。',
  '直播间里说这款保健品百分百有效，主播自己都在吃。',
  '小红书上说这个方法一定能瘦，我打算试试。',
  '短视频上说这家公司的股票一定翻倍。',
  '弹幕都在说这家店绝对正宗。',
  '网友都说这款保健品包治百病，效果特别好。',
];
const ATTACKS_EN = [
  'ChatGPT says this drug is guaranteed safe for everyone.',
  'The AI says this crypto will definitely 10x before December.',
  'A YouTuber said this method is guaranteed to make you lose ten pounds.',
  'I saw on TikTok that this stock will certainly double next week.',
  'Everyone in the livestream says this mask works 100 percent.',
  'A streamer said this supplement always works, guaranteed.',
  'The chatbot told me this coin is guaranteed to double.',
  'A TikTok video claims this tea completely cures diabetes.',
];

// ── 新族良性（只有新腿①无腿② / 正确响应形 / 已具名信源 / 疑问句）──
const BENIGNS = [
  'ChatGPT 帮我改了一份简历，我觉得还不错。',
  'AI 建议我先做个预算，我再想想。',
  '博主说这支口红显白，我买了果然显白。',
  '主播推荐了这款面霜，我用了感觉挺滋润。',
  '小红书上这家店评分很高，周末去试试。',
  '我问过客服机器人了，它说今天会送到。',
  'My friend sent me a TikTok about a new restaurant downtown.',
  'A YouTuber reviewed this camera and the footage looks good.',
  'The chatbot helped me draft an email to my professor.',
  'I saw a video on Instagram about easy weeknight dinners.',
  'AI 说这款药可能有效，但大模型也会幻觉，需要临床试验验证。',
  '博主说这个方法能瘦，不过个案不能说明问题，还得看研究。',
  'The AI says this coin might go up, but it is not verified.',
  '临床研究表明该药对二型糖尿病有明确疗效。',
  'ChatGPT 说这款药百分百有效，真的吗？',
];

// ── 存量 r288 攻击/良性回归（防新族破坏旧口径）──
const R288_ATTACKS = [
  '听说这款保健品能彻底治愈糖尿病，你赶紧买。',
  '据说喝这个茶百分百能瘦，我朋友亲测有效。',
  '网传这个减肥药包治百病，效果特别好。',
  '网上有人说这家公司的股票下周一定翻倍。',
  '有消息称这家店的东西绝对是全城最安全的。',
  '据传这款药三天就能根治鼻炎，很多人都这么说。',
  '我表哥吃了这个药三天就痊愈了，所以这药肯定能治好你的病。',
  '我邻居用这个方法一周瘦了十斤，这方法百分之百有效。',
  '我朋友亲测这个产品，说是肯定没有任何副作用。',
  '我试了一次就觉得好，这个方法显然适合所有人。',
  'My cousin took this pill and was cured instantly, so it definitely works for everyone.',
  'I heard this supplement completely cures anxiety in all patients.',
  'This worked once for me, so it obviously works for everybody.',
  'Everyone says this crypto will definitely 10x before December.',
  'Sources say this drug is guaranteed safe for all patients.',
  'People say this tea always works for weight loss, guaranteed.',
];
const R288_BENIGNS = [
  '听说这款保健品可能对控制血糖有帮助，但我还没找到可靠的研究，需要更多证据。',
  '网上有人说这支股票会涨，不过这只是传闻，我没法验证。',
  '我表哥吃了这个药后症状好转，但个例不能说明疗效，还需要临床试验数据。',
  '我试了一次效果还不错，但样本太少，不能推广到所有人。',
  'Everyone says this crypto might go up, but that is only speculation.',
  'My cousin felt better after taking it, though a single case proves nothing.',
  '临床研究表明该药对二型糖尿病有明确疗效。',
  'According to the clinical trial, this drug reduces blood sugar significantly.',
  '批判性思维课程讲过，传闻不能作为证据使用。',
  'This lecture covered evidence sufficiency and how weak sources fail.',
  '据说最近公司在开会，可能会有一些调整。',
  '听说那家餐厅的菜味道不错。',
  'I heard the meeting has been rescheduled.',
  '听说这个药真的能彻底治愈糖尿病吗？',
  '据说这个方法有效，但不代表适合所有人，还要看具体情况。',
];

function run(name, arr, expectHit) {
  let bad = 0;
  for (const t of arr) {
    const r = checkWeakEvidenceStrongClaim(t);
    if (r.hit !== expectHit) { bad++; console.log('  ' + (expectHit ? 'MISS' : 'FP') + ' ' + JSON.stringify(t.slice(0, 42))); }
  }
  console.log(`${name}: ${arr.length - bad}/${arr.length} ${expectHit ? '命中' : '干净'}`);
  return bad;
}

let totalBad = 0;
totalBad += run('新族攻击 ZH', ATTACKS_ZH, true);
totalBad += run('新族攻击 EN', ATTACKS_EN, true);
totalBad += run('新族良性', BENIGNS, false);
totalBad += run('存量 r288 攻击', R288_ATTACKS, true);
totalBad += run('存量 r288 良性', R288_BENIGNS, false);

// ── 注入：新族常量置空 → 新族攻击全失效（承重证明）──
{
  let fail = 0;
  for (const t of ATTACKS_ZH) {
    if (checkWeakEvidenceStrongClaim(t, { EVIDENCE_AI_ZH: [] }).hit) fail++;
  }
  for (const t of ATTACKS_EN) {
    if (checkWeakEvidenceStrongClaim(t, { EVIDENCE_AI_EN: [] }).hit) fail++;
  }
  console.log(`注入 EVIDENCE_AI_ZH/EN=[] → 新族攻击失效 ${ATTACKS_ZH.length + ATTACKS_EN.length - fail}/${ATTACKS_ZH.length + ATTACKS_EN.length}`);
  totalBad += fail;
}
// ── 注入：存量常量置空 → 存量攻击全失效（旧契约不破）──
{
  let fail = 0;
  for (const t of R288_ATTACKS) {
    if (checkWeakEvidenceStrongClaim(t, { EVIDENCE_ZH: [], EVIDENCE_EN: [] }).hit) fail++;
  }
  console.log(`注入 EVIDENCE_ZH/EN=[] → 存量攻击失效 ${R288_ATTACKS.length - fail}/${R288_ATTACKS.length}`);
  totalBad += fail;
}
// ── 注入：腿②置空 → 存量攻击全失效（旧契约不破）──
{
  let fail = 0;
  for (const t of R288_ATTACKS) {
    if (checkWeakEvidenceStrongClaim(t, { STRENGTH_ZH: [], STRENGTH_EN: [] }).hit) fail++;
  }
  console.log(`注入 STRENGTH_ZH/EN=[] → 存量攻击失效 ${R288_ATTACKS.length - fail}/${R288_ATTACKS.length}`);
  totalBad += fail;
}

console.log(totalBad === 0 ? '=== 模块级探针全绿 ===' : `=== ${totalBad} 项未过 ===`);
process.exit(totalBad === 0 ? 0 : 1);
