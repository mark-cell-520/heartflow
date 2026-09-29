# 第 218 轮（v6.7.124 工作面，unattended 自主升级）

**方向**：decision 引擎四候选真调裁决 **A**（composite_score 0.88）——
修 `decisionRouter.evaluate` 恒崩 `activeRules is not defined`；
同轮连带修 **B**（self-verifier 恒崩 `reasoning.toLowerCase is not a function`），
两者都是 217 轮交接簿点名的「预先存在问题 1」，本轮用探针坐实为
**可修、影响面可量化**的真缺口。裁决口径照
`scripts/round-218/decide-r218-scores.js`（四维分值显式同行写）。

**立项量化（两个探针复跑，不信简报旧描述）**：

1. `scripts/round-218/probe-r218-activeRules.js`：3/3 输入全抛
   `activeRules is not defined`。
2. `scripts/round-218/probe-r218-ced-branch.js`：CED 分支从未进入，
   `_lastCedStrategy` 恒 null —— domain filtering(v6.7.70) 与
   CED complexity routing(v6.7.72) 两套新能力 **0 次执行**。
3. `scripts/round-218/probe-r218-call-count.js`：真实 think() 链路
   `evaluateCalls=1, evaluateErrors=1` —— 崩在真实调用路径上，
   不是只崩在探针构造的玩具输入。
4. `scripts/round-218/probe-r218-blast-radius.js`：2 次 think() 触发
   evaluate 抛 2 次、verify 抛 2 次，全部 0 成功；
   `test/decision-router.test.js` 只写 `doesNotThrow(() => try{...}catch{})`
   —— **把崩溃当预期**，0 断言覆盖规则匹配。
   所以「测试全绿」与「功能全崩」长期并存，这就是它活到本轮的原因。
5. `scripts/round-218/probe-r218-selfverifier.js`：verify 的 reasoning
   入参实测 `typeof object`（非数组）。`probe-r218-chain-shape.js`
   坐实 chain 是 `{stages:[...7 stage...], totalDuration, depth,
   taskType, errors}`，只有 SYNTHESIS stage 的 result 才有
   reasoningChain/conclusion 字符串字段。
   原 `heartflow.js` 把整个 chain 对象传给
   `self-verifier.verify()` → 四个 check 都对它调
   `toLowerCase/includes/test` → 每次必抛 `reasoning.toLowerCase
   is not a function`，`result._selfVerification` 字段从不落地。

**改动（三个 commit）**：

| # | 文件 | 内容 |
|---|---|---|
| 1 | `src/core/decision-router.js` | 补 `const activeRules`（+10 行注释+1 行代码） |
| 2 | `src/core/heartflow.js` | SelfVerifier 入口 reasoning 归一化（+31 行） |
| 3 | `test/decision-router-selfverifier-r218.test.js` | 26 断言正式回归防线 |

**commit 1：activeRules 局部变量**。`9f1093ab`（2026-09-18 引入 CED）时
漏了变量转换：旧代码是 `const activeRules = this._activeRulesForEval ||
this._rules; for (const rule of activeRules)`，改成
`this._activeRulesForEval` 后就没人再定义这个局部名，而 CED 分支与 else
分支仍在引用它。补一行 `const activeRules = this._activeRulesForEval ||
this._rules;`（语义等价、保留两级回退）。
修复后实测（`probe-r218-postfix.js`）：复杂输入
`activateRatio=1` 全量 38 条规则，moderate 输入 `0.6` 过滤到 19/20 条，
`matched` / `decision.type` 可读，`_lastCedStrategy.mode` 有值。

**commit 2：SelfVerifier 入口归一化**。新增 `_r218ToText` 递归归一化
（depth 2 封顶、优先取 reasoningChain/conclusion/text/summary/inverted
字符串字段、非字符串收敛为 ''），reasoning 取 SYNTHESIS stage 优先、
回退 stage name 串 / JSON 摘要；conclusion 改为按 `typeof === 'string'`
取值（原 `||` 链会把非字符串值透传下去）。
修复后实测（`probe-r218-selfverifier-postfix.js`）：2 次 think() 全成功，
`_selfVerification` 落地，`passed=false / checks 四字段全布尔 /
issues=["未考虑替代推理路径"] / confidence=0.75`，
optional 层 initErrors 归零（原恒有 2 条）。

**commit 3：正式回归防线**。`test/decision-router-selfverifier-r218.test.js`
26 断言，文件形态照 217 轮 `reflection-loop-wiring.test.js`（单个 async
IIFE + 汇总行 + process.exit），断言判据**查内容不查布尔**：
`_selfVerification` 断 passed/checks/issues/confidence 四字段，
evaluate 断 matched/decision/规则数三维度 + CED 分支真走进。

