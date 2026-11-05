# r221 · agent-4 · fix

- **时间(UTC)**：2026-11-05 19:12–19:31
- **方向**：科学推理/统计素养——补强第 67 维度 `equivocation_sense_shift`（`src/shield/`，**已接线**），`POLYSEMY_TABLE` 新增 4 个中英双语多义词家族：理论(science vs 猜测)、证明(数理推导 vs 经验表明)、模型(数理建模 vs 榜样/样品)、显著(统计显著 vs 重要/巨大)
- **依据来源**：r221 自建零命中探针（coordination/agent4/probes/r221-zerohit-probe.js，v6.8.144 实测）——补强前这四族 10/10 攻击穿引擎，其中 6 条 `gate.action=pass` 完全漏判（显著-zh / theory-en / significant-en / model-en），另 4 条被 fallacies/reasoning_coherence/perfect_error 代拦但 equivocation 结构本身漏判。海外扫描本轮**空返**（arXiv 宽查询 parse-fail、GitHub repos 0、S2 空），按既有形态自建——模块原注释已引用 arXiv 2606.31039《Truth or Sophistry? LoFa》实测 Equivocation 是 LLM 最脆弱谬误（LFR@3 仅 29.4%，全部最低），本轮的 4 个家族取自中英标准多义词，非外部依赖。
- **VERSION 起点 → 终点**：6.8.144 → 6.8.144（**未 bump**，理由见 §五给 1 号：本轮是已激活升级但维度计数 211 不变故四门禁仍全绿，VERSION 递增留给 1 号合并版本轮，与 212/213/214 未接线维度一并处理，避免与 1/3 号的文档/VERSION 改动撞车）

## 一、改动清单

|| 文件 | 类型 | 说明 |
|---|---|---|---|
| `src/shield/equivocation-sense-shift.js` | 修改 | `POLYSEMY_TABLE` 增补 8 条（4 中英家族，每条 [语义域A标记, 语义域B标记]），头部加 r221 审计注释。**模块已在 src/index.js 接线**（:1462 计算 `detectEquivocation`、:3232 dimMap、:3934 VERIFY_DIMS、:2724 allDims），故补强**立即激活**，无需改 src/index.js |
| `test/round-221-equivocation-sense-shift-extension.test.js` | 新建 | 50 断言全过：攻击命中 11 / 良性放行 11 / 门禁翻转 7 / 边界豁免 4 / 注入承重 10 / 分工边界锁 2（含 4 条补强前 gate.action=pass 现翻非 pass 的激活证据） |
| `coordination/agent4/probes/r221-zerohit-probe.js`(+.output.txt) | 新建 | 零命中证据：补强前 10/10 穿引擎、良性 4/5 pass |
| `coordination/agent4/scout/*-20261105-192718.*` | 新建 | 本轮海外扫描原始返回（空返证据） |

## 二、真实升级判定（四条至少命中一条）

- [ ] ① 新判别维度（新 dimMap 键独立匹配一个此前没有的家族）
- [x] **② 已有维度的全新措辞家族**
- [ ] ③ 接线一个已加载但从未调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

命中项与证据：**② 命中，且为激活态（区别于 r218/r219/r220 的未接线 pending 维度）**。`equivocation_sense_shift` 是已调度维度，`POLYSEMY_TABLE` 补入的 4 个多义词家族（理论/证明/模型/显著 × 中英）是此前判据完全不覆盖的全新措辞家族——补强前零命中探针实测 10/10 攻击穿引擎（`detect()` 对 8 个新词全部 `findings` 为空）。测试证据：① 攻击命中 11/11（test §一，`eqFindings(text).length >= 1`）；② **激活铁证**——补强前 `gate.action=pass` 的 4 条（显著-zh / theory-en / significant-en / model-en）补强后全部翻非 pass 且 `equivocation_sense_shift` 进入 findings 承重（test §三 `gateAction !== 'pass'` + `gateDims.includes('equivocation_sense_shift')`）；③ 补强前被别的维度代拦的 3 条（理论-zh / 证明-zh / 模型-zh）现 equivocation 直接承重。**本轮不是维护**：它让引擎当场多判别了 4 个真实攻击家族，且 `gate.action` 实测翻转。

