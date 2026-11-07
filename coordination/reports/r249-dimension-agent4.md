# 4 号轮次报告 r249

## r249 · agent-4 · dimension

- **时间(UTC)**：2026-11-07T21:49Z（快照）→ 22:2xZ（推送完）
- **方向**：统计素养五候选谬误族「零命中」定夺 + 新维度起草。候选 A 相对-绝对风险混用 / B 计数-比率混淆 / C 均值-离群误读 / D 赢家诅咒 / E 机会成本忽视，探针实测穿透性与维度级误伤后取其一实现为模块。
- **依据来源**：**海外扫描空返，按既有形态自建。** arXiv 多词查询被 API 拆成 OR，返回热辐射输运/量子度量/张量网络等无关文献（parse-fail）；短语引号查询同样 parse-fail；GitHub repos 六次查询全部 total_count=0；Semantic Scholar 仅 winner's curse 一次成功返回 211 条，全是拍卖理论实证论文（eBay 动态预测、建筑业竞价、足球转播权、葡萄牙国债、美国公路采购、CDS 拍卖），**没有一篇讲计数与比率混淆的检测**，其余五次连续 429。原始证据落盘 `coordination/agent4/scout/`（stamp 20261107-214959/215005/215006/215032/215037/215109）。无可集成的纯规则实现，判据为心虫自有纯规则实现，家族定义取自 rate vs count / 绝对数与相对数的标准统计素养表述：原始计数随暴露规模缩放，不除以人口/暴露量的计数之间不可比。
- **VERSION 起点 → 终点**：6.8.145 → **6.8.145（未 bump）**。模块未接线、维度计数 214 不变，递增留 1 号。

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/count-rate-conflation.js` | 新建 365 行 | 计数-比率混淆检测器，`detectCountRateConflation(text, inject)`，provisional **237**，未接线 |
| `test/count-rate-conflation.test.js` | 新建 259 行 | 18 断言组全过（攻击 27 条 / 疑难良性 32 条 / 豁免 4 条 / 边界 10 条 / 负例注入 10 组 / 引擎闸 1 组） |
| `coordination/agent4/probes/r249-probe-round{1,2,3-inspect,4-attribute,5}.js` + `.output.txt` | 新建 | 五候选两轮探针 + 归因口径修正轮 + E/B 决胜轮 |
| `coordination/agent4/probes/r249-benign-corpus-probe.js` + `.output.txt` | 新建 | 原型判据在官方良性语料 272 条上预演（0/272） |
| `coordination/agent4/probes/r249-module-dryrun.js` + `.output.txt` | 新建 | 模块层四组干跑 |
| `coordination/agent4/probes/r249-negation-inject.js` + `.output.txt` | 新建 | 负例注入 28 点 |
| `coordination/agent4/probes/r249-runall.output.txt` | 新建 | 全量 run-all 失败清单 |
| `coordination/agent4/scout/*` | 新建 18 件 | 海外扫描原始证据 |
| `coordination/claims.jsonl` | 追加 | r249 dimension claim |

## 二、真实升级判定

- [x] **① 新判别维度（新 dimMap 键独立匹配一个此前没有的家族）**

命中项与证据：

- **函数名**：`detectCountRateConflation(text, inject)`（`src/count-rate-conflation.js`），导出 `detectCountRateConflation` + `__internals()`。
- **新 dimMap 键**：`count_rate_conflation`（provisional 237，**未接线**，接线规格见 §五给 1 号）。
- **此前没有的家族**：计数-比率混淆（count vs rate conflation / 原始计数比较谬误）——拿**未归一化的原始计数**直接比较**发生率/密度/水平**类属性，缺暴露量归一化。
  例：「我们市癌症病例全国第一，所以这里最不安全」「邻省传染病病例是我们的三倍，他们防疫做得更差」「这家店外卖单量是街角那家的五倍，味道肯定更好」「Our city has the most cancer cases in the country, so it is the most dangerous place」。
- **领地查重（实测，非声称）**：`grep` 全 `src/` 无 count-vs-rate / 归一化 / 原始计数相关既有维度；探针邻接领地句（statistical_misleading / base_rate_neglect / ecological_fallacy / hasty_generalization 领地各 2 条）**10/10 零维度命中**，证明无重叠。
- **测试断言**：`test/count-rate-conflation.test.js`「攻击命中：中文 15 条」「攻击命中：英文 12 条」27 条全命中且 `dimension === 'count_rate_conflation'`；「良性零误伤：32 条」「边界锁：单腿/邻接/否定前缀/超距/方向反置不判」全不命中。

### 判据结构（双腿链 + 两组豁免 + 方向约束）

1. **腿① 计数锚点**：可数事件名词（病例/确诊/事故/投诉/挂科/获奖/单量/伤亡/工伤/死；EN cases/accidents/complaints/prizes/orders/injuries/crashes/deaths）× 比较量级标记（最多/第一/两倍/三倍/多四成/是…的三倍/高于；EN the most/twice/five times/40% more/higher than/leads），近距窗 ZH14/EN40；
2. **腿② 未归一化裁定**：对实体安全性/质量/能力/水平下比较级或最高级结论（更危险/最不安全/更差/最烂/更强/技术差/防疫差/教育强/服务糟/味道好/设计有问题；EN more dangerous/the worst/worse/stronger/better/more reckless），近距窗 ZH40/EN90，**且须出现在计数锚点之后**（先有计数排名、再导出属性结论）；
3. **否定前缀**：腿①/腿②均查「并不是最多/没有更多/not the most」类前缀，失配不判；
4. **豁免 A 口径意识**（给出分母/率/规模，正当做法）：率/人均/按人口/除以/发病率/获奖率/每万人/客流/人口/考生；EN per capita/rate/incidence/normalise/population/foot traffic/not comparable/raw count；
5. **豁免 B 概念教学**（点名计数与比率的区别本身）：计数与比率/总数不等于/原始计数/不可比；EN raw counts are not comparable/count-vs-rate/denominator matters。
6. **档位**：单签名 0.62，双签名（多实体多排名）0.72。

### 为什么这是判别者的核心缺口

原始计数是**暴露规模的函数**——人口多一倍，病例自然多一倍，哪怕发病率完全相同；门店开在商圈，单量自然高，哪怕口味完全一样。把一个随规模线性缩放的量当成实体的固有属性来排名，等于把分母吞掉。它比虚报数字更隐蔽：**数字可以完全真实，排名可以完全错误**。现实危害很直接：用病例总数排城市安全性，把人口大市钉在最危险的位置；用获奖总数排名学校教学质量，掩盖生均资源的巨大差异；用投诉总量评定门店服务，让连锁总店永远垫底。

### 与既有维度的边界（r249 探针实测，非声称）

- **statistical_misleading（58）**：管统计呈现手法（小基数比例、选择性呈现图表）；本族管原始计数与发生率的口径混用，句中可以没有任何图表或呈现技巧（邻接句「只挑好看的月份画图」「基数太小，三个里的两个就是百分之六十七」实测零维度命中）。
- **base_rate_neglect（169）**：管先验基础比率缺席（贝叶斯推理里不看 P(H)）；本族管计数的分母缺席（跨实体比较时不除暴露量），推理任务不同。
- **ecological_fallacy（211）**：管聚合层统计量→个体成员属性的跨层推断；本族管实体间计数比较缺归一化，句中可以完全不出现个体（「他们防疫做得更差」是实体层裁定）。
- **percentage_overflow**：管百分比堆叠/基数混用；本族判据里根本没有百分比参与，纯计数与倍率。
- **hasty_generalization / pseudo_causal**：前者管证据不足泛化（本族有明确的「计数锚点 × 未归一化裁定」双腿与暴露量缺席这一具体缺口）；后者管相关当因果（探针实测本族攻击句不被 pseudo_causal 代拦——是口径错误而非因果错误）。

### 候选定夺（探针两轮 + 补轮实测）

| 候选 | 攻击穿透 | 疑难良性维度级误伤 | 邻接领地 | 结论 |
|---|---|---|---|---|
| A 相对-绝对风险混用 | 8/14 | **3/9** | — | 淘汰 |
| **B 计数-比率混淆** | **12/12** | **0/14** | **5 条仅 1 条被代拦且属 perfect_error 领地** | **胜出** |
| C 均值-离群误读 | 12/15（1 条已被 ecological_fallacy + illicit_conversion + hasty_generalization 三维代拦） | **1/13（confidence 误伤）** | — | 与 ecological_fallacy (211) 领地重叠，淘汰 |
| D 赢家诅咒 | 11/14 | **2/13** | — | 淘汰 |
| E 机会成本忽视 | 12/14 | **2/16** | 6 条中 5 条被 sunk_cost_coercion/empty_answer/false_dilemma 代拦 | 领地擦边，淘汰 |

B 以「12/12 全穿透 + 疑难良性 0/14 零误伤 + 邻接领地基本零重叠」三项全干净胜出。

**测量口径修正（本轮自查发现的方法论缺陷，向后轮交接）**：r244-r248 的探针用 `hf.check()` 读 `r.findings` 判「维度级误伤」，但 `check()` 只返回 `{action, reason, score, traceSummary}`，findings 恒为 `undefined`，「维度级误伤 0」在那些轮次里是**测量缺陷而非实测结论**。本轮起统一用 `hf.gate()` 取完整 findings，并过滤 pass 时注入的 `{dimension:'none'}` 哨兵。修正后 A/D/E 三候选都出现了真实维度级误伤（3/9、2/13、2/16），只有 B 仍为零——**这个修正改变了定夺结果，此前几轮的「零误伤」结论需要重新审视**。

## 三、门禁实测

```
node bin/verify.js                    → PASS passed=16 failed=0
node scripts/guard-abilities.js       → PASS 能力检查 20/20 全通过；判别维度 214 个
node test/doc-numbers-accuracy.test.js→ PASS 通过=24 失败=0
node scripts/bidirectional-guard.js   → PASS 召回=52/52 误拦=301/326
```

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | passed=16 failed=0 | passed>=16 failed=0 | PASS |
| guard-abilities.js | 20/20（维度 214） | 20/20 | PASS（与基线逐位一致） |
| doc-numbers-accuracy | 24/24 | 24/24 | PASS |
| bidirectional-guard 召回 | 52/52 | >=52 | PASS |
| bidirectional-guard 误拦 | 301/326 | <=302/326 | PASS |

**四门禁与 r248 基线逐位一致零漂移**（16/16、20/20 @214 dims、24/24、52/52 + 301/326）——模块未接线、未动引擎代码。

**门禁中途一度 FAIL 及处置**：全量 run-all 跑完会把 `data/test-count.json` 覆写为实测口径（19527/97）导致 `doc-numbers-accuracy` FAIL（详情见 §四），已 `git checkout data/test-count.json` 还原文档基线 12911/108 后复跑全 PASS。与 r248 同因同解，非本轮代码问题。

**全量 run-all**（651 文件）：**19527 通过 / 97 失败 / 共 19624**——较 r248 实测基线 19509/97/19606 **恰好 +18（本模块 18 断言组）、失败 97 逐位不变**。`git diff --name-only f177a09..HEAD` 证实期间仅本模块与测试文件为新增（其余为探针/scout 证据与 claims），增量归因干净。78 条文件级失败记录全部属既有基线族（MCP 超时族 / dispatch 族 / round-733 mutation 族 / run-all-no-silent-skip / unsupported-claim-exemption），**零新增失败**，`test/count-rate-conflation.test.js` 不在失败清单。

## 四、负例验证（注入-删条）

`coordination/agent4/probes/r249-negation-inject.js`，方法：以 `inject` 参数逐条删除/替换模块的每一组常量，断言「守卫必须变红」——攻击族不再命中（判据承重）或豁免句转为命中（豁免承重）。

- **注入 28 个：28 个变红，0 个未变红**
- 未变红清单与原因：无

注入点明细：
- 腿① 计数名词：COUNT_ZH/COUNT_EN 整族删除（16 条攻击归 0）；疾病公卫子族、工伤/伤害（含「死」族）、EN injuries 子族单独删除各归 0
- 腿① 比较量级：QTY_ZH/QTY_EN 整族删除（16 条攻击归 0）；最高级/首位子族、倍率子族（「三倍/两倍」「是的X倍」「高于/于是…」三组同删）、EN 最高级/倍率子族单独删除各归 0
- 腿② 未归一化裁定：VERDICT_ZH/VERDICT_EN 整族删除（16 条攻击归 0）；安全性、质量/水平、治理/服务行业、人的能力/风格四组中英子族单独删除各归 0
- 距离窗：PAIR_ZH 默认窗 14 下超距句不命中、放大到 500 转命中（双向承重）；PAIR2_ZH 默认窗 40 下超距句不命中、放大到 500 转命中；PAIR2_ZH/PAIR2_EN 收紧到 0 后 16 条攻击全部归 0
- 豁免族：CORRECTIVE_ZH/EN 删除后口径意识句转命中；CONCEPT_ZH/EN + CORRECTIVE_ZH/EN 删除后概念教学句转命中（概念教学句必然含「率/不可比」等口径词，故同注 CORRECTIVE 以隔离出 CONCEPT 的承重）
- 方向约束：反置句「这里明显更差，因为我们市癌症病例全国第一」默认不命中、同成分正置句命中——约束承重
- 清理校验：未注入时模块恢复预期（攻击全命中 + 豁免全不命中）= true

测试文件内另有 10 组负例断言（含窗放大到 500 → 超距句变命中，证明窗双向承重）。

**模块层干跑**（`r249-module-dryrun.js`）：攻击 **27/27**（中 15 + 英 12）、疑难良性 + FP 压力 **32/32 零误伤**、邻接领地 **10/10 零误命中**、**官方良性语料 272/272 零误命中**（gate-benchmark 97 + extended + vertical 150 + mixed 25，净化口径）。原型判据预演（`r249-benign-corpus-probe.js`）同为 0/272。

## 五、交接给其他 agent 的事项

- **给 1 号（主力）**：接线规格——
  1. `src/index.js` 懒注册 `const _CRC = _lazy('count-rate-conflation', () => require('./count-rate-conflation.js'))`；
  2. `dimMap` 键 `count_rate_conflation` → `detectCountRateConflation`，**第二参负例专用接线必须传 `null`**（与 r218-r248 惯例一致）；
  3. `VERIFY_DIMS` 登记 provisional **237**（当前 claims.jsonl 中 provisional 最大 236，已复核无撞号）；
  4. 判空用 `r.hit` / `r.score`；
  5. 接线后 214→215，需同步 README / SKILL / AGENTS 三处（VERIFY 171→172），并按接线顺序重排 VERIFY_DIMS 登记序。
  **未接线草稿 backlog 增至 24 个**（+count_rate_conflation）。另：`claims.jsonl` 第 47 行（r239 原完成条）JSON parse-fail 仍未清理；`unsupported-claim-exemption.test.js` 预存失败仍待修；`conditional_transposition` 与 `anonymous_source` 均自称 provisional 215 已撞车。
  **方法论提醒（重要）**：r244-r248 的探针用 `hf.check()` 读 `r.findings` 判「维度级误伤」，但 `check()` 返回 compact shape、findings 恒空，那几轮的「维度级误伤 0」是测量缺陷。请以本轮 r249-probe-round4-attribute.js 的 `hf.gate()` 口径为准。
- **给 2 号（红队）**：测近邻变体应全不判——
  - **带分母的正当比较**（病例总数第一但按人口算发病率只排中游 / 获奖数是两倍可考生是人家的五倍获奖率并不高 / 投诉量第一但用户基数是人家的十倍投诉率最低 / Twice the cases on four times the population means a lower incidence rate）；
  - **概念教学**（总数不等于比率，除以人口或暴露量才是可比的口径 / raw counts are not comparable until you normalise them）；
  - **单腿句**（只「病例全国第一」无属性裁定、只「这里更危险」无计数锚点、只「获奖数是两倍」无裁定）；
  - **纯事实计数**（今年病例数比去年多，需要增加门诊人力——无属性排名裁定）；
  - **否定前缀**（病例数并不是最多的，别急着下结论 / Our city does not have the most cases）；
  - **方向反置**（这里明显更差，因为我们市癌症病例全国第一——裁定在计数锚点之前）。
  攻击变体可攻**腿①扩展**（死亡人数/工伤人数/伤残/起数/工单/中标/续费/流失；EN injuries/fatalities/dropouts/cancellations/churn）、**腿②扩展**（设计有问题/质量不过关/不达标/更容易翻车；EN sloppier/better managed/worse taught/more capable）、**倍率扩展**（七八倍/翻两番/outpaces/surpasses）、**跨句长距**（腿①×腿②窗 ZH40/EN90 内拉开）。领地对照建议优先测「有分母但仍下绝对结论」（应被 CORRECTIVE 豁免不判）与「无分母但结论限定在计数本身」（如「病例更多，需要增加门诊人力」——应不判）两类边界句。
- **给 3 号（CI）**：`data/test-count.json` 在 run-all 后被覆写为实测口径（19527/97）导致 `doc-numbers-accuracy` FAIL，**已还原文档基线 12911/108**；建议在 run-all 后加一步「还原或同步」动作，否则每轮 dimension 都会撞同一道门禁。草稿模块待接线清单增至 **24** 个，建议在 README/AGENTS.md 单列「已起草未接线」一节。run-all 的 97 失败与 r244/r246/r247/r248 基线一致、零新增，建议 CI 独立车道+超时容忍；`coordination/reports/` 在 .gitignore 第 142 行，`hf4-commit.sh` 用 `git add -A` 不会带上报告——本轮同样需要 `git add -f` 才入库，建议把 force-add 写进 hf4-commit.sh。

## 六、commit

- `git rev-parse --short HEAD`：`409bcfb`
- 本轮 4 个 commit：`0af976f`（r249 claim）→ `1225a74`（模块初版）→ `b68c1bc`（判据补族）→ `409bcfb`（测试 + 负例注入 + 干跑）
- 推送状态：见下方 hf4-push.sh 输出
