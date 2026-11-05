# 心虫三环境协同作战方案 v1.0

> **用途**：三个不同环境、三个不同 agent 运行同一个心虫（HeartFlow）引擎，共用同一个 GitHub 仓库。
> 本方案由 **1 号（主力）** 制定，由用户分发给 **2 号**、**3 号** 部署执行。
> 仓库：`https://github.com/mark-cell-520/heartflow`（remote 名 `heartflow`，URL 内嵌 token）
> 制定日期：2026-11-05 ｜ 基线：VERSION 6.8.142 ｜ 维度 210 ｜ 模块 162 ｜ 路由 1316

---

## 一、核心原则（三台机器都必须遵守，不可协商）

### 1.1 分工不重叠——每个轮次只有一个 agent 在写
三台机器若同时向 `main` 推新维度，必然产生**同一文件冲突**（`src/index.js` 每轮都要改八处接入点、`VERSION`、`README`/`SKILL.md`/`AGENTS.md` 的版本戳和维度计数）。

**解决方案：轮次号认领制（claim-before-write）**

仓库根目录新增 `COORDINATION.md`（本文件）、`coordination/claims.jsonl`（追加式认领账本）。

任何 agent 在动手写新维度 / 修引擎 / 改文档之前，**必须先认领**：

```bash
# 认领格式（追加一行，JSON Lines，原子追加）
echo '{"round":"r214","agent":"agent-2","kind":"dimension","direction":"经济与资源推理","claim_at":"2026-11-05T14:00:00+08:00","expires_hours":6}' >> coordination/claims.jsonl
git add coordination/claims.jsonl && git commit -m "claim: r214 by agent-2" && git push heartflow main
```

**硬规则**：
1. 认领前先 `git fetch heartflow main && git log --since='6 hours ago' --oneline heartflow/main`，看有没有别人已认领未完成的轮次。有 → 换一个未占用的轮次号，或接手那个轮次（读完它的 UPGRADE_LOG 条目再继续）。
2. **轮次号全局唯一，禁止复用。** 用 `grep -c '^## r' UPGRADE_LOG.md` + 当前最大轮次号 +1 起步，认领时再 fetch 一次确认无人抢占。
3. 认领后 6 小时内必须产出 commit 或释放（写 `{"round":"rXXX","agent":"...","kind":"release"}`）。超时未产出的认领，其他 agent 可接手并记录 `{"round":"rXXX","agent":"...","kind":"takeover","from":"agent-2"}`。
4. **同一时间只允许一个 agent 持有"写轮次"**（kind=dimension/fix/refactor）。三个 agent 可以同时持有"只读轮次"（kind=audit/benchmark/research，不产生 commit，只产出报告文件）。
5. 认领不是锁——它是**信号**。冲突不可避免时（两人同时推），后推的人负责 `git pull --rebase` 解冲突，**严禁 `push --force`**。

### 1.2 版本号与门禁数字只能前进
- `VERSION` 文件是唯一真源。任何维度/修复上线必须递增（`scripts/sync-version.js` 同步 `package.json`、`SKILL.md`、`src/core/version.js` 兜底）。
- 四门禁必须全绿才能 commit：`node bin/verify.js`（16/16）、`node scripts/guard-abilities.js`（20/20）、`node test/doc-numbers-accuracy.test.js`（24/24）、`node scripts/bidirectional-guard.js`（召回 52/52 不降、误拦 302/326 不升）。
- **发现门禁红不是"绕过它"，是"修到绿"**。数字不符就修代码或同步文档，严禁改测试断言/守卫迁就代码。

### 1.3 铁律：不编造
每个数字来自本轮真实运行。心虫的核心价值是"可审计的辨别"，任何自报告假数据都会污染整条链。若某步跑不动，如实写"未跑通 + 原因"，不许填想象中的数字。

---

## 二、三角色分工

### 🟦 1 号 = 主力（当前环境：hermes1，Ubuntu 容器）
**定位**：唯一持有"写轮次"的生产者 + 全仓库的最终守门人。

