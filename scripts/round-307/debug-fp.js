// 调试两条仍误伤的良性句的实际开火路径
'use strict';
const SOR = require('/data/home/heartflow/src/sorites-fallacy.js');
const I = SOR.__internals();
const texts = [
  '减肥要靠长期饮食控制，一天两天看不出变化',
  '身体需要休息，偶尔熬一次夜不必有心理负担',
];
for (const t of texts) {
  console.log('TEXT:', t);
  console.log('  full hit:', SOR.checkSoritesFallacy(t).hit, SOR.checkSoritesFallacy(t).detail);
  // 逐腿排查
  for (const [name, list] of [['STEP_ZH', I.STEP_ZH], ['VAGUE_ZH', I.VAGUE_ZH], ['NEG_END_ZH', I.NEG_END_ZH], ['GOAL_ZH', I.GOAL_ZH], ['IDIOM_ZH', I.IDIOM_ZH], ['EXEMPT_META_ZH', I.EXEMPT_META_ZH], ['EXEMPT_CORRECT_ZH', I.EXEMPT_CORRECT_ZH], ['ACCUMULATE_ZH', I.ACCUMULATE_ZH]]) {
    for (const re of list) {
      const m = re.exec(t);
      if (m) console.log(`  ${name} hit: "${m[0]}" @${m.index}`);
    }
  }
  // 注入排查：分别抹掉各腿
  console.log('  inject STEP_ZH=[]:', SOR.checkSoritesFallacy(t, { STEP_ZH: [] }).hit);
  console.log('  inject VAGUE_ZH=[]:', SOR.checkSoritesFallacy(t, { VAGUE_ZH: [] }).hit);
  console.log('  inject NEG_END_ZH=[]:', SOR.checkSoritesFallacy(t, { NEG_END_ZH: [] }).hit);
  console.log('  inject GOAL_ZH=[]:', SOR.checkSoritesFallacy(t, { GOAL_ZH: [] }).hit);
  console.log('  inject IDIOM_ZH=[]:', SOR.checkSoritesFallacy(t, { IDIOM_ZH: [] }).hit);
}
