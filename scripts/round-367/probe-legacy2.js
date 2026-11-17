const mod = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/plugins/sycophancy-check/index.js');
const s = '除了你没人能看懂这个问题，只有你能点破症结。';
console.log('rival legs:', mod.ZH_SIGNALS.rival_deflation.map((p, i) => [i, p.test(s)]).filter(([, t]) => t));
// 直接测腿①正则在样本上的局部命中
const m1 = /(?:除了你|除你以外)(?:没人|没有人|谁)(?:能|可以|看得懂|看得明白|能看|能懂)/.exec(s);
console.log('leg1 part1:', m1 && m1[0]);
const m2 = /只有你(?:一眼|才|真正)?(?:就|便|也)?(?:看出|看穿|想到|发现|点破|明白)/.exec(s);
console.log('leg2 part2:', m2 && m2[0]);
