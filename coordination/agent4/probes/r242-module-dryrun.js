// r242 模块干跑探针（agent-4）：src/anchoring-effect.js 直接调用
// 覆盖：两轮探针攻击全集、高难良性集、边界锁、官方 326 良性语料。
// 运行：node coordination/agent4/probes/r242-module-dryrun.js
'use strict';
const path = require('path');
const fs = require('fs');
const { detectAnchoringEffect } = require(path.join(__dirname, '..', '..', '..', 'src', 'anchoring-effect.js'));

const ATTACKS = [
  // 一轮
  ['A1', '这套房标价五百万，房东降了二十万就催着我定，我觉得占了便宜。'],
  ['A2', '谈判时对方开价八千，我砍到六千五就签了，没去想这东西其实只值三千。'],
  ['A3', '原价九千九的东西现在卖一千二，怎么看都划算，反正比标价省了八千多。'],
  ['A4', 'The sticker said ten thousand, so when the salesman offered seven I felt I was getting a great deal.'],
  ['A5', 'They opened at ninety, I countered at seventy, and we settled without ever questioning whether it was worth fifty.'],
  ['A6', 'The list price was three hundred, and the fifty percent discount made the purchase feel like a win regardless of quality.'],
  ['A7', '招聘时第一个候选人期望薪资说了两万，后面每个人我都拿这个数去比，怎么也跳不出这个范围。'],
  // 二轮
  ['B1', '起拍价一万二，最后两万八落锤，我现在觉得这瓷瓶也就值这个价。'],
  ['B2', '对方先把薪资开到一万五，我本来想谈两万二，结果顺着这个数就谈了。'],
  ['B3', '标价三千二的外套打三折，我试都没试就刷卡了，感觉不买就是亏。'],
  ['B4', '中介先说这套房市场价八百万，之后每看一套房我都拿这个数在比。'],
  ['B5', 'The bid opened at fifty, and by the close at two hundred everything still felt cheap against that opening number.'],
  ['B6', 'She quoted twelve thousand first, so my counter of ten thousand felt generous even though the repair was worth six at most.'],
  ['B7', 'The first price I heard was two hundred, and every offer after that stayed inside the orbit of that number.'],
  ['B8', '销售第一句报了原价一万九，后面砍价我就在这个数上让了两千，压根没独立估过。'],
  ['B9', 'Once he named the six-figure salary, our budget discussion never escaped that range.'],
  ['B10', '报价单上第一个项目写了八万，后面几个项目我都照着这个量级批的。'],
];

const BENIGN = [
  // 高难良性（比价/成本/独立评估/抵抗锚点/概念/纯描述）
  ['H1', '这款吸尘器历史低价是899，现在降到749，比价网站的数据显示值得入手。'],
  ['H2', '我们按成本加成定价，原材料涨了三成，出厂价相应上调，不受采购商报价影响。'],
  ['H3', '谈判前我们做了独立评估，心理底线是四百万，对方开价再高再低都不影响我们的报价。'],
  ['H4', '这件大衣吊牌价两千八，按面料行情和做工，合理价位在六百左右，三折入手不亏。'],
  ['H5', 'We ran a formal valuation from the cash flows and set our ceiling before the negotiation started, so the opening bid was irrelevant.'],
  ['H6', 'The asking price is public information; I discounted it for the deferred maintenance listed in the inspection report.'],
  ['H7', '锚定效应解释了为什么第一个出现的数字会影响后续判断，实验研究中常通过随机锚点验证。'],
  ['H8', 'Anchoring is one of the most robust findings in judgment and decision making, replicated across cultures and domains.'],
  ['H9', '该商品详情页标注原价999元、活动价99元，活动截止到周日。'],
  ['H10', 'The listing shows an MSRP of three hundred and a sale price of one twenty; shipping is free over fifty.'],
  ['H11', '他就是被商家的原价锚定了，我劝他按二手行情重新估一遍再决定。'],
  ['H12', '起拍价只是程序设定的起始点，真正决定成交价的是竞买人对藏品的一致估价。'],
  ['H13', 'The opening bid is procedural; the final price reflects what bidders actually think the item is worth.'],
  ['H14', '报价环节我们要求供应商提供成本构成，横向对比三家之后再议价，避免被任何一家的开价带偏。'],
  ['H15', 'After comparing four independent estimates we set the budget ourselves; the vendor quote only served as a data point.'],
  // 一轮良性
  ['BD1', '吊牌价只是参考，我按二手平台近三个月的成交行情重新评估了这台设备的价值。'],
  ['BD2', '报价虚高是常态，我以成本加合理利润为基准反推，报出的价格不随对方开价走。'],
  ['BD3', 'We ignored the asking price and valued the company from its cash flows before deciding what to bid.'],
  ['BD4', 'The discount was computed from the wholesale cost, and the final price still leaves a healthy margin.'],
  ['BD5', '锚定效应指初始数值对后续估计的影响，谈判中应当以独立估价为锚而非对方开价。'],
  // 常规良性
  ['N1', '公司季度采购经过三家比价和成本核算，报价高于市场行价的供应商直接出局。'],
  ['N2', '房价走势需要参考近期成交案例，不能凭中介的第一句话下结论。'],
];

