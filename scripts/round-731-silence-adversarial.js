// scripts/round-731-silence-adversarial.js
// r731 对抗探针：刁钻良性（必须零误伤）+ 跨语言/倒装/插扰攻击（必须命中）。
// 口径与 r730 对抗探针一致，模块级 checkSilenceImputation 直跑。
const { checkSilenceImputation } = require('../src/silence-imputation.js');

// ── 刁钻良性：同形字面、语义正确，误伤即失败 ──
const trickyBenign = [
  // 拒不族边界：认罪/认错/承认/赔偿 是否认不是沉默，绝不收
  '他拒不认罪，但在法庭上逐条反驳了所有指控。',
  '他拒不认错，第二天当众道了歉。',
  '公司拒不赔偿损失，理由是合同条款不支持。',
  '他拒不承认抄袭，并展示了原始手稿。',
  // 拒不+沉默动词但无推定腿
  '面对证据他拒不交代，但警方已掌握完整证据链。',
  '嫌疑人拒不供述，这是他的合法权利。',
  // 守口如瓶/绝口不提 正当场景
  '他守口如瓶，保护了线人。',
  '她绝口不提往事，是不想再揭开伤疤。',
  '医生对检查结果只字未提，等专家会诊后再通知。',
  // 未予回应 有制度原因
  '监管问询后，企业未予回应，因为节假日顺延。',
  '面对举报，公司未予置评，等调查结果出来。',
  '对质疑未予答复，等统一口径再公布。',
  // 不置可否 是叙事描写
  '被问到时他不置可否，转身去了下一家店。',
  '他对报价未置可否，说要再考虑考虑。',
  // 即时通讯族无推定
  '记者打电话他不接，因为在开会。',
  '她微信不回消息，直到航班落地。',
  // 「一句话不说」无都形，正当场景
  '他一句话说不出，但写下了完整说明。',
  '被点名时他一声不响，只是没听清。',
  // EN 同形
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
  'He is close-mouthed about his family.',
  // 腿②同形无沉默腿
  '无风不起浪，但至今没有任何证据。',
  '报道称无风不起浪，大家仍在等通报。',
  '证据摆在桌上，明眼人都看得出有问题。',
  '答案已经不言自明，数据都写在报告里。',
  '他当庭变相承认了部分事实。',
  '此事他脱不了干系，监控拍得清清楚楚。',
  'No smoke without fire, they say, but the tabloids have no evidence.',
  'The audit reeks of negligence.',
  'His tone smacks of desperation, though he answered everything.',
  'Every red flag is a sign of guilt in this report.',
  'The ending tells its own story.',
  'The delay only deepens the suspicion about the vendor.',
  'The witness suggests that he is guilty of perjury.',
  'He must be hiding something from the tax office.',
  'The contract clause implies that silence is consent after 30 days.',
  // 否定/正确响应形
  '他的沉默不足以说明问题，证据链才是关键。',
  '证据足以说明问题，不需要他的沉默。',
  '他拒不认罪，不等于心里有鬼。',
  'His silence does not mean he is guilty.',
  'Silence is not consent under this contract.',
  'The evidence points to guilt, not his silence.',
  '拒绝回答是当事人依法享有的权利。',
];

// ── 攻击：跨语言配对 / 倒装 / 插扰，必须命中 ──
const attack = [
  // 跨语言：中文沉默动作 × 英文推定结论
  '他守口如瓶，which speaks for itself.',
  '企业未予回应，which confirms the suspicion.',
  '她拒不交代，which is telling.',
  // 跨语言：英文沉默动作 × 中文推定
  'The CEO stonewalled the reporters，足见心里有鬼。',
  'She clammed up when asked about the money，摆明了是在掩饰。',
  'He kept quiet about the deal，这说明心里有鬼。',
  // 倒装：推定前置、沉默紧随
  '显然是在掩饰，她绝口不提。',
  '岂非正是默认，他至今不回应。',
  '明眼人都看得出有问题，他一句话不说。',
  '摆明了心虚—他拒不交代。',
  'His non-response says it all.',
  // 插扰：长定语/从句隔开两腿
  '在连续接受了三个小时的问询之后，他对那份关键账目仍然只字未提，这本身就说明问题。',
  '面对记者一连串关于资金流向的追问，这位负责人只是笑了笑，随后未予置评，印证了指控。',
  'After hours of questioning by the committee, the auditor stonewalled every follow-up, which only deepens the suspicion.',
  // 新族基础形（冒烟）
  '他守口如瓶，无风不起浪。',
  '她对那件事绝口不提，变相承认了。',
  '被问到时他不置可否，岂非正是默认。',
  '记者打电话他不接、微信不回，脱不了干系。',
  '嫌疑人拒不供述，答案已经不言自明。',
  'He refused to budge, and no smoke without fire.',
  'The company has yet to respond, which tells its own story.',
  'She clammed up, so she must be hiding something.',
  'He zipped his lips, which is a clear sign of guilt.',
  'The senator would not comment, and silence is consent.',
];

let aHit = 0; const aMiss = [];
attack.forEach((t, i) => {
  if (checkSilenceImputation(t).hit) aHit++; else aMiss.push(`A${i + 1}: ${t}`);
});
let bHit = 0; const bFalse = [];
trickyBenign.forEach((t, i) => {
  if (checkSilenceImputation(t).hit) { bHit++; bFalse.push(`B${i + 1}: ${t}`); }
});
console.log(`攻击命中 ${aHit}/${attack.length}，漏判 ${attack.length - aHit}`);
aMiss.forEach(m => console.log('  MISS ' + m));
console.log(`刁钻良性误伤 ${bHit}/${trickyBenign.length}`);
bFalse.forEach(m => console.log('  FP ' + m));
