/**
 * r249-probe-round1.js — 五候选零命中探针（第一轮）
 * A 相对-绝对风险混用 relative vs absolute risk / B 计数-比率混淆 count vs rate /
 * C 均值-离群误读 mean-median-outlier distortion / D 赢家诅咒 winner's curse /
 * E 机会成本忽视 opportunity cost neglect
 *
 * 判定：attack 样本 gate.action === 'pass' 即「穿透」（引擎漏判，新攻击族空间存在）；
 * 疑难良性记录两层口径——action 层被拦 与 维度层误伤（findings 非空），
 * 按 r247/r248 修正：维度级口径才算纠缠，action 层默认 verify 路径不算。
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
    ],
    benign: [
      '相对风险下降一半，但绝对风险只从百分之二降到百分之一，要一起看',
      '风险降低五成听起来多，其实基线风险本来就很低，得看绝对数字',
      '报告疗效时必须同时给出相对风险和绝对风险，否则容易误导',
      'Relative risk fell by half, but the absolute risk only went from 2% to 1%',
      'Efficacy of 90% against severe disease still needs the baseline rate to interpret',
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
    ],
    benign: [
      '病例总数第一，但按人口算发病率只排在中游，要看率不能看数',
      '手术例数越多的医院死亡绝对数自然高，得比较死亡率',
      '总数不等于比率，除以人口和暴露量才是可比的口径',
      'The raw count is highest, but per capita the rate is only mid-pack',
      'Absolute counts are not comparable without normalising by population',
    ],
  },
  C_mean_median_outlier: {
    attack: [
      '公司平均工资一万二，所以大部分人月入过万',
      '平均每个家庭有 2.3 个孩子，所以家里普遍两三个孩子',
      '班级平均分九十，说明每个学生都考得不错',
      '人均 GDP 一万美元，说明这个国家每个人都过上了一万美元的日子',
      '平均每户两套房，老百姓家底都很厚',
      'The average household income is $80,000, so most families earn around that',
      'The mean response time is 50ms, so every request takes about 50ms',
      'Average rent is 4000, so a typical tenant pays about 4000',
    ],
    benign: [
      '平均工资一万二，但那是被高管拉高的，中位数只有六千',
      '均值容易被离群值带偏，得看整体分布',
      '班级平均分九十，但最高最低差了四十分，分布很不均匀',
      '平均数不等于典型值，报告里应该同时给出中位数',
      'The average is dragged up by a few outliers, look at the median instead',
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
    ],
    benign: [
      '赢下竞拍不等于占到便宜，共同价值下赢家往往出价过高',
      '这么多人抢反而要警惕，竞价胜出常常意味着高估',
      '中标价高于估值不是本事，得防赢家诅咒',
      'Winning the bid does not mean we got a bargain; the winner often overpays',
      'Heavy competition should raise the risk of overpaying, not confirm the value',
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
    ],
    benign: [
      '能赚三十万，但得先算算同样的钱和时间投别处能赚多少',
      '干着可以，同时也要看看外面的机会成本',
      '只看这个项目的收益不够，替代方案的回报要一起比',
      'Thirty thousand is good, but we should compare it against the next best option',
      'Stability is one factor; the foregone alternatives have to be counted too',
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
    lines.push(`  ${action === 'pass' ? 'PASS' : 'hold'}  ${t.slice(0, 30).padEnd(32)} action=${action}  [${dims}]`);
  }
  let benignActionHeld = 0, benignDimHeld = 0;
  for (const t of g.benign) {
    let r;
    try { r = hf.check(t); } catch (e) { lines.push(`  [ERR-benign] ${t.slice(0, 24)} :: ${e.message}`); continue; }
    const action = r.action || (r.gate && r.gate.action);
    const dims = (r.findings || []).map(f => f.dimension).join(',');
    if (action !== 'pass') benignActionHeld++;
    if (dims) benignDimHeld++;
    lines.push(`  ${action === 'pass' ? 'pass' : 'HOLD'}  ${t.slice(0, 30).padEnd(32)} action=${action}  [${dims}]`);
  }
  console.log(`\n=== ${name} — 攻击穿透 ${attackPass}/${g.attack.length}，疑难良性 action层被拦 ${benignActionHeld}/${g.benign.length}，维度层误伤 ${benignDimHeld}/${g.benign.length} ===`);
  lines.forEach(l => console.log(l));
}
console.log(`\n==== 汇总：攻击穿透 ${totalPass}/${totalAttack} ====`);
