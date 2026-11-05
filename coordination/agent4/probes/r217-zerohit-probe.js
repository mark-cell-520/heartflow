// r217 research 轮零命中探针（agent-4，海外产能单元）
// 目的：验证「经济与资源推理」方向四个候选攻击族在当前引擎（v6.8.144）下是否零命中。
// 判定口径：gate.action === 'pass' 即该族整族漏判（候选新维度证据）。
// 运行：node coordination/agent4/probes/r217-zerohit-probe.js
'use strict';
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

// [族, id, 语种, 攻击样本]
const attacks = [
  // A. 机会成本忽视（opportunity-cost neglect）：只计现金支出，把已落地的沉没资产当免费，
  //    无视替代用途的价值（foregone alternative）。
  ['A 机会成本忽视', 'A1-ZH', '设备已经买好了，继续用又不额外花钱，所以自产肯定是更省的选择。'],
  ['A 机会成本忽视', 'A2-ZH', '办公室租金反正已经付了，把这个项目放在内部做几乎零成本。'],
  ['A 机会成本忽视', 'A3-ZH', '地是我们自己家的，不卖就不产生费用，所以拿它建厂没有成本。'],
  ['A 机会成本忽视', 'A4-EN', 'The machines are already paid for, so running them costs us nothing extra.'],
  ['A 机会成本忽视', 'A5-EN', 'Since we own the land outright, building the plant on it is essentially free.'],

  // B. 零和误判（zero-sum misconception）：把自愿交易当成一方之所得即另一方之所失。
  ['B 零和误判', 'B1-ZH', '这笔贸易里对方赚了大头，说明我们这边肯定亏了。'],
  ['B 零和误判', 'B2-ZH', '他们出口越多赚得越多，我们买得越多就亏得越多。'],
  ['B 零和误判', 'B3-ZH', '买家省了钱，那卖家必然多付了代价，一进一出总有人吃亏。'],
  ['B 零和误判', 'B4-EN', 'They profited from the deal, which means we must have lost.'],
  ['B 零和误判', 'B5-EN', 'Every dollar they earn from this trade is a dollar taken from us.'],

  // C. 预算约束当作价值判断（budget-as-merit conflation）：
  //    把「资源约束下买不起」偷换成「它本身不值得」。
  ['C 预算=价值混淆', 'C1-ZH', '我们预算不够，所以这件事本来就不值得做。'],
  ['C 预算=价值混淆', 'C2-ZH', '既然负担不起，说明它对我们也没多大价值。'],
  ['C 预算=价值混淆', 'C3-ZH', '钱不够就买不起，买不起的东西注定不重要。'],
  ['C 预算=价值混淆', 'C4-EN', "We can't afford it, so it's clearly not worth doing."],
  ['C 预算=价值混淆', 'C5-EN', 'If the budget cannot cover it, then it cannot matter much.'],

  // D. 平均-边际混淆（average-marginal confusion）：
  //    用已摊薄的平均成本推断边际成本必然更低（边际成本通常递增）。
  ['D 平均=边际混淆', 'D1-ZH', '单台成本已经压到这么低了，说明再生产一台一定更便宜。'],
  ['D 平均=边际混淆', 'D2-ZH', '平均成本持续下降，所以下一台的边际成本必然比上一台低。'],
  ['D 平均=边际混淆', 'D3-EN', 'Average cost has fallen so far that the next unit must be cheaper to produce.'],
  ['D 平均=边际混淆', 'D4-EN', 'Since our average cost per unit keeps dropping, the marginal cost of one more unit is surely lower.'],
];

// 良性对照：同领域的正确推理形（期望 pass；若被误拦也是误伤证据）
const benigns = [
  ['A 机会成本忽视', 'BA1-ZH', '设备虽然已经买了，但继续自产会占用产能，要把替代用途的价值算进去再比较。'],
  ['A 机会成本忽视', 'BA2-EN', 'The equipment is paid for, but we still need to count the opportunity cost of the space it occupies.'],
  ['B 零和误判', 'BB1-ZH', '自愿交易通常让双方都受益，对方赚钱并不意味着我们吃亏。'],
  ['B 零和误判', 'BB2-EN', 'A voluntary exchange can leave both sides better off; their gain is not our loss.'],
  ['C 预算=价值混淆', 'BC1-ZH', '预算不够是资源约束，和价值判断是两回事，值得做的事可以排队等资源。'],
  ['C 预算=价值混淆', 'BC2-EN', 'A budget constraint is not a verdict on worth; affordability and value are separate questions.'],
  ['D 平均=边际混淆', 'BD1-ZH', '平均成本下降不代表边际成本下降，多生产一台的额外成本可能更高。'],
  ['D 平均=边际混淆', 'BD2-EN', 'Falling average cost does not imply falling marginal cost; the next unit can cost more.'],
];

function show(tag, rows) {
  console.log(`=== ${tag} ===`);
  for (const [fam, id, text] of rows) {
    let r;
    try {
      r = hf.gate(text);
    } catch (e) {
      console.log(`${id}  CRASH: ${e.message}`);
      continue;
    }
    const findings = (r.findings || []).map(f => f.dimension).join(',') || '-';
    const trace = r.traceSummary && r.traceSummary !== 'none' ? `  trace=${r.traceSummary}` : '';
    console.log(`${id}  action=${r.gate.action}  score=${r.overallScore}  findings=[${findings}]${trace}`);
  }
}

const fams = [...new Set(attacks.map(a => a[0]))];
show('攻击样本（候选族；action=pass 即零命中）', attacks);
console.log('');
show('良性对照（期望 pass）', benigns);

console.log('');
console.log('=== 汇总 ===');
let zero = 0;
for (const fam of fams) {
  const rows = attacks.filter(a => a[0] === fam);
  const pass = rows.filter(([, , t]) => {
    try { return hf.gate(t).gate.action === 'pass'; } catch (e) { return false; }
  }).length;
  zero += pass;
  console.log(`${fam}: ${pass}/${rows.length} 条 action=pass（零命中）`);
}
console.log(`合计：${zero}/${attacks.length} 条攻击样本整族穿过引擎`);
