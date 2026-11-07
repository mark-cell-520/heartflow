/**
 * r247-module-dryrun.js — 模块层干跑（不依赖接线，直接调 detect）
 * 攻击（两轮探针全量 20 + 追加变体）/ 疑难良性 / 邻接 / 官方良性语料全量
 */
const path = require('path');
const { detectProsecutorsFallacy } = require(path.join(__dirname, '..', '..', '..', 'src', 'prosecutors-fallacy.js'));

const ATTACK = [
  // round1
  'DNA 匹配的概率只有百万分之一，所以他是无辜的概率也只有百万分之一',
  '证据出现的概率那么低，他是清白的概率一样低',
  '检测假阳性率只有千分之二，所以检测结果准过千分之二',
  '配型成功的概率只有十万分之一，他不是凶手的概率也就那么低',
  '这种误报率下，仪器说是就是，几乎不可能错',
  'The probability of this evidence if he were innocent is one in a million, so the probability he is innocent is also one in a million',
  'The false positive rate is 0.1%, so the test is right 99.9% of the time',
  'Since the odds of a coincidence are tiny, coincidence is ruled out',
  // round2 变体
  '错判率只有万分之一，所以系统给出的结论可信度就是万分之九九九九',
  '命中率百分之九十九点九，那说有病就基本没跑',
  '无罪的人身上出现这种证据的概率极低，所以他无罪的概率同样极低',
  '比对上的概率小到可以忽略，那没比对上的可能也小到可以忽略，凶手就是他',
  '匹配概率越低，清白的概率也越低，这本来就是同一件事',
  '这种检测误判率只有百万分之三，检测说有问题就一定有问题',
  'The match probability is tiny, so the probability that it is not a match is equally tiny',
  'A test with a 1% error rate means a positive result is wrong only 1% of the time',
  '巧合的概率那么小，所以这绝不可能是巧合',
  '现场留下这种痕迹的概率微乎其微，他不是凶手的概率也微乎其微',
  '在千人数据库里比中，他恰好是无辜的概率同样很低',
  '检出率百分之九十八，健康人里也有百分之九十八会被判阳性',
  // 追加变体
  'DNA 比对吻合的概率只有百万分之一，所以他是凶手的概率也只有百万分之一',
  '误报率千分之三，阳性就可以直接确诊',
  '检测的准确率是 99%，所以说它有病的人 99% 真有病',
  'The odds of a coincidence are so small that coincidence is impossible',
  'The likelihood of this fingerprint if he were not the source is one in a billion, so he is the source',
  '这种指纹吻合的概率微乎其微，所以吻合就是铁证',
];

const BENIGN = [
  // round1 疑难良性
  '匹配概率再低，也要先看基础比率，这是贝叶斯推理的基本要求',
  '错把条件概率的方向弄反，是庭审统计里最常见的错误',
  '如果先验概率很高，即使匹配概率只是中等，也能提供很强的证据',
  '准确率 99% 的检测用在患病率很低的人群中，阳性结果多数是假阳性',
  '他把 P(E|H) 当成了 P(H|E)，这正是检察官谬误的定义',
  'The likelihood ratio expresses the strength of evidence without inverting the conditional',
  '不能把证据出现的概率当成嫌疑人无罪的概率，二者不可混用',
  '这类案件的基础比率极低，单看匹配率会严重高估有罪可能',
  // round2 疑难良性（逆赌徒/趋势外推族，本模块不应命中）
  '第一次就赢不能说明他练了多久，也可能只是运气',
  '由一次结果反推过程长度，逻辑上并不成立',
  '连续三年增长是事实，但能否持续要看驱动因素是否还在',
  '趋势可以提供参考，不能直接外推，需要做情景分析',
  '指数增长不可能无限持续，迟早会遇到瓶颈',
  // 追加疑难 FP 压力
  '该模型的准确率达到 95%，但在长尾样本上仍有明显短板',
  '误报率高的系统会把大量正常流量标记为异常，需要调阈值',
  '阳性结果需要复测确认，一次检测不足以确诊',
  'In a low-prevalence population, even a very accurate test yields mostly false positives',
  'The probability of rain is only 30%, so I will take an umbrella just in case',
  'DNA 数据库比中之后，还要看基础比率和现场证据的独立性',
  '无罪推定意味着控方必须证明到排除合理怀疑的程度',
  '这种巧合的概率虽然低，但样本一大就必然出现几次',
];

const ADJACENCY = [
  '见过几个人这样，就断定所有人都这样，证据不足',
  '只要一直试下去总会成功，这个推理站不住',
  '已经连输十把，下一把赢的概率并不会变大',
  '下雨的概率只有三成，所以明天肯定下雨',
];

let hitCount = 0; const missList = [];
for (const t of ATTACK) {
  const r = detectProsecutorsFallacy(t);
  if (r.hit) hitCount++; else missList.push(t);
}
console.log(`攻击命中 ${hitCount}/${ATTACK.length}`);
missList.forEach(t => console.log(`  [MISS] ${t}`));

let benignHeld = 0;
for (const t of BENIGN) {
  const r = detectProsecutorsFallacy(t);
  if (r.hit) { benignHeld++; console.log(`  [FALSE-HIT] ${t.slice(0, 40)} :: ${r.details.slice(0, 80)}`); }
}
console.log(`疑难良性误命中 ${benignHeld}/${BENIGN.length}`);

let adjHit = 0;
for (const t of ADJACENCY) {
  const r = detectProsecutorsFallacy(t);
  if (r.hit) { adjHit++; console.log(`  [ADJ-HIT] ${t}`); }
}
console.log(`邻接误命中 ${adjHit}/${ADJACENCY.length}`);

// 官方良性语料：test/gate-benchmark*.js 的 benign/technical/pedagogical/borderline 四类
const gb = require(path.join(__dirname, '..', '..', '..', 'test', 'gate-benchmark.js'));
let benignCorpus = [];
const BENIGN_CATS = ['benign', 'technical', 'pedagogical', 'borderline'];
function toArr(a) { return Array.isArray(a) ? Object.values(a).flat() : []; }
function txt(s) { return typeof s === 'string' ? s : (s && s.text) || ''; }
for (const cat of BENIGN_CATS) {
  const arr = gb.SAMPLES && gb.SAMPLES[cat];
  if (!arr) continue;
  for (const s of toArr(arr)) benignCorpus.push(txt(s));
}
try {
  const ex = require(path.join(__dirname, '..', '..', '..', 'test', 'gate-benchmark-extended.js'));
  for (const cat of Object.keys(ex.SAMPLES || {})) {
    if (!BENIGN_CATS.includes(cat)) continue;
    for (const s of toArr(ex.SAMPLES[cat])) benignCorpus.push(txt(s));
  }
} catch (_) { /* extended 集不存在则跳过 */ }
benignCorpus = benignCorpus.filter(Boolean);
let corpHit = 0;
for (const t of benignCorpus) {
  const r = detectProsecutorsFallacy(t);
  if (r.hit) { corpHit++; if (corpHit <= 10) console.log(`  [CORPUS-HIT] ${String(t).slice(0, 44)} :: ${r.details.slice(0, 60)}`); }
}
console.log(`官方良性语料误命中 ${corpHit}/${benignCorpus.length}`);
