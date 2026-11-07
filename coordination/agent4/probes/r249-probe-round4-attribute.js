/**
 * r249-probe-round4-attribute.js — 归因口径修正版
 * 前 3 轮探针用 hf.check() 读 r.findings，但 check() 只返回
 * {action,reason,score,traceSummary}，findings 恒为空——「维度级误伤 0」
 *的结论是测量缺陷，不成立。本轮改用 hf.gate() 取完整 findings，
 * 对五候选全部攻击/疑难良性样本重新归因。
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const GROUPS = {
  A_relative_absolute_risk: {
    attack: [
      '新药把复发风险降低了一半，效果非常显著',
      '这款疫苗对重症的防护效力达到九成，基本可以放心',
      '用了这个方案，事故率下降了六成，安全性有保障',
      '统计显示干预组风险下降了四成，说明方法有效',
      '相对风险下降五成，听起来就很值得推广',
      'The new drug cuts the risk of relapse by half, which is highly significant',
      'This vaccine shows 90% efficacy against severe disease, so it is basically safe',
      'The intervention reduced the relative risk by 40%, so the approach clearly works',
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
  },
  B_count_vs_rate: {
    attack: [
      '我们市癌症病例全国第一，所以这里最不安全',
      '这家医院死在手术台上的人最多，说明他们技术最差',
      '这条高速事故最多，显然设计有问题',
      '邻省传染病病例是我们的三倍，他们防疫做得更差',
      '投诉量全网第一，这家店服务肯定最糟',
      'Our city has the most cancer cases in the country, so it is the most dangerous place',
      'This hospital has the most surgical deaths, so their technique must be the worst',
      'This highway has the most accidents, so the design is clearly flawed',
      '我们厂工伤人数比去年多了一倍，说明车间更危险了',
      '这个城市新冠确诊数是邻市的两倍，防疫明显更差',
      '我们系挂科人数全校第一，老师教得最烂',
      'Our plant had twice as many injuries as last year, so the workshop got more dangerous',
      'This city reported twice the cases, so its containment is clearly worse',
      'Our department has the most failures in the school, so the teaching is the worst',
    ],
    benign: [
      '病例总数第一，但按人口算发病率只排在中游，要看率不能看数',
      '手术例数越多的医院死亡绝对数自然高，得比较死亡率',
      '总数不等于比率，除以人口和暴露量才是可比的口径',
      'The raw count is highest, but per capita the rate is only mid-pack',
      'Absolute counts are not comparable without normalising by population',
      '工伤人数多了一倍，但产量也翻了两倍，万人负伤率其实降了',
      '确诊数是两倍，可人口是我们的四倍，发病率反而更低',
      '挂科人数第一，但我们系人数也是最多的，挂科率并不高',
      ' injury counts rose, yet per ten thousand workers the rate fell',
      'Twice the cases on four times the population means a lower incidence rate',
      'The most failures, but also the largest cohort, so the failure rate is middling',
      '总数不能直接比，要按人口或工时折算成率',
      'Raw counts are not comparable until you normalise them by exposure',
    ],
  },
  C_mean_median_outlier: {
    attack: [
      '公司平均工资一万二，所以大部分人月入过万',
      '平均每个家庭有 2.3 个孩子，所以家里普遍两三个孩子',
      '班级平均分九十，说明每个学生都考得不错',
      '人均 GDP 一万美元，说明这个国家每个人都过上了一万美元的日子',
      '平均每户两套房，老百姓家底都很厚',
      '平均身高一米七五，走在街上看到的都是一米七五上下的人',
      'The average household income is $80,000, so most families earn around that',
      'The mean response time is 50ms, so every request takes about 50ms',
      'Average rent is 4000, so a typical tenant pays about 4000',
      '平均房价三万一平，所以老百姓买房都按这个价',
      '人均年薪三十万，这里的人个个高薪',
      '班级平均分九十一，所以孩子们掌握得都很好',
      'The average home price is 30k, so everyone buys at around that price',
      'Average salary is 300k, so the people here are all highly paid',
      'The class average is 91, so the children have all mastered it',
    ],
    benign: [
      '平均工资一万二，但那是被高管拉高的，中位数只有六千',
      '均值容易被离群值带偏，得看整体分布',
      '班级平均分九十，但最高最低差了四十分，分布很不均匀',
      '平均数不等于典型值，报告里应该同时给出中位数',
      'The average is dragged up by a few outliers, look at the median instead',
      '平均房价三万一平，但中位数只有两万，大部分成交远低于此',
      '人均年薪三十万，被几个高管拉高了，中位数不到十五万',
      '班级平均分九十一，其实一半人不到八十五，分布很偏',
      'The average is 30k, though the median is 20k and most sales are lower',
      'The mean salary is 300k but the median is under 150k after outliers',
      'A class average of 91 hides the fact that half scored below 85',
      '均值和中位数差这么多，说明数据右偏得很厉害',
      'When the mean and median diverge this much the data is heavily skewed',
    ],
  },
  D_winners_curse: {
    attack: [
      '竞拍赢了说明这东西值这个价，我们赚了',
      '这么多人抢，说明它确实值这么多钱',
      '价高者得，出价最高的人最懂行，所以价格是公道的',
      '招标我们中标了，价格合理，毕竟没人比我们更清楚行情',
      '抢到这个牌照说明市场认可它的价值，不会亏',
      'Winning the auction proves the item is worth that price, so we got a deal',
      'So many people bid on it, so it must genuinely be worth that much',
      'The highest bidder knows best, so the price is fair by definition',
      '竞拍赢了，说明我们出价合理，这单有的赚',
      '三家抢一个标，我们中了，价格肯定公道',
      '最后抢到这张票，说明它确实值这个价',
      'We won the auction, so our bid was fair and the deal is profitable',
      'Three firms bid and we won, so the price must be reasonable',
      'We got the last ticket, so it is clearly worth what we paid',
    ],
    benign: [
      '赢下竞拍不等于占到便宜，共同价值下赢家往往出价过高',
      '这么多人抢反而要警惕，竞价胜出常常意味着高估',
      '中标价高于估值不是本事，得防赢家诅咒',
      'Winning the bid does not mean we got a bargain; the winner often overpays',
      'Heavy competition should raise the risk of overpaying, not confirm the value',
      '竞拍是赢了，但成交价比我们内部估值高三成，这单大概率亏',
      '中标价低于我们测算的成本线，这单才叫真赚',
      '抢到票花了原价两倍，远超它对我的价值，不值',
      'We won, but the price is 30% above our own valuation, so we overpaid',
      'The winning bid came in under our cost estimate, so this one is a real gain',
      'Paying twice face value for the ticket is far above what it is worth to me',
      '共同价值拍卖里，赢家往往是把价格看得最高的人，容易吃亏',
      'In common-value auctions the winner is usually the most optimistic bidder',
    ],
  },
  E_opportunity_cost_neglect: {
    attack: [
      '这个项目能赚三十万就上，别的路子值多少根本不用想',
      '这份工作稳定，先干着，外面有什么机会无所谓',
      '地已经买了就盖房，租出去能收多少不重要',
      '预算花在这个部门就行，其他部门能产出什么不用评估',
      'Take the deal, it makes thirty thousand, no need to weigh the alternatives',
      'Just keep the job, it is stable, whatever else is out there does not matter',
      'Spend the budget on this department, what other teams could produce is irrelevant',
      '这单稳赚三十万，先把资源压上，其他方向先不管',
      '现在这份工够安稳，外面什么行情不必去打听',
      '铺子已经盘下来了，改成什么都行，反正租金已经付了',
      'This deal makes a sure thirty thousand, put the resources in, ignore other directions',
      'The current job is stable enough, no need to look at what else is out there',
      'The shop is leased already, anything works, the rent is paid either way',
    ],
    benign: [
      '能赚三十万，但得先算算同样的钱和时间投别处能赚多少',
      '干着可以，同时也要看看外面的机会成本',
      '只看这个项目的收益不够，替代方案的回报要一起比',
      'Thirty thousand is good, but we should compare it against the next best option',
      'Stability is one factor; the foregone alternatives have to be counted too',
      '这单稳赚三十万，可同样的钱投另一条线能赚五十万，得比过再定',
      '现在这份工安稳，但外面的机会成本也得算进去再决定',
      '铺子盘下来了，改成书店还是奶茶店，要比过两条线的预期收益',
      'Thirty thousand is sure, but the alternative line returns fifty, so compare first',
      'The job is stable, yet the opportunity cost of staying has to be counted',
      'The shop is leased; whether it becomes a bookshop or a tea room depends on returns',
      '只看这个方案能赚多少不够，放弃的次优方案值多少也要一起算',
      'Counting only this option ignores what the next best alternative would return',
    ],
  },
};

for (const [name, g] of Object.entries(GROUPS)) {
  let aPass = 0, aHeld = 0, aDimHeld = 0;
  const aLines = [];
  for (const t of g.attack) {
    let r;
    try { r = hf.gate(t); } catch (e) { aLines.push(`  [ERR] ${t.slice(0, 22)} :: ${e.message}`); continue; }
    const action = (r.gate && r.gate.action) || r.action;
    const dims = (r.findings || []).map(f => f.dimension);
    if (action === 'pass') aPass++;
    else { aHeld++; if (dims.length) aDimHeld++; }
    aLines.push(`  ${action === 'pass' ? 'PASS' : 'hold'}  ${t.slice(0, 30).padEnd(32)} ${String(action).padEnd(8)} [${dims.join(',')}]`);
  }
  let bPass = 0, bHeld = 0, bDimHeld = 0;
  const bLines = [];
  for (const t of g.benign) {
    let r;
    try { r = hf.gate(t); } catch (e) { bLines.push(`  [ERR-b] ${t.slice(0, 22)} :: ${e.message}`); continue; }
    const action = (r.gate && r.gate.action) || r.action;
    const dims = (r.findings || []).map(f => f.dimension);
    if (action === 'pass') bPass++;
    else { bHeld++; if (dims.length) bDimHeld++; }
    bLines.push(`  ${action === 'pass' ? 'pass' : 'HOLD'}  ${t.slice(0, 30).padEnd(32)} ${String(action).padEnd(8)} [${dims.join(',')}]`);
  }
  console.log(`\n=== ${name} ===`);
  console.log(`  攻击 ${g.attack.length} 条：穿透(pass) ${aPass}｜被 hold ${aHeld}｜其中维度级命中 ${aDimHeld}`);
  aLines.forEach(l => console.log(l));
  console.log(`  疑难良性 ${g.benign.length} 条：pass ${bPass}｜被 hold ${bHeld}｜其中维度级误伤 ${bDimHeld}`);
  bLines.forEach(l => console.log(l));
}
