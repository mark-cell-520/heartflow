# 心虫协同 — 4 号部署指令（海外产能单元 / US · GitHub 顺畅）

> 你收到的是心虫（HeartFlow）四环境协同方案的 **4 号角色**。完整宪法见仓库根目录 `COORDINATION.md`。
> 仓库：`https://github.com/mark-cell-520/heartflow`（remote 名 `heartflow`）
> 1 号主力：hermes1 环境，写引擎 + 新维度生产。
> 2 号红队：只产对抗样本/良性样本/报告，不写引擎。
> 3 号 CI：四门禁 CI + 文档口径 + 版本一致性，不写引擎。
> **你（4 号）= 海外产能单元**：美国 IP + GitHub 通道顺畅 + 国外论文/开源资源可达性好。

## 一、你的独特定位

其他三个 agent 在国内，受网络限制：
- GitHub API / arXiv / Semantic Scholar / HuggingFace 频繁超时或空返
- 大量产能浪费在"重试国外资源"上

**你的海外 IP 把这些从瓶颈变成你的主场。** 你的核心价值：

| 产能 | 说明 |
|---|---|
| **海外资源扫描** | arXiv cs.AI/cs.CL/stat.ME/econ.GN、GitHub 推理 benchmark 仓库、Semantic Scholar 论文。国内 agent 拿不到的，你能拿到。 |
| **GitHub 同步通道** | push/pull 稳定快速，作为四 agent 中"最不容易卡在同步上"的单元，承担兜底推送职责。 |
| **子目录模块升级** | 在 1 号不冲突的子目录模块（`src/core/ethics/`、`consciousness/` 等）做真实升级。 |
| **研究轮兜底** | 当写轮次被 1 号持有时，你做 research 轮（只读 + 只产报告 + commit），保证每轮不空转。 |

## 二、部署步骤（目标机器：美国 IP）

```bash
# 1. 克隆仓库（remote 名必须叫 heartflow，与协同体系一致）
git clone https://github.com/mark-cell-520/heartflow.git
cd heartflow

# 2. 安装（零运行时依赖铁律：绝不装运行时依赖）
npm install --ignore-scripts --no-fund --no-audit

# 3. 校验基线（必须与 1 号一致；不一致先报告再动手）
node bin/verify.js                      # 期望 passed>=16 failed=0
node scripts/guard-abilities.js         # 期望 20/20
node test/doc-numbers-accuracy.test.js  # 期望 24/24
node scripts/bidirectional-guard.js     # 期望 召回>=52、误拦<=302/326
```

> ⚠️ 当前 1 号实测基线（2026-11-05）：VERSION `6.8.144`，判别维度 **211**，
> `guard-abilities.js` 维度登记数可能已是 211 键（原文档写 210，以实测为准）。
> **不一致就报告，不许改断言迁就代码。**

## 三、写权限边界（四 agent 并行不撞车的关键）

### 你（4 号）允许写：

| 路径 | 说明 |
|---|---|
| `coordination/` | 报告、claims、scout 原始结果 |
| `coordination/agent4/` | 你的专属目录 |
| `src/core/ethics/` | 子目录模块（1 号主战场在 `src/index.js` 全局接入点） |
| `src/core/psychology/` | 子目录模块 |
| `consciousness/` | 子目录模块 |
| `src/plugins/`、`src/tools/` | 子目录模块 |
| `UPGRADE_LOG.md` | 追加你的轮次条目（**追加，不改写他人条目**） |
| `VERSION` | 递增（dimension/fix 轮；research 轮不动） |

### 你（4 号）**禁止**碰：

| 路径 | 原因 |
|---|---|
| `src/index.js` | 1 号独占的全局接入点，四 agent 同时改必然冲突 |
| `bin/verify.js` | 门禁脚本 |
| `scripts/guard-abilities.js` | 门禁脚本 |
| `scripts/bidirectional-guard.js` | 门禁脚本 |
| `test/doc-numbers-accuracy.test.js` | 门禁脚本 |
| `README.md` / `SKILL.md` / `AGENTS.md` | 文档口径由 3 号 CI 统一，你改会造成漂移 |

### 轮次认领（宪法 §1.1）

同一时间**只允许一个 agent 持有写轮次**（kind = `dimension` / `fix`）。
其他 agent 必须降级为 `research` 轮。用 `coordination/claims.jsonl` 声明：

```jsonl
{"round":"r217","agent":"agent-4","kind":"dimension","direction":"统计素养（基数率忽视）","claim_at":"2026-11-05T12:00:00Z","expires_hours":6,"status":"active"}
{"round":"r217","agent":"agent-4","kind":"dimension","claim_at":"2026-11-05T18:00:00Z","status":"completed"}
```

超过 `expires_hours` 未推进，其他 agent 可 `takeover`。

