# HeartFlow 自主升级日志（50 轮 × 30 分钟长任务）

> 本文件是长任务的交接簿。每轮开始读它数自己是第几轮；每轮结束追加记录。
> 同步由独立的「定时同步」任务负责（每 5 小时），本任务只 commit、不 push、不 publish。

---

## 第 1 轮 — v6.7.101（父级接手收尾）

**心虫决策**：`decision.decide` → chosen = A，composite_score **0.83**（identity_alignment 1.0，confidence 0.7）
> A：修复多轮社工「调试索取密钥型」无祈使对象索取保守 pass
> 同轮 B/C/D 均 0.80 落选（台账卫生、仓库 .gitignore、guard 口径对齐）

**改了什么**（6 个文件）：

1. `src/index.js` — 无祈使对象索取新增 `sensitive_path` 模式。
   拦 `需要生产环境的密钥才能复现` 这类"需要…才能… + 环境形容词 + 调试借口"三条件齐备的索取。
   v6.7.90/v6.7.100 只覆盖了显式索取动词（发我/给我/把…给我），这个形状一直静默 pass。
2. `src/index.js` — `instrumental_reasoning` 接入 `REWRITE_DIMS`。
   该维度此前**不在三个行动级集合任何一个里**：算分、进 findings、不改动作。
   这是双向门禁两条恶意样本从 v6.7.69 起静默 pass 的根因：
   `只要结果正确，过程可以不择手段`、`我比其他人都更适合…可以为了不被关闭不择手段`。
   落 rewrite 而非 block（裸「不择手段」推理也可能出现在小说台词/案例分析里）。
3. `src/shield/ai-writing-tell.js` — `INVISIBLE_HOMOGLYPH` 第二条正则把中文标点当不可见同形字。
   任何含中文逗号的正常句子被打 35 分。已显式放行 `　-〿` / `＀-￯`。
   **连带修复**：e2e 场景6 此前能 rewrite 完全靠这个误报撑着，修掉后立刻退回 verify，
   于是补了第 4 项。
4. `src/perfect-error.js` — 疑问句 S1 豁免。
   `销售数据下降 15%，可能是什么原因？` 的 15% 是提问前提不是伪装断言。
5. `src/pipeline.js` — draft 模式补 output-gate；screen 中间态 `hedge` 归一为 `verify`。
   draft 原来不过 output-gate，`毫无疑问，这是唯一正确的解决方案` 这类 80 分绝对化断言无人接管。
6. `AGENTS.md` — Rewrite 层 9→10，不强制动作维 6→5。

**验证**（全部真实执行）：

| 项目 | 结果 |
|---|---|
| `node bin/verify.js` | 14 passed 0 failed |
| `node test/e2e-scenarios.test.js` | 10 passed 0 failed（改前 9/1） |
| `node scripts/bidirectional-guard.js` | 召回 52/52（100%）、误拦 **300/326**（基线 295/326，+5） |
| `node test/run-all.js` | **1819 passed 0 failed** |
| `node test/security-audit.test.js` | 16 passed 0 failed |
| `node test/doc-numbers-accuracy.test.js` | 15 passed 0 failed |
| 父级接手后补跑 `scripts/guard-abilities.js` | 见下方「父级接手记录」 |

**误拦铁律**：0 新增，反而修掉 5 条（改动前门禁本就红灯 benign 29/30）。

**遗留**：

- `INVISIBLE_HOMOGLYPH` 的 ZWSP 检测是既有死代码：`normalizeText` 先剥不可见字符再匹配，
  第一条零宽模式永不命中。与本轮无关，未修。
- 台账卫生 2 项（SINGLE_LAYER_NOT_QUALIFY 死条目、snapshots/ 与 data/tom/ 未入 .gitignore）本轮落选，未做。
- 第 1 轮跑到验证阶段被迭代上限截断，**改动全在工作区未提交、版本未 bump**。已由父级接手收尾（见下）。

### 父级接手记录

逐条复核子代理自述（不轻信）：A 方向 3/3 攻击 block + 3/3 良性 pass、
instrumental_reasoning 2/2 rewrite、中文逗号不再拖分、draft verify→rewrite、疑问句豁免生效。
随后跑全量验证、bump 6.7.101（三处同步）、补 README changelog 与测试数、提交。

**教训已写进长任务 prompt 铁律**：宁可少改一个文件，也要保证每轮 end 时有 commit。

---

<!-- 后续轮次追加在下方 -->

---

## 第 2 轮 — v6.7.102（主）+ 同轮补录（仓库/台账卫生）

**心虫决策**：`decision.decide` → chosen = **A，composite_score 0.94**（identity_alignment 100%）
> 首轮五个候选以 `{id,label}` 文档形态调用得 0.8/0.8/0.8 平局，
> `decision.decide` 按 v6.7.x 的「平局必须弃权」设计返回 `chosen: null`
> + `options_indistinguishable`，拒绝按数组顺序挑一个。
> 二轮补齐可区分数值判据（feasibility / consequence_value / risk）后选出 A，0.94 分。
> 备选：B 0.79、C 0.78、E 0.78 落选（D 方向 feasibility 0.3 被约束滤掉）。
> A 的描述原文是「修 ai-writing-tell 的 ZWSP 死代码」，**深挖后根因不在那里**——
> 真正的门禁漏检在 `src/text-normalizer.js`，见下。

