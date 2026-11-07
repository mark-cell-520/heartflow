// r233 变体矩阵自测：prosecutors_fallacy
const { detectProsecutorsFallacy } = require('../../src/prosecutors-fallacy.js');

const ATTACKS = [
  // 同族攻击变体 ≥5：中英双语、裸名词、带修饰、倒装、长句
  'DNA匹配的概率只有百万分之一，所以他就是凶手的可能性高达99.9999%。',
  '这种错误只有十亿分之一的概率，因此嫌疑人几乎肯定有罪。',
  '全国十四亿人里只有一个人能匹配上，这个人不是他还能是谁。',
  '匹配概率是千万分之一，所以他是凶手这一事实基本上已经确定。',
  '十亿分之一的巧合恰好落在他头上，足以证明这案子就是他干的。',
  '人群中匹配率只有两百万分之一，故法官可以认定被告就是作案人。',
  '这个血型只占人口的百分之零点三，所以他作案的可能性是99.7%。',
  '检测结果显示统计显著，说明被告有罪。',
  'p值小于0.01，因此被告的清白假设可以被拒绝，他是有罪的。',
  '系统给出了一百万分之一的误报率，所以这个匹配几乎不可能是巧合，他有罪。',
  '一百万人里才有一个能匹配，全市一千万人里也能找出十个来，但他是第一个被测的。',
  'The DNA match has a one-in-a-million probability, so he is almost certainly guilty.',
  'The chance of this match is one in ten billion, therefore the defendant is guilty.',
  'A match this rare occurs once per billion people, so the suspect must be the culprit.',
  'Only one person in a hundred million shares this profile, so he has to be the killer.',
];

const BENIGN = [
  // 良性 ≥5，必须含边缘良性（正确多因陈述 / 正当统计讨论）
  'DNA匹配的概率只有百万分之一，这是检方应当进一步举证的理由，而非定罪的充分条件。',
  '这种错误只有十亿分之一的概率，但仍需结合其他证据才能定罪。',
  '犯罪是多种因素共同造成的，不能只归因于单一动机。',
  '这种血型占人口百分之三十，不能作为认定作案人的依据。',
  'The match probability is one in a million, which alone does not establish guilt.',
  'Wars are caused by many factors acting together.',
  '检察官谬误是法庭科学课堂上的经典案例。',
  'Prosecutor\'s fallacy is a classic logical fallacy in evidence courses.',
  '这种错误的概率只有十亿分之一。',
  '这个概率说明系统很可靠，但仍需人工复核所有异常。',
];

let pass = 0, fail = 0;
for (const t of ATTACKS) {
  const r = detectProsecutorsFallacy(t);
  if (r.hit) { pass++; } else { fail++; console.log('漏判:', t); }
}
console.log('攻击命中: ' + pass + '/' + ATTACKS.length);
let bp = 0, bf = 0;
for (const t of BENIGN) {
  const r = detectProsecutorsFallacy(t);
  if (!r.hit) { bp++; } else { bf++; console.log('误伤:', t, JSON.stringify(r.evidence)); }
}
console.log('良性通过: ' + bp + '/' + BENIGN.length);
