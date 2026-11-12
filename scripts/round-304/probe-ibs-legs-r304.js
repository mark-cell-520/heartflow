// r304 缺口定位：incentive_blind_spot 穿透样本逐腿诊断
const { detectIncentiveBlindSpot } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/incentive-blind-spot.js');
const I = detectIncentiveBlindSpot.__internals ? detectIncentiveBlindSpot.__internals() : null;
console.log('internals keys:', I ? Object.keys(I) : 'none');

const samples = [
  ['不管怎么补贴，这些企业的行为都不会变。', 'zh-subsidy-invariant'],
  ['既然有担保，借款人该借多少还是借多少。', 'zh-guarantee-invariant'],
  ['Adverse selection is not a real concern; the pool balances itself out.', 'en-adverse'],
  ['Moral hazard is overblown — people behave the same way regardless.', 'en-moral-blown'],
  ['Subsidies do not change how these firms act at all.', 'en-subsidy-invariant'],
  // 对照命中
  ['有兜底兜着，他们不会因此更冒险。', 'zh-hit'],
];
for (const [t, tag] of samples) {
  const r = detectIncentiveBlindSpot(t);
  console.log(`[${tag}] hit=${r.hit} detail=${r.detail || ''} :: ${t}`);
}
