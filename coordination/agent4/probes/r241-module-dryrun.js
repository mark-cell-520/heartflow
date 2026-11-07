// r241 模块干跑（agent-4）：src/endowment-effect.js 对攻击/疑难良性/FP 压力
// 样本的逐条命中情况。运行：node coordination/agent4/probes/r241-module-dryrun.js
'use strict';
const path = require('path');
const { detectEndowmentEffect } = require(path.join(__dirname, '..', '..', '..', 'src', 'endowment-effect.js'));

const attacks = [
  ['A1-ZH', '这把吉他是我的，陪了我十年，别说三千，五千我都不卖。'],
  ['A2-ZH', '我的旧车虽然市价只值两万，但对我而言它值五万，低于这个价免谈。'],
  ['A3-ZH', '房子是我一手装修起来的，每个角落都有我的心思，市场价再高也反映不了它的价值。'],
  ['A4-EN', 'This watch is mine, I have had it for twenty years, no amount under ten thousand will buy it.'],
  ['A5-EN', 'He would not sell his grandfather\u2019s desk at any market price — it is his, so it is worth more than that.'],
  ['A6-EN', 'The team built this product line from scratch, so no acquisition offer on the table can reflect what it is worth to us.'],
  ['A7-ZH', '我这个摊位干了十五年，早就不是钱的问题了，给多少钱都代表不了它在我心里的价值。'],
  ['A2-1-ZH', '这幅画挂在我客厅二十年了，画廊出多少价我都不会考虑，它早就不是商品。'],
  ['A2-2-ZH', '咖啡馆是我从一张桌子开始做起来的，连锁品牌给的收购价再高，也买不走这家店。'],
  ['A2-3-EN', 'The cabin has been in my family for generations; whatever the land is appraised at, we are not selling.'],
  ['A2-4-ZH', '这串手机号我挑了十几年，别人出价再高也是我的，运气早就绑在一起了。'],
  ['A2-5-ZH', '老厂区承载着几代工人的青春，补偿款给得再高也买不断这份感情，说什么都不能拆。'],
  ['A2-6-EN', 'My first guitar is not for sale at any price — the offer would have to be insultingly high to even start a conversation.'],
];

const benigns = [
  ['BA1-ZH', '这套设备虽然买的时候贵，但二手行情只值三成，该更新就更新，不能感情用事。'],
  ['BA2-ZH', '藏品估价要参考近期拍卖成交记录，业主的情感估值不能作为鉴定依据。'],
  ['BA3-EN', 'He values his late father\u2019s watch far above its market price for sentimental reasons, but he knows exactly what it is worth.'],
  ['BA4-EN', 'Owners typically demand more to give up an item than they would pay to acquire it, a robust experimental finding.'],
  ['BA5-ZH', '公司资产按会计准则计提折旧，账面价值与市场价值之间的差异需要在附注中说明。'],
  ['BA2-1-ZH', '情感价值与市场价值可以并存，但理性决策应当以市场价值为基准。'],
  ['BA2-2-ZH', '遗产分割时，继承人可以协商情感优先的方案，同时接受专业估价作为参考。'],
  ['BA2-3-ZH', '他拒绝出售是出于合同限制与竞业条款，与估值高低无关。'],
  ['BA2-4-ZH', '业主因急售报价低于市场价也接受，先把资金回笼再说。'],
  ['BA2-5-ZH', '收藏者按拍卖行情低买高卖，从不因为喜欢就在出价上让步。'],
  ['BA2-6-EN', 'Owners typically demand more to give up an item than they would pay to acquire it, a robust experimental finding.'],
  // 追加 FP 压力：交易框架在场但无估值推高/拒交易腿
  ['FP1-ZH', '这是我的看法，价格问题我们再核算一遍。'],
  ['FP2-ZH', '我们的报价已经是底线了，再低公司确实做不了。'],
  ['FP3-ZH', '我的房子市场价涨了两成，但这跟卖不卖没关系，先自住着。'],
  ['FP4-ZH', '我的手机屏幕碎了，卖不出价，干脆自己用着。'],
  ['FP5-ZH', '这套茶具是我的，但我按市场价估了值，该更新就更新，不能感情用事。'],
  ['FP6-ZH', '责任问题免谈，这是我的底线。'],
  ['FP7-EN', 'He knows exactly what his collection is worth and prices it accordingly.'],
  ['FP8-EN', 'Our asking price reflects the recent comparable sales in the neighborhood.'],
  ['FP9-ZH', '业主联名提交了异议，补偿方案还在协商。'],
  ['FP10-ZH', '这块表是父亲留给我的，我按拍卖行估价入了保险，该赔多少赔多少。'],
  ['FP11-ZH', '公司资产处置经过评估和挂牌交易程序，与个人感情无关。'],
  ['FP12-ZH', '我的想法不值这个价，你们按市场行情来定就好。'],
];

function run(rows, tag, want) {
  let ok = 0;
  console.log(`=== ${tag} ===`);
  for (const [id, text] of rows) {
    const r = detectEndowmentEffect(text);
    const good = want ? r.hit : !r.hit;
    if (good) ok++;
    console.log(`  ${good ? '✓' : '✗'} ${id} hit=${r.hit}${r.hit ? ' sig=' + r.count + ' ' + r.details.slice(0, 60) : ''}`);
  }
  console.log(`  ${tag}: ${ok}/${rows.length}`);
}

run(attacks, '攻击（应命中）', true);
run(benigns, '良性+FP压力（应不命中）', false);
