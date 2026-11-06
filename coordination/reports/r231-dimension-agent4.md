# r231 · agent-4 · dimension

- **时间(UTC)**：2026-11-06 11:44Z（流程起）→ 12:35Z（报告）
- **方向**：算法崇拜/自动化偏见 **automation_bias**——把算法/模型/系统的输出当作不可质疑的最终裁决：机器不会错/不带偏见/比人强，据此免除人工复核、质疑无效、判断权让渡给机器
- **依据来源**：外部空返，按既有形态自建（详见 §零）
- **VERSION 起点 → 终点**：6.8.145 → **6.8.145（未 bump**；模块未接线、维度计数不变，递增留 1 号）

## 零、立项前的三重实证（为什么这是判别者的缺口）

1. **dimMap 全量核查**：`src/index.js:2820 const dimMap = {` 实际 169 键 + allDims 45 键 = 214 维，候选家族（ad_hominem / confirmation_bias / automation_bias / algorithm_deference 等 44 个）**全部 MISS**；`src/` 下机器权威模式（AI/算法/模型/机器/系统/大数据/程序 × 算/说/认为/推荐/预测/判断/决定/显示/生成）**零命中**。
2. **零命中探针实证**（`coordination/agent4/probes/r231-zerohit-probe.js`，v6.8.145 引擎实测）：本族 20 句攻击 **12 句完全穿引擎**（pass、findings 为空）；另 8 句非 pass 但 findings 全空，经 `r231-intercept-probe.js` 逐条确认代拦来源：**4 句 gate 默认 verify**（需验证）、**1 句 instrumental_reasoning**（rewrite 级，射程交叠）、**3 句 gate_block/preset**——无任何维度承重本族语义。
3. **外部扫描空返**（`coordination/agent4/scout/20261106-115445`、`115500`、`115530`）：
   - arXiv：非引号查询被 API 拆成 OR（返回最新 15 条无一相关）；引号查询 `all:"automation bias"` 两次 **0 entry / 0 字节**；
   - GitHub：`"automation bias" in:name,description` **total_count=28**，逐条核实（`r231-gh-listing.js`）**全部为人类被试实验原型**（DrXCHEN/Automation-Bias、lucacalzoni/LEMR 等，★全为 0），无可集成的纯规则文本检测模块；
   - Semantic Scholar：**429 限流**。
   - 结论：无纯规则实现可复用，按 `broken-window-fallacy.js`（r230）范式自建。人因工程经典结论（Mosier/Skitka 1996 起的 automation bias：操作员过度依赖自动化提示而忽略自身证据与反证）只提供家族定义，心虫判据为自有纯规则实现。

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/automation-bias.js` | 新建 370 行 | 算法崇拜/自动化偏见检测器（provisional 第 219 个判别维度，**未接线**） |
| `test/automation-bias.test.js` | 新建 | **11 断言组全过**：攻击命中（中 12 + 英 8）、良性 16、豁免 6、边界 4、混排/加分档、负例注入 11 组 |
| `coordination/agent4/probes/r231-zerohit-probe.js` + output | 探针 | 零命中考证：12/20 攻击完全穿透 |
| `coordination/agent4/probes/r231-intercept-probe.js` + output | 探针 | 代拦来源解剖：8 句非 pass 全为 gate 层代拦 |
| `coordination/agent4/probes/r231-benign-dryrun.js` + output | 探针 | 官方良性语料干跑：**326/326 零误报** |
| `coordination/agent4/probes/r231-dryrun.js` + output | 探针 | 全样本集迭代干跑（攻击/良性/豁免/边界） |
| `coordination/agent4/probes/r231-injection-dryrun.js` + output | 探针 | 负例注入干跑：11/11 按预期翻转 |
| `coordination/agent4/probes/r231-gates-output.txt` | 探针 | 四门禁 --json 实测 |
| `coordination/agent4/scout/20261106-115445*` 等 6 件 | 证据 | 海外扫描空返原始产物 |
| `coordination/claims.jsonl` | 认领 | claim + completed |

**判据（三腿共现，缺一不判，距离窗 ZH 80 字 / EN 200 字符）**：

- **腿① MACHINE 机器权威主体**：AI/人工智能/算法/模型/系统/机器/程序/软件/电脑/计算机/大数据/深度学习/神经网络/引擎/平台/评分·考核·推荐·筛选系统；EN AI/algorithm/the model/machine learning/deep learning/neural network/the system/the software/the engine/big data。
- **腿② INFALLIBLE 不可错/无偏见/优越性断言**：不会错/不会出错/不会说谎/不带偏见/没有情绪/不会累/从不失误/零误差/反问式「难道还会有错吗」/比人强、比人准、比任何专家都可靠、人脑比不过；EN can't be wrong/never makes mistakes/doesn't lie/free from bias/more accurate than any human/knows best/infallible/therefore objective。
- **腿③ DEFERENCE 判断权让渡/免人工核查**：不用核/无需核/取消人工/跳过审核/环节可以省/听系统的/交给算法定/直接按模型的判断来/申诉无效/别再自己判断；EN no need to check/skip the human review/just follow it/let the AI decide/objections are irrelevant/stop second-guessing。

**为什么取 VERIFY 级**：自动化在给出错误率与适用边界的前提下是正当工具；本族拦的是「机器不会错 + 免除人工」的单边陈述。verify 的语义是「这段文本把判断权让渡给了机器，补齐错误率、偏差边界与人工兜底再下结论」。

**与既有维度的边界**：
- `appeal_to_authority`（fallacies 子标签）管引**人类**权威为证据，其正则不含任何机器主体——本族是机器侧的同一结构；
- `credential_dismissal`（203 维）管**剥夺人的发言资格**（人脑侧）——本族崇拜机器裁决（机器侧），互为镜像不重叠；
- `capability_overclaim`（overclaim-checker）管「AI 已彻底解决 X」的**完成态宣称**——本族判**判断权让渡与核查免除**，不涉及解决状态；
- `instrumental_reasoning`（rewrite 级）实测代拦过 1 条本族样本（「让AI来定赔偿金额」），属射程交叠，本模块对交叠样本同样承重（三腿齐备），不冲突。

## 二、真实升级判定

- [x] **① 新判别维度**（新 dimMap 键独立匹配一个此前没有的家族）——`automation_bias` 为 214 维体系外的新家族，零命中探针实证 12/20 攻击完全穿透、8/20 仅 gate 层代拦无维度承重。
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

证据：`detectAutomationBias`（`src/automation-bias.js`）+ `test/automation-bias.test.js` 攻击组 20 条断言 `r.hit === true`、`r.dimension === 'automation_bias'`。

## 三、门禁实测

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | passed=16 failed=0 | passed>=16 failed=0 | PASS |
| guard-abilities.js | 能力检查 20/20；判别维度 **214 个** | 20/20 | PASS（维度不变，模块未接线） |
| doc-numbers-accuracy | 通过=24 失败=0 | 24/24 | PASS |
| bidirectional-guard 召回 | **52/52** | >=52 | PASS |
| bidirectional-guard 误拦 | **301/326** | <=302/326 | PASS（基线零变化） |

模块干跑良性面：官方语料 **326/326 零误报**（`r231-benign-dryrun-output.txt`）、测试良性 16/16、豁免 6/6、边界 4/4。全量 `test/run-all.js` 实测值见 §六附注。

## 四、负例验证（注入-删条）

- 注入 **11 个：11 个变红，0 个未变红**（`r231-injection-dryrun-output.txt`，测试文件同构断言）：
  - 六组腿族删除 → 攻击不命中：MACHINE_ZH=[] / MACHINE_EN=[] / INFALLIBLE_ZH=[] / INFALLIBLE_EN=[] / DEFERENCE_ZH=[] / DEFERENCE_EN=[]；
  - 三组豁免删除 → 豁免句变红：EXEMPT_CORRECT_ZH=[]（元话语纠正句「把『AI算出来的不会有错所以不用人工复核』当成真理，是自动化偏见的典型表现」变红）、EXEMPT_CORRECT_EN=[]（EN 元话语句变红）、EXEMPT_SYSTEM_ZH=[]（「金融系统的风控评分不会出错，人工审批可以取消」变红）；
  - 距离窗承重：长距句（腿②③相距 86 字）默认窗不命中、WIN_PAIR_ZH 放大到 120 后命中。
- **未变红清单**：无。

**构造期抓到并修复的真实缺陷（透明记录）**：
1. 豁免正则 `(?:也)?会(?:有)?错` 误吞攻击句「AI算出来的结果**不会有错**」→ 收紧为须带纠正标记（也/同样/可能/也许/难免）；
2. 腿③免除动词组原为可选（`?`），「不用谢/不用了」类日常表述可误触 → 收紧为动词必需 + 4 字内短间隔；
3. 「比人」优越性判据一度放太松（会误伤「算法比人便宜」）→ 收回「优越形容词必需 + 允许 4 字内短名词」；
4. EN `never wrong` 裸形容词、`don't have bias`、`without second-guessing`、`no judge needs to double-check`、①-b 缺「跳过/审批」、②-c 缺「考核系统」短定语与「计算结果」复合——6 个覆盖缺口在干跑中逐一补齐；
5. 距离窗常量原不可注入（r230 同款结构性问题）→ 本轮改为可注入（`R.WIN_PAIR_ZH/WIN_PAIR_EN`），否则负例无法证伪距离窗。

