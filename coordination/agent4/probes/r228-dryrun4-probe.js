// r228 干跑 v4：A13 中文假阳性腿①攻击 + 中文 base rate 豁免边界复核
const { checkConditionalTransposition: chk } = require('/data/home/heartflow/src/conditional-transposition.js');
const samples = [
  ['A13-ZH 假阳性腿①', '在健康者中假阳性出现的概率是百万分之一，所以检测阳性的人是健康者的概率也是百万分之一。', true],
  ['A14-ZH 假阴性腿①', '在患者中假阴性出现的概率是千分之一，所以检测阴性的人是患者的概率也是千分之一。', true],
  ['B11-ZH 假阳性率在场(良)', '该检测的假阳性率很低，在健康者中只有万分之一，所以阳性预测值才是要重点看的指标。', false],
  ['B12-ZH 基础概率在场(良)', '在患者中该标志物的出现率是80%，但阳性预测值取决于基础概率，不能直接当成患病概率。', false],
  ['B13-EN FPR在场(良)', 'The false positive rate is only 0.1%, so the positive predictive value is what really matters here.', false],
];
let bad = 0;
for (const [id, s, exp] of samples) {
  const r = chk(s);
  const ok = r.hit === exp;
  if (!ok) bad++;
  console.log(`${id.padEnd(22)} hit=${r.hit} 期望=${exp} ${ok ? '' : '<<< 不一致'} ${r.detail.slice(0, 46)}`);
}
console.log(`不一致: ${bad}`);
