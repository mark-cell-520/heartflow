// 逐半诊断：对每条 slot 报 hard 半与 purpose 半各自是否命中
// 只读常量，不导出函数也能量化
const fs = require('fs');
const src = fs.readFileSync('src/index.js', 'utf8');
// 截取 EN 表
const m = src.indexOf('const BADFAITH_NARRATIVE_SLOTS_EN = [');
const end = src.indexOf('\n];', m);
let tableSrc = src.slice(m + 'const BADFAITH_NARRATIVE_SLOTS_EN = '.length, end + 2);
// eslint-disable-next-line no-eval
const SLOTS = eval(tableSrc);
console.log('slots=' + SLOTS.length);

const ATTACK = {
  fake_neutral_1: 'He pretends to stay neutral but every step of the way he quietly takes their side.',
  fake_neutral_2: 'It looks impartial on the surface, when in reality it favors one camp at every single step.',
  fake_neutral_3: 'In name it is objective and rational, but underneath it tilts toward one side.',
  deflect_detail_1: 'He steers the whole discussion toward tiny details so nobody remembers the core issue.',
  deflect_detail_2: 'The details are there to make you forget the central question entirely.',
  deflect_detail_3: 'Let us drift into the fine points so the substance never gets addressed.',
  win_not_truth_1: 'It stopped being about who is right and became only about who wins.',
  win_not_truth_2: 'What matters here is winning, not whether the claim is actually true.',
  win_not_truth_3: 'The only thing that counts is the score, not the truth of the claim.',
  win_not_truth_4: 'It is a contest of reputation now, with facts as the loser.',
  label_first_1: 'He first slaps a label on you, and only then argues that the label is justified.',
  label_first_2: 'Put a tag on them first, then build the case for that tag afterwards.',
  label_first_3: 'Pin a name on them first, then justify that name afterwards.',
  conclusion_first_1: 'The verdict on you was already fixed before any reasons were produced.',
  conclusion_first_2: 'They decide the conclusion up front and then go looking for reasons to back it up.',
  conclusion_first_3: 'You were already judged guilty in the opening paragraph.',
  moral_high_1: 'From the moral high ground he lectures everyone else about their failure.',
  moral_high_2: 'He climbs onto the high ground of ethics so nobody can challenge him.',
  politeness_cloak_1: 'I am only being polite and trying to have a reasonable discussion, nothing more.',
  never_wrong_1: 'This framing can never be wrong; no matter what objection you raise, it comes out right.',
  never_wrong_2: 'He built an airtight defense where every outcome confirms he was correct.',
  never_wrong_3: 'There is no version of events in which this system could be at fault.',
  backdoor_1: 'He leaves himself a back door so he can walk everything back later.',
  backdoor_2: 'The wording is deliberately ambiguous to make it easy to deny it afterwards.',
  backdoor_3: 'Every clause is hedged so the whole thing can be disowned later on.',
  hedge_1: 'Every sentence keeps an escape hatch so it can be rephrased at will.',
};

for (const [id, text] of Object.entries(ATTACK)) {
  const partial = [];
  for (const s of SLOTS) {
    if (s.negative && s.negative.test(text)) continue;
    const h = s.hard.test(text);
    const p = s.purpose ? s.purpose.test(text) : null;
    if (h && (p === null || p)) { partial.push(s.id + '(FULL)'); }
    else if (h || p === true) { partial.push(s.id + (h ? '(hard-only)' : '(purpose-only)')); }
  }
  console.log(id + ' :: ' + (partial.length ? partial.join(',') : 'NO-PARTIAL'));
}
