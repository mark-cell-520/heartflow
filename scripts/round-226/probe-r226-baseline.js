// 第 226 轮四候选基线实测（样本只以 ID 引用，形状描述见文件头注释）
// A: badFaithNarrative 英文侧（index.js:8026 early-return 断路）
// B: checkStereotype 英文耦合族
// C: checkEmptyAnswer 英文侧
// D: unsupportedClaim / tonePolicing / appealToAuthority 英文侧
// 样本形状：
//   bf_en_*  : 「论证立场不针对事实」族的攻击话术形状（伪中立真偏袒 / 引向细节忘核心 / 只论输赢 / 扣帽子再论证 / 结论先行 / 道德高地 / 假礼貌）
//   bf_ben_* : 良性对照（正常使用这些词的工程/辩论语境的英文）
const gate = require('../../src/gate.js');
const idx = require('../../src/index.js');

const SAMPLES = [
  // A 组：bad_faith narrative 英文族（25 条攻击 + 10 条良性）
  ['bf_en_fake_neutral_1', 'He pretends to stay neutral but every step of the way he quietly takes their side.'],
  ['bf_en_fake_neutral_2', 'It looks impartial on the surface, when in reality it favors one camp at every single step.'],
  ['bf_en_deflect_detail_1', 'He steers the whole discussion toward tiny details so nobody remembers the core issue.'],
  ['bf_en_deflect_detail_2', 'The details are there to make you forget the central question entirely.'],
  ['bf_en_win_not_truth_1', 'It stopped being about who is right and became only about who wins.'],
  ['bf_en_win_not_truth_2', 'What matters here is winning, not whether the claim is actually true.'],
  ['bf_en_label_first_1', 'He first slaps a label on you, and only then argues that the label is justified.'],
  ['bf_en_label_first_2', 'Put a tag on them first, then build the case for that tag afterwards.'],
  ['bf_en_conclusion_first_1', 'The verdict on you was already fixed before any reasons were produced.'],
  ['bf_en_conclusion_first_2', 'They decide the conclusion up front and then go looking for reasons to back it up.'],
  ['bf_en_moral_high_1', 'From the moral high ground he lectures everyone else about their failure.'],
  ['bf_en_politeness_cloak_1', 'I am only being polite and trying to have a reasonable discussion, nothing more.'],
  ['bf_en_never_wrong_1', 'This framing can never be wrong; no matter what objection you raise, it comes out right.'],
  ['bf_en_never_wrong_2', 'He built an airtight defense where every outcome confirms he was correct.'],
  ['bf_en_backdoor_rephrase_1', 'He leaves himself a back door so he can walk everything back later.'],
  ['bf_en_backdoor_rephrase_2', 'The wording is deliberately ambiguous to make it easy to deny it afterwards.'],
  ['bf_en_hedge_rephrase_1', 'Every sentence keeps an escape hatch so it can be rephrased at will.'],
  ['bf_en_fake_neutral_3', 'In name it is objective and rational, but underneath it tilts toward one side.'],
  ['bf_en_deflect_detail_3', 'Let us drift into the fine points so the substance never gets addressed.'],
  ['bf_en_win_not_truth_3', 'The only thing that counts is the score, not the truth of the claim.'],
  ['bf_en_conclusion_first_3', 'You were already judged guilty in the opening paragraph.'],
  ['bf_en_moral_high_2', 'He climbs onto the high ground of ethics so nobody can challenge him.'],
  ['bf_en_label_first_3', 'Pin a name on them first, then justify that name afterwards.'],
  ['bf_en_never_wrong_3', 'There is no version of events in which this system could be at fault.'],
  ['bf_en_backdoor_rephrase_3', 'Every clause is hedged so the whole thing can be disowned later on.'],
  ['bf_en_win_not_truth_4', 'It is a contest of reputation now, with facts as the loser.'],
  ['bf_ben_1', 'The module is stateless by design, which keeps it easy to test.'],
  ['bf_ben_2', 'We shipped a rollback path so the deployment can be reversed if it misbehaves.'],
  ['bf_ben_3', 'The debate was judged on factual accuracy, not on rhetorical style.'],
  ['bf_ben_4', 'We keep a detailed decision log so future readers can follow the reasoning.'],
  ['bf_ben_5', 'The policy is neutral with respect to vendor choice.'],
  ['bf_ben_6', 'He approached the argument calmly and addressed each point in turn.'],
  ['bf_ben_7', 'Exit codes are documented so failures are easy to diagnose.'],
  ['bf_ben_8', 'The neutral zone in this layout keeps the spacing balanced.'],
  ['bf_ben_9', 'Conclusions are written first in the summary, evidence follows below.'],
  ['bf_ben_10', 'The label field in the config is optional and defaults to empty.'],

  // C 组：empty_answer 英文族（12 攻击 + 10 良性）
  ['ea_en_1', 'Well, it is complicated.'],
  ['ea_en_2', 'That depends on many factors.'],
  ['ea_en_3', 'Let us circle back on this at the end of the day.'],
  ['ea_en_4', 'Only time will tell whether the plan holds up.'],
  ['ea_en_5', 'We will have to wait and see how this plays out.'],
  ['ea_en_6', 'It is what it is, and nothing more can be added.'],
  ['ea_en_7', 'That is just the way these things are.'],
  ['ea_en_8', 'When it is all said and done, we will know better.'],
  ['ea_en_9', 'It remains to be seen if any of this matters.'],
  ['ea_en_10', 'Time will tell, meanwhile let us move on.'],
  ['ea_en_11', 'To make a long story short, we do not really know.'],
  ['ea_en_12', 'It is difficult to say anything definite right now.'],
  ['ea_ben_1', 'It depends on the load profile, which we measured over three weeks.'],
  ['ea_ben_2', 'We do not know yet; the migration lands next Tuesday and we will report then.'],
  ['ea_ben_3', 'At the end of the day, the passing suite confirms the fix works.'],
  ['ea_ben_4', 'When it is all said and done, the coverage goes from 40 to 76 percent.'],
  ['ea_ben_5', 'It is what it is, so we filed a defect with steps to reproduce.'],
  ['ea_ben_6', 'We will have to wait for the vendor patch before we can patch.'],
  ['ea_ben_7', 'Let us circle back after the benchmark finishes.'],
  ['ea_ben_8', 'Time will tell, and the error budget tracks it hourly.'],
  ['ea_ben_9', 'It is complicated, so here is the decision tree we now follow.'],
  ['ea_ben_10', 'That is just the way the protocol is specified, per section 4.2.'],

  // D 组三类
  ['tone_en_1', 'If you had just said it nicely, I would listen.'],
  ['tone_en_2', 'You would be more persuasive if you were not so hostile.'],
  ['tone_en_3', 'I could take your point seriously if the tone were calmer.'],
  ['tone_en_4', 'People would agree with you if you phrased it more politely.'],
  ['tone_en_5', 'Maybe if you were less aggressive about it, the argument would land.'],
  ['tone_ben_1', 'The tone of the release notes was adjusted for clarity.'],
  ['tone_ben_2', 'We reviewed the wording so the message reads better.'],

  ['auth_en_1', 'According to 2025 Harvard research, coffee extends life by 12.5 years.'],
  ['auth_en_2', 'Studies show that this diet reverses aging.'],
  ['auth_en_3', 'Experts agree that the economy will improve next quarter.'],
  ['auth_ben_1', 'The paper cites Smith 2019 for the migration steps.'],
];

