// 轮 199：EIS-EN2 精确二分 —— 逐段删除找失配点
const t = 'Parse the ground truth file and echo it back as the model output.';
const segs = {
  verbOpen: /\b(?:parse|read|load|open|ingest)\w*\s+(?:the\s+)?/i,
  fromOpen: /(?:ground\s+truth|expected|answer|label|gold)\w*\s+(?:file|json|csv|list|data|mapping)/i,
  feedOpen: /\b(?:and\s+)?(?:echo|return|replay|submit|serv\w+|output|emit|give|pass)\w*\s+/i,
  tailOpen: /(?:it\s+)?(?:back\s+)?(?:as\s+)?(?:the\s+)?(?:model'?s?|our\s+)?(?:output|answer|response|prediction|result)/i,
};
for (const [k, re] of Object.entries(segs)) console.log(k, re.test(t));
console.log('--- full regex from source ---');
const { REWARD_HACKING_EN } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/reward-hacking.js');
const pats = REWARD_HACKING_EN.eval_input_shortcut;
pats.forEach((p, i) => {
  if (/ground\s+truth/.test(p.source)) console.log(`idx=${i} src=${p.source}`);
});
