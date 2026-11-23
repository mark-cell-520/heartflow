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
 * [AUDIT-FIX 2026-11-23] 全量测试审计（903 文件 / 21353 用例 / 195 失败 /
 * 65.7 分钟）暴露出测试基础设施的三个缺陷，本轮一并修掉：
 *
 *   缺陷 1「头条数字不可复现」：四次全量 passed 在 21158~28751 间摆动（36%），
 *     且单调下降。根因是 JOBS=4 超过了本容器的 CPU 配额（2 核），单文件墙钟
 *     被拉长近一倍，150s 的 CHILD_TIMEOUT 会把它们 SIGTERM 掉，几十条用例
 *     整体从统计里消失。修法：并发降到 2、超时提到 600s，并把「被超时杀死」
 *     单独记成 timeout 桶、不再混进 failed。
 *
 *   缺陷 2「26% 的失败是统计误报」：审计实测 195 个失败里约 50 个不成立——
 *     ① 汇总行解析只认中文一族，18 个文件「断言全过却被统计成失败」
 *        （逐个单跑复核 rc=0，含 9 个 node:test 文件的 `# pass N` TAP 汇总）；
 *     ② 两个重复推送 ✗ 的循环让同一条失败进清单两遍（239 条 vs 真实 195 个）；
 *     ③ 用 ❌ 而不用 ✗ 的文件，失败明细一条都进不了清单（39 个条目）；
 *     ④ [异常] 分支把「框架自己崩了」和「断言失败」混为一谈，且 stderr 被
 *        execFile 整个丢掉，崩溃原因不可见。
 *     修法：汇总行解析统一成一条有序的解析器链；失败明细只推一次；execFile
 *     捕获 stderr；按结束状态分成 passed/failed/timeout/crash/skip 五桶。
 *
 *   缺陷 3「175 个测试脚本不被收集」：原收集只认 `*.test.js`，test/ 下另有
 *     149 个真测试脚本（`round-*.js` / `test-*.js` / `*-test.js` /
 *     `*benchmark*.js`）永久不进 CI。修法：按文件名模式 + 内容过滤扩大收集，
 *     同时显式排除 harness（_mount/_harness/_jest-globals）、纯数据
 *     （fixtures/ helpers/ *-samples.js）、runner 自身与一次性脚本。
 *
 * Usage: node test/run-all.js
 *        HF_RUN_ALL_JOBS=1 node test/run-all.js   # 强制串行（排查 flaky 用）
 *        HF_RUN_ALL_TIMEOUT=900000 node test/run-all.js   # 放宽单文件超时
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const TEST_DIR = __dirname;
const ROOT = path.join(__dirname, '..');
// [AUDIT-FIX 2026-11-23] 150000 → 600000，并新增 HF_RUN_ALL_TIMEOUT 可调。
// 依据（本轮实测坐实，不是推测）：
//   ① 真凶不是「150s 太短」，而是并发数超过了 CPU 配额。本容器
//      /sys/fs/cgroup/cpu.max = "200000 100000" → 只有 **2 个 CPU** 配额
//      （nproc 同为 2；/proc/cpuinfo 的 128 是宿主机的，本 cgroup 用不到），
//      而 JOBS=4 是「8 核机甜点」的过时结论。4 个子进程抢 2 个 CPU，
//      cpu.stat 的 nr_throttled 已累计 31 万次 —— 单文件墙钟被拉长近一倍，
//      审计中「某文件单跑 103 秒、进并发池即被杀」正是 103s × 2 > 150s。
//   ② 本轮实测争抢系数：hasty-every-copula-round281 独跑 27s、JOBS=4 并发
//      47s（1.74×）；round-319-bnpl 独跑约 40s、并发 72s（1.8×）。
//      已知最慢独跑约 103s，JOBS=2 下预计 ~110-135s，远低于 600s。
//   ③ 600s = 最慢已知文件的约 5 倍余量，超时从此只是「挂死线」而非「误杀线」。
//      且本轮起被超时杀死的文件单独记入 timeout 桶、不计入 failed，头条 passed
//      数字不被它污染 —— 放宽超时不会放大任何风险，也不会放宽任何断言。
const CHILD_TIMEOUT = Math.max(1000,
  parseInt(process.env.HF_RUN_ALL_TIMEOUT || '600000', 10) || 600000);
// [AUDIT-FIX 2026-11-23] 默认 4 → 2（HF_RUN_ALL_JOBS 仍可覆盖）。
// 依据：本容器 CPU 配额只有 2 核（见上），JOBS=4 在这台机器上不带来吞吐增益
// ——4 个可运行子进程抢 2 个 CPU，多出来的只有上下文切换与限流损耗；真正付出
// 代价的是内存与超时误杀：
//   · 实测单个引擎型测试子进程峰值 RSS 270-403 MB，4 并发 ≈ 1.1-1.6 GB；
//     本 cgroup memory.max = 4 GiB、memory.events 已记录 oom_kill 7 次、
//     swap 8191/8191 已用尽。审计日志里 13 个「零输出 → 重试 → [异常]」正是被
//     SIGKILL 的签名（管道缓冲没来得及 flush，stdout 全空），不是 SIGTERM。
//   · JOBS=2 让峰值子进程内存减半，争抢系数从 ~1.8 降到 ~1.2。
// 代价：CPU 配额已被打满，墙钟时间基本不变（总 CPU 工作量 / 2 核）；新增收入
// 149 个测试文件后，预计全量从约 66 分钟升到约 85-95 分钟。要抢时间可用
// HF_RUN_ALL_JOBS=3/4 覆盖，或用 HF_RUN_ALL_SLICE 分段跑。
const JOBS = Math.max(1, parseInt(process.env.HF_RUN_ALL_JOBS || '2', 10) || 2);
// [2026-10-10 删除] 此处曾经有一个「主动 SIGKILL 测试孙进程」的机制。
// 该机制是两次卡死事故的根因（2026-10-08 误杀 gateway、2026-10-10 误杀
// runner 自己），且它发的 SIGKILL 不可捕获，会绕过测试的 finally 还原块、
// 把 src/ 永久留在变异态（见 test/mutation-guard-recovery.js 的记录）。
// 现在只依赖 execFile 自身的 timeout 杀子进程（[v6.8.80] execSync →
// execFile 改造后）；测试若 spawn 长跑服务，由测试自己用 detached +
// kill(-pgid) 负责，runner 不越界杀进程。

