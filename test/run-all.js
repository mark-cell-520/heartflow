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
 * 4. [v6.8.80] 并发池。原为 execSync 单线程串行，638 文件实测 27 分钟，其中
 *    60%+ 是每文件重复的引擎冷启动开销。改为 execFile 并发（默认 4，
 *    HF_RUN_ALL_JOBS 可调，=1 退化为原串行行为），输出解析/汇总/单例锁
 *    逻辑保持不变，失败清单按任务 idx 排序保证 diff 可比。
 *
 * Usage: node test/run-all.js
 *        HF_RUN_ALL_JOBS=1 node test/run-all.js   # 强制串行（排查 flaky 用）
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const TEST_DIR = __dirname;
const ROOT = path.join(__dirname, '..');
const CHILD_TIMEOUT = 90000;
// [v6.8.80] 并发数。默认 4：实测 8 并发时 CPU 争抢反而每文件 20s（单线程
// 2.5s），4 是 8 核机的甜点；引擎加载是 CPU 密集型，留一半核给系统。
const JOBS = Math.max(1, parseInt(process.env.HF_RUN_ALL_JOBS || '4', 10) || 4);
// [2026-10-10 删除] 此处曾经有一个「主动 SIGKILL 测试孙进程」的机制。
// 该机制是两次卡死事故的根因（2026-10-08 误杀 gateway、2026-10-10 误杀
// runner 自己），且它发的 SIGKILL 不可捕获，会绕过测试的 finally 还原块、
// 把 src/ 永久留在变异态（见 test/mutation-guard-recovery.js 的记录）。
// 现在只依赖 execFile 自身的 timeout 杀子进程（[v6.8.80] execSync →
// execFile 改造后）；测试若 spawn 长跑服务，由测试自己用 detached +
// kill(-pgid) 负责，runner 不越界杀进程。

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
 * [v6.8.80] 并发执行一条命令（execFile async 版，替代原 execSync）。
 * 语义对齐：err 时 stdout 仍有部分输出；timeout 到期发 SIGTERM。
 */
function execCapture(argv, timeout) {
  return new Promise((resolve) => {
    execFile('node', argv, {
      cwd: ROOT,
      encoding: 'utf8',
      timeout,
      maxBuffer: 48 * 1024 * 1024,
      windowsHide: true,
    }, (err, stdout) => {
      resolve({ stdout: (stdout || '').toString(), err: err || null });
    });
  });
}

/** 在子进程中执行一条命令，解析其 `N 通过, M 失败` 汇总行 */
async function runChild(task) {
  const { label, argv, timeout = CHILD_TIMEOUT, idx, total } = task;
  console.log(`\n[${idx + 1}/${total}] ${label}`);
  let out = '';
  let res = await execCapture(argv, timeout);
  out = res.stdout;
  if (res.err) {
    const errMsg = (res.err.message || '').split('\n')[0];
    // [2026-10-10 删除] 不在此处主动 SIGKILL 任何进程。
    // 见文件头说明：那是两次卡死事故的根因，且 SIGKILL 会绕过测试的
    // finally 还原块。execFile 的 timeout 已杀子进程。
    // [v6.7.94] 环境噪声重试：子进程被系统级停顿杀死时 stdout 为空且无汇总行，
    // 一次就计失败——这类失败重跑必然恢复（第 70-72 轮三次实测：同一文件
    // ETIMEDOUT 后单独 mount 1/0、连跑两遍 1818/0）。
    // 只在「零输出」时重试：有输出但无汇总是真静默（第 48 轮口径），
    // 有汇总但有失败是真断言失败——两者都不重试。
    const hadOutput = out.trim().length > 0;
    if (!hadOutput) {
      console.log(`  [重试] ${label.trim()}: 子进程零输出被中断（环境噪声），重跑一次`);
      res = await execCapture(argv, timeout);
      out = res.stdout;
    }
    if (!/(\d+) 通过, (\d+) 失败/.test(out)) {
      console.log(`  [异常] ${label.trim()}: ${errMsg}`);
      failed++;
      failures.push({ idx, name: label.trim(), error: errMsg });
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
      idx,
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
      failures.push({ idx, name: label.trim(), error: `文件自报失败: ${fm[1].slice(0, 120)}` });
    }
  }
  // [v6.7.83] 「0 通过, 0 失败, 共 0 个」= mount 函数定义了但一个 test
  // 都没注册。这在数字上合法（0 失败），实际等于该文件什么都没测。
  // 实测探针 silent.test.js 就是如此。计入 1 个失败，逼它要么注册用例、
  // 要么改名（不带 .test.js 后缀就不会被扫）。
  if (parsed.passed === 0 && parsed.failed === 0) {
    failed += 1;
    failures.push({
      idx,
      name: label.trim(),
      error: '(注册了 0 个用例——mount 函数未调用 test()；请补用例或移出 test/ 目录)',
    });
  }
  for (const line of out.split('\n')) {
    const fm = line.match(/^\s*✗\s+(.+?)\s*$/);
    if (fm) failures.push({ idx, name: fm[1], error: `(${label.trim()})` });
  }
  const keep = out.split('\n').filter(l => l.includes('通过') || l.includes('✗') || l.includes('失败'));
  console.log(keep.join('\n') || '  (无输出)');
}

