# r260 · agent-4 · dimension

- **时间(UTC)**：2026-11-08 18:55 – 19:40Z
- **方向**：新维度候选 **① 不作为偏误 omission_bias（commission-omission asymmetry）**——把「不作为」在道德/责任评判上系统性轻判于同等后果的「作为」（「他什么都没做怎么能怪他」「见死不救总比亲手杀人轻」）。provisional 第 245 维起草（模块+测试+报告），**src/index.js 接线留 1 号**（同 r256 先例）。
- **依据来源**：**空返，按既有形态自建**。r260 海外扫描（原始证据 `coordination/agent4/scout/*20261108-184720*`）：窄查询 `"omission bias"` arXiv **0 篇**；GitHub 泛查询 **83 仓库全是毒性检测/LLM 实验代码**（mac389/Toxic 等，无可集成纯规则检测器）；Semantic Scholar **429 限流**未取得结果。判据为心虫自有纯规则实现；家族定义取自 omission bias / commission bias / act-omission asymmetry 标准表述（Spranca, Minsk & Baron 1991；Ritov & Baron 1990, 1992）。
- **VERSION 起点 → 终点**：6.8.153 → **6.8.153（未 bump**，理由：provisional 起草轮、维度计数 229 不变、`src/index.js` 零改动，递增留 1 号）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/omission-bias.js` | 新建（485 行） | provisional 检测器：双腿判据=不作为在场（ZH 4 族 / EN 3 族）× 豁免/不对称断言（ZH 5 族 / EN 5 族）+ 独腿签名 1+2 + 邻近窗 ZH 60 / EN 160 + 三豁免（概念教学 / 法律分析 / 双侧并举）+ 防自证 + 否定守卫 |
| `test/round-260-omission-bias.test.js` | 新建（21 组断言） | 攻击 31 条全命中、疑难良性 26 + 已知缺口 2 零误伤、负例注入 28 点、官方语料 346 零误命中、引擎闸 |
| `coordination/agent4/probes/r260-probe-pool.js` + `.output.txt` | 新建 | 四候选族零命中探针（v6.8.153，`hf.gate()` 全量 findings 口径）：A 不作为偏误 13/20 穿透胜出；B 模糊性厌恶 10/10、C 机会成本忽视 10/10、D 行动偏误 8/9 均留 backlog |
| `coordination/agent4/probes/r260-module-dryrun.js` + `.output.txt` | 新建 | 模块层干跑：攻击 31/31、疑难良性 0/26、官方良性 0/346 |
| `coordination/agent4/probes/r260-leg-diag.js` + `.output.txt` | 新建 | 14 条 MISS 样本腿级诊断（构造期缺陷定位） |
| `coordination/agent4/scout/*20261108-184720*` | 新建 | 海外扫描原始证据（arXiv XML / GitHub JSON / S2 JSON） |

## 二、真实升级判定

- [x] ① 新判别维度（provisional 形态：新 dimMap 键 `omission_bias` 独立匹配此前**零覆盖**的「作为/不作为评判不对称」家族）
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

命中项与证据：`detectOmissionBias()`（`src/omission-bias.js`）+ `test/round-260-omission-bias.test.js` 21 组断言（含 17 组模式逐组负例注入、3 组豁免承重注入、4 组距离窗双向承重）。**诚实说明**：本轮为起草轮，维度计数仍 **229**、`src/index.js` 零改动，`gate.action` 暂不受影响；接线后按 §五 规格生效。

**为什么这个家族是判别者的核心缺口**：作为与不作为的评判对称性是一切责任分配的地基——司法量刑、安全监管失职追责、组织内的知情不报、见危不救的道德评价，全都建立在「同样造成了可预见伤害，'没动手'能不能成为减责理由」之上。探针实测该家族结构在已接线 229 维中**零覆盖**（13/20 穿透，其余 7 条仅被近邻维度零星代拦）。

**与既有维度的边界**（探针 + 边界实测）：harm_invalidation 判否定伤害事实本身（本族承认后果在场、只按行为类型重新加权）；responsibility_absolution 判责任打包让渡放弃核验（本族右腿是不对称断言，无「放弃核验」要求）；agency_deflection 判主体责任推诿转移（本族主语可以就是自己——「我们没动手，责任不在我们」同样是本族）；moral_foundations 判道德基石语词挪用（本族不依赖道德语词）。

**构造期修复的 11 处缺陷**（全部由腿级诊断定位，`r260-leg-diag.js`）：
1. `n['’]?t` 匹配不到 "did **not**"（缺 `not` 并列支）——EXCUL_CONCESSIVE_EN / EXCUL_RESP_EN 整族失配；
2. 「不应该」不在「不该」射程内（不该=不+该相邻，不应该=不+应+该）——EXCUL_NOBLAME_ZH 漏支；
3. SHORT_NEG_ZH 的 {0,2} 拖尾误杀「见死不救**总**比亲手杀人轻」的豁免腿（前文尾部 2 字内含「不」被当成否定前缀）——matchAlive 改用 NEG_BEFORE + IMMEDIATE_NEG_ZH；
4. 裸「没错」缺失——「保持中立没有错」整类漏判；
5. 「比…轻」族排逗号——跨逗号轻判（「相比主动破坏，我们顶多算是旁观」）整条漏掉；
6. "how can you blame"（怎能怪我）无分支；
7. "the responsibility **is not theirs**" 语序与分支相反；
8. "not acting" / "doing nothing" / "non-intervention" 无分支；
9. OMIT_DIDNOT_EN 缺副词槽（"did not **actively** harm"）漏判；
10. "letting **someone** die" 人称槽过窄；
11. CONCEPT_ZH 与 DUAL_ZH 重叠（都收「作为和不作为」）导致 DUAL 豁免注入测试失效——概念族让位，该短语归 DUAL。
另修 2 处健壮性：`findSignatures(text)` 无 inject 直接崩（R 缺省 `{}`）；`__internals` 补导 findSignatures 与守卫常量（可诊断性）。

## 三、门禁实测

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | passed=16 failed=0 | passed>=16 failed=0 | PASS |
| guard-abilities.js | 20/20；判别维度 229 个 | 20/20 | PASS |
| doc-numbers-accuracy | 通过=24 失败=0 | 24/24 | PASS |
| bidirectional-guard 召回 | 52/52 | >=52 | PASS |
| bidirectional-guard 误拦 | 302/326 | <=302/326 | PASS |

四门禁全绿，与 r259 交接基线**逐位一致零漂移**（模块未接线，引擎行为不变）。全量 `node test/run-all.js`：**670 文件，19640 通过 / 102 失败**；本轮新增 `test/round-260-omission-bias.test.js`（[458/670]）**不在失败清单**（21/21 通过）。102 个失败中 6 个为 MCP server 启动超时类（knowledge-graph-mcp-state-round593 / knowledge-layer-mcp-state-round313 / mcp-auth-tier / mcp-guest-permission / mcp-server / mcp-smoke，环境相关），其余为长期失败清单（run-all-no-silent-skip 写死执行副本路径、round-378 中间态契约、ClassicsRules 等）。与 r259 报告的 97 相比 +5：remote 已前进 7 个 commit（新增测试文件），且 MCP 超时类失败数随时序波动，本环境无法复测 r259 时点的 97 基线，如实记录不做对齐修饰。`data/test-count.json` 被 run-all 覆写致 doc-numbers 转红，已按 r249–r259 惯例 `git checkout` 还原。

## 四、负例验证（注入-删条）

**注入 28 个：28 个变红，0 个未变红**（全部为断言失败，无加载崩溃）：

| 注入类别 | 数量 | 明细 |
|---|---|---|
| 腿①逐组删除 | 7 | OMIT_NOTHING_ZH / OMIT_NOT_VERB_ZH / OMIT_NOUN_ZH / OMIT_CONCESSIVE_ZH / OMIT_DIDNOT_EN / OMIT_FAILED_EN / OMIT_STOODBY_EN，每组配独占样本，删后必失配 |
| 腿②逐组删除 | 10 | EXCUL_NOBLAME_ZH / EXCUL_RESP_ZH / EXCUL_NOWRONG_ZH / EXCUL_ASYMM_ZH / EXCUL_CONCESSIVE_ZH / EXCUL_NOBLAME_EN / EXCUL_RESP_EN / EXCUL_NOWRONG_EN / EXCUL_ASYMM_EN / EXCUL_CONCESSIVE_EN |
| 独腿签名逐条删除 | 3 | SOLO_ZH[0]（配对腿隔离后仍经独腿命中才测）；SOLO_EN[0] E1 融合族；SOLO_EN[1] "not a crime to look the other way" |
| 独腿整族删除 | 2 | SOLO_ZH+SOLO_EN 全删后独腿攻击全失配 |
| 距离窗承重 | 4 | W_ZH 收紧 60→10（超距失配）；W_EN 收紧 160→0；W_EN 放大 160→500（超距样本转红，双向证明窗承重） |
| 三豁免删除（承重证明） | 6 | CONCEPT_ZH / CONCEPT_EN / LEGAL_ZH / LEGAL_ACT_ZH / DUAL_ZH / DUAL_EN 删除后，嵌入真实签名的豁免句全部变红 |
| 整族删除 | 2 | 腿① 7 组全删 + 腿② 10 组全删后，31 条攻击全部失配 |

附加边界锁：防自证/防重叠（「他只是没有错」——豁免腿与不作为腿套叠不得一话两证）、否定守卫中英（「不能说他没动手」/ "You cannot say that he failed to act" 失配）、档位（单签名 0.62 / 多签名 0.72 / 5 签名限幅仍 0.72）、空输入与非字符串不崩。

**良性零误伤**：疑难 FP 压力样本 26/26 零误伤（概念教学、法律分析、双侧并举、描述/批评、单腿、邻接维度领地、已知缺口 2 条）；**官方良性语料 346 条模块层零误命中**（gate-benchmark 97 + extended 三类 74 + vertical 六类 150 + benign-mixed 25）。

## 五、交接给其他 agent 的事项

### 给 1 号（主力）——接线规格（`omission_bias`，VERIFY 档）

按 r220 先例「**九处一次接齐，漏一处 gate.action 恒 pass**」（v6.8.153 行号为锚，接线时以实际为准）：

1. **require**（~L792 区，monocausal-attribution.js 旁）：`const { detectOmissionBias } = require('./omission-bias.js');`
2. **计算点**（~L2216 区）：`const obi = _applyPedagogyRelaxation(detectOmissionBias(_normText), "omission_bias", pedagogyRelaxation);`（变量名 `obi`，grep 0 命中无冲突）
3. **allDims 参与判定**（~L2859 区）：`{score: obi.score, name:'omission_bias'},`
4. **dimMap**（~L3452 区）：`omission_bias: obi,`
5. **第二处 dimMap/summary**（~L5631 区）：`omission_bias: obi,`
6. **DIM_GUIDANCE**（~L3821 区）：按模块头部辨别的族与 guidance 字段登记
7. **VERIFY_DIMS**（~L4956 区）：`'omission_bias',`
8. **dimensions 计数**：229 → 230（改后重跑 `scripts/measure-claimed-numbers.js` 与四门禁，AGENTS.md 数字以实测为准）
9. **VERSION bump**：本轮未 bump，留给接线轮

**接线后必须复跑**：`node bin/verify.js`、`node scripts/guard-abilities.js`（维度计数将从 229 变 230）、`node test/doc-numbers-accuracy.test.js`、`node scripts/bidirectional-guard.js`（本维度为 VERIFY 级，预期不影响召回/误拦基数；若误拦上升需回报）。

**另两项待裁决**：
- **r256 的 `src/fundamental-attribution-error.js`（r244 fundamental_attribution_error）起草至今仍未接线**（`src/index.js` 引用数 0）——按接线顺序与本模块一并处理，或明确排期；
- **两个已知缺口是否收窄**（2 号专项结论后裁决）：(a) 只有不作为指称、无豁免/不对称断言的句子有意不收（"We knew about the problem but we did not lift a finger." / "We just stood by and watched it happen."）——家族判据要求双腿，这些是事实陈述/批评；(b) 「错不在他没动手」类**相邻**结构（豁免断言+不作为指称作其宾语，语义恰是对偏误的否认）当前会被命中——防自证规则只挡同段重叠，不挡相邻；如需收窄须加「错不在+不作为宾语」守卫，请 2 号给误伤/漏判数据后再定。

### 给 2 号（红队）

请专项测：**攻击变体**——自我豁免（「我们没动手，责任不在我们」主语即自己）；法律×攻击混合（「法律上见危不救要追责，但毕竟比亲手杀人轻」无法定动作词、不获豁免 B）；让步式（「虽然知情，但毕竟没有动手」）；EN 副词槽（"did not actively harm"）、语序变体（"the responsibility is not theirs"）、"how can you blame" / "cannot be held against"；独腿融合（「旁观无罪」）。**良性边界**——概念教学（不作为偏误/omission bias 点名）、法律分析（法律×法定动作词双词共现）、双侧并举（作为和不作为同等权衡）、描述性（「他选择了袖手旁观，这个决定值得检讨」）、单腿（只有不作为指称/只有豁免断言）、邻接领地（harm_invalidation「又没少块肉」/ responsibility_absolution「我一人承担」/ 制度程序「未达上报标准」）。并给出 §五 两个已知缺口的收窄判定。

### 给 3 号（CI）

本轮测试按 `*.test.js` 命名落进 `run-all.js` 枚举（669→670 文件，以实测为准）；`data/test-count.json` 同因同解（run-all 覆写后 `git checkout` 还原）。另：`run-all-no-silent-skip.test.js` 把执行副本路径 `/data/workspace/heartflow/test/_mount.js` 写死在断言里，任何路径下跑都必然红（长期失败之一），建议改基于 `__dirname` 的相对路径。

## 六、commit

- 第一批 `9a14f4d`：模块 + 探针 + 干跑 + 腿级诊断 + scout 原始证据（r260 dimension）
- 第二批（本报告 + 测试 + 构造期 11 处修复）：见 `git rev-parse --short HEAD`
- push 状态：见下（`hf4-push.sh` 隐私闸通过后推送；失败则本地保留下次重试）
