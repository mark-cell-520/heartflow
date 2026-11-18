'use strict';
// r332 语料自检：确认每条攻击命中、记录承重模式索引；良性不命中。
const wc = require('../../src/winners-curse.js');
const I = wc.__internals();

const ATTACK_ZH = [
  // ①-m 竞得动词 × 数字标的
  '竞拍下这个搜索关键词说明市场认可这个流量价值，我们的出价是合理的。',
  '抢到了这个黄金广告位，可见我们的判断没错，这个位置就值这个钱。',
  '投得首页流量坑位意味着市场认可了我们的出价策略，这个坑位就值这个价。',
  '斩获头部网红后公司证明了它的变现价值，这个达人签得值。',
  // ①-n 被动归属形
  '关键词被对手拍走正说明这个词值这个钱，市场很认这个流量价值。',
  // ①-o 竞价语境 × 数字标的
  '这次广告位拍卖我们赢了，说明市场认可这个流量的商业价值。',
  // ①-p 签约竞价族
  '天价签下这个主播证明平台认可他的商业价值，这笔签约费花得值。',
  '高价挖来这个主播说明平台很认他的号召力，这笔签约费没白花。',
  // 变体：带修饰长句 / 裸名词
  '经过三轮加价，我们最终竞得了这个核心关键词的展示位，可见我们的眼光没错，这个位置物有所值。',
  '砸钱签下这个明星之后，平台用实际行动证明了它的市场价值。',
];
const ATTACK_EN = [
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
  // 概念讨论（CURSE 豁免）
  '赢家诅咒（winner\u2019s curse）指共同价值拍卖里赢家往往是出价过高的一方，竞标胜利本身不是价值证明。',
  "The winner's curse means winning a common-value auction is evidence we overpaid, not that the asset is worth it.",
  // 否定守卫
  '竞拍到关键词并不说明市场认可这个价值，我们只是出价最高。',
  '天价签下主播并不能证明平台认可他的商业价值，溢价要单独核算。',
  'Winning the keyword auction does not prove the market recognizes this traffic value.',
  // 独立估值/纠正语境
  '这个广告位的价值要用点击转化数据独立核算，成交价本身不说明任何问题。',
  '主播签约费是按效果折算的，我们按独立评估的转化数据核的价，没有参考别家出价。',
  '天价签下主播后业绩不及预期，说明竞价胜利不等于价值证明。',
  'We treat the keyword auction result as data, not as evidence of the traffic value.',
  'The signing fee was benchmarked against comparable deals before we committed.',
  // 非竞价事实陈述
  '最后三个广告位以底价成交，没有竞价。',
  'We lost the ad slot auction, which says nothing about the placement worth.',
];

// 承重模式定位：对每条攻击逐模式删条，看哪些模式是承重的
function whichLeg1(text, list) {
  const out = [];
  list.forEach((re, i) => {
    const inj = { WIN_ZH4: list.map((r, j) => (j === i ? /(?!a)a/ : r)) };
    const r = wc.detectWinnersCurse(text, inj);
    // 若整句仍命中但去掉该模式后不命中 → 该模式承重（简化：直接看删该条后是否不命中）
    if (!r.hit) out.push(i);
  });
  return out;
}

console.log('=== 攻击（模块层）===');
let aok = 0;
for (const t of ATTACK_ZH.concat(ATTACK_EN)) {
  const r = wc.detectWinnersCurse(t);
  const ok = r.hit === true;
  if (ok) aok++;
  console.log(`${ok ? 'HIT ' : 'MISS'} :: ${t.slice(0, 46)}`);
}
console.log(`attacks module-hit: ${aok}/${ATTACK_ZH.length + ATTACK_EN.length}`);

console.log('=== 良性（模块层）===');
let bok = 0;
for (const t of BENIGN) {
  const r = wc.detectWinnersCurse(t);
  const ok = r.hit === false;
  if (ok) bok++;
  console.log(`${ok ? 'PASS' : 'FP  '} :: ${t.slice(0, 46)}`);
}
console.log(`benign module-pass: ${bok}/${BENIGN.length}`);

console.log('=== ZH 腿①逐模式承重 ===');
for (const t of ATTACK_ZH) {
  const legs = whichLeg1(t, I.WIN_ZH4);
  console.log(`leg1=${JSON.stringify(legs)} :: ${t.slice(0, 30)}`);
}
