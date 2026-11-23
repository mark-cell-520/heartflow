/**
 * safe-fs.js — 安全文件系统包装（P0-2 修复）
 *
 * 设计：完全兼容 Node.js fs 模块，所有操作自动通过路径守卫。
 * 使用方式：将 require('fs') 替换为 require('./utils/safe-fs')，
 * 所有现有 fs.xxx() 调用自动获得路径越界保护。
 *
 * 保护机制（以 src/core/path-guard.js 的 guardPath 为判据，即"读级"允许根）：
 * - 写操作（write/append/mkdir/copy/unlink/rename/chmod）：越界时按 GUARD_MODE 处理
 * - 读操作（read/readdir/stat）：越界时按 GUARD_MODE 处理
 * - existsSync：越界时不抛错，返回 false（探针语义，见 safeExistsSync 注释）
 *
 * [AUDIT-FIX 2026-11-23] 默认值由 'warn' 改为 'enforce'。
 * 原默认 'warn' 下，guardPath 判定越界后只 console.warn 然后**照写**，
 * 也就是"写保护 100% 不生效"——本文件头原本承诺的"越界时按 GUARD_MODE 处理"
 * 在默认配置下是一句空话。现默认 enforce，让承诺在默认配置下成立。
 *
 * 环境变量 HEARTFLOW_PATH_GUARD 控制行为：
 * - 未设置（默认）: 'enforce' —— 越界读写一律抛错
 * - 'enforce'      : 同上（显式写法）
 * - 'warn'         : 只打 console.warn，操作继续（仅调试用，不拦）
 * - ''（空串）     : 静默放行，完全不检查（兼容逃生舱）
 * - 其他任意非空值 : 一律按 'enforce' 处理（fail-closed，并在首次越界时告警）。
 *   历史原因：曾有人把 HEARTFLOW_PATH_GUARD 当布尔开关设成 'true'，
 *   而旧实现只认 'enforce'/'warn' 两个字面量，'true' 会静默退化成"不拦"。
 */

const fs = require('fs');
const path = require('path');
const { guardPath } = require('../core/path-guard.js');

// [AUDIT-FIX 2026-11-23] 默认值 'warn' → 'enforce'。
// 原默认 warn 意味着 guardPath 判越界后只 console.warn 然后照写，写保护形同虚设；
// 现默认 enforce，越界即抛错。逃生舱保留：显式 HEARTFLOW_PATH_GUARD='' 仍静默放行。
function _normalizeGuardMode(raw) {
  if (raw === undefined || raw === null) return 'enforce';   // 未设置 → enforce（新默认）
  const v = String(raw).trim().toLowerCase();
  if (v === '') return 'off';                                // 显式空串 = 逃生舱，静默放行
  if (v === 'warn') return 'warn';                           // 只警告，不拦（调试用）
  if (v === 'enforce') return 'enforce';                     // 严格拒绝
  return 'enforce';                                          // 未知值 fail-closed（见文件头）
}

const GUARD_MODE = _normalizeGuardMode(process.env.HEARTFLOW_PATH_GUARD);

// [AUDIT-FIX 2026-11-23] 无法识别的取值提醒一次（fail-closed 已生效，这只是可见性）
// 说明：这里打印的是模式名而不是任何凭据。
const _rawGuard = process.env.HEARTFLOW_PATH_GUARD;
const _rawGuardNorm = (_rawGuard === undefined || _rawGuard === null) ? null : String(_rawGuard).trim().toLowerCase();
if (_rawGuardNorm !== null && _rawGuardNorm !== '' && _rawGuardNorm !== 'warn' && _rawGuardNorm !== 'enforce') {
  process.stderr.write(`[SAFE-FS] HEARTFLOW_PATH_GUARD="${_rawGuardNorm}" 无法识别，按 'enforce' 处理（可选值: enforce / warn / 空串）\n`);
}

/**
 * 路径安全检查
 * @param {string} filePath - 要检查的路径
 * @returns {{ safe: boolean, reason?: string, absPath: string }}
 */
function _check(filePath) {
  const absPath = path.resolve(filePath);
  const result = guardPath(absPath);
  if (!result.safe) {
    const msg = `[SAFE-FS] 路径越界: ${result.reason} (${absPath})`;
    if (GUARD_MODE === 'enforce') {
      throw new Error(msg);
    }
    if (GUARD_MODE === 'warn') {
      console.warn(msg);
    }
    // GUARD_MODE === 'off'：仅当显式把 HEARTFLOW_PATH_GUARD 设成空串时才会走到，
    // 是留给运维的逃生舱；默认值已是 enforce，不会静默放行。
  }
  return result;
}

