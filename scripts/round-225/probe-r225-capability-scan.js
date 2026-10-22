// r225 战略落地探针：量化「零引用真实模块」与维度实现面，为方向建议提供实测底数
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

const files = walk(SRC, []);
const allSrc = files.map(f => fs.readFileSync(f, 'utf8')).join('\n');

// 1) 零引用模块：文件名（去扩展名）在全 src 其它文件中一次都没出现
const orphans = [];
for (const f of files) {
  const base = path.basename(f, '.js');
  if (base === 'index' || base === 'heartflow') continue;
  const code = fs.readFileSync(f, 'utf8');
  const lines = code.split('\n').length;
  // 引用判定：'require(.../<base>' 或 "require('./<base>')" 或 from '<base>'
  const re = new RegExp("require\\(['\"][^'\"]*\\b" + base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "(\\.js)?['\"]\\)|from ['\"][^'\"]*\\b" + base + "['\"]", 'g');
  const refs = (allSrc.match(re) || []).length;
  if (refs === 0) orphans.push({ file: path.relative(ROOT, f), lines, exports: /module\.exports/.test(code) });
}
orphans.sort((a, b) => b.lines - a.lines);

console.log('=== src 文件总数: ' + files.length + ' ===');
console.log('=== 零引用模块: ' + orphans.length + ' 个（其中 >50 行: ' + orphans.filter(o => o.lines > 50).length + '）===');
console.log('--- 零引用且 >50 行 Top 25 ---');
for (const o of orphans.filter(o => o.lines > 50).slice(0, 25)) {
  console.log(`${o.lines.toString().padStart(5)} 行  ${o.exports ? 'E' : '-'}  ${o.file}`);
}

// 2) 维度实现面：src/index.js 里的 check* 函数名
const idx = fs.readFileSync(path.join(SRC, 'index.js'), 'utf8');
const checkFns = [...new Set([...idx.matchAll(/function (check[A-Z]\w+)\(/g)].map(m => m[1]))];
console.log('=== src/index.js check* 函数: ' + checkFns.length + ' 个 ===');

// 3) MCP 工具数
try {
  const mcp = fs.readFileSync(path.join(SRC, 'mcp-server.js'), 'utf8');
  const tools = [...new Set([...mcp.matchAll(/name:\s*'(heartflow_\w+)'/g)].map(m => m[1]))];
  console.log('=== MCP heartflow_* 工具: ' + tools.length + ' 个 ===');
} catch (_) { console.log('=== MCP server 读取失败 ==='); }
