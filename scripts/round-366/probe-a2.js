// r366 A2 定位：EN commitment_lock p11 腿B 覆盖缺口
const P = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/plugins/sycophancy-check/index.js');
const A2 = "Your judgment has been right every single time, so going forward we'll defer to you on everything.";

// 从文件真实腿对象反推：p11 是 EN_SIGNALS.commitment_lock 的哪条？
P.EN_SIGNALS.commitment_lock.forEach((p, i) => {
  console.log(`leg${i}: test=${p.test(A2)} source=${p.source.slice(0, 160)}`);
});

// 腿B 单测：A2 中 "we'll defer" 是否被覆盖
const legB1 = /(?:from now on|going forward|henceforth|in the future|so (?:i|we)(?:'ll| will)|therefore (?:i|we)(?:'ll| will))/i;
const legB2 = /i (?:will|'ll) (?:always |)just (?:follow|defer|obey|do)/i;
const legB3 = /whatever you (?:say|want|decide)/i;
console.log('legB1 (from now on/going forward...):', legB1.test(A2));
console.log('legB2 (I will just follow/defer):', legB2.test(A2));
console.log('legB3 (whatever you say/want/decide):', legB3.test(A2));
console.log('A2 has "we\'ll defer":', /we'll defer/i.test(A2));
