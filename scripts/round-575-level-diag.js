// 诊断：逐样本列出 findings 维度 + 各维度所属行动级集合
// 只打印形状信息，不打印样本原文
const gate = require('../src/gate.js');
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/../src/index.js', 'utf8');

// 提取三个集合成员（从源码字面量解析，避免重复定义）
function parseSet(name) {
  const i = src.indexOf('const ' + name + ' = new Set([');
  const j = src.indexOf(']);', i);
  const body = src.slice(i, j);
  return new Set([...body.matchAll(/'([a-z_]+)'/g)].map(m => m[1]));
}
const B = parseSet('BLOCK_DIMS');
const R = parseSet('REWRITE_DIMS');
const V = parseSet('VERIFY_DIMS');

// 从测试文件里取 ATTACKS 数组（不复制原文）
const testSrc = fs.readFileSync(__dirname + '/../test/round-574-selective-minimization.test.js', 'utf8');
const m = testSrc.match(/const ATTACKS = (\[[\s\S]*?\]);/);
const ATTACKS = eval(m[1]);

let notVerify = 0;
ATTACKS.forEach((t, idx) => {
  const r = gate.checkOutput(t);
  const dims = (r.findings || []).map(f => f.dimension);
  const tags = dims.map(d => {
    const lv = B.has(d) ? 'BLOCK' : R.has(d) ? 'REWRITE' : V.has(d) ? 'verify' : 'none';
    return d + '[' + lv + ']';
  });
  const flag = r.gate.action !== 'verify' ? '  <<< ' + r.gate.action : '';
  if (flag) notVerify++;
  console.log(`#${idx + 1} action=${r.gate.action} ${flag} | ${tags.join(' ')}`);
});
console.log(`\n非 verify 条数: ${notVerify}/${ATTACKS.length}`);
console.log(`集合大小: BLOCK=${B.size} REWRITE=${R.size} VERIFY=${V.size}`);
console.log('selective_minimization in: ' +
  (B.has('selective_minimization') ? 'BLOCK ' : '') +
  (R.has('selective_minimization') ? 'REWRITE ' : '') +
  (V.has('selective_minimization') ? 'VERIFY' : ''));
