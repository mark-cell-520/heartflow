// test/kill-orphans-safety.test.js — 守护「测试 runner 不主动杀进程」这条底线
//
// 历史（两次真实卡死事故，同一根因）：
//   2026-10-08  run-all.js 的 killOrphans() 在 execSync 超时后 SIGKILL
//               「runner 的子/孙进程」，一次全量回归中 gateway 被误杀，
//               host 账本记录 exited UNCLEANLY — SIGKILL / a process kill
//               issued by the agent or one of its descendants。
//               用户体感：又卡死了。
//   2026-10-10  当时的修复（三重校验 + 常驻服务白名单）没解决根因——
//               第 3 道校验写成 `if (!_isDescendant(n) && _getPgid(n) !== selfPgid) continue;`
//               等价于「只要 PGID 相同就杀」，而 execSync 超时后被 PID 1
//               收养的孙进程 PPID 变 1（非后代）却仍与 runner 同组 →
//               落入击杀名单，runner 自己同组 → 自杀。
//               表现为全量回归跑到 ETIMEDOUT 测试时进程消失，日志停在
//               重试、无汇总行、无 EXIT 码（memory.peak 仅 1967MB/4096MB、
//               oom_kill 0，与 OOM 无关）。
//   另有一个独立危害：killOrphans 发的 SIGKILL 不可捕获，会绕过测试的
//   `finally { fs.writeFileSync(SRC, orig) }` 还原块，把 src/ 永久留在
//   变异态（详见 test/mutation-guard-recovery.js 的记录）。
//
// 2026-10-10 处置：**整个机制删除**，不是再打补丁。
//   理由：它要解决的「测试泄漏孤儿服务进程」是测试自己的责任（用
//   detached + kill(-pgid) 自理），不该由 runner 越界代劳；而它一旦判错，
//   代价是宿主服务被 SIGKILL（用户侧卡死）或 src/ 被留在变异态。
//   两次修复失败说明这是设计问题，不是补丁问题。
//
// 本测试从「验证 killOrphans 行为正确」转为「守护它不存在」：
//   任何把进程清理逻辑加回 run-all.js 的改动都会被这里拦下。

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); passed++; console.log('  OK  ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ': ' + e.message); }
}

const runnerSrc = fs.readFileSync(path.join(__dirname, 'run-all.js'), 'utf8');

// ─── A. 机制必须不存在 ───
t('run-all.js 不再定义 killOrphans', () => {
  assert.ok(!/function\s+killOrphans\s*\(/.test(runnerSrc),
    'killOrphans 又出现了——它是两次卡死事故的根因，见文件头历史');
});

t('run-all.js 不再定义进程清理辅助函数', () => {
  for (const fn of ['_isDescendant', '_isLongLivedService', '_isSelfOrDescendant']) {
    assert.ok(!new RegExp(`function\\s+${fn}\\s*\\(`).test(runnerSrc),
      `${fn} 又出现了——进程清理机制的组成部分`);
  }
  assert.ok(!/LONG_LIVED_PATTERNS\s*=/.test(runnerSrc),
    'LONG_LIVED_PATTERNS 又出现了——进程清理机制的白名单特征库');
});

t('run-all.js 不再调用任何主动杀进程的 API', () => {
  // process.kill( 的调用一律不允许（测试自己在自己文件里 kill 自己的子进程
  // 是它的事，但 runner 主体不杀）。
  const killCalls = runnerSrc.match(/process\.kill\s*\(/g) || [];
  assert.strictEqual(killCalls.length, 0,
    `发现 ${killCalls.length} 处 process.kill 调用——runner 不应主动杀进程`);
  assert.ok(!/\bkillOrphans\s*\(/.test(runnerSrc), '仍有 killOrphans 调用点');
});

t('run-all.js 不读 /proc/<pid>/stat 做进程判定', () => {
  assert.ok(!/\/proc\/\$\{pid\}\/stat/.test(runnerSrc) && !/\/proc\/' \+ /.test(runnerSrc),
    '仍在读 /proc/<pid>/stat——进程清理机制的判定依据');
});

// ─── B. 删除的理由必须留在代码里（防未来有人当作漏网 bug 补回去）──
t('文件头记录了删除原因与两次事故', () => {
  assert.ok(/2026-10-10/.test(runnerSrc), '缺删除日期标记');
  assert.ok(/卡死|SIGKILL/i.test(runnerSrc), '缺事故性质说明');
});

// ─── C. 清理职责的归属必须写明 ───
t('注释指明清理职责归测试自己（detached + kill(-pgid)）', () => {
  assert.ok(/detached/i.test(runnerSrc) || /kill\s*\(\s*-/.test(runnerSrc),
    '没写清替代方案——未来遇到孤儿进程时不知道该怎么办');
});

// ─── D. 原有能力不能被这次删除破坏：runner 仍要能跑测试 ───
t('runChild / runAllTests 仍然存在且可加载', () => {
  assert.ok(/function\s+runChild\s*\(/.test(runnerSrc), 'runChild 不见了');
  assert.ok(/function\s+runAllTests\s*\(/.test(runnerSrc), 'runAllTests 不见了');
  assert.ok(/acquireSingleton/.test(runnerSrc), '单例锁不见了——它防的是另一类事故');
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed > 0 ? 1 : 0);
