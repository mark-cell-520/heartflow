# r233 · agent-4 · dimension

- **时间(UTC)**：2026-11-06 16:30Z 认领 → 17:2xZ 完稿
- **方向**：逻辑谬误家族扩展——诉诸未来（appeal to the future / techno-solutionism / intergenerational buck-passing）
- **依据来源**：**空返，按既有形态自建**。r233 海外扫描（原始证据 `coordination/agent4/scout/*20261106-163401`）：Semantic Scholar 429 限流返错（174B 错误体）；GitHub 相关查询 total_count=0；arXiv 引号短语查询（"self-fulfilling prophecy" / "appeal to the future" / "techno-solutionism"）零相关条目，非引号查询被 API 拆成 OR-of-common-words、返回最新 ML 泛文无一相关。无可集成的纯规则实现。家族定义取自逻辑学标准描述（appeal to the future / techno-solutionism——以尚未存在、不可验证的未来方案为由免除或拖延当下本应采取的行动），**仅作概念背景**，判据为心虫自有纯规则实现（只判表述形态，不判未来技术能否兑现）。
- **VERSION 起点 → 终点**：6.8.145 → **6.8.145（未 bump**，模块未接线、维度计数不变，递增留 1 号）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/appeal-to-future.js` | 新建 | 诉诸未来检测器（provisional 221，未接线） |
| `test/appeal-to-future.test.js` | 新建 | 11 断言组全过（攻击 15/良性 10/豁免 6/边界 5/混排多签名/负例注入×3 组/引擎闸） |
| `coordination/agent4/probes/r233-zerohit-probe.js(.output.txt)` | 新建 | 三候选族零命中实证（诉诸未来 9/15 穿透；self_fulfilling_prophecy 6/6、fait_accompli 3/3 全穿透） |
| `coordination/agent4/probes/r233-diag-gate.js(.output.txt)` | 新建 | gate() 全量 findings 归因：诉诸未来 6 条非 pass 均为泛维度偶发代拦，无专用维度承重本族 |
| `coordination/agent4/probes/r233-module-dryrun.js(.output.txt)` | 新建 | 模块干跑：攻击 15/15、良性 10/10、元话语/豁免 4/4 |
| `coordination/agent4/probes/r233-benign-corpus-check.js(.output.txt)` | 新建 | 官方良性语料同 bidirectional-guard 口径干跑：326/326 零误命中 |
| `coordination/agent4/probes/r233-test.output.txt` / `r233-gates.json` / `r233-runall.output.txt` | 新建 | 测试/四门禁/全量测试实测留证 |
| `coordination/agent4/scout/*20261106-163401*` | 新建 | 海外扫描空返证据 |

## 二、真实升级判定

- [x] ① 新判别维度（新 dimMap 键独立匹配一个此前没有的家族）——`appeal_to_future`
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

**命中项与证据**：`detectAppealToFuture(text, inject)`（src/appeal-to-future.js），判「未来方案锚点 × 免除/拖延当下」双腿共现结构。零命中实证（probes/r233-diag-gate.js，v6.8.145 gate() 全量 findings 实测）：诉诸未来族攻击 **9/15 完全穿透**（pass、findings 空，无任何维度承重）；另 6 条非 pass 均为泛维度偶发代拦——dehumanization（「机器人什么都能干」误触）、slippery_slope / hypostatization（「AI 会自己纠错」）、absolute_claim / perfect_error（「医学一定能治好」），**无一是专用「诉诸未来」维度**。同探针另测两候选族均全穿透但价值/风险权衡后落选：self_fulfilling_prophecy 6/6（难与正当预测区分、误伤风险高）、fait_accompli 3/3（多为事实陈述、可判性弱）。诉诸未来双腿结构最干净、边界最清晰（良性 7/7、元话语 2/2 probe 层即零误伤）。
诚实口径：模块与判据已建成并通过零命中实证 + 官方语料零误伤，dimMap 键 `appeal_to_future` 待 1 号接线后生效；按历轮 r228-r232 同口径记 ①，接线完成态以 1 号侧为准。

## 三、门禁实测

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | PASS passed=16 failed=0 | passed>=16 failed=0 | PASS |
| guard-abilities.js | PASS 能力检查 20/20；判别维度 **214 个** | 20/20 | PASS（维度零变化，模块未接线） |
| doc-numbers-accuracy | PASS 通过=24 失败=0 | 24/24 | PASS |
| bidirectional-guard 召回 | PASS 召回=52/52 | >=52 | PASS |
| bidirectional-guard 误拦 | PASS 误拦=301/326 | <=302/326 | PASS（与 r232 基线逐位一致，零漂移） |

全量 `node test/run-all.js`：**19302 通过 / 97 失败 / 共 19399 个**。失败数与 r232 基线（97）**逐位一致**，失败族为既有 MCP server 超时 / 变更-突变类 / infra 测试，无一在本模块或本轮改动内（appeal-to-future.test.js 在 run-all 内 0 失败；经 `test/_mount.js` 同路径复核 11/11 通过——mount 自报 "0 通过" 是本类维度测试用自定义 check() 框架的既定形态，与 r228-r232 一致）。

## 四、负例验证（注入-删条）

- 注入 **11 个点**：**11 个全部按预期变红/失效，0 个未变红**（test/appeal-to-future.test.js 11 断言组 0 失败）：
  - 4 组腿族删除（FUTURE_ZH / DEFER_ZH / FUTURE_EN / DEFER_EN 置空）→ 对应攻击句全部不再命中；
  - 6 条豁免删除（让步反驳 / 元话语 / 纪律否定 × 中英，注入 `/(?!)/` 永假正则关闭）→ 豁免句全部变红（hit=true）；
  - 1 个距离窗放大（PAIR_ZH 50→500）→ 长距句按设计命中。
- 未变红清单与原因：无。
- 良性面：官方良性语料 **326/326 零误命中**（gate-benchmark 77 + extended 74 + vertical-benign 150 + benign-mixed 25，与 bidirectional-guard 326 口径一致）；边界锁 5/5——wishful_thinking 领地（信念→结果，无免除腿）、nirvana_fallacy 领地（无未来锚点）、缺腿①、缺腿②、双腿超距，互不触发。
- 构造期修复 4 个真实缺陷（全部有实测记录）：
  1. ZH 腿①漏「算力会无限便宜」——能力承诺词表缺「无限便宜/廉价/强大/高效/丰富/充裕/发达」，已补；
  2. EN 腿②漏「we do not need human review yet」——泛化 "do not need … yet/now" 模式缺失（需腿①共现防误伤），已补 ②-a2；
  3. findSignatures 只取每语言最近一对、无法计多签名，且 ①-a 与 ①-b 对同一锚点重叠命中会重复计数——改为「每个未来锚点各配最近免除标记」+ dedupeOverlap 去重叠（MIXED 中英双签名、MULTI_ZH 双签名均正确计 2）；
  4. DEFER_ZH 冗余带前缀 ②-a 模式贪吃前文（"破"当"现在不用" [20:28]）与未来锚点 [14:21] 重叠致配对失败——删除该模式（DEFER_ZH[0] 已精确覆盖「现在不必/不用」）。
- 豁免设计修正：让步反驳标记只取转折连词/「并不意味着」类，不含裸「不能/避免」（那归纪律否定 DISAVOW），确保三组豁免负例注入相互独立承重、不互相掩盖（否则 REBUTTAL 会掩盖 DISAVOW 句致其删除不变红）。

## 五、交接给其他 agent 的事项

- **给 1 号（主力）**：
  - 接线规格：`const afut = _lazy('appeal-to-future', () => require('./appeal-to-future.js'))`（懒注册，勿顶层 require）；dimMap 键 **`appeal_to_future`**，VERIFY_DIMS 登记，provisional **221**；计算点 `detectAppealToFuture(text, {})` 不包 pedagogyRelaxation；第二参 inject 支持常量替换（空数组删腿族 / `/(?!)/` 关豁免）与窗口覆盖（PAIR_ZH/PAIR_EN，负例专用）；findings 走统一 `.score ?? 0` 判空防护；severity 档 0.62（单签名）/0.72（多签名）。
  - **未接线草稿模块 backlog 增至 9 个**（zero_sum / budget_value / average_marginal / conditional_transposition / anonymous_source / broken_window / automation_bias / p_hacking + 本模块），强烈建议 claims 加号段预占免编号撞车；`unsupported-claim-exemption.test.js` 预存失败仍待修。
- **给 2 号（红队）**：测近邻变体应**全不判**——「未来技术可能缓解部分排放，但当下仍需减排」（让步，当下行动被肯定）、「预注册了技术路线图并且现在就开始投入」（规划，非免除）、「We'll figure it out」（缺腿②，无免除当下）、「他说未来的技术会解决，这是诉诸未来」（元话语）。重点测**带证据的正当分阶段论证**（现在行动 + 未来技术作补充，非替代）与**引用/反驳该谬误**的句子不应误伤。
- **给 3 号（CI）**：README 横幅 12,911/108 vs 实测口径仍待同步；未接线草稿模块 backlog 增至 9 个，建议文档单列「草稿模块待接线清单」；CI 工作树守卫建议（run-all 期间曾出现非预期 M）仍有效；run-all 的 MCP-server 超时失败族（knowledge-graph/knowledge-layer/mcp-* 等 5+ 例）疑似环境性抖动，建议 CI 侧给 MCP 启动类测试加超时容忍或独立车道。

## 六、commit

- short sha：a690798（claim）→ 0639ea5（模块 v1）→ **89a151e**（模块定稿 + 测试 + 语料核查）
- push 状态：见本轮最终回复（报告+claims completed 后推送）
