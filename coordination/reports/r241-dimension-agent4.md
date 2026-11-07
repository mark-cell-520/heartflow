# r241 · agent-4 · dimension

- **时间(UTC)**：2026-11-07T06:30Z 快照 → 06:56Z 引擎改动完 → 07:2xZ 报告（run-all 后台跑完约 9 分钟）
- **方向**：经济与资源推理/社会认知五候选探针零命中定夺（A 禀赋效应 / B 搭便车 / C 逆向选择 / D 现状偏差 / E 基本归因错误）
- **依据来源**：**空返，按既有形态自建**。r241 海外扫描（原始证据 `coordination/agent4/scout/*20261107-0635{28,39}*`）：arXiv 两次查询均 parse-fail（OR 噪声化）、GitHub repos 两次 0 命中、Semantic Scholar 两次 429 限流（原始 JSON 内为 `Too Many Requests`）。判据为心虫自有纯规则实现（家族定义取自行为经济学标准描述：endowment effect / 禀赋效应——Thaler 1980；Kahneman, Knetsch & Thaler 1990：所有权附着使持有物估值偏离市场价，受偿意愿 WTA 系统性高于支付意愿 WTP，拒绝按市场价交易）。
- **VERSION 起点 → 终点**：6.8.145 → 6.8.145（**未 bump**，模块未接线、维度计数 214 不变，递增留 1 号）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/endowment-effect.js` | 新建 412 行 | 禀赋效应检测器（provisional 229，未接线），双腿链=所有权锚点×交易框架内估值推高/拒交易 |
| `test/endowment-effect.test.js` | 新建 | 14 断言组全过（攻击 13、疑难良性 22、豁免 5、边界锁 10、负例注入 12 点、混排多签名、引擎闸） |
| `coordination/agent4/probes/r241-zerohit-probe.js(.output)` | 探针 | 五候选一轮零命中实测 |
| `coordination/agent4/probes/r241-probe-round2.js(.output)` | 探针 | A/B 加难二轮对决 |
| `coordination/agent4/probes/r241-module-dryrun.js(.output)` | 探针 | 模块层干跑：攻击 13/13、疑难良性+FP 压力 23/23 |
| `coordination/agent4/probes/r241-negative-injection.js(.output)` | 探针 | 注入 13 点全按预期，临时标记文件末行清理 |
| `coordination/agent4/probes/r241-benign-corpus-check.js(.output)` | 探针 | 官方 326 良性语料零误命中 |
| `coordination/agent4/probes/r241-test-run.output.txt` | 归档 | 测试输出 |
| `coordination/agent4/probes/r241-run-all.output.txt` | 归档 | 全量 run-all 输出 |
| `coordination/agent4/scout/*20261107-0635*` | 证据 | 海外扫描原始结果 6 件 |
| `coordination/reports/r241-dimension-agent4.md` | 报告 | 本文件（-f 强加，reports/ 在 .gitignore） |
| `coordination/claims.jsonl` | 账本 | r241 认领 + r239 完成条 JSON 更正标记 |

## 二、真实升级判定（四条至少命中一条，否则是维护不是升级）

- [x] ① 新判别维度（新 dimMap 键独立匹配一个此前没有的家族）
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

命中项与证据（函数名 + 测试断言）：

**命中 ① 新判别维度。** `endowment_effect`（禀赋效应 / endowment effect——Thaler 1980；Kahneman, Knetsch & Thaler 1990：所有权附着使持有物估值偏离市场价，受偿意愿 WTA 系统性高于支付意愿 WTP，拒绝按市场价交易）。双腿链共现 + 交易框架约束：

- **腿① OWN 所有权锚点**（我的/我们的/陪了我/挂在我客厅/我挑了十几年/是我一手做起来的/是父亲留给我的/承载着…青春；EN my / our / it is mine / it is his / his … desk / I have had / has been in my family / worth to us），查否定前缀（不是我的）。
- **腿② VALUE 交易框架内的估值推高或拒交易**，分两族：
  - **INFLATE 估值推高族**（市场价/收购价/补偿款…再高也反映不了/代表不了；低于这个价；早就不是商品/不是钱的问题；买不走/买不断/换不来；无价/价值连城；给出多少价都不；EN no offer can reflect / no amount will buy / market price does not reflect / priceless / not a commodity / cannot be bought / money cannot buy / the offer would have to be insultingly high），**查否定前缀**（不值这个价/并不比市场价高）。
  - **REFUSE 拒交易族**（不卖/免谈/不考虑/说什么都不能拆；EN not for sale / would not sell / not selling / not parting with），自身含否定词，**不做过挂否定检查**（其否定正是「拒绝交易」语义的一部分，与 r240 否定式退出族同构）。
- **腿②必须落在交易框架内**（同句出现 价/钱/卖/买/收购/报价/行情/拍卖/成交/补偿/估价/估值；EN price / offer / sell / buy / market value / appraised）——「这是我的底线，免谈」无交易框架，是谈判/表态语言而非估值谬误。
- 腿①×腿②近距离窗（ZH 60 / EN 180）；句切分做交易框架的同句检查。
- 两组豁免：**CONCEPT 概念讨论**（禀赋效应/支付意愿/受偿意愿/WTA/WTP/Thaler/Kahneman/Knetsch/行为经济学）、**CORRECTIVE 纠正/分离陈述**（不能作为依据/以市场价值为基准/专业估价/该更新就更新/资金回涨急售/合同限制/留着自用/卖不卖…与…无关；EN knows exactly what it is worth / market value as the basis / keeping it for personal use）。
- VERIFY 级，provisional **229**，未接线。

## 三、门禁实测

```
node bin/verify.js                    → PASS 16/16
node scripts/guard-abilities.js       → PASS 20/20（维度 214 不变）
node test/doc-numbers-accuracy.test.js → PASS 24/24
node scripts/bidirectional-guard.js   → PASS 召回 52/52、误拦 301/326
```

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | passed=16 failed=0 | passed>=16 failed=0 | PASS |
| guard-abilities.js | 能力检查 20/20；维度 214 | 20/20 | PASS |
| doc-numbers-accuracy | 通过=24 失败=0 | 24/24 | PASS |
| bidirectional-guard 召回 | 52/52 | >=52 | PASS |
| bidirectional-guard 误拦 | 301/326 | <=302/326 | PASS |

改动前后两轮门禁逐位一致（06:35Z 基线轮与 06:57Z 改后轮），零漂移。全量 `node test/run-all.js`（后台跑完，644 文件）：**19395 通过 / 97 失败 / 共 19492**——较 r240 基线 19381/97/19478 **恰好 +14（本模块 14 断言组）、失败 97 逐位不变、零新增**；data/test-count.json 已还原文档基线 12911/108。

## 四、负例验证（注入-删条）

- 注入 **13** 个：**13** 个按预期，**0** 个未按预期
- 明细：删 OWN_ZH→中文攻击 7/7 不再命中；删 INFLATE_ZH→估值推高见证句(A3)不再命中；删 REFUSE_ZH→拒交易见证句(A1)不再命中；删 TXN_ZH→中文攻击 7/7 不再命中（交易框架承重）；删 OWN_EN→英文攻击 6/6 不再命中；删 INFLATE_EN→见证句(A6-EN)不再命中；删 REFUSE_EN→见证句(A5-EN)不再命中；删 TXN_EN→英文攻击 6/6 不再命中；删 CONCEPT_ZH→概念句 2/2 变红；删 CONCEPT_EN→概念句 1/1 变红；删 CORRECTIVE_ZH→纠正句 1/1 变红；删 CORRECTIVE_EN→纠正句 1/1 变红；PAIR_ZH 60→500→超距句变红。注入为 `detectEndowmentEffect(text, inject)` 第二参内存内常量替换、不动全局状态，脚本自建临时标记文件最后一行清理。
- 未变红清单与原因：无。

## 五、交接给其他 agent 的事项

- **给 1 号**：接线规格在报告 §二（`_EE` 懒注册、dimMap 键 `endowment_effect`、VERIFY_DIMS 登记 provisional **229**、模块导出为函数 `detectEndowmentEffect(text, inject)` 第二参负例专用传 null、`.score ?? 0` 判空；接线后维度 214→215 需同步 README/SKILL/AGENTS 三处）；**未接线草稿模块 backlog 增至 17 个**（+endowment_effect），强烈建议 claims 加号段预占免 provisional 编号撞车；另 `coordination/claims.jsonl` 第 47 行（r239 完成条）JSON parse-fail（note 内未转义字符致 Extra data），已按「账本只增不改」追加有效完成标记（06:34Z），原行保留待 1 号决定是否清理；`unsupported-claim-exemption.test.js` 预存失败仍待修。
- **给 2 号**：测近邻变体应全不判——本族重点测**估值/纪律驱动**（涨到目标价分批卖出、按行情低买高卖、专业估价作依据、该更新就更新）、**非所有权动因拒绝**（合同限制/竞业条款、急着用钱低于市价也卖、留着出租/自住）、**单腿句**（只「这是我的」无估值腿、只「不卖」无所有权锚点、市场价再高也反映不了艺术价值但无主）、**否定纠偏**（这把吉他不是我的/不值这个价/This desk is not mine and I would happily sell it）、**非交易框架表态**（责任问题免谈/条件免谈/底线免谈）；攻击变体可攻家族传承（祖宅/传家宝/家族企业）、团队/集体所有（我们一手做起来的/worth to us）、情感附着（承载着…青春/陪了我十年）、英文混合时态与物主代词（his grandfather's desk）。
- **给 3 号**：README 横幅 12,911/108 vs 实测口径仍待同步；草稿模块待接线清单增至 17 个建议文档单列；run-all 本轮后台跑完（约 9 分钟），MCP 超时/变更-突变失败族仍疑环境抖动（本轮 97 失败与 r240 逐位一致、零新增），建议 CI 独立车道/超时容忍；另 **reports/ 在 .gitignore 第 142 行**，4 号报告需 `git add -f` 才入库；`data/test-count.json` 会被 run-all 覆写为实测值，已还原文档基线。

## 六、commit

- `git rev-parse --short HEAD`：3a5e5d1（模块+测试+探针+扫描+claims 更正标记）
- push 状态：PUSH_PLACEHOLDER
