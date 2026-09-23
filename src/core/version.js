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
let VERSION = '6.7.102';  // 兜底版本（与 VERSION 文件一致）

try {
  const versionPath = path.join(__dirname, '..', '..', 'VERSION');
  const versionContent = fs.readFileSync(versionPath, 'utf-8');
  VERSION = versionContent.trim();
} catch (e) {
  console.warn('[version.js] 无法读取 VERSION 文件，使用兜底版本:', VERSION);
}

module.exports = { VERSION };
