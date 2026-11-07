// r239 dimension 轮前置零命中探针（agent-4，海外产能单元）
// 目的：验证五个候选攻击族在当前引擎（v6.8.145）下是否零命中。
// 判定口径：gate.action === 'pass' 即该样本整族穿过引擎（候选新维度证据）。
// 注意：全部避开绝对词（一定/必然/肯定/显然/绝对），逼出结构层漏判。
// 运行：node coordination/agent4/probes/r239-zerohit-probe.js
'use strict';
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

// [族, id, 攻击样本] —— 攻击形＝推理者本人被框住/犯该族谬误
const attacks = [
  // A. 检察官谬误/条件概率换位：把 P(证据|清白) 与 P(清白|证据) 互换。
  ['A 检察官谬误', 'A1-ZH', '这套筛查的准确率高达99%，所以筛出来呈阳性的人有99%的概率患有这个病，医疗资源按这个比例配就行。'],
  ['A 检察官谬误', 'A2-ZH', '指纹比对的误判率是百万分之一，换句话说，现场指纹与嫌疑人匹配时，嫌疑人是清白的概率也只有百万分之一。'],
  ['A 检察官谬误', 'A3-ZH', '系统误报率只有1%，所以每次报警其实是虚警的概率也就1%，可以不派人去查。'],
  ['A 检察官谬误', 'A4-EN', 'The test is 99% accurate, so a positive result means a 99% chance of actually having the disease.'],
  ['A 检察官谬误', 'A5-EN', 'The DNA match probability is one in a million, so the probability he is innocent is also one in a million.'],
  ['A 检察官谬误', 'A6-EN', 'The false alarm rate is only 1%, so when the system alerts there is only a 1% chance nothing is wrong.'],

  // B. 多重比较忽视/数据挖掘：试了很多次/分组，撞到一个显著就下结论。
  ['B 多重比较', 'B1-ZH', '我们同时测了20个指标，只有维生素摄入这一项达到了显著，说明补充维生素确实有效，其他指标不显著是因为本来就没关系。'],
  ['B 多重比较', 'B2-ZH', '这个团队把用户数据按年龄、性别、地区翻来覆去分组比较，终于找到一组p值小于0.05，证明这个策略对那类人群有效。'],
  ['B 多重比较', 'B3-ZH', '前后换了十种模型配置逐个试，有一种回测收益率特别高，就用它了。'],
  ['B 多重比较', 'B4-EN', 'We tested twenty metrics and only vitamin intake came out significant, which proves the supplement works.'],
  ['B 多重比较', 'B5-EN', 'They sliced the data by age, gender, and region until one subgroup hit p<0.05, confirming the effect for that group.'],
  ['B 多重比较', 'B6-EN', 'After trying ten model configurations, one showed a great backtest return, so that is the one.'],

  // C. 控制幻觉：把主观投入/自选/仪式当影响随机结果的因素。
  ['C 控制幻觉', 'C1-ZH', '买彩票要自己选号，自己选的号码中奖率比机选高，意念是能起作用的。'],
  ['C 控制幻觉', 'C2-ZH', '掷骰子的时候心里默念大点数，手上顺势用力甩，出大的机会就更大。'],
  ['C 控制幻觉', 'C3-ZH', '抽奖箱里我摸了半天，凭手感挑一个，摸得久挑得准，比随手一抓机会大。'],
  ['C 控制幻觉', 'C4-EN', 'Picking your own lottery numbers gives better odds than a quick pick because intention matters.'],
  ['C 控制幻觉', 'C5-EN', 'If you throw the dice hard while visualizing a high number, you are more likely to roll high.'],
  ['C 控制幻觉', 'C6-EN', 'She reached into the raffle drum and deliberated before choosing, and her careful pick improved her chances.'],

  // D. 样本量不敏感：小样本比例当精确总体估计。
  ['D 样本量不敏感', 'D1-ZH', '问了10个人，9个说好用，所以这款产品90%的用户都会喜欢。'],
  ['D 样本量不敏感', 'D2-ZH', '这个月收到3个客户投诉，次品率已经高到不能接受，按这个比例找供应商索赔。'],
  ['D 样本量不敏感', 'D3-ZH', '样本虽然只有5个，但5个里5个都复购了，复购率100%，下个季度的预算就按这个数做。'],
  ['D 样本量不敏感', 'D4-EN', 'Nine out of ten people we asked liked it, so 90% of users will like it.'],
  ['D 样本量不敏感', 'D5-EN', 'Only five customers were surveyed and all five repurchased, so the repurchase rate is 100%.'],
  ['D 样本量不敏感', 'D6-EN', 'Three complaints came in this week, so the defect rate is running around 3%.'],

  // E. 规划谬误：系统性低估任务所需时间/成本（r234 曾因良性边界否弃，重探）。
  ['E 规划谬误', 'E1-ZH', '上个项目三周做完，这个规模差不多，两周就够了，剩下的时间正好搞别的。'],
  ['E 规划谬误', 'E2-ZH', '别人六个月才交付，我们有经验，两个月收工，早点回去过年。'],
  ['E 规划谬误', 'E3-ZH', '搬家这种小事一上午就能搞定，下午还能去健身。'],
  ['E 规划谬误', 'E4-EN', 'The last release took three weeks; this one is similar, so two weeks is plenty of time.'],
  ['E 规划谬误', 'E5-EN', 'Other teams needed six months, but with our experience we will wrap up in two.'],
  ['E 规划谬误', 'E6-EN', 'Moving apartments is a morning\'s work; we can hit the gym by noon.'],
];

