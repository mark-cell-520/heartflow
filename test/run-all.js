/**
 * test-runner.js — zero-dependency test runner
 *
 * Design notes (2026-09-17):
 *
 * 1. Recursive discovery. This previously used a non-recursive readdirSync, so the
 *    50 tests under test/core/, test/memory/, test/utils/ and others never executed.
 *
 * 2. test/archive/ is skipped. It holds historical tests whose target modules were
 *    deleted; their MODULE_NOT_FOUND is not a regression signal.
 *
 * 3. Every test file runs in its own child process. Requiring ~137 engine-loading
 *    files into the runner process exhausted the heap and got the runner OOM-killed
 *    mid-run, which is why the reported totals used to vary between runs.
 *
 * Usage: node test/run-all.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const TEST_DIR = __dirname;
const ROOT = path.join(__dirname, '..');
const CHILD_TIMEOUT = 90000;
// [FIX 2026-09-21] execSync 的 timeout 只杀掉外层 shell，测试自己 spawn 的
// 服务进程会被孤儿化（PPID=1）并继续监听端口，实测泄漏了 8 个 mcp-server
// 实例、连续跑了 3 天没人发现。见 runChild() 里的 killOrphans() 清理。

let passed = 0;
let failed = 0;
const failures = [];

/** 递归收集测试文件，跳过 test/archive/（历史失效测试，目标模块已删除） */
function collectTestFiles(dir, base = dir) {
  const out = [];
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'archive') continue;
      out.push(...collectTestFiles(full, base));
    } else if (ent.name.endsWith('.test.js') && ent.name !== 'run-all.test.js') {
      out.push(path.relative(base, full).split(path.sep).join('/'));
    }
  }
  return out.sort();
}

/**
 * [FIX 2026-09-21] 杀掉本 runner 派生的、仍然活着的孙进程。
 * 背景：execSync 超时只杀掉外层 shell，测试自己 spawn 的服务进程
 * （例如 mcp-server）会被孤儿化（PPID=1）并继续监听端口。
 * 实测因此泄漏了 8 个 mcp-server 实例、连续跑了 3 天没人发现。
 * 只杀本 runner 的后代，绝不碰别的用户的进程。
 */
function killOrphans() {
  let pids = [];
  try {
    const r = spawnSync('pgrep', ['-P', String(process.pid)], { encoding: 'utf8' });
    if (r.status !== 0 || !r.stdout) return;
    pids = r.stdout.trim().split('\n').filter(Boolean);
  } catch (_) { return; }
  const all = [...pids];
  for (const p of pids) {
    try {
      const r2 = spawnSync('pgrep', ['-P', p], { encoding: 'utf8' });
      if (r2.status === 0 && r2.stdout) all.push(...r2.stdout.trim().split('\n').filter(Boolean));
    } catch (_) {}
  }
  for (const pid of all) {
    try { process.kill(Number(pid), 'SIGKILL'); } catch (_) {}
  }
}

