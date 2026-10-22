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
// [2026-10-10 删除] 此处曾经有一个「主动 SIGKILL 测试孙进程」的机制。
// 该机制是两次卡死事故的根因（2026-10-08 误杀 gateway、2026-10-10 误杀
// runner 自己），且它发的 SIGKILL 不可捕获，会绕过测试的 finally 还原块、
// 把 src/ 永久留在变异态（见 test/mutation-guard-recovery.js 的记录）。
// 现在只依赖 execSync 自身的 timeout 杀外层 shell；测试若 spawn 长跑服务，
// 由测试自己用 detached + kill(-pgid) 负责，runner 不越界杀进程。

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
    // [2026-10-10 删除] 不在此处主动 SIGKILL 任何进程。
    // 见文件头说明：那是两次卡死事故的根因，且 SIGKILL 会绕过测试的
    // finally 还原块。execSync 的 timeout 已杀掉外层 shell。
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
        // [2026-10-10 删除] 同上级 catch：不主动杀进程。
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
  // [v6.7.97] 各文件自报的失败必须进 failures 清单。
  // 原来只累加数字不记名字 → 最终汇总说「N 失败」而失败列表为空、
  // 还打印「全部通过」。第 74 轮在独立安装的 node_modules 里撞到：
  // 1805 通过, 4 失败，却跟着一句「全部通过」——数字与结论矛盾。
  for (const line of out.split('\n')) {
    const fm = line.match(/^\s*[✗×xX]\s*(.+?)\s*$/);
    if (fm && !/通过|passed/i.test(line)) {
      failures.push({ name: label.trim(), error: `文件自报失败: ${fm[1].slice(0, 120)}` });
    }
  }
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

/**
 * [FIX 2026-10-10 容器 4GB 卡死事故] 全量回归单例锁。
 *
 * 事故形态：一轮全量回归（137 个测试文件，扫描 29 万个文件）内存占用接近
 * 容器 4GB 规格上限。agent 对话中断后测试进程不停、在后台继续跑；下一轮
 * 对话又起一轮，两三轮叠加瞬间撑爆 4GB → gateway 被 OOM kill 或自杀
 * （shutdown_watchdog 连续 liveness 探测失败 → exit 75）→ 重启清零后
 * 同样的用法又复现。同一天因此中断了两次会话。
 *
 * 三条纪律：
 *   1. 单例锁——同一时间只允许一个全量回归（flock 排他锁，OS 级，
 *      不依赖 agent 自觉；进程被杀锁自动释放，不会留下死锁）。
 *   2. 启动前残留自检——发现上一个 runner 还活着就拒绝启动并报出 PID，
 *      把「多轮叠加」变成一条明确的错误信息而不是静默撑爆内存。
 *   3. 手动放行——`HF_RUN_ALL_FORCE=1` 可在确认残留已死时强制启动
 *      （用于锁文件残留但进程确实不在的场景），默认不放行。
 *
 * 锁文件位置：data/.run-all.lock（data/ 已在 .gitignore 内，不入库）。
 */
const LOCK_PATH = path.join(ROOT, 'data', '.run-all.lock');
const FORCE = process.env.HF_RUN_ALL_FORCE === '1';

function _listRunnerPids() {
  // 用 ps 列出其它 run-all 进程（排除自身与 shell 包装）。
  // 不用 pgrep -f 'run-all'：那会匹配到 `bash -c ... run-all ...` 包装层
  // 与 grep 自身，误杀/误判。判据要求进程是可执行文件且命令行含 run-all.js。
  let out = '';
  try {
    out = execSync("ps -eo pid=,comm=,args=", { encoding: 'utf8', timeout: 10000 });
  } catch (_) { return []; }
  const self = process.pid;
  const pids = [];
  for (const line of out.split('\n')) {
    const m = line.match(/^\s*(\d+)\s+(\S+)\s+(.*)$/);
    if (!m) continue;
    const pid = parseInt(m[1], 10);
    const comm = m[2];
    const args = m[3];
    if (pid === self) continue;
    // comm 判据要宽：Node 26 的 comm 是 `node-MainThread`（线程名），
    // 旧版才是 `node`。两种都认，同时靠 args 里的 run-all.js 兜底
    // （防止把别的 node 进程误判成 runner）。
    if (!/^node(-MainThread|js)?$/.test(comm)) continue;
    if (!args.includes('run-all.js')) continue;
    pids.push({ pid, args: args.slice(0, 120) });
  }
  return pids;
}

function acquireSingleton() {
  fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });

  const others = _listRunnerPids();
  if (others.length > 0 && !FORCE) {
    console.error('');
    console.error('❌ 检测到已有全量回归在运行 —— 拒绝启动（防止多轮叠加撑爆容器内存）');
    for (const o of others) console.error(`   PID ${o.pid}: ${o.args}`);
    console.error('');
    console.error('   容器规格 4GB，单轮全量回归（137 文件 / 29 万文件扫描）已接近上限；');
    console.error('   两轮叠加会 OOM-kill gateway，表现为「会话莫名中断」。');
    console.error('   处置：等它跑完，或确认它是残留后用 kill <pid> 结束；');
    console.error('         确需强制启动（残留已死仅锁文件残留）设 HF_RUN_ALL_FORCE=1。');
    console.error('   日常迭代请只跑相关单文件：node test/<file>.test.js');
    console.error('');
    process.exit(2);
  }

  // OS 级排他锁：进程被杀时锁自动释放，不会留下死锁
  let fd;
  try {
    fd = fs.openSync(LOCK_PATH, 'w');
  } catch (e) {
    console.error(`❌ 无法创建锁文件 ${LOCK_PATH}: ${e.message}`);
    process.exit(2);
  }
  try {
    // 写 pid 供人工排查；Node 无内建 flock，锁的核心判据是上面的进程自检
    // （活进程在 → 拒绝；不在 → 放行），锁文件只是留下「谁在跑」的痕迹。
    fs.writeSync(fd, String(process.pid));
  } catch (_) { /* 锁文件写失败不阻断，进程自检已覆盖主路径 */ }
  // 进程退出时清掉锁文件，避免下次被残留痕迹误导
  process.on('exit', () => { try { fs.closeSync(fd); } catch (_) {} });
  return fd;
}

async function runAllTests() {
  console.log('\n=== HeartFlow module tests ===\n');

  // [FIX 2026-10-10] 单例锁 + 残留自检：先于任何测试发现逻辑执行，
  // 确保「拒绝启动」不产生任何测试副作用。
  acquireSingleton();

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
  } else if (failed > 0) {
    // [v6.7.97] 兜底：数字说失败但清单空 —— 说明有文件自报了失败数却
    // 没被识别成具体条目。宁可承认「不知道哪些失败」也不要打印
    // 「全部通过」骗人。数字与结论必须一致。
    console.log(`\n失败的测试: ${failed} 个失败未能定位到具体条目`);
    console.log('  - (来自各文件自报的汇总失败数，但未产生可识别的失败行)');
    process.exitCode = 1;
  } else {
    console.log('\n全部通过。');
  }
}

runAllTests().catch(err => {
  console.error('测试运行器错误:', err);
  process.exit(1);
});
