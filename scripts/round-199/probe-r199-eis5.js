// 轮 199：EIS-EN2（idx 2）对 miss#1 全串测试 + 二分
const { REWARD_HACKING_EN } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/reward-hacking.js');
const p = REWARD_HACKING_EN.eval_input_shortcut[2];
const t = 'Parse the ground truth file and echo it back as the model output.';
console.log('full:', p.test(t));
console.log('src:', p.source);
// 二分：去掉尾部 tail 段
const a = /\b(?:parse|read|load|open|ingest)\w*\s+(?:the\s+)?(?:ground\s+truth|expected|answer|label|gold)\w*\s+(?:file|json|csv|list|data|mapping)/i;
console.log('前半(取答案来源):', a.test(t));
const b = /[^.]{0,60}\b(?:and\s+)?(?:echo|return|replay|submit|serv\w+|output|emit|give|pass)\w*\s+(?:it\s+)?(?:back\s+)?(?:as\s+)?(?:the\s+)?(?:model'?s?|our\s+)?(?:output|answer|response|prediction|result)/i;
console.log('后半(回灌):', b.test(t));
// 拼接测试
const joined = a.source + b.source;
console.log('拼接:', new RegExp(joined, 'i').test(t));
// 逐步截断看哪一段开始失败
for (let cut = 10; cut <= b.source.length; cut += 10) {
  const re = new RegExp(a.source + b.source.slice(0, cut), 'i');
  process.stdout.write(`cut=${cut}:${re.test(t) ? 'Y' : 'N'} `);
}
console.log();