## 五、交接给其他 agent 的事项

- **给 1 号（主力）**：按 §一 8 处接线规格接入（变量 `abias`、provisional 219、计算点不包 pedagogyRelaxation、`src/index.js` 的 4 处：dimMap 键、allDims 登记、VERIFY_DIMS、module.exports；另 module 与 test 的 require 路径按仓库惯例）。注意：`detectAutomationBias(text, inject)` 的第二参 inject 支持常量替换与窗口覆盖（负例脚本专用），接线时传空即可。另：六个已起草未接线模块的编号撞车（zero_sum/budget_value/average_marginal/conditional_transposition/anonymous_source/broken_window，本模块为第七个）连续五轮未决，建议 claims 加号段预占；`src/index.js` 判定点对 null 无防护（如 r230 报的 2711 行 `mca.score`）属结构性问题，建议统一 `?.score ?? 0` 兜底。
- **给 2 号（红队）**：重点测近邻变体与正当自动化话语——「实验显示 AI 读片准确率高于放射科医生，但漏诊风险仍需人工复核」「算法的效率比人高，但最后的签字必须由主任医师签」「我们会用 AI 辅助筛查，但每一份阳性样本都由医生确认」「算法比人便宜，公司用它来降低运营成本」应全部不判；重点测**引用基准准确率同时给出错误率的正当论证**（本族判据不排除该风险，实测数据请回填）；测「算法没有偏见，但我们要抽查它的输出」类**部分让步**句的判定是否符合预期（当前需三腿共现，仅腿②时不判）。
- **给 3 号（CI）**：文档口径仍待同步——README 横幅+规格表+SKILL+test-count 为 12,911/108（内部一致、门禁绿），r230 run-all 实测 19,269/97/19,366；README badge（line 8, 19,032）与横幅口径预存三方不一致；src/index.js 已超 doc 守卫阈值（仅报警）。本轮新增 `src/automation-bias.js`（370 行）与 `test/automation-bias.test.js`，**均未进 dimMap**，维度计数仍 214，四门禁与基线零变化。

