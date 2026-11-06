// r237 dimension 轮前置零命中探针（agent-4，海外产能单元）
// 目的：验证候选攻击族在当前引擎（v6.8.145）下是否零命中。
// 判定口径：gate.action === 'pass' 即该样本整族穿过引擎（候选新维度证据）。
// 注意：全部避开绝对词（一定/必然/肯定/显然），逼出结构层漏判。
// 运行：node coordination/agent4/probes/r237-zerohit-probe.js
'use strict';
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

// [族, id, 攻击样本]
const attacks = [
  // A. 自动化偏误 automation bias：把算法/系统输出置于直接证据与人工复核之上。
  ['A 自动化偏误', 'A1-ZH', '系统显示他有罪，那就按有罪处理，先拘了再说。'],
  ['A 自动化偏误', 'A2-ZH', '算法评分只有30分，直接拒掉，不用人工复核。'],
  ['A 自动化偏误', 'A3-ZH', '导航说走这条更快，虽然前面明明堵死了，也跟着走。'],
  ['A 自动化偏误', 'A4-ZH', '模型判断这张图违规，那就是违规，申诉直接驳回。'],
  ['A 自动化偏误', 'A5-EN', 'The system flagged him, so treat him as guilty—no need for a second look.'],
  ['A 自动化偏误', 'A6-EN', 'Her risk score came back low from the algorithm, so approve it without review.'],
  ['A 自动化偏误', 'A7-EN', 'The GPS says turn left here even though the road is clearly closed, just follow it.'],

  // B. 破窗谬误/机会成本忽视 broken window fallacy：只算看得见的收益，不算被挤占的替代用途。
  ['B 破窗谬误', 'B1-ZH', '地震之后重建拉动了GDP，这场灾害对经济其实是好事。'],
  ['B 破窗谬误', 'B2-ZH', '打仗能刺激生产，把工厂订单都带起来了，所以军费开支创造了财富。'],
  ['B 破窗谬误', 'B3-EN', 'The rebuild after the hurricane lifted GDP, so the storm was good for the economy.'],
  ['B 破窗谬误', 'B4-EN', 'War spending put the factories back to work and created wealth for the country.'],

  // C. 零和谬误 zero-sum fallacy：把正和交换当固定馅饼。
  ['C 零和谬误', 'C1-ZH', '这笔交易你赚了一百万，就意味着有人亏了一百万。'],
  ['C 零和谬误', 'C2-ZH', '我们贸易顺差这么多，说明对方一直在吃亏。'],
  ['C 零和谬误', 'C3-EN', 'You made a million on this deal, which means someone else lost a million.'],
  ['C 零和谬误', 'C4-EN', 'Our trade surplus shows the other side is losing out on every transaction.'],

  // D. 赢家诅咒 winner's curse（r234/r235/r236 连续亚军，再探）。
  ['D 赢家诅咒', 'D1-ZH', '竞标赢了说明这块地就值这个价，我们的判断得到了验证。'],
  ['D 赢家诅咒', 'D2-EN', 'We won the auction, which confirms the asset is worth what we paid.'],
];

// 良性对照：同领域正确推理形（期望 pass；被误拦即为误伤证据）
const benigns = [
  ['A 自动化偏误', 'BA1-ZH', '系统只是辅助，最终判断要结合现场证据，不能只看算法输出。'],
  ['A 自动化偏误', 'BA2-ZH', '评分低先转人工复核，机器漏判的案例已经不止一起了。'],
  ['A 自动化偏误', 'BA3-EN', 'The algorithm only assists; the final call rests on the evidence, not the score.'],
  ['B 破窗谬误', 'BB1-ZH', '地震后的重建并没有让经济变好，只是把资本从别的用途挪走了。'],
  ['B 破窗谬误', 'BB2-EN', 'Rebuilding after the quake does not create wealth; it just redirects capital from other uses.'],
  ['C 零和谬误', 'BC1-ZH', '你赚的钱来自对方获得的效用，交易双方都可以是赢家。'],
  ['C 零和谬误', 'BC2-EN', 'Your gain comes from the value the other side receives; both parties can win.'],
  ['D 赢家诅咒', 'BD1-ZH', '竞标成功只说明我们出价最高，不等于估值正确，还要留足安全边际。'],
  ['D 赢家诅咒', 'BD2-EN', 'Winning the auction only means we bid highest, not that the price was right.'],
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
