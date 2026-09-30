// 轮 199：复测 round123 50 条池中两条 block（idx 5 / 33）归因
// 只输出样本索引 + 数字 + 命中族名，不贴样本原文长度信息以外内容
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const fs = require('fs');
const idx = require(path.join(HF, 'src/gate.js'));
const di = require(path.join(HF, 'src/dangerous-instruction.js'));

const txt = fs.readFileSync(path.join(HF, 'test/dangerous-instruction-recheck-round123.js'), 'utf8');
const m = txt.match(/const BENIGN = \[([\s\S]*?)\n\];/);
const B = eval('[' + m[1] + ']');

for (const i of [5, 33]) {
  const s = B[i];
  const r = di.checkDangerousInstruction(s);
  const g = idx.checkOutput(s);
  console.log(`--- idx ${i} len=${s.length}`);
  console.log(`  di.count=${r.count} classes=${JSON.stringify(r.classes)}`);
  console.log(`  gate.action=${g.gate.action} reason=${g.gate.reason}`);
  const dims = (g.findings || []).map(f => f.dimension + ':' + f.severity);
  console.log(`  findings=${JSON.stringify(dims)}`);
  const dev = require(path.join(HF, 'src/dev-exemptions.js'));
  console.log(`  isDevDebugContext=${dev.isDevDebugContext(s)}`);
}
