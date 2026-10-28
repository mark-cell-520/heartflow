// r617 负例探针：删掉 _modules['uncertaintyQuantifier'] 键后，uq.* 路由与 dispatch 是否同时归零
// 用法：
//   node scripts/round-617-uq-negative-probe.js         # 删态实测 + 恢复态子进程实测
// 输出双口径：deleted（删态）→ 自动还原源文件 → restored（恢复态，一次性子进程实测）
const path = require('path');
const { execFileSync } = require('child_process');
const fs = require('fs');
const REPO = path.join(__dirname, '..');
process.chdir(REPO);
const SRC = path.join(REPO, 'src', 'core', 'heartflow.js');

// [v6.8.85 审计修复] 原实现在本进程 require heartflow.js **之后**才改写源
// 文件——require 缓存让「删态」永远跑旧代码，deleted/restoredAfter 输出恒等，
// C1/C2 的负例断言全部失去意义；且漏调 start()，dispatch 恒抛 "not started"。
// 现改为每次 `node -e` 子进程重新加载源码（与 scripts/round-615-pg-negative-
// probe.js 同模式），并走完整 start() 启动链路。
// 口径注意：测试侧 allows() 取 ALLOWED_ROUTES 白名单，这里同样取白名单
// 而非 routes() 运行表（后者枚举全部公有方法，会多数出 8 条）。
const TAG_PLACEHOLDER = '@@TAG@@';
const CHILD_SRC = [
  'const p = ' + JSON.stringify(REPO) + ';',
  'const { HeartFlow } = require(p + "/src/core/heartflow.js");',
  'const hf = new HeartFlow();',
  'hf.start();',
  'const r = { tag: ' + JSON.stringify(TAG_PLACEHOLDER) + ' };',
  "r.modulesKey = Object.prototype.hasOwnProperty.call(hf._modules, 'uncertaintyQuantifier');",
  'const allows = Array.from(hf.constructor.ALLOWED_ROUTES);',
  "r.uqRoutes = allows.filter(x => x.startsWith('uncertaintyQuantifier.')).length;",
  'r.total = allows.length;',
  'try {',
  "  hf.dispatch('uncertaintyQuantifier.evaluate', { text: 'plain statement' });",
  '  r.dispatchOk = true;',
  '} catch (e) {',
  '  r.dispatchOk = false;',
  '  r.dispatchErr = e.message;',
  '}',
  'console.log(JSON.stringify(r));',
].join('\n');

function probeOnce(tag) {
  const src = CHILD_SRC.replace(JSON.stringify(TAG_PLACEHOLDER), JSON.stringify(tag));
  const out = execFileSync(process.execPath, ['-e', src],
    { cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  // start() 会打印模块加载日志到 stdout，只取最后一条非空 JSON 行。
  return JSON.parse(out.split('\n').filter(Boolean).pop());
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
const restoredChildRaw = execFileSync(process.execPath, [__filename, '--child'], { encoding: 'utf-8' });
// [v6.8.85 审计修复] start() 会打印模块加载日志到 stdout，JSON.parse 直接吃
// 全量输出会挂。只取最后一条非空 JSON 行（与测试侧 runNegProbe 同口径）。
const restoredChild = JSON.parse(restoredChildRaw.split('\n').filter(Boolean).pop());

console.log(JSON.stringify({
  deleted,
  restored,
  restoredAfter,
  restoredChild,
  sourceRestored: fs.readFileSync(SRC, 'utf8') === original,
}));
