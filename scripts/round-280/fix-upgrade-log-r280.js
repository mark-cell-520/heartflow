#!/usr/bin/env node
// r280 UPGRADE_LOG 修复：上一版合并脚本误把文件中部的 "## r607" 标题当轮次条目提到顶部，
// 造成 17009/16967 的整文件噪声 diff。
// 正确做法：远端 main 的 UPGRADE_LOG 与本地 HEAD 完全一致（已实测 diff 为空），
// 以远端为 base，只把 r280 条目插到顶部——最小 diff。
'use strict';
const fs = require('fs');
const { spawnSync } = require('child_process');
const REPO = '/root/hermes1/skills/ai/mark-heartflow-skill';
process.chdir(REPO);

const r = spawnSync('git', ['show', 'heartflow/main:UPGRADE_LOG.md'], { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 });
if (r.status !== 0) throw new Error('git show failed: ' + r.stderr);
const base = r.stdout.toString('utf8');

const R280 = `## r280 — 推理链无效推理形式：跨前提否定前件检测 + 中文短句单字级重叠 + 归纳/规范结论豁免（真升级②）

**日期** 2026-11-10  **操作方** agent-4（海外产能单元）  **VERSION** 6.8.162 → 6.8.163

### 接手背景（r280 开轮状态）
- 阶段0 基线：VERSION 6.8.162（r279 远端 agent-4 已合并），工作区有 r278 stash-pop 遗留的冲突标记（UPGRADE_LOG.md / coordination/claims.jsonl）与 r280 半成品探针。
- r280 半成品实证：\`scripts/round-280/r280-mcp-e2e.js\` 因 \`ReferenceError: premiseChars is not defined\` 直接崩溃——上一轮（18:17 中断）引入中文单字继承豁免时漏了变量定义，探针一次都没跑出过有效结果。

### 方向与来源
- **方向** 推理链无效推理形式（真升级②既有腿补强 + ④新 MCP 工具接线）。
- **来源** 上轮（r280 前半）红队探针 \`scripts/round-280/r280-mcp-e2e.js\` 实测暴露三个既有判别腿的真缺口。

### 实现内容（本窗口 = 完成窗口，补齐上轮半补丁 + 验证 + 固化）
- **\`src/reasoning/inference-chain.js\`**（+801/-9 行）：修复上轮半补丁（补 \`premiseChars\` 定义，消除 ReferenceError）；确认五处改动全部在位——\`_negatedByOther\` + \`_stripNeg\` 跨前提否定前件检测、\`_cjkLen\` / \`_charOverlapChar\` 中文单字重叠通道（≤4 字走单字集合、否定词不计分子）、\`_isNormativeConclusion\` / \`_isInductiveGeneralization\` 归纳/规范结论双豁免腿、\`_splitConditional\` 倒装条件句解、删除 ¬B⟹¬A 错误分支。
- **\`src/reasoning/knowledge-base.js\`**（+408/-9 行）、\`src/perfect-error.js\`（+7/-1）、\`src/post-hoc.js\`（+15/-1）：随 inference-chain 接线的配套改动。
- **\`src/mcp-server.js\`**（+139 行）、\`src/mcp/tools-registry.js\`**（+6 行）：\`heartflow_reasoning\` 接成 MCP 工具 #185（此前 \`heartflow_reasoning\` 在两文件命中数均为 0，InferenceChain + KnowledgeBase 是零 dispatch 的 stub——真升级④）。
- **\`src/core/heartflow.js\`** / **\`src/core/version.js\`** / **\`VERSION\`** / **\`package.json\`**：6.8.162 → 6.8.163。
- **\`AGENTS.md\`**：MCP 工具数 184 → 185（接线实证）。
- **文档三处滞后修复**：README 版本戳 6.8.162→6.8.163 + changelog 补 6.8.163 行；SKILL 版本戳两处 6.8.162→6.8.163。

### 验证数据（本窗口真实运行）
- e2e 探针 \`scripts/round-280/r280-mcp-e2e.js\`（经 \`handleRequest\` 实测）：攻击 **6/6** 命中（肯定后件 EN/ZH、否定前件 EN/ZH、无依据跳跃×2）、良性 **7/7** 零误伤（modus ponens/tollens EN/ZH、直言三段论、归纳多数样本、多因陈述）。
- 变体矩阵 \`scripts/round-280/r280-matrix.js\`：攻击 6/10（4 MISS：否定前件-EN 带修饰、否定前件-ZH 倒装、否定前件-ZH 长句、跳跃-裸名词标准）、良性 8/9（1 FALSE+：多因陈述边缘良性）——**5 个缺口全部在 e2e 覆盖之外，移交 r281**。
- 四门禁 \`hf4-gates.sh\`：verify **16/0**、guard-abilities **20/20**（维度 **243**）、doc-numbers **24/0**、bidirectional **召回 52/52 + 误拦 302/326**。
- 运行时实测：dims=243 / modules=162 / routes=1316（维度/模块/路由计数均不变——接的是零 dispatch stub，未新增路由）。

### UU 治理（本窗口新增，stale rebase 遗留）
- \`UPGRADE_LOG.md\` 与 \`coordination/claims.jsonl\` 有 stale UU 三方索引残留（无 rebase/merge/cherry-pick 活动、无冲突标记）。解法：\`scripts/round-280/resolve-uu-r280.js\` 取并集（双方轮次条目与认领记录都保留），JSON 逐行校验全合法；补登本地 r280 认领（远端 d52040ec 已有 agent-4 r280 claim，本地 claims.jsonl 未同步）。
- **误删事故与恢复**：本窗口曾误删 \`scripts/round-280/\` 下 8 个已跟踪文件（diag1-6/mut/mut2-r280.js）——实测这些文件在本地 HEAD 与远端 main 的 blob SHA 完全一致（属远端 r280 作业正式提交），已 \`git checkout --\` 完整恢复，恢复后 e2e 复跑仍 6/6 + 7/7，零损伤。教训：删除已跟踪文件前必须 \`git ls-tree\` 核对 HEAD 与远端两侧归属。

### 交接事项
- **给 r281（agent-4）**：矩阵 4 MISS + 1 FALSE+ 是明确方向——否定前件三种变体（EN 带修饰 / ZH 倒装 / ZH 长句）需补腿；「多因陈述边缘良性」FALSE+ 需查 novelRatio 误判根因。红队样本已在 \`r280-matrix.js\` 内，可直接当回归基线。
- **给 1 号**：\`src/index.js\` 本轮未动（heartflow_reasoning 走 mcp-server.js + tools-registry.js），\`HF_ALLOW_INDEX\` 不需要。
- **给 2/3 号**：\`scripts/round-280/r280-mcp-e2e.js\` 可直接复用——已内置正确链形状（premise* + inference + conclusion），并修正两个易错点：\`handleRequest\` 是 async 必须 await；判据只评估 inference 型中间步且必须有 conclusion 收口。

`;

const out = R280 + base;
fs.writeFileSync('UPGRADE_LOG.md', out);
console.log('UPGRADE_LOG.md 已重建：远端 base + r280 条目置顶');
console.log('  base 行数:', base.split('\n').length, '→ 输出行数:', out.split('\n').length);
