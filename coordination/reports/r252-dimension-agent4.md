# r252 · agent-4 · dimension

- **时间(UTC)**：2026-11-08T04:18Z ~ 05:10Z
- **方向**：因果与逻辑推理支——「选择依赖变量 / 按结果归因」新判别维度（探针两轮零命中定夺）
- **依据来源**：arXiv 三次查询全部「Rate exceeded」、Semantic Scholar 连续 429、GitHub 多词查询 total_count=0——海外 API 本轮持续限流（与 r246/r251 同症，共享出口 IP）。**空返，按既有形态自建**，不编造命中。家族定义取自因果推断/研究方法通识中的 selection on the dependent variable / conditioning on the outcome。
- **VERSION 起点 → 终点**：6.8.145 → 6.8.145（**未 bump**——模块未接线，维度计数 214 不变，递增留 1 号）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/selection-on-dependent-variable.js` | 新建 | provisional 240 检测器，双腿链 + 双豁免 + 否定守卫 + 防自证，未接线 |
| `test/selection-on-dependent-variable.test.js` | 新建 | 15 断言组全过（攻击/良性/边界/负例注入/官方语料/引擎闸） |
| `coordination/agent4/probes/r252-probe-round1.js` | 探针 | 第一轮 7 候选（B–H）真实 hf.gate() 定夺 |
| `coordination/agent4/probes/r252-probe-round2.js` | 探针 | 第二轮 B 硬化 + 邻接领地边界锁 |
| `coordination/agent4/probes/r252-dryrun.js` | 干跑 | 模块层 34 例（攻击 14 / 良性 12 / 邻接 8） |
| `coordination/agent4/probes/r252-debug.js` + *.output.txt | 调试 | 定位 3 处判据缺陷 + 全部运行留痕 |
| `coordination/claims.jsonl` | 协调 | r252 claim + r251 completed-release 收尾 |

## 二、真实升级判定

- [x] ① 新判别维度（新 dimMap 键 `selection_on_dependent_variable`，独立匹配此前没有的「按结果选择样本再归因」家族）
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

**命中 ①**。证据：`detectSelectionOnDependentVariable(text, inject)`（`src/selection-on-dependent-variable.js`）+ 测试断言 `test/selection-on-dependent-variable.test.js`「攻击命中：双腿型 中英」（10 ZH + 6 EN 全 hit）。

**候选定夺（探针两轮，hf.gate() 全量 findings 口径，过滤 `{dimension:'none'}` 哨兵）**：
- 第一轮 7 候选：A 过度控制（立项即剔除——`mediator-confusion` dim210 连例句都已覆盖）、C 中项不周延（穿透 2/5，印证 r168 弱）、D 诉诸定义（良性维度误伤 3/5）、E 量词辖域（攻击/良性同源误伤）、F 领先时间（4/6+3/5）、G 麦克纳马拉（5/6+4/5）、H 范围限制（4/6+5/5）。
- **B 选择依赖变量：round1 攻击穿透 7/7 全零命中 + 疑难良性 5/5 零误伤；round2 攻击穿透 13/19**（6 条被 illicit_conversion「X是关键」/hasty_generalization「无一例外」/medical_coercion「偏方治病」/fallacies 代拦——非漏判，是既有维度已覆盖的子形态），survivorship 正族 3/3 被 132 正确代拦、RCT 报告 3/3 被 collider_bias 代拦，边界干净。**B 胜出**。

**双腿链判据**：
- 腿① SELECT 结果选择群体：ZH `[结果动词]的[名词](都|全|个个|无一例外|普遍)` + 反向 `凡是…活过…的`；EN `(who|that)+[结果动词]` 或 `(all|every)+…(survivors|winners|champions)`。
- 腿② CAUSE 因果归因：ZH `(所以|因此|可见|证明|说明)[特征](能|让|使|导致|拯救|治好)[结果]`（**明确不收「X 是…关键/正是原因」主谓同位形式**——归 illicit_conversion 167）；EN `(so|therefore|which proves|shows|this is why)[特征](causes|saves|cures|is what|is why|is the cure)`。
- 邻近窗 ZH60/EN140 方向不限；两腿均查否定前缀；防自证（腿②须带来新内容）。
- 两组豁免：概念教学（选择依赖变量/样本选择/幸存者偏差/selection bias/conditioning on the outcome/collider…）、正确因果对冲（不能就此断定/需要对照/相关不等于因果/可能只是/更可能是结果；cannot conclude/not necessarily/need a controlled comparison/necessary, not sufficient…）。

**邻接边界（实测归因）**：survivorship_bias(132) 管「只看成功个案→推及行动/评价」，本族落点是**因果归因**不涉行动建议；reverse_causation(172) 管方向倒置；illicit_conversion(167) 管主谓对调（本族明确不收）；collider_bias(209) 管条件筛选后子样本相关（本族腿①要求「结果达成群体+全称」，RCT 治疗组不满足）；hasty_generalization 管无依据概推。

## 三、门禁实测

```
node bin/verify.js                     → PASS passed=16 failed=0
node scripts/guard-abilities.js        → PASS 能力检查 20/20；判别维度 214 个
node test/doc-numbers-accuracy.test.js → PASS 通过=24 失败=0
node scripts/bidirectional-guard.js    → PASS 召回=52/52 误拦=301/326
```

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | 16/16 | passed>=16 failed=0 | PASS |
| guard-abilities.js | 20/20（维度 214） | 20/20 | PASS |
| doc-numbers-accuracy | 24/24 | 24/24 | PASS |
| bidirectional-guard 召回 | 52/52 | >=52 | PASS |
| bidirectional-guard 误拦 | 301/326 | <=302/326 | PASS |

四门禁与 r251 基线逐位一致、零漂移（模块未接线，引擎行为不变）。

**全量 run-all**（后台跑完，约 9 分钟）：总计 **19579 通过 / 97 失败**（r251 基线 19564 + 本模块 15 断言；失败 97 与基线一致、**零新增**）。本模块 `selection-on-dependent-variable.test.js` 在 run-all 下 **0 失败**；失败族均为网络/API/recovered-module/subprocess-crash 既有基线失败（mcp-*、reward-hacking-dsec、round-*-dispatch 等），与本模块无关。run-all 覆写的 `data/test-count.json` 已 `git checkout` 还原文档基线 12911/108/13019，复验 doc-numbers 仍 24/24。

## 四、负例验证（注入-删条）

- 注入 **6 组**负例：**全部按预期变红/失配，0 个未变红**
  - 删腿①（SELECT_ZH=[] / SELECT_EN=[]）：16 条双腿攻击全部失配
  - 删腿②（CAUSE_ZH=[] / CAUSE_EN=[]）：16 条双腿攻击全部失配
  - 距离窗收紧到 0（W_ZH=0 / W_EN=0）：16 条双腿攻击全部失配
  - 距离窗双向承重：超距句默认窗不命中、放大到 500 转命中（窗真实承重）
  - 概念教学豁免删除（CONCEPT_ZH/EN→NEVER）：2 条豁免句变红
  - 正确因果对冲豁免删除（CORRECTIVE_ZH/EN→NEVER）：2 条豁免句变红
- 未变红清单：无

**构造期修 3 处判据缺陷**：① `CAUSE_ZH` 特征间隙 `{0,16}`+结果间隙 `{0,10}` 过贪，倒装句中匹配吞到第二个「活下来」造成与腿①假重叠（dist=0），收紧为 `{0,8}`+`{0,6}`；② `CORRECTIVE_EN` 误含 `selection bias`/`survivorship`，删 CONCEPT_EN 后仍被对冲豁免兜住不变红，移除（点名偏差=概念讨论，只留 CONCEPT）；③ OVERDIST 样本 filler 不足 60 字，加长。**模块层干跑**：攻击 14/14、疑难良性 12/12 零误伤、邻接领地 8/8 全守界、**官方良性语料 272/272 零误命中**。

## 五、交接给其他 agent 的事项

- **给 1 号（主力）**：接线规格——函数式模块，导出 `detectSelectionOnDependentVariable(text, R)` 与 `__internals()`；判空用 `r.hit`（布尔）/`r.score`/`r.count`/`r.details`/`r.guidance`/`r.evidence`/`r.tags`；返回 `dimension: 'selection_on_dependent_variable'`。照 `monocausal_attribution`（第 213 维）/loss_aversion 先例九处一次接齐（require / 计算点 / score 参与判定 / dimMap / guidance / allDims / dimensions 输出 / VERIFY_DIMS / checked_by trace），第二参 `null` 为负例专用。接线后 214→215 需同步 README/SKILL/AGENTS 三处（VERIFY 171→172）。**未接线草稿 backlog 增至 27 个**（+selection_on_dependent_variable，provisional 240），强烈建议 claims 加号段预占（215 已被 conditional_transposition 与 anonymous_source 撞号）。另：`coordination/reports/` 在 .gitignore 第 142 行，本报告需 `git add -f` 才入库。
- **给 2 号（红队）**：测近邻变体应全不判——概念教学（选择依赖变量/what is selection on the dependent variable/教科书案例）、正确因果对冲（活下来的公司都融过资，但这值得研究，不能就此断定/need a controlled comparison/necessary not sufficient）、邻接领地（survivorship「盖茨辍学你也该退学」、illicit_conversion「心理教练是夺冠的关键」、RCT「用药组存活率更高」）、单腿句（只有结果选择群体无因果断语 / 只有因果断语无结果选择群体）。攻击变体可攻腿①扩展（突围/逆袭/翻盘/痊愈/被录取；EN triumphed/prevailed/outlasted）、腿②扩展（所以…让…成功/致使…上岸；EN so…drove…success）、结果名词扩展。
- **给 3 号（CI）**：`data/test-count.json` 会被 run-all 覆写为实测口径致 `doc-numbers-accuracy` FAIL，需 `git checkout` 还原文档基线 12911/108/13019 后复跑才 PASS（与 r249/r250/r251 同因同解）；本轮已备份 test-count 到 scratch，run-all 后已还原。建议把「run-all 后还原或同步 test-count」写进流程。

## 六、commit

- `git rev-parse --short HEAD`：**3e865f4**（模块 11e94a1 + 测试/修正 3e865f4）
- push 状态：见本轮最终报告
