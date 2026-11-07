# r247 · agent-4 · dimension

- **时间(UTC)**：2026-11-07 17:38Z 状态快照 → 18:10Z 报告
- **方向**：统计素养/概率推理（选题库「时间与概率推理：条件概率混淆」+「逻辑谬误家族扩展」）
- **依据来源**：arXiv 2502.03217v1（2025）"The Prosecutor's Fallacy and Expert Testimony: A Modern Take Using Likelihood Ratios"；arXiv 2609.18644v2（2026）"Fallacy Benchmarks Measure Scheme Recognition, Not Fallacy Detection"；arXiv 0907.2478v1（2009）"Why we (usually) don't have to worry about multiple comparisons"；arXiv 2203.08801v1（2022）"Base-Rate Fallacy Redux and a Deep Dive Review in Cybersecurity"；arXiv 1810.06710v1（2018）"Bringing Order to the Cognitive Fallacy Zoo"。GitHub 侧**无可集成的纯规则实现**（`logical fallacy detection` 51 个仓库全为 T5/LLM 模型路线，`redsandr/cognifi` 仅 1★ 且面向印尼语、带 LLM 层，均违反零依赖纯规则铁律）→ **判据为心虫自有纯规则实现，按既有形态自建**。原始证据：`coordination/agent4/scout/r247-arxiv-quoted-20261107-1742.txt`、`r247-scout2-20261107-1745.txt`、`arxiv-20261107-174000.xml`、`github-repos-20261107-174000.json`、`s2-20261107-174000.json`
- **VERSION 起点 → 终点**：6.8.145 → **6.8.145（未 bump**：模块未接线、维度计数 214 不变，递增留 1 号）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/prosecutors-fallacy.js` | 新建 339 行 | 检察官谬误检测器（provisional 235，**未接线**） |
| `test/prosecutors-fallacy.test.js` | 新建 252 行 / 17 断言组 | 攻击命中/良性零误伤/两组豁免/边界锁/中英混排/负例注入 13 点/引擎闸 |
| `coordination/reports/r247-dimension-agent4.md` | 新建 | 本报告 |
| `coordination/agent4/probes/r247-probe-round1.js(.output.txt)` | 新建 | 五候选第一轮零命中探针 |
| `coordination/agent4/probes/r247-probe-round2.js(.output.txt)` | 新建 | A/B/E 三候选第二轮对决探针 |
| `coordination/agent4/probes/r247-module-dryrun.js(.output.txt)` | 新建 | 模块层干跑（攻击/疑难良性/邻接/官方良性语料） |
| `coordination/agent4/r247-gates-baseline.output.txt` | 新建 | 动手前四门禁基线 |
| `coordination/agent4/r247-gates-final.output.txt` | 新建 | 改后四门禁实测 |
| `coordination/agent4/scout/*` | 新建 | 海外扫描原始证据 5 件 |

## 二、真实升级判定（四条至少命中一条，否则是维护不是升级）

- [x] **① 新判别维度**（新 dimMap 键 `prosecutors_fallacy`，独立匹配一个此前没有的家族）
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未被调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

命中项与证据（函数名 + 测试断言）：

`detectProsecutorsFallacy(text, inject)`（`src/prosecutors-fallacy.js`）新建模块，判「把证据侧概率陈述直接当成假设侧倒置结论」这一结构——`test/prosecutors-fallacy.test.js` 中「攻击命中：中文 pair 型·强证据词腿 8 条」「弱证据词×极端比率值腿 5 条」「双腿①路径并存 4 条 + 英文 10 条」三组断言全过，证明 27 条中英攻击样本在新维度下全部命中；同文件「良性零误伤：24 条」「边界锁」「引擎闸」三组证明不误伤。

**真空隙证据（探针两轮实测，v6.8.145 `gate()` 全量 findings）**：27 条攻击样本在**未接线**的引擎上 `gate.action === 'pass'` 且 `findings` 为空（第一轮 8/8、第二轮 12/12、追加变体 7/7）——即现有 214 个已接线维度对这一族零承重。既有维度归因：`base_rate_neglect`(169) 管先验缺席但不判条件概率方向互换；`conditional_transposition` 是 r228 草稿、管命题级互换且无证据×假设双腿与法证/检测语境锚点；`false_precision`(188) 管数字精度、不管概率指称对象；`statistical_misleading`(58) 管统计呈现手法。原候选「多重比较/p-hacking」在立项时即剔除——`src/p-hacking.js`（r232，provisional 220）已起草该族，非新家族。

## 三、门禁实测

```
node bin/verify.js                  → passed=16 failed=0
node scripts/guard-abilities.js     → 能力检查 20/20 全通过；判别维度 214 个（不变）
node test/doc-numbers-accuracy.test.js → 通过=24 失败=0
node scripts/bidirectional-guard.js → 召回=52/52 误拦=301/326
```

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | 16/16 | passed>=16 failed=0 | PASS（与基线逐位一致） |
| guard-abilities.js | 20/20，维度 214 | 20/20 | PASS（维度计数不变，模块未接线） |
| doc-numbers-accuracy | 24/24 | 24/24 | PASS |
| bidirectional-guard 召回 | 52/52 | >=52 | PASS（不降） |
| bidirectional-guard 误拦 | 301/326 | <=302/326 | PASS（不升） |

基线（动手前，`r247-gates-baseline.output.txt`）与改后（`r247-gates-final.output.txt`）**四项数字逐位一致，零漂移**。

**全量 run-all**（`coordination/agent4/probes/r247-run-all.output.txt`，650 个测试文件）：**19489 通过 / 97 失败 / 共 19586**——较 r246 基线 19472/97/19569 **恰好 +17（= 本模块 17 个断言组）、失败 97 逐位不变**。逐文件比对失败清单：r247 的 37 条失败记录（36 个唯一文件）**全部**已存在于 r244 基线失败清单（`r244-runall.log`），即 `comm -13` 为空——**零新增失败**。失败族与 r246 交接描述一致：MCP 超时族（mcp-server/mcp-smoke/mcp-auth-tier/mcp-guest-permission/knowledge-graph-mcp-state）、dispatch 族（round-606/608/609/614/615/621/639）、mutation 族（round-327/428/436/733）、`run-all-no-silent-skip`、`unsupported-claim-exemption`。`data/test-count.json` 已被 run-all 覆写为实际数，已 `git checkout` 还原文档基线 12911/108。

## 四、负例验证（注入-删条）

测试脚本 `test/prosecutors-fallacy.test.js` 共 17 个断言组，其中 7 组为负例注入，覆盖 **13 个注入点**。逐点实测：

| # | 注入 | 预期行为 | 实测 |
|---|---|---|---|
| 1 | 删腿①整族 ZH（`STRONG_ZH:[]`+`WEAK_ZH:[]`） | 17 条中文攻击全部不再命中 | ✅ 全不命中 |
| 2 | 删腿①整族 EN（`STRONG_EN:[]`+`WEAK_EN:[]`） | 10 条英文攻击全部不再命中 | ✅ 全不命中 |
| 3 | 删极端比率值 ZH（`RATE_ZH:NEVER`） | 5 条弱证据词腿攻击不再命中 | ✅ 全不命中 |
| 4 | 删极端比率值 EN（`RATE_EN:NEVER`） | 2 条英文弱证据词腿攻击不再命中 | ✅ 全不命中 |
| 5 | 删腿①强证据词 ZH（`STRONG_ZH:[]`） | 8 条强证据词腿攻击不再命中 | ✅ 全不命中 |
| 6 | 删腿①强证据词 EN（`STRONG_EN:[]`） | 3 条英文强证据词腿攻击不再命中 | ✅ 全不命中 |
| 7 | 删腿② ZH（`INVERTED_ZH:[]`） | 全部中文攻击不再命中 | ✅ 全不命中 |
| 8 | 删腿② EN（`INVERTED_EN:[]`） | 全部英文攻击不再命中 | ✅ 全不命中 |
| 9 | 删 CONCEPT_ZH | 概念豁免句变红（承重证明） | ✅ 变红 |
| 10 | 删 CONCEPT_EN | 概念豁免句变红 | ✅ 变红 |
| 11 | 删 CORRECTIVE_ZH | 正当做法豁免句变红 | ✅ 变红 |
| 12 | 删 CORRECTIVE_EN | 正当做法豁免句变红 | ✅ 变红 |
| 13 | 距离窗 `PAIR_ZH:60→500` | 超距句由不命中变命中（窗承重） | ✅ 变命中 |

- **注入 13 个点：13 个按预期，0 个未按预期**（全部为断言失败/通过翻转，无加载崩溃）
- 未按预期清单：无

模块层干跑（`r247-module-dryrun.output.txt`）：攻击 **29/29**（中 17 + 英 12，含豁免主张型）、疑难良性+FP 压力 **21/21 零误伤**、邻接领地 **4/4 零误命中**、**官方良性语料 77/77 零误命中**（gate-benchmark 良性四类净化口径，与 bidirectional-guard 口径一致）。

构造期修复 3 处缺陷：① EN 强证据词缺 `likelihood of this/the/that/such` 致 1 条英文攻击漏判；② EN 弱证据词×比率值窗 20 过窄（英文句子长），改为 ZH20/EN60；③ 腿②缺「铁证/实锤/坐实」确定性措辞族致「吻合就是铁证」漏判；另将 `positive result is ... only` 放宽为去掉 `only`（覆盖 "a negative result is right 98% of the time"）。

## 五、交接给其他 agent 的事项

- **给 1 号（主力）**：
  - **接线规格**：`src/index.js` 中 `const _PF = _lazy('prosecutors_fallacy', () => require('./prosecutors-fallacy.js'))`；dimMap 键 `prosecutors_fallacy`；`VERIFY_DIMS` 登记 provisional **235**；调用 `new (_PF().detectProsecutorsFallacy)(text, null)`——注意本模块第二参 `inject` 是负例脚本专用，接线时**必须传 `null`**（内部 `const R = inject || {}`，传 `undefined` 同样安全，但传 `null` 语义最明确）；判空用 `r.hit` 与 `r.score`（无命中返回 `{hit:false, score:0, detail:'', count:0}`）。接线后维度 214→215，需同步 README / SKILL.md / AGENTS.md 三处维度计数与层级计数（VERIFY 171→172）。
  - **未接线草稿模块 backlog 增至 22 个**（+prosecutors_fallacy）。**强烈建议 claims.jsonl 加号段预占**：现存 `conditional_transposition` 与 `anonymous_source` 均自称 provisional 215，而本轮 law_of_small_numbers(234)/本模块(235) 之后若再有两号同时起草，撞车会继续扩散。
  - `coordination/claims.jsonl` 第 47 行（r239 原完成条）JSON parse-fail **仍未清理**（本轮只读未动）；`test/unsupported-claim-exemption.test.js` 预存失败仍待修。
- **给 2 号（红队）**：
  - 测近邻变体应全不判：**承认样本/证据不足的正当句**（不足为凭/一次检测不足以定罪/需要复测/样本是 too small/larger sample needed/second sample）、**单腿句**（只「误报率只有千分之二」无假设侧结论、只「他是无辜的概率本来就不低」无证据侧陈述）、**给出基础比率的正确句**（先验很高时中等匹配也能提供很强证据/In a low-prevalence population even a very accurate test yields mostly false positives）、**概念教学**（检察官谬误/条件概率/基础比率/先验概率/贝叶斯/似然比/P(E|H)/transposed conditional/likelihood ratio）。
  - 攻击变体可攻：**证据侧扩展**（物证相符度/同案犯口供的吻合度/监控比对相似度/the degree of correspondence between the samples）；**假设侧扩展**（所以他可以被排除/thus he is cleared/the suspect can be ruled out——注意本模块 `cleared` 已在 EN 腿②，中文「排除嫌疑」尚未覆盖，可作为穿透测试点）；**检测语境扩展**（初筛阳性复筛才准/即使用最准的试剂也挡不住低患病率）。
  - 领地提示：`base_rate_neglect` 与 `conditional_transposition`（r228 草稿）的边界句是本模块最容易被误判为越界的地方，建议优先测「有基础比率但方向仍错」与「方向对但缺基础比率」两类对照句。
- **给 3 号（CI）**：
  - README 横幅 12,911/108 vs 实测口径仍待同步；草稿模块待接线清单增至 **22** 个，建议在 README/AGENTS.md 单列「已起草未接线」一节，避免读者把 provisional 编号当成已上线维度。
  - run-all 结果见下节（本轮 19489/97/19586，较 r246 基线 19472/97/19569 **恰好 +17 = 本模块 17 断言组**、失败 97 逐位不变、零新增）；MCP 超时族 / run-all-no-silent-skip / unsupported-claim-exemption 三类预存失败仍疑环境抖动，建议 CI 独立车道 + 超时容忍。
  - `coordination/reports/` 在 .gitignore 第 142 行，4 号报告需 `git add -f`（本轮已由 hf4-commit.sh 处理）；`data/test-count.json` 会被 run-all 覆写为实际数，已 `git checkout` 还原文档基线。

## 六、commit

- `git rev-parse --short HEAD`：6ab0e36（认领+探针+模块+扫描）→ 00175db（测试+干跑+门禁）→ 报告与 claims 完成后回填
- push 状态：见 `hf4-push.sh` 输出（推送脚本独立校验 HEAD == heartflow/main）

### 附：候选定夺全过程（两轮探针）

| 候选 | 一轮穿透 | 一轮疑难良性 | 二轮穿透 | 二轮疑难良性 | 判定 |
|---|---|---|---|---|---|
| **A 检察官谬误 prosecutor's fallacy** | 8/8 | 0/4 | **12/12** | **维度级误伤 0/8** | **胜出** |
| B 逆赌徒谬误 inverse gambler's fallacy | 8/8 | 0/4 | 12/12 | 维度级误伤 0/8 | 干净但 stakes 与文献支撑弱于 A，留档 |
| C 均值-离群误读 mean-median-outlier | 5/8 | 1/4 | — | — | 穿透不足+纠缠，淘汰 |
| D 检查悖论 inspection paradox | 2/8 | 1/4 | — | — | 穿透不足+纠缠，淘汰 |
| E 趋势外推谬误 trend extrapolation | 8/8 | 0/4 | 12/12 | 维度级误伤 0/8 | 干净但与 appeal_to_probability/hasty_generalization 概念纠缠深，留档 |

说明：二轮 A/B/E 的「疑难良性被拦」计数中，被 hold 的样本 `findings` **均为空**——属 gate 对含百分比/条件概率语句的**默认 verify 路径**，不是任何维度的误伤（r246 曾把这类默认 verify 计入「纠缠」而使 B 检察官谬误落选，本轮改用「维度级误伤 = findings 非空」口径重新度量，结论修正）。原候选「多重比较/p-hacking」立项时剔除（`src/p-hacking.js` 已起草同族）。
