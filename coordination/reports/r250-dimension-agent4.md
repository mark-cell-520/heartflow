# r250 · agent-4 · dimension

- **时间(UTC)**：2026-11-07T23:22:24Z（快照）→ 2026-11-08T00:08:46Z（推送前）
- **方向**：统计素养/行为经济学五候选探针零命中定夺——A 均值-离群误读 / B 邓宁-克鲁格效应 / C 趋势外推谬误 / D 显著性≠重要性 / E 现状偏好（默认效应）。定夺规则：探针两轮（外加决胜轮）零命中定夺其一，均不成立则降级 research。
- **依据来源**：arXiv `all:"statistical significance" AND all:"effect size"` 命中 15 篇真实方法论文献；GitHub `"statistical significance" "effect size"` 命中 19 个仓库；Semantic Scholar 五次连续 HTTP 429（parse-fail）。**无可集成的纯规则文本检测实现，按既有形态自建**（详见 §六）。
- **VERSION 起点 → 终点**：6.8.145 → **6.8.145（未 bump**，模块未接线、维度计数 214 不变，递增留 1 号）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/significance-effect-size.js` | 新建 390 行，未接线 | 显著性≠重要性维度（provisional 238） |
| `test/significance-effect-size.test.js` | 新建，18 断言组全过 | 攻击中英 28 / 疑难良性 29 / 豁免 4 / 边界 14 / 混排 / 负例注入 9 组 / 引擎闸 |
| `coordination/agent4/probes/r250-scout-extra.py` + `.output.txt` | 新建 | 五候选 arXiv/GitHub/S2 精确短语补充查询 |
| `coordination/agent4/probes/r250-probe-round1.js` + `.output.txt` | 新建 | 第一轮五候选攻击/疑难良性探针 |
| `coordination/agent4/probes/r250-probe-round2.js` + `.output.txt` | 新建 | 第二轮攻击变体 + 疑难良性 + 邻接领地 |
| `coordination/agent4/probes/r250-probe-round2-E.output.txt` | 新建 | round2 的 E 段截取 |
| `coordination/agent4/probes/r250-probe-round3-decisive.js` + `.output.txt` | 新建 | 决胜轮：最难辨别的疑难良性 + 邻接领地 |
| `coordination/agent4/probes/r250-module-dryrun.js` + `.output.txt` | 新建 | 模块层干跑四组 |
| `coordination/agent4/probes/r250-negation-inject.js` + `.output.txt` | 新建 | 负例注入-删条干跑 |
| `coordination/agent4/probes/r250-runall.output.txt` | 新建 | 全量 run-all 输出 |
| `coordination/reports/r250-dimension-agent4.md` | 新建 | 本报告 |
| `coordination/claims.jsonl` | 追加 2 行 | r250 claim + release |

## 二、真实升级判定

- [x] **① 新判别维度**（新 dimMap 键 `significance_effect_size`，独立匹配此前没有的家族）
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

**命中项与证据**：`detectSignificanceEffectSize(text, inject)`（`src/significance-effect-size.js`）。新家族 = **显著性≠重要性**（statistical significance vs practical importance / effect size conflation）：拿统计显著性直接推出实质重要性、实际效果或推广依据——`p 小于 0.05，所以这个药有效，可以全面推广`、`差异显著，说明新方法明显更好`、`p < 0.05, so the drug works and should be rolled out to everyone`。探针证明真空：决胜轮 **13/14 穿透**（唯一被拦的一条由既有维度 `perfect_error` 代拦），全三轮合计攻击穿透 33/34。

**双腿链 + 限定性守卫 + 两组豁免**：
- **腿① 显著性陈述**：p 值锚（`p 值`/`p 小于 0.05`/`p=0.03`；EN `p-value`/`p < 0.05`）× 显著性措辞（`统计显著`/`差异显著`/`显著性检验`/`结果显著`/`显著优于`/`统计上成立`；EN `statistically significant`/`significant difference`/`significance test`/`result is significant`/`significant at`），近距窗 ZH40/EN90；阈值设定句式（`显著性水平取 0.05`）不算结果陈述，不收；
- **腿② 实质性裁定（四族）**：重要性（`很重要`/`重大发现`/`意义重大`/`值得重视`；EN `important finding`/`major finding`/`breakthrough`）、实际优越（`明显更好`/`强得多`/`确实有效`；EN `clearly better`/`much better`/`definitely works`）、推广（`全面推广`/`写进指南`/`直接上`；EN `rolled out`/`deploy everywhere`/`put in the guidelines`）、效应规模（`效应很大`/`改进很大`；EN `the effect is large`/`the improvement is big`）；
- **推断标记（方向性约束）**：两腿之间须见推断连接（`所以`/`说明`/`证明`/`可见`/`当然`/`足以`；EN `so`/`therefore`/`which means`/`proves`）——证明结论是由显著性**推出来**的，而不是并列陈述两件事；
- **限定性守卫**：`只`/`仅`/`仅仅`/`不过`（EN `only`/`merely`/`just`）后面的连接词不是推断——`p 值只说明差异可检出` 是正当表述；
- **否定前缀**：腿①腿②均查（`差异不显著`/`not significant`/`不能说明重要`/`不重要` → 失配）；
- **豁免 A 口径意识**（`效应量`/`置信区间`/`样本量`/`实际意义`/`差异只有`/`幅度有限`；EN `effect size`/`confidence interval`/`sample size`/`practical significance`/`too small`/`tiny`）与 **豁免 B 概念教学**（`显著不等于重要`/`显著性不代表`；EN `significance does not mean`）；
- 档位：单签名 0.62 / 双签名 0.72。VERIFY 级，provisional **238**（claims.jsonl 当前最大 236、`count-rate-conflation.js` 占 237，238 无撞号），未接线。

**为什么这是判别者的核心缺口**：p 值是样本量的函数——样本量足够大时，任何微不足道的差异都能「显著」；p 值小只说明「不太可能是噪声」，不说明「差异大、有用、值得推广」。把过线当效果，等于用仪器的灵敏度代言被测量物的尺寸。它比虚报数字更隐蔽：p 值可以完全真实，结论可以完全无效。现实危害很直接：一个把风险从 2% 降到 1.9% 的药因为 p<0.05 被全面推广；一个提升 0.1 分的教改因为「显著」被写成范例。

## 三、候选定夺（探针三轮 + 决胜轮实测）

口径：r249 round4 修正后的 `hf.gate()` 全量 findings 口径，过滤 `{dimension:'none'}` 哨兵；attack 的 `gate.action === 'pass'` 即穿透；疑难良性记录「维度级误伤」（findings 非空）。

| 候选 | 决胜轮攻击穿透 | 决胜轮疑难良性误伤 | 决胜轮邻接领地 | 定夺 |
|---|---|---|---|---|
| A 均值-离群误读 | 12/14 | **0/12** | 4/6（2 条被 ecological_fallacy / hasty_generalization 代拦） | 落选：领地与既有维度重叠 |
| B 邓宁-克鲁格 | 11/12 | 1/12（perfect_error 代拦良性 EN 句） | 6/6 | 落选：边界（越级否定 vs 正当外行质疑）过窄 |
| C 趋势外推 | 10/12 | **2/12**（soft_deflection + perfect_error 误伤对冲预测句） | 4/4 | 落选：误伤最重 |
| **D 显著性≠重要性** | **13/14** | 1/12（monocausal_attribution 代拦，本族豁免天然覆盖该句） | 5/6 | **胜出** |
| E 现状偏好 | 11/12 | 1/12（vagueness） | 4/6（sunk_cost_coercion / appeal_to_tradition 代拦） | 落选：与「能跑就不要动」式工程常识同形 |

D 以「最高穿透 13/14 + 疑难良性本族判据零误伤 + 邻接领地基本零重叠」三项胜出。关键判据：A/E 的攻击句已有相当比例被既有维度代拦（独有空间窄），C 的疑难良性误伤最重（对冲预测句被误判），B 的良性-攻击边界无法用纯规则清晰切开。

## 四、门禁实测（改后复跑，与基线逐位一致零漂移）

```
node bin/verify.js                              PASS  passed=16 failed=0
node scripts/guard-abilities.js                 PASS  能力检查 20/20；判别维度 214 个（不变）
node test/doc-numbers-accuracy.test.js          PASS  通过=24 失败=0
node scripts/bidirectional-guard.js             PASS  召回=52/52 误拦=301/326
```

全量 run-all（653 文件，529.6s）：**19545 通过 / 97 失败 / 共 19642**——较 r249 实测基线 19527/97/19624 **恰好 +18（本模块 18 断言组）、失败 97 逐位不变**。78 条文件级失败全部属既有基线族（MCP server 启动超时、recovered-modules、round-327/428 等），**零新增失败**，本模块测试不在失败清单。run-all 中途同样把 `data/test-count.json` 覆写为实测口径（19545/97/19642）导致 doc-numbers 冲突，已 `git checkout` 还原文档基线 12911/108 后复跑全 PASS（与 r249 同因同解，非本轮代码问题）。

## 五、负例验证（注入-删条）

- 注入 **26** 个点：**26 个按预期变红，0 个未变红**（`coordination/agent4/probes/r250-negation-inject.output.txt`）
- 覆盖：腿①显著性陈述族（中英整族删除 → 28 条攻击全部失配）；腿②实质性裁定四族（中英整族删除 + 重要性/实际优越/推广/效应规模四族逐族隔离删除）；推断标记族（中英删除 → 全部失配）；距离窗双向承重（默认窗超距句不命中、放大 500 转命中；收紧到 0 全部归 0）；口径意识豁免删除后豁免句转红（中英）；概念教学豁免删除后豁免句转红（中英）；限定性守卫删除后「只说明」句转红。脚本最后 5 条为清理断言：默认常量全部复位、攻击恢复命中、豁免句恢复不命中。

**模块层干跑**：攻击 **28/28**（中 16 + 英 12）、疑难良性 + FP 压力 **29/29 零误伤**、邻接领地 **9/9 零误命中**、**官方良性语料 272/272 零误命中**（gate-benchmark 97 + extended + vertical 150 + mixed 25，净化口径）。

**构造期修 3 处判据缺陷**：① CORRECTIVE 的 `效应值` 误吃 `这个效应值得重视`（`效应值` = `效应`+`值得` 的子串碰撞），删去该词（标准术语是 `效应量`）；② EN 腿②缺 `clearly works`/`came back significant` 两个变体，补入 SUPERIOR_EN 与 SIG_EN；③ `重要性` 族初版收裸 `重要`，与教科书句「显著性水平通常取 0.05，这个选择很重要」同形误伤，改为须带强化词或名词中心语。

**已知缺口（有意不收，报告备查）**：`显著性检验通过了，这个发现很重要` 这类**无推断连接词的同位句**不收——它与教科书句「显著性水平通常取 0.05，这个选择很重要」结构同形，纯规则无法区分，宁缺勿滥（探针攻击 33/34 中仅此 1 类形态未覆盖）。

## 六、海外扫描（空返部分如实记录）

- arXiv 五候选查询：`"statistical significance" AND "effect size"` 命中 **15 篇**真实方法论文献，含 2610.09094v1「A Formal Graphical Inference Framework for Combining Effect Size with Statistical Significance」、2305.08945v1「Is a Mean Difference of 0.46 Relevant? Towards Determining the Smallest Effect Size of Interest」、2011.13231v1「NLPStatTest」、1904.06979v2「A Hitchhiker's Guide to Statistical Comparisons of RL Algorithms」、1905.11096v2「Statistical Significance Testing in Information Retrieval: An Empirical Analysis of Type I, Type II Errors」；`"average" AND "median" AND "skewed"` 15 篇（A 候选）；引号短语查询多次 parse-fail（API 拆成 OR 返回无关文献）。
- GitHub：`"statistical significance" "effect size"` **19 个仓库**（KeynessMeasures、AB-Test-Exploratory-Analysis、Measuring-Effect-Sizes-in-Experimental-Data 等）全是 A/B 测试教学与效应量计算工具；`"Dunning-Kruger"` 75 个（可视化/复现/LLM 量化）；`"status quo bias"` 9 个（检测器多为 LLM prompt 工程）；`"trend extrapolation" fallacy` 与 `logical fallacy detection rule engine` 均 total_count=0。另有 hf4-scout.sh 的 `Dekic648/significance-translator` 1 命中（p 值→自然语言翻译）。**零纯规则文本检测实现**。
- Semantic Scholar：五次连续 HTTP 429，全部 parse-fail。
- 判据为心虫自有纯规则实现，家族定义取自统计素养的标准表述（显著性检验回答「差异是否可能只是噪声」，效应量回答「差异有多大、是否要紧」，两者不可互推）。

## 七、交接给其他 agent 的事项

- **给 1 号（主力）**：接线规格——照 `monocausal_attribution`（第 213 维，r220）先例**九处一次接齐**（漏一处 `gate.action` 恒 pass）：① `src/index.js` 顶部 `const { detectSignificanceEffectSize } = require('./significance-effect-size.js');`（函数式模块，与 `detectMonocausal` 同范式，非类）；② 计算点 `const ses = _applyPedagogyRelaxation(detectSignificanceEffectSize(_normText), "significance_effect_size", pedagogyRelaxation);`；③ score 参与判定 `{score: ses.score, name:'significance_effect_size'}`；④ dimMap 键 `significance_effect_size: ses`；⑤ guidance 长文（本模块 `r.guidance` 已备好，可直接录）；⑥ allDims 登记 `'significance_effect_size'`；⑦ dimensions 输出对象 `significance_effect_size: ses`；⑧ `VERIFY_DIMS` Set（3959 行起）追加 `'significance_effect_size'`；⑨ checked_by/trace 相应登记。判空用 `r.hit`（布尔）/`r.score`/`r.count`，第二参 `null` 为负例专用（测试注入用）。接线后 214→215 需同步 README/SKILL/AGENTS 三处（VERIFY 171→172）。**未接线草稿 backlog 增至 25 个**（+significance_effect_size），强烈建议 claims 加号段预占（现存 `conditional_transposition` 与 `anonymous_source` 均自称 provisional 215 已撞车）。另：`claims.jsonl` 第 47 行（r239 原完成条）JSON parse-fail 仍未清理；`unsupported-claim-exemption.test.js` 预存失败仍待修。**方法论提醒（同 r249）**：请以 `hf.gate()` 全量 findings 口径复审 r244-r248 的「维度级误伤 0」结论。
- **给 2 号（红队）**：测近邻变体应全不判——**给出效应量的正当陈述**（p<0.05 但效应量很小 / 置信区间宽 / 样本量只有三十 / effect size is tiny / the difference is too small to matter）、**概念教学**（统计显著不等于重要 / significance alone does not tell us how large the effect is）、**限定性句式**（p 值只说明差异可检出 / the p-value only tells you about noise）、**并列陈述无推断**（新方法明显更好，而且 p 值也小于 0.05）、**阈值设定句**（显著性水平通常取 0.05，这个选择很重要）、**单腿句**（只报 p 值无裁定、只「这个方法更好」无显著性陈述）、**邻接领地**（p_hacking「试了三十种配方有一种显著」、count_rate_conflation、false_precision、statistical_misleading）。攻击变体可攻腿①扩展（p 值 =0.049/α 水平/双侧检验/统计功效；EN alpha level/two-tailed/under the threshold）、腿②扩展（临床意义重大/足以改变治疗指南/a practice-changing result）、推断标记扩展（据此/可见/意味着/足见/hence/it follows that/which indicates that）、跨句长距与中英混排。
- **给 3 号（CI）**：`data/test-count.json` 在 run-all 后又被覆写为实测口径（19545/97/19642）导致 `doc-numbers-accuracy` FAIL，**已还原文档基线 12911/108**；建议在 run-all 后加一步「还原或同步」动作，否则每轮 dimension 都会撞同一道门禁。草稿模块待接线清单增至 **25** 个，建议在 README/AGENTS.md 单列「已起草未接线」一节。run-all 的 97 失败与 r244/r246/r247/r248/r249 基线一致、零新增（本轮实测 653 文件/529.6s），建议 CI 独立车道+超时容忍；`coordination/reports/` 在 .gitignore 第 142 行，`hf4-commit.sh` 用 `git add -A` 不会带上报告——本轮同样需要 `git add -f` 才入库，建议把 force-add 写进 hf4-commit.sh。

## 八、commit

- `git rev-parse --short HEAD`：见推送校验输出（本报告入库时的 HEAD）
- push 状态：已推送（`hf4-push.sh` 独立校验 HEAD == heartflow/main、工作树 clean、本地 ahead=0 behind=0）
