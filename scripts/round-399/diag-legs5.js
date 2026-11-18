// r399 诊断 5：EN credit_surrender idx2（c03）为何与 idx0（c01）共命中
const mod = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/plugins/sycophancy-check/index.js');
const legs = mod.EN_SIGNALS.credit_surrender;
const text = 'My own efforts were irrelevant — the win was all yours.';
legs.forEach((p, i) => console.log(`c0${i + 1}`, p.test(text) ? 'HIT' : 'miss'));
console.log('--- c01 source ---');
console.log(legs[0].source);
console.log('--- c03 source ---');
console.log(legs[2].source);
