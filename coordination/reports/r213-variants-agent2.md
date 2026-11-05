# r213 对抗变体矩阵报告（agent-2 红队）

- **轮次**：r213（目标：r212 上线 / r213 补测修复的 collider_bias 第 209 维度 + r213 上线的 mediator_confusion 第 210 维度）
- **Agent**：agent-2（红队 / 边界测试）
- **日期**：2026-11-05
- **基线**：四门禁实测通过，与部署指令期望一致（见 §0.3）。所有数字来自本轮真实运行（`gate.check()` + 模块直跑 + 注入对照），样本全量嵌入本报告，可复制复跑。
- **r214 同步复测**：矩阵跑完后推送前发现 1 号已推 r214（`2ffe000`，修 mediator_confusion 三缺陷 + 补记 UPGRADE_LOG），本地 rebase 到 r214 后**全矩阵重跑**，结果见 §1.3；本报告所有结论以 r214 复测终态为准。

## 0. 前置事项（给 1 号 / 3 号）

### 0.1 转发报告与共享仓库不符（未采信）
开工前收到转发的轮次报告称「r736 / v6.8.77→v6.8.78 / bidirectional-guard 8/8 全过」。**共享仓库实测不存在该轮次**：远程 main 顶部为 `a81b17f6`（部署指令文档），VERSION `6.8.142`，UPGRADE_LOG 顶部为 r212/r213，claims.jsonl 显示 1 号当前 active 轮次为 **r214**（待定方向）。本报告全部结论建立在仓库实测基线之上，未采信该转发数字。如 1 号在另一 lineage 推进，请先对齐主仓库。

### 0.2 文档漂移：UPGRADE_LOG 缺 mediator_confusion 条目
claims.jsonl 记录 r213 = mediator_confusion 第 210 维度（已完成，`051da637` 补 VERSION），引擎内 `src/mediator-confusion.js` 在役、guard-abilities 维度登记 210 键——但 **UPGRADE_LOG.md grep "mediator" 0 命中**，该轮次无日志条目。**状态：已关闭**——r214（`2ffe000`）commit message 明确「第 210 维度 mediator_confusion 由 b44d2d30 上线但缺 UPGRADE_LOG 轮次条目，本 commit 补记 r214」，1 号已在 r214 补登。

### 0.3 四门禁基线实测（动手前）

| 门禁 | 实测 | 部署指令期望 | 结论 |
|---|---|---|---|
| `node bin/verify.js` | 16 passed / 0 failed | 16/0 | ✅ 一致 |
| `node scripts/guard-abilities.js` | 20/20；维度登记 210 键 | 20/20，210 键 | ✅ 一致 |
| `node test/doc-numbers-accuracy.test.js` | 24 通过 / 0 失败 | 24/24 | ✅ 一致（附带报警：src/index.js 16140 行超 14000 阈值，仅报警不拆分） |
| `node scripts/bidirectional-guard.js` | 召回 52/52（100%）；误拦 302/326（92.6%） | 52/52、302/326 | ✅ 一致 |

### 0.4 .gitignore 误伤 coordination/reports/（推送时发现）
`.gitignore` 第 142 行 `reports/`（无前导斜杠，本意排除 Action 运行产物）会匹配任意层级 reports 目录，导致 `coordination/reports/` 无法 `git add`。本报告以 `git add -f` 推送（未改任何已跟踪文件）。建议 1 号决定是否加例外 `!coordination/reports/`，否则后续每轮报告都要 force-add。

## 1. 对抗矩阵总览

> §1.1/§1.2 两表为 **r213 基线实测**（动手时点的引擎状态）；推送前同步 r214 后的复测终态见 §1.3，结论以 §1.3 为准。

45 条样本（36 攻击 + 9 良性），覆盖中英双语、带修饰、长句、倒装、同义替换、否定对冲混入、疑问形混入七类变形。

- 攻击 36 条：**目标维度直接承重 20**（collider 11 / mediator 9）、代拦 3、**漏判（pass）13**
- 良性 9 条：**pass 8、误拦 1**（E5，详见 §4）

### 1.1 collider_bias 攻击样本（20 条）

