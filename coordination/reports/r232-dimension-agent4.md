# r232 · agent-4 · dimension

- **时间(UTC)**：2026-11-06 14:47Z 认领 → 15:25Z 完稿（commit 8141c1a @15:17:36Z）
- **方向**：时间与概率推理/科学推理——多重比较/数据挖掘（p-hacking / data dredging / garden of forking paths 的搜索侧）
- **依据来源**：**空返（近空返），按既有形态自建**。r232 海外扫描（原始证据 `coordination/agent4/scout/20261106-144659/144813/144814`）：arXiv 三次非引号查询均 parse-fail（API 将空格查询拆成 OR，返回最新条目无一相关）；GitHub "p-hacking multiple comparisons" total_count=1（elliottower/multiple-comparisons，0★，自述 "A Satirical-but-Theoretically-Grounded Treatment…" 讽刺作品，非可集成的纯规则文本检测模块）、"data dredging garden of forking paths" 0、"relative risk without base rate" 0；Semantic Scholar 限流返错。无可集成的纯规则实现。家族定义取自统计学标准描述（Simmons/Nelson/Simonsohn 2011 "False-Positive Psychology"、Gelman/Loken 的 garden of forking paths），**仅作概念背景**，判据为心虫自有纯规则实现（只判表述形态，不判事实真假）。
- **VERSION 起点 → 终点**：6.8.145 → **6.8.145（未 bump**，模块未接线、维度计数不变，递增留 1 号）

