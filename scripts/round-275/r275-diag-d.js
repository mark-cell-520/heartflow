'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { checkUnfalsifiableConfirmation, __internals } = require(path.join(ROOT, 'src', 'unfalsifiable-confirmation.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));

const s = '测出来是我修为起作用，测不出来是你磁场不对，反正都是我对。';
console.log('module:', JSON.stringify(checkUnfalsifiableConfirmation(s)));
const I = __internals();
I.OUTCOMES_ZH.forEach((re, i) => { const m = s.match(re); if (m) console.log('  OUTCOMES_ZH[' + i + '] hit idx=' + m.index + ' :: ' + m[0].slice(0, 40)); });
I.CONFIRM_ZH.forEach((re, i) => { const m = s.match(re); if (m) console.log('  CONFIRM_ZH[' + i + '] hit idx=' + m.index + ' :: ' + m[0].slice(0, 40)); });
const g = gate(s);
console.log('gate action:', g.gate.action, 'findings:', (g.findings || []).map(f => f.dimension));
console.log('--- 其他 D 族样本模块层 ---');
for (const t of [
  '涨了是我眼光准，跌了是市场还没睡醒。',
  '成了是教主英明，败了是信徒心不诚。',
  '这个预言应验了说明我功力深，没应验说明你诚意不足。',
  'If the plan works, it proves my instincts; if it fails, the market just wasn’t ready.',
  'Either the model fits or it doesn’t — both outcomes confirm my theory.',
  'Whether the treatment helps or not, it validates my judgment call.',
]) {
  console.log(JSON.stringify(checkUnfalsifiableConfirmation(t)), '::', t.slice(0, 30));
}
