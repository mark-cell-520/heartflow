# r239 · agent-4 · dimension

- **时间(UTC)**：2026-11-07 02:53Z 快照 → 03:5xZ 完推
- **方向**：统计素养/概率推理五候选探针零命中定夺（A 检察官谬误/条件概率换位、B 多重比较忽视/数据挖掘、C 控制幻觉、D 样本量不敏感、E 规划谬误重探）
- **依据来源**：空返，按既有形态自建。r239 海外扫描（原始证据 `coordination/agent4/scout/*20261107-0256{10,22}*`）：arXiv 两次 OR 噪声查询均 parse-fail、GitHub 两次 0 命中、Semantic Scholar 两次 429 限流。判据为心虫自有纯规则实现（家族定义取自认知心理学标准描述：illusion of control / 控制幻觉——Langer 1975：人们系统性地高估自己对概率性事件的影响力，把技巧、投入、仪式、竞争等本不适用的控制线索误用到纯随机事件上）
- **VERSION 起点 → 终点**：6.8.145 → 6.8.145（未 bump，模块未接线、维度计数 214 不变，递增留 1 号）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/illusion-of-control.js` | 新建 398 行，未接线 | 控制幻觉维度（provisional 227），三腿共现判据 |
| `test/illusion-of-control.test.js` | 新建，11 断言组全过 | 攻击 15/15、良性 25/25、豁免 2/2、边界 10/10、负例注入 9 点 |
| `coordination/agent4/probes/r239-zerohit-probe.js` | 探针 | 五候选零命中一轮（gate() 全 findings） |
| `coordination/agent4/probes/r239-probe-round2-illusion-of-control.js` | 探针 | C 族扩充二轮（13 攻击变体 + 15 疑难良性 + 5 边界域） |
| `coordination/agent4/probes/r239-module-dryrun.js` | 探针 | 模块干跑（攻击/良性/边界/豁免/注入全量） |
| `coordination/agent4/probes/r239-debug.js` | 探针 | 两缺陷腿匹配诊断 |
| `coordination/agent4/probes/r239-benign-corpus-check.js` | 探针 | 官方 326 良性语料模块级误命中核查 |
| `coordination/agent4/scout/*20261107-0256*` | 扫描证据 | arXiv/GitHub/S2 各两次原始返回 |

## 二、真实升级判定

- [x] ① 新判别维度（新 dimMap 键 `illusion_of_control`，独立匹配「纯随机事件 × 主观控制行为 × 影响断言」三腿共现家族，引擎 214 维无此族）
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

命中项与证据：`detectIllusionOfControl(text, inject)`（src/illusion-of-control.js）；测试断言 `攻击命中：中文 8 条 / 英文 7 条` + `负例注入：六组三腿族删除后攻击全部不再命中`（test/illusion-of-control.test.js）。零命中实证：r239-zerohit-probe.js 一轮 C 族 6/6 穿透 + 4/4 良性零纠缠；r239-probe-round2 二轮 C 族 10/13 穿透（余 3 条被 wishful_thinking/survivorship_bias/perfect_error 泛维度偶发代拦，非本族专用维度）+ 15/15 疑难良性零误伤。五候选定夺：A 检察官谬误 4/6 穿透且 `src/conditional-transposition.js`（r228 草稿）已占同族；B 多重比较 4/6 穿透且 `src/p-hacking.js`（r232 草稿）已占同族（B1 被已接线的 researcher_degrees_of_freedom 代拦）；C 控制幻觉全穿透 + 良性零纠缠双干净胜出；D 样本量不敏感 4/6 穿透（余 2 条 fallacies/perfect_error 代拦）；E 规划谬误 5/6 穿透但疑难良性 2/4 被 perfect_error 误伤（r234 同病否弃）。

## 三、门禁实测

```
node bin/verify.js                  → passed=16 failed=0
node scripts/guard-abilities.js     → 能力检查 20/20 全通过；判别维度 214 个
node test/doc-numbers-accuracy.test.js → 通过=24 失败=0
node scripts/bidirectional-guard.js → 召回=52/52 误拦=301/326
```

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | 16/16 | passed>=16 failed=0 | PASS |
| guard-abilities.js | 20/20，维度 214 | 20/20 | PASS |
| doc-numbers-accuracy | 24/24 | 24/24 | PASS |
| bidirectional-guard 召回 | 52/52 | >=52 | PASS |
| bidirectional-guard 误拦 | 301/326 | <=302/326 | PASS |

四门禁与 r238 基线逐位一致，零漂移。全量 run-all（后台跑完，642 文件）：**19369 通过 / 97 失败 / 共 19466** —— 较 r238 基线 19358/97/19455 恰好 **+11**（本模块 11 断言组）、失败 97 逐位不变、零新增；失败集中于 MCP 超时/dispatch 环境抖动族（与 r234-r238 同型）。data/test-count.json 未动（文档基线 12911/108 不变）。

## 四、负例验证（注入-删条）

注入 9 个点：**9 个全部按预期**。

1. 删 A_ZH（随机事件锚点）→ ATTACKS_ZH[0] 不再命中 ✓
2. 删 B_ZH（主观控制行为）→ ATTACKS_ZH[0] 不再命中 ✓
3. 删 C_ZH（影响断言）→ ATTACKS_ZH[0] 不再命中 ✓
4. 删 A_EN → ATTACKS_EN[0] 不再命中 ✓
5. 删 B_EN → ATTACKS_EN[0] 不再命中 ✓
6. 删 C_EN → ATTACKS_EN[0] 不再命中 ✓
7. 删 CONCEPT_ZH（概念讨论豁免）→ 豁免句变红 ✓
8. 删 CONCEPT_EN → 豁免句变红 ✓
9. 距离窗 PAIR_ZH 放大到 500 → 长距句命中（默认 60 窗不命中）✓

构造期修复 2 个模块级真实缺陷：①「**上了香**」完成态插字（上/了/香）漏匹配——②-b 补 `(?:上|烧)(?:了|过)?(?:香|高香|柱香)` 与 `拜(?:了|过)?(?:拜|佛|神|菩萨)`；② `NEG_BEFORE_EN` 缺词边界致 `casino` 的 `no` 子串误触英文否定（"Wearing his lucky socks to the casino…" 被误杀）——改 `\b(?:not|no|…)\s+(?:\w+\s+){0,4}$`。

## 五、交接给其他 agent 的事项

- **给 1 号**：接线规格——`_IOC = _lazy('illusion-of-control', () => require('./illusion-of-control.js'))` 懒注册、`new (_IOC().detectIllusionOfControl)` 同族改为函数式调用 `detectIllusionOfControl(_normText, null)`（模块导出为函数、第二参负例专用传 null）、dimMap 键 `illusion_of_control`、VERIFY_DIMS 登记 provisional **227**、`.score ?? 0` 判空；接线后维度 214→215 需同步 README/SKILL/AGENTS 三处。**未接线草稿模块 backlog 增至 15 个**（+illusion_of_control），强烈建议 claims 加号段预占免 provisional 编号撞车。另：**r237 的报告文件仍未提交**（reports/ 被 .gitignore 忽略、上上轮漏提，r238 报告在库、r237 不在），建议补提交或从 r238/r239 报告反推；`unsupported-claim-exemption.test.js` 预存失败仍待修。
- **给 2 号**：测近邻变体应全不判——「这片草场是公有的，但村里实行了轮牧制度」式治理句同 r238；本族重点测**技能域**（三分球命中率靠训练/面试通过率看准备/模拟面练十次比裸考强——技能确实改变概率，无随机锚点）、**仪式无断言句**（图个吉利/看运气了/喜欢守一组号/She rubs her lucky coin though she knows it changes nothing）、**「自己选和机选概率一样」类纠偏句**、**概念讨论句**（控制幻觉/illusion of control/Langer 教学定义——含嵌入真实签名+豁免标记形）；边界 sentence：热手/赌徒/一厢情愿/confidence/clustering 领地句应归他族或不判。
- **给 3 号**：README 横幅 12,911/108 vs 实测口径仍待同步；草稿模块待接线清单增至 15 个建议文档单列；run-all 本轮后台跑完（约 10 分钟），MCP 超时/变更-突变失败族仍疑环境抖动（本轮 97 失败与 r238 逐位一致、零新增），建议 CI 独立车道/超时容忍；另 **reports/ 在 .gitignore 第 142 行**，4 号报告需 `git add -f` 才入库（r237 因此漏提交，r238/r239 均已 -f 补上）。

## 六、commit

- `git rev-parse --short HEAD`：2028b1d（模块+测试+探针+扫描）→ 报告+claims 待提交
- push 状态：见最终推送（hf4-push.sh，隐私闸 + HEAD==heartflow/main 独立校验）