const BOUNDARY = [
  ['禀赋效应领地', '这把吉他是我的，陪了我十年，别说三千，五千我都不卖。'],
  ['赢家诅咒领地', '我们竞标成功，说明这块地确实被低估了。'],
  ['诉诸财富领地', '他有钱所以他说的肯定对，没钱的人懂什么。'],
  ['虚假精度领地', '这个估计精确到小数点后三位，不代表它真的准。'],
  ['沉没成本领地', '这个项目已经投了两百万，现在停掉前面的钱就全打水漂了，只能硬着头皮做完。'],
  ['心理账户领地', '年终奖发下来我花得特别痛快，反正不是工资，花着不心疼。'],
  ['处置效应领地', '我这只票涨了四成，先落袋为安，套牢的那只再拿拿，总能涨回来的。'],
  ['统计领地', '样本量太小，这个比例说明不了什么。'],
  ['单腿-只锚点无支配腿', '这件商品原价999元，现价199元，页面还有满减活动。'],
  ['单腿-只支配腿无锚点', '我觉得今天不买就是亏，逛街不能空手回去。'],
  ['否定前缀-ZH', '虽然原价标得很高，我并不觉得划算，按行情估完根本不值。'],
  ['否定前缀-EN', 'The list price looked high, but I never felt it was a deal after checking the comparable sales.'],
];

let fail = 0;
for (const [id, t] of ATTACKS) {
  const r = detectAnchoringEffect(t);
  if (!r.hit) { fail++; console.log(`✗ 攻击未命中 ${id}: ${t}`); }
  else console.log(`✓ 攻击 ${id} [${r.dimension}] count=${r.count} score=${r.score}`);
}
for (const [id, t] of BENIGN) {
  const r = detectAnchoringEffect(t);
  if (r.hit) { fail++; console.log(`✗ 良性误伤 ${id}: ${t}`); }
  else console.log(`✓ 良性放行 ${id}`);
}
for (const [k, t] of BOUNDARY) {
  const r = detectAnchoringEffect(t);
  if (r.hit) { fail++; console.log(`✗ 边界误判[${k}]: ${t}`); }
  else console.log(`✓ 边界不判 [${k}]`);
}

// 官方良性语料（bidirectional-guard 的 326 条误拦基线集）
const guardPath = path.join(__dirname, '..', '..', '..', 'scripts', 'bidirectional-guard.js');
try {
  const src = fs.readFileSync(guardPath, 'utf8');
  // 提取 BENIGN/误拦集：找字符串数组
  const m = src.match(/(?:const|let|var)\s+\w*(?:BENIGN|benign|FP|fp)\w*\s*=\s*\[([\s\S]*?)\];/);
  if (m) {
    const items = m[1].match(/'[^']*'|"[^"]*"/g) || [];
    let hitCount = 0;
    for (const q of items) {
      const t = q.slice(1, -1);
      if (detectAnchoringEffect(t).hit) { hitCount++; console.log(`✗ 官方良性误命中: ${t.slice(0, 50)}`); }
    }
    console.log(`官方良性语料: ${items.length - hitCount}/${items.length} 零误命中`);
    if (hitCount > 0) fail += hitCount;
  } else {
    console.log('官方良性语料: 未找到 BENIGN 数组定义（跳过，改为引擎侧验证）');
  }
} catch (e) {
  console.log('官方良性语料检查跳过: ' + e.message);
}

console.log(`\n干跑结果: 失败=${fail}`);
process.exit(fail > 0 ? 1 : 0);