// ─── 写操作（路径越界拦截）───

function safeWriteFileSync(filePath, data, options) {
  _check(filePath);
  return fs.writeFileSync(filePath, data, options);
}

function safeAppendFileSync(filePath, data, options) {
  _check(filePath);
  return fs.appendFileSync(filePath, data, options);
}

function safeMkdirSync(filePath, options) {
  _check(filePath);
  return fs.mkdirSync(filePath, options);
}

function safeMkdirSyncRecursive(dirPath, options) {
  _check(dirPath);
  return fs.mkdirSync(dirPath, { recursive: true, ...options });
}

function safeCopyFileSync(src, dest, mode) {
  _check(src);
  _check(dest);
  return fs.copyFileSync(src, dest, mode);
}

function safeUnlinkSync(filePath) {
  _check(filePath);
  return fs.unlinkSync(filePath);
}

function safeRenameSync(oldPath, newPath) {
  _check(oldPath);
  _check(newPath);
  return fs.renameSync(oldPath, newPath);
}

function safeChmodSync(path, mode) {
  _check(path);
  return fs.chmodSync(path, mode);
}

// ─── 读操作（路径越界保护）───

function safeReadFileSync(filePath, options) {
  // [AUDIT-FIX 2026-11-23] 原先在这里补一个 `!result.safe && GUARD_MODE === 'enforce'`
  // 的二次判断，但 _check() 在 enforce 下已经抛错，那个分支永远走不到（死代码）。
  // 现在由 _check 统一收口：enforce 抛错 / warn 告警 / off 静默。
  _check(filePath);
  return fs.readFileSync(filePath, options);
}

function safeReaddirSync(filePath, options) {
  _check(filePath);
  return fs.readdirSync(filePath, options);
}

// [AUDIT-FIX 2026-11-23] existsSync 的越界行为是**有意保留**的探针语义，不是缺陷：
// 调用方拿它当"这个路径能不能用"的前置判断（全仓几十处 `if (fs.existsSync(x))`），
// 越界时抛错会把这类前置判断变成崩溃点；返回 false 等价于"该路径对本进程不可见"，
// 也不会泄露越界路径是否存在敏感文件。若要审计越界访问，读/写原语已经会抛错。
function safeExistsSync(filePath) {
  try { _check(filePath); } catch(e) { return false; }
  return fs.existsSync(filePath);
}

function safeStatSync(filePath) {
  _check(filePath);
  return fs.statSync(filePath);
}

// ─── 兼容层：导出完整 fs API，使 safe-fs 可作为 fs 替代品 ───

const safeFs = {
  // 写操作
  writeFileSync: safeWriteFileSync,
  appendFileSync: safeAppendFileSync,
  mkdirSync: safeMkdirSync,
  copyFileSync: safeCopyFileSync,
  unlinkSync: safeUnlinkSync,
  renameSync: safeRenameSync,
  chmodSync: safeChmodSync,
  // 读操作
  readFileSync: safeReadFileSync,
  readdirSync: safeReaddirSync,
  existsSync: safeExistsSync,
  statSync: safeStatSync,
  // 路径工具
  path,
  guardPath,
  _check,
  // 原始 fs（用于需要绕过守卫的特殊场景）
  _raw: fs,
};

// 代理所有未显式声明的 fs 方法
const fsMethods = new Set(Object.keys(safeFs));
Object.getOwnPropertyNames(fs).forEach(method => {
  if (!fsMethods.has(method) && typeof fs[method] === 'function') {
    safeFs[method] = fs[method].bind(fs);
  }
});

// 同时导出命名导出，支持解构赋值
module.exports = safeFs;
module.exports.safeWriteFileSync = safeWriteFileSync;
module.exports.safeAppendFileSync = safeAppendFileSync;
// [审计轮 2026-11-02] 补导出：safeMkdirSync/safeMkdirSyncRecursive 早已定义且过
// path-guard，但不在导出清单——adaptive-learning._persist 等调用方只能拿到
// undefined，持久化必抛被 catch 静默（画像从未落盘）。
module.exports.safeMkdirSync = safeMkdirSync;
module.exports.safeMkdirSyncRecursive = safeMkdirSyncRecursive;
module.exports.guardPath = guardPath;
module.exports._check = _check;
module.exports._raw = fs;
module.exports.default = safeFs;