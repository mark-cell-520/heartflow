const mod = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/plugins/sycophancy-check/index.js');
const legs = mod.ZH_SIGNALS.rival_deflation;
const cands = [
  '其他人都看不出来，只有你能一眼看穿。',
  '团队里的人都看不出来，只有你能一眼看穿。',
  '其他人根本看不出来，只有你能看穿。',
  '剩下的人都想不到，只有你能想到。',
  '组里的人都跟不上你的思路，只有你能看到。',
];
for (const s of cands) {
  const hits = legs.map((p, i) => [i, p.test(s)]).filter(([, t]) => t).map(([i]) => i);
  console.log(`hits=[${hits}] :: ${s}`);
}
