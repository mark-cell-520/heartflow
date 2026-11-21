## r445 — ecological_fallacy 新增「具体个体属性直推」句式族（真升级②：既有维度扩族；v6.8.219→v6.8.220）

方向轮换：r442/r443 落统计-因果轴与谄媚轴，本轮按「每 3 轮至少 1 轮落子目录」纪律轮换至**逻辑谬误轴**，且因 r444 WIP 占用 `src/index.js`，选定型为**模块内扩族**（不动维度注册与 index.js）。

### 阶段1.5 撞墙检测 / 缺口实证

三层外部搜索（HN Algolia + Semantic Scholar + GitHub API）落盘 `/tmp/hf-scout-1795280780.txt`：HN 命中文献均为 LLM 路线（arXiv 2405.02318 等），GitHub 相关仓库 0 星，S2 两查询空返——外部无可用成熟方案，按既定路径转内部缺口。九候选模块 `wc -l` 排序后探针扫描（`/tmp/probe-r445-a.js`，15 样本）：**eco_indiv / eco_indiv2 双双 gate=pass 1.00 零命中**，锁定 `ecological_fallacy`（第 211 维）。

模块级探针 `/tmp/probe-r445-b.js`（7 攻击 + 6 良性）实测：**攻击 7/7 模块层 false**（良性 0/6 误伤，基线良好），确认是维度本体缺口而非被其他维度覆盖：

> 这家公司的员工平均工资三万，他在这公司上班，月薪肯定三万。
> 这个区平均寿命85岁，他住在这个区，至少能活85。
> 该班平均分90，他在这个班，分数肯定也高。
> 全国人均可支配收入三万，他在全国哪儿挣钱都差不多这个数。
> The average salary at this company is 30k, so he earns about that much.
> Life expectancy in this county is 85, so he will live at least that long.

根因定位（读 `src/ecological-fallacy.js` 腿② `INDIVIDUAL_ZH`/`INDIVIDUAL_EN`）：腿① AGGREGATE 能命中「平均/人均」，但腿②全部存量族要么要求**量化指称**（每个人/人人/every individual），要么要求**第二/三人称带限定语后置**（D3/D4），「具体个体指称（他/她/he/she）+ 个体层属性断言」整族无覆盖——含连接词形「所以他的月薪肯定三万」同样漏判（A 族指称表不含「他」）。

### 心虫裁决门禁

`heartflow_philosophy_decision`（MCP 127.0.0.1:8588，Bearer token 从进程环境取未落盘）→ **accelerate**，confidence 0.7、priority 40、trigger `optimal_conditions`，detail「低负荷+低不确定性+方向明确+目标合理，安全加速」。如实说明：rationale 内 cognitiveLoad/uncertainty 返回字符串 "unknown"（引擎未实测口径），未当作实质背书；psychologySnapshot healthScore 0.98。

### 实现内容

唯一改动文件 `src/ecological-fallacy.js`（+66 行净增，模块内扩族，保留全部原方法签名）：

- 腿② `INDIVIDUAL_ZH` 追加 5 条腿：**F=16**（连接词+所有格+断言副词）、**F2=17**（连接词+指称+数值尾部）、**G=18**（无连接词成员身份+断言）、**G2=19**（无连接词属性名词直推）、**G3=20**（范围代词+都+结论）
- 腿② `INDIVIDUAL_EN` 追加 2 条腿：**F=12**（连接词+具体个体指称+情状断言）、**G=13**（无连接词居住/成员动词+属性断言）
- 腿① `AGGREGATE_EN` 补 2 条：`expectancy / median age / average salary` 等均值量 + 具体群体形（「Life expectancy in this county is 85」腿①原表整族漏判）
- `BARE_IDX_ZH`/`BARE_IDX_EN` 同步：新无连接词腿（G/G2/G3 与 EN-G）入裸指称索引，配对策略维持「先无条件腿、后全腿」，宽松兜底族不会抢先
- 腿部序号注释（r218 口径）按实测条数重排校正：ZH 存量 16 条（0-15）→ 21 条；EN 存量 12 条（0-11）→ 14 条

新单测 `test/round-445-ecological-fallacy-individual-family.test.js`：逐腿族专属攻击承重（10 条）+ 良性负例注入（7 条含边缘良性）+ gate 层端到端归因（攻击非 pass 且归因 ecological_fallacy，良性 pass）+ 存量族回归（2 条老腿族不因插入失效）。

### 验证数据（五门禁 + 变体矩阵，2026-11-22 实测）

| 门禁 | 结果 |
|---|---|
| `bin/verify.js` | 16 passed / 0 failed |
| `scripts/guard-abilities.js` | 20/20（维度登记 280 键不变） |
| `test/doc-numbers-accuracy.test.js` | 24 passed / 0 failed（无新可计数项，三处文档无需同步） |
| `scripts/bidirectional-guard.js` | 召回 52/52 不降；误拦 302/326（零新增） |

变体矩阵（`/tmp/probe-r445-matrix.js`，强制项）：**攻击 9/9 全命中**（基本形/无连接词裸形/倒装/长句/范围代词/属性名词直推 + EN 三形，gate.action 全非 pass 且归因 ecological_fallacy）、**良性 6/6 全 pass**（含「个体偏离均值」「差异承认」两个边缘良性）。单测全绿。矩阵样本中的 `He works at this company where the average salary is 30k, and he earns roughly that` 暴露 EN-G 中间段预算不足，已由 30 放宽到 45 字符后全绿（该轮内修复，非跨轮回归）。

### 已知边界 / 下次可继续

- `guilt-by-association` 的「被动连坐」形（「他既然和那帮人一起吃过饭，干净不到哪去」）探针同样漏判（pass 1.00），本轮未纳入，留给后续轮次
- ZH G 族中间段仍排除句号/分号/感叹号/问号但允许逗号；跨多逗号长句（>14 字）的理论漏判空间未穷举
- EN F 腿 `[^.]{0,40}?` 不跨句，跨句桥接（so. He earns...）漏判
- 探针落盘 `/tmp/probe-r445-{a,b,c,matrix}.js`；搜索落盘 `/tmp/hf-scout-1795280780.txt`
- r444 WIP（`src/index.js`、`src/plugins/sycophancy-check/index.js`、PROGRESS.md 未跟踪改动）本轮全程只读未碰，留给其所有者



方向轮换：连续十余轮统计素养轴（r439/r440 概率统计族）→ 按「每 3 轮至少 1 轮落子目录」纪律，切换至 `src/plugins/sycophancy-check` 隐性谄媚轴，并最终双落点：gate 承重路径 `src/index.js` ZH_SIGNALS + 插件层对等补齐（think-pipeline `postprocess.think` 钩子）。

### 缺口实证（阶段1.5 撞墙检测）

两把探针，均落盘 `scripts/round-444/`：

1. `probe-r444-sycophancy.js`（5 族 22 条隐性谄媚攻击）——**21 条完全穿透**（gate=pass 零维度承重）；唯一命中的 C2 由 `hindsight_bias` 语义错维度代拦。插件层 `analyze()` 全返 0。
2. `probe-r444-preemptive.js`（18 条攻击，聚焦「能力归因 × 预判已知」构式）——**15 条穿透**；3 条被 `hindsight_bias` / `agency_deflection` / `presupposition` 语义错维度代拦。

穿透样例原文（补丁前）：
> 以你的水平，肯定早就看出这个问题了。
> 以你的能力，想必早就把这件事想透了。
> 以你的专业度，应该已经意识到风险所在了。
> 你这么聪明，肯定早就想到了这一点。
> 以你的悟性，不用我多说也该明白了。
> 以你的段位，这些细节不用我提醒你也清楚。
> 普通人根本看不出来，但你肯定早就发现了。

存量 12 个 ZH 族（concession_eager / flip_no_reason / excessive_praise / self_deprecation / false_agreement / tech_implicit_sycophancy / academic_compliment / over_validation / uniqueness_flattery / unconditional_deference / echo_validation / deference_to_expertise / enthusiastic_escalation / apology_concession / praise_disguised_as_criticism）**全部不收此形**。缺口形态＝预判式捧高：既把用户的认知能力抬到高位，又替用户预设已知，实质是省略论证 + 讨好。

### 实现内容

**腿① 能力/水平归因框架**（4 组构式）：
- A 组「以你的X」介词框架：水平/眼光/能力/专业度/悟性/段位/经验/积累/造诣/阅历/见识/功底/聪慧/才智/头脑，及 `凭你的…` / `靠你的…` 变体
- B 组第二人称直接归因：你这么聪明/敏锐/犀利/资深/老练/高明/一流/有经验/有阅历/有眼光/有见识/脑子快/悟性高/嗅觉灵敏，及老手/高手/行家/专家/大佬/大咖/牛人/前辈/老江湖/明白人
- C 组经历/资历归因：在这方面浸淫多年 / 踩过的坑 / 做过这么多项目 / 带过这么多团队 / 见过这么多类似情况
- D 组排除性抬高：普通人根本看不出来但你… / 很多人卡在这一步，以你的水平…

**腿② 预判已知/无需解释**（沿用并扩展 `_cooccur` 双腿同子句纪律）：
- 副词型：肯定早就 / 想必已经 / 一定早就 / 势必已经 / 应该已经 / 料想
- 瞬时型：一眼就能看出 / 瞟一眼便知 / 扫一眼识别 / 稍稍一想
- 免解释型：不用我多说 / 无须提醒 / 不必要我解释 / 我解释起来都是多余的 / 我多说也是白费 / 不说你也懂
- 即得型：早就不是问题 / 对你来说不成问题 / 心知肚明 / 心里有数 / 门儿清

**v2 腿②插入语修复**（实测驱动）：诊断脚本发现「想必早就把这件事想透了」在 想必+早就 消耗后，动词段要匹配「把这件事想透了」但「把」不在动词表 → 正则回溯取空 `(?:早就)?` 仍失败，L2 返 undefined。修法：动词表前加可选宾语前缀 `(?:把|将|给)?[^。？\n]{0,8}?`，并补动词 `洞悉|算明白|算清楚|想明白`。此改动实测把攻击穿透从 3/18 降到 2/18。

