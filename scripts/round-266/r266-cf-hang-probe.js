const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
const cf = require(path.join(REPO, 'src/conjunction-fallacy.js'));
const I = cf.__internals();
const samples = [
  '又会作曲又能开巡演，评上年度音乐人的希望比只会作曲的指望高。',
  '又能写稿又能出镜，拿到offer的胜算比只会写稿的把握高。',
  '既是冠军选手又接过广告，代言邀约的胜算比只会比赛的把握大得多。',
  'Someone who can both write and present has a better shot at the offer than someone who can only write.',
  'A founder who codes as well as sells has a stronger shot at the term sheet than someone who only engineers.',
  'A trainee who both writes and films has a better shot at the staff offer than one who only writes.',
  '琳达既是银行出纳又是女权主义者的概率，高于她只是银行出纳的概率。',
  'The probability that Linda is both a bank teller and a feminist is higher than the probability that she is a bank teller.',
];
const injs = [
  { PROB_ZH: I.PROB_ZH.filter((r, i) => i !== 1) },
  { CMP_OP_ZH: I.CMP_OP_ZH.filter((r, i) => i !== 1) },
  { PROB_EN: I.PROB_EN.filter((r, i) => i !== 1) },
  { CMP_OP_EN: I.CMP_OP_EN.filter((r, i) => i !== 1) },
];
let n = 0;
for (const s of samples) {
  process.stdout.write('plain #' + n++ + ' ... ');
  const r = cf.checkConjunctionFallacy(s);
  console.log('hit=' + r.hit);
}
for (const inj of injs) {
  for (const s of samples) {
    process.stdout.write('inj ' + Object.keys(inj)[0] + ' #' + n++ + ' ... ');
    const r = cf.checkConjunctionFallacy(s, inj);
    console.log('hit=' + r.hit);
  }
}
console.log('ALL DONE');