/** 在子进程中执行一条命令，解析其 `N 通过, M 失败` 汇总行 */
function runChild(label, cmd, timeout = CHILD_TIMEOUT) {
  console.log(`\n${label}`);
  let out = '';
  try {
    out = execSync(cmd, {
      cwd: ROOT,
      encoding: 'utf8',
      timeout,
      maxBuffer: 48 * 1024 * 1024,
    });
  } catch (e) {
    out = (e.stdout || '').toString();
    // 超时/被杀后清理孙进程，避免孤儿服务进程长期占用端口
    killOrphans();
    // [v6.7.94] 环境噪声重试：子进程被系统级停顿杀死时 stdout 为空且无汇总行，
    // 一次就计失败——这类失败重跑必然恢复（第 70-72 轮三次实测：同一文件
    // ETIMEDOUT 后单独 mount 1/0、连跑两遍 1818/0）。
    // 只在「零输出」时重试：有输出但无汇总是真静默（第 48 轮口径），
    // 有汇总但有失败是真断言失败——两者都不重试。
    const hadOutput = out.trim().length > 0;
    if (!hadOutput) {
      console.log(`  [重试] ${label.trim()}: 子进程零输出被中断（环境噪声），重跑一次`);
      try {
        out = execSync(cmd, {
          cwd: ROOT,
          encoding: 'utf8',
          timeout,
          maxBuffer: 48 * 1024 * 1024,
        });
      } catch (e2) {
        out = (e2.stdout || '').toString();
        killOrphans();
      }
    }
    if (!/(\d+) 通过, (\d+) 失败/.test(out)) {
      console.log(`  [异常] ${label.trim()}: ${(e.message || '').split('\n')[0]}`);
      failed++;
      failures.push({ name: label.trim(), error: (e.message || '').split('\n')[0] });
      return;
    }
  }
  // [v6.7.86] 同时识别多种汇总格式：
  //   「N 通过, M 失败」       —— harness 标准中文汇总
  //   「N passed, M failed」   —— 自建 harness 英文汇总
  //   「N passed / M failed」  —— 带斜杠分隔（compliance.test.js）
  //   「N/M passed」           —— 只报通过数的分数式（blindspot-upgrade）
  //   「PASS/SKIP 单行」       —— 裸跑型 smoke test
  // 只认第一种曾让 6+ 个测试文件长期隐形：它们跑完了、有汇总、有 exit code。
  let m = out.match(/(\d+)\s*(?:通过|passed)\s*[/,]?\s*(\d+)\s*(?:失败|failed)/);
  let ratio = null;
  if (!m) {
    // 分数式：N/M passed、N/M tests passed、合计 N/M、N/总数
    const r = out.match(/(\d+)\s*\/\s*(\d+)\s*(?:passed|通过|tests?\b|个|条)/)
      || out.match(/合计\s*(\d+)\s*\/\s*(\d+)/);
    if (r) {
      const pass = parseInt(r[1], 10), total = parseInt(r[2], 10);
      ratio = { passed: pass, failed: Math.max(0, total - pass) };
    }
  }
  const parsed = m
    ? { passed: parseInt(m[1], 10), failed: parseInt(m[2], 10) }
    : ratio;
  if (!parsed) {
    // [v6.7.83] 第四种格式：裸跑型测试的 PASS/SKIP 单行报告。
    // 形如 `console.log('PASS version.test.js (module loads)')` 或
    // `console.log('SKIP x (' + code + ')')`。这类文件语义上是"通过"
    // 但完全没有计数——core/ utils/ memory/ 下 40+ 个测试全属此类。
    // PASS → 计 1 个通过；SKIP → 不计失败但打出来（环境依赖缺失时
    // 模块加载不了，判失败会掩盖真实情况）。
    const passLines = (out.match(/^\s*PASS\b.*$/gm) || []).length;
    const skipLines = (out.match(/^\s*SKIP\b.*$/gm) || []);
    if (passLines > 0 || skipLines.length > 0) {
      passed += passLines;
      if (skipLines.length > 0) {
        console.log(skipLines.slice(0, 2).join('\n'));
      }
      // 有输出但全 SKIP：不计失败，但要可见（已在上面打出）
      return;
    }
    // [v6.7.83] 吐不出结果行 = 静默。实测四类探针：exit1 被 execSync 的
    // 异常路径捕获（正确），但「跑完断言却不吐 N 通过, M 失败」的测试
    // 走到这里只打印尾巴就 return —— 不计入 passed、不计入 failed，
    // 永久隐形。一个写了断言却忘了汇总的测试文件，等于没写。
    // 处置：计入 1 个失败，并要求可见原因。
    const tail = out.trim().split('\n').slice(-3).join('\n');
    if (tail) console.log(tail);
    failed += 1;
    failures.push({
      name: label.trim(),
      error: '(未输出「N 通过, M 失败」结果行——测试跑了但无法确认断言数；请补 console.log 汇总)',
    });
    return;
  }
  passed += parsed.passed;
  failed += parsed.failed;
  // [v6.7.83] 「0 通过, 0 失败, 共 0 个」= mount 函数定义了但一个 test
  // 都没注册。这在数字上合法（0 失败），实际等于该文件什么都没测。
  // 实测探针 silent.test.js 就是如此。计入 1 个失败，逼它要么注册用例、
  // 要么改名（不带 .test.js 后缀就不会被扫）。
  if (parsed.passed === 0 && parsed.failed === 0) {
    failed += 1;
    failures.push({
      name: label.trim(),
      error: '(注册了 0 个用例——mount 函数未调用 test()；请补用例或移出 test/ 目录)',
    });
  }
  for (const line of out.split('\n')) {
    const fm = line.match(/^\s*✗\s+(.+?)\s*$/);
    if (fm) failures.push({ name: fm[1], error: `(${label.trim()})` });
  }
  const keep = out.split('\n').filter(l => l.includes('通过') || l.includes('✗') || l.includes('失败'));
  console.log(keep.join('\n') || '  (无输出)');
}

/**
 * [v6.7.83] 按文件实际形态选 runner。
 *
 * 原来 CORE_TESTS 显式列表和动态接入段各写一遍三分支，且显式列表
 * 恒用 runSubTest（裸 node）——导致 21 个核心测试里凡是 mount/jest
 * 形态的都不吐标准结果行，被静默跳过（实测 6 个长期隐形）。
 * 抽成一处，两条路都走它。
 */
