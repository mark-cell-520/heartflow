// r297 探针 2：ad_hominem 双腿共现版（ATTACK × DISREGARD 缺一不判，见 checkAdHominem line 331）。
const hf = require('../../src/gate.js');
const check = (t) => hf.gate(t);

const ATTACK = [
  // c3 腿 + d 腿
  ["You're not a climate scientist, so your opinion on this is worthless.", 'c3 + d5 worthless'],
  ["They are not professional auditors, so their report means nothing.", 'c3 + d2 means nothing'],
  ["He did not finish college, so his analysis can be dismissed.", 'c3 + disregard'],
  ["She lacks the expertise to evaluate this model, and her criticism counts for nothing.", 'c3 + d2'],
  ["He has never run a business, so his argument means nothing.", 'c3 + d2'],
  ["We should ignore the outsiders — their findings are garbage.", 'c3 + d5'],
  // d1 腿 + a 腿（旧族）
  ["He is a known liar, so he has no standing to judge this decision.", 'a liar + d1'],
  ["You are a hypocrite, so your conclusions are worthless.", 'a + d5'],
  // d2/d3/d4/d5 腿 + a 腿
  ["A fraud like him has no authority to lecture us about it.", 'a fraud + d1'],
  ["She is dishonest, so her analysis should be disregarded entirely.", 'a + disregard'],
  ["Two-faced as he is, his numbers are completely fake.", 'a + d4 fake'],
  ["The numbers are made up, and the guy who reported them is a fraud.", 'd4 + a'],
  ["Your conclusions are worthless and you are a known liar.", 'd5 + a'],
  // d3 腿 + a 腿
  ["You are a charlatan, so you should not lecture us on ethics.", 'a + d3'],
  ["A sanctimonious preacher like you cannot tell us how to run our lab.", 'a + d3'],
  // ZH 双腿回归（旧腿 + 新 d 腿）
  ['你就是个骗子，所以你的观点根本不可信', 'ZH a + 作废'],
  ['他从来没做过这一行，所以他的分析完全错误', 'ZH c + 作废'],
];

const BENIGN = [
  'You are not a climate scientist, but your data is solid and worth checking.', // 单腿 c3，无作废腿
  'He did not finish college, yet he built a working prototype we should evaluate.', // 单腿
  'I am not a lawyer, so please consult a professional before signing.', // 单腿（自我）
  'This is not legal advice; consult a qualified attorney.', // 免责
  'We are not experts in this field and would welcome a review.', // 单腿 + 邀请
  'Your analysis is wrong on point three, but the overall approach is sound.', // 局部否定
  'The data appears fabricated; we need to verify the source before publishing.', // 质疑数据来源（程序性，无 a 腿）
  'I should not judge the outcome before the report is released.', // 自我指涉（r296 交接自修项）
  'As you noted, the numbers still fluctuate, let us watch the trend.', // 协作
  'We can safely ignore the outliers flagged by the automated filter.', // 数据处理
  'Ad hominem attacks like calling him a liar are a logical fallacy.', // META_EXEMPT
  '骗子说他没做过，但他确实做完了这个项目', // ZH 反例（真伪陈述）
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

console.log('--- r297 ad_hominem 双腿版复测（working tree）---');
console.log(JSON.stringify(run(), null, 1));
