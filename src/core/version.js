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
// [v6.8.18] 第 667 轮同步：6.8.17 → 6.8.18（第 113 维度 future_faking
//                 归责绑架上线）。
// [v6.8.19] 第 669 轮同步：6.8.18 → 6.8.19（第 114 维度 economic_control
//                 经济控制 + 第 115 维度 triangulation 三角化上线；
//                 r668 遗留的 economic_control 本轮补提交）。
// [v6.8.24] 第 675 轮同步：6.8.23 → 6.8.24（第 120 维度
//                 reproductive_coercion 生育胁迫上线）。
// [v6.8.23] 第 674 轮同步：6.8.22 → 6.8.23（第 119 维度
//                 pet_harm_coercion 宠物伤害要挟上线）。
// [v6.8.22] 第 673 轮同步：6.8.21 → 6.8.22（第 118 维度
//                 thought_terminating_cliche 思想终止套话上线）。
// [v6.8.20] 第 670 轮同步：6.8.19 → 6.8.20（第 116 维度
//                 surveillance_normalization 监控正常化上线）。
// [v6.8.51] 第 704 轮同步：6.8.50 → 6.8.51（第 137 维度
//                 appeal_to_ridicule 诉诸嘲讽上线）。
// [v6.8.52] 第 705 轮同步：6.8.51 → 6.8.52（第 138 维度
//                 straw_man 稻草人谬误上线）。
// [v6.8.53] 第 706 轮同步：6.8.52 → 6.8.53（第 139 维度
//                 appeal_to_nature 诉诸自然谬误上线）。
// [v6.8.56] 第 710 轮同步：6.8.55 → 6.8.56（第 141 维度 tu_quoque 诉诸伪善新增）
// [v6.8.58] 第 712 轮同步：6.8.57 → 6.8.58（第 143 维度
//                 kafkatrapping 卡夫卡陷阱上线）。
// [v6.8.61] 第 715 轮同步：6.8.60 → 6.8.61（第 146 维度
//                 stereotype_origin 出身歧视上线）。
// [v6.8.60] 第 714 轮同步：6.8.59 → 6.8.60（第 145 维度
//                 concern_trolling 伪关心上线）。
// [v6.8.57] 第 711 轮同步：6.8.56 → 6.8.57（第 142 维度
//                 mind_reading 断言动机上线）
// [v6.8.54] 第 707 轮同步：6.8.53 → 6.8.54（第 62 维度
//                 appeal_to_ignorance 补举证倒置-需求形句式族）。
let VERSION = '6.8.70';  // 兜底版本（与 VERSION 文件一致；sync-version.js 不管这里，每次 bump 需手动同步）

try {
  const versionPath = path.join(__dirname, '..', '..', 'VERSION');
  const versionContent = fs.readFileSync(versionPath, 'utf-8');
  VERSION = versionContent.trim();
} catch (e) {
  console.warn('[version.js] 无法读取 VERSION 文件，使用兜底版本:', VERSION);
}

module.exports = { VERSION };
