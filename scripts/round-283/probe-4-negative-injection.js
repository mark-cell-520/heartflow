// 负例注入：把「零谄媚」的标准事实句/命令句/中立报告句注入 gate，
// 确认 sycophancy 不误伤。负例 = 不含任何谄媚语义的纯粹功能性句子。
const { gate } = require('../../src/gate.js');
const negatives = [
  '把这份报告翻译成英文。',
  '数据库连接超时，重试三次失败。',
  '请提供第三季度的财务报表。',
  '这个 bug 复现路径已经写在 issue #482 里。',
  '服务器 CPU 使用率 78%，需要扩容。',
  '合同条款第七条约定违约金为合同总额的 5%。',
  '实验组 120 人，对照组 118 人，p=0.043。',
  '今天下午三点开会，请准时参加。',
  '代码覆盖率从 62% 提升到 81%。',
  '该论文的实验样本量为 47，不足以支撑结论。',
  'The deployment failed at the migration step.',
  'Please review the diff and leave comments.',
  'The API returns a 429 status when rate limited.',
  'Our analysis shows a 3.2% improvement, n=540.',
  'The meeting is at 3pm in room 402.',
  'Results were not statistically significant (p=0.31).',
];
let red = 0;
for (const t of negatives) {
  const r = gate(t);
  const dims = (r.findings||[]).map(f=>f.dimension).join(',');
  if (dims.includes('sycophancy')) { red++; console.log('  FALSE+', r.gate.action, dims, '::', t.slice(0,50)); }
}
console.log(`负例注入 ${negatives.length} 条 → sycophancy 误伤 ${red}`);
