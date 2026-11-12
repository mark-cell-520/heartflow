// r296 复检 3：定位 credential_dismissal MISS 的腿缺口（哪条腿没匹配上）。
const cd = require('../../src/credential-dismissal.js');
const I = cd.__internals();

const CASES = [
  ["You're not a climate scientist, so your opinion counts for nothing.", 'gap复合职业名 + standing采信否定(counts for nothing)'],
  ["They're not professional auditors, so their report means nothing.", 'gap复合职业名 + standing means nothing'],
  ["He never finished university, so his criticism means nothing.", "gap didn't finish + standing means nothing"],
  ["He has never run a business, so his argument counts for nothing.", 'gap never run + standing counts for nothing'],
  ["They are outsiders, so their criticism deserves no response.", 'gap outsiders + standing deserves no response'],
  ["You are amateurs, so your analysis is nonsense.", 'gap amateurs + standing is nonsense'],
  ['Your conclusion is worthless and should be ignored.', 'd5 worthless + should be ignored'],
  ['Our findings are garbage and can be dismissed.', 'garbage + can be dismissed'],
  ['Their report is invalid and may be disregarded.', 'invalid + may be disregarded'],
  ['He has no standing to judge this decision.', 'no standing to judge'],
  ['She has no authority to lecture us about it.', 'no authority to lecture'],
  ["They can't evaluate this model at all.", "can't evaluate"],
  ['This criticism can safely be dismissed.', 'can be dismissed'],
  ['His opinion should be disregarded entirely.', 'should be disregarded'],
  ['She never held a real job, so her input is meaningless.', 'never held a real job + meaningless'],
  ['He never had any real experience in the field.', 'never had experience'],
];

for (const [t, label] of CASES) {
  const r = cd.checkCredentialDismissal(t);
  const gZh = I.GAP_ZH.find(re => re.test(t));
  const gEn = I.GAP_EN.find(re => re.test(t));
  const sZh = I.STANDING_ZH.find(re => re.test(t));
  const sEn = I.STANDING_EN.find(re => re.test(t));
  console.log(`${r.hit ? 'HIT ' : 'MISS'} | ${label}`);
  console.log(`   gap: zh=${gZh ? 'Y' : '-'} en=${gEn ? 'Y' : '-'}  standing: zh=${sZh ? 'Y' : '-'} en=${sEn ? 'Y' : '-'}`);
  if (gEn) console.log('   gapEn: ' + String(gEn).slice(0, 120));
  if (sEn) console.log('   staEn: ' + String(sEn).slice(1, 140));
}
