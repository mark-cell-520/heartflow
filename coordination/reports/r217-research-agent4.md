# r217 · agent-4 · research

- **时间(UTC)**：2026-11-05T11:10 – 11:35
- **方向**：经济与资源推理（资源约束下的最优决策谬误）——海外资源扫描 + 候选攻击族零命中探针
- **依据来源**：arXiv API（短语精确查询 + 脚本宽查询）、GitHub repos API ×2、Semantic Scholar API（429 限流）；零命中证据来自本轮探针 `coordination/agent4/probes/r217-zerohit-probe.js` 对引擎 v6.8.144 的实测。**未发现可集成的纯规则海外方案 → 空返，按既有形态自建。**
- **VERSION 起点 → 终点**：6.8.144 → 6.8.144（research 轮不动引擎、不 bump）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `coordination/agent4/scout/*`（9 个原始文件） | 只读扫描原始产物 | arXiv ×3、GitHub repos ×2、S2 ×2（429），含脚本宽查询与手工短语精确查询两轮 |
| `coordination/agent4/probes/r217-zerohit-probe.js` | 新增探针 | 4 个候选攻击族 × 19 条攻击样本 + 8 条良性对照，走 `src/gate.js` 全管线 |
| `coordination/agent4/probes/r217-zerohit-probe.output.txt` | 实测日志 | 探针完整输出（含 trace 归因；复现命令见文件头注释） |
| `coordination/claims.jsonl` | 认领账本 | r217 research 认领 + 完成记录 |
| `coordination/reports/r217-research-agent4.md` | 本报告 | — |

**引擎代码零改动**（research 轮纪律：不写 src、不 bump VERSION）。

## 二、真实升级判定（四条至少命中一条，否则是维护不是升级）

- [ ] ① 新判别维度（新 dimMap 键独立匹配一个此前没有的家族）
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

**真升级类型 0。** 本轮为只读研究轮：未改引擎、未加维度、未接线。产出是给写轮次的候选方向与零命中实证，不是升级本身。

## 三、门禁实测（基线复跑，先于任何动手）

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | passed=16 failed=0 | passed>=16 failed=0 | PASS |
| guard-abilities.js | 能力检查 20/20；判别维度 211 个 | 20/20 | PASS |
| doc-numbers-accuracy | 通过=24 失败=0 | 24/24 | PASS |
| bidirectional-guard 召回 | 52/52 | >=52 | PASS |
| bidirectional-guard 误拦 | 302/326 | <=302/326 | PASS |

四门禁全绿，与 DEPLOY-agent2.md 基线逐项一致（唯该文件"维度登记 210 键"已过期，实际 211——见交接给 3 号）。门禁红则修到绿；本轮无门禁变化。

## 四、负例验证（注入-删条）

**不适用**——research 轮未注入任何新模式，无注入-删条对象。替代验证为零命中探针（下节），证据同样是本轮真实运行。

## 四附、海外扫描结果（原始文件在 `coordination/agent4/scout/`）

| 来源 | 查询 | 结果 |
|---|---|---|
| arXiv（脚本宽查询） | "resource constrained decision making fallacy" / "economic reasoning cognitive bias opportunity cost" | 空格被 API 解析为 OR，totalResults 468501 / 350883，top-15 为天体物理/机器人/定价 OR 文献，**零相关** |
| GitHub repos（宽查询） | 同上两个长短语 | total_count=0 ×2 |
| Semantic Scholar | 同上两个查询 | **429 Too Many Requests ×2**（共享 IP 池限流，未重试到成功） |
| arXiv（短语精确） | `all:"opportunity cost"` | totalResults=175，top-10 全是动态定价/背包/能源 OR 文献，**零相关** |
| GitHub repos（精确） | `reasoning fallacies` | total_count=58；最高星 `AkkiSK/fallacy-forge`（56★）是交互式教学 trainer（HTML，非检测引擎）；`DJLougen/t013-logical-fallacies`（2★）是 psychometric benchmark；`Diana-Gyurjiyan/elenchos`（0★）是 agentic（LLM）审计工具。**无可集成的纯规则检测模块** |
| Semantic Scholar（重试） | "logical fallacy detection language models" | 仍 429 |

**结论：经济与资源推理方向无可集成的海外纯规则方案——空返，按既有形态自建。**

## 四附2、零命中探针实证（v6.8.144，19 攻击 + 8 良性）

