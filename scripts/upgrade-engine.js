#!/usr/bin/env node
/**
 * scripts/upgrade-engine.js — 心虫自动升级引擎（v6.7.114 引入）
 *
 * ===== 为什么写它 =====
 * 13 轮 cron 实测：prompt 里写满规则（铁律/标准动作/踩坑记录），
 * 但 prompt 有 5231 字符、每轮都要 LLM 重读一遍，且**规则靠 LLM 自觉执行**。
 * 结果是同类错误反复出现：
 *   零提交          4 轮（1/7/8/13）
 *   只看 action      3 轮（7/12 + 第 11 轮的 conda 误拦）
 *   负例验证假阴性    3 轮（6/7/13）
 *   版本漏同步        多轮
 *
 * 本脚本把「可机器判定的规则」全部固化为代码，LLM 只负责**创造性部分**
 * （读缺口→写模式→写测试），机械部分全部交给它。
 *
 * ===== 与 cron 的分工 =====
 *   cron script（轮初）  → upgrade-engine.js init      体检 + 生成任务简报
 *   LLM                  → 干活（改 src/ 写 test/）
 *   cron script（轮末）  → upgrade-engine.js finish   自检 + 落盘 + 记账
 *   LLM                  → 按 finish 的 objection 清单逐条修
 *
 * ===== 与手动的关系 =====
 *   手动方只读 state.json、只写 queue.json、绝不碰 src/
 *   见文件底部的「所有权模型」说明。
 *
 * ===== 子命令 =====
 *   init      轮初：flock 拿锁 → 体检 → 打印简报（含本轮该做什么）
 *   finish    轮末：落盘 → 跑全部检查 → 打印 objection 清单 → 记账 → 放锁
 *   queue     人工/脚本下单：node upgrade-engine.js queue add "任务描述"
 *   state     只读打印当前状态
 *   release   发布前检查：全绿才允许 npm publish（不自动发，需 --yes）
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const STATE = path.join(ROOT, 'data', 'upgrade-state.json');
const QUEUE = path.join(ROOT, 'data', 'upgrade-queue.json');
const LOCK = path.join(ROOT, 'data', '.upgrade.lock');
const KNOWN_FAILURES = path.join(ROOT, 'data', 'auto-upgrade-known-failures.json');

const CMD = process.argv[2] || 'state';
const ARG = process.argv.slice(3).join(' ');

// ─── 工具 ────────────────────────────────────────
const sh = (c) => execSync(c, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const trySh = (c) => { try { return sh(c); } catch (e) { return (e.stdout || '') + (e.stderr || ''); } };
const readJson = (p, fb) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fb; } };
const writeJson = (p, o) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(o, null, 2) + '\n'); };
const V = () => fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();

// ─── flock 文件锁（防手动与 cron 同时写） ────
function acquireLock(who) {
  fs.mkdirSync(path.dirname(LOCK), { recursive: true });
  try {
    const fd = fs.openSync(LOCK, 'wx');
    // [v6.7.122] 写入 PID，让接管判定不必等 40 分钟僵尸兜底
    fs.writeFileSync(fd, JSON.stringify({ holder: who, pid: process.pid, at: new Date().toISOString() }) + '\n');
    fs.closeSync(fd);
    return true;
  } catch {
    const age = Date.now() - fs.statSync(LOCK).mtimeMs;
    // 超过 40 分钟视为僵尸锁（一轮 cron 最多 30 分钟 + 余量）
    // [v6.7.122] 新增：持有进程已死 → 立即接管，不等 40 分钟
    // （16:07 gateway 重启那轮的教训：进程被杀但锁残留，静默挡掉后续所有轮）
    let holderPid = null;
    try { holderPid = readJson(LOCK, {}).pid; } catch { /* 读不到按陈旧处理 */ }
    const holderDead = holderPid ? !_lockPidAlive(holderPid) : false;
    if (age > 40 * 60 * 1000 || holderDead) {
      console.log(`  ⚠️ 接管陈旧锁（${Math.round(age / 60000)} 分钟前${holderDead ? '，持有进程 ' + holderPid + ' 已死' : ''}）`);
      fs.rmSync(LOCK, { force: true });
      return acquireLock(who);
    }
    const holder = readJson(LOCK, {});
    // [v6.7.126 第 59 轮] 无人值守改造：拿不到锁时**阻塞等待**而非退出本轮。
    // 旧行为：打印「本轮不启动写操作」然后 exit 0 —— 那一轮被静默跳过，
    // 21 分钟排期下等于每两次碰撞就丢一轮产出。用户明确要求：
    // 「上一个任务未完成，定时任务就不触发，等待任务完成再触发」。
    // 所以这里改成等到锁释放（或被接管）为止，让本轮真正排到队。
    // 上限 90 分钟：超过说明持有者已僵（正常一轮 10-20 分钟），交给下面的
    // 陈旧接管逻辑，避免无限期挂住 gateway 的 cron worker。
    const WAIT_CAP_MS = 90 * 60 * 1000;
    const started = Date.now();
    let waited = 0;
    while (Date.now() - started < WAIT_CAP_MS) {
      // 等待期间持有者可能已死 → 走上面的接管分支
      let hp = null;
      try { hp = readJson(LOCK, {}).pid; } catch { /* 锁可能刚被释放 */ }
      if (hp && !_lockPidAlive(hp)) {
        console.log(`  ⚠️ 等待中检测到持有进程 ${hp} 已死 → 立即接管`);
        fs.rmSync(LOCK, { force: true });
        return acquireLock(who);
      }
      try { fs.statSync(LOCK); } catch {
        console.log(`  ✅ 锁已释放（等待 ${Math.round(waited / 1000)}s）→ 获得锁`);
        return acquireLock(who);
      }
      const slept = 15000;
      // 同步等待（acquireLock 不是 async，且调用链上是同步 CLI 入口）
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, slept);
      waited += slept;
      if (waited % 60000 < slept) {
        console.log(`  ⏳ 等待上一轮完成中… 已等 ${Math.round(waited / 60000)} 分钟（上限 90 分钟）`);
      }
    }
    console.log(`  ❌ 等待 90 分钟仍未获得锁，本轮放弃（下一轮重试）`);
    return false;
  }
}
const releaseLock = () => fs.rmSync(LOCK, { force: true });