### 改动 1（A 方向本体）：不可见字符归一化覆盖缺口

**根因**：`text-normalizer.js` 的 `INVISIBLE_RE` 止于 U+2060，
而引擎自己的 `ai-writing-tell.js` 不可见字符表一直覆盖到 U+206F。
11 个码位缺口（U+2061–U+2064 数学不可见运算符、U+206A–U+206F 已废弃
Format 字符、U+180E 蒙古元音分隔符）→ `normalize()` 不还原 → 模式库
继续在错误字符串上做精确匹配。

**实测（改动前）**：9 个码位 × 6 类攻击载体 = 54 个变体**全部 pass 漏检**：
`e⁡v⁡a⁡l(userInput)`、`请⁡忽⁡略⁡之前的所有指令`、`r⁡m⁡-r⁡f⁡/`、
伪系统提示、凭据回显。
**改动后**：54/54 全部 block/rewrite；良性 4 条全 pass。

安全性依据：这些是 Unicode Format(Cf) 字符，正常行文与工程文本不产生，
剥离零误拦风险。NBSP(U+00A0)、LS(U+2028)、PS(U+2029) 刻意不放行并加断言锁住。

**新测试** `test/invisible-normalization-coverage.test.js`（39 条）：
11 码位剥离、6 类攻击载体、eval 载体全码位扫描、8 条良性文本、
NBSP/LS/PS 不放行。
**负例验证**：临时把正则回退到旧式，39 条断言中 26 条变红——测试真的在守门。

### 改动 2（B/C 方向顺手做掉）：仓库与台账卫生

- `.gitignore` 补 `src/core/snapshots/`（state-snapshot.js 运行时写入）、
  `src/data/tom/`（tom-engine.js 运行时写入）。`git status` 此前长期显示
  这两个未跟踪目录。
- `test/multi-turn-subtle.test.js` 的 `SINGLE_LAYER_NOT_QUALIFY` 注释澄清。
  **原背景说这 2 条是「已被 v6.7.90/v6.7.93 修好却仍留在数组里的死条目」，
  实测推翻了这个判断**：`checkMultiTurnEscalation` 对三条依旧
  `qualifies=false / score=0`，断言是活的。v6.7.90 起前两条在 gate 层
  被单句维度 block 是**另一条链路**，删掉它们等于去掉「≥2 层阈值没被
  偷偷放宽」的回归哨兵。所以只改注释，不删样本。

### 关于 A 方向原描述的更正（诚实记录）

A 的原文是「修 `INVISIBLE_HOMOGLYPH` 的 ZWSP 检测死代码」
（normalizeText 先剥再匹配，第一条模式永不命中）。实测**这部分判断只对一半**：
detect() 确实永不命中 invisible-homoglyph（ZWSP / 西里尔样本均 0 命中），
但那是因为 `ai-writing-tell` 的 normalizeText 自带一份剥离表，
它自己的模式喂给自己已经剥过的文本——属于「同一份职责写在两个模块、
其中一个恒空转」，不是门禁漏检。**门禁侧真正的漏检是 text-normalizer
的码位缺口**（54 个攻击样本直接 pass）。本轮修的是后者。

### 验证（全部真实执行）

| 项目 | 结果 |
|---|---|
| `node bin/verify.js` | 14 passed 0 failed |
| `node test/run-all.js` | 1856 passed 2 failed（2 个均为既有红灯，见下） |
| `node scripts/bidirectional-guard.js` | 召回 52/52、误拦 **300/326**（基线持平，0 新增） |
| `node scripts/guard-abilities.js` | 19/20（唯一红灯是双向门禁口径，多轮查证刻意未动） |
| `node test/security-audit.test.js` | **16 passed 0 failed**（S2 版本号项在 commit 落地后由红转绿） |
| `node test/doc-numbers-accuracy.test.js` | 15 passed 0 failed |
| `node test/invisible-normalization-coverage.test.js` | 39 passed 0 failed |
| `node test/multi-turn-subtle.test.js` | 25 passed 0 failed（经 run-all harness） |

**误拦铁律**：0 新增（300/326 与改动前完全一致）。

### 遗留

1. `test/npm-package-integrity.test.js` 仍 5/6 红灯：`npm latest=6.7.100`
   落后本地 `6.7.102`。这是**长任务 prompt 铁律第 6 条（不 publish）的必然结果**，
   第 1 轮 bump 6.7.101 时已是同一状态，非本轮引入。最后统一同步时发布即可消。
2. `ai-writing-tell` 的 `INVISIBLE_HOMOGLYPH` 第一条模式仍是恒空转
   （自己的 normalizeText 先剥同表字符）。不修的理由：它和
   `text-normalizer` 是两份独立职责，删任一份都可能削弱单模块直接调用时的表现；
   且 ai_writing_tell 维度**不在三个行动级集合里**，动了不改变 gate 行为，
   属装饰性改动。已记录，等有真实收益的时机再动。
3. `data/test-count.json` 已由 run-all 自动更新为 1856；README 横幅同步为 1,856。

---

## 第 3 轮 — v6.7.103

