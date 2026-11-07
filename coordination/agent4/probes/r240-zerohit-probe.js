// r240 dimension 轮前置零命中探针（agent-4，海外产能单元）
// 目的：验证五个候选攻击族在当前引擎（v6.8.145）下是否零命中。
// 判定口径：gate.action === 'pass' 即该样本整族穿过引擎（候选新维度证据）。
// 注意：攻击句避开绝对词（一定/必然/肯定/显然/绝对），逼出结构层漏判。
// 运行：node coordination/agent4/probes/r240-zerohit-probe.js
'use strict';
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

// [族, id, 攻击样本] —— 攻击形＝推理者本人被框住/犯该族谬误
const attacks = [
  // A. 处置效应：盈利仓位过早落袋、亏损仓位死扛——盈亏状态驱动不对称处置。
  ['A 处置效应', 'A1-ZH', '我这只票涨了四成，先落袋为安，套牢的那只再拿拿，总能涨回来的。'],
  ['A 处置效应', 'A2-ZH', '赚钱的股票赚一点我就卖，亏钱的反而越跌越拿，实践证明这样心态最稳。'],
  ['A 处置效应', 'A3-ZH', '基金浮盈的先赎回保住成果，浮亏的那只继续补仓摊低成本，等下一轮反弹。'],
  ['A 处置效应', 'A4-EN', 'I cash out winners as soon as they are up a notch, but I ride losers for months because they will bounce back.'],
  ['A 处置效应', 'A5-EN', 'He sells winning positions early and holds losing ones for years, calling it prudent risk management.'],
  ['A 处置效应', 'A6-EN', 'Take profits quickly but give losing trades time to recover — that is how regret is avoided.'],

  // B. 虚假共识效应：把自己的判断未经检验外推为群体共识。
  ['B 虚假共识', 'B1-ZH', '我觉得这个方案挺靠谱，同事们肯定也是这么想的，不会有人有意见。'],
  ['B 虚假共识', 'B2-ZH', '这个价格我觉得不贵，大多数人应该都能接受，没必要再调研。'],
  ['B 虚假共识', 'B3-ZH', '我喜欢这个设计，用户八成也会喜欢，直接上线吧。'],
  ['B 虚假共识', 'B4-EN', 'I think the plan is solid, so my colleagues surely see it the same way and nobody will object.'],
  ['B 虚假共识', 'B5-EN', 'The price seems fair to me, which means most customers will accept it without any further research.'],
  ['B 虚假共识', 'B6-EN', 'I like the design, so users will probably love it too — just ship it.'],

  // C. 邓宁-克鲁格效应：自陈无训练却高度自信越级评判并贬低专业者。
  ['C 邓宁-克鲁格', 'C1-ZH', '我没学过设计，但一眼就看得出他们那些所谓名家的作品全是炒作。'],
  ['C 邓宁-克鲁格', 'C2-ZH', '虽然我没训练过，但我听两句就知道这个歌手功底不行，专业人士捧得太过了。'],
  ['C 邓宁-克鲁格', 'C3-ZH', '外行怎么了，我看了几场比赛，这些球员的跑位明显有问题，教练组太业余。'],
  ['C 邓宁-克鲁格', 'C4-EN', 'I have never studied design, but I can tell at a glance that those so-called masters are all hype.'],
  ['C 邓宁-克鲁格', 'C5-EN', 'No training here, yet two bars into the song I can hear the vocalist has no real technique.'],
  ['C 邓宁-克鲁格', 'C6-EN', 'I am no expert, but after a few games even I can see the striker\'s positioning is wrong.'],

  // D. 样本量不敏感：小样本比例当精确总体估计。
  ['D 样本量不敏感', 'D1-ZH', '问了10个人，9个说好用，所以这款产品90%的用户都会喜欢。'],
  ['D 样本量不敏感', 'D2-ZH', '这个月3个客户投诉，次品率已经高到不能接受，按这个比例找供应商索赔。'],
  ['D 样本量不敏感', 'D3-ZH', '样本虽然只有5个，但5个里5个都复购了，复购率100%，下个季度的预算就按这个数做。'],
  ['D 样本量不敏感', 'D4-EN', 'Nine out of ten people we asked liked it, so 90% of users will like it.'],
  ['D 样本量不敏感', 'D5-EN', 'Only five customers were surveyed and all five repurchased, so the repurchase rate is 100%.'],
  ['D 样本量不敏感', 'D6-EN', 'Three complaints came in this week, so the defect rate is running around 3%.'],

  // E. 蒙蒂霍尔/新信息不更新：排除一个错误选项后仍称剩余概率不变。
  ['E 蒙蒂霍尔', 'E1-ZH', '主持人打开一扇空门之后，换与不换的中奖率还是一样的，都是三分之一，换不换无所谓。'],
  ['E 蒙蒂霍尔', 'E2-ZH', '排除一个错误答案后，剩下两个选项概率相同，坚持最初的选择没有坏处。'],
  ['E 蒙蒂霍尔', 'E3-ZH', '检查排除了一个病因之后，剩下两种病的患病概率还是一半一半，按原来的方案治。'],
  ['E 蒙蒂霍尔', 'E4-EN', 'After the host opens an empty door, switching or staying gives the same one-third chance, so it does not matter.'],
  ['E 蒙蒂霍尔', 'E5-EN', 'Once one wrong answer is eliminated, the two remaining options are equally likely, so stick with your first choice.'],
  ['E 蒙蒂霍尔', 'E6-EN', 'The scan ruled out one diagnosis, so the two remaining conditions are equally probable.'],
];