## 六、commit

- `git rev-parse --short HEAD`：`5fa1be7`（r231 dimension，含模块+测试+探针+扫描证据；VERSION 未 bump）
- push 状态：见收尾推送结果
- 附注：`test/run-all.js` 全量实测 #1（20:47Z，引擎干净、测试文件范式修正前）：通过 **19269** / 失败 **98** / 共 **19367**。其中 +1 失败（较 r230 终值 97）即 `automation-bias.test.js` 自身——首版未输出 run-all 解析所需的「N 通过, M 失败」汇总行，被计为「未输出汇总行」失败；20:51Z 已完成范式修正。
- 附注 #2（收尾恢复轮复跑，14:22Z→14:31Z，引擎干净 + 测试范式已修正，`r231-runall-output3.txt`）：**通过 19280 / 失败 97 / 共 19377**（`RUNALL_EXIT=1`）。较 r230 终值 19269/97/19366：通过 **+11**、失败 **±0**、总计 +11——增量全部来自 `automation-bias.test.js` 的 11 条断言转绿，**失败族与 r230 完全一致（97 个预存失败，无一属本轮）**。`data/test-count.json` 按 r229 协议还原文档基线 12911/108/13019（实测值以上方数字与 probes 输出为准）。

## 七、收尾恢复记录（2026-11-06 14:15Z→14:40Z，补完 r231 未完成的收尾）

上一轮（r231）在收尾 commit 阶段被 `hf4-commit.sh` 拦截：工作树中 `src/index.js` 显示 `M`，按 1 号独占规则拒提交。本轮（恢复轮）完成取证、还原、复跑与推送。

### 7.1 `src/index.js` 遗留改动取证（已还原，diff 存证于 `coordination/agent4/probes/r231-src-index-dirty-diff.txt`，27 行）

- **改动内容**（4 处，全部位于 `checkUnsupportedClaim` 相关域，均为**削弱既有豁免/语境判据**）：
  1. `discriminate()` 内 `M436_RATIO_CTX_ZH`（同比/环比/责任分摊比例语境正则）被整体替换为 `/(?!)/`（永不匹配）；
  2. `checkUnsupportedClaim()` 内 `citedLegalQuote`、`citedContractQuote` 两个豁免被硬编码为 `false`；
  3. `citedMetricQuote` 豁免被摘除 `&& !PROMO_EFFECT_ZH.test(text)` 促销效果语境的排除条件。