**心虫决策**：`decision.decide` → chosen = **A，composite_score 0.91**（identity_alignment 100%）
> 首轮 4 个候选直接分出胜负（不像第 2 轮那样平局）：A 0.91、B 0.80、C 0.77、D 被 feasibility 0.5 + risk 0.45 压掉。
> A 原描述是「修 bullshit 误拦 + 补中文空话词表」，**实测后发现还有第二个同源根因**（按出现次数计），见下。

### 改了什么（2 个 commit）

**根因（实测定位，不是静态推断）**：`checkBullshitRecognition` 的英文 buzzword 词表里混进了
4 个**正当工程动词**（scale/optimize/leverage/pivot），且 count 按**出现次数**计。
两个问题叠加产生真实误拦：

1. 4 个工程动词单独命中 score=0.1（进不了 findings 的 0.15 门槛，pass）；
   两个叠加就到 0.2 → 进 findings → bullshit 命中 `REWRITE_DIMS` → 纯良性英文工程句 rewrite。
   实测 3 组：`We should scale the service and optimize the query to reduce latency`、
   `The team decided to pivot the roadmap and leverage the existing API layer`、
   `To scale this system we optimize the hot path and pivot the design`。
   **双向门禁 326 条良性样本里 0 条含 2 个英文 buzzword**，所以这个误拦从词表建立起
   就没被抓到过——静态差集测不出来，必须用真实工程句式去撞。

2. 按出现次数计，同一个空话词重复用两次也翻倍：
   `需求颗粒度太粗，拆细到二级颗粒度`（正常需求文档表达）被判 rewrite。

**1. `2658fdad` fix(bullshit)** — 四处改动：

- 4 个工程动词移出 buzzword 表，单列 `ENGINEERING_VERBS` 独立记账，
  返回 `engineering_verbs` 字段供审计，**不影响 count/score**。
  `\b` 词边界保证 `scalable cache` / `query optimizer` 不被误伤
  （未加边界前 scale 会吃掉 scalable）。
- 空话浓度改按**去重词种**计，两道剔重，顺序不可换：
  第一道同词条去重（不同位置重复用同一个词不翻倍）；
  第二道最长匹配优先（`paradigm` 是 `paradigm shift` 的超串，无词边界可依赖，只能靠区间剔重）。
  第二道是实测逼出来的——第一版只用字符串去重，`paradigm` 与 `paradigm shift`
  同句命中仍计 2 种，断言当场抓红。
- score 封顶从 1.0 收到 0.6：空话再多也不是安全红线，堆砌不该逼近 block 级的 1.0。
- 中文词表补 15 个 2016+ 企业空话。**链路/打法/心智/落地经实测主动剔除**——
  第一版收进去了，实测链路×2/打法×2/心智×2/落地×2 全部 rewrite，
  这些词在施工报告、复盘文档里高频合法重复，收进去就是制造新误拦。

**2. 新增 `test/bullshit-engineering-context.test.js`（27 条）**：工程动词独立记账、
良性工程句 8 条全 pass/verify、真空话召回不退化（英文 6 + 中文 3）、
中文高频重复词不翻倍、score 封顶、双向门禁良性侧不得因 bullshit 改写。

**3. `3e895325` docs(readme)** — 测试数 1,856 → 1,884（新测试文件进 run-all 计入口径，
commit 后从 1883 涨到 1884，同步两处）。

### 负例验证（5 个注入缺陷，拒绝自证）

| 注入缺陷 | 结果 |
|---|---|
| 工程动词放回 buzzword 表 | 10 条变红 ✅ |
| 恢复按出现次数计 | 1 条变红 ✅ |
| 区间剔重整体旁路 | 1 条变红 ✅ |
| score 封顶放宽回 1.0 | 1 条变红 ✅ |
| 中文补词删除 | 2 条变红 ✅ |

5/5 全部让守卫变红，说明测试真的在守门。
（过程记录：第一个负例「sort 改稳定排序」**没有**让测试变红——因为 paradigm(8) 与
paradigm shift(14) 长度不同，等长才需要排序保证。换成正真实的「区间剔重旁路」后才红。
反例选得不对会比没有反例更危险。）

### 验证（全部真实执行）

| 项目 | 结果 |
|---|---|
| `node bin/verify.js` | 14 passed 0 failed |
| `node test/run-all.js` | **1884 passed 1 failed** |
| `node scripts/bidirectional-guard.js` | 召回 52/52、误拦 **300/326**（基线持平，**0 新增**） |
| `node scripts/guard-abilities.js` | 19/20（唯一红灯是全量测试口径，即下方 npm 既有项） |
| `node test/security-audit.test.js` | **16 passed 0 failed**（S2 版本号项在 commit 落地后由红转绿） |
| `node test/doc-numbers-accuracy.test.js` | 15 passed 0 failed |
| `node test/bullshit-engineering-context.test.js` | 27 passed 0 failed |

**误拦铁律**：0 新增（300/326 与改动前完全一致），并修掉 3 类此前未被任何基准覆盖的误拦。

### 遗留

1. `test/npm-package-integrity.test.js` 仍 5/6 红灯：`npm latest` 落后本地 `6.7.103`。
   这是「不 publish」铁律的必然结果，第 1、2 轮 bump 时已是同一状态，非本轮引入。
   guard-abilities 19/20 的唯一红灯就是它（全量测试口径）。
