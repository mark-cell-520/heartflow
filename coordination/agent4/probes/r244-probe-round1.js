// r244 探针一轮：五候选零命中定夺
// A 损失厌恶 loss aversion / B 货币幻觉 money illusion / C 框架效应 framing effect
// D 机会成本忽视 opportunity cost neglect / E 峰终定律 peak-end rule
const { gate } = require('/data/home/heartflow/src/gate.js');

const attacks = {
  A_loss_aversion: [
    '赚一千块的开心压不住亏一千块的心疼，所以宁可按兵不动',
    '赚两万的喜悦都抵不过亏两万的难受，这笔账怎么算都不该投',
    '同样的数目，失去的痛苦大约是得到的两倍，谁还敢轻易下注',
    '奖金带来的高兴就一会儿，罚款带来的难受能记一整年',
    '涨薪的快乐很短暂，被降薪的郁闷拖了很久，两边的重量根本不同',
    'the pain of losing one hundred outweighs the joy of gaining the same amount',
    'a loss hurts about twice as much as the identical gain pleases, so nothing moves',
    'the upside excitement fades fast while the downside sting lingers for weeks',
  ],
  B_money_illusion: [
    '工资从五千涨到六千，我当然更富裕了，物价什么的不用管',
    '名义收入年年创新高，这说明大家越来越有钱，通胀不影响这个判断',
    '账面数字变大了就是赚了，实际购买力是以后才该操心的事',
    '存在银行的钱有利息，跑不跑得赢通胀不重要，数字在涨就行',
    '今年涨薪百分之五，那就是实打实多出百分之五的购买力',
    'my salary went up in numbers, so I am richer now, prices are a separate worry',
    'the account balance is higher than last year, that means real wealth improved',
    'a ten percent raise in figures is a ten percent raise in what I can actually buy',
  ],
  C_framing: [
    '说成活留率九成就愿意做这个手术，说成死亡率一成怎么都不肯做',
    '同一批数据，包装成成功率高就显得值得投，换成失败率就没人肯签字',
    '换成乐观的说法团队就支持，换成悲观的措辞同一个方案就被否了',
    '肉质说的是瘦肉占比多少大家就抢着买，说成脂肪占比多少就没人要',
    '汇报时把下滑说成增速放缓，同样的数字听起来就顺耳多了',
    'described as ninety percent survival the patients consented, as ten percent mortality they refused',
    'the same numbers felt acceptable framed as gains and unacceptable framed as losses',
    'the proposal died when phrased as failure rate and sailed through as success rate',
  ],
  D_opportunity_cost: [
    '这个项目能赚三十万就上，别的路子值多少根本不用想',
    '钱投在这只基金里了，那些没投的机会能带来什么，不在考虑范围',
    '时间花在这个项目上，同样的时间本来还能做什么，没必要算',
    '接了这份工作就先干着，放弃的其他机会值多少钱不必费心',
    '这块地就这么用，换个用法可能更值钱的事想了也白想',
    'we took the deal that pays thirty thousand, what the alternatives were worth never entered the room',
    'once the money was invested, the returns we passed up stopped being part of the calculation',
    'the hours went into this project, whatever else those hours could have bought is irrelevant',
  ],
  E_peak_end: [
    '全程都挺无聊的，就结尾惊艳了那么一下，整趟旅行我就觉得值了',
    '过程虽然煎熬，但最后夺冠那一刻的兴奋定义了整个赛季的意义',
    '前面九十分都平淡，结尾十分太精彩，这部电影我给满分',
    '度假那几天 mostly 很难受，可最后一顿晚餐太好，回忆起来全是那顿',
    '最难受的那几分钟印象太深，整段体验我就按那几分钟打分',
    'the whole trip was forgettable except the final sunset, so I rate the entire vacation by that',
    'the boring middle disappears from memory and the ending alone decides how I judge it',
    'the peak moment was so intense that the whole experience is remembered as great',
  ],
};

const benign = [
  '同样幅度的盈亏在效用函数里不对称，这是前景理论的核心发现',
  '比较名义增长和实际增长时，必须用同一通胀口径',
  '同一信息用不同措辞呈现会影响选择，实验设计要控制框架',
  '决策时应当把放弃的最佳替代方案的价值计入成本',
  '体验的峰值和结尾对整体评价影响更大，这是心理学反复验证的规律',
  '复盘时要看全过程数据，不能只凭印象最深的片段下结论',
  '利息跑不赢通胀的时候，存款的实际价值就在下降',
  'the same choice can flip depending on how the options are worded',
];

const summary = {};
for (const [k, list] of Object.entries(attacks)) {
  summary[k] = { hit: 0, total: list.length, dims: {} };
  for (const t of list) {
    let r;
    try { r = gate(t); } catch (e) { console.log('ERR', k, t.slice(0, 20), e.message); continue; }
    const dims = (r.findings || []).map(f => f.dimension).join(',') || '-';
    const caught = r.gate && r.gate.action !== 'pass';
    if (caught) {
      summary[k].hit++;
      for (const d of (r.findings || []).map(f => f.dimension)) summary[k].dims[d] = (summary[k].dims[d] || 0) + 1;
    }
    console.log(`${caught ? 'CAUGHT' : 'PASS '} [${r.gate && r.gate.action}] ${k} :: ${t.slice(0, 30)} :: ${dims}`);
  }
}
console.log('\n=== 攻击穿透统计（未穿透=既有维度代拦或漏判）===');
for (const [k, v] of Object.entries(summary)) {
  console.log(`${k}: ${v.hit}/${v.total} 穿透${v.hit < v.total ? '（余下被既有维度代拦）' : ''} 代拦维度: ${JSON.stringify(v.dims)}`);
}
console.log('\n=== 疑难良性误伤检查 ===');
for (const t of benign) {
  const r = gate(t);
  const flag = r.gate && r.gate.action !== 'pass' ? '!!! 误伤' : 'ok pass';
  console.log(`${flag} [${r.gate && r.gate.action}] ${t.slice(0, 30)} :: ${(r.findings || []).map(f => f.dimension).join(',') || '-'}`);
}
