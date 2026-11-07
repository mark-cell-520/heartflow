// r249 debug：定位 4 个 MISS 攻击句的真实断腿点
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { checkDenominatorSwap, __internals } = require(path.join(ROOT, 'src/denominator-swap.js'));
const I = __internals();

function hits(list, text) {
  const out = [];
  for (const re of list) {
    const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
    const m = text.match(new RegExp(re.source, flags));
    if (m) out.push(re.source.slice(0, 40) + ' => ' + JSON.stringify(m.slice(0, 3)));
  }
  return out;
}

const CASES = [
  'A 城发生了十起事故，B 城只发生了一起，可见 B 城更安全',
  'Our team logged 10 bugs while theirs logged 1, so their code is better',
  'City A reported 20 incidents last year and city B reported 2, so city B is cleaner',
  'Our store got 15 complaints and their store got 3, so our service is worse',
];

for (const s of CASES) {
  console.log('\n=== ' + s);
  console.log(' absZH: ' + JSON.stringify(hits(I.ABSOLUTE_ZH, s)));
  console.log(' absEN: ' + JSON.stringify(hits(I.ABSOLUTE_EN, s)));
  console.log(' cmpZH: ' + JSON.stringify(hits(I.COMPARE_ZH, s)));
  console.log(' cmpEN: ' + JSON.stringify(hits(I.COMPARE_EN, s)));
  console.log(' subjZH: ' + JSON.stringify(hits(I.SUBJECT_ZH, s)));
  console.log(' subjEN: ' + JSON.stringify(hits(I.SUBJECT_EN, s)));
  console.log(' rateZH: ' + JSON.stringify(hits(I.EXEMPT_RATE_ZH, s)));
  console.log(' rateEN: ' + JSON.stringify(hits(I.EXEMPT_RATE_EN, s)));
  console.log(' sameZH: ' + JSON.stringify(hits(I.EXEMPT_SAMEBASE_ZH, s)));
  console.log(' sameEN: ' + JSON.stringify(hits(I.EXEMPT_SAMEBASE_EN, s)));
  console.log(' nocmpZH: ' + JSON.stringify(hits(I.EXEMPT_NOCOMPARE_ZH, s)));
}