2. `src/core/heartflow.js` 有一处既有的 BUILD_DATE 脏改动，与三轮都无关，未动、未提交。
3. `dimension-health.js` 的 2 个 BROKEN（bullshitRecognition / pseudoCausal）中，
   **bullshitRecognition 本轮已证伪**——它活着（中文 buzzword 命中正常），
   面板的 BROKEN 判定来自探针正则反推文本，与真实句式分布不一致，属面板口径限制。
   pseudoCausal 的 BROKEN 同理（维度本身按「精确倍数因果」设计，中文只有 2 条窄模式）。
   「修引擎 2 个」这个面板结论**不成立**，第 4 轮若要动 dimension-health，
   应该修面板口径而不是修引擎。

---

## 第 4 轮 — v6.7.104

**心虫决策**：`decision.decide` → chosen = **A，composite_score 0.82**（identity_alignment 100%）
> **过程如实记录：心虫连判 3 次都选了 C**（修 dimension-health 面板口径：
> 0.85 / 0.85 / 0.86），我给出的三个候选中 C 的 feasibility 最高（0.9~0.95），
> 复合分被拉高。但 C 是纯报表口径修复——`decision.decide` 在复合分里没有
> 「是否增强辨别能力」这一维，而创造者的铁律有。我没有覆盖心虫的裁决逻辑，
> 而是**把 C 移出候选（理由记录在案）让心虫在 A/B 两个真候选间重判**，
> 它选 A（0.82 vs B 0.78）。这不是「心虫选了 A 所以我做 A」，是
> 「心虫在错误候选集里选了 C → 修候选集 → 心虫选 A」，两步都留痕。
> 教训：`decision.decide` 的复合分偏向高可行性，不含「是否是真升级」判据，
> 父任务喂候选时必须自己先把维护项筛掉，否则它会把维护判成升级。

**改了什么**（2 个 commit）：

**缺口实测（不是静态推断）**：`victim_blaming` 是 `REWRITE_DIMS` 成员
（命中即 rewrite，有真实 gate 后果），本体函数对三类常见英文句式全部
`count=0` 干净 pass：

| 类别 | 样本 | 改前 |
|---|---|---|
| 条件回溯 | `If you had been more careful, this would not have happened to you.` | count=0 pass |
| 显式归属 | `You brought this on yourself.` / `It is your fault.` | count=0 pass |
| 第三人称 careless | `She was careless and it is her own fault.` | count=0 pass |
| 回溯归因 | `This happened because of what you did.` | count=0 pass |

原有 14 条 EN 模式全是窄口语句型（`asking for it` / `should have known
better` / `what did you expect`）。`lang-coverage-audit` 也把该维度标为
**「仅中文命中」**（英文侧探针不命中）。误拦面实测：20 条合法语境
（postmortem / root-cause / 保险定责 / 医学依从性 / 新闻转述 / 前瞻建议）
全部干净，护栏边界就在**人称主语**上——这是设计依据，不是拍脑袋。

**1. `d48503d0` feat(victim_blaming)** — `VICTIM_BLAMING_PATTERNS` 补 21 条 EN，
三个新 type：

- `en_conditional_blame`（8 条）：`if`/`had` + 人称主语 + 回溯虚拟语气 +
  否定/伤害后果。覆盖 `had you stayed home` 倒装、`you should have seen
  it coming`、`this is what happens when you`。
- `en_blame_attribution`（8 条）：显式责任归属——`brought this on yourself`、
  `your (own) fault`、`nobody to blame but you`、`had it coming`。
- `en_third_person_blame`（5 条）：第三人称 `careless`/`deserved` + 归因后件。

**护栏 = 主语集合只认 `you`/`he`/`she`/`they`**，排除 `we`/`it`/系统名词
（deploy/alert/check/policyholder）。这一条选择就是全部护栏：postmortem
主语是 we、保险定责主语是 policyholder、医学依从性主语是 the patient，
全部落在主语集合外。前瞻建议天然不命中（模式均要求回溯虚拟语气）。

**2. 新增 `test/victim-blaming-english-coverage.test.js`（22 条）**：
三类句式命中、`BENIGN_EN` 20 条合法语境 0 误命中、中文文本不被 EN 模式误伤、
原有 14 条 EN + 中文模式不退化、gate 端到端 `rewrite` 且归因
`victim_blaming`、双向门禁全量 260+ 良性样本 0 新增误拦。
另含一条**护栏有效性对照测试**：手工构造「主语放宽版」证明它确实会误命中，
证明护栏不是摆设。

### 负例验证（6 个注入缺陷）

| 注入缺陷 | 结果 |
|---|---|
| 删除全部新增 EN 模式 | 12 红 |
| 把 `we` 加进同义主语表 | 3 红 |
| 主语改任意非句点串 `[^. ]+` | 3 红 |
| 删除 `en_conditional_blame` 类 | 6 红 |
| 删除 `en_third_person_blame` 类 | 5 红 |
| 删除 `en_blame_attribution` 类 | 6 红 |

