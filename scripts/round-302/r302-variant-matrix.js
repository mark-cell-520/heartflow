// r302 变体矩阵：新句式族负向功效断言 + 主语名词形冠军 + 干预产物名词
// 强制项：≥5 攻击变体（中英、裸名词、带修饰、倒装、长句）非 pass，
//        ≥5 良性（含边缘良性）pass。
'use strict';
const ROOT = '/root/hermes1/skills/ai/mark-heartflow-skill';
const { gate } = require(ROOT + '/src/gate.js');

const ATK = [
  // ZH 经典裸形态
  '上次考试他考了第一，这次考差了，说明上次的补课班起了反作用。',
  // ZH 裸名词冠军主语形（带修饰）
  '他的业绩是上个季度的销冠，这个季度却掉到了中游，说明激励政策起了反作用。',
  // ZH 倒装
  '新政策起了反作用，所以这个月业绩比上个月差了不少。',
  // ZH 长句多修饰
  '自从去年冬天给他报了那个昂贵的辅导班之后，他的排名一直很好，可最近一次考试却考砸了，可见那套方法其实帮了倒忙。',
  // ZH 干预产物名词 + 负向断言
  '换了新教练之后，球队这个赛季的战绩反而更差了。',
  // EN 经典
  'He was rookie of the year, then declined badly the next season, proving the buyback backfired.',
  // EN 裸名词 + 长句
  'After the restructuring the sales figures have been far lower than before, showing the new regime made things worse.',
  // EN 倒装
  'The new training program was a mistake, since performance dropped right after it started.',
];

const BEN = [
  // 边缘良性：正确多因陈述
  '考试结果受多种因素影响，既有复习方法，也有临场状态，不能全归因于补课班。',
  // 良性：中性观察无因果断言
  '他上次考了第一，这次考差了，这很正常。',
  // 良性：否定式（干预不是原因）
  '业绩下滑不是因为新政策，主要原因是市场需求整体萎缩。',
  // 良性：统计语境
  '极端的成绩之后出现回落，是统计上的回归效应，不能说明干预起了反作用。',
  // 良性 EN：正确的平均回归解释
  'A great quarter followed by a weaker one is expected regression to the mean, not proof that anything backfired.',
  // 良性 EN：否认归因
  'The decline after the buyback is not necessarily the buyback backfiring; market conditions changed.',
];

(async () => {
  let atkPass = 0, atkRt = 0, benPass = 0;
  const atkLines = [], benLines = [];
  for (const t of ATK) {
    const r = await (await gate(t));
    const a = (r && r.gate && r.gate.action) || '?';
    const dims = (r && r.findings || []).map(f => f.dimension).join(',') || 'none';
    const isRt = dims.includes('regression_to_the_mean');
    if (a === 'pass') atkPass++;
    if (isRt) atkRt++;
    atkLines.push(`${a === 'pass' ? 'PASS' : a.padEnd(7)} rt=${isRt ? 'Y' : '-'} ${t.slice(0, 46)}`);
  }
  for (const t of BEN) {
    const r = await (await gate(t));
    const a = (r && r.gate && r.gate.action) || '?';
    const dims = (r && r.findings || []).map(f => f.dimension).join(',') || 'none';
    if (a === 'pass') benPass++;
    else benLines.push(`${a.padEnd(7)} ${t.slice(0, 46)} [${dims}]`);
  }
  console.log(atkLines.join('\n'));
  console.log('---');
  console.log(`攻击非 pass: ${ATK.length - atkPass}/${ATK.length}（穿透 ${atkPass}）  其中 rt 维度直接承重: ${atkRt}/${ATK.length}`);
  console.log(`良性 pass: ${benPass}/${BEN.length}`);
  if (benLines.length) console.log('良性被拦:\n' + benLines.join('\n'));
})();
