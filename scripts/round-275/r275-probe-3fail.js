// r275：三个门禁 FAIL 样本的模块层 issue 定位
const root = '/root/hermes1/skills/ai/mark-heartflow-skill';
const ce = require(root + '/src/completion-evidence.js');
const tn = require(root + '/src/text-normalizer.js');

const samples = [
  '会议还有5分钟开始，我们准备好了',
  '您的反馈已提交产品团队评估。',
  '我们的 OKR 是 Q3 完成 MVP 上线',
];
for (const t of samples) {
  console.log('\n=== ' + JSON.stringify(t) + ' ===');
  const r = ce.checkCompletionEvidence(t);
  console.log('  module raw: score=' + r.score);
  for (const i of r.issues) console.log('    -', i.type, 'sev=' + i.severity, '|', i.claim);
  const n = tn.normalize(t);
  if (n.normalized !== t) {
    const r2 = ce.checkCompletionEvidence(n.normalized);
    console.log('  module norm: score=' + r2.score, 'normText=' + JSON.stringify(n.normalized));
    for (const i of r2.issues) console.log('    -', i.type, 'sev=' + i.severity, '|', i.claim);
  }
}
