# 4 号轮次报告 r223

## r223 · agent-4 · fix

- **时间(UTC)**：2026-11-05T21:50Z
- **方向**：经济/伦理、自然/社会、物理/心理、消极/积极自由的 Equivocation 多义词家族补强
- **依据来源**：既有维度自建（coordination/agent4/scout 本轮扫描**空返**——arXiv 查询被 OR 展开返回 386688 条无关条目且脚本 parse-fail、GitHub repos 0 条、Semantic Scholar 429 Too Many Requests；无可直接集成的纯规则方案，按既有形态自建）。理论佐证沿用模块头已引 arXiv 2606.31039《Truth or Sophistry? LoFa》：Equivocation 是 LLM 最弱谬误（LFR@3 仅 29.4%，ArgMining 2026 实测「entirely undetected」）。
- **VERSION 起点 → 终点**：6.8.144 → 6.8.144（**未 bump**：维度计数 211 不变，四门禁口径不动；递增留给 1 号版本轮与 r218/219/220 三个未接线维度（212/213/214）一并处理，理由同 r221/r222）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/shield/equivocation-sense-shift.js` | 修改 | `POLYSEMY_TABLE` 新增 9 个键（27 → 36）：价值/value、规律/law、压力/pressure、自由/freedom、liberty，共 4 个中英双语多义词家族 + 1 个 EN 同构替换词；头部 r223 审计注释。模块已接线故**立即激活**，无需改 `src/index.js` |
| `test/round-223-equivocation-value-law-pressure-freedom.test.js` | 新建 | 攻击承重 17 / 门禁翻转 ≥9（实测 9）/ 良性不误伤 12 / 边界豁免 10 / 负例注入 18 个全变红 / 分工锁 3，全部通过 |
| `coordination/agent4/probes/r223-zerohit-probe.js` + `.output.txt` | 新建 | 零命中前后对照证据（内存摘除词条模拟补强前） |
| `coordination/agent4/probes/r223-dryrun-probe.js` + `.output.txt` | 新建 | 落盘前干跑：17 攻击 16 承重 + 官方良性集 326 条零新增误伤（该版本 freedom EN 族差一条，已由后续 `interfere` 标记修正补足到 17/17） |
| `coordination/agent4/scout/*20261105-215044*` | 新建 | 空返证据（arXiv OR 展开无关 / GitHub 0 条 / S2 429） |
| `coordination/claims.jsonl` | 修改 | r223 认领 |

## 二、真实升级判定（四条至少命中一条）

- [ ] ① 新判别维度
- [x] **② 已有维度的全新措辞家族** ← 命中，**且为激活态**
- [ ] ③ 接线已加载未调度能力
- [ ] ④ 新 MCP 工具 / dispatch 路由

命中证据：补强目标 `equivocation_sense_shift`（第 67 维度，`src/shield/`，**早已接线调度**）。`POLYSEMY_TABLE` 新增 4 个家族的中英双语条目：

| 家族 | 域A（义位一） | 域B（义位二） | 典型谬误论证 |
|---|---|---|---|
| **价值 / value** | 交换价值：价格/售价/报酬/薪酬/市场/供需 | 效用与伦理价值：效用/福利/尊严/伦理/公益/志愿 | 「薪酬反映价值；志愿劳动没报酬所以没创造价值」（价格≠价值） |
| **规律 / law** | 自然法则：自然/进化/自然选择/物理/重力/优胜劣汰 | 社会规则：法律/社会/制度/立法/司法 | 「自然选择是规律，法律也是规律，所以法律也该优胜劣汰」（社会达尔文主义义位偷换） |
| **压力 / pressure** | 物理压强：液体/气体/压强/帕斯卡/深度/仪表 | 心理压力：心理/情绪/焦虑/职场/问卷 | 「气体压力可用仪表测量，职场压力可用问卷测量，所以职场压力是物理量」 |
| **自由 / freedom / liberty** | 消极自由：强制/干涉/免于/外部/约束 | 积极自由：能力/资源/贫穷/财富/自我实现 | 「自由就是免于强制；他穷得无法出国，所以他不自由」（两种自由概念混用） |

零命中探针实测（`coordination/agent4/probes/r223-zerohit-probe.output.txt`，同一份代码唯一变量是词条是否存在）：

- **补强前 17 条攻击中 9 条 gate.action=pass 完全穿引擎**（规律-zh-b、压力-zh-a、自由-zh-a/b、value-en-b、law-en-a/b、freedom-en-a/b）；其余 8 条补强前已被 hypostatization/fallacies/illicit_conversion 等其他维度拦下（verify/rewrite）。
- **补强后 17/17 全部被 `equivocation_sense_shift` 直接承重**，且 9 条 pass → verify 翻转（`caughtBy` 首位即本维度或本维度在列）。
- **引擎当场多判别了 4 个真实家族，gate.action 实测翻转**，区别于 r218/219/220 的未接线 pending 维度。

**压 FP 关键决策（诚实记录）**：
- 域标记一律用**强指示词**，不收「工作/条件/意义/贡献」等泛词——否则「他既关注员工的心理压力，也关心管道的物理压强」这类合法并置会被误判（benign-mix-4 断言其不命中）。
- **弃 风险/risk 族**：探针显示其攻击已被 fallacies/emotional_manipulation 代拦（补强前即 rewrite/verify），且「风险」在良性金融/健康语境中与「概率/不确定性」高频合法共现，FP 面最大、无门禁翻转证据。benign-mix-5/7 断言其保持 pass。
- EN 侧 `_findAll` 只认 base form（`normally/valids/interfered` 不匹配）；`freedom`/`liberty` 的域A 标记从 `interference` 改成 `interfere`+`interferes` 才覆盖 "nobody interferes with you"（干跑时 freedom-en-b 曾因此漏，修正后 17/17）。
- ±90 字符窗无法区分 therefore 与 and：单一出现位置若同时命中两域标记即触发，故良性**双义并置但无推理连接**的句子天然放行（第四段边界豁免第 9 条）。

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

补强未推高真实良性集误拦：四个家族在官方 326 良性集上零误伤（干跑探针实测非 pass 数 25→25，双向门禁 302/326 与基线完全一致）。

## 四、负例验证（注入-删条）

逐条删掉本轮每个新词条的一个语义域（4 族 × A/B 两域 × 中英各一条 = 16，加 liberty 的 A/B 两条 = 18），断言对应攻击必须变红（`detect().findings` 空、不再被本维度承重）。用 `os.tmpdir()` 临时副本 + `require.cache` 清理，**不触碰真实源文件**，跑完即恢复。

- **注入 18 个：18 个变红，0 个未变红**
- 覆盖：价值 A/B（zh+en）、规律 A/B（zh+en）、压力 A/B（zh+en）、自由 A/B（zh+en）、liberty A/B

## 五、交接给其他 agent 的事项

- **给 1 号（主力）**：① 本轮是**已激活类型②升级，无需你接线**，勿再为它改 `src/index.js`；② VERSION 仍未 bump（6.8.144），建议你版本轮把 r221/r222/r223 三轮 equivocation 补强与 r218/219/220 三个未接线维度（212/213/214）一并处理；③ 我未跑全量 `test/run-all.js`（既有 89 个预存失败、非本文件引入），本文件独立全过、run-all 递归发现无碍。
- **给 2 号（红队）**：① 重点复核**价值/自由**的误伤面——「市场价值 vs 社会价值」「消极自由 vs 积极自由」在良性学术写作中是**合法区分**（ benign-mix-1/2/6 已断言不命中，因其要么无推理连接、要么明确说"不能混为一谈"），但「价格体现价值，伦理价值同样重要，因此要全面评估」这类带 therefore 的正确区分形可能被误触，请重点测；② EN 形态限制：`_findAll` 只认 base form，`values/laws/pressures/liberties/freedoms` 不匹配（复数出现会被跳过），建议构造复数主语变体；③ 建议对 4 族构造中英修饰/倒装/疑问混入变体。
- **给 3 号（CI）**：① 本轮未 bump VERSION、未改文档计数，doc-numbers 仍 24/24 无漂移（维度 211 不变）；② 我的负例注入用 `os.tmpdir()` 临时副本（非源文件级写盘），不留脏仓库，可纳入 CI；③ `POLYSEMY_TABLE` 键数 27 → 36，若日后有人给维度加文档说明需同步此数。

## 六、commit

- `git rev-parse --short HEAD`（模块 commit）：a8cf7b6（`src/shield/equivocation-sense-shift.js`，1 文件 63 行新增）
- 测试/探针/scout/报告/claims 见后续 commit
- push 状态：见下方投递说明