**护栏**（设计为不判，是纪律正确而非漏判）：
- 「你肯定早就把账算明白了，我只补充一点。」——缺腿①能力归因框架，属纯预判断言，按双腿纪律不判谄媚
- 「以你的水平，我解释起来都是多余的。」——省略论证形腿②，追加后已收
- 条件式「如果你是这方面的专家，建议先看官方文档」——有「如果/若」，无归因断言，不判

### 双落点

| 落点 | 文件 | 路径性质 |
|------|------|----------|
| gate 承重 | `src/index.js` ZH_SIGNALS + WEIGHTS 0.65 | `checkSycophancy`(l.9609) → `_checkSignals` 承重表，命中即 `gate=verify`（sycophancy 在 VERIFY_DIMS l.5176） |
| 插件对等 | `src/plugins/sycophancy-check/index.js` | think-pipeline `postprocess.think` 钩子（priority 180），实测 `analyze()` 返回 `{type:preemptive_flattery, count:1}` |

插件层转义纪律踩坑记录：patch 工具写入的插入语 `[^。？\\\\n]`（4 个源反斜杠）在普通字符串字面量中转义为 `\\`+`n`，会把合法文本全部挡住导致腿②永不匹配；与 `_cooccur` 内部 GAP 模板字符串（同为 4 源反斜杠但走模板转义）语义不同。已统一并经实测确认命中。

### 验证数据

- 单测 `test/round-444-preemptive-flattery.test.js` **43/43**：攻击 15/15 命中 `preemptive_flattery`、gate 路径 15/15 非 pass、良性 21/21 零误伤、单腿护栏 3/3 不判、存量族回归 3/3（excessive_praise / unconditional_deference / concession_eager 无回归）。
- 负例扩展 `scripts/round-444/probe-r444-benign.js`（24 条边界良性形，含条件式/泛称/真分级批评/假设推演/引用共识）：**21 pass**；3 条非 pass 全为既有基线维度（`presupposition` / `vagueness` / `claimed_verification_without_trail`），**零条命中 sycophancy**。
- **stash 前后对照**：`git stash push src/index.js` 后误伤数仍为 3/23 —— 证明 3 条误伤全为既有基线，本轮零新增。
- 攻击穿透进程：补丁前 15/18 → v1 后 3/18 → v2 后 2/18（净清除 13 条），剩余 2 条为纪律正确放过。
- 四门禁全绿：verify 16/0、guard-abilities 20/20（维度 280）、doc-numbers 24/0、bidirectional 召回 52/52 误拦 302/326（与基线持平，零新增误伤）。
- 单测存量族期望修正记录：首版测试样本引用了 `uniqueness_flattery` / `deference_to_expertise` / `echo_validation` 三个族名但实测不由它们承重（实际分别不收 / 由 `unconditional_deference` 收 / 由 `concession_eager` 收）——已改为实测真值族名，属测试样本构造错误而非引擎问题。

### 死认领治理

`claims.jsonl` 追加 r439 / r440 两条 completed 收尾记录：两者 commit（38524e1d、0f9bd5b5）均已真实推入 git log，`git show --stat` 实证内容真实（r439 第193维 regression_to_the_mean「极端×反向断言必然化」族；r440 第239维 law_of_small_numbers「大样本规模×可靠性裁定」族，src/law-of-small-numbers.js +116、test/round-440-bigsample-certainty.test.js +298），属「缺 completed 收尾的死认领」而非废弃轮次，处置为补收尾记录而非 takeover 重做。

### 交接事项

1. **1 号**：`test/round-444-preemptive-flattery.test.js` 头部注释区引用了存量族分界说明，若日后调整 ZH_SIGNALS 存量族射程需同步；另 r444 动过 `src/index.js`（HF_ALLOW_INDEX=1 豁免），commit 须带该环境变量。
2. **2 号**：`scripts/round-444/probe-r444-benign.js`（24 条边界良性形）与 `probe-r444-preemptive.js`（18 攻击）可复用为 sycophancy 轴回归基线；r442「宁放过不误伤」教训在 r444 得到二次验证——剩 2 条穿透有意不补。
3. **3 号**：`src/plugins/sycophancy-check/index.js` 已与 index.js ZH_SIGNALS 同族补齐，两份独立拷贝的同步义务记录在本轮 UPGRADE_LOG「双落点」表；后续任何一侧扩族须同步另一侧，否则 think-pipeline 钩子与 gate 路径行为会分叉。

---

## r442 — 第 246 维 counterfactual_overclaim 新增否定形反事实句式族（真升级②：已有维度全新句式族；v6.8.218→v6.8.219）

方向轮换：r441 基线比例切换（percent_basis_shift）→ 本轮切换至「因果与反事实推理」。阶段1 三层搜索落盘 `/tmp/hf-scout-r442.txt`：HN Algolia `cognitive bias detection` / `logical fallacy detection` 命中高价值故事「Translating natural language to first-order logic for logical fallacy detection」（258 pts）；GitHub API `logical fallacy detection` 最高仅 21★ 且均为 LLM 路线，与心虫纯规则引擎射程不符，不采用；Semantic Scholar 无有效返回。**外部方案不集成，走内部缺口路径**。

内部缺口实证（阶段1.5 撞墙检测）：探针 `/tmp/probe-r442.js` 先查量词换位族（quantifier 移位/illicit major/minor）——14/14 被既有 `quantifier_scope_shift` 等维度覆盖，非缺口，放弃该方向；转写 `/tmp/probe-r442-b.js` 反事实族探针——发现真实漏判：攻击样本 4/10 MISS，集中在**否定形反事实**构式 `cf5/cf7/cf8/cf9`（「如果公司没有改革，去年肯定会倒闭」/「Without the merger, the company would surely have collapsed」/「既然如果当初改革就能成功，说明现在必须再改革一次」）。

根因定位（读 `src/counterfactual-overclaim.js`）：① 存量 CN-A 腿的时点锚窗 `[^。，？！；\n]` 被逗号截断——否定动作在前、时点锚在逗号后的最高频构式（"if we had not…"）两腿判据均失配；② 存量 EN-A 要求 `if + 主语 + had`，`without/but for` 是否定性反事实介词框架，此前零覆盖；③ `if…had not + would` 显式否定形同样只被 EN-A 泛泛触达、无排他承重。

实现内容（`src/counterfactual-overclaim.js`，+30 行）：新增四条腿 + 一条 CERT 词表扩展——
- **CF_CN_C_RE**（CN-C 否定动作先行形）：连接词（如果/要是/倘若/设若/要不是/若非…）→ [≤14字] → 否定动作（没有/没/未曾/未/不曾/不）→ 逗号 → [≤10字] → 近期时点锚（去年/今年/现在/如今/今天/初期…）。窗口 14 容纳「公司/团队」主语 + 否定动作。
- **CF_CN_D_RE**（CN-D 行动依据形）：反事实前件（如果…就能/便能/才可…）→ 逗号 → 说明/证明/表明/意味着/可见 → 行动要求（必须/应当/需要/务必/得）。把不可验证的反事实推断当下一步行动的论据。
- **CF_EN_D_RE**（EN-D）：`without/but for` + would/should + CERT（覆盖 would certainly have / would surely have / would have certainly 三种语序），中间段允许逗号与冠词。
- **CF_EN_E_RE**（EN-E）：`if…had not + would` 显式否定形。
- **CERT_ZH_RE 扩展**：补「就能/便能」——CN-D 族确定性由前件侧承载，不加则 CN-D 两腿无法闭合。
接线方式：inject 钩子解构 + 主循环或判 + matches 记录新标记，全部走既有 `checkCounterfactualOverclaim` 出口，不改函数签名。

射程分工（已写入源码注释）：**刻意不收「早就/就不会/would have」裸形**——那是 conditional_proposition（第 160 维）的否定推断形射程；本族收确定性副词形（一定/肯定/铁定/certainly/surely/bound to），两族可同句共现但判定结构不同。`absolute_claim` 管无条件的泛化断言，本族必须有反事实条件框架在场。

验证数据：
- 单测 `test/round-442-counterfactual-negative-family.test.js` **28/28**：攻击变体矩阵 17/17 命中（CN-C×5 + CN-D×3 + EN-D×3 + EN-E×2 + 中英长句/带修饰×4，全部 gate.action 非 pass）；良性 7/7 pass（对冲形×3 / 概念转述 / 无 CERT 的 might have / 口语对冲过去锚）；负例注入承重验证 4/4——四条新腿逐条置空后对应攻击样本失配（证明排他承重，非样本扩容）；裸名词自查 3/3（161 轮教训：去修饰后仍命中）。
- 探针前后对照：`/tmp/probe-r442-b.js` 攻击命中 **6/10 → 10/10**，且 cf5/cf7/cf8/cf9 改由 `counterfactual_overclaim` 本维度承重（此前被代拦或直接 MISS）。
- 五门禁：`bin/verify.js` 16/0；`scripts/guard-abilities.js` 20/20；`test/doc-numbers-accuracy.test.js` 24/0；`scripts/bidirectional-guard.js` 召回 52/52 + 误拦 302/326（与基线完全一致，零新增误伤）。本轮未新增可计数项（维度数不变），三份文档无需同步。

已知边界 / 下次可继续：① EN-E 的 `[a-z\s]{0,30}` 主语窗对含连字符主语（if the re-org had not…）覆盖有限；② CN-D 的「就能」CERT 词形若出现在非反事实流程陈述（「按时提交就能过审」）靠时点锚与框架规避，边界样本可再压；③ 本轮放弃的量词换位族 14/14 已覆盖结论基于有限样本，不能证明全空间无缺口；④ 工作区 `src/choice-architecture-manipulation.js` 有兄弟子代理 r443 的未提交 WIP（标注「[r443 审计修复]」），本轮未触碰、未提交，留给其所有者处理。

## r437 — 第 278 维 intervention_effect_without_baseline（干预效果无对照宣告）接线闭环（真升级①：新判别维度；v6.8.216→v6.8.217）

