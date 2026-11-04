'use strict';
/**
 * test/round-740-mutation-guard.test.js
 * [v6.8.95 第 740 轮] 回归突变守卫（src/core/mutation-guard.js）
 *
 * 背景（r739 事故，全部实测坐实）：
 *   轮次协议第 5 步跑 sync-doc-numbers.js 记账、第 7 步跑全量回归，两者
 *   没有互斥。回归串行车道里 reward-hacking-* 一族是**原地删条突变**：
 *     fs.writeFileSync(SRC, stripped)      // src/reward-hacking.js 被删段
 *     try { … } finally { fs.writeFileSync(SRC, original) }
 *   SIGKILL 不可捕获 → 源文件永久留在删条态。r739 实测形态：
 *   src/reward-hacking.js 少 103 行、src/core/heartflow.js 少 32 行，
 *   而 sync-doc-numbers.js 的 measure() 在突变窗口内起了子进程 require
 *   那份被删条的 heartflow.js → 模块数 161→157、路由 1314→1264，
 *   **错数字被写进 AGENTS.md / README.md / SKILL.md / package.json**。
 *   当时误判为「sync-doc-numbers.js 会删源码」，r740 轮初复测证明它只写
 *   那 4 份文档、实测 161/1314 零 src/ 写入——真正的因是「测量与突变期
 *   没有互斥」+「runner 回滚不删新增残留」。
 *
 * 本测试七段：
 *   A 快照/回滚四闸（temp root，不碰真仓）
 *   B 残留审计 suspicious / known 分桶
 *   C 突变期探活三态（无锁 / 死 PID / 活 PID）
 *   D 记账闸拒绝语义
 *   E 五处接线（run-all / 两个记账脚本 / MCP 三处 / 引擎）
 *   F 真仓当前干净性
 *   G 回归：原实现的洞仍在（证明守卫承重，不是装饰）
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const { MutationGuard } = require(path.join(ROOT, 'src/core/mutation-guard.js'));

let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log(`  ✅ ${name}${detail ? ' — ' + detail : ''}`); }
  else { fail++; console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`); }
}

// ── 临时仓库根：所有写盘断言都在这里做，绝不碰真仓 ──────────────
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-mg-r740-'));
const SRC_DIR = path.join(TMP, 'src');
const TEST_DIR = path.join(TMP, 'test');
fs.mkdirSync(SRC_DIR, { recursive: true });
fs.mkdirSync(TEST_DIR, { recursive: true });
const REAL = path.join(SRC_DIR, 'real.js');
fs.writeFileSync(REAL, 'const a = 1;\n'.repeat(50), 'utf8');

function g(opts) {
  return new MutationGuard(Object.assign({ rootPath: TMP, silent: true }, opts || {}));
}

console.log('── A 快照/回滚四闸（temp root）');
{
  // A1 内容被改 → 还原
  const snap = g().snapshot();
  fs.writeFileSync(REAL, 'const a = 1;\n'.repeat(50) + '// mutant\n', 'utf8');
  const r1 = g().rollback(snap);
  check('A1 内容被改的文件被还原', r1.restored.length === 1 && r1.restored[0] === 'src/real.js',
    `restored=${JSON.stringify(r1.restored)}`);
  check('A1 还原后内容与快照一致',
    fs.readFileSync(REAL, 'utf8') === 'const a = 1;\n'.repeat(50));

  // A2 三类新增残族 → 删（src 副本 / 仓库根 .mut- / test/.tmp-mutant-）
  const snap2 = g().snapshot();
  const news = [
    path.join(SRC_DIR, 'round-448-mutant-dev-exemptions.js'),
    path.join(TMP, '.mut-488-human-acc.js'),
    path.join(TEST_DIR, '.tmp-mutant-r507-1.js'),
  ];
  for (const n of news) fs.writeFileSync(n, '// residue\n', 'utf8');
  const r2 = g().rollback(snap2);
  check('A2 三类新增突变残族全被删', r2.removed.length === 3,
    `removed=${JSON.stringify(r2.removed)}`);
  check('A2 删后文件真的不在了', news.every(n => !fs.existsSync(n)));

  // A3 新鲜度闸：同形状但 mtime 旧（已入库驱动）→ 不删，只报
  const snap3 = g().snapshot();
  const old = path.join(TEST_DIR, 'round-434-mutant-runner.js');
  fs.writeFileSync(old, '// committed driver\n', 'utf8');
  const oldTime = new Date(Date.now() - 400 * 3600e3);
  fs.utimesSync(old, oldTime, oldTime);
  const r3 = g().rollback(snap3);
  check('A3 同形状但 mtime 旧的已入库文件不被删', fs.existsSync(old),
    `keptNew=${JSON.stringify(r3.keptNew)}`);
  check('A3 它被报进 keptNew（只报不删）', r3.keptNew.indexOf('test/round-434-mutant-runner.js') >= 0);
  check('A3 removed 为空（没误删）', r3.removed.length === 0);
  fs.unlinkSync(old);

  // A4 形状闸：新增但不属残族的 .js → 不删
  const snap4 = g().snapshot();
  const legit = path.join(SRC_DIR, 'brand-new-module.js');
  fs.writeFileSync(legit, '// 正常新模块\n', 'utf8');
  const r4 = g().rollback(snap4);
  check('A4 不属残族形状的新 .js 不被删', fs.existsSync(legit));
  check('A4 它被报进 keptNew', r4.keptNew.indexOf('src/brand-new-module.js') >= 0);
  fs.unlinkSync(legit);
}

console.log('── B 残留审计分桶');
{
  const mg = g();
  const fresh = path.join(SRC_DIR, 'round-999-mutant-index.js');
  fs.writeFileSync(fresh, '// 新鲜残留\n', 'utf8');
  const stale = path.join(TEST_DIR, 'round-998-mutant-child.js');
  fs.writeFileSync(stale, '// 旧驱动\n', 'utf8');
  const staleTime = new Date(Date.now() - 500 * 3600e3);
  fs.utimesSync(stale, staleTime, staleTime);
  const res = mg.auditResidue();
  check('B1 48 小时内的进 suspicious', res.suspicious.some(x => x.path === 'src/round-999-mutant-index.js'),
    JSON.stringify(res.suspicious));
  check('B2 更早的进 known', res.known.some(x => x.path === 'test/round-998-mutant-child.js'),
    JSON.stringify(res.known));
  check('B3 count = 两桶之和', res.count === res.suspicious.length + res.known.length);
  check('B4 status().clean 在 suspicious 非空时为 false', mg.status().clean === false);
  fs.unlinkSync(fresh); fs.unlinkSync(stale);
}

console.log('── C 突变期探活三态');
{
  const dataDir = path.join(TMP, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const lock = path.join(dataDir, '.run-all.lock');
  // C1 无锁
  try { fs.unlinkSync(lock); } catch (_) {}
  const c1 = g().isRegressionInFlight();
  check('C1 无锁文件 → 不在飞', c1.inFlight === false, c1.reason);
  // C2 死 PID（取一个几乎不可能存活的 PID）
  fs.writeFileSync(lock, '999999999', 'utf8');
  const c2 = g().isRegressionInFlight();
  check('C2 锁里是死 PID → 不在飞（不留死锁）', c2.inFlight === false, c2.reason);
  // C3 活 PID
  fs.writeFileSync(lock, String(process.pid), 'utf8');
  const c3raw = g().isRegressionInFlight();
  check('C3 锁里是自己 → 不算在飞（自己是 runner 时测量无意义）', c3raw.inFlight === false, c3raw.reason);
  const cp = require('child_process');
  const child = cp.spawn(process.execPath, ['-e', 'setTimeout(()=>{},30000)'], { stdio: 'ignore' });
  fs.writeFileSync(lock, String(child.pid), 'utf8');
  const c3 = g().isRegressionInFlight();
  check('C3b 锁里是活 PID → 在飞', c3.inFlight === true && c3.pid === child.pid, c3.reason);
  // [v6.8.97] 同场景过一遍归因：这个活 PID 是我 spawn 的**子孙**，不是祖先
  const c3attr = g().attributeFlight();
  check('C3c 锁里是子孙进程 → 归因 foreign（不是祖先，容忍不适用）',
    c3attr.relation === 'foreign' && c3attr.inFlight === true, c3attr.reason);
  const gd = g().guardMeasurement('round-740-test');
  check('C4 在飞时 guardMeasurement 拒绝', gd.ok === false);
  check('C4b 拒绝理由点名两个错数字（157/1264）', /157/.test(gd.reason) && /1264/.test(gd.reason));
  check('C4c 拒绝理由点名事故编号（r739）', /r739/.test(gd.reason));
  child.kill();
  try { fs.unlinkSync(lock); } catch (_) {}
}

console.log('── D 接线守卫（真仓，只读）');
{
  // D1 模块存在且导出
  check('D1 src/core/mutation-guard.js 导出 MutationGuard',
    fs.existsSync(path.join(ROOT, 'src/core/mutation-guard.js')) && typeof MutationGuard === 'function');

  // D2 run-all.js 改调共享模块（不再是自带的那份 walk/compare 实现）
  const runner = fs.readFileSync(path.join(ROOT, 'test/run-all.js'), 'utf8');
  check('D2 run-all.js 的 snapshotSrc 走 MutationGuard',
    /function snapshotSrc\(\)\s*\{\s*return _MG\(\)\.snapshot\(\);/.test(runner));
  check('D3 run-all.js 的 rollbackSrcIfDirty 走 MutationGuard',
    /function rollbackSrcIfDirty\(snap\)\s*\{\s*return _MG\(\)\.rollback\(snap\);/.test(runner));
  check('D4 原「只走 src/」的 walk 实现已不在 runner 里',
    !/walk\(path\.join\(ROOT, 'src'\)\)/.test(runner));
  check('D5 串行车道收尾有第二次回滚（exit 0 但清理不完整时兜底）',
    /reportRollback\(rollbackSrcIfDirty\(srcSnapshot\), '串行车道收尾'\)/.test(runner));

  // D6 两个记账脚本都过闸
  const sdn = fs.readFileSync(path.join(ROOT, 'scripts/sync-doc-numbers.js'), 'utf8');
  check('D6 sync-doc-numbers.js 的 measure() 先过 guardMeasurement',
    /guardMeasurement\('sync-doc-numbers'\)/.test(sdn) && /if \(!gate\.ok\) throw new Error\(gate\.reason\);/.test(sdn));
  const mcn = fs.readFileSync(path.join(ROOT, 'scripts/measure-claimed-numbers.js'), 'utf8');
  check('D7 measure-claimed-numbers.js 顶部过闸且退出码 2',
    /guardMeasurement\('measure-claimed-numbers'\)/.test(mcn) && /process\.exit\(2\)/.test(mcn));

  // D8 MCP 三处（AGENTS.md 约定 3）
  const reg = fs.readFileSync(path.join(ROOT, 'src/mcp/tools-registry.js'), 'utf8');
  const srv = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');
  check('D8a tools-registry 有 heartflow_mutation_guard 工具定义',
    /name: 'heartflow_mutation_guard'/.test(reg));
  check('D8b mcp-server HANDLERS 有映射',
    /heartflow_mutation_guard: handleMutationGuard,/.test(srv));
  check('D8c mcp-server 有 handler 函数',
    /function handleMutationGuard\(args\)/.test(srv));
  check('D8d 工具是只读的（不进 needsWrite 写权限清单）',
    !/needsWrite[\s\S]{0,400}'heartflow_mutation_guard'/.test(srv));

  // D9 引擎接线：在 hf 上、不在 _modules 里（不撬 161/1314 基线）
  const hfSrc = fs.readFileSync(path.join(ROOT, 'src/core/heartflow.js'), 'utf8');
  check('D9a heartflow.js 懒加载注册 MutationGuard',
    /_lazy\('mutationGuard', \(\) => require\('\.\/mutation-guard\.js'\)\)/.test(hfSrc));
  check('D9b heartflow.js 实例化并挂 this.mutationGuard',
    /this\.mutationGuard = new \(_MutationGuard\(\)\.MutationGuard\)/.test(hfSrc));
}

console.log('── E 引擎运行时（模块/路由基线不许被撬动）');
{
  const cp = require('child_process');
  const out = cp.spawnSync(process.execPath, ['-e', `
    const path=require('path');
    const {HeartFlow}=require(${JSON.stringify(path.join(ROOT, 'src/core/heartflow.js'))});
    const hf=new HeartFlow({dataDir:${JSON.stringify(path.join(ROOT, 'data'))},silent:true});
    hf.start();
    console.log(JSON.stringify({
      modules:Object.keys(hf._modules||{}).length,
      routes:HeartFlow.ALLOWED_ROUTES.size,
      hasGuard:!!hf.mutationGuard,
      inModules:!!hf._modules['mutationGuard'],
      guardOk:typeof hf.mutationGuard.guardMeasurement==='function',
      rollbackOk:typeof hf.mutationGuard.rollback==='function',
      auditOk:typeof hf.mutationGuard.auditResidue==='function',
    }));
  `], { encoding: 'utf8', timeout: 120000, maxBuffer: 1 << 24 });
  let d = null;
  for (const line of (out.stdout || '').split('\n')) {
    const i = line.indexOf('{"modules":');
    if (i >= 0) { try { d = JSON.parse(line.slice(i)); } catch (_) {} }
  }
  check('E0 引擎子进程真的跑起来了', !!d, d ? '' : (out.stderr || '').slice(0, 200));
  if (d) {
    check('E1 模块数仍是 161（没被新模块撬动）', d.modules === 161, 'modules=' + d.modules);
    check('E2 路由数仍是 1314', d.routes === 1314, 'routes=' + d.routes);
    check('E3 hf.mutationGuard 在', d.hasGuard === true);
    check('E4 mutationGuard 刻意不在 _modules（否则改基线）', d.inModules === false);
    check('E5 三个公有方法都在（guardMeasurement/rollback/auditResidue）',
      d.guardOk && d.rollbackOk && d.auditOk);
  }
}

console.log('── F 真仓当前干净性');
{
  const mg = new MutationGuard({ rootPath: ROOT, silent: true });
  const res = mg.auditResidue();
  check('F1 真仓无 48 小时内的突变残族文件', res.suspicious.length === 0,
    JSON.stringify(res.suspicious));
  // [v6.8.97 第 742 轮] F2 判据整改（原断言是存量结构性 flake，r741 实测）：
  //   原句「轮次自检时不该有锁」问错了问题。run-all.js 从 acquireSingleton
  //   起就全程持有 data/.run-all.lock 并写自己的 PID，所以本测试**作为它的
  //   子进程跑时锁必然在**——r741 全量回归实测 45/46（F2 红），单独跑 46/46 绿。
  //   本断言真正想说的是「没有**外来**回归在飞」：锁握在自己祖先链上是
  //   run-all 的正常工作方式，无关活进程持锁才是问题。
  //   改判据不改方向——F2b 与 round-742 测试的 G2 钉死「容忍祖先」没有
  //   把守卫放松：祖先持锁时记账闸照样拒绝（r739 的洞不许重开）。
  const att = mg.attributeFlight();
  check('F2 无外来回归在飞（锁只能是自己的祖先 runner，或没有）',
    att.inFlight === false || att.relation === 'ancestor',
    `relation=${att.relation} pid=${att.pid} ancestors=${JSON.stringify(att.ancestors)} reason=${att.reason}`);
  if (att.relation === 'ancestor') {
    check('F2b 祖先 runner 持锁时记账闸仍拒绝（容忍 ≠ 放松）',
      mg.guardMeasurement('round-740-test').ok === false, att.reason);
  } else {
    check('F2b 非 runner 子进程：无外来锁，记账闸放行',
      mg.guardMeasurement('round-740-test').ok === true, att.reason);
  }
  check('F3 known 桶里只有已入库驱动（git ls-files 可查）',
    res.known.every(x => /^test\/round-434-mutant-(child|runner)\.js$/.test(x.path)),
    JSON.stringify(res.known.map(x => x.path)));
}

console.log('── G 回归：原实现的洞仍在（证明守卫承重）');
{
  // 把 r739 之前 run-all.js 的旧实现照抄一份，喂同一场景，它必须漏
  function legacyRollback(snap) {
    const restored = [];
    for (const [p, content] of snap) {
      if (fs.readFileSync(p, 'utf8') !== content) { fs.writeFileSync(p, content); restored.push(p); }
    }
    return restored;
  }
  const testSideFile = path.join(TEST_DIR, 'existing.test.js');
  fs.writeFileSync(testSideFile, '// test/ 下已存在的文件（旧快照没收它）\n', 'utf8');
  const snapL = g().snapshot();
  const newResidue = path.join(SRC_DIR, 'round-448-mutant-gate.js');
  fs.writeFileSync(newResidue, '// 旧实现看不见的新增残留\n', 'utf8');
  const legacy = legacyRollback(snapL);
  check('G1 旧实现只还原内容、不删新增残留（洞复现）', legacy.length === 0 && fs.existsSync(newResidue));
  const fixed = g().rollback(snapL);
  check('G2 新实现同一场景把残留删掉', fixed.removed.length === 1 && !fs.existsSync(newResidue));
  // G3 覆盖率：旧快照只盖 src/，新快照盖 src + test + 仓库根顶层
  check('G3 新快照覆盖面含 src / test / 仓库根',
    JSON.stringify(snapL.dirs) === JSON.stringify(['src', 'test', '.']), JSON.stringify(snapL.dirs));
  const hasTestFile = [...snapL.keys()].some(p => p.indexOf(TEST_DIR) === 0);
  check('G4 快照里真的收了 test/ 下的文件（旧实现没收）', hasTestFile,
    `test 目录文件数=${[...snapL.keys()].filter(p => p.indexOf(TEST_DIR) === 0).length}`);
  fs.unlinkSync(testSideFile);
}

// ── 清理临时目录 ───────────────────────────────────────────────
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}

console.log('');
console.log(`第 740 轮突变守卫测试: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
if (fail > 0) process.exitCode = 1;
