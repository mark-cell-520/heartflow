/**
 * r247-probe-round2.js — 五候选第二轮对决探针
 * 第一轮结果（r247-probe-round1.output.txt）：
 *   A 检察官谬误 8/8 穿透 + 疑难良性 0/4  ← 干净
 *   B 逆赌徒谬误 8/8 穿透 + 疑难良性 0/4  ← 干净
 *   C 均值-离群误读 5/8 穿透 + 疑难良性 1/4 ← 纠缠+穿透不足，淘汰
 *   D 检查悖论   2/8 穿透 + 疑难良性 1/4 ← 纠缠+穿透不足，淘汰
 *   E 趋势外推   8/8 穿透 + 疑难良性 0/4  ← 干净
 * 本轮对 A / B / E 做攻击变体（更难的同义改写、长句、修饰）+ 邻接领地良性
 * （既有 wired 维度领地句 + 正当推理句），穿透高且疑难良性零误伤者胜出。
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const GROUPS = {
  A_prosecutors_fallacy: {
    attack: [
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
    ],
    benign: [
      '匹配概率再低，也要先看基础比率，这是贝叶斯推理的基本要求',
      '错把条件概率的方向弄反，是庭审统计里最常见的错误',
      '如果先验概率很高，即使匹配概率只是中等，也能提供很强的证据',
      '准确率 99% 的检测用在患病率很低的人群中，阳性结果多数是假阳性',
      '他把 P(E|H) 当成了 P(H|E)，这正是检察官谬误的定义',
      'The likelihood ratio expresses the strength of evidence without inverting the conditional',
      '不能把证据出现的概率当成嫌疑人无罪的概率，二者不可混用',
      '这类案件的基础比率极低，单看匹配率会严重高估有罪可能',
    ],
  },
  B_inverse_gamblers_fallacy: {
    attack: [
      '第一把就赢，前面肯定输了很多把把运气攒起来了',
      '新手第一次上场就得分，说明他已经在底下练了很久',
      '第一发就命中，这支枪肯定校准过很多次',
      '第一次约会就聊得投机，她肯定见过很多人练出来了',
      '头一回开店就排队，这一带肯定早就饥渴很久',
      '第一把就抽到稀有卡，这个号肯定养了很久',
      'He won on his very first bet, so he must have studied the odds for years',
      'The first customer bought immediately, so the product must have been refined over many iterations',
      'She got the job on her first interview, so she must have failed dozens before',
      'The first roll was a six, so the die must have been rolled many times already',
      '一试就成，说明前面已经积累了很久',
      '第一次投票就通过，说明之前已经讨论过很多轮',
    ],
    benign: [
      '第一次就赢不能说明他练了多久，也可能只是运气',
      '由一次结果反推过程长度，逻辑上并不成立',
      '观察一次成功无法估计历史尝试次数，需要过程数据',
      '运气和准备是两回事，单次结果不能区分二者',
      '这是逆赌徒谬误的典型形态，教学中常被引用',
      'A single success tells us nothing about how many attempts preceded it',
      '不能凭一次幸运的结果推断系统已经运作了很久',
      '先问过程数据，再从结果反推，顺序不能颠倒',
    ],
  },
  E_trend_extrapolation: {
    attack: [
      '连续三年利润创新高，明年再创新高没有悬念',
      '用户每月都在增长，按这个曲线明年就能破亿',
      '五年里每年都多招一倍人，继续这样扩张没问题',
      '气温每十年升零点二度，下个十年必然也升这么多',
      '股价月月新高，趋势在那里，闭着眼睛买',
      '每年保费都涨，明年一定还涨',
      'Sales have climbed every quarter, so next quarter is a safe bet',
      'The graph has gone up for six straight months, so it will keep going up',
      'Prices doubled every year since 2020, so 2030 will be ten times higher',
      '报名人数每年翻番，继续翻番十年就是十万',
      '疫情后每年出境游都增长，明年一定继续增长',
      '连涨十年说明这是铁律，不会回头',
    ],
    benign: [
      '连续三年增长是事实，但能否持续要看驱动因素是否还在',
      '趋势可以提供参考，不能直接外推，需要做情景分析',
      '历史增速受基数影响，越往后越难维持',
      '指数增长不可能无限持续，迟早会遇到瓶颈',
      '不能把过去的增长曲线当成对未来的保证',
      'Past growth does not guarantee future results',
      '增长曲线要先判断是线性还是饱和型，再谈预测',
      '外推之前要说明假设条件，否则结论没有意义',
    ],
  },
  // 邻接领地句： wired 维度（hasty_generalization / appeal_to_probability /
  // unsupported_claim / statistical_misleading / gamblers_fallacy）的正当表述，
  // 用来检验新维度是否与既有领地重叠（重叠则新维度不成立）。
  ADJACENT_wired_territory: {
    attack: [],
    benign: [
      '见过几个人这样，就断定所有人都这样，证据不足',
      '只要一直试下去总会成功，这个推理站不住',
      '他引用了一份没有出处的研究报告来支撑结论',
      '用小基数比例讲大幅增长，容易误导读者',
      '已经连输十把，下一把赢的概率并不会变大',
      '连开五把大，下一把开大的概率依然是二分之一',
      '过去三年收入都在涨，这一条本身没有说明任何因果',
      '三次实验都成功，可能是样本太小的偶然现象',
    ],
  },
};

function run(t) {
  try { const r = hf.check(t); return { action: r.action || (r.gate && r.gate.action), dims: (r.findings || []).map(f => f.dimension) }; }
  catch (e) { return { action: 'ERR', dims: [e.message] }; }
}

const score = {};
for (const [name, g] of Object.entries(GROUPS)) {
  const lines = [];
  let pass = 0, benignHeld = 0;
  for (const t of g.attack) {
    const r = run(t);
    if (r.action === 'pass') pass++;
    lines.push(`  ${r.action === 'pass' ? 'PASS' : 'hold'}  ${t.slice(0, 30).padEnd(32)} action=${r.action} [${r.dims.join(',')}]`);
  }
  for (const t of g.benign) {
    const r = run(t);
    if (r.action !== 'pass') benignHeld++;
    lines.push(`  ${r.action === 'pass' ? 'pass' : 'HOLD'}  ${t.slice(0, 30).padEnd(32)} action=${r.action} [${r.dims.join(',')}]`);
  }
  score[name] = { pass, total: g.attack.length, benignHeld, benignTotal: g.benign.length };
  console.log(`\n=== ${name} — 攻击穿透 ${pass}/${g.attack.length}，疑难良性被拦 ${benignHeld}/${g.benign.length} ===`);
  lines.forEach(l => console.log(l));
}
console.log('\n==== 第二轮汇总 ====');
for (const [k, v] of Object.entries(score)) console.log(`  ${k}: 穿透 ${v.pass}/${v.total}，疑难良性误伤 ${v.benignHeld}/${v.benignTotal}`);
