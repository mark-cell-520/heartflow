// r331 系统化缺口扫描（自动版）：
// 从 test/ 下所有测试文件中提取「攻击集」样本，跑 checkOutput，
// 统计 gate 层穿透（pass 且无 finding），输出穿透热点排行。
'use strict';
const fs = require('fs');
const path = require('path');
const { checkOutput } = require('../../src/gate.js');

const TEST_DIR = path.resolve(__dirname, '../../test');

function extractAttackArrays(src) {
  const out = [];
  const re = /const\s+(ATTACKS?(?:_[A-Z0-9]+)*)\s*=\s*\[/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    let i = re.lastIndex, depth = 1, end = -1;
    while (i < src.length) {
      const c = src[i];
      if (c === '[') depth++;
      else if (c === ']') { depth--; if (depth === 0) { end = i; break; } }
      else if (c === '`' || c === '"' || c === "'") {
        const q = c; i++;
        while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; }
      }
      i++;
    }
    if (end < 0) continue;
    const body = src.slice(re.lastIndex, end);
    let arr;
    try { arr = eval('[' + body + ']'); } catch (_) { continue; }
    if (Array.isArray(arr)) {
      const strs = arr.filter(x => typeof x === 'string' && x.length > 5);
      if (strs.length) out.push({ name: m[1], samples: strs });
    }
    re.lastIndex = end;
  }
  return out;
}

function walk(dir) {
  let files = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files = files.concat(walk(p));
    else if (e.name.endsWith('.js')) files.push(p);
  }
  return files;
}

const files = walk(TEST_DIR);
const rows = [];
let totalAttack = 0, totalPass = 0;
for (const f of files) {
  let src;
  try { src = fs.readFileSync(f, 'utf8'); } catch (_) { continue; }
  const sets = extractAttackArrays(src);
  for (const set of sets) {
    let pass = 0;
    const misses = [];
    for (const t of set.samples) {
      let r;
      try { r = checkOutput(t); } catch (_) { continue; }
      const findings = (r.findings || []).filter(x => !x.classical);
      if (r.gate.action === 'pass' && findings.length === 0) { pass++; misses.push(t); }
    }
    totalAttack += set.samples.length;
    totalPass += pass;
    if (pass > 0) rows.push({ file: path.basename(f), set: set.name, n: set.samples.length, pass, misses });
  }
}
rows.sort((a, b) => b.pass - a.pass || (b.pass / b.n) - (a.pass / a.n));
console.log('=== gate 层穿透排行（checkOutput action=pass 且无 finding）===');
console.log(`总计：${rows.length} 个攻击集，${totalAttack} 条样本，${totalPass} 条穿透\n`);
for (const r of rows.slice(0, 40)) {
  console.log(`${String(r.pass).padStart(3)}/${String(r.n).padEnd(3)} 穿透  ${r.file}  ::  ${r.set}`);
}
console.log('\n=== 前 12 个热点集的穿透样本 ===');
for (const r of rows.slice(0, 12)) {
  console.log(`\n--- ${r.file} :: ${r.set} (${r.pass}/${r.n}) ---`);
  for (const t of r.misses.slice(0, 6)) console.log('   ', t.slice(0, 60));
}