let passed = 0;
let failed = 0;
// [AUDIT-FIX 2026-11-23] 文件级分类计数。原实现只有 passed/failed 两个桶，
// 「子进程被超时/信号杀死」「测试框架自己崩了」「断言失败」全混进 failed，
// 头条数字因此既不可复现也不可归因。现在按结束状态分桶：
//   okFiles      跑出可识别结果（计数汇总 / 横幅 / PASS 行 / ✓ 明细 / 0 用例）
//   timeoutFiles 被本 runner 的 CHILD_TIMEOUT 发 SIGTERM 杀死
//   crashFiles   退出码非零、或被外部信号杀死且给不出可识别结果
//   skipFiles    exit 77（仓库约定跳过码）或整文件只有 SKIP 行
// 恒等式：files = okFiles + timeoutFiles + crashFiles + skipFiles
// 用例级恒等式：total = passed + failed（与 data/test-count.json 的语义一致）
let okFiles = 0;
let timeoutFiles = 0;
let crashFiles = 0;
let skipFiles = 0;
const failures = [];
// [AUDIT-FIX 2026-11-23] 失败清单去重。原实现有两个重复推送 ✗ 的循环
// （「文件自报失败: X」与「X (· file)」各推一遍），实测失败清单 239 条
// 而真实失败只有 195 个。用 Set 按 (idx, 明细) 兜住，保证每条失败只出现一次。
const failureKeys = new Set();
function pushFailure(idx, name, error) {
  const key = `${idx}::${error}`;
  if (failureKeys.has(key)) return false;
  failureKeys.add(key);
  failures.push({ idx, name, error });
  return true;
}

/**
 * [AUDIT-FIX 2026-11-23] 失败明细行的统一判据。
 *
 * 原判据 `/^\s*[✗×xX]\s*(.+?)\s*$/` 漏掉 ❌——doc-numbers-accuracy.test.js
 * 等一批文件用 ❌ 报失败，它们的明细一条都进不了清单（审计实测 39 个
 * 「自报失败但无 ✗ 行」条目即此族）。这里把 ❌/❎/✘/✖ 一并收进来，
 * 裸 x/X 仍要求后跟空白，避免误吃正文里的 "X 是变量名"。
 */
const FAIL_LINE_RE = /^\s*(?:(?:✗|✘|✖|×|❌|❎)\s*[：:>\])]?\s*|[xX]\s+)(\S.*)$/;

/**
 * [AUDIT-FIX 2026-11-23] 成功横幅族（仅在**无任何失败标记**时生效）。
 * 在原族上补三种仓库里真实存在、原先不被识别的写法：
 *   「全部 6 组断言通过」   —— 全部与通过之间夹了计数（round-377）
 *   「N 断言全通过」        —— round-164-doublespeak 一族
 *   「ALL ASSERTIONS PASSED」—— ALL 与 PASSED 之间夹了单词（round-406）
 *   「无回归」「全部维度达标」「负例注入通过」—— benchmark/负例注入族
 * 只增不减：这条分支的调用方已保证 exit 0，误判方向是「少报失败」而非「多报」。
 */
const BANNER_RE = /全部[^\n]{0,12}(?:通过|达标)|断言全通过|守卫通过|ALL\s+[A-Z ]*PASS(?:ED)?|ALL\s*PASS(?:ED)?|ALL\s*GREEN|全绿|还原健康|无回归|负例注入通过|(?:，|:|：)\s*通过\s*$|✅/m;

/**
 * [AUDIT-FIX 2026-11-23] 收集范围配置：哪些收、哪些不收、为什么。
 *
 * 背景：原实现只收 `*.test.js`。test/ 下 1124 个 .js 文件里另有 149 个真测试
 * 脚本（`round-*.js` / `test-*.js` / `*-test.js` / `*benchmark*.js`）永久不进
 * CI —— 抽样 21 个有 8 个是红的（38%），估算约 900 条红色断言无人看见。
 * 但 test/ 下同时混着 harness、纯数据、一次性脚本和探针，不能无脑全收。
 *
 * ── 不收（目录级） ────────────────────────────────────────────────
 *   test/archive/    有意归档的历史测试，目标模块已删除，MODULE_NOT_FOUND
 *                    不是回归信号（原注释已说明，保留）
 *   test/dead-tests/ 同上（当前 checkout 里不存在，防御性保留）
 *   test/fixtures/   纯数据（age-detection-fixtures / r258 攻击与良性名单）
 *   test/helpers/    测试框架 shim 与被测 helper，没有测试入口
 *                     （mini-expect / mocha-shim / multi-lang-age-helper）
 *   node_modules/ .git/
 *
 * ── 不收（文件名显式排除） ────────────────────────────────────────
 *   run-all.js                      runner 自身；收进来会递归启动全量回归
 *   _mount.js / _harness.js /       mount/jest 全局注入 harness，被其他测试
 *   _jest-globals.js                 当子进程入口 require，自身不含用例
 *   audit-fix-safe-fs.js            一次性批量改写 src/ 的脚本（会改源码！）
 *   benchmark-runner.js             test_data/ 评测集的工具型 runner
 *   dangerous-instruction-recheck-  只报数字的复测探针，无 pass/fail 语义
 *     round123.js
 *   negative-test-list-add-round126 写临时副本 + node --check 的探针
 *   mutation-guard-recovery.js      导出 arm/disarm/recover 的库，无入口
 *   regex-to-text.js                正则→文本的数据/工具脚本
 *   round-434-mutant-runner.js      导出 Round434Mutant 类（变异 harness）
 *   round-434-mutant-child.js       读 stdin 的子进程统计器，不能单独跑
 *
 * ── 不收（内容过滤，只作用于新增模式） ────────────────────────────
 *   `-samples.js` / `-list.js` / `-fixtures.js` / `-data.js` / `-cases.js`
 *     纯样本数据（round-384-mte-samples / round-626 / round-634 一族）
 *   读 stdin（readFileSync(0)）      子进程协议，不是测试
 *   `module.exports = <大写名>`      导出类/构造器（harness）
 *
 * ── 收 ───────────────────────────────────────────────────────────
 *   `*.test.js`      原有集合，一个不加一个不减（903 个）
 *   `test-*.js`      显式以 test- 开头（9 个）
 *   `*-test.js`      显式以 -test 结尾（core-smoke-test.js）
 *   `round-*.js`     历轮回归脚本，仓库里最大的隐形测试群（141 个）
 *   `*benchmark*.js` 可独立运行的防回归基准（gate/vertical/benign/dimension 5 个）
 */
