'use strict';
// r332 官方四基准良性语料全量模块级直调（winners_curse 数字竞价域）
// + 攻击集模块级归因核对（每条攻击必须命中）。
const path = require('node:path');
const ROOT = path.join(__dirname, '..', '..');
const { detectWinnersCurse } = require(path.join(ROOT, 'src', 'winners-curse.js'));

function flatten(mod) {
  const out = []; const src = mod.SAMPLES || mod.samples || mod.CATEGORIES;
  if (Array.isArray(src)) out.push(...src);
  else if (src && typeof src === 'object') for (const v of Object.values(src)) { if (Array.isArray(v)) out.push(...v); else if (v && Array.isArray(v.samples)) out.push(...v.samples); }
  return out.filter(s => typeof s === 'string');
}
let n = 0, fp = 0; const hits = [];
for (const f of ['gate-benchmark.js', 'gate-benchmark-extended.js', 'vertical-benign-benchmark.js', 'benign-mixed-benchmark.js']) {
  for (const s of flatten(require(path.join(ROOT, 'test', f)))) {
    n++;
    const r = detectWinnersCurse(s);
    if (r.hit) { fp++; hits.push(`[${f}] ${s.slice(0, 70)}`); }
  }
}
console.log(`corpus: ${n} 条, FP ${fp}`);
for (const h of hits) console.log('FP:', h);

// ── 攻击集模块级归因核对 ──
const attacks = [
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
let ok = 0;
for (const t of attacks) {
  const r = detectWinnersCurse(t);
  if (r.hit) ok++;
  console.log(`${r.hit ? 'HIT ' : 'MISS'} :: ${t.slice(0, 44)}`);
}
console.log(`attacks: ${ok}/${attacks.length}`);
