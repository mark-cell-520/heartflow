/**
 * [round-286 probe-b2] 无动作级维度（50-45=5 个）到底有没有测试守护。
 *
 * dimension-coverage-scan.js 的 ALL = BLOCK ∪ REWRITE ∪ VERIFY（=45），
 * 是设计口径（能触发 gate action 的才纳入）。但引擎宣称 50 维度，
 * 剩下的 5 个（scored but do not force a gate action）不在扫描内。
 * 本探针回答：这 5 个维度在 test/ 里到底有没有样本、跑的是什么。
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

const idxSrc = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
function dimsOf(name) {
  const m = idxSrc.match(new RegExp('const ' + name + ' = new Set\\(([\\s\\S]*?)\\)'));
  return m ? (m[1].match(/['"][a-z_]+['"]/g) || []).map(s => s.slice(1, -1)) : [];
}
const TIERS = { block: dimsOf('BLOCK_DIMS'), rewrite: dimsOf('REWRITE_DIMS'), verify: dimsOf('VERIFY_DIMS') };
const tierAll = new Set([...TIERS.block, ...TIERS.rewrite, ...TIERS.verify]);

// 引擎侧全部维度名：从 DIMENSIONS 注册 / registry 拿
let allDims = [];
const cands = [
  () => require(path.join(ROOT, 'src/dimension-registry.js')),
  () => require(path.join(ROOT, 'src/dimensions/index.js')),
  () => require(path.join(ROOT, 'src/core/dimension-registry.js')),
];
for (const c of cands) {
  try {
    const m = c();
    const arr = m.all ? m.all() : (m.list ? m.list() : (Array.isArray(m) ? m : Object.keys(m)));
    allDims = arr.map(x => (x && (x.id || x.name || x.dimension)) || String(x)).filter(Boolean);
    if (allDims.length) break;
  } catch (e) { /* next */ }
}
// 兜底：从 index.js 全文抓 'dimension': 'xxx' 或 dimension: 'xxx'
if (!allDims.length) {
  allDims = [...new Set([...idxSrc.matchAll(/dimension['"]?\s*:\s*['"]([a-z_]+)['"]/g)].map(m => m[1]))];
}

console.log('引擎侧维度总数 =', allDims.length, ' 动作级 =', tierAll.size);
const noAction = allDims.filter(d => !tierAll.has(d));
console.log('无动作级维度（= 覆盖扫描未纳入）=', noAction.length);
console.log('  ->', noAction.join(', '));

// 这些维度在 test/ 的出现情况
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
const detail = {};
for (const d of noAction) detail[d] = { files: [], engineRefs: 0 };
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  for (const d of noAction) {
    if (src.includes("'" + d + "'") || src.includes('"' + d + '"')) detail[d].files.push(path.relative(ROOT, f));
  }
}
for (const d of noAction) detail[d].engineRefs = (idxSrc.match(new RegExp(d, 'g')) || []).length;

console.log('\n各无动作级维度：test 命中文件数 / src index.js 出现次数');
for (const d of noAction) {
  console.log('  ', d, ':: test', detail[d].files.length, '处 / src', detail[d].engineRefs, '处');
  for (const f of detail[d].files.slice(0, 6)) console.log('       ', f);
}