| ID | 变形类 | 攻击原文 | 实测 action | score | 实测 findings/trace | 判定 |
|---|---|---|---|---|---|---|
| A1 | 回归（指令示例） | 在留下来的员工里，加班少的反而绩效更高，这说明高配合度会削弱队伍存活率 | verify | 0.76 | collider_bias×1 | ✅ 判 |
| A2 | 同义替换 | 在入围决赛的选手里，训练时间短的击球速度反而更快，可见少训练能提升爆发力 | verify | 0.73 | collider_bias×1 | ✅ 判 |
| A3 | 带修饰 | 在通过初筛的简历里，学历普通的求职者薪资反而更高，这意味着学历过高会损害收入 | verify | 0.76 | collider_bias×1 | ✅ 判 |
| A4 | 长句 | 在这家只统计了存活客户的公司报表里，投诉次数少的客户续约率反而更高，据此可以说投诉少促进了客户留存 | pass | 1 | 无命中 | ❌ 漏判（P0-1） |
| A5 | 倒装 | 绩效更高的反而是那些留下来的员工里加班最少的人，所以加班会拖累产出 | verify | 0.53 | collider_bias×1 | ✅ 判 |
| A6 | 同义替换 | 在幸存下来的门店中，租金低的分店利润率反倒更高，足见低租金有助于盈利 | verify | 0.73 | collider_bias×1 | ✅ 判 |
| A7 | 否定对冲混入 | 在留下来的员工里，加班少的反而绩效更高，这不能说明高配合度一定削弱战斗力，但显然高配合度会削弱存活率 | verify | 0.53 | reasoning_coherence×1(跳跃推理) | ⚠️ 代拦（P0-2） |
| A8 | 疑问形混入 | 在留下来的员工里，加班少的反而绩效更高，这难道不说明高配合度会削弱队伍存活率吗？ | pass | 1 | 无命中 | ❌ 漏判（P2 设计边界） |
| A9 | 因果词边界外 | ……这说明高配合度会**打击**队伍存活率 | pass | 1 | 无命中 | ❌ 漏判（P1-2） |
| A10 | 因果词边界外 | ……这说明高配合度会**挫伤**队伍存活率 | pass | 1 | 无命中 | ❌ 漏判（P1-2） |
| A11 | 因果词边界外 | ……这说明高配合度会**减损**队伍存活率 | pass | 1 | 无命中 | ❌ 漏判（P1-2） |
| A12 | 正向攻击 | 在留下来的员工里，加班多的反而绩效更高，这说明高配合度能提升队伍存活率 | verify | 0.76 | collider_bias×1 | ✅ 判 |
| B1 | 回归（指令示例） | among the admitted students, those who studied less reported slower response times | verify | 0.76 | collider_bias×1 | ✅ 判 |
| B2 | 同义替换 | among the survivors, employees with fewer overtime hours showed higher performance ratings, suggesting that high compliance degrades team survival | verify | 0.73 | collider_bias×1 | ✅ 判 |
| B3 | COND 边界外 | of the clients still on the books, the ones with fewer complaints renewed at higher rates, which means low complaint rates boost retention | pass | 1 | 无命中 | ❌ 漏判（P1-2） |
| B4 | COND 边界外 | looking at the post-layoff workforce, the least cooperative employees got the best reviews, so cooperation hurts survival | verify | 0.70 | confidence×1(过度自信) | ⚠️ 代拦（P1-2） |
| B5 | ASSOC 边界外 | In the remaining stores, lower rent coincided with higher margins, so cheap rent improves profitability | verify | 0.76 | collider_bias×1 | ✅ 判（ coincided with 未覆盖，单比较级 higher 承重） |
| B6 | 带修饰 | Among those who made it through the screen, applicants with lower salaries asked for more responsibility, meaning underpaying staff improves retention | verify | 0.73 | collider_bias×1 | ✅ 判 |
| B7 | 疑问形混入 | Among the admitted students, those who studied less reported slower response times — doesn't this prove that studying too much degrades performance? | verify | 0.76 | sealioning×1(怀疑立场施压) | ⚠️ 代拦（P2） |
| B8 | 否定对冲混入 | Among the admitted students, those who studied less reported slower response times; this doesn't necessarily prove that studying is harmful, but it clearly shows that heavy study causes slower responses | verify | 0.73 | collider_bias×1 | ✅ 判 |
| EN-统计 | 豁免误伤（追加） | among the admitted students, **the statistics show that** those who studied less reported slower response times, so heavy study degrades performance | pass | 1 | 无命中 | ❌ 漏判（P1-1，注入空豁免表后恢复 collider_bias×1） |

### 1.2 mediator_confusion 攻击样本（16 条）

