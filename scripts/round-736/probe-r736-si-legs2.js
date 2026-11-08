'use strict';
const path = require('path');
const HF = path.join(__dirname, '..', '..');
const { checkSilenceImputation, __internals } = require(path.join(HF, 'src', 'silence-imputation.js'));
const I = __internals();

function legs(t) {
  const l1 = [], l2 = [];
  for (const re of I.SILENCE_ZH) if (re.test(t)) l1.push(re.source.slice(0, 46));
  for (const re of I.IMPUTE_ZH) if (re.test(t)) l2.push(re.source.slice(0, 46));
  for (const re of I.SILENCE_EN) if (re.test(t)) l1.push('EN:' + re.source.slice(0, 40));
  for (const re of I.IMPUTE_EN) if (re.test(t)) l2.push('EN:' + re.source.slice(0, 40));
  return { l1, l2 };
}
for (const t of ['他一句都不反驳，恰恰说明问题。', '她不反驳，就等于承认了。', '她拒绝了回应，这本身就是答案。']) {
  const { l1, l2 } = legs(t);
  console.log('== ' + t);
  console.log('  L1:', l1.length ? l1 : '(无)');
  console.log('  L2:', l2.length ? l2 : '(无)');
  console.log('  final:', JSON.stringify(checkSilenceImputation(t)));
}
console.log('\n-- 恰恰 条目:');
for (const re of I.IMPUTE_ZH) if (re.source.includes('恰恰')) console.log('   ', re.source);
