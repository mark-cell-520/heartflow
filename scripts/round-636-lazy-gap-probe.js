// r636 精确缺口探针：_lazy 已声明但从未 require/实例化/接线的模块
// 口径：heartflow.js 的 _lazy('key', ...) 清单 —— 声明了但从未加载的能力
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const hfSrc = fs.readFileSync(path.join(ROOT, 'src', 'core', 'heartflow.js'), 'utf8');

const lcSrc = fs.readFileSync(path.join(ROOT, 'src', 'core', 'engine-lifecycle.js'), 'utf8');
const snMatch = lcSrc.match(/const subsystemNames = \[([\s\S]*?)\];/);
const subsystemNames = new Set();
if (snMatch) { let m; const nm = /'([A-Za-z0-9_]+)'/g; while ((m = nm.exec(snMatch[1])) !== null) subsystemNames.add(m[1]); }

// 所有 _lazy 键
const lazyRe = /_lazy\('([A-Za-z0-9_]+)'/g;
const lazyKeys = [];
let m;
while ((m = lazyRe.exec(hfSrc)) !== null) lazyKeys.push(m[1]);

// 统计每个键在 src/ 全仓的出现次数（排除 heartflow.js 自身声明行）
const countInSrc = (key) => {
  const { execSync } = require('child_process');
  try {
    return parseInt(execSync(`grep -rn --include=*.js "${key}" src/ | grep -v "core/heartflow.js" | wc -l`, { cwd: ROOT }).toString().trim(), 10) || 0;
  } catch (e) { return -1; }
};

const { HeartFlow } = require(path.join(ROOT, 'src', 'core', 'heartflow.js'));
const hf = new HeartFlow();
try { hf.start(); } catch (e) {}
const modeKeys = new Set(Object.keys(hf._modules || {}));

console.log('# r636 _lazy 声明 vs 实际接线');
console.log('_lazy 声明键: ' + lazyKeys.length + ' | subsystemNames: ' + subsystemNames.size + ' | _modules 键: ' + modeKeys.size);
console.log('');
const rows = [];
for (const k of lazyKeys) {
  const refs = countInSrc(k);
  // 该键对应的实例是否真的存在
  const inst = hf[k] || (hf._modules && hf._modules[k]);
  rows.push({ k, refs, hasInst: !!inst, inMod: modeKeys.has(k), inSn: subsystemNames.has(k) });
}
const declOnly = rows.filter(r => !r.hasInst && !r.inMod && !r.inSn);
console.log('★ 声明了但实例不存在/未进 _modules/未在名单: ' + declOnly.length);
for (const r of declOnly.sort((a, b) => a.refs - b.refs)) {
  console.log(`  [${r.k}] src内引用=${r.refs} 实例=${r.hasInst} _modules=${r.inMod} 名单=${r.inSn}`);
}
