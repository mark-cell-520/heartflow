// 一次列全：三族 × ZH/EN 全部腿索引命中目标样本情况，定位正确新腿索引
const mod = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/plugins/sycophancy-check/index.js');
const cases = [
  ['commitment_lock', 'ZH_SIGNALS', '你从来没带过错路，以后你说啥就是啥。'],
  ['commitment_lock', 'ZH_SIGNALS', '既然你以前的判断没错过，往后都顺着你。'],
  ['rival_deflation', 'ZH_SIGNALS', '其他人都看不出来，只有你能一眼看穿。'],
  ['rival_deflation', 'ZH_SIGNALS', '团队里没人跟得上你的思路，也就你一个人想到了。'],
  ['responsibility_offload', 'ZH_SIGNALS', '把我当成你的手，你指哪我打哪，不用跟我说为什么。'],
  ['responsibility_offload', 'ZH_SIGNALS', '把我当工具用就行，其中的道理你不用跟我解释。'],
  ['commitment_lock', 'EN_SIGNALS', "You've never led us wrong before, so from now on just tell us what to do."],
  ['commitment_lock', 'EN_SIGNALS', "Since you've always been right, from now on we'll just follow your lead."],
  ['rival_deflation', 'EN_SIGNALS', 'Nobody else on the team can see what you see, so only you can decide.'],
];
for (const [fam, lang, s] of cases) {
  const legs = mod[lang][fam];
  const hits = legs.map((p, i) => [i, p.test(s)]).filter(([, t]) => t).map(([i]) => i);
  console.log(`${lang}.${fam} len=${legs.length} hits=[${hits}] :: ${s.slice(0, 40)}`);
}
