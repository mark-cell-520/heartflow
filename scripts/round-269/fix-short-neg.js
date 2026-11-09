'use strict';
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
const SRC = path.join(REPO, 'src');
const TARGETS = [
  'anchoring-effect.js',
  'count-rate-conflation.js',
  'disposition-effect.js',
  'endowment-effect.js',
  'fundamental-attribution-error.js',
  'law-of-small-numbers.js',
  'loss-aversion.js',
  'money-illusion.js',
  'omission-bias.js',
  'peak-end-rule.js',
  'planning-fallacy.js',
  'present-bias.js',
  'self-selection-bias.js',
  'significance-effect-size.js',
];

// 旧式：裸否定字 + 任意 0-2 字 → 把「非常」「无比」「没错」等非否定语义词
// 当作否定前缀，导致否定守卫误杀裁定腿（r269 实测 law-of-small-numbers
// 攻击句「民意已经非常清楚了」negM=0 穿透）。
const OLD_RE = /const SHORT_NEG_ZH = \/\(\?:不\|没\|未\|无\|非\|莫\|甭\)\[\^。，！？；\\n\]\{0,2\}\$\/;/;

// 新式（r269）：否定字 + 否定语义补语白名单。
// 依据：r245 在 framing-effect 修过同类误杀，但其白名单仍含形容词补语
// （高低多少大小远近好坏对错行完成败足够），会漏误杀「没错」。
// 本轮白名单只收真否定语义字（能愿动词/行为动词/状态动词），
// 不收形容词补语 → 「非常/无比/没错/无关/无恙/无数」全部不误杀，
// 同时「不敢/不可/不能/不让/不是/不要/并不会/并没有/不算/未必/
// 不改变/不影响/不提高/没做过/未能/未曾」守卫全保留。
const NEW_DECL = `const SHORT_NEG_ZH = /(?:不|没|未|无|非|莫|甭)(?:能|可|会|肯|愿|敢|想|要|做|去|来|给|让|信|服|签|买|报|用|算|是|否|止|罢|休|屑|置|改|变|降|升|提|动|响|影|有|必|曾)[^。，！？；\\\\n]{0,2}$/;`;

const NOTE = `// [r269] 收紧 SHORT_NEG_ZH：原式 \`(?:不|没|未|无|非|莫|甭)[^。，！？；\\\\n]{0,2}$\`
// 会把裁定词前的「非常」「无比」「没错」「无关」「无恙」等非否定语义词
// 当作否定前缀，导致否定守卫误杀裁定腿（实测 law-of-small-numbers
// 「我问了五个人……民意已经非常清楚了」negM=0 穿透，count-rate-conflation
// 同类穿透）。新式只认否定字 + 否定语义补语白名单，形容词补语不认。
// 依据 r245 framing-effect 先例，但其白名单仍含形容词补语（高低多少好坏对错），
// 会漏误杀「没错」；本表进一步剔除形容词补语，只留真否定语义字。`;

let changed = 0;
for (const f of TARGETS) {
  const p = path.join(SRC, f);
  const s = fs.readFileSync(p, 'utf8');
  if (!OLD_RE.test(s)) {
    console.log(`SKIP (no old-style): ${f}`);
    continue;
  }
  const out = s.replace(OLD_RE, NOTE + '\n' + NEW_DECL);
  fs.writeFileSync(p, out);
  console.log(`PATCHED: ${f}`);
  changed++;
}
console.log(`\nchanged=${changed}/${TARGETS.length}`);