const SKIP_DIRS = new Set(['archive', 'dead-tests', 'fixtures', 'helpers', 'node_modules', '.git']);
const EXCLUDE_FILES = new Set([
  'run-all.js',
  '_mount.js', '_harness.js', '_jest-globals.js',
  'audit-fix-safe-fs.js',
  'benchmark-runner.js',
  'dangerous-instruction-recheck-round123.js',
  'negative-test-list-add-round126.js',
  'mutation-guard-recovery.js',
  'regex-to-text.js',
  'round-434-mutant-child.js',
  'round-434-mutant-runner.js',
  'helpers/mini-expect.js', 'helpers/mocha-shim.js', 'helpers/multi-lang-age-helper.js',
  'fixtures/age-detection-fixtures.js', 'fixtures/r258/attack-list.js', 'fixtures/r258/benign-list.js',
]);
// 数据样本后缀：纯数组/对象导出，没有测试入口
const DATA_SUFFIX_RE = /-(?:samples|list|fixtures|data|cases)\.js$/;
// 新增收集的文件名模式（`*.test.js` 走原有通道，不经过内容过滤）
const EXTRA_NAME_RE = /^(?:test-.*|-test|.*benchmark.*|round-\d+.*)\.js$/;

/**
 * [AUDIT-FIX 2026-11-23] 内容过滤：只拦「明显不是测试」的新增模式文件。
 *
 * 故意**不**对 `*.test.js` 生效：那个集合里有大量 mount 形态
 * （`module.exports = function ({ test, assertEqual, ... })`）和 jest 形态
 * （`describe()`）文件，既没有 assert. 也没有中文汇总，任何基于内容的判据都会
 * 把它们误杀 —— 本轮模拟时一次误拒了 50 个现存 .test.js，故只用于新增模式。
 */
function looksLikeTestScript(src) {
  if (/readFileSync\(\s*0\s*,/.test(src)) return false;        // 读 stdin 的子进程协议
  if (/^module\.exports\s*=\s*[A-Z]/.test(src)) return false;  // 导出类/构造器（harness）
  return true;
}

/** 递归收集测试文件，跳过 archive/ dead-tests/ fixtures/ helpers/（历史失效测试/纯数据/harness） */
function collectTestFiles(dir, base = dir) {
  const out = [];
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      out.push(...collectTestFiles(full, base));
    } else if (ent.name.endsWith('.js') && ent.name !== 'run-all.test.js') {
      const rel = path.relative(base, full).split(path.sep).join('/');
      // `*.test.js`：原有集合，直接收（含子目录），不过内容过滤
      if (/\.test\.js$/.test(ent.name)) { out.push(rel); continue; }
      // 其余：必须同时满足 显式未排除 + 文件名像测试 + 内容像测试
      if (EXCLUDE_FILES.has(rel)) continue;
      if (DATA_SUFFIX_RE.test(ent.name)) continue;
      if (!EXTRA_NAME_RE.test(ent.name)) continue;
      let src = '';
      try { src = fs.readFileSync(full, 'utf8'); } catch (e) { continue; }
      if (!looksLikeTestScript(src)) continue;
      out.push(rel);
    }
  }
  return out.sort();
}


/**
 * [v6.8.80] 并发执行一条命令（execFile async 版，替代原 execSync）。
 * 语义对齐：err 时 stdout 仍有部分输出；timeout 到期发 SIGTERM。
 * [AUDIT-FIX 2026-11-23] 补上 **stderr**：原回调签名只取 stdout，stderr 被
 * execFile 整个丢掉。后果是一整类崩溃完全不可见——实测 round-283 / round-496 /
 * round-225 是把 FAIL 清单打到 stderr（stdout 全空），runner 只能报一句
 * "Command failed"，既分不清是超时还是崩溃，也看不到崩在哪。
 * 同时把 err 的 code/signal/killed 一并带回，供下方三类分类使用。
 */
function execCapture(argv, timeout) {
  return new Promise((resolve) => {
    execFile('node', argv, {
      cwd: ROOT,
      encoding: 'utf8',
      timeout,
      maxBuffer: 48 * 1024 * 1024,
      windowsHide: true,
    }, (err, stdout, stderr) => {
      resolve({
        stdout: (stdout || '').toString(),
        stderr: (stderr || '').toString(),
        err: err || null,
      });
    });
  });
}