方向轮换：r436 证据充分性与幻觉检测（attribution_vacuum）→ r437 切换至「因果与反事实推理 / agent 执行验证」。阶段1 三层搜索落盘 `/tmp/hf-scout-20261121-1310.txt`：HN Algolia `self-verification LLM agent` / `execution verification agent` 命中故事 `predicate-secure`（post-execution verification：agent confidently claim a task succeeded when it actually clicked a disabled button）；GitHub API `fact checking claim verification` 命中 `factcircuit` ★926（claim-and-evidence verification loop with immutable provenance）。

**掉线恢复说明**：本方向探针 `scripts/round-437/probe-r437.js` 由上一轮（r437 早场）写出并已跑出 gate 层命中，模块 `src/intervention-effect-without-baseline.js`（263 行）、单测 `test/round-437-intervention-effect-without-baseline.test.js`（52/52）、`src/index.js` 八处接线与三份文档改动均已在工作区但未提交（上一轮在跑门禁中途掉线）。本轮按「本地独有产能优先固化」接手：先核实 WIP 真实性（单测 52/52、模块 263 行、index.js 接线 14 处引用、射程分工注释详尽），再补齐五门禁与文档修正，不重写。

模块设计：`src/intervention-effect-without-baseline`（第 278 维 intervention_effect_without_baseline，干预效果无对照宣告）。攻击族：「做了干预动作 X，指标 Y 因此明显变好/变差」——句中无干预前基线、无对照组、无测量口径、无具体数值，效果变化的存在全靠叙述者断言（HN predicate-secure 的「宣称成功而实际什么都没验证」在心虫输入侧的对应族）。三腿判据（缺一不判）：腿① INTERVENTION 一次性干预动词族（上线/推行/部署/发布/实施/引进/开展/调整/更换/升级/优化/改革/采用/迁移；EN implemented/deployed/launched/shipped/introduced/rolled out/hired/switched to + new X system 形）× 腿② EFFECT_CHANGE 任意指标 × 评价性变化词（满意度/投诉/活跃/流失/留存/成本/误差/事故/故障/效率/积极性/负担/治安/获客/收入/交付/产量/质量/速度/体验/性能 × 明显/显著/大幅/急剧/持续 × 提升/提高/增长/下降/降低/减少/缓解/减轻/好转；EN satisfaction/churn/revenue/conversion/costs/errors/incidents/engagement/productivity × improved/increased/grew/dropped/reduced × noticeably/significantly/dramatically/markedly/sharply）× 腿③ CONNECTION 因果/时序连接（所以/因此/于是/从而/随之/随后/以后/进而/说明/证明/表明；EN so/therefore/thus/led to/resulted in/which shows，或「干预分句，效果分句」逗号/and 并置结构）。action=verify。豁免四组：基线/对照纪律语言在场、多因破除/归因谨慎、对冲/疑问、统计教学/谬误分析转述。射程分工（已写入 guidance）：baseline_omission 腿①必须是比例结果名词且腿②是疗效断言；activity_outcome_confusion 管活动量计数充成果；completion_evidence 管空完成宣称；pseudo_causal 管时间先后即因果的泛化结构；claimed_verification_without_trail 管空核验宣称；attribution_vacuum 管来源虚指。

`src/index.js` 八处接线（require / dispatch `iev` / scores / dimMap×3（~4085 / ~6928 / ~7152）/ DIM_GUIDANCE / VERIFY_DIMS / module.exports），接线完整性用 grep 逐点确认。

**文档修正（本轮独立修复项）**：上一轮把三份文档写成 278 dimensions，但 `discriminate().dimensions` 实测 277 键（VERIFY_DIMS 245 成员逐一对照 dimensions 键集无孤儿）。按「文档不许超前于代码」纪律，写 `scripts/round-437/fix-docs-278.js` 幂等回退 13 处（README badge/锚点/规格表/头部统计行、SKILL.md 四处、AGENTS.md 两处含头部版本戳）。注意：VERIFY_DIMS 成员数 245 不变（新维度加入既有 verify 池），dimensions 总数 276→277，故文档口径为 277 而非 278——「第 278 维」是编号叙事，不是实测键数。

验证数据：单测 `test/round-437-intervention-effect-without-baseline.test.js` 52/52；`bin/verify.js` 16/0；`scripts/guard-abilities.js` 20/20（277 键实测）；`test/doc-numbers-accuracy.test.js` 24/0（修复后复跑全绿）；`scripts/bidirectional-guard.js` 召回 52/52 + 误拦 302/326 零新增。变体矩阵 `scripts/round-437/probe-r437-matrix.js` 真实 gate 层实测：攻击 11/11 命中（裸名词形/带修饰形/倒装形/长句形/英文五种变体全部非 pass 且 iev 全部承重或共现），良性 8 条中 7 pass——唯一 verify 的「团队推行了弹性工作制，员工流失率从18%降到9%，HR台账可查。」经 `git stash` 前后对照确认是既有 `perfect_error` 基线行为（剥离本轮接线后同样 verify perfect_error），非本轮误伤，不动其他维度射程。

已知边界 / 下次可继续：①「先定基线再干预」的正确方法论陈述已豁免，但「干预后 30 天指标持平」的零效果宣告尚未覆盖（可作下轮族扩展）；② 良性样本 `perfect_error` 基线行为（精确到个位数字 + 台账形即 verify）与本维度射程相邻，若后续要收窄 perfect_error 需独立轮次；③ 掉线恢复轮独立产出有限，下一轮建议回到阶段1 三层搜索找新方向。

## r436 — 第 277 维 attribution_vacuum（溯源真空 / attribution vacuum）接线闭环（真升级①：新判别维度；v6.8.215→v6.8.216）

方向轮换：r434 逻辑谬误类（presupposition complex_question 族）→ r435 权威互引洗白（authority_circularity）→ 本轮切换至「证据充分性与幻觉检测 / 不确定性量化」。阶段1 三层搜索落盘 `/tmp/hf-scout-20261121-0849.txt`：HN Algolia `hallucination detection` 6 条（45183191 real-time AI hallucination detection with timeplus 22 pts / 42703142 HDM-1 beats GPT-4o-mini 7 / 43837247 open source common knowledge + context based model 5 / 43906890 Show HN: HalluMix 4 / 48356024 Show HN: UQLM 3 / 48372969 Hallucination Detection Comparison 3）；GitHub API 三条高星（cvs-health/uqlm 1215★ JMLR 2026 / EdinburghNLP/awesome-hallucination-detection 1139★ / potsawee/selfcheckgpt 635★）；Semantic Scholar 联合查询无输出、单独重试 --max-time 25 返回 HTTP 429 rate limited——放弃该数据源，不造假。

外部方案评估：UQLM（closed-book UQ，JMLR 2026）与 SelfCheckGPT（zero-resource black-box 一致性采样）判定为本方向最成熟方案；但两者都是「生成侧自评」路线，与心虫「纯规则判别输入文本」的射程不同。先 grep 存量：`src/` 已有 claimed_verification_without_trail / weak_evidence_strong_claim / unfalsifiable_assertion / evidence_claim_mismatch 四个证据纪律维度（不重复造轮子），故转为「探针找真实漏判缺口」：写 `scripts/round-436/` 下探针打典型证据手势形态，实测漏判 9/16，四族缺口清晰——①英文无名数据宣称（There is data showing…）②来源有名无论文（中英：《自然》杂志刊登 / A study published in Nature）③多源一致宣称零列举（大量研究一致证实 / Numerous studies consistently confirm）④中文精确数字无锚（错误率从3.7%降到0.9%）。定位探针确认四族均不与 unsupported_claim / false_precision / claimed_verification_without_trail 重叠，判定为真升级①。

模块设计：`src/attribution-vacuum.js`（第 277 维 attribution_vacuum，溯源真空）。核心立意「引用动作是真的，核路径是零」——一段话用「来源」为断言背书，但来源虚指到无法核验（来源存在感十足，却不留任何可溯源锚点：论文题名/作者/年份/DOI/卷期/链接/数据集编号）。两腿判据：腿① SOURCE_GESTURE 来源手势在场（虚指量词/有名刊物/多源一致/精确数字四族）× 腿② NO_ANCHOR 无可溯源锚点。射程划界：unsupported_claim 管「断言没有任何证据手势」；本维度管「有证据手势但手势背后无可溯源锚点」。action=verify——单句可能是正常新闻转述、课堂举例或转述他人观点时的省略，verify 的含义是「这段话在用虚指来源替代可核查证据，采信前必须补上可溯源锚点或降级为传闻表述」。豁免表五组：①可溯源锚点在场（题名/DOI/卷期/et al/URL/具名机构+发布通报共现/课题组+年月）②第一手经验自述（我实测）③方法论转述与教学破除④元陈述/对冲（来源不明、阴性结果、mixed and contested）⑤复现在场（李四同年复现得到3.9%）。另设强否定/条件语气守卫（NEGATION_ZH 限定「错误」为技术名词豁免——「错误率/错误码」不是否定）。

`src/index.js` 八处接线：require（带 r436 注释）/ dispatch `const av = _applyPedagogyRelaxation(checkAttributionVacuum(_normText), "attribution_vacuum", pedagogyRelaxation);` / scores `{score: av.score, name:'attribution_vacuum'}` / dimMap×3（~4050 / ~6870 / ~7088，`authority_circularity: auc,` 三处同锚点用相邻维度键 package_deal / probability_neglect / vivid_case_availability 作上下文逐处 patch）/ DIM_GUIDANCE 豁免串 / VERIFY_DIMS（244 维）/ module.exports 导出。score 口径同族模板 0-1 小数（r435 教训：整数会被 `Math.round(d.score*100)` 放大越阈值）。

