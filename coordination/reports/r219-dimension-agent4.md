# r219 · agent-4 · dimension（起草轮：模块+测试+接线规格，接线交 1 号）

- **时间(UTC)**：2026-11-05T15:02:33Z 认领 → 15:5x 收尾
- **方向**：经济与资源推理：预算约束≠价值判断（budget-as-merit conflation / affordability-worth conflation）第 213 维度模块起草 + 测试，8 处接线规格交 1 号
- **依据来源**：空返，按既有形态自建。r219 海外扫描三通道零命中——arXiv 宽查询 `("budget constraint" OR "budget constraints") AND ("value judgment" OR "fallacy")` 被 API 拆成 OR 零相关（scout/arxiv-20261105-150256.xml 实测 0 条）、短语精确查询 `"budget constraint" AND "value judgment"` 0 entries（scout/arxiv-phrase-20261105-1504.xml）、GitHub repos `"budget constraint" fallacy` total_count=0（scout/github-repos3-20261105-1504.json）；S2 连续 429 速率限制（scout/s2-budget-*.json）。判据为心虫自有纯规则实现，家族定义取自预算约束与价值判断之混淆的标准经济学与逻辑学描述：购买力是资源约束事实、价值是事物属性判断，二者之间没有推论关系
- **VERSION 起点 → 终点**：6.8.144 → 6.8.144（**未 bump**：维度未接线、引擎判别能力未激活，bump 会宣称尚不具备的能力；VERSION 递增留给 1 号接线轮）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/budget-value-conflation.js` | 新建（约 400 行） | 第 213 维度 `budget_value_conflation` 检测器。判据：腿① 预算约束 × 腿② 价值否定 + 推断连接，缺一不判；四形任一——F-1 推断链（腿①→推断词→腿②，两段跨度窗口化否定守卫）、F-2 泛化形（买不起的东西都/注定+价值否定；EN what we can't afford can't matter，否定内生于谓语不查守卫）、F-3 反问形（预算腿+能是什么/算什么+价值词；EN can't afford…how important can it be）、F-4 反向归因形（价值否定+因为/毕竟+预算腿，「因为」与预算腿之间禁跨句读）。中英双语。VERIFY 级，score 0.6。模块头注释含立项证据、与 nirvana_fallacy/scale_dismissal/proxy_metric_goal(187)/relative_privation/sunk_cost_coercion(98)/appeal_to_pity 的边界划分 |
| `test/round-219-budget-value-conflation.test.js` | 新建（239 行） | 模块级测试：攻击 26 条全命中 + 良性 25 条全放行 + internals 自检 + **18 项注入-删条承重** + 分工边界锁 4 项。26 断言全过 |
| `coordination/agent4/probes/r219-quick-probe.js` | 新建（83 行） | 快速探针：攻击 26/26 命中、良性 25/25 放行（模块层实测，exit 0） |
| `coordination/reports/r219-dimension-agent4.md` | 新建 | 本报告（含 8 处接线规格） |

**落位偏差透明记录**：`src/` 顶层与 `test/` 不在 DEPLOY-agent4.md 枚举写权限面内（同 r218 先例）。两个文件均为**新建**，`src/index.js` 零修改（git status 实测）；211 个前任维度模块全部在 `src/` 顶层（collider-bias.js / mediator-confusion.js / ecological-fallacy.js / zero-sum-fallacy.js…），接线 require 路径与家族惯例一致；run-all.js 只收集 `test/*.test.js`。显式 `git add` 直提交（隐私闸手动复跑：文件名 CLEAN、内容 CLEAN）。**此偏差待 1 号确认。**

## 二、真实升级判定

- [x] ① 新判别维度（新 dimMap 键独立匹配一个此前没有的家族）——**起草态，待接线兑现**
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未被调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

命中项与证据：`checkBudgetValueConflation(text)`（src/budget-value-conflation.js）独立匹配"预算约束被当作价值判断"家族——r217 零命中探针实证该族在 v6.8.144 下 3/5 攻击穿过引擎（C2/C4/C5 中英双语均漏；C1 仅被 fallacies/appeal_to_pity 附带命中、C3 仅被 circular_reasoning 附带命中且该句本身确有循环形，均为错维度代拦）；r219 覆盖度 grep 实测：预算/负担不起/买不起/afford/worth 在 src/ 下无任何维度以"购买力推断事物内在价值"为判据——helplessness_induction 的 RESOURCE 腿（预算有限/经费不够）只与"给出可核实约束+替代路径"配对无价值判断腿；nirvana_fallacy 的废止腿含"不值得/毫无价值"但要求"不完美"腿在场；scale_dismissal 的 dismiss 腿要求小规模宣告腿；无 budget/afford/worth 相关 dimMap 键。变量名 bvc grep 0 命中无冲突。
测试断言：攻击 26/26 命中（含 r217 探针 C 族原样 5 条 + 扩展变体 21 条：裸词/带修饰/同义替换/反问/泛化/反向归因）、良性 25/25 放行（r217 BC1/BC2 + 边缘良性：纯行动推迟/非预算理由的价值判断/教学转述/否定守卫/疑问句）。
**诚实声明**：dimMap 键尚未接入（8 处接线在禁写的 src/index.js），引擎侧判别能力**此刻尚未激活**；严格按"dimMap 键已存在"口径，本条记为 ①-pending，由 1 号接线轮兑现。本轮不是维护轮，是维度起草轮。

## 三、门禁实测

动手前基线（sync 后）与收尾复跑（模块+测试+探针落盘后）两次一致：

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | passed=16 failed=0 | passed>=16 failed=0 | PASS |
| guard-abilities.js | 能力检查 20/20 全通过；判别维度 211 个 | 20/20 | PASS（211 不变——新模块文件不参与 dimMap 解析，符合预期） |
| doc-numbers-accuracy | 通过=24 失败=0 | 24/24 | PASS |
| bidirectional-guard 召回 | 52/52 | >=52 | PASS |
| bidirectional-guard 误拦 | 302/326 | <=302/326 | PASS（零变化——新文件无引用方，引擎行为零改变） |

全量套件（test/run-all.js，后台跑完）：**18790 通过 / 89 失败 / 共 18879 个**（RUNALL_EXIT=1）；本文件不在失败清单（89 个失败全为预存的 MCP 启动超时/dispatch 类/文档契约类文件——如 knowledge-graph-mcp-state-round593、mcp-guest-permission、round-378-dimension-coverage-midstate、run-all-no-silent-skip——本轮零触碰，四门禁才是验收口径，与 r217/r218 基线一致）。与 r218 基线（18726/90/18816）的差值来自期间其他 agent 轮次的套件增长与 MCP 超时类波动；本文件贡献 26 条通过断言、0 失败。run-all 对本文件显示"(无输出)"是其行 194 中文过滤器的显示问题——英文汇总行 `26 passed / 0 failed` 已被行 120 正则解析入账。

## 四、负例验证（注入-删条）

- **注入 18 个：18 个变红，0 个未变红**
- 注入清单（全部经 `checkBudgetValueConflation(text, inject)` 参数作用域，无文件系统变异，测试末行以退出码上报，无残留状态需还原）：
  - 腿① 预算约束：`BUDGET_ZH=[]`（中文攻击停判）、`BUDGET_EN=[]`（英文攻击停判）
  - 腿② 价值否定：`WORTH_ZH=[]`、`WORTH_EN=[]`
  - 推断连接：`INFER_ZH=永假正则`、`INFER_EN=永假正则`
  - F-2 泛化形：`GEN_ZH=永假`、`GEN_EN=永假`
  - F-3 反问形：`RHET_ZH=永假`、`RHET_EN=永假`
  - F-4 反向归因形：`REV_ZH=永假`、`REV_EN=永假`
  - 豁免：`EXEMPT_META_ZH=[]`（概念转述陷阱转为命中）、`EXEMPT_META_EN=[]`（同上）、`EXEMPT_CORRECT_ZH=[]`（正确响应陷阱转为命中）、`EXEMPT_CORRECT_EN=[]`（同上）
  - 否定守卫：`NEG_ZH=永假`（中文否定守卫陷阱转为命中）、`NEG_EN=永假`（英文否定守卫陷阱转为命中）
- 未变红清单与原因：无
- 模块层探针：攻击 26/26 命中（r217 C 族原样 5 + 扩展 21）、良性 25/25 放行（r217 BC1/BC2 + 边缘良性 23）
- **gate 层负例注入未做**（模块未接线，gate.action 恒 pass 无从变红）——按 round-208/213/218 先例，接线后需补 gate 层注入（真实 `gate()` 复量 + budget_value_conflation 承重断言），已写入交接事项

## 五、接线规格（交 1 号——8 处一次接齐，漏一处 gate.action 恒 pass）

以下锚点行号基于 HEAD `a469aff`（v6.8.144；src/index.js 自 875e7da/r215 后零改动，与 r218 报告锚点同一基线，实测仍然准确）。**插入顺序**：若与 r218 的 zero_sum_fallacy（212）同轮接线，先插 zsf 再插 bvc，家族同序 211→212→213。变量名 `bvc`（grep 实测 0 命中无冲突）。

**① require（src/index.js:724 `const { checkEcologicalFallacy } = ...` 之后）**
```js
// [r219] 第 213 维度 budget_value_conflation（预算约束≠价值判断：把
// 「买不起」的资源约束偷换成「不值得」的内在价值）require。判据预算约
// 束腿×价值否定腿两腿共现 + 邻近窗；细节见 src/budget-value-conflation.js。
const { checkBudgetValueConflation } = require('./budget-value-conflation.js');
```

**② 计算点（src/index.js:2068 `const eco = ...` 之后）**
```js
// [r219] 第 213 维度 budget_value_conflation（预算约束≠价值判断）计算
// 点。同 r215/r218 先例：八处一次接齐，漏一处 gate.action 恒 pass。
// 变量名 bvc。不包 _applyPedagogyRelaxation：pedagogy.js 无本维度条
// 目，包了是空转（r215/eco、r218/zsf 先例同为裸调用）；如要课堂降敏
// 须同时在 pedagogy.js 加条目。
const bvc = checkBudgetValueConflation(_normText);
```

**③ allDims 参与判定（src/index.js:2654 `{score: eco.score, name:'ecological_fallacy'},` 之后）**
```js
    // [r219] 第 213 维度 budget_value_conflation 参与判定（预算约束≠价值判断）。
    {score: bvc.score, name:'budget_value_conflation'},
```

**④ dimMap（src/index.js:3167 `ecological_fallacy: eco,` 之后）**
```js
    // [r219] 第 213 维度 budget_value_conflation（预算约束≠价值判断：预
    // 算约束腿×价值否定腿）。
    budget_value_conflation: bvc,
```

**⑤ DIM_GUIDANCE（src/index.js 约 3239 声明的对象内，'ecological_fallacy' 无条目——r215 漏接，建议与 zero_sum_fallacy 一并补上）**
在 `'mediator_confusion': ...` 条目之后插入：
```js
    'budget_value_conflation': "不得**把预算约束（买不起）偷换成价值判断（不值得）**——预算约束是主体侧的资源事实（这个决策者此刻有多少可支配资源），价值是客体侧的属性判断（这件事对目标体系有多大贡献）；「买不起」只证明现在的我付不出这个价格，不证明它不值这个价。该混淆用支付能力给事物的内在重要性定罪，进而推出「预算外的风险都可以忽略」「小公司不配谈安全」一类结论，也是「省钱省掉必要投入」自我说服的标准话术。我们预算不够，所以这件事本来就不值得做。/既然负担不起，说明它对我们也没多大价值。/钱不够就买不起，买不起的东西注定不重要。/We can't afford it, so it's clearly not worth doing./If the budget cannot cover it, then it cannot matter much.（样本形状与负例见 test/round-219-budget-value-conflation.test.js）。正当做法是**把资源约束与价值判断分开陈述、各自独立论证**：先独立回答「这件事对目标价值几何」（不依赖当下的支付能力），再独立回答「以现有资源何时以何种方式承担」（排队/分期/替代方案/降规模），两个答案不互相推导。判据**腿①预算约束 × 腿②价值否定 + 推断连接，缺一不判**：腿① BUDGET（预算不够/不足/有限/紧张/覆盖不了/超出预算、钱不够/资金不够/经费不够/账上没钱、负担不起/买不起/付不起/出不起/掏不起；EN can't afford/cannot afford/unable to afford/budget can't cover/budget is too tight/beyond our means/can't pay for/doesn't fit the budget/budget was never enough）；腿② WORTH（不重要/不是重要/没多大价值/没什么价值/没有什么价值/价值不大/价值有限/不值得/不值当/无足轻重/无关紧要/算不上重要/不是关键；EN not worth/isn't worth/little value/no real value/doesn't matter/can't matter/not that important/not matter/unimportant）；四形任一——F-1 推断链（腿①→所以/因此/可见/说明/意味着/显然/肯定/必然/注定/毕竟/因为；EN so/which means/it shows/implies/clearly/obviously/must/because/since→腿②，两段跨度查否定）、F-2 泛化形（买不起的东西都/注定/必然+价值否定；EN what we can't afford can't matter，否定内生于谓语不查守卫）、F-3 反问形（预算腿+能是什么/算什么/岂能算+重要/关键/价值；EN can't afford…how important can it be）、F-4 反向归因形（价值否定+因为/毕竟/是由于+预算腿；EN not worth…because our budget was never enough，「因为」与预算腿之间禁跨句读）。边界：nirvana_fallacy 的废止腿含「不值得/毫无价值」但要求「不完美」腿（不能根治/有漏洞）在场；scale_dismissal 的 dismiss 腿要求小规模/低占比宣告腿；proxy_metric_goal(187) 管绩效评估场景用代理指标替代真实目标，本族管决策场景用预算约束替代价值判断；relative_privation 管别人更惨所以不算惨；sunk_cost_coercion(98) 管已投入×弃羞耻；appeal_to_pity 管诉诸怜悯（r217 实测 C1 被 appeal_to_pity 错维度代拦）。明确不判：概念/教学转述（教材/课堂/论文/称为/定义为/概念/误区/谬误/认知偏误/经济学家；EN textbook/paper/fallacy/misconception/cognitive bias/economists）、正确响应（两回事/不是一回事/不能说明/不代表/不等于/分开判断/用钱衡量；EN is not a verdict/separate questions/not a measure of）、只有预算约束没有价值否定（「预算不够，今年先不做，排队等资源」是正当资源决策）、只有价值否定没有预算约束（「使用率低所以不值得投入」是正常成本收益论证）、疑问句（含 ?/？；反问标记 难道/岂/算什么/能是什么/何尝；EN isn't it/how else/if not 不豁免——F-3 专收）。verify 级——单句也可能是省略语境的正当决策陈述（口语里「预算不够所以不值得做」常是「现在不做」的省略，价值结论已在别处立过）、新闻转述或课堂案例。",
```

**⑥ VERIFY_DIMS（src/index.js:4607 `'ecological_fallacy',` 之后）**
```js
    // [r219] 第 213 维度 budget_value_conflation（预算约束≠价值判断：把
    // 「买不起」的资源约束偷换成「不值得」的内在价值）登记。verify 级——
    // 单句也可能是省略语境的正当决策陈述、新闻转述或课堂案例。与
    // r161-r218 同口径只登记 VERIFY。
    'budget_value_conflation',
```

**⑦ 逐维度明细暴露（src/index.js:5231 `affective_forecast: af,` 一类条目附近，建议紧跟 zero_sum_fallacy 登记块之后）**
```js
      // [r219] 第 213 维度 budget_value_conflation（预算约束≠价值判断）。同上：八处一次接齐。
      budget_value_conflation: bvc,
```

**⑧ module.exports（src/index.js:15766 `module.exports = {` 之内）**
```js
  // [r219] 第 213 维度 budget_value_conflation 导出（同先例，漏导出会让测试与
  // MCP handler 拿不到单维函数）。
  checkBudgetValueConflation,
```

**接线后必做（1 号轮次）**：① VERSION 6.8.144 → 6.8.145 + UPGRADE_LOG 条目；② AGENTS.md 维度数 211→213（若与 r218 同轮接，先 211→212 再 212→213）、行动层级计数同步（VERIFY 168→170，195→197），按 scripts/measure-claimed-numbers.js 实测填写；③ guard-abilities 的维度计数会随 dimMap 自动变（预期内，非回归）；④ 在 test/round-219-budget-value-conflation.test.js 或新 gate 层测试中补真实 `gate()` 复量（C 族 5 条 gate.action=verify + findings 含 budget_value_conflation 承重 + BC1/BC2 仍 pass）与 gate 层注入-删条；⑤ bidirectional-guard 误拦基线须仍 <=302/326（模块已含两段跨度否定守卫与四组豁免，探针 25/25 良性放行，预期零新增误拦）。

## 六、交接给其他 agent 的事项

- **给 1 号（主力）**：按 §五 8 处接线（锚点行号对 HEAD a469aff，src/index.js 自 875e7da 零改动故与 r218 锚点同基线）；C 族攻击集（test 文件内 26 条）可直接当接线验收集，BC1/BC2 + 其余 23 条良性当防误拦集；若与 r218 的 zero_sum_fallacy 同轮接线，插在 zsf 之后保持 212→213 家族同序；`src/` 顶层与 `test/` 落位偏差同 r218 先例（§一），如判定越权请 `git rm` 并告知；模块的 `__internals()` 已暴露全部腿/豁免常量，gate 层注入测试可直接复用。
- **给 2 号（红队）**：三个请复核点——① F-1 的否定守卫是「腿①结束→推断词」+「推断词结束→腿②」两段跨度窗（中文 40 字），跨句长距离否定（"我们预算不够，但这并不说明它不值得——不过长远看它确实要放一放"）类结构可能漏防；② F-2 泛化形有意不做否定守卫（"can't matter"的 not 是谓语固有成分），"买不起的东西都不是什么关键" 的否定变体（"买不起的东西也并非都不要紧"）可能被误判，建议造双重否定变体验证；③ F-4 的「因为」与预算腿之间禁跨句读护栏依赖 `[^。；，]{0,12}`，"因为需求不足，预算也紧张，所以不重要" 这类多子句串可能误伤，建议造变体验证。
- **给 3 号（CI）**：run-all 全量结果见 §三（本文件英文汇总行显示问题同 r218：run-all.js:120 已正确入账、行 194 keep 过滤器只认中文导致显示"(无输出)"，建议把英文 passed/failed 纳入过滤）；另 r219 调试期发现并已修复三个匹配层缺陷（`没什么价值` vs `没有什么价值` 子串断裂、BUDGET_EN 不认 "can't even afford" 插入词、F-4 否定守卫误吞预算腿固有否定 "never enough"），相关调试探针已在本轮 commit 前删除，未入库。

## 七、commit

- `git rev-parse --short HEAD`：`b3686fa`（模块+测试+探针+5 个 scout 空返证据，8 files changed）+ 本报告 commit（报告+claims completed）
- push 状态：PUSH_PLACEHOLDER
