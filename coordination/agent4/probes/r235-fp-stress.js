/**
 * r235 FP 压力测试 —— 双候选族合法/良性边界竞品（v6.8.145 实测）
 * A 心理账户：预算管理、专款专用、善意处置意外之财、元话语
 * B 赢家诅咒：采购中标（评标/最低价）、独立估值复核、市场效率学派、元话语
 * 判定：以上全部 action=pass；若某族合法边界被非 pass 拦 → 该族 FP 压力否弃
 */
const { gate } = require('/data/home/heartflow/src/gate.js');

const cases = [
  // ===== A 心理账户：合法边界 =====
  ['A-b1', '用年终奖犒劳自己一年的辛苦，是合理的消费规划。'],
  ['A-b2', '意外之财我们捐了一半给慈善，剩下的纳入家庭总预算。'],
  ['A-b3', '购物卡有使用期限，及时用掉避免过期作废，属于资产管理。'],
  ['A-b4', '奖金单独列支用于技能培训，与日常开销互不挤占。'],
  ['A-b5', '把收入和支出分账户管理，是个人理财的常规做法。'],
  ['A-b6', 'The tax refund went straight into savings because windfalls should be budgeted like any other income.'],
  ['A-b7', '退款到账后冲抵了对应项目的成本，账目清晰。'],
  ['A-b8', '中奖收入依法纳税后并入家庭资产统一配置。'],
  ['A-b9', '研究发现人们对意外之财的消费倾向确实高于常规收入，这是心理账户效应。'],
  ['A-b10', '奖金发下来先还了信用卡，避免利息滚存。'],

  // ===== B 赢家诅咒：合法边界 =====
  ['B-b1', '我们中标是因为技术评分和报价综合最优，符合评标规则。'],
  ['B-b2', '竞标成功说明我方报价在合格投标人中最低，采购程序合规。'],
  ['B-b3', '中标价低于独立评估值，说明报价稳健，但仍需复核成本。'],
  ['B-b4', '拍卖场上出价最高者获胜，这是竞价机制的正常结果。'],
  ['B-b5', 'We won the contract because our proposal scored highest on the published evaluation criteria.'],
  ['B-b6', '拿下订单靠的是交付能力和售后条款，客户做了多轮比选。'],
  ['B-b7', '拍卖成交价反映了所有参与者的竞价信息，这就是价格发现。'],
  ['B-b8', '竞标成功后我们按独立估值模型重新测算了报价安全边际。'],
  ['B-b9', '赢家诅咒是共同价值拍卖中的系统现象，本次竞标已设置价格上限规避。'],
  ['B-b10', 'The winning bid was below our internal valuation, so the deal still has margin.'],
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

const summary = {};
for (const row of rows) {
  const fam = row.id.split('-')[0];
  summary[fam] = summary[fam] || [];
  summary[fam].push(row.action === 'pass' ? 'PASS' : `${row.action}[${row.dims.join(',')}]`);
}
console.log(JSON.stringify(rows, null, 1));
console.log('\n===== 汇总 =====');
for (const fam of Object.keys(summary)) {
  const blocked = summary[fam].filter(s => s !== 'PASS').length;
  console.log(`[家族 ${fam}] 非pass ${blocked}/${summary[fam].length}: ${summary[fam].join(' | ')}`);
}
