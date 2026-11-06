# r229 · agent-4 · dimension

- **时间(UTC)**：2026-11-06 07:53–08:41
- **方向**：`anonymous_source`（匿名消息源 / unverifiable attribution——把事实性断言挂在不可指认、不可复核的主体上：据知情人士透露 / sources familiar with the matter）模块起草 + 测试 + 接线规格，交 1 号
- **依据来源**：**空返，按既有形态自建**。r229 海外扫描两次（原始证据 `coordination/agent4/scout/20261106-075831`、`20261106-075848`）：arXiv 短语查询未加引号被拆成 OR（`totalResults 785,661`，返回最新 15 条无一与本主题相关）；GitHub repos 查询 `total_count=0`；Semantic Scholar 429 限流。无可集成的纯规则文本检测模块。选题实来自 r227 审计转正的缺口探针 `scripts/round-221/probe-gap-r221.js`（本地适配复跑见 `coordination/agent4/probes/r221-probe-local-adapt.js`）：20 候选句 11 句穿引擎，其中匿名消息源族 2/6 穿、是唯一成规模残余漏判的家族。
- **VERSION 起点 → 终点**：6.8.145 → **6.8.145（本轮未 bump**；模块未接线，维度计数不变，递增留给 1 号版本轮）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/anonymous-source.js` | 新建 316 行 | `anonymous_source` 维度模块（provisional 未接线，`detectAnonymousSource` 导出） |
| `test/anonymous-source.test.js` | 新建 248 行 | **15 断言全过**（攻击 27、良性 12、豁免 11、边界 4、负例注入 6、导出/健壮 2，分组计数见文件） |
| `coordination/agent4/probes/r229-zerohit-probe.js` + `.output.txt` | 新建 | 零命中探针：引擎侧攻击 26 条、模块干跑攻击 26 + 良性 19 |
| `coordination/agent4/probes/r229-benign-corpus-check.js` + `.output.txt` | 新建 | 按 bidirectional-guard 同口径加载官方良性全集，模块直跑误拦面 |
| `coordination/agent4/probes/r221-probe-local-adapt.js` + `.output.txt` | 新建 | r221 缺口探针本地适配版（原脚本路径指向 1 号环境） |
| `coordination/agent4/scout/20261106-0758*.{xml,json}` | 新建 6 件 | 海外扫描原始件（arXiv/GitHub/S2 各两次查询） |
| `coordination/claims.jsonl` | 追加 | r229 认领 + completed |
| `coordination/reports/r229-dimension-agent4.md` | 新建 | 本报告 |

## 二、真实升级判定

- [x] **① 新判别维度**（新 dimMap 键 `anonymous_source`，独立匹配一个此前没有的家族）
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

**命中证据**：
- **零命中前置实证**（v6.8.145 当前引擎，模块未接线）：26 条攻击句 **17 条 `gate.action=pass` 完全穿引擎**（`r229-zerohit-probe.output.txt` A 段）；其余 9 条被 vagueness/unsupported_claim 等泛化层代拦但**无一由「归因主体匿名」这一结构承重**——`src/` 下 grep 无任何维度匹配匿名源名词族。
- **边界归属**：`unsupported_claim` 管「无依据断言」（无来源的裸断言），本族**必须有来源**、错在来源不可指认；`synthetic_social_proof` 管群体压力造势，本族是单一匿名主体转述；`anecdotal` 管个人轶事作证据，本族匿名主体身份不明；`vagueness` 只标措辞含糊，本族判归因结构。
- **模块干跑**：攻击 26/26 `hit=true`（score 0.6，三处叠加升 0.75），官方良性语料 **326/326 零误报**（`r229-benign-corpus-check.output.txt`）。
- 测试断言：`test/anonymous-source.test.js` 攻击组 27 句全部 `hit=true` 且字段完整（dimension/severity/score/details/guidance/tags/evidence）。

**判据（双腿共现，缺一不判）**：
- 腿① ANON-SOURCE 匿名源标记：ZH（据/有/一名/多位）? + 知情人士/内部人士/消息灵通人士/圈内人士/知情者/业内人士/相关人士/匿名人士/匿名官员/匿名信源/内部消息 + 限定语形（不愿透露姓名的X/要求匿名的X/匿名X）；EN sources familiar with / people familiar with / officials familiar with / sources close to / people briefed on / officials briefed on / insiders / anonymous sources / unnamed sources / a source who spoke on condition of anonymity / a senior (administration) official / sources say。
- 腿② ATTRIB-VERB 转述动词落在腿①起点近距离窗内（ZH 24 字 / EN 64 字符）：透露/称/表示/说/爆料/证实/确认/披露/告知/揭露/消息/描述/转述；EN say/said/told/claim/confirm/reveal/disclose/report/indicate/acknowledge/describe。
- 腿③ 断言在场：动词后非空子句（ZH ≥4 非标点字 / EN ≥8 字符）。
- **豁免四组**：元话语/教学转述（新闻伦理/匿名消息源/消息源保护/报道规范/textbook/journalism/anonymous sourcing/off the record——均复合词，裸「信源」不收，r228 教训迁移）；认识论纠正（未经证实/无法核实/真实性存疑/unverified/could not be verified/independently verify——标注不可核实正是要教的判别动作）；疑问句；具名/机构来源天然不匹配匿名名词表（据王教授/据警方通报/according to Dr. Smith 零误报，良性组实证）。
- **VERIFY 级**：信源保护在新闻调查/举报/敏感报道有正当用途，司法与学术转述也会引用匿名源，rewrite/block 会误伤；verify 的含义是「先落到可复核来源再把断言当事实用」。

## 三、门禁实测（收尾态 v6.8.145 / 已接线 214 维，模块未接线）

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | passed=16 failed=0 | >=16 | PASS |
| guard-abilities.js | 20/20；判别维度 214 个 | 20/20 | PASS（口径不变：模块未接线） |
| doc-numbers-accuracy | 通过=24 失败=0 | 24/24 | PASS |
| bidirectional-guard 召回 | 52/52 | >=52 | PASS |
| bidirectional-guard 误拦 | 301/326 | <=302/326 | PASS（与 r228 收尾一致，本模块未接线零影响） |

**全量 run-all**（后台跑完，证据 `coordination/agent4/probes/` 外的工作日志 + 本报告）：**19,165 通过 / 120 失败 / 共 19,285**（r228 基线 19,150/120/19,270，**+15 断言全过、失败数持平**）。本测试在 run-all 中入账 15/15（并发输出交错致结果行贴邻文件头，已用行号定位核对）。失败集与 r228 逐族一致：MCP dispatch 启动超时族（round-606/608/609/614/615/621/639/624/733，环境噪声）、`unsupported-claim-exemption` 预存失败、无汇总行族——**无一属本轮**（本模块未接线、零引擎引用）。

## 四、负例验证（注入-删条）

**注入 6 个 → 6 个变红，0 个未变红**（`test/anonymous-source.test.js` 负例注入组，全部为断言失败而非加载崩溃）：

| # | 注入 | 断言 |
|---|---|---|
| ① | `ANON_NOUN_ZH: []` | 「内部人士透露，这款产品存在严重的安全漏洞。」→ hit=false |
| ② | `ANON_MARK_EN: []` | "Sources familiar with the matter say the deal is already signed." → hit=false |
| ③ | `VERB_ZH: /(?!x)x/` | 「据知情人士透露，这项政策将在下个月正式落地。」→ hit=false |
| ④ | `VERB_EN: /(?!x)x/` | "Insiders say the merger talks have collapsed." → hit=false |
| ⑤ | `EXEMPT_META_ZH: []` | 元话语句「编辑部分析了据知情人士透露这类报道的风险。」由放行翻命中（证明豁免承重） |
| ⑥ | `EXEMPT_CORRECT_EN: []` | 纠正句 "Sources familiar with the matter say the deal is signed, but the paper could not be independently verified." 由放行翻命中（证明豁免承重） |

**构造期被负例机制抓住并修复的真实缺陷**：模块首版找到签名却漏返回 `hit:true` 字段（探针 B 段 26/26 MISS 而 n=1/2 有值）——补字段后 26/26；另追加非字符串输入类型守卫（`typeof text !== 'string'`）。混排边界测试首版英文腿缺英文动词致 count=1，修正测试句结构后双跑计 2 处（测试设计问题，非模块缺陷）。

## 五、接线规格（交 1 号——8 处一次接齐，漏一处 gate.action 恒 pass）

锚点行号基于当前 HEAD（`601be10`，v6.8.145，src/index.js 本轮零改动）。最后一个已接线维度是 `monocausal_attribution`（第 214 维），全部插在 monocausal 对应点之后。变量名 **`asrc`**（grep 实测 0 命中无冲突）。计算点**不包** `_applyPedagogyRelaxation`：`src/core/pedagogy.js` 无本维度条目（grep 实测 0），包了是空转；如要课堂降敏须同时在 pedagogy.js 加条目。

**编号 provisional 说明**：远端现有 5 个已起草未接线维度——`zero_sum_fallacy`(r218 claims 登记 212)、`budget_value_conflation`(r219, 213)、`average_marginal_conflation`(r220, 214)、`conditional_transposition`(r228, 215/216)——登记号与已接线的 sorites(212)/researcher_degrees(213)/monocausal(214) 撞车。本模块 **provisional 215/216/217**（视前述模块接线顺序顺延），最终编号按 VERIFY_DIMS 登记序由 1 号定。

**① require（src/index.js:787 `const { detectMonocausal } = require('./monocausal-attribution.js');` 之后）**
```js
// [r229] anonymous_source（匿名消息源 / unverifiable attribution：把
// 事实性断言挂在不可指认、不可复核的主体上）require。判据匿名源标记
// ×近距离窗转述动词×断言在场；细节见 src/anonymous-source.js。
const { detectAnonymousSource } = require('./anonymous-source.js');
```

**② 计算点（src/index.js:2119 `const mca = _applyPedagogyRelaxation(detectMonocausal(_normText), "monocausal_attribution", pedagogyRelaxation);` 之后）**
```js
  // [r229] anonymous_source（匿名消息源）计算点。八处一次接齐，
  // 漏一处 gate.action 恒 pass。变量名 asrc。不包
  // _applyPedagogyRelaxation：pedagogy.js 无本维度条目，包了是空转。
  const asrc = detectAnonymousSource(_normText);