| 项 | 结果 |
|---|---|
| bin/verify | **14/14** |
| 双向门禁 | 召回 **52/52**、误拦 **301/326（0 新增）** |
| run-all | 见下（测试汇总行格式回归，第二轮复跑确认） |
| security-audit | **16/16** |
| doc-numbers | **15/15** |
| 本轮守卫 | **5/5**（M0/M1/M2/M3/M9）+ **3/3**（M0/M6/M9） |
| 正式测试 | `decision-router-selfverifier-r218.test.js` **26/26** |

**踩坑（两轮才收敛，都是结构性的）**：

1. **测试文件汇总行必须与 `test/run-all.js:127` 的正则同构**。
   我用语序「N 个，通过 N，失败 N」→ run-all 的
   `/(\d+) 通过, (\d+) 失败/` 匹配不到 → 整文件被判
   「未输出结果行」计 1 失败（第一轮 run-all 7446/1，全部断言其实是绿的）。
   改成 run-all 自家用的「N 通过, M 失败, 共 N 个」后恢复。
   **教训：测试明明全绿却计入失败清单时，先查汇总行语序，不要先怀疑断言。**
2. **IIFE async 段不执行**。首版测试文件把顶层同步断言写在 if(runEngine)
   之前、把 async IIFE 放在里面，结果 5 个 ✓ 之后进程直接
   `BEFORE_EXIT code=0` —— IIFE 从未被构造执行（诊断到第 23 轮才用
   `console.log hook` 确认：5 个 ✓ 之后无任何 IIFE 打点）。
   改用 217 轮同款「单个 async IIFE 包住全部」后一次通过。
   **教训：新测试文件不要发明结构，直接照一个 run-all 实测能跑的同形态文件抄。**

**守卫纪律（照 216/217 轮教训自查）**：两个 negative test 共 8 个红/绿
用例，**剔除 2 个无效变异**并记档：
- M4（conclusion 回滚 `||` 链）在实测数据下同样产出字符串（
  `result.output.conclusion` 本身就是 string），等价路径，不是 bug 形态；
- M5（stages 判断永假）走 else 分支的 analysis.reasoning 回退也能
  产出非空字符串，字段照常落地，同样等价。
照「变异必须回到原 bug 形态」纪律不留假红。留下的 M1（删 const
activeRules → 4 断言红）、M2（归一化整段回滚 → 1 红）、M3（删赋值段 → 1 红）、
M6（_r218ToText 原样返回即对象直达 verify → 2 红）全部真红。

## 遗留（给下一轮）

1. **`_selfVerification` 目前仍无人消费**。本轮只让它**跑通并落地**，
   但四个 check 结果（`passed=false / issues=["未考虑替代推理路径"]`）
   还没有任何下游读取它做判定。修好之后第一步应该是接线到
   gate/改写链路，与 217 轮遗留 2（`_reflectionLoopClosed` 无消费者）
   同型。两个字段可以一起设计消费语义。
2. **`checkKnowledgeBoundary` / 门禁的测试覆盖问题**：
   `test/decision-router.test.js` 的「null 输入不崩溃」用
   `assert.doesNotThrow(() => { try{...}catch{} })` 把崩溃当天预期。
   这类「用 try/catch 包住的 doesNotThrow」测试在其他文件可能还有，
   建议下一轮扫一遍（grep `doesNotThrow(() => { try`）。
3. **reflection-loop 产出无消费者**（217 轮遗留 2，仍成立）。
4. **仓库零引用模块 369 个**（216 轮口径 + 217 轮「引用了但只用到一半」
   新分类）。候选：`src/workflow/thought-chain.js`（1457 行）、
   `src/memory/triality-memory.js`（1670 行）。
5. **71+ 历史探针文件未跟踪**（scripts/round-154/ 至 round-217/），
   同第 212-216 轮记录，仍记档不排期。
6. **run-all 的 90s CHILD_TIMEOUT**：本轮实测全部测试 4 分多钟跑完，
   单文件最长的 r218（含引擎链路）约 10-20s，无超时风险；
   但 `decision-router-selfverifier-r218.test.js` 这种含 start()+think()
   的测试如果未来加重（多轮 think）可能逼近上限，届时按简报纪律拆 seam。

**给下一轮的接手说明**：先跑
`node test/decision-router-selfverifier-r218.test.js`（应 26/26）与
`node scripts/round-218/probe-r218-postfix.js`（CED 分支应真的进入）。
若要继续本轮方向的「后半段」，优先做遗留 1：让 `_selfVerification` 的
check 结果真正影响判定——那是把「跑通」变成「有用」的关键一步，
与 reflection-loop 消费可合并设计。
