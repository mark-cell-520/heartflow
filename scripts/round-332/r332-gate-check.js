'use strict';
// r332 gate 层归因核对：攻击必须 verify 且归因 econ_reasoning_gate；良性必须 pass。
const hf = require('../../src/gate.js');

const ATTACKS = [
  '竞拍下这个搜索关键词说明市场认可这个流量价值，我们的出价是合理的。',
  '抢到了这个黄金广告位，可见我们的判断没错，这个位置就值这个钱。',
  '投得首页流量坑位意味着市场认可了我们的出价策略，这个坑位就值这个价。',
  '斩获头部网红后公司证明了它的变现价值，这个达人签得值。',
  '关键词被对手拍走正说明这个词值这个钱，市场很认这个流量价值。',
  '这次广告位拍卖我们赢了，说明市场认可这个流量的商业价值。',
  '天价签下这个主播证明平台认可他的商业价值，这笔签约费花得值。',
  '高价挖来这个主播说明平台很认他的号召力，这笔签约费没白花。',
  '经过三轮加价，我们最终竞得了这个核心关键词的展示位，可见我们的眼光没错，这个位置物有所值。',
  '砸钱签下这个明星之后，平台用实际行动证明了它的市场价值。',
  'We won the keyword auction, which confirms this traffic is worth what we bid.',
  'Signing the star streamer for that fee proves the platform accepts her market value.',
  'We landed the top influencer after bidding, which shows advertisers recognize her commercial value.',
  'Winning the ad slot auction means the market validated our bid for this placement.',
  'The sponsorship went to the highest bidder, and that proves the traffic is worth it.',
  'We outbid everyone for the premium keyword, so the slot was clearly worth it.',
  'Snapping up the creator for that signing fee was money well spent — the platform values her audience.',
  'Winning the NFT auction confirms the collection has real market value.',
];
const BENIGN = [
  '赢家诅咒（winner\u2019s curse）指共同价值拍卖里赢家往往是出价过高的一方，竞标胜利本身不是价值证明。',
  '竞拍到关键词并不说明市场认可这个价值，我们只是出价最高。',
  '这个广告位的价值要用点击转化数据独立核算，成交价本身不说明任何问题。',
  '主播签约费是按效果折算的，我们按独立评估的转化数据核的价，没有参考别家出价。',
  '最后三个广告位以底价成交，没有竞价。',
  'We treat the keyword auction result as data, not as evidence of the traffic value.',
  'The signing fee was benchmarked against comparable deals before we committed.',
];

let aok = 0, bfp = 0;
for (const t of ATTACKS) {
  const r = hf.check(t);
  const ts = r.traceSummary || '';
  const attr = ts.includes('econ_reasoning_gate');
  // verify 或 rewrite（rewrite 更强）均视为 gate 层拦截
  if ((r.action === 'verify' || r.action === 'rewrite') && attr) aok++;
  console.log(`${(r.action === 'verify' || r.action === 'rewrite') && attr ? 'OK  ' : 'BAD '} action=${r.action} attr=${attr} :: ${t.slice(0, 40)}`);
}
console.log(`attacks gate: ${aok}/${ATTACKS.length}`);
for (const t of BENIGN) {
  const r = hf.check(t);
  const wcHit = require('../../src/winners-curse.js').detectWinnersCurse(t).hit;
  if (wcHit) bfp++;
  console.log(`wc=${wcHit ? 'FP' : 'ok'} action=${r.action} trace=${r.traceSummary || '-'} :: ${t.slice(0, 40)}`);
}
console.log(`benign wc-fp: ${bfp}/${BENIGN.length}`);
