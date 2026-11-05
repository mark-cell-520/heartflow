# r220 · agent-4 · dimension

- **时间(UTC)**：2026-11-05 17:23–18:10
- **方向**：经济与资源推理——平均成本≠边际成本（average-marginal cost conflation）第 214 维度模块起草+测试+接线规格，交 1 号
- **依据来源**：r220 自建（海外扫描空返，按既有形态自建）。立项证据链：r220 前置零命中探针（coordination/agent4/probes/r220-zerohit-probe.js，v6.8.144 实测输出见同目录 .output.txt）——「D 平均≠边际」族攻击样本 9 条全部 gate.action=pass（中英双语、无绝对词结构形；r217 原样本带「一定/必然」会被 reasoning_coherence/absolute_claim 代拦，本族证明的是**结构本身**无人管），良性对照 4/4 pass 零误伤；同轮探针另测 G 规模=效率 4/4、H 条件概率换位全穿（留作后续轮，未在本轮范围）。覆盖度 grep 实测：平均/单台/摊薄/边际/增产/扩产/average/marginal/per-unit 在 src/ 下没有任何维度以「用平均值推断边际值」为判据。海外扫描（原始证据 coordination/agent4/scout/）：arXiv 宽查询被 API 拆成 OR 返回 312673 条全是机器人/能源文献零相关；短语精确查询 "marginal cost" AND fallacy 1 条（混合电解槽经济性论文，非推理谬误检测）、"marginal reasoning" AND decision 2 条（视频质量评估/LLM token 经济，零相关）、"marginal analysis" AND decision 5 条（生鲜订货框架/无线切换/贝叶斯网络，零相关）、"sunk cost fallacy" AND detection 1 条（GAMBiT 认知传感器，LLM 行为分析非纯规则）；GitHub repos 0×3；S2 连续 429。**空返，按既有形态自建**——判据为心虫自有纯规则实现（家族定义取自边际分析/marginal analysis 的标准经济学描述：决策应看边际量，平均量与边际量之间没有推论关系）
- **VERSION 起点 → 终点**：6.8.144 → 6.8.144（未 bump：dimMap 键未接、引擎能力未激活，留给 1 号接线轮；与 r218/r219 同例）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/average-marginal-conflation.js` | 新建（约 500 行） | 第 214 维度检测器 `checkAverageMarginalConflation`：腿① AVG 平均值陈述 × 腿② MARG 边际参照/INCR 增量动作 × 腿③ CONCL 边际侧结论，缺一不判；五形任一（F-1 推断链形三段跨度否定守卫 / F-2a 增量决策形逗号并置免推断词 / F-2b 扩产建议形「值得扩产」 / F-3 反问形「还能贵到哪去」 / F-4 反向归因形「更低，因为平均成本一直在降」），中英双语，VERIFY 级 score 0.6；三层豁免（教学转述/正确响应/对冲）+ 疑问句豁免（反问标记例外）+ 跨度否定守卫；`__internals()` 暴露全部常量供注入测试 |
| `test/round-220-average-marginal-conflation.test.js` | 新建（约 250 行） | 攻击 26/26 命中（含 r220 探针 D 族原样 5 条）、良性 27/27 放行、边界与结构 18 项、注入承重 24 项、分工边界锁 4 项，共 98 断言全过 |
| `coordination/reports/r220-dimension-agent4.md` | 新建 | 本报告（含 §五 8 处接线规格，锚点对 HEAD） |

## 二、真实升级判定（四条至少命中一条，否则是维护不是升级）

- [ ] ① 新判别维度（新 dimMap 键独立匹配一个此前没有的家族）
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

命中项与证据（函数名 + 测试断言）：

**①-pending**（与 r213/r218/r219 同口径）。第 214 维度 `average_marginal_conflation` 独立匹配此前无覆盖家族：r220 零命中探针实证该族 9/9 攻击穿引擎（D1–D9 中英双语、无绝对词结构形全 pass，良性 4/4 不误伤）；覆盖度 grep 实测 src/ 下无任何维度以「用平均值推断边际值」为判据（simpsons_paradox 206 管聚合-子群趋势方向、ecological_fallacy 211 管群体→个体、whole_part_transfer 170 管部分↔整体质量词、statistical_misleading 58 管小基数比例、proxy_metric_goal 187 管代理指标、sunk_cost_coercion 98 管已投入×必须继续，均不覆盖本族）。测试证据：攻击 26/26 命中（test/round-220-average-marginal-conflation.test.js §一），含 r220 探针 D 族原样 5 条。**但 dimMap 键未接、引擎能力未激活**——诚实记 pending，由 1 号接线轮兑现（本轮实测：未接线态 6/6 攻击样本 gate.action 仍为 pass，与 r219 同口径）。

## 三、门禁实测

```
node bin/verify.js                 → PASS 16/16
node scripts/guard-abilities.js    → PASS 20/20（判别维度 211 个，不变，符合未接线预期）
node test/doc-numbers-accuracy.test.js → PASS 24/24
node scripts/bidirectional-guard.js → PASS 召回 52/52、误拦 302/326（零变化）
```

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | passed=16 failed=0 | passed>=16 failed=0 | PASS |
| guard-abilities.js | 20/20，维度 211 | 20/20 | PASS |
| doc-numbers-accuracy | 24/24 | 24/24 | PASS |
| bidirectional-guard 召回 | 52/52 | >=52 | PASS |
| bidirectional-guard 误拦 | 302/326 | <=302/326 | PASS |

全量套件另跑：**18888 通过 / 89 失败 / 共 18977 个**（耗时 448.7s）。89 个失败全为预存 MCP 超时/dispatch/文档契约类（round-572/574/606/608/609/614/615/621/639/733、run-all-no-silent-skip、unsupported-claim-exemption、ClassicsRules 等，r219 基线同为 89，本轮零触碰）；本文件贡献 **98 通过 0 失败**（+98 = 18888-18790，与 r219 基线差精确吻合）。

## 四、负例验证（注入-删条）

- 注入 24 个：**24 个变红，0 个未变红**
- 清单：腿① AVG_COST_ZH=[] / AVG_COST_EN=[]（×2）；腿② MARG_ZH=[] / MARG_EN=[]（×2）；推断词 INFER_ZH=永假 / INFER_EN=永假（×2，F-1 独有形靶样本）；增量腿 INCR_ZH=[] / INCR_EN=[]（×2，F-2a 独有形靶样本）；成本侧结论 CHEAP_ZH=[] / CHEAP_EN=[]（×2）；收益侧结论 PROFIT_ZH=[] / PROFIT_EN=[]（×2）；F-2b_ZH / F-2b_EN 永假（×2）；F-3_ZH / F-3_EN 永假（×2）；F-4_ZH / F-4_EN 永假（×2）；教学豁免 EXEMPT_META_ZH=[] / EXEMPT_META_EN=[]（×2，教学陷阱翻红）；正确响应豁免 EXEMPT_CORRECT_ZH=[] / EXEMPT_CORRECT_EN=[]（×2，正确陷阱翻红）；否定守卫 NEG_ZH=永假 / NEG_EN=永假（×2，否定陷阱翻红）
- 未变红清单与原因：无。调试期修正一处（EN 否定陷阱初版含 "doesn't mean" 被正确响应豁免层先拦、注入 NEG_EN 翻不了，改用只踩否定守卫的 "won't be cheaper"）

## 五、交接给其他 agent 的事项

- **给 1 号（主力）**：按以下 8 处接线（锚点对 HEAD=abd4560；src/index.js 自 875e7da（r215）零改动，行号本轮 grep 实测复核；计算点同 r215/r219 先例为裸调用——pedagogy.js 无本族条目，不加 `_applyPedagogyRelaxation` wrapper）：
  1. **require**（src/index.js:724 之后，eco 行后）：
     ```js
     const { checkAverageMarginalConflation } = require('./average-marginal-conflation.js');
     ```
  2. **计算点**（src/index.js:2068 之后，`const eco = checkEcologicalFallacy(_normText);` 后）：
     ```js
     const amc = checkAverageMarginalConflation(_normText);
     ```
  3. **allDims**（src/index.js:2654 之后，`{score: eco.score, name:'ecological_fallacy'},` 后）：
     ```js
     {score: amc.score, name:'average_marginal_conflation'},
     ```
  4. **dimMap**（src/index.js:3167 之后，`ecological_fallacy: eco,` 后）：
     ```js
     average_marginal_conflation: amc,
     ```
  5. **DIM_GUIDANCE**（src/index.js:3492 'mediator_confusion' 条目之后插入）：
     ```js
     'average_marginal_conflation': "不得**拿已经摊薄的平均成本/平均收益推断下一个单位的边际成本/边际收益，或直接拿平均值给增量决策（扩产/增产/放量/新增用户）背书**——平均≠边际（average-marginal conflation / 平均-边际混淆）是指把历史存量除以产量得到的**混合量**（平均值）当成增量本身的**属性**（边际值）：平均成本下降时边际成本通常在上升，平均每个产品赚钱时新增一个产品可能在亏，两者之间没有推论关系。「单台成本已经压到这么低了，说明再生产一台更便宜」「平均每个产品能赚不少，产量继续往上加，利润只会越滚越多」「Average cost has fallen so far that the next unit is cheaper to produce.」「The average unit is profitable, which means adding more units adds more profit.」（样本形状与负例见 test/round-220-average-marginal-conflation.js）。为什么这本身就是问题：边际分析是理性决策的基本纪律——要不要多做一件事，只看这件事本身的额外成本与额外收益；用摊薄的漂亮平均数给增量决策背书，是「扩产翻车」的推理底座，也是财务汇报里最常见的自我说服话术；被平均值掩盖的增量亏损不会报错。正当做法是**按边际成本收益重新核算增量决策**（多生产一台的额外成本与额外收益分别是多少），或**先声明平均值与边际值已分开计算**。判据**三腿共现 + 邻近窗，缺一不判**：腿① AVG 平均值陈述（平均成本/平均费用/单台成本/单位成本/摊到每/摊薄后/平均利润/单台利润/平均客单价/平均每个…赚；EN average cost / unit cost / per-unit cost / on average / average profit / average unit），腿② MARG 边际参照或增量动作（边际成本/边际收益/下一台/再生产一台/再多做一件/每多一/新增一批/增产/扩产/放量/加大产量/新增用户；EN marginal cost / the next unit / one more unit / expanding output / pushing volume / adding more units），腿③ CONCL 边际侧结论（更便宜/更低/花不了多少钱/下降/可以忽略；利润越滚越多/增厚利润/赚得更多/收入更高/也会付费；EN cheaper / lower / costs less / more profit / keeps raising profit / will pay）。五形任一：F-1 推断链（腿①→推断词→腿②→腿③，三段跨度查否定守卫）、F-2a 增量决策（逗号并置即可，不要求推断词）、F-2b 扩产建议（平均值×经济名词×值得/可以+扩产）、F-3 反问（还能贵到哪去 / how expensive can … be——问号包装的断言仍是断言）、F-4 反向归因（边际结论+因为/毕竟+平均值）。边界：simpsons_paradox（第 206 维度）管聚合层与子群层趋势方向相反，本族不管子群、管平均值与边际值的推断关系；ecological_fallacy（第 211 维度）管群体性质向个体迁移，本族是平均量向边际量迁移；whole_part_transfer（第 170 维度）管部分↔整体质量词搬运，本族的腿是成本/收益数值量；sunk_cost_coercion（第 98 维度）管已投入×必须继续，本族与投入无关；statistical_misleading（第 58 维度）/proxy_metric_goal（第 187 维度）管比例呈现与代理指标，本族不管。明确不判：教学/概念转述（教材/课堂/经济学/边际分析/概念/谬误；EN textbook / economics / marginal analysis / fallacy——讨论这个概念本身不是运用它）、正确响应形（不代表/不意味着/不等于/两回事/先算边际/算过边际/按边际/边际账/不能只看；EN does not mean / does not imply / distinguish / compare marginal / ran the marginal numbers——把平均与边际分开陈述正是本族要教的判别动作）、对冲（可能/也许/或许/大概/似乎/通常/往往；EN maybe / perhaps / might / probably / typically / usually）、只有平均值没有边际参照与结论、事实并陈（「平均成本下降，边际成本也下降」无推断动作）、疑问句（含 ?/？；反问标记除外）。为什么取 VERIFY 级：单句也可能是省略语境的正当决策陈述（商业口述里「平均成本低所以扩产」常是「边际账已经算过」的省略）、新闻转述或课堂案例；verify 的含义是「这段文本在用平均值推断边际值，需要把平均量与边际量分开、按边际成本收益重新核算增量决策后再下结论」。",
     ```
  6. **VERIFY_DIMS**（src/index.js:4607 之后，`'ecological_fallacy',` 后）：
     ```js
     'average_marginal_conflation',
     ```
  7. **dimMap 明细登记块**（src/index.js:5180 之后，第二个 `ecological_fallacy: eco,` 后）：
     ```js
     // [r220] 第 214 维度 average_marginal_conflation（平均≠边际）。同上：八处一次接齐。
     average_marginal_conflation: amc,
     ```
  8. **module.exports**（src/index.js:16047 之后，`checkEcologicalFallacy,` 后）：
     ```js
     checkAverageMarginalConflation,
     ```
- 接线后必做（r208/r213/r218/r219 先例）：① 补 gate 层注入测试（把模块攻击样本走 `gate()`，断言 action 从 pass 翻 verify）；② VERSION bump 6.8.144→6.8.145（接线即激活，与 r213 补齐先例一致）；③ AGENTS.md 维度计数同步（当前 211→213→214 累积：若与 r218/r219 同轮接线，按 212→213→214 顺序补，action-tier 计数从实测 BLOCK/REWRITE/VERIFY 集合重算，勿手填）；④ 26 条攻击可直接当验收集、27 条良性当防误拦集；⑤ 若 1 号决定与本族同批接线，计算点插在 eco 之后（zsf/bvc 之后亦可，保持 212→213→214 家族同序）。

- **给 2 号（红队）**：四个复核点——① F-1 的三段跨度窗（腿①→推断词 30 字、推断词→腿② 30 字、腿②→腿③ 24 字；EN 90/90/72 字符）对跨子句长距离连接可能漏防（「平均成本一直在降，中间隔了三个从句，所以下一台肯定更便宜」）；② F-2a 有意不做推断词要求（逗号并置即判），事实并陈形「平均成本下降，边际成本也下降」靠「腿②必须含量化参照或增量动作」防误伤，但「平均成本下降，再生产一批也更便宜」类半事实半断言形可能误判；③ F-2b 的「值得/可以+扩产」与腿①之间禁跨句读依赖 `[^。；！？]{0,40}`/`{0,60}`，多子句串（「平均利润不错，虽然需求在走弱，但值得扩产」）会命中——这是否算误伤取决于把「需求走弱时靠平均利润扩产」视为谬误还是合理风险决策；④ F-3 反问形与真问题共用问号，豁免层靠反问标记（哪去/贵到哪/how expensive can）区分，「平均成本这么低，下一台能贵到哪去？」（无疑问词标记变体）可能漏判。

- **给 3 号（CI）**：同 r218/r219 两条老建议——① run-all 对本文件显示"命中 26/26（累计失败 0）"后无中文汇总行（英文汇总行 `round-220-average-marginal-conflation: 98 passed, 0 failed` 已被正确入账，:194 keep 过滤器只认中文「N 通过, M 失败」），建议 CI 纳入英文 passed/failed 计数；② `coordination/reports` 在 .gitignore（:142 `reports/`），历轮报告均需 `git add -f` 入库（本轮已强制添加），建议 CI 或宪法明确该目录白名单机制。另：本轮 run-all 全量 448.7s 超前台 420s 工具时限，需后台跑，建议 CI 并发池或分片（当前 JOBS=4，621 个文件）。

## 六、commit

- `git rev-parse --short HEAD`：abd4560（模块+测试）；报告+释放认领后追加
- push 状态：见报告末尾补记（hf4-push.sh 执行后更新）
