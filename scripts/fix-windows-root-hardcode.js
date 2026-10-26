/**
 * scripts/fix-windows-root-hardcode.js
 * [r718 全局审计] Windows 副本工具链适配修复（一次性、幂等）。
 *
 * 背景：657 个 scripts/test/bin 文件硬编码 '/root/.hermes/skills/ai/
 * mark-heartflow-skill'，在 Windows 副本上全部 ENOENT。修法不是逐
 * 个改（易错），而是统一注入 __HF 根路径常量后做字符串替换：
 *   1. 按文件深度计算 __HF = path.join(__dirname, <..序列>)
 *   2. 把 '__HF' 全部替换为 __HF
 *      （覆盖 const HF = '...' / require('...') / process.chdir('...') 等形状）
 *   3. 文件无 require('path') 时注入一行
 * 跨平台正确：__dirname 在 Linux 原环境解析到同一位置，行为不变。
 *
 * 用法：node scripts/fix-windows-root-hardcode.js [--apply]
 * 不带 --apply 为干跑。
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LINUX_ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const APPLY = process.argv.includes('--apply');

// 扫描范围：scripts/ test/ bin/（src/ 无硬编码，已核实）
const SCAN_DIRS = ['scripts', 'test', 'bin'];

function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git' || e.name === 'archive') continue;
      walk(p, out);
    } else if (/\.(js|cjs|mjs)$/.test(e.name)) {
      out.push(p);
    }
  }
  return out;
}

// 文件相对仓库根的深度（scripts/x.js → 1，scripts/r1/x.js → 2）
function depthOf(file) {
  const rel = path.relative(ROOT, file);
  return rel.split(path.sep).length - 1;
}

function fixFile(file) {
  let src;
  try { src = fs.readFileSync(file, 'utf8'); } catch { return null; }
  if (!src.includes(LINUX_ROOT)) return null;

  const occurrences = src.split(LINUX_ROOT).length - 1;
  const depth = depthOf(file);
  const parent = depth > 0 ? "', '".padEnd(0) + Array(depth).fill('..').join("', '") : '';
  const hfExpr = depth > 0 ? `path.join(__dirname, '${parent}')` : '__dirname';

  // 1. 替换所有硬编码根路径为 __HF
  let out = src.split(LINUX_ROOT).join('__HF');

  // 2. 注入 __HF 定义 + path require（若无）
  const needPath = !/require\(['"]path['"]\)/.test(out);
  const injectLines = [];
  if (needPath) injectLines.push("const path = require('path');");
  injectLines.push(`const __HF = ${hfExpr}; // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）`);

  // 注入点：第一个 'use strict' 或首个 require 之前；都没有则文件头
  const strictMatch = out.match(/^(['"])use strict\1;?\s*\n/m);
  const firstRequire = out.search(/^const .*require\(/m);
  let injectAt = 0;
  if (strictMatch) injectAt = strictMatch.index + strictMatch[0].length;
  else if (firstRequire >= 0) injectAt = firstRequire;
  out = out.slice(0, injectAt) + injectLines.join('\n') + '\n' + out.slice(injectAt);

  // 3. 语法验证（apply 模式）
  if (APPLY) {
    try {
      require('child_process').execSync(`node --check ${JSON.stringify(file)}`, { stdio: 'pipe', timeout: 30000 });
    } catch (e) {
      return { file, occurrences, error: String(e.stderr || e.message).slice(0, 200) };
    }
    fs.writeFileSync(file, out);
  }
  return { file, occurrences, depth };
}

const files = [];
for (const d of SCAN_DIRS) walk(path.join(ROOT, d), files);

// 排除自身（本脚本含目标字符串，修自己会造成 TDZ）
const SELF = __filename;
const targets = files.filter(f => path.resolve(f) !== path.resolve(SELF));

let fixed = 0, skipped = 0, errors = 0, totalOcc = 0;
const errorList = [];
for (const f of targets) {
  const r = fixFile(f);
  if (!r) { skipped++; continue; }
  if (r.error) { errors++; errorList.push(r); continue; }
  fixed++; totalOcc += r.occurrences;
}

console.log(`=== ${APPLY ? 'APPLY' : 'DRY-RUN'} 模式 ===`);
console.log(`扫描文件: ${files.length}｜命中待修: ${fixed}｜无需修: ${skipped}｜语法错误: ${errors}｜替换处总数: ${totalOcc}`);
if (errorList.length) {
  console.log('\n语法错误文件（未写入）:');
  for (const e of errorList.slice(0, 10)) console.log('  ' + path.relative(ROOT, e.file) + ' — ' + e.error.split('\n')[0]);
}
if (!APPLY && fixed > 0) console.log('\n（干跑。加 --apply 执行修复）');
