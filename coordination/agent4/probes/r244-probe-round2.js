// r244 探针二轮：五候选加判定夺
// 每族：攻击变体（测穿透）+ 族特异性疑难良性（测误伤）+ 邻接既有维度领地句（测边界）
const { gate } = require('/data/home/heartflow/src/gate.js');

const attacks = {
  A_loss_aversion: [
    '赚一万的高兴就三天，亏一万的难受能拖三个月，重量差太多',
    '到手的钱带来的快乐，总填不上失去同等数额挖走的痛',
    '得与失在心里的刻度从来不一样，亏的那边永远更沉',
    '白捡一百元的欣喜，远远抵不上丢一百元的懊恼',
    '奖金到账那阵子挺开心，罚款交完那股堵能持续到年底',
    '赢面的诱惑再大，也压不住输面可能带来的疼',
    'the joy of finding money is smaller than the sting of losing the same amount',
    'gains register as small wins while the matching loss registers as a wound',
    'a raise feels nice for a week, a pay cut stings for months, the scale is uneven',
    'the happiness from extra income never matches the misery from an equal shortfall',
  ],
  B_money_illusion: [
    '今年工资条上的数字比去年大，日子就是更宽裕了，通胀是宏观的事',
    '存款余额一路往上走，这说明我越来越有钱，购买力不用单独想',
    '月薪涨了百分之八，那我每个月实际能多买百分之八的东西',
    '合同金额从三十万变成三十五万，收入就是实打实涨了六分之一',
    '名义上多出来的都是真金白银，物价涨不涨不影响这笔进账的分量',
    '利息年年到账，本金加利息越来越多，谁还去算实际价值那本账',
    '工资数字翻倍就是生活水平翻倍，这是最基本的道理',
    'my paycheck shows a bigger number, so my real purchasing power grew too',
    'the account grew from ten to twelve thousand, meaning I am two thousand richer in real terms',
    'nominal income keeps climbing, so living standards keep climbing with it',
  ],
  C_framing: [
    '医生说成功率百分之九十五我立刻签字，说失败率百分之五我马上想换家医院',
    '同一份体检报告，写指标正常率九成家属就安心，写异常率一成家属就炸了',
    '政策说成惠及九成群众大家拥护，说成一成群众不受益大家就上街',
    '招聘启事写每年淘汰率百分之十没人来，写成留存率百分之九十挤破头',
    '产品介绍写满意度百分之九十好评如潮，写差评率百分之十就被冲了',
    'the surgery pitched as ninety five percent survival was accepted instantly',
    'phrased as a ten percent failure the same surgery was rejected outright',
    'the plan sailed when framed as mostly success and died when framed as partly failure',
    '九成好评的说法让人放心，一成差评的说法让人警惕，明明是同一批评价',
    '描述方式一换，同样的数字就让人的选择完全颠倒',
  ],
  D_opportunity_cost: [
    '这个标的中了就全力干，其他标的本来能赚多少，没工夫算',
    '铺子盘下来就专心做餐饮，同样的钱做别的业态回报如何不必想',
    '周末都用来加班了，这些时间陪家人或者学习的价值无从谈起',
    '录取通知书接了就去读，拒掉的那个专业未来值多少不在账上',
    '库存积压就积压着，仓储资金本可以产生的收益没人提',
    '设备买定就装上了，另选一款省下的电费和人工从来不计',
    'we signed the contract and moved on, what the runner up deal was worth never mattered',
    'the weekend hours went to overtime, their value elsewhere was never priced',
    'the deposit went into this house, the returns other properties would have paid were left out',
    'hiring this candidate closed the search, the second choice future value stayed uncounted',
  ],
  E_peak_end: [
    '中间三小时的排队都忘了，只记得过山车俯冲那三秒，这趟来得值',
    '整季比赛就记最后绝杀那个球，前面三十场的挣扎全部不算数',
    '展会两天平淡无奇，离场前拿到一个样品，我对整个展会的评价就定了',
    '会议全程昏昏欲睡，结束时发了个红包，大家回忆起来居然觉得不错',
    '项目做了八个月，上线当天事故频出，前面所有的顺利都被这一个晚上盖过',
    '旅途的疲惫想不起来了，海里那场日落定义了整次旅行的质量',
    'the three hour queue vanished from memory, the three second drop decided the day',
    'the whole season is judged by the final buzzer beater and nothing before it',
    'the two boring conference days disappear, the last handout colors my whole rating',
    'eight months of smooth work are erased by one bad launch night in the retelling',
  ],
};

