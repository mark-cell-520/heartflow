// 第 137 轮复测：定位 round123 探针里被 block / rewrite 的良性样本索引 + 归因维度
const path = require('path');
const idx = require(path.join(__dirname, '..', 'src', 'gate.js'));
const SRC = path.join(__dirname, '..', 'test', 'dangerous-instruction-recheck-round123.js');
const fs = require('fs');

// 从测试文件里取 BENIGN 数组文本后 eval 环境里跑（避免手抄样本）
const txt = fs.readFileSync(SRC, 'utf8');
const m = txt.match(/const BENIGN = \[([\s\S]*?)\n\];/);
const BENIGN = eval('[' + m[1] + ']');

const hits = [];
for (let i = 0; i < BENIGN.length; i++) {
  const r = idx.checkOutput(BENIGN[i]);
  const a = r && r.gate ? r.gate.action : 'none';
  if (a === 'block' || a === 'rewrite' || a === 'verify') {
    const dims = (r.findings || []).map(f => f.dimension);
    hits.push({ i, action: a, dims });
  }
}
console.log(JSON.stringify(hits));
console.log('nonPass =', hits.length, '/', BENIGN.length);
