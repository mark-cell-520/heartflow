# 四 Agent 协同架构 — HeartFlow 自主升级集群

> 本文档定义 1/2/3/4 号 agent 的完整协同架构、通信协议、容错模型。
> 它是 `COORDINATION.md`（仓库内宪法）的 4 号扩展版。

---

## 1. 设计哲学

### 1.1 为什么不用中心协调者

中心协调器（锁服务器、消息队列、调度器）是单点故障。四台机器跨洋分布，
任何一个协调进程挂了，整个集群停摆——这正好违反用户要求的
"偶尔一两个掉线，不影响整体进度"。

**选择：git 仓库即协调媒介。** 它天然具备：
- 全局有序（commit 历史即全序）
- 冲突可检测（push 被拒 = 有人先写）
- 状态可恢复（clone 即恢复全部上下文）
- 无需额外基础设施

### 1.2 唯一真源原则

| 真源 | 位置 | 说明 |
|---|---|---|
| 版本号 | `VERSION` | 引擎版本唯一真源，`scripts/sync-version.js` 同步其余 |
| 轮次史 | `UPGRADE_LOG.md` | 只增不改，每轮一条 |
| 认领账本 | `coordination/claims.jsonl` | 追加式 JSON Lines |
| 宪法 | `COORDINATION.md` | 协同规则，修改需四方共识 |

**没有任何状态存在于 agent 的会话记忆里。** 会话会压缩、会重启、会换机器；
文件不会。

---

## 2. 角色矩阵

| 维度 | agent-1 主力 | agent-2 红队 | agent-3 CI | agent-4 海外产能 |
|---|---|---|---|---|
| 位置 | 中国 IP | — | — | **美国 IP** |
| 引擎写入 | ✅ 主责 | ❌ 禁止 | ❌ 禁止 | ✅ 认领后 |
| 新维度 | ✅ | ❌ | ❌ | ✅ 认领后 |
| 攻击样本 | ❌ | ✅ 主责 | ❌ | ⚠️ 可辅助 |
| 良性样本 | ❌ | ✅ 主责 | ❌ | ⚠️ 可辅助 |
| 门禁复跑 | 每轮 | 碰前 | ✅ 主责 | 每轮必跑 |
| VERSION/文档 | ✅ 主责 | ❌ | ❌ | ✅ 认领后 |
| push | ✅ 兜底 | 只推自己报告 | 只推报告 | ✅ **高速主通道** |
| 论文扫描 | ⚠️ | ⚠️ | ❌ | ✅ **主责（国外源）** |
| 开源实现扫描 | ⚠️ | ✅ | ❌ | ✅ **主责（GitHub 快）** |

---

## 3. 通信协议

### 3.1 认领（claim）

任何写操作前必须认领。格式：

```json
{"round":"r217","agent":"agent-4","kind":"dimension","direction":"<中文方向名>","claim_at":"<ISO8601>","expires_hours":6,"machine":"<机器标识>"}
```

`kind` 决定并发规则：

| kind | 含义 | 并发上限 |
|---|---|---|
| `dimension` | 新判别维度 | 全局 1 |
| `fix` | 存量维度修复 | 全局 1 |
| `refactor` | 重构（不算升级） | 全局 1 |
| `audit` | 只读审计 | 无限制 |
| `benchmark` | 只读跑分 | 无限制 |
| `research` | 只读调研 | 无限制 |
| `scout` | 只读资源扫描 | 无限制 |
| `release` | 主动释放 | — |
| `takeover` | 接管过期轮次 | — |

### 3.2 释放与接管

```json
{"round":"r217","agent":"agent-4","kind":"release","note":"<原因>"}
{"round":"r217","agent":"agent-1","kind":"takeover","from":"agent-4","note":"lease 过期 6h"}
```

接管者必须**先读完该轮已有的 UPGRADE_LOG 条目和 commit**，再决定续做或重做。

### 3.3 升级判定（不可放松）

真升级 = 引擎获得此前没有的判断力。四条：

1. **新判别维度** — 新 `dimMap` 键，独立匹配一个措辞家族
2. **已有维度的全新措辞家族** — 新增一整族该维度此前完全不匹配的表达
3. **接线已加载但从未调度的能力** — 代码存在但 dispatch 不到，接上就算
4. **真正能判别的新 MCP 工具 / dispatch 路由** — 新增可判别入口

**不算升级**：负例补丁、更多良性样本、修复上轮回归、改 README/SKILL 数字、
调阈值、重构、注释改动、测试补丁。

审计命令：

```bash
git log --pretty=%s -30 | sed -E 's/^([a-z]+)\(.*/\1/' | sort | uniq -c
```

