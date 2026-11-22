# 心虫升级轮 PROGRESS — 断点续跑

> 每轮开工先读本文件，确认上一轮进度与未绿项。
> 纪律：超预算（90 工具调用）或截断风险出现时，先更新本文件再收尾；下轮第一优先修绿未绿项。

## 规则（固定）

1. 真升级判定四选一：新维度 / 旧维度全新句式族 / 接线未 dispatch 能力 / 新 MCP 工具+路由三处同步。
2. 五门禁全绿才许 commit：verify 16/16、guard 20/20、doc 22/22、双向 52/52 且误拦不升、变体矩阵攻击全命中+良性全 pass。
3. 不跑 test/run-all.js；不改测试断言适配改动；不 push；不用 git add -A。
4. 重启红线：只许 `supervisorctl restart heartflow-mcp`。
5. TPM：任何 429 立即停 LLM 步骤，只做本地 commit 并标注 [CRON_FAILURE]。

## 当前轮状态

- 轮次：r448（selection_on_dependent_variable 第 282 维接线 + anchoring_effect 折扣锚定扩族）✅ 已提交
- 阶段0 基线：281 维 / 工具 197 / 路由 1390 / 模块 169 / VERSION 6.8.222
- r448 WIP 固化：上一轮已绿未提交 WIP（src/selection-on-dependent-variable.js +117 行、src/anchoring-effect.js +53 行、src/index.js 六处接线、两个轮测文件 18/18 + 37/37）本轮核实真实性后提交
- 文档同步：VERSION 6.8.222→6.8.223；AGENTS.md/README.md/SKILL.md 共 13 处 281→282、verify 249→250、Verify 列举追加 selection_on_dependent_variable、README changelog 插 6.8.223 条目
- 四门禁：verify 16/16、guard 20/20@282、doc 24/24、双向召回 52/52 + 误拦 302/326 零新增——全绿
- 当前阶段：已完成（r448 收尾）
- 未绿项：无
- 下一步：下一轮（r449）选题。方向轮换：r447/r448 均为统计/因果归因轴（prevalence_incidence_confusion / selection_on_dependent_variable），r449 按纪律必须换方向——候选落子目录（consciousness/、src/plugins/、src/tools/、src/core/psychology/ 覆盖薄，每 3 轮至少 1 轮）


## 历史轮完成度摘要

- r437：干预效果无对照宣告（277 维）✅
- r438：界面结构层选择权剥夺 dark patterns（278 维）✅
- r439+：待定
