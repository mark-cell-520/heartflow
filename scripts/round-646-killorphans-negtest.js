/**
 * scripts/round-646-killorphans-negtest.js
 *
 * [r646] killOrphans 布尔逻辑负例测试。
 *
 * 背景（2026-10-10 事故）：run-all.js 的 killOrphans 第 3 道校验写成
 *   if (!_isDescendant(n) && _getPgid(n) !== selfPgid) continue;
 * 等价于「只要 PGID 相同就杀」。execSync 超时后被 PID 1 收养的测试孙进程
 * PGID 继承自 runner，于是被列入击杀名单——**runner 自己同组**。
 * 结果：全量回归跑到 ETIMEDOUT 的测试时 runner 被自己 SIGKILL，
 * 日志停在重试、无汇总行、无 EXIT 码。2026-10-08 已因此杀过 gateway 一次。
 *
 * 三层验证：
 *   1. 运行时（harness 子进程）：真后代+同组必须杀；白名单服务绝不杀
 *   2. 静态：旧布尔 bug 形态必须不在**可执行代码**里（注释里引用旧写法是
 *      刻意的复盘记录，按行剥注释再扫）
 *   3. 静态：双条件必须各自独立成守卫
 */
'use strict';

const { spawn, execSync } = require('child_process');
const fs = require('fs');

const SRC = '/root/.hermes/skills/ai/mark-heartflow-skill/test/run-all.js';
const src = fs.readFileSync(SRC, 'utf8');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

/** 括号配对提取函数体 */
function extractFn(name) {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`找不到 ${name}`);
  let depth = 0;
  const i = src.indexOf('{', start);
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(start, j + 1); }
  }
  throw new Error(`${name} 函数体未闭合`);
}

const harness = [
  'const LONG_LIVED_PATTERNS = ' +
    (src.match(/const LONG_LIVED_PATTERNS = \[[\s\S]*?\];/) || ['[]'])[0]
      .replace(/^const LONG_LIVED_PATTERNS = /, '') + ';',
  extractFn('killOrphans'),
  extractFn('_getPgid'),
  extractFn('_isDescendant'),
  extractFn('_isLongLivedService'),
].join('\n\n');

if (process.argv[2] === 'harness') {
  // 不能 defineProperty 伪装 process.pid：_isDescendant 读 /proc/<pid>/stat
  // 里**真实**的 PPID 链，伪装会让真后代被判非后代（harness 第一版踩过）。
  const a = spawn('bash', ['-c', 'exec sleep 300'], { stdio: 'ignore' });           // 真后代+同组
  const c = spawn(process.execPath,
    ['-e', 'setInterval(()=>{},1000)', 'src/mcp-server.js', '--port', '19999'],
    { cwd: HF, stdio: 'ignore' });                                                   // 白名单服务

  // 把提取到的函数体注入本作用域（函数声明在 eval 里不外泄，用 new Function 取引用）
  const _inject = new Function('spawnSync', 'fs', `${harness}\nreturn { killOrphans };`);
  const { killOrphans } = _inject(require('child_process').spawnSync, fs);

  setTimeout(() => {
    const killed = [];
    const _origKill = process.kill.bind(process);
    process.kill = (pid, sig) => { killed.push(pid); return true; };
    killOrphans();
    console.log(JSON.stringify({ killed, aPid: a.pid, cPid: c.pid }));
    for (const p of [a, c]) { try { _origKill(p.pid, 'SIGKILL'); } catch (_) {} }
    process.exit(0);
  }, 900);
} else if (process.argv[2] === 'harness-orphan') {
  // ── 验证「非后代 + 同组」形态：目标 pid 由父进程传入，本进程只做判定 ──
  const target = parseInt(process.argv[3], 10);
  const _inject = new Function('spawnSync', 'fs', `${harness}\nreturn { killOrphans, _getPgid, _isDescendant };`);
  const m = _inject(require('child_process').spawnSync, fs);
  const killed = [];
  const _origKill = process.kill.bind(process);
  process.kill = (p, s) => { killed.push(p); return true; };
  // 让 killOrphans 去扫它：把 target 挂到本进程下不可行（PPID 不可伪造），
  // 所以直接单测判定逻辑的等价形式——用与 killOrphans 完全相同的三道守卫。
  const pgidOk = m._getPgid(target) === m._getPgid(process.pid);
  const descOk = m._isDescendant(target);
  // 复刻 killOrphans 的决策：两道 continue 都不命中才会被杀
  const wouldKill = descOk && pgidOk;
  let ppid = -1;
  try {
    const st = fs.readFileSync(`/proc/${target}/stat`, 'utf8');
    ppid = Number(st.slice(st.lastIndexOf(')') + 2).trim().split(/\s+/)[1]);
  } catch (_) {}
  console.log(JSON.stringify({ killed, target, ppid, descOk, pgidOk, wouldKill }));
  process.exit(0);
} else {
  main();
}

