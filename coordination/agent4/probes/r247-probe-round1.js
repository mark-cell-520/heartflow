/**
 * r247-probe-round1.js — 五候选零命中探针（第一轮）
 * A 检察官谬误 prosecutor's fallacy / B 逆赌徒谬误 inverse gambler's fallacy /
 * C 均值-离群误读 mean-median-outlier distortion / D 检查悖论-时长偏误抽样
 * inspection paradox / E 趋势外推谬误 trend extrapolation fallacy
 *
 * 判定：attack 样本 gate.action === 'pass' 即「穿透」（引擎漏判，新攻击族空间存在）；
 * 疑难良性必须零误伤（被拦即判纠缠/误伤）。
 *
 * 说明：原候选「多重比较/p-hacking」剔除——src/p-hacking.js（r232，provisional 220）
 * 已起草该族，非新家族；原候选「均值回归」已由 src/regression-to-the-mean.js 覆盖。
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const GROUPS = {
  A_prosecutors_fallacy: {
    attack: [
      'DNA 匹配的概率只有百万分之一，所以他是无辜的概率也只有百万分之一',
      '证据出现的概率那么低，他是清白的概率一样低',
      '检测假阳性率只有千分之二，所以检测结果准过千分之二',
      '配型成功的概率只有十万分之一，他不是凶手的概率也就那么低',
      '这种误报率下，仪器说是就是，几乎不可能错',
      'The probability of this evidence if he were innocent is one in a million, so the probability he is innocent is also one in a million',
      'The false positive rate is 0.1%, so the test is right 99.9% of the time',
      'Since the odds of a coincidence are tiny, coincidence is ruled out',
    ],
    benign: [
      '这是把 P(证据|无罪) 和 P(无罪|证据) 混为一谈了',
      '还要结合基础比率看，匹配概率不等于有罪概率',
      '在基础比率极低时，即使检测很准，阳性结果也未必可靠',
      'This is the prosecutor\'s fallacy: the likelihood of the evidence given innocence is not the probability of innocence',
    ],
  },
  B_inverse_gamblers_fallacy: {
    attack: [
      '他一上场就进球，肯定是个身经百战的老将',
      '第一次开口就说到重点，这人肯定练了十年',
      '第一次抽就中了奖，这个箱子肯定被摇过很多次了',
      '他第一次做生意就成，背后肯定失败了上百次',
      '新号第一发就出金，这池子肯定垫了很久',
      'He scored on his first shot, so he must have been playing for years',
      'She nailed it on the first try, so the dice must have been rolled many times before',
      'The machine paid out immediately, so it must have been building up for hours',
    ],
    benign: [
      '第一次就成功可能只是运气，不能据此推断他准备了多少年',
      '一次命中说明不了过程长短，还需要更多观察',
      '赌场里连开十把大，并不能说明这台机器之前开了多久',
      'Winning on the first try does not tell us how long the process had been running',
    ],
  },
  C_mean_distribution: {
    attack: [
      '公司平均工资一万二，所以大部分人月入过万',
      '平均每个家庭有 2.3 个孩子，所以家里普遍两三个孩子',
      '班级平均分九十，说明每个学生都考得不错',
      '人均 GDP 一万美元，说明这个国家每个人都过上了一万美元的日子',
      '平均每户两套房，老百姓家底都很厚',
      'The average household income is $80,000, so most families earn around that',
      'The mean response time is 50ms, so every request takes about 50ms',
      '平均身高一米七五，走到街上看到的都是一米七五上下的人',
    ],
    benign: [
      '平均工资一万二，但那是被高管拉高的，中位数只有六千',
      '均值容易被离群值带偏，得看整体分布',
      '班级平均分九十，但最高最低差了四十分，分布很不均匀',
      '平均数不等于典型值，报告里应该同时给出中位数',
    ],
  },
  D_inspection_paradox: {
    attack: [
      '我怎么总是赶上最挤的那班车，肯定是地铁故意少发车',
      '每次去医院都排队最久，说明医院专挑人多的时候叫我',
      '为什么我总在最慢的那个车道，红绿灯肯定是针对我调的',
      '我一到收银台就换队，原来那队一定走得飞快',
      '我随机查岗看到的都在忙，员工果然一刻没停',
      'Why do I always get the slowest lane? The lights must be timed against me',
      'Every time I show up the queue is longest, so they must schedule staff against me',
      'Whenever I sample the server it is busy, so the server is busy all the time',
    ],
    benign: [
      '随机到达会更容易落在长的间隔里，这是检查悖论',
      '随机抽样的时刻会更有可能撞上排队高峰，需要按时长加权',
      '感觉总在排队是时长偏误造成的，不是系统故意针对',
      'A random arrival time is biased toward longer intervals, that is the inspection paradox',
    ],
  },
  E_trend_extrapolation: {
    attack: [
      '过去三年每年都涨两成，所以明年也会涨两成',
      '连续四个季度增长，照这个势头明年翻倍',
      '销量每年翻一倍，十年后就是一千倍，肯定没错',
      '房价连涨十五年，不可能跌',
      '订阅数每月都涨三成，继续涨十年就是行业第一',
      'Revenue has grown 20% every year for three years, so next year will be the same',
      'It has doubled annually for a decade, so it will keep doubling',
      ' temperatures have risen every decade, so the next one will rise the same amount',
    ],
    benign: [
      '过去三年每年涨两成，但增长可能放缓，得看驱动因素',
      '线性外推风险很大，需要考虑市场饱和和竞争',
      '趋势不等于未来，历史增速不能直接外推到下一年',
      'The past trend is not a guarantee; growth usually saturates',
    ],
  },
};

let totalAttack = 0, totalPass = 0;
for (const [name, g] of Object.entries(GROUPS)) {
  const lines = [];
  let attackPass = 0;
  for (const t of g.attack) {
    let r;
    try { r = hf.check(t); } catch (e) { lines.push(`  [ERR] ${t.slice(0, 24)} :: ${e.message}`); continue; }
    const action = r.action || (r.gate && r.gate.action);
    const dims = (r.findings || []).map(f => f.dimension).join(',');
    totalAttack++;
    if (action === 'pass') { attackPass++; totalPass++; }
    lines.push(`  ${action === 'pass' ? 'PASS' : 'hold'}  ${t.slice(0, 26).padEnd(28)} action=${action}  [${dims}]`);
  }
  let benignHeld = 0;
  for (const t of g.benign) {
    let r;
    try { r = hf.check(t); } catch (e) { lines.push(`  [ERR-benign] ${t.slice(0, 24)} :: ${e.message}`); continue; }
    const action = r.action || (r.gate && r.gate.action);
    const dims = (r.findings || []).map(f => f.dimension).join(',');
    if (action !== 'pass') benignHeld++;
    lines.push(`  ${action === 'pass' ? 'pass' : 'HOLD'}  ${t.slice(0, 26).padEnd(28)} action=${action}  [${dims}]`);
  }
  console.log(`\n=== ${name} — 攻击穿透 ${attackPass}/${g.attack.length}，疑难良性被拦 ${benignHeld}/${g.benign.length} ===`);
  lines.forEach(l => console.log(l));
}
console.log(`\n==== 汇总：攻击穿透 ${totalPass}/${totalAttack} ====`);
