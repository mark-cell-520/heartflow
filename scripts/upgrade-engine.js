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
    fs.writeFileSync(fd, JSON.stringify({ holder: who, at: new Date().toISOString() }) + '\n');
    fs.closeSync(fd);
    return true;
  } catch {
    const age = Date.now() - fs.statSync(LOCK).mtimeMs;
    // 超过 40 分钟视为僵尸锁（一轮 cron 最多 30 分钟 + 余量）
    if (age > 40 * 60 * 1000) {
      console.log(`  ⚠️ 发现僵尸锁（${Math.round(age / 60000)} 分钟前），按陈旧处理并接管`);
      fs.rmSync(LOCK, { force: true });
      return acquireLock(who);
    }
    const holder = readJson(LOCK, {});
    console.log(`  ❌ 锁被 ${holder.holder || '?'} 持有（${Math.round(age / 60000)} 分钟前）`);
    console.log('     本轮不启动写操作，避免两个执行体竞争同一份工作。');
    return false;
  }
}
const releaseLock = () => fs.rmSync(LOCK, { force: true });

// ─── 版本四处一致 ────────────────────────────────
function versionSync() {
  const v = V();
  const pkg = readJson(path.join(ROOT, 'package.json'), {}).version;
  const skill = (fs.readFileSync(path.join(ROOT, 'SKILL.md'), 'utf8').match(/^version:\s*["']?([\d.]+)["']?/m) || [])[1];
  const vjs = (fs.readFileSync(path.join(ROOT, 'src/core/version.js'), 'utf8').match(/let VERSION\s*=\s*'([\d.]+)'/) || [])[1];
  return { ok: v === pkg && v === skill && v === vjs, detail: { VERSION: v, packageJson: pkg, SKILLmd: skill, 'version.js': vjs } };
}

// ─── 检查项（全部可机器判定） ───────────────────
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

  console.log(`  本轮 = 第 ${st.round} 轮（上限 ${st.maxRound}）`);
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

switch (CMD) {
  case 'init': cmdInit(); break;
  case 'finish': cmdFinish(); break;
  case 'queue': cmdQueue(); break;
  case 'state': cmdState(); break;
  case 'release': cmdRelease(); break;
  default:
    console.log('用法: node scripts/upgrade-engine.js init|finish|queue|state|release');
    process.exit(2);
}
