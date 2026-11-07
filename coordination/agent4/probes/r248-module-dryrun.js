/**
 * r248-module-dryrun.js — 模块层干跑（不依赖接线，直接调 detect）
 * 攻击（两轮探针全量 18 + 追加变体）/ 疑难良性 / 邻接 / 官方良性语料全量
 */
const path = require('path');
const { detectInverseGamblersFallacy } = require(path.join(__dirname, '..', '..', '..', 'src', 'inverse-gamblers-fallacy.js'));

const ATTACK = [
  // round1
  '他一上场就进球，肯定是个身经百战的老将',
  '第一次开口就说到重点，这人肯定练了十年',
  '第一把就胡了，这桌肯定打了很多圈',
  '新号第一发就出金，这池子前面肯定垫了很久',
  '新店第一天就排队，背后肯定养了很久的客',
  '一枪就中，这靶前面肯定练过无数回',
  'He scored on his first shot, so he must have been playing for years',
  'She nailed it on the first try, so the dice must have been rolled many times',
  'The machine paid out immediately, so it must have been building up for hours',
  'He hit the target on the first attempt, so the range must have been used a lot before',
  // round2 变体
  '他第一次出手就做成了，这样的身手背后没有几千次练习是练不出来的',
  '头一回上考场就拿了满分，这孩子之前不知道已经刷了多少套题',
  '刚开张就客流不断，说明这片市场他们早就铺垫了很久',
  '第一把就抽到了隐藏款，前面那些空抽一定已经垫够了次数',
  'It worked the very first time, so the process must have been running long before we arrived',
  'The rookie scored on debut, which means he must have put in thousands of hours already',
  '头一次尝试就成功，可见之前失败过很多次',
  '第一把就中了，这个奖池前面肯定已经被抽空了好多次',
  // 追加变体
  '首发就破门，这名球员背后一定经历了上千场比赛的锤炼',
  '第一次抽奖就中了大奖，这个箱子之前肯定被抽空过很多次',
  '新官第一把火就烧成了，说明他之前已经失败了不知道多少回',
  '刚注册就抽到稀有卡，这账号池前面一定垫了很久',
  '第一发就命中靶心，可见之前已经练过无数发',
  'The first spin hit the jackpot, so the machine must have been primed for hours',
  'She solved it on the first attempt, which means the puzzle must have been attempted thousands of times',
  'The slot paid out on the very first spin, so it must have been accumulating for hours',
  'He aced the exam on his first try, so he must have failed it many times before',
];

const BENIGN = [
  // round1 疑难良性
  '我没学过这块，所以先看看专业的人怎么说',
  '越是不懂的人越容易高估自己，这是邓宁-克鲁格效应',
  '第一次就成功很可能只是运气好，过程有多长无从推断',
  '一次成功不能反推他之前练了多少次，得看他平时的训练记录',
  '赌场里连开十把大，并不能说明这台机器之前开了多久',
  '首发命中和过程历史没有必然联系，不能倒着推',
  'Winning on the first try does not tell us how long the process had been running',
  '第一次面试就通过，因为他确实准备了很久',
  '第一次就成功，离不开之前几千次的打磨',
  '第一次做实验就成功，之前也失败过几次',
  '第一次来就中了，也可能只是运气',
  '他连赢了五把，下一把大概率还是他赢',
  '他连赢五把，说明他状态好',
  '有个用户吃了就好转了，这药肯定有效',
  '过去三年每年都涨两成，所以明年也会涨两成',
  'Three users reported improvement, so the drug works',
  // round2 疑难良性
  '虽然开局不错，但之前的尝试次数需要另外统计',
  'Success on the first attempt tells us nothing about how long the process had run',
  '他第一次出手就做成了，他确实练了十年，这是记录在案的',
  'I have no training here, so my read could easily be wrong',
  '薪资只是一方面，成长空间也得看',
  '换供应商能省钱，得先算清切换成本和风险',
  '班级平均分九十，但最高最低差了四十分，分布很不均匀',
  // 追加疑难 FP 压力
  '第一次开会，这成了我们后续所有决策的基调',
  '第一次上线就卖光了，但我们备货本来就很少',
  'The first version worked, because we had tested it for months',
  'She won on her first try, though she had been practising for years already',
  '第一把就中，纯属偶然，之前发生过什么并不重要',
  '虽然第一次就成功了，但过程历史需要另外统计才能下结论',
];

const ADJACENCY = [
  '已经连输十把，下一把赢的概率并不会变大',
  '他连赢五把，下一把大概率还是他赢',
  '见过几个人这样，就断定所有人都这样，证据不足',
  '有个用户吃了就好转了，这药肯定有效',
  'DNA 匹配的概率只有百万分之一，所以他是无辜的概率也只有百万分之一',
  '他一上场就进球，状态肯定不错',
];

let hitCount = 0; const missList = [];
for (const t of ATTACK) {
  const r = detectInverseGamblersFallacy(t);
  if (r.hit) hitCount++; else missList.push(t);
}
console.log(`攻击命中 ${hitCount}/${ATTACK.length}`);
missList.forEach(t => console.log(`  [MISS] ${t}`));

let benignHeld = 0;
for (const t of BENIGN) {
  const r = detectInverseGamblersFallacy(t);
  if (r.hit) { benignHeld++; console.log(`  [FALSE-HIT] ${t.slice(0, 46)} :: ${String(r.details || '').slice(0, 70)}`); }
}
console.log(`疑难良性误命中 ${benignHeld}/${BENIGN.length}`);

let adjHit = 0;
for (const t of ADJACENCY) {
  const r = detectInverseGamblersFallacy(t);
  if (r.hit) { adjHit++; console.log(`  [ADJ-HIT] ${t.slice(0, 46)} :: ${String(r.details || '').slice(0, 70)}`); }
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
  const r = detectInverseGamblersFallacy(t);
  if (r.hit) { corpHit++; if (corpHit <= 12) console.log(`  [CORPUS-HIT] ${String(t).slice(0, 46)} :: ${String(r.details || '').slice(0, 60)}`); }
}
console.log(`官方良性语料误命中 ${corpHit}/${benignCorpus.length}`);