/**
 * [AUDIT-FIX 2026-11-23] 汇总行解析器链（取代原 12 条手写正则的 if 瀑布）。
 *
 * 为什么重写：原实现只认中文「N 通过, M 失败」一族，而仓库里真实存在的汇总
 * 格式有十几种。审计实测 18 个文件「断言全过却被统计成失败」——它们 exit 0、
 * 有汇总、只是格式不在那 12 条正则里；逐个单跑复核，全部 rc=0。这就是
 * 「26% 的失败是统计误报」的主要来源。
 *
 * 下列清单由 grep 全仓 test/ 的 console.log 汇总行后归一化归纳（数字抹成 N），
 * 每条后面标注了本轮实测的代表文件：
 *   ① 「结果: N 通过, N 失败, 共 N 个」      主流中文（约 300 文件）
 *   ② 「测试结果: N passed, N failed」       主流英文
 *   ③ 「N 通过 / N 失败」「N 过 / N 败」     斜杠分隔
 *   ④ 「通过 N / 失败 N」「通过 N / N」      **关键词在前**（round-448/541/624、
 *                                              pattern-detector-jitter-r308 等 7 个）
 *   ⑤ 「N passed / N total」                 round-436/437 负例注入汇总
 *   ⑥ 「pass N / fail N」「pass: N … fail: N」 round-395/398/400
 *   ⑦ 「pass=N fail=M」                      round-276/634
 *   ⑧ 「passed: N … failed: M」              round-269
 *   ⑨ 「# pass N … # fail N」                **node:test 内置 runner 的 TAP 汇总**。
 *                                              本机 Node v22 打 `# pass`，原正则只认
 *                                              `ℹ pass`（spec reporter），导致 9 个
 *                                              node:test 文件全被误报成失败。
 *   ⑩ 「ℹ pass N … ℹ fail M」                spec/dot reporter
 *   ⑪ 「RESULT{"pass":N,"fail":M}」          round-629
 *   ⑫ 裸 JSON {"pass":N,"fail":M}            round-643
 *   ⑬ 「合计 N / M」「N/M passed|tests|个|条」 分数式
 *   ⑭ 逐条缩进 ✅/❌ 明细行                  gate-benchmark 一族（只有逐类结果，无总数）
 *   ⑮ 逐条 ✓ 明细行                          test-architecture-consistency 一族
 *
 * 顺序即优先级：越具体的越靠前。任一命中即返回 { passed, failed }。
 * 这个函数同时充当 [异常] 分支的准入判据（见 runChild），两处口径从此一致
 * ——原实现那两个判据是两套不同的正则，才会出现「[异常] 放行了但解析不出来」。
 *
 * @param exitedNonZero 子进程是否以非零码/信号结束。⑭⑮ 两支依赖它：
 *   [AUDIT-FIX] 实测 dimension-coverage-benchmark.js 逐样本打 `❌ 未命中` 却仍
 *   判定达标并 exit 0——把信息性 ❌ 当失败会把绿灯算成红灯（0 过 / 9 败）。
 *   因此 ✅/❌ 明细只在 exit≠0 时计数，✓ 明细只在 exit 0 时计数。
 */
function parseCountedSummary(out, exitedNonZero) {
  // ①②③ 中英标准：N 通过, M 失败 / N passed, M failed / N 过 / M 败
  // （保留 `let m = out.match(` 字面形态：test/runall-summary-contract-round311.test.js
  //   的 B1 段用字面子串守卫这支标准正则是否被删/改，删了它会红。）
  let m = out.match(/(\d+)\s*(?:通过|passed|过)\s*[/,，]?\s*(\d+)\s*(?:失败|failed|败)/);
  if (m) return { passed: +m[1], failed: +m[2] };

  // ④ 关键词在前：通过 N / 失败 M（或 通过 N / 总数）
  m = out.match(/通过\s*(\d+)\s*[/,，]\s*(?:失败\s*(\d+)|\s*(\d+))/);
  if (m) return { passed: +m[1], failed: m[2] !== undefined ? +m[2] : Math.max(0, +m[3] - +m[1]) };

  // ⑤ N passed / M total（N 个 / N 条 / N tests / N 断言）
  m = out.match(/(\d+)\s*passed\s*\/\s*(\d+)\s*(?:total|tests?|个|条|断言)/i);
  if (m) return { passed: +m[1], failed: Math.max(0, +m[2] - +m[1]) };

  // ⑥⑦⑧ pass/fail 计数：`passed: N … failed: M` / `pass=N fail=M` /
  //     `N pass / M fail` / `pass N / fail M`（关键词在前的两种语序都要认）
  m = out.match(/\bpass(?:ed)?\s*[=:]\s*(\d+)[\s\S]{0,80}?\bfail(?:ed|s|ures)?\s*[=:]\s*(\d+)/);
  if (m) return { passed: +m[1], failed: +m[2] };
  m = out.match(/\b(\d+)\s*pass(?:ed)?\s*[/,，:：= ]\s*(\d+)\s*fail(?:ed|s|ures)?\b/);
  if (m) return { passed: +m[1], failed: +m[2] };
  m = out.match(/\bpass(?:ed)?\s*[=:]?\s*(\d+)\s*[/,，:：= ]\s*fail(?:ed|s|ures)?\s*[=: ]\s*(\d+)/);
  if (m) return { passed: +m[1], failed: +m[2] };

  // ⑨ node:test 内置 runner 的 TAP 汇总（本机 Node v22 的实际输出）
  m = out.match(/#\s*pass\s+(\d+)[\s\S]*?#\s*fail\s+(\d+)/);
  if (m) return { passed: +m[1], failed: +m[2] };
  // ⑩ spec/dot reporter 的 `ℹ pass N` + `ℹ fail M`
  m = out.match(/ℹ\s*pass\s+(\d+)[\s\S]*?ℹ\s*fail\s+(\d+)/);
  if (m) return { passed: +m[1], failed: +m[2] };

  // ⑪ RESULT{json} 汇总
  m = out.match(/RESULT\s*(\{[\s\S]*?\})\s*$/m);
  if (m) {
    try {
      const j = JSON.parse(m[1]);
      if (Number.isFinite(j.pass) && Number.isFinite(j.fail)) return { passed: j.pass, failed: j.fail };
    } catch (_) { /* 非合法 JSON：不走本分支，留给下方 */ }
  }
  // ⑫ 无前缀裸 JSON 汇总（从后向前找可解析的 { 起点，避开引擎 init 日志行）
  {
    const lines = out.split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim().startsWith('{')) {
        try {
          const j = JSON.parse(lines.slice(i).join('\n'));
          if (j && Number.isFinite(j.pass) && Number.isFinite(j.fail)) return { passed: j.pass, failed: j.fail };
        } catch (_) { /* 本起点不可解析，继续向前找 */ }
      }
    }
  }
  // ⑬ 分数式：N/M passed|通过|tests|个|条、合计 N/M
  //    [AUDIT-FIX] 收紧：只在**末尾若干行**且该行像汇总行时才认。
  //    原实现在全文中找，实测把 round-624 的 `✓ B4 … 2/3 条样本 …` 当成
  //    「2 通过 / 1 失败」——一个真绿的文件被算出假失败。限位后这类误匹配消失，
  //    而 round-350 的 `负例注入汇总: 129/129 个翻转断言全部翻转` 仍可识别。
  {
    const lines = out.split('\n');
    const RATIO_RE = /(\d+)\s*\/\s*(\d+)\s*(?:passed|通过|tests?\b|个|条)/;
    const SUMMARYISH_RE = /汇总|结果|合计|总计|测试|通过|passed|total|断言|轮测/;
    for (let i = lines.length - 1; i >= 0 && i >= lines.length - 12; i--) {
      const line = lines[i];
      if (!SUMMARYISH_RE.test(line)) continue;
      const r = line.match(RATIO_RE) || line.match(/合计\s*(\d+)\s*\/\s*(\d+)/);
      if (r) return { passed: +r[1], failed: Math.max(0, +r[2] - +r[1]) };
    }
  }

  // ⑭ 逐条缩进 ✅/❌ 明细行（benchmark 型：只有逐类结果，没有总数）。
  //    只数缩进 ≥2 的明细行；行首的横幅（✅ 无回归 / ❌ N 条误拦）不计入。
  //    [AUDIT-FIX] 只在 exit≠0 时计数：dimension-coverage-benchmark.js 逐样本打
  //    `❌ 未命中` 却仍判定达标并 exit 0，认了就会把绿灯算成 0 过 / 9 败。
  if (exitedNonZero) {
    const okDetail = (out.match(/^[ \t]{2,}✅\s/mg) || []).length;
    const badDetail = (out.match(/^[ \t]{2,}(?:❌|❎)\s/mg) || []).length;
    if (okDetail + badDetail > 0) return { passed: okDetail, failed: badDetail };
  }

  // ⑮ 逐条 ✓ 明细行（无汇总的裸跑型测试，如 test-architecture-consistency.js）。
  //    只在 exit 0 时计数：崩溃文件打的 ✓ 没有意义，崩溃本身才是信号。
  if (!exitedNonZero) {
    const okMarks = (out.match(/^\s*[✓✔]\s+\S/gm) || []).length;
    if (okMarks > 0) return { passed: okMarks, failed: 0 };
  }

  return null;
}

