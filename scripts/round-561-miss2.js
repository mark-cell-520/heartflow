'use strict';
const i = require('../src/anecdote-as-proof.js').__internals();

// 1) 我自己试了挺舒服，说明这套操作办法是安全的。
const T1 = '我自己试了挺舒服，说明这套操作办法是安全的。';
console.log('T1 A1:zh=' + i.ANECDOTE_ZH.test(T1) + ' A2:zh=' + i.UNIVERSAL_ZH.test(T1));
console.log('T1 ANEC #4 leg:', /(?:我|我们)(?:自己|本人|个人|亲自)(?:用|吃|试|测|开|买|经历)/.test(T1));
console.log('T1 ANEC #7 leg:', /(?:我|我们)(?:自己|本人|个人|亲自)?(?:感觉|觉得|体感)(?:好多了|好一些|好些了|很不错|挺好|有效果|有改善|舒服多了)/.test(T1));
console.log('T1 A2 candidates:');
for (const lit of [
  '(?:这|那)(?:套|个|种|类)?(?:流程|操作|办法|方式|做法)(?:是|才是|算是|真的)(?:安全|可靠|稳妥|没有隐患|不会有问题)的',
  '(?:说明|证明|可见)(?:这|那)(?:套)?(?:流程|操作|办法|方式|做法)(?:是|真的)?(?:安全|可靠|稳妥)',
  '(?:可见|说明|证明|足以表明|足以证明)(?:这|那)?(?:课|法子|办法|方法|方案|产品|流程|操作|做法|服务|机构|平台)?(?:是|真的|确实|算)?(?:有效|靠谱|管用|可行|安全|可靠|稳妥|有效果)',
]) {
  const re = new RegExp(lit);
  console.log('   ' + re.test(T1) + ' :: ' + lit.slice(0, 50));
}
console.log('T1 substr around 挺舒服:', JSON.stringify(T1.slice(2, 12)));

// 2) ADVICE_GUARD 置空 → 样本应变红
const T2 = '我朋友也这样，不过你最好先去做个检查再判断。';
console.log('\nT2 A1=' + i.ANECDOTE_ZH.test(T2) + ' A2=' + i.UNIVERSAL_ZH.test(T2) + ' AG=' + i.ADVICE_GUARD.test(T2));

// 3) SELF_LIMIT_ZH 置空 → 样本应变红
const T3 = '我朋友吃完就觉得不错，这只是他的个人体验，不足以说明什么。';
console.log('T3 A1=' + i.ANECDOTE_ZH.test(T3) + ' A2=' + i.UNIVERSAL_ZH.test(T3) + ' SL=' + i.SELF_LIMIT_ZH.test(T3));
for (const lit of [
  '(?:用|吃|试|开|买)了?(?:都|全)?(?:有效|有用|管用|好|不错|有效果)',
  '(?:这|那)?(?:只)?(?:是|算是|不过是)(?:我|我们)(?:的)?(?:个人|个体|单个|单独)(?:体验|经验|经历|感受|案例|个例|情况)',
]) {
  console.log('   ' + new RegExp(lit).test(T3) + ' :: ' + lit.slice(0, 46));
}
