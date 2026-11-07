// r241 探针第二轮（agent-4）：A 禀赋效应 vs B 搭便车 加难对决
// 目的：一轮探针 A/B 均 7/7 穿透，二轮用更难变体（隐式所有权/去成语/
// 反向良性/合同限制性拒绝）打破平局。口径同 r241-zerohit-probe.js。
// 运行：node coordination/agent4/probes/r241-probe-round2.js
'use strict';
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const attacks = [
  // A. 禀赋效应——加难：隐式所有权、拒绝不带明价、家族/情感附着
  ['A 禀赋效应', 'A2-1-ZH', '这幅画挂在我客厅二十年了，画廊出多少价我都不会考虑，它早就不是商品。'],
  ['A 禀赋效应', 'A2-2-ZH', '咖啡馆是我从一张桌子开始做起来的，连锁品牌给的收购价再高，也买不走这家店。'],
  ['A 禀赋效应', 'A2-3-EN', 'The cabin has been in my family for generations; whatever the land is appraised at, we are not selling.'],
  ['A 禀赋效应', 'A2-4-ZH', '这串手机号我挑了十几年，别人出价再高也是我的，运气早就绑在一起了。'],
  ['A 禀赋效应', 'A2-5-ZH', '老厂区承载着几代工人的青春，补偿款给得再高也买不断这份感情，说什么都不能拆。'],
  ['A 禀赋效应', 'A2-6-EN', 'My first guitar is not for sale at any price — the offer would have to be insultingly high to even start a conversation.'],

  // B. 搭便车——加难：隐式不付出、去成语、群体免疫/开源基金会语境
  ['B 搭便车', 'B2-1-ZH', '班会费总有几个热心的同学垫着，少我一个也看不出来，明年再说吧。'],
  ['B 搭便车', 'B2-2-ZH', '项目成了是团队的功劳，我前期虽然没怎么参与，但署名里也有我一份。'],
  ['B 搭便车', 'B2-3-EN', 'Why chip in for the office party when half the floor never pays and the organizer covers it anyway?'],
  ['B 搭便车', 'B2-4-ZH', '疫苗打不打是个人选择，大家都打了我就不用打了，群体免疫会保护我。'],
  ['B 搭便车', 'B2-5-EN', 'The open-source project is backed by a foundation, so contributions from individual users are unnecessary.'],
  ['B 搭便车', 'B2-6-ZH', '小区换电梯，楼上是高层肯定比我还急，让他们去张罗，我到时候跟着用就行。'],
];

const benigns = [
  ['A 禀赋效应', 'BA2-1-ZH', '情感价值与市场价值可以并存，但理性决策应当以市场价值为基准。'],
  ['A 禀赋效应', 'BA2-2-ZH', '遗产分割时，继承人可以协商情感优先的方案，同时接受专业估价作为参考。'],
  ['A 禀赋效应', 'BA2-3-ZH', '他拒绝出售是出于合同限制与竞业条款，与估值高低无关。'],
  ['A 禀赋效应', 'BA2-4-ZH', '业主因急售报价低于市场价也接受，先把资金回笼再说。'],
  ['A 禀赋效应', 'BA2-5-ZH', '收藏者按拍卖行情低买高卖，从不因为喜欢就在出价上让步。'],
  ['A 禀赋效应', 'BA2-6-EN', 'Owners typically demand more to give up an item than they would pay to acquire it, a robust experimental finding.'],
  ['B 搭便车', 'BB2-1-ZH', '社区花园维护靠轮值，每家每季度出一位义工，名册公示，谁出工一目了然。'],
  ['B 搭便车', 'BB2-2-ZH', '公共服务由税收统一供给，缴费具有强制性，这与自愿搭便车结构不同。'],
  ['B 搭便车', 'BB2-3-ZH', '我在GitHub上给常用库提交了修复，虽然用得不多也尽量回馈。'],
  ['B 搭便车', 'BB2-4-ZH', '搭便车分析是集体行动理论的核心，奥尔森在《集体行动的逻辑》中有系统论述。'],
  ['B 搭便车', 'BB2-5-ZH', '拼团是自愿交易，每位参与者都按约定付费，不构成搭便车。'],
  ['B 搭便车', 'BB2-6-EN', 'Herd immunity does protect unvaccinated people, which is an epidemiological mechanism, not a reason to skip vaccination policy analysis.'],
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

famSummary(attacks, '二轮攻击族（pass=穿过引擎=零命中）', false);
famSummary(benigns, '二轮良性对照（pass=正确放行）', true);

console.log('=== 二轮汇总 ===');
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
if (bflagged.length) console.log('  被代拦的良性: ' + bflagged.join(' | '));
