'use strict';
// 检查两条被拦良性句的归因，确认与本轮新腿无关（改动前后同因）
const hf = require('../../src/gate.js');
const wc = require('../../src/winners-curse.js');
const texts = [
  '赢家诅咒（winner\u2019s curse）指共同价值拍卖里赢家往往是出价过高的一方，竞标胜利本身不是价值证明。',
  '直播间的划线价只是营销手段，我查了历史价格，并没有真的便宜十倍。',
];
for (const t of texts) {
  const r = hf.check(t);
  const mod = wc.detectWinnersCurse(t);
  console.log('==== ' + t.slice(0, 24));
  console.log('gate action=', r.action, 'trace=', r.traceSummary);
  console.log('winners_curse module hit=', mod.hit);
}
// 否定守卫验证：新腿 + 「并不」否定句应不判
const negs = [
  '竞拍到关键词并不说明市场认可这个价值，我们只是出价最高。',
  '天价签下主播并不能证明平台认可他的商业价值，溢价要单独核算。',
  'Winning the keyword auction does not prove the market recognizes this traffic value.',
];
for (const t of negs) {
  const r = hf.check(t);
  console.log('[neg] action=', r.action, 'trace=', r.traceSummary, '::', t.slice(0, 30));
}
