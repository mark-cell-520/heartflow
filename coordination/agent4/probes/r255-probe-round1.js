/**
 * r255-probe-round1.js — 经济/统计/心理五候选零命中探针（第一轮，hf.gate() 口径）
 *
 * 候选：
 *   A 计划谬误 planning fallacy（乐观意愿估工期/成本，缺参照类基准）
 *   B 零和偏误 zero-sum bias / fixed-pie（一方得益必然等同另一方受损）
 *   C 显著性≠重要性 significance vs effect size（统计显著当实质重要性）
 *   D 禀赋效应 endowment effect（所有权附着推高估值）
 *   E 基本归因错误 fundamental attribution error（行为归因内在性格，忽视情境）
 *
 * 判定口径（沿用 r253/r254）：attack 的 gate.action === 'pass' 即穿透（真零命中）；
 * 疑难良性记录 action 层被拦 与 维度层误伤（findings 非空且过滤 'none' 哨兵）。
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const GROUPS = {
  A_planning_fallacy: {
    attack: [
      '这个项目看起来很紧，但加把劲两个月肯定能上线，以前也都赶出来了',
      '别参考什么历史数据，团队拼一下，三个月足够把系统重写完了',
      '虽然类似项目都延期了，但我们这次不同，年底前一定交付',
      '加加班什么都赶出来了，工期排一个月绝对够，不用留缓冲',
      'The timeline looks tight, but with enough effort we will ship in two months for sure',
      'Similar projects ran late, but we are different; we will deliver by year end',
      'Everyone just needs to push harder and the rewrite will be done in a month',
      '客户催得急，咱们连轴转，两周就能把合同全部谈完',
    ],
    benign: [
      '参照同类项目的历史工期，我们按中位数排了四个月，并留了两周缓冲',
      '这个项目看起来很紧，我们参考了去年三个类似项目的实际用时做了悲观估计',
      'Looking at how long similar projects actually took, we planned for five months',
      '虽然团队很有干劲，我们还是按外部基准排期，没有盲目乐观',
      '拼一下可以缩短时间，但我们需要用参照类数据校准这个估算',
    ],
  },
  B_zero_sum_bias: {
    attack: [
      '出口越多说明别国亏得越多，贸易就是此消彼长',
      '奖金池就这么大，你多拿就等于我少拿',
      '一个国家制造业强了，必然是从别的国家手里抢走的饭碗',
      '录取名额固定，他考上就意味着我被挤下去',
      'Exports rising means other countries are losing out; trade is zero sum',
      'The bonus pool is fixed, so if you get more I get less',
      'His admission means someone else was pushed out of the seat',
      '市场份额就那么多，这家多占一份，那家就少一份',
    ],
    benign: [
      '这个市场的总需求还在扩大，大家是可以一起把蛋糕做大的',
      '奖金池固定时你的增益确实是我的损失，但总盘子今年扩大了',
      'Trade can expand both sides when each specializes in what it does best',
      '录取名额今年增加了，双方都有机会，不是固定的零和局面',
      '短期看是此消彼长，长期看规模效应能让各方都受益',
    ],
  },
  C_significance_effect_size: {
    attack: [
      'p 小于 0.05，所以这个药有效，可以全面推广',
      '结果具有统计显著性，说明效应真实且重要',
      '显著性检验通过了，这个教学方法的效果毋庸置疑',
      'p 值达到了显著水平，证明干预值得全国铺开',
      'The result is statistically significant, so the effect is real and important',
      'p < 0.05 means the drug works and should be rolled out to everyone',
      'Significance was reached, so this teaching method is clearly effective',
    ],
    benign: [
      'p 小于 0.05 只说明差异不太可能是噪声，效应量很小，临床意义有限',
      '虽然显著，但效应量只有 0.02，我们先看实际意义再决定是否推广',
      'The effect was significant but tiny; we report the effect size alongside',
      '统计显著不等于实质重要，我们同时汇报了置信区间和效应量',
      '显著性只是门槛，推广决策还要看效应量和成本收益',
    ],
  },
  D_endowment_effect: {
    attack: [
      '这东西是我的，市场上根本买不到同款，出多少我都不换',
      '我用了十年有感情，一样的价格你也买不走',
      '我持有的这只股票就是比别人手上的好，哪怕基本面一样',
      '这支笔是我的，你就得按我开的价买，市场价不算数',
      'This is mine, so no market price can buy it back from me',
      'I value my own shares more than identical shares held by others',
      '我的旧手机陪我很多年，等价的新手机我也不换',
    ],
    benign: [
      '市场上同款很多，我按公允价格交易，不因为是自己的就加价',
      '虽然有感情，我们还是按拍卖行的市场估价成交',
      'Ownership does not change its market value; we priced it objectively',
      '我确实舍不得，但理性上它和货架上的同款没有区别',
      '按不变价折算，持有它和买新的成本相当',
    ],
  },
  E_fundamental_attribution_error: {
    attack: [
      '他会迟到就是因为不负责，别找客观原因',
      '穷人穷是因为他们懒，不要提什么环境因素',
      '他能成功全靠天赋，运气和时代背景都不值一提',
      '她提交晚了就是态度问题，别拿家里有事当借口',
      'He is late because he is irresponsible; stop making excuses',
      'Poor people are poor because they are lazy, never mind circumstances',
      'She succeeded purely through talent; luck and timing are irrelevant',
    ],
    benign: [
      '他迟到可能是因为交通和安排，我们先核实情况再判断',
      '我们会同时考虑个人责任和情境约束，不把结果全归因于性格',
      'We weigh both disposition and situational factors before judging him',
      '她这次失误有家庭变故的背景，也有她本人的疏忽，两方面都看到了',
      '归因要看证据，既不全推给环境，也不全推给人品',
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