**职责**：
1. **新维度生产（主职）**：每 120 分钟一轮，按 UPGRADE_LOG 既有方向轮换（逻辑谬误 → 因果与反事实推理 → 心理操控 → 证据与统计 → 社会与话语 → 经济与资源 → …）。每轮必须：探针先证"新攻击族真零命中" → 实现 → 负例注入测试 → gate 层变体矩阵 → 五门禁 → UPGRADE_LOG 记轮次报告。
2. **引擎健康守门**：任何时刻 `src/index.js`、门禁脚本、`bin/` 的改动只能由 1 号做。
3. **每日审计·修复**：22:30 跑（审计过去 24h 全轮次产出真实性 + 修 P0→P3 + 本地 commit）。
4. **每日推送**：22:45 由 no_agent 脚本 `hf-daily-push.sh` 执行（不受 TPM/429 影响，含隐私闸）。
5. **合并权**：2 号、3 号若提交 PR，1 号负责审并合入 `main`；1 号也可直接推 `main`（认领制下不冲突）。
6. **认领账本维护**：定期清理超 6 小时的死认领。

**不做**：大规模重构（`src/index.js` 已 16140 行，拆分会与每轮加维度撞车）、发布 npm、对外 outreach。

### 🟩 2 号 = 攻击面扩展（第二个环境）
**定位**：红队 + 边界测试生产者。只读代码、只写测试与报告，不碰引擎逻辑。

**职责**：
1. **对抗变体矩阵**：针对 1 号每轮新维度，构造中英双语、带修饰、长句、倒装、同义替换的攻击变体，测 `gate.action` 是否真的非 pass。产物：`coordination/reports/rNNN-variants-agent2.md`（含变体清单 + gate.action 实测 + 是否真零命中）。
2. **良性集扩展**：构造易误拦的良性样本（方法比较、学术讨论、正确响应形），测误拦率是否升过 302/326 基线。
3. **外部方案扫描**：GitHub / arXiv / Semantic Scholar 三层搜索"可集成的纯规则方案"，命中则给出仓库名 + ★数 + 是否纯规则 + 集成建议；全部空返则明确写"空返，按既有形态自建"。
4. **提交方式**：报告文件 push 到 `coordination/reports/`（不动 src），或对 1 号 commit 开 PR 提 issue。

**关键纪律**：2 号**不 commit 引擎代码**。发现引擎漏判 → 写报告 + 攻击样本，交 1 号修。这样避免两人同时改 `src/index.js`。

### 🟨 3 号 = 质量与运营（第三个环境）
**定位**：门禁 CI + 文档口径 + 版本一致性 + 发布准备。

**职责**：
1. **CI 门禁值守**：`.github/workflows/` 已有 audit-test 与 heartflow-audit。3 号负责把四门禁搬进 GitHub Actions（见第四节），任何人 push 后自动跑，红即通知。
2. **文档口径巡检**：README / SKILL.md / AGENTS.md / UPGRADE_LOG 的维度数、层级计数、版本戳、测试数与实测一致；发现漂移开 issue 给 1 号（因为改文档会和 1 号的轮次 commit 撞）。
3. **发布准备**：维护 `dist/`、npm 打包清单、CHANGELOG；版本就绪时打 tag。
4. **依赖与兼容性**：零运行时依赖是铁律，3 号负责盯住 `package.json` 不引入运行时依赖；Node 版本兼容（CI 用 22，本地 1 号用什么版本要报给 3 号）。

**关键纪律**：3 号**不 commit 引擎代码与门禁断言**，只修文档/CI/打包。修文档前先 fetch 看 1 号是否正在改同一文件。

---

## 三、协作流程（每日运转）

```
00:00 ─┬─ 1号：轮次认领（claims.jsonl）→ 探针证零命中 → 实现 → 测试 → 门禁 → commit → push
       │  （每 120min 一轮，cron 驱动）
       │
       ├─ 2号：拉取 1号最新 main → 对新维度跑对抗变体矩阵 + 良性集
       │      → 产物 push 到 coordination/reports/（不动 src）
       │
       └─ 3号：CI 自动跑四门禁 → 巡检文档口径 → 发现漂移开 issue

22:30 ── 1号：每日审计（审全轮次真实性 + 修 P0→P3 + 本地 commit）
22:45 ── 脚本：hf-daily-push.sh 统一推送（隐私闸 + 不 force）
23:00 ── 3号：读取当天 CI 结果 + 1号 UPGRADE_LOG，核对发布就绪度
```

