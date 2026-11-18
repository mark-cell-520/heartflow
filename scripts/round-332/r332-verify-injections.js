'use strict';
// 验证每个最小注入样本：删目标模式 → 翻未命中；其余注入项 → 保持命中。
const wc = require('../../src/winners-curse.js');
const I = wc.__internals();
const NEVER = /(?!a)a/;

function del(list, i) { return list.map((r, j) => (j === i ? NEVER : r)); }

// [名称, 句子, inject 工厂]
const CASES = [
  // ── 腿① ZH 新模式 ──
  ['WIN_ZH4#0 ①-m 竞得动词×数字标的', '抢到了核心关键词说明市场认可这个价值。', () => ({ WIN_ZH4: del(I.WIN_ZH4, 0) })],
  ['WIN_ZH4#1 ①-n 被动归属形', '主播被别家签走正说明市场认可他的价值。', () => ({ WIN_ZH4: del(I.WIN_ZH4, 1) })],
  ['WIN_ZH4#2 ①-o 竞价语境×数字标的', '这次竞拍瞄准了首页坑位，说明市场认可这个位置的价值。', () => ({ WIN_ZH4: del(I.WIN_ZH4, 2) })],
  ['WIN_ZH4#3 ①-p 签约竞价族', '天价签下这个主播证明平台认可他的商业价值，这笔签约费花得值。', () => ({ WIN_ZH4: del(I.WIN_ZH4, 3) })],
  ['WIN_ZH4#4 ①-q 逆序形', '首页广告位拍卖的成交价出炉了，这说明市场认可这个流量的价值。', () => ({ WIN_ZH4: del(I.WIN_ZH4, 4) })],
  // ── 腿① EN 新模式（①-m4 outbid 形已删：存量 ①-c 超集包含）──
  ['WIN_EN4#0 ①-m3 won the X auction', 'We won the premium keyword auction, which confirms this traffic is worth what we bid.', () => ({ WIN_EN4: del(I.WIN_EN4, 0) })],
  ['WIN_EN4#1 ①-m4 signed the streamer', 'Signing the star streamer for that fee proves the platform accepts her market value.', () => ({ WIN_EN4: del(I.WIN_EN4, 1) })],
  ['WIN_EN4#2 ①-m5 went to highest bidder', 'The sponsorship went to the highest bidder, and that proves the traffic is worth it.', () => ({ WIN_EN4: del(I.WIN_EN4, 2) })],
  // ── 腿② ZH 新模式 ──
  ['VALUE_ZH4#0 ②-i 推断×认可×价值', '竞拍到关键词说明平台认可这个价值。', () => ({ VALUE_ZH4: del(I.VALUE_ZH4, 0) })],
  ['VALUE_ZH4#1 ②-j 标的×值这个价', '抢到了这个黄金广告位，这个位置就值这个钱。', () => ({ VALUE_ZH4: del(I.VALUE_ZH4, 1) })],
  ['VALUE_ZH4#2 ②-k 推断×价值名词', '天价签下头部网红后，平台用实际行动证明了它的变现价值。', () => ({ VALUE_ZH4: del(I.VALUE_ZH4, 2) })],
  // ── 腿② EN 新模式 ──
  ['VALUE_EN4#0 ②-i3 confirms×market×value', 'We won the keyword auction, which confirms advertisers recognize this value.', () => ({ VALUE_EN4: del(I.VALUE_EN4, 0) })],
  ['VALUE_EN4#1 ②-i4 X is worth it', 'We won the premium keyword auction, and the keyword we bid on was worth the price we paid.', () => ({ VALUE_EN4: del(I.VALUE_EN4, 1) })],
  ['VALUE_EN4#2 ②-i5 signing fee worth it', 'Snapping up the creator for that signing fee was money well spent — the platform values her audience.', () => ({ VALUE_EN4: del(I.VALUE_EN4, 2) })],
  ['VALUE_EN4#3 ②-i6 confirms×commercial value', 'Winning the ad slot auction means our commercial value is confirmed.', () => ({ VALUE_EN4: del(I.VALUE_EN4, 3) })],
  ['VALUE_EN4#4 ②-i7 market validated bid', 'Winning the ad slot auction indicates the market validated our bid for this placement.', () => ({ VALUE_EN4: del(I.VALUE_EN4, 4) })],
  // ── 存量腿新增词 ──
  ['WIN_ZH ①-a 补「拍到」', '拍到这块牌照说明它确实值这个价，我们的竞价得到了验证。', () => ({ WIN_ZH: I.WIN_ZH.map((r, j) => (j === 0 ? /(?:中标|竞得|拍得|拍下|夺标|标王)/ : r)) })],
  ['WIN_ZH ①-a 补「拍走」', '最后一件拍品被我们拍走了，说明市场认可这个价格。', () => ({ WIN_ZH: I.WIN_ZH.map((r, j) => (j === 0 ? /(?:中标|竞得|拍得|拍下|拍到|夺标|标王)/ : r)) })],
  ['VALUE_ZH ②-a 补「值这个钱」', '拍到这块牌照说明它确实值这个钱。', () => ({ VALUE_ZH: I.VALUE_ZH.map((r, j) => (j === 0 ? I.VALUE_ZH[0].source.replace('值这个钱|', '').length ? new RegExp(I.VALUE_ZH[0].source.replace('|值这个钱', ''), I.VALUE_ZH[0].flags) : I.VALUE_ZH[0] : r)) })],
  // ── 否定守卫新增词（反向：删词后否定句必须翻命中）──
  ['NEG 补「并不」', '竞拍到关键词并不说明市场认可这个价值，我们只是出价最高。', () => ({ NEG_BEFORE: /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能)[^。，！？；\n]{0,5}$/, NEG_INSIDE: /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能)/ })],
];

let red = 0;
for (const [name, text, mk] of CASES) {
  const base = wc.detectWinnersCurse(text).hit;
  const inj = wc.detectWinnersCurse(text, mk()).hit;
  const isNegGuard = name.startsWith('NEG');
  const ok = isNegGuard ? (base === false && inj === true) : (base === true && inj === false);
  if (ok) red++;
  console.log(`${ok ? 'RED  ' : 'GREEN'} base=${base} inj=${inj} :: ${name}`);
}
console.log(`变红 ${red}/${CASES.length}`);
