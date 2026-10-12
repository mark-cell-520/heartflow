#!/usr/bin/env node
/**
 * r420 — require 完整性守卫（可独立跑，也可被 CI / clean-clone 冒烟调用）
 *
 * 为什么存在：外部审计发现 1（严重）—— src/index.js require 的
 * ./economic-control.js 从未入库，全新克隆跑 README 示例立即
 * MODULE_NOT_FOUND。本地开发环境一切正常，因为文件在本地磁盘上。
 *
 * 本地绿 ≠ 新克隆可用。这个守卫就是那道缺失的门。
 *
 * 用法：
 *   node scripts/guard-require-integrity.js          # 检查，有问题 exit 1
 *   node scripts/guard-require-integrity.js --quiet   # 只输出问题
 *
 * 判据：
 *   扫所有**已被 git 跟踪**的 JS 里的 require('./x.js') / require('../x.js')
 *   1. 目标本地不存在            → FAIL（断链，真实代码路径）
 *   2. 目标存在但未被 git 跟踪    → FAIL（新克隆必崩）
 *   3. JSDoc 注释里的示例路径     → 跳过（历史上多次误报）
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const quiet = process.argv.includes('--quiet');
const log = (...a) => { if (!quiet) console.log(...a); };

let fail = 0;
const broken = [], untracked = [];

const tracked = new Set(execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean));
const trackedJs = execSync('git ls-files "src/*.js" "src/**/*.js" "bin/*.js"',
  { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);

for (const rel of trackedJs) {
  const abs = path.join(ROOT, rel);
  let src;
  try { src = fs.readFileSync(abs, 'utf8'); } catch (_) { continue; }
  for (const m of src.matchAll(/require\(['"](\.[^'"]+\.js)['"]\)/g)) {
    const target = path.resolve(path.dirname(abs), m[1]);
    const targetRel = path.relative(ROOT, target);
    if (!fs.existsSync(target)) {
      const ls = src.lastIndexOf('\n', m.index) + 1;
      const line = src.slice(ls, src.indexOf('\n', m.index));
      if (/^\s*(\*|\/\/|\/\*)/.test(line)) continue;   // JSDoc 示例，跳过
      broken.push(`${rel} → ${targetRel}`);
      continue;
    }
    if (!tracked.has(targetRel)) untracked.push(`${rel} → ${targetRel}`);
  }
}

log('=== require 完整性守卫 ===');
log(`扫描 ${trackedJs.length} 个已跟踪 JS\n`);

if (broken.length) {
  fail += broken.length;
  console.log(`🔴 断链 ${broken.length} 处（目标文件不存在）:`);
  broken.forEach(b => console.log(`    ${b}`));
}
if (untracked.length) {
  fail += untracked.length;
  console.log(`🔴 未入库 ${untracked.length} 处（本地有但 git 没有 → 新克隆必崩）:`);
  untracked.forEach(u => console.log(`    ${u}`));
}
if (!fail) log('✅ require 完整性通过：所有被引用文件都已入库');

// 附带检查：仓库卫生（审计发现 4）
log('\n=== 仓库卫生 ===');
const junk = [];
for (const pat of ['.pid', 'dist/', 'tmp/', '.bak', '.tar.gz']) {
  const hits = execSync(`git ls-files "*${pat}*"`, { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  if (hits.length) junk.push([pat, hits]);
}
for (const [pat, hits] of junk) {
  console.log(`  ⚠️  ${pat}: ${hits.length} 个已入库（${hits.slice(0, 3).join(', ')}${hits.length > 3 ? '…' : ''}）`);
}
if (!junk.length) log('  ✅ 无运行时文件/构建产物入库');

process.exit(fail > 0 ? 1 : 0);
