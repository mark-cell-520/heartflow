// 第 216 轮：扫 src/ 下 0 外部引用的模块（候选接线目标）
const fs = require('fs');
const path = require('path');

function walk(d, acc) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.js')) acc.push(p);
  }
  return acc;
}

const all = walk('src', []);
const owners = {}; // module basename -> set of requiring files
for (const f of all) {
  const c = fs.readFileSync(f, 'utf8');
  for (const m of c.matchAll(/['"]\.\/([\w./-]+\.js)['"]/g)) {
    const base = path.basename(m[1]);
    (owners[base] = owners[base] || new Set()).add(f);
  }
}

const out = [];
for (const f of all) {
  const base = path.basename(f);
  if (base === 'heartflow.js' || base === 'index.js' || base === 'mcp-server.js') continue;
  const refs = [...(owners[base] || [])].filter(x => x !== f);
  if (refs.length === 0) {
    const lines = fs.readFileSync(f, 'utf8').split('\n').length;
    out.push({ file: f.replace(/^src\//, ''), lines, refs: 0 });
  }
}
out.sort((a, b) => b.lines - a.lines);
for (const o of out) console.log(o.lines + '\t' + o.file);
console.log('TOTAL zero-ref modules: ' + out.length);
