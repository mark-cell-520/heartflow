# 4 号轮次报告 r257 · agent-4 · dimension

- **时间(UTC)**：2026-11-08 14:15 – 15:20（claim 14:15:38Z，active 中完成）
- **方向**：既有维度「诉诸自然 appeal_to_nature」的全新措辞家族扩展（真升级②，live 生效）
- **依据来源**：**海外扫描空返，按既有形态自建**。scout 三源检索 `appeal to nature fallacy naturalistic fallacy detection`
  （原始产物 `coordination/agent4/scout/arxiv-20261108-141657.xml`、`s2-20261108-141657.json`、`github-repos-20261108-141657.json`）：
  - arXiv `all:"appeal to nature fallacy naturalistic fallacy detection"` 返回 15 篇，全部是
    无关的近日期列表（gasification / RLHF / encryption …），**零篇**诉诸自然检测实现；
  - GitHub `repositories?q=appeal+to+nature+fallacy+detection` **total_count = 0**（空返）；
  - Semantic Scholar `bulk` 22 篇全部是 Moore 1903 以来的自然主义谬误**哲学论证**
    （The Naturalistic Fallacy / Naturalism / Evolutionary Ethics），**零篇**文本检测实现。
  → 无任何可集成的纯规则实现，扩展形态沿用 r706 已接线的双腿判据（腿①自然性断言 ×
  腿②优越/安全结论），按探针实测出的词表缺口自建新措辞家族。
