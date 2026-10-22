// r612 探针 v3：用 index.js 公开入口 new HeartFlow，实测 _modules 规模 +
// 找出「在 engine-lifecycle subsystemNames 名单里但实例未构造」的模块
const fs = require('fs');
const path = require('path');

const out = { generatedAt: new Date().toISOString() };
const { HeartFlow } = require('../src/core/heartflow.js');
const hf = new HeartFlow({ dataDir: path.join(__dirname, '..', 'data'), silent: true });
hf.start();

out.modulesCount = Object.keys(hf._modules || {}).length;
out.modulesSample = Object.keys(hf._modules || {}).slice(0, 200);

// 读 engine-lifecycle 的 subsystemNames 名单
const lifecycleSrc = fs.readFileSync(path.join(__dirname, '../src/core/engine-lifecycle.js'), 'utf8');
const m = lifecycleSrc.match(/subsystemNames\s*=\s*\[([\s\S]*?)\]/);
let names = [];
if (m) {
  names = m[1].split(',').map(s => s.replace(/[^a-zA-Z0-9_]/g, '')).filter(Boolean);
}
out.subsystemNamesCount = names.length;

// 逐个核对：实例上是否挂载、是否进 _modules
const missing = [];
const mountedButUnregistered = [];
for (const n of names) {
  const onInstance = !!hf[n];
  const inModules = !!hf._modules[n];
  if (!onInstance && !inModules) {
    // 实测懒加载能否拿到
    let lazyOk = false;
    try { lazyOk = !!(hf._lazy && hf._lazy[n]); } catch (e) {}
    missing.push({ name: n, onInstance, inModules, hasLazyEntry: lazyOk });
  } else if (onInstance && !inModules) {
    mountedButUnregistered.push(n);
  }
}
out.declaredButAbsent = missing;
out.mountedButUnregistered = mountedButUnregistered;
out.routeCount = (() => { try { return Object.keys(hf.routes() || {}).length; } catch (e) { return 'err:' + e.message.slice(0, 40); } })();
out.allowedCount = (() => { try { return HeartFlow.ALLOWED_ROUTES ? HeartFlow.ALLOWED_ROUTES.size : -1; } catch (e) { return -1; } })();

fs.writeFileSync('/tmp/r612-candidates3.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify({
  modulesCount: out.modulesCount,
  subsystemNamesCount: out.subsystemNamesCount,
  declaredButAbsent: out.declaredButAbsent.length,
  mountedButUnregistered: out.mountedButUnregistered,
  routeCount: out.routeCount,
}, null, 1));
