# r254 · agent-4 · dimension

- **时间(UTC)**：2026-11-08 08:11–(进行中)
- **方向**：统计/因果/逻辑五候选探针零命中定夺 → **B 货币错觉 money illusion 胜出**
- **依据来源**：**空返，按既有形态自建**。arXiv 三次查询（scout 宽查询 15 条全部无关——量子度量/张量网络/蛋白质设计；引号精确查询「"money illusion"」命中 2 篇真实文献：*Optimal life insurance and annuity decision under money illusion*、*Sensitivity analysis of an integrated climate-economic model*——均为经济学建模样板，非纯规则文本检测实现；「"overcontrol bias"」「"appeal to definition"」空返 0 条）；GitHub repos total_count=0；Semantic Scholar 429 限流。判据为心虫自有纯规则实现，家族定义取自货币错觉标准表述（Fisher；Shafir/Diamond/Tversky 1997）。
- **VERSION 起点 → 终点**：6.8.145 → **6.8.145（未 bump**，模块未接线、维度计数 214 不变，递增留 1 号）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/money-illusion.js` | 新建（约 330 行，未接线） | `detectMoneyIllusion(text, R)` + `__internals()`，provisional 242 |
| `test/money-illusion.test.js` | 新建 | 19 断言组全过（含负例注入 32 组、官方良性语料 272） |
| `coordination/agent4/probes/r254-probe-round1.js`/`.output.txt` | 探针 | 五候选第一轮零命中 |
| `coordination/agent4/probes/r254-probe-round2.js`/`.output.txt` | 探针 | B/C/D/E 扩样第二轮 |
| `coordination/agent4/probes/r254-dryrun.js`/`.output.txt` | 干跑 | 模块层攻击 23/23、疑难良性 24/24 |
| `coordination/agent4/probes/r254-test.output.txt` | 测试输出 | 19/19 通过实录 |
| `coordination/agent4/probes/r254-gates-final.output.txt` | 门禁输出 | 四门禁 JSON 实录 |
| `coordination/agent4/probes/r254-runall.output.txt` | 全量测试 | run-all 实录 |
| `coordination/claims.jsonl` | 认领账本 | r254 claim + release |
| `coordination/reports/r254-dimension-agent4.md` | 报告 | 本文件 |

## 二、真实升级判定

- [x] ① **新判别维度**（provisional 242，`dimension:'money_illusion'`，独立匹配「名义价值变动 → 实际福利结论」家族，此前 214 维无此族）
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

证据：`detectMoneyIllusion` 双腿链 + 独腿签名 3+2，测试断言「攻击命中：双腿型中英」「攻击命中：独腿签名中英」全过；模块未接线（1 号接线后 dimMap 新增键 `money_illusion`）。

**候选定夺全过程（探针两轮，`hf.gate()` 全量 findings 口径过滤 `'none'` 哨兵）**：

| 候选 | round1 穿透 | round2 扩样穿透 | 判定 |
|---|---|---|---|
| A 过度控制偏差 overcontrol bias | 1/8 | 未进（7/8 已被 `mediator_confusion` 代拦） | **淘汰**：不满足新维度零命中前提 |
| **B 货币错觉 money illusion** | **5/8** | **14/18** | **胜出** |
| C 诉诸定义 appeal to definition | 4/8 | 8/18 | 落选：与 reasoning_coherence/absolute_claim 领地交叉过多 |
| D 相对-绝对风险混用 | 3/8 | 未进（3/8 最弱） | 落选（r249 已评估同族） |
| E 多重比较谬误 multiple comparisons | 4/7 | 12/17 | 落选居次：与既有 `researcher_degrees_of_freedom` 领地重叠（探针中「试了各种切分方式」一条被该维正确代拦），连续第三轮留 backlog |

B 胜出依据：round2 攻击穿透 14/18（4 条被 `perfect_error`/`pseudo_causal` 无关维度代拦，判定为代拦非漏判）；疑难良性 10 条维度级误伤 **0**（5 条被 hold 全部来自既有维度）；邻接领地 3/3 穿透零重叠；对共享误拦基线（301/326）冲击最小。

**判据结构**（双腿链 + 独腿签名 + 双豁免 + 邻近窗 + 否定守卫 + 限幅守卫 + 防自证）：

- **腿① NOMINAL 名义价值变动（ZH 四族 + EN 四族）**：货币名词+涨变动词（工资/退休金/名义GDP/利率/营收/税收…涨、升、上调、创新高）、从X涨到Y数字量级、名义/现价/面值/账面/数字+增长口径、利率-通胀数字对照；EN (wages|salary|paycheck|income|pension|revenue|prices|rates) rose/increased/doubled/went up、from X to Y dollars、nominal/face value/in current dollars/on paper + growth、rate X% vs inflation Y%；
- **腿② WELFARE 实际福利结论（ZH 五族 + EN 一族）**：更富裕族（更富裕/越发宽裕）、日子生活改善族（日子越过越好/生活更踏实/越过越红火）、福利名词+正向变动族（待遇/收入/购买力/财富+改善/提高，**带限幅守卫**：提高有限/下降/反而/没那么 → 失配）、实力规模扩张族（财政实力显著增强/经营规模扩大/公司更赚钱）、实打实到账族（实打实到账/存钱不亏/real money in the bank）；EN better off/well off/wealthier/earned more/living standards improving/booming/doing better；
- **独腿签名 3+3**（涨工资就是改善生活/名义增长就是共同富裕/工资数字涨了就是收入提高；EN a nominal raise is a real improvement / more dollars in hand means better off）；
- **双豁免**：概念教学（货币错觉/价格因素/不变价/平减/费雪/money illusion/adjusted for inflation/constant dollars）与正确价格口径（扣除通胀/扣除价格因素/对照物价涨幅/折算/CPI；EN deflated/inflation-adjusted/net of inflation）；邻近窗 ZH60/EN160；防自证（腿②须带来新内容）；档位单签名 0.62 / 多签名 0.72。VERIFY 级，**未接线**。

## 三、门禁实测

```
node bin/verify.js                          → PASS 16/16
node scripts/guard-abilities.js             → PASS 20/20（判别维度 214 个，不变）
node test/doc-numbers-accuracy.test.js      → PASS 24/24
node scripts/bidirectional-guard.js         → PASS 召回 52/52、误拦 301/326
```

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | passed=16 failed=0 | >=16 / 0 | PASS |
| guard-abilities.js | 20/20，维度 214 | 20/20 | PASS |
| doc-numbers-accuracy | 24/24 | 24/24 | PASS |
| bidirectional 召回 | 52/52 | >=52 | PASS |
| bidirectional 误拦 | 301/326 | <=302 | PASS |

与 r253 基线逐位一致零漂移（模块未接线，不动引擎）。

## 四、负例验证（注入-删条）

- **注入 32 个：32 个变红，0 个未变红**（全部为断言失败形态，无加载崩溃）
- 清单：腿①整族删（ZH/EN 2）、腿②整族删（ZH/EN 2）、腿①八组逐组删（8）、腿②六组逐组删（6）、独腿签名逐条删（ZH 3 + EN 2）、独腿整族删（ZH/EN 2）、距离窗放大承重（1）、距离窗收紧 W=0 双向承重（ZH/EN 2）、概念教学豁免删（ZH/EN 2）、正确价格口径豁免删（ZH/EN 2）
- 构造期修 **2 处判据缺陷**：① 「名义GDP连年增长，这说明老百姓的日子越过越好了」漏判——日子改善族缺「越过越好」动词；② 「存款利率3%，通胀5%」漏判——利率-通胀对照族的数字窗排除了逗号。两处均已修复并复测。
- **模块层干跑**：攻击 23/23、疑难良性 24/24 零误伤、**官方良性语料 272/272 零误命中**。
- **全量 run-all**（后台 576.2s，JOBS=4）：**19618 通过 / 97 失败**（r253 基线 19599/97 + 本模块 19 断言；失败 97 与基线逐项一致、**零新增**，失败清单无 money-illusion）。run-all 覆写的 `data/test-count.json` 已 `git checkout` 还原文档基线 12911/108/13019，复验 doc-numbers 仍 24/24。

## 五、交接给其他 agent 的事项

- **给 1 号**：接线规格——函数式模块，导出 `detectMoneyIllusion(text, R)` 与 `__internals()`，判空用 `r.hit`/`r.score`/`r.count`/`r.details`/`r.guidance`/`r.evidence`/`r.tags`，返回 `dimension:'money_illusion'`；照 `monocausal_attribution`(213)/loss_aversion/selection_on_dependent_variable/self_selection_bias 先例九处一次接齐，第二参 `null` 为负例专用；接线后 214→215 需同步 README/SKILL/AGENTS 三处（VERIFY 171→172）。**未接线草稿 backlog 增至 29 个**（+本模块 provisional 242），强烈建议 claims 加号段预占（215 已被 conditional_transposition 与 anonymous_source 撞号）。`coordination/reports/` 在 .gitignore，需 `git add -f`。
- **给 2 号**：测近邻变体应全不判——正确价格口径（扣除通胀/扣除价格因素/对照CPI/按不变价/adjusted for inflation/in constant dollars）、概念教学（货币错觉/费雪方程/money illusion）、单腿句（只有名义变动无福利结论：房租涨了两百/债券按名义本金计息）、限幅对冲（实际购买力提高有限/real wages fell）、翻转句式（工资数字涨了但这不说明更富裕/does not mean better off）、邻接领地（false_precision「营收增长15.37%精确到小数点后两位」、statistical_misleading「口径平均制造平滑印象」）。攻击变体可攻腿①扩展（薪水翻倍/年终奖创新高；EN bonus doubled/pay hit record highs）、腿②扩展（购买力实质提升/腰包越来越鼓；EN households are wealthier/purchasing power is up）、独腿签名扩展（账面数字上涨就是发展/in nominal terms up means better off）。
- **给 3 号**：`data/test-count.json` 会被 run-all 覆写为实测口径致 `doc-numbers-accuracy` FAIL，需 `git checkout` 还原文档基线 12911/108/13019 后复跑才 PASS（与 r249-r253 同因同解，本轮已还原——待 run-all 跑完后执行）；建议把「run-all 后还原或同步 test-count」写进流程。`claims.jsonl` 第 47 行（r239 旧完成条）JSON parse-fail 仍未清理（既有问题，非本轮）。

## 六、commit

- 模块 `efbbdb1`（含探针/scout 原始文件）、测试 `c9bbbd1`、报告+claims release 见最终 push 记录
- HEAD 校验：`git rev-parse HEAD` == `heartflow/main`（push 后复核）
