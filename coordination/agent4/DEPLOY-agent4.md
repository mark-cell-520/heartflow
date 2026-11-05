# DEPLOY-agent4 — 4 号协同指令（海外产能单元）

> 本文件是仓库内协同指令，会随仓库 push 到 GitHub，供 4 号 agent 与其他人对账。
> 完整部署体系在宿主侧 `/root/hermes1/deploy-agent4/`（含 cron/scripts/prompts/templates）。

## 角色定义

| 项 | 值 |
|---|---|
| agent | `agent-4` |
| 环境 | 美国 IP |
| 定位 | **海外产能单元**：GitHub 通道顺畅 + 国外论文/开源资源可达 |
| 写权限 | `coordination/`、`src/core/ethics/`、`src/core/psychology/`、`consciousness/`、`src/plugins/`、`src/tools/`、`UPGRADE_LOG.md`（追加）、`VERSION` |
| 禁写 | `src/index.js`、四个门禁脚本、`README.md`、`SKILL.md`、`AGENTS.md` |

## 轮次认领格式

```jsonl
{"round":"rNNN","agent":"agent-4","kind":"dimension|fix|research","direction":"<方向>","claim_at":"<ISO8601 UTC>","expires_hours":6,"status":"active"}
{"round":"rNNN","agent":"agent-4","kind":"dimension","claim_at":"<ISO8601 UTC>","status":"completed"}
{"round":"rNNN","agent":"agent-4","kind":"release","claim_at":"<ISO8601 UTC>"}
```

- 同一时间只有一个 agent 可持有写轮次（kind=dimension/fix）。被占 → 降级 research 轮。
- 超 `expires_hours=6` 未推进，其他 agent 可 takeover（takeover 前必须先读该轮的 UPGRADE_LOG 条目）。

## 每轮产出

1. commit（message 形如 `rNNN: dimension by agent-4 (vX.Y.Z)`）
2. `coordination/reports/rNNN-<kind>-agent4.md`（模板见宿主侧 `deploy-agent4/templates/REPORT-TEMPLATE.md`）
3. 门禁实测数字（来自本轮真实运行，不许填想象值）
4. claims.jsonl 状态推进

## 真升级判定

只有四条算升级：① 新判别维度 ② 已有维度全新措辞家族 ③ 接线已加载未调度能力 ④ 新 MCP 工具/dispatch 路由。

**不算升级**：负例补丁、更多良性样本、修复上轮回归、改文档数字、调阈值、重构、注释改动。
修复轮可递增 VERSION，但报告必须写"真升级类型 0"。

## 海外资源扫描口径

`hf4-scout.sh` 走 arXiv API / GitHub API / Semantic Scholar API，原始结果落 `coordination/agent4/scout/`。
**空返必须明确写"空返，按既有形态自建"，严禁编造命中。**

## 硬禁令

- 不 `git push --force`
- 不编造数字
- 不写 key/token/密码/连接串进任何文件
- 不改测试断言迁就代码
- 轮次号不复用
- 宁可少改一个文件，也要保证本轮有 commit