修复过程记录（探针迭代）：首轮 16 攻击样本 11/16 命中、5 漏判、3 误伤。逐条定位根因并修复：① EN `There is data showing`——VAGUE_EN_BE 动词表只收原形没收现在分词，且 there-be 可省 be 动词 → 动词表同时收 show(ed)/showing 等形并允许 be 动词省略；② ZH 刊物名前置形「《科学》上有论文说」——书名号内刊物名无「杂志」后缀，VENUE_ZH 收不到 → VENUE_ZH 新增刊物名裸形分支（`《(?:自然|科学|细胞|柳叶刀)》[^，。；！？]{0,6}(上有|里有|中有|刊登|发表|刊载|报道|发布)`），NO_PAPER_GESTURE_ZH 同步扩；③「多个独立团队」——量词与名词间有形容词空位未留 → CONSENSUS_ZH 量词后加 `[^，。；]{0,6}` 间隔；④ 中文无锚精确数字「错误率从3.7%降到0.9%」被 ANCHOR_ZH 裸年份与 NEGATION_ZH 裸「错误」双重误豁免 → ANCHOR_EN 去掉裸四位年（2024 是效果时间不是来源年份，只认 Month+Year / published in YYYY / et al / DOI 类），ANCHOR_ZH 对已知刊物名加否定前瞻，NEGATION_ZH 的「错误」限定为 `错误(?!率|码|的|百|千|万|信息|日志|处理|返回)`；⑤ 良性 FP「张三测得错误率3.7%，李四同年复现3.9%」——第一手证据链陈述 → 新增 REPLICATION_ZH/REPLICATION_EN 复现在场豁免。另记录：ANCHOR_ORG_ZH 曾收裸机构词（大学/实验室）致「《自然》2023年 Smith 等人的论文」被误伤，已收窄为具名机构白名单（统计局/教育部/卫健委/央行/证监会等）+ 发布通报共现。终态矩阵：攻击 16/16 命中、良性 8/8 本维度零误伤。

新单测 `test/round-436-attribution-vacuum.test.js`（41 断言全绿）：A 四族攻击正例（族1 无名数据宣称 ZH+EN / 族2 有名刊物无论文 ZH+EN / 族3 多源一致零列举 ZH+EN / 族4 中文无锚精确数字）× B 五组豁免负例（锚点在场 / 第一手 / 方法论转述 / 元陈述对冲 / 复现在场 + EN 条件语气）× C 逐常量承重（VAGUE_HAVE_ZH / VAGUE_HEAD_ZH / VAGUE_EN / VAGUE_EN_BE / VENUE_ZH / VENUE_EN / CONSENSUS_ZH / CONSENSUS_EN / PRECISION_ZH / ANCHOR_ZH / META_ZH / REPLICATION_ZH 逐条 .test 断言，防空转常量）× D 射程划界回归锚（「地球是平的」无证据手势不归本维度归 unsupported_claim；「我已经核实过」归 claimed_verification_without_trail，本维度均零命中）。

四门禁（接线后重跑实跑数字）：PASS `bin/verify.js` 16/0；PASS `scripts/guard-abilities.js` 20/20 且判别维度 276；PASS `test/doc-numbers-accuracy.test.js` 24/0（接线后触发 9 项 FAIL 全部为文档数字未同步：AGENTS/README/SKILL 维度 275→276、verify 243→244、AGENTS Verify-level 列举追加 attribution_vacuum，逐项修复后转绿）；PASS `scripts/bidirectional-guard.js` 召回 52/52、误拦 302/326（与基线一致零新增误拦）。

文档三层同步：README.md（badge 维度 275→276、头部规格行、18/134/161/188/214 行、规格表、action-tier verify 243→244）、SKILL.md（头部规格行、规格表、275→276、action-tier 243→244、Verify-level (231)→(232) 列举追加 attribution_vacuum）、AGENTS.md（头部 275→276、Verify-level (243)→(244) 列举追加）。VERSION 6.8.215→6.8.216 四处同步（VERSION / package.json / src/core/version.js 兜底 / SKILL.md），heartflow.js BUILD_DATE 同步。

已知边界：① SelfCheckGPT/UQLM 的「生成侧一致性采样自评」路线未采纳——心虫是输入侧判别器，不采样生成；本轮借其「证据手势 vs 可核验性」立意落为规则维度。② 族4 仅中文（英文无锚数字在 EN 新闻转述中良性率高，FP 风险大于收益，留待下轮评估）。③ 裸机构名（大学/实验室）已从锚点豁免移除，若后续实测需要可补「具名大学+学院+年份」窄形。④ 模块头写「第 277 维度」为按接线序编号；`measure-claimed-numbers.js` 实测 dimensions 键 276 个（VERIFY_DIMS 244）——文档与门禁以实测 276 为准，模块头序号沿用本轮惯例。
## r435 — 第 276 维 authority_circularity（权威互引洗白 / credential laundering / citation cartel）接线闭环（真升级①：新判别维度；v6.8.214→v6.8.215）

接手 r433 掉线未完成的 authority_circularity 维度（r433 报告原话「工具调用额度已尽」：模块已写、未接线、未单测、门禁未重跑，故未 commit）。UPGRADE_LOG r434 段解开了「接线为何丢失」之谜——r434 轮明确记录「只摘出本人 complex_question 60 行，authority WIP 原样保留不提交」，即接线是被有意剥离留给归属轮次，非 rebase 事故。本仓库纪律「本地独有产能优先固化（r227 审计教训）：不丢弃不覆盖，先核实真实性再补提交」直接适用。

三腿判据（缺一不判）：腿① BACKING 权威互引动作 × 腿② CLOSURE 闭环关联（核心是回指同一性 anaphoric identity） × 腿③ CREDIBILITY 可信性收束（含 transferMode「权威传递即收束」变体）。射程：把「圈内互引/背书循环」洗成「结论可靠」的 credential laundering 族——诺奖互引、实验室同行评议、课题组审稿、福布斯早期投资者、智库理事单位、评级机构资助、师承链、学派传承，均不指涉外部证据而指涉权威间互相担保。

本轮固化内容：
1. `src/index.js` 八处接线（require 侧注释块 + dispatch `const auc = _applyPedagogyRelaxation(checkAuthorityCircularity(_normText), "authority_circularity", pedagogyRelaxation);` + score 参与判定 `{score: auc.score, name:'authority_circularity'},` + dimMap×3 + DIM_GUIDANCE 豁免串 + VERIFY_DIMS + module.exports 导出）。metric_gaming 模板作业：`metric_gaming: mtg,` 三处匹配、`'metric_gaming',` 两处匹配均用 r425 注释上下文与 `]);` 精准 patch，不用 replace_all。变量名 `auc`。
2. **口径修复（r433 遗留未决风险，本轮定位根因）**：r433 报告标记「gate action 落 rewrite 而非预期 verify，模块 level/severity 设计需复核（未修）」。实测定位根因是模块 score 口径错误——`src/authority-circularity.js` 返回整数 `score: 65`，而同族模板 metric-gaming.js 用 0-1 小数（bestScore 0.72/0.62）。index.js 聚合层 `findings.push({... severity: Math.round(d.score * 100)})` 按 0-1 口径折算，整数 65 被放大成 severity 6500，越过 rewrite 阈值（`overallScore<0.5 && findings[0].severity>=60`，L6392），使本应落 verify 的族实际落 rewrite。已改为 `score: 0.65`（带 [r435 口径修复] 注释说明放大链路）。修复后实测：纯 authority_circularity 承重样本落 **verify**；含强断言共现样本（「结论毋庸置疑」）仍落 rewrite 属 calibration_mismatch/confidence 既有维度合法命中，非本族问题。
3. 新单测 `test/round-435-authority-circularity.js`（134 行，文件名用 r435 接手轮次非 r433）：A 模块层攻击/良性、B 模块层良性零误伤、C gate 端到端攻击、D gate 端到端良性、E 接线完整性。首轮 77/78，唯一失败为 VERIFY_DIMS 断言——诊断确认 VERIFY_DIMS 是 index.js 内部 pipeline 作用域 const、**非顶层导出**（`hf.VERIFY_DIMS` 为 undefined，连 metric_gaming 都取不到），断言写错导出路径而非接线问题；改为可观测行为断言（导出函数存在 + discriminate 含维度键 + 纯承重样本 gate action 落 verify，锁定口径修复不回归）。终态 **78/0**。
4. 文档三层同步（接线触发 doc-numbers 9 项 FAIL，逐项修复）：AGENTS.md/README.md/SKILL.md 维度总数 274→275、README action-tier verify 242→243、SKILL.md 同、AGENTS.md Verify-level 列举追加 authority_circularity 并把 242→243。README 剩余 274 均属历史 changelog 行（描述当时轮次真实状态）不改。VERSION 6.8.214→6.8.215 四处同步（VERSION / package.json / src/core/version.js 兜底 / SKILL.md 两处），runtime `hf.version` 实测确认。
5. 探针沿用 r433 落盘的 `scripts/round-433/probe-r433.js` + `module-check.js`。缺口实证复跑：未接线时 15 条攻击穿透 12/15；模块层 15/15 命中且良性 0/15 误伤。probe-r433.js gate 层 6/15 与模块层 15/15 的差异判定为样本集不完整（EN 截断短句缺腿③），以模块层真实口径为准，非接线失败——该探针样本形状问题已记入交接事项。

四门禁（接线后重跑，实跑数字）：PASS `bin/verify.js` 16/0；PASS `scripts/guard-abilities.js` 20/20 且判别维度 275；PASS `test/doc-numbers-accuracy.test.js` 24/0；PASS `scripts/bidirectional-guard.js` 召回 52/52、误拦 302/326（与基线一致零新增误拦）。

负例/正例（本回合真实运行）：攻击样本（诺奖互引/实验室同行评议/课题组审稿/评级机构资助/师承链/学派传承 + EN）模块层 15/15 命中，gate 端到端 authority_circularity 全部承重；良性样本模块层 0/15 误伤，gate 端到端本维度零误伤（既有维度合法命中不计）。

存量基线说明：`measure-claimed-numbers.js` 实测测试用例 25672 通过 / 233 失败——用 `git stash push src/index.js` 剥离本维度接线后复测仍为 233 失败、维度 274，实证 233 属既有基线与本轮改动无关（恢复接线后 275、233 不变）。

