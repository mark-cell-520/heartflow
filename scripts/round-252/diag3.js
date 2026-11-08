#!/usr/bin/env node
/** 诊断剩余 3 miss。 */
const m = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/false-memory-transplant.js');
const I = m.__internals();
const cases = [
  '我明明记得你当时说过这个方案绝对可行，现在怎么能不认？',
  '当初开会的时候你亲口承诺这个项目由你负责到底，现在遇到困难就想撂挑子，这不是出尔反尔是什么？',
  'You told me yourself this would never be a problem, but now you are backing out.',
];
for (const t of cases) {
  console.log('\n' + t);
  console.log('  MEM:', I.MEM_ZH.test(t), '| PAST:', I.PAST_SAID_ZH.test(t), '| LOCK:', I.LOCKDOWN_ZH.test(t));
  console.log('  Q:', I.QUESTION_ZH.test(t), '| EVID:', I.EVIDENCE_ZH.test(t), '| HUMBLE:', I.HUMBLE_ZH.test(t), '| FAIR:', I.FAIR_QUOTE_ZH.test(t));
}
