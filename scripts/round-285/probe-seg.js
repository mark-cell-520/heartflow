// 探针：为何删前瞻后 NEG 句子仍不被该判据命中？
// 拆解 `is\s+(?!not\b|n't\b)` 之后的部分，看 not 是被哪一层拦掉的。
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const IDX = 4919;
const line = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8').split('\n')[IDX];
const m = line.match(/\/((?:[^\/\\]|\\.)+)\/([gimsuy]*)/);
const body = m[1];

const samples = {
  'neg_full': 'Every user is not responsible for downtime.',
  'pos_full': 'Every user is a fool.',
  'neg_short': 'Every user is not a member.',
  'pos_short': 'Every user is a member.',
  'neg_isnt': "Every user isn't a fool.",
};

// 逐段测试：从判据中切出 is\s+ 之后到列表结尾
function seg(afterIs) {
  return new RegExp('\\b(?:everyone|everybody|every|each)(?:\\s+\\w+){0,2}\\s+(?:users?)\\s+(?:is|are)\\s+' + afterIs, 'i');
}
const variants = {
  'with_neg': "(?!not\\b|n't\\b)(?:a\\s+|an\\s+)?(?:fools?|idiots?|liars?)",
  'no_neg': "(?:a\\s+|an\\s+)?(?:fools?|idiots?|liars?)",
  'bare_words': "(?:fools?|idiots?|liars?)",
  'no_neg_loose': "(?:not\\s+|isn't\\s+|n't\\s+)*(?:a\\s+)?(?:fools?|idiots?|liars?)",
};
for (const [name, v] of Object.entries(variants)) {
  let re;
  try { re = seg(v); } catch (e) { console.log(name + ' COMPILE_ERR ' + e.message.slice(0, 60)); continue; }
  const out = {};
  for (const [k, s] of Object.entries(samples)) out[k] = re.test(s);
  console.log(name.padEnd(14), JSON.stringify(out));
}