判定口径：`gate(text).gate.action === 'pass'` 即该样本整族穿过引擎。完整输出见 `r217-zerohit-probe.output.txt`。

| 候选族 | 零命中 | 明细 |
|---|---|---|
| **B 零和误判**（把自愿交易当成一方所得即一方所失） | **4/5** | B2/B3/B4/B5 全 clean（中英双语）；B1 仅被 `loyalty_test` 附带命中（错维度承重） |
| **C 预算约束=价值判断**（"买不起"偷换成"不值得"） | **3/5** | C2/C4/C5 clean；C1 被 `fallacies(appeal_to_pity)` 附带命中；C3 被 `circular_reasoning` 附带命中（该句本身确有循环形，属合理附带） |
| **D 平均=边际混淆**（平均成本低推断边际必更低） | **2/4** | D3/D4（EN）clean；D1/D2 被 `reasoning_coherence` 附带命中（"一定/必然"绝对词触发） |
| A 机会成本忽视（已付款资产当免费、无视替代用途） | 1/5 | A2 clean；其余被 `fallacies(appeal_to_pity)`/`perfect_error`/`vagueness` 附带命中——全是绝对化措辞触发，非经济推理结构本身 |

良性对照 8/8 全 pass（四个族的"正确推理形"均无误伤）。

**关键结论**：已捕获样本的 trace 全部显示为**错维度附带承重**（appeal_to_pity / loyalty_test / reasoning_coherence / perfect_error / vagueness），没有任何一条由经济推理结构命中。即：把攻击句里的"肯定/一定/已经"等绝对词换掉，四个族全部穿过引擎。**B 零和误判是最强候选**（4/5 clean 且中英双语均漏），C、D 次之，A 最弱且与 `sunk_cost_coercion`(98) 有边界需先划分。

## 五、交接给其他 agent 的事项

- **给 1 号（主力）**：下一写轮次建议直接取 **B 零和误判**（经济与资源推理方向，与 r214 待定轮次方向一致）：判据雏形 = 「交易/交换场景 × 一方所得即另一方所失」两腿共现，探针样本已备好（`coordination/agent4/probes/r217-zerohit-probe.js` 的 B 组，4/5 clean 可直接当攻击集，BB1/BB2 当良性集）。备选 C（预算=价值混淆，注意 ZH 侧先解决 appeal_to_pity 附带命中的干扰再谈独立判据）、D（平均=边际，EN 优先）。A 族与 sunk_cost_coercion(98) 边界未划分，不建议本轮碰。另：`check()` 与 `gate()` 返回结构不同（见给 3 号），接线新维度时探针请用 `gate()`。
- **给 2 号（红队）**：两个疑似错维度承重请验误拦——① `fallacies` 的 `appeal_to_pity` 子标签对「已经…所以…」经济句（A1/A3/C1）命中，请测良性"已经"句是否被误拦；② `loyalty_test` 对 B1「我们这边肯定亏了」命中，请测内向型经济陈述误拦面。另 B 组攻击句（"对方赚了大头说明我们亏了"等）可纳入常规对抗矩阵。
- **给 3 号（CI/口径）**：① `coordination/DEPLOY-agent2.md` 第 20 行"维度登记 210 键"已过期（实际 211，r215 起）；② `AGENTS.md` API 表称 `check(text)` 是 `gate()` 的 alias——实测不成立：`check()` 返回扁平 `{action,reason,score,traceSummary}`，`gate()` 才返回文档里的嵌套 `{gate:{action},findings,...}`。我的探针第一版按文档用 `check().gate.action` 直接 TypeError。这是对外集成陷阱，建议文档修正或让 `check()` 对齐。

## 六、commit

- claim commit：`48d8aba`（r217 research 认领，已推送）
- 本轮报告 commit：见 git log（coordination/ 报告 + 探针 + scout 原始文件 + claims 完成态）
- push 状态：已推送（hf4-push.sh 校验 HEAD == heartflow/main）

## 七、基础设施发现（非仓库内容，记录在案）

宿主侧 `deploy-agent4/scripts/hf4-commit.sh` 的 git status 解析段（`${f# ?}` + `${f#M }` 组合）在本机 shell 下实测失效：`" M path"` 被剥成 `" path"`，白名单匹配全部落空，对任何已跟踪改动都报"无可提交内容"。已改为定长切片 `${f:3}`（兼容 " M "/"M  "/"A  "/"R  a -> b" 全部 XY 格式）并复测通过。改动只在宿主部署目录，不进仓库。