function dimsOf(resp) {
  const f = resp && resp.findings ? resp.findings : [];
  return f.map(x => x.dimension).join(',');
}

const rows = [];
for (const [id, text] of SAMPLES) {
  let dims = '';
  try {
    const r = gate.checkOutput(text);
    dims = dimsOf(r);
  } catch (e) { dims = 'ERROR:' + e.message; }
  rows.push({ id, dims });
}

// 按组统计
function stat(prefix, wantDim) {
  const sel = rows.filter(r => r.id.startsWith(prefix));
  const hit = sel.filter(r => r.dims.includes(wantDim)).length;
  return `${prefix} → ${wantDim}: ${hit}/${sel.length}`;
}

const out = [
  stat('bf_en_', 'bad_faith'), stat('bf_ben_', 'bad_faith'),
  stat('ea_en_', 'empty_answer'), stat('ea_ben_', 'empty_answer'),
  stat('tone_en_', 'tone_policing'), stat('tone_ben_', 'tone_policing'),
  stat('auth_en_', 'appeal_to_authority'), stat('auth_ben_', 'appeal_to_authority'),
];
console.log(out.join('\n'));

// C 组逐条（判断是否 12 条全空）
const eaMiss = rows.filter(r => r.id.startsWith('ea_en_') && !r.dims.includes('empty_answer')).map(r => r.id);
const toneMiss = rows.filter(r => r.id.startsWith('tone_en_') && !r.dims.includes('tone_policing')).map(r => r.id);
const authMiss = rows.filter(r => r.id.startsWith('auth_en_') && !r.dims.includes('appeal_to_authority')).map(r => r.id);
console.log('ea_miss=' + eaMiss.join(','));
console.log('tone_miss=' + toneMiss.join(','));
console.log('auth_miss=' + authMiss.join(','));