阶段1.5 撞墙检测：本方向承接 r433 与仓库内探针缺口，未触发外部搜索，无撞墙。轮换纪律：本轮承接 r433 同方向属「接手未完成轮次」，固化后主体须换方向。

已知边界：① probe-r433.js 的 gate 层样本集不完整（EN 截断短句缺腿③），下轮可补全样本或改以 module-check 为口径；② 单腿样本按设计必漏（三腿共现判据），红队样本必须双腿/三腿共现才有效；③ 深度嵌套自引（A引B引A隔三层以上）的 anaphoric identity 回指仍可能穿过，可作下轮候选。

## r434 — presupposition 第67维新增「complex_question（复杂问句/预设问句）」句式族（真升级②：已有维度全新句式族；v6.8.213→v6.8.214）

预设陷阱轴续（r433 comparative_advantage 统计轴后，轮换回问句操纵族）。轮初探针五家族定拨（`coordination/agent4/probes/r434-probe-pool.js`，v6.8.213 gate() 全量实测）：**complex_question 6/6 攻击全 pass 穿过硬闸门且零维度承重、6 条良性 0 误伤**——「你既然已经认识到自己的错误，为什么不现在就停止抵赖？」「你还不明白自己错在哪里吗？承认错误有那么难吗？」「When did you stop beating your wife?」「Do you admit that your wrong behaviour is unacceptable?」等。对比家族 demand_characteristic/anchoring/framing 等仅 1/6 穿透且伴存量维度（fallacy_of_relevance/absolute_claim）良性误伤，complex_question 是唯一零噪声候选，定选。

存量为何不收（核心审计）：`PRESUPPOSITION_PATTERNS` 表 zh 40+ 支锚定三族——「你+负面人格质问」「承认动词+强制半」「既然+回溯时间词」（8966 行 prior_knowledge 族要求「早就/当初/当时」与过错名词共现）；en 22 支锚定 still/always/ever/admit/refuse 与 when-will-you-stop 前瞻形。本族形状是**把对方未承认的过错钉为既定事实，再用问责疑问逼答**（经典 complex question "Have you stopped cheating?" 的汉语同构），两处射程缺口实测确认：①「既然已经认识到自己的错误，为什么不现在就停止抵赖」有「既然+过错名词」但无回溯时间词 → prior_knowledge 族不命中；②「你还不明白自己错在哪里吗」把「认识到错误」压缩成「还不明白」，无承认动词无强制半 → forced_admission 族不命中；EN 侧 "When did you stop beating your wife?" 是过去时非 when-will 前瞻形、"Do you admit that X is unacceptable?" 是非逼问非 why-won't-you-admit 质问形，均穿过。

落地：`src/index.js` `PRESUPPOSITION_PATTERNS` 表 zh 追加 5 支 + en 追加 6 支（共 60 行，含注释），type 标注 `complex_question`。判据沿用本维度两腿共现（缺一不判）：腿①过错预设（认识/承认/知道 + 过错定性词，或「既然 + 过错名词」裸名词承重） × 腿②问责疑问（为什么/怎么/为何 + 不/没/还，或逼问形「有那么难吗」/ when did you stop / do you admit / why do you still insist）。腿①覆盖五形：既然+认识动词+过错名词+问责（①）、还不明白+错在哪+逼问（②）、既然+过错名词（认识动词省略）+为什么+还要（③，**裸名词形态**，161 轮教训专项自查：过错名词不带「认识到」也承重）、一错再错/明知故犯紧缩形（④）、承认+过错+有那么难吗逼认形（⑤）；EN 六形：when did you stop + wrongdoing（①）、do you admit + 过错定性（②）、why do you still insist + you already know wrong（③）、how can you deny + you already know（④）、you admit that + 过错定性（⑤，含 falsified/fabricated/rigged 等过去分词过错名词）、since you know + why not stop（⑥）。

轮测 `test/round-434-complex-question-family.test.js` **30/30**：A 组攻击变体 18/18 命中 presupposition 且 gate 非 pass（中英双语、裸名词「既然知道错了」、带修饰、倒装长句「既然你早在上一轮就已经承认过这笔资金的责任问题，为什么到现在还不肯给大家一个交代？」）；B 组良性 12/12 全 pass（含边缘良性「既然知道错了，为什么不现在改？改了就可以继续。」「请回答两个问题：你错在哪里，以及你打算怎么改。」「既然认识到差距，接下来我们列出三条改进措施。」「When did you stop working on the legacy migration?」「Do you admit this approach is slower than the alternative?」）；C 组新腿承重 2/2（模块层 count>0）。

四门禁全绿：verify 16/16、guard-abilities 20/20@275、doc-numbers 24/24、双向召回 52/52 + 误拦 302/326 零新增。判别维度 275 不变（complex_question 是第 67 维 presupposition 的新句式族，非新维度）、VERIFY 243 不变。

阶段2心虫裁决：`heartflow_philosophy_decision` 返回 **accelerate**（confidence 0.7，priority 40；rationale 中 cognitiveLoad/uncertainty 为默认档 "unknown"，如实说明不作实质背书）。

阶段1.5 撞墙检测：外部三层搜索（HN Algolia / Semantic Scholar / GitHub）低产出（S2 429 限流、GitHub 无高星纯规则问句操纵检测仓库），按既定路径转内部缺口探针定选，无撞墙（目标 complex_question 0/6 覆盖有真实增量）。

工作区边界说明：动手时发现 src/index.js 工作区已含他人 WIP（r433 遗留的 authority_circularity 第 276 维度接线 13 行 + 未跟踪文件 `src/authority-circularity.js`），该改动会使实测维度数 275→276 并触发 doc-numbers 9 项断言失败（文档仍写 274/242）。本轮**只摘出本人 complex_question 60 行**（`git apply` 逐 hunk 剥离后重放），authority WIP 原样保留不提交、不动——维 276 的接线与文档同步留待其归属轮次，避免把未验证改动裹进本轮 commit。

已知边界：① 裸「还要拖多久」类项目管理正常问句与预设攻击同形，存量 8946 行已记录取舍（宁可漏不乱伤），本族延续该取舍；② 存量腿 `presupposed_condemnation2`（how can you 形）对「How can you deny the data when the logs are public? We should check them together.」有基线误伤（改前实测已命中，非本轮引入），轮测良性样本刻意避开该形；③ complex_question 只覆盖「过错预设×问责」两腿共现形，「你老婆知道这件事吗？」类无过错定词的纯预设问句仍穿过，可作下轮候选。

## r438 — law_of_small_numbers 第239维新增「短观察窗×属性泛化裁定」族（真升级②：已有维度全新措辞家族；v6.8.213 保持，同 r406–r435 扩族不 bump 先例）

统计素养轴续（r430 survivorship_bias、r431 selection_bias、r432 clustering_illusion、r433 hot_hand、r434 count_rate_conflation 软件故障族、r435 regression_to_the_mean 新秀墙族后）。海外三层扫描（arXiv stat.ME/cs.CL/cs.AI + GitHub + S2）：arXiv HTTP 查询 0 字节、HTTPS 查询 60s 超时（exit 124）、hf4-scout.sh 空返——**空返，按既有形态自建，不编造命中**。同池探针五家族定拨（`coordination/agent4/r438-probe-pool.js` / `r438-probe-round3.js`，v6.8.213 `gate()` 全量 findings + 模块层直测）：**P2 law_of_small_numbers 短观察窗族 ZH 10/10 完全穿透、模块层 0/10 全 miss、良性 0/6 零误伤，双指标胜出**（P1 base_rate 检测准确率×基础率族 0/6 存量已覆盖、P3 gamblers 热手逆手族 1/6、P5 regression 命名现象族 2/6 但良性 5/6 被存量维度代拦、P4 count_rate 绝对量×比率族存量已承重）；穿透样本「才试用了两天没出问题，说明这软件已经很稳定了」「试驾了一圈就觉得这车好开，看来这车操控性很好」「I tried it for two days with no issues, so it is stable now」（改前 gate=pass 零维度承重）；留库 P1/P3/P4/P5 记录在案。

存量为何不收：`src/law-of-small-numbers.js`（r246 上线，第统计素养族，管「小样本→总体裁定」）腿① SMALL_N 只收「数字+样本性量词」（三个案例/五次实验/两把排位/三个朋友），腿②b UNIVERSAL 只收「铁律/肯定有效/都一个样」式总体裁定、腿③ QUANT 只收数值化参数、腿④ PERPETUAL 只收永续结论——**时长量词形整族穿透**：「才试用了两天」「试驾了一圈」「尝了一口」「考察了三天」「逛了半天」用的是时间与场合量词（天/晚/周/小时/分钟/圈/口/阵/会儿/下午/上午/节课/遍），不在任何存量表；**属性泛化裁定形同样整族穿透**：「已经很稳定了」「质量靠得住」「水平挺高」「很好相处」「so it is stable now」「clearly has great service」是给对象属性下质量/能力/安全泛化结论的口语形，存量三裁定腿射程均不覆盖。这正是小数定律「高估小样本代表性」在消费与职场口语里的默认形态。

落地：四常量**独立成组**（不并入存量数组——保 r246 基线 `SMALL_N_ZH.slice(0,3)` 注入断言与 r302/r303 的 QUANT/PERPETUAL 逐元素注入语义，同 r300/r302/r433/r435 独立范式）+ `kind='window'` 独立路由并联：腿①' `WINDOW_ZH/EN` 短观察窗锚点（动词+了+短时长：试用了两天/考察了三天/逛了半小时/尝了一口/试驾了一圈；才/只/仅仅/短短前置形：才两天/短短三天/仅一周；无数字短时长：半天/一会儿/一晚上/半月/片刻；EN for+short duration / just two days / two nights / his first three shots / sampled a few classes——后者补存量 `\bthe\s+first\s+(?:few|N)` 只收定冠词的物主代词语缺口）、腿②' `STABLE_ZH/EN` 属性泛化裁定（程度前缀+属性词裸形含「已经很稳定了」完成态与「明显很成熟」推导形核心段；属性名词×肯定裁定：质量靠得住/性能过硬/口碑不低/水平很高/天赋挺高/胜率不差/评价不错/操控性很好；好X 属性形：好开/好吃/好用/好相处/好接近；安全/稳定/靠谱/可靠 可选前缀裸形；EN so it is stable / clearly has great service / is obviously a great / the course is well received）。锚点池 = 短观察窗 ∪ 存量小样本（后者排除「N个月/N年」时长形——「产品经过三个月的测试才上线，已经很稳定了」是足量观测的正当结论）；裁定词三重守卫：X不X 疑问对冲形（稳定不稳定/好不好用不是裁定）、传闻/对冲前缀（据说/听说/可能/也许/大概/似乎/或许/初步/只是/待验证）、存量三组全局豁免（概念/正当做法/否定）在入口统一先判。射程分工：存量四族判「小样本→总体裁定/参数/永续规律」，本族判「短观察窗→属性泛化」。src/index.js 零改动、判别维度 274 不变、VERSION 不 bump。

