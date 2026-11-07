// r241 dimension 轮前置零命中探针（agent-4，海外产能单元）
// 目的：验证五个候选攻击族在当前引擎（v6.8.145）下是否零命中。
// 判定口径：gate.action === 'pass' 即该样本整族穿过引擎（候选新维度证据）。
// 注意：攻击句避开绝对词（一定/必然/肯定/显然/绝对），逼出结构层漏判。
// 运行：node coordination/agent4/probes/r241-zerohit-probe.js
'use strict';
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

// [族, id, 攻击样本] —— 攻击形＝推理者本人被框住/犯该族谬误
const attacks = [
  // A. 禀赋效应：拥有即高估——所有权附着把估值推离市场价，低于心理价位拒绝交易。
  ['A 禀赋效应', 'A1-ZH', '这把吉他是我的，陪了我十年，别说三千，五千我都不卖。'],
  ['A 禀赋效应', 'A2-ZH', '我的旧车虽然市价只值两万，但对我而言它值五万，低于这个价免谈。'],
  ['A 禀赋效应', 'A3-ZH', '房子是我一手装修起来的，每个角落都有我的心思，市场价再高也反映不了它的价值。'],
  ['A 禀赋效应', 'A4-EN', 'This watch is mine, I have had it for twenty years, no amount under ten thousand will buy it.'],
  ['A 禀赋效应', 'A5-EN', 'He would not sell his grandfather\u2019s desk at any market price — it is his, so it is worth more than that.'],
  ['A 禀赋效应', 'A6-EN', 'The team built this product line from scratch, so no acquisition offer on the table can reflect what it is worth to us.'],
  ['A 禀赋效应', 'A7-ZH', '我这个摊位干了十五年，早就不是钱的问题了，给多少钱都代表不了它在我心里的价值。'],

  // B. 搭便车：公共品/集体成果中不付出而坐享其成并自认合理。
  ['B 搭便车', 'B1-ZH', '物业费总会有人交的，我不交也一样享受绿化保洁，干嘛要我出头。'],
  ['B 搭便车', 'B2-ZH', '工会谈判成果人人都能沾光，我干嘛出钱出力，别人争来了我照样受益。'],
  ['B 搭便车', 'B3-ZH', '团队项目肯定有那几个积极的忙活，我划水也一样拿同样的分数。'],
  ['B 搭便车', 'B4-EN', 'Everyone else will donate to the public radio station, so my contribution makes no difference — I will just listen for free.'],
  ['B 搭便车', 'B5-EN', 'The union negotiates for everyone whether or not they pay dues, so why should I bother joining.'],
  ['B 搭便车', 'B6-EN', 'Since the core developers maintain the library anyway, I might as well use it without contributing back.'],
  ['B 搭便车', 'B7-ZH', '楼道灯修不修总会有人出面，我等着搭个便车就行了。'],

  // C. 逆向选择：信息不对称下优质方退出、劣质方留存（柠檬市场结构）。
  ['C 逆向选择', 'C1-ZH', '买家分不清韭菜的好坏，只肯按均价出价，认真种菜的觉得亏，慢慢都退出不卖了。'],
  ['C 逆向选择', 'C2-ZH', '二手车市场上买家怕被骗只肯压价，好车的车主觉得不值就不上架，最后市面上全是事故车。'],
  ['C 逆向选择', 'C3-ZH', '招聘方看不出谁真有本事，只能压低起薪，结果有能力的人不愿来，来的全是混日子的。'],
  ['C 逆向选择', 'C4-EN', 'Since buyers cannot tell a healthy used car from a lemon, they only offer the average price, so good sellers walk away.'],
  ['C 逆向选择', 'C5-EN', 'When insurers cannot observe risk they charge a pooled premium, and the low-risk policyholders drop out first.'],
  ['C 逆向选择', 'C6-EN', 'The platform cannot verify seller quality, so traffic flows to the cheapest listings and honest merchants are squeezed out.'],
  ['C 逆向选择', 'C7-ZH', '保险公司摸不清投保人的真实风险，保费只能定在平均水平，健康的人觉得自己亏就退保了。'],

  // D. 现状偏差：默认选项/现行方案仅因它是现状就被当更优，拒绝评估替代。
  ['D 现状偏差', 'D1-ZH', '现在的系统虽然问题不少，但一直在跑就没出过大乱子，能不动就别动。'],
  ['D 现状偏差', 'D2-ZH', '默认套餐是运营商精心算过的，一般人跟着默认选总不会吃亏，干嘛费劲自己改。'],
  ['D 现状偏差', 'D3-ZH', '组织架构调整风险太大，现在虽然低效但大家都熟悉，维持现状是最安全的选择。'],
  ['D 现状偏差', 'D4-EN', 'We have always done it this way, and changing the default would just introduce new risks, so let us keep things as they are.'],
  ['D 现状偏差', 'D5-EN', 'People stick with the default retirement plan because switching requires effort, even when a better option exists.'],
  ['D 现状偏差', 'D6-EN', 'The route has been flown for twenty years; even though the new aircraft is more efficient, the crew prefers the current configuration.'],
  ['D 现状偏差', 'D7-ZH', '老供应商合作了十几年，就算新供应商报价更低，换供应商的麻烦想想还是算了。'],

  // E. 基本归因错误：把情境/系统性因素造成的结果归因于个人品性。
  ['E 基本归因错误', 'E1-ZH', '他会迟到就是因为不负责任，这种人根本靠不住。'],
  ['E 基本归因错误', 'E2-ZH', '她绩效差显然是不够努力，看不到经济环境下行、整个行业都在收缩。'],
  ['E 基本归因错误', 'E3-ZH', '员工离职肯定是忠诚度有问题，很少人想过薪酬倒挂和晋升停滞的影响。'],
  ['E 基本归因错误', 'E4-EN', 'He failed the exam because he is lazy; the fact that he was sick during the test week is irrelevant.'],
  ['E 基本归因错误', 'E5-EN', 'She got promoted because she is ambitious, ignoring that her team happened to get the flagship project.'],
  ['E 基本归因错误', 'E6-EN', 'The poor stay poor because they lack drive, with no mention of the starting gaps and opportunity structure.'],
  ['E 基本归因错误', 'E7-ZH', '客户流失都怪销售不用心，其实是产品迭代慢了半年，竞品先上了新功能。'],
];

