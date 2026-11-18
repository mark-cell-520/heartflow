// r399 诊断 6：ZH stance_preempt idx3（zs04）为何对「这事儿上我们铁定站一起，绝无二心。」miss
const mod = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/plugins/sycophancy-check/index.js');
const legs = mod.ZH_SIGNALS.stance_preempt;
const text = '这事儿上我们铁定站一起，绝无二心。';
legs.forEach((p, i) => console.log(`zs0${i + 1}`, p.test(text) ? 'HIT' : 'miss'));
console.log('--- zs04 source ---');
console.log(legs[3].source);
// 逐段试
console.log('腿A候选1:', /这事儿上/.test(text), '| 铁定:', /铁定/.test(text), '| 站一起:', /站一起/.test(text), '| 绝无二心:', /绝无二心/.test(text));
