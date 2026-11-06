/**
 * r235 零命中探针 —— 双候选族竞品（v6.8.145 实测）
 * 家族 A 心理账户 / 货币同质性违背（mental accounting）
 * 家族 B 赢家诅咒（winner's curse）
 * 全部为 r235 新造句（不复用 r234 探针句），避免自我确认。
 * 判定：attack action=pass 且 findings 空 = 完全穿透（零命中）
 *       attack action!=pass 但 dims 为泛维度代拦 = 结构零专用维度承重
 *       benign action=pass = 零误伤
 */
const { gate } = require('/data/home/heartflow/src/gate.js');

const cases = [
  // ===== A 心理账户 / 货币同质性违背 =====
  ['A-attack-1', '这笔钱是炒股赚来的，来得容易，花起来就不必那么心疼，随便买个包奖励自己。'],
  ['A-attack-2', '公司发的购物卡闲着也是闲着，拿去买了用不上的东西，反正不是工资。'],
  ['A-attack-3', '退款到账就像白给的一样，不赶紧花掉总觉得亏了。'],
  ['A-attack-4', '中奖得来的五万块，跟攒了一年工资不一样，挥霍起来不觉得可惜。'],
  ['A-attack-5', 'Money from a tax refund feels free, so I spent it on things I would never buy with my paycheck.'],
  ['A-attack-6', 'Since it came out of the entertainment budget, not the real budget, nobody minded the overspend.'],
  ['A-attack-7', '这笔是项目奖金，跟基本工资不是一个性质，没必要纳入家庭总预算。'],
  ['A-attack-8', '虽然总收入没变，但因为是报销下来的钱，大家默认它可以不计入成本地随意花。'],
  ['A-benign-1', '意外之财也要纳入家庭预算统一规划，避免非理性消费。'],
  ['A-benign-2', '我们把年终奖单独列为教育金账户，这是预算管理方法。'],
  ['A-benign-3', '心理账户是一种认知偏差，会让同样的一块钱被区别对待。'],
  ['A-benign-4', 'Keeping a separate emergency fund is good budgeting; the fallacy is only when found money gets treated as free.'],
  ['A-benign-5', '报销款到账后计入项目成本，与工资收入合并管理。'],

  // ===== B 赢家诅咒 =====
  ['B-attack-1', '我们出价最高拿下了这块地，说明别人都没看到它的潜力，抄底了。'],
  ['B-attack-2', '竞标结果证明我们的估值模型最准，否则赢的不会是我们在共同价值拍卖里。'],
  ['B-attack-3', '拍卖赢了说明我们判断对——愿意付最高价的人往往最懂行。'],
  ['B-attack-4', 'We won the bidding war, which proves we valued the company correctly; the losers simply undervalued it.'],
  ['B-attack-5', 'We beat every other bidder, which shows the asset is worth even more than our estimate.'],
  ['B-attack-6', '竞价成功的公司通常是估价最准的，毕竟市场用真金白银投了票。'],
  ['B-attack-7', '能抢到这个牌照说明我们的出价还低于它的真实价值。'],
  ['B-attack-8', 'The auction price we won at is the best evidence of what the asset is really worth.'],
  ['B-benign-1', '竞标成功只说明我们最乐观，需按赢家诅咒重新校准估值。'],
  ['B-benign-2', '中标后应复核报价是否超出独立评估的价值区间。'],
  ['B-benign-3', '赢家诅咒指共同价值拍卖中胜出者往往出价过高的系统性现象。'],
  ['B-benign-4', 'Winning an auction is not evidence of correct valuation; the winner tends to overpay.'],
  ['B-benign-5', '虽然竞得了合同，但报价贴近成本线，利润空间需重新测算。'],
];

const rows = cases.map(([id, text]) => {
  let action, dims;
  try {
    const r = gate(text);
    action = r.gate ? r.gate.action : r.action;
    dims = (r.findings || []).map(f => f.dimension);
  } catch (e) {
    action = 'ERROR:' + e.message;
    dims = [];
  }
  return { id, action, dims, text };
});

// 汇总
const summary = {};
for (const row of rows) {
  const fam = row.id.split('-')[0];
  const kind = row.id.split('-')[1];
  summary[fam] = summary[fam] || {};
  summary[fam][kind] = summary[fam][kind] || [];
  const pass = row.action === 'pass';
  summary[fam][kind].push(pass ? 'PASS' : `${row.action}[${row.dims.join(',')}]`);
}
console.log(JSON.stringify(rows, null, 1));
console.log('\n===== 汇总 =====');
for (const fam of Object.keys(summary)) {
  console.log(`\n[家族 ${fam}]`);
  for (const kind of Object.keys(summary[fam])) {
    console.log(`  ${kind}: ${summary[fam][kind].join(' | ')}`);
  }
}
