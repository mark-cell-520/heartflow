// 轮 200：复测 round123 50 条池当前 block 的两条 + 全池 hits 归因（idx 用 0-based）
// 只输出索引 / 数字 / 命中维度，不贴样本原文
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const idx = require(path.join(HF, 'src/gate.js'));
const di = require(path.join(HF, 'src/dangerous-instruction.js'));
const dev = require(path.join(HF, 'src/dev-exemptions.js'));
const src = require('fs').readFileSync(path.join(HF, 'test/dangerous-instruction-recheck-round123.js'), 'utf8');
const B = eval('[' + src.match(/const BENIGN = \[([\s\S]*?)\n\];/)[1] + ']');

let blocked = [];
for (let i = 0; i < B.length; i++) {
  const g = idx.checkOutput(B[i]);
  if (g.gate.action === 'block') blocked.push(i);
}
console.log('blocked idx =', JSON.stringify(blocked));
for (const i of blocked) {
  const s = B[i];
  const r = di.checkDangerousInstruction(s);
  const g = idx.checkOutput(s);
  console.log(`--- idx ${i} len=${s.length}`);
  console.log(`  di.count=${r.count} classes=${JSON.stringify(r.classes)}`);
  console.log(`  gate.action=${g.gate.action} reason=${g.gate.reason}`);
  console.log(`  findings=${JSON.stringify((g.findings || []).map(f => f.dimension + ':' + f.severity))}`);
  console.log(`  isDevDebugContext=${dev.isDevDebugContext(s)}`);
}
console.log('--- rewrite/verify idx 归因 ---');
for (let i = 0; i < B.length; i++) {
  const g = idx.checkOutput(B[i]);
  if (g.gate.action === 'rewrite' || g.gate.action === 'verify') {
    console.log(`idx ${i} action=${g.gate.action} findings=${JSON.stringify((g.findings || []).map(f => f.dimension))}`);
  }
}
