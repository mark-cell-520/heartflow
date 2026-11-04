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
// [v6.8.80] 同步：6.8.79 → 6.8.80（test/run-all.js 串行改并发池 + 15 个测试文件
//                 Windows execPath 空格路径加引号；引擎 src/ 未动，仅测试链与版本传播）。
// [v6.8.81] 第 730 轮同步：6.8.80 → 6.8.81（normalize de_pinyin 英文破坏修复：
//                 空格链判据从「含任一拼音键」升级为「拼音键覆盖率 ≥ 50%」，
//                 英文句不再被抹空格+改词，攻击句从 pass 变 rewrite）。
// [v6.8.82] 第 731 轮同步：6.8.81 → 6.8.82（_dePinyin site 1 三缺陷修复：
//                 EN_WORD_EXCEPTIONS 英文词例外表 + _replacePinyinKeys 逐 token
//                 大小写不敏感替换 + 5c-post 还原闭环，7 种拼音注入形态
//                 pass → block，英文句零污染）。
// [v6.8.85] 第 734 轮同步：6.8.84 → 6.8.85（全量回归审计修复：612 个测试
//                 文件分段串行复跑，归因修 15 处引擎缺陷（sole-narrative
//                 EXCLUSIVE_ZH 死支、agency-deflection T5_EN 死支、
//                 dao-decision flag 未路由 verdict 等）+ 9 处豁免误伤/断线
//                 恢复，测试预期与维度口径过期断言同步更新）。
// [v6.8.84] 第 733 轮同步：6.8.83 → 6.8.84（英文注入同义族通道修复：
//                 新增 src/injection-synonyms.js，覆盖动词 × 指代锚点 ×
//                 规范宾语三族合取，一条判据覆盖 46,176 种组合，
//                 17 种同义替换注入形态 pass → block，
//                 双向门禁 326 条良性样本零新增误伤）。
// [v6.8.83] 第 732 轮同步：6.8.82 → 6.8.83（无空格英文注入通道修复：
//                 新增 src/despaced-injection.js，词边界 DP 还原 ≥16 字母的
//                 无空白英文串后过注入模式，35 种删空格注入形态
//                 pass → block，326 条良性语料 + 3255 个文档英文 token 零误伤）。
// [v6.8.89] 第 734 轮同步：6.8.88 → 6.8.89（evidence 维度复活：新增
//                 src/evidence-gap.js，DEMAND 类法则经验断言 × SUPPLY
//                 无证据标记两腿共现；evidence finding 从 378 条语料
//                 0 命中变成真判别，双向门禁误拦与基线完全一致）。
// [v6.8.90] 第 735 轮同步：6.8.89 → 6.8.90（注入混淆绕过通道：新增
//                 src/injection-obfuscation.js，两条通道补齐 prompt_injection
//                 的 BLOCK 级缺口——① 字母间撒分隔符（i-g-n-o-r-e / i.g.n.o.r.e，
//                 normalizer 的 strip_separator 只做成对合并 → ig-no-re，
//                 是比不处理更隐蔽的半修）② 无动词废止句式（the previous
//                 instructions are void，r733 三族合取的第二族恒缺）。
//                 14 条绕过形态 gate.action 从全 pass 变全 block，
//                 326 条良性语料零新增命中、双向门禁 52/52 + 302/326 不变）。
// [v6.8.91] 第 736 轮同步：6.8.90 → 6.8.91（引述语境降级面扩展：
//                 quotation-context.js 自 v6.7.71 起就在跑，但降级面只到
//                 block → verify，元话语文本上的 rewrite 误拦没被处理。
//                 326 条良性语料误拦 24 条里 11 条 quoted=true、其中 4 条
//                 判 rewrite（小说对白/剧本台词/访谈原话/论文手法分析）。
//                 新增 STRONG_THRESHOLD = 0.75 二级阈值与 tier 三态，
//                 强框架把 rewrite/verify 压到 pass（findings 不删）；
//                 BLOCK 级维度在任何一级都只到 verify。
//                 双向门禁 52/52 不变、误拦 302/326 → 306/326）。
// [v6.8.92] 第 737 轮同步：6.8.91 → 6.8.92（分隔符混淆通道 run 边界修复：
//                 SPRINKLED_RUN 结尾的 [A-Za-z] 会在词间空白被换成撒点字符时
//                 跨词吞掉下一个词的首字母，紧凑串变成 disregardp 还原失败，
//                 13 条 BLOCK 级绕过形态静默放行。改成边界修剪：剪掉尾部
//                 「分隔符 + 一个字母」后必须精确命中注入词表，视图游标同步
//                 推进到修剪点；镜像修了左界（撒点只覆盖词后半段时往前多吃
//                 一个字母）。新增 describeDelimiterChannel 逐 run 诊断。
//                 13 条绕过 → 10 条 block，双向门禁 52/52 + 306/326 不变，
//                 570,889 句全仓库散文送检与 HEAD 差额 0）。
// [v6.8.93] 第 738 轮同步：6.8.92 → 6.8.93（post_hoc R2 的 EN 侧第三腿
//                 「归因主张」补线：guidance 明文承诺「只有时间陈述无归因
//                 主张，是正常事件记录」，但 r720 建维度时 EN 侧只有
//                 「干预 × 变化」两腿，ZH 侧靠 CHANGE_ZH 统一带「就」做
//                 紧随相随的形状区分，EN 侧自建维度起没有对应约束。中性工程
//                 复盘 15 条误判 14 条全 rewrite → 0 条；r720 存量攻击样本
//                 20 条零退化；存量红测试 dimension-action-wiring 转绿。
//                 新增 describePostHoc / postHocLegs 逐路由逐腿诊断）。
// [v6.8.94] 第 739 轮同步：6.8.93 → 6.8.94（全量回归汇总行解析面扩容：
//                 49 个测试文件落进「未输出『N 通过, M 失败』结果行」桶，
//                 跑完、有输出、exit 0，只是汇总行格式不被 runner 认识。
//                 解析器抽成单一来源 test/_summary-parse.js，新增 6 族格式，
//                 45/49 救回、496 个此前隐形的断言数得以计入。纯 runner 侧
//                 改动，引擎零行为变化）。
// [v6.8.95] 第 740 轮同步：6.8.94 → 6.8.95（回归突变期与数字记账互斥 +
//                 突变残留完整收底：r739 把模块数 161 记成 157、路由 1314
//                 记成 1264，轮初复测证明记账脚本零 src/ 写入，真正的因是
//                 测量与回归的删条突变窗口没有互斥 + runner 回滚不删新增
//                 残留。新模块 src/core/mutation-guard.js，刻意不进
//                 _modules 以保 161/1314 基线，MCP 只读工具
//                 heartflow_mutation_guard 三处接线）。
let VERSION = '6.8.95';  // 兜底版本（与 VERSION 文件一致；sync-version.js 不管这里，每次 bump 需手动同步）

try {
  const versionPath = path.join(__dirname, '..', '..', 'VERSION');
  const versionContent = fs.readFileSync(versionPath, 'utf-8');
  VERSION = versionContent.trim();
} catch (e) {
  console.warn('[version.js] 无法读取 VERSION 文件，使用兜底版本:', VERSION);
}

module.exports = { VERSION };