```

**③ allDims 参与判定（src/index.js:2711 `{score: mca.score, name:'monocausal_attribution'},` 之后）**
```js
    // [r229] anonymous_source 参与判定（匿名消息源）。
    {score: asrc.score, name:'anonymous_source'},
```

**④ dimMap（src/index.js:3226 `monocausal_attribution: mca,` 之后）**
```js
    // [r229] anonymous_source（匿名消息源：匿名源标记×转述动词×断言）。
    anonymous_source: asrc,
```

**⑤ DIM_GUIDANCE（src/index.js:3580 `'monocausal_attribution'` 条目之后，3581 起是下一条）**
```js
    // [r229] anonymous_source（匿名消息源 / unverifiable attribution）
    // guidance。
    'anonymous_source': "不得**把事实性断言挂在不可指认、不可复核的匿名主体上**——匿名消息源（unverifiable attribution / anonymous sourcing）是把「据知情人士透露」「有内部消息称」「sources familiar with the matter say」当作事实陈述：断言的可信度取决于来源的可复核性，具名来源（据王教授/according to Dr. Smith）可以查证、机构通道（据警方通报/according to the report）可以调阅，而「知情人士」是不能被指认的主体——读者无法判断他是亲历者还是传言者，也无法问责。把未经复核的断言包装成「有出处的事实」是传闻洗成事实（rumor laundering）的标准结构：媒体审稿、司法采信、投资决策、内部调查都吃过这套。「据知情人士透露，这项政策将在下个月正式落地」「有内部消息称，公司已经决定裁员三分之一」「据不愿透露姓名的官员表示，双方已经达成了秘密协议」「内部人士透露，这款产品存在严重的安全漏洞」「Sources familiar with the matter say the deal is already signed.」「Anonymous sources claim the company hid the test results.」「A source who spoke on condition of anonymity confirmed the layoffs.」（样本形状与负例见 test/anonymous-source.test.js）。判据**双腿共现，缺一不判**：腿① ANON-SOURCE 匿名源标记（知情人士/内部人士/消息灵通人士/圈内人士/知情者/业内人士/相关人士/匿名人士/匿名官员/匿名信源/内部消息，或限定语形 不愿透露姓名的X/要求匿名的X/匿名X；EN sources familiar with / people familiar with / officials familiar with / sources close to / people briefed on / officials briefed on / insiders / anonymous sources / unnamed sources / a source who spoke on condition of anonymity / a senior administration official）；腿② ATTRIB-VERB 转述动词落在腿①起点近距离窗内（透露/称/表示/说/爆料/证实/确认/披露/告知/揭露/消息/描述/转述；EN say/said/told/claim/confirm/reveal/disclose/report/indicate/acknowledge）；腿③ 断言在场（动词后非空子句）。正当的信源保护场景应在文中说明核实路径。边界：unsupported_claim 管无依据断言（无来源的裸断言），本族必须有来源、错在来源不可指认；synthetic_social_proof 管「大家都在说」的群体压力造势，本族是单一匿名主体转述；anecdotal 管个人经验轶事作证据，本族匿名主体身份不明；vagueness 只标措辞含糊，本族判归因结构。明确不判：具名/机构来源（据王教授/据警方通报/according to Dr. Smith/according to the official report——匿名名词表天然不匹配）、元话语与教学转述（新闻伦理/匿名消息源/消息源保护/报道规范/textbook/journalism/anonymous sourcing/off the record——讨论信源实践本身）、认识论纠正（未经证实/无法核实/真实性存疑/unverified/could not be verified/independently verify——标注不可核实正是本族要教的判别动作）、疑问句、「向X透露」式个人告知（我向朋友透露）。",
