# 3 号巡检报告 — 2026-11-05（文档口径 / 版本一致性 / CI 门禁值守）

> 巡检人：3 号（质量与运营 / CI 口径守门）｜环境：Windows / Node v24.22.0
> 基线：VERSION 6.8.142｜仓库 HEAD（clone 时）：a81b17f6
> 依据：`COORDINATION.md` 第二节 3 号职责 + `DEPLOY-agent3.md` 每日巡检清单

---

## 一、四门禁基线实测（本机，merge/动手前）

| 门禁 | 命令 | 结果 | 期望 |
|---|---|---|---|
| 1 verify | `node bin/verify.js` | **16/16 ✅** | 16/16 |
| 2 abilities | `node scripts/guard-abilities.js` | **20/20 ✅**（维度登记 210 键） | 20/20 |
| 3 doc numbers | `node test/doc-numbers-accuracy.test.js` | **24/24 ✅** | 24/24 |
| 4 bidirectional | `node scripts/bidirectional-guard.js` | **召回 52/52，误拦 302/326 pass ✅** | 52/52 + 302/326 |

与 1 号侧口径一致，基线无偏差。

## 二、CI 门禁建设（今日主要交付）

- 已建 `.github/workflows/gates.yml`（四门禁进 GitHub Actions），走 PR **#3**（分支 `agent3/gates-ci`，只含此一个新文件）待 1 号 merge：https://github.com/mark-cell-520/heartflow/pull/3
- **gates CI 已在 PR 上跑绿**（run #1，ubuntu-latest + Node 22，四门禁逐步 success）：https://github.com/mark-cell-520/heartflow/actions/runs/41967234302
- 与 4.2 草案的两点偏差（纯 CI 加固，不改断言）：`permissions: contents: read` 最小权限；`workflow_dispatch` 手动触发。
- merge 后 Actions 复绿情况由 3 号持续值守，红即开 issue。

## 三、文档口径核对（实测 vs 文档）

实测口径（本机直连探针，非 measure 脚本——见第五节工具注记）：

| 项 | 实测 | 文档宣称 | 判定 |
|---|---|---|---|
| 版本号 | 6.8.142 | VERSION / package.json / README `at **v6.8.142**` / SKILL `at v6.8.142.` + `Engine version 6.8.142` / version.js 兜底 6.8.142 | ✅ 五项全一致 |
| 维度总数 | 210 | README badge+锚+标题 210 / AGENTS 210 / SKILL 横幅+规格表 210 | ✅ |
| 模块数 | 162 | 三份文档 162 | ✅ |
| MCP 工具 | 184 | 三份文档 184 | ✅ |
| 路由数 | 1,316 | 三份文档 1,316 | ✅ |
| action-tier 计数 | block 11 / rewrite 19 / verify 167 | README 三兄弟 11/19/167 / SKILL 11/19/167 | ✅ |
| 测试数 | 18,949 passing / 79 failing（缓存 2026-11-04，全量复跑进行中） | README 横幅+规格表、SKILL 规格表均 18,949/79 | ✅（缓存口径一致） |
| changelog | — | README `## Version history` 含 `\| 6.8.142 \|` 行（无 v 前缀） | ✅ |

### ❌ 发现的漂移（已开 issue 给 1 号，未自行修改）

| # | 位置 | 文档现状 | 实测/应有 | 性质 |
|---|---|---|---|---|
| D1 | SKILL.md:259 | `## The 208 dimensions` | 210 | 章节标题陈旧（v6.8.140 后未刷新） |
| D2 | SKILL.md:265 | `Verify-level (117)` | Verify-level (167) | 列举计数陈旧 50 个版本 |
| D3 | SKILL.md:265 | 列举缺 49 个真实维度（soft_deflection…mediator_confusion，含 r209/r211/r213 三维度）+ 幽灵名 `soft_defection`（引擎无此名，疑为 soft_deflection 旧名） | — | 名单不完整 + 幽灵名 |
| D4 | SKILL.md:285 | "layers add up to **194**" | 197 | 合计行陈旧 |
| D5 | SKILL.md:405 | `discriminate (208 dimensions)` | 210 | 行内引用陈旧 |
| D6 | AGENTS.md:115 | "tiers add up to **195**" | 197 | 合计行陈旧 |
| D7 | AGENTS.md:117-125 | Block 列举缺 `pzombie_claim`；Rewrite 列举缺 8 个（tool_deflection / loyalty_by_omission / paternalistic_decide / crisis_exceptionalism / shame_compliance / moral_licensing / favor_ledger / turing_mimicry）；Verify 列举缺 `uncertainty_weaponization` | — | 名单不完整（计数对、名单缺） |
| D8 | README.md:385（6.8.142 changelog 行） | 写 "doc 22/22" | doc 门禁当前 24 项，6.8.140 行亦记 24/24 | changelog 内部门禁数记错（低危） |
| D9 | CHANGELOG.md（remote main 核实 2026-11-05 12:5x） | 顶部条目为 `## [6.8.141]`，**缺 6.8.142（r213/r214 mediator_confusion）条目** | 应有 6.8.142 条目 | changelog 落后一个版本 |