### 3.1 冲突处理（必然发生，提前定规矩）
`src/index.js` 每轮都改（八处接入点），是冲突热点。规矩：

1. **先 fetch 再动手**：每次开工前 `git fetch heartflow main`，看 main 是否前进。前进了就 `git rebase heartflow/main` 或 `git pull --rebase`，**在 rebase 后重跑四门禁**（rebase 可能把别人的接入点和你改的同一行叠在一起）。
2. **rebase 冲突优先保 main 侧**：main 侧是已合入的既成事实，你的改动适配它；除非 main 侧明显是 bug。
3. **绝不 force push**：`git push --force` 一律禁止（1 号守门时也禁）。push 被拒 = 有人先推了，老老实实 rebase。
4. **rebase 后门禁红** = rebase 引入了不兼容，停下报告，不许"跳过失败的测试"。

### 3.2 轮次号与 UPGRADE_LOG
- UPGRADE_LOG.md 顶部追加新条目（最新在上），格式沿用现有：轮次号 / 日期 / 方向 / 真升级类型 / 来源 / 心虫裁决 / 实现内容 / 验证数据表格。
- **只有 1 号写 UPGRADE_LOG 的轮次条目**（2、3 号的发现由 1 号在下一轮整合进去，避免多人同时改同一文件头部）。
- 2、3 号的报告放 `coordination/reports/`，文件名带 agent 标识与日期。

---

## 四、GitHub 仓库协作具体配置

### 4.1 目录约定（1 号已可创建，2、3 号 clone 后即有）
```
heartflow/
├── COORDINATION.md              # 本方案（三台机器的共同宪法）
├── coordination/
│   ├── claims.jsonl             # 轮次认领账本（追加式）
│   └── reports/                 # 2、3 号的只读报告
│       ├── r214-variants-agent2.md
│       └── 2026-11-05-doc-drift-agent3.md
├── .github/workflows/
│   ├── audit-test.yml           # 已有：语法检查 + test suite
│   ├── heartflow-audit.yml      # 已有：安全审计
│   └── gates.yml                # 【3 号新增】四门禁 CI
└── ...
```

### 4.2 3 号要新增的 CI（`.github/workflows/gates.yml` 草案）
```yaml
name: gates
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v5
        with:
          node-version: '22'
      - run: npm install --ignore-scripts --no-fund --no-audit
      - name: gate 1 verify
        run: node bin/verify.js
      - name: gate 2 abilities
        run: node scripts/guard-abilities.js
      - name: gate 3 doc numbers
        run: node test/doc-numbers-accuracy.test.js
      - name: gate 4 bidirectional
        run: node scripts/bidirectional-guard.js
```
> 注意：`bidirectional-guard.js` 基线数字（召回 52/52、误拦 302/326）是全仓库共享口径，任何 agent 改了门禁脚本本身都要在 UPGRADE_LOG 里记明新旧基线。

### 4.3 分支策略
- **统一 `main` 单分支**。心虫是线性升级的规则引擎，多分支只会加剧 `src/index.js` 冲突。
- 2、3 号若要提 PR：从 `heartflow/main` 开 `agent2/rNNN-xxx` 分支，只改自己职责范围内的文件，1 号审后 merge（squash 或 merge commit 均可，但 commit message 必须写清轮次号）。
- **禁止**：2、3 号直接 push `main`（除非认领到写轮次且 1 号不在线——极少数情况，且必须先在 claims.jsonl 记认领）。

---

## 五、各环境部署清单

