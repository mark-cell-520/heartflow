#!/usr/bin/env node
/**
 * 实测全部对外宣称的数字（v6.7.77 起家，v6.8.96 第 741 轮改嫁共享实现）
 *
 * [r741 为什么改嫁] 本脚本原来自己拼子进程：把 Windows 绝对路径**直接插进**
 * `require('…')` 的单引号字面量，反斜杠在子进程解析时被当转义序列吃掉
 * （\U→U、\s→s、\n→换行）→ MODULE_NOT_FOUND，而三处 `catch (_) {}` / `|| 0`
 * 把「测量失败」洗成「实测为 0」。r741 轮初实测三个头条数字全 0：
 *
 *     判别维度数（dimensions 键实测）: 0
 *     ALLOWED_ROUTES 路由数        : 0
 *     _modules 模块数              : 0
 *
 * 而 sync-doc-numbers.js 的同一表达式实测 160 / 1314 / 161 —— 同一台机器、
 * 同一个 discriminate()，两个入口两个结果。根因不是表达式，是**拼路径的写法
 * 被复制了三份、其中两份对一份错**。现在统一走 src/core/measure-core.js
 * （_lit() 用 JSON.stringify + 正斜杠，且量不到就拒绝出数而不是洗成 0）。
 *
 * 用法：
 *   node scripts/measure-claimed-numbers.js          # 人读
 *   node scripts/measure-claimed-numbers.js --json   # 机器读（measureAll 全量）
 *   node scripts/measure-claimed-numbers.js --check  # 只做文档对照，漂移即 exit 1
 */
const path = require('path');
const ROOT = path.join(__dirname, '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）

// [v6.8.95 第 740 轮] 突变期互斥闸（与 sync-doc-numbers.js 的 measure() 同源）。
// r739 实测：全量回归串行车道里的原地删条突变窗口内，本脚本起子进程
// require 那份被删条的 heartflow.js，量出模块 161→157、路由 1314→1264。
// 此刻出的每一个数字都不可信 —— 直接拒绝出数，退出码 2（与「量不到」
// 的拒绝语义区分：1 = 数字不一致，2 = 拒绝测量）。
const { MutationGuard } = require(path.join(ROOT, 'src/core/mutation-guard.js'));
const _mgGate = new MutationGuard({ rootPath: ROOT, silent: true }).guardMeasurement('measure-claimed-numbers');
if (!_mgGate.ok) {
  console.error('❌ ' + _mgGate.reason);
  process.exit(2);
}

// [r741] 唯一测量实现。三份复制品合成一处，见该模块头注释。
const { MeasureCore } = require(path.join(ROOT, 'src/core/measure-core.js'));
const mc = new MeasureCore({ rootPath: ROOT, silent: true });

const argv = process.argv.slice(2);
const asJson = argv.includes('--json');
const checkOnly = argv.includes('--check');

// ── --check：只回答「文档宣称的 vs 引擎实测的」，漂移即 exit 1 ──
if (checkOnly) {
  const r = mc.checkDocs();
  if (!r.ok && r.reason && !r.drift.length) {
    console.error('❌ ' + r.reason);
    process.exit(2);
  }
  if (r.drift.length) {
    console.error('❌ 文档宣称与实测不符（' + r.drift.length + ' 处漂移）:');
    for (const d of r.drift) {
      console.error('   ' + d.file + '  ' + d.key + ': 宣称 ' + d.claimed + ' / 实测 ' + d.actual);
    }
    process.exit(1);
  }
  console.log('✅ 文档横幅与实测一致（' + r.claims.length + ' 份文档 × dims/modules/tools'
    + (r.claims.some(c => 'routes' in c) ? '/routes' : '') + '），实测由 action=check 现场采样');
  process.exit(0);
}

// ── 全量实测。runtime 量不到 → 抛错（exit 1），绝不打印 0 冒充实测值 ──
let m;
try {
  m = mc.measureAll();
} catch (e) {
  console.error('❌ 拒绝出数（宁可不记也不记错）: ' + e.message);
  process.exit(1);
}

if (asJson) {
  console.log(JSON.stringify(m, null, 2));
  process.exit(0);
}

console.log(`=== 实测数字（v${m.version}）===\n`);
console.log(`判别维度数（dimensions 键实测）: ${m.dims}`);
console.log(`  BLOCK_DIMS   : ${m.block}`);
console.log(`  REWRITE_DIMS : ${m.rewrite}`);
console.log(`  VERIFY_DIMS  : ${m.verify}`);
console.log(`  （三层合计 ${m.tiersSum}，剩余 ${m.tiersRest} 个只计分不强制 action）`);
console.log(`MCP tools/list 工具数 : ${m.tools}（静态口径 ${m.toolsStatic}）`);
console.log(`HANDLERS 键数         : ${m.handlers}`);
console.log(`ALLOWED_ROUTES 路由数 : ${m.routes}`);
console.log(`_modules 模块数       : ${m.modules}`);
console.log(`测试文件数            : ${m.testFiles}`);
console.log(`测试用例数            : ${m.testCases === null ? '（无缓存，先跑 node test/run-all.js）' : m.testCases + ' 通过 / ' + m.testCasesFailed + ' 失败'}`);
console.log(`src JS 文件数         : ${m.srcFiles}`);
console.log(`\n（runtime 四数由一次子进程实测，${m.elapsedMs}ms；文档对照另跑 --check）`);