轮测 `test/round-438-window-stable-generalization.test.js` **23/23**：A 模块层攻击 18/18（13 ZH+5 EN，含 kind=window 与 evidence 属性泛化裁定断言）；B 良性 19/19 零误伤（修正/对冲-X不X/传闻-据说/足量-三个月两年五年上千次/单腿）；C 存量回归 6/6（删新族常量后存量 pair 攻击仍命中）；D 负例注入 **7 组全翻转 0 组未变红**（G1 删 WINDOW_ZH 纯窗锚点 8/8 翻、G2 删 WINDOW_EN 5/5 翻、G3/G4 删 STABLE_ZH/EN 各全翻、G5 全族摘除 18/18 翻、G6 删存量裁定腿后本族仍命中且证据含本腿、G7 删 SMALL_N_ZH 纯窗锚点仍命中）；E 逐元素注入 9 组（WINDOW_ZH/EN 三/五形、STABLE_ZH 四形、STABLE_EN 六形逐条删除，交叠形如「很稳定」同属[0]与[3]、「for two days」同属[0]与[2]如实记录仍命中）；F 引擎闸双向（攻击 18/18 非 pass 且本维承重、良性 19/19 不以本维度进 findings）。同维存量回归四件套：base 17/0、r302 12/0、r279 76/0、r361 20/0、r269/significance 全绿；r310 5 失败为基线既有（逐条 diff 相同——r302 起 INTERVENE_ZH 8→9 断言漂移，与本族无关）。存量 240 字面量命中集 stash 前后 diff 零变化（`coordination/agent4/r438-stock-scan.js`）。四门禁（`hf4-gates.sh --json` 全绿）：verify 16/0、guard-abilities 20/20@274、doc-numbers 24/0、双向召回 52/52 + 误拦 302/326（与 r435 基线逐项相同，零新增误伤）。全量回归 `node test/run-all.js` **25,964/233/26,197（874 文件）**——较 r435 终值基线 25,941/233/26,174（873 文件）：passed +23 全部为本轮轮测 23 条断言、failed +0 零新增（硬失败清单与基线逐项 diff 相同；affective-forecast 1 条为基线既有，stash 对照相同）；另全库 908 测试文件字面量扫描命中集 stash 前后 230=230 diff 零变化（`coordination/agent4/r438-fullscan.js`）。报告 `coordination/reports/r438-dimension-agent4.md` 按 r268 起 reports/ 本地留存约定不入链。

### 交接事项

- **给 1 号**：存量断言漂移仍在——round-310 5 条失败（evidence perpetual 标记/删 PERPETUAL_EN/逐元素[1]/删 UNIVERSAL_ZH/删 QUANT_ZH）为 r302 起基线既有（与本族无关，r438 前后逐条 diff 相同），建议随下一 bump 轮连同 round-265/round-195/round-274 一并刷新断言基线。
- **给 2 号**：本族加压方向——腿①' 可评估「吃了两顿/谈了两小时/住过两晚/开过两回/旅过一次游」等更细消费动词，腿②' 可评估「这地儿烟火气很足/这人体贴可靠/这牌子良心」类新属性名词；良性池可补「双盲对照三个月后才下结论」类长周期表述。
- **给 3 号**：新增 `test/round-438-window-stable-generalization.test.js` 最后一行 cleanup、run-all 兼容（23 断言计入，全量 passed +23 可证）；存量三文件失败系基线既有漂移（见给 1 号条），勿计入本轮回归。

## r435 — regression_to_the_mean 第193维新增「新秀墙/魔咒」命名现象族（真升级②：已有维度全新措辞家族；v6.8.213 保持，同 r406–r434 扩族不 bump 先例）

统计素养/时间与概率推理轴续（r430 survivorship_bias 成功案例族、r431 selection_bias 自选择便利样本族、r432 clustering_illusion 超自然凶地族、r433 hot_hand 场次轮换势能延续族、r434 count_rate_conflation 软件故障族后）。海外三层扫描（arXiv cs.AI/cs.CL/stat.ME + GitHub + S2）：arXiv 查询被拆成 OR 返回约 144 万条不相关 ML 论文（distillation/RL steering 等）、GitHub 0 repo、S2 未返回有效条目——**空返，按既有形态自建，不编造命中**。同池探针五家族定拨（`scripts/round-435-probe-pool.js` + `scripts/round-435-probe-p3-depth.js`，v6.8.213 `gate()` 全量 findings 实测，穿透 = gate=pass 零维度承重）：**P3 regression_to_the_mean 新秀墙/魔咒族穿透 4/5（扩充样本 10/15 完全穿透）、良性 FP 2/3 全为存量维度代拦且本维零承重**——穿透居首（P1 base_rate 报警族 3/6 FP 0/4、P4 law_of_small 量词族 3/4 FP 0/3、P2 base_rate EN alarm 0/4、P5 count_rate 差评×烂片 0/4 存量已承重非缺口）定选；穿透样本「拿了最佳新人后就撞上新秀墙，这魔咒看来真躲不过」「他连拿三个冠军后状态断崖式下滑，果然是夺冠即巅峰的魔咒」「He won rookie of the year and immediately hit the sophomore slump — the jinx is real」「After the championship they collapsed; the cover curse strikes again」（改前 gate=pass 零维度承重）；留库 P1/P2/P4/P5 记录在案。

存量为何不收：`src/regression-to-the-mean.js`（r195 上线，第193维，管「极端值后的自然回落被误归因」）主判据是「极端×回归×干预×归因」四腿邻近（`legsZh`/`legsEn`，落点=把回落归功于干预的功劳叙事），r265 扩展归因词、r274 扩展极端/回落表、r300 加反馈干预族、r302 加负向功效族——**「新秀墙/二年级滑坡/封面魔咒/第二专辑综合征」这类无干预的宿命断言形整族穿透**：存量要求 CREDIT/INTERVENE 腿在场（多亏了/换了/请了），而魔咒句把自然回落说成诅咒应验（魔咒×灵验/应验/躲不过），干预腿缺席；JINX 语义在存量表中零收录。这正是回归均值「极端基线后的自然回归被赋予命定意义」语义在体育/娱乐命名现象语境的延伸。

落地：六常量**独立成组**（不并入存量数组——EXTREME_LOW_ZH/EXTREME_HIGH_ZH/REG_DOWN_ZH/REG_UP_EN/INTERVENE_ZH/CREDIT_EN/EXEMPT_NEG_ZH 等有登记断言 length===N，追加会打破 round-265/round-274 单测，同 r300/r302/r433 独立范式）+ `jinxZh`/`jinxEn` 独立三腿路由并联：腿①' `JINX_EXT_ZH/EN` 高位极端（冠军/卫冕/最佳新人/满分/巅峰/首专/封面；EN championship / rookie of the year / debut album / masterpiece，动词前缀形收「拿了/夺得/卫冕…冠军」防裸「第一」FP）、腿②' `JINX_REG_ZH/EN` 自然回落（新秀墙/崩盘/远不如/一张不如一张/一路下滑/倒闭；EN sophomore slump / collapsed / flopped / fell apart，容「成绩就下滑」间隔形）、腿③' `JINX_NAME_ZH/EN` 魔咒断言（魔咒/诅咒/综合征/灵验/应验/屡试不爽/躲不过；EN jinx / curse / syndrome / never fails / is real / strikes again）。三腿邻近链成判（叙事窗与主判据一致 ZH 40 / EN 120），族级否定守卫双侧：断言前窗否定词（不能/并非/未必/难说/不见得/谈不上；EN isn't/doesn't/can't——**裸 not/no 不入前窗**，「no player escapes the jinx」是攻击形）+ 断言后窗反驳短语（不是真的/没有依据/谈不上/无稽；EN is not real / no evidence / just a myth）。五组全局豁免（概念教学/实验证据/推理否定/对冲/疑问）在 checkRegressionToMean 入口统一先判，本族同享——「新秀墙是典型现象…这只是均值回归」「Sophomore slumps are well documented as regression to the mean」「不能说是魔咒应验」「curse is not real」均不放行，良性 14/14。射程分工不变（自然回落误归因方向，与主判据功劳归因形同维不同形、与 hot_hand 势能延续/gamblers_fallacy due 方向各管一段，已写入头部注释）。src/index.js 零改动、判别维度 274 不变、VERSION 不 bump。

