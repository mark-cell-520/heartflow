// scripts/round-730-gate-check.js
// r730 gate 层检查：本轮 silence_imputation 扩展样本在 gate.checkOutput()
// 上的动作变化——漏判样本（原 pass）应改判 verify/rewrite/block，良性样本
// 必须保持 pass。归因：命中维度键须含 silence_imputation。
const path = require('path');
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', 'src', 'index.js'));

const act = t => { try { return gate.checkOutput(t).gate.action; } catch (e) { return 'ERROR:' + e.message; } };
function attr(t) {
  const d = idx.discriminate(t);
  const dims = d.dimensions || {};
  return Object.keys(dims).filter(k => {
    const v = dims[k];
    if (!v || typeof v !== 'object' || k === 'evidence') return false;
    const c = v.count !== undefined ? v.count : v.totalHits !== undefined ? v.totalHits : (Array.isArray(v.hits) ? v.hits.length : 0);
    return c > 0;
  }).join(',');
}

const attack = [
  '他缄口不言，所以这事是真的。',
  '她未发一言，可见确有其事。',
  '当事人未置一词，等于默认了。',
  '他始终不言语，足见心里有鬼。',
  '他不搭腔，这本身就说出了答案。',
  '她始终没开过口，可见确有其事。',
  '面对追问，他闭口不言，这说明了一切。',
  '她闭口不谈此事，等于默认了。',
  '他拒不开口，这本身就是答案。',
  '她未置一辞，足见心虚。',
  '他全程未发一语，印证了指控。',
  '当事人至今没有说法，足见其心虚。',
  '她一声不吭，说明指控属实。',
  'He stayed mum about the payments, which speaks for itself.',
  'She kept mum on the allegations, so they must be true.',
  'Not a word was said by the suspect, which is telling.',
  'He remained tight-lipped, which confirms his guilt.',
  'He passed on the chance to comment, so it must be true.',
  'The company offered no explanation, which confirms the allegations.',
  'Not a single word was uttered, which is telling.',
  '他没否认，足见其心虚。',
  '她不回应，说明她在撒谎。',
  '没有回应恰恰证明，这事是真的。',
  '他拒绝回答，这就印证了指控。',
  '她不澄清，显然心里有鬼。',
  '她没有辟谣，显然是真的。',
  'No response was issued, which confirms his guilt.',
  "He didn't deny it, which suggests he's guilty.",
  'Her silence all but proves the allegations.',
  '他没有回应，which confirms his guilt.',
  '足见其心虚，他一句话都没说。',
];

const benign = [
  '他缄口不言，直到律师到场。',
  '她全程未发一言，这是她的合法权利。',
  '公司决定不置评，等调查结果出来。',
  '他拒不吭声，因为警方建议他保持沉默。',
  '当事人保持缄默，不等于认罪。',
  '他不言语，只是安静地听完了整场会议。',
  'He stayed mum until his lawyer arrived.',
  'She kept mum, which is her right.',
  'Not a word was said, and that does not mean he is guilty.',
  'The suspect remained silent, as his counsel advised.',
  '他没否认，因为事情还在调查中。',
  '她不回应，是为了不给传闻增加热度。',
  '保持沉默是当事人的权利，不能据此定罪。',
  'This is the argument from silence fallacy.',
  '他没回应，所以这事根本没有办法推进。',
  '她一言不发地坐在那里，谁也没有觉得异常。',
  '他一句话都没说，只是静静听着。',
  '她始终没开过口，因为嗓子哑了。',
  '他闭口不谈此事，是律师的建议。',
  '他拒不开口，直到审讯程序结束。',
  '她未置一辞，转身离开了会场。',
  '他没有作声，谁也没有注意到。',
  '当事人至今没有说法，大家还在等。',
  'She would not budge on the price.',
  'He passed on the chance to comment at the press conference.',
  'The company offered no explanation before the deadline.',
  'Not a single word was uttered during the minute of silence.',
  'He remained tight-lipped throughout the deposition.',
  '她一声不吭地修完了整台机器。',
  '他闭口不谈细节，因为签了保密协议。',
  'His silence does not mean he is guilty.',
  '不能足见其心虚。',
  '这不表明他在撒谎。',
  '沉默不足以证明其心虚。',
];

// 已知预存污染样本（r730 动手前 git stash 复测 v6.8.156 HEAD 同行为，
// 归因均为别族）：gate 级 verify 不是本族新增误伤，silence_imputation
// 模块级零命中（见 test/negative-test-silence-imputation-r730.js 良性对照）。
const PREEXISTING = {
  '他没有作声，谁也没有注意到。': 'contradiction',
  'Not a single word was uttered during the minute of silence.': 'hasty_generalization',
  '沉默不足以证明其心虚。': 'fallacies',
};

let aPass = 0, aOk = 0; const aBad = [];
attack.forEach((t, i) => {
  const a = act(t);
  const at = attr(t);
  if (a === 'pass') { aPass++; aBad.push(`A${i + 1} 仍 pass [${at}]: ${t}`); }
  else if (!at.split(',').includes('silence_imputation')) aBad.push(`A${i + 1} ${a} 但归因无 silence_imputation [${at}]: ${t}`);
  else aOk++;
});
let bPass = 0, bBad = [], preOk = 0, preBad = [];
benign.forEach((t, i) => {
  const a = act(t);
  if (a === 'pass') bPass++;
  else if (PREEXISTING[t]) {
    const at = attr(t);
    if (at.split(',').includes(PREEXISTING[t]) && !at.split(',').includes('silence_imputation')) preOk++;
    else preBad.push(`B${i + 1} 预存污染归因变化 [${at}]（应含且仅含 ${PREEXISTING[t]}）: ${t}`);
  }
  else bBad.push(`B${i + 1} ${a} [${attr(t)}]: ${t}`);
});

console.log(`攻击非 pass 且归因 silence_imputation：${aOk}/${attack.length}`);
aBad.forEach(m => console.log('  BAD ' + m));
console.log(`良性保持 pass：${bPass}/${benign.length - Object.keys(PREEXISTING).length}`);
bBad.forEach(m => console.log('  FP ' + m));
console.log(`预存污染样本归因不变（别族触发，本族零命中）：${preOk}/${Object.keys(PREEXISTING).length}`);
preBad.forEach(m => console.log('  BAD ' + m));
const ok = aBad.length === 0 && bBad.length === 0 && preBad.length === 0 && aOk === attack.length;
console.log(ok ? '✅ gate 层检查通过' : '❌ gate 层检查未通过');
process.exit(ok ? 0 : 1);
