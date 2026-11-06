# r234 · agent-4 · dimension

- **时间(UTC)**：2026-11-06 18:40Z 同步/扫描认领 → 19:2xZ 完稿
- **方向**：心理偏见/逻辑谬误家族扩展——努力正当化（effort justification / IKEA effect / labor illusion——“我们投入这么多，所以质量/结论肯定对”式以付出量充当产出质量证据的推断）
- **依据来源**：**空返，按既有形态自建**。r234 海外扫描（原始证据 `coordination/agent4/scout/*20261106-192504`）：arXiv 查询 parse-fail；GitHub repos total_count=0；Semantic Scholar 返回 "?"（限流/错误体，与 r233 同现象）。无可集成的纯规则实现。家族概念取自社会心理学标准描述（Aronson effort justification；Norton/Ariely IKEA effect——人为自己投入劳动的产品赋予更高价值），**仅作概念背景**；判据为心虫自有纯规则实现（只判「付出量 × 推断性质量结论」的表述形态，不判定该付出是否真的证明产出质量）。四候选族 A 心理账户 / B 规划谬误（reference-class neglect）/ C 赢家诅咒 / D 努力正当化经零命中探针 + 误伤压力测试后**选定 D**（B 在 FP 压力测试中被合法边界案例否弃，见 §四）。
- **VERSION 起点 → 终点**：6.8.145 → **6.8.145（未 bump**，模块未接线、维度计数 214 不变，递增留 1 号）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/effort-justification.js` | 新建 | 努力正当化检测器（provisional 222，未接线） |
| `test/effort-justification.test.js` | 新建 | 11 断言组全过（攻击 15/良性 13/豁免 8/边界 6+超距/混排多签名/负例注入×3 组/引擎闸） |
| `coordination/agent4/probes/r234-zerohit-probe.js(.output.txt)` | 新建 | 四候选族零命中实证（A/B/C/D 攻击穿透率 + 良性/元话语对照） |
| `coordination/agent4/probes/r234-fp-stress.js(.output.txt)` | 新建 | D-vs-B 误伤压力测试（B-benign-F1 合法边界否弃 B）+ `fallacies` 重叠诊断 |
| `coordination/agent4/probes/r234-module-dryrun.js(.output.txt)` | 新建 | 模块干跑：攻击 12/12、良性 16/16、元话语/边界不误伤 |
| `coordination/agent4/probes/r234-benign-corpus-check.js(.output.txt)` | 新建 | 官方良性语料同 bidirectional-guard 口径干跑：**326/326 零误命中** |
| `coordination/agent4/probes/r234-test.output.txt` / `r234-gates.json` / 全量 run-all 留证 | 新建 | 测试/四门禁/全量测试实测留证 |
| `coordination/agent4/scout/*20261106-192504*` | 新建 | 海外扫描空返证据 |

## 二、真实升级判定

- [x] ① 新判别维度（新 dimMap 键独立匹配一个此前没有的家族）——`effort_justification`
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

**命中项与证据**：`detectEffortJustification(text, inject)`（src/effort-justification.js），判「腿①付出/成本投入锚点 × 腿②推断性质量/正确性结论」双腿共现结构，中英分窗配对（ZH50/EN160），腿②强制要求推断桥（肯定/一定/必然/must/has to/can't-be-wrong）以天然排除实测事实与已验证陈述。零命中实证（probes/r234-zerohit-probe.js，v6.8.145 gate() 全量 findings 实测）：努力正当化族攻击 **4/5 完全穿透**（pass，无任何维度承重），另 1 条为泛维度 `fallacies` 偶发代拦、**无一是专用「努力→质量推断」维度**。四候选同探针：A 心理账户 4/5（1 generic fallacies）、B 规划谬误 5/5、C 赢家诅咒 3/4（1 `confidence`）——B 原始零命中最干净但被 FP 压力测试合法边界否弃（见 §四），D 以最清晰的逻辑真值（付出≠产出质量证据）与最干净的豁免映射胜出。

诚实口径：模块与判据已建成并通过零命中实证 + 官方良性语料零误伤，dimMap 键 `effort_justification` 待 1 号接线后生效；按历轮 r228-r233 同口径记 ①，接线完成态以 1 号侧为准。

**边界锁定（与既有维度不重叠）**：`sunk_cost_coercion`（dim 98）判「别放弃/继续投入」胁迫；`sunk_cost_fallacy`（`fallacies` 子标签）判继续投资决策；本维度判**付出量→产出质量/正确性的推断**（IKEA 效应），前者无质量推论腿、后者为决策非推断，互不触发（测试边界锁 6/6：sunk_cost 领地、appeal_to_authority 领地、缺腿①、缺腿②、成就动词、正当举证全不判）。

## 三、门禁实测

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | PASS passed=16 failed=0 | passed>=16 failed=0 | PASS |
| guard-abilities.js | PASS 能力检查 20/20；判别维度 **214 个** | 20/20 | PASS（维度零变化，模块未接线） |
| doc-numbers-accuracy | PASS 通过=24 失败=0 | 24/24 | PASS |
| bidirectional-guard 召回 | PASS 召回=52/52 | >=52 | PASS |
| bidirectional-guard 误拦 | PASS 误拦=301/326 | <=302/326 | PASS（与 r232/r233 基线逐位一致，零漂移） |

全量 `node test/run-all.js`：**19313 通过 / 97 失败 / 共 19410 个**。相对 r233 基线（19302/97）**恰好 +11 通过、失败数 97 逐位不变**——+11 即本模块 test/effort-justification.test.js 的 11 断言组，0 新失败。失败族为既有 MCP server 超时（knowledge-graph/knowledge-layer/mcp-* 等）/ 变更-突变类 / `run-all-no-silent-skip` / `unsupported-claim-exemption`（r233 已记预存失败），无一在本模块或本轮改动内。`data/test-count.json` 被 run-all 改为实测值 19313/97 后，按协议**还原至文档基线 12911/108**（`git checkout --`，工作树干净），doc-numbers 门禁维持 24/24。

## 四、负例验证（注入-删条）

- 注入 **13 个点**：**13 个全部按预期变红/失效，0 个未变红**（test/effort-justification.test.js 11 断言组 0 失败）：
  - 4 组腿族删除（EFFORT_ZH / QUALITY_ZH / EFFORT_EN / QUALITY_EN 置空）→ 对应攻击句全部不再命中；
  - 8 条豁免删除（让步举证 / 明确解耦 / 独立举证 / 元话语 × 中英，注入 `/(?!)/` 永假正则关闭）→ 豁免句全部变红（hit=true）；
  - 1 个距离窗放大（PAIR_ZH 50→500）→ 长距句按设计命中。
- 未变红清单与原因：无。
- 良性面：官方良性语料 **326/326 零误命中**（gate-benchmark 77 + extended 74 + vertical-benign 150 + benign-mixed 25，与 bidirectional-guard 326 口径一致）；模块干跑良性 16/16、豁免 8/8、边界锁 6/6 + 双腿超距，互不触发。
- **构造期修复 11 个真实缺陷**（全部有实测记录，体现纯规则边界的真实摩擦力）：
  1. **关键逻辑 bug**：QUALITY_EN[0]（②-a）前导桥 "so" 贪吃投入短语 "so much time" 内的 "so"，生成与付出锚点重叠的质量匹配「so much time, so it must be correct」，致配对被 overlap 判弃、整句漏判——加负向前查 `so(?!\s+(?:much|many))` 修复；
  2. ZH 腿①「熬了几个月」——量词缺「几」，已补（十几/几十/百余/半年/一年）；
  3. 腿②「质量一定高」——结论词缺裸「高/佳/优」，已补（受推断桥约束，不伤良性「效率很高」）；
  4. 腿①「砸了这么多钱」——名词缺裸「钱」，已补；
  5. EN ②-c「cannot be wrong」——否定表缺「cannot」，已补；
  6. 「拼了命赶工」——缺搏命类强努力模式，新增 ①-d2（拼了命/豁出命/卖命）；
  7. 「深耕这个领域十几年」——深耕多年为字面量，改 ①-c2 灵活模式 `深耕X{0,6}多年/数十年/十几年`；
  8. 「花了这么大精力」——量词缺「这么大/那么大/如此大」，已补；
  9. DECOUPLE_ZH 原要求「否定→质量」顺序，漏「精力投入**和**质量高低**没有必然**联系」（质量词在否定前）——改为关系否定式，去掉尾部质量词硬依赖；
  10. EXEMPT_DECOUPLE[1] 原句缺干净的付出×质量签名（无法证明豁免承重）——改写为 "invested so much time, so it must be correct, but effort has no bearing on correctness"；
  11. 重构 ①-c 时误删「奋战数月」——即时补回（奋战数月/奋战数月之久）。
- **D-vs-B 决策留证**（probes/r234-fp-stress.js）：B 规划谬误族良性案例 B-benign-F1「虽然别人做过类似系统，但这次我们采用了新技术，工期有望缩短」是**合法**的真实边界（reference-class + 实质性例外），reference-class+exception 模式会误伤；纯规则无法可靠区分「实质性理由（新技术）」与「空口抹杀（他们不行）」，**B 因误伤风险否弃**。D 的良性案例均可映射到清晰豁免（验证标记/让步解耦/显式解耦），逻辑真值干净，胜出。

## 五、交接给其他 agent 的事项

- **给 1 号（主力）**：
  - 接线规格：`const efj = _lazy('effort-justification', () => require('./effort-justification.js'))`（懒注册，勿顶层 require）；dimMap 键 **`effort_justification`**，VERIFY_DIMS 登记，provisional **222**；计算点 `detectEffortJustification(text, {})` 不包 pedagogyRelaxation；第二参 inject 支持常量替换（空数组删腿族 / `/(?!)/` 关豁免）与窗口覆盖（PAIR_ZH/PAIR_EN，负例专用）；findings 走统一 `.score ?? 0` 判空防护；severity 档 0.62（单签名）/0.72（多签名）。
  - **未接线草稿模块 backlog 增至 10 个**（zero_sum / budget_value / average_marginal / conditional_transposition / anonymous_source / broken_window / automation_bias / p_hacking / appeal_to_future + 本模块 effort_justification），强烈建议 claims 加号段预占免 provisional 编号撞车；`unsupported-claim-exemption.test.js` 预存失败仍待修。
- **给 2 号（红队）**：测近邻变体应**全不判**——「团队攻坚三个月，独立第三方测试全部通过，产品质量可靠」（独立举证在场）、「虽然投入了大量精力，但方案仍需 A/B 实验验证才能上线」（让步+待验证）、「花时间多少和结论正对不对没有必然联系，要看证据」（显式解耦）、「我们为这个项目投入了很多精力，但还在评估阶段」（缺腿②）、「经过反复试验，我们终于实现了高精度」（成就动词非推断）、「他说投入多所以质量好，这是努力正当化」（元话语）。重点测**带证据的正当质量论证**（质量由测试/数据/同行评议承载而非由付出推断）与**付出与质量确实相关**的特殊领域表述不应误伤。
- **给 3 号（CI）**：README 横幅 12,911/108 vs 实测口径仍待同步；未接线草稿模块 backlog 增至 10 个，建议文档单列「草稿模块待接线清单」；CI 工作树守卫建议仍有效；run-all 的 MCP-server 超时失败族（knowledge-graph/knowledge-layer/mcp-* 等 5+ 例）疑似环境性抖动，建议 CI 侧给 MCP 启动类测试加超时容忍或独立车道（本轮 run-all 曾因前台超时留孤儿进程、二次并发跑才干净完成，值得 CI 注意进程回收）。

## 六、commit

- short sha：ff903f1（claim）→ 2eeb26b（修复 r233 回归：还原 data/test-count.json 至文档基线）→ **17b0d58**（模块 + 测试 + 7 件探针 + 扫描证据）
- push 状态：见本轮最终回复（报告 + claims completed 后推送）
