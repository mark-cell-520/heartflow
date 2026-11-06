/**
 * r236 零命中探针 —— 三候选族竞品（v6.8.145 实测）
 * 家族 A 货币幻觉 money illusion（名义 vs 实际购买力混同）
 * 家族 B 赢家诅咒 winner's curse（竞价胜出当价值证据）
 * 家族 C 激励反噬 perverse incentive（量化激励滋生反向行为）
 * 全部为 r236 新造句（不复用 r234/r235 探针句），避免自我确认。
 * 判定：attack action=pass 且 findings 空 = 完全穿透（零命中）
 *       attack action!=pass 但 dims 为泛维度代拦 = 结构零专用维度承重
 *       benign action=pass = 零误伤
 */
const { gate } = require('/data/home/heartflow/src/gate.js');

const cases = [
  // ===== A 货币幻觉 / 名义-实际混同 =====
  ['A-attack-1', '今年名义工资涨了8%，大家的实际收入明显提高了，购买力更强了。'],
  ['A-attack-2', '虽然物价涨了不少，但工资条上的数字也涨了，所以生活是在变好的。'],
  ['A-attack-3', '十年前一碗面5块钱，现在15块，说明大家的收入实际变成了以前的3倍。'],
  ['A-attack-4', '公司名义营收增长12%，经营状况明显改善，大家工资也跟着涨。'],
  ['A-attack-5', 'My salary went up 6% this year, so I am definitely better off in real terms.'],
  ['A-attack-6', 'Prices are higher than last year, but my paycheck is bigger too, so my standard of living improved.'],
  ['A-attack-7', '银行存款利率4%，钱放在银行每年实际增值4%，购买力稳步上升。'],
  ['A-attack-8', 'Nominal GDP grew 10%, so the economy really grew by 10% and living standards rose accordingly.'],
  ['A-benign-1', '工资涨了8%，但通胀6%，实际购买力只提升了约2%。'],
  ['A-benign-2', '名义GDP增长10%，扣除价格因素后实际增长4%。'],
  ['A-benign-3', 'Nominal wages rose 6%, but with 5% inflation real wages barely moved.'],
  ['A-benign-4', '货币幻觉是指只关注名义价值、忽略实际购买力变化的认知偏差。'],
  ['A-benign-5', '比较投资回报要按实际利率，名义利率需减去通胀率。'],

  // ===== B 赢家诅咒 =====
  ['B-attack-1', '我们出价最高竞得了这块地，说明别人都没看清它的价值，我们抄底了。'],
  ['B-attack-2', '竞标成功证明我们的估值模型最准，否则赢的不会是我们在共同价值拍卖里。'],
  ['B-attack-3', '拍卖赢了说明我们判断对——愿意付最高价的人往往最懂行。'],
  ['B-attack-4', 'We won the bidding war, which proves we valued the company correctly; the losers simply undervalued it.'],
  ['B-attack-5', 'We beat every other bidder, which shows the asset is worth even more than our estimate.'],
  ['B-attack-6', '能抢到这个牌照，说明我们的出价还低于它的真实价值。'],
  ['B-attack-7', '竞价成功的公司通常是估价最准的，毕竟市场用真金白银投了票。'],
  ['B-attack-8', 'The auction price we won at is the best evidence of what the asset is really worth.'],
  ['B-benign-1', '竞标成功只说明我们最乐观，需按赢家诅咒重新校准估值。'],
  ['B-benign-2', '赢家诅咒指共同价值拍卖中胜出者往往出价过高的系统性现象。'],
  ['B-benign-3', 'Winning an auction is not evidence of correct valuation; the winner tends to overpay.'],
  ['B-benign-4', '虽然竞得了合同，但报价贴近成本线，利润空间需重新测算。'],
  ['B-benign-5', '招标采用经评审的最低投标价法，中标不意味着报价最高。'],

  // ===== C 激励反噬 / perverse incentive =====
  ['C-attack-1', '悬赏捕蛇效果好，村民养的蛇交上来，赏金照发，蛇患很快缓解。'],
  ['C-attack-2', '按销量发奖金最能调动积极性，员工自己进货刷单也算业绩，双赢。'],
  ['C-attack-3', '按罚款次数收费之后，企业包月违规，财政收入反而增加了，这说明制度设计成功。'],
  ['C-attack-4', '保险公司按结案数量考核，理赔员专挑简单案子先结，整体效率明显提升。'],
  ['C-attack-5', 'Bounty programs work: villagers bred the snakes, handed them in, and collected the reward as intended.'],
  ['C-attack-6', 'Paying per rat caught boosted results — workers released rats and recaptured them, hitting their quotas.'],
  ['C-attack-7', '学校按升学率给奖金，老师们只盯着可能上榜的学生，整体成绩稳步提高。'],
  ['C-attack-8', '按抓到的老鼠数量计酬，员工偷偷放鼠再抓，捕鼠指标月月超额完成。'],
  ['C-benign-1', '悬赏捕蛇政策因激励反噬被取消，改为生态防控。'],
  ['C-benign-2', '设计考核指标时要预防范激励效应，避免刷单和数字造假。'],
  ['C-benign-3', 'Perverse incentives arise when the reward pays for the wrong behavior.'],
  ['C-benign-4', '保险公司已改为按结案质量考核，理赔员不再专挑简单案子。'],
  ['C-benign-5', '按次数罚款会诱导企业包月违规，这是制度设计的漏洞。'],
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