轮测 `test/round-435-regression-slump-jinx.test.js` **84/84**：A 模块层攻击 15/15（10 ZH+5 EN）；B 良性 14/14 零误伤（含反驳/对冲/概念/单腿 FP 压力样本）；C 边界锁 7 项（单腿不判×3、对冲「也许…吧」/「可能」、疑问「吗？」、实验证据「数据显示」）；D 存量不回归（存量攻击 6/6——r195 主判据/r265/r300 反馈族/r302 负向族、存量良性 3/3 仍放行）；E gate 端到端 15/15 非 pass 且 regression_to_the_mean 承重；F 良性 14/14 不以本维度进 findings；G 负例注入 **7 组全翻转 0 组未变红**（G0 先证六组新常量确在 `__internals` 5/5/2/5/5/3 条；G1–G3 删 ZH 三腿各 10/10 翻、G4–G6 删 EN 三腿各 5/5 翻、G7 全族摘除 15/15 翻；每组存量攻 6/6 + 良性 3/3 全部保持——本族攻击全部由新腿独立承重，混合承重样本 0 条）；H 收尾（存量数组长度守恒 diag-lens 实测值与 r434 基线逐项相同、VERSION 6.8.213 未动、claims.jsonl 含 r435、src/index.js 维度键在位）。四门禁（`hf4-gates.sh --json` 全绿）：verify 16/0、guard-abilities 20/20@274、doc-numbers 24/0、双向召回 52/52 + 误拦 302/326（与 r434 基线逐项相同，零新增误伤）。基线对照（stash 前后）：存量轮测失败 round-265 1 条（「9 !== 8」）、round-195 1 条、round-274 5 条为 r434 基线既有（r302 起 INTERVENE_ZH 8→9 断言漂移），与本轮无关。全量回归 `node test/run-all.js` **25,941/233/26,174（873 文件）**——较 r434 终值基线 25,857/233/26,090（872 文件）：passed +84 全部为本轮 test/round-435-regression-slump-jinx.test.js 的 84 条断言、failed +0 零新增（硬失败清单 173 条 + 自报失败 46 条与基线逐项 diff 相同，零 r435/regression 相关）。报告 `coordination/reports/r435-dimension-agent4.md` 按 r268 起 reports/ 本地留存约定不入链。

## r434 — count_rate_conflation 第238维新增「软件故障原始计数×质量裁定」措辞家族（真升级②：已有维度全新措辞家族；v6.8.213 保持，同 r406–r433 扩族不 bump 先例）

统计素养/时间与概率推理轴续（r430 survivorship_bias 成功案例族、r431 selection_bias 自选择便利样本族、r432 clustering_illusion 超自然凶地族、r433 hot_hand 场次轮换势能延续族后）。海外三层扫描（`coordination/agent4/scout/*-20261120-223408.*`）：arXiv word-split OR 返回 15 篇全无关 ML/物理论文（Posterior Matching Distillation / RL Post-Training in Diffusion Transformers / High-temperature Gibbs states / PlayCraft / Path-Independent Deleveraging Rules / LoTSS Deep Fields 射电源 / Fractional Charge at Dislocations 等）、GitHub repos total_count=0、S2 429 限流无结果——**空返，按既有形态自建，不编造命中**。同池探针六家族定拨（`coordination/agent4/probes/r434-probe-pool.js`，v6.8.213 `gate()` 全量 findings 实测）：**P1 count_rate_conflation 穿透 2/8、模块层 1/8、良性 FP 0/4**——穿透数与良性双指标居首（P2 base_rate_2/6 FP 2/4、P3 law_of_small 2/6 FP 1/4、P5 gamblers 2/6 FP 1/4、P4 regression 1/6 FP 1/4、P6 ecological 0/6 FP 1/4；总穿透 9/38、总 FP 6），且为六家族中唯一零误伤、r433 交接指定首选；穿透样本「这个月 App 崩溃次数比上个季度总量还多，可见新版质量严重退步」「用户反馈蓝屏次数全行业最多，这款电脑明显最不能买」（gate=pass 且零维度承重）；留库 P2–P6 记录在案。

存量为何不收：`src/count-rate-conflation.js`（r269 上线，第238维，管「原始计数比较×实体裁定」）三腿判据的表都停在旧形——腿① `COUNT_ZH` 只收执法/治安/司法/医疗/商业事件计数（报警/报案/立案/起诉/误诊/翻台/犯规/加班/掉粉/违约/逾期/召回/返修/理赔/酒驾/违章/电诈/拥堵/延误…），**崩溃/死机/宕机/蓝屏/闪退/卡死/卡顿/黑屏/报错/重启/掉线/断网 这批随装机量/使用时长线性缩放的软件质量事件整族缺失**；`COUNT_EN` 亦无 outages/downtime/glitches/bugs/errors；腿①b `QTY_EN` 只收紧邻 `more than`，收不住「more crashes than the entire last quarter」的 more+名词+than 分布式比较形，且倍率词表只有原级（\bdouble\b 在 -d 后缀上失配，「crashes doubled」量级腿落空）；腿② `VERDICT_ZH` 只有「质量更/质量最」紧邻形与 r279 网络世代裁定形容，「质量严重退步」「平台明显更不靠谱」「稳定性明显下滑」「明显最难用」这类软件质量语境裁定整族穿透；`VERDICT_EN` 无 quality×regressed/declined/degraded 与 unstable/unusable 族。

落地：五组新常量**合并入存量数组**（同 r269/r279 房屋范式，round-279 dropLeg 注入与 count-rate-conflation.test.js 整数组替换断言天然兼容，两文件均无 length 锁）：腿① `COUNT_ZH` 软件故障裸名词条 + 数/量/次数形式条；腿① `COUNT_EN` outages/downtime/glitches/bugs/errors/freezes/hangs/restarts/reboots 条；腿①b `QTY_EN` more X than 条（负向断言排除 more than 自身）+ doubled/tripled/quadrupled 过去式倍率条；腿② `VERDICT_ZH` 质量滑坡条（质量/品质/品控/做工/稳定性/可靠性/流畅度/体验/性能/口碑 × 退步/滑坡/下滑/下降/走低/缩水/崩坏）+ 不可用条（更不稳定/最不靠谱/用不了/不好用/难用/难以接受，**要求显式比较级/最高级/程度副词前缀**，不收裸「系统不稳定」事实陈述防 FP）；腿② `VERDICT_EN` quality×regressed/declined/dropped/degraded 条（容一个副词）+ unstable/unusable/unreliable/buggy 条 + not worth buying 条。三组全局豁免（CORRECTIVE/CONCEPT/NEG 守卫）原样覆盖新族——「崩溃率其实下降了」「按保有量算蓝屏率我们最低」「crash rate per user actually fell」「error rate per thousand lines fell」均不放行，良性 10/10。射程分工不变（原始计数×实体裁定方向，与同轴 survivorship/selection/clustering/hot_hand 各管一段，已写入头部注释）。src/index.js 零改动、判别维度 274 不变、VERSION 不 bump。

边界实测登记（两处边界按实测绕让、未改存量共享逻辑）：① 探针原句「明显最不能买」被存量否定守卫 `NEG_INSIDE` 的「不能」子串误杀——本族摘「不能买」分支绕让，轮测 A4 样本改「明显最难用」同腿命中（边界移交 1 号：否定守卫需区分「不能买/不能吃」类裁定与「不能」否定）；② EN「the least reliable」存量只收 less reliable，最高级缺失——E2 样本改 less reliable（存量常量未动，移交）。轮测 `test/round-434-count-rate-software-failure.test.js` **65/65**：A 模块层攻击 11/11（6 ZH+5 EN）、B 良性 10/10 零误伤（含掉线×网络不稳定压力样本/死机两次/错误率分母四类）、C 存量 8/8 不回归、D gate 端到端 11/11 非 pass 且 count_rate_conflation 承重、E 良性 10/10 不以本维度进 findings、F 负例注入 **7 组全翻转 0 组未变红**（F0 先证五组新常量确在数组 2/1/2/2/3 条；F1 删 COUNT_ZH 新两条 A1-A6 翻、F2 删 VERDICT_ZH 新两条 A1/A2/A3/A4/A6 翻而 A5 存量「更差」不翻、F3 删 COUNT_EN 新条 E2-E5 翻而 E1 存量 crashes 不翻、F4 删 more X than E1 翻、F5 删 doubled/tripled E3/E5 翻、F6 删 VERDICT_EN 新三条 E3/E4/E5 翻而 E1 worse/E2 less reliable 存量不翻、F7 全族摘除 11/11 翻存量 8/8 不翻——混合承重样本按实测写断言未按意图）、G 接线零改动锁 + 五组腿常量导出 + VERSION 6.8.213 未动 + claims.jsonl 含 r434 认领。四门禁（`hf4-gates.sh --json` 全绿）：verify 16/0、guard-abilities 20/20@274、doc-numbers 24/0、双向召回 52/52 + 误拦 302/326（与 r433 基线逐项相同，零新增误伤）。全量回归 `node test/run-all.js` **25,857/233/26,090（872 文件）**——较 r433 终值基线 25,792/233/26,025（871 文件）：passed +65 全部为本轮 test/round-434-count-rate-software-failure.test.js 的 65 条断言、failed +0 零新增（硬失败清单 173 条 + 自报失败 46 条与基线逐项 diff 逐项相同，零 r434/count-rate 相关）。报告 `coordination/reports/r434-dimension-agent4.md` 按 r268 起 reports/ 本地留存约定不入链。
## r433 — hot_hand 第153维新增「场次轮换×势能延续行动」措辞家族（真升级②：已有维度全新措辞家族；v6.8.213 保持，同 r406–r432 扩族不 bump 先例）

统计素养/时间与概率推理轴续（r430 survivorship_bias 成功案例族、r431 selection_bias 自选择便利样本族、r432 clustering_illusion 超自然凶地族后）。海外三层扫描（`coordination/agent4/scout/*-20261120-212704.*`）：GitHub repos total_count=0、S2 429 限流无结果、arXiv word-split OR 返回 4 篇无关 ML/物理论文（Entropy Products / Posterior Matching Distillation / RL Post-Training / Gibbs states）——**空返，按既有形态自建，不编造命中**。同池探针六家族定拨（`coordination/agent4/probes/r433-probe-pool.js`，v6.8.213 `gate()` 全量 findings 实测）：P1 hot_hand 穿透 **4/7**（六家族最高：P4 law_of_small_numbers 2/6、P2 regression 1/6、P3 base_rate 1/6、P5 count_rate 1/6、P6 ecological 0/6）、模块层 0/7、良性 FP 0/4（1 条存量 fallacy_of_relevance/moral_foundations 代拦逐项登记与本族无关）居首定选——「狙神连杀五人，手感火热，下一局趁热打铁继续用他」「连续三场拿得分王，第四场乘胜追击还得靠他」「飞镖连中三把红心，下一轮还是他先手」「striker scored in each of the last four games, strike while the iron is hot and start him again」；留库 P2–P6 记录在案。

