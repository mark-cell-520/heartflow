const { detectMentalAccounting } = require('/data/home/heartflow/src/mental-accounting.js');
const cases = [
  '这笔年终奖花起来不心疼；The bonus feels free, so I splurged on it.',
  '年终奖是意外之财，花起来不心疼；报销的钱，不花白不花。',
];
for (const t of cases) {
  const r = detectMentalAccounting(t);
  console.log(JSON.stringify({ text: t, hit: r.hit, count: r.count, score: r.score, evidence: r.evidence }));
}
