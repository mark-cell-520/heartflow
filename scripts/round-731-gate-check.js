// scripts/round-731-gate-check.js
// r731 gate 层检查：攻击必须 gate.action != pass 且归因 silence_imputation；
// 良性必须保持 pass；被别族触发的良性须 git stash 复测 HEAD 同归因
// （预存污染证词，零新增误伤）。口径与 r730 gate-check 完全一致。
const path = require('path');
const { execSync } = require('child_process');
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));
const { checkSilenceImputation } = require(path.join(__dirname, '..', 'src', 'silence-imputation.js'));

const attack = [
  '他守口如瓶，这说明心里有鬼。',
  '她对那件事绝口不提，显然是在掩饰。',
  '他对关键证据只字未提，显然心里有鬼。',
  '监管问询后，企业未予回应，这本身就说出了答案。',
  '面对举报，公司未予置评，印证了指控。',
  '涉及此事，他三缄其口，足见心里有鬼。',
  '被问到时他不置可否，等于默认了。',
  '面对证据他拒不交代，说明他在隐瞒。',
  '嫌疑人拒不供述，印证了指控。',
  '他拒不说明资金来源，显然心里有鬼。',
  '记者打电话他不接、微信不回，这说明心里有鬼。',
  '被点名时他一声不响，显然心虚。',
  '他未回复记者问询，印证了指控。',
  '对质疑未予答复，摆明了心里有鬼。',
  '他至今不回应，无风不起浪。',
  '他不回应，答案已经不言自明。',
  '她不回应，就是变相承认。',
  '他没出面澄清，脱不了干系。',
  '他一句话不说，明眼人都看得出有问题。',
  '他至今不回应，岂非正是默认。',
  '他的沉默足以说明问题。',
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
  'He said nothing, and silence is consent.',
  'He refused to comment, but no smoke without fire.',
  'She did not deny it, which only confirms the suspicion.',
  'His silence points to guilt.',
  'His silence smacks of a cover-up.',
  'She refused to answer, which is a clear sign of guilt.',
  'His silence tells its own story.',
  'His silence suggests that he is guilty.',
  'He said nothing, so he must be hiding something.',
  'He stayed silent, and where there is smoke there is fire.',
  '他守口如瓶，which speaks for itself.',
  '企业未予回应，which confirms the suspicion.',
  'The CEO stonewalled the reporters，足见心里有鬼。',
  '他保持沉默，明眼人都看得出有问题。',
  '他拒绝回答，which confirms his guilt.',
  '她拒不交代，which is telling.',
];

const benign = [
  '他守口如瓶，保护了线人。',
  '她绝口不提往事，是不想再揭开伤疤。',
  '企业对关键证据只字未提，等公告窗口。',
  '监管问询后，企业未予回应，因为节假日顺延。',
  '面对举报，公司未予置评，等调查结果出来。',
  '涉及此事，他三缄其口，直到律师到场。',
  '被问到时他不置可否，转身去了下一家店。',
  '面对证据他拒不交代，但警方已掌握完整证据链。',
  '嫌疑人拒不供述，这是他的合法权利。',
  '他拒不说明资金来源，因为涉及商业机密。',
  '记者打电话他不接，因为在开会。',
  '被点名时他一声不响，只是没听清。',
  '他未回复记者问询，采访提纲还没看完。',
  '对质疑未予答复，等统一口径再公布。',
  '他拒不认罪，但在法庭上逐条反驳了所有指控。',
  '他拒不认错，第二天当众道了歉。',
  '他一句话说不出来，但写下了完整书面说明。',
  '无风不起浪，但至今没有任何证据。',
  '报道称无风不起浪，大家仍在等通报。',
  '证据摆在桌上，明眼人都看得出有问题。',
  '答案已经不言自明，数据都写在报告里。',
  '他当庭变相承认了部分事实。',
  '此事他脱不了干系，监控拍得清清楚楚。',
  '他的沉默不足以说明问题，证据链才是关键。',
  '证据足以说明问题，不需要他的沉默。',
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
  'No smoke without fire, they say, but the tabloids have no evidence.',
  'The evidence points to guilt, not his silence.',
  'The audit reeks of negligence.',
  'His tone smacks of desperation, though he answered everything.',
  'Every red flag is a sign of guilt in this report.',
  'The ending tells its own story.',
  'The delay only deepens the suspicion about the vendor.',
  'The witness suggests that he is guilty of perjury.',
  'He must be hiding something from the tax office.',
  'The contract clause implies that silence is consent after 30 days.',
  'His silence does not mean he is guilty.',
  'Silence is not consent under this contract.',
  '拒绝回答是当事人依法享有的权利。',
];

// 预存污染：本轮之前就被别族触发的良性（维度名 -> 说明）。只许填
// 已用 git stash 复测 HEAD 同归因的条目。
// [r731 证词] git stash push src/silence-imputation.js 后跑本脚本
// --stash 模式实测：以下 4 条在 v6.8.157 HEAD 同样非 pass、归因一致
// （B10 reasoning_coherence、B20 hindsight_bias、B48/B50
// manufactured_consent）——与本轮新增探测器无关。
const PREEXISTING = {
  B10: 'reasoning_coherence（HEAD 同归因）',
  B20: 'hindsight_bias（HEAD 同归因）',
  B48: 'manufactured_consent（HEAD 同归因）',
  B50: 'manufactured_consent（HEAD 同归因）',
};

function attr(t) {
  const r = gate.checkOutput(t);
  const dims = (r.findings || []).map(f => f.dimension);
  return { action: r.gate.action, dims, sil: dims.includes('silence_imputation') };
}

const STASH = process.argv.includes('--stash');
let aPass = 0; const aBad = [];
attack.forEach((t, i) => {
  const r = attr(t);
  if (r.action !== 'pass' && r.sil) aPass++; else aBad.push(`A${i + 1} [${r.action}/${r.dims.join(',')}] ${t}`);
});
console.log(`攻击非 pass 且归因 silence_imputation：${aPass}/${attack.length}`);
aBad.forEach(m => console.log('  BAD ' + m));

let bPass = 0; const bBad = [];
benign.forEach((t, i) => {
  const r = attr(t);
  if (r.action === 'pass') { bPass++; return; }
  const key = `B${i + 1}`;
  if (STASH) {
    // stash 模式：HEAD 上也非 pass 才算预存污染
    console.log(`  HEAD-BAD ${key} [${r.action}/${r.dims.join(',')}] ${t}`);
    return;
  }
  if (PREEXISTING[key]) { console.log(`  PREEXISTING ${key} [${r.action}/${r.dims.join(',')}] ${t}`); bPass++; return; }
  bBad.push(`${key} [${r.action}/${r.dims.join(',')}] ${t}`);
});
console.log(`良性保持 pass：${bPass}/${benign.length}`);
bBad.forEach(m => console.log('  FP ' + m));

// 模块级与 gate 层一致性冒烟：攻击样本模块级必须全命中
let modHit = 0;
attack.forEach(t => { if (checkSilenceImputation(t).hit) modHit++; });
console.log(`模块级攻击命中：${modHit}/${attack.length}`);
process.exit(aBad.length === 0 && bBad.length === 0 && modHit === attack.length ? 0 : 1);
