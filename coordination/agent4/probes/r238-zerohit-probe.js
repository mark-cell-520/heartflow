// r238 dimension 轮前置零命中探针（agent-4，海外产能单元）
// 目的：验证五个候选攻击族在当前引擎（v6.8.145）下是否零命中。
// 判定口径：gate.action === 'pass' 即该样本整族穿过引擎（候选新维度证据）。
// 注意：全部避开绝对词（一定/必然/肯定/显然），逼出结构层漏判。
// 运行：node coordination/agent4/probes/r238-zerohit-probe.js
'use strict';
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

// [族, id, 攻击样本] —— 攻击形＝推理者本人被框住/犯该族谬误
const attacks = [
  // A. 框架效应 framing effect：逻辑等价两种表述（互补百分比框/增益-损失框）结论反转。
  ['A 框架效应', 'A1-ZH', '这个疗法有90%的存活率，另一个只有10%的死亡率，所以前者明显更安全，就选前者。'],
  ['A 框架效应', 'A2-ZH', '手术A存活率90%，手术B死亡率10%，A比B安全得多，家属都建议做A。'],
  ['A 框架效应', 'A3-ZH', '同一块牛肉标"75%瘦"比标"25%肥"好卖，说明消费者看到的就是更瘦的肉。'],
  ['A 框架效应', 'A4-ZH', '政策描述成"95%的人保住了工作"比"5%的人失业"支持率高，可见就业框架下这份政策真的更好。'],
  ['A 框架效应', 'A5-EN', 'This treatment has a 90% survival rate while the other has a 10% mortality rate, so the first is clearly safer.'],
  ['A 框架效应', 'A6-EN', 'Procedure A shows a 90% survival rate and procedure B a 10% mortality rate, so A is the safer choice by far.'],
  ['A 框架效应', 'A7-EN', 'The same beef labeled "75% lean" outsells the "25% fat" label, which shows shoppers really see it as leaner meat.'],

  // B. 公地悲剧 tragedy of the commons：个体理性多用共享资源→集体耗竭。
  ['B 公地悲剧', 'B1-ZH', '这片草场是公共的，每家多养几只羊自己就多挣一份，至于草场退化那是大家一起承担的。'],
  ['B 公地悲剧', 'B2-ZH', '地下水不要钱，我们村多种一季稻就多一季收入，谁节省谁吃亏。'],
  ['B 公地悲剧', 'B3-ZH', '渔场是大家的，每条船都加大捕捞量，最后资源枯竭，可每条船的选择都是理性的。'],
  ['B 公地悲剧', 'B4-EN', 'The pasture is shared, so each family that adds more cattle earns more, and the overgrazing cost falls on everyone.'],
  ['B 公地悲剧', 'B5-EN', 'The aquifer is free, so every farm that pumps more this season gains, even though the water table keeps dropping.'],
  ['B 公地悲剧', 'B6-EN', 'Each trawler expanded its catch because the fish stock belonged to no one, and the fishery eventually collapsed.'],

  // C. 道德风险 moral hazard：保险/兜底保护→风险行为增加、后果外部化。
  ['C 道德风险', 'C1-ZH', '买了全险之后开车就猛多了，反正撞了有保险公司赔，保费是大家平摊的。'],
  ['C 道德风险', 'C2-ZH', '反正机构认定会兜底，这笔高风险投资亏了也不用自己扛，杠杆可以放大。'],
  ['C 道德风险', 'C3-ZH', '有失业救济金领着，找工作就不用着急，多挑一挑，歇几个月再说。'],
  ['C 道德风险', 'C4-EN', 'Once he got full coverage he drove far more recklessly, since the insurer pays for any crash.'],
  ['C 道德风险', 'C5-EN', 'With the bailout guaranteed, the bank piled on leverage—losses would be socialized anyway.'],
  ['C 道德风险', 'C6-EN', 'With generous unemployment benefits she saw no rush to job-hunt and just took a few months off.'],

  // D. 节俭悖论 paradox of thrift：个人节俭美德→推得全民节俭利经济（合成谬误宏观版）。
  ['D 节俭悖论', 'D1-ZH', '勤俭节约是美德，人人都省吃俭用、不随便花钱，国家的经济就会更富裕。'],
  ['D 节俭悖论', 'D2-ZH', '每个家庭都减少消费、多存钱，全社会的购买力就会上升，企业收入随之增长。'],
  ['D 节俭悖论', 'D3-ZH', '大家把钱都存起来不消费，总需求增加，工厂的订单就会更多。'],
  ['D 节俭悖论', 'D4-EN', 'Thrift is a virtue, so if every household saves more and spends less, the whole economy grows richer.'],
  ['D 节俭悖论', 'D5-EN', 'If everyone cuts consumption and saves more, aggregate demand rises and firms sell more.'],

  // E. 价格即质量 appeal to price：把价格当质量/能力证据（贵=好、便宜没好货）。
  ['E 价格即质量', 'E1-ZH', '这件西装要三万八，贵有贵的道理，面料做工肯定比两千的好。'],
  ['E 价格即质量', 'E2-ZH', '便宜没好货，这瓶酒才一百块，口感肯定不行。'],
  ['E 价格即质量', 'E3-ZH', '培训费收得越高说明师资越强，毕竟一分钱一分货。'],
  ['E 价格即质量', 'E4-EN', 'This suit costs $3,800, so the fabric and tailoring are surely better than a $200 one.'],
  ['E 价格即质量', 'E5-EN', 'You get what you pay for—a $100 bottle of wine cannot possibly taste good.'],
  ['E 价格即质量', 'E6-EN', 'The consultant charges $500 an hour, which shows how much better his advice is.'],
];