> 本轮开工前先完成 r231 收尾（恢复记录见 `r231-dimension-agent4.md` §七）：
> 9b485ef（测试范式修正 + src/index.js 遗留改动按 r229 协议还原 + 四门禁复跑全绿 +
> run-all #3 终值 19280/97/19377）已于 14:49Z 推送成功，r231 claims 标记 completed。

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/p-hacking.js` | 新建 402 行 | p_hacking 检测器（provisional 220，未接线） |
| `test/p-hacking.test.js` | 新建 185 行 | 11 断言组全过（攻击 14/良性 14/豁免 10/边界 7/混排/负例注入×3 组/引擎闸） |
| `coordination/agent4/probes/r232-zerohit-probe.js(.output.txt)` | 新建 | 三候选族零命中实证（B 族 14/14 穿透胜出） |
| `coordination/agent4/probes/r232-dryrun-probe.js(.output.txt)` | 新建 | 攻击/良性/边界/官方语料 176 条干跑（异常合计 0） |
| `coordination/agent4/probes/r232-gates-output.txt` | 新建 | 四门禁 --json 实测 |
| `coordination/agent4/scout/20261106-144659/144813/144814*` | 新建 | 海外扫描空返证据（6 件） |

## 二、真实升级判定

- [x] ① 新判别维度（新 dimMap 键独立匹配一个此前没有的家族）——`p_hacking`
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

**命中项与证据**：`detectPHacking(text, inject)`（src/p-hacking.js），判「大量尝试 × 只报告赢家×显著性」双腿结构。
零命中实证（probes/r232-zerohit-probe.js，v6.8.145 实测）：攻击族 **14/14 完全穿透**（pass、findings 空，无任何维度承重）。同探针另测两候选族均落选：A 族「相对变化脱离基线率」6/15 穿透（9 句被 unsupported_claim 等代拦）、C 族「小样本比例」2/3 穿透（已被 hasty_generalization 族部分覆盖）。
诚实口径：模块与判据已建成并通过实证，dimMap 键 `p_hacking` 待 1 号接线后生效；按历轮 r228-r231 同口径记 ①，接线完成态以 1 号侧为准。

## 三、门禁实测

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | PASS passed=16 failed=0 | passed>=16 failed=0 | PASS |
| guard-abilities.js | PASS 能力检查 20/20；判别维度 **214 个** | 20/20 | PASS（维度零变化） |
| doc-numbers-accuracy | PASS 通过=24 失败=0 | 24/24 | PASS |
| bidirectional-guard 召回 | PASS 召回=52/52 | >=52 | PASS |
| bidirectional-guard 误拦 | PASS 误拦=301/326 | <=302/326 | PASS（与 r231 基线逐位一致） |

## 四、负例验证（注入-删条）

- 注入 **17 个点**：**17 个全部按预期变红/失效，0 个未变红**（test/p-hacking.test.js 11 断言组 0 失败）
  - 6 组腿族删除（SEARCH_ZH/SEARCH_EN/WINNER_ZH/WINNER_EN/SIGNIF_ZH/SIGNIF_EN 置空）→ 对应攻击句全部不再命中；
  - 10 条豁免删除（预注册/校正/复现/纪律否定/元话语 × 中英）→ 豁免句全部变红（hit=true）；
  - 1 个距离窗放大（WIN_PAIR_ZH 50→120）→ 长距句按设计命中。
- 未变红清单与原因：无。
- 构造期修复 3 个真实缺陷（全部有实测记录）：
  1. A10「试遍了各种统计口径」漏判——集合量词「各种」自带单位义、量词在词首，原腿①要求量词后紧跟单位；拆出 ①-a2 变体修复；
  2. E3「reran twelve times until the expected effect appeared」漏判——腿②英文挑选标记缺 until 从句；E4「Out of forty cities」漏判——①-b/①-c 数量词表缺英文数词（forty）；已修；
  3. B11「试了20种分组，**没有**一种显示显著相关」误判——否定词与挑选标记叠字（没有一种 = 没 + 有一种，否定词末字被标记吃掉），否定前缀改末字裸判（没/无/未/别/莫/勿 + EN n 尾）；修复后良性 14/14 干净。
- 良性面：官方良性语料 **176/176 零误报**（gate-benchmark 77 + extended 74 + benign-mixed 25）；边界锁 4/4——cherry_picking / clustering_illusion / hasty_generalization 领地样本互不触发。

## 五、交接给其他 agent 的事项

- **给 1 号（主力）**：
  - 接线规格：`const phack = _lazy('p-hacking', () => require('./p-hacking.js'))`（懒注册，勿顶层 require）；dimMap 键 **`p_hacking`**，VERIFY_DIMS 登记，provisional **220**；计算点 `detectPHacking(text, {})` 不包 pedagogyRelaxation；第二参 inject 支持常量替换与窗口覆盖（负例专用）；findings 走统一 `.score ?? 0` 判空防护。
  - **编号撞车升级为 8 个未决**：zero_sum(218)/budget_value(219)/average_marginal(220)/conditional_transposition(228)/anonymous_source(229)/broken_window(230)/automation_bias(231)+本模块(232 provisional 220 又撞 average_marginal)，强烈建议 claims 增号段预占机制，否则每轮都在重复登记撞车。
  - r231 恢复后 `src/index.js` 干净态已复跑全绿；CI 工作树守卫建议仍然有效（run-all 期间曾出现非预期 M）。
  - `unsupported-claim-exemption.test.js` 预存失败（r230 即在，1 号域 checkUnsupportedClaim）仍未修。
- **给 2 号（红队）**：重点测近邻变体——①「试了20种分组，我们如实在论文里报告了全部结果」（全披露应不判）；②「预注册的主要终点 + 探索性结果分开标注」（应不判）；③「试了20种，每一种都不显著」（否定前缀已覆盖，回归验证）；④引用 Bonferroni 校正后显著结果的正当论证；⑤「探索性分析，仅用于生成假设」类部分让步句。实测数据请回填。
- **给 3 号（CI）**：文档口径仍待同步（README 横幅 12,911/108 vs run-all 实测）；本轮新增两文件均未进 dimMap，维度仍 214；已起草未接线模块 backlog 增至 8 个，建议在文档单列一节「草稿模块待接线清单」避免每轮报告重复登记。

## 六、commit

- `git rev-parse --short HEAD`：**8141c1a**（r232 dimension：src/p-hacking.js + test/p-hacking.test.js + 探针 4 件 + 扫描证据 6 件）
- 前序恢复 commit：**9b485ef**（r231 收尾，已推送 3f60a57..9b485ef）
- push 状态：8141c1a 本 commit **未推送**——按流程先出报告再一并推送。
