/**
 * test/mutation-guard-recovery.js
 *
 * [v6.7.125 第 469 轮] 变异守卫的「中断即留毒」兜底。
 *
 * 背景（本轮实测坐实，非推测）：
 *   本轮轮初体检发现工作区 src/index.js 被上一轮变异守卫留在**语法崩溃态**
 *   —— 一个少闭括号的空壳正则（[//(?!x)x/, '...'],）使 `require('./src/index.js')`
 *   直接 SyntaxError，bin/verify.js 与全部下游测试全挂。r452 / r455 两轮
 *   交接簿连续点名同型问题，说明这不是一次性事故而是**结构性复发**。
 *
 * 根因（已用代码确认）：
 *   test/run-all.js 的 runChild() 用 execSync(timeout = CHILD_TIMEOUT=90000)。
 *   超时后它先 killOrphans() 发 SIGKILL，再抛错。**SIGKILL 不可捕获**，
 *   测试文件里 `try { ... } finally { fs.writeFileSync(SRC, orig) }` 的还原块
 *   在 SIGKILL 下根本不会执行 → SRC 被永久留在变异态。
 *   （同理：宿主进程被 cron/terminal 超时杀掉、机器掉电、手动 Ctrl-C
 *     SIGINT 在少数写法下也会绕过 finally。）
 *
 * 方案：侧车备份 + 首个运行的恢复守卫
 *   1) arm(srcPath) 在**任何**写盘变异前调用：把原始内容写到
 *      data/.mutation-guard/<sha1>.bak（gitignore 覆盖 data/**\/*.json，
 *      但 .bak 也被 *.bak 忽略，不进版本库），再注册恢复钩子。
 *   2) 恢复钩子覆盖可捕获路径：process exit / SIGINT / SIGTERM /
 *      SIGBREAK / beforeExit，以及 normalExit 的 finally。
 *   3) 对**不可捕获**的 SIGKILL 路径，本模块提供一个全局安全网：
 *      任何 require 本模块的测试在**启动时**先调用 recover() ——
 *      若发现侧车里存在「已 arm 但进程已死」的残留备份，说明上一次运行
 *      是被硬杀在变异中，立刻把 SRC 还原回原始内容并删掉侧车。
 *      这样即使本轮被杀，下一轮第一个测试也会自动解毒。
 *
 *   ⚠️ [v6.7.124+1 第 472 轮] owner 存活闸（修「守卫自盲」事故）：
 *      r469/r470 接入后，r417/r420/r446/r463 四个变异守卫测试**同时假阴性**
 *      （exit=0、报「守卫不敏感」）。根因：arm(SRC, 健康内容) 写在
 *      writeFileSync(变异) 之前 → 侧车存的是**健康**内容 → 被 spawn 的
 *      子进程启动时执行 recover()，把父进程刚写下的变异**还原洗掉**，
 *      子进程于是看到健康引擎、前置断言全过、exit 0。
 *      修法：arm() 同时写 `<hash>.bak.pid.bak` 记录 arming 进程 pid；
 *      recover() 先查 pid 是否存活——**存活就一律不还原**
 *      （它可能正在变异中，洗它等于替它掩盖缺陷）；只有确认 arming 进程
 *      已死（正是 SIGKILL 场景）才走 restoreOne。语义对齐设计意图：
 *      「为已死的 arm 兜底，绝不打扰活着的 arm」。
 *
 * 用法（测试文件内）：
 *     const { arm, disarm, recover } = require('./mutation-guard-recovery.js');
 *     recover();                       // 启动即解毒上一次硬杀残留
 *     const SRC = path.join(ROOT, 'src/index.js');
 *     const orig = fs.readFileSync(SRC, 'utf8');
 *     arm(SRC, orig);                 // 写盘变异前必须调用
 *     ... writeFileSync(SRC, mutated) ...
 *     disarm(SRC);                    // 变异结束（无论成败）后调用
 *     // 之后照旧写自己的 finally / spawn 断言
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SIDECAR_DIR = path.join(ROOT, 'data', '.mutation-guard');

/** 本进程已 arm 的源文件 -> 侧车备份路径 */
const armed = new Map();
let hooksInstalled = false;

function srcHash(absPath) {
  return crypto.createHash('sha1').update(absPath).digest('hex').slice(0, 16);
}

