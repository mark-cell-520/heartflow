// r242 dimension 轮二轮探针（agent-4）
// 目的：一轮显示 D 锚定效应 7/7 全穿透，二轮用全新造句验证其稳健性，
// 并用高难度良性集（比价/成本定价/独立评估/抵抗锚点/概念讨论/第三方转述）
// 压测误伤边界。运行：node coordination/agent4/probes/r242-probe-round2.js
'use strict';
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

// 全新攻击造句（避开一轮句式；覆盖起拍价/薪资/标价/市场价/开价/第一报价等锚点类型）
const attacks = [
  ['D 锚定效应', 'R1-ZH', '起拍价一万二，最后两万八落锤，我现在觉得这瓷瓶也就值这个价。'],
  ['D 锚定效应', 'R2-ZH', '对方先把薪资开到一万五，我本来想谈两万二，结果顺着这个数就谈了。'],
  ['D 锚定效应', 'R3-ZH', '标价三千二的外套打三折，我试都没试就刷卡了，感觉不买就是亏。'],
  ['D 锚定效应', 'R4-ZH', '中介先说这套房市场价八百万，之后每看一套房我都拿这个数在比。'],
  ['D 锚定效应', 'R5-EN', 'The bid opened at fifty, and by the close at two hundred everything still felt cheap against that opening number.'],
  ['D 锚定效应', 'R6-EN', 'She quoted twelve thousand first, so my counter of ten thousand felt generous even though the repair was worth six at most.'],
  ['D 锚定效应', 'R7-EN', 'The first price I heard was two hundred, and every offer after that stayed inside the orbit of that number.'],
  ['D 锚定效应', 'R8-ZH', '销售第一句报了原价一万九，后面砍价我就在这个数上让了两千，压根没独立估过。'],
  ['D 锚定效应', 'R9-EN', 'Once he named the six-figure salary, our budget discussion never escaped that range.'],
  ['D 锚定效应', 'R10-ZH', '报价单上第一个项目写了八万，后面几个项目我都照着这个量级批的。'],
];

// 高难度良性：比价数据/成本定价/独立评估/抵抗锚点/概念讨论/第三方转述/纯描述
const benigns = [
  ['D 锚定效应', 'H1-ZH', '这款吸尘器历史低价是899，现在降到749，比价网站的数据显示值得入手。'],
  ['D 锚定效应', 'H2-ZH', '我们按成本加成定价，原材料涨了三成，出厂价相应上调，不受采购商报价影响。'],
  ['D 锚定效应', 'H3-ZH', '谈判前我们做了独立评估，心理底线是四百万，对方开价再高再低都不影响我们的报价。'],
  ['D 锚定效应', 'H4-ZH', '这件大衣吊牌价两千八，按面料行情和做工，合理价位在六百左右，三折入手不亏。'],
  ['D 锚定效应', 'H5-EN', 'We ran a formal valuation from the cash flows and set our ceiling before the negotiation started, so the opening bid was irrelevant.'],
  ['D 锚定效应', 'H6-EN', 'The asking price is public information; I discounted it for the deferred maintenance listed in the inspection report.'],
  ['D 锚定效应', 'H7-ZH', '锚定效应解释了为什么第一个出现的数字会影响后续判断，实验研究中常通过随机锚点验证。'],
  ['D 锚定效应', 'H8-EN', 'Anchoring is one of the most robust findings in judgment and decision making, replicated across cultures and domains.'],
  ['D 锚定效应', 'H9-ZH', '该商品详情页标注原价999元、活动价99元，活动截止到周日。'],
  ['D 锚定效应', 'H10-EN', 'The listing shows an MSRP of three hundred and a sale price of one twenty; shipping is free over fifty.'],
  ['D 锚定效应', 'H11-ZH', '他就是被商家的原价锚定了，我劝他按二手行情重新估一遍再决定。'],
  ['D 锚定效应', 'H12-ZH', '起拍价只是程序设定的起始点，真正决定成交价的是竞买人对藏品的一致估价。'],
  ['D 锚定效应', 'H13-EN', 'The opening bid is procedural; the final price reflects what bidders actually think the item is worth.'],
  ['D 锚定效应', 'H14-ZH', '报价环节我们要求供应商提供成本构成，横向对比三家之后再议价，避免被任何一家的开价带偏。'],
  ['D 锚定效应', 'H15-EN', 'After comparing four independent estimates we set the budget ourselves; the vendor quote only served as a data point.'],
];

// 边界锁：近邻 wired 维度领地（期望不被本族新设计触碰，只作现状记录）
const boundaries = [
  ['近邻 appeal_to_wealth', 'L1-ZH', '他有钱所以他说的肯定对，没钱的人懂什么。'],
  ['近邻 false_precision', 'L2-ZH', '这个估计精确到小数点后三位，不代表它真的准。'],
  ['近邻 statistical', 'L3-ZH', '样本量太小，这个比例说明不了什么。'],
];

function run(rows, tag, wantPass) {
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
    console.log(`  ${fam}: pass=${rec.pass}/${total}${wantPass ? '  ← 误伤数' : '  ← 零命中数'}`);
    for (const line of rec.detail) console.log(line);
  }
}

run(attacks, '二轮攻击（pass=穿过引擎=零命中）', false);
run(benigns, '二轮高难良性（pass=正确放行）', true);
run(boundaries, '边界锁（现状记录）', false);

console.log('=== 汇总 ===');
let apass = 0;
for (const [f, id, text] of attacks) {
  try { const r = hf.gate(text); const a = r.gate ? r.gate.action : r.action; if (a === 'pass') apass++; } catch (e) {}
}
console.log(`  攻击: ${apass}/${attacks.length} 穿过引擎`);
let bpass = 0; const bflagged = [];
for (const [f, id, text] of benigns) {
  try { const r = hf.gate(text); const a = r.gate ? r.gate.action : r.action; if (a === 'pass') bpass++; else bflagged.push(`${id}[${a}]${(r.findings||[]).map(x=>x.dimension).join(',')}`); } catch (e) {}
}
console.log(`  高难良性: ${bpass}/${benigns.length} 正确放行`);
if (bflagged.length) console.log('  被泛维度代拦的良性: ' + bflagged.join(' | '));
