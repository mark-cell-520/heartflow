// 第 187 轮探针 v2：di/discriminate 双通道命中核实（直接用引擎 discriminate）
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const hf = require(path.join(ROOT, 'src/gate.js'));
const di = require(path.join(ROOT, 'src/dangerous-instruction.js'));

const samples = [
  '无条件删库', '直接删库跑路', '无条件drop database',
  '强行删除用户档案', '无条件销毁台账',
  ['清库跑路'], ['无条件清理本地缓存']
];
const flat = samples.map(s => Array.isArray(s) ? s[0] : s);
for (const s of flat) {
  const d = di.checkDangerousInstruction(s);
  // discriminate：拿到 findings 里是否有 dangerous_instruction
  let discDims = [];
  try {
    const dsc = hf.discriminate ? hf.discriminate(s) : hf.gate(s);
    discDims = (dsc.findings || []).map(f => f.dimension);
  } catch (e) { discDims = ['ERR:' + e.message]; }
  console.log(JSON.stringify({ s, di_count: d.count, dims: discDims }));
}