function sidecarPath(absPath) {
  return path.join(SIDECAR_DIR, srcHash(absPath) + '.bak');
}

/** arming 进程的 pid/mtime 记录文件（[r472] 新增，存活闸用） */
function ownerPath(absPath) {
  return sidecarPath(absPath) + '.pid.bak';
}

/** 读文件 mtimeMs；失败返回 null（不抛） */
function safeMtime(absPath) {
  try { return fs.statSync(absPath).mtimeMs; } catch (_) { return null; }
}

/** pid 存活探测。kill(pid,0)：不存在 → ESRCH，无权限 → EPERM（仍算存活）。 */
function pidAlive(pid) {
  if (!Number.isFinite(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; }
  catch (e) {
    if (e && e.code === 'EPERM') return true;   // 属于别的用户，但确实活着
    return false;                                // ESRCH —— 进程已死
  }
}

/**
 * [r473] 判定 pid 是否「作为可运行进程活着」。
 *
 * 背景（T2 实测坐实）：子进程 SIGKILL 后进入**僵尸态（Z）**——父进程还没
 * wait() 回收它，内核保留 task_struct。此时 process.kill(pid, 0) 仍然成功
 * （信号能投递到僵尸），于是在**同一次 node 运行内**紧接着做 recover() 时，
 * pid 存活探测返回 true，owner 闸把侧车判成「活着的 arm」直接跳过，
 * SIGKILL 解毒这一整条路径永久失效（实测 recover()=0，毒留存盘）。
 *
 * 僵尸不是活进程：它不执行任何代码、不可能再变异任何文件。判定活必须看
 * /proc/<pid>/stat 的 state——Z 一律算死。
 *
 * @param {number} pid
 * @returns {boolean}
 */
function pidRunnable(pid) {
  if (!pidAlive(pid)) return false;
  const st = procStat(pid);
  if (!st) return true;                 // 非 Linux / 读不到 → 保持旧行为
  return st.state !== 'Z' && st.state !== 'X';
}

/**
 * [r473] 读 /proc/<pid>/stat 的 state（field3）与 starttime（field22）。
 * @returns {{state:string, starttime:string}|null} 非 Linux / 读不到 → null
 */
function procStat(pid) {
  try {
    const raw = fs.readFileSync('/proc/' + pid + '/stat', 'utf8');
    // comm 字段可含空格与括号，从最后一个 ')' 之后切分
    const rp = raw.lastIndexOf(')');
    if (rp < 0) return null;
    const rest = raw.slice(rp + 2).split(' ');
    // rest[0]=state(field3)，starttime=field22 → 索引 19
    return { state: rest[0], starttime: rest[19] || '' };
  } catch (_) { return null; }
}

/**
 * [r472] 这个侧车是否属于一个**仍然活着**的进程？
 * 活着 → true：recover() 绝对不能还原（那个人可能正在变异中）。
 * @returns {boolean}
 */
function ownerAlive(absPath) {
  const p = ownerPath(absPath);
  if (!fs.existsSync(p)) {
    // 没有 owner 记录（r472 之前的旧侧车 / 手工留下的）：
    // 保守判定为「非活」，让 recover() 照旧解毒 —— 旧行为的兼容。
    return false;
  }
  try {
    const parts = fs.readFileSync(p, 'utf8').trim().split(' ');
    const pid = Number(parts[0]);
    if (!pidRunnable(pid)) return false;
    // [r473] pid 能跑不等于「本侧车仍属这个进程」。pid 会被 OS 回收复用——
    // owner 本尊 SIGKILL 之后过一会儿，同一 pid 号可能已被一个毫不相干的新
    // 进程拿到。用开机相对启动时刻 starttime 做僵尸检测：记下的 starttime 与
    // 现在读到的对不上，说明本尊已死、号被复用，判为「非活」，让 recover 解毒。
    // 旧格式（无 starttime 字段）时无法证伪同一性 → 判活（旧行为）。
    const st = procStat(pid);
    if (st && st.starttime && parts[1] !== undefined && String(parts[1]) !== String(st.starttime)) return false;
    return true;
  } catch (_) { return false; }
}

function ensureDir() {
  try { fs.mkdirSync(SIDECAR_DIR, { recursive: true }); } catch (_) {}
}

/**
 * arm：在写盘变异前调用。写侧车备份 + 注册恢复钩子。
 * @param {string} absPath 将被写盘变异的源文件绝对路径
 * @param {string} originalContent 原始内容（调用方刚 readFileSync 到的）
 */
function arm(absPath, originalContent) {
  ensureDir();
  const sc = sidecarPath(absPath);
  fs.writeFileSync(sc, originalContent, 'utf8');
  // [r473] owner 记录带 arming 进程的**开机相对启动时刻**（/proc/<pid>/stat
  // 的 starttime，field 22）。它与 pid 一起构成进程同一性：pid 会被 OS 回收
  // 复用，starttime 不会。recover() 靠它认出「pid 号被复用、本尊已死」的
  // 僵尸侧车，避免把一个毫不相干的新进程误判成「活着的 arm」而拒绝解毒。
  const ownerSc = ownerPath(absPath);
  const st = procStat(process.pid);
  fs.writeFileSync(ownerSc, String(process.pid) + ' ' + String(st ? st.starttime : '') + ' ' + safeMtime(absPath), 'utf8');
  armed.set(absPath, sc);
  installHooks();
}

/** disarm：变异结束。若目标文件已被还原，删除侧车。 */
function disarm(absPath) {
  const sc = armed.get(absPath);
  if (!sc) return;
  armed.delete(absPath);
  try {
    const cur = fs.readFileSync(absPath, 'utf8');
    // 只有确认目标已回到原始内容才删侧车；否则留着，让下一个进程 recover()
    const bak = fs.readFileSync(sc, 'utf8');
    if (cur === bak) {
      try { fs.unlinkSync(sc); } catch (_) {}
      try { fs.unlinkSync(ownerPath(absPath)); } catch (_) {}
    }
  } catch (_) {}
}

/** 恢复单个源文件（供 recover / 信号钩子共用） */
function restoreOne(absPath) {
  const sc = sidecarPath(absPath);
  if (!fs.existsSync(sc)) return false;
  const bak = fs.readFileSync(sc, 'utf8');
  const cur = fs.existsSync(absPath) ? fs.readFileSync(absPath, 'utf8') : null;
  if (cur !== bak) {
    fs.writeFileSync(absPath, bak, 'utf8');
  }
  try { fs.unlinkSync(sc); } catch (_) {}
  try { fs.unlinkSync(ownerPath(absPath)); } catch (_) {}
  return true;
}

/**
 * recover：启动即解毒。处理「上一次运行被硬杀在变异中」的残留。
 * 幂等、无副作用（无残留时零写盘）。
 * @param {string[]} [candidates] 要检查的绝对路径列表；默认覆盖引擎主文件
 */
function recover(candidates) {
  const list = Array.isArray(candidates) && candidates.length
    ? candidates
    : [path.join(ROOT, 'src', 'index.js')];
  let n = 0;
  let skipped = 0;
  for (const p of list) {
    try {
      // [r472] owner 存活闸：arming 进程还活着 → 它可能正在变异中，
      // 此时还原等于替它掩盖缺陷（r417/r420/r446/r463 假阴性事故的根因）。
      // 只有确认 arming 进程已死，才恢复 —— 这正是 SIGKILL 场景。
      if (ownerAlive(p)) { skipped++; continue; }
      if (restoreOne(p)) n++;
    } catch (_) {}
  }
  global.__hf_mg_last = { restored: n, skippedAlive: skipped };
  return n;
}

/** 是否曾在本进程被 arm 过（测试断言可用） */
function isArmed(absPath) { return armed.has(absPath); }

function installHooks() {
  if (hooksInstalled) return;
  hooksInstalled = true;

  const cleanup = () => {
    for (const p of Array.from(armed.keys())) {
      try { restoreOne(p); } catch (_) {}
    }
  };

  // 可捕获的退出路径：正常结束 / 未捕获异常 / beforeExit
  process.on('exit', cleanup);
  process.on('beforeExit', cleanup);

  // Ctrl-C / kill 默认信号：SIGTERM/SIGINT 可捕获 —— 装了就救得回来。
  // SIGKILL 不能捕获，那种情况靠下一个进程的 recover() 兜底。
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGBREAK']) {
    try {
      process.on(sig, () => { cleanup(); process.exit(130); });
    } catch (_) {}
  }
}

module.exports = { arm, disarm, recover, restoreOne, isArmed, sidecarPath, ownerPath, ownerAlive, pidAlive, pidRunnable, procStat, SIDECAR_DIR };
