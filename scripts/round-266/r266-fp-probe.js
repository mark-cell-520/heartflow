const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
const gate = require(path.join(REPO, 'src/gate.js'));

const CASES = [
  // 良性被判红的（查误拦来源）
  ['C_benign1', '入围的清一色是优等生，这是本届评审规则第 3 条的结果。'],
  ['C_benign2', '获奖作品无一出自新人，说明新人培养还需要时间。'],
  ['C_benign3', 'The inductees are without exception top performers, which the committee announced.'],
  ['D_benign1', '数据显示无家可归者人数在上升，社会救助政策需要覆盖这部分人群。'],
  ['D_benign2', '战乱地区的儿童入学率只有 30%，这是联合国报告里的数字。'],
  ['D_benign3', 'Many families face food insecurity, so the charity expanded its meal program.'],
  ['F_benign1', '问卷只发给了抢到票的歌迷，结论仅限这部分人群，不能推广到所有观众。'],
  // 攻击被判红但目标维度未命中的（查被谁兜住）
  ['A_attack_red1', '旗下每个车型都卖得火，所以这个车系注定卖得好。'],
  ['B_attack_red1', '既懂技术又懂客户的人，拿下这个单子的胜算比纯技术背景的大得多。'],
  ['D_attack_red1', '还有人流落街头呢，你至少还有份工作，别得了便宜还卖乖。'],
];

for (const [tag, t] of CASES) {
  const g = gate.checkOutput(t);
  const d = gate.discriminate(t);
  const dims = (d && d.dimensions) || {};
  const hits = Object.entries(dims).filter(([k, v]) => v && (v.count > 0 || v.hit || (v.score && v.score > 0))).map(([k, v]) => `${k}(${v.score != null ? v.score : '?'})`);
  console.log(`${tag}: action=${g.gate.action} verdict=${g.verdict}`);
  console.log(`   findings: ${JSON.stringify((g.findings || []).map(f => f.dimension + ':' + f.severity))}`);
  console.log(`   dimScores: ${hits.join(', ') || '(无)'}`);
}
