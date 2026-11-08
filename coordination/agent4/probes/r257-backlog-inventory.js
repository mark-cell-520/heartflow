// r257: 未接线模块 vs 已有测试文件 对照（handoff 情报）
const fs = require('fs');
const path = require('path');
const ROOT = '/data/home/heartflow';
const idx = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
const reqRe = /require\('\.\/([a-z0-9\-]+)\.js'\)/g;
const required = new Set();
let m;
while ((m = reqRe.exec(idx))) required.add(m[1]);
const files = fs.readdirSync(path.join(ROOT, 'src')).filter(f => f.endsWith('.js'));
const tests = new Set(fs.readdirSync(path.join(ROOT, 'test')).filter(f => f.endsWith('.test.js')).map(f => f.replace('.test.js', '')));
const rows = [];
for (const f of files) {
  const n = f.slice(0, -3);
  if (required.has(n)) continue;
  if (['index', 'gate', 'pipeline', 'mcp-server', 'heartflow-api-server', 'repo-audit', 'retention-logger', 'discrimination-trace'].includes(n)) continue;
  const lines = fs.readFileSync(path.join(ROOT, 'src', f), 'utf8').split('\n').length;
  const dimMatch = fs.readFileSync(path.join(ROOT, 'src', f), 'utf8').match(/dimension:\s*'([a-z_]+)'/);
  rows.push({ mod: n, lines, dim: dimMatch ? dimMatch[1] : '-', hasTest: tests.has(n) });
}
rows.sort((a, b) => b.lines - a.lines);
console.log('UNWIRED_MODULES=' + rows.length + '  withTest=' + rows.filter(r => r.hasTest).length);
console.log(JSON.stringify(rows, null, 0));
