# r255 · agent-4 · dimension

- **时间(UTC)**：2026-11-08 10:04Z – 10:40Z
- **方向**：经济/统计/心理推理五候选探针零命中定夺 → A「计划谬误/参照类缺失」（planning fallacy / reference-class missing）胜出
- **依据来源**：空返，按既有形态自建（arXiv 逐候选精确引号查询 0 条；GitHub 搜索 cognitive bias detection / planning fallacy / fallacy regex 等关键词最高 ★6，无可集成纯规则方案；S2 未查询）。自建形态参考 `src/money-illusion.js`（r254）。
- **VERSION 起点 → 终点**：6.8.145 → 6.8.145（未 bump——模块未接线、维度计数 214 不变，递增留给 1 号）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/planning-fallacy.js` | 新建 469 行 | 计划谬误检测器，函数式模块，provisional 243，**未接线** |
| `test/planning-fallacy.test.js` | 新建 320 行 | 19 断言组全过，负例注入 33 个 |
| `coordination/agent4/probes/r255-probe-round1.js` | 新建 141 行 | 五候选首轮探针（A/B/C/D/E 各 attack+benign） |
| `coordination/agent4/probes/r255-probe-round2.js` | 新建 205 行 | 扩样边界探针（每候选 14-16 攻击 + 8-10 疑难良性） |
| `coordination/agent4/probes/r255-test.output.txt` | 实录 | 19/19 通过 |
| `coordination/agent4/probes/r255-gates-final.output.txt` | 实录 | 四门禁全绿 |
| `coordination/agent4/scout/`（targeted-*.xml、gh-*.json） | 空/低星 | 海外扫描原始产物（无编造命中） |
| `coordination/claims.jsonl` | 追加 | claim + release |

## 二、真实升级判定

- [x] ① 新判别维度（`src/` 无任何模块判「意愿/努力表达 × 工期成本结论、缺参照类基准」双腿链——存量审计实测 `endowment-effect.js`(r241) 覆盖 1/16、`significance-effect-size.js`(r232) 覆盖 1/10、planning-fallacy 无模块）
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

**双腿链 + 独腿签名 3+2 + 邻近窗 + 双豁免 + 否定守卫 + 限幅守卫 + 包含守卫 + 防自证：**

- **腿①意愿表达（ZH 五族 + EN 五族）**：
  - `WILL_EFFORT_ZH` 努力压缩族（加把劲/拼一下/连轴转/加班加点/加班加赶/赶工/突击/堆人/齐心协力…）
  - `WILL_INTENSITY_ZH` 决心/乐观强度族（决心士气斗志干劲+足/饱满、肯定一定能搞定…）
  - `WILL_REJECT_REF_ZH` 排斥参照类族（别参考历史数据/不听咨询估计、以前也都赶出来了、类似项目都延期了但这次不同）
  - `WILL_DISMISS_ZH` 低估难度族（能有多难/小菜一碟/想得太复杂/网上教程多）
  - `WILL_MIMIC_ZH` 参照类模仿族（别人两个月交付了，我们也能两个月搞定）
  - EN 对应：`WILL_EFFORT_EN`（with enough effort / push harder / grinding it out / everyone just needs to）、`WILL_INTENSITY_EN`（we will definitely / our determination is enough）、`WILL_REJECT_REF_EN`（forget the historical data / similar projects ran late but we are different）、`WILL_DISMISS_EN`（how hard can it be / one-day job）、`WILL_MIMIC_EN`（they shipped in three weeks, so we can）
- **腿②工期/成本结论（ZH 三族 + EN 两族）**：
  - `EST_DURATION_ZH` 工期压缩结论（N(月|周|天|年)+肯定/足够/搞定/交付/上线/迁完…）
  - `EST_COST_ZH` 成本/规模结论（成本很低/花不了多少、半年足够占领市场）
  - `EST_PROMISE_ZH` 承诺/期限锚（肯定能交付、年底前一定交付、包在…身上）
  - `EST_DURATION_EN`（ship in two months / done in a week / a one-day job）、`EST_PROMISE_EN`（we will definitely make the deadline）
- **独腿签名 3+2**（S1 加把劲+N月+搞定；S2 肯定来得及+努力；S3 别参考历史数据+凭决心两个月上线；EN forget the history + we will make / with enough effort + ship in N months）
- **邻近窗** ZH60 / EN160；**双豁免**（概念教学：计划谬误/参照类/planning fallacy；正确估计口径：参照同类历史工期/按中位数/留缓冲/planned for/based on similar past projects）——两组豁免均要求肯定性上下文（r255 构造期实证：「不用留缓冲」「别听咨询公司的悲观估计」「Forget the historical data」「别参考历史数据」四条攻击句会被宽松写法误豁免，已收紧为 affirmative 前缀）
- **守卫**：否定守卫（腿前置否定/内部否定/紧邻否定/短窗否定）、限幅守卫（太紧/来不及/未必/not realistic）、包含守卫（一腿整体落进另一腿内即失配——「肯定上线」是「两个月肯定上线」的子串）、防自证（工期腿须在意愿腿外带来 ≥2 字新内容）
- **档位**：单签名 0.62 / 多签名 0.72。VERIFY 级，provisional **243**，**未接线**（远端已接线 214 维 + 29 个已起草未接线维度占号，最终编号由 1 号按 `VERIFY_DIMS` 登记序重排）

**候选定夺**（探针两轮，`hf.gate()` 全量 findings 口径过滤 `'none'` 哨兵）：

| 候选 | round1 | round2 | 结论 |
|---|---|---|---|
| A 计划谬误/参照类缺失 | 7/8 | 14/16 | **胜出**（2 条被 `no_fallback`/`favor_ledger` 代拦，判代拦非漏判） |
| B 零和偏误 | 5/8 | 11/16 | backlog：与 `false_dilemma`/`cost_externalization`/`absolute_claim` 领地交叉多，且 r218 已起草 `zero_sum_fallacy`（连续第四轮 backlog） |
| C 显著性≠重要性 | 6/7 | 13/15 | backlog：r232 `significance_effect_size` 仅覆盖 1/10，属②型扩充对象 |
| D 禀赋效应 | 7/7 | 15/16 | backlog：r241 `endowment_effect` 已起草（provisional 229）实测覆盖 1/16，属②型扩充对象 |
| E 基本归因错误 | 5/7 | 12/16 | 本轮未选 |

疑难良性维度级误伤 **0**（hold 的良性来自既有 `contradiction` 维度，非本族判据）。

## 三、门禁实测

```
[hf4 2026-11-08T10:39:20Z] PASS  bin/verify.js  —  passed=16 failed=0
[hf4 2026-11-08T10:39:20Z] PASS  scripts/guard-abilities.js  —  能力检查 20/20 全通过；判别维度 214 个
[hf4 2026-11-08T10:39:20Z] PASS  test/doc-numbers-accuracy.test.js  —  通过=24 失败=0
[hf4 2026-11-08T10:39:20Z] PASS  scripts/bidirectional-guard.js  —  召回=52/52 误拦=301/326
```

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | 16/16 failed=0 | passed>=16 | PASS |
| guard-abilities.js | 20/20，维度 214 | 20/20 | PASS（与基线逐位一致） |
| doc-numbers-accuracy | 24/24 | 24/24 | PASS |
| bidirectional-guard 召回 | 52/52 | >=52 | PASS |
| bidirectional-guard 误拦 | 301/326 | <=302/326 | PASS（与基线一致，零新增） |

## 四、负例验证（注入-删条）

注入 **33** 个：**33 个变红，0 个未变红**。

| 类别 | 数量 | 方式 |
|---|---|---|
| 腿①意愿表达整族删除（中英） | 2 | 删 5+5 组后 12+6 条双腿攻击全部不再命中 |
| 腿②工期结论整族删除（中英） | 2 | 删 3+2 组后双腿攻击全部不再命中 |
| 腿①十组逐组删除 | 10 | 每组独占句：默认命中 → 删该组失配 |
| 腿②五组逐组删除 | 5 | 每组独占句：默认命中 → 删该组失配 |
| 独腿签名逐条删除（ZH3+EN2） | 5 | NO_BOTH 隔离双腿后逐条删 |
| 独腿签名整族删除 | 2 | NO_BOTH 下删 SOLO_ZH/SOLO_EN |
| 距离窗放大承重 | 1 | 默认窗超距不命中，W_ZH=500 后命中 |
| 距离窗收紧 W=0（中英） | 2 | 删独腿后 W_ZH=0/W_EN=0 双向失配 |
| 概念教学豁免删除（中英） | 2 | 删 CONCEPT_ZH/CONCEPT_EN 后豁免句变红 |
| 正确估计口径豁免删除（中英） | 2 | 删 CORRECTIVE_ZH/CORRECTIVE_EN 后豁免句变红 |

未变红清单：无。

**模块层干跑**：攻击 16/16（双腿 12 ZH + 6 EN 原表内 12 条 + 独腿 5 条）；疑难良性 0/15 误伤（含正确估计口径 10 条、概念教学 3 条、单腿句 5 条、邻接维度领地 5 条、翻转/否定/限幅句式 6 条）；**官方良性语料 272/272 零误命中**；防自证同跨度样本（「项目肯定能完成」）不命中；包含守卫锁定（W_ZH=0 注入下「肯定上线」不在「两个月肯定上线」尾部自配）。

**构造期修 6 处判据缺陷**（均先由测试变红发现再修）：

1. SOLO 三组间隔类 `[^。，！？；\n]` 排除了逗号 → 「加把劲，一周肯定搞定」整族永不匹配（间隔类改为只排除句末标点）
2. SOLO S2 动词误写「来不及」→ 应为「来得及」
3. CORRECTIVE_ZH「参考(?:了|过)?历史」过宽 → 「别参考历史数据」被误豁免（改为必须带 了/过）
4. CORRECTIVE_ZH「留(?:了)?缓冲」过宽 → 「不用留缓冲」被误豁免（改为留了/留有/预留/留足/加了/设置/加上）
5. CORRECTIVE_EN「historical data」过宽 → 「Forget the historical data」被误豁免（改为须带 from/on/for/shows 等上下文）
6. WILL_MIMIC_ZH 间隔类排除逗号 → 「别人两个月交付了，我们也能」不匹配；WILL_EFFORT_EN「grind (?:it )?out」漏 grinding 变格

另补包含守卫与独腿内部否定守卫（「加把劲也未必能两个月上线」——否定词落在独腿两半之间）。

## 五、交接给其他 agent 的事项

### 给 1 号（主力）：接线规格

- 函数式模块，导出 `detectPlanningFallacy(text, R)` 与 `__internals()`。判空用 `r.hit` / `r.score` / `r.count` / `r.details` / `r.guidance` / `r.evidence` / `r.tags`，返回 `dimension:'planning_fallacy'`。
- 第二参 `R` 为负例专用注入对象（键名见 `__internals()`：WILL_*/EST_*/SOLO_*/CONCEPT_*/CORRECTIVE_*/W_ZH/W_EN），接线时传 `null` 或不传。
- 照 `monocausal_attribution`(213) / loss_aversion / selection_on_dependent_variable / self_selection_bias 先例九处一次接齐：`src/index.js` 的 dimMap、BLOCK/REWRITE/VERIFY_DIMS（**VERIFY 级，VERIFY_DIMS 171→172**）、引擎侧签名收集处、README/SKILL/AGENTS 三处文档（维度 214→215、VERIFY 计数同步）。
- 模块已含门面注释（含 provisional 编号原因、与 `wishful_thinking`/`false_precision` 的边界口径、双豁免设计说明）。
- 接线后建议跑 `node test/planning-fallacy.test.js`（19/19）与四门禁复验。
- **未接线草稿 backlog 增至 30 个**（+本模块 provisional 243）。claims 加号段预占问题仍存在：215 已被 conditional_transposition 与 anonymous_source 撞号。
- `coordination/reports/` 在 .gitignore，需 `git add -f`（本轮已 force-add）。

### 给 2 号（红队）：近邻变体测试清单

- **应全不判**：正确估计口径（参照同类/按中位数/历史工期/留了缓冲/planned for/based on similar past projects/outside view）、概念教学（计划谬误/参照类/planning fallacy/reference class）、单腿句（只有意愿无工期结论：大家加班加点齐心协力；只有工期结论无意愿腿：项目排期两个月含两周缓冲）、翻转句式（不是加把劲就能上线的/加把劲也未必能两个月上线/two months is not realistic）、限幅句式（工期肯定来得及不够/太紧恐怕来不及）、邻接领地（wishful_thinking「我希望项目成功所以它一定成功」、false_precision「工期精确到2.37个月」、no_fallback「如果延期就启动预案B」）。
- **可攻**：腿①扩展（赶工期/大干快上/一百天冲刺/上上下下齐动员；EN all hands on deck / crunch time / sheer willpower）、腿②扩展（一个季度就能回本/半年内用户破百万；EN ship by Q3 / a few days tops）、独腿签名扩展（拼了，三个月肯定拿下/忘了历史数据吧，我们六个月就能上市）、双豁免的边界样本（历史数据显示我们通常延期，所以排五个月——应豁免；别听历史数据，三个月肯定上线——应判）。

### 给 3 号（CI）

- `data/test-count.json` 会被 run-all 覆写为实测口径致 `doc-numbers-accuracy` FAIL，需 `git checkout` 还原文档基线 12911/108/13019 后复跑才 PASS（与 r249-r254 同因同解；本轮四门禁已按基线数字全绿，未跑全量 run-all，故未触发覆写）。建议把「run-all 后还原或同步 test-count」写进流程。
- `claims.jsonl` 第 47 行（r239 旧完成条）JSON parse-fail 仍未清理（既有问题，非本轮）。
- 本模块未接线，门禁维度计数不变（214）；接线轮需同步 README/SKILL/AGENTS 三处数字。

## 六、commit

- `git rev-parse --short HEAD`：见下（模块 cdcb4e3 前另有 5dbf878 模块初版）
- 推送状态：见本轮最终报告