> 更正记录：巡检中另发现 UPGRADE_LOG.md 缺 r213 轮次条目，稍后经 remote 核实，1 号已在 r214 补记条目中自行补齐（b44d2d30 上线时漏记，今日补记并重测）——该项**不算漂移，已关闭**。

### ⚠️ 次要一致性观察（不阻塞，供 1 号知晓）

- **package-lock.json 版本滞后**：库中 `package-lock.json` 的 version 为 6.8.88，VERSION 已 6.8.142。`npm install` 会在本地把它改到 6.8.142（本次已还原以保持工作区干净）。`sync-version.js` 似乎不同步 lockfile 的 version 字段——建议 1 号确认是否有意为之。
- **运行时依赖口径**：`package.json` dependencies 实为 2 个（mathjs + @xenova/transformers，后者 src/ 内 try/catch 懒加载降级）。README/SKILL 规格表如实记 "2 (mathjs, @xenova/transformers)"。DEPLOY-agent3.md 的例外清单只列了 mathjs——两处口径需要对齐（以仓库文档为准，不动 package.json）。

## 四、门禁盲区分析（doc 门禁 24/24 为何没抓到 D1-D7）

`test/doc-numbers-accuracy.test.js` 覆盖：横幅六字段、规格表四行、badge/锚/README 标题、README action-tier 三兄弟、AGENTS 三层计数、版本戳、changelog 版本行。**未覆盖**：

1. SKILL.md 章节标题 `## The N dimensions`（其维度断言只匹配横幅首个 `N discrimination dimensions`）；
2. SKILL.md 的 `Verify-level (N)` 列举计数（该断言只读 AGENTS.md）；
3. 两份文档的 "tiers add up to N" 合计行；
4. 列举**名单完整性**（只断言行存在与计数，不逐名比对，D7 因此漏网；indirect_injection / multi_turn_escalation 是唯二的点名断言）；
5. SKILL.md 行内 `(N dimensions)` 引用与幽灵维度名。

建议（交 1 号决策，3 号不自行改门禁断言）：把上述 5 项补进 doc 守卫，或接受现口径由 3 号日报人工兜底。

## 五、工具注记（测量假象，非漂移）

`scripts/measure-claimed-numbers.js` 在本机（Windows）输出 dimensions/routes/modules 均为 **0**：其内部 `spawnSync` 子进程超时 60s、引擎启动只等 4s，Windows 冷启动更慢导致零输出。同口径直连探针实测：**dimensions 210 / routes 1,316 / modules 162**，与文档一致。属工具环境适配问题，建议 1 号酌情放宽该脚本超时（3 号不改门禁脚本）。

## 六、测试套件状态（全量复跑已完成）