/**
 * [v6.8.80] 识别「写入目标是 src/ 源码」的测试（变更测试）。
 *
 * 并发池事故：两个变更测试并发跑同一 src 文件时，writeFileSync 互相覆盖，
 * 断言读到对方的突变 → 批量假失败（实测 crossdim 单跑 3/0 过、与
 * vocab-tier 并发直接 EXIT=1）。更隐蔽的是「变更测试 vs 并发读者」：
 * 突变窗口内任何 import 同模块的测试都会看到被污染的源码。
 * 因此变更测试必须独占串行车道（见 MAIN 段两阶段调度）。
 *
 * 判定精确到写入目标：写调用第一个参数解析到 src/ 路径才算。
 * （直接字面量 / path.join 内联 / 变量定义三种形态都认。）
 */
const _WRITE_CALL_RE = /(?:writeFileSync|renameSync|copyFileSync|appendFileSync|rmSync|unlinkSync|rmdirSync|mkdirSync|cpSync)\s*\(\s*([^,)]+)/g;
const _SRC_LIT_RE = /['"`][^'"`]*src[/\\][^'"`]*\.js['"`]|['"`]src['"`]/;
function detectWriteToSrc(src) {
  _WRITE_CALL_RE.lastIndex = 0;
  let m;
  while ((m = _WRITE_CALL_RE.exec(src)) !== null) {
    const arg = m[1].trim();
    if (/^['"`]/.test(arg)) {           // 直接字面量参数
      if (_SRC_LIT_RE.test(arg)) return true;
      continue;
    }
    if (/^path\.(join|resolve)\s*\(/.test(arg)) {  // path.join(...) 内联
      if (_SRC_LIT_RE.test(arg)) return true;
      continue;
    }
    const varName = arg.replace(/[^\w$]/g, '');    // 变量：查定义
    if (varName) {
      const defRe = new RegExp(`(?:const|let|var)\\s+${varName}\\s*=\\s*([^;]+);`, 'g');
      let d;
      while ((d = defRe.exec(src)) !== null) {
        if (_SRC_LIT_RE.test(d[1])) return true;
      }
    }
  }
  return false;
}

/** [v6.8.80] MCP 服务类测试：自启服务器，端口与启动耗时互踩。 */
function isServerTest(rel) {
  return /mcp|server/i.test(rel);
}

/**
 * [v6.8.80] 突变残留兜底：快照 src/ 全文，任务失败/被杀后逐文件比对，
 * 有未还原的写入就还原。
 *
 * 实测教训：并发池内变更测试子进程被 CHILD_TIMEOUT SIGKILL 时 finally
 * 没跑到，4 个 src 文件带着负例突变残留（删 regex/删接线/删归并）污染
 * 仓库，之后所有结果不可信，只能 git checkout 人工恢复。本兜底让 runner
 * 自己善后：串行车道每个失败任务后 + 并发池整段结束后各回滚一次。
 */
function snapshotSrc() {
  const snap = new Map();
  const walk = (dir) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.js')) {
        try { snap.set(p, fs.readFileSync(p, 'utf8')); } catch (err) { /* 读不了的文件不纳入快照 */ }
      }
    }
  };
  walk(path.join(ROOT, 'src'));
  return snap;
}

function rollbackSrcIfDirty(snap) {
  if (!snap) return [];
  const restored = [];
  for (const [p, content] of snap) {
    try {
      if (fs.readFileSync(p, 'utf8') !== content) {
        fs.writeFileSync(p, content);
        restored.push(path.relative(ROOT, p));
      }
    } catch (err) { /* 文件被删则无法回滚，交给 guard 测试报告 */ }
  }
  return restored;
}

