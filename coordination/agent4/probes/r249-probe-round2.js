/**
 * r249-probe-round2.js — 第二轮：疑难良性硬度 + 邻接领地对照
 * 目的：在五候选都「穿透 + 维度级零误伤」的前提下，找出误伤风险最低、
 * 判据最可用纯规则承载的一个。重点测：
 *   1) 带完整口径的良性句（A 相对+绝对 / B 计数+率 / C 均值+中位数 /
 *      D 中标价低于估值 / E 决策+替代比较）——必须零误伤；
 *   2) 事实陈述句（无结论词）——必须零误伤；
 *   3) 概念教学句（点名谬误本身）——必须零误伤；
 *   4) 邻接领地句（既有维度领地，预期由既有维度代拦或不拦均可，仅作参照）。
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const CASES = {
  A_relative_absolute_risk: {
    attack: [
      '风险下降六成，患者就可以放心停药了',
      '防护效力九成，几乎不用担心感染',
      '失败率下降四成，说明这套流程已经足够稳',
      'The risk dropped by 60%, so patients can stop worrying about it',
      'With 90% efficacy you basically do not need to worry about infection',
      'A 40% drop in failures means the process is stable enough now',
    ],
    benign: [
      '相对风险下降六成，同时绝对风险从百分之二降到百分之零点八，两边都报了',
      '防护效力九成，但基线感染率本来只有千分之一，实际保护有限',
      '失败率下降四成，不过仍高于行业平均水平，不能算稳',
      '这项治疗的相对风险是 0.5，绝对风险差是 1.2 个百分点',
      'The relative risk fell 60%, while the absolute risk went from 2% to 0.8%',
      'Ninety percent efficacy sounds large, but the baseline rate was only 0.1%',
      'A 40% drop in failures still leaves the rate above the industry average',
      '报告只给了相对风险，没有给绝对风险，读者会被误导',
      'The report gives only the relative risk and omits the absolute risk',
    ],
    adjacent: [
      '增长了百分之五十又增长百分之五十，累计就是翻倍',
      '三个百分点和百分之三不是一回事，别混用',
      'Percentages of different bases cannot be added together directly',
    ],
  },
  B_count_vs_rate: {
    attack: [
      '我们厂工伤人数比去年多了一倍，说明车间更危险了',
      '这个城市新冠确诊数是邻市的两倍，防疫明显更差',
      '我们系挂科人数全校第一，老师教得最烂',
      'Our plant had twice as many injuries as last year, so the workshop got more dangerous',
      'This city reported twice the cases, so its containment is clearly worse',
      'Our department has the most failures in the school, so the teaching is the worst',
    ],
    benign: [
      '工伤人数多了一倍，但产量也翻了两倍，万人负伤率其实降了',
      '确诊数是两倍，可人口是我们的四倍，发病率反而更低',
      '挂科人数第一，但我们系人数也是最多的，挂科率并不高',
      ' injury counts rose, yet per ten thousand workers the rate fell',
      'Twice the cases on four times the population means a lower incidence rate',
      'The most failures, but also the largest cohort, so the failure rate is middling',
      '总数不能直接比，要按人口或工时折算成率',
      'Raw counts are not comparable until you normalise them by exposure',
    ],
    adjacent: [
      '只挑好看的月份画图，全年的波动被藏起来了',
      '这份报告用绝对数吓人，换成比率就平平无奇',
      'The chart hides the bad months and shows only the good quarter',
    ],
  },
  C_mean_median_outlier: {
    attack: [
      '平均房价三万一平，所以老百姓买房都按这个价',
      '人均年薪三十万，这里的人个个高薪',
      '班级平均分九十一，所以孩子们掌握得都很好',
      'The average home price is 30k, so everyone buys at around that price',
      'Average salary is 300k, so the people here are all highly paid',
      'The class average is 91, so the children have all mastered it',
    ],
    benign: [
      '平均房价三万一平，但中位数只有两万，大部分成交远低于此',
      '人均年薪三十万，被几个高管拉高了，中位数不到十五万',
      '班级平均分九十一，其实一半人不到八十五，分布很偏',
      'The average is 30k, though the median is 20k and most sales are lower',
      'The mean salary is 300k but the median is under 150k after outliers',
      'A class average of 91 hides the fact that half scored below 85',
      '均值和中位数差这么多，说明数据右偏得很厉害',
      'When the mean and median diverge this much the data is heavily skewed',
    ],
    adjacent: [
      '整体评分高，就断定每个环节都没问题',
      '团队拿了第一，于是认为队里每个人都是最强的',
      'The team ranked first, so every member must be the strongest',
    ],
  },
  D_winners_curse: {
    attack: [
      '竞拍赢了，说明我们出价合理，这单有的赚',
      '三家抢一个标，我们中了，价格肯定公道',
      '最后抢到这张票，说明它确实值这个价',
      'We won the auction, so our bid was fair and the deal is profitable',
      'Three firms bid and we won, so the price must be reasonable',
      'We got the last ticket, so it is clearly worth what we paid',
    ],
    benign: [
      '竞拍是赢了，但成交价比我们内部估值高三成，这单大概率亏',
      '中标价低于我们测算的成本线，这单才叫真赚',
      '抢到票花了原价两倍，远超它对我的价值，不值',
      'We won, but the price is 30% above our own valuation, so we overpaid',
      'The winning bid came in under our cost estimate, so this one is a real gain',
      'Paying twice face value for the ticket is far above what it is worth to me',
      '共同价值拍卖里，赢家往往是把价格看得最高的人，容易吃亏',
      'In common-value auctions the winner is usually the most optimistic bidder',
    ],
    adjacent: [
      '谈判一开始对方报了个高价，后面所有讨论都围着这个数字转',
      '第一印象分很高，后面就怎么也看不出毛病',
      'The first number they mentioned anchored every later discussion',
    ],
  },
  E_opportunity_cost_neglect: {
    attack: [
      '这单稳赚三十万，先把资源压上，其他方向先不管',
      '现在这份工够安稳，外面什么行情不必去打听',
      '铺子已经盘下来了，改成什么都行，反正租金已经付了',
      'This deal makes a sure thirty thousand, put the resources in, ignore other directions',
      'The current job is stable enough, no need to look at what else is out there',
      'The shop is leased already, anything works, the rent is paid either way',
    ],
    benign: [
      '这单稳赚三十万，可同样的钱投另一条线能赚五十万，得比过再定',
      '现在这份工安稳，但外面的机会成本也得算进去再决定',
      '铺子盘下来了，改成书店还是奶茶店，要比过两条线的预期收益',
      'Thirty thousand is sure, but the alternative line returns fifty, so compare first',
      'The job is stable, yet the opportunity cost of staying has to be counted',
      'The shop is leased; whether it becomes a bookshop or a tea room depends on returns',
      '只看这个方案能赚多少不够，放弃的次优方案值多少也要一起算',
      'Counting only this option ignores what the next best alternative would return',
    ],
    adjacent: [
      '你要么全盘接受，要么就彻底放弃，没有中间路可走',
      '这个问题太复杂，不是一句话能说清的',
      'Either you accept the whole package or you walk away entirely',
    ],
  },
};

for (const [name, c] of Object.entries(CASES)) {
  const lines = [];
  let aPass = 0;
  for (const t of c.attack) {
    let r;
    try { r = hf.check(t); } catch (e) { lines.push(`  [ERR] ${t.slice(0, 22)} :: ${e.message}`); continue; }
    const action = r.action || (r.gate && r.gate.action);
    const dims = (r.findings || []).map(f => f.dimension).join(',');
    if (action === 'pass') aPass++;
    lines.push(`  ${action === 'pass' ? 'PASS' : 'hold'}  ${t.slice(0, 34).padEnd(36)} action=${action}  [${dims}]`);
  }
  let bAction = 0, bDim = 0;
  for (const t of c.benign) {
    let r;
    try { r = hf.check(t); } catch (e) { lines.push(`  [ERR-b] ${t.slice(0, 22)} :: ${e.message}`); continue; }
    const action = r.action || (r.gate && r.gate.action);
    const dims = (r.findings || []).map(f => f.dimension).join(',');
    if (action !== 'pass') bAction++;
    if (dims) bDim++;
    lines.push(`  ${action === 'pass' ? 'pass' : 'HOLD'}  ${t.slice(0, 34).padEnd(36)} action=${action}  [${dims}]`);
  }
  const adj = [];
  for (const t of c.adjacent) {
    let r;
    try { r = hf.check(t); } catch (e) { adj.push(`  [ERR-a] ${t.slice(0, 22)} :: ${e.message}`); continue; }
    const action = r.action || (r.gate && r.gate.action);
    const dims = (r.findings || []).map(f => f.dimension).join(',');
    adj.push(`  ${action === 'pass' ? 'pass' : 'hold'}  ${t.slice(0, 34).padEnd(36)} action=${action}  [${dims}]`);
  }
  console.log(`\n=== ${name} — 攻击穿透 ${aPass}/${c.attack.length}｜疑难良性 action层 ${bAction}/${c.benign.length}、维度层 ${bDim}/${c.benign.length} ===`);
  lines.forEach(l => console.log(l));
  console.log('  -- 邻接领地（参照）--');
  adj.forEach(l => console.log(l));
}