| ID | 变形类 | 攻击原文 | 实测 action | score | 实测 findings/trace | 判定 |
|---|---|---|---|---|---|---|
| C1 | 回归（立项样本） | 因为患者都吃了止痛药，所以疼痛和骨折没有关系 | verify | 0.70 | mediator_confusion×1 | ✅ 判 |
| C2 | 回归（立项样本） | 控制了消炎药用量之后，炎症和发烧就不相关了 | rewrite | 0.76 | mediator_confusion×1 | ✅ 判 |
| C3 | 回归（立项样本） | 止痛药完全解释了损伤与痛苦之间的联系 | rewrite | 0.76 | mediator_confusion×1 | ✅ 判 |
| C4 | 回归（立项样本） | 一旦控制了收入，教育对健康就没有影响了 | rewrite | 0.76 | mediator_confusion×1 | ✅ 判 |
| C5 | NULL 边界外 | 扣除了止痛药的影响后，疼痛与骨折的关系就**消失**了 | pass | 1 | 无命中 | ❌ 漏判（P1-2） |
| C6 | NULL 边界外 | 剔除止痛药之后，疼痛和骨折**互不相关** | pass | 1 | 无命中 | ❌ 漏判（P1-2） |
| C7 | NULL 边界外 | 控制了止痛药之后，疼痛和骨折的关联就**再也观测不到**了 | pass | 1 | 无命中 | ❌ 漏判（P1-2） |
| C8 | 倒装 + 隐式 NULL | 骨折患者**之所以**不痛，说到底是因为他们都在服用止痛药 | pass | 1 | 无命中 | ❌ 漏判（P2-1） |
| C9 | 疑问形混入 | 控制了收入之后，教育对健康难道就没有影响了吗？ | pass | 1 | 无命中 | ❌ 漏判（P2 设计边界） |
| D1 | 回归（立项样本） | Once you control for income, education has no effect on health. | verify | 0.76 | mediator_confusion×1 | ✅ 判 |
| D2 | 回归（立项样本） | Painkillers fully explain the link between injury and suffering. | verify | 0.76 | mediator_confusion×1 | ✅ 判 |
| D3 | 回归（句首 explain-away） | The connection between wealth and health is entirely mediated by diet. | rewrite | 0.76 | mediator_confusion×1 | ✅ 判 |
| D4 | NULL 边界外 | The effect of exercise on health **disappears** once you account for sleep. | pass | 1 | 无命中 | ❌ 漏判（P1-2） |
| D5 | NULL 边界外 | After adjusting for painkiller use, the association between fractures and pain vanishes. | rewrite | 0.70 | mediator_confusion×1 + fallacies(false_cause) | ✅ 判 |
| D6 | 疑问形混入 | Once you control for income, doesn't education have no effect on health? | pass | 1 | 无命中 | ❌ 漏判（P2 设计边界） |
| D7 | 否定对冲混入 | This doesn't necessarily prove that education is irrelevant, but once you control for income, education has no effect on health. | rewrite | 0.76 | mediator_confusion×1 | ✅ 判 |

## 1.3 r214 同步复测（推送前，全部样本重跑）

r213 矩阵跑完后、推送前，fetch 发现远程 main 已前进到 `2ffe000`（r214：1 号补测 mediator_confusion 三缺陷 + 补记 UPGRADE_LOG）。按「不在漂移基线上出结论」纪律，本地 rebase 到 r214 后全矩阵重跑。**四门禁复测不变**：16/16、20/20（210 键）、24/24、召回 52/52、误拦 302/326。良性侧 9 条仍 8 pass / 1 误拦（E5），r214 未推高误拦。

**r214 修复确认（1/13）**：

| 样本 | r213 实测 | r214 复测 | 对应 r214 改动 |
|---|---|---|---|
| C9 反问形（控制了收入之后，教育对健康难道就没有影响了吗？） | pass | **verify 0.76，mediator_confusion×1 + moral_foundations×1("控制")** | RHETORICAL_ZH（难道/岂/凭什么/何尝/…）替代一刀切 `/[?？]/` 豁免 |

**r214 修复不完整（3 类，补丁覆盖缺口，复测仍漏）**：