/**
 * [v6.7.83] 按文件实际形态选 runner。
 *
 * 原来 CORE_TESTS 显式列表和动态接入段各写一遍三分支，且显式列表
 * 恒用 runSubTest（裸 node）——导致 21 个核心测试里凡是 mount/jest
 * 形态的都不吐标准结果行，被静默跳过（实测 6 个长期隐形）。
 * 抽成一处，两条路都走它。
 * [v6.8.80] 改为返回任务对象（不再直接执行），由并发池统一调度；
 * 同时打上 rel/isMutator 标记供两阶段划分使用。
 */
function taskWithBestRunner(name, rel, idx, total) {
  let src = '';
  try { src = fs.readFileSync(path.join(TEST_DIR, rel), 'utf8'); } catch (e) {}
  // [v6.7.83] 三种 mount 写法都要认：
  //   module.exports = function (...)
  //   module.exports = run                    （命名函数导出）
  //   module.exports = ({ test }) => { ... }  （箭头函数导出）
  // 漏认任一种都会走裸 node 而文件自己不执行 → 零输出 → 隐形。
  const isMount = /module\.exports\s*=\s*(?:function\b|[A-Za-z_$][\w$]*\s*;|\(?[^)]*\)?\s*=>)/.test(src);
  let t;
  if (isMount) {
    t = { label: name, argv: [path.join(TEST_DIR, '_mount.js'), path.join(TEST_DIR, rel)], idx, total };
  } else if (/\bdescribe\s*\(/.test(src) && !/require\(['"][^'"]*mini-expect/.test(src)) {
    t = { label: name, argv: ['-r', path.join(TEST_DIR, '_jest-globals.js'), path.join(TEST_DIR, rel)], idx, total };
  } else {
    t = { label: name, argv: [path.join(TEST_DIR, rel)], idx, total };
  }
  t.rel = rel;
  t.isMutator = detectWriteToSrc(src);
  return t;
}

/**
 * [v6.8.80] 并发池：JOBS 个 worker 从任务队列取任务执行。
 * worker 数自动收敛到任务数；单个 worker 自身异常按 1 失败记账，
 * 不拖垮其他 worker（runChild 内部已兜住子进程错误，这里是兜底）。
 */
async function runQueue(tasks) {
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const t = tasks[next++];
      try {
        await runChild(t);
      } catch (e) {
        failed++;
        failures.push({
          idx: t.idx,
          name: t.label.trim(),
          error: `runner 异常: ${(e.message || '').split('\n')[0]}`,
        });
      }
    }
  }
  const n = Math.min(JOBS, Math.max(1, tasks.length));
  await Promise.all(Array.from({ length: n }, worker));
}

// === MAIN ===

/**
 * [FIX 2026-10-10 容器 4GB 卡死事故] 全量回归单例锁。
 *
 * 事故形态：一轮全量回归（当时 137 个测试文件，扫描 29 万个文件）内存占用接近
 * 容器 4GB 规格上限。agent 对话中断后测试进程不停、在后台继续跑；下一轮
 * 对话又起一轮，两三轮叠加瞬间撑爆 4GB → gateway 被 OOM kill 或自杀
 * （shutdown_watchdog 连续 liveness 探测失败 → exit 75）→ 重启清零后
 * 同样的用法又复现。同一天因此中断了两次会话。
 *
 * 三条纪律：
 *   1. 单例锁——同一时间只允许一个全量回归。判据是「锁文件里的 PID 还活着」，
 *      OS 级探活（process.kill(pid, 0)），不依赖 agent 自觉；进程被杀后
 *      PID 自然死掉，不会留下死锁（锁文件残留但 PID 已死 → 放行）。
 *   2. 启动前残留自检——发现上一个 runner 还活着就拒绝启动并报出 PID，
 *      把「多轮叠加」变成一条明确的错误信息而不是静默撑爆内存。
 *   3. 手动放行——`HF_RUN_ALL_FORCE=1` 可在确认残留已死时强制启动
 *      （用于 PID 被复用等误判场景），默认不放行。
 *
 * 锁文件位置：data/.run-all.lock（data/ 已在 .gitignore 内，不入库）。
 *
 * [v6.8.80] 探测方式整改（Windows 上原锁完全失效）：
 *   原实现用 `ps -eo pid=,comm=,args=` 扫进程表找其它 runner。两个致命问题：
 *   a) MSYS 的 ps 没有 -o 选项，`ps -eo` 必抛 "unknown option"——异常被
 *      catch 吞掉返回 []，自检恒为空，拒绝启动的分支从未执行过；
 *   b) 原生 node.exe 进程在 MSYS ps 的进程表里根本不可见，换任何 ps 写法
 *      都扫不到，必须换机制。
 *   且原「flock」只是 openSync(LOCK_PATH, 'w') 写自己的 PID——既无互斥，
 *   还会把上一个 runner 的 PID 记录截断销毁（'w' 模式），证据都没留下。
 *   新机制：锁文件存 PID + process.kill(pid, 0) 探活，跨平台零外部依赖。
 *   全量回归只可能经本文件启动，PID 记录覆盖所有入口（cron/manual/agent）。
 *   误判方向是 fail-closed（PID 被复用 → 拒绝启动，HF_RUN_ALL_FORCE=1 放行），
 *   比原来 fail-open（两个 runner 叠加撑爆容器）安全。
 */
