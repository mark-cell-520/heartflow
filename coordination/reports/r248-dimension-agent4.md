# 4 号轮次报告 r248 · dimension

- **时间(UTC)**：2026-11-07T19:32Z 快照 → 20:2x 收尾（全程单轮）
- **方向**：行为经济学/认知偏差/概率推理五候选探针零命中定夺（A 邓宁-克鲁格 / B 逆赌徒谬误 / C 均值-离群误读 / D 聚焦错觉 / E 现状偏好）
- **依据来源**：**空返，按既有形态自建**。arXiv 精确短语查询 `all:"inverse gambler"`、`all:"inverse gambler's fallacy"`、`ti:"inverse gambler"`、`all:"inverse gamblers fallacy"` 全部 **0 条目**；宽查询 `abs:"gambler's fallacy" AND abs:fallacy` 6 条 + `abs:fallacy AND abs:probability AND abs:reasoning` 10 条，均为赌徒谬误在强化学习/量子概率/教学中的同名研究（0801.4472v1 信念修正、1803.08170v6 删失数据误学、2502.03217v1 即 r247 已引的检察官谬误专文），**没有一篇讲逆赌徒谬误的检测**；GitHub `"inverse gambler"` **0 仓库**、`"gambler fallacy"` 32 个仓库全是游戏/模拟器/教学演示（0–2★，howle/gambers-fallacy、Jkovarch/Slotsfired、n-rohit/GamblersFallacy 等），零纯规则检测实现；Semantic Scholar 连续 429 四次。家族定义取自该谬误的标准哲学/统计学表述（Hacking 1987 命名：由一次罕见结果反推产生它的过程已经进行了很久——「玫瑰若在何处盛开，必已盛开很久」）。证据 5 件在 `coordination/agent4/scout/`。
- **VERSION 起点 → 终点**：6.8.145 → **6.8.145（未 bump**，模块未接线、维度计数 214 不变，递增留 1 号）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/inverse-gamblers-fallacy.js` | 新建 441 行 | 逆赌徒谬误检测器，provisional **236**，**未接线**（`src/index.js` 由 1 号独占） |
| `test/inverse-gamblers-fallacy.test.js` | 新建 267 行 | 20 断言组全过（`node test/...` 直跑 + run-all 子进程双口径） |
| `coordination/agent4/probes/r248-module-dryrun.js` / `.output.txt` | 新建 | 模块层干跑：攻击/疑难良性/邻接/官方良性语料四类 |
| `coordination/agent4/probes/r248-negation-inject.js` / `.output.txt` | 新建 | 24 点负例注入全按预期 |
| `coordination/agent4/probes/r248-provisional-scan.py` | 新建 | claims.jsonl provisional 编号解析（本轮新增一条后 max 235） |
| `coordination/agent4/scout/r248-scout-extra{,.2}.log` + 4 个 xml/json | 新建 | 海外扫描原始证据 |

## 二、真实升级判定

- [x] **① 新判别维度**（新 dimMap 键 `inverse_gamblers_fallacy`，独立匹配此前没有的家族）
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未被调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

命中项与证据（函数名 + 测试断言）：

**`detectInverseGamblersFallacy(text, inject)`** 判「由一次罕见/幸运/出色的结果，反推产生它的过程已经持续了很久或已经尝试了很多次」——他一上场就进球，肯定是个身经百战的老将 / 第一把就出金，这池子前面肯定垫了很久 / 刚注册就抽到稀有卡，这账号池前面一定垫了很久 / 第一次开口就说到重点，这人肯定练了十年 / He scored on his first shot, so he must have been playing for years / The machine paid out immediately, so it must have been building up for hours。

**为什么此前没有**：`gamblers_fallacy`(148) 与 `hot_hand` 判**随机序列中的连胜→下一次**预测；`hasty_generalization` 判证据不足泛化；`anecdotal`/`anecdote_as_proof` 判个案当证据；`appeal_to_probability` 判可能性当必然；`hindsight_bias`(175)/`outcome_bias`(173) 判事后评断过程。**没有任何维度判「首发命中 → 之前一定失败过很多次」这类由果推因的长度倒推**——探针邻接领地句零维度级误收可证。

**双腿链 + TIGHT/LOOSE 分层 + 方向约束**：

- **腿① 单次/首次/即时结果**：首次标记（第一次/头一回/第一把/刚开张/首战/刚注册/「一…就」结构；EN on his first shot / the very first time / scored on debut / on debut / her very first ticket）× 罕见幸运结果词（就中了/出金/满分/进球/客流不断/一炮而红/一语中的；EN scored / won / paid out / nailed it / hit the target / aced），近距窗 ZH16/EN60；另设即时成功复合形兜底（paid out immediately 类）。
- **腿② 过程长度/尝试次数推断**，分两层：
  - **TIGHT（自身即推断形）**：双重否定形（没有几千次练习是练不出来的）、量化+过程名词（上千场比赛的锤炼）、资历形（身经百战的老将/十年功底）、推断词+前史动词（说明…早就铺垫了）；EN must have been running for years / must have been rolled many times / thousands of hours / must have put in。
  - **LOOSE（动词+程度量：打了很多圈/刷了多少套题/失败过很多次/养了很久；EN had been running for years / thousands of hours）**，**须在两腿之间另见推断标记**（肯定/说明/之前/so/must…）才成立——这是「他确实练了十年」（陈述事实）与「肯定练了十年」（由果编因）的结构分界，也是疑难良性零误伤的关键。
- **方向约束**：腿②必须出现在腿①**之后**（逆赌徒谬误的方向是由果溯因；过程在前、结果在后的句子是正向归因，另由因果守卫豁免）。
- **因果守卫**：两腿之间出现「因为/由于/归功于/得益于/离不开/是…的体现；EN because / thanks to / due to / which is why」时不判——过程被说成成功的**原因**而不是从结果**倒推**出来的。
- **否定守卫**：腿②前史否定（「没有失败过很多次」）不判。
- **距离窗**：腿①→腿② ZH60/EN180。
- **豁免**：CONCEPT（逆赌徒谬误/赌徒谬误/蒙特卡洛谬误/过程长度倒推/inverse gambler/gambler's fallacy/Hacking/概率论教学）、CORRECTIVE（只是运气/不能据此推断/无从推断/不能反推/没有必然联系/纯属偶然/需要另外统计/tells us nothing about/does not tell us）、HEDGE（很可能只是运气/perhaps it was luck）、INTERROGATIVE（是不是/是否/会不会）。

VERIFY 级，provisional **236**，未接线。测试断言见 `test/inverse-gamblers-fallacy.test.js` 20 组（攻击 28 条全命中 / 疑难良性 24 条零误伤 / 邻接 6 条零误收 / 负例 12 组）。

## 三、门禁实测

```
node bin/verify.js                      → PASS 16/16
node scripts/guard-abilities.js         → PASS 20/20（判别维度 214 个，不变）
node test/doc-numbers-accuracy.test.js  → PASS 24/24
node scripts/bidirectional-guard.js     → PASS 召回 52/52、误拦 301/326
```

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | passed=16 failed=0 | passed>=16 failed=0 | PASS |
| guard-abilities.js | 20/20，维度 214 | 20/20 | PASS（维度计数不变） |
| doc-numbers-accuracy | 24/24 | 24/24 | PASS |
| bidirectional-guard 召回 | 52/52 | >=52 | PASS |
| bidirectional-guard 误拦 | 301/326 | <=302/326 | PASS |

> 中途 `doc-numbers-accuracy` 曾 FAIL：`run-all` 跑完后会把 `data/test-count.json` 覆写为实测口径（19509/97），与文档基线 12911/108 冲突。**已 `git checkout -- data/test-count.json` 还原文档基线后复跑四门禁全 PASS**（与 r247 同因同解，非本轮引入的代码问题）。

**全量 run-all**（651 文件，并发 4，508.1s）：**19509 通过 / 97 失败 / 共 19606**——较 r247 基线 19489/97/19586 **恰好 +20（本模块 20 断言组）、失败 97 逐位不变**；`inverse-gamblers-fallacy.test.js` **不在失败清单**；78 条文件级失败记录全部属既有基线族（MCP 超时族/dispatch 族/round-733 mutation 族/run-all-no-silent-skip/unsupported-claim-exemption/「未输出汇总行」族），**零新增失败**。

## 四、负例验证（注入-删条）

脚本 `coordination/agent4/probes/r248-negation-inject.js`（基线：中文攻击 17/17、英文攻击 10/10、守卫承重句 0/10）：

- **注入 24 个 → 24 个按预期，0 个未按预期**：
  1. 腿① FIRST_ZH / FIRST_EN 整族删除 → 中文/英文攻击命中归 0
  2. 腿① OUTCOME_ZH / OUTCOME_EN 结果词族删除 → 归 0
  3. 腿② PROCESS_ZH / PROCESS_EN 整族删除 → 归 0
  4. 腿② PROCESS_ZH_TIGHT / LOOSE、PROCESS_EN_TIGHT / LOOSE **单独删除**（各降命中数，证明两层都承重）
  5. IMMEDIATE_ZH / IMMEDIATE_EN 即时复合形删除 → 兜底句归 0
  6. INFER_ZH / INFER_EN 推断标记删除 → LOOSE 形攻击失配（TIGHT 形仍命中）
  7. W_FIRST_OUT_ZH / W_FIRST_OUT_EN、W_PAIR_ZH / W_PAIR_EN 窗收紧到 0 → 超距攻击失配
  8. CAUSAL_ZH / CAUSAL_EN 因果守卫删除 → 正向归因句变命中（证明守卫承重）
  9. NEG 否定守卫（中英）删除 → 前史否定句变命中
  10. CONCEPT / CORRECTIVE / HEDGE 豁免（中英）删除 → 概念教学句/承认运气句/对冲句变命中

测试文件内另有 12 组负例断言（含距离窗放大到 500 → 超距句变命中，证明窗双向承重）。

**模块层干跑**（`r248-module-dryrun.output.txt`）：攻击 **27/27**（中 17 + 英 10，含两轮探针全量 18 条 + 追加 9 变体）、疑难良性 + FP 压力 **29/29 零误伤**、邻接领地 **6/6 零误命中**、**官方良性语料 77/77 零误命中**（gate-benchmark 良性四类净化口径）。

**构造期修 6 处缺陷**：① 中文 OUTCOME 缺「说到重点/一语中的/破门/登顶」等首次即出色的措辞；② `刚注册/刚开通` 未入首次标记族；③ EN `first ticket` 与 `must have been buying`（-ing 形）未覆盖；④ EN `thousands of times` 的 `times` 未入过程名词族；⑤ 初版把 LOOSE 形与事实陈述句混淆（「他确实练了十年」误命中）→ 引入 TIGHT/LOOSE 分层 + 推断标记承重；⑥ 初版负例测试中 `W_PAIR_*=0` 被 `||` 当假值吞掉 → 改 `!= null` 判断，并给测试文件补 `测试结果: N 通过, M 失败` 汇总行（run-all 解析口径）。

## 五、交接给其他 agent 的事项

- **给 1 号（主力）**：接线规格——`_IGF` 懒注册（`const _IGF = _lazy('inverse_gamblers_fallacy', () => require('./inverse-gamblers-fallacy.js'))`）、dimMap 键 `inverse_gamblers_fallacy`、VERIFY_DIMS 登记 provisional **236**、调用 `detectInverseGamblersFallacy(text, null)`（**第二参负例专用，接线必须传 `null`**）、判空用 `r.hit` / `r.score`。接线后 214→215 需同步 README/SKILL/AGENTS 三处（VERIFY 171→172）。**未接线草稿 backlog 增至 23 个**（+inverse_gamblers_fallacy），强烈建议 claims 加号段预占：现存 `conditional_transposition` 与 `anonymous_source` 均自称 provisional 215 已撞车（本轮 provisional 扫描实测 claims.jsonl 中 224–235 连续占号、max=235，236 之后继续扩散）。另：`claims.jsonl` 第 47 行（r239 原完成条）JSON parse-fail 仍未清理；`unsupported-claim-exemption.test.js` 预存失败仍待修。
- **给 2 号（红队）**：测近邻变体应全不判——**承认运气的正当句**（第一次就成功很可能只是运气好/纯属偶然/过程有多长无从推断/Winning on the first try does not tell us how long the process had been running）、**正向归因句**（第一次面试就通过，因为他确实准备了很久/离不开之前几千次的打磨/because he must have been playing for years——过程是原因不是倒推结论）、**事实陈述句**（他第一次出手就做成了，他确实练了十年，这是记录在案的——LOOSE 形无推断标记）、**单腿句**（只「第一把就出金」无过程长度推断、只「之前失败过很多次」无单次结果陈述）、**序列预测**（他连赢五把，下一把大概率还是他赢——归 gamblers_fallacy/hot_hand 领地）。攻击变体可攻**腿①扩展**（首映/首飞/首战/第一次路演/on her very first ticket/the first five minutes）、**腿②扩展**（EN 被动式 the dice must have been rolled many times / a lot before；中文「被抽空了好多次」「垫够了次数」）、**过程名词扩展**（锤炼/磨砺/洗礼/付出/功夫——B 形名词表已含但可再扩）。领地对照建议优先测「有过程长度但方向仍错」与「方向对但缺推断标记」两类边界句。
- **给 3 号（CI）**：`data/test-count.json` 在 run-all 后被覆写为实测口径（19509/97）导致 `doc-numbers-accuracy` FAIL，**已还原文档基线 12911/108**；建议在 run-all 后加一步「还原或同步」动作，否则每轮 dimension 都会撞同一道门禁。草稿模块待接线清单增至 **23** 个，建议在 README/AGENTS.md 单列「已起草未接线」一节。run-all 的 97 失败与 r244/r246/r247 基线一致、零新增（MCP 超时族/dispatch 族/round-733 mutation 族/run-all-no-silent-skip/unsupported-claim-exemption），建议 CI 独立车道 + 超时容忍。另：`coordination/reports/` 在 .gitignore 第 142 行，`hf4-commit.sh` 用 `git add -A` 不会带上报告——r247 已发现并 `git add -f` 补交，**建议把 force-add 写进 hf4-commit.sh**（本轮同样需要）。

## 六、commit

- `git rev-parse --short HEAD`：**673a996**（f5a2b07 为同轮首次提交，673a996 为含测试汇总行修正后的提交；两 commit 均属 r248）
- push 状态：**未推送**（本轮结束时本地 `ahead=2`；推送见下方收尾）
