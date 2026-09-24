// ═══════════════════════════════════════════════════════════════════════
// HeartFlow 版本号 — 唯一真相源 (Single Source of Truth)
//
// 修改版本号 ONLY 在这里。其他所有文件从此文件或运行时读取。
// ═══════════════════════════════════════════════════════════════════════

// 同步策略：
//   package.json  → 由 scripts/sync-version.js 在 publish 前同步
//   VERSION 文件  → 由 scripts/sync-version.js 同步
//   SKILL.md      → 动态读取或无需硬编码
//   README.md     → 动态读取或无需硬编码
//   CHANGELOG.md  → 历史记录，不需要同步

'use strict';

const fs = require('../utils/safe-fs');
const path = require('path');

// 从 VERSION 文件读取版本号（唯一真相源）。
// 兜底值必须与 VERSION 保持同步 —— 否则 VERSION 文件读失败时（打包遗漏/权限问题）
// 引擎会自报一个落后几十个版本的号，且外部没有任何提示。
// scripts/sync-version.js 负责在发布前把这里和 VERSION 一起写。
// [v6.7.102] 兜底值 6.7.69 → 6.7.102：注释一直写「必须与 VERSION 保持同步」，
// 实测从 6.7.69 起就没同步过（第 2 轮升级时 grep 才发现）。VERSION 读失败时
// 引擎会自报落后 33 个版本的号，正是这个注释想防的情况。
// [v6.7.103] 第 3 轮同步：6.7.102 → 6.7.103。此后每轮 bump 都要带这一处。
// [v6.7.105] 第 5 轮同步：6.7.103 → 6.7.105。v6.7.105 升级 gaslighting
// 记忆篡改句式，顺带把 v6.7.102→103 期间漏掉的一次同步补上。
// [v6.7.107] 第 7 轮同步：6.7.106 → 6.7.107（撤回型情感要挟中英补齐）。
// [v6.7.111] 第 11 轮同步：6.7.109 → 6.7.111（接手第 10 轮 reward_hacking 新维度
//                 v6.7.110 的收尾，并修掉它引入的 conda 误拦 + etc/passwd 漏报）。
let VERSION = '6.7.118';  // 兜底版本（与 VERSION 文件一致；sync-version.js 不管这里，每次 bump 需手动同步）

try {
  const versionPath = path.join(__dirname, '..', '..', 'VERSION');
  const versionContent = fs.readFileSync(versionPath, 'utf-8');
  VERSION = versionContent.trim();
} catch (e) {
  console.warn('[version.js] 无法读取 VERSION 文件，使用兜底版本:', VERSION);
}

module.exports = { VERSION };
