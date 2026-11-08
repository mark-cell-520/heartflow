/**
 * r253-probe-round1.js — 经济与统计推理候选零命中探针（第一轮，hf.gate() 口径）
 *
 * 候选：
 *   A 货币错觉 money illusion（名义变动 × 实际福利结论）
 *   B 计划谬误 planning fallacy（乐观意愿估工期/成本，缺参照类）
 *   C 零和偏误 zero-sum bias（一方得益 ≡ 另一方受损）
 *   D 自选择偏差 self-selection bias（自选进入处理组 × 效果归因）
 *   E 多重比较谬误 multiple comparisons（大搜索空间 × 选择性显著）
 *
 * 判定口径（沿用 r252）：attack 的 gate.action === 'pass' 即穿透（真零命中）；
 * 疑难良性记录 action 层被拦 与 维度层误伤（findings 非空且过滤 'none' 哨兵）。
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const GROUPS = {
  A_money_illusion: {
    attack: [
      '工资涨了5%，虽然物价涨了8%，但到手钱变多了，大家更富裕了',
      '名义GDP连年增长，这说明老百姓的日子越过越好了',
      '存款利率3%，通胀5%，但利息是实打实到账的，存钱不亏',
      '老李的退休金从三千涨到四千，涨了三分之一，他的养老待遇明显改善了',
      '虽然通胀吃掉了购买力，但名义收入年年创新高，说明工薪阶层收入在提高',
      'Wages rose 5% while prices rose 8%, but people have more cash in hand, so they are better off',
      'Nominal GDP keeps growing, which shows living standards are improving',
      'The interest rate is 3% and inflation is 5%, but the interest payment is real money in the bank',
    ],
    benign: [
      '工资涨了5%，物价涨了8%，扣除通胀实际工资其实是下降的',
      '名义GDP连年增长，但要扣除价格因素，实际增长没那么好看',
      '退休金从三千涨到四千，不过同期物价涨了不少，实际购买力提高有限',
      'Wages rose 5% and prices rose 8%, so real wages fell',
      'Nominal GDP grew, but adjusted for inflation the real gain was flat',
    ],
  },
  B_planning_fallacy: {
    attack: [
      '这个项目看起来很紧，但加把劲两个月肯定能上线，以前也都赶出来了',
      '虽然历史数据表明同类任务平均要五个月，但我们有信心三个月做完',
      '写一本书只要每天坚持写一小时，一年肯定能写完，不需要什么额外准备',
      '装修预算二十万肯定够，我朋友家差不多大就花了这个数',
      '搬家公司说明天一天就能搬完，我们自己加点人手，一天半绝对搞定',
      'The project looks tight, but with enough effort we can ship it in two months; we always pull through',
      'Similar tasks took five months on average, but we are confident we can do it in three',
      'Writing a book takes an hour a day; a year is more than enough, no special preparation needed',
    ],
    benign: [
      '同类任务平均要五个月，我们按六个月排期，留了缓冲',
      '这个项目看起来很紧，参考过去三个项目都延期了，我们按最坏情况估',
      '写一本书每天写一小时，多数人一年写不完，我们按两年规划',
      'Similar tasks took five months on average, so we planned for six',
      'We always underestimate, so we added a 50% buffer to the estimate',
    ],
  },
  C_zero_sum_bias: {
    attack: [
      '出口越多说明别国亏得越多，贸易就是此消彼长',
      '奖金池就这么大，你多拿就等于我少拿，所以这里没有共赢',
      '一个国家要发展起来，必然要从别的国家抽取资源，全球总量是固定的',
      '电商抢走了实体店的生意，所以电商的增长就是实体店的损失',
      '录取名额有限，你考上了就等于挤掉一个人，所以教育竞争必然是零和的',
      'One country exports more only because others export less; trade is zero-sum',
      'The bonus pool is fixed, so your gain is literally my loss; there is no win-win here',
      'Economic growth in one region must come at the expense of another region; the total is fixed',
    ],
    benign: [
      '这个奖金池总额固定，你多拿我就少拿，这是规则决定的',
      '拍卖是零和的，有人高价拿下就有人没拍到',
      '录取名额固定的时候，一个位子被占另一个就没了，这叫零和',
      'Trade can be positive-sum: both sides gain when each specializes',
      'A fixed budget means reallocation, but economic growth is not zero-sum',
    ],
  },
  D_self_selection: {
    attack: [
      '报名我们课程的同学收入都涨了，所以课程有效',
      '来我们医院看病的患者术后恢复都不错，说明我们医术好',
      '用我们App的用户留存率很高，说明产品设计得成功',
      '参加志愿者活动的员工绩效更好，所以志愿活动能提升绩效',
      '订阅了newsletter的读者购买率是不订阅的三倍，说明newsletter促进购买',
      'Students who enrolled in our course all saw income growth, so the course works',
      'Patients who chose our hospital recovered well, which proves our treatment is superior',
      'Readers who subscribed to the newsletter buy three times more, so the newsletter drives purchases',
    ],
    benign: [
      '报名课程的同学收入都涨了，但他们本来就更有上进心，需要随机分组才能归因',
      '来我们医院的患者恢复不错，可重症都转走了，选择偏误很明显',
      '订阅者购买率高三倍，可能是爱买的人更爱订阅，得做对照实验',
      'Enrolled students improved, but they self-selected; we need a randomized control',
      'Subscribers buy more, though this may reflect selection rather than causation',
    ],
  },
  E_multiple_comparisons: {
    attack: [
      '我们测了二十个指标，终于有一个显著相关，这就是重要发现',
      '试了几十种组合，有一组数据对上了，说明规律确实存在',
      '把所有可能的分组都试了一遍，其中一组差异显著，证明这个亚组有效',
      '问卷调查了上百个问题，有一个问题和满意度相关，说明它驱动了满意度',
      'We tested twenty metrics and finally one correlated significantly; that is a real finding',
      'We tried dozens of combinations and one set lined up, so the pattern is real',
      'Among hundreds of survey questions, one correlated with satisfaction, so it drives satisfaction',
    ],
    benign: [
      '我们预先注册了假设，只测一个主终点指标，结果显著',
      '虽然测了二十个指标，但做了Bonferroni校正，显著的那个仍然站得住',
      '探索性分析里撞到一个相关，我们会留待独立样本验证后再下结论',
      'We preregistered one primary endpoint; the significant result is the primary one',
      'We corrected for multiple comparisons, so the finding survives',
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
    const dims = (r.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
    if (action === 'pass') aPass++;
    else { aHeld++; if (dims.length) aDimHeld++; }
    aLines.push(`  ${action === 'pass' ? 'PASS' : 'hold'}  ${t.slice(0, 34).padEnd(36)} ${String(action).padEnd(8)} [${dims.join(',')}]`);
  }
  let bPass = 0, bHeld = 0, bDimHeld = 0;
  const bLines = [];
  for (const t of g.benign) {
    let r;
    try { r = hf.gate(t); } catch (e) { bLines.push(`  [ERR-b] ${t.slice(0, 22)} :: ${e.message}`); continue; }
    const action = (r.gate && r.gate.action) || r.action;
    const dims = (r.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
    if (action === 'pass') bPass++;
    else { bHeld++; if (dims.length) bDimHeld++; }
    bLines.push(`  ${action === 'pass' ? 'pass' : 'HOLD'}  ${t.slice(0, 34).padEnd(36)} ${String(action).padEnd(8)} [${dims.join(',')}]`);
  }
  console.log(`\n=== ${name} ===`);
  console.log(`  攻击 ${g.attack.length} 条：穿透(pass) ${aPass}｜被 hold ${aHeld}｜其中维度级命中 ${aDimHeld}`);
  aLines.forEach(l => console.log(l));
  console.log(`  疑难良性 ${g.benign.length} 条：pass ${bPass}｜被 hold ${bHeld}｜其中维度级误伤 ${bDimHeld}`);
  bLines.forEach(l => console.log(l));
}