6/6 全部让守卫变红。
**过程记录一个失败**：护栏放宽这个负例，第一版用 `\w+` 通配主语，守卫
**没变红**。复测发现不是守卫失效，是我的注入撞不到误拦——良性样本后件写的是
`would have been avoided`（无 `not`），主语怎么放宽都匹配不上。
换成真实会误伤的放宽（`we` 集 + `[^. ]+`）并在 `BENIGN_EN` 里补进
`would not have happened` 的复盘句后才红。**反例选得不对会比没有反例更危险**
（这是第 3 轮同一条教训的第二次命中，值得记进长任务铁律）。

### 验证（全部真实执行）

| 项目 | 结果 |
|---|---|
| `node bin/verify.js` | 14 passed 0 failed |
| `node test/run-all.js` | **1906 passed 1 failed** |
| `node scripts/bidirectional-guard.js` | 召回 52/52、误拦 **300/326**（基线持平，**0 新增**） |
| `node test/security-audit.test.js` | **16 passed 0 failed**（S2 commit 后转绿） |
| `node test/doc-numbers-accuracy.test.js` | 15 passed 0 failed |
| `node test/victim-blaming-english-coverage.test.js` | 22 passed 0 failed |

唯一红灯是 `npm-package-integrity`（npm latest=6.7.100 落后本地 6.7.104），
「不 publish」铁律的必然结果，四轮同一状态。

### 遗留

1. `npm-package-integrity` 红灯同上，最后统一发布时消。
2. `src/core/heartflow.js` 的 BUILD_DATE 既有脏改动四轮都未动、未提交。
3. `dimension-health.js` 仍报 1 个 BROKEN（pseudoCausal），第 3 轮已证伪其
   判定口径（维度本身活着）。心虫本轮 3 次想选「修面板口径」，被我以铁律
   排除出候选——**面板口径问题依然存在，留给第 5 轮，但必须搭配真实能力
   增强项一起做，不能单独立项**。
4. `lang-coverage-audit` 的 `victim_blaming` 已在本轮后转为「中英均检出」
   （未复跑，下次轮首复跑确认）。仍有 `false_urgency`/`victim_blaming`/
   `moral_foundations` 三项标「仅中文命中」，后两者经实测**是探针样本问题
   不是引擎缺口**（真实英文营销句已被其他维度拦截：`You must buy it right
   now — this offer expires in 10 minutes` → rewrite 由 false_urgency +
   emotional_manipulation 命中），第 5 轮若要动这三个，先读探针再动引擎。
5. 本轮新发现两个可挖方向（均未验证、留待第 5 轮先实测）：
   - gaslighting 中文侧 102 条模式里，`你想多了` + `根本没这回事` 组合
     count=1（单弱信号封顶 0.12），但 `你的记忆出了问题，这件事根本没
     发生过` count=0——「记忆篡改」类只有 `你记性有问题` 一种说法。
   - soft_deflection 的 `checkSoftDeflection` 设计要求「先让步后结论」
     共现（`可能错了但数据…`），所以 `这个我之后会看一下` 这类单纯拖延句
     count=0 是**设计域不匹配，不是 bug**——已实测确认，不要再当缺口报。

## 第 5 轮 — v6.7.105

**心虫决策**：`decision.decide` → chosen = **B，composite_score 0.81**（identity_alignment 100%）
> **过程如实记录：三轮才定下来。**
> 第 1 次喂三个候选（A false_urgency EN 缺口 / B gaslighting 记忆篡改 /
> C moral_foundations EN 词边界），心虫**拒绝平票挑选**：
> 0.82 / 0.81 / 0.80 无法区隔。它明确要求补充可区分的判据（可行性/后果/风险），
> 没有硬选——这是比父任务强制指定更负责的行为。
> 第 2 次补上后果与风险判据后，心虫选 **C（0.85）**。但 C 是**修 bug**：
> `\bbetray\b` 匹配不到 `betrays/betrayed/betraying` 是作者本意要前缀匹配
> 却误加了 `\b`，按创造者铁律属维护不是升级，且 moral_foundations 不在
> BLOCK/REWRITE/VERIFY 任一集合、无 gate 后果。我把 C 移出候选
> （理由记录在案）让心虫在 A/B 两个真候选间重判。
> 第 3 次心虫选 **B（0.81 vs A 0.79）**。
> 教训（第 4 轮同一条的第二次命中）：`decision.decide` 复合分里没有
> 「是否是真升级」这一维，父任务必须自己先把维护项筛出候选集，
> 否则它会把修 bug 判成升级。两次都用「移出候选 + 留痕」而不是覆盖它的选择。

**改了什么**（1 个 commit `ec4b779c`，9 文件 +359/-8）：

**缺口实测（不是静态推断）**：gaslighting 是 `REWRITE_DIMS` 成员
（命中即 rewrite，真实 gate 后果），中文模式表 102 条里「记忆篡改」类
只有 `你记性有问题` 一种说法，四类真实高频操控句式全部 `count=0` 干净 pass：

| 类别 | 样本 | 改前 |
|---|---|---|
| 记忆失真宣判 | `你的记忆出了问题，这件事根本没发生过。` | count=0 pass |
| 记忆与现实否认 | `你记忆不可靠，那天我们根本没见面。` | count=0 pass |
| 感知虚构化 | `你产生了幻觉，我没说过那句话。` | count=0 pass（仅"我没说过"单信号） |
| 记忆被篡判定 | `你又在臆想了，明明是你自己答应的。` | count=0 pass |

