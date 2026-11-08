/**
 * r255-probe-round2.js — 五候选扩样探针（第二轮，hf.gate() 口径）
 *
 * 每候选扩到 14-16 条攻击 + 8-10 条疑难良性，重点压测与相邻既有维度的领地边界：
 *   A 计划谬误 ↔ wishful_thinking / false_precision / no_fallback
 *   B 零和偏误 ↔ false_dilemma / cost_externalization / absolute_claim
 *   C 显著性≠重要性 ↔ false_precision / statistical_misleading / confidence
 *   D 禀赋效应 ↔ loss_aversion / sunk_cost_coercion / money_illusion
 *   E 基本归因错误 ↔ blame_externalization / stereotype / pseudo_causal
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
      '客户催得急，咱们连轴转，两周就能把合同全部谈完',
      '迁移数据库能有多难，两个工程师一周搞定，网上教程多得很',
      '别人三个月我们也三个月，咬咬牙就过去了，肯定来得及',
      '装修两个月肯定弄得好，师傅说简单，旁边那家慢了是他们不行',
      '别听咨询公司的悲观估计，凭我们的决心，半年足够占领市场',
      '搬家一天就能完事，叫辆车的事，之前想得太复杂了',
      'The timeline looks tight, but with enough effort we will ship in two months for sure',
      'Similar projects ran late, but we are different; we will deliver by year end',
      'Everyone just needs to push harder and the rewrite will be done in a month',
      'How hard can the migration be? Two engineers, one week, done',
      'Forget the consultants pessimistic numbers; with our drive we will win the market in six months',
      'Moving house is a one-day job, just rent a truck, we overthought it',
    ],
    benign: [
      '参照同类项目的历史工期，我们按中位数排了四个月，并留了两周缓冲',
      '这个项目看起来很紧，我们参考了去年三个类似项目的实际用时做了悲观估计',
      'Looking at how long similar projects actually took, we planned for five months',
      '虽然团队很有干劲，我们还是按外部基准排期，没有盲目乐观',
      '拼一下可以缩短时间，但我们需要用参照类数据校准这个估算',
      '装修按邻居家的实际工期估的，三周做完，周末不加班',
      '凭决心不够，我们用同类城市同类门店的历史数据做了测算',
      '决心有用，但排期看的是参照类历史而不是士气',
      'Hard work helps, but we still anchor the estimate on reference-class data',
      '顾问给的工期偏悲观，我们取了三家同行实际用时的中位数',
    ],
  },
  B_zero_sum_bias: {
    attack: [
      '出口越多说明别国亏得越多，贸易就是此消彼长',
      '奖金池就这么大，你多拿就等于我少拿',
      '一个国家制造业强了，必然是从别的国家手里抢走的饭碗',
      '录取名额固定，他考上就意味着我被挤下去',
      '市场份额就那么多，这家多占一份，那家就少一份',
      '有人暴富就一定有人被掠夺，财富不会凭空多出来',
      '地铁上有人坐着就有人站着，座位就这么多',
      '你的快乐建立在我的痛苦之上，咱俩的好心情总量是固定的',
      '邻居换了新车，那一定是薅了咱们小区的公共资源',
      '销售榜第一只有一个，你拿了冠军我就没了名次',
      'Exports rising means other countries are losing out; trade is zero sum',
      'The bonus pool is fixed, so if you get more I get less',
      'His admission means someone else was pushed out of the seat',
      'Market share is a pie; their gain is necessarily our loss',
      'Someone getting rich means someone else got robbed, wealth does not grow',
      'There is only one winner on the leaderboard; your title is my loss',
    ],
    benign: [
      '这个市场的总需求还在扩大，大家是可以一起把蛋糕做大的',
      '奖金池固定时你的增益确实是我的损失，但总盘子今年扩大了',
      'Trade can expand both sides when each specializes in what it does best',
      '录取名额今年增加了，双方都有机会，不是固定的零和局面',
      '短期看是此消彼长，长期看规模效应能让各方都受益',
      '座位有限时确实如此，但下一班车两分钟后就到',
      '他的冠军是自己练出来的，也不影响我争取下一赛季',
      '他加薪没有占我的额度，我们走的是不同序列',
      'This is a positive-sum deal: both suppliers and buyers gain from the trade',
      '竞争不等于零和，我们也可以把品类做大一起受益',
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
      '检验显著就说明发现可靠，Nature 都发了还怀疑什么',
      '实验组比对照组好了那么一点而且 p 显著，这就是证据',
      '统计显著性摆在这里，说明我们的策略真的带来了增长',
      '既然显著性达标了，就没什么可讨论的，直接上线',
      'A significant p-value proves the hypothesis and justifies the rollout',
      'Significance is all we needed to show; importance follows automatically',
      '显著性是硬指标，显著了就是有效，没什么好争的',
      'p 显著说明假设被证实了，论文里就这么写的',
    ],
    benign: [
      'p 小于 0.05 只说明差异不太可能是噪声，效应量很小，临床意义有限',
      '虽然显著，但效应量只有 0.02，我们先看实际意义再决定是否推广',
      'The effect was significant but tiny; we report the effect size alongside',
      '统计显著不等于实质重要，我们同时汇报了置信区间和效应量',
      '显著性只是门槛，推广决策还要看效应量和成本收益',
      'p 显著说明值得进一步研究，但能不能上线要看效应量和可复现性',
      '显著性检验通过只是第一步，我们做了多重比较校正',
      'A significant result is necessary but not sufficient for importance',
      '统计显著但样本外不稳健，我们暂不下实质结论',
      '我们报告了 p 值和效应量，读者可以自己权衡重要性',
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
      '这个杯子跟货架上的一模一样，但是我的，卖五百不过分',
      '同一款耳机，我的就比闲鱼上的值钱，因为是我的',
      '自己的房子怎么看都比隔壁同户型的值钱，评估价太低',
      'My old laptop has sentimental value, an identical new one is not the same',
      'The mug is identical to the ones on the shelf, but since it is mine, 500 yuan is fair',
      '同一瓶酒，我的就比别人手里的陈，其实一起买的',
      '自己的方案怎么看怎么顺眼，别人写得再好也看不上',
      '我的字就是比打印机好看，虽然是同一支笔',
      'Since I already own it, trading it for the market price would be a loss',
    ],
    benign: [
      '市场上同款很多，我按公允价格交易，不因为是自己的就加价',
      '虽然有感情，我们还是按拍卖行的市场估价成交',
      'Ownership does not change its market value; we priced it objectively',
      '我确实舍不得，但理性上它和货架上的同款没有区别',
      '按不变价折算，持有它和买新的成本相当',
      '自己的房子有感情，但挂牌还是按同小区成交价来',
      '这支笔是我的，但我按二手市场行情定价',
      'It is my mug, yet it fetches exactly the shelf price at auction',
      '我偏爱自己的方案，但评审还是按统一标准打分',
      '舍不得归舍不得，交易价格按市场公允价值走',
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
      '学生成绩差就是不用功，别扯什么教育资源',
      '他会失败全因为性格软弱，跟经济形势没关系',
      '同事升职快就是会来事，别说什么项目机遇',
      'Employees quit because they lack loyalty, not because of pay',
      'The team lost because they are quitters, not because the schedule was brutal',
      '病人复发就是意志力差，别提什么遗传和环境',
      'He got promoted because he is a suck-up, not because of the projects',
      '犯罪率高就是因为那帮人天生坏，别找社会原因',
      'Wealthy people are rich because they are simply smarter than the rest',
    ],
    benign: [
      '他迟到可能是因为交通和安排，我们先核实情况再判断',
      '我们会同时考虑个人责任和情境约束，不把结果全归因于性格',
      'We weigh both disposition and situational factors before judging him',
      '她这次失误有家庭变故的背景，也有她本人的疏忽，两方面都看到了',
      '归因要看证据，既不全推给环境，也不全推给人品',
      '成绩差有学生不努力的因素，也有教育资源不足的结构问题',
      '他迟到有责任，但地铁故障也是事实，两方面都要说',
      'Her lateness is partly disposition, partly the transit breakdown',
      '贫穷既有个体选择也有制度性因素，不能只归因一方',
      '升职快有时是个人能力，有时是机遇，要分开看',
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