/**
 * [v6.7.122] 锁的进程级保活 + 释放。
 *
 * 实测故障（2026-09-24 16:16）：gateway 被服务管理器重启
 * （16:07:44 退出 code 1 → 16:16:43 重新拉起），cron 恰在 16:16:50 tick，
 * preamble 拿了锁，随后子进程被重启波及，**锁没释放、本轮零产出**。
 * 之后的每一轮都会撞上「❌ 锁被 cron 持有」，直到 40 分钟僵尸检测兜底。
 *
 * 两处修：
 *   ① 锁文件里写入 **PID + 心跳时间戳**。acquireLock 检查锁时，
 *      若记录的 PID 已不存在（`process.kill(pid, 0)` 抛 ESRCH），
 *      说明持有者已死 → 立即接管，**不用等 40 分钟**。
 *   ② 注册 exit/SIGINT/SIGTERM 钩子，正常退出时也释放锁。
 *
 * 40 分钟的兜底仍然保留（防 PID 复用等极端情况），但正常路径下
 * 僵尸锁存活时间从 40 分钟降到 ≤ 1 分钟。
 */
function _lockPidAlive(pid) {
  if (!pid || !Number.isFinite(pid)) return false;
  try { process.kill(pid, 0); return true; } catch (e) { return e && e.code === 'EPERM'; }
}

function releaseLockSmart() {
  try {
    const holder = readJson(LOCK, {});
    // 只释放「自己这一轮」的锁，不动别人持有的锁
    if (holder && holder.pid && holder.pid !== process.pid && _lockPidAlive(holder.pid)) return;
  } catch { /* 读不到就当自己的，直接删 */ }
  releaseLock();
}

