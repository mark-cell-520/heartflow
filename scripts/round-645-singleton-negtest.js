/**
 * 负例测试：验证 run-all.js 的单例锁真的会拦住第二个 runner。
 * 判据：起一个 cmdline 含 run-all.js 的真 node 进程 → 再跑 run-all.js
 *       → 必须 exit 2 且输出含「拒绝启动」。
 * 反向：杀掉伪装进程 → 再跑 → 必须能正常启动（不被残留锁文件挡住）。
 */
'use strict';
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

function runAll(timeoutMs = 60000) {
  try {
    const out = execSync(`node ${path.join(HF, 'test/run-all.js')} 2>&1`, {
      encoding: 'utf8', timeout: timeoutMs, cwd: HF,
    });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status === undefined ? -1 : e.status, out: (e.stdout || '') + (e.stderr || '') };
  }
}

/** 列出当前活着的 run-all runner pid（与 run-all.js 的判据保持一致） */
function _liveRunners() {
  let out = '';
  try {
    out = execSync('ps -eo pid=,comm=,args=', { encoding: 'utf8', timeout: 10000 });
  } catch (_) { return []; }
  const pids = [];
  for (const line of out.split('\n')) {
    const m = line.match(/^\s*(\d+)\s+(\S+)\s+(.*)$/);
    if (!m) continue;
    if (!/^node(-MainThread|js)?$/.test(m[2])) continue;
    if (!m[3].includes('run-all.js')) continue;
    pids.push(parseInt(m[1], 10));
  }
  return pids;
}

// 起一个 cmdline 含 run-all.js 的真 node 进程并保持存活。
// detached:true 让它自成一个进程组，结束时 kill(-pid) 连组杀掉——
// 否则 `bash -c 'exec node ...'` 的 exec 替换会让 node 脱离原 pid 成为孤儿
// （实测泄漏了一个活 10 分钟的假 runner，把真正的回归全拦在外面）。
const fake = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)', 'run-all.js'], {
  cwd: HF, stdio: 'ignore', detached: true,
});

console.log('伪装 runner PID:', fake.pid);
setTimeout(() => {
  let ok = true;

  // ── 负例：必须被拦 ──
  const r1 = runAll();
  const blocked = r1.code === 2 && r1.out.includes('拒绝启动');
  console.log('\n[负例] 有活 runner 时启动 →', blocked ? '✅ 被正确拦下' : `❌ 未拦下 (code=${r1.code})`);
  if (!blocked) { ok = false; console.log(r1.out.slice(0, 600)); }
  else {
    const m = r1.out.match(/PID (\d+):/);
    const named = m && parseInt(m[1], 10) === fake.pid;
    console.log('  报出的 PID 是伪装进程:', named ? '✅' : `❌ (报了 ${m ? m[1] : '无'})`);
    if (!named) ok = false;
  }

  // ── 反向：杀掉后必须能启动 ──
  // kill(-pid) 杀整个进程组：detached 让 fake 自成进程组，组内 node 一起走，
  // 不会留下孤儿假 runner 把后续真正的回归全拦在外面。
  try { process.kill(-fake.pid, 'SIGKILL'); } catch (_) {}
  try { process.kill(fake.pid, 'SIGKILL'); } catch (_) {}
  setTimeout(() => {
    // 反向只验证「锁放行」：真跑一次 run-all 会跑 20+ 分钟，负例脚本不该
    // 真的跑完全量。用短超时拿前几行输出，确认它进了测试主体（没被拦）
    // 就立刻杀掉——既证明放行，又不产生长跑残留。
    const r2 = runAll(20000);
    const started = r2.out.includes('HeartFlow module tests');
    const notBlocked = !r2.out.includes('拒绝启动');
    console.log('\n[反向] 残留已死后启动 →', (started && notBlocked) ? '✅ 正常放行' : `❌ 仍被挡 (code=${r2.code})`);
    if (!(started && notBlocked)) { ok = false; console.log(r2.out.slice(0, 600)); }
    // 杀掉反向阶段真跑起来的 runner，避免留下长跑残留
    for (const o of _liveRunners()) { try { process.kill(o, 'SIGKILL'); } catch (_) {} }

    console.log('\n═══ 单例锁负例测试', ok ? '全部通过 ✅' : '存在失败 ❌', '═══');
    process.exit(ok ? 0 : 1);
  }, 1200);
}, 1500);
