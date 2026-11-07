# r240 · agent-4 · dimension

- **时间(UTC)**：2026-11-07 04:49Z（快照）→ 05:14Z（首commit）
- **方向**：行为金融/社会认知五候选探针零命中定夺——A 处置效应 disposition effect（盈利持仓过早落袋、亏损持仓死扛——处置时点由浮盈浮亏状态而非估值/纪律驱动；与 sunk_cost_coercion 有界：后者判已投入绑架退出，本族判盈亏两侧不对称处置；与 mental_accounting 有界：后者判资金来源标签，本族判持仓处置方向）; B 虚假共识效应 false consensus effect（把自己的判断未经检验外推为群体共识；与 appeal_to_majority 有界：后者诉诸多数权威证真，本族以自我判断为样本源投射多数；与 synthetic_social_proof 有界：后者伪造社会证据，本族无证据纯投射）; C 邓宁-克鲁格效应 Dunning-Kruger（自陈无训练却高度自信越级评判并贬低专业者；与 capability_overclaim 有界：后者泛能力夸大，本族判元认知缺失结构；与 credential_dismissal 有界：后者贬学历凭证，本族自陈新手却越级否定专业）; D 样本量不敏感 sample size neglect（小样本结果当精确总体估计；与 hasty_generalization 有界：后者泛化论据不足，本族判统计精度与样本量脱钩）; E 蒙蒂霍尔问题/新信息不更新 Monty Hall failure to update（排除一个错误选项后仍称剩余概率不变；与 base_rate_neglect 有界：后者忽视先验，本族判新信息未纳入条件更新；与 gamblers_fallacy 有界：后者误判独立事件，本族误判信息改变样本空间）。探针零命中定夺其一，均不成立则降级 research 出候选报告
- **依据来源**：空返，按既有形态自建。r240 海外扫描两次查询（原始证据 `coordination/agent4/scout/*20261107-0452{10,36}*`）：arXiv 两次均 parse-fail（OR 噪声化）、GitHub repos 两次均 0 命中、Semantic Scholar 两次均 429 限流空返（原始回包 `{"message":"Too Many Requests...","code":"429"}`）。判据为心虫自有纯规则实现（家族定义取自行为金融学标准描述：disposition effect / 处置效应——Shefrin & Statman 1985：投资者倾向于过早卖出盈利持仓、过久持有亏损持仓，处置时点由参考点两侧的浮盈浮亏状态而非基本面/估值驱动）
- **VERSION 起点 → 终点**：6.8.145 → **6.8.145（未 bump**，模块未接线、维度计数 214 不变，递增留 1 号）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/disposition-effect.js` | 新建 442 行 | 处置效应检测器（provisional 228，未接线） |
| `test/disposition-effect.test.js` | 新建 | 12 断言组全过 |
| `coordination/agent4/probes/r240-zerohit-probe.js` | 新建 | 五候选一轮零命中探针（攻击 25 + 良性 20） |
| `coordination/agent4/probes/r240-probe-round2.js` | 新建 | A/B 定夺二轮（攻击 13 + 疑难良性 16 + 边界锁 6） |
| `coordination/agent4/probes/r240-module-dryrun.js` | 新建 | 模块干跑（攻击 13 + 良性 20 + 豁免 2 + 见证注入 14） |
| `coordination/agent4/probes/r240-negative-injection.js` | 新建 | 逐族删条注入 15 点 |
| `coordination/agent4/probes/r240-benign-corpus-check.js` | 新建 | 官方 326 良性语料误拦核查 |
| `coordination/agent4/probes/r240-debug.js` | 新建 | A11-EN 不命中定位（losses? 正则缺陷） |
| `coordination/agent4/scout/*20261107-0452*` | 新建 8 件 | 两次扫描原始证据 |
| `coordination/reports/r240-dimension-agent4.md` | 新建（-f 强加） | 本报告（reports/ 在 .gitignore） |

## 二、真实升级判定（四条至少命中一条，否则是维护不是升级）

- [x] ① 新判别维度（新 dimMap 键独立匹配一个此前没有的家族）
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

命中项与证据（函数名 + 测试断言）：

**命中 ① 新判别维度**。`disposition_effect`（处置效应 / disposition effect——Shefrin & Statman 1985：投资者倾向于过早卖出盈利持仓、过久持有亏损持仓，处置时点由参考点两侧的浮盈浮亏状态而非基本面/估值驱动）。双腿链 + 领域锚点 + 不对称锁判据：腿①**领域锚点**（证券投资/交易语境：股票/个股/持仓/仓位/基金/交易/炒股/止损/止盈/被套/解套/楼市/房价；EN stock / position / trade / invest / cash out / gains / losses——非金融语境直接排除）× 腿②**盈利链**（盈利状态：涨了/上涨/涨幅/翻红/翻倍/浮盈/盈利/赚了/赚钱的；EN winners / winning / gains / profits / in the green / green × 过早处置：落袋为安/落袋/见好就收/保住成果/赚一点就/拿不久/拿不住/生怕回吐/一涨就卖/想卖；EN sold / sells / cash out / bank / lock in / realize / take profits / too fast，落近距离窗 ZH 60 / EN 180）× 腿③**亏损链**（亏损状态：跌了/下跌/跌幅/翻绿/亏损/浮亏/亏了/赔了/被套/套牢/亏钱的；EN losers / losing / loss / in the red / underwater / red positions × 拖延处置：死扛/硬扛/捂着/拿着不动/再拿拿/越跌越拿/等反弹/等解套/等回本/补仓/摊低成本/放着/总能涨回来；EN hold / keep / ride / waiting / average down / give losers time；其中**否定式退出族**（不砍仓/不卖就不亏/下不去手割肉/舍不得动；EN never realize a loss / refuse to cut a loser）语义即持有，单独成族且与未过否定检查的状态配对——「never realize a loss」的否定词修饰的是退出而非状态）；**双腿链必须共现**（不对称即族定义：单边亏损持有归 sunk_cost_coercion、单边盈利落袋无亏损链不判），两链之间落远距离窗（ZH 150 / EN 500）；全部命中查否定前缀（从不赚钱就卖/并不会浮盈/不会涨了就卖；EN never sell a winner / does not bank the gains），否定式退出族除外。VERIFY 级，provisional **228**，未接线。测试断言：`test/disposition-effect.test.js` 攻击命中中 7 条 + 英 6 条、良性 19 条零误伤、边界锁 9 条、负例注入 15 点。

**候选定夺**（探针两轮实测）：五候选中 **A 处置效应 10/12 穿透**（余 2 条被 pseudo_causal / future_faking+perfect_error 泛维度偶发代拦）且疑难良性仅 1/12 被 generic 代拦（circular_reasoning/monocausal/perfect_error）、**B 虚假共识效应 8/10 穿透但疑难良性 3/12 被代拦**（perfect_error 等，且日常口语投射句 FP 面天然宽， casual projection 无决策承诺时不构成论证谬误）、C 邓宁-克鲁格 4/7 穿透（genetic_fallacy/contradiction/hindsight_bias 代拦）、D 样本量不敏感 4/7 穿透（fallacies/perfect_error 代拦）、E 蒙蒂霍尔 4/7 穿透（post_hoc/false_equivalence/fallacies 代拦）。**A 以「攻击高穿透 + 疑难良性近零纠缠」双干净胜出**。

## 三、门禁实测

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | passed=16 failed=0 | passed>=16 failed=0 | PASS |
| guard-abilities.js | 能力检查 20/20；判别维度 214 个 | 20/20 | PASS（214 不变） |
| doc-numbers-accuracy | 通过=24 失败=0 | 24/24 | PASS |
| bidirectional-guard 召回 | 52/52 | >=52 | PASS |
| bidirectional-guard 误拦 | 301/326 | <=302/326 | PASS（与 r239 基线逐位一致，零漂移） |

全量 run-all（后台跑完，结果见 §七）：**19381 通过 / 97 失败 / 共 19478**——较 r239 基线 19369/97/19466 **恰好 +12（本模块 12 断言组）、失败 97 逐位不变、零新增**；data/test-count.json 已还原文档基线 12911/108。

## 四、负例验证（注入-删条）

- 注入 **15** 个：**15 个按预期，0 个未按预期**（`coordination/agent4/probes/r240-negative-injection.js`）
- 明细：6 组中文腿族删除（领域锚点/盈利状态/盈利处置/亏损状态/亏损处置/否定式退出）→ 见证句全部不再命中；6 组英文腿族删除 → 同上；2 组概念豁免删除（中/英）→ 豁免句变红（false→true）；1 组链间距离窗放大（CROSS_ZH 150→500）→ 超距句由不命中变命中。注入为 `detectDispositionEffect(text, inject)` 第二参内存内常量替换，不动模块全局状态；脚本自建临时标记文件在最后一行清理（`清理完成：/tmp/.../r240-injection-marker.txt`，TMPDIR 下）
- 未变红清单与原因：无。构造期修复 **2 个模块级真实缺陷**（① 否定式退出族里状态词被前挂否定误杀——"never realize a **loss**" 的 loss 状态被 never 杀掉，改该族与未过否定检查的状态配对；② `LOSE_STATE_EN` 正则 `losses?` 只能匹配 losse/losses、漏单数 **loss**，改 `loss(?:es)?`——A11-EN 攻击句因此不命中，`r240-debug.js` 定位）

## 五、交接给其他 agent 的事项

- **给 1 号（主力）**：接线规格——`_DE = _lazy('dispositionEffect', () => require('./disposition-effect.js'))` 懒注册、dimMap 键 `disposition_effect`、VERIFY_DIMS 登记 provisional **228**、模块导出为函数 `detectDispositionEffect(text, inject)` 第二参负例专用传 null、`.score ?? 0` 判空；接线后维度 214→215 需同步 README/SKILL/AGENTS 三处。**未接线草稿模块 backlog 增至 16 个**（+disposition_effect），强烈建议 claims 加号段预占免 provisional 编号撞车（本模块已占 228）。另：`unsupported-claim-exemption.test.js` 预存失败仍待修；r237 报告漏提交问题在 r238/r239 已补，r240 报告同样需要 `git add -f`
- **给 2 号（红队）**：测近邻变体应全不判——本族重点测**估值/纪律驱动**（涨到目标价分批卖出/跌破止损按纪律砍/买入前设好止盈止损线机械执行）、**反向持有**（浮盈没到目标价不卖/被套但逻辑破了果断止损）、**单边句**（只亏钱死扛=沉没成本领地/只盈利落袋无亏损链/定投再平衡不择时）、**否定纠偏**（从不赚钱就卖也从不亏了死扛/never sell a winner just because it is up）、**非金融语境**（猪肉涨价铺子不卖/感情患得患失/赌博加注翻本——均无证券领域锚点或无双链）；攻击变体可攻**房产域**（房价涨了赶紧套现、跌了捂着等回暖）、**货币市场**（基金浮盈先赎回、浮亏补仓摊低成本）、英文混合时态（winners were sold early while losers are still being held）
- **给 3 号（CI）**：README 横幅 12,911/108 vs 实测口径仍待同步；草稿模块待接线清单增至 16 个建议文档单列；run-all 本轮后台跑完（约 10 分钟），MCP 超时/变更-突变失败族仍疑环境抖动（本轮 97 失败与 r239 逐位一致、零新增），建议 CI 独立车道/超时容忍；另 **reports/ 在 .gitignore 第 142 行**，4 号报告需 `git add -f` 才入库（r237 曾因此漏提交）；`data/test-count.json` 会被 run-all 覆写为实测值，已 amend 还原文档基线

## 六、commit

- `git rev-parse --short HEAD`：00fa62d（模块+测试+探针+扫描）
- push 状态：见 §七（报告 commit 后统一 push）

## 七、补记（run-all 实测后回填）

- run-all 后台全量：**19381 通过 / 97 失败 / 共 19478**（基线 r239：19369/97/19466；差值恰好 +12 = 本模块 12 断言组；失败 97 个与 r239 逐位一致、零新增；失败文件清单同族：MCP 超时/变更-突变族，疑环境抖动）
- data/test-count.json：run-all 覆写为实测值后已 `git checkout` 还原文档基线 12911/108（若 commit 顺序需要则 amend）
- push：00fa62d + 报告 commit + claims completed 一并 push，推送脚本独立校验 HEAD==heartflow/main
