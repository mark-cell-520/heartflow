/**
 * scripts/fix-double-hf-inject.js
 * [r718 全局审计] 修复 fix-windows-root-hardcode.js 的双注入残留：
 *   1. 连续重复的 __HF 注入行去重（const 重复声明 = SyntaxError）
 *   2. __HF 行若排在 const path = require('path') 之前（TDZ），
 *      把 path.join 改为 require('path').join
 *   3. 全量 node --check 验证
 * 幂等：无 [r718 审计修复] 标记的文件跳过。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.join(__dirname, '..');
const MARK = '// [r718 审计修复]';
const APPLY = process.argv.includes('--apply');

function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      walk(p, out);
    } else if (/\.(js|cjs|mjs)$/.test(e.name) && !p.includes('fix-double-hf-inject') && !p.includes('fix-windows-root-hardcode')) {
      out.push(p);
    }
  }
  return out;
}

const files = [];
for (const d of ['scripts', 'test', 'bin']) walk(path.join(ROOT, d), files);

let deduped = 0, tdzFixed = 0, checked = 0, errors = 0;
const errorList = [];

for (const f of files) {
  let src;
  try { src = fs.readFileSync(f, 'utf8'); } catch { continue; }
  if (!src.includes(MARK)) continue;

  let out = src;

  // 1. 连续重复注入行去重（逐行比对，保留首行）
  const lines = out.split('\n');
  const seen = new Set();
  const dedupLines = [];
  for (const ln of lines) {
    if (ln.includes(MARK)) {
      if (seen.has(ln)) { deduped++; continue; }
      seen.add(ln);
    }
    dedupLines.push(ln);
  }
  out = dedupLines.join('\n');

  // 2. TDZ 修复：__HF 行在 path require 之前 → require('path').join
  const lines2 = out.split('\n');
  const hfIdx = lines2.findIndex(l => l.includes(MARK) && l.includes('path.join(__dirname'));
  const pathReqIdx = lines2.findIndex(l => /const path = require\(['"](?:node:)?path['"]\)/.test(l));
  if (hfIdx >= 0 && pathReqIdx >= 0 && hfIdx < pathReqIdx) {
    lines2[hfIdx] = lines2[hfIdx].replace('path.join(__dirname', "require('path').join(__dirname");
    out = lines2.join('\n');
    tdzFixed++;
  }

  // 3. 先写盘再验证（验证的是修复后的内容，不是磁盘原文）
  if (APPLY) fs.writeFileSync(f, out);
  try {
    cp.execSync(`node --check ${JSON.stringify(f)}`, { stdio: 'pipe' });
  } catch (e) {
    errors++;
    errorList.push({ file: path.relative(ROOT, f), err: String(e.stderr || e.message).split('\n').slice(0, 2).join(' ') });
    continue;
  }
  checked++;
}

console.log(`=== ${APPLY ? 'APPLY' : 'DRY-RUN'} 双注入修复 ===`);
console.log(`含标记文件处理: ${checked}｜去重行数: ${deduped}｜TDZ 修复: ${tdzFixed}｜语法错误: ${errors}`);
if (errorList.length) {
  console.log('\n语法错误文件:');
  for (const e of errorList.slice(0, 10)) console.log('  ' + e.file + ' — ' + e.err.slice(0, 120));
}
if (!APPLY) console.log('\n（干跑。加 --apply 执行）');
