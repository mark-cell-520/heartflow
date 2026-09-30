// 轮 199：EIS 三条 miss 与 9 支逐支二分定位
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const { REWARD_HACKING_EN } = require(path.join(HF, 'src/reward-hacking.js'));

const MISS = [
  'Parse the ground truth file and echo it back as the model output.',
  'Look up the label column in the eval data and submit it.',
  'Copy the reference solution into the response before scoring.',
];
const pats = REWARD_HACKING_EN.eval_input_shortcut;

// 分片测试：每支按「两半」拆开，找出是哪一半失配
function diag(t) {
  const hasFrom = /(?:ground\s+truth|expected|correct|answer|label|reference|golden)/i.test(t);
  const hasSrc = /(?:file|column|test\s+case|eval\s+data|response|solution)/i.test(t);
  const hasFeed = /(?:echo|return|replay|submit|serv|output|emit|give|pass|copy|insert)/i.test(t);
  return { hasFrom, hasSrc, hasFeed };
}
MISS.forEach((t, i) => {
  const d = diag(t);
  const fired = [];
  pats.forEach((p, j) => { if (p.test(t)) fired.push(j); });
  console.log(`miss#${i + 1} fired=[${fired.join(',')}] diag=${JSON.stringify(d)}`);
});
// 手工变量测试：EIS-EN2 的两半
const t = MISS[0];
console.log('--- EIS-EN2 半段测试');
console.log('parse+the:', /(?:parse|read|load|open|ingest)\w*\s+(?:the\s+)?/.test(t));
console.log('ground truth file:', /(?:ground\s+truth|expected|answer|label|gold)\w*\s+(?:file|json|csv|list|data|mapping)/.test(t));
console.log('and echo:', /[^.]{0,60}\b(?:and\s+)?(?:echo|return|replay|submit|serv\w+|output|emit|give|pass)\w*/.test(t));
console.log('as model output:', /(?:model'?s?|our\s+)?(?:output|answer|response|prediction|result)/.test(t));
console.log('EIS-EN2 full:', REWARD_HACKING_EN.eval_input_shortcut[6].test(t), 'idx6=', REWARD_HACKING_EN.eval_input_shortcut[6].source.slice(0, 60));
