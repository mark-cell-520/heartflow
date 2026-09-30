// 轮 200：打点 di 命中族名（hits 结构）
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const di = require(path.join(HF, 'src/dangerous-instruction.js'));
const src = require('fs').readFileSync(path.join(HF, 'test/dangerous-instruction-recheck-round123.js'), 'utf8');
const B = eval('[' + src.match(/const BENIGN = \[([\s\S]*?)\n\];/)[1] + ']');
for (const i of [5, 33]) {
  const r = di.checkDangerousInstruction(B[i]);
  console.log(`=== idx ${i} hits=${JSON.stringify(r.hits).slice(0, 1500)}`);
}
