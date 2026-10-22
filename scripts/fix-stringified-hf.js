/**
 * scripts/fix-stringified-hf.js
 * [r718 全局审计] 修复 fix-windows-root-hardcode.js 的第三类残留：
 * 字符串化的 __HF。原代码形如 const ROOT = '/root/...' 或
 * require('/root/.../src/x.js')，路径被当成字符串值用，替换后变成
 * '__HF' / '__HF/src/x.js' —— 引号里的不再是变量引用。
 *
 * 替换规则（保守，只动确定形状）：
 *   '__HF'        → __HF          （整串）
 *   '__HF/xxx'    → __HF + '/xxx' （前缀串）
 * 双引号同理。跳过：注释行、已是 __HF + 的形状。
 * 幂等：无 '__HF 引号串的文件跳过。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.join(__dirname, '..');
const APPLY = process.argv.includes('--apply');

function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      walk(p, out);
    } else if (/\.(js|cjs|mjs)$/.test(e.name) && !p.includes('fix-stringified-hf') && !p.includes('fix-windows-root-hardcode') && !p.includes('fix-double-hf-inject')) {
      out.push(p);
    }
  }
  return out;
}

const files = [];
for (const d of ['scripts', 'test', 'bin']) walk(path.join(ROOT, d), files);

let fixed = 0, errs = 0, totalRepl = 0;
const errList = [];

for (const f of files) {
  let src;
  try { src = fs.readFileSync(f, 'utf8'); } catch { continue; }
  // 只处理含引号包 __HF 的形状
  if (!/['"]__HF(?:\/|['"])/.test(src)) continue;

  let out = src;
  let repl = 0;

  // 逐行处理（跳过注释行）
  out = out.split('\n').map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return line;
    const before = line;
    // 前缀串 '__HF/xxx' → __HF + '/xxx'
    line = line.replace(/(['"])(__HF\/[^'"]*)\1/g, (m, q, rest) => { repl++; return `__HF + '${rest}'`; });
    // 整串 '__HF' → __HF
    line = line.replace(/(['"])__HF\1/g, (m, q) => { repl++; return '__HF'; });
    return line;
  }).join('\n');

  if (repl === 0) continue;
  totalRepl += repl;

  if (APPLY) {
    try { fs.writeFileSync(f, out); } catch (e) { errs++; errList.push(f + ' WRITE ' + e.message); continue; }
  }
  try {
    cp.execSync(`node --check ${JSON.stringify(f)}`, { stdio: 'pipe' });
    fixed++;
  } catch (e) {
    errs++;
    errList.push({ file: path.relative(ROOT, f), err: String(e.stderr || e.message).split('\n')[0] });
  }
}

console.log(`=== ${APPLY ? 'APPLY' : 'DRY-RUN'} 字符串化 __HF 修复 ===`);
console.log(`处理文件: ${fixed}｜替换处: ${totalRepl}｜错误: ${errs}`);
for (const e of errList.slice(0, 8)) console.log('  ' + (typeof e === 'string' ? e : e.file + ' — ' + e.err.slice(0, 100)));
if (!APPLY) console.log('\n（干跑。加 --apply 执行）');
