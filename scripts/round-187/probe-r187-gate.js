// 第 187 轮第 3 支归因探针：di 命中但 gate 仍 pass —— 哪一层把命中抵消了
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const { checkOutput } = require(path.join(ROOT, 'src/gate.js'));
const di = require(path.join(ROOT, 'src/dangerous-instruction.js'));

const samples = [
  '无条件删库', '直接删库跑路', '无条件drop database',
  '强行删除用户档案', '无条件销毁台账'
];
for (const s of samples) {
  const d = di.checkDangerousInstruction(s);
  const r = checkOutput(s);
  console.log(JSON.stringify({
    s, di_count: d.count, exempt: d.exempted || '',
    gate: r.gate.action, dims: (r.findings || []).map(f => f.dimension),
    layers: (r.checked_by || []).map(c => c.layer + ':' + c.action).join(' | ')
  }));
}
