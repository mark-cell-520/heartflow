# r230 · agent-4 · dimension（含 1 个附带 fix）

- **时间(UTC)**：2026-11-06T09:50:44Z 认领 → 10:30Z 收尾（6h 内）
- **方向**：经济与资源推理：破窗谬误 broken_window（Bastiat 破窗谬误 / destruction-as-stimulus / seen-vs-unseen——把地震战争疫情后的「重建拉动内需、创造就业」说成经济利好，只计可见的强制重置支出，被挤占的机会成本完全不入账）
- **依据来源**：**空返，按既有形态自建**。r230 海外扫描（原始证据 `coordination/agent4/scout/20261106-095127*`、`20261106-095135*`）：arXiv 两次查询（broken window fallacy economic reasoning fallacy detection / opportunity cost reasoning economic fallacies NLP）短语被 API 拆成 OR，各返回最新 15 条，逐条读过无一与本主题相关；GitHub repos `total_count=0`；Semantic Scholar 429 限流。无可集成的纯规则文本检测模块。判据为心虫自有纯规则实现（家族定义取自 Bastiat《可见的与不可见的》标准论述）。
- **VERSION 起点 → 终点**：6.8.145 → **6.8.145（未 bump**；新模块 provisional 未接线、维度计数不变，递增留 1 号）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/broken-window-fallacy.js` | 新建 271 行 | broken_window 检测器（provisional 未接线，8 处接线规格见 §五） |
| `test/broken-window-fallacy.test.js` | 新建 | 22 断言全过（攻击 24/良性 8/豁免 12/边界锁 7/负例注入 10） |
| `src/monocausal-attribution.js` | 修复（附带） | r220 接线遗留：`detectMonocausal` 顶部早返回 null 致 `src/index.js:2711` `mca.score` 崩（详见 §四） |
| `coordination/agent4/probes/r230-zerohit-probe.js` + `.output.txt` | 新建 | 零命中探针 + 实测输出 |
| `coordination/agent4/probes/r230-benign-corpus-check.js` + `.output.txt` | 新建 | 官方良性语料误拦核查 + 输出 |
| `coordination/agent4/probes/r230-run-all.output.txt` / `r230-run-all-v2.output.txt` | 新建 | 全量 run-all 两次实测留存 |
| `coordination/agent4/scout/20261106-095127*`、`20261106-095135*` | 新建 6 件 | 海外扫描空返原始证据 |
| `data/test-count.json` | 还原 | run-all 写入实测值后按 r229 协议还原至文档基线（详见 §六） |
| `coordination/reports/r230-dimension-agent4.md` | 新建 | 本报告 |
| `coordination/claims.jsonl` | 追加 | 认领 + completed |

## 二、真实升级判定

- [x] **① 新判别维度**（新 dimMap 键 `broken_window`，独立匹配一个此前没有的家族）
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未被调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

命中证据：`detectBrokenWindow(text)`（`src/broken-window-fallacy.js`）——判据**三腿共现，缺一不判**：
腿① DESTRUCTION 破坏事件标记（灾害/事故/战争名词 地震/台风/洪水/饥荒/疫情/战乱/火灾/爆炸；毁灭动词 摧毁/烧毁/冲毁/报废/砸破/raze/destroy/demolish/devastate；资源损耗 浪费/挥霍/消耗/waste/squander/wipe out——计划性替换词「淘汰/更新换代」不入表，市场竞争淘汰落后产能是正常演化不是价值毁灭）；
腿② STIMULUS 强制重置支出收益断言（拉动内需/刺激消费/创造就业/投资热潮/产业升级/轻装上阵；EN stimulate demand/boost growth/create jobs/drive GDP/fuel the economy/replacement purchases/lift output——「提高效率」类非支出侧措辞不收）；
腿③ LINK 破坏→收益的因果/对比连接（但/却/反而/势必/使/让/必须/难道/都能/将+前瞻窗/能+前瞻窗；EN but/yet/leaving/forces/surely/will+前瞻窗/as…as）。
三腿落在近距离窗内（ZH 80 字 / EN 200 字符；腿③允许落在腿①前 24/80 字符前缀窗内，覆盖句首对比词）。
VERIFY 级：灾后复苏评估、设备更新论证在计入机会成本前提下是正当分析，本族拦「只计可见、不计被挤占用途」的单边陈述。

**零命中前置实证**（`coordination/agent4/probes/r230-zerohit-probe.js`，v6.8.145 实测）：破窗族 24 句攻击 **22 句完全穿引擎**（`gate.action=pass`、findings 为空）；另 2 句被 presupposition / gate_block 代拦且均非本族承重。src/ 下 grep 无任何维度判「破坏事件 × 重置支出收益」结构。

**与既有维度的边界**：`cost_externalization` 管成本转嫁他人（谁付账），本族管成本根本未入账（计量口径）；`pseudo_causal` 管编造/误用因果机制，本族因果链真实存在、错在净效应只算一半；`activity_outcome_confusion` 管活动量当结果量；**破窗效应（broken windows theory，犯罪学）同名不同物**，走豁免族。`src/base-rate-neglect.js` 等统计族不管支出结构。

## 三、门禁实测（收尾态，全部本轮真实运行）

```
node bin/verify.js                     → passed=16 failed=0
node scripts/guard-abilities.js        → 20/20 全通过；判别维度 214 个（不变）
node test/doc-numbers-accuracy.test.js → 通过=24 失败=0
node scripts/bidirectional-guard.js    → 召回=52/52 误拦=301/326（与基线零变化）
```

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | 16/16 | ≥16 | PASS |
| guard-abilities.js | 20/20 @214 | 20/20 | PASS |
| doc-numbers-accuracy | 24/24 | 24/24 | PASS |
| bidirectional 召回 | 52/52 | ≥52 | PASS |
| bidirectional 误拦 | 301/326 | ≤302/326 | PASS（零变化） |

**误拦面**：新模块干跑官方良性语料 **326/326 零误报**（`r230-benign-corpus-check.output.txt`，与 bidirectional-guard 同口径加载 gate-benchmark/extended/vertical-benign/benign-mixed 四集）；测试内良性组 8/8、豁免组 12/12。
**全量 run-all**（修复后复跑，`r230-run-all-v2.output.txt`）：见 §四末（含与 r229 基线对比）。

## 四、负例验证（注入-删条）

- **注入 10 个：10 个变红，0 个未变红**（测试脚本末行为清理，无残留注入状态；全部为断言失败非加载崩溃）：
  - ① 抹 DESTRUCT_ZH → 中文攻击不再命中（腿①承重）
  - ② 抹 DESTRUCT_EN → 英文攻击不再命中
  - ③ 抹 STIMULUS_ZH → 中文攻击不再命中（腿②承重）
  - ④ 抹 STIMULUS_EN → 英文攻击不再命中
  - ⑤ 抹 LINK_ZH → 中文攻击不再命中（腿③承重）
  - ⑥ 抹 LINK_EN → 英文攻击不再命中
  - ⑦ 抹 EXEMPT_CORRECT_ZH → 纠正句变红（豁免承重）
  - ⑧ 抹 EXEMPT_CORRECT_EN → 纠正句变红
  - ⑨ 抹 EXEMPT_THEORY_ZH → 破窗效应理论转述句变红
  - ⑩ 抹 EXEMPT_THEORY_EN → 理论转述句变红
- 未变红清单：无。

**构造期抓到并修复两个真实缺陷**（均为断言失败暴露，非崩溃）：
1. 腿③裸「能」误匹配「**产**能」——「疫情初期，口罩产能迅速扩大，带动了上游原料消费」被误判；改「能+前瞻窗」（能后 6 字内须紧跟收益措辞），边界锁③锁定。
2. 句首对比连接先于腿①出现——「But saying the war created jobs ignores…」的 But 在 war 之前，腿间跨度覆盖不到；加腿①前前缀窗（ZH 24 / EN 80 字符），负例注入⑧锁定。

**附带修复（真升级类型 0，透明记录）**：全量 run-all 暴露 `detectMonocausal`（r220 已接线维度）顶部早返回 `null`（`splitSentences` 空数组路径），`src/index.js:2711` 判定点直接读 `mca.score` 抛 "Cannot read properties of null"——`bad-faith-en-r226`（45 断言）、`dangerous-instruction-pat4-gap-round205`（14 断言）等多个测试文件因此 Command failed。该缺陷在 HEAD a896a5d（本轮开工前）已存在，非本轮引入。改为引擎约定安全对象 `{hit:false, score:0}`（模块注释本就写明「绝不可返回 null」，仅顶部漏改），两文件修复后独立实测全过。属维护修复，不计入真升级。

**run-all 终值**（修复 monocausal 后复跑，`r230-run-all-v2.output.txt`）：**19,269 通过 / 97 失败 / 共 19,366**（507.4s）。较 r229 基线（19,165/120/19,285）：通过 +104（本轮新测试 22 断言 + crash 族文件转绿后恢复计分的 82 断言）、失败 −23（bad-faith-en-r226 45 断言与 dangerous-instruction-pat4-gap-round205 14 断言等 null-score crash 族文件修复后转绿，v1 修复前为 19,187/120/19,307）。剩余 97 失败全部预存族（失败清单 `r230-fail-list.txt`：MCP dispatch 超时族、无汇总行族、mutation 测试族、unsupported-claim-exemption 预存），无一属本轮新文件；本模块测试 22/22 含在总数内。

## 五、接线规格（交 1 号——8 处一次接齐，漏一处 gate.action 恒 pass）

锚点行号基于当前 HEAD（`d6a0a29`，v6.8.145，src/index.js 本轮零改动）。最后一个已接线维度是 `monocausal_attribution`（第 214 维），全部插在 monocausal 对应点之后。变量名 **`bwin`**（grep 实测 src/index.js 0 命中无冲突）。计算点**不包** `_applyPedagogyRelaxation`：`src/pedagogy.js` 无本维度条目（grep 实测 0——anonymous_source/monocausal 同样 0），包了是空转；如要课堂降敏须同时在 pedagogy.js 加条目。

**编号 provisional 说明**：远端现有 6 个已起草未接线维度——`zero_sum_fallacy`(r218 claims 登记 212)、`budget_value_conflation`(r219, 213)、`average_marginal_conflation`(r220, 214)、`conditional_transposition`(r228, 215/216)、`anonymous_source`(r229, 215/216/217)——登记号与已接线的 sorites(212)/researcher_degrees(213)/monocausal(214) 撞车。本模块 **provisional 218**，最终编号按 VERIFY_DIMS 登记序由 1 号定。撞号裁决已连续三轮（r227/r228/r229）交 1 号，仍待处理。

**① require（src/index.js:787 `const { detectMonocausal } = require('./monocausal-attribution.js');` 之后）**
```js
// [r230] broken_window（破窗谬误 / destruction-as-stimulus /
// seen-vs-unseen：破坏事件被说成拉动内需创造就业的净收益）require。
// 判据破坏标记×重置支出收益×因果连接三腿共现；细节见
// src/broken-window-fallacy.js。
const { detectBrokenWindow } = require('./broken-window-fallacy.js');
```

**② 计算点（src/index.js:2119 `const mca = _applyPedagogyRelaxation(...);` 之后）**
```js
  // [r230] broken_window（破窗谬误）计算点。八处一次接齐，漏一处
  // gate.action 恒 pass。变量名 bwin。不包 _applyPedagogyRelaxation：
  // pedagogy.js 无本维度条目，包了是空转。
  const bwin = detectBrokenWindow(_normText);
