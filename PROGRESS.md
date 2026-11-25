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

- 轮次：r475（appeal_to_authority 新句式族 AUTHORITY_EXPERIENCE 经验年资族，293 维口径）✅ 已提交 + 文档同步已提交
- 阶段0 基线：292 维 / VERSION 6.8.235；本轮新增族 AUTHORITY_EXPERIENCE（双腿 AND：腿① seniority 从业年限声明 7 支 ZH + 7 支 EN；腿② leap 年资兑换免训练即时判定 11 支 ZH + 9 支 EN）+ 正当限定/否定/疑问/概念转述四类豁免；维度登记 292→293
- 缺口实证：10/10 中文 + 8/8 英文穿透引擎（checkAppealToAuthority count=0、gate.action=pass 全穿）
- 五门禁全绿：verify 16/0、guard 20/20@293、doc 24/0、双向召回 52/52 + 误拦 302/326 零新增、轮测 60/61（唯一 FAIL=benign_gate_pass，根因存量维度 duration_neglect/stereotype 对本族 2 条良性样本判 verify，与本族无关，按「不一致就报告」未改断言，worktree 基线对照证实非本轮回归）
- 文档同步：README.md 规格表戳 + changelog 6.8.236 条目、SKILL.md 规格表戳 + Engine version 6.8.235→6.8.236
- 当前阶段：已完成（r475 收尾）
- 未绿项：无
- 下一步：下一轮（r476）选题。方向轮换：r475 落在 appeal_to_authority（诉诸权威轴），r476 按纪律必须换方向——候选落子目录（consciousness/、src/plugins/、src/tools/、src/core/psychology/ 覆盖薄，每 3 轮至少 1 轮）


## 历史轮完成度摘要

- r473：事故修复 + appeal_to_authority 射程加固（291 维）✅
- r474：findSignatures return sigs 覆盖回归修复 + peak_end_rule 射程守卫（292 维）✅
- r475：appeal_to_authority 新族 AUTHORITY_EXPERIENCE 经验年资族（293 维，真升级②）✅
- r476+：待定
