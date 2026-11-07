// scripts/round-730-silence-probe.js
// r730 轮初复测：silence_imputation（第 213 维，r717 上线）残余缺口探测。
// 攻击族 = 腿①近形（缄口/闭口/未发一言/未置一词/拒不开口/一句话都没说/
//          没开过口/不言语/不搭腔/EN mum/tight-lipped/not a word/would not
//          budge/offered no explanation）+ 腿②新形（足见其心虚/说明他在
//          撒谎/恰恰证明+逗号/印证了指控/EN confirms his guilt/suggests he
//          is guilty）。
// 良性族 = 同形沉默的客观陈述 + 正确响应形 + 否定形，要求零误伤。
const { checkSilenceImputation } = require('../src/silence-imputation.js');

const attack = [
  // ── 腿① ZH 近形 ──
  '他缄口不言，所以这事是真的。',
  '面对指控，他缄口不语，这说明了一切。',
  '她未发一言，可见确有其事。',
  '他拒不吭声，这本身就是答案。',
  '当事人未置一词，等于默认了。',
  '他始终不言语，足见心里有鬼。',
  '他不搭腔，这本身就说出了答案。',
  '他一句话都没说，所以这事是真的。',
  '她始终没开过口，可见确有其事。',
  '面对追问，他闭口不言，这说明了一切。',
  '她闭口不谈此事，等于默认了。',
  '他拒不开口，这本身就是答案。',
  '她未置一辞，足见心虚。',
  '他全程未发一语，印证了指控。',
  '当事人至今没有说法，足见其心虚。',
  '她一声不吭，说明指控属实。',
  // ── 腿① EN 近形 ──
  'He stayed mum about the payments, which speaks for itself.',
  'She kept mum on the allegations, so they must be true.',
  'Not a word was said by the suspect, which is telling.',
  'He remained tight-lipped, which confirms his guilt.',
  'She would not budge, which tells you something.',
  'He passed on the chance to comment, so it must be true.',
  'The company offered no explanation, which confirms the allegations.',
  'Not a single word was uttered, which is telling.',
  // ── 腿② ZH 新形 ──
  '他没否认，足见其心虚。',
  '她不回应，说明她在撒谎。',
  '没有回应恰恰证明，这事是真的。',
  '他拒绝回答，这就印证了指控。',
  '她不澄清，显然心里有鬼。',
  '她没有辟谣，显然是真的。',
  // ── 腿② EN 新形 ──
  'No response was issued, which confirms his guilt.',
  "He didn't deny it, which suggests he's guilty.",
  'Her silence all but proves the allegations.',
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
  // ── 对抗良性（同形沉默，无推定）──
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
  // ── 否定/正确响应形 ──
  'His silence does not mean he is guilty.',
  '不能足见其心虚。',
  '这不表明他在撒谎。',
  '沉默不足以证明其心虚。',
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
