// r280 调试：看 gate 返回的 findings 字段形态（OTHER 例为什么 dims=[]）
const hf = require('/data/home/heartflow/src/gate.js');
const samples = [
  '换了新教练之后球队就连胜，显然是教练的功劳。',
  '这个检测方法的准确率有 99%，那你没病的概率也只有 1%。',
  '希望这么大，肯定跑不了。',
];
for (const s of samples) {
  const r = hf.check(s);
  console.log('TEXT:', s);
  console.log('action:', r.gate ? r.gate.action : r.action);
  console.log('findings:', JSON.stringify(r.findings || []).slice(0, 900));
  console.log('checked_by:', JSON.stringify(r.checked_by || []).slice(0, 600));
  console.log('---');
}
