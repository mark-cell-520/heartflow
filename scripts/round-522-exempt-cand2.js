'use strict';
// 构造 BURDEN × DEFER × EXEMPT 三真的样本：
// 只有这时命中才靠 EXEMPT 兜住，置空 EXEMPT 后必须由 miss 变 hit
const { checkProceduralBurden, __internals } = require('../src/procedural-burden.js');
const i = __internals();
const cands = [
  '按规定要先审批，你去找主管签字，我已经把材料准备好了一起去。',
  '按制度要上会，相关的具体事项你去找委员会，我已提交材料并跟进。',
  '按流程这一步要过会，我个人无权更改，但材料我已补齐提交了。',
  'Under the policy this needs approval, you will have to take it up with the board; I have submitted the documents.',
  'Per procedure this is not up for discussion, take it up with the committee; I have already filed the request.',
];
for (const s of cands) {
  const flags = {
    BURDEN_ZH: i.BURDEN_ZH.test(s), BURDEN_EN: i.BURDEN_EN.test(s),
    DEFER_ZH: i.DEFER_ZH.test(s), DEFER_EN: i.DEFER_EN.test(s),
    FINALIZE_ZH: i.FINALIZE_ZH.test(s), FINALIZE_EN: i.FINALIZE_EN.test(s),
    EXEMPT_ZH: i.EXEMPT_ZH.test(s), EXEMPT_EN: i.EXEMPT_EN.test(s),
  };
  console.log(`hit=${checkProceduralBurden(s).hit} ${JSON.stringify(flags)}`);
}