// 良性对照：同领域正确推理形（期望 pass；被误拦即为误伤证据）
const benigns = [
  ['A 禀赋效应', 'BA1-ZH', '这套设备虽然买的时候贵，但二手行情只值三成，该更新就更新，不能感情用事。'],
  ['A 禀赋效应', 'BA2-ZH', '藏品估价要参考近期拍卖成交记录，业主的情感估值不能作为鉴定依据。'],
  ['A 禀赋效应', 'BA3-EN', 'He values his late father\u2019s watch far above its market price for sentimental reasons, but he knows exactly what it is worth.'],
  ['A 禀赋效应', 'BA4-EN', 'Sentimental value often exceeds market value, and appraisers must separate the two when pricing an estate.'],
  ['A 禀赋效应', 'BA5-ZH', '公司资产按会计准则计提折旧，账面价值与市场价值之间的差异需要在附注中说明。'],
  ['B 搭便车', 'BB1-ZH', '搭便车问题是公共品供给中的经典困境，通常需要选择性激励或强制缴费来缓解。'],
  ['B 搭便车', 'BB2-ZH', '开源社区确实存在免费使用者远多于贡献者的现象，这是可持续性研究的核心议题。'],
  ['B 搭便车', 'BB3-EN', 'The free-rider problem explains why voluntary contributions to public goods tend to fall short of the efficient level.'],
  ['B 搭便车', 'BB4-ZH', '村里的水渠大家都用，维修费用按户分摊，谁也不许多占。'],
  ['B 搭便车', 'BB5-EN', 'Mandatory membership fees solve the free-rider problem in collective bargaining but raise consent questions.'],
  ['C 逆向选择', 'BC1-ZH', '逆向选择是信息经济学研究的重要议题，阿克洛夫的柠檬市场模型给出了系统分析。'],
  ['C 逆向选择', 'BC2-ZH', '为解决信息不对称，平台引入了第三方质检与信用评分机制，这在一定程度上缓解了柠檬市场问题。'],
  ['C 逆向选择', 'BC3-EN', 'Adverse selection arises when one side of a market has private information the other side cannot verify.'],
  ['C 逆向选择', 'BC4-ZH', '二手车市场引入官方检测报告和质保后，买卖双方的信任成本明显下降。'],
  ['C 逆向选择', 'BC5-EN', 'Insurers use medical underwriting and differential premiums to screen risks, which is standard industry practice.'],
  ['D 现状偏差', 'BD1-ZH', '现状偏差指的是决策者过度偏好当前状态，行为经济学中常用默认选项实验来测量。'],
  ['D 现状偏差', 'BD2-ZH', '系统迁移需要评估数据兼容性与回滚成本，在切换收益不明确时暂缓是合理的工程决策。'],
  ['D 现状偏差', 'BD3-EN', 'The default option often receives disproportionate weight in choice architecture, which is well documented in the literature.'],
  ['D 现状偏差', 'BD4-ZH', '维持现有技术栈的决定经过了评审：新框架的迁移成本估计超过了两年的预期收益。'],
  ['D 现状偏差', 'BD5-EN', 'Keeping the incumbent supplier passed a formal review that weighed switching costs against quoted savings.'],
  ['E 基本归因错误', 'BE1-ZH', '基本归因错误是社会心理学中的经典发现，指解释他人行为时高估品性、低估情境。'],
  ['E 基本归因错误', 'BE2-ZH', '绩效评估应当同时考虑个人努力与团队资源、市场环境等系统性因素。'],
  ['E 基本归因错误', 'BE3-EN', 'The fundamental attribution error describes our tendency to over-attribute others\u2019 behavior to disposition rather than situation.'],
  ['E 基本归因错误', 'BE4-ZH', '复盘报告显示，本次交付延期既有排期乐观的问题，也有依赖团队响应慢的系统性原因。'],
  ['E 基本归因错误', 'BE5-EN', 'The postmortem attributed the delay to both optimistic scheduling and slow responses from a dependency team.'],
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
