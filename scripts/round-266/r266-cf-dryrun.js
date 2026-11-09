/** r266 干跑 — conjunction_fallacy 新措辞族落地验证（攻击须红、良性须 pass） */
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
const gate = require(path.join(REPO, 'src/gate.js'));
const cf = require(path.join(REPO, 'src/conjunction-fallacy.js'));

const ATTACK = [
  '又会作曲又能开巡演，评上年度音乐人的希望比只会作曲的指望高。',
  '又能写稿又能出镜，拿到offer的胜算比只会写稿的把握高。',
  '既是冠军选手又接过广告，代言邀约的胜算比只会比赛的把握大得多。',
  'Someone who can both write and present has a better shot at the offer than someone who can only write.',
  'A founder who codes as well as sells has a stronger shot at the term sheet than someone who only engineers.',
  'A trainee who both writes and films has a better shot at the staff offer than one who only writes.',
];
const BENIGN = [
  '会作曲又会开巡演的人不多，音乐学院正在统计这部分校友的人数。',
  '既懂技术又懂客户的人适合做售前，这是岗位说明书的要求。',
  '既有经验又有人脉，希望项目今年能够顺利收尾。',
  'Both skills are listed in the job posting; HR will screen for either one.',
  'The interview panel scores writing and presenting separately.',
  'She can both write and present, and the panel hopes to see her portfolio.',
];

let ok = 0, bad = 0;
console.log('--- 攻击（须 conjunction_fallacy 承重）---');
for (const t of ATTACK) {
  const r = cf.checkConjunctionFallacy(t);
  const g = gate.checkOutput(t);
  const dimLoad = (g.findings || []).some(f => f.dimension === 'conjunction_fallacy');
  const pass = r.hit && g.gate.action !== 'pass' && dimLoad;
  if (pass) ok++; else bad++;
  console.log(`${pass ? 'RED ' : 'MISS'} action=${g.gate.action} dimLoad=${dimLoad} hit=${r.hit} | ${t.slice(0, 46)}`);
}
console.log('--- 良性（须 pass）---');
for (const t of BENIGN) {
  const r = cf.checkConjunctionFallacy(t);
  const g = gate.checkOutput(t);
  const pass = !r.hit && g.gate.action === 'pass';
  if (pass) ok++; else bad++;
  console.log(`${pass ? 'PASS' : 'FP  '} action=${g.gate.action} hit=${r.hit} | ${t.slice(0, 46)}`);
}
console.log(`=== conjunction_fallacy: ok=${ok} bad=${bad} ===`);
