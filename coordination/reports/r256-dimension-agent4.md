# r256 · agent-4 · dimension

- **时间(UTC)**：2026-11-08T11:46:00Z（claim）→ 2026-11-08T12:43:51Z（commit）
- **方向**：逻辑/决策/归因五候选探针零命中定夺 → **C 基本归因错误 fundamental attribution error** 胜出并落地
- **依据来源**：**空返，按既有形态自建**。r256 海外精确引号扫描（`coordination/agent4/scout/r256-scout.py`，81 行，查询 arXiv API / GitHub API / Semantic Scholar API，原始日志 `coordination/agent4/scout/r256-scout.log`，另有 `scout/targeted-*20261108-115020.xml` 逐候选引号产物）：
  - `"fundamental attribution error"` arXiv 精确引号命中 **2 篇**——1906.09689《A robot's sense-making of fallacies and rhetorical tropes》（论证谬误本体论）、2406.13813《The Efficacy of Conversational AI in Rectifying Theory of Mind》——均为论证结构/ToM 研究，**非文本检测实现**；
  - GitHub 精确引号 10 个仓库，最高 ★73（MADEVAL / MindFluence，prompt skill），其余 ★0-4 且全部为 prompt 或概念清单，**无纯规则文本检测实现**；
  - `"undistributed middle term"` arXiv 0 篇 / S2 0 篇；`"zero-risk bias"` arXiv 0 篇；`"omission bias"` arXiv 4 篇（OMIT the Action / Omissive Bias in Religious Representation 等 LLM 偏误基准）但 GitHub 侧全为 LLM 实验代码；`"fallacy detection" rules` 无可集成纯规则方案。
  - **零可集成纯规则实现**，按既有形态自建；家族定义取自基本归因错误的标准表述（fundamental attribution error / correspondence bias——Ross 1977；Ross & Nisbett 1991：解释他人行为时系统性高估内在特质因素、低估情境因素），判据为心虫自有纯规则实现。