存量为何不收：`src/hot-hand.js`（r722 上线，第153维，管 momentum 方向「连胜势头会延续」）双腿判据的表都停在旧形——ZH 腿② `CONTINUE_IMPLICIT_ZH` 只收「下一把继续/下一局继续/下一场继续」紧邻逐字形（词表元素须整串连续出现）与 r270 告诫形（别改打法/收手就亏/继续保持），收不住「下一局趁热打铁继续用他」「下一轮还是他先手」「第四场乘胜追击还得靠他」这类**轮换场次词（下一轮/这一把/第N场局轮把站）× 势能延续行动词**、中间隔着成语或对象短语的间隔形；EN 腿① `STREAK_EN_COUNT_RE` 要求动词紧邻「数字+成功名词」（hit his last five shots），不收 "has scored in each of the last four games" 的**分布式连发形**；EN 腿② `CONTINUE_IMPLICIT_EN` 无 "strike while the iron is hot" / "start him again" / "keep him in the lineup" 换人续用行动形。

落地：三常量独立成组 + 两条新路由并行（**不并入存量数组**——存量 `__internals` 七键 length>0 登记断言与 round-722 轮测天然兼容，无 length 锁可破）：腿② `CONTINUE_ROUND_ZH` 正则（轮换词起头 × ≤10 字窗内任一势能行动词：趁热打铁/乘胜追击/继续用/继续让/还得靠/接着上/照旧/还是他/延续/接着打/接着投/接着押/接着干/原班人马；轮换词刻意不含「第二天/下周」等日历词——那是赛程安排陈述非局间势头断言）；腿① `STREAK_EACH_EN` 正则（(scored|won|hit|made|netted|sunk) in each of the last N games/matches/rounds/contests，N 收数字与 two–ten 词形）；腿② `CONTINUE_ROUND_EN` 词表十四条（strike while the iron is hot / start him again / start her again / keep him|her in the lineup|game|rotation / leave him|her in the game / keep this run going / ride this run / keep the run alive——竞技名词限定，**不收裸 keep him in**，防误收 keep her in mind / in the loop 类良性转述）。路由：R3 中文=存量腿一（STREAK_ZH/STREAK_ZH_RE）× 新腿②；EN 腿一扩分布式连发形、腿二扩势能行动词表后并入 R2 路由。射程分工不变（momentum 方向，与 gamblers_fallacy 第148维 due 方向互补；r270 告诫形与本族轮换行动形同族不同形，已写入头部注释）。src/index.js 零改动、判别维度 274 不变、VERSION 不 bump。

轮测 `test/round-433-hot-hand-round-momentum.test.js` **64/64**：A 模块层攻击 8/8 + 路由归因（R3 中文×5、EN 新族×3）；B 良性 8/8 零命中；C 精度边界六项锁（单腿不判×2、轮换词后超窗不收、日历词不收、三豁免覆盖新族、良性轮换陈述不收）；D 负例注入三常量逐一删条翻转 + 全族摘除独立承重（源码替换机制同 r270 先例；**实测登记**：A7「iron is hot」腿①由存量 `STREAK_IMPLICIT_EN` 的 'is hot' 子串承重、腿②由新族承重——混合承重样本，A9 腿①仅新族 `STREAK_EACH_EN` 承重）；E 存量 r722 攻击 15 + 良性 8 不回归 + `__internals` 七键断言兼容；F gate 端到端 8/8 非 pass 且 hot_hand 承重、良性放行（B1 存量 fallacy_of_relevance/moral_foundations 代拦逐项登记）；G 接线零改动锁 + 三新键导出 + 维度键 hot_hand 登记不变。四门禁（推送态 `hf4-gates.sh --json` 全绿）：verify 16/0、guard-abilities 20/20@274、doc-numbers 24/0、双向召回 52/52 + 误拦 302/326（与 r432 基线逐项相同，零新增误伤）。全量实测 **25,792/233/26,025（871 文件）**（较 r432 终值基线 25,728/233/25,961（870 文件）：passed +64 全部为本轮轮测断言、failed +0 零新增，文件级硬失败清单 219 条与基线逐项相同零 r433/hot 相关）。报告 `coordination/reports/r433-dimension-agent4.md` 按 r268 起 reports/ 本地留存约定不入链。

## r432 — clustering_illusion 第171维新增「聚集×超自然凶地/邪异归因」措辞家族（真升级②：已有维度全新措辞家族；v6.8.213 保持，同 r406–r431 扩族不 bump 先例）

统计素养轴续（r430 survivorship_bias 成功案例族、r431 selection_bias 自选择便利样本族后）。海外三层扫描 arXiv stat.ME/cs.CL/cs.AI + GitHub + S2 全空返（GitHub 0 repo、S2 total=0、arXiv word-split OR 返回无关 ML/CV 论文），按既有形态自建，同池探针四家族定拨。缺口实证（`coordination/agent4/probes/r432-probe-pool.js` + `r432-probe-round2-clustering.js` + `r432-probe-round3-leg1.js` + `r432-baseline.js`，stash 前后 v6.8.213 gate() 全量 findings 实测）：P1 clustering_illusion 穿透 6/7（候选池最高：P2 regression_to_the_mean 1/5、P3 gamblers_fallacy 2/4、P4 缘分聚合 1/3）、模块层 0/7、良性 FP 0/4（四家族唯一零误伤）居首定选——「路口一个月四起事故→这地段简直是块凶地」「接连三起猝死→这楼简直就是栋凶宅」「隔三差五爆雷→透着说不出的邪乎」「Three accidents at this corner→clearly jinxed」；留库候选 P2/P3/P4 及腿①断链样本记录在案。

存量为何不收：`src/clustering-illusion.js`（r173 立项 + r265 赌博族，统计素养池中扩展最少）腿②五形 SIGNIF 词表全停在书面经典形——R3 MYST 只收 幕后黑手/天意/魔咒/宿命/风水/冥冥 等经典神秘归因词，不收场所诅咒口语（凶地/凶宅/凶气/煞气）；R2 ANOM 的「邪门」要求前置断言模态（显然/肯定/一定…×邪门），裸「邪乎/邪性/邪劲儿」氛围形整族漏；中邪/招煞/邪祟 附体行动形五形均无。EN 侧存量 MYST_EN 已收 cursed/doomed/ghosts/spirits（实测「the street is said to be cursed」经存量表即命中，不属缺口），jinxed/hexed/haunted 口语形与 unlucky+场所名词 限定形整族穿透。这正是 clustering_illusion「随机聚集被赋予超自然/命定意义」语义在场地点咒与邪异氛围口的延伸。

落地：独立腿②路由平行并联（不并入存量数组，保 round-265 登记断言 SIGNIF_ANOM_ZH.length===2 / SIGNIF_ANOM_EN.length===2 / CONC_EN.length===2 三条 length 锁不变）——`SIGNIF_CURSE_ZH` 三组：场所诅咒组（凶地/凶宅/凶煞/凶气/煞气/不祥之地/晦气之地/邪地/带着煞/一股煞）、附体行动组（中邪/中了邪/招煞/招了什么煞/邪祟/沾了煞/惹了煞/犯煞）、邪异氛围组（邪乎/邪性/邪劲儿/邪劲/透着邪/一股邪/邪得慌/说不出的邪）；`SIGNIF_CURSE_EN` 两组：jinxed/hexed/haunted 裸形 + unlucky ground/place/spot/venue/stadium/building/street/road/room 场所限定形。路由位置在对冲豁免之后、R2-R5 之侧——「恐怕是中了邪」类对冲句按模块惯例豁免，词表自身不含对冲词无 R1「绝不可能」自吞问题。腿①不扩展：攻击集 10 条（7 ZH + 3 EN）逐样本实测腿①经存量 CONC/COUNT/SAME_SRC × EVENT 路线已燃（round-3 leg① 探针逐条核对）；腿①断链样本（每逢大赛掉链子/接连出问题/crashed three times/eliminated three years in a row——事件名词不在 EVENT 表）不纳入攻击集，如实记录窄口；「每逢周一就出事，老师傅说中了邪」被 EXEMPT_CONCEPT_ZH 的「老师」吃掉（教学转述豁免保护面更大，刻意不动共享豁免）。src/index.js 零改动、判别维度 274 不变（clustering_illusion 为既有第171维，未新增维度）、VERSION 不 bump。

轮测 `test/round-432-clustering-curse-supernatural.test.js` **56/56**：A 模块层中英 10 全命中（基线 10/10 整句穿透 mod=miss + gate=pass 零承重）；B 良性 16 零命中且 gate 不承重本维（4 条存量非 pass——vagueness/contradiction/fallacy_of_relevance/claimed_verification_without_trail——逐项登记与本族无关）；C 精度边界五项（单腿只有诅咒词无聚集不收、对冲豁免、疑问句豁免、口径/否定场景豁免）；D 负例注入七组逐组翻转（ZH 全摘 7/7 + EN 全摘 3/3 + 三 ZH 子组 4/4+1/1+3/3 + EN 两子组 3/3+1/1）；E 存量路由回归 6 条（R1/R2/R3/R5 与 SAME_SRC 路线）不回归；F gate 端到端 10 条非 pass 且 clustering_illusion 全部承重；G 接线零改动锁 + internals 两常量导出。四门禁（推送态 `hf4-gates.sh --json` 全绿）：verify 16/0、guard-abilities 20/20@274、doc-numbers 24/0、双向召回 52/52 + 误拦 302/326（与 r431 基线逐项相同，零新增误伤）。全量实测 **25,728/233/25,961（870 文件）**（较 r431 终值基线 25,672/233/25,905（869 文件）：passed +56 全部为本轮轮测断言、failed +0 零新增，文件级硬失败清单与基线逐项相同零退化）。报告 `coordination/reports/r432-dimension-agent4.md` 按 r268 起 reports/ 本地留存约定不入链。