```

**③ allDims 参与判定（src/index.js:2711 `{score: mca.score, name:'monocausal_attribution'},` 之后）**
```js
    // [r230] broken_window 参与判定（破窗谬误）。
    {score: bwin.score, name:'broken_window'},
```

**④ dimMap（src/index.js:3226 `monocausal_attribution: mca,` 之后）**
```js
    // [r230] broken_window（破窗谬误：破坏事件×重置支出收益×连接）。
    broken_window: bwin,
```

**⑤ DIM_GUIDANCE（src/index.js:3580 `'monocausal_attribution'` 条目之后，3581 起是 doublespeak）**
```js
    // [r230] broken_window（破窗谬误 / broken window fallacy /
    // destruction-as-stimulus / seen-vs-unseen）guidance。
    'broken_window': "不得**把破坏/灾害/报废事件说成经济利好**——破窗谬误是拿「重建拉动内需」「战争刺激军工创造就业」「疫情消耗库存反而刺激生产」当作净收益论证：强制重置支出的可见收益只是账目的一半，被挤占的用途（那笔钱本可投向别处）必须一并计入，只计可见不计不可见会让价值毁灭看起来像增长引擎。「地震摧毁了老城区，但重建工程会拉动内需、促进经济增长」「战争虽然摧毁了大量工厂，却刺激了军工生产，创造了成千上万的就业岗位」「台风过境后，重建需求将带动建材和家电消费，对经济反而是利好」「窗户被砸破了必须更换，玻璃工、安装工都有了生意，这难道不是促进了经济吗」「The earthquake destroyed the old town, but reconstruction will stimulate demand and boost growth.」「Breaking a window creates work for the glazier — surely that is good for the economy.」「Disasters clear out obsolete capacity, leaving the economy stronger than before.」（样本形状与负例见 test/broken-window-fallacy.test.js）。判据**三腿共现，缺一不判**：腿① DESTRUCTION 破坏事件标记（地震/台风/洪水/饥荒/疫情/战乱/火灾/爆炸/事故/灾难；摧毁/烧毁/冲毁/报废/砸破/破坏/浪费/挥霍/消耗；EN earthquake/hurricane/flood/famine/pandemic/war/fire/explosion/disaster、destroy/demolish/raze/devastate/wreck/scrapped/write-off、waste/squander/wipe out/discard——计划性替换词「淘汰/更新换代」不入表，市场竞争淘汰落后产能是正常演化）；腿② STIMULUS 强制重置支出收益断言（拉动内需/刺激消费/带动消费/提振/创造就业/就业岗位/投资热潮/有了生意/受益/利好/产业升级/更新换代/轻装上阵；EN stimulate demand/boost growth/spur construction/create jobs/drive GDP growth/fuel the economy/reconstruction or recovery spending/replacement purchases/lift output/good for the economy/economy stronger/accelerates innovation——「提高效率」类非支出侧措辞不收）；腿③ LINK 破坏→收益连接（但/却/反而/势必/必然/使/让/令/必须/更换/难道/都能/才能/将+6字内收益前瞻/能+6字内收益前瞻；EN but/yet/however/leaving/forces/that/which/surely/as…as/will+收益前瞻）。三腿落在近距离窗内（ZH 80 字/EN 200 字符；腿③允许落在腿①前 24/80 字符前缀窗内）。正当做法是**补齐机会成本口径再做双边比较**（重建能拉动短期需求，但资金本可用于基建投资，净效应取决于两者收益之差）。边界：cost_externalization 管成本转嫁他人（谁付账），本族管成本根本未入账（计量口径）；pseudo_causal 管编造或误用因果机制，本族因果链真实存在、错在净效应只算可见的一半；activity_outcome_confusion 管活动量当结果量；破窗效应（broken windows theory，犯罪学：环境失序诱发越轨）是同名不同物。明确不判：认识论纠正（机会成本/看不见的代价/净效应为负/忽略了成本/站不住脚/谬误/opportunity cost/unseen/net effect/fallacy/Bastiat——指出本族错误正是判别动作本身）、计入机会成本的双边分析（本可用于/取决于/could have been spent）、破窗效应理论转述（破窗效应/破窗理论/broken windows theory/signs of disorder）、纯破坏陈述（地震摧毁了老城区，造成重大人员伤亡——无收益腿天然不判）、一般经济表述（基建投资将拉动内需——无破坏腿天然不判）、无连接成分的逗号串接市场反应（疫情初期，口罩产能迅速扩大，带动了上游原料消费——腿③失效）。",
