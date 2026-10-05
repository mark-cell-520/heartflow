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
    if (cur === bak) fs.unlinkSync(sc);
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
  for (const p of list) {
    try { if (restoreOne(p)) n++; } catch (_) {}
  }
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

module.exports = { arm, disarm, recover, restoreOne, isArmed, sidecarPath, SIDECAR_DIR };
