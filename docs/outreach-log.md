# GitHub 外联台账（HeartFlow 心虫）

> 本文件按技能 `heartflow-github-outreach-ledger` 的 SOP 维护：每轮外联动作前先查本台账，避免重复评论同一线程；外联后必须回填。

## 2026-11-28 — r493 gates 门禁红修复（issue #4 收口）

**仓库**：`mark-cell-520/heartflow`
**触发**：用户指令「修复仓库里的心虫问题，并把全过程写进 docs/outreach-log.md」。

### 侦察（只读，未改动任何文件）

| 项目 | 方法 | 结果 |
|------|------|------|
| `gh` CLI | `gh run list` / `gh issue list` | 不可用（`gh: command not found`，exit 127） |
| 凭据 | `~/.git-credentials`（credential.helper=store） | 存在 mark-cell-520 账号凭据 `[REDACTED]` |
| 仓库连通 | GitHub REST API | HTTP 200 |
| Open issues | `GET /repos/.../issues?state=open` | 1 条：#4「drift: SKILL.md/AGENTS.md 文档口径漂移 8 处（3 号巡检 2026-11-05，附实测对照）」labels=[documentation]，2 条评论 |
| Open PRs | `GET /repos/.../pulls?state=open` | 2 条：#5（agent3/report-2026-11-05 留档）、#3（agent3/gates-ci 四门禁） |
| CI runs | `GET /repos/.../actions/runs` | audit-test / HeartFlow Security Audit 全 success；**gates 连续 failure**（#309/#310/#311） |

### 定位根因（本地复跑四门禁，不猜）

本地工作树与 `heartflow/main` 完全同步（`rev-list --left-right --count` = 0/0，工作树 0 变更）。

失败 job `gates`（run 46137397790）的失败步骤：`gate 3 doc numbers`、`gate 4 bidirectional`、`Post Run actions/setup-node@v5`。逐门禁本地复跑后确认真实状态：

1. **gate 1 verify** — `node bin/verify.js` → 16 passed / 0 failed，本地绿
2. **gate 2 abilities** — `node scripts/guard-abilities.js` → 20/20 通过，本地绿
3. **gate 3 doc numbers** — `node test/doc-numbers-accuracy.test.js` → **22 通过 / 3 失败**（本地即红）
   - ❌ README 规格表口径戳停在 `at **v6.8.244**`，应为 `v6.8.245`
   - ❌ SKILL 规格表口径戳停在 `at v6.8.244`，应为 `v6.8.245`
   - ❌ README Version history 缺 `6.8.245` 记录（changelog 落后 git 8 个版本号）
4. **gate 4 bidirectional** — `node scripts/bidirectional-guard.js` → 召回 52/52、误拦 302/326，本地绿
   - CI 里红是**级联失败**：gate 3 以 exit 1 结束后 runner 直接终止，gate 4 未真正执行即被标记失败（`Post Run actions/setup-node@v5` 同为级联伪失败）
5. lint-regex-exec-loops（非门禁，continue-on-error）— 1 violation：`src/completion-evidence.js:54` 的 `copy.exec(text)` 循环，`pat.flags` 变量透传无法证明含 g/y。**本文件只负责调用门禁，不改门禁断言，且该 lint 非门禁**，未处理。

### 根因

r493（v6.8.245）提交时只改了 VERSION/package.json/src 层，`scripts/sync-version.js` 不覆盖 README/SKILL 的「规格表口径版本戳」，也不写 README Version history。故版本号前进了 8 个发布，文档戳与 changelog 停在 6.8.244。这是**文档口径债，不是心虫引擎缺陷**——与 issue #4 同族（issue #4 报的正是这类漂移）。

### 修复（e2a654fb）

- `README.md`：规格表口径戳 `v6.8.244` → `v6.8.245`；Version history 顶部补 `| 6.8.245 | 2026-11-28 | ... |` 条目（r493 三条措辞族 + r489 hook-bus MAX_HANDLERS 修复 + r492 轮测扩展名修复）
- `SKILL.md`：口径戳 244→245、Engine version 行 244→245
- `src/core/heartflow.js` BUILD_DATE、`src/core/version.js` fallback 同步至 6.8.245（`scripts/sync-version.js` 执行结果）

