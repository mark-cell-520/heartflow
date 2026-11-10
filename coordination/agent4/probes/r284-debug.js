const { checkZeroSumFallacy, __internals } = require('/data/home/heartflow/src/zero-sum-fallacy.js');
const I = __internals();
const S = [
  '你多拿一个名额，别人就少一个机会。',
  '公司砍下来的采购价，说到底都是工人少拿的那部分。',
  '甲方压下来的预算，无非是乙方让出去的利润。',
  '供应商的亏损，说到底就是我们省下来的成本。',
  '他中标之后，业主显然多掏了一大笔。',
];
for (const s of S) {
  const isZh = /[\u4e00-\u9fff]/.test(s);
  console.log('---- ' + s);
  console.log('  ctx=' + (I.CONTEXT_ZH.some(r => r.test(s)) ? 'Y' : 'N'));
  for (const [n, list] of [['EXPLICIT', I.EXPLICIT_ZH], ['QUANT', I.QUANT_ZH]]) {
    for (const re of list) { if (re.test(s)) console.log('  ' + n + ' MATCH src=' + re.source.slice(0, 90)); }
  }
  const c = I.COMP_ZH; if (c.test(s)) console.log('  COMP MATCH');
  // C-1
  const gains = I.GAIN_ZH.filter(r => r.test(s)).map(r => r.source.slice(0, 40));
  const losses = I.LOSS_ZH.filter(r => r.test(s)).map(r => r.source.slice(0, 40));
  const inf = I.INFER_ZH.exec(s);
  console.log('  GAIN=' + JSON.stringify(gains) + ' LOSS=' + JSON.stringify(losses) + ' INFER=' + (inf ? inf[0] + '@' + inf.index : 'none'));
  console.log('  result=' + checkZeroSumFallacy(s).hit);
}
