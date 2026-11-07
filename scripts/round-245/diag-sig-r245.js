/** r245 findSignatures 直测：定位两条 MISS 在签名层的真实断点 */
const M = require('../../src/framing-effect.js');
// findSignatures 未导出——用 detectFramingEffect + 临时导出通道测
// 直接探测：把 text 传入，逐段二分定位
const { detectFramingEffect } = M;

const parts = [
  '换个说法再讲一遍，听众就改变了对同一个方案的决定',
  '他说成晋级率很高大家蜂拥报名，说成淘汰率不低一哄而散',
  '他说成晋级率很高大家蜂拥报名',           // 只留 pos 半
  '他说成淘汰率不低一哄而散',                 // 只留 neg 半
  '他说成晋级率很高大家蜂拥报名，说成淘汰率不低',
  '蜂拥报名，一哄而散',
  '晋级率很高，淘汰率不低',
];
for (const p of parts) {
  const r = detectFramingEffect(p);
  console.log(`${r.hit ? 'HIT ' : 'MISS'} [${r.count}] ${p}`);
}
// 腿常量在引擎归一化后是否仍命中（测 collect 用的 text 形态）
const I = M.__internals();
const t1 = '换个说法再讲一遍，听众就改变了对同一个方案的决定';
console.log('\n--- t1 legs ---');
console.log('verb:', I.FRAME_VERB_ZH.filter(re => re.test(t1)).length);
console.log('pos :', I.FLIP_POS_ZH.filter(re => re.test(t1)).length);
console.log('neg :', I.FLIP_NEG_ZH.filter(re => re.test(t1)).length);
console.log('posF:', I.POS_FRAME_ZH.filter(re => re.test(t1)).length);
console.log('negF:', I.NEG_FRAME_ZH.filter(re => re.test(t1)).length);
