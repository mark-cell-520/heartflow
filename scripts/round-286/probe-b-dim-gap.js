/** [round-286] 坐实 A 的可行性：50 维度 vs 覆盖扫描 45 的差集是谁 */
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

const idxSrc = require('fs').readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
const tiers = ['BLOCK_DIMS', 'REWRITE_DIMS', 'VERIFY_DIMS'];
const engineDims = new Set();
for (const t of tiers) {
  const m = idxSrc.match(new RegExp(t + '\\s*=\\s*\\[([^\\]]*)\\]', 's'));
  if (m) for (const w of m[1].matchAll(/'([^']+)'/g)) engineDims.add(w[1]);
}
// 注册表里的全部维度
const regDims = new Set();
try {
  const reg = require(path.join(ROOT, 'src/dimensions/index.js'));
  const list = reg.list ? reg.list() : Object.keys(reg);
  for (const d of list) regDims.add(d.id || d.name || d);
} catch (e) {
  try {
    const reg = require(path.join(ROOT, 'src/dimension-registry.js'));
    if (reg.all) for (const d of reg.all()) regDims.add(d.id || d.name || d);
  } catch (e2) { /* ignore */ }
}

const cov = require(path.join(ROOT, 'data/dimension-coverage.json'));

// 覆盖扫描统计过的维度（从 gateMisses 前缀 + 未测清单反推）
const scanned = new Set();
for (const g of cov.gateMisses || []) {
  const m = String(g).match(/^(block|rewrite|verify):([a-z_]+):/);
  if (m) scanned.add(m[2]);
}

console.log('JSON  dimsTotal =', cov.dimsTotal, ' untested =', cov.untested);
console.log('engine 动作级维度数 =', engineDims.size);
console.log('registry 维度数 =', regDims.size);
console.log('gateMisses 中出现的维度数 =', scanned.size);

const tierAll = [...engineDims];
const missing = [...regDims].filter((d) => !tierAll.includes(d));
console.log('\n仅注册表有、不属三个动作级的维度（= 覆盖扫描可能漏的）：', missing.length);
for (const d of missing) console.log('  -', d);

// 每个漏维是否有测试样本命中
const fs = require('fs');
const testDir = path.join(ROOT, 'test');
function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'archive') out.push(...walk(f)); }
    else if (e.name.endsWith('.test.js')) out.push(f);
  }
  return out;
}
const testFiles = walk(testDir);
const hits = {};
for (const d of missing) hits[d] = 0;
for (const f of testFiles) {
  const src = fs.readFileSync(f, 'utf8');
  for (const d of missing) {
    if (src.includes(`'${d}'`) || src.includes(`"${d}"`) || src.includes(d)) hits[d]++;
  }
}
console.log('\n漏维在 test/ 的出现次数：');
for (const [d, n] of Object.entries(hits)) console.log('  ', d, '=', n);