// 每族对应的疑难良性：正确推理/教学/替代方案被正确计入的形态，必须全部 pass
const trickyBenign = {
  A_loss_aversion: [
    '评估这笔投资时，我们把下行空间和上行空间分别测算后再加权',
    '亏损带来的心理冲击确实更大，所以仓位管理要控制最大回撤',
    '前景理论指出损失段的效用曲线比收益段更陡峭，这是教科书结论',
    '这个方案盈亏对称，风险收益比经过测算是一比一',
  ],
  B_money_illusion: [
    '比较两代人的收入时，必须扣除通胀因素换算成不变价',
    '存款利率低于通胀率，实际收益为负，这是基本算术',
    '合同金额按名义值签订，但付款计划里约定了调价条款',
    '今年工资涨了百分之六，物价涨了百分之二，实际购买力改善了',
  ],
  C_framing: [
    '问卷两种问法都跑了，交叉验证结论不受措辞影响',
    '同一组数字用收益框架和损失框架呈现，是研究框架效应的标准做法',
    '这份报告同时列出了存活率和死亡率，避免单向框架误导',
    '销售材料里只保留有利说法，删掉不利数字，这是片面呈现',
  ],
  D_opportunity_cost: [
    '选 A 不选 B，是因为 B 的预期收益折现后低于 A，都算过了',
    '决策矩阵里把各选项的机会成本单列了一行，统一比较',
    '资源有限，我们按各方案的预期回报排序后取前两名',
    '辞职的代价里包含了放弃的薪水和期权价值，这些都计入了',
  ],
  E_peak_end: [
    '复盘要覆盖全流程数据，峰值和结尾的权重不应超过过程本身',
    '用户调研同时采集了过程评分和整体满意度，交叉验证',
    '这场比赛要从攻防效率、失误率等全程指标来评价，不看单个镜头',
    '旅行回忆里印象最深的是日出，但整体评分我们还是按每天记录打的',
  ],
};

// 邻接既有维度领地句：这些即便被既有维度代拦也正常，用来看本族是否与既有维度结构重叠
const boundary = {
  sunk_cost: [
    '钱都投了这么多了，现在退出前面就全白费了，只能硬着头皮继续',
    '这段感情谈了五年，沉没成本太高，分手太亏只能将就',
  ],
  endowment: [
    '这个杯子是我用了三年的，出多少钱都不卖，市场上买不到的',
    '公司是我一手做起来的，估值再高也衡量不了它的价值',
  ],
  disposition: [
    '赚钱的仓位我早就落袋了，亏损的那只死扛到现在都不肯割',
    '涨一点就急着平仓，跌下去反倒心安理得地长期持有',
  ],
  false_precision: [
    '本次调研覆盖率为百分之九十九点七三，结论精确到小数点后两位',
    '预计增长率将精确达到百分之七点二一，一个百分点都不带差的',
  ],
  equivocation: [
    '他说的是自愿加班，和大家理解的强制加班不是一个意思',
    '这里的公平指程序公平，换到分配领域又是另一套标准',
  ],
  hasty_generalization: [
    '问了身边三个人都说好，所以这款产品一定大卖',
    '两篇论文都支持这个结论，可见整个学界已经达成共识',
  ],
};

const summary = {};
for (const [k, list] of Object.entries(attacks)) {
  summary[k] = { pass: 0, total: list.length, dims: {} };
  for (const t of list) {
    let r;
    try { r = gate(t); } catch (e) { console.log('ERR', k, t.slice(0, 20), e.message); continue; }
    const dims = (r.findings || []).map(f => f.dimension).join(',') || '-';
    const penetrated = !(r.gate && r.gate.action !== 'pass');
    if (penetrated) summary[k].pass++;
    else for (const d of (r.findings || []).map(f => f.dimension)) summary[k].dims[d] = (summary[k].dims[d] || 0) + 1;
    console.log(`${penetrated ? 'PENET ' : 'CAUGHT'} [${r.gate && r.gate.action}] ${k} :: ${t.slice(0, 26)} :: ${dims}`);
  }
}
console.log('\n=== 攻击穿透统计（穿透=既有引擎零命中）===');
for (const [k, v] of Object.entries(summary)) {
  console.log(`${k}: ${v.pass}/${v.total} 穿透${v.pass < v.total ? '（余下被既有维度代拦）' : ''} 代拦维度: ${JSON.stringify(v.dims)}`);
}
console.log('\n=== 族特异性疑难良性误伤检查（须全 pass）===');
for (const [k, list] of Object.entries(trickyBenign)) {
  for (const t of list) {
    const r = gate(t);
    const flag = r.gate && r.gate.action !== 'pass' ? '!!! 误伤' : 'ok pass';
    console.log(`${flag} [${r.gate && r.gate.action}] ${k} :: ${t.slice(0, 26)} :: ${(r.findings || []).map(f => f.dimension).join(',') || '-'}`);
  }
}
console.log('\n=== 邻接既有维度领地（代拦正常，看重叠）===');
for (const [k, list] of Object.entries(boundary)) {
  for (const t of list) {
    const r = gate(t);
    console.log(`[${r.gate && r.gate.action}] ${k} :: ${t.slice(0, 24)} :: ${(r.findings || []).map(f => f.dimension).join(',') || '-'}`);
  }
}