function runWithBestRunner(name, rel) {
  let src = '';
  try { src = fs.readFileSync(path.join(TEST_DIR, rel), 'utf8'); } catch (e) {}
  // [v6.7.83] 三种 mount 写法都要认：
  //   module.exports = function (...)
  //   module.exports = run                    （命名函数导出）
  //   module.exports = ({ test }) => { ... }  （箭头函数导出）
  // 漏认任一种都会走裸 node 而文件自己不执行 → 零输出 → 隐形。
  const isMount = /module\.exports\s*=\s*(?:function\b|[A-Za-z_$][\w$]*\s*;|\(?[^)]*\)?\s*=>)/.test(src);
  if (isMount) {
    runMountTest(name, rel);
  } else if (/\bdescribe\s*\(/.test(src) && !/require\(['"][^'"]*mini-expect/.test(src)) {
    runJestStyleTest(name, rel);
  } else {
    runSubTest(name, rel);
  }
}

function runSubTest(name, relPath, timeout = CHILD_TIMEOUT) {
  runChild(name, `node ${JSON.stringify(path.join(TEST_DIR, relPath))}`, timeout);
}

/** 执行导出 mount 函数的测试文件（子进程 + 注入 test harness） */
function runMountTest(name, relPath, timeout = CHILD_TIMEOUT) {
  runChild(
    name,
    `node ${JSON.stringify(path.join(TEST_DIR, '_mount.js'))} ${JSON.stringify(path.join(TEST_DIR, relPath))}`,
    timeout
  );
}

/** 以 `node -r` 预加载全局注入的方式执行 jest 风格测试文件 */
function runJestStyleTest(name, relPath, timeout = CHILD_TIMEOUT) {
  runChild(
    name,
    `node -r ${JSON.stringify(path.join(TEST_DIR, '_jest-globals.js'))} ${JSON.stringify(path.join(TEST_DIR, relPath))}`,
    timeout
  );
}

// === MAIN ===
async function runAllTests() {
  console.log('\n=== HeartFlow module tests ===\n');

  // 1-4. 已清理模块，保留占位说明历史
  console.log('CodeWriter / CodeGenerator / HeartLogic / DesireCognition — 模块已清理');

  // 显式列出的核心测试（与历史覆盖保持一致）
  const CORE_TESTS = [
    ['KnowledgeOntology', 'knowledge-ontology.test.js'],
    ['KnowledgeQuery', 'knowledge-query.test.js'],
    ['ClassicsValueMapper', 'knowledge/classics-value-mapper.test.js'],
    ['ClassicsRules', 'knowledge/classics-rules.test.js'],
    ['DualPerspectiveAuditor', 'dual-perspective.test.js'],
    ['SignalAbsorber', 'signal-absorber.test.js'],
    ['AgentBoundaryGuard', 'agent-boundary-guard.test.js'],
    ['MetacognitiveExecutive', 'metacognitive-executive.test.js'],
    ['RecoveredModules', 'recovered-modules.test.js'],
    ['RecoveredModules2', 'recovered-modules-2.test.js'],
    ['KnowledgeGraphAdapter', 'knowledge-graph-adapter.test.js'],
    ['SourceAnnotator', 'source-annotator.test.js'],
    ['SecurityAudit', 'security-audit.test.js'],
    ['IdentityCore', 'identity-core.test.js'],
    ['BigFivePersonality', 'big-five.test.js'],
    ['SelfModel', 'self-model.test.js'],
    ['LogicReasoning', 'logic-reasoning.test.js'],
    ['ReflectionLoop', 'reflection-loop.test.js'],
    ['ModuleRegistry (P4)', 'module-registry.test.js'],
    ['RouteWhitelist (P4)', 'route-whitelist.test.js'],
    ['SafeFS (P4)', 'safe-fs.test.js'],
  ];
  const explicit = new Set();
  for (const [label, rel] of CORE_TESTS) {
    if (!fs.existsSync(path.join(TEST_DIR, rel))) continue;
    explicit.add(rel);
    runWithBestRunner(`  ${label}`, rel);
  }

  // 动态接入其余测试文件（全部子进程隔离）
  console.log('\n=== 动态接入其余测试文件 ===');
  const allTests = collectTestFiles(TEST_DIR);
  for (const rel of allTests) {
    if (explicit.has(rel)) continue;
    // [v6.7.83] 子目录文件也走选 runner 逻辑。
    // 原来 `rel.includes('/')` 恒用 runSubTest，导致子目录里的
    // mount/jest 形态测试（如 knowledge/classics-value-mapper.test.js）
    // 同样静默跳过——这与「前 400 字符误判」是同一家族：
    // 用路径特征代替文件形态判断。
    runWithBestRunner('  · ' + rel, rel);
  }

  // 汇总
  console.log('\n' + '='.repeat(50));
  console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
  // [v6.7.87] 落一份用例数缓存，供 doc-numbers-accuracy 守卫与
  // measure-claimed-numbers 读取——README 横幅的 "N passing tests"
  // 从此有实测值可比对（此前只有测试文件数，用例数无从校验，
  // 从 1,138 胀到 1754 都没人发现）。
  try {
    fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });
    fs.writeFileSync(
      path.join(__dirname, '..', 'data', 'test-count.json'),
      JSON.stringify({ passed, failed, total: passed + failed, at: new Date().toISOString() }, null, 2)
    );
  } catch (_) { /* 缓存写失败不影响测试结果 */ }
  if (failures.length > 0) {
    console.log('\n失败的测试:');
    for (const f of failures) console.log(`  - ${f.name} ${f.error}`);
    process.exitCode = 1;
  } else {
    console.log('\n全部通过。');
  }
}

runAllTests().catch(err => {
  console.error('测试运行器错误:', err);
  process.exit(1);
});