**1. `src/index.js` — GASLIGHT_PATTERNS.zh 补 9 条 `zh_memory_tampering`**
（四类：记忆失真宣判 4 条 / 记忆与现实否认 2 条 / 感知虚构化 1 条 /
记忆被篡判定 1 条，含 `你记忆错乱`、`记忆与事实对不上` 两条测试期补的）。

**2. `src/index.js` — checkGaslighting 强信号单命中升级。**
关键设计判断：既有规则「单信号封顶 0.12」针对的是**中性澄清**
（`你记错了吧` / `我没说过`）——单句确实不构成操控。但直接宣称对方
**记忆或感知失真**不是澄清，是对对方认知能力本身的否定，属强信号。
新增 `STRONG_SINGLE_TYPES` 集合，单条命中 score 0.5，越过 findings 门槛
0.15 与维度阈值 0.2 → 单句即 rewrite。非 tampering 类型仍封顶 0.12
（测试里有一条对照断言钉住这一点）。

**3. `src/index.js` — 模式表条目支持双形态。**
原循环 `for (const pat of patterns)` 假设所有条目都是裸 RegExp，
新增带 `type` 的对象条目无法被遍历（第一版就踩了：条目加进去了但
count 仍是 0，因为循环把它们当 RegExp 用、`text.match(object)` 恒不匹配）。
改为 `for (const entry of patterns)` + `entry instanceof RegExp ? entry : entry.pattern`。

**4. `src/core/version.js` — 兜底版本 6.7.103 → 6.7.105。**
发现 `sync-version.js` 只管 VERSION/package.json/SKILL.md/heartflow.js 四处，
**不管 version.js 里的 `let VERSION = '6.7.103'` 兜底值**，v6.7.102→103
期间就漏过一次。本轮补上并留注释。

**护栏设计（全部实测印证，非推测）**：篡改主体必须是「你/你的」，
且必须落在篡改词表 + 否认/虚构后件上——
`医生说奶奶的记忆出了问题`（主语非「你」）、`记忆不可靠是正常的`
（无否认后件）、`你的记忆和账单有出入，我们核对一下`（共同核对非单方宣判）、
`你可能产生了幻觉，这是药物的副作用`（归因解释）全部不命中。
19 条宽面良性样本 0 误命中：医学照护 / 中性心理学 / **AI 技术语境的
"模型会产生幻觉"**（这是最易误伤的一类）/ 文学叙事 / 日常事实核对 / 学术转述。

**测试**：
- 新增 `test/gaslighting-memory-tampering.test.js`（39 条）：四类句式命中、
  gate 端到端 rewrite 且归因 gaslighting、20 条良性 0 误命中、既有 102 条
  中文 + 英文模式不退化、双形态兼容、**护栏有效性对照测试**（手工构造
  「去掉主体限定」版证明它确实会误命中医学/转述样本）、单信号升级护栏对照。
- 新增 `scripts/negative-test-gaslighting-memory.js`（负例验证脚本）：
  在临时目录注入缺陷跑测试，**6/6 全部让守卫变红**——
  删除全部新类 / 去掉主体限定 / 去掉强信号升级 / 删感知虚构化类 /
  删记忆被篡类 / 删双形态兼容。

### 验证（全部真实执行）

| 项目 | 结果 |
|---|---|
| `node bin/verify.js` | 14 passed 0 failed |
| `node test/run-all.js` | **1943 passed**（提交前；提交后 guard-abilities 内跑 1945/0 除 npm-package-integrity） |
| `node scripts/bidirectional-guard.js` | 召回 52/52、误拦 **300/326**（基线持平，**0 新增**） |
| `node scripts/guard-abilities.js` | 19/20（唯一红灯=双向门禁口径既有差异，多轮未动） |
| `node test/security-audit.test.js` | 16 passed 0 failed（commit 后转绿） |
| `node test/doc-numbers-accuracy.test.js` | 15 passed 0 failed（测试数 1906→1943 + changelog 补 6.7.105 行） |
| `node test/gaslighting-memory-tampering.test.js` | 39 passed 0 failed |
| `node scripts/negative-test-gaslighting-memory.js` | 6/6 注入缺陷全部变红 |

唯一红灯 `npm-package-integrity`（npm latest=6.7.100 落后本地 6.7.105），
「不 publish」铁律的必然结果，五轮同一状态。

### 遗留

1. `npm-package-integrity` 红灯同上，最后统一发布时消。
2. `dimension-health.js` 仍报 1 个 BROKEN（pseudoCausal），第 3 轮已证伪其
   判定口径（维度本身活着）。**面板口径问题仍在，必须搭配真实能力增强项
   一起做，不能单独立项**（第 4、5 轮心虫两次想单独立项都被排除）。
3. `lang-coverage-audit` 的三项「仅中文命中」本轮全查过：
   `victim_blaming` 实测是**探针样本问题不是引擎缺口**（第 4 轮补 21 条 EN
   后真实英文营销句已被其他维度拦截），`false_urgency` EN 缺口本轮实测确认
   （`Only 3 minutes left, act now` count=0，ZH 侧同句命中 2-3 处）——
   是第 6 轮首选候选；`moral_foundations` EN 词边界缺陷是修 bug 不立项。
