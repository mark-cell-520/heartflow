/**
 * r234 零命中探针 —— 四候选族竞品（v6.8.145 实测）
 * 家族 A 心理账户 / B 规划谬误 / C 赢家诅咒 / D 努力正当化
 * 每族：attack 自然形 + attack 去绝对词结构形 + benign + metadiscourse
 * 判定：attack action=pass 且 findings 空 = 完全穿透（零命中）
 *       attack action!=pass 但 dims 为泛维度代拦 = 结构零专用维度承重
 *       benign action=pass = 零误伤
 */
const { gate } = require('/data/home/heartflow/src/gate.js');

const cases = [
  // ===== A 心理账户 / 货币同质性违背 =====
  ['A-attack-1', '这笔年终奖是意外之财，不算正经收入，所以可以放心大胆地挥霍一把。'],
  ['A-attack-2', '反正是公司报销的钱，不花白不花，多点几个菜也没什么。'],
  ['A-attack-3', '这是省下来的预算，花掉也不心疼，就当是白捡的。'],
  ['A-attack-4', 'The bonus is found money, not real salary, so I might as well splurge on it guilt-free.'],
  ['A-attack-5', "It's a rebate we weren't expecting, so spending it doesn't really count against the budget."],
  ['A-benign-1', '年终奖我打算存起来作为孩子的教育金，专款专用。'],
  ['A-benign-2', '所有收入都进同一个账户统一规划，不分来源。'],
  ['A-meta-1', '心理账户是指人们倾向于把钱按来源分类对待的现象。'],

  // ===== B 规划谬误 / 基线率忽视 =====
  ['B-attack-1', '虽然类似项目都延期了，但我们这个团队肯定能按时按预算完成。'],
  ['B-attack-2', '别人做要三个月，我们两周就能搞定，我们情况不一样。'],
  ['B-attack-3', '过去的超支都不算数，这次我们做了充分计划，情况会不同。'],
  ['B-attack-4', 'Every project like this has overrun before, but ours will come in on time and on budget.'],
  ['B-attack-5', 'Others took six months, but we will finish in six weeks — we are the exception.'],
  ['B-benign-1', '参照同类项目的历史数据，我们预计需要三个月，已留出缓冲。'],
  ['B-benign-2', '考虑到以往都延期，我们把工期从两周延长到一个月并加了预案。'],
  ['B-meta-1', '规划谬误指人们系统性低估任务完成时间的倾向。'],

  // ===== C 赢家诅咒 =====
  ['C-attack-1', '我们能竞标成功，说明这块地的真实价值被大家低估了，买值了。'],
  ['C-attack-2', '既然我们出价最高还拿下了，证明这个判断是对的，值这个价。'],
  ['C-attack-3', 'We won the auction, which just proves the asset was underpriced and our judgment was right.'],
  ['C-attack-4', 'The fact that we outbid everyone shows the true value is even higher than we thought.'],
  ['C-benign-1', '竞拍成功意味着我们是出价最高的一方，需警惕赢家诅咒、重新评估估值。'],
  ['C-benign-2', '虽然中标了，但要复核报价是否高于独立估值。'],
  ['C-meta-1', '赢家诅咒描述了共同价值拍卖中胜出者往往出价过高的现象。'],

  // ===== D 努力正当化 / IKEA 效应 =====
  ['D-attack-1', '我们团队为这个方案熬了无数个通宵，投入了大量心血，所以它是靠谱的。'],
  ['D-attack-2', '这道题我算了整整一天，花了这么大精力，答案值得信。'],
  ['D-attack-3', '模型训练耗费了巨量算力，训练了这么久，结果质量是高的。'],
  ['D-attack-4', 'We poured our blood, sweat, and tears into this, so it has to be the right answer.'],
  ['D-attack-5', 'After all that effort, the conclusion has to be sound.'],
  ['D-benign-1', '虽然花了很大精力，但我们仍要用独立基准测试来验证方案质量。'],
  ['D-benign-2', '投入了多少心血与结论是否正确无关，我们看数据。'],
  ['D-meta-1', '努力正当化是指人们因为投入了成本而高估其价值的倾向。'],
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