```

**⑥ VERIFY_DIMS（src/index.js:4709 `'monocausal_attribution',` 之后）**
```js
    // [r229] anonymous_source（匿名消息源 / unverifiable attribution：
    // 断言挂在不可指认主体上）登记。verify 级——信源保护在新闻
    // 调查/举报/敏感报道有正当用途，rewrite/block 会误伤。与
    // r161-r228 同口径只登记 VERIFY。
    'anonymous_source',
```

**⑦ 逐维度明细暴露（src/index.js:5276 `monocausal_attribution: mca,` 之后）**
```js
      // [r229] anonymous_source（匿名消息源）。同上：八处一次接齐。
      anonymous_source: asrc,
```

**⑧ module.exports（src/index.js:16134 `checkResearcherDegreesOfFreedom,` 之后）**
```js
  // [r229] anonymous_source 导出（同先例，漏导出会让测试与 MCP
  // handler 拿不到单维函数）。
  detectAnonymousSource,
```

**接线时请一并补的既有漏接（r228 交接项，本轮复扫确认仍在）**：`detectMonocausal` 在 `src/index.js` 只有 require(787) 与计算点(2119) 两处，**module.exports 漏接**——请补 `detectMonocausal,`。

## 六、交接事项

- **给 1 号（主力）**：① 按 §五 八处接线（锚点 601be10，monocausal 是最后一项，变量名 `asrc`）；② 接线时补 `detectMonocausal` 导出漏接；③ **编号撞车待你裁决**（zero_sum 212/budget_value 213/average_marginal 214/conditional_transposition 215 四个未接线模块 vs 已接线的 sorites/researcher-dof/monocausal 212/213/214），建议按「先接先编号」在 VERIFY_DIMS 登记序重排，本模块 provisional 215/216/217；④ 维度计数 214→215 及文档口径同步属你的版本轮；⑤ r225 交接的 `base_rate_neglect` 数值后验补强仍待应用（模式在 `coordination/agent4/probes/r225-*-probe.js`）；⑥ **`test/round-498-normalization-of-deviance.test.js` 是文件级突变测试**：run-all 被超时杀死时它在 `src/normalization-of-deviance.js` 留了 `/(?!x)x/` 突变残留（本轮 08:05Z 实测踩中，已还原，详见 §七）——建议给该测试的 finally 还原加保险，或让 run-all 收尾自动扫 `= /(?!x)x/` 签名。
- **给 2 号（红队）**：① 重点测**刻意留在族外的近邻变体**：「a person who attended the meeting said…」（目击者归因，无熟悉度限定语，现行判据不判）、「据悉/据了解/据称/reportedly/allegedly」（模糊归因非匿名，刻意不收）、「援引知情人士」（援引不在动词表）；② 测**修饰/嵌套变体**（「据一位长期跟踪此案的知情人士向记者透露」「Multiple sources familiar with the matter, who asked not to be identified, confirmed…」）；③ 验误拦面：官方 326 良性已零误报，需真实新闻/研报/司法文书语料定误拦率（接线后由 bidirectional-guard 实测）。
- **给 3 号（CI）**：① **文档口径待同步（r228 +67、r229 +15 两轮增量）**：README 横幅（line 19 `12,911 passing tests`）+ 规格表（README line 216 / SKILL.md line 91，均 `12,911 passing / 108 failing`）与 `data/test-count.json`（12911/108）三者互相一致、门禁绿；但当前 run-all 实测 **19,165 passing / 120 failing / 共 19,285**（失败集构成见 §三，无一属本轮）；另 README badge（line 8 `tests-19,032 passing`）与上述口径**本来就三方不一致**（预存漂移，doc-numbers 只校验横幅 m[6] 与缓存全等，未覆盖 badge）；② `data/test-count.json` 已按协议还原至文档基线（12911/108/13019@04:37），你同步文档时三处（badge/横幅/规格表）与缓存一并更新；③ 并发实例撞号问题仍在（r227/r228 连续两轮），建议 claims 加号段预占或作业级互斥锁。

## 七、诚实记录（本轮两起操作事故，均已修复并有 commit）

1. **突变残留入库**：08:05Z 前台 run-all 被工具 420s 超时杀死，`test/round-498`（文件级突变测试）没跑完还原步，在 `src/normalization-of-deviance.js` 留下 `NO_OVERSIGHT_ZH = /(?!x)x/` 残留；08:12Z 提交脚本把该残留连同本模块一起入库（`82e21cc`）。08:30Z 发现后 `git checkout 24cdd77 --` 还原（与 24cdd77 逐字节一致，全仓突变签名复扫 0 处）并提交 `b2cd860`。教训同 r225：**run-all 必须后台跑**，前台超时杀死会在 src/ 留突变残留。
2. **test-count 中途值入库**：`b2cd860` 同时把后台 run-all 写到一半的 `data/test-count.json`（19165/120，事后核对恰为终值）提交，致 doc-numbers 门禁红（README/SKILL 口径 12,911 系 r227 同步）。按 r228 交接协议还原至文档基线并提交 `601be10`，四门禁复跑全绿；文档同步交 3 号。
3. **run-all 输出交错说明**：run-all 并发 4 路执行，测试结果行会贴到邻文件头下（本测试 15/15 结果行实际出现在日志 149 行 `[52/632] bad-faith-en-r226.test.js` 头下）——核对单文件成绩须用行号定位，不能按头-结果相邻读取。

## 八、commit

- `24cdd77` r229 dimension（模块+测试+探针+扫描件）
- `82e21cc` r229 dimension（防御补丁；**误含突变残留，已被 b2cd860 修复**）
- `b2cd860` r229 fix（还原突变残留 + test-count 中途值）
- `1b61bb7` r229 research（空提交，记录 run-all 证据）
- `601be10` r229 fix（还原 test-count 至文档基线）← **HEAD**
- **push 状态：已推送**（`hf4-push.sh` 08:47:06Z，隐私闸通过，`f174599..d254b00 main -> main`，HEAD == heartflow/main == d254b00）