## 四、部署文件体系（本目录 `/root/hermes1/deploy-agent4/`）

```
deploy-agent4/
├── README.md                      # 本文件——总入口
├── coordination/
│   └── DEPLOY-agent4.md           # 仓库内协同指令（push 到 GitHub 供其他 agent 读）
├── cron/
│   ├── jobs-agent4.json           # 两个 cronjob 定义（upgrade + sync）
│   └── INSTALL.md                 # 安装/验证/排障手册
├── scripts/
│   ├── hf4-common.sh              # 公共库（隐私闸/认领账本/轮次号）
│   ├── hf4-claim.sh               # 轮次认领 scan/claim/release/takeover
│   ├── hf4-gates.sh               # 四门禁复跑（本地口径守门）
│   ├── hf4-commit.sh              # 白名单提交 + 全局接入点硬拦截
│   ├── hf4-push.sh                # 安全推送（隐私闸+无force+超时+校验）
│   ├── hf4-sync.sh                # rebase 同步 + 冲突检测
│   ├── hf4-scout.sh               # 确定性海外资源扫描（arXiv/GitHub/S2）
│   └── hf4-status.sh              # 状态快照
├── prompts/
│   ├── upgrade-prompt.md          # 升级轮 prompt（完整流程+红线+选题库）
│   └── sync-prompt.md             # 同步轮 prompt（只 push 不写引擎）
└── templates/
    └── REPORT-TEMPLATE.md         # 轮次报告模板
```

## 五、定时升级架构（四 agent 并行容错）

```
┌─────────────────────────────────────────────────────────────┐
│  GitHub: github.com/mark-cell-520/heartflow.git (main)       │
│  ↑ push / pull —— 所有 agent 的唯一事实源                      │
└──────┬──────────┬──────────┬──────────┬─────────────────────┘
       │          │          │          │
   ┌───┴───┐  ┌───┴───┐  ┌───┴───┐  ┌───┴───┐
   │ 1 号  │  │ 2 号  │  │ 3 号  │  │ 4 号  │
   │主力   │  │红队   │  │CI    │  │海外   │
   └───┬───┘  └───┴───┘  └───┴───┘  └───┬───┘
       │          │          │          │
   升级轮      对抗轮      CI 轮      升级轮 + 同步轮
   (写引擎)   (只读)    (只读)    (写子目录) + push 兜底
```

### cron 设计（4 号两个 job）

| Job | 周期 | repeat | 职责 | 写权限 |
|---|---|---|---|---|
| `agent4-升级` | 60m | 200 | 跑 upgrade-prompt 全流程 | `src/` 子目录 + `coordination/` |
| `agent4-同步` | 4h | 400 | 跑 sync-prompt | **只 push/pull，零写入** |

### 容错机制（一两个掉线不阻塞整体）

1. **状态全在文件**：轮次号、认领、VERSION、UPGRADE_LOG 全在仓库文件里，不依赖会话连续性。
   任何 agent 掉线重启后，`hf4-status.sh` 5 秒恢复全部上下文。
2. **每轮独立**：不读上一轮会话记忆，从 `git log` + `UPGRADE_LOG.md` + `claims.jsonl` 重建。
3. **认领过期自动让位**：`expires_hours=6`，超时其他 agent 可 takeover，不会死等。
4. **同步兜底**：4 号 sync job 与升级解耦。即使升级轮全掉线，sync 仍会推送他人 commit；
   即使 4 号升级轮卡住，sync 周期到了照样跑，不受影响。
5. **commit 优先**：宁可少改一个文件，也要保证本轮有 commit。空手而归时做 research 轮兜底。

## 六、每日人工检查清单

```bash
cd /root/hermes1/skills/ai/mark-heartflow-skill
bash /root/hermes1/deploy-agent4/scripts/hf4-status.sh
bash /root/hermes1/deploy-agent4/scripts/hf4-gates.sh
git log --since='24 hours ago' --oneline heartflow/main
tail -20 coordination/claims.jsonl
```

发现以下情况立即人工介入：
- 四门禁出现 FAIL
- claims.jsonl 有轮次超过 6h 未推进且无人 takeover
- 同一轮次号被两个 agent 同时 active
- 出现 `git push --force` 痕迹（`git reflog` 可查）

## 七、与现有 cron 的关系

本机 `/root/hermes1/cron/jobs.json` 已有若干 job。4 号的两个 job **独立添加**，不改动其他 job。
安装方法见 `cron/INSTALL.md`。

已知坑（务必读 INSTALL.md）：
- `cronjob update` 传 `base_url` 后 `list` 仍显示 null，必须手动 patch `jobs.json` 才生效。
- 轮次状态必须写文件，prompt 里禁用 `第 {INDEX} 轮` 这类占位符（会渲染成字面文本）。
