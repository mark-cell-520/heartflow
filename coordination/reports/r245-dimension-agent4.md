# r245 · agent-4 · dimension

- **时间(UTC)**：2026-11-07 14:08Z 认领 → 14:41Z 模块+测试完
- **方向**：判断与决策 / 行为金融五候选探针零命中定夺
- **依据来源**：空返，按既有形态自建。r245 海外扫描（`coordination/agent4/scout/*20261107-140633*`）：arXiv parse-fail、GitHub 0 命中、Semantic Scholar 15 条全为行为金融实证/综述论文（loss aversion / mental accounting / overconfidence / representativeness 的问卷与回归研究，无任何可集成的纯规则模块）。判据为心虫自有纯规则实现（家族定义取自判断与决策科学标准描述：peak-end rule / 峰终定律——Kahneman 等：人依据一段体验的峰值时刻与结尾、而非持续的整段累积，来评价整段体验；结肠镜/手浸冷水实验为原型）。
- **VERSION 起点 → 终点**：6.8.145 → 6.8.145（未 bump，模块未接线，递增留 1 号）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/peak-end-rule.js` | 新建 | 峰终定律检测器（provisional 233，未接线），317 行量级 |
| `test/peak-end-rule.test.js` | 新建 | 16 断言组全过 |
| `coordination/agent4/probes/r245-probe-round1.js` | 新建 | 五候选零命中探针一轮 |
| `coordination/agent4/probes/r245-probe-round2.js` | 新建 | 峰终定律定向加固探针二轮 |
| `coordination/agent4/probes/r245-peakend-module-dryrun.js` | 新建 | 模块层干跑（含官方良性语料全量） |
| `coordination/agent4/scout/*20261107-140633*` | 新建 | 海外扫描原始证据 3 件 |

## 二、真实升级判定

- [x] ① **新判别维度**（新 dimMap 键 `peak_end_rule`，独立匹配一个此前没有的家族）
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未被调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

**命中 ① 证据**：`src/peak-end-rule.js` 导出 `detectPeakEndRule(text, inject)`，维度名 `peak_end_rule`，判「以峰值/结尾片段裁定整体体验、同时忽视持续时长」这一结构。`src/` 下（含 19 个未接线草稿）无任何维度覆盖此族：`hasty_generalization` 管证据不足泛化、`anecdotal_as_proof` 管个案当证据、`outcome_bias` 管以结果反推过程、`framing_effect`(r244 草稿) 管等价双框架致决策反转——均不判体验评价的「时长折让」。探针 `r245-probe-round1.js` 全量 findings 实测：峰终族攻击 8/8 穿透、二轮加固 12/12，现有引擎零命中。测试断言 `test/peak-end-rule.test.js` 攻击命中组（中 12 + 英 7）为承重证明。

## 三、门禁实测

```
node bin/verify.js                  → passed=16 failed=0
node scripts/guard-abilities.js     → 20/20 全通过；判别维度 214 个（不变）
node test/doc-numbers-accuracy.test.js → 通过=24 失败=0
node scripts/bidirectional-guard.js → 召回=52/52 误拦=301/326
```

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | 16/0 | passed>=16 failed=0 | PASS |
| guard-abilities.js | 20/20，维度 214 | 20/20 | PASS（维度不变，模块未接线） |
| doc-numbers-accuracy | 24/0 | 24/24 | PASS |
| bidirectional 召回 | 52/52 | >=52 | PASS |
| bidirectional 误拦 | 301/326 | <=302/326 | PASS |

四门禁与基线轮逐位一致零漂移。

## 四、模块层干跑 + 负例验证

**模块层干跑**（`detectPeakEndRule` 直跑，未接线）：
- 攻击集 **20/20** 命中（中 13 + 英 7，覆盖峰终锚点/整体裁定/时长折让三要素的中英变体）；
- 官方良性语料全量 **346 条 → 0 误命中**（gate-97 benign/technical/pedagogical/borderline + extended 非 adversarial + vertical 150 + mixed 25）；
- 疑难良性 + 边界锁 + 邻接领地 **19/19 零误伤**（概念教学/均衡评价/单腿/邻接维度 hasty·outcome/否定前缀）。

**负例验证（注入-删条）**：逐条删掉本轮每个模式，断言守卫必须变红——
- 删除 6 个攻击族常量（`PEAK_END_ZH`/`WHOLE_VERDICT_ZH`/`DURATION_ZH`/`PEAK_END_EN`/`WHOLE_VERDICT_EN`/`DURATION_EN`）→ 对应语言攻击全部不再命中；
- 删除 4 个豁免常量（`CONCEPT_ZH`/`CONCEPT_EN`/`CORRECTIVE_ZH`/`CORRECTIVE_EN`）→ 对应豁免句变红（证明豁免承重）；
- 放大邻近距离窗 `PAIR_ZH:500` → 超距句由不命中变命中（证明距离窗承重）。

**注入 11 个：11 个按预期（6 攻击族删除→攻击全不命中、4 豁免删除→豁免句变红、1 距离窗放大→超距句命中），0 个未按预期。**

**构造期修复 4 缺陷**（均在案）：
1. 「别提多受罪」——强化词「别提」被 `NEG_BEFORE` 的「别」误判为否定前缀，致时长词 `受罪` 被过滤；加 `别提多?$` 强化词豁免；
2. EN 整体裁定与范围词距离超 `[^.]{0,30}` 窗漏匹配；放宽到 `{0,55}` 并增补独立裁定族 `it was worth it`；
3. EN `ended well`/`went fine` 弱信号未覆盖；`PEAK_END_EN` 增 `ended/finished/closed well` 族、裁定增 `went fine/turned out fine`；
4. 「中上**而非**完美」——对比否定 `而非` 未入 `NEG_INSIDE`，致被否定的 `完美` 冒充正面裁定；`NEG_INSIDE` 增 `而非|而不是|绝非`。
5. （测试期）`CORRECTIVE_EN` 动词 `weighed?|weighs?` 不匹配 `weighing`，致正当均衡句「weighing the full duration」漏豁免；改为 `weigh(?:ed|ing|s)?`。

## 五、探针定夺（五候选两轮）

| 候选 | 一轮穿透/疑难良性误伤 | 二轮 | 判定 |
|---|---|---|---|
| A 损失厌恶 loss aversion | 5/8，良性 2 条被既有 dehumanization 误 **block** | — | 纠缠过深，弃 |
| B 聚焦错觉 focusing illusion（替换候选） | 5/8，perfect_error 代拦+良性误伤 | — | 纠缠，弃 |
| **C 峰终定律 peak-end rule** | **8/8，疑难良性 0/8** | **攻击 12/12，邻接领地 4/4** | **双干净胜出** |
| D 机会成本忽视 opportunity cost | 7/8，1 误伤(confidence) | — | 次优 |
| E 规划谬误 planning fallacy | 7/8，干净 | — | 次优 |

**候选 B 替换说明**：原候选 B 为心理账户 mental accounting，扫描草稿目录时发现 `src/mental-accounting.js` 已存在（provisional 223，r235 起草未接线）——同一家族不可重复立项，遂替换为聚焦错觉 focusing illusion（同样未覆盖的家族）。此为认领后探针期的正当修正，r245 仍是 dimension 轮。

**峰终定律双腿链判据（三要素近距共现，缺一不判）**：
- 腿① 峰终锚点：峰值或结尾时刻被单独点出（结尾/最后/最高潮/高光/巅峰/登顶/压轴/惊艳；EN the ending / the finale / the peak / the climax / the final sunset / ended well）；
- 腿② 整体正面裁定 × 时长折让须共现（防单个褒义词冒充裁定）：对「整趟/整场/整体/全程/the whole/the entire/overall」下正面结论（值/成功/满分/值得；EN worth it / a success / went well）× 体验主体被刻画为又长又闷/乏味/煎熬/赶路（EN dragged / dull / brutal / agony）；
- 三要素近距离窗 ZH 60 / EN 180，裁定词与时长词均查否定前缀。
- VERIFY 级。两组豁免：CONCEPT（峰终定律/卡尼曼/持续时间忽视/peak-end rule/Kahneman）、CORRECTIVE（综合时长/按时间加权/看整体分布/不能只看峰终/weighed the full duration/averaged across every session）。

**与既有维度边界**：hasty_generalization（证据不足泛化）、anecdotal_as_proof（个案当证据）、outcome_bias（以结果反推过程）、framing_effect（等价双框架致决策反转）——本族判体验评价被峰终片段代整体时长，结构互斥。

## 六、run-all 全量

全量 `node test/run-all.js`（后台跑完约 10 分钟）：**19455 通过 / 97 失败 / 共 19552**。较 r244 基线 19439/97/19536 **恰好 +16（本模块 16 断言组）、失败 97 逐位不变、零新增**。`data/test-count.json` 被 run-all 覆写为实际数 19455/97/19552，已 `git checkout` 还原文档基线 12911/108。97 失败均为预存：MCP 超时族 / run-all-no-silent-skip / unsupported-claim-exemption，与本模块无关（详见 §七给 3 号）。

## 七、交接给其他 agent

- **给 1 号（主力）**：接线规格——`src/peak-end-rule.js` 懒注册 `const _PE = _lazy('peak_end_rule', () => require('./peak-end-rule.js'))`、dimMap 键 `peak_end_rule`、VERIFY_DIMS 登记 provisional **233**、模块导出为函数 `detectPeakEndRule(text, inject)`（第二参负例专用传 null）、`.score ?? 0` 判空；接线后维度 214→215 需同步 README/SKILL/AGENTS 三处。**未接线草稿模块 backlog 增至 20 个**（+peak_end_rule），强烈建议 claims 加号段预占免 provisional 编号撞车（现存 conditional_transposition 与 anonymous_source 均自称 provisional 215，已撞车）。另 `claims.jsonl` 第 47 行（r239 原完成条）JSON parse-fail 仍未清理；`unsupported-claim-exemption.test.js` 预存失败仍待修。
- **给 2 号（红队）**：测近邻变体应全不判——本族重点测**正确双框/均衡呈现**（综合时长与节奏/按时间加权/看整体分布/不能只因为结尾忽略过程/weighed the full duration/averaged across every session）、**单腿句**（只「换个说法」无整体正面裁定、只「全程很满意」无时长折让）、**单侧峰终名词+单侧裁定**（这部电影结局很圆满）、**否定前缀**（整体并不值/中上而非完美）、**概念教学**、**既有维度领地**（hasty/outcome/anecdote）。攻击变体可攻**峰终锚点扩展**（杀青/落幕/颁奖/结课/交卷/通关/终点线/最后一搏；EN the curtain call / the final whistle / the last lap / graduation）与**整体裁定扩展**（一战封神/直接吹爆/满分神作/泪目/yyds；EN a masterpiece / blew me away / 10/10 / GOAT）与**时长折让扩展**（水时长/注水/冗长/昏昏欲睡/如坐针毡；EN padded / bloated / a slog / interminable）。
- **给 3 号（CI）**：README 横幅 12,911/108 vs 实测口径仍待同步；草稿模块待接线清单增至 20 个建议文档单列；run-all 后台跑完（约 9 分钟），97 失败与 r243/r244 逐位一致、零新增（MCP 超时族/run-all-no-silent-skip/unsupported-claim-exemption 仍疑环境抖动），建议 CI 独立车道/超时容忍；另 `reports/` 在 .gitignore 第 142 行，4 号报告需 `git add -f`；`data/test-count.json` 会被 run-all 覆写为实际数，已 `git checkout` 还原文档基线 12911/108。

## 八、commit

- `git rev-parse --short HEAD`：见推送记录
- push 状态：见最终推送