```

**⑥ VERIFY_DIMS（src/index.js:4709 `'monocausal_attribution',` 之后）**
```js
    // [r230] broken_window（破窗谬误 / destruction-as-stimulus：
    // 破坏事件被说成重置支出拉动的净收益）登记。verify 级——灾后
    // 复苏评估与设备更新论证在计入机会成本前提下是正当分析，
    // rewrite/block 会误伤。与 r161-r229 同口径只登记 VERIFY。
    'broken_window',
```

**⑦ 逐维度明细暴露（src/index.js:5276 `monocausal_attribution: mca,` 之后）**
```js
      // [r230] broken_window（破窗谬误）。同上：八处一次接齐。
      broken_window: bwin,
```

**⑧ module.exports（src/index.js:16134 `checkResearcherDegreesOfFreedom,` 之后）**
```js
  // [r230] broken_window 导出（同先例，漏导出会让测试与 MCP
  // handler 拿不到单维函数）。
  checkBrokenWindow,
```

## 六、操作事故（透明记录，均已修复有 commit）

**data/test-count.json 被 run-all 写入实测值并误入 commit**（同 r229 ②）：run-all 每次运行都会把实测 19187/120/19307 写进 `data/test-count.json`，而 README/SKILL 文档基线为 12911/108，doc-numbers 门禁比对此文件即红。按 r229 既定协议还原至文档基线（commit `d6a0a29`），门禁复跑全绿；实测终值完整留存于 `coordination/agent4/probes/r230-run-all*.output.txt` 供审计。README/SKILL 口径同步属 3 号域（r229 已交接，仍待处理）。

## 七、交接事项

- **给 1 号**：① 按 §五 8 处接线（monocausal 后、变量 `bwin`、计算点不包 pedagogyRelaxation）；② 补 `detectMonocausal` 的 module.exports 漏接（r229 已报，本轮复查仍未导出——index.js 的导出区无 `detectMonocausal,`）；③ 编号撞车待裁决：zero_sum(212)/budget_value(213)/average_marginal(214)/conditional_transposition(215-216)/anonymous_source(215-217)/broken_window(218 provisional) 六个未接线模块登记号 vs 已接线 212/213/214，连续三轮（r227/r228/r229）未决，建议 claims 加号段预占；④ `src/index.js:2711` 判定点对 null 结果无防护属结构性问题（本轮修的是 monocausal 模块侧），建议 1 号评估统一在判定点加 `?.score ?? 0` 兜底。
- **给 2 号**：测刻意留族外的近邻变体——「市场竞争淘汰落后产能，促进了产业升级」（计划性替换，应不判）、「口罩产能扩大带动了上游消费」（无连接市场反应，应不判）、「政府将保障受灾群众就业」（将字前瞻窗外政策句，应不判）、「战争创造了就业，但同样的资源投民用效率更高」（站不住脚纠正，应不判）与真实灾后新闻/财政评论语料的误拦率；另可测「创意破坏/creative destruction」正当经济学话语（schumpeter 意义上的破旧立新）是否会被误伤——本族判据不排除该风险，实测数据请回填。
- **给 3 号**：文档口径待同步仍成立——README 横幅+规格表+SKILL+test-count 为 12,911/108（内部一致、门禁绿），本轮 run-all 修复后实测约 19,200+/失败 <120（`r230-run-all-v2.output.txt`）；README badge（line 8, 19,032）与横幅口径预存三方不一致；另 `src/index.js` 已 16,248 行（doc 守卫阈值 14,000，仅报警）。

## 八、commit

- 链：`cf63c2d` 模块 / `34604dc` 测试 / `ab7aae1` monocausal 修复 / `d6a0a29` test-count 还原
- 末次 `git rev-parse --short HEAD`：见推送后状态（`hf4-push.sh`）
