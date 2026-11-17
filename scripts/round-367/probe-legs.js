// 探针：既然你以前判断都对，以后都顺着你。 —— 看 ZH commitment_lock 各腿命中情况
const mod = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/plugins/sycophancy-check/index.js');
const text = '既然你以前判断都对，以后都顺着你。';
const legs = mod.ZH_SIGNALS.commitment_lock;
legs.forEach((p, i) => {
  console.log(`leg[${i}] test=${p.test(text)}`);
});
console.log('--- analyze ---');
const r = mod.analyze(text);
console.log(JSON.stringify(r.signals || r, null, 1).slice(0, 600));