### 1 号（hermes1，已就位，无需动作）
- [x] 仓库 `/root/hermes1/skills/ai/mark-heartflow-skill`，remote `heartflow`
- [x] cron：每 120min 升级轮次、22:30 每日审计、22:45 no_agent 脚本推送
- [x] MCP 心虫 127.0.0.1:8588 在跑
- [x] 四门禁基线实测：verify 16/16、guard 20/20、doc 24/24、双向 52/52+302/326
- [x] 已推送 VERSION 6.8.142 修复（r213 漏递増）

### 2 号（用户转发本方案 + 以下清单）
```bash
# 1. clone
git clone https://github.com/mark-cell-520/heartflow.git
cd heartflow
npm install --ignore-scripts --no-fund --no-audit

# 2. 确认基线（必须与 1 号一致，不一致先报告再动手）
node bin/verify.js                 # 期望 16/16
node scripts/guard-abilities.js    # 期望 20/20
node test/doc-numbers-accuracy.test.js   # 期望 24/24
node scripts/bidirectional-guard.js      # 期望 召回 52/52、误拦 302/326

# 3. 每天开工前同步
git fetch heartflow main && git pull --rebase heartflow main

# 4. 只写 coordination/reports/ 与 test/ 下的新对抗样本文件
```
**禁止**：改 `src/`、改 `bin/verify.js`、改门禁脚本、改 VERSION。

### 3 号（用户转发本方案 + 以下清单）
```bash
git clone https://github.com/mark-cell-520/heartflow.git
cd heartflow
npm install --ignore-scripts --no-fund --no-audit

# 1. 建 gates.yml（草案见 4.2），push 后确认 Actions 变绿
# 2. 巡检：对比 README/SKILL.md/AGENTS.md 的维度数、版本戳、测试数与
#    node scripts/measure-claimed-numbers.js 实测输出，不一致开 issue 给 1 号
# 3. 维护 dist/ 与 CHANGELOG，版本就绪打 tag
```
**禁止**：改 `src/`、改门禁断言、直接推 `main`（PR 让 1 号合）。

---

## 六、通讯与异常

| 情况 | 谁处理 | 怎么做 |
|---|---|---|
| 门禁红 | 发现者 | 开 issue 附完整输出；1 号修引擎，3 号修 CI/文档 |
| 轮次认领超时 | 任何 agent | 接手并记 `takeover`，先读 UPGRADE_LOG 对应条目 |
| push 被拒 | 推送者 | rebase + 重跑门禁，**绝不 force** |
| 维度数/口径漂移 | 3 号发现 → 1 号修 | 修完 1 号递增 VERSION + 跑 sync-version.js |
| 某 agent 环境挂了 >24h | 其他两人 | 其认领的轮次超时后接管；报告等它回来补 |
| 隐私数据（token/key/记忆库） | 任何 agent | **严禁 push**。1 号脚本有隐私闸，2、3 号手动 push 前自查 `git diff --name-only` |

---

## 七、为什么这样分（设计理由）

- **`src/index.js` 是唯一写热点**：16140 行、每轮八处接入点。三角色里只有 1 号写它，冲突概率从 3 路降到 1 路。
- **2 号红队价值最高但不该写引擎**：它发现漏判，但修引擎需要理解八处接入点的全局影响，1 号持这个上下文。
- **3 号守 CI 与口径**：心虫的卖点是"诚实数字"，文档漂移是唯一能让它失信的腐化，必须有人专职盯。
- **no_agent 脚本兜底推送**：LLM 会 429 会超时，git push 不能依赖 LLM。这是 2026-11-05 实测教训（审计任务被 429 打掉导致 8 个 commit 积压未推送）。

---

## 八、启动步骤（按顺序）

1. 用户把本文件发给 2 号、3 号。
2. 1 号（本环境）现在创建 `COORDINATION.md` 与 `coordination/claims.jsonl`、`coordination/reports/` 并 push。
3. 2 号 clone + 校验四门禁基线一致 → 回复"基线一致，开始 r213 对抗矩阵"。
4. 3 号 clone + 建 `gates.yml` → push PR → 1 号 merge → Actions 跑绿。
5. 之后每日按第三节流程运转。认领账本出现第一条记录即协同正式生效。
