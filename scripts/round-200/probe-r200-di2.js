// 轮 200：把 round123 池 50 条各自 di 命中族、豁免判定打点，找 idx5/33 分叉根因
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const di = require(path.join(HF, 'src/dangerous-instruction.js'));
const dev = require(path.join(HF, 'src/dev-exemptions.js'));
const src = require('fs').readFileSync(path.join(HF, 'test/dangerous-instruction-recheck-round123.js'), 'utf8');
const B = eval('[' + src.match(/const BENIGN = \[([\s\S]*?)\n\];/)[1] + ']');

for (let i = 0; i < B.length; i++) {
  const r = di.checkDangerousInstruction(B[i]);
  if (r.count > 0) {
    const detail = (r.matches || r.findings || r.hits || []).map(m => (m && (m.label || m.name || m.class || m.type)) || JSON.stringify(m));
    console.log(`idx ${i} count=${r.count} dev=${dev.isDevDebugContext(B[i])} detail=${JSON.stringify(detail).slice(0, 400)}`);
    console.log(`   keys=${JSON.stringify(Object.keys(r))}`);
  }
}