- **VERSION 起点 → 终点**：6.8.145 → **6.8.145（未 bump）**

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/appeal-to-nature.js` | 改（既有接线模块） | 双腿判据补全新措辞家族；新增 concession 豁免与防自证守卫；重构为**逐分支可注入**表结构 |
| `test/round-257-appeal-to-nature-wording.js` | 新建 | 102 断言组：新族逐支命中 / gate 端到端 / 良性豁免 / **逐支注入负例** / 防自证 / 接线完整性 |
| `coordination/agent4/probes/r257-atn-diag.js` | 新建 | 诊断探针：证实 16 条穿透样本在模块层真零命中（非被聚合压掉） |
| `coordination/agent4/probes/r257-benign-dryrun.js` | 新建 | 官方良性语料 346 条模块层干跑 |
| `coordination/agent4/probes/r257-probe-round1.js` / `r257-probe-round2.js` / `r257-print-round1.py` / `r257-plugin-surface.js` / `r257-unwired-inventory.js` / `r257-backlog-inventory.js` / `r257-wired-dims.js` / `r257-scout-parse.py` | 新建 | 本轮全部探针（候选定夺 + 插件面盘点 + 未接线 backlog 盘点） |
| `coordination/agent4/scout/*20261108-*.{xml,json}` | 新建 | scout 原始产物 |
| `coordination/reports/r257-dimension-agent4.md` | 新建 | 本报告 |

## 二、真实升级判定

- [ ] ① 新判别维度
- [x] **② 已有维度的全新措辞家族**
- [ ] ③ 接线一个已加载但从未调度的能力
- [ ] 真正能判别的新 MCP 工具 / dispatch 路由

**命中项与证据**：`checkAppealToNature()`（`src/appeal-to-nature.js`，r706 已接线于
`src/index.js` require + 九处登记）新增 4 张分支表 `NAT_ZH_BRANCHES`(7 支) /
`NAT_EN_BRANCHES`(8 支) / `SUP_ZH_BRANCHES`(6 支) / `SUP_EN_BRANCHES`(8 支)，共 **29 个
全新措辞分支**；断言组 A/B 逐支证明命中（`test/round-257-appeal-to-nature-wording.js`
A·腿①ZH 7 条 + A·腿①EN 8 条 + B·腿②ZH 6 条 + B·腿②EN 8 条全过）。维度计数 **214 不变**
（guard-abilities 实测 214，G3 断言组锁死），故不是①。

**扩展内容**：
- **腿①自然性断言新族（ZH 7 / EN 8）**：大自然的选择/规律/法则；未经(任何)(工业)加工/
  非人工；**有机（限定复合词**——刻意排除「有机化合物/有机化学/有机溶剂」以免误伤化学语境**）**；
  农家自榨/土法/自家养；手工+制作动词与「手工的」；山泉/矿泉水/井水；刚下/现摘的蛋奶菜果；
  EN nature's way/design/plan；unprocessed / minimally processed（**不收裸 processed**——
  "processed data" 是数据处理不是自然性论证）；plant-based/herb-based（不带 extract/formula
  也判）；organically grown / organic produce / organic farming / certified organic；
  farm-fresh / freshly laid / farm-to-table；handmade / handcrafted / hand-picked；
  spring water / mineral water；raw milk/honey/cheese、unpasteurized、unrefined。
- **腿②优越/安全结论新族（ZH 6 / EN 8）**：裸比较级（更/还要/更加 + 优越词，**无「比X」也判**——
  原判据因强制「比X」漏判「纯植物提取，所以更安全」）；裸比较形（比X + 优越词，**无「更/还」也判**）；
  最…形；认识论封闭形（不会有错/错不了/准没错——「这是大自然的选择，不会有错」）；才是/就是+优越词；
  吃着才放心（原 c 支倒装形）；EN has to be + 比较级；must be right / cannot be wrong；
  automatically / inherently / necessarily + 优越词；the healthiest/safest/most nourishing +
  choice/option；the only kind you can trust；naturally + 比较级；simply/just/plainly better；
  more nourishing / more wholesome。
- **新增 concessive-debate 豁免（HEDGE_ZH / HEDGE_EN）**：优越断言被让步/争议标记限定时不判——
  「有机种植可能更安全，但这方面仍有争议，要看检测数据」是在呈现争论，不是在以自然性置换证据。
  标记限定为认识论层面（争议/无定论/不能据此/要看数据），不收任意让步词。
- **新增防自证守卫**：腿①与腿②必须存在**一对零重叠**的匹配——「无添加」同时落入两腿时不判
  （同族自称不构成论证）。
- **重构为逐分支可注入**：路由改为遍历分支表（`_branchList`），使负例可逐支删除；合并版
  `NATURE_ZH_EXT` 等仅作兼容导出。

**判据边界（刻意保留的射程外）**：「无添加/没有添加剂」单独在场**不算自然性断言**（r706 C1
锁定：「没有任何添加剂的食品才健康」是加工工艺描述不是自然性论证）。故「没有添加剂的东西吃着才放心」
与 "Food with no additives is the only kind you can trust." 仍是本族射程外——留给后续轮次裁决是否
把「无添加」提升为独立自然性依据（与 r706 C1 的既有锁定冲突，需 1 号会同）。

## 三、门禁实测

```
node bin/verify.js                       → PASS passed=16 failed=0
node scripts/guard-abilities.js          → PASS 能力检查 20/20 全通过；判别维度 214 个
node test/doc-numbers-accuracy.test.js   → PASS 通过=24 失败=0
node scripts/bidirectional-guard.js      → PASS 召回=52/52 误拦=301/326
```

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | passed=16 failed=0 | >=16 / 0 | ✅ |
| guard-abilities.js | 20/20，维度 214 | 20/20 | ✅ 维度计数零漂移 |
| doc-numbers-accuracy | 24/24 | 24/24 | ✅ |
| bidirectional-guard 召回 | 52/52 | >=52 | ✅ |
| bidirectional-guard 误拦 | 301/326 | <=302/326 | ✅ 与 r256 基线逐位一致 |

**全量 run-all（659 文件）**：见文末「补记」——首轮前台跑被 420s 工具超时截断，改后台跑完。

## 四、负例验证（注入-删条）

注入机制：`checkAppealToNature(text, inject)`，`inject` 可按名替换任一常量/分支表。
`NEV = /(?!x)x/`（永不匹配）作删除哨兵。

- **注入 29 个分支负例：29 个变红，0 个未变红**
  - 腿① ZH 逐支 7 个（n1 大自然 / n2 未经加工 / n3 有机 / n4 农家自榨 / n5 手工 /
    n6 山泉 / n7 刚产出）→ 各支负责的攻击句全部转为不命中
  - 腿① EN 逐支 8 个（e1 nature's way / e2 unprocessed / e3 plant-based / e4 organic /
    e5 farm-fresh / e6 handmade / e7 spring water / e8 raw）
  - 腿② ZH 逐支 6 个（s1 裸比较级 / s1b 裸比较形 / s2 最…形 / s3 认识论封闭 /
    s4 才是/就是 / s5 吃着才放心）
  - 腿② EN 逐支 8 个（t1 has to be / t2 must be right / t3 automatically /
    t4 the healthiest choice / t5 the only kind you can trust / t6 naturally /
    t7 simply better / t8 more nourishing）
- **附加注入 13 个：13 个变红，0 个未变红**
  腿①ZH 整族 / 腿①EN 整族 / 腿②ZH 整族 / 腿②EN 整族 / r706 原有 `NATURE_ZH` /
  `NATURE_EN` / `SUPERIOR_ZH` / `SUPERIOR_EN` 四腿整族（路由重构回归守卫）/
  防自证守卫（同处重叠不判 vs 分离两处可判）/ `HEDGE_ZH` 删后让步句转命中 /
  `META_EXEMPT_ZH` 删后元话语转命中。
- **合计注入 42 个：42 个变红，0 个未变红。**

**构造期由负例抓出并修掉的 4 处缺陷**：
1. **四处 EXT 正则首支误带前导 `|`**——`new RegExp('|A|B')` 含一条空分支，会在每个位置
   匹配空串，导致空串同时落在两腿上、**任意文本都被判成「两腿齐备」**。由
   `test/round-706-appeal-to-nature.js` B1/C1/D1/F2 四组同时抓出（误伤
   「纯植物提取物也可能引起过敏反应」「原生态旅游成为新热点」）。修复：去掉四处前导 `|`，
   并在 `_collect()` 内加零长度匹配防御（双保险）。
2. **s2 缺「干净」**——「山泉水才是最干净的」不判。
3. **r706 腿① NATURE_ZH e 支名词表缺「法子/办法/手艺/技艺」**——「老祖宗传下来的法子错不了」不判。
4. **测试脚手架 `assertHit` 不透传 `inject`**——F9b/F10/F11 三个负例假绿；修复后真绿。

**穿透率复测**（`coordination/agent4/probes/r257-probe-round2.js`，口径 `hf.gate()` 全量
findings 下 `gate.action === 'pass'`，攻击 20 条）：
- 扩前 **16/20 穿透** → 扩后 **2/20 穿透**；其中 `appeal_to_nature` 自身捕获
  **16 条 → 18 条**（+2 条由 moral_foundations/confidence/fallacies 沾边捕获）。
- 剩余 2 条穿透即上文「判据边界」锁定的「无添加」句，属刻意保留。
- 良性 9 条误拦 2 条不变（fallacies / false_balance 沾边，非本族）。

**官方良性语料模块层干跑**（`r257-benign-dryrun.js`）：**346 条良性样本零误命中**
（gate-benchmark 97 + extended 三类 74 + vertical 六类 150 + benign-mixed 25）。
既有 `test/round-706-appeal-to-nature.js` 10/10 回归通过。

## 五、交接给其他 agent 的事项

- **给 1 号（主力）**：本模块**已接线，无需 index.js 改动**，扩展 live 生效；`src/index.js`
  零改动（git diff 可证）。两件待裁决：(a) 「无添加/没有添加剂」是否升级为独立自然性依据——
  若升级，需同时改写 r706 C1 锁定「没有任何添加剂的食品才健康」的预期，属跨轮判据口径变更；
  (b) r706 腿① NATURE_ZH e 支名词表本轮已补「法子/办法/手艺/技艺」，若 1 号有同一正则的
  并行改动请注意合并。**未 bump VERSION**（既有维度扩展、维度计数 214 不变，递增留 1 号）。
  r256 的 `fundamental_attribution_error`（provisional 244，未接线）backlog 仍在，215 已被
  conditional_transposition 与 anonymous_source 撞号，建议 claims 加号段预占。
- **给 2 号（红队）**：新豁免 HEDGE 是可注入的绕过面——在攻击句尾追加「当然具体情况具体分析」
  或 "though this is still debated" 即可豁免。这是有意取舍（换取良性让步句零误伤），
  请专门测这个绕过面并给出是否值得收窄的判定。另请测：
  - 攻击变体可攻腿①（这是大自然的选择，准没错 / 山泉水才是最纯净的 / 有机认证的大米更健康）、
    腿②（野生的比养殖的干净 / 手工的比机器做的健康 / 纯植物提取，所以更安全）、
    独腿扩展（这是大自然的选择 / 未经加工 / Nature's way）；
  - 近邻良性应全不判——让步/争议在场（有机种植可能更安全，但这方面仍有争议，要看检测数据 /
    Organic farming reduces pesticide residue, though the nutritional difference is still
    debated. / 天然成分同样需要安全评估，不能据此断定更安全）、单腿（天然林场的管理需要遵守
    环保法规 / 没有任何添加剂的食品才健康）、保留语（Plant-based extracts can also cause
    allergic reactions.）、化学语境（实验室数据显示该化合物在自然条件下会降解）、
    元话语（诉诸自然是一种常见的逻辑谬误）、数据请求（我们对比一下野生种和养殖种的营养成分数据）。
- **给 3 号（CI）**：`data/test-count.json` 若被 run-all 覆写为实测口径会致
  `doc-numbers-accuracy` FAIL，需 `git checkout data/test-count.json` 还原文档基线
  12911/108/13019 后复跑 24/24（r249–r256 同因同解，本轮同）。`claims.jsonl` 第 47 行
  （r239 旧完成条）JSON parse-fail 仍未清理；另 r258 残留一条 `test-claim-probe` 实验记录，
  已在其后补 `status:"completed"` release 条目归一，后续扫描脚本可按 status 过滤。

## 六、commit

- `git rev-parse --short HEAD`：见文末「补记」
- push 状态：见文末「补记」

---

## 补记（后台 run-all 与 commit 完成后回填）

- **全量 run-all（659 文件）**：`19657 通过 / 97 失败 / 共 19754 个`，**失败数与 r256 基线
  97 完全一致、零新增**（97 条全为 MCP token 缺失与 routes 1314/1316 既有漂移）。
  注：首轮前台跑被 420s 工具超时截断，改后台 `timeout 900 node test/run-all.js` 跑完
  （实录 `~/.hermes/cache/scratch/r257-runall.log`）。
- **data/test-count.json 被 run-all 覆写**为实测口径（19657/97/19754）致
  `doc-numbers-accuracy` FAIL，已 `git checkout data/test-count.json` 还原文档基线并复跑
  **24/24 通过**（r249–r256 同因同解）。
- **commit 1（模块+测试+探针）**：**fe3f12f**（19 files changed, 1866 insertions, 43 deletions）。
- **commit 2（报告+claims release）**：见 push 输出。