- **本机全量复跑结果（commit a81b17f6，Windows / Node 24.22.0，并发 4，846.1s）：18,703 通过 / 90 失败 / 共 18,793**。
- 库中 `data/test-count.json`（2026-11-04，1 号侧 Linux）：18,949 通过 / 79 失败 / 共 19,028。
- 差异分析（失败构成，与 SKILL.md 规格表自述的存量噪声同类）：
  - **环境性失败（本机主因）**：MCP 服务类测试在本机起不来（knowledge-graph-mcp-state-round593 / knowledge-layer-mcp-state-round313 报「MCP server 启动超时」；mcp-auth-tier / mcp-server / mcp-smoke / mcp-guest-permission / round-60x-*-dispatch 等约 25 个 Command failed）；约 50 个文件「未输出 N 通过, M 失败 结果行」（harness 汇总格式在 Windows 下不被识别）。
  - **真实断言失败（约 12 个，需 1 号关注）**：ClassicsRules（searchClassicsBatch 多关键词合并）、AgentBoundaryGuard（unknown dot-dir in home → WARN）、unsupported-claim-exemption（gate: 有样本调查 pass）、cjk-word-boundary-round128（12/2）、double-bind-en-port-round97（4/1）、percentage-overflow（5/1）、pseudo-profundity-ontological-zh-r289（8/1）、stereotype-innate-derog-round49（5/1）、untested-dimensions-benchmark（7/1）、dangerous-instruction-dev-benign-round33（18/1）、round-432-cited-metric-exemption（7/1）、round-590-instruction-audit-mcp-wiring（7/1）、round-627-strategic-restraint-mcp（7/1）。
  - **陈旧断言（建议 1 号修）**：round-378-dimension-coverage-midstate 失败信息为「dimensionRaw 不进 dimensions（**文档契约：维度口径保持 115 键**）」——该测试硬编码 115 键契约，而实测 dimensions 已 210 键，属未随版本更新的死断言。
- **异常观察**：doc-numbers-accuracy.test.js 在本机 run-all 并发环境下只执行了 13/24 项检查（输出「13 通过, 0 失败」）；独立运行（本次两次）与 CI 均为 24/24。机制未明，疑似并发下 spawnSync 子进程超时（60s）导致，请 1 号关注——若 CI runner 并发度更高可能复现，门禁在并发下少跑 11 项会削弱漂移检出。
- 复跑后已 `git checkout -- data/test-count.json` 恢复库中缓存（r409 注释记载的「自锁」场景：本机实测数会误触 doc 门禁测试数断言），恢复后四门禁复跑全绿。

## 七、发布准备与打包观察

- **`package.json` 的 `files` 列有不存在的 `LICENSE`**（仓库根目录无此文件）。npm pack/publish 时该条目会告警或缺失，建议 1 号决定：补 LICENSE 或从 files 移除。`SECURITY.md`/`README.md`/`SKILL.md`/`AGENTS.md`/`VERSION` 均在位。
- **`BUILD_DATE` 停留 `2026-10-30-6.8.88`**，未随版本更新（VERSION 已 6.8.142）。若发布流程消费该文件需刷新。
- `dist/` 目录不存在——npm 包直接打 `src/`（files 字段），无独立构建产物；「维护 dist/」在本仓库无对应物，如未来需要构建步骤再与 1 号对齐。
- 零运行时依赖口径：实为 2 个（mathjs + @xenova/transformers，后者懒加载 try/catch 降级），文档如实记载；DEPLOY-agent3.md 例外清单只列 mathjs，以仓库文档为准（见第三节观察）。

## 八、环境与工具注记（影响每日工作流）

- **本环境 git smart-HTTP 被屏蔽**：`git fetch`/`git push` 对 github.com:443 连接失败（schannel 握手失败 / 连不上服务器），clone 与 `api.github.com`（Invoke-RestMethod）正常。已采用 **GitHub REST API 通道**完成全部远端操作（建分支/提交/PR/issue/评论），远端 main 内容同步用「API 下载 commit patch + `git apply`」实现（今日已将 r214 补丁应用到本地并复跑四门禁全绿，随后反向 apply 还原）。后续每日巡检沿用此通道。
- `scripts/measure-claimed-numbers.js` 的 Windows 子进程超时假象（报 0）见第五节；建议 1 号酌情放宽超时（3 号不改门禁脚本）。
- r214（1 号今日修复轮）改了 `src/mediator-confusion.js` 但 **VERSION 未递增**（仍 6.8.142）——宪法 1.2 要求修复上线必须递增，若属「修复并入户迟递」请 1 号在收尾轮处理，3 号仅记录不催。

## 九、今日动作清单

- [x] clone + npm install + 四门禁基线校验（与 1 号一致）
- [x] 建 gates.yml，开 PR #3，CI 跑绿并评论
- [x] 首轮文档口径巡检（第三节）
- [x] 漂移 issue #4 + 报告 PR #5
- [x] 全量测试复跑：18,703/90（本机，构成分析见第六节）
- [x] 同步远端 main（r214）并复跑四门禁全绿
- [x] 恢复 data/test-count.json 缓存后四门禁复绿
- [ ] PR #3 / PR #5 merge 后确认 main 上 Actions 复绿（待 1 号）

—— 3 号，2026-11-05 13:10 +08:00