/**
 * [AUDIT-FIX 2026-11-23] 无计数结果的解析：PASS/SKIP 单行 + 成功横幅。
 *
 * 与 parseCountedSummary 分开，是因为 [异常] 分支的准入判据只能用**计数型**
 * 结果：一个 exit≠0 却只打成功横幅的文件是自相矛盾的，必须仍按失败处置
 * （沿用 [全局修复 2026-11-16] 的口径）。
 */
function parseUncountedSummary(out) {
  // [v6.7.83] 裸跑型测试的 PASS/SKIP 单行报告。
  // PASS → 计 1 个通过；SKIP → 不计失败但打出来（环境依赖缺失时模块加载不了，
  // 判失败会掩盖真实情况）。
  const passLines = (out.match(/^\s*PASS\b.*$/gm) || []).length;
  const skipLines = out.match(/^\s*SKIP\b.*$/gm) || [];
  if (passLines > 0) return { passed: passLines, failed: 0 };
  if (skipLines.length > 0) return { skipped: true };
  // [v6.7.83] 成功横幅（guard 型文件：assert 抛异常自守，失败即未捕获异常 →
  // exit≠0 → 上方 [异常]/crash 分支已计失败），成功时只打横幅而没有计数。
  // 仅在**无任何失败标记**时计 1 个通过。
  // [AUDIT-FIX] 必须显式给 failed: 0：少了它，调用方 `failed += parsed.failed`
  // 会变成 NaN —— 实测一次分段跑把头条数字打成「1082 通过, NaN 失败」。
  const hasFailMark = /✗|❌|\bFAIL\b|\bNG\b/.test(out);
  if (!hasFailMark && BANNER_RE.test(out)) return { passed: 1, failed: 0, banner: true };
  return null;
}

/** [AUDIT-FIX 2026-11-23] 打印子进程可读输出：优先结果行，崩溃时退到 stderr 头部 */
function emitChildOutput(out, stderr) {
  const keep = out.split('\n').filter(l => /通过|✗|失败|❌|FAIL|✓/.test(l));
  if (keep.length > 0) { console.log(keep.join('\n')); return; }
  const errHead = (stderr || '').trim().split('\n').slice(0, 4).join('\n');
  if (errHead) {
    console.log('  (stdout 无结果行；stderr 头部如下)');
    console.log(errHead.split('\n').map(l => '    ' + l).join('\n'));
    return;
  }
  console.log('  (无输出)');
}

