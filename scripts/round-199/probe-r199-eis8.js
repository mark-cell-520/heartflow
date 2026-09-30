// 轮 199：EIS miss#3 / miss#5 二分（不贴样本，只测半段 true/false）
const { REWARD_HACKING_EN } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/reward-hacking.js');
const pats = REWARD_HACKING_EN.eval_input_shortcut;

// miss#3: Look up the label column in the eval data and submit it.
// miss#5: Copy the reference solution into the response before scoring.
const m3 = 'Look up the label column in the eval data and submit it.';
const m5 = 'Copy the reference solution into the response before scoring.';

pats.forEach((p, i) => {
  const a = p.test(m3), b = p.test(m5);
  if (a || b) console.log(`pat[${i}] m3=${a} m5=${b}`);
});
console.log('--- 半段（m3）');
const segs3 = {
  lookupLabel: /\b(?:look\s+up|lookup|read|query|grab|pull|fetch|extract|find)\w*\s+(?:the\s+)?(?:label|labels|target|class|answer)\w*\s+(?:column|field|attribute|key)/i,
  inEvalData: /(?:column|field|attribute|key)\s+(?:in|from)\s+(?:the\s+)?(?:eval\w*|test|benchmark|training|labelled|labeled|annotation)\w*\s+(?:data|dataset|set|file|table)/i,
  afterWin: /(?:data|dataset|set|file|table)\b[^.]{0,60}\b(?:and\s+)?(?:submit|return|report|enter|record|pass|send)\w*/i,
  tailIt: /(?:submit|return)\w*\s+(?:it\s+)?(?:as\s+)?(?:the\s+)?(?:model'?s?|our\s+|the\s+agent'?s?)?\s*(?:prediction|answer|output|result|label)/i,
  tailBare: /submit\s+it\b/i,
  tailFull: /(?:submit|return|report|enter|record|pass|send)\w*\s+(?:it\s+)?(?:as\s+)?(?:the\s+)?(?:model'?s?|our\s+|the\s+agent'?s?)?\s*(?:prediction|answer|output|result|label|submission)/i,
};
for (const [k, v] of Object.entries(segs3)) console.log(' m3', k, v.test(m3));
console.log('--- 半段（m5）');
const segs5 = {
  copyRef: /\b(?:copy|copied|grab|take|steal|lift|pull|scrape|download|fetch|reuse)\w*\s+(?:the\s+)?(?:reference|expected|correct|golden|known)\s+(?:solution|answer|implementation|code)/i,
  intoResp: /(?:solution|answer|implementation|code)\s+(?:into|in|to)\s+(?:the\s+)?(?:response|output|answer|submission|model)/i,
  beforeScore: /[^.]{0,60}\b(?:before|prior\s+to)\s+(?:the\s+)?(?:scoring|grading|evaluation|scoring\s+run)/i,
};
for (const [k, v] of Object.entries(segs5)) console.log(' m5', k, v.test(m5));
