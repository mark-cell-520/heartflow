'use strict';
const I = require('/data/home/heartflow/src/immortal-time-bias.js');
const it = I.__internals();
const t = '筛查推广后，浮现出许多无症状感染者，表明患病率确实在升高。';
console.log('WIN_LEAD_ZH =', it.WIN_LEAD_ZH, 'WIN_LEAD_EN =', it.WIN_LEAD_EN);
console.log('LEAD_SCREEN_ZH hit:', it.LEAD_SCREEN_ZH.map(re => (t.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')) || [null])[0]).filter(Boolean));
console.log('DETECT_UP_ZH hit:', it.DETECT_UP_ZH.map(re => (t.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')) || [null])[0]).filter(Boolean));
console.log('DETECT_UP_ZH5 hit:', it.DETECT_UP_ZH5.map(re => (t.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')) || [null])[0]).filter(Boolean));
console.log('CASE_SURGE_ZH4 hit:', it.CASE_SURGE_ZH4.map(re => (t.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')) || [null])[0]).filter(Boolean));
console.log('INCIDENCE_CLAIM_ZH hit:', it.INCIDENCE_CLAIM_ZH.map(re => (t.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')) || [null])[0]).filter(Boolean));
console.log('module result:', JSON.stringify(I.checkImmortalTimeBias(t)));
// 对照：D 攻击第 1 句（命中）
const t2 = '随着检测普及，浮出大量潜伏病例，这说明这种病真的在变多。';
console.log('t2 module result:', JSON.stringify(I.checkImmortalTimeBias(t2)));