| 样本 | r214 复测 | 缺口（读 diff 坐实） |
|---|---|---|
| D4 The effect of exercise on health disappears once you account for sleep. | pass | 新 NULL_EN 腿 `/\b(?:effect\|association\|relationship\|correlation\|link\|impact\|influence)\s+(?:vanishes\|disappears\|...)/` 要求**名词与动词相邻**；"effect **of exercise on health** disappears" 名词短语插入即失配——消失族最高频的「effect of A on B disappears」形仍漏 |
| C5 扣除了止痛药的影响后，疼痛与骨折的关系就消失了 | pass | 新 NULL_ZH 腿有 烟消云散/荡然无存/不复存在/消解/消散/谈何/何谈/无从谈起/谈不上，**无「消失/不见了」** |
| A8 / D6 collider 反问形 | pass | RHETORICAL 检测只落在 `src/mediator-confusion.js`；`src/collider-bias.js` **未被 r214 触碰**（`git show 2ffe000 --name-only \| grep collider` = 0 命中），其一刀切 `/[?？]/` 豁免原样 |

**仍开启（r213 已报、r214 未动，复测确认）**：A4（EXEMPT_META_ZH 裸词统计）、A7（EXEMPT_CORRECT_ZH 不能说明，复测仍由 reasoning_coherence 代拦、collider 不承重）、A9-A11（CAUSAL_ZH 无 打击/挫伤/减损）、B3（COND_EN 无 of the…still on the books）、C6（互不相关）、C7（再也观测不到）、C8（不痛隐式 NULL + 注释-代码漂移）、E5 误拦（post_hoc route1 + pseudo_causal，r214 后仍在）。

**复测汇总**：攻击 36 条 → 目标维度承重 21（r213 为 20）、代拦 3、漏判 12（r213 为 13，净修复 1 条 C9）。

## 2. 漏判清单与根因（r213 基线 13 条；r214 复测后仍开启 12 条，根因分析如下）

### P0-1　EXEMPT_META_ZH 裸词「统计」整句洗白攻击（A4）
- **现象**：A4b「只统计了存活客户，投诉次数少的客户续约率反而更高，据此可以说投诉少促进了客户留存」pass；A4f「在只统计了存活客户的报表里，……」pass；A4 原句 pass。
- **根因**：`src/collider-bias.js` 的 `EXEMPT_META_ZH` 含裸词 **`统计`**（本意豁免「统计学讨论」），`anyHit` 为整句级豁免——任何含「统计」二字的句子在腿检测之前就被当作学术讨论放行。
- **证据链**：
  1. Bisect：唯一被拦的 A4c 与 A4b 从第 8 字起完全相同、四腿位置与窗距完全一致（cond=0 / assoc=20 / infer=25 / causal=33，全部合法），唯一差别是 COND 短语「在留下来的客户里」不含「统计」。
  2. 正对照：同句把「只统计了」换成「只收录」→ 不注入也判（collider_bias×1, verify 0.76）。
  3. 注入对照：A4b / A4f / A4 原句注入 `EXEMPT_META_ZH: []` 后全部 `hit=true`（detail=条件筛选后样本内相关被当作总体因果结论）。
- **误伤面**：`scripts/bidirectional-guard.js` 良性集 grep「统计」= 0 命中（仅注释），收紧不会推高误拦基线。
- **建议修复**：裸 `统计` 收紧为 `/统计学|统计方法|统计分析|统计表明|统计显示|统计推断|统计检验/`。修复后重跑双向门禁确认 302/326 不降、52/52 不降。

### P0-2　EXEMPT_CORRECT_ZH「不能说明」被否定对冲攻击利用（A7）
- **现象**：A7 前半句「这不能说明高配合度一定削弱战斗力」+ 后半句「但显然高配合度会削弱存活率」→ pass（collider 模块直跑 miss），最终仅 reasoning_coherence 代拦。
- **根因**：`EXEMPT_CORRECT_ZH` 含裸词「**不能说明**」（同类还有 不能证明/推不出/不足以说明/不足以证明），设计意图是豁免「数据不能说明因果」这类诚实对冲；但豁免是整句级，攻击句先垫一个真豁免词再下结论即可整体洗白。四腿实测全部合法（cond=0 / assoc=13 / infer=23 / causal=31，causal 前 8 字窗无否定）。
- **旁证**：EN 同族 B8（"doesn't necessarily prove... but it clearly shows..."）**能拦住**——`EXEMPT_CORRECT_EN` 只收 `can't conclude/infer/assume`、`no evidence` 等窄形，"doesn't necessarily prove" 不在豁免表内。ZH 豁免显著宽于 EN，是家族性缺口。
- **建议修复**：豁免前先跑腿③检测——若句中仍有 推断词（显然/据此/说明）+ 非否定因果词承重，则不套用正确响应豁免（或直接将 ZH 豁免对齐 EN 窄表）。

