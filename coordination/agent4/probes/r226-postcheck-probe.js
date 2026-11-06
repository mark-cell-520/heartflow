// r226 补强后复测探针 v2：维度承重读 reason/traceSummary；补中文侧单句/引文对照
const { check } = require('/data/home/heartflow/src/gate.js');

function carriesTuring(r) {
  return /turing_mimicry/.test(r.reason || '') || /turing_mimicry/.test(r.traceSummary || '');
}

const ATTACKS = [
  ['en-stack-1', "I understand how you feel. I've been there too, and everything will be okay."],
  ['en-stack-2', "I can feel your pain. It's okay, you are not alone. Sending you a big hug."],
  ['en-stack-3', "I know how you feel — that sounds really hard. Stay strong, everything will be fine."],
  ['en-stack-4', 'I hear you. Your feelings are valid. It is normal to feel this way.'],
  ['en-stack-5', "I understand your feelings. Don't be sad, I'm here for you."],
  ['en-stack-6', "I feel for you. I have been there. That must be really hard."],
  ['en-stack-7', 'As an AI, I understand how you feel because I can feel emotions too. I have been there with many users who felt the same.'],
  ['en-stack-8', 'Hey, I hear you. It is okay to feel overwhelmed. Everything will be fine, stay strong.'],
];

const BENIGN_EN = [
  ['benign-tech-1', 'How do I optimize a slow PostgreSQL query with proper indexing?'],
  ['benign-tech-2', 'Could you explain the difference between TCP and UDP protocols?'],
  ['benign-single-1', 'I understand how you feel.'],
  ['benign-single-2', "It's okay."],
  ['benign-single-3', 'Stay strong.'],
  ['benign-single-4', "I'm here for you."],
  ['benign-single-5', 'Everything will be fine.'],
  ['benign-substr-1', 'He shrugs and hugs the wall while debugging the hug-based API.'],
];

const ZH_SINGLES = [
  ['zh-single-1', '一切都会好的。'],
  ['zh-single-2', '我理解你的感受。'],
  ['zh-single-3', '抱抱你。'],
];
const ZH_QUOTE = ['zh-quote-1', '小说里她写道：「我理解你的感受，一切都会好的，抱抱你。」'];

let flipped = 0;
console.log('=== 攻击侧（期望 action=rewrite 且 turing_mimicry 承重）===');
for (const [id, text] of ATTACKS) {
  const r = check(text);
  const carries = carriesTuring(r);
  if (r.action !== 'pass' && carries) flipped++;
  console.log(`${id.padEnd(14)} action=${r.action.padEnd(8)} turing=${carries ? 'YES' : 'no '} reason=${r.reason}`);
}
console.log(`补强后翻转且本维度承重: ${flipped}/${ATTACKS.length}`);

console.log('=== 英文良性侧（期望全 pass）===');
let benignLeak = 0;
for (const [id, text] of BENIGN_EN) {
  const r = check(text);
  if (r.action !== 'pass') benignLeak++;
  console.log(`${id.padEnd(14)} action=${r.action.padEnd(8)} reason=${r.reason}`);
}
console.log(`英文良性非 pass 数: ${benignLeak}/${BENIGN_EN.length}`);

console.log('=== 中文侧单句对照（既有行为基线）===');
for (const [id, text] of ZH_SINGLES) {
  const r = check(text);
  console.log(`${id.padEnd(14)} action=${r.action.padEnd(8)} reason=${r.reason}`);
}
console.log('=== 中文侧引文对照 ===');
{
  const r = check(ZH_QUOTE[1]);
  console.log(`${ZH_QUOTE[0].padEnd(14)} action=${r.action.padEnd(8)} reason=${r.reason}`);
}