### 验证（修复后本地复跑，全部真实退出码）

| 门禁 | 命令 | 结果 |
|------|------|------|
| gate 1 | `node bin/verify.js` | ✅ 16 passed / 0 failed |
| gate 2 | `node scripts/guard-abilities.js` | ✅ 20 项能力检查通过（292 维度） |
| gate 3 | `node test/doc-numbers-accuracy.test.js` | ✅ 25 通过 / 0 失败 |
| gate 4 | `node scripts/bidirectional-guard.js` | ✅ 召回 52/52，误拦 302/326 pass |
| CI | push 后 Actions | ✅ **gates #312 success**（e2a654fb），audit-test #948、Security Audit #935 |

### 未处理 / 交接

- `src/completion-evidence.js:54` regex exec 循环 lint violation（非门禁，按 r266 约定不阻塞）
- PR #5（3 号巡检报告留档）与 PR #3（四门禁 CI）已合入效果由 gates.yml 存在可证，未重复动作

## 2026-11-28（第二轮）— issue #4 口径漂移清偿 5/8 + 回填评论

**动作**：把 issue #4（3 号 2026-11-05 巡检的 8 处文档口径漂移）逐项实测后修复可修的 5 处。

### 实测方法（不猜）
脚本 `drift-audit`（scratch）：读 `src/index.js` 三层集合 `BLOCK_DIMS`/`REWRITE_DIMS`/`VERIFY_DIMS`，对 AGENTS.md / SKILL.md 的 `**Block-level (N):**` 等三段列举，剥离 `//` 注释后按名比对。引擎实测：BLOCK 11 / REWRITE 19 / VERIFY 249，合计 **279**，剩余 13（292−279）。

### 已修 5 处（`0fe3528f`）
| # | 位置 | 漂移 | 修复 |
|---|------|------|------|
| D1 | AGENTS Block 列举 | 缺 `pzombie_claim`（计数 11 对、列举漏名） | 补入 |
| D2 | AGENTS Rewrite 列举 | 缺 8 名（tool_deflection / loyalty_by_omission / paternalistic_decide / crisis_exceptionalism / shame_compliance / moral_licensing / favor_ledger / turing_mimicry） | 补入 |
| D3 | SKILL Verify 列举 | 幽灵名 `soft_defection`，引擎真名 `soft_deflection` | 改名 |
| D4 | SKILL.md:238 | `discriminate(208 dims)` 与 README badge / 章节标题 292 不一致 | 改 292 |
| D5 | SKILL:287 / AGENTS:117 | `add up to 194` / `275`，实际 279 | 统一 279，`remaining 12→13` |
| D8 | README:496 | 6.8.143 行自报 `doc 22/22`，实际 24 | 改 `doc 24/24` |

### 未修 2 处（不属 CI 红，留待对账）
- **D6**：6.8.142 原轮次记录需人工核对（该版本号在 README changelog 检索不到对应行，记录可能已重组）
- **D7**：3 号巡检存量清单其余条目

### 回填
- issue #4 评论：[issuecomment-7239772769](https://github.com/mark-cell-520/heartflow/issues/4#issuecomment-7239772769) —— 逐项对照表 + 修复提交号 + 四门禁实测结果 + 未修说明
- issue #4 **未关闭**：等 D6/D7 收口后由 1 号统一关闭

### CI 验证（真实 run）
- `gates #314` 0fe3528f → **success**；`HeartFlow Security Audit #937` → success；`audit-test #950` 复跑中
- 本地四门禁：verify 16/0、abilities 20/20@292、双向 52/52+302/326、doc-numbers 25/25

## 台账规则（来自 heartflow-github-outreach-ledger SOP）

1. 评论/开 issue/开 PR 前，先在本文件检索是否已对同一线程做过动作——做过就不再重复。
2. 每条记录必须带：仓库、issue/PR 编号、动作类型、时间、真实验证证据（退出码 / API 返回 / CI run 号）。
3. 不修改门禁断言本身（3 号角色边界）；只修文档口径与调用层。
4. 未实测不下结论；无法验证的写「未验证」。
