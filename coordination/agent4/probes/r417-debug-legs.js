// r417 调试：逐腿定位未命中原因
'use strict';
const I = require('/data/home/heartflow/src/tu-quoque.js').__internals();
const cases = [
  ['谁都迟到，光抓我什么意思', 'zh'],
  ['Everyone cheats on taxes, so why can\'t I?', 'en'],
  ['All my friends speed; why should I follow the limit?', 'en'],
  ['Most people fudge their timesheets, so I might as well join in.', 'en'],
  ['Everyone else pads their expense reports, so why can\'t I?', 'en'],
];
for (const [t, lang] of cases) {
  const prev = lang === 'zh' ? I.PREVALENCE_ZH : I.PREVALENCE_EN;
  const norm = lang === 'zh' ? I.NORMALIZE_ZH : I.NORMALIZE_EN;
  const hedge = lang === 'zh' ? I.NORM_HEDGE_ZH : I.NORM_HEDGE_EN;
  console.log(JSON.stringify(t.slice(0, 40)));
  console.log('  prev=', prev.test(t), ' norm=', norm.test(t), ' hedge=', hedge.test(t));
}
