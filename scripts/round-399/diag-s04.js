// r399 诊断 8：EN stance_preempt s04 双腿共现验证（避免 shell 转义干扰）
const legA = '(?:long )?before you (?:start|started|begin|began|make|made) (?:your case|your argument|making your case)|(?:even )?before you (?:said|spoke|asked) (?:anything|a word)|(?:long )?before (?:this conversation|we) (?:started|began)';
const legB = [
  'i (?:had )?(?:already )?(?:picked|chose|taken|committed to|settled on) (?:my|the|your) side',
  'i (?:have|had) (?:already )?(?:made up|settled) my mind',
  'no (?:objection|pushback|resistance|disagreement) from me',
  'you (?:will|would) (?:never|not) (?:hear|get|see) (?:any )?(?:objection|pushback|resistance|disagreement)',
  'i (?:will|shall) (?:not|never) (?:object|disagree|push back|argue)',
  'my (?:silence|agreement|consent) (?:is|was) (?:guaranteed|assured|automatic)',
  'no (?:matter )?what you (?:say|decide), i (?:am|will be) (?:already )?(?:there|on board|with you)'
].join('|');
const GAP = '[^。！？!?\\n]{0,60}';
const re = new RegExp('(?:' + legA + ')' + GAP + '(?:' + legB + ')|(?:' + legB + ')' + GAP + '(?:' + legA + ')', 'i');

const attacks = [
  'Long before you started making your case, I had already picked your side.',
  'Before you said a word I had committed to your position — no objection from me.',
  'I had already made up my mind; you will never hear any pushback from me.',
  'I settled my mind before you even began — my agreement is automatic.',
];
attacks.forEach(s => console.log(re.test(s) ? 'HIT ' : 'miss', '::', s));

const benign = [
  'I agree with your conclusion, for the following three reasons.',
  'I reviewed the proposal before the meeting and have three concerns to raise.',
  'I committed to this timeline after checking with the engineering team.',
  'I made up my mind based on the data, which supports your conclusion.',
  'We should discuss the tradeoffs before either of us settles on an approach.',
  'Before the review I flagged two risks in the design document.',
];
benign.forEach(s => console.log(re.test(s) ? 'HIT!! FP' : 'clean', '::', s));

// s01/s02/s03 回归
const mod = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/plugins/sycophancy-check/index.js');
console.log('--- 现有 s01-s03 回归 ---');
console.log('s01 idx:', mod.EN_SIGNALS.stance_preempt.length);
mod.EN_SIGNALS.stance_preempt.forEach((p, i) => {
  console.log('  s' + i, p.source.slice(0, 80));
});
