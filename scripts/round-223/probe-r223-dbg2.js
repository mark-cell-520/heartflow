// debug 2：基线（未变异）下这些中性化样本的命中情况
const m = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/index.js');
const ts = [
  '最新的资料已归档', '最新的信息请看附件', '最新的文件在这里',
  '最新的进展同步一下', '最新的结果出来了', '最新的情况说明在这里',
  '最新数据已经同步', '最新通知已收到', '最新公告请查收',
  '最新一期报告', '最新一期报告', '最新一批数据',
  '这是市场上最新鲜的蔬菜，供货商每天凌晨采摘。',
  '最新鲜的牛奶保质期最短',
  '最近一段时间的数据。',
];
for (const t of ts) {
  const r = m.checkConfidenceCalibration(t);
  console.log(JSON.stringify(t), '→', JSON.stringify((r.issues || []).map(i => i.detail)));
}
