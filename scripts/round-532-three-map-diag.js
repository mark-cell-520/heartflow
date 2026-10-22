// r532: 三张表的键差集诊断 —— allDims(name) / dimMap(局部) / dimensions(返回) / summary
const fs = require('fs');
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const idx = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
const { discriminate } = require(path.join(ROOT, 'src/index.js'));
const res = discriminate('neutral baseline text');
const retDims = Object.keys(res.dimensions || {});
const retSet = new Set(retDims);

// 1) allDims 里的 name
const allDimsStart = idx.indexOf('const allDims = [');
const allDimsEnd = idx.indexOf('\n  ];', allDimsStart);
const allDimsSrc = idx.slice(allDimsStart, allDimsEnd);
const allNames = [...allDimsSrc.matchAll(/name\s*:\s*'([a-z_]+)'/g)].map(m => m[1]);
console.log('allDims 项数 =', allNames.length, '（去重后', new Set(allNames).size, '）');

// 2) 局部 dimMap 键
const dmStart = idx.indexOf('const dimMap = {');
const dmEnd = idx.indexOf('\n  };', dmStart);
const dimMapSrc = idx.slice(dmStart, dmEnd);
const dimMapKeys = [...dimMapSrc.matchAll(/^\s*([a-z_]+)\s*:/gm)].map(m => m[1]);
console.log('dimMap 键数 =', dimMapKeys.length);

// 3) 返回的 dimensions 键
console.log('返回 dimensions 键数 =', retDims.length);

const S = a => new Set(a);
const diff = (A, B) => [...S(A)].filter(x => !S(B).has(x));

console.log('\n—— allDims 有、dimMap 无 ——');
console.log('  ', diff(allNames, dimMapKeys).join(', ') || '(无)');
console.log('\n—— dimMap 有、allDims 无 ——');
console.log('  ', diff(dimMapKeys, allNames).join(', ') || '(无)');
console.log('\n—— allDims/dimMap 有、返回 dimensions 无 ——');
console.log('  ', diff([...allNames, ...dimMapKeys], retDims).join(', ') || '(无)');
console.log('\n—— 返回 dimensions 有、allDims 无 ——');
console.log('  ', diff(retDims, allNames).join(', ') || '(无)');

// 4) summary 键
const smStart = idx.indexOf('summary: [sy.totalHits');
const smSrc = idx.slice(smStart, idx.indexOf(']', smStart));
const smIds = [...smSrc.matchAll(/\b([a-z]{2,4})\.(?:count|totalHits|structure|issues)\b/g)].map(m => m[1]);
console.log('\nsummary 引用实例数（含重复）=', smIds.length, '去重', new Set(smIds).size);

// 5) doc 数差
const agents = fs.readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf8');
const docNames = new Set();
for (const m of agents.matchAll(/\b([a-z][a-z0-9]*(?:_[a-z0-9]+)+)\b/g)) docNames.add(m[1]);
console.log('\n—— 文档宣称但引擎完全不存在（既不在 allDims 也不在返回 dimensions）——');
for (const n of [...docNames].sort()) {
  if (/heartflow|checked_by|sunk_cost/.test(n)) continue;
  if (!S(allNames).has(n) && !retSet.has(n)) console.log('  ', n);
}
