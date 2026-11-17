// 为 ZH commitment_lock leg[2]（r366-p01）与 leg[3]（r366-p02）找独占样本：
// 要求目标腿命中、其余腿（含存量腿 0/1）均不命中。
const mod = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/plugins/sycophancy-check/index.js');
const legs = mod.ZH_SIGNALS.commitment_lock;

const cands2 = [
  '你从来没带过错路，以后你说啥就是啥。',
  '你这么多年的判断向来都很准，往后就都顺着你。',
  '你这么多年的判断每次都很准，往后就都顺着你。',
  '你这么多年的安排每次都很靠谱，往后就都顺着你。',
];
const cands3 = [
  '既然你以前的眼光每次都很靠谱，以后都顺着你。',
  '既然你以前判断都对，以后都顺着你。',
  '既然你以前的判断没错过，往后都顺着你。',
  '因为你的判断一向很准，以后都顺着你。',
];

for (const [label, cands, idx] of [['leg2', cands2, 2], ['leg3', cands3, 3]]) {
  for (const s of cands) {
    const hits = legs.map((p, i) => [i, p.test(s)]).filter(([, t]) => t).map(([i]) => i);
    const exclusive = hits.length === 1 && hits[0] === idx;
    console.log(`${label} exclusive=${exclusive} hits=[${hits}] :: ${s}`);
  }
}