const LOCK_PATH = path.join(ROOT, 'data', '.run-all.lock');
const FORCE = process.env.HF_RUN_ALL_FORCE === '1';

function _pidAlive(pid) {
  try {
    process.kill(pid, 0); // 信号 0：只探活不发送
    return true;
  } catch (e) {
    // EPERM = 进程存在但无权发信号（Windows 上常见）→ 也算活着
    return e.code === 'EPERM';
  }
}

function _findOtherRunners() {
  // 主判据：锁文件里的 PID 探活（先读后写，绝不在探测前截断锁文件）
  let oldPid = null;
  try {
    if (fs.existsSync(LOCK_PATH)) {
      oldPid = parseInt(fs.readFileSync(LOCK_PATH, 'utf8').trim(), 10);
    }
  } catch (_) { /* 读锁失败：放弃该判据，由其余路径兜底 */ }
  if (!Number.isInteger(oldPid) || oldPid <= 0 || oldPid === process.pid) return [];
  if (!_pidAlive(oldPid)) return [];
  return [{ pid: oldPid, args: '(锁文件记录的 PID；命令行请在任务管理器/node 进程里核对)' }];
}

function acquireSingleton() {
  fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });

  const others = _findOtherRunners();
  if (others.length > 0 && !FORCE) {
    console.error('');
    console.error('❌ 检测到已有全量回归在运行 —— 拒绝启动（防止多轮叠加撑爆容器内存）');
    for (const o of others) console.error(`   PID ${o.pid}: ${o.args}`);
    console.error('');
    console.error('   容器规格 4GB，单轮全量回归（609 个测试文件、数十万文件扫描）已接近上限；');
    console.error('   两轮叠加会 OOM-kill gateway，表现为「会话莫名中断」。');
    console.error('   处置：等它跑完，或确认它是残留后用 kill <pid> 结束；');
    console.error('         确需强制启动（残留已死仅锁文件残留 / PID 被复用）设 HF_RUN_ALL_FORCE=1。');
    console.error('   日常迭代请只跑相关单文件：node test/<file>.test.js');
    console.error('');
    process.exit(2);
  }

  // 记录自己的 PID 供下次自检与人工排查。探测已在上面做完，此处覆盖写入安全。
  // 'wx' = 排他创建：文件已存在立刻 EEXIST，把「两个 runner 同时启动」的
  // 毫秒级竞态关掉（后到者走 EEXIST 分支重新探测，而不是无锁放行）。
  let fd;
  try {
    fd = fs.openSync(LOCK_PATH, 'wx');
  } catch (e) {
    if (e.code !== 'EEXIST') {
      console.error(`❌ 无法创建锁文件 ${LOCK_PATH}: ${e.message}`);
      process.exit(2);
    }
    // 竞态分支：创建瞬间锁已存在 → 重新探测一次（双检），活着就拒绝
    const racers = _findOtherRunners();
    if (racers.length > 0 && !FORCE) {
      console.error(`❌ 并发启动竞态：锁文件刚被创建，PID ${racers[0].pid} 仍在运行，拒绝启动`);
      process.exit(2);
    }
    try { fd = fs.openSync(LOCK_PATH, 'w'); } catch (e2) {
      console.error(`❌ 无法创建锁文件 ${LOCK_PATH}: ${e2.message}`);
      process.exit(2);
    }
  }
  try {
    fs.writeSync(fd, String(process.pid));
  } catch (_) { /* 锁文件写失败不阻断，进程自检已覆盖主路径 */ }
  // 进程退出时清掉锁文件（仅当记录的还是自己，避免误删别人的），
  // 防止残留 PID 被复用后误挡后续启动。SIGKILL 场景 handler 不跑，
  // 但 PID 随之死亡，探活自然放行，不留死锁。
  process.on('exit', () => {
    try {
      const cur = parseInt(fs.readFileSync(LOCK_PATH, 'utf8').trim(), 10);
      if (cur === process.pid) fs.unlinkSync(LOCK_PATH);
    } catch (_) { /* 锁文件已不存在或读失败：无需清理 */ }
    try { fs.closeSync(fd); } catch (_) {}
  });
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
  const tasks = [];
  for (const [label, rel] of CORE_TESTS) {
    if (!fs.existsSync(path.join(TEST_DIR, rel))) continue;
    explicit.add(rel);
    tasks.push(taskWithBestRunner(`  ${label}`, rel, tasks.length, 0));
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
    tasks.push(taskWithBestRunner('  · ' + rel, rel, tasks.length, 0));
  }
  // [v6.8.80] 收齐后再统一调度：先回填 total（进度显示用），
  // 再由并发池执行。JOBS=1 时退化为原串行行为（语义不变）。
  const totalTasks = tasks.length;
  for (const t of tasks) t.total = totalTasks;
  // [v6.8.86] 分段复跑：HF_RUN_ALL_SLICE="k/n"（1-based）只跑第 k 段。
  // 动机：618 个文件全量约 25-30 分钟，超出单次前台调用上限（600s），
  // 而本机后台执行通道对 node 不可用（wrapper 秒杀，exit 1 + "stdin is
  // not a tty"，2026-10-28 实测三种写法全挂）。分段只改任务集合，
  // 不改 runner/判定/两阶段语义——各段并集即全量，逐段人工汇总。
  const sliceEnv = (process.env.HF_RUN_ALL_SLICE || '').match(/^(\d+)\s*\/\s*(\d+)$/);
  if (sliceEnv) {
    const sk = Math.max(1, parseInt(sliceEnv[1], 10));
    const sn = Math.max(1, parseInt(sliceEnv[2], 10));
    if (sk > sn) { console.error(`HF_RUN_ALL_SLICE 段号 ${sk} 超出总段数 ${sn}`); process.exit(2); }
    const before = tasks.length;
    const kept = tasks.filter((t, i) => (i % sn) === (sk - 1));
    for (let i = 0; i < kept.length; i++) { kept[i].idx = i; kept[i].total = kept.length; }
    tasks.length = 0; tasks.push(...kept);
    console.log(`[分段] HF_RUN_ALL_SLICE=${sk}/${sn}：${before} → ${tasks.length} 个文件`);
  }
  // [v6.8.80] 两阶段调度：变更测试（写 src/ 源码）与 MCP 服务类测试
  // 独占串行车道——前者与并发读者/同类互踩（详见 detectWriteToSrc 注释），
  // 后者端口与启动耗时互踩。其余测试走并发池。
  const serialTasks = tasks.filter(t => t.isMutator || isServerTest(t.rel));
  const parallelTasks = tasks.filter(t => !(t.isMutator || isServerTest(t.rel)));
  const poolSize = Math.min(JOBS, Math.max(1, parallelTasks.length));
  console.log(`共 ${totalTasks} 个测试文件：并发池 ${parallelTasks.length} + 串行车道 ${serialTasks.length}（JOBS=${JOBS}，可调 1-16）`);
  console.log('串行车道 = 变更测试（写 src/）+ MCP 服务类，防并发互踩');
  // [v6.8.80] 突变残留兜底：跑之前快照 src/，失败/被杀后回滚未还原的写入。
  const srcSnapshot = snapshotSrc();
  const startedAt = Date.now();
  await runQueue(parallelTasks);
  {
    const restored = rollbackSrcIfDirty(srcSnapshot);
    for (const r of restored) console.log(`[残留回滚] 并发池阶段发现未还原突变，已还原: ${r}`);
  }
  if (serialTasks.length > 0) {
    console.log('\n=== 变更/服务类测试（串行车道）===');
    for (const t of serialTasks) {
      let ok = false;
      try {
        await runChild(t);
        ok = true;
      } catch (e) {
        failed++;
        failures.push({
          idx: t.idx,
          name: t.label.trim(),
          error: `runner 异常: ${(e.message || '').split('\n')[0]}`,
        });
      }
      if (!ok) {
        const restored = rollbackSrcIfDirty(srcSnapshot);
        for (const r of restored) console.log(`[残留回滚] ${t.label.trim()} 留下未还原突变，已还原: ${r}`);
      }
    }
  }
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`\n[耗时] ${elapsed}s（并发 ${poolSize}）`);

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
    // [v6.8.80] 并发后 failures 是完成序，按任务 idx 排序恢复文件序，
    // 与串行时代的输出可比对。
    for (const f of failures.slice().sort((a, b) => a.idx - b.idx)) {
      console.log(`  - ${f.name} ${f.error}`);
    }
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
