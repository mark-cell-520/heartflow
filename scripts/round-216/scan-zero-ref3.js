// 第 216 轮：精确引用图（require 相对路径解析到真实文件，再查入度为 0 的模块）
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function walk(d, acc) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name.startsWith('round-')) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.js')) acc.push(p);
  }
  return acc;
}

const roots = ['src', 'test', 'bin', 'tools', 'scripts'];
const allFiles = [];
for (const r of roots) {
  if (fs.existsSync(r)) walk(r, allFiles);
}
const exists = new Set(allFiles);

// 归一化：把 require 的相对路径解析成绝对再转回相对根的形式
const inDeg = new Map(); // abs -> count
for (const f of allFiles) inDeg.set(path.resolve(f), 0);

function tryResolve(fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  const abs = path.resolve(path.dirname(fromFile), spec);
  const cands = [abs, abs + '.js', abs + '.json', path.join(abs, 'index.js')];
  for (const c of cands) {
    if (exists.has(c) && fs.statSync(c).isFile()) return path.resolve(c);
  }
  return null;
}

for (const f of allFiles) {
  const c = fs.readFileSync(f, 'utf8');
  for (const m of c.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    const target = tryResolve(f, m[1]);
    if (target && inDeg.has(target)) inDeg.set(target, inDeg.get(target) + 1);
  }
  // 动态 import() 与 _lazy 的路径字符串
  for (const m of c.matchAll(/_lazy\(\s*['"][^'"]*['"]\s*,\s*\(\)\s*=>\s*require\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    const target = tryResolve(f, m[1]);
    if (target && inDeg.has(target)) inDeg.set(target, inDeg.get(target) + 1);
  }
}

const out = [];
for (const f of allFiles) {
  if (!f.startsWith('src/')) continue;
  const base = path.basename(f);
  if (base === 'heartflow.js' || base === 'index.js' || base === 'mcp-server.js') continue;
  const abs = path.resolve(f);
  if (inDeg.get(abs) === 0) {
    out.push({ file: f, lines: fs.readFileSync(f, 'utf8').split('\n').length });
  }
}
out.sort((a, b) => b.lines - a.lines);
for (const o of out) console.log(o.lines + '\t' + o.file);
console.log('TOTAL true zero-ref: ' + out.length);
