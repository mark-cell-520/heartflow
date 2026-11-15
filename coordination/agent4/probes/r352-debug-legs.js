'use strict';
// r352 debug: why are 2 of B attacks already blocked? which legs carry them?
const { checkImmortalTimeBias, __internals: I } = require('/data/home/heartflow/src/immortal-time-bias.js');
const int = I();
const blocked = [
  'Thanks to sensitive testing, many more cases have been identified, which suggests the disease is really becoming more widespread.',
  'Thanks to more precise testing, far more cases have been detected, indicating the disease is genuinely becoming more widespread.',
];
const pens = [
  'With advanced testing, far more cases are being detected, suggesting the cancer is truly spreading.',
  'Improved testing has identified numerous additional cases, which suggests the disease is truly becoming more common.',
];
for (const s of blocked.concat(pens)) {
  const r = checkImmortalTimeBias(s);
  console.log('hit=' + r.hit + ' :: ' + s.slice(0, 60));
  if (r.hit) {
    // 逐腿置空实验：找承重腿①
    for (const k of ['DETECT_UP_EN', 'DETECT_UP_EN4', 'LEAD_SCREEN_ZH', 'LEAD_SCREEN_EN', 'DETECT_UP_ZH', 'DETECT_UP_ZH4']) {
      const inj = {}; inj[k] = [];
      if (!checkImmortalTimeBias(s, inj).hit) console.log('   leg1 carried by ' + k);
    }
    for (const k of ['CASE_SURGE_EN', 'CASE_SURGE_EN2', 'CASE_SURGE_EN3', 'CASE_SURGE_EN4', 'CASE_SURGE_ZH', 'CASE_SURGE_ZH2', 'CASE_SURGE_ZH3']) {
      const inj = {}; inj[k] = [];
      if (!checkImmortalTimeBias(s, inj).hit) console.log('   leg2 carried by ' + k);
    }
    for (const k of ['INCIDENCE_CLAIM_EN', 'INCIDENCE_CLAIM_EN2', 'INCIDENCE_CLAIM_ZH', 'INCIDENCE_CLAIM_ZH2']) {
      const inj = {}; inj[k] = [];
      if (!checkImmortalTimeBias(s, inj).hit) console.log('   leg3 carried by ' + k);
    }
  }
}
// A 攻击逐腿置空：证腿①②已被覆盖、仅腿③缺口（用当前树跑，应仍 hit 因系词缺口不在这）
console.log('--- A attacks leg check (current tree) ---');
const aAtk = [
  'After the screening program expanded, far more cases were being diagnosed each year, which showed the disease was truly spreading.',
  'Mass screening campaigns mean numerous additional cases are being surfaced, revealing that the disease was truly spreading.',
  'With wider screening, many more cases were brought to light, and it became clear the disease was truly on the rise.',
];
for (const s of aAtk) {
  const r = checkImmortalTimeBias(s);
  console.log('hit=' + r.hit + ' :: ' + s.slice(0, 50));
  if (!r.hit) {
    // 找缺失腿：置空候选腿常量后仍不 hit 的不管；反向——把各腿表逐个“放宽”不可行，
    // 改为逐腿置空看哪些置空不改变（本就未命中），再直接测试各腿正则是否命中文本
    const legs = {
      leg1: [].concat(int.LEAD_SCREEN_EN, int.DETECT_UP_EN, int.DETECT_UP_EN4),
      leg2: [].concat(int.CASE_SURGE_EN, int.CASE_SURGE_EN2, int.CASE_SURGE_EN3, int.CASE_SURGE_EN4),
      leg3: [].concat(int.INCIDENCE_CLAIM_EN, int.INCIDENCE_CLAIM_EN2),
    };
    for (const [name, arr] of Object.entries(legs)) {
      const any = arr.some(re => { re.lastIndex = 0; return re.test(s); });
      console.log('   ' + name + ' anyRegexMatch=' + any);
    }
  }
}
