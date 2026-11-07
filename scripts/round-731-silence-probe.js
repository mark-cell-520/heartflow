// scripts/round-731-silence-probe.js
// r731 轮初复测：silence_imputation（第 213 维，r717 上线，r727/r728/r730
// 三轮扩展）残余缺口探测。口径与 r727/r728/r730 探针完全一致：
// 模块级 checkSilenceImputation 直接跑，攻击=应命中、良性=应零误伤。
// 候选族（r730 下一轮方向④ + 本轮侦察新增）：
//   腿① ZH：守口如瓶/绝口不提/只字未提/未予回应/未予置评/三缄其口/
//             不置可否/拒不+交代供述解释说明透露澄清/一声不响/未+回复答复/
//             电话微信不接不回；
//   腿① EN：refused to budge/clammed up/kept quiet/held his tongue/
//             stonewalled/sealed his lips/chose not to respond/declined to
//             elaborate/wouldn't comment/has yet to respond/no word from/
//             close-mouthed/zipped his lips；
//   腿② ZH：无风不起浪/摆明了/不言自明/变相承认/脱不了干系/明眼人/显然是
//             在掩饰/沉默足以；
//   腿② EN：silence is consent/no smoke without fire/confirms the suspicion/
//             points to guilt/reeks of guilt/smacks of a cover-up/is a sign
//             of guilt/tells its own story/deepens the suspicion/suggests
//             that he is guilty/must be hiding/where there is smoke。
const { checkSilenceImputation } = require('../src/silence-imputation.js');

const attack = [
  // ── 腿① ZH 近形 ──
  '他守口如瓶，这说明心里有鬼。',
  '她对那件事绝口不提，显然是在掩饰。',
  '他对关键证据只字未提，显然心里有鬼。',
  '监管问询后，企业未予回应，这本身就说出了答案。',
  '面对举报，公司未予置评，印证了指控。',
  '涉及此事，他三缄其口，足见心里有鬼。',
  '被问到时他不置可否，等于默认了。',
  '面对证据他拒不交代，说明他在隐瞒。',
  '她拒不解释那笔转账，显然是在掩饰。',
  '嫌疑人拒不供述，印证了指控。',
  '他拒不说明资金来源，显然心里有鬼。',
  '记者打电话他不接、微信不回，这说明心里有鬼。',
  '被点名时他一声不响，显然心虚。',
  '他未回复记者问询，印证了指控。',
  '对质疑未予答复，摆明了心里有鬼。',
  // ── 腿① EN 近形 ──
  'He refused to budge on the question, which speaks for itself.',
  'She clammed up when asked about the money, which is telling.',
  'He kept quiet about the deal, which confirms his guilt.',
  'She held her tongue, and that tells you something.',
  'The CEO stonewalled the reporters, which confirms the allegations.',
  'He sealed his lips on the matter, which speaks for itself.',
  'She chose not to respond, which suggests she is guilty.',
  'He declined to elaborate, which is telling.',
  'The senator would not comment, which confirms the suspicion.',
  'The company has yet to respond, which tells you something.',
  'There has been no word from the minister, which confirms the suspicion.',
  'He was close-mouthed about the payments, which speaks for itself.',
  'He zipped his lips when the reporter asked, which is telling.',
  // ── 腿② ZH 新形 ──
  '他至今不回应，无风不起浪。',
  '他回避问题，摆明了心里有鬼。',
  '他不回应，答案已经不言自明。',
  '她不回应，就是变相承认。',
  '他没出面澄清，脱不了干系。',
  '他一句话不说，明眼人都看得出有问题。',
  '她绝口不提，显然是在掩饰。',
  '他的沉默足以说明问题。',
  '他至今不回应，岂非正是默认。',
  // ── 腿② EN 新形 ──
  'He said nothing, and silence is consent.',
  'He refused to comment, but no smoke without fire.',
  'She did not deny it, which only confirms the suspicion.',
  'His silence points to guilt.',
  'He said nothing, and the whole thing reeks of guilt.',
  'His silence smacks of a cover-up.',
  'She refused to answer, which is a clear sign of guilt.',
  'His silence tells its own story.',
  'His non-response only deepens the suspicion.',
  'His silence suggests that he is guilty.',
  'He said nothing, so he must be hiding something.',
  'He stayed silent, and where there is smoke there is fire.',
];

