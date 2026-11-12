// r297 探针：ad_hominem ATTACK_EN c3 + DISREGARD_EN d1-d5 补腿质量实测。
// 判据：gate() 命中 ad_hominem 维度算红；良性样本必须零命中。
const hf = require('../../src/gate.js');
const check = (t) => hf.gate(t);

const ATTACK = [
  // c3 简单否定专业身份
  ["You're not a climate scientist, so your opinion on this is worthless.", 'c3 not a X scientist'],
  ["They are not professional auditors, so we can ignore their report.", 'c3 not professional auditors'],
  ["No data scientist would reach that conclusion.", 'c3 no data scientist'],
  ["He did not finish college, so he has no standing to judge.", 'c3 did not finish college'],
  ["She lacks the expertise to evaluate this model.", 'c3 lacks expertise'],
  ["He has never run a business, so his advice counts for nothing.", 'c3 never run a business'],
  ["We should ignore the outsiders on this question.", 'c3 outsiders'],
  // d1 no standing to <动作>
  ["You have no standing to judge this decision.", 'd1 no standing to judge'],
  ["She has no authority to lecture us about it.", 'd1 no authority to lecture'],
  ["They lack the credibility to comment on our work.", 'd1 lack credibility to comment'],
  // d2 means/counts for nothing
  ["Your opinion means nothing to me.", 'd2 opinion means nothing'],
  ["His analysis counts for nothing around here.", 'd2 analysis counts for nothing'],
  // d3 should not + 专业动作
  ["You should not lecture us on ethics.", 'd3 should not lecture'],
  ["They cannot tell us how to run our lab.", 'd3 cannot tell us'],
  // d4 fake
  ["Your conclusion is completely fake.", 'd4 fake'],
  ["The numbers are made up.", 'd4 made up'],
  // d5 your conclusions worthless
  ["Your conclusions are worthless.", 'd5 your conclusions worthless'],
  ["Our findings are garbage and should be dismissed.", 'd5 garbage'],
];

const BENIGN = [
  'You are not a climate scientist, but your data is solid and worth checking.', // 否定身份但认可数据
  "He didn't finish college, yet he built a working prototype we should evaluate.", // 学历否定 + 正面结论
  'I am not a lawyer, so please consult a professional before signing.', // 自我身份否定（非攻击）
  'This is not legal advice; consult a qualified attorney.', // 免责声明
  'We are not experts in this field and would welcome a review.', // 自认非专家 + 邀请
  'Your analysis is wrong on point three, but the overall approach is sound.', // 局部否定非全盘作废
  'The data appears fabricated; we need to verify the source before publishing.', // 质疑数据来源（程序性）
  'I should not judge the outcome before the report is released.', // 自我指涉 should not judge（r296 交接自修项）
  'As you noted, the numbers still fluctuate, let us watch the trend.', // 协作文本
  'We can safely ignore the outliers flagged by the automated filter.', // 数据处理动作（ignore 宾语非人）
];

function run() {
  let hit = 0;
  const misses = [];
  for (const [text, label] of ATTACK) {
    const r = check(text);
    const found = (r.findings || []).some(f => f.dimension === 'ad_hominem');
    if (found) hit++; else misses.push(label + ' :: ' + text);
  }
  console.log(`ad_hominem 攻击命中: ${hit}/${ATTACK.length}`);
  misses.forEach(m => console.log('   MISS: ' + m));

  let fp = 0;
  const hits = [];
  for (const text of BENIGN) {
    const r = check(text);
    const found = (r.findings || []).some(f => f.dimension === 'ad_hominem');
    if (found) { fp++; hits.push(text); }
  }
  console.log(`ad_hominem 良性误伤: ${fp}/${BENIGN.length}`);
  hits.forEach(h => console.log('   FP: ' + h));
  return { hit, total: ATTACK.length, fp, fpTotal: BENIGN.length };
}

console.log('--- r297 ad_hominem 补腿复测（working tree）---');
console.log(JSON.stringify(run(), null, 1));
