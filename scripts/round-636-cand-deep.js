// r636 候选深度探针：看清 NEVER_LOADED 候选的真实能力 + 外部引用点
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const hfSrc = fs.readFileSync(path.join(ROOT, 'src', 'core', 'heartflow.js'), 'utf8');

const lazyRe = /_lazy\('([A-Za-z0-9_]+)',\s*\(\)\s*=>\s*([\s\S]*?)\);\n/g;
const entries = {};
let m;
while ((m = lazyRe.exec(hfSrc)) !== null) entries[m[1]] = m[2];

const list = process.argv.slice(2);
for (const k of list) {
  const body = entries[k] || '(无 _lazy 声明)';
  const req = (body.match(/require\('([^']+)'\)/) || [])[1] || '(stub 无实现)';
  console.log('=== ' + k + ' → ' + req);
  // src 内引用位置
  try {
    const g = execSync(`grep -rn --include=*.js "${k}" src/ | grep -v "core/heartflow.js" | head -6`, { cwd: ROOT }).toString().trim();
    console.log('  src引用: ' + (g ? g.split('\n').join('\n           ') : '无'));
  } catch (e) { console.log('  src引用: 无'); }
  if (req === '(stub 无实现)') continue;
  const full = path.join(ROOT, 'src', req.replace(/^\.\//, ''));
  const fp = path.resolve(path.join(ROOT, 'src', 'core'), req.replace(/^\.\//, ''));
  let file = fs.existsSync(full) ? full : (fs.existsSync(fp) ? fp : null);
  if (!file) { console.log('  文件不存在: ' + full); continue; }
  const src = fs.readFileSync(file, 'utf8');
  // 取头部注释
  const head = src.split('\n').slice(0, 12).filter(l => /\/\//.test(l) || /^\/\*/.test(l)).join(' ').slice(0, 300);
  console.log('  头注: ' + head);
  const cls = (src.match(/module\.exports\s*=\s*\{([^}]*)\}/) || [])[1] || '';
  console.log('  exports: ' + cls.trim().slice(0, 200));
  // 方法数
  try {
    const mod = require(file);
    const key = Object.keys(mod)[0];
    const inst = new mod[key]();
    const seen = new Set();
    for (const p of Object.getOwnPropertyNames(Object.getPrototypeOf(inst))) { if (p !== 'constructor' && typeof inst[p] === 'function') seen.add(p); }
    for (const p of Object.getOwnPropertyNames(inst)) { if (typeof inst[p] === 'function' && p !== 'constructor') seen.add(p); }
    console.log('  方法(' + seen.size + '): ' + Array.from(seen).join(', '));
  } catch (e) { console.log('  构造失败: ' + e.message); }
}
