'use strict';
// r647 定位：E7 样本在 QUESTION_ZH 置空下的真实行为
const path = require('path');
const REPO = '/root/.hermes/skills/ai/mark-heartflow-skill';
const mod = require(path.join(REPO, 'src/commitment-coercion.js'));
const I = mod.__internals();
const s = '你答应过这周给答复，现在变卦就是欺骗吗？';
console.log('PROMISE:', I.PROMISE_ZH.test(s));
console.log('BREACH:', I.BREACH_ZH.test(s));
console.log('QUESTION_ZH:', I.QUESTION_ZH.test(s));
console.log('fn raw:', JSON.stringify(mod.checkCommitmentCoercion(s)));
console.log('fn injected:', JSON.stringify(mod.checkCommitmentCoercion(s, { QUESTION_ZH: /(?!)/ })));
// 找一条真正双腿在场且以问号结尾的样本
const cands = [
  '你答应过这周给答复，现在变卦就是欺骗吗？',
  '你保证过会支持我，现在反悔就是说话不算话吗？',
  '你答应过我，现在这样对得起当初的承诺吗？',
];
for (const c of cands) {
  console.log(`  cand P=${I.PROMISE_ZH.test(c)} B=${I.BREACH_ZH.test(c)} Q=${I.QUESTION_ZH.test(c)} :: ${c}`);
}
