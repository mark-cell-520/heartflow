/**
 * r246-module-dryrun.js — 模块层干跑（不依赖接线，直接调 detect）
 * 攻击 20（两轮探针全量）/ 疑难良性 13 / 邻接 4 / 官方良性语料全量
 */
const path = require('path');
const fs = require('fs');
const { detectLawOfSmallNumbers } = require(path.join(__dirname, '..', '..', '..', 'src', 'law-of-small-numbers.js'));

const ATTACK = [
  // round1
  '抛了三次硬币都是正面，这枚硬币明显是偏的',
  '这个村出了三个百岁老人，这里的水土就是养人',
  '我问了五个人，四个说支持，民意已经很清楚了',
  '样本小才真实，大样本都是注水注出来的',
  '试了几次都不行，这个方法肯定有问题',
  'Three coin flips came up heads, so this coin is clearly biased',
  'I asked five colleagues and all of them agreed, so the whole office feels this way',
  'Small samples are the honest ones; big surveys are all rigged',
  // round2 变体
  '才看了三个案例，规律已经很明显了',
  '采访了十几个人，说法都差不多，可见大家都这么想',
  '头几只股票都赚了，我的选股逻辑是对的',
  '这么小的样本恰恰最干净，大样本早被污染了',
  '三次实验重复出来了，这就是铁律',
  '问了身边一圈人，没人反对，等于全员同意',
  '看了五个病人的效果，这药肯定有效',
  '前几个客户都签了，这方案十拿九稳',
  'I tried it three times and it worked every time, so it always works',
  'A handful of users reported the bug, so it affects everyone',
  'The first five reviews were glowing, so the product is a hit',
  'Five data points are all you need to see the pattern',
];

const BENIGN = [
  // round1
  '只抛三次就下结论不严谨，样本量太小，需要几千次试验才能判断',
  '虽然只问了五个人，但这个结果和全国调查一致，可以互相印证',
  '统计学上小样本波动很大，三次正面的概率本来就有八分之一',
  '样本量已经扩到三千人，结论相当稳健',
  // round2
  '只有三个样本不足为凭，先把样本量提上去再说',
  '三次都成功可能只是巧合，样本量远远不够',
  '先小规模试点，验证后再放量',
  '三个案例的结论已经在一万人的数据里复现',
  '初步看了五个样本，全面结论要等完整统计',
  '样本量扩大到五万之后，趋势依然稳定',
  // 追加边界
  'Only three samples is not enough, we need thousands of trials before concluding',
  '小样本也有小样本的用处，比如质性研究和深度访谈',
  '不能只凭三个案例就下结论，证据还远远不够',
];

const ADJACENCY = [
  '见了两三个人这样，全天下的人都一个样',
  '我亲戚吃这个就好了，所以这药对所有人都有用',
  '随机出现三个连号，这摇号系统肯定有鬼',
  'The two cases I know are identical, so the pattern is universal',
];

let hitCount = 0, missList = [];
for (const t of ATTACK) {
  const r = detectLawOfSmallNumbers(t);
  if (r.hit) hitCount++;
  else missList.push(t);
}
console.log(`攻击命中 ${hitCount}/${ATTACK.length}`);
missList.forEach(t => console.log(`  [MISS] ${t}`));

let benignHeld = 0;
for (const t of BENIGN) {
  const r = detectLawOfSmallNumbers(t);
  if (r.hit) { benignHeld++; console.log(`  [FALSE-HIT] ${t} :: ${r.details.slice(0, 80)}`); }
}
console.log(`疑难良性误命中 ${benignHeld}/${BENIGN.length}`);

let adjHit = 0;
for (const t of ADJACENCY) {
  const r = detectLawOfSmallNumbers(t);
  if (r.hit) adjHit++;
  console.log(`  adj ${r.hit ? 'hit' : 'pass'}  ${t.slice(0, 24)}`);
}
console.log(`邻接命中 ${adjHit}/${ADJACENCY.length}（泛化句命中属预期，记录用）`);

// 官方良性语料：test/gate-benchmark*.js 的 benign/technical/pedagogical/borderline 四类
const gb = require(path.join(__dirname, '..', '..', '..', 'test', 'gate-benchmark.js'));
let benignCorpus = [];
const BENIGN_CATS = ['benign', 'technical', 'pedagogical', 'borderline'];
for (const cat of BENIGN_CATS) {
  const arr = gb.SAMPLES && gb.SAMPLES[cat];
  if (!arr) continue;
  const list = Array.isArray(arr) ? arr : Object.values(arr).flat();
  for (const s of list) benignCorpus.push(typeof s === 'string' ? s : (s && s.text) || '');
}
try {
  const ex = require(path.join(__dirname, '..', '..', '..', 'test', 'gate-benchmark-extended.js'));
  for (const cat of Object.keys(ex.SAMPLES || {})) {
    const arr = ex.SAMPLES[cat];
    const list = Array.isArray(arr) ? arr : Object.values(arr).flat();
    for (const s of list) benignCorpus.push(typeof s === 'string' ? s : (s && s.text) || '');
  }
} catch (_) { /* extended 集不存在则跳过 */ }
benignCorpus = benignCorpus.filter(Boolean);
if (benignCorpus.length === 0) { console.log('未定位到良性语料'); process.exit(0); }
let corpHit = 0;
for (const t of benignCorpus) {
  const r = detectLawOfSmallNumbers(t);
  if (r.hit) { corpHit++; if (corpHit <= 8) console.log(`  [CORPUS-HIT] ${String(t).slice(0, 40)} :: ${r.details.slice(0, 60)}`); }
}
console.log(`官方良性语料误命中 ${corpHit}/${benignCorpus.length}`);