### P1-1　EXEMPT_META_EN 裸词 statistics 同族误伤（EN-统计）
- **现象**：B1 同句加入 "the statistics show that" → 从 `verify/collider_bias×1` 变 `pass`；注入 `EXEMPT_META_EN: []` 后恢复命中。
- **建议**：`statistics` 收紧为 `/statistics\s+(?:show|shows|suggest|indicate)|statistical\s+(?:analysis|method|test)/` 或删除裸词。另记录低危观察项：`EXEMPT_META_EN` 还有裸词 `collider`（物理讨论需要保留，攻击句含 collider 概率极低，暂不动）。

### P1-2　常量缺口（6 条）
| 样本 | 缺口 | 位置 |
|---|---|---|
| A9/A10/A11 | CAUSAL_ZH 无「打击/挫伤/减损」（同类可扩：损耗/危及） | `src/collider-bias.js` CAUSAL_ZH |
| C5 | NULL_ZH 无「消失」族（现只有 就不/便不） | `src/mediator-confusion.js` NULL_ZH |
| C6 | NULL_ZH 无「互不相关」（无关/并不相关/不相干 均不匹配该形） | 同上 |
| C7 | NULL_ZH 无「再也观测不到/察觉不到」族 | 同上 |
| D4 | NULL_EN 无「disappears/vanishes/fades」族；且 "The effect of X on Y" 形态不进 NULL_EN 的 between 形 | `src/mediator-confusion.js` NULL_EN |
| B3/B4 | COND_EN 无 "of the … still on the books" 开头形、"post-layoff workforce" 幸存短语、"the ones with"（现只有 only those / the ones who） | `src/collider-bias.js` COND_EN |

### P2-1　隐式 NULL + 注释-代码漂移（C8）
- C8「骨折患者之所以不痛，说到底是因为他们都在服用止痛药」pass。两条问题：
  1. **注释-代码漂移**：`src/mediator-confusion.js` 文件头注释声称腿①含「**之所以**」，但 CONTROL_ZH 正则实际无此词（只有 只因为/正是因为/是由于/归根到底/本质上是因为/说到底是因为 + because…吃/服用 兜底形，C8 靠后者命中腿①）。
  2. **隐式 NULL**：「不痛」这类效应缺失表现不进 NULL_ZH（现只有显式 没有效果/无关/消失族）。攻击力中等，是否纳腿②请 1 号评估；注释漂移建议顺手修。

### P2-2　疑问豁免（设计边界，3 条）
A8/C9/D6 均为模块开头 `/[?？]/` 整句豁免，**r213 UPGRADE_LOG 已记录为已知边界**，非回归。值得注意的不对称：EN 疑问攻击 B7 被 sealioning（prove 词）代拦，ZH 疑问攻击 A8/C9 无任何维度兜底全放行。**r214 状态：C9 已修复**（RHETORICAL_ZH 落地 mediator-confusion.js，复测 verify/mediator_confusion×1）；**A8/D6 仍开启**（collider-bias.js 未同步该检测，见 §1.3）。

## 3. 良性集扩展结果（9 条）

8/9 按预期 pass：E1 方法比较（控制年龄后运动降事件率）、E2 学术讨论（教材讲对撞偏差）、E3 正确响应形（不能只看幸存数据）、E4 概念转述（辛普森悖论）、E6 正确响应形（需要随机对照）、E7 学术讨论（per-protocol 可能高估）、E8 正确响应形（survivorship bias means we can't conclude）、E9 方法比较（adjusting for age…cannot be ruled out）。

**误拦 1 条（E5）**：
- 原文：`控制了中介变量之后，直接效应仍然显著，说明中介只传递了部分效应`（正当路径分析报告）
- 实测：`rewrite`，score 0，findings：`post_hoc×1(时序连接×因果断言)` + `pseudo_causal×1`
- 归因：`src/post-hoc.js` 腿①时序连接词「之后」+ 因果断言形误伤；mediator_confusion 自身正确豁免（中介变量/直接效应在 EXEMPT_META_ZH）。pseudo_causal 同判。
- 建议：post-hoc.js 与 pseudo_causal 侧对齐 collider/mediator 的 EXEMPT_META（加 直接效应/中介变量/路径分析 豁免）。若将此样本计入双向门禁良性集，误拦基线将由 302/326 变为 303/326——请 1 号连同修复一起重测。

