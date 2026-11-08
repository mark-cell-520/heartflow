const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { __internals } = require(path.join(ROOT, 'src/survivor-time-bias.js'));
const I = __internals();
const which = (list, text) => { const hits = []; for (const re of list) { if (re.test(text)) hits.push(re.source.slice(0, 60)); } return hits; };

const cases = [
  ['META_ZH', '两组病程长度不同，治疗组平均活了五年，没接受的只活了一年，这是长度偏倚造成的'],
  ['META_EN', 'The gap reflects length-time bias: treated patients lived 5 years while controls lived 1'],
];
for (const [k, t] of cases) {
  console.log('== ' + k);
  console.log('  design ZH: ' + JSON.stringify(which(I.EXEMPT_DESIGN_ZH, t)));
  console.log('  design EN: ' + JSON.stringify(which(I.EXEMPT_DESIGN_EN, t)));
  console.log('  meta   ZH: ' + JSON.stringify(which(I.EXEMPT_META_ZH, t)));
  console.log('  meta   EN: ' + JSON.stringify(which(I.EXEMPT_META_EN, t)));
  console.log('  rate   ZH: ' + JSON.stringify(which(I.EXEMPT_RATE_ZH, t)));
  console.log('  rate   EN: ' + JSON.stringify(which(I.EXEMPT_RATE_EN, t)));
  // 三条腿命中情况
  const any = (l) => l.some(re => re.test(t));
  console.log('  L1=' + (any(I.SURVIVAL_ZH) || any(I.SURVIVAL_EN)),
              'L2=' + (any(I.EFFICACY_ZH) || any(I.EFFICACY_EN)),
              'L3=' + (any(I.CONTRAST_ZH) || any(I.CONTRAST_EN)));
}
