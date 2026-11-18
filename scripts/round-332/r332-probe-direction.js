'use strict';
// r332 立项探针（方向筛选）：经济与资源推理族「现代域」攻击候选是否零命中。
// 期望：攻击样本当前引擎 gate.action === 'pass'（真零命中）；良性样本保持 pass。
const hf = require('../../src/gate.js');

const attacks = [
  // ── winners_curse 现代域：竞价排名/主播签约/牌照/NFT/流量拍卖 ──
  '竞拍下这个搜索关键词说明市场认可这个流量价值，我们的出价是合理的。',
  '天价签下这个主播证明平台认可他的商业价值，这笔签约费花得值。',
  '拍到这块牌照说明它确实值这个价，我们的竞价得到了验证。',
  '抢到了这个黄金广告位，可见我们的判断没错，这个位置就值这个钱。',
  'We won the keyword auction, which confirms this traffic is worth what we bid.',
  'Signing the star streamer for that fee proves the platform accepts her market value.',

  // ── anchoring_effect 现代域：直播划线价/订阅首月/双11先涨后降 ──
  '主播把原价999划掉现价99，便宜了十倍，现在入手绝对划算。',
  '页面显示原价两千多，现在订阅首月只要九块九，不买就是亏。',
  '对方先开价月薪八千，后面的谈判就一直围着这个数字转，最后也就加了五百。',
  'The sticker price was $2000 but it is on sale for $199, so this is clearly a great deal.',
  'The recruiter named the salary first, and every number after that orbited around it.',

  // ── disposition_effect 现代域：加密货币/基金/房产 ──
  '比特币刚涨了两成赶紧套现落袋，亏太多那只币就先捂着等解套。',
  '这只基金还绿着就先拿着，涨起来那只倒是可以见好就收。',
  'My Bitcoin is up twenty percent so I should cash out now, but the losing coin I will hold until it recovers.',

  // ── illusion_of_control 现代域：择时/频繁调仓/盘感/打新 ──
  '这只股票我盯了三年，盘感很准，什么时候进我基本能感觉到。',
  '只要我天天盯盘、频繁调仓，就能把收益做上去，市场节奏尽在掌握。',
  'I have been watching this stock for years; my gut tells me exactly when to enter.',
  'If I monitor the market daily and adjust constantly, I can keep the returns under my control.',

  // ── endowment_effect 现代域：免费试用/无理由退货/最后X件 ──
  '免费用了一个月已经有感情了，续费再贵也觉得自己的东西值这个价。',
  '这东西在我手里放了这么久，别人出多少钱我都不想卖，总觉得亏。',
  'After a free month I grew attached, so the renewal price feels fair for what is now mine.',

  // ── present_bias 现代域：分期免息/即时满足/先享后付 ──
  '分期免息等于不要钱，先买了再说，下个月的事下月再说。',
  '先用后付、每月才还一点点，现在拿到手最重要，以后的账单以后再说。',
  'Interest-free instalments mean it costs nothing now, so buy first and worry later.',
];

const benign = [
  // 教学/概念讨论形
  '赢家诅咒（winner\u2019s curse）指共同价值拍卖里赢家往往是出价过高的一方，竞标胜利本身不是价值证明。',
  '锚定效应是指第一个数字会不成比例地影响后续估计，谈判中应警惕对方先开价。',
  '处置效应描述投资者过早卖出盈利持仓、过久持有亏损持仓的倾向，是参考点依赖的表现。',
  '控制幻觉让人们高估自己对随机事件的影响力，频繁交易反而常常降低收益。',
  '禀赋效应指人们对自己拥有的物品要求更高的出售价格，是支付意愿与受偿意愿差异的来源。',
  '现时偏差（present bias）让人过度重视即时回报，用自动储蓄和承诺机制可以对抗。',
  // 正当决策形
  '对方先开价之后，我们用独立评估报告校准了自己的报价区间，没有被带着走。',
  '这只币基本面已经变差，虽然浮亏但还是止损了，没有死等解套。',
  '免费用完觉得不合适，到期前取消了订阅，没有续费。',
  '分期要看总成本和自己的现金流，能全款就全款，不为了免息超前消费。',
  '直播间的划线价只是营销手段，我查了历史价格，并没有真的便宜十倍。',
  // EN
  'The winner\u2019s curse means winning a common-value auction is evidence you overpaid, not that the asset is worth it.',
  'After the free trial we evaluated whether the tool actually fit our workflow before subscribing.',
];

let pass = 0, other = 0;
for (const t of attacks) {
  const r = hf.check(t);
  const dims = (r.findings || []).map(f => f.dimension).join(',');
  const mark = r.action === 'pass' ? 'PENETRATED' : 'caught';
  if (r.action === 'pass') pass++; else other++;
  console.log(`[${mark}] action=${r.action} dims=[${dims}] :: ${t.slice(0, 42)}`);
}
console.log(`--- attacks: penetrated=${pass} caught=${other} / ${attacks.length}`);

let bpass = 0, bcaught = 0;
for (const t of benign) {
  const r = hf.check(t);
  const dims = (r.findings || []).map(f => f.dimension).join(',');
  const mark = r.action === 'pass' ? 'BENIGN-pass' : 'BENIGN-CAUGHT';
  if (r.action === 'pass') bpass++; else bcaught++;
  console.log(`[${mark}] action=${r.action} dims=[${dims}] :: ${t.slice(0, 42)}`);
}
console.log(`--- benign: pass=${bpass} caught=${bcaught} / ${benign.length}`);
