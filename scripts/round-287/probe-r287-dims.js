// round-287 探针：复现 dimension-coverage-scan.js 的 dimsOf 静态口径 vs 运行时实测
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

function dimsOf(name) {
  const idxSrc = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
  const m = idxSrc.match(new RegExp('const ' + name + ' = new Set\\(([\\s\\S]*?)\\)'));
  return m ? (m[1].match(/['"][a-z_]+['"]/g) || []).map(s => s.slice(1, -1)) : [];
}

const stat = {
  block: dimsOf('BLOCK_DIMS'),
  rewrite: dimsOf('REWRITE_DIMS'),
  verify: dimsOf('VERIFY_DIMS'),
};

// 运行时实测：用 discriminate() 的 dimensions 键
const { discriminate } = require(path.join(ROOT, 'src/index.js'));
const rt = discriminate('这是一个正常的陈述。');
const rtDims = Object.keys(rt.dimensions || rt);

// 运行时取 Set：通过 gate 的 trace/checked_by 拿不到，改用引擎内部导出探测
const idx = require(path.join(ROOT, 'src/index.js'));

console.log('=== 静态口径（dimension-coverage-scan.js 用） ===');
console.log('block  :', stat.block.length, stat.block.join(','));
console.log('rewrite:', stat.rewrite.length);
console.log('verify :', stat.verify.length);
console.log('ALL    :', new Set([...stat.block, ...stat.rewrite, ...stat.verify]).size);

console.log('\n=== 运行时实测 dimensions 键 ===');
console.log('count:', rtDims.length);

console.log('\n=== 差集（运行时/权威 有、静态口径漏） ===');
const staticAll = new Set([...stat.block, ...stat.rewrite, ...stat.verify]);
const missing = rtDims.filter(d => !staticAll.has(d));
console.log(missing.join(', ') || '（无）');

console.log('\n=== 静态有多、运行时没有（幽灵维度） ===');
const ghost = [...staticAll].filter(d => !rtDims.includes(d));
console.log(ghost.join(', ') || '（无）');

// 直接验证 reward_hacking 在不在静态 block 列表
console.log('\n静态 block 含 reward_hacking ?', stat.block.includes('reward_hacking'));
console.log('运行时含 reward_hacking ?', rtDims.includes('reward_hacking'));
console.log('静态 block 含 indirect_injection ?', stat.block.includes('indirect_injection'));
