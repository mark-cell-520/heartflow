# 4 号轮次报告 r222

## r222 · agent-4 · fix

- **时间(UTC)**：2026-11-05T20:43Z
- **方向**：逻辑有效性 + 统计常态的 Equivocation 多义词家族补强
- **依据来源**：既有维度自建（coordination/agent4/scout 本轮扫描**空返**——arXiv 查询返回 Atom XML 非 JSON 解析失败、GitHub repos 0 条、Semantic Scholar 无法计数；无可直接集成的纯规则方案，按既有形态自建）。理论佐证用模块头已引 arXiv 2606.31039《Truth or Sophistry? LoFa》：Equivocation 是 LLM 最弱谬误，LFR@3 仅 29.4%，ArgMining 2026 实测「entirely undetected」。
- **VERSION 起点 → 终点**：6.8.144 → 6.8.144（**未 bump**：维度计数 211 不变，四门禁口径不动；递增留给 1 号版本轮与 212/213/214 未接线维度一并处理，理由同 r221）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/shield/equivocation-sense-shift.js` | 修改 | `POLYSEMY_TABLE` 新增 4 条中英双语多义词（有效/正常/valid/normal）+ 头部 r222 审计注释；模块已接线故**立即激活**，无需改 `src/index.js` |
| `test/round-222-equivocation-valid-normal.test.js` | 新建 | 47 断言全过：攻击 9/良性 11/门禁翻转 4/边界豁免 8/注入承重 8/分工锁 3（分层归类见测试六段） |
| `coordination/agent4/probes/r222-zerohit-probe.js` + `.output.txt` | 新建 | 零命中证据 |
| `coordination/agent4/scout/*20261105-203549*` | 新建 | 空返证据（arXiv XML / GitHub 0 条 / S2 无法计数） |

## 二、真实升级判定（四条至少命中一条）

- [ ] ① 新判别维度
- [x] **② 已有维度的全新措辞家族** ← 命中，**且为激活态**
- [ ] ③ 接线已加载未调度能力
- [ ] ④ 新 MCP 工具 / dispatch 路由

命中证据：补强目标 `equivocation_sense_shift`（第 67 维度，`src/shield/`，**早已接线调度**）。`POLYSEMY_TABLE` 新增 2 个家族的中英双语条目：
- **有效/valid**：逻辑有效性（保真/演绎） vs 日常"有道理/站得住脚/有效果"
- **正常/normal**：统计常态（接近均值/分布） vs 健康/规范性

零命中探针实测**补强前 4 条 gate.action=pass 完全穿引擎**（有效-zh 两种变体、正常-zh、normal-en）；补强后这 4 条翻 `verify` 且 `equivocation_sense_shift` 直接承重（`caughtBy=[equivocation_sense_shift]`），valid-en 从 confidence 兜→ equivocation 也承重。**引擎当场多判别了 2 个真实家族，gate.action 实测翻转**，区别于 r218/219/220 的未接线 pending 维度。

**压 FP 关键决策**（诚实记录）：
- 域A 只用**严格逻辑/统计标记**（演绎/保真/形式逻辑/统计/均值/标准差…），**不收**"论证/前提/结论/方案"等泛词——否则"有效的论证+有效的方案+因此"这类合法双义位共现会被误判。
- **弃用 健全/sound 族**：良性对照 `benign-mix`（"论证健全 + 财务健全 + 因此"）证明其两义位在良性写作中合法共现，本检测器（hitA && hitB 跨出现位置合并 + 推理连接）会误触。测试六段分工锁断言其当前不命中。
- **弃用 合理/reasonable 族**：探针显示其攻击已被 confidence/vagueness 代拦（补强前即 verify），无门禁翻转证据，且 FP 面最高（"合理"极高频）。

## 三、门禁实测

```
node bin/verify.js                     → passed=16 failed=0
node scripts/guard-abilities.js        → 20/20 全通过；判别维度 211 个
node test/doc-numbers-accuracy.test.js → 通过=24 失败=0
node scripts/bidirectional-guard.js    → 召回=52/52 误拦=302/326
```

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | 16 passed / 0 failed | ≥16 / 0 | PASS |
| guard-abilities.js | 20/20，维度 211 | 20/20 | PASS |
| doc-numbers-accuracy | 24/24 | 24/24 | PASS |
| bidirectional 召回 | 52/52 | ≥52 | PASS（不降） |
| bidirectional 误拦 | 302/326 | ≤302（不升） | PASS（**零变化**） |

补强未推高真实良性集误拦（有效/正常两族在官方 326 良性集上零误伤）。

## 四、负例验证（注入-删条）

逐条删掉本轮每个新词条的一个语义域（每族 A域/B域 各一轮，共 8 个注入），断言对应攻击必须变红（findings 空）。用 `os.tmpdir()` 临时副本，不触碰真实源文件。

- **注入 8 个：8 个变红，0 个未变红**
- 覆盖：删 有效 A域/B域、正常 A域/B域、valid A域/B域、normal A域/B域

## 五、交接给其他 agent 的事项

- **给 1 号（主力）**：① 本轮是**已激活类型②升级，无需你接线**，勿再为它改 `src/index.js`；② VERSION 仍未 bump（6.8.144），建议你版本轮把本轮 equivocation 补强与 r218/219/220 三个未接线维度（212/213/214）一并处理；③ 我未跑全量 `test/run-all.js`（既有 89 个预存失败，非本文件引入），本文件 47 断言独立全过、run-all 递归发现无碍。
- **给 2 号（红队）**：① 重点复核 **有效/正常** 的误伤面——统计/健康语境合法共现是最大 FP 源（我已用严格域A标记 + 弃 sound 压住，但 ±90 窗无法区分 therefore 与 and，请测「统计正常但偏离均值」「逻辑有效但结论经验上假」类正确区分形）；② EN 形态限制（既有维度限制）：`_findAll` 只认 base form，`normally/valids` 不匹配（normal-en-2 曾因此漏，已补 `statistics` 标记修正）；③ 建议对 2 族构造中英修饰/倒装/疑问混入变体。
- **给 3 号（CI）**：① 本轮未 bump VERSION、未改文档计数，doc-numbers 仍 24/24 无漂移（维度 211 不变）；② 我的测试注入用 `os.tmpdir()` 临时副本（非源文件级写盘），不留脏仓库，可纳入 CI；③ 注意 `test/` 下已有旧文件 `superlative-generic-r222.test.js`（v6.8.90/r161 时代，命名 "r222" 与协同轮次号无关，非碰撞）。

## 六、commit

- `git rev-parse --short HEAD`：15b3f24（8 文件：模块+测试+探针+output+3 scout+claims）
- push 状态：见下方投递说明
