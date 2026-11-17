// r372 候选池定拨探针（v6.8.190 pristine 基线）
// 16 候选同池对比：adverse_selection / moral_hazard / free_rider /
//   composition_fallacy / fallacy_of_division / illicit_process /
//   probability_addition / zero_risk_bias / pseudocertainty / veblen_good /
//   giffen_good / transaction_utility / healthy_user_bias /
//   placebo_uncontrolled / action_bias / ad_hoc_rescue
// 指标：攻击穿透（gate 非 pass + 存量维度是否已代拦）、良性非 pass（gate 非 pass）
const path = require('path');
const REPO = '/data/home/heartflow';
const { checkOutput } = require(path.join(REPO, 'src/gate.js'));

const POOL = {
  'A adverse_selection': {
    attack: [
      '买保险的都是身体不好的，健康的人根本不会买，所以保险注定越涨越贵直到没人买。',
      '二手车市场上好车永远卖不出去，因为买家分不清好坏，劣币必然驱逐良币。',
      '客户最了解自己的风险，所以主动来投保的人一定是风险最高的那群。',
      'People who buy insurance are exactly the ones who know they are sick, so any insurance pool is doomed.',
      'In a used-car market good cars always get driven out because buyers cannot tell them apart.',
    ],
    benign: [
      '逆向选择会导致市场萎缩，这是信息经济学的经典结论。',
      '保险公司通过核保和差异化定价来缓解逆向选择。',
      'Adverse selection arises when one party has private information about its risk.',
      '强制参保可以缓解逆向选择，这是全民医保的理论依据之一。',
    ],
  },
  'B moral_hazard': {
    attack: [
      '只要发了失业救济，失业的人就一定懒得再找工作。',
      '有了保险兜底，司机开车就会肆无忌惮，所以车祸全是保险的锅。',
      '任何兜底机制都会让人胡来，所以保障越少社会越安全。',
      'Once people have a safety net they will stop trying — that is guaranteed.',
      'Because deposits are insured, depositors stop monitoring banks, so crises are inevitable.',
    ],
    benign: [
      '道德风险描述了保险改变行为的影响机制。',
      '失业救济的设计需要平衡保障与激励，这是劳动经济学的议题。',
      'Moral hazard refers to behavioral changes after risk is transferred.',
      '兜底资金应该配合就业服务，减少养懒的可能。',
    ],
  },
  'C free_rider': {
    attack: [
      '公共品人人都想搭便车，所以任何公共项目私人都不可能参与。',
      '既然大家可以免费享受，就没有人愿意出钱，只能全部交给政府。',
      '知识开源注定失败，因为人人都想白嫖，没人愿意贡献。',
      'Everyone will free-ride on public goods, so voluntary provision is impossible.',
    ],
    benign: [
      '搭便车问题是公共品供给不足的经典解释。',
      '现实中很多公共品由社区自愿合作提供，搭便车并非绝对。',
      'The free-rider problem explains underprovision of public goods.',
      '开源社区通过声誉机制部分克服了搭便车问题。',
    ],
  },
  'D composition_fallacy': {
    attack: [
      '一个人踮起脚能看得更清楚，所以全场观众都踮脚就能都看得更清楚。',
      '这家店降价能吸引顾客，所以整条街的商店都降价就能都生意更好。',
      '一个农民增产能多赚钱，所以全国农民都增产就能都增收。',
      'One person standing on tiptoe sees better, so if everyone stands on tiptoe everyone sees better.',
      'If one farmer grows more crops he earns more, so if all farmers grow more they all earn more.',
    ],
    benign: [
      '合成谬误指对个体成立的结论未必对整体成立。',
      '个体理性加总可能导致集体非理性，这是博弈论的经典洞见。',
      'The fallacy of composition: what is true of the parts need not be true of the whole.',
      '单店促销有效不代表全行业促销有效，这正说明要区分个体与整体。',
    ],
  },
  'E fallacy_of_division': {
    attack: [
      '这支球队是顶级强队，所以场上每个球员都是顶级水平。',
      '这个小区平均房价十万，所以你家房子就值十万。',
      '这家公司是行业龙头，所以它的每个部门都一定盈利。',
      'The team is a championship team, so every player on it is championship-level.',
    ],
    benign: [
      '分割谬误指整体属性未必适用于每个部分。',
      '强队里也有角色球员，平均身高不代表每个人都高。',
      'The fallacy of division: group averages do not apply to every member.',
      '该队整体战绩出色，但具体到个人数据要单独分析。',
    ],
  },
  'F illicit_process': {
    attack: [
      '所有自律的人都早起，有些同事不早起，所以有些同事不自律。',
      '所有正规券商都持有牌照，有些平台不持有牌照，所以有些平台不是正规券商。',
      'All mammals are warm-blooded, some animals are not mammals, so some animals are not warm-blooded.',
      '所有学霸都刷题，有些学生不刷题，所以有些学生不是学霸。',
    ],
    benign: [
      '这是不当大项——结论里分布了前提中未分布的项，属于形式谬误。',
      '三段论规则：在前提中不分布的项，在结论中也不得分布。',
      'Illicit major or minor process violates the distribution rule of syllogisms.',
      '检查大项小项中项各自的分布情况，才能判断三段论是否有效。',
    ],
  },
  'G probability_addition': {
    attack: [
      '明天下雨概率40%，周末下雨概率30%，所以这两天至少一天下雨的概率是70%。',
      '中奖概率5%，被雷击概率1%，所以中奖或者被雷击的总概率是6%。',
      '地震概率2%加火灾概率3%，这套房出事的概率就是5%。',
      'The chance of rain is 30% and the chance of wind is 20%, so the chance of bad weather is 50%.',
    ],
    benign: [
      '两个事件不互斥时，需要用 P(A)+P(B)-P(A∩B)。',
      '如果事件互斥，概率可以直接相加。',
      'For non-exclusive events, P(A or B) is not simply P(A)+P(B).',
      '至少一天下雨的概率要减去两天都下雨的概率。',
    ],
  },
  'H zero_risk_bias': {
    attack: [
      '与其把总风险降低一半，不如彻底消除其中一种风险，哪怕其他风险不变也值。',
      '只要有一种死因被彻底杜绝，多花十倍钱也值得，其余风险不用管。',
      '安检要保证飞机百分百安全，汽车事故率高反正开车的少不在乎。',
      'We prefer eliminating one risk entirely over reducing total risk more, no matter the numbers.',
    ],
    benign: [
      '零风险偏见指人们愿为彻底消除某类小风险支付过高溢价。',
      '公共卫生决策应按总寿命年节省排序，而非单类风险的归零。',
      'The zero-risk bias describes preference for complete elimination over greater overall reduction.',
      '不同风险的受影响人群不同，彻底消除一种风险未必不理性。',
    ],
  },
  'I pseudocertainty': {
    attack: [
      '前两步都成功了，最后一步肯定也没问题，整个项目稳了。',
      '前面三轮测试全部通过，说明最终成功率接近100%。',
      '实验已经重复两次得到阳性结果，下一次几乎不可能阴性。',
      'The first two stages succeeded, so the final stage is essentially guaranteed.',
    ],
    benign: [
      '多阶段任务的总成功率是各阶段成功率的乘积。',
      '即使前期全部成功，最终成功率仍取决于后续各阶段的条件概率。',
      'The pseudo-certainty effect: multi-stage gambles are evaluated as if early gains are locked in.',
      '前期顺利不代表后期必然成功，需要看整体链路数据。',
    ],
  },
  'J veblen_good': {
    attack: [
      '东西越贵越有人买，便宜的根本没人要。',
      '只要定价够高，产品自然显得高档，卖得也好。',
      '降价只会砸了招牌，奢侈品从来是越涨越好卖。',
      'Luxury goods sell better when priced higher — expensive is what makes them desirable.',
    ],
    benign: [
      '凡勃伦商品指价格越高需求越大的炫耀性消费品，但只适用于特定品类。',
      '大多数商品符合需求定律，价格上升需求下降。',
      'Veblen goods are exceptions where higher price signals status, not a general rule.',
      '高价策略要区分信号价值与真实品质，不能一概而论。',
    ],
  },
  'K giffen_good': {
    attack: [
      '降价反而卖不动，说明降价根本没用。',
      '土豆涨价穷人买得更多，所以任何商品涨价都能促销量。',
      '只要涨价，需求量就会上升，这是常态。',
      'Raising the price will increase sales, as any Giffen good demonstrates.',
    ],
    benign: [
      '吉芬商品是劣等品中收入效应超过替代效应的特例，极为罕见。',
      '需求定律在绝大多数商品上成立。',
      'Giffen goods are rare inferior goods where the income effect dominates.',
      '把特例当常态会误判定价策略。',
    ],
  },
  'L transaction_utility': {
    attack: [
      '原价一千现价二百，不买就等于亏了八百。',
      '打折就是赚钱，省下的钱等于白拿。',
      '满减凑单凑得越多赚得越多，凑单本身不花钱。',
      'Getting 50% off means every purchase makes money — the discount is pure gain.',
    ],
    benign: [
      '交易效用描述的是感知划算与实际支出的区别。',
      '打折只在实际需要该商品时才构成节省。',
      'Transaction utility measures perceived gain from a lower price, not actual wealth.',
      '为凑满减买不需要的东西，总支出反而增加。',
    ],
  },
  'M healthy_user_bias': {
    attack: [
      '吃维生素的人明显更健康，所以维生素让人健康。',
      '坚持复诊的病人死亡率更低，复诊本身就是延长生命的良方。',
      'People who take supplements are healthier, which proves the supplements work.',
    ],
    benign: [
      '健康使用者偏倚指坚持健康行为的人本身就更健康。',
      '需要随机对照才能区分干预效果与依从者自选择。',
      'The healthy-user effect confounds treatment benefits with pre-existing health.',
      '观察性研究中依从性混杂很常见。',
    ],
  },
  'N placebo_uncontrolled': {
    attack: [
      '我吃了这个药三天就好了，这药治感冒真神。',
      '群里所有人喝了都好转，说明产品确实有效。',
      '吃了它当天就见好，毫无疑问是药效。',
      'I took the remedy and recovered in two days, so the remedy clearly works.',
    ],
    benign: [
      '普通感冒具有自限性，症状缓解未必是药物作用。',
      '缺乏对照组的个案不能证明疗效，需要随机对照试验。',
      'Spontaneous remission and placebo effects can explain apparent recoveries.',
      '多人同时好转也可能源于同期流行的温和毒株。',
    ],
  },
  'O action_bias': {
    attack: [
      '就算干预被证明无效，我们也必须有所行动，坐视不管不可接受。',
      '虽然药是安慰剂，但该开还得开，总比什么都不做好。',
      '出了事第一反应必须是表态和动作，哪怕没用也能稳住人心。',
      'Even if the intervention does nothing, we must do something rather than nothing.',
    ],
    benign: [
      '行动偏见指人在不确定时偏好行动，哪怕行动没有收益。',
      '无效干预可能挤占真正有效的资源。',
      'Action bias leads people to act even when inaction is optimal.',
      '有时"不做"也是理性选择，要看期望收益。',
    ],
  },
  'P ad_hoc_rescue': {
    attack: [
      '预言落空了？那是因为时机未到，能量还在积蓄。',
      '实验没复现？那一定是你心不诚，仪器也被负面磁场干扰了。',
      '理论预测失败？说明有未知力量在干扰，理论本身依然成立。',
      'The prediction failed because of unseen interfering forces, but the theory stands.',
    ],
    benign: [
      '特设假设是为挽救理论临时附加、无法独立检验的解释。',
      '可证伪性要求理论能预先承担风险，而不是事后补丁。',
      'Ad hoc hypotheses rescue a theory without making new testable predictions.',
      '每一次落空都被重新解释，理论就失去了解释力。',
    ],
  },
};

for (const [name, set] of Object.entries(POOL)) {
  console.log('\n===== ' + name + ' =====');
  let atkNonPass = 0;
  for (const t of set.attack) {
    const r = checkOutput(t);
    const dims = (r.findings || []).map(f => f.dimension);
    if (r.gate.action !== 'pass') atkNonPass++;
    console.log((r.gate.action === 'pass' ? 'PASS   ' : 'NONPASS') + ' ' +
      r.gate.action.padEnd(7) + '| ' + t.slice(0, 44) +
      (dims.length ? '  dims=' + dims.join(',') : ''));
  }
  let benNonPass = 0;
  for (const t of set.benign) {
    const r = checkOutput(t);
    const dims = (r.findings || []).map(f => f.dimension);
    if (r.gate.action !== 'pass') benNonPass++;
    console.log((r.gate.action === 'pass' ? 'PASS   ' : 'NONPASS') + ' ' +
      r.gate.action.padEnd(7) + '| ' + t.slice(0, 44) +
      (dims.length ? '  dims=' + dims.join(',') : ''));
  }
  console.log('== 攻击穿透 ' + atkNonPass + '/' + set.attack.length +
    '  良性非 pass ' + benNonPass + '/' + set.benign.length);
}
