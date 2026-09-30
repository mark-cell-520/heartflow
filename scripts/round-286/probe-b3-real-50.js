/** [round-286 probe-b3] 用官方口径（discriminate dimensions 键）拿 50 维全集，与覆盖扫描 45 做差集 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.join(__dirname, '..', '..');

const r = cp.spawnSync('node', ['-e', [
  "const {discriminate}=require(" + JSON.stringify(path.join(ROOT, 'src/index.js')) + ");",
  "const d=discriminate('neutral baseline text');",
  "const k=Object.keys(d.dimensions||{});",
  "console.log(k.length); console.log(k.join(' '));",
].join('\n')], { encoding: 'utf8', timeout: 120000 });

const lines = (r.stdout || '').trim().split('\n');
const dims = (lines[1] || '').split(/\s+/).filter(Boolean);
console.log('discriminate dimensions 键 =', parseInt(lines[0], 10), '实际数组 =', dims.length);

// 覆盖扫描口径
const idxSrc = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
function dimsOf(name) {
  const m = idxSrc.match(new RegExp('const ' + name + ' = new Set\\(([\\s\\S]*?)\\)'));
  return m ? (m[1].match(/['"][a-z_]+['"]/g) || []).map(s => s.slice(1, -1)) : [];
}
const tierAll = new Set([...dimsOf('BLOCK_DIMS'), ...dimsOf('REWRITE_DIMS'), ...dimsOf('VERIFY_DIMS')]);
console.log('覆盖扫描 ALL（动作级并集）=', tierAll.size);

const noAction = dims.filter(d => !tierAll.has(d));
console.log('\n差集（有 dimensions 键但不触发 gate action）=', noAction.length);
console.log('  ->', noAction.join(', '));

// 差集维度在 test/ 的样本情况
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
const files = walk(testDir);
console.log('\n差集维度测试命中：');
for (const d of noAction) {
  const hits = [];
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    if (src.includes("'" + d + "'") || src.includes('"' + d + '"')) hits.push(path.relative(ROOT, f));
  }
  console.log('  ', d, '=', hits.length, '处', hits.slice(0, 4).map(h => '(' + h + ')').join(' '));
}