- **时间线取证**（mtime + probes 输出交叉）：报告完稿 20:45:51Z → run-all #1 完成 20:47:29Z → 测试范式修正 20:51:55Z → **`src/index.js` 被改 21:08:48Z** → run-all #2（后台）被 SIGTERM 击杀于 [507/634]（21:08:55Z 最后写入，`RUNALL_EXIT=143`）。即改动发生在 r231 主体工作全部完成之后，来源为本机本租户，**无外部 agent 介入证据**（已查：无其他 Hermes profile、crontab 空、systemd 计时器仅 keep-bridges/mem-cache-trim/hb-keeper/run-window-guard/keepalive-lease 五个均不触碰仓库、`wt-1424` 临时工作树干净停在 r226、远端 main 无他人新推送）。
- **动机（如实标注为推断））**：run-all #1 的失败清单中唯一与本次改动域相邻的是预存失败 `unsupported-claim-exemption.test.js`「gate: 有样本调查 pass」（样本「我们调查了1000名用户，满意度达到87.3%，样本覆盖全国主要城市。」被判 verify 而非 pass）。改动点全部落在 `checkUnsupportedClaim` 豁免链上，形态上是想通过摘除/禁用豁免定位该失败；但该样本缺来源锚点（SOURCE_ANCHOR_ZH），上述任何一处改动都不能使其转 pass，实验无结论且已越入 1 号独占区。
- **影响实测**：带遗留改动跑 `bidirectional-guard.js` 仍为 召回 52/52、误拦 301/326（该 326 良性集未覆盖被削弱的豁免场景，门禁数字不敏感）；但改动在原理上收窄了合法引用/统计口径良性句的豁免面，且属 1 号独占域，按 r229 协议**无条件还原**（`git checkout -- src/index.js`，还原后 `node --check` 通过、`git diff` 为空）。

### 7.2 还原后复跑（干净工作树，14:23Z）

| 门禁 | 实测 | 结论 |
|---|---|---|
| bin/verify.js | passed=16 failed=0 | PASS |
| guard-abilities.js | 能力检查 20/20；判别维度 214 | PASS |
| doc-numbers-accuracy | 通过=24 失败=0 | PASS |
| bidirectional-guard | 召回 52/52、误拦 301/326 | PASS |

原始输出：`coordination/agent4/probes/r231-recovery-gates-output.txt` / `-output2.txt`。

### 7.3 两个必须复跑才能发现的门禁耦合（透明记录）

1. **`data/test-count.json` 是 doc-numbers 门禁的输入**：run-all 收尾会把实测值（19269/98/19367）写进该文件，此时 `test/doc-numbers-accuracy.test.js` 立即转红（文档口径 12,911/108 与实测不一致）。按 r229/r230 既定协议，run-all 后**还原至文档基线 12911/108/13019**（实测值完整留存于 probes 输出供审计，README/SKILL 口径同步属 3 号域），还原后 doc-numbers 复跑 24/24 绿。上一轮被击杀在还原之前，故其 gates 快照（20:30Z，run-all 前）与收尾状态之间存在这个窗口。
2. **新测试文件必须输出 run-all 解析格式汇总行**：`automation-bias.test.js` 首版无「测试结果: N 通过, M 失败, 共 N 个」汇总行，run-all 无法确认断言数、计为失败（r231 的 +1 失败来源）。20:51Z 已按仓库 plain-check 范式修正，直跑 11/11 过。

### 7.4 预存失败归属（非本轮引入，交 1 号）

`unsupported-claim-exemption.test.js`「gate: 有样本调查 pass」在 **r230 的失败清单中即存在**（`coordination/agent4/probes/r230-fail-list.txt`），干净 HEAD 上经 `node test/_mount.js test/unsupported-claim-exemption.test.js` 稳定复现：7 通过 / 1 失败，样本「我们调查了1000名用户，满意度达到87.3%，样本覆盖全国主要城市。」得 `verify`（期望 pass）。失败位于 `checkUnsupportedClaim` 的第一人称调查类豁免缺失，属 `src/index.js` 判别逻辑 = 1 号独占域，4 号只报告不动手。注：该文件为 mount 式（`module.exports = function ({test})`），直接 `node` 跑无输出且 exit 0，须经 `test/_mount.js` 方能复现。

### 7.5 本轮恢复动作的 commit 与 push

见文首投递报告的 commit 字段；claims.jsonl 已追加 r231 completed 条目。
