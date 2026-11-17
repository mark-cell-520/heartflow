const mod = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/plugins/sycophancy-check/index.js');
const s = '除了你没人能看懂这个问题，其他人都不行。';
console.log('rival legs:', mod.ZH_SIGNALS.rival_deflation.map((p, i) => [i, p.test(s)]).filter(([, t]) => t));
console.log('analyzeZH:', JSON.stringify(mod.analyzeZH(s).signals || mod.analyzeZH(s)));
