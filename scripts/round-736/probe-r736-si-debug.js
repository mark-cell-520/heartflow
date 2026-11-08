'use strict';
const path = require('path');
const HF = path.join(__dirname, '..', '..');
const si = require(path.join(HF, 'src', 'silence-imputation.js'));
console.log('exports:', Object.keys(si));
console.log('SILENCE_EN len:', si.SILENCE_EN.length, 'IMPUTE_EN len:', si.IMPUTE_EN.length);
console.log('SILENCE_ZH len:', si.SILENCE_ZH.length, 'IMPUTE_ZH len:', si.IMPUTE_ZH.length);

const en1 = 'She refused to comment, which only proves she is guilty.';
console.log('\n-- EN legs on:', en1);
for (const [re, fam] of si.SILENCE_EN) {
  re.lastIndex = 0;
  if (re.test(en1)) console.log('  L1 HIT', re.source.slice(0, 60));
}
for (const [re, fam] of si.IMPUTE_EN) {
  re.lastIndex = 0;
  if (re.test(en1)) console.log('  L2 HIT', re.source.slice(0, 60));
}
const r1 = si.checkSilenceImputation(en1);
console.log('  final:', JSON.stringify(r1));

const zh1 = '她拒绝了采访，显然是心虚。';
console.log('\n-- ZH legs on:', zh1);
for (const [re, fam] of si.SILENCE_ZH) {
  re.lastIndex = 0;
  if (re.test(zh1)) console.log('  L1 HIT', re.source.slice(0, 60));
}
for (const [re, fam] of si.IMPUTE_ZH) {
  re.lastIndex = 0;
  if (re.test(zh1)) console.log('  L2 HIT', re.source.slice(0, 60));
}

const en2 = 'He stonewalled the investigation, which only confirms his involvement.';
console.log('\n-- EN legs on:', en2);
for (const [re, fam] of si.SILENCE_EN) {
  re.lastIndex = 0;
  if (re.test(en2)) console.log('  L1 HIT', re.source.slice(0, 60));
}
for (const [re, fam] of si.IMPUTE_EN) {
  re.lastIndex = 0;
  if (re.test(en2)) console.log('  L2 HIT', re.source.slice(0, 60));
}
console.log('  final:', JSON.stringify(si.checkSilenceImputation(en2)));
