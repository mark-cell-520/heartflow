// r308 开轮侦察：找出 src/*.js 顶层模块中从未被 src/index.js 或插件/MCP 引用的"孤儿模块"
const fs = require('fs');
const path = require('path');
const srcDir = path.join(__dirname, '..', '..', 'src');
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));

// 收集所有引用源
const referrers = new Set();
function scanDir(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') scanDir(p); continue; }
    if (!e.name.endsWith('.js')) continue;
    let txt; try { txt = fs.readFileSync(p, 'utf8'); } catch (_) { continue; }
    for (const m of txt.matchAll(/require\(\s*['"]\.\.?\/?([a-z0-9\-]+\.js)['"]\s*\)/gi)) referrers.add(m[1]);
    for (const m of txt.matchAll(/require\(\s*['"]\.\/([a-z0-9\-]+\.js)['"]\s*\)/gi)) referrers.add(m[1]);
    for (const m of txt.matchAll(/from\s+['"]\.\/([a-z0-9\-]+\.js)['"]/gi)) referrers.add(m[1]);
  }
}
scanDir(srcDir);
['test','scripts','bin'].forEach(d => { const p = path.join(__dirname,'..','..',d); try { if (fs.existsSync(p)) scanDir(p); } catch(_){} });

const orphans = files.filter(f => !referrers.has(f));
console.log('顶层 src/*.js 模块总数:', files.length);
console.log('被引用模块数:', referrers.size);
console.log('孤儿模块数:', orphans.length);
console.log('--- 孤儿清单 ---');
for (const o of orphans.sort()) console.log(' ', o);