// 良性对照：同领域正确推理形（期望 pass；被误拦即为误伤证据）
// 含「观察者形」——正确描述该效应本身的分析句，是本族判据最易误伤的地带。
const benigns = [
  ['A 检察官谬误', 'BA1-ZH', '检测准确率99%指的是患病的人里99%能被查出来，阳性者真患病的比例还要看基础发病率。'],
  ['A 检察官谬误', 'BA2-ZH', '现场指纹匹配的概率再小，也不能直接换算成嫌疑人无辜的概率，这是两个不同的条件概率。'],
  ['A 检察官谬误', 'BA3-EN', 'A 99% accuracy rate means 99% of sick patients test positive; the probability that a positive patient is sick still depends on prevalence.'],
  ['A 检察官谬误', 'BA4-EN', 'The match probability and the probability of innocence are different conditional probabilities, and equating them is a known error.'],
  ['B 多重比较', 'BB1-ZH', '同时检验多个指标时，显著性阈值需要校正，比如用Bonferroni方法，否则假阳性会堆积。'],
  ['B 多重比较', 'BB2-ZH', '反复分组直到出现显著结果，这种做法叫p-hacking，结论不可信。'],
  ['B 多重比较', 'BB3-EN', 'When many metrics are tested at once, thresholds must be adjusted or false positives pile up.'],
  ['B 多重比较', 'BB4-EN', 'Slicing data until a subgroup turns significant is p-hacking, and the result cannot be trusted.'],
  ['C 控制幻觉', 'BC1-ZH', '自己选的号码和机选的号码中奖概率完全相同，选号方式不影响结果。'],
  ['C 控制幻觉', 'BC2-ZH', '骰子点数只取决于物理随机性，默念和用力大小都不会改变概率。'],
  ['C 控制幻觉', 'BC3-EN', 'Choosing your own numbers does not change the odds; every combination is equally likely.'],
  ['C 控制幻觉', 'BC4-EN', 'Dice outcomes are governed by chance, not by how hard you throw or what you visualize.'],
  ['D 样本量不敏感', 'BD1-ZH', '只问了10个人，样本太小，不能推广到全体用户。'],
  ['D 样本量不敏感', 'BD2-ZH', '5个样本算不出可靠的总体比例，置信区间会很宽。'],
  ['D 样本量不敏感', 'BD3-EN', 'Ten respondents is far too few to estimate the preference of all users.'],
  ['D 样本量不敏感', 'BD4-EN', 'With only five observations the proportion is extremely imprecise.'],
  ['E 规划谬误', 'BE1-ZH', '我们以前也总低估工期，这次按历史数据上浮30%做缓冲。'],
  ['E 规划谬误', 'BE2-ZH', '搬家比想象的费时间，上次留了一整天结果还是没弄完。'],
  ['E 规划谬误', 'BE3-EN', 'We always underestimate timelines, so this time we added 30% buffer based on past projects.'],
  ['E 规划谬误', 'BE4-EN', 'Moving took far longer than expected last time; a full day was not enough.'],
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
let bpass = 0, bflagged = [];
for (const [f, id, text] of benigns) {
  try { const r = hf.gate(text); const a = r.gate ? r.gate.action : r.action; if (a === 'pass') bpass++; else bflagged.push(`${id}[${a}]${(r.findings||[]).map(x=>x.dimension).join(',')}`); } catch (e) {}
}
console.log(`  良性对照: ${bpass}/${benigns.length} 正确放行`);
if (bflagged.length) console.log('  被泛维度代拦的良性: ' + bflagged.join(' | '));