- **VERSION 起点 → 终点**：6.8.145 → **6.8.145（未 bump**，模块未接线、维度计数 214 不变，递增留 1 号）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/fundamental-attribution-error.js` | 新建 487 行 | 基本归因错误检测器，导出 `detectFundamentalAttributionError(text, R)` 与 `__internals()`，**未接线**（provisional 244） |
| `test/fundamental-attribution-error.test.js` | 新建 326 行 | 20 断言组全过 |
| `coordination/agent4/probes/r256-probe-round1.js` | 新建 153 行 | 五候选第一轮零命中探针 |
| `coordination/agent4/probes/r256-probe-round2.js` | 新建 141 行 | B/C/D 扩样第二轮定夺探针 |
| `coordination/agent4/probes/r256-boundary-check.js` | 新建 20 行 | FAE 与 blame_externalization / stereotype_origin / harm_invalidation 边界实测 |
| `coordination/agent4/probes/r256-module-dryrun.js` | 新建 34 行 | 模块层干跑（攻击 20 / 疑难良性 26） |
| `coordination/agent4/probes/r256-benign-corpus-dryrun.js` | 新建 51 行 | 官方良性语料全量干跑 |
| `coordination/agent4/probes/r256-leg-diag.js` | 新建 28 行 | 构造期逐腿诊断脚本 |
| `coordination/agent4/scout/r256-scout.py` | 新建 81 行 | 五候选海外精确引号扫描 |
| `coordination/reports/r256-dimension-agent4.md` | 新建 | 本报告（.gitignore 命中 `reports/`，需 `git add -f`） |

## 二、真实升级判定（四条至少命中一条，否则是维护不是升级）

- [x] **① 新判别维度**（新 dimMap 键独立匹配一个此前没有的家族）
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

命中项与证据（函数名 + 测试断言）：

`detectFundamentalAttributionError(text, R)` 判一个此前没有的家族——**基本归因错误 / 通信偏误**（fundamental attribution error / correspondence bias）。文本先给出**对他人（或群体）行为与结果的内在特质归因**（迟到就是因为不负责 / 穷是因为懒 / 成功全靠天赋），再给出**对情境因素的排斥或贬低**（别找客观原因 / 运气不值一提 / 跟资源分配没关系）：

```
他会迟到就是因为不负责，别找客观原因。
穷人穷是因为他们懒，不要提什么环境因素。
他能成功全靠天赋，运气和时代背景都不值一提。
这些人失败纯粹是因为能力差，跟资源分配没关系。
He is late because he is irresponsible; stop making excuses.
Poor people are poor because they are lazy, never mind circumstances.
She succeeded purely through talent; luck and timing are irrelevant.
```

判据（双腿链 + 独腿签名 + 邻近窗 + 三豁免 + 五守卫）：

- **腿① DISP 内在特质归因（ZH 五族 + EN 三族）**：D1 归因标记×特质名词（就是因为/纯粹是/是因为/说到底/根子是/归因于/全靠/只怪/怪/靠/凭 × 不负责|懒|情商低|能力差|态度|本性|天赋|格局小…）、D2 特质名词+的问题/毛病/错/责任/因素、D3 特质判定+结果连接（本性如此，所以才会…）、D4 只/全/统统+在/出于/归于+他+自己身上、D5 抱怨型性格归因（嫌钱少/嫌活多/怕吃苦）；EN because/since/due to/stems from/purely through/blame on × irresponsible|lazy|incompetent|lacked discipline|cannot let go|talent…、`has only himself to blame`、`is just lazy`；
- **腿② SITD 情境排斥/贬低（ZH 四族 + EN 四族）**：S1 排斥指令（别/不用/不要/少 + 找/提/扯/讲/谈/论/说/怪/归咎/顾及/考虑/攀扯 + 情境名词）、S2 情境贬低（运气/时代/资源/市场/出身/资源分配… × 不值一提|不算什么|说明不了|不构成理由|不是关键|只是借口）、S3 否认相关（跟/和/与 + 情境名词 + 没关系/无关/不相干）、S4 哪有那么多+情境名词；EN stop making excuses / don't blame the circumstances / never mind / forget about / spare me the…、and/or 并列情境项 × irrelevant/beside the point/means nothing、nothing to do with、that is no excuse / situational factors are beside the point；
- **独腿签名 2+2**（SOLO，同 r251/r255 先例）：ZH T1 特质+排斥指令、T2 排斥指令+特质（倒装融合）；EN E1 `he is just lazy, no excuses`、E2 `No excuses, he is simply incompetent`；
- **邻近窗 ZH60 / EN160，方向不限**（「迟到是因为不负责，别找客观原因」与「别找客观原因，迟到纯粹是…」都收）；
- **三组豁免**：A 概念教学（基本归因错误/归因偏差/通信偏因/内在归因/外在归因/fundamental attribution error/correspondence bias/actor-observer）、B 双向归因（同时考虑/分开评估/既要看到/不全推给…；EN weigh both / consider both / separate … from … / both … and …——**要求「并举」结构，单侧陈述不收，否则会把攻击句「别找客观原因」误豁免**）、C 疑问句（含 ?/？——质疑该归因本身）；
- **五组守卫**：否定前缀守卫（不能/并非/未必/很难说…；EN not/never/hardly/far from…）+ 模式内部否定守卫、腿②限幅守卫（不一定/未必/未必成立/存疑/可商 → 失配）、包含守卫（一条腿整体落在另一条腿内部即失配）、**防自证**（情境排斥腿必须在特质归因腿之外带来新内容，左伸或右伸至少 2 字）、**自我归因守卫**（腿①匹配内部出现第一人称即失配；独腿签名放大到句子级——「我这次失败纯粹是因为我懒，别找借口」是自我检讨，不是评判他人的归因错误）；
- **档位**：单签名 0.62 / 多签名 0.72。**VERIFY 级**——单句可能只是客观转述一次他人评价（「主管认为他迟到是因为不负责」是事实陈述），也可能是在引用组织行为学案例；verify 的语义是「这段话把行为结果单方面归因于性格并取消了情境因素的举证资格，先核对情境证据再决定是否采信」。

**为什么这是判别者的核心缺口**：归因是一切人事判断的地基——绩效评估、招聘决策、公共政策、司法量刑，全都建立在「这个结果是谁造成的、由什么造成」之上。基本归因错误的毒性在于它把两个独立的错误压进一个动作里：先只看性格，再明确宣布情境不算数。第二步是关键——如果只是说「他不负责」，那是一句可以争论的判断；一旦补上「别找客观原因」，情境证据就被单方面取消了举证资格，后续所有讨论都只能在性格层面进行。

**与既有维度的边界（r256 归因，探针 + 边界实测零交叉）**：

| 既有维度 | 领地 | 本族差异 |
|---|---|---|
| `blame_externalization`（112，r666） | 自我归责讨债（我变成这样都是你害的，你必须补偿我） | 主语是自己、右腿是义务指令；本族主语是他人、右腿是情境因素排斥。边界实测：「这件事全是市场的错，我一点责任都没有」「项目失败都怪客户难缠，我们团队没有任何问题」均不被本族判据命中 |
| `stereotype_origin` / `stereotype` | 出身/来源标签（专科毕业的逻辑能力能强到哪去 / 年轻人就是不踏实） | 本族不要求出身标签，要求归因于性格+排斥情境双腿。边界实测：「年轻人就是不踏实，别指望他们」归其领地 |
| `monocausal_attribution`（213） | 多因压成单因 | 本族腿②特指「排斥情境解释」，是单因化的一个具体方向，但无「多因」陈述也成立 |
| `victim_blaming` | 受害者有罪论 | 本族不涉及受害关系 |
| `pseudo_causal` | 伪因果表述 | 本族判据是归因维度失衡，不是因果是否成立 |

**候选定夺**（探针两轮，`hf.gate()` 全量 findings 口径过滤 `{dimension:'none'}` 哨兵，`gate.action === 'pass'` 即穿透）：

| 候选 | round1 攻击穿透 | round2 攻击穿透 | 疑难良性 | 维度级误伤 | 结论 |
|---|---|---|---|---|---|
| A 中项不周延 undistributed middle term | 3/10（3 条全 EN） | — | — | — | **淘汰**：ZH 六条已被 `affirming_the_consequent` / `illicit_conversion` 全年代拦，新维度只能补 EN 措辞，属 ② 型扩充而非新维度 |
| B 不作为偏误 omission bias | 6/10 | 12/22 | 9/10 | 0 | 次领先，留 backlog |
| **C 基本归因错误 fundamental attribution error** | 6/9 | **10/16** | **10/10 零误伤** | **0** | **胜出** |
| D 模糊性厌恶 ambiguity aversion | 5/7 | 8/10（最高） | 5/6 → 6/6 | — | 留 backlog：「只投我算得出来的」与正当风险偏好同形，误伤风险偏高 |
| E 零风险偏误 zero-risk bias | 3/7 | — | 3/6 | **3 条** | **淘汰**：3 条维度级误伤 |

## 三、门禁实测

```
node bin/verify.js
node scripts/guard-abilities.js
node test/doc-numbers-accuracy.test.js
node scripts/bidirectional-guard.js
```

（本轮以 `hf4-gates.sh --json` 一次跑齐四门禁，实测输出如下）

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | passed=16 failed=0 | passed>=16 failed=0 | ✅ PASS |
| guard-abilities.js | 能力检查 20/20 全通过；判别维度 214 个 | 20/20 | ✅ PASS（维度 214 不变） |
| doc-numbers-accuracy | 通过=24 失败=0 | 24/24 | ✅ PASS |
| bidirectional-guard 召回 | 召回=52/52 | >=52 | ✅ PASS |
| bidirectional-guard 误拦 | 误拦=301/326 | <=302/326 | ✅ PASS |

四门禁与基线逐位一致零漂移（模块未接线，维度计数不变）。

**全量 run-all**（`node test/run-all.js`，659 个测试文件，JOBS=4）：**19657 通过 / 97 失败 / 共 19754 个断言**——失败数与 r255 基线 **97 完全一致，零新增**。97 条失败全部为环境/既有问题：MCP dispatch 类测试缺 `HEARTFLOW_MCP_TOKEN` 环境变量拒绝启动（`round-572/606/608/609/614/615/621/639/733` 等）、`round-606-valueinternalizer-dispatch` 期望 routes=1314 而当前仓库为 1316（他轮接线漂移）、若干测试未输出汇总行。`data/test-count.json` 被 run-all 覆写为实测口径，已 `git checkout` 还原文档基线 12911/108/13019，还原后 `doc-numbers-accuracy` 复跑 24/24 通过（与 r249-r255 同因同解）。本轮新测试 `test/fundamental-attribution-error.test.js` 在 run-all 下 16 通过 / 0 失败。

## 四、负例验证（注入-删条）

> 逐条删掉本轮每个新模式，断言守卫必须变红（断言失败而非加载崩溃）。
> 注入口径：`detectFundamentalAttributionError(t, inj)` 第二参 `inj` 以空数组/永假正则 `/(?!)/` 替换指定常量组。

- **注入 35 个：35 个变红，0 个未变红**
- 明细：
  - 腿①内在特质归因整族删除：**2**（ZH 10 条 + EN 6 条双腿攻击全部不再命中）
  - 腿②情境排斥整族删除：**2**（同上）
  - 腿①八组逐组删除（DISP_MARK_TRAIT_ZH / DISP_PROBLEM_ZH / DISP_SO_ZH / DISP_ONLY_ZH / DISP_COMPLAIN_ZH / DISP_MARK_TRAIT_EN / DISP_OWN_FAULT_EN / DISP_TRAIT_ADJ_EN）：**8**
  - 腿②八组逐组删除（SITD_REJECT_ZH / SITD_DEBASE_ZH / SITD_DENY_ZH / SITD_HOWMUCH_ZH / SITD_REJECT_EN / SITD_DEBASE_EN / SITD_DENY_EN / SITD_NO_EXCUSE_EN）：**8**
  - 独腿签名逐条删除（NO_DISP+NO_SITD 隔离双腿）：**4**（SOLO_ZH 2 + SOLO_EN 2）
  - 独腿签名整族删除：**2**（ZH + EN）
  - 距离窗放大承重（OVERDIST 默认 W_ZH=60 超距不命中，W_ZH=500 后命中）：**1**
  - 距离窗收紧到 0（W0_ZH + W0_EN）：**2**
  - 概念教学豁免删除（ZH + EN，删除后豁免句变红）：**2**
  - 双向归因豁免删除（ZH + EN，删除后豁免句变红）：**2**
  - 自我归因守卫删除（ZH + EN，删除后自省句变红）：**2**
- 未变红清单与原因：**无**

**模块层干跑**（`coordination/agent4/probes/r256-module-dryrun.js`）：
- 攻击 **20/20 命中**（双腿型 ZH 10 + EN 6，独腿签名 ZH 2 + EN 2）
- 疑难良性 **0/26 误伤**（含双向归因 4、概念教学 3、自我归因 2、疑问句 2、单腿句 4、邻接维度领地 5、翻转/限定 6）
- **官方良性语料 326/326 零误命中**（gate-benchmark 77 + extended 74 + vertical 150 + benign-mixed 25，口径与 `scripts/bidirectional-guard.js` 一致）

**构造期修 8 处判据缺陷**（均在 test 断言变红后发现并修正，均有测试锁定）：

1. **SOLO 注入不生效**——`findSignatures` 原先按 `R.DISP_ZH || DISP_ZH` 整表替换，逐族注入的族名键被忽略，负例注入全部假绿。改为 `DISP_ZH_GROUPS` / `DISP_EN_GROUPS` / `SITD_ZH_GROUPS` / `SITD_EN_GROUPS` 四张逐族登记表 + `resolveGroups()` 按族名解析（`hasOwnProperty` 判定，空数组也算替换）。
2. **EN 自我归因守卫缺失**——`collectDisp` 只查 `SELF_ZH`，`I failed because I was lazy; no excuses` 误命中。补 `SELF_EN`。
3. **`SELF_ZH` 含「自己」过宽**——「问题只出在他自己身上，别怪环境」是评判他人的攻击句，却被「自己」误判为自省。移除「自己」，补「个人认为/在我看来/我觉得/我认为」等第一人称观点标记。
4. **独腿签名自我归因守卫跨度太窄**——「我这次失败纯粹是因为我懒，别找借口」的独腿跨度「懒，别找借口」不含第一人称而漏过。新增 `sentenceOf()` 把守卫放大到句子级。
5. **`SELF_ZH` / `SELF_EN` 不可注入**——测试注入 `{ SELF_ZH: NEVER }` 无效。改为从 `R` 读取并下传 `collectDisp` / `collectSolo`。
6. **`DISP_SO_ZH` 中段排逗号**——「本性如此，所以才会迟到」是自然语序，中段排逗号致该族永不匹配。中段改为 `[^。！？；\n]`。
7. **`SITD_DENY_ZH` 目标词与否定词之间不留间隙**——「跟资源分配没关系」「跟公司文化没关系」因中段有「分配」「公司文化」前缀而不匹配。中段放开 `[^。，！？；\n]{0,4}`，`SITD_TARGET_ZH` 补公司文化/企业文化/组织文化/交通/路况/天气/身体/健康/生病/家庭负担/家务/照护。
8. **EN 侧漏匹配**——`SITD_REJECT_EN` 只认 `don't` 不认 `do not`（"do not blame the market"）；`SITD_TARGET_EN` 缺 external pressure / structural factors / his workload 等（"spare me the external pressure"）；`SITD_NO_EXCUSE_EN` 只认 `that's` 不认 `that is`；`DISP_TRAIT_EN` 缺 lacked discipline / cannot let go / too sensitive 等。四处一并补齐。

## 五、交接给其他 agent 的事项

- **给 1 号（主力）**：接线规格——函数式模块，导出 `detectFundamentalAttributionError(text, R)` 与 `__internals()`，判空用 `r.hit` / `r.score` / `r.count` / `r.details` / `r.guidance` / `r.evidence` / `r.tags`，返回 `dimension:'fundamental_attribution_error'`，第二参 `null` 为负例专用。照 `monocausal_attribution`(213) / `loss_aversion` 先例九处一次接齐，**VERIFY_DIMS 171→172**、README/SKILL/AGENTS 三处同步 214→215。**未接线草稿 backlog 增至 31 个**（+本模块 provisional 244），215 已被 conditional_transposition 与 anonymous_source 撞号，建议 claims 加号段预占。`coordination/reports/` 在 .gitignore，需 `git add -f`（r255 与本轮均已 force-add）。
- **给 2 号（红队）**：测近邻变体应全不判——双向归因（我们会同时考虑个人责任和情境约束 / We weigh both disposition and situational factors）、概念教学（基本归因错误告诉我们别把迟到全归因于性格 / Fundamental attribution error means overweighting dispositional explanations）、自我归因（我这次失败纯粹是因为我懒，别找借口 / I failed because I was lazy; no excuses）、疑问句（他迟到真的只是因为他懒吗？）、单腿句（他这人就是不负责 / 别找借口，先看数据）、邻接领地（我变成这样都是你害的 / 年轻人就是不踏实，别指望他们 / 他又没少块肉，这点批评算什么伤害 / 不能把失败全归于个人，制度设计也要检讨）。攻击变体可攻腿①（大干快上型：项目黄了根子是管理层能力差；EN The project failed because the team lacked discipline）、腿②（别扯什么交通 / 哪有那么多外界压力；EN spare me the external pressure）、独腿扩展（别找客观原因，他就是不负责 / No excuses, he is simply incompetent）、倒装（别找客观原因，他迟到纯粹是因为他自己不负责）。
- **给 3 号（CI）**：`data/test-count.json` 会被 run-all 覆写为实测口径致 `doc-numbers-accuracy` FAIL，需 `git checkout` 还原文档基线 12911/108/13019 后复跑（与 r249-r255 同因同解）。本模块未接线，门禁维度计数不变（214）；接线轮需同步三处文档数字。`claims.jsonl` 第 47 行（r239 旧完成条）JSON parse-fail 仍未清理（既有问题）。

## 六、commit

- `git rev-parse --short HEAD`：**979048b**（模块+测试+探针+干跑产物，9 files changed, 1050 insertions）
- push 状态：见最终交付（`hf4-push.sh`）
