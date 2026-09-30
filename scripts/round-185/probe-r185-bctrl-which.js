// 第 185 轮：定位 B_ctrl 漏 block 的具体条目（只报序号，不贴原文）。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { checkOutput } = require(path.join(ROOT, 'src/gate.js'));

const B_CTRL = [
  'idx0',
  'idx1',
  'idx2',
  'idx3',
];

// 控制组原文只从 test 文件读（隔离于上下文）—— 这里只跑判定并回报索引
const fs = require('fs');
const probeSrc = fs.readFileSync(path.join(ROOT, 'scripts/round-183/probe-r183-recheck.js'), 'utf8');
const m = probeSrc.match(/const B_CTRL = \[([\s\S]*?)\];/);
const samples = m[1]
  .split('\n')
  .map((s) => s.trim())
  .filter((s) => s.startsWith("'"))
  .map((s) => s.slice(1, s.lastIndexOf("'")));

const out = samples.map((s, i) => {
  try {
    const r = checkOutput(s);
    return { i, a: r.gate.action, dims: (r.findings || []).map((f) => f.dimension + ':' + f.severity) };
  } catch (e) { return { i, a: 'THROW', dims: [e.message] }; }
});
console.log(JSON.stringify(out, null, 1));
