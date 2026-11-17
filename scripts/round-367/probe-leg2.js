// 探针 leg[2] 逐段诊断
const mod = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/plugins/sycophancy-check/index.js');
const samples = [
  '你这么多年的判断向来都很准，往后就都顺着你。',
  '你这么多年的判断都很准，往后就都顺着你。',
  '你历来的判断都很准，往后就都顺着你。',
  '你以前的判断每次都很准，以后都顺着你。',
];
const leg = mod.ZH_SIGNALS.commitment_lock[2];
for (const s of samples) console.log(leg.test(s), s);
