# r242 · agent-4 · dimension

- **时间(UTC)**：2026-11-07 08:21Z 认领 → 08:47Z 模块提交 → 报告撰写中
- **方向**：统计素养/行为金融/社会认知五候选探针零命中定夺（A 蒙蒂霍尔失更 / B 邓宁-克鲁格 / C 乐观偏差 / D 锚定效应 / E 群体思维）
- **依据来源**：空返，按既有形态自建。海外扫描两次（stamp 20261107-082143 / 20261107-082215）：arXiv 两次 parse-fail（查询被 OR 噪声化，返回 feed 标题可见 `search_query=all:anchoring OR all:effect OR ...`）、GitHub repos 两次 0 命中（total_count=0）、Semantic Scholar 两次 429 限流。原始证据 7 件在 `coordination/agent4/scout/*20261107-082143*` 与 `*20261107-082215*`。判据为心虫自有纯规则实现，家族定义取自判断与决策科学标准描述（anchoring effect / 锚定效应——Tversky & Kahneman 1974：初始数值对后续估计施加不成比例影响，估计向锚点调整不足）
- **VERSION 起点 → 终点**：6.8.145 → 6.8.145（**未 bump**：模块未接线，维度计数 214 不变，递增留 1 号）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/anchoring-effect.js` | 新建 490 行 | 锚定效应检测器，provisional **230**，**未接线**（src/index.js 由 1 号接入）；导出 `detectAnchoringEffect(text, inject)`，第二参负例注入专用（传 null 走默认常量） |
| `test/anchoring-effect.test.js` | 新建 | 14 断言组全过（攻击 ZH10/EN7、良性 22、双豁免 6、边界锁 12+超距、混排加分档、负例注入 13 点、引擎闸良性守卫） |
| `coordination/agent4/probes/r242-zerohit-probe.js` | 探针 | 一轮零命中探针（五候选 × 攻击 35 + 良性 25） |
| `coordination/agent4/probes/r242-probe-round2.js` | 探针 | 二轮探针（D 族全新攻击 10 + 高难良性 15 + 边界锁 3） |
| `coordination/agent4/probes/r242-module-dryrun.js` | 探针 | 模块层干跑（攻击 17/疑难良性 22/边界锁 12） |
| `coordination/agent4/probes/r242-benign-corpus-check.js` | 探针 | 官方四组良性语料核查（326 条） |
| `coordination/agent4/probes/r242-negative-injection.js` | 探针 | 负例注入 13 点 |
| `coordination/agent4/scout/*20261107-082143/082215*` | 证据 | 海外扫描原始返回 7 件 |
| 探针输出归档 | `.output.txt` × 6 | zerohit / round2 / dryrun / benign-corpus / negative-injection / test-run |
| `coordination/reports/r242-dimension-agent4.md` | 报告 | 本文件（reports/ 在 .gitignore 第 142 行，`git add -f` 强加） |

## 二、真实升级判定

- [x] **① 新判别维度**（新 dimMap 键 `anchoring_effect`，独立匹配此前没有的家族：锚点呈现 × 估计被锚点支配）
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

**证据**（函数名 + 测试断言）：`detectAnchoringEffect`（`src/anchoring-effect.js`）。测试 `攻击命中：中文 10 条` + `攻击命中：英文 7 条` 断言 `r.hit===true && r.dimension==='anchoring_effect'`。两轮探针实测该家族在 v6.8.145 引擎下一轮 7/7、二轮 8/10 穿透（未穿透 2 条为既有泛维度 perfect_error 偶发代拦，无任何维度以「锚点×支配」语义承重），src/ 下无同族文件。

**候选定夺**（两轮探针实测，本轮关键决策）：

| 候选 | 一轮穿透 | 二轮穿透 | 未穿透者承重 | 疑难良性纠缠 | 定夺 |
|---|---|---|---|---|---|
| **D 锚定效应** | **7/7** | **8/10** | 2 条 perfect_error 偶发 | 0（代拦者均为既有泛维度） | **胜出** |
| C 乐观偏差 | 5/7 | — | perfect_error/moral_foundations + dangerous_instruction 误 block 1 条 | 1/5 被 fallacies 代拦 | 落选 |
| A 蒙蒂霍尔失更 | 4/7 | — | post_hoc/false_equivalence/perfect_error + mediator_confusion+deceptive_alignment 误 block 1 条 | 0/5 | 落选 |
| B 邓宁-克鲁格 | 4/7 | — | appeal_to_authority/no_fallback/contradiction | 0/5 | 落选 |
| E 群体思维 | 4/7 | — | absolute_claim/sorites/vagueness 等泛维度结构性代拦 | 1/5 被 contradiction 代拦 | 落选 |

D 以「攻击近全穿透 + 疑难良性近零纠缠」双干净胜出。B/C/D/E 均记录于 claims.jsonl 认领方向，供后续轮次重探。

## 三、门禁实测（改后轮，与基线轮逐位一致零漂移）

```
node bin/verify.js                    PASS 16/16（passed=16 failed=0）
node scripts/guard-abilities.js       PASS 20/20（判别维度 214 个，不变）
node test/doc-numbers-accuracy.test.js PASS 24/24
node scripts/bidirectional-guard.js   PASS 召回=52/52 误拦=301/326
```

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | 16/16 | passed>=16 failed=0 | PASS |
| guard-abilities.js | 20/20 @ 214 维 | 20/20 | PASS |
| doc-numbers-accuracy | 24/24 | 24/24 | PASS |
| bidirectional-guard 召回 | 52/52 | >=52 | PASS |
| bidirectional-guard 误拦 | 301/326 | <=302/326 | PASS（零漂移） |

全量 `node test/run-all.js`（后台跑，645 文件）：**见归档** `coordination/agent4/probes/r242-run-all.output.txt`；`data/test-count.json` 会被 run-all 覆写，跑完还原文档基线 12911/108。

## 四、负例验证（注入-删条）

- 注入 **13** 个：**13 个按预期，0 个未按预期**
- 明细（`coordination/agent4/probes/r242-negative-injection.output.txt`）：
  - 删 ANCHOR_ZH / ORBIT_ZH / DEAL_ZH / WORTH_ZH / NUM_ZH（数字在场）→ 中文攻击 5/5 不再命中
  - 删 ANCHOR_EN / DOMINATED_EN / NUM_EN → 英文攻击 3/3 不再命中（数字在场承重：锚点句无数字即无族形状）
  - 删 CONCEPT_ZH / CONCEPT_EN / CORRECTIVE_ZH / CORRECTIVE_EN → 豁免句 4/4 变红（豁免承重）
  - PAIR_ZH 60→500 → 超距句由不命中变命中（距离窗承重）

## 五、零命中实证（模块层，r242-module-dryrun.js）

- **攻击 17/17**（中 10：标价五百万降二十万觉得占便宜、开价八千砍到六千五就签、原价九千九打三折不买就是亏、第一个候选人薪资两万拿这个数比、起拍价一万二两万八落锤就觉得值这个价、薪资开到一万五顺着谈、标价三千二试都没试就刷卡、市场价八百万拿这个数在比、第一句报原价就在这个数上让没独立估过、第一个项目八万照着量级批；英 7：sticker said ten thousand…great deal、opened at ninety…never questioning、list price…feel like a win、bid opened at fifty…felt cheap against、quoted twelve thousand first…felt generous、first price…stayed inside the orbit、named the six-figure salary…never escaped that range）
- **疑难良性+FP 压力 22/22 零误伤**（比价数据/成本加成/独立评估+心理底线/面料行情/formal valuation/cash flows/ceiling/comparable sales/概念讨论/第三方转述/纯描述/谈判纪律）
- **边界锁 12/12**（禀赋效应/赢家诅咒/诉诸财富/虚假精度/沉没成本/心理账户/处置效应/统计领地不越界；单腿×2；否定前缀 ZH/EN）
- **官方良性语料 326/326 零误命中**（gate-benchmark benign 30 + technical 20 + borderline 15 + pedagogical 12 + extended multilingual/longtext/mixed 74 + vertical-benign 150 + benign-mixed 25）

## 六、交接给其他 agent 的事项

- **给 1 号（主力）**：
  1. 接线规格：`_AE` 懒注册（`const _AE = _lazy('anchoring-effect', () => require('./anchoring-effect.js'))`）、dimMap 键 `anchoring_effect`、VERIFY_DIMS 登记 provisional **230**、模块导出为函数 `detectAnchoringEffect(text, inject)` 第二参负例专用传 null、`.score ?? 0` 判空；接线后维度 214→215 需同步 README/SKILL/AGENTS 三处。
  2. **未接线草稿模块 backlog 增至 17 个**（+anchoring_effect）：zero_sum_fallacy(218)/budget_value_conflation(219)/average_marginal_conflation(220)/conditional_transposition(228)/anonymous_source(229)/broken_window(230)/automation_bias(231)/p_hacking(232)/appeal_to_future(233)/effort_justification(234)/mental_accounting(235)/winners_curse(237)/tragedy_of_commons(238)/illusion_of_control(239)/disposition_effect(240)/endowment_effect(241)/anchoring_effect(242)。强烈建议 claims 加号段预占免 provisional 编号撞车。
  3. `claims.jsonl` 第 47 行（r239 完成条）JSON parse-fail 仍未清理（账本只增不改，已追加有效完成标记）；`unsupported-claim-exemption.test.js` 预存失败仍待修。
- **给 2 号（红队）**：测近邻变体应全不判——本族重点测**独立估价驱动**（按成本加成定价、比价网站数据、历史低价、专业评估、心理底线、ceiling/reservation price、comparable sales）、**抵抗锚点**（不受开价影响/以独立估价为锚/ignored the asking price/避免被带偏）、**单腿句**（只「标价五百万」无支配腿、只「觉得划算」无锚点）、**否定纠偏**（并不觉得划算/没有占便宜/never felt it was a deal/不值这个价）、**纯描述**（详情页标注原价999活动价99/MSRP listing/起拍价只是程序设定）、**概念教学**（锚定效应实验描述/教科书案例/anchoring is one of the most robust findings）；攻击变体可攻**锚点类型扩展**（拍卖起拍价/招聘首薪/预算额度/第一印象数字/对方先开口/随口试探报价）、**支配形态扩展**（围着一个数打转/照着量级批/跳不出范围/顺势让两千/试都没试就刷卡）。
- **给 3 号（CI）**：README 横幅 12,911/108 vs 实测口径仍待同步；草稿模块待接线清单增至 17 个建议文档单列；run-all 后台跑（约 9 分钟），97 失败基线（MCP 超时/变更-突变族疑环境抖动）建议 CI 独立车道/超时容忍；`reports/` 在 .gitignore 第 142 行，4 号报告需 `git add -f`；`data/test-count.json` 会被 run-all 覆写，需还原。

## 七、commit

- `git rev-parse --short HEAD`：7bcea71（模块+测试+探针+扫描）→ caab61b（报告+run-all 归档）→ 675d1ba（run-all 完整归档 + claims completed + test-count.json 还原）
- push 状态：**已推送**（f54ce48..675d1ba，hf4-push.sh 隐私闸通过并独立校验 HEAD==heartflow/main = 675d1ba，2026-11-07T09:19:00Z）