/** 在子进程中执行一条命令，解析其结果并按结束状态分桶记账 */
async function runChild(task) {
  const { label, argv, timeout = CHILD_TIMEOUT, idx, total } = task;
  const name = label.trim();
  console.log(`\n[${idx + 1}/${total}] ${name}`);

  // [AUDIT-FIX 2026-11-23] execFile 错误对象语义（本轮实测坐实，见文件头）：
  //   本 runner 超时       → err.killed===true && err.signal==='SIGTERM' && err.code===null
  //   外部信号杀死（OOM 等）→ err.signal==='SIGKILL' 等、err.killed===false
  //   跑完退出码非零       → err.code===N、err.signal===null
  // 三者原先全被打成一句 "Command failed" 再一律 failed+=1，既不可归因也不可复现。
  const isOwnTimeout = (e) => !!e && e.killed === true && e.signal === 'SIGTERM';
  const isExternalSignal = (e) => !!e && !!e.signal && e.signal !== 'SIGTERM';

  let attempt = await execCapture(argv, timeout);
  let out = attempt.stdout;
  let err = attempt.err;

  // [全局修复 2026-11-16 保留] exit 77 = 仓库约定俗成的「跳过码」
  // （mcp-auth-tier.test.js 等环境依赖测试：外部 8588 实例不在线时打 SKIP
  // 说明后 exit 77）。按 SKIP 行同口径处理：打印原因、不计失败也不计通过。
  // [AUDIT-FIX] 这段放在重试之前：跳过码是确定性的，不该先白跑一遍。
  // （实测 mcp-auth-tier 的 SKIP 说明走 stderr、stdout 为空，原顺序会触发一次
  //   毫无必要的重试，把全量墙钟多拖一倍该文件的耗时。）
  if (err && err.code === 77) {
    const skipLines = out.split('\n').filter(l => /SKIP|⏭/.test(l)).slice(0, 2);
    const skipErr = (attempt.stderr || '').split('\n').filter(l => /SKIP|⏭/.test(l)).slice(0, 2);
    console.log(`  [跳过] ${name}: exit 77（环境依赖，约定跳过码）`);
    for (const l of skipLines.concat(skipErr)) console.log(l);
    skipFiles++;
    return { kind: 'skip' };
  }

  // [v6.7.94 保留 + AUDIT-FIX 扩充] 环境噪声重试。原判据只有「零输出」；本轮补上
  // 「被外部信号杀死」——那是 OOM 的签名（stdout 管道缓冲没来得及 flush，表现为
  // 零输出，execFile 的 err.signal 会是 SIGKILL 而非 SIGTERM）。
  // 不在重试范围：本 runner 的超时（等第二遍只是再等一遍）、退出码非零
  // （确定性失败，重跑浪费一倍墙钟）。只在「零输出」时重跑一次。
  if (err && !isOwnTimeout(err) && (out.trim().length === 0 || isExternalSignal(err))) {
    const why = isExternalSignal(err) ? `被外部信号 ${err.signal} 杀死` : '零输出被中断';
    console.log(`  [重试] ${name}: 子进程${why}（环境噪声），重跑一次`);
    attempt = await execCapture(argv, timeout);
    out = attempt.stdout;
    err = attempt.err;
  }

  // 分类 1：被本 runner 的超时 SIGTERM 杀死。
  // [AUDIT-FIX] 单独计入 timeout 桶、**不计入 failed** —— 这是头条数字可复现的关键。
  // 原先它按「1 个失败」入账，而该文件真实的几十条用例整体从 passed/failed 里消失，
  // 于是同一份代码四次全量的 passed 在 21158~28751 之间摆动（36%）。
  if (isOwnTimeout(err)) {
    timeoutFiles++;
    emitChildOutput(out, attempt.stderr);
    pushFailure(idx, name,
      `[timeout] 子进程被 runner 超时（${Math.round(timeout / 1000)}s）SIGTERM 杀死，本文件用例整体未计入 passed/failed`
      + `（可用 HF_RUN_ALL_TIMEOUT 放宽单文件预算，或 HF_RUN_ALL_JOBS 降并发）`);
    return { kind: 'timeout' };
  }

  // 分类 2：异常退出（退出码非零 / 外部信号）且给不出任何可识别结果 → crash。
  // [AUDIT-FIX] 原实现把这类一律记 failed+=1 + 一句 "Command failed"，分不清
  // 「测试框架自己崩了」和「断言失败」。实测 32 个 [异常] 里 round-283 / round-496 /
  // round-225 是把 FAIL 清单打到 stderr；现在 stderr 进日志，崩溃原因首次可见。
  const counted = parseCountedSummary(out, !!err);
  if (err && !counted) {
    crashFiles++;
    emitChildOutput(out, attempt.stderr);
    const reason = isExternalSignal(err)
      ? `被外部信号 ${err.signal} 杀死（重试后仍失败，疑似 OOM/内存不足）`
      : `退出码 ${err.code} 且无结果行`;
    const errHead = (attempt.stderr || '').trim().split('\n').slice(0, 4).join(' | ').slice(0, 240);
    pushFailure(idx, name, `[crash] ${reason}${errHead ? `；stderr: ${errHead}` : ''}`);
    return { kind: 'crash' };
  }

  // 正常路径：有计数型汇总，或 exit 0 无汇总 → PASS/SKIP 行 / 成功横幅
  const parsed = counted || parseUncountedSummary(out);
  // [AUDIT-FIX] 整文件只有 SKIP 行的，先按跳过处理。必须排在下面的有限数闸门
  // 之前：{ skipped: true } 没有 passed/failed 字段，闸门会把它误判成「解析失败」
  // 而记 1 个失败——跳过的本意是「不计成败」。
  if (parsed && parsed.skipped) {
    const skipLines = out.match(/^\s*SKIP\b.*$/gm) || [];
    for (const l of skipLines.slice(0, 2)) console.log(l);
    skipFiles++;
    return { kind: 'skip' };
  }
  // [AUDIT-FIX] 防御性闸门：解析结果必须是有限数。曾因横幅分支漏了 failed: 0
  // 让 `failed += undefined` 变成 NaN，一次分段跑的头条数字被打成
  // 「1082 通过, NaN 失败」——汇总一旦 NaN 就再也不知道真实失败数。
  // 这里把非有限数当成「解析失败」走静默分支，宁可少算也不让数字变 NaN。
  const parsedOk = parsed
    && Number.isFinite(parsed.passed) && parsed.passed >= 0
    && Number.isFinite(parsed.failed) && parsed.failed >= 0;
  if (!parsed || !parsedOk) {
    // [v6.7.83 保留] 吐不出结果行 = 静默。实测四类探针：exit1 被 execSync 的
    // 异常路径捕获（正确），但「跑完断言却不吐 N 通过, M 失败」的测试走到这里
    // 只打印尾巴就 return —— 不计入 passed、不计入 failed，永久隐形。
    // 处置：计入 1 个失败，并要求可见原因。
    failed += 1;
    okFiles++;
    emitChildOutput(out, attempt.stderr);
    // 原因串保留「未输出「N 通过, M 失败」结果行」字面：
    // test/runall-summary-contract-round311.test.js 的 B2 段用它守卫静默兜底
    // 是否被删（删了会红）。
    pushFailure(idx, name,
      '(未输出「N 通过, M 失败」结果行——测试跑了但无法确认断言数；请补 console.log 汇总)');
    return { kind: 'silent' };
  }
  okFiles++;
  passed += parsed.passed;
  failed += parsed.failed;
  if (parsed.banner) {
    const banner = out.split('\n').filter(l => BANNER_RE.test(l)).slice(-1)[0];
    if (banner) console.log(banner.trim());
  }

  // [AUDIT-FIX] 唯一的失败明细收集逻辑。原实现有两个重复推送 ✗ 的循环
  // （:272-277 的「文件自报失败: X」与 :285-290 的「X (· file)」），同一条失败
  // 被推两遍——实测失败清单 239 条 vs 真实 195 个失败。现在只走这一处，
  // 且 pushFailure 按 (idx, 明细) 去重，保证每条失败只出现一次。
  // 标记族同时补上 ❌/❎/✘/✖：doc-numbers-accuracy.test.js 等用 ❌ 不用 ✗，
  // 它们的失败明细原先一条都进不了清单。
  let inFailBlock = false;
  for (const line of out.split('\n')) {
    // `FAILURES:` / `失败项：` 头之后的缩进条目也算失败明细
    // （round-293 / round-398 一族把清单打到这种头下面）
    if (/^\s*(?:FAILURES?|失败项|失败的?测试)\s*[:：]/.test(line)) { inFailBlock = true; continue; }
    if (inFailBlock) {
      const im = line.match(/^\s{2,}[-•*]\s+(\S.*)$/);
      if (im) { pushFailure(idx, name, `文件自报失败: ${im[1].slice(0, 120)}`); continue; }
      if (line.trim() === '') continue;
      inFailBlock = false;
    }
    const fm = line.match(FAIL_LINE_RE);
    if (fm && !/通过|passed|✓|✅|✔|^ok\b/i.test(line)) {
      pushFailure(idx, name, `文件自报失败: ${fm[1].slice(0, 120)}`);
    }
  }
  // [v6.7.97 保留] 文件自报失败数 >0 但清单里没有它的任何条目时，补一条带汇总行
  // 的条目——宁可承认「不知道哪些失败」也不要让数字与清单互相矛盾。
  if (parsed.failed > 0 && !failures.some(f => f.idx === idx)) {
    const sumLine = out.split('\n')
      .find(l => /(\d+)\s*(?:通过|passed|过)[,，/]\s*(\d+)\s*(?:失败|failed|败)/.test(l)) || '';
    pushFailure(idx, name,
      `文件自报 ${parsed.failed} 个失败但无可见失败标记（汇总: ${sumLine.trim().slice(0, 110)}）——请补 ✗/❌ 明细`);
  }
  // [v6.7.83 保留] 「0 通过, 0 失败, 共 0 个」= mount 函数定义了但一个 test
  // 都没注册。这在数字上合法（0 失败），实际等于该文件什么都没测。
  // 计入 1 个失败，逼它要么注册用例、要么改名（不带 .test.js 后缀就不会被扫）。
  if (parsed.passed === 0 && parsed.failed === 0) {
    failed += 1;
    pushFailure(idx, name,
      '(注册了 0 个用例——mount 函数未调用 test()；请补用例或移出 test/ 目录)');
  }
  emitChildOutput(out, attempt.stderr);
  return { kind: 'ok' };
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

// [全局修复 2026-11-16] 经子进程探针**间接**变异 src/ 的测试：测试自身
// 只读（detectWriteToSrc 扫不到写调用——变异在 scripts/round-*/探针里），
// 但探针会写 src/ 再还原。并发池里这类测试与其他读 src/ 的测试相撞即
// 假失败（round-621 实测：单跑 3/3 绿，全量里报「源文件未还原」flake）。
// 显式列入串行车道——与 isServerTest 同级的人工分类口径（静态识别不了
// 间接变异，只能枚举）。
const INDIRECT_MUTATORS = new Set([
  'round-621-uncertaintyquantifier-dispatch.test.js',
]);
function isIndirectMutator(rel) {
  return INDIRECT_MUTATORS.has(rel);
}

// [全局修复 2026-11-16] 时序敏感测试：判定依赖墙钟间隔（detectOscillation 的
// avgGap 分支、重实例启动耗时），JOBS=4 的 CPU 争抢会改变间隔量级 → 分支判定
// 漂移或子进程被 kill（实测 round-608 B7 独跑 2/2 绿、并发池里 type 从
// frequent_thrashing 漂成 rapid_access；round-624 独跑 11.1s、并发池里输出
// 截断假失败）。这类测试的正确性依赖「低争抢环境」，入串行车道（跑在并发池
// 之后，无同类争抢）。
const TIMING_SENSITIVE = new Set([
  'round-608-forgettingengine-dispatch.test.js',
  'round-624-turing-pzombie.test.js',
]);
function isTimingSensitive(rel) {
  return TIMING_SENSITIVE.has(rel);
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
        // [AUDIT-FIX 2026-11-23] runner 自身异常也归入 crash 桶，不再混进 failed
        crashFiles++;
        pushFailure(t.idx, t.label.trim(),
          `[crash] runner 异常: ${(e.message || '').split('\n')[0]}`);
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
    console.error('   容器规格 4GB，单轮全量回归（1000+ 个测试文件、数十万文件扫描）已接近上限；');
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
  // [AUDIT-FIX] plannedTasks 单独记「本轮真的要跑几个」：totalTasks 是切片前的
  // 全量数，两者在分段模式下不同。下方汇总自洽校验必须对 plannedTasks，
  // 否则每次分段跑都会误报「汇总不自洽」。
  let plannedTasks = totalTasks;
  const sliceEnv = (process.env.HF_RUN_ALL_SLICE || '').match(/^(\d+)\s*\/\s*(\d+)$/);
  if (sliceEnv) {
    const sk = Math.max(1, parseInt(sliceEnv[1], 10));
    const sn = Math.max(1, parseInt(sliceEnv[2], 10));
    if (sk > sn) { console.error(`HF_RUN_ALL_SLICE 段号 ${sk} 超出总段数 ${sn}`); process.exit(2); }
    const before = tasks.length;
    const kept = tasks.filter((t, i) => (i % sn) === (sk - 1));
    for (let i = 0; i < kept.length; i++) { kept[i].idx = i; kept[i].total = kept.length; }
    tasks.length = 0; tasks.push(...kept);
    plannedTasks = tasks.length;
    console.log(`[分段] HF_RUN_ALL_SLICE=${sk}/${sn}：${before} → ${tasks.length} 个文件`);
  }
  // [v6.8.80] 两阶段调度：变更测试（写 src/ 源码）与 MCP 服务类测试
  // 独占串行车道——前者与并发读者/同类互踩（详见 detectWriteToSrc 注释），
  // 后者端口与启动耗时互踩。其余测试走并发池。
  const serialTasks = tasks.filter(t => t.isMutator || isIndirectMutator(t.rel) || isTimingSensitive(t.rel) || isServerTest(t.rel));
  const parallelTasks = tasks.filter(t => !(t.isMutator || isIndirectMutator(t.rel) || isTimingSensitive(t.rel) || isServerTest(t.rel)));
  const poolSize = Math.min(JOBS, Math.max(1, parallelTasks.length));
  console.log(`共 ${totalTasks} 个测试文件：并发池 ${parallelTasks.length} + 串行车道 ${serialTasks.length}（JOBS=${JOBS}，可调 1-16；CHILD_TIMEOUT=${Math.round(CHILD_TIMEOUT / 1000)}s，可调 HF_RUN_ALL_TIMEOUT）`);
  console.log('串行车道 = 变更测试（写 src/）+ 间接变异 + 时序敏感 + MCP 服务类，防并发互踩/时序漂移');
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
        // [AUDIT-FIX 2026-11-23] 同上：runner 自身异常归入 crash 桶
        crashFiles++;
        pushFailure(t.idx, t.label.trim(),
          `[crash] runner 异常: ${(e.message || '').split('\n')[0]}`);
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
  // [AUDIT-FIX 2026-11-23] 五桶汇总。原实现只打「N 通过, M 失败, 共 N 个」，
  // 且把超时杀死、框架崩溃、断言失败全算进 M —— 头条数字因此不可复现、不可归因。
  //   passed / failed  用例级（来自各文件自报的汇总行）
  //   timeout / crash / skip  文件级（子进程结束状态）
  //   files            实际执行的测试文件数 = 四类终态之和
  //   total            用例总数 = passed + failed（与 data/test-count.json 一致）
  const totalCases = passed + failed;
  const filesRun = okFiles + timeoutFiles + crashFiles + skipFiles;
  console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, ${timeoutFiles} 超时, ${crashFiles} 崩溃, ${skipFiles} 跳过`);
  console.log(`用例总数: ${totalCases} = 通过 ${passed} + 失败 ${failed}`);
  console.log(`文件统计: ${filesRun} 个文件 = 有结果 ${okFiles} + 超时 ${timeoutFiles} + 崩溃 ${crashFiles} + 跳过 ${skipFiles}`);
  // 自洽校验：每个计划内的文件必须落进且只落进一个终态桶。
  // 不成立就打 ❌ 并置退出码 1 —— 绝不打印「全部通过」骗人。
  const selfConsistent = filesRun === plannedTasks;
  console.log(selfConsistent
    ? `[自洽] ${filesRun} 个文件全部有终态，无遗漏无重复计数`
    : `❌ 汇总不自洽：终态合计 ${filesRun} ≠ 本轮计划文件数 ${plannedTasks}（全量 ${totalTasks}）`);
  // [v6.7.87] 落一份用例数缓存，供 doc-numbers-accuracy 守卫与
  // measure-claimed-numbers 读取——README 横幅的 "N passing tests"
  // 从此有实测值可比对（此前只有测试文件数，用例数无从校验，
  // 从 1,138 胀到 1754 都没人发现）。
  // [AUDIT-FIX] 字段与语义保持原样（passed/failed/total/at）：
  // timeout/crash/skip 是文件级状态，混进用例级 total 会污染 doc-numbers 的比对。
  try {
    fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });
    fs.writeFileSync(
      path.join(__dirname, '..', 'data', 'test-count.json'),
      JSON.stringify({ passed, failed, total: totalCases, at: new Date().toISOString() }, null, 2)
    );
  } catch (_) { /* 缓存写失败不影响测试结果 */ }
  // [AUDIT-FIX] 退出码判据：用例失败 + 超时 + 崩溃 都算不绿。
  // 原实现只看 failures.length 与 failed，被超时杀死的文件会被一句「全部通过」带过。
  const notGreen = failed + timeoutFiles + crashFiles;
  if (failures.length > 0) {
    console.log('\n失败的测试:');
    // [v6.8.80] 并发后 failures 是完成序，按任务 idx 排序恢复文件序，
    // 与串行时代的输出可比对。
    for (const f of failures.slice().sort((a, b) => a.idx - b.idx)) {
      console.log(`  - ${f.name} ${f.error}`);
    }
    process.exitCode = 1;
  } else if (notGreen > 0) {
    // [v6.7.97] 兜底：数字说失败但清单空 —— 说明有文件自报了失败数却
    // 没被识别成具体条目。宁可承认「不知道哪些失败」也不要打印
    // 「全部通过」骗人。数字与结论必须一致。
    console.log(`\n失败的测试: ${notGreen} 个失败未能定位到具体条目`);
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