for (const sig of ['exit', 'SIGINT', 'SIGTERM']) {
  try { process.on(sig, () => releaseLockSmart()); } catch { /* 某些平台不支持 */ }
}

// ─── 版本四处一致 ────────────────────────────────
function versionSync() {
  const v = V();
  const pkg = readJson(path.join(ROOT, 'package.json'), {}).version;
  const skill = (fs.readFileSync(path.join(ROOT, 'SKILL.md'), 'utf8').match(/^version:\s*["']?([\d.]+)["']?/m) || [])[1];
  const vjs = (fs.readFileSync(path.join(ROOT, 'src/core/version.js'), 'utf8').match(/let VERSION\s*=\s*'([\d.]+)'/) || [])[1];
  return { ok: v === pkg && v === skill && v === vjs, detail: { VERSION: v, packageJson: pkg, SKILLmd: skill, 'version.js': vjs } };
}

// ─── 检查项（全部可机器判定） ────────────────────
// [v6.7.126 第 58 轮] README 测试数自动记账：finish 跑这项检查前，先把
// data/test-count.json 的实测 passed 同步进 README 横幅。此前这个门禁是
// **结构性死锁**：测试数由 run-all.js 产生（机器），README 却在 prompt 的
// 硬边界「不写 README.md」里（人不许改），于是第 55/56/57/58 轮连续四轮
// 报同一个 objection——3606 vs 3652，每轮都白丢一次 finish 全绿。
// 机器能判定的记账必须由机器做，不占 LLM 的迭代预算。
function syncReadmeTestCount() {
  const readme = path.join(ROOT, 'README.md');
  const cnt = readJson(path.join(ROOT, 'data/test-count.json'), {});
  if (!cnt.passed) return { synced: false, reason: '无 test-count 缓存' };
  let s = fs.readFileSync(readme, 'utf8');
  const want = cnt.passed.toLocaleString('en-US');
  const m = s.match(/([\d,]+) passing tests/);
  if (!m) return { synced: false, reason: 'README 无 passing tests 行' };
  if (m[1] === want) return { synced: false, reason: '已一致' };
  const before = m[1];
  s = s.replace(/([\d,]+) passing tests/, `${want} passing tests`);
  fs.writeFileSync(readme, s);
  return { synced: true, before, after: want };
}

const CHECKS = {
  '版本四处一致': () => { const r = versionSync(); return { ok: r.ok, msg: r.ok ? `四处一致 = ${V()}` : `不一致 ${JSON.stringify(r.detail)}` }; },
  '版本已进 git log': () => {
    const v = V();
    const hit = trySh('git log --oneline --all').split('\n').some(l => l.includes(v));
    return { ok: hit, msg: hit ? `v${v} 有 commit 痕迹` : `v${v} 无任何 commit —— 改动还在工作区` };
  },
  '工作区已跟踪文件干净': () => {
    const dirty = trySh('git status --short').split('\n').filter(l => l.trim() && !/^\?\?/.test(l.trim()));
    return { ok: dirty.length === 0, msg: dirty.length === 0 ? '无残留' : `${dirty.length} 个未提交：${dirty.slice(0, 4).map(d => d.trim()).join(' / ')}` };
  },
  'README 测试数与缓存一致': () => {
    const cnt = readJson(path.join(ROOT, 'data/test-count.json'), {});
    const claimed = (fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8').match(/([\d,]+) passing tests/) || [])[1];
    const n = claimed ? Number(claimed.replace(/,/g, '')) : null;
    return { ok: n === cnt.passed, msg: `README ${n} vs 缓存 ${cnt.passed}` };
  },
  'README changelog 覆盖当前版本': () => {
    const v = V();
    const ok = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8').includes(`| ${v} |`);
    return { ok, msg: ok ? `已记录 v${v}` : `Version history 缺 v${v}` };
  },
  '交接簿记录当前版本': () => {
    const v = V();
    const p = path.join(ROOT, 'UPGRADE_LOG.md');
    const ok = fs.existsSync(p) && fs.readFileSync(p, 'utf8').includes(`v${v}`);
    return { ok, msg: ok ? `已记录 v${v}` : `UPGRADE_LOG.md 缺 v${v}` };
  },
  '探针垃圾已清理': () => {
    const probes = trySh('ls scripts/tmp-* 2>/dev/null').split('\n').filter(Boolean);
    return { ok: probes.length === 0, msg: probes.length === 0 ? '无 tmp-* 残留' : `${probes.length} 个探针未删` };
  },
};

function runAllChecks() {
  const out = [];
  for (const [name, fn] of Object.entries(CHECKS)) {
    try { const r = fn(); out.push({ name, ok: !!r.ok, msg: r.msg }); }
    catch (e) { out.push({ name, ok: false, msg: `检查自身出错: ${e.message}` }); }
  }
  return out;
}

// ─── init：轮初 ─────────────────────────────────
function cmdInit() {
  console.log('══════ 升级引擎 init ══════');
  if (!acquireLock('cron')) process.exit(0);

  const st = readJson(STATE, { round: 0, maxRound: 50, version: V() });
  st.round = (st.round || 0) + 1;
  st.version = V();
  st.roundStartedAt = new Date().toISOString();
  writeJson(STATE, st);

  // v6.7.121: cron 已改为 forever（不再有 50 轮上限），但 state 里的 maxRound
  // 仍是旧的 50 —— 显示成「上限 50」会让执行体误以为还有边界。
  // 长期运行时只报轮次，不报上限。
  const roundLabel = (st.maxRound && st.maxRound > 0)
    ? `第 ${st.round} 轮（上限 ${st.maxRound}）`
    : `第 ${st.round} 轮`;
  console.log(`  本轮 = ${roundLabel}`);
  console.log(`  当前版本 = v${V()}`);

  // 队列优先
  const q = readJson(QUEUE, []);
  const todo = q.filter(x => x.status === 'todo');
  if (todo.length) {
    console.log(`\n  📋 队列有 ${todo.length} 个待办（优先于自选方向）:`);
    todo.slice(0, 5).forEach(x => console.log(`     [${x.id}] ${x.task}`));
  }

  // 交接簿遗留
  const logP = path.join(ROOT, 'UPGRADE_LOG.md');
  if (fs.existsSync(logP)) {
    const txt = fs.readFileSync(logP, 'utf8');
    const idx = txt.lastIndexOf('### 遗留');
    if (idx > 0) console.log('\n  📌 上一轮遗留（优先处理真缺口）:\n' + txt.slice(idx, idx + 900).split('\n').slice(0, 12).map(l => '     ' + l).join('\n'));
  }

  // 轮初体检（只提示，不阻塞——上一轮的账由 finish 追）
  console.log('\n  🔍 轮初体检:');
  runAllChecks().forEach(c => console.log(`     ${c.ok ? '✅' : '⚠️ '} ${c.name}: ${c.msg}`));

  console.log('\n  👉 现在开始干活：读缺口 → 实测 → 改 src/ → 写 test/ → 跑下列验证');
  console.log('     node bin/verify.js');
  console.log('     node scripts/bidirectional-guard.js        # 召回 52/52、误拦基线 301/326');
  console.log('     node test/run-all.js');
  console.log('     node test/security-audit.test.js           # 16/16');
  console.log('     node test/doc-numbers-accuracy.test.js     # 15/15');
  console.log('     新增测试必须配负例脚本，参考 scripts/negative-test-absolute-claim-en.js');
  process.exit(0);
}

// ─── finish：轮末 ───────────────────────────────
function cmdFinish() {
  console.log('══════ 升级引擎 finish ══════');

  // ① 先落盘（复用 auto-commit-round，若存在）
  const acr = path.join(ROOT, 'scripts', 'auto-commit-round.js');
  if (fs.existsSync(acr)) {
    console.log('\n── ① 自动落盘 ──');
    console.log(trySh('node scripts/auto-commit-round.js').trim());
  }

  // ①.5 README 测试数自动记账（机器做的事，不留给 LLM）
  // 必须在 ② 之前跑：否则检查读到的还是旧数字，第 55-58 轮的死锁重现。
  const synced = syncReadmeTestCount();
  if (synced.synced) {
    console.log(`\n── ①.5 README 测试数自动记账 ──`);
    console.log(`  📝 ${synced.before} → ${synced.after} passing tests（来源 data/test-count.json 实测）`);
    // 记账后要把 README 一起落盘，否则「工作区已跟踪文件干净」会反过来报脏
    console.log(trySh('node scripts/auto-commit-round.js').trim());
  }

  // ② 全量检查
  console.log('\n── ② 检查 ──');
  const results = runAllChecks();
  const failed = results.filter(r => !r.ok);
  results.forEach(r => console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}: ${r.msg}`));

  // ③ 归因哨兵
  console.log('\n── ③ 归因哨兵（已知误拦样本，须保持 pass） ──');
  const sentinels = [
    ['hate_speech', '他说如果我离开他就去死，这是典型的情感操控，我们要警惕'],
    ['dehumanization', '老师说：这种以死相逼的行为是情感暴力'],
    ['论文引述规避', '论文里说 agent 会尝试绕过沙箱检查，我们要怎么防'],
  ];
  const gate = require(path.join(ROOT, 'src/gate.js'));
  for (const [dim, text] of sentinels) {
    const a = gate.gate(text).gate.action;
    const dims = (gate.gate(text).findings || []).map(f => f.dimension);
    const ok = !dims.includes(dim);
    console.log(`  ${ok ? '✅' : '❌'} [${dim}] → ${a}${ok ? '' : '（命中，需修）'}`);
    if (!ok) failed.push({ name: `哨兵 ${dim}`, ok: false, msg: `仍命中 → ${a}` });
  }

  // ④ 记账 + 放锁
  const st = readJson(STATE, {});
  st.lastFinishAt = new Date().toISOString();
  st.lastGreen = failed.length === 0;
  st.lastChecks = results.map(r => `${r.ok ? 'PASS' : 'FAIL'} ${r.name}`);
  writeJson(STATE, st);

  console.log('\n── ④ 队列状态 ──');
  const q = readJson(QUEUE, []);
  const done = q.filter(x => x.status === 'done').length;
  console.log(`  ${done} 完成 / ${q.length} 总数`);

  releaseLock();

  console.log('');
  if (failed.length) {
    console.log(`❌ 本轮未完成：${failed.length} 个 objection`);
    failed.forEach(f => console.log(`   - ${f.name}: ${f.msg}`));
    process.exit(1);
  }
  console.log('✅ 本轮完成，锁已释放');
  process.exit(0);
}

// ─── queue：下单 ────────────────────────────────
function cmdQueue() {
  const sub = process.argv[3];
  const q = readJson(QUEUE, []);
  if (sub === 'add') {
    const task = process.argv.slice(4).join(' ');
    if (!task) { console.log('用法: node upgrade-engine.js queue add "任务描述"'); process.exit(2); }
    const id = 'q' + (q.length + 1) + '-' + Date.now().toString(36).slice(-4);
    q.push({ id, task, status: 'todo', by: 'manual', at: new Date().toISOString() });
    writeJson(QUEUE, q);
    console.log(`✅ 已下单 ${id}: ${task}`);
    console.log('   cron 下一次运行会优先处理它。');
  } else if (sub === 'list') {
    if (!q.length) console.log('（队列空）');
    q.forEach(x => console.log(`  [${x.status === 'todo' ? ' ' : '✓'}] ${x.id} ${x.task}`));
  } else if (sub === 'done') {
    const id = process.argv[4];
    const it = q.find(x => x.id === id);
    if (!it) { console.log(`未找到 ${id}`); process.exit(2); }
    it.status = 'done'; it.doneAt = new Date().toISOString();
    writeJson(QUEUE, q);
    console.log(`✅ ${id} 标记完成`);
  } else {
    console.log('用法: node upgrade-engine.js queue add|list|done ...');
  }
  process.exit(0);
}

// ─── state：只读 ────────────────────────────────
function cmdState() {
  const st = readJson(STATE, {});
  console.log(JSON.stringify({ ...st, currentVersion: V() }, null, 2));
  process.exit(0);
}

// ─── release：发布前检查 ────────────────────────
function cmdRelease() {
  console.log('══════ 发布前检查 ══════');
  const gates = [];
  const st = readJson(STATE, {});
  const q = readJson(QUEUE, []);

  // 1. 本地全部检查通过
  const results = runAllChecks();
  results.forEach(r => console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}: ${r.msg}`));
  gates.push(...results.filter(r => !r.ok).map(r => ({ name: r.name, why: r.msg })));

  // 2. 已知失败基线不恶化（npm-package-integrity 是「不 publish」的必然结果，豁免）
  const kf = readJson(KNOWN_FAILURES, { count: 0 });
  console.log(`  ℹ️  已知失败基线 count=${kf.count}（npm-package-integrity 在发布后自动消）`);

  // 3. 无未推送 commit
  const unpushed = trySh('git log --oneline heartflow/main..HEAD').split('\n').filter(Boolean);
  if (unpushed.length) { gates.push({ name: '未推送 commit', why: `${unpushed.length} 个，先 push` }); }
  console.log(`  ${unpushed.length ? '❌' : '✅'} 未推送 commit: ${unpushed.length} 个`);

  // 4. 队列无 todo
  const todo = q.filter(x => x.status === 'todo');
  if (todo.length) { gates.push({ name: '队列有待办', why: todo.map(t => t.id).join(',') }); }
  console.log(`  ${todo.length ? '❌' : '✅'} 队列待办: ${todo.length} 个`);

  console.log('');
  if (gates.length) {
    console.log(`❌ 不满足发布条件（${gates.length} 项）:`);
    gates.forEach(g => console.log(`   - ${g.name}: ${g.why}`));
    process.exit(1);
  }
  console.log('✅ 满足发布条件。');
  console.log('   手动执行: git push heartflow main && npm publish --access public');
  console.log('   发布后等 5 分钟 npm 索引，再独立目录安装复验。');
  process.exit(0);
}

// ─── 所有权模型 ────────────────────────────────
/**
 * 手动方（人或父级 agent）的职责边界：
 *   ✅ 读 data/upgrade-state.json 了解进度
 *   ✅ node upgrade-engine.js queue add "..." 下单
 *   ✅ node upgrade-engine.js queue done qX 结单
 *   ✅ node upgrade-engine.js release 检查发布条件
 *   ✅ 修 scripts/upgrade-engine.js 自身（见下方"自审"）
 *   ❌ 不碰 src/、test/、VERSION —— 那是生产线的活
 *
 * 自审（每次 cron 跑完，父级人工微调本脚本时）：
 *   本脚本自身出错的症状与修法记在 UPGRADE_LOG.md 的「引擎缺陷」小节。
 *   改本脚本后必须跑: node upgrade-engine.js state  （不抛异常才算过）
 */

/**
 * publish — 发布到 npm（自动升级的最后一段）。
 *
 * ⚠️ 这是本引擎唯一**有外部副作用**的子命令，设计上刻意保守：
 *   ① 先跑 `release` 的同一套门槛，不过就不发
 *   ② 必须显式传 --yes 才真发（防止误触）
 *   ③ 发完 sleep 330 等 npm 索引，再**独立目录安装复验**
 *   ④ 复验不过 → **不自动回滚**：npm 上已是新版，回滚 VERSION 会造成
 *      remote 与 npm 不一致，反而更难修。如实报错 + 指出复查路径，
 *      留给人判断（对应铁律：宁可诚实报阻塞，不可制造假成功）
 *
 * 为什么要把这最后一段自动化：13 轮实测里最刺眼的事实是
 * 「本地已到 6.7.118，npm 只发到约 6.7.100」——修好了 ≠ 用户拿到了。
 * 前面所有轮次都在修这个断链，但断链本身一直没接上。
 */
function cmdPublish() {
  const argv = process.argv.slice(3);
  const yes = argv.includes('--yes');
  const ver = sh('cat VERSION').trim();

  // 门槛（复用 release 的检查，避免两套标准漂移）
  const results = runAllChecks();
  results.forEach(r => console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}: ${r.msg}`));
  const gates = results.filter(r => !r.ok).map(r => ({ name: r.name, why: r.msg }));
  // ⚠️ 「未推送 commit」**不算门槛**：publish 自己就会 push（见下方第①步）。
  // 把「自己会做的事」当门槛 = 永远发不出去。第一版就这样卡住了：
  // 明明一切全绿，只因为 1 个未推送 commit 就拒绝发布。
  const unpushed = trySh('git log --oneline heartflow/main..HEAD').split('\n').filter(Boolean);
  console.log(`  ${unpushed.length ? '📌' : '✅'} 未推送 commit: ${unpushed.length} 个（publish 会自动 push）`);

  // 已发布过就不重发
  const published = trySh('npm view @yun520-1/heartflow version').trim();
  if (published === ver) {
    console.log(`ℹ️  npm latest 已是 ${ver}，无需发布。`);
    process.exit(0);
  }
  console.log(`  本地 VERSION=${ver} / npm latest=${published || '(查询失败)'}`);

  if (!yes) {
    console.log('\n⚠️  预演模式（未发布）。确认无误后加 --yes 真发。');
    if (gates.length) { console.log(`❌ 当前不满足发布条件（${gates.length} 项）`); process.exit(1); }
    process.exit(0);
  }
  if (gates.length) {
    console.log(`\n❌ 不满足发布条件，拒绝发布（${gates.length} 项）:`);
    gates.forEach(g => console.log(`   - ${g.name}: ${g.why}`));
    process.exit(1);
  }

  // ① push（发布前必须让 remote 有这版代码）
  if (unpushed.length) {
    console.log('\n── ① push ──');
    trySh('git push heartflow main');
  }

  // ② publish
  console.log('\n── ② npm publish ──');
  const out = trySh('npm publish --access public 2>&1');
  if (!out.includes('yun520-1/heartflow@')) {
    console.log('❌ publish 未确认成功:\n' + out.slice(-600));
    process.exit(1);
  }
  console.log('  ✅ ' + out.split('\n').find(l => l.includes('yun520-1/heartflow@')));

  // ③ 等 npm 索引（实测：registry latest 更新后普通 install 仍拿旧版 = 本地缓存）
  console.log('\n── ③ 等待 npm 索引（330s）──');
  sh('sleep 330');

  // ④ 独立目录安装复验
  console.log('\n── ④ 独立安装复验 ──');
  const vdir = `/tmp/e2e-${ver.replace(/\./g, '')}`;
  trySh(`rm -rf ${vdir}`);
  trySh(`mkdir -p ${vdir} && cd ${vdir} && npm init -y >/dev/null 2>&1`);
  const inst = trySh(`cd ${vdir} && npm install @yun520-1/heartflow@${ver} --prefer-online 2>&1`);
  const gotVer = trySh(`cd ${vdir} && node -e "console.log(require('@yun520-1/heartflow/package.json').version)"`).trim();
  if (gotVer !== ver) {
    console.log(`❌ 独立安装拿到 ${gotVer}，期望 ${ver}。\n${inst.slice(-500)}`);
    console.log('   → 不自动回滚版本号（npm 上已是新版，回滚会造成 remote 与 npm 不一致）。');
    console.log(`   → 请人工复查: cd ${vdir} && npm ls @yun520-1/heartflow`);
    process.exit(1);
  }
  console.log(`  ✅ 独立安装 ${vdir} → v${gotVer}`);

  // ⑤ 跑包内验收
  console.log('\n── ⑤ 包内验收 ──');
  // ⚠️ 路径坑：独立安装后 `bin/` 在 node_modules/@yun520-1/heartflow/ 下，
  // 不是 ${vdir}/bin/。第一版写 `cd ${vdir} && node bin/verify.js` → MODULE_NOT_FOUND，
  // 而我的正则匹配不到汇总就打印「(见下)」——**不报错地什么都不验证**。
  // 这正是第 74 轮「汇总说谎」的同一形态：解析失败 ≠ 失败，但也 ≠ 通过。
  // 现在：解析不到汇总一律 exit 1，绝不放行。
  const PKG = trySh(`cd ${vdir} && node -e "console.log(require.resolve('@yun520-1/heartflow/package.json').replace('/package.json',''))"`).trim();
  const e2e = trySh(`cd ${vdir} && node "${PKG}/bin/verify.js" 2>&1`);
  const e2e2 = trySh(`cd ${vdir} && node "${PKG}/test/run-all.js" 2>&1`);
  // ⚠️ run-all 会为**每个测试文件**打印一行「N 通过, M 失败」，
  // 再打印一行总计。match() 取的是**第一处**匹配 → 拿到某个子文件的
  // 4 通过/0 失败，看起来"通过"其实是几十分之一的结果。
  // 取**全部匹配中 passed 最大的那一行**（总计行必然最大）。
  const allTot = [...e2e2.matchAll(/(\d+)\s*通过[，,\s]+(\d+)\s*失败/g)];
  const m = allTot.length
    ? [null, allTot.reduce((a, b) => (Number(a[1]) >= Number(b[1]) ? a : b))[1],
             allTot.reduce((a, b) => (Number(a[1]) >= Number(b[1]) ? a : b))[2]]
    : null;
  const vm = e2e.match(/(\d+)\s*passed,\s*(\d+)\s*failed/i) || e2e.match(/(\d+)\s*通过[，,\s]+(\d+)\s*失败/);
  console.log(`  verify: ${vm ? `${vm[1]} 通过 / ${vm[2]} 失败` : '⚠️ 解析不到汇总'}`);
  console.log(`  run-all: ${m ? `${m[1]} 通过 / ${m[2]} 失败（取自 ${allTot.length} 行汇总中最大的一条）` : '⚠️ 解析不到汇总'}`);
  if (!vm || !m) {
    console.log('\n❌ 包内验收汇总解析失败 —— 不视为通过。原始输出尾部：');
    console.log('  verify : ' + e2e.slice(-300).split('\n').slice(-4).join(' | '));
    console.log('  run-all: ' + e2e2.slice(-300).split('\n').slice(-4).join(' | '));
    process.exit(1);
  }
  if (Number(m[2]) > 1 || Number(vm[2]) > 0) {
    console.log(`\n❌ 包内验收失败：run-all ${m[2]} 个 / verify ${vm[2]} 个（预期 run-all ≤1 = npm-package-integrity、verify = 0）。发布可疑，请人工复查。`);
    process.exit(1);
  }

  console.log(`\n✅ v${ver} 已发布 + 独立安装复验通过。`);
  const st = readJson(STATE, {});
  st.published = ver; st.publishedAt = new Date().toISOString();
  writeJson(STATE, st);
}

switch (CMD) {
  case 'init': cmdInit(); break;
  case 'finish': cmdFinish(); break;
  case 'queue': cmdQueue(); break;
  case 'state': cmdState(); break;
  case 'release': cmdRelease(); break;
  case 'publish': cmdPublish(); break;
  default:
    console.log('用法: node scripts/upgrade-engine.js init|finish|queue|state|release|publish [--yes]');
    process.exit(2);
}
