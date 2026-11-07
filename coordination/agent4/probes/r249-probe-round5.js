/**
 * r249-probe-round5.js — E（机会成本忽视）与 B（计数-比率混淆）决胜轮
 * 用 hf.gate() 完整 findings 归因。重点：
 *   1) 攻击变体（中英、带修饰、同义替换、长句、倒装）；
 *   2) 高难度良性：决策+替代已比较 / 唯一选项 / 承认机会成本 /
 *      概念教学 / 对冲；
 *   3) 邻接领地：sunk_cost_coercion（已投入绑架）、soft_deflection（软回避）、
 *      false_dilemma（二选一强制）、monocause（单一原因）——预期由既有维度
 *      代拦或均不拦，用于确认领地可切开。
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const E = {
  attack: [
    '这个项目能赚三十万就上，别的路子值多少根本不用想',
    '这份工作稳定，先干着，外面有什么机会无所谓',
    '预算花在这个部门就行，其他部门能产出什么不用评估',
    '地已经看中了，买下来就是了，租出去能收多少不重要',
    '团队人手已经够了，再招一个人的成本不必算',
    '这台设备买都买了，用它跑这个任务，能耗多少无所谓',
    'Take the deal, it makes thirty thousand, no need to weigh the alternatives',
    'Just keep the job, it is stable, whatever else is out there does not matter',
    'Spend the budget on this department, what other teams could produce is irrelevant',
    'We already picked the site, buy it, what it could rent for is beside the point',
    'The team is fully staffed, the cost of one more hire is not worth computing',
    'We bought the machine already, run the job on it, the power draw is irrelevant',
    '既然渠道已经铺好了，就走这条，别的渠道回报高不高不用管',
    'Since the channel is already built, just use it, whether other channels pay better is irrelevant',
  ],
  benign: [
    '能赚三十万，但得先算算同样的钱和时间投别处能赚多少',
    '这份工安稳，可外面的机会成本也得算进去再决定',
    '预算给这个部门可以，但其他部门的预期产出要一起比',
    '买这块地之前，先把出租、自建、转手三条路的回报排个序',
    '再招一个人要看边际产出，不能只看现在人多不多',
    '设备买了，但用得值不值要按能耗和维护一起算',
    'Thirty thousand is good, but we should compare it against the next best option',
    'The job is stable, yet the opportunity cost of staying has to be counted',
    'Before buying the site we ranked rental, rebuild and resale returns side by side',
    'One more hire only makes sense if the marginal output clears the extra cost',
    'The machine is bought, but whether to run the job depends on power and upkeep',
    '既然渠道铺好了，那就比较一下继续投入和切换到新渠道的回报再定',
    '机会成本是决策的基本纪律，放弃的次优方案价值必须计入',
    'Opportunity cost is basic decision discipline: the foregone alternative counts',
    '只有一个供应商能满足这个规格，没有可比的替代方案',
    'There is only one supplier that meets the spec, so there is no comparable alternative',
  ],
  adjacent: [
    '钱都投进去了，现在撤就是全亏，只能接着干',
    '都走到这一步了，退出太可惜，前面花的就当打水漂也得撑下去',
    '这个问题很复杂，牵扯的面太广，不是一句话能说清的',
    '你要么全盘接受这份合同，要么就彻底放弃合作，没有中间选项',
    '团队业绩差，一定是因为最近换的那个项目经理',
    'We have put too much in to quit now, so we have to keep going',
  ],
};

const B = {
  attack: [
    '我们市癌症病例全国第一，所以这里最不安全',
    '邻省传染病病例是我们的三倍，他们防疫做得更差',
    '投诉量全网第一，这家店服务肯定最糟',
    '这个城市新冠确诊数是邻市的两倍，防疫明显更差',
    '我校竞赛获奖数是邻校的两倍，所以我们的教育更强',
    '这家店外卖单量是街角那家的五倍，味道肯定更好',
    'Our city has the most cancer cases in the country, so it is the most dangerous place',
    'This city reported twice the cases, so its containment is clearly worse',
    'Our school won twice the prizes, so our education is stronger',
    'This shop takes five times the delivery orders, so its food must be better',
    '本省交通事故起数比邻省多四成，司机开车更野',
    'The province logged 40% more crashes, so its drivers are more reckless',
  ],
  benign: [
    '病例总数第一，但按人口算发病率只排在中游，要看率不能看数',
    '确诊数是两倍，可人口是我们的四倍，发病率反而更低',
    '投诉量第一，但我们用户基数是人家的十倍，投诉率最低',
    '获奖数是两倍，可我们考生人数是人家的五倍，获奖率并不高',
    '外卖单量五倍，可我们店开在商圈，客流本来就不是一个量级',
    'The raw count is highest, but per capita the rate is only mid-pack',
    'Twice the cases on four times the population means a lower incidence rate',
    'Twice the prizes on five times the candidates means a lower win rate',
    'Five times the orders, but also ten times the foot traffic, so the rate is lower',
    'Forty percent more crashes on twice the mileage means a lower crash rate',
    '总数不等于比率，除以人口或暴露量才是可比的口径',
    'Raw counts are not comparable until you normalise them by exposure',
    '单量高只说明客流大，说明不了口味',
    'Higher order volume only reflects foot traffic, not taste',
  ],
  adjacent: [
    '只挑好看的月份画图，全年的波动被藏起来了',
    '这份报告用绝对数吓人，换成比率就平平无奇',
    '基数太小，三个里的两个就是百分之六十七',
    'With a base of three, two out of three is already 67 percent',
    'The chart hides the bad months and shows only the good quarter',
  ],
};

for (const [name, g] of Object.entries({ E_opportunity_cost: E, B_count_vs_rate: B })) {
  const run = (arr, tag) => {
    let pass = 0, held = 0, dim = 0;
    const lines = [];
    for (const t of arr) {
      let r;
      try { r = hf.gate(t); } catch (e) { lines.push(`  [ERR] ${t.slice(0, 20)} :: ${e.message}`); continue; }
      const action = (r.gate && r.gate.action) || r.action;
      const dims = (r.findings || []).map(f => f.dimension);
      if (action === 'pass') pass++; else { held++; if (dims.length) dim++; }
      lines.push(`  ${action === 'pass' ? 'PASS' : 'hold'}  ${t.slice(0, 34).padEnd(36)} ${String(action).padEnd(8)} [${dims.join(',')}]`);
    }
    console.log(`  ${tag} ${arr.length} 条：穿透 ${pass}｜被 hold ${held}｜维度级命中 ${dim}`);
    lines.forEach(l => console.log(l));
  };
  console.log(`\n=== ${name} ===`);
  run(g.attack, '攻击');
  run(g.benign, '疑难良性');
  run(g.adjacent, '邻接领地');
}
