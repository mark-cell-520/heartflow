'use strict';
// 找 BURDEN × EXEMPT 同时为真的形状：置空 EXEMPT 后必须由 miss 变 hit
const { checkProceduralBurden, __internals } = require('../src/procedural-burden.js');
const i = __internals();
const cands = [
  '按规定要先审批，我已把材料补齐提交上去了。',
  '按规定这一步要过会审批，我已经帮你提交了材料并跟进中。',
  '按流程要签字审批，我先把材料准备好，然后一起去。',
  '需要领导签字，我先把方案写好再一起去。',
  '按制度要上会审议，我已把你的意见原样带上去。',
  'Per policy this requires approval; I have already submitted the documents.',
  'Under the rules this needs sign-off; I have prepared the documents.',
  'The procedure requires approval and I have already filed the request.',
];
for (const s of cands) {
  const bz = i.BURDEN_ZH.test(s), be = i.BURDEN_EN.test(s);
  const ez = i.EXEMPT_ZH.test(s), ee = i.EXEMPT_EN.test(s);
  const hit = checkProceduralBurden(s).hit;
  console.log(`hit=${hit} BURDEN_ZH=${bz} BURDEN_EN=${be} EXEMPT_ZH=${ez} EXEMPT_EN=${ee} :: ${JSON.stringify(s)}`);
}