`chore`/`fix`/`test` 主导且 `feat` 缺失 → 该区间是维护，不是升级。

---

## 4. 时钟与节奏

四 agent 错峰，避免同时抢同一轮次号、同时 push：

| agent | upgrade 周期 | sync 周期 | 偏移 |
|---|---|---|---|
| agent-1 | 120m | 每日 22:30 | 基准 |
| agent-2 | — | 每日 | 只读 |
| agent-3 | — | 每日 | 只读 |
| **agent-4** | **150m** | **2h** | **+30m 错峰** |

4 号 upgrade 用 150m 而不是 120m：① 与 1 号错峰，减少 claim 竞争；
② 一个完整轮次（实现 + 四门禁 + commit）实测需要 60-90 分钟，150m 有安全余量；
③ 掉线一轮不影响日产出量。

---

## 5. 容错模型

### 5.1 故障分类与响应

```
                    ┌─────────────────┐
                    │   agent 掉线    │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
   │ 持 claim 中  │   │ 未持 claim  │   │  cron 挂了  │
   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
          │                 │                 │
          ▼                 ▼                 ▼
   lease 过期 → sweep   无影响，别人      看门狗重启
   → 其他 agent 接管    照常推进          hermes + cron
          │                 │                 │
          └─────────────────┴─────────────────┘
                             ▼
                    ┌─────────────────┐
                    │  整体进度不阻塞  │
                    └─────────────────┘
```

### 5.2 心跳与活性探测

每个 agent 每 5 分钟写 `coordination/status/<agent>.json`：

```json
{"agent":"agent-4","machine":"us-node-1","ts":"2026-11-05T20:05:00Z","version":"6.8.144","last_round":"r216","gate_state":"green"}
```

其他 agent 的 scout/round 脚本 `git fetch` 后读该目录，超过 20 分钟无更新即视为掉线，
其 active claim 视为可接管候选（仍需等 expires_hours 到期，或由人确认紧急接管）。

### 5.3 部分失败不影响整体

| 场景 | 整体影响 |
|---|---|
| 4 号完全消失数天 | 1/2/3 号照常；4 号的轮次被接管 |
| 4 号 push 一直失败 | commit 堆在本地；1 号兜底 push |
| 4 号产出全部是维护轮 | 2 号红队在下轮报告中标注，人介入 |
| 4 号和 1 号同时抢到同号 | push 冲突，后推者 rebase；4 号速度优先反而常赢 |
| 网络分区（中美不通） | 各自本地 commit；恢复后 rebase 合并 |

---

## 6. 升级流水线（单轮详解）

以 4 号一轮为例：

```
T+0     hf4-scout.sh（no_agent）跑国外源 → coordination/reports/agent4-scout-<date>.md
T+0     hf4-heartbeat.sh 写 status/agent4.json
T+30m   hf4-round.sh:
         ① auto-commit-round.js（打包上轮遗留）
         ② 读 scout 报告 + UPGRADE_LOG tail + claims.jsonl
         ③ 选目标模块（覆盖 src/** 全部子目录，不只 src/core/）
         ④ claim（hf4-claim.sh）
         ⑤ 实现（LLM 主战场）
         ⑥ 负例验证：注入-删条，逐个删新模式断言守卫变红
         ⑦ hf4-gates.sh 四门禁
         ⑧ commit + bump VERSION + sync-version
         ⑨ 写 UPGRADE_LOG.md
         ⑩ release claim
T+2h    hf4-sync（独立 cron）:
         ① git fetch heartflow main
         ② git pull --rebase（解冲突，不 force）
         ③ 隐私闸扫描
         ④ git push heartflow main
         ⑤ 校验 HEAD == heartflow/main
```

**upgrade cron 绝不 push，sync cron 绝不写引擎。** 这是权限隔离的核心。

---

## 7. 隐私闸

push 前必须过（复用 1 号 `hf-daily-push.sh` 模式）：

1. 文件名黑名单精确匹配（`.env`、`*.pem`、`*credential*`、`*secret*`、`*.key` 等）
2. diff 内容秘密格式扫描（`sk-`、`AKIA`、`ghp_`、`-----BEGIN`、`xoxb-`、长 base64 串）
3. 任一命中 → **拒绝推送**，本地保留，人在会话里处理

---

## 8. 演进预留

| 未来能力 | 当前占位 |
|---|---|
| 5 号 agent | claim 协议无 agent 数上限，`machine` 字段区分 |
| 跨 agent 任务分发 | `coordination/tasks/` 目录预留 |
| 自动 PR review | `coordination/reviews/` 目录预留 |
| 升级质量评分 | `coordination/reports/agent4-quality.md` 由 2 号产出 |
