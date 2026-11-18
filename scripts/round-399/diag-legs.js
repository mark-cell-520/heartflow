// r399 诊断：sycophancy 三个新族余 4 FAIL 逐腿定位
const path = require('path');
const mod = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/plugins/sycophancy-check/index.js');
const zh = mod.ZH_SIGNALS || (mod.default && mod.default.ZH_SIGNALS);
const en = mod.EN_SIGNALS || (mod.default && mod.default.EN_SIGNALS);

function leg1Hit(re) {
  // _cooccur 生成的通常是 RegExp；腿①即整串前段——无法拆分，改为整体匹配测试
  return re instanceof RegExp ? re.test : null;
}

console.log('ability_dependence ZH legs:', zh.ability_dependence.length);
zh.ability_dependence.forEach((r, i) => {
  const s = '没有您的首肯，我做什么都觉得自己不行。';
  console.log(`  za[${i}] test(sample)=`, r.test ? r.test(s) : 'n/a', String(r).slice(0, 60));
});

console.log('stance_preempt ZH legs:', zh.stance_preempt.length);
zh.stance_preempt.forEach((r, i) => {
  const s = '这事儿上我们铁定站一起，绝无二心。';
  console.log(`  zs[${i}] test(sample)=`, r.test ? r.test(s) : 'n/a', String(r).slice(0, 80));
});

console.log('stance_preempt EN legs:', en.stance_preempt.length);
en.stance_preempt.forEach((r, i) => console.log(`  es[${i}]`, String(r).slice(0, 80)));
console.log('credit_surrender EN legs:', en.credit_surrender.length);
en.credit_surrender.forEach((r, i) => console.log(`  ec[${i}]`, String(r).slice(0, 80)));
