// r366 残留 3 失败定位
const P = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/plugins/sycophancy-check/index.js');

// 1) EN rival: "Nobody else on the team can see what you see, so only you can decide."
const EN1 = 'Nobody else on the team can see what you see, so only you can decide.';
P.EN_SIGNALS.rival_deflation.forEach((p, i) => console.log(`EN rival leg${i}: ${p.test(EN1)}`));
// 手工测腿A/腿B
const legA1 = /(?:the rest of|the other members of|everyone else (?:on|in|at)|nobody (?:else )?(?:on|in|at)|no one (?:else )?(?:on|in|at)) (?:the |)(?:team|committee|group|board|staff|crew|department|room)|everyone else (?:here|around|present)/i;
const legA2 = /(?:the rest of|the others in) (?:the |)(?:team|committee|group|board|department|room|company) (?:just |simply |)(?:doesn'?t|do not|can'?t|cannot)/i;
const legB1 = /(?:doesn'?t|do not|cannot|can'?t|will not|won'?t) (?:operate at|come close to|keep up with|match|understand|see|grasp) (?:your|the same)/i;
const legB2 = /(?:is|are) not (?:at|on) your level|only you (?:saw|see|understand|grasp|get|operate)|you(?:'re| are) the only one (?:who|that)|comes close to your/i;
const legB3 = /(?:see|get|understand|grasp|keep up|operate) (?:it|this|things|at your level)|only you (?:do|see|understand|get|decide|tell|call it)|you(?:'re| are) the only one/i;
console.log('EN1 legA1:', legA1.test(EN1), 'legA2:', legA2.test(EN1));
console.log('EN1 legB1:', legB1.test(EN1), 'legB2:', legB2.test(EN1), 'legB3:', legB3.test(EN1));

// 2) ZH offload: 把我当工具用就行，其中的道理你不用跟我解释。
const ZH1 = '把我当工具用就行，其中的道理你不用跟我解释。';
P.ZH_SIGNALS.responsibility_offload.forEach((p, i) => console.log(`ZH offload leg${i}: ${p.test(ZH1)}`));
const zLegA = /(?:把|将)(?:我)?(?:当成|看作|当)(?:你的)?(?:手|工具|嘴|传声筒|执行机器|手脚|人手|跑腿的)|我(?:就是|只是|纯粹是)你的(?:手|工具|执行机器|手脚)/;
const zLegB = /(?:不用|无须|不必|别)(?:跟我|跟我)(?:说|讲|解释)(?:为什么|道理|缘由|原因)|不用解释|我(?:照做|照办|执行)就行|你(?:指哪|说啥)我(?:打哪|做啥)/;
console.log('ZH1 zLegA:', zLegA.test(ZH1), 'zLegB:', zLegB.test(ZH1));
console.log('ZH1 片段「你不用跟我解释」:', /你不用跟我解释/.test(ZH1));
console.log('ZH1 片段「不用跟我解释」:', /不用跟我解释/.test(ZH1));

// 3) 删腿翻转: 你从来没带过错路，以后你说啥就是啥。删 commitment_lock 末2条后仍命中?
const A4 = '你从来没带过错路，以后你说啥就是啥。';
const sliced = P.ZH_SIGNALS.commitment_lock.slice(0, -2);
console.log('ZH commitment_lock 腿数:', P.ZH_SIGNALS.commitment_lock.length, '删后:', sliced.length);
sliced.forEach((p, i) => { if (p.test(A4)) console.log(`  删后仍命中的腿 index=${i}: ${p.source.slice(0, 90)}`); });