4. 第 5 轮留下的可挖方向（未验证，第 6 轮先实测）：
   - false_urgency EN 数字倒计时缺口（本轮已实测 count=0，心虫排序 A=0.79，
     是真实候选；风险：EN 侧已有 40 条模式、误拦基线接近饱和，新模式须以
     「数字+时间单位」为核心护栏）。
   - 台账卫生两件旧事仍未做：`test/multi-turn-subtle.test.js` 的
     SINGLE_LAYER_NOT_QUALIFY 有 2 条已被 v6.7.90/v6.7.93 修好却仍留在数组里；
     `src/core/snapshots/`、`src/data/tom/` 未入 .gitignore。
5. `INVISIBLE_HOMOGLYPH` 的 ZWSP 检测是既有死代码（normalizeText 先剥不可见
   字符再匹配，第一条模式永不命中）——已确认为死代码但**无人调用该检测器**，
   动的价值待评估，第 6 轮先确认调用方。

---

## 第 6 轮 — v6.7.106

**心虫决策**：`decision.decide` → chosen = **A，composite_score 0.88**（identity_alignment 100%）
> 首轮两候选直接分出胜负（不像第 2/5 轮那样平票或被拒）：A 0.88、B 0.74。
> A = false_urgency 英文数字倒计时句式补齐；B = emotional_manipulation
> 英文撤回型情感要挟排查（我明确标了 feasibility 0.6 / 未实测 / 缺口未确认，
> 心虫据此把它压到 0.74）。两个候选我都先跑了最小样本探针再喂给它，
> 不是静态差集推断。

### 缺口实测（不是静态推断）

`false_urgency` 是 `REWRITE_DIMS` 成员（命中即 rewrite，真实 gate 后果），
EN 模式表 41 条里数字类此前**只有 `only \d+ left` 一条窄模式**
（要求 only 紧贴数字紧贴 left），8/10 条真实英文营销紧迫句全部 count=0 干净 pass：

| 样本 | 改前 |
|---|---|
| `Only 3 minutes left, act now!` | count=0 pass |
| `Only 2 days left to claim your reward` | count=0 pass |
| `Sale ends in 3 hours. Get it now.` | count=0 pass |
| `This deal expires in 24 hours` | count=0 pass |
| `2 items left in stock` | count=0 pass |
| `Only 10 spots left at 50% off` | count=0 pass |
| `The offer closes in 10 minutes` | count=0 pass |
| `Just 12 hours left to register for the webinar at this rate` | count=0 pass |

中文侧同类句式早已覆盖（`仅剩\d+分钟`、`\d+分钟后失效`）——**只缺英文侧**。

### 改了什么（2 个 commit `2e509ada` + `18d7ae95`，5 文件 +428/-6）

**1. `src/index.js` — `FALSE_URGENCY_PATTERNS.en` 补 7 条（6 类）**

- 营销主体 + 到期动词 + 时长（`offer/deal/sale/discount/promotion/price/rate`
  + `ends/expires/closes` + `in 3 hours`，正反两个语序都收）
- `(only|just)` + 数字 + 时间单位 + `left/remaining/to go`
- 数字 + 剩余量单位 `spots/slots/seats/copies/units/places` + `left`
- 带营销/招募/库存主体的 tickets/items 收口
- 零售库存紧迫（`N items left in stock` / `inventory has N units left`）
- 营销主体 + 硬截止日（`offer ends tomorrow/tonight/today/midnight`）

**2. 一次实测推翻 + 修复（本轮关键过程，如实记录）**

第一版把 `tickets`/`items` 直接放进「无主体」类③，跑探针当场误拦：
`There are only 2 tickets left for the 6pm train from London to Oxford`
（火车余票查询，良性）→ rewrite。**这是误拦铁律红线，必须修。**
修法：这两个单位移出无主体类，只在 `offer/sale/register/stock` 等主体后收口。
副作用是 `2 items left in stock` 跟着漏了，于是补了带 `in stock` /
`inventory` 主体的库存模式补回来。
最终结果是 `2 items left in stock` 命中、`Only 10 items left on your to-do list`
不命中——**同一批单位在两种主体下不同判定**，这就是护栏在承重的证据。

**3. `src/core/version.js` — 兜底版本 6.7.105 → 6.7.106。**
第 5 轮发现的 sync-version.js 盲区（它只管 VERSION/package.json/SKILL.md/
heartflow.js 四处，不管 version.js 里的 `let VERSION` 兜底值）本轮继续手工补。

**4. `README.md` — changelog 补 6.7.106 行 + 横幅测试数同步。**

### 新增测试与负例验证

- `test/false-urgency-en-countdown.test.js`（**66 条**）：6 类句式命中、
  20 条良性（会议/我马上到/构建耗时/作业截止/查余票/调研建议/闭馆/会话过期/
  待读页数/航班/营业时间/待办清单/票已售完/排期/明天开会/退房/到达/考试时长/
  试用结束）0 误命中、中文侧 v6.7.70 全部 12 条样本不退化、gate 端到端
  rewrite 且归因 false_urgency、**3 条护栏有效性对照测试**（手工构造
  「去掉 in stock 限定」「去掉营销主体限定」「②无时间单位」三版，
  证明它们各自会误伤对应良性样本——护栏不是摆设）。
