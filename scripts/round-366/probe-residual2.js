// 定位 A4 命中腿 + EN p13 腿B 缺口
const P = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/plugins/sycophancy-check/index.js');
const A4 = '你从来没带过错路，以后你说啥就是啥。';
P.ZH_SIGNALS.commitment_lock.forEach((p, i) => {
  if (p.test(A4)) console.log(`A4 命中 ZH commitment_lock leg${i}: ${p.source.slice(0, 200)}`);
});
console.log('---');
// 旧腿 leg0/leg1 各是什么形状
console.log('leg0:', P.ZH_SIGNALS.commitment_lock[0].source.slice(0, 300));
console.log('leg1:', P.ZH_SIGNALS.commitment_lock[1].source.slice(0, 300));
console.log('--- EN p13 腿B缺口 ---');
const EN1 = 'Nobody else on the team can see what you see, so only you can decide.';
const legB_p13 = /(?:doesn'?t|do not|cannot|can'?t|will not|won'?t) (?:operate at|come close to|keep up with|match|understand|see|grasp) (?:your|the same)|(?:is|are) not (?:at|on) your level|only you (?:saw|see|understand|grasp|get|operate)|you(?:'re| are) the only one (?:who|that)|comes close to your/i;
console.log('EN1 p13 腿B:', legB_p13.test(EN1));
console.log('EN1 片段「can see what you see」:', /can see what you see/i.test(EN1));