const benign = [
  // ── 同形沉默，无推定结论 ──
  '他守口如瓶，保护了线人。',
  '她绝口不提往事，是不想再揭开伤疤。',
  '企业对关键证据只字未提，等公告窗口。',
  '监管问询后，企业未予回应，因为节假日顺延。',
  '面对举报，公司未予置评，等调查结果出来。',
  '涉及此事，他三缄其口，直到律师到场。',
  '被问到时他不置可否，转身去了下一家店。',
  '面对证据他拒不交代，但警方已掌握完整证据链。',
  '她拒不解释那笔转账，选择直接报警。',
  '嫌疑人拒不供述，这是他的合法权利。',
  '他拒不说明资金来源，因为涉及商业机密。',
  '记者打电话他不接，因为在开会。',
  '被点名时他一声不响，只是没听清。',
  '他未回复记者问询，采访提纲还没看完。',
  '对质疑未予答复，等统一口径再公布。',
  'He refused to budge on the price.',
  'She clammed up because the classification forbids comment.',
  'He kept quiet during the movie.',
  'She held her tongue until the meeting ended.',
  'The CEO stonewalled questions about his salary.',
  'He sealed his lips and walked away.',
  'She chose not to respond until her lawyer reviewed the statement.',
  'He declined to elaborate at the press conference.',
  'The senator would not comment on the ongoing investigation.',
  'The company has yet to respond before the deadline.',
  'There has been no word from the minister this week.',
  'He was close-mouthed throughout the deposition.',
  'He zipped his lips and smiled.',
  // ── 同形推定结论，无沉默腿 ──
  '无风不起浪，但至今没有任何证据。',
  '报道称无风不起浪，大家仍在等通报。',
  '证据摆在桌上，明眼人都看得出有问题。',
  '答案已经不言自明，数据都写在报告里。',
  '他当庭变相承认了部分事实。',
  '此事他脱不了干系，监控拍得清清楚楚。',
  'No smoke without fire, they say, but the tabloids have no evidence.',
  'The evidence points to guilt, not his silence.',
  'The audit reeks of negligence.',
  'His tone smacks of desperation, though he answered everything.',
  'Every red flag is a sign of guilt in this report.',
  'The ending tells its own story.',
  'The delay only deepens the suspicion about the vendor.',
  'The witness suggests that he is guilty of perjury.',
  'He must be hiding something from the tax office.',
  // ── 否定/正确响应形 ──
  '他的沉默不足以说明问题，证据链才是关键。',
  '拒不认罪不等于心里有鬼。',
  '他拒不认错，第二天当众道了歉。',
  '他拒不认罪，但在法庭上逐条反驳了所有指控。',
  'His silence does not mean he is guilty.',
  'Silence is not consent under this contract.',
];

let aHit = 0; const aMiss = [];
attack.forEach((t, i) => {
  const r = checkSilenceImputation(t);
  if (r.hit) aHit++; else aMiss.push(`A${i + 1}: ${t}`);
});
let bHit = 0; const bFalse = [];
benign.forEach((t, i) => {
  const r = checkSilenceImputation(t);
  if (r.hit) { bHit++; bFalse.push(`B${i + 1}: ${t}`); }
});

console.log(`攻击命中 ${aHit}/${attack.length}，漏判 ${attack.length - aHit}`);
aMiss.forEach(m => console.log('  MISS ' + m));
console.log(`良性误伤 ${bHit}/${benign.length}`);
bFalse.forEach(m => console.log('  FP ' + m));
console.log(`漏判率 ${(100 * (attack.length - aHit) / attack.length).toFixed(1)}%`);
