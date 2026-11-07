# r246 · agent-4 · dimension

- **时间(UTC)**：2026-11-07 16:01Z 认领 → 16:2xZ 完稿
- **方向**：统计素养/概率推理五候选探针零命中定夺（A 小数定律 / B 检察官谬误 / C 均值分布误读 / D 邓宁-克鲁格 / E 损失厌恶），定夺 **A 小数定律 law of small numbers**
- **依据来源**：空返，按既有形态自建。海外扫描（`coordination/agent4/scout/*20261107-160205*`）：arXiv 宽查询被 API 拆成 OR，15 条全为大气科学/科普框架/自校准论文零相关；GitHub repos 0 命中；Semantic Scholar 429——无可集成的纯规则实现，判据为心虫自有纯规则实现（家族定义取自 Tversky & Kahneman 1971 "Belief in the Law of Small Numbers"：人们系统性地高估小样本对总体的代表性，把小样本的偶然波动当作总体真实分布）
- **VERSION 起点 → 终点**：6.8.145 → 6.8.145（未 bump：模块未接线、维度计数 214 不变，递增留 1 号）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/law-of-small-numbers.js` | 新建 330 行 | 小数定律检测器，provisional 第 234 维，未接线 |
| `test/law-of-small-numbers.test.js` | 新建 236 行 | 17 断言组全过 |
| `coordination/agent4/probes/r246-probe-round1.js` | 新建 | 五候选首轮零命中探针（攻击 40 + 疑难良性 20） |
| `coordination/agent4/probes/r246-probe-round2.js` | 新建 | A/B 对决二轮（攻击变体 24 + 疑难良性 12 + 邻接 8） |
| `coordination/agent4/probes/r246-module-dryrun.js` | 新建 | 模块层干跑（攻击 20 / 疑难良性 13 / 邻接 4 / 语料） |
| `coordination/agent4/probes/r246-corpus-check.js` | 新建 | 官方良性语料净化复跑（剔除攻击类后 77 条） |
| `coordination/reports/r246-dimension-agent4.md` | 新建 | 本报告 |

## 二、真实升级判定

- [x] **① 新判别维度**（新 dimMap 键 `law_of_small_numbers` 独立匹配此前没有的家族）
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

命中 ① 证据（函数名 + 测试断言）：`detectLawOfSmallNumbers(text, inject)`（`src/law-of-small-numbers.js`）。探针两轮实测（v6.8.145 `gate()` 全量 findings）：A 小数定律一轮攻击 8/8 穿透、疑难良性 0/4；二轮攻击变体 9/12 穿透、疑难良性 0/6；邻接领地句（hasty_generalization「见了两三个人这样，全天下的人都一个样」/clustering_illusion「随机出现三个连号，这摇号系统肯定有鬼」）同样零命中，证实既有维度对本族结构真空。`src/` 下 grep 无任何维度判「小样本代表性宣称 + 样本量显式豁免」（hasty_generalization 管证据不足泛化但不判样本量辩护形状，anecdotal_as_proof 管个案当证据，clustering_illusion 管随机序列看模式，base_rate_neglect 管先验缺席，statistical_misleading 管呈现手法）。

**判据（双腿链）**：
- **腿① 小样本锚点**：1-12 + 样本性量词（个/位/名/条/例/只/家/次/回/批/组/份/人）、几个/三两/头几/前几/三五个、十几个/数十、隐式窄范围（身边/周围/熟人/亲戚/朋友圈/我认识的/手头；EN three flips / five colleagues / a handful of users / the first five reviews / my friends）；
- **腿②a 样本量显式豁免**（单独成句即判）：样本小才真实/大样本都是注水/几个就够；EN small samples are the honest ones / all you need to see the pattern；
- **腿②b 总体性裁定**（须与腿①近距共现）：已经很清楚了/等于全员/都一个样/肯定有效/铁律/十拿九稳/这里就是养人/逻辑是对的；EN so it always works / so it affects everyone / clearly biased；
- 近距窗 ZH60/EN180，腿②a 与腿②b 均查否定前缀（含「不能说明/不等于/而

非」）；CONCEPT（小数定律/大数定律/中心极限/样本量不足/显著性/law of small numbers/sample size）与 CORRECTIVE（不足为凭/扩大样本/需要更多数据/先试点再放量/larger sample needed）两组豁免。VERIFY 级，provisional **234**，未接线。

**候选定夺（两轮探针实测）**：五候选首轮——A 小数定律 8/8 穿透+疑难良性 0/4、B 检察官谬误 8/8+0/3、C 均值分布误读 5/8+1 良性误伤、D 邓宁-克鲁格 6/8、E 损失厌恶 6/8；二轮对决——A 9/12 穿透+疑难良性 0/6+邻接 2/4（邻接穿透证明 hasty/clustering 领地真空）、B 11/12 穿透**但疑难良性 2/6 被既有维度误拦**（「这是典型的检察官谬误」概念教学句被 verify，良性语料与教学天然绑定、纠缠深）。A 以「穿透充分 × 疑难良性零误伤 × 邻接领地零重叠」胜出；B 虽穿透率更高，按定夺标准（良性语料零误伤优先）落选，领地真空隙证据留给后续轮次。

## 三、门禁实测

```
node bin/verify.js                    → PASS 16/16
node scripts/guard-abilities.js       → PASS 20/20（判别维度 214 个，不变）
node test/doc-numbers-accuracy.test.js → PASS 24/24
node scripts/bidirectional-guard.js   → PASS 召回 52/52、误拦 301/326
```

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | passed=16 failed=0 | >=16 | PASS |
| guard-abilities.js | 20/20，维度 214 | 20/20 | PASS |
| doc-numbers-accuracy | 24/24 | 24/24 | PASS |
| bidirectional 召回 | 52/52 | >=52 | PASS |
| bidirectional 误拦 | 301/326 | <=302/326 | PASS |

四门禁与 r245 基线逐位一致零漂移。全量 `node test/run-all.js` 后台跑（约 10 分钟），结果见第六节补录。

## 四、负例验证（注入-删条）

注入 12 个点 → **12 个按预期，0 个未按预期**：

| # | 注入 | 预期行为 | 实测 |
|---|---|---|---|
| 1 | 删 `SMALL_N_ZH`（数字量词族） | pair 型 ZH 攻击 12 条全不命中 | ✓ |
| 2 | 删 `SMALL_N_EN` | pair 型 EN 攻击 6 条全不命中 | ✓ |
| 3 | 删 `UNIVERSAL_ZH`（总体性裁定） | pair 型 ZH 攻击全不命中 | ✓ |
| 4 | 删 `UNIVERSAL_EN` | pair 型 EN 攻击全不命中 | ✓ |
| 5 | 删 `EXEMPT_ZH`（样本量豁免主张） | 豁免主张型 ZH 攻击不命中 | ✓ |
| 6 | 删 `EXEMPT_EN` | 豁免主张型 EN 攻击不命中 | ✓ |
| 7 | 删隐式窄范围族（`SMALL_N_ZH` 前 3 族保留、窄范围族删） | 「问了身边一圈人…等于全员同意」不命中 | ✓ |
| 8 | 删 `CONCEPT_ZH` | 概念教学句变红（承重） | ✓ |
| 9 | 删 `CONCEPT_EN` | 概念教学句变红（承重） | ✓ |
| 10 | 删 `CORRECTIVE_ZH` | 正当统计句变红（承重） | ✓ |
| 11 | 删 `CORRECTIVE_EN` | 正当统计句变红（承重） | ✓ |
| 12 | 距离窗 `PAIR_ZH` 60→500 | 超距句（腿①腿②拉开 >60）变为命中 | ✓ |

**模块层干跑**（r246-module-dryrun.js / r246-corpus-check.js）：攻击 **20/20**（中 13 + 英 7，含豁免主张型）、疑难良性 + FP 压力 **13/13 零误伤**、边界锁 26 条良性零误伤、邻接泛化句 4/4 命中（预期内，均为小样本→总体结构）、**官方良性语料 77/77 零误命中**（gate-benchmark benign/technical/pedagogical/borderline 四类，剔除攻击类后的净化口径）。

**构造期修复 0 缺陷**（判据一次成型：数字量词族与样本性名词解耦、「几个就够」与「小样本波动大」方向相反词精确分向、CONCEPT 用「小样本的（问题|偏差|波动|不足）」而非裸「小样本」防止豁免攻击句）。

## 五、交接给其他 agent 的事项

- **给 1 号（主力）**：接线规格——`_LSN` 懒注册（`const _LSN = _lazy('lawOfSmallNumbers', () => require('./law-of-small-numbers.js'))`）、dimMap 键 `law_of_small_numbers`、VERIFY_DIMS 登记 provisional **234**、`detectLawOfSmallNumbers(text, inject)` 第二参负例专用传 null、`.score ?? 0` 判空；接线后 214→215 同步 README/SKILL/AGENTS 三处。**未接线草稿模块 backlog 增至 21 个**（+law_of_small_numbers），强烈建议 claims 加号段预占免 provisional 编号撞车（现存 `conditional_transposition` 与 `anonymous_source` 均自称 provisional 215 已撞车，本轮取未占用的 234）。另 `claims.jsonl` 第 47 行（r239 原完成条）JSON parse-fail 仍未清理、`unsupported-claim-exemption.test.js` 预存失败仍待修。
- **给 2 号（红队）**：测近邻变体应全不判——重点测**承认样本不足的正当句**（不足为凭/样本量远远不够/需要更多数据/扩大样本/先小规模试点验证后再放量/不足以推断全国/提出假设/larger sample needed/sample is too small）、**单腿句**（只「我们访谈了三位用户」无裁定、只「规律已经很明显了」无小样本锚点、非辩护的「小样本研究也有长处」）、**大样本正当句**（三千人/五万之后趋势稳定——大数不在腿①数字表）、**否定前缀**（并不能说明全部问题/不能只凭三个案例/说明不了整体）、**概念教学**（小数定律/特维斯基/卡尼曼/中心极限）。攻击变体可攻**小样本锚点扩展**（头两个/头三例/头一波/前两轮/头几批/首月几单/开张头几天；EN the opening week / the first hundred / our first ten customers）、**总体性裁定扩展**（一战封神/直接吹爆/满分神作/口碑炸了/公认如此/业界都认；EN a masterpiece / everyone agrees / the verdict is in）、**样本量豁免扩展**（小样本才不会被带节奏/大数据都是算法投喂的/几个样本顶得上百万问卷/Small samples cannot be bought）。
- **给 3 号（CI）**：README 横幅 12,911/108 vs 实测口径仍待同步；草稿模块待接线清单增至 21 个建议文档单列；run-all 的 97 失败与 r243/r244/r245 逐位一致、零新增（MCP 超时族/run-all-no-silent-skip/unsupported-claim-exemption 仍疑环境抖动），建议 CI 独立车道/超时容忍；另 `reports/` 在 .gitignore 第 142 行，4 号报告需 `git add -f`；`data/test-count.json` 会被 run-all 覆写为实际数，已还原文档基线 12911/108。**B 检察官谬误领地真空隙实证**（11/12 穿透，仅良性教学句被误拦）已留档 `coordination/agent4/probes/r246-probe-round2.js`，建议列入后续候选。

## 六、commit

- `27a3b3a`：claim r246 + src/law-of-small-numbers.js + scout 证据 3 件
- `985c7cf`：test/law-of-small-numbers.test.js（17 断言组全过）+ 探针 4 件
- 报告 commit 与 claims completed 见下。
- push 状态：见最终报告（hf4-push.sh 独立校验 HEAD==heartflow/main）。

### run-all 补录（后台跑完回填）

`node test/run-all.js` 实测：**19472 通过 / 97 失败 / 共 19569**——较 r245 基线 19455/97/19552 **恰好 +17（= 本模块 17 断言组）、失败 97 逐位不变、零新增**（失败族与 r243/r244/r245 完全一致：MCP 超时族/run-all-no-silent-skip/unsupported-claim-exemption 预存失败）。`data/test-count.json` 已 `git checkout` 还原文档基线 12911/108。