// 良性对照：同领域正确推理形（期望 pass；被误拦即为误伤证据）
// 含「观察者形」——正确描述该效应本身的分析句，是本族判据最易误伤的地带。
const benigns = [
  ['A 框架效应', 'BA1-ZH', '措辞会影响人的判断，但这两个选项的实际概率完全一样，选哪个都不改变结果。'],
  ['A 框架效应', 'BA2-ZH', '标签写"75%瘦"还是"25%肥"不改变肉本身的脂肪比例。'],
  ['A 框架效应', 'BA3-ZH', '心理学上这叫做框架效应，是营销里常用的手法。'],
  ['A 框架效应', 'BA4-ZH', '90%的存活率和10%的死亡率是同一回事，别被表述骗了。'],
  ['A 框架效应', 'BA5-EN', 'The wording shapes perception, but both options carry the exact same probability.'],
  ['B 公地悲剧', 'BB1-ZH', '公共草场需要定额放牧，超载的部分按户罚款，退化就能控制住。'],
  ['B 公地悲剧', 'BB2-ZH', '这片渔场由村里统一轮捕，休渔期严格执行，二十年来资源稳定。'],
  ['B 公地悲剧', 'BB3-ZH', '共有资源容易耗竭，所以才需要确权和配额管理。'],
  ['B 公地悲剧', 'BB4-EN', 'Shared pastures need grazing quotas and per-household penalties, or the grassland degrades.'],
  ['C 道德风险', 'BC1-ZH', '保险会改变投保人的行为，所以精算时要考虑这点，免赔额就是为此设计的。'],
  ['C 道德风险', 'BC2-ZH', '兜底机制确实可能诱发冒险，因此救助必须附带严格条件。'],
  ['C 道德风险', 'BC3-ZH', '有失业金也能积极找工作，待遇高低和求职努力没有必然关系。'],
  ['C 道德风险', 'BC4-EN', 'Insurers know coverage changes behavior, which is why deductibles exist.'],
  ['D 节俭悖论', 'BD1-ZH', '节俭对个人是美德，对全社会则要看总需求形势，衰退期过度储蓄会加深萧条。'],
  ['D 节俭悖论', 'BD2-ZH', '家庭多储蓄，银行就有更多资金放贷，投资随之增加，这是储蓄转化为投资的正常渠道。'],
  ['D 节俭悖论', 'BD3-EN', 'Saving is prudent for a household, but for the whole economy it depends on demand conditions.'],
  ['E 价格即质量', 'BE1-ZH', '价格高往往反映成本高，这件用了稀有面料，标价高有成本依据。'],
  ['E 价格即质量', 'BE2-ZH', '贵的不一定好，双盲测试里三百的和三千的尝不出区别。'],
  ['E 价格即质量', 'BE3-EN', 'A high price often just reflects high cost; the fabric here is genuinely rare.'],
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
