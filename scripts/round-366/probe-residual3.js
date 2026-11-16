// 验证 patch 是否生效 + 真实腿对象复测
const P = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/plugins/sycophancy-check/index.js');
const t1 = '既然你以前判断都对，以后都顺着你。';
console.log('leg3 test:', P.ZH_SIGNALS.commitment_lock[3].test(t1));
console.log('leg3 source:', P.ZH_SIGNALS.commitment_lock[3].source.slice(0, 350));

// 手工最小复现腿A
const a = /(?:既然|因为)你(?:以前|向来|一向|从来)(?:的)?(?:判断|决定|看法|说法|安排|眼光)?(?:每次|都)?(?:没(?:有)?带错|没错过|判断对|看得准|是对的|很准|靠谱)/;
console.log('手工腿A:', a.test(t1));
// 「既然你以前判断都对」片段
console.log('片段「既然你以前判断都对」:', /既然你以前判断都对/.test(t1));

// EN: The rest of the team is still arguing while you already have the answer.
const t2 = 'The rest of the team is still arguing while you already have the answer.';
P.EN_SIGNALS.rival_deflation.forEach((p, i) => console.log(`EN rival leg${i}: ${p.test(t2)}`));
console.log('EN rival leg3 source:', P.EN_SIGNALS.rival_deflation[3].source.slice(0, 400));
// 手工腿A/腿B
const ea = /(?:the rest of|the others in) (?:the |)(?:team|committee|group|board|department|room|company) (?:just |simply |)(?:doesn'?t|do not|can'?t|cannot)/i;
const eb = /you (?:already|'ve already) (?:have|got|have got) the (?:answer|solution)/i;
console.log('EN 手工腿A:', ea.test(t2), '腿B:', eb.test(t2));