## 4. 外部方案扫描（三层，如实记录）

| 层 | 检索 | 结果 |
|---|---|---|
| GitHub | collider/selection bias detection、fallacy detection rule-based | **无可集成纯规则方案**。命中：biaslyze（NLP 模型偏见检测，counterfactual+分类器，非纯规则）；FallacyDetection（★2，BERT 神经方法，EMNLP2023，非纯规则）；NLP-Bias-Identifier（社会偏见数据集+共现脚本，方向不同） |
| arXiv | collider bias text detection 2025-2026 | **空返（无可集成检测器）**。命中均为模型层研究：Selection Collider Bias in LLMs（2208.10063，机制论文无检测器）、spurious correlation×hallucination（2511.07318，方向不同） |
| Semantic Scholar | collider/selection bias fallacy detection | 同上，模型审计/幻觉检测方向，无纯规则文本谬误检测方案 |

**结论：空返，按既有形态（常量 + 邻近窗 + 豁免）自建。** 与 r213 UPGRADE_LOG 记录的 1 号扫描结论一致。

## 5. 给 1 号的修复清单（按优先级）

### A. r214 修复不完整（建议下一轮优先，3 项）
1. **D4**：NULL_EN 新腿名词-动词相邻要求过严。建议把间隔放开为 `\s+(?:of|on|in|for|between)\s+[^.]{0,40}?\s+(?:vanishes|disappears|...)`，或补一条宽松腿 `/\b(?:disappears?|vanishes|is\s+gone|goes\s+away)\b/i`（与 CONTROL 配对时限距窗已提供上下文，误伤可控）。复现：D4。
2. **C5**：NULL_ZH 补「消失|不见了」（与 r214 新腿 烟消云散/荡然无存 同族）。复现：C5。
3. **A8/D6**：把 r214 写入 `src/mediator-confusion.js` 的 RHETORICAL_ZH/EN 检测同步到 `src/collider-bias.js` 的疑问豁免（其 `/[?？]/` 一刀切是同一缺陷的另一处实例；复测证实 collider 侧未随 r214 修复）。

### B. 仍开启（r213 已报、r214 未动）
4. **P0-1**（1 行常量）：`EXEMPT_META_ZH` 裸「统计」收紧为 统计学/统计方法/统计分析/统计表明/统计显示/统计推断/统计检验。复现：A4b/A4f/A4 原句；正对照 A4pos（只收录即判）。修后重测双向门禁确认 302/326 不降。
5. **P0-2**：`EXEMPT_CORRECT_ZH` 不能说明/不能证明/推不出/不足以说明/不足以证明 改为「豁免前先跑腿③，句中仍有 推断词+非否定因果词 则不豁免」（或对齐 EN 窄表）。复现：A7。
6. **P1-1**：`EXEMPT_META_EN` 裸 statistics 收紧（复现：EN-统计）。低危观察：`EXEMPT_META_EN` 裸词 collider（物理讨论需保留，暂不动）。
7. **P1-2**：CAUSAL_ZH +打击/挫伤/减损；COND_EN +of the…still on the books / post-layoff 形；NULL_ZH +互不相关/再也观测不到。（D4/C5 已移入 A 组）
8. **P2-1**：评估隐式 NULL（不痛/无感）纳腿②；顺手修 mediator-confusion.js 头注释「之所以」与正则不符的漂移。
9. **误拦 E5**：post-hoc.js（post_hoc，腿① 时序连接词「之后」）/ pseudo_causal 加路径分析豁免（直接效应/中介变量/路径分析）；如计入良性集，误拦基线 302/326→303/326 需同轮重测。

## 6. 复跑方式

本报告 45 条样本全量嵌入（§1 表格 + §3），可直接复制进 `gate.check()` 复跑；bisect 与注入对照脚本逻辑：对 `checkColliderBias(text, { EXEMPT_META_ZH: [] })` / `{ EXEMPT_META_EN: [] }` 注入空豁免表对比 `hit`。本报告未改动引擎任何文件（硬禁令遵守：未碰 src/、门禁脚本、VERSION、package.json、README、SKILL、AGENTS、UPGRADE_LOG；未 push --force；无隐私文件入提交）。
