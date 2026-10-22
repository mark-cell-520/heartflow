// r636 真实缺口探针：_lazy 指向真实文件、但该实例从未构造/未接线的能力
// 关键：排除 stub（_lazy 回调里直接 return class { ... } 造无实现空壳的）
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const hfSrc = fs.readFileSync(path.join(ROOT, 'src', 'core', 'heartflow.js'), 'utf8');
const lcSrc = fs.readFileSync(path.join(ROOT, 'src', 'core', 'engine-lifecycle.js'), 'utf8');
const snMatch = lcSrc.match(/const subsystemNames = \[([\s\S]*?)\];/);
const subsystemNames = new Set();
if (snMatch) { let m; const nm = /'([A-Za-z0-9_]+)'/g; while ((m = nm.exec(snMatch[1])) !== null) subsystemNames.add(m[1]); }

// 抓所有 _lazy('key', () => ...) 的回调体（到换行上的 ');' 结束）
const lazyRe = /_lazy\('([A-Za-z0-9_]+)',\s*\(\)\s*=>\s*([\s\S]*?)\);\n/g;
const entries = [];
let m;
while ((m = lazyRe.exec(hfSrc)) !== null) entries.push({ key: m[1], body: m[2] });

const stub = [], real = [];
for (const e of entries) {
  const hasRequire = /require\(/.test(e.body);
  if (hasRequire) real.push(e); else stub.push(e);
}
console.log('# r636 真实缺口: _lazy 总 ' + entries.length + ' | 指向真实文件 ' + real.length + ' | stub 空壳 ' + stub.length);
console.log('stub 键（无实现文件，不可接线）: ' + stub.map(s => s.key).join(', '));
console.log('');

const { HeartFlow } = require(path.join(ROOT, 'src', 'core', 'heartflow.js'));
const hf = new HeartFlow();
try { hf.start(); } catch (e) {}
const modeKeys = new Set(Object.keys(hf._modules || {}));

const rows = [];
for (const e of real) {
  const k = e.key;
  if (subsystemNames.has(k)) continue;           // 已在 lifecycle 名单
  if (modeKeys.has(k)) continue;                  // 已进 dispatch
  const inst = hf[k] || (hf._modules && hf._modules[k]);
  // src 内引用（排除 heartflow.js）
  let refs = 0;
  try {
    refs = parseInt(execSync(`grep -rn --include=*.js "${k}" src/ | grep -v "core/heartflow.js" | wc -l`, { cwd: ROOT }).toString().trim(), 10) || 0;
  } catch (err) {}
  if (inst) { rows.push({ k, refs, state: 'INST_NO_DISPATCH' }); continue; }
  rows.push({ k, refs, state: 'NEVER_LOADED' });
}
console.log('★ 真实实现文件 + 未接线: ' + rows.length);
for (const r of rows.sort((a, b) => b.refs - a.refs)) {
  console.log(`  [${r.k}] src内引用=${r.refs} ${r.state}`);
}
