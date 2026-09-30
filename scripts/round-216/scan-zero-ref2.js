// 第 216 轮：跨全仓（src/test/bin/scripts/tools）查引用，区分「全仓 0 引用」与「仅 src 0 引用」
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

const srcAll = walk('src', []);
const out = [];
for (const f of srcAll) {
  const base = path.basename(f);
  if (base === 'heartflow.js' || base === 'index.js' || base === 'mcp-server.js') continue;
  const rel = f.replace(/^src\//, '');
  const cmd = 'grep -rl --include=*.js -F "' + rel + '" src test bin scripts tools 2>/dev/null | wc -l';
  let n = 0;
  try { n = parseInt(execSync(cmd).toString().trim(), 10); } catch (e) { n = 0; }
  if (n === 0) {
    const lines = fs.readFileSync(f, 'utf8').split('\n').length;
    out.push({ file: f, lines });
  }
}
out.sort((a, b) => b.lines - a.lines);
for (const o of out) console.log(o.lines + '\t' + o.file);
console.log('TOTAL repo-wide zero-ref: ' + out.length);
