// r617 负例探针：删掉 _modules['uncertaintyQuantifier'] 键后，uq.* 路由与 dispatch 是否同时归零
// 用法：
//   node scripts/round-617-uq-negative-probe.js         # 删态实测 + 恢复态子进程实测
// 输出双口径：deleted（删态）→ 自动还原源文件 → restored（恢复态，一次性子进程实测）
const path = require('path');
const { execFileSync } = require('child_process');
const fs = require('fs');
const REPO = path.join(__dirname, '..');
process.chdir(REPO);
const { HeartFlow } = require('../src/core/heartflow.js');
const SRC = path.join(REPO, 'src', 'core', 'heartflow.js');

function probeOnce(tag) {
  const hf = new HeartFlow();
  const r = { tag };
  r.modulesKey = Object.prototype.hasOwnProperty.call(hf._modules, 'uncertaintyQuantifier');
  const rt = (typeof hf.routes === 'function') ? hf.routes() : {};
  const all = [];
  for (const [n, ms] of Object.entries(rt)) {
    if (Array.isArray(ms)) for (const m of ms) all.push(n + '.' + String(m).replace(/[^\x21-\x7e]+/g, ''));
  }
  r.uqRoutes = all.filter(x => x.startsWith('uncertaintyQuantifier.')).length;
  r.total = all.length;
  try {
    hf.dispatch('uncertaintyQuantifier.evaluate', { text: 'plain statement' });
    r.dispatchOk = true;
  } catch (e) {
    r.dispatchOk = false;
    r.dispatchErr = e.message;
  }
  return r;
}

// ── --child 一次性模式：只跑一次探针并退出，绝不再递归派生 ──
// 修复记录（2026-10-26）：原脚本漏了 argv 判断，--child 子进程会重新走完整流程，
// 再次 execFileSync 派生子进程 → 无限递归，实测峰值 95 个 node 进程 / 约 5GB 内存。
if (process.argv.includes('--child')) {
  const once = probeOnce('restored');
  once.childConfirmed = true;
  console.log(JSON.stringify(once));
  process.exit(0);
}

// ── 恢复态一次性子进程实测（在本进程动源文件之前先跑）──
const restored = probeOnce('restored');
restored.childConfirmed = true;

// ── 删态实测：读源码本体（不是 _modules，是本文件里的注册块）──
const REGISTER_BLOCK = /    if \(this\.uncertaintyQuantifier && !this\._modules\['uncertaintyQuantifier'\]\) \{\n      this\._modules\['uncertaintyQuantifier'\] = this\.uncertaintyQuantifier;\n    \}/;
const original = fs.readFileSync(SRC, 'utf8');
if (!REGISTER_BLOCK.test(original)) {
  console.log(JSON.stringify({ error: 'REGISTER_BLOCK not found — source already modified?', restored }));
  process.exit(1);
}
const deletedSrc = original.replace(REGISTER_BLOCK, '    // [r617 negative probe] 注册块已临时移除');
fs.writeFileSync(SRC, deletedSrc);
let deleted;
try {
  deleted = probeOnce('deleted');
} finally {
  fs.writeFileSync(SRC, original);
}

// 恢复态复测（源文件已还原，本进程再跑一次确认 self-heal）
const restoredAfter = probeOnce('restored-after');
const restoredChild = JSON.parse(execFileSync(process.execPath, [__filename, '--child'], { encoding: 'utf8' }));

console.log(JSON.stringify({
  deleted,
  restored,
  restoredAfter,
  restoredChild,
  sourceRestored: fs.readFileSync(SRC, 'utf8') === original,
}));
