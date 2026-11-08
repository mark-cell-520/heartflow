# DEPLOY-agent4 — 4 号协同指令（海外产能单元）

> 本文件是仓库内协同指令，会随仓库 push 到 GitHub，供 4 号 agent 与其他人对账。
> 完整部署体系有**两处**：宿主侧 `/root/hermes1/deploy-agent4/`（cron/scripts/prompts/templates，
> 4 号 agent 实际执行处）与仓库内 `coordination/agent4/deploy/`（随仓库同步的脚本副本，
> 已核对与宿主侧 `scripts/` 下 8 个 `hf4-*.sh` 逐字节一致）。
> **不存在独立的 clone 部署副本**：4 号直接在仓库本体 `/root/hermes1/skills/ai/mark-heartflow-skill` 工作。

## 角色定义

| 项 | 值 |
|---|---|
| agent | `agent-4` |
| 环境 | 美国 IP |
| 定位 | **海外产能单元**：GitHub 通道顺畅 + 国外论文/开源资源可达 |
| 写权限 | `coordination/`、`src/core/ethics/`、`src/core/psychology/`、`consciousness/`、`src/plugins/`、`src/tools/`、顶层 `src/*.js` 维度模块（r227 起授权）、`UPGRADE_LOG.md`（追加）、`VERSION`、`test/`、`scripts/round-`、`docs/`、`data/`、`package.json`、`README.md`、`SKILL.md`、`AGENTS.md`（后四项与 1 号共用，动手前先 fetch 避让） |
| 禁写 | `src/index.js`（全局接入点，1 号独占；仅审计修复可凭 `HF_ALLOW_INDEX=1` 显式放行，动前须 `hf4-claim.sh scan`）、四个门禁脚本、`bin/verify.js`、`scripts/guard-abilities.js`、`scripts/bidirectional-guard.js`、`test/doc-numbers-accuracy.test.js` |

## 轮次认领格式

```jsonl
{"round":"rNNN","agent":"agent-4","kind":"dimension|fix|research","direction":"<方向>","claim_at":"<ISO8601 UTC>","expires_hours":6,"status":"active"}
{"round":"rNNN","agent":"agent-4","kind":"dimension","claim_at":"<ISO8601 UTC>","status":"completed"}
{"round":"rNNN","agent":"agent-4","kind":"release","claim_at":"<ISO8601 UTC>"}
```

- 同一时间只有一个 agent 可持有写轮次（kind=dimension/fix）。被占 → 降级 research 轮。
- 超 `expires_hours=6` 未推进，其他 agent 可 takeover（takeover 前必须先读该轮的 UPGRADE_LOG 条目）。

## 每轮产出

1. commit（message 形如 `rNNN: dimension by agent-4 (vX.Y.Z)`；由 `hf4-commit.sh` 落盘并跑隐私闸）
2. `coordination/reports/rNNN-<kind>-agent4.md`（模板见宿主侧 `deploy-agent4/templates/REPORT-TEMPLATE.md`，与仓库内 `coordination/agent4/deploy/REPORT-TEMPLATE.md` 同源）
3. 门禁实测数字（来自本轮真实运行，不许填想象值）
4. claims.jsonl 状态推进

**当前基线（截至 r253，VERSION 6.8.152 / 229 维度 / 161 模块 / 1316 路由）**：
`bin/verify.js` 16 passed / 0 failed ｜ `guard-abilities.js` 20/20（dimensions 键 229 个）｜
`doc-numbers-accuracy.test.js` 24/24 ｜ `bidirectional-guard.js` 召回 52/52、误拦 302/326。
> ⚠️ 旧基线（16/16、210 键、24/24、302/326）写于 2026-11-05，维度键已由 210 涨到 229；
> 每轮开工前以 `node scripts/measure-claimed-numbers.js` 实测为准，不一致先报告 1 号再动手。

**轮次进度提示**：`coordination/claims.jsonl` 与 `coordination/reports/` 的记录止于 r244
（r245–r253 的固化与审计修复由 1 号在本地直接完成，未走 claims 认领流）。
r244 起多条 kind=dimension 的认领以 `src/framing-effect.js`、`src/present-bias.js` 等
provisional 未接线模块形式交付，接线与 VERSION 递增由 1 号负责。

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