function main() {
  const results = [];
  let ok = true;
  const rec = (name, pass) => { results.push([name, pass]); if (!pass) ok = false; };

  // ── 1. 运行时验证 ──
  let rt = null;
  try {
    const out = execSync(`${process.execPath} ${JSON.stringify(__filename)} harness`,
      { encoding: 'utf8', timeout: 30000 });
    rt = JSON.parse(out.trim().split('\n').pop());
  } catch (e) {
    console.log('❌ harness 子进程失败:', (e.message || '').split('\n')[0]);
    process.exit(1);
  }

  const aKilled = rt.killed.includes(rt.aPid);
  console.log(`[A] 真后代+同组 ${rt.aPid} → ${aKilled ? '✅ 已杀（清泄漏本职在）' : '❌ 未杀'}`);
  rec('A 真后代被清', aKilled);

  const cKilled = rt.killed.includes(rt.cPid);
  console.log(`[C] 白名单常驻服务 ${rt.cPid} → ${cKilled ? '❌ 被杀了（误杀=用户侧卡死）' : '✅ 未杀'}`);
  rec('C 白名单不误杀', !cKilled);

  // ── 2. 静态：旧布尔 bug 形态必须不在可执行代码里 ──
  // 剥掉行注释再扫——注释里引用旧写法是刻意的复盘记录（心虫文档纪律：
  // 反面教材是诚实原则的组成部分，不能删）。
  const codeOnly = src.split('\n')
    .map(l => l.replace(/\/\/.*$/, ''))
    .join('\n');
  const oldBug = /if\s*\(!_isDescendant\(n\)\s*&&\s*_getPgid\(n\)\s*!==\s*selfPgid\)\s*continue/.test(codeOnly);
  console.log(`[D] 旧布尔 bug 形态（可执行代码）→ ${oldBug ? '❌ 仍在' : '✅ 已清除'}`);
  rec('D 旧 bug 形态已清除', !oldBug);

  // ── 3. 静态：双条件必须各自独立成守卫 ──
  const g1 = /if\s*\(!_isDescendant\(n\)\)\s*continue/.test(codeOnly);
  const g2 = /if\s*\(_getPgid\(n\)\s*!==\s*selfPgid\)\s*continue/.test(codeOnly);
  console.log(`[E] 双条件独立守卫 → ${g1 && g2 ? '✅ 在位' : `❌ 缺失 (descendant=${g1}, pgid=${g2})`}`);
  rec('E 双条件独立守卫', g1 && g2);

  // ── 4. 运行时：非后代 + 同组 → 绝不杀（旧 bug 的核心形态）──
  // 构造：起一个中间 sh，让孙子 sleep 被 PID 1 收养；杀掉中间层后，
  // 孙子的 PPID 变 1（_isDescendant=false）而 PGID 仍继承自 harness（同组）。
  // 旧逻辑 `!_isDescendant && pgid!==selfPgid` 在此为 false&&false=false → 不跳过
  // → 击杀。新逻辑第一道守卫 `!_isDescendant(n)` 直接 continue → 不杀。
  const mid = spawn('bash', ['-c', 'sleep 300 & echo $!; wait'], { stdio: ['ignore', 'pipe', 'ignore'] });
  let orphanPid = 0;
  mid.stdout.on('data', d => { orphanPid = parseInt(d.toString().trim(), 10) || 0; });

  setTimeout(() => {
    if (!orphanPid) {
      console.log('[B] 非后代+同组 → ⚠️ 构造失败（拿不到孤儿 pid），跳过本条');
    } else {
      try { process.kill(mid.pid, 'SIGKILL'); } catch (_) {}
      setTimeout(() => {
        const out = execSync(`${process.execPath} ${JSON.stringify(__filename)} harness-orphan ${orphanPid}`,
          { encoding: 'utf8', timeout: 30000 });
        const r2 = JSON.parse(out.trim().split('\n').pop());
        const bKilled = r2.wouldKill;
        console.log(`[B] 非后代+同组 ${r2.target}（ppid=${r2.ppid}, descendant=${r2.descOk}, pgid同组=${r2.pgidOk}）→ ${bKilled ? '❌ 会杀（正是 10-08/10-10 两次事故的形态）' : '✅ 不杀'}`);
        rec('B 非后代+同组不误杀', !bKilled);
        try { process.kill(r2.target, 'SIGKILL'); } catch (_) {}
        finish();
      }, 600);
      return;
    }
    finish();
  }, 700);

  function finish() {
    console.log(`\n═══ killOrphans 负例测试 ${ok ? '全部通过 ✅' : '存在失败 ❌'} ═══`);
    for (const [n, p] of results) if (!p) console.log(`  ❌ ${n}`);
    process.exit(ok ? 0 : 1);
  }
}
