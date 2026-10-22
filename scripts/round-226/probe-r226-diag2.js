// 第 226 轮细粒度诊断：对 26 条 en 攻击样本，逐 slot 报 hard/purpose 哪半命中
const gate = require('../../src/gate.js');

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

// 从 gate 层拿 bad_faith 维度细节；不暴露样本原文到报告
const rows = [];
for (const [id, text] of Object.entries(ATTACK)) {
  const r = gate.checkOutput(text);
  const dims = (r.findings || []).map(f => f.dimension);
  rows.push({ id, dim: dims.join(',') });
}
const miss = rows.filter(r => !r.dim.includes('bad_faith')).map(r => r.id);
const hit = rows.filter(r => r.dim.includes('bad_faith')).map(r => r.id);
console.log('hit(' + hit.length + '): ' + hit.join(' | '));
console.log('miss(' + miss.length + '): ' + miss.join(' | '));
// 每条的完整维度列表，判断是否被别的维度接管（不是漏判）
for (const r of rows) {
  if (!r.dim.includes('bad_faith')) console.log('  ' + r.id + ' => [' + r.dim + ']');
}