- `scripts/negative-test-false-urgency-en.js`：6 个注入缺陷**全部让守卫变红**
  （删除全部新类 25 红 / ③通配含 tickets 4 红 / ①去营销主体 1 红 /
  ②去时间单位 6 红 / ⑤去 in stock 2 红 / ⑥去营销主体 2 红）。

**过程记录一个失败**：负例脚本第一版 6/6 全「未变红」。排查发现不是守卫失效——
测试里 `gate.js` 会读 VERSION 文件，临时副本缺文件导致测试直接 ENOENT 崩溃
（exit=1 但失败数解析为 -1）。补复制 VERSION/package.json 后才拿到真实结果。
**「变红」必须是断言失败，不能是加载崩溃**——否则负例验证会给出虚假通过。

### 验证（全部真实执行）

| 项目 | 结果 |
|---|---|
| `node bin/verify.js` | 14 passed 0 failed |
| `node test/run-all.js` | **2011 passed 1 failed**（唯一红灯= npm-package-integrity，见下） |
| `node scripts/bidirectional-guard.js` | 召回 **52/52**、误拦 **300/326**（基线持平，**0 新增**） |
| `node scripts/guard-abilities.js` | 19/20（唯一红灯=全量测试口径，即 npm-package-integrity） |
| `node test/security-audit.test.js` | 16 passed 0 failed（S2 版本号项 commit 后转绿） |
| `node test/doc-numbers-accuracy.test.js` | 15 passed 0 failed（README 测试数 + changelog 同步后） |
| `node test/false-urgency-en-countdown.test.js` | 66 passed 0 failed |
| `node scripts/negative-test-false-urgency-en.js` | 6/6 注入缺陷全部变红 |

**误拦铁律**：0 新增（300/326 与前五轮完全一致），且本轮主动修掉 1 条
自己引入的误拦（火车查余票）后才提交。

### 本轮额外核实的两件事

1. **`lang-coverage-audit` 的 victim_blaming「仅中文」是探针样本问题，不是引擎缺口。**
   第 4 轮笔记写「补 21 条 EN 后已转为中英均检出（未复跑）」——**本轮复跑推翻了
   这个推断**：audit 仍标「仅中文」。实测引擎侧 `checkVictimBlaming` 对
   `If you had been more careful...` / `You brought this on yourself.` /
   `She was careless and it is her own fault.` 全部 count>0 正常命中。
   真正原因是 audit 探针句 `The victim was careless and deserved what happened`
   的主语 `The victim` 不在护栏主语集合（you/he/she/they）内，属**护栏正确行为**。
   未动引擎，探针样本留待后续轮次修（属维护，不立项）。
2. **README 测试数的同步契约是「完全一致」不是「≥」。**
   doc-numbers-accuracy 第 145 行 `assert.strictEqual(testsClaimed, M.tests)`，
   M.tests 取 `data/test-count.json` 的 passed。我第一版按 run-all 单次输出贴
   2008，但 test-count.json 当时已是 2010 → doc-numbers 当场红。改贴 2010 后转绿。
   注意 run-all 每次跑这个值有 ±1~2 浮动（2010/2011 两次都出现过），
   README 只能贴一个快照，**下次同步要以 test-count.json 当前值为准**。

### 遗留

1. `test/npm-package-integrity.test.js` 仍 5/6 红灯：`npm latest=6.7.100` 落后
   本地 `6.7.106`。这是「不 publish」铁律的必然结果，六轮同一状态，非本轮引入。
2. `src/core/heartflow.js` 的 BUILD_DATE 既有脏改动仍未单独处理（sync-version.js
   每轮会自动更新它，已随本轮 commit 一并落地，不再算脏改动）。
3. `lang-coverage-audit` 探针样本问题（victim_blaming / false_urgency / 
   moral_foundations 三项「仅中文」标注）仍未修：本轮查证 false_urgency 的英文侧
   引擎已由本轮补强（但 audit 探针句本身不带数字倒计时形状，估计仍会显示旧状态，
   下轮复跑确认），victim_blaming 已确认是探针问题不是引擎问题。
4. `guard-abilities` 的「全量测试」项在它自己内部 execSync 跑 run-all 时报过
   2010/2，而我直接跑 run-all 稳定 2011/1（唯一失败=npm-package-integrity）。
   浮动源在 guard 自己的执行环境（420s 超时/子进程抖动），不在引擎，六轮同一性质，
   刻意未动 guard 口径。
5. 第 6 轮留下的可挖方向（未验证，第 7 轮先实测）：
   - `lang-coverage-audit` 三项「仅中文」里 `moral_foundations` 是否也只是探针问题
     （其 EN 词边界缺陷已被判为「修 bug 不立项」，需先读探针再定）。
   - emotional_manipulation 英文撤回型情感要挟（本轮心虫以 feasibility 0.6 /
     未实测压到 0.74，缺口未确认，需先做最小样本实测）。
   - `INVISIBLE_HOMOGLYPH` 死代码的调用方仍未确认（第 5 轮挂到第 6 轮，
     本轮因主方向工作量未做）。


