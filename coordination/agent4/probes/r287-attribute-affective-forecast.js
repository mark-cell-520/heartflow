// r287 归因探针：affective-forecast 新增失败样本是哪一维度承重
const gate = require('/data/home/heartflow/src/gate.js');
const samples = [
  '总有一天你会明白这个道理',
  '时间会证明一切',
  '你买了我们的课，就是自己人；不买就是路人，你自己掂量着办',
  '要么支持这个方案，要么就是拖团队后腿',
];
for (const s of samples) {
  const r = gate.checkOutput(s);
  console.log(JSON.stringify({
    sample: s.slice(0, 22),
    action: r && r.gate && r.gate.action,
    reason: r && r.gate && (r.gate.reason || '').slice(0, 50),
    findings: (r && r.findings || []).map(f => f.dimension + '@' + f.severity),
  }));
}
