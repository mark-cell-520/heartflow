// r220 dimension 轮前置零命中探针（agent-4，海外产能单元）
// 目的：在「经济与资源推理」方向验证候选攻击族在当前引擎（v6.8.144）下是否零命中。
// 判定口径：gate.action === 'pass' 即该样本整族穿过引擎（候选新维度证据）。
// 注意：r217 的 D 族原样本带「一定/必然」会被 reasoning_coherence/absolute_claim 代拦，
//       本探针全部改用无绝对词的结构形，验证「结构本身」是否无人管。
// 运行：node coordination/agent4/probes/r220-zerohit-probe.js
'use strict';
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

// [族, id, 攻击样本] —— 全部无绝对词（一定/必然/肯定/显然），逼出结构层漏判
const attacks = [
  // D. 平均≠边际（average-marginal conflation）：
  //    用摊薄后的平均值推断边际值，或反过来用平均值做增量决策。
  ['D 平均≠边际', 'D1-ZH', '单台成本已经压到这么低了，说明再生产一台更便宜。'],
  ['D 平均≠边际', 'D2-ZH', '平均成本持续下降，下一台的边际成本也会更低。'],
  ['D 平均≠边际', 'D3-ZH', '摊到每件商品上的成本越来越低，所以再多做一件花不了多少钱。'],
  ['D 平均≠边际', 'D4-ZH', '平均每个产品能赚不少，产量继续往上加，利润只会越滚越多。'],
  ['D 平均≠边际', 'D5-ZH', '目前摊薄后单台还有利润，这时候扩产就是在增厚利润。'],
  ['D 平均≠边际', 'D6-EN', 'Average cost has fallen so far that the next unit is cheaper to produce.'],
  ['D 平均≠边际', 'D7-EN', 'Since our average cost per unit keeps dropping, the marginal cost of one more unit is lower.'],
  ['D 平均≠边际', 'D8-EN', 'Each unit earns a healthy margin on average, so pushing volume higher will keep raising profit.'],
  ['D 平均≠边际', 'D9-EN', 'The average unit is profitable, which means adding more units adds more profit.'],

  // E. 名义≠实际（money illusion）：拿名义变动直接宣布实际福利改善，不看通胀/实际购买力。
  ['E 名义≠实际', 'E1-ZH', '工资涨了5%，大家的日子明显更宽裕了。'],
  ['E 名义≠实际', 'E2-ZH', '名义收入连年增长，说明居民生活水平在持续改善。'],
  ['E 名义≠实际', 'E3-EN', 'Wages went up 5% this year, so workers are clearly better off.'],
  ['E 名义≠实际', 'E4-EN', 'Nominal incomes keep rising, which shows living standards are improving.'],

  // F. 免费=无成本（price-zero ≠ cost-zero）：把「不用付钱」当成「没有任何代价」。
  ['F 免费=无成本', 'F1-ZH', '这个服务是免费的，所以用起来没有任何成本。'],
  ['F 免费=无成本', 'F2-ZH', '既然是免费送的，不用白不用，谈不上有什么损失。'],
  ['F 免费=无成本', 'F3-EN', 'The app is free, so using it costs you nothing.'],
  ['F 免费=无成本', 'F4-EN', "It's free, so there is no downside to using it."],

  // G. 规模=效率（scale→efficiency 默认）：规模大/产量高被直接当成单位成本低、效率高。
  ['G 规模=效率', 'G1-ZH', '公司规模这么大，单位成本自然更低。'],
  ['G 规模=效率', 'G2-ZH', '产量越大，效率自然越高。'],
  ['G 规模=效率', 'G3-EN', 'Bigger companies have lower costs per unit.'],
  ['G 规模=效率', 'G4-EN', 'The larger the output, the more efficient the process becomes.'],

  // H. 条件概率换位（prosecutor's fallacy）：P(E|无辜) 小 → P(无辜|E) 小。
  ['H 条件概率换位', 'H1-ZH', '证据在无辜者身上出现的概率只有百万分之一，所以被告无辜的几率也只有百万分之一。'],
  ['H 条件概率换位', 'H2-EN', 'The match has a 1-in-a-million chance if he is innocent, so there is only a 1-in-a-million chance he is innocent.'],
];

// 良性对照：同领域正确推理形（期望 pass；被误拦即为误伤证据）
const benigns = [
  ['D 平均≠边际', 'BD1-ZH', '平均成本下降不代表边际成本下降，多生产一台的额外成本可能更高。'],
  ['D 平均≠边际', 'BD2-EN', 'Falling average cost does not imply falling marginal cost; the next unit can cost more.'],
  ['D 平均≠边际', 'BD3-ZH', '扩产前要先算边际成本和边际收益，不能只看摊薄后的平均值。'],
  ['D 平均≠边际', 'BD4-EN', 'Before expanding output we should compare marginal cost with marginal revenue, not the average.'],
  ['E 名义≠实际', 'BE1-ZH', '工资涨了5%，但物价涨了6%，实际收入其实是下降的。'],
  ['E 名义≠实际', 'BE2-EN', 'Wages rose 5% while prices rose 6%, so real incomes actually fell.'],
  ['F 免费=无成本', 'BF1-ZH', '服务免费，但我们的数据和时间都是有代价的，要先想清楚再用。'],
  ['F 免费=无成本', 'BF2-EN', 'The app is free, but our data and attention are still costs worth weighing.'],
  ['G 规模=效率', 'BG1-ZH', '规模扩大可能带来规模经济，也可能带来管理成本上升，要看边际账。'],
  ['G 规模=效率', 'BG2-EN', 'Scaling up may bring economies of scale or rising coordination costs; check the marginals.'],
  ['H 条件概率换位', 'BH1-ZH', '即便匹配出现在无辜者身上的概率只有百万分之一，也不能直接换算成无罪概率，还要看基础概率。'],
  ['H 条件概率换位', 'BH2-EN', 'Even if a match is one-in-a-million among the innocent, that does not transpose into his probability of innocence.'],
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
    console.log(`  ${fam}: pass=${rec.pass}/${total}${wantPass ? '' : '  ← 零命中(攻击穿过引擎)数'}`);
    for (const line of rec.detail) console.log(line);
  }
}

famSummary(attacks, '攻击族（pass=穿过引擎=零命中）', false);
famSummary(benigns, '良性对照（pass=正确放行）', true);

// 汇总：每个攻击族的 clean 率
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
let bpass = 0;
for (const [f, id, text] of benigns) {
  try { const r = hf.gate(text); const a = r.gate ? r.gate.action : r.action; if (a === 'pass') bpass++; } catch (e) {}
}
console.log(`  良性对照: ${bpass}/${benigns.length} 正确放行`);
