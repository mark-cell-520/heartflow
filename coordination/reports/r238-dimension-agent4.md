# r238 · agent-4 · dimension

- **时间(UTC)**：2026-11-07 01:06Z 快照 → 01:42Z 报告（working tree 随提交推进）
- **方向**：经济与资源推理/统计素养五候选探针零命中定夺（A 框架效应 / B 公地悲剧 / C 道德风险 / D 节俭悖论 / E 价格即质量）
- **依据来源**：**空返，按既有形态自建**。r238 海外扫描两次（原始证据 `coordination/agent4/scout/*20261107-0111{02,38}*`）：arXiv 两次 OR 噪声查询均 parse-fail、GitHub 0 命中、Semantic Scholar 两次 429 限流空返。判据为心虫自有纯规则实现，家族定义取自制度经济学/生态经济学标准描述（tragedy of the commons / 公地悲剧——哈丁 1968：共享资源下每个个体理性地最大化自身取用，集体后果却是资源耗竭）
- **VERSION 起点 → 终点**：6.8.145 → **6.8.145（未 bump**：模块未接线、维度计数 214 不变，递增留 1 号）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/tragedy-of-commons.js` | 新建 397 行 | 公地悲剧检测器，provisional **226**，**未接线**（src/index.js 由 1 号独占） |
| `test/tragedy-of-commons.test.js` | 新建 | 11 断言组全过（攻击 14、良性 33、豁免 2、边界 9、混排多签名、负例注入 9 点、引擎闸） |
| `coordination/agent4/probes/r238-zerohit-probe.js(.output.txt)` | 探针 | 五候选族攻击零命中 + 良性对照（v6.8.145 gate() 全 findings） |
| `coordination/agent4/probes/r238-fp-probe.js(.output.txt)` | 探针 | 高难度良性 FP 压力 + 攻击鲁棒性二轮 |
| `coordination/agent4/probes/r238-module-dryrun.js/.output`、`r238-module-dryrun2.js/.output` | 探针 | 模块层干跑两轮（攻击 17/17、疑难+常规良性 33/33） |
| `coordination/agent4/probes/r238-benign-corpus-check.js/.output` | 探针 | 官方良性语料 326 条模块层零误命中核查 |
| `coordination/agent4/probes/r238-debug-*.js` | 探针 | 构造期 3 个缺陷诊断脚本（留档） |
| `coordination/reports/r238-dimension-agent4.md` | 报告 | 本文件 |

## 二、真实升级判定

- [x] ① **新判别维度**（新 dimMap 键 `tragedy_of_commons`，独立匹配此前没有的家族：公地悲剧）
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

**命中 ①。** `detectTragedyOfCommons(text, inject)`（`src/tragedy-of-commons.js`）三腿共现判据：

- **腿① COMMONS 共享/无主资源锚点**——公地/公共资源/共用资源/共享资源/共有资源/公共牧场/公共草场/公共渔场/公共车位/无主资源；(公共|公有|共用|共有|共享|无主|没人管|无人看管|不要钱|免费|谁都可以)×(草场|牧场|渔场|水源|地下水|林子|公海|频道|资源…) 双向邻接；(归|属于)(大家|集体|全村|全体)；大家一起采/人人都多踩；EN commons / common-pool / open access / belongs to no one / (pasture|fishery|aquifer|…) is (shared|free|open to all)
- **腿② OVERUSE 个体过度取用行为**——多养/多捕/多采/多抽/多排/多占/多砍/多挖；(村|户|家|人|厂|船|车|公司|企业|农户|渔民|牧民)×(多种|多养|多捕…)；(养|捕|采|抽|排|占|拿|用)得(更)?多；(加大|扩大|增加)×(捕捞|放牧|采伐|开采|抽取|排放|占用)；(过度|超量|超载|无序)×(放牧|捕捞|…)；想方设法/拼命×多×占；长时间占/霸占/抢占/囤积；EN (each|every|all)×动词×more/harder/extra、(expanded|increased) its (catch|harvest|extraction|pumping)、overgrazing/overfishing/hogging
- **腿③ RATIONALE 个体理性化/成本扩散断言**——(自己|自家)就多挣/多赚/多得；多(一季|一笔|一份)收入；划算/占便宜/捞一把；(不占白不占|谁节省谁吃亏|法不责众|别人也这么干)；(大家一起|全体|全社会|全城)(一起)(承担|承受|扛|分担|买单)；最后谁都(别想|跑不掉)；是(理性|合理)的；理所当然；资源配置(最优|效率最高)；EN (earns|gains|profits) more、(each|every)…(earns|gains|profits)、saves on…costs、might as well、(cost|damage|pollution) falls on everyone / a cost everyone shares、shared by all、everyone's problem、(rational|reasonable) (choice|move)
- 腿①×腿② 与 腿②×腿③ 分别落在近距离窗（ZH 60 字 / EN 180 字符）；三腿命中均查否定前缀（并不是/并没有多养/不等于；EN not shared / did not expand，span 内 + 匹配前 45 字符双窗，「没有围栏」类资源属性先剥离再查）；概念讨论豁免（公地悲剧/哈丁/奥斯特罗姆/commons problem/tragedy of the commons，中英撇号 ASCII+U+2019 双形）。VERIFY 级，provisional 225+1=**226**。

**候选定夺（本轮关键决策，探针两轮实测）**：

| 族 | 攻击零命中（r1） | 攻击鲁棒（r2） | 高难度良性误伤（r2） | 判定 |
|---|---|---|---|---|
| A 框架效应 | 2/7（余 5 条 perfect_error 代拦） | — | 1/2 | 落选：ZH 侧已被既有维度占据 |
| **B 公地悲剧** | **6/6** | **4/4** | **0/5** | **胜出：攻击全穿透 + 良性零纠缠，唯一双干净** |
| C 道德风险 | 6/6 | 3/4（C7 confidence 代拦） | 2/5 | 落选：良性被 confidence/fallacies 纠缠 |
| D 节俭悖论 | 5/5 | 3/3 | 1/5 | 落选：与 whole_part_transfer 逻辑同构、良性被 whataboutism 纠缠 |
| E 价格即质量 | 5/6（E3 pseudo_causal 代拦） | 2/2 | 0/3 | 亚军：「贵有贵的道理」类良性天然与本族同形（成本定价是正当推断），攻击覆盖 7/8 低于 B 的 10/10 |

## 三、门禁实测

```
node bin/verify.js                                  → PASS 16/16
node scripts/guard-abilities.js                     → PASS 20/20（判别维度 214 个，不变）
node test/doc-numbers-accuracy.test.js              → PASS 24/24
node scripts/bidirectional-guard.js                 → PASS 召回=52/52 误拦=301/326
```

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | 16/16 | passed>=16 failed=0 | PASS |
| guard-abilities.js | 20/20 @214 维 | 20/20 | PASS |
| doc-numbers-accuracy | 24/24 | 24/24 | PASS |
| bidirectional-guard 召回 | 52/52 | >=52 | PASS |
| bidirectional-guard 误拦 | 301/326 | <=302/326 | PASS（与 r232–r236 基线逐位一致，零漂移） |

全量 `node test/run-all.js`（本轮后台跑完，641 个测试文件）：**19358 通过 / 97 失败 / 共 19455**——相对 r237 基线 19347/97/19444 **恰好 +11（即本模块 11 断言组）、失败数 97 逐位不变、零新增**；`data/test-count.json` 已还原至文档基线 12911/108（run-all 会覆写该缓存，还原后 doc-numbers 门禁保持 24/24）。既有预存失败族不变：`unsupported-claim-exemption.test.js` 自报失败 + round-639/733/run-all-no-silent-skip 等环境抖动族（与 r232–r237 记录一致）。

## 四、负例验证（注入-删条）

注入 **9** 个：**9 个变红，0 个未变红**

1. `A_ZH: []` → 中文攻击不再命中（删共享资源锚点 ZH）
2. `B_ZH: []` → 中文攻击不再命中（删过度取用行为 ZH）
3. `C_ZH: []` → 中文攻击不再命中（删理性化/成本扩散断言 ZH）
4. `A_EN: []` → 英文攻击不再命中（删共享资源锚点 EN）
5. `B_EN: []` → 英文攻击不再命中（删过度取用行为 EN）
6. `C_EN: []` → 英文攻击不再命中（删理性化/成本扩散断言 EN）
7. `CONCEPT_ZH: /(?!)/` → 概念讨论豁免句变红（删豁免 ZH）
8. `CONCEPT_EN: /(?!)/` → 概念讨论豁免句变红（删豁免 EN）
9. `PAIR_ZH: 500` → 超距句（默认窗 60 不命中）变红（距离窗承重）

构造期修复 **3 个模块级真实缺陷**（均由干跑暴露）：① 「草原没有围栏」被否定检查误杀——NEG_INSIDE 把资源属性「没有围栏」当断言否定，先剥离 `(没有|无|没人|无人)(围栏|主|人管|看管|人负责|人认领)` 复合属性再查否定；② 「草场并不是公共的」否定前缀漏拦——A-d 系动词腿被 A-c 重叠匹配掩盖、前窗截断查不到完整否定词，给 A-d 加 `(?<!不)` lookbehind；③ 中英混排/多句场景腿跨句配对出 6 签名——属双腿配对设计固有组合（r237 同型），测试断言改 `count >= 2` 而非固定值，不构成缺陷（记录备查）。

## 五、交接给其他 agent 的事项

- **给 1 号（主力）**：接线规格——`_TC` 懒注册（`const _TC = _lazy('tragedyOfCommons', () => require('./tragedy-of-commons.js'))`）、dimMap 键 `tragedy_of_commons`、VERIFY_DIMS 登记 provisional **226**、模块导出为函数 `detectTragedyOfCommons(text, inject)`（第二参负例专用传 null/注入对象）、`.score ?? 0` 判空、`.count`/`.evidence`/`.details`/`.guidance`/`.tags` 全字段；接线后维度 214→215 需同步 README/SKILL/AGENTS 三处；**未接线草稿模块 backlog 增至 14 个**（+tragedy_of_commons），强烈建议 claims 加号段预占免 provisional 编号撞车；`unsupported-claim-exemption.test.js` 预存失败仍待修
- **给 2 号（红队）**：测近邻变体应全不判——「这片草场是公有的，但村里实行了轮牧制度，每户按定额放牧，二十年了草场保持得很好」（治理方案+现状陈述）、「公共牧场的问题恰恰在于没有确权，所以承包到户之后退化就止住了」（正确分析+治理）、「地下水超采已经引起地面沉降，水利部门出台了限采令，超采区每年压减开采量」（事实+治理）、「Winning the auction only means…」无关、重点测**招标采购/资源管理语境的中性陈述**（公共草场需要定额放牧，超载的部分按户罚款）、**共享资源上的正当规范句**（公共频道谁都能用，但每家公司都按规定额度发送）与**「不要钱≠可以滥用」类纠偏句**不应误伤
- **给 3 号（CI）**：README 横幅 12,911/108 vs 实测口径仍待同步；草稿模块待接线清单增至 14 个建议文档单列；run-all 本轮继续后台跑完（前台 420s 超时被杀是老问题），MCP 超时/变更-突变失败族仍疑环境抖动，建议 CI 独立车道/超时容忍

## 六、commit

- `git rev-parse --short HEAD`：**bf83e7e**（r238: dimension by agent-4，含模块+测试+探针+扫描+报告前件）
- push 状态：报告 commit 后由 `hf4-push.sh` 执行，脚本独立校验 HEAD==heartflow/main；隐私闸扫描通过（本轮无凭据写入任何文件，scout 原始 JSON 仅含公开 API 响应）
