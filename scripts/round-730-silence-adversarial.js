// scripts/round-730-silence-adversarial.js
// r730 对抗探针：silence_imputation 腿①/腿②扩展的对抗验证。
// 攻击族 = 主探针 33 条 + 刁钻攻击形（代词插入/倒装/跨句混合中英/动词前置）。
// 良性族 = 刁钻良性：拒绝≠沉默（拒不认罪）、mum=妈妈、同形沉默无推定、
//           否定/正确响应形、反问/元话语/对冲/证据豁免形。要求零误伤。
const { checkSilenceImputation } = require('../src/silence-imputation.js');

const attack = [
  // ── 刁钻攻击：代词插入与副词插入 ──
  '面对记者追问，他拒不吭声，足见其心里有鬼。',
  '她未置一词，显然她是默认了。',
  '他始终没开过口，这说明他在逃避。',
  '公司闭口不谈，恰恰印证了指控。',
  '当事人未发一语，这就印证了罪名。',
  '她一声不吭，可见确有其事。',
  '他全程没有说法，等于默认了。',
  // ── 刁钻攻击：中英混排与倒装 ──
  '他没有回应，which confirms his guilt.',
  'She refused to comment，这本身就说明问题。',
  '足见其心虚，他一句话都没说。',
  '显然是真的，她自始至终未发一言。',
  // ── 刁钻攻击：EN 动词前置与 mum/tight-lipped ──
  'He stayed mum about the payments, so the allegations must be true.',
  'She kept mum, which is as good as an admission.',
  'The CEO remained tight-lipped, which tells you something.',
  'The firm offered no explanation, which confirms the allegations.',
  'He passed on the chance to comment, which suggests he is guilty.',
  'Not a single word was uttered, which confirms his guilt.',
];

const benign = [
  // ── 拒绝/否认 ≠ 沉默（本族明确不收）──
  '他拒不认罪，警方还在核实证据。',
  '她拒不赔偿，双方已进入诉讼程序。',
  // ── mum = 妈妈（英式歧义，裸 mum 绝不收）──
  'Mum said nothing and kept cooking dinner.',
  'His mum stayed silent during the whole movie.',
  // ── 同形沉默，无推定腿 ──
  '调查至今没有说法，大家还在等通报。',
  '未发一言的雕像立在广场中央已经一百年了。',
  '他一句话都没说，这完全没有问题。',
  '我们什么都不要说，免得打草惊蛇。',
  'The company stayed mum about the launch date.',
  'He remained tight-lipped during the deposition.',
  'No explanation was offered before the deadline.',
  'Not a word was said, as the ceremony required.',
  // ── 否定/正确响应形 ──
  '他不回应，但这不能证明什么。',
  '她没有辟谣，这不表明她在撒谎。',
  '他拒绝回答，不能印证指控。',
  'His silence cannot be taken as proof of guilt.',
  'She stayed mum, which does not suggest guilt.',
  'He did not confirm his guilt.',
  // ── 豁免形：反问 / 元话语 / 对冲 / 证据 ──
  '他没回应，难道这本身就说明问题吗？',
  '诉诸沉默谬误的典型例子：把不回应当成默认。',
  '或许他不回应只是巧合，别想太多。',
  '依据卷宗第3页，他自始至终没有回应。',
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

console.log(`刁钻攻击命中 ${aHit}/${attack.length}，漏判 ${attack.length - aHit}`);
aMiss.forEach(m => console.log('  MISS ' + m));
console.log(`刁钻良性误伤 ${bHit}/${benign.length}`);
bFalse.forEach(m => console.log('  FP ' + m));