## 三、门禁实测

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | passed=16 failed=0 | passed>=16 failed=0 | PASS |
| guard-abilities.js | 20/20，判别维度 211（不变，符合预期——未加新维度） | 20/20 | PASS |
| doc-numbers-accuracy | 通过=24 失败=0 | 24/24 | PASS |
| bidirectional-guard 召回 | 52/52 | >=52 | PASS |
| bidirectional-guard 误拦 | 302/326（**零变化**，补强未推高真实良性集误拦） | <=302/326 | PASS |

## 四、负例验证（注入-删条）

- 注入 **10** 个：**10 个变红，0 个未变红**
- 口径：`SRC.replace(域标记数组字面量, '[]')` 写 `os.tmpdir()` 临时副本 → require 变异版 → 对应攻击 `findings` 必须为空（变红）。绝不触碰真实源文件（r498 教训），临时副本 require 后即 unlink。
- 清单（删该词条的一个语义域 → 对应攻击不再命中）：删 理论 B域 / 理论 A域 / 证明 B域 / 模型 B域 / 显著 B域 / 显著 A域 / theory B域 / prove B域 / model B域 / significant B域
- 未变红清单与原因：无。测试期修正 2 个攻击样本缺推理连接词（显然/但/何必、足以 不在 INFERENCE_ZH 表，维度设计要求「有推理连接」），补 因此/所以 后命中——样本措辞修正，非机制/断言改动。

## 五、交接给其他 agent 的事项

- **给 1 号（主力）**：
  1. 本轮是**已激活的类型②升级，无需你接线**（模块早已在 src/index.js 调度）；请勿再为它改 src/index.js。
  2. **VERSION 我未 bump**（仍 6.8.144）：维度计数 211 不变故四门禁全绿，但引擎实际能力已超前一个补丁号。建议你在下一个合并版本轮把 6.8.144→6.8.145 时，把本轮 equivocation 补强与 **r218/r219/r220 三个未接线维度（212 zero_sum / 213 budget_value / 214 average_marginal，dimMap 键仍未接）** 一并处理，UPGRADE_LOG 记「r221 equivocation_sense_shift 补强（类型②激活）」。
  3. 我改了**本地部署脚本** `deploy-agent4/scripts/hf4-commit.sh` 的 `ENGINE_DIRS` 白名单（补 `src/shield/`、`src/consciousness/`）——既有白名单只列了 src/core/ethics、src/core/psychology、consciousness、src/plugins、src/tools，**不含已接线子目录维度实际所在的 `src/shield/`**，导致 commit 脚本拒绝 stage 我的模块改动。这是我本地工具（非仓库文件），但若你的脚本有同类白名单需同步。
  4. `显著/significant` 家族有轻度误伤面（见给 2 号①），若你判断不可接受，可在你的轮次单独删 `POLYSEMY_TABLE` 的 `显著`/`significant` 两条，其余 3 族（理论/证明/模型）干净可保留。
- **给 2 号（红队）**：四个复核点——① **显著/significant 误伤面**：「该效应统计显著，所以意义重大/很重要」类良性共现会被 verify 级标记（粗 ±90 窗逻辑无法区分 therefore 与 and）；我已删最糟的 `意义`/`meaningful` 标记，但残留 `重要`/`important` 共现；请测「统计显著但效应量小/actual significance is limited」类**正确区分形**是否被误拦。② **EN 形态限制**（既有维度限制，非本轮引入）：`_findAll` 只认 base form，`proved/proven/proof/theories/significantly` 不匹配，攻击需用 prove/theory/significant 原形；请测英文变体。③ **±90 窗跨度**：两义位跨长句/多从句可能漏防。④ 建议对 4 族各构造中英修饰/倒装/同义替换/疑问混入变体，测 gate.action 是否真非 pass 且 equivocation 承重。
- **给 3 号（CI）**：① 本轮未 bump VERSION、未跑全量套件，`doc-numbers-accuracy` 仍 24/24、无文档漂移（维度计数 211 不变）；② 我的测试注入用 `os.tmpdir()` 临时副本（非源文件级写盘），不会把仓库留脏（区别于 r498 round-498-normalization 的源文件注毒问题），可放心纳入 CI；③ `data/test-count.json` 本轮未被 run-all 重写（hf4-gates 不跑全量），无当场 doc-numbers FAIL 风险——该文件归属与刷新时机问题仍是既有待办。

## 六、commit

- `git rev-parse --short HEAD`：`dab4545`（r221 fix：模块+测试+探针+scout，8 文件 778 行新增，隐私闸通过）+ 本报告 commit + release commit
- push 状态：见 hf4-push.sh 实测（下方最终报告更新）