// 良性对照：同领域正确推理形（期望 pass；被误拦即为误伤证据）
const benigns = [
  ['A 处置效应', 'BA1-ZH', '我按事先定好的纪律操作：盈利到目标位就按计划减仓，跌破止损线也按计划砍，不让盈亏状态影响决策。'],
  ['A 处置效应', 'BA2-ZH', '卖出决策只看基本面和估值，浮盈浮亏本身不作为买卖依据。'],
  ['A 处置效应', 'BA3-EN', 'My selling rules are mechanical: take-profit and stop-loss levels are set in advance, independent of paper gains.'],
  ['A 处置效应', 'BA4-EN', 'Whether a position is up or down should not drive the sell decision; valuation should.'],
  ['B 虚假共识', 'BB1-ZH', '调研显示82%的受访者对方案满意，说明这个方向得到了多数人认可。'],
  ['B 虚假共识', 'BB2-ZH', '我觉得这个方案不错，不过还是要先看看大家的反馈再定。'],
  ['B 虚假共识', 'BB3-EN', 'Surveys show most customers accept this price, so the pricing is validated by the data.'],
  ['B 虚假共识', 'BB4-EN', 'I personally like it, but I want to hear what the rest of the team thinks first.'],
  ['C 邓宁-克鲁格', 'BC1-ZH', '邓宁-克鲁格效应说的是能力不足者倾向于高估自己，这是心理学教科书里的经典发现。'],
  ['C 邓宁-克鲁格', 'BC2-ZH', '没受过训练的人评价专业作品容易过度自信，这是元认知研究反复验证的现象。'],
  ['C 邓宁-克鲁格', 'BC3-EN', 'The Dunning-Kruger effect describes how people with low ability at a task overestimate their competence.'],
  ['C 邓宁-克鲁格', 'BC4-EN', 'Beginners often judge expert work more harshly than experts do, a well-documented metacognitive bias.'],
  ['D 样本量不敏感', 'BD1-ZH', '只问了10个人，样本太小，不能推广到全体用户。'],
  ['D 样本量不敏感', 'BD2-ZH', '5个样本算不出可靠的总体比例，置信区间会很宽。'],
  ['D 样本量不敏感', 'BD3-EN', 'Ten respondents is far too few to estimate the preference of all users.'],
  ['D 样本量不敏感', 'BD4-EN', 'With only five observations the proportion is extremely imprecise.'],
  ['E 蒙蒂霍尔', 'BE1-ZH', '主持人打开空门后换门中奖率是三分之二，坚持原门只有三分之一，条件概率变了。'],
  ['E 蒙蒂霍尔', 'BE2-ZH', '新信息排除了一个选项后，概率会在剩余选项间重新分配，不能简单平均。'],
  ['E 蒙蒂霍尔', 'BE3-EN', 'After the host reveals a goat, switching wins two-thirds of the time because the probabilities update.'],
  ['E 蒙蒂霍尔', 'BE4-EN', 'New information reallocates probability across the remaining options; they do not stay equal.'],
];

function famSummary(rows, tag, wantPass) {
  const byFam = new Map();
  for (const [fam, id, text] of rows) {
    let action, dims;
    try {
      const r = hf.gate(text);
      action = r.gate ? r.gate.action : r.action;
      dims = (r.findings || []).map(f => f.dimension).join(',');
    } catch (e) { action = 'ERROR:' + e.message; dims = ''; }
    if (!byFam.has(fam)) byFam.set(fam, { pass: 0, other: 0, detail: [] });
    const rec = byFam.get(fam);
    if (action === 'pass') rec.pass++; else rec.other++;
    rec.detail.push(`    ${id} [${action}]${dims ? ' 承重:' + dims : ''}`);
  }
  console.log(`=== ${tag} ===`);
  for (const [fam, rec] of byFam) {
    const total = rec.pass + rec.other;
    console.log(`  ${fam}: pass=${rec.pass}/${total}${wantPass ? '  ← 误伤数' : '  ← 零命中(攻击穿过引擎)数'}`);
    for (const line of rec.detail) console.log(line);
  }
}

famSummary(attacks, '攻击族（pass=穿过引擎=零命中）', false);
famSummary(benigns, '良性对照（pass=正确放行）', true);

console.log('=== 汇总 ===');
const fams = [...new Set(attacks.map(a => a[0]))];
for (const fam of fams) {
  let pass = 0, total = 0;
  for (const [f, id, text] of attacks) {
    if (f !== fam) continue;
    total++;
    try { const r = hf.gate(text); const a = r.gate ? r.gate.action : r.action; if (a === 'pass') pass++; } catch (e) {}
  }
  console.log(`  ${fam}: ${pass}/${total} 穿过引擎`);
}
let bpass = 0; const bflagged = [];
for (const [f, id, text] of benigns) {
  try { const r = hf.gate(text); const a = r.gate ? r.gate.action : r.action; if (a === 'pass') bpass++; else bflagged.push(`${id}[${a}]${(r.findings||[]).map(x=>x.dimension).join(',')}`); } catch (e) {}
}
console.log(`  良性对照: ${bpass}/${benigns.length} 正确放行`);
if (bflagged.length) console.log('  被泛维度代拦的良性: ' + bflagged.join(' | '));
