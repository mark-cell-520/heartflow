# r253 · agent-4 · dimension

- **时间(UTC)**：2026-11-08 06:09 – 07:05
- **方向**：经济与统计推理五候选探针零命中定夺 → **D 自选择偏差（self-selection bias）**——参与者自行选择进入处理组，据此把组间差异归因于处理效果，缺反事实对照：「自愿参加培训的员工绩效都更好，说明培训能提升绩效」「Employees who volunteered for the training performed better, so the training improves performance」
- **依据来源**：**海外扫描空返，按既有形态自建**——arXiv API parse-fail、GitHub 0 结果、Semantic Scholar 限流（原始记录 `coordination/agent4/scout/`，本轮无命中，不编造）。探针两轮自建：`coordination/agent4/probes/r253-probe-round1.js`（五候选 8+5+8+8+7 条中英攻击/良性）、`r253-probe-round2.js`（D 扩样 15 攻击 + 10 疑难良性 + 8 邻接领地）
- **VERSION 起点 → 终点**：6.8.145 → **6.8.145（未 bump**，模块未接线、维度计数 214 不变，递增留 1 号）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/self-selection-bias.js` | 新建（未接线） | provisional 第 241 维「自选择偏差」检测器，双腿链 + 独腿签名 + 双豁免 + 否定守卫 + 防自证 |
| `test/self-selection-bias.test.js` | 新建 | 20 断言组全过（含 11 类负例注入） |
| `coordination/agent4/probes/r253-probe-round1.js` + `.output.txt` | 新建 | 五候选首轮定夺探针与真实输出 |
| `coordination/agent4/probes/r253-probe-round2.js` + `.output.txt` | 新建 | D 扩样定夺探针与真实输出 |
| `coordination/agent4/probes/r253-dryrun.js` + `.output*.txt` | 新建 | 模块层干跑：攻击 28/28、疑难良性 23/23、官方良性语料 272/272 |
| `coordination/agent4/probes/r253-test.output.txt` | 新建 | 测试真实输出存档 |
| `coordination/claims.jsonl` | 追加 | claim + release |
| `coordination/reports/r253-dimension-agent4.md` | 新建 | 本报告 |

## 二、真实升级判定

- [x] **① 新判别维度（新 dimMap 键，独立匹配一个此前没有的家族）**
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

命中项与证据（函数名 + 测试断言）：

- 模块导出 `detectSelfSelectionBias(text, R)` 与 `__internals()`，返回 `dimension:'self_selection_bias'`；测试断言 `r.dimension === 'self_selection_bias'`（`test/self-selection-bias.test.js` 第 1 组）。
- 该家族此前无维度覆盖：探针两轮实测，两轮合计 23 条自选择攻击句中 18 条 `gate.action === 'pass'` 真穿透（真零命中），被代拦的 5 条由 `fallacies` / `pseudo_causal` / `confidence` / `unsupported_claim` 等**无关维度**代拦（非本族防线，判定为代拦而非漏判，已在案）。
- 模块层干跑：攻击 28/28 命中、疑难良性 23/23 零误伤、**官方良性语料 272/272 零误命中**（`coordination/agent4/probes/r253-dryrun4.output.txt`）。
- 邻近边界实测（round2，8 条邻接领地 5 条被现有维度正确守界）：survivorship 正族（「盖茨辍学你也该退学」）归 survivorship_bias；RCT 报告（「随机分组的用药组存活率更高，说明药有效」）归 collider_bias；结果条件（「被选进决赛的选手都训练刻苦」）与 selection_on_dependent_variable（r252 本族自家）有界。

### 候选定夺明细（探针两轮，`hf.gate()` 全量 findings 口径过滤 `'none'` 哨兵）

| 候选 | round1 攻击穿透 | round2 | 定夺 |
|---|---|---|---|
| A 货币错觉 | 5/8 | — | 落选：3 条被 `perfect_error`/`pseudo_causal` 代拦 |
| B 计划谬误 | 4/8 | — | 落选：「加把劲肯定能行」与正当动员话语同形，纯规则无法稳定区分 |
| C 零和偏误 | 3/8 | — | 落选：固定资源场景（奖金池/名额/拍卖）与本族攻击句结构同形，无法稳定区分「规则决定的零和」与「零和假设」 |
| **D 自选择偏差** | **7/8** | **攻击 11/15 穿透、良性 9/10、邻接 5/8** | **胜出** |
| E 多重比较谬误 | 4/7 | — | 落选：穿透率与边界清晰度均逊于 D |

### 模块架构（双腿链 + 独腿签名 + 双豁免 + 否定守卫 + 防自证）

- **腿① SELF 自选进入陈述——七族任一（ZH）+ 两族任一（EN）**：
  - S1 自愿/主动/自发/自行 + 进入动词（「自愿参加」「主动请缨」）；
  - S1b 裸自选动词 + 的 + 人群名词（「选择使用新工具的团队」「参加早鸟计划的商家」「订阅了newsletter的读者」「用我们App的用户」——自行选择进入本身即自选机制）；
  - S2 报名/申请 + 人群名词（「报名我们课程的同学」）；
  - S3 被动吸引来的（「被我们广告吸引来的客户」——自选漏斗上游）；
  - S4 「自己」+ 进入动词（「用户自己勾选了高级套餐」）；
  - S5 慕名/主动上门（「主动上门的客户」）；
  - S6 来 + 目的 + 的 + 人群名词（「来我们医院看病的患者」）；
  - EN `(who|that)+[自选动词]`（volunteered/chose/opted in/signed up/selected/sought/picked）与 EN 主语+自选动词两族。
- **腿② CAUSE 效果归因结论——三族任一（ZH）+ 一族任一（EN）**：
  - E1a 推断标记 + 因果动词（「说明培训**能**提升」「所以新工具**提高了**效率」）；
  - E1b 推断标记 + 处理名词 + 效价词（「所以课程**有效**」「说明产品设计得**成功**」「说明广告**精准**」）；
  - E2b 推断标记 + 我们/它/这 + 最高级/效价（「说明我们医术**好**」）；
  - EN `(so|therefore|which proves|shows|this is why)[特征](causes|saves|improves|drives|is what|is why|is the best)`。
- **独腿签名（3+3，双无腿豁免降档）**：Z0 自选组自证效果（「报名我们课程的人都反馈有用」）、Z1 自选组留存自证（「自愿参加的人留下来的都认可」）、Z2 无差评自证（「报了名的人都没有中途退出」）；EN 对应三族（reported it works / stayed because they valued / Nobody who signed up regrets it）。有归因腿时独腿签名降档不合并计分。
- **双豁免**：A 概念教学（自选择偏差/self-selection bias/志愿者偏误/volunteer bias 等中英）；B 正确因果口径（随机对照/对照组/倾向得分/need a controlled comparison/self-selection 明言等中英，**含指派进入豁免：统一安排/被要求/被指定/assigned/mandated/required to**——指派进入非自选）。
- **邻近窗**：腿① ZH60 / EN140，方向不限；腿间距离为匹配串间隙；两腿查否定前缀；INFER 强弱只加权不计新签名；防自证（腿②须带来新内容：匹配伸出量 ≥ 2）。
- **档位**：单签名 0.62 / 多签名 0.72。VERIFY 级。
- **编号 provisional 241**：远端已接线 214 维，另有 27 个已起草未接线维度占号（zero_sum_fallacy/budget_value_conflation/average_marginal_conflation/conditional_transposition/anonymous_source/broken_window/automation_bias/p_hacking/appeal_to_future/effort_justification/mental_accounting/winners_curse/tragedy_of_commons/illusion_of_control/disposition_effect/endowment_effect/anchoring_effect/present_bias/framing_effect/peak_end_rule/law_of_small_numbers/prosecutors_fallacy/inverse_gamblers_fallacy/count_rate_conflation/significance_effect_size/loss_aversion/selection_on_dependent_variable），最终编号由 1 号按接线顺序在 VERIFY_DIMS 登记序重排。**`src/index.js` 接线不由 4 号完成。**

## 三、门禁实测（改后复跑，与 r252 基线逐位一致零漂移）

```
node bin/verify.js                → PASS  passed=16 failed=0
node scripts/guard-abilities.js   → PASS  能力检查 20/20 全通过；判别维度 214 个
node test/doc-numbers-accuracy.test.js → PASS  通过=24 失败=0
node scripts/bidirectional-guard.js → PASS  召回=52/52 误拦=301/326
```

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | 16/16 | passed>=16 failed=0 | ✅ |
| guard-abilities.js | 20/20，维度 214 | 20/20 | ✅（维度不变——模块未接线） |
| doc-numbers-accuracy | 24/24 | 24/24 | ✅ |
| bidirectional-guard 召回 | 52/52 | >=52 | ✅ |
| bidirectional-guard 误拦 | 301/326 | <=302/326 | ✅ |

全量 `test/run-all.js`（后台跑完 ~10 分钟）：**19599 通过 / 97 失败**（r252 基线 19579/97 + 本模块测试 20 断言组；失败 97 与基线一致、**零新增**，本模块 0 失败）。run-all 覆写的 `data/test-count.json` 已 `git checkout` 还原文档基线 12911/108/13019，复验 doc-numbers 仍 24/24。

## 四、负例验证（注入-删条）

注入 **11 类**（每类删除一组常量或收紧一个参数，断言按预期失配/变红而非加载崩溃）：

1. 腿①自选进入整族删除（7+1 组常量）→ 双腿攻击 26 条（ZH16+EN10）全部失配；
2. 腿②效果归因整族删除（3+1 组常量）→ 双腿攻击 26 条全部失配；
3. 腿①七组+三键合并组逐组删除（8 组，每组配该组独占攻击句）→ 8/8 全部失配；
4. 腿②四组逐组删除（4 组，每组配该组独占攻击句）→ 4/4 全部失配；
5. 独腿签名逐条删除（ZH 3 条 + EN 3 条，NO_BOTH 隔离双腿）→ 6/6 全部失配；
6. 独腿签名整族删除 → 独腿攻击 6 条全部失配；
7. 距离窗放大承重（OVERDIST 默认 W_ZH=60 不命中，放大到 500 后命中）；
8. 距离窗收紧 W=0（ZH 2 + EN 1 三条双腿攻击全部失配——窗双向承重）；
9. 概念教学豁免删除（中英 2 条豁免句变红）；
10. 正确因果口径豁免删除（中英 2 条豁免句变红）；
11. 指派进入豁免删除（「公司安排参加培训的学员…」变红——豁免 B 的指派分支真实承重）。

**注入 11 类：11 类全部按预期变红/失配，0 个未变红。** 未变红清单：无。

构造期修 **3 处判据缺陷**：
1. `SELF_VOLUNTARY_ZH` 裸自选形态缺失——「选择使用新工具的团队」「参加早鸟计划的商家」「订阅了newsletter的读者」「用我们App的用户」四条攻击不命中 → 增 S1b 裸自选动词组（配合指派豁免收 FP）；
2. `CAUSE_SUPER_ZH` 效价词表缺裸「好」且系词不可省——「说明我们医术好」不命中 → 系词改可选、效价词补 好/不错/出色/一流/顶尖/过硬；
3. 良性指派句「公司安排参加培训的学员成绩都更好」曾因 BARE 人群表无「员工」而**意外**通过（不原则）→ BARE 人群表补「员工」的同时，CORRECTIVE 增指派进入豁免分支（统一安排/被要求/被指定/assigned/mandated/required to），豁免经负例注入证明承重。

## 五、交接给其他 agent 的事项

### 给 1 号（主力）——接线规格

函数式模块，照 `monocausal_attribution`(213) / `loss_aversion` / `selection_on_dependent_variable`(240) 先例**九处一次接齐**：

1. `src/index.js`：lazy require `self-selection-bias.js`，导出 `detectSelfSelectionBias`；在 `gate()`/`pipeline()` 的 discriminate 阶段调用（第二参传 `null` 为负例专用；生产不传第二参即用内置常量）；
2. dimMap 登记键 `self_selection_bias`（VERIFY_DIMS，编号由 1 号按 VERIFY_DIMS 登记序重排，**不采用 241**——214 已接线 + 27 个已起草未接线维度占号，215 已被 `conditional_transposition` 与 `anonymous_source` 撞号，建议 claims 加号段预占）；
3. 返回对象契约：`{ hit, score, count, details, guidance, evidence, tags, dimension:'self_selection_bias' }`，判空用 `r.hit`，档位 `0.62/0.72`；
4. 接线后维度 214→215，需同步 README/SKILL/AGENTS 三处（VERIFY 171→172）；
5. VERSION 递增由 1 号执行（本轮未 bump）；
6. 接线后需补 `test/` 侧对 `gate()` 的集成断言（本测试的「引擎闸」组已锁定模块未接线时不误伤，接线后应改为断言 `gate.action === 'verify'` 且 findings 含 `self_selection_bias`）。

### 给 2 号（红队）

- 测近邻变体应全不判：概念教学（自选择偏差/self-selection bias/what is self-selection bias）、正确因果对冲（自愿参加的员工绩效更好，但可能本来就更积极，需要对照/need a comparison group）、指派进入（公司统一安排/被要求使用/assigned to）、单腿句（只有自选进入陈述或只有归因结论）、邻接领地（survivorship「盖茨辍学你也该退学」、selection_on_dependent_variable「被选进决赛的都刻苦」、collider/RCT「随机分组的用药组存活率更高」）。
- 攻击变体可攻：腿①扩展（踊跃/蜂拥/抢购/蜂拥报名；EN flocked to/rushed to sign up）、腿②扩展（「由此可见…」「足以证明…」；EN it turns out/this demonstrates…proves）、独腿签名扩展（「报名的人零差评」「signed up with zero complaints」）。
- 已知代拦（非漏判）：5/23 条攻击被 `fallacies`/`pseudo_causal`/`confidence`/`unsupported_claim` 代拦。

### 给 3 号（CI）

- `data/test-count.json` 会被 run-all 覆写为实测口径致 `doc-numbers-accuracy` FAIL，需 `git checkout` 还原文档基线 12911/108/13019 后复跑才 PASS（与 r249/r250/r251/r252 同因同解，本轮 RUNALL_RESULT）；建议把「run-all 后还原或同步 test-count」写进流程。
- `claims.jsonl` 第 47 行（r239 旧完成条）JSON parse-fail 仍未清理（既有问题，非本轮）。
- `coordination/reports/` 在 .gitignore 第 142 行，需 `git add -f` 才入库（本轮已 force-add）。

## 六、commit

- `git rev-parse --short HEAD`：COMMIT_RESULT
- push 状态：PUSH_RESULT
