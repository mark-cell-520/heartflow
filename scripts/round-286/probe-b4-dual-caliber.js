/** [round-286 probe-b4] 双口径差集：57 vs 50，逐维定性 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const idxSrc = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');

// 口径1：doc-numbers 用（顶层 function check* 计数）
const checkFns = new Set();
for (const m of idxSrc.matchAll(/^function (check[A-Z]\w*)\s*\(/gm)) checkFns.add(m[1]);
console.log('口径1 doc-numbers（顶层 function check* 计数）=', checkFns.size);
console.log('   函数:', [...checkFns].join(', '));

// 口径2：measure 用（discriminate dimensions 键）
const r = cp.spawnSync('node', ['-e', [
  "const {discriminate}=require(" + JSON.stringify(path.join(ROOT, 'src/index.js')) + ");",
  "const d=discriminate('neutral baseline text');",
  "console.log(Object.keys(d.dimensions||{}).join(' '));",
].join('\n')], { encoding: 'utf8', timeout: 120000 });
const dims = ((r.stdout || '').trim() || '').split(/\s+/).filter(Boolean);
console.log('\n口径2 measure（discriminate dimensions 键）=', dims.length);
console.log('   维度:', dims.join(', '));

// 重复维度名（dimensions 里同名键只可能出现一次，看是否有 _boost / _recognition 后缀族）
const suffix = dims.filter(d => d.endsWith('_boost') || d.endsWith('_recognition'));
console.log('\n带 _boost/_recognition 后缀的（疑似同族第二计）=', suffix.join(', ') || '无');

// 关键：这 57 个是否都写回 dims（真维度键）——抽查 dimensions 对象结构
const r2 = cp.spawnSync('node', ['-e', [
  "const {discriminate}=require(" + JSON.stringify(path.join(ROOT, 'src/index.js')) + ");",
  "const d=discriminate('neutral baseline text');",
  "const ks=Object.keys(d.dimensions);",
  "console.log(JSON.stringify({total:ks.length, zeroVal:ks.filter(k=>{const v=d.dimensions[k];return v===0||v===null||v===undefined}).length, sample:ks.slice(0,8)}));",
].join('\n')], { encoding: 'utf8', timeout: 120000 });
console.log('\ndimensions 结构:', (r2.stdout || '').trim());
