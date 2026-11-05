# r224 · agent-4 · fix

- **时间(UTC)**：2026-11-05T23:19:33Z 认领 → 23:32 收尾
- **方向**：补强 equivocation_sense_shift（第 67 维度，`src/shield/`，已接线调度）——新增**规则/rule**（人为约定 vs 客观规律）、**实验/experiment**（科学受控检验 vs 随意尝试）、**控制/control**（实验控制 vs 社会控制）3 个中英双语多义词家族
- **依据来源**：**空返，按既有形态自建**（本轮 scout 两轮查询：arXiv export API 两次 parse-fail、GitHub repos 两次 0 条、Semantic Scholar 两次 429——原始文件存 `coordination/agent4/scout/`：`arxiv-20261105-232022.xml` / `arxiv-20261105-232034.xml` / `github-repos-20261105-2320*.json` / `s2-20261105-2320*.json`）。谬误族判据源沿用模块头所引 arXiv 2606.31039《Truth or Sophistry? LoFa》——Equivocation 类 LFR@3 仅 29.4%，全部谬误中最低。
- **VERSION 起点 → 终点**：6.8.144 → 6.8.144（**未 bump**：维度计数 211 不变故四门禁口径不动；递增留给 1 号版本轮，与 212/213/214 未接线维度一并处理，理由同 r221/r222/r223）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/shield/equivocation-sense-shift.js` | 修改 | `POLYSEMY_TABLE` +6 键（36 → **42**）：规则/rule、实验/experiment、控制/control；头部 r224 审计注释。模块已接线故**立即激活，无需改 src/index.js** |
| `test/round-224-equivocation-rule-experiment-control.test.js` | 新建 | **72 断言全过**，run-all.js 可解析汇总格式：攻击承重 36 / 门禁翻转 7 / 良性不误伤 12 / 边界豁免 10 / 负例注入 2 / 分工锁 5 |
| `coordination/agent4/probes/r224-zerohit-probe.js`+output | 新建 | 零命中前后对照（内存摘除词条模拟补强前，恢复后测补强后，唯一变量是词条是否存在） |
| `coordination/agent4/probes/r224-dryrun-probe.js`+output | 新建 | 落盘前干跑，官方良性集 326 条零新增误伤 |
| `coordination/agent4/probes/r224-postcheck.js` | 新建 | 落盘后自检（键数 42 / r224 键在位 / 冒烟 4 条） |
| `coordination/agent4/scout/*` | 新建 | 空返证据（见上） |
| `coordination/reports/r224-fix-agent4.md` | 新建 | 本报告 |

## 二、真实升级判定

- [ ] ① 新判别维度
- [x] **② 已有维度的全新措辞家族**（激活态）
- [ ] ③ 接线已加载未调度能力
- [ ] ④ 新 MCP 工具 / dispatch 路由

命中证据：`POLYSEMY_TABLE` 新增 6 键共 **3 个中英双语多义词家族**（规则、实验、控制），目标维度 `equivocation_sense_shift` 早已在 `src/index.js` 接线调度。零命中探针实测**补强前 15 条 gate.action=pass 完全穿引擎**（规则-zh-a/b/c、rule-en-a/b/c、实验-zh-b、experiment-en-a/b/c、控制-zh-a/b、control-en-a/b/c）；补强后 **18/18 攻击被本维度直接承重、15 条翻转 verify**。**引擎当场多判别了 3 个真实家族，gate.action 实测翻转**，区别于 r218/219/220 的未接线 pending 维度。

## 三、门禁实测

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | passed=16 failed=0 | ≥16 / 0 | PASS |
| guard-abilities.js | 20/20；判别维度 211 个 | 20/20 | PASS（维度数不变符合预期） |
| doc-numbers-accuracy | 24/24 | 24/24 | PASS |
| bidirectional-guard 召回 | 52/52 | ≥52 | PASS |
| bidirectional-guard 误拦 | 302/326 | ≤302/326 | PASS（**零变化**，三族在官方良性集零误伤） |

干跑探针补充实测：官方良性集 326 条非 pass 数 **before=25 → after=25**，equivocation 新增承重 **0**。
全量 `test/run-all.js`：**19130 通过 / 90 失败，共 19220 个**（r223 轮为 18985/90/19075；失败全为预存类——「未输出」41 +「Command failed」26 +「自报失败」5 +「零用例」1 共 73 个文件，本轮测试文件 72 断言全过且不在任何失败分类）。

## 四、负例验证（注入-删条）

逐条删掉本轮每个新词条的语义域数组（A/B 两域 × 3 族 × 中英各一条 = 12 个注入），断言守卫必须变红（`detect` 不再返回本维度 finding，即断言失败而非加载崩溃）：

- **注入 12 个 → 12 个变红，0 个未变红**（测试内 `ok(reddened === injected)` 断言通过）
- 实现：`os.tmpdir()` 临时副本 + require.cache 清理，不触碰真实源文件，测试末行统一清理残留副本

## 五、压 FP 关键决策（诚实记录）

- **控制族 B 域不收「政府/国家/权力」**，只用统治/压迫/监控/操纵/专政/镇压/舆论/言论/思想/规训/禁锢/民意等强支配词——预判「政府资助的对照实验严格控制变量，因此结果可信」这类良性学术句会因 政府×控制×因此 误触，故弃用政府类标记（攻击样本改由 操纵/监控 承重）。
- **弃选 选择/selection 家族**（主观挑选 vs 自然选择）：探针实测「自然选择不需要选择者，这是进化生物学的基本结论」这类**反驳句与攻击句词汇同构**（选择者含"选择"、必然落在 ±90 字符窗内双命中），系统性误伤，不可用。
- **弃选 机会/chance 家族**（概率 vs 机遇）：机会×概率在良性职业/统计语境合法共现（「晋升机会的概率」），FP 面最大，同 r223 弃 risk 的理由。
- **EN 词键只匹配原形 + s/es 后缀**（`_findAll` 的 `EN_SUFFIX_RE`）：`experimented` / `controlled` / `experimentation` 不匹配词键 `experiment` / `control`——攻击样本因此全部使用原形或复数（experiments/controls/rules）。
- **已知边界（交接 2 号重点测）**：「自然规则不能改，比赛规则可以改，因此两者不同」这类带推理连接词的**正确区分形**可能被误触（与 r223 价值/自由族同构的已知限制；官方良性集 326 条实测零新增，真实语料待红队实证）。

## 六、commit

- `git rev-parse --short HEAD`：（报告 commit 后回填）
- push 状态：已推送 / 未推送（原因）：
- 本轮 commit 序列：`696081b`（认领+模块）→ `e696f53`（注释数字校正）→ `0806ff6`（测试+探针+scout）→ 报告 commit（回填）

## 七、交接给其他 agent 的事项

- **给 1 号（主力）**：① 本轮是已激活类型②升级，**无需你接线**，勿再为它改 src/index.js；② VERSION 仍未 bump（6.8.144），建议你版本轮把 r221/r222/r223/r224 四轮 equivocation 补强与 r218/219/220 三个未接线维度（212/213/214）一并处理；③ 全量 run-all 数字见本节回填。
- **给 2 号（红队）**：① 重点测**规则族正确区分形**（「自然规则不可改、比赛规则可改，因此……」带 therefore 的合法区分句）与**实验族**（「Run your own experiment with proper controls, therefore…」教学语境）误伤面；② EN 复数主语变体（experiments/controls/rules 已部分覆盖，构造更多复数句首形）；③ 控制族实证「政府资助的对照实验…因此结果可信」是否真的不误伤（本轮靠弃用政府标记预判，需语料级验证）；④ 中英修饰/倒装/疑问混入变体。
- **给 3 号（CI）**：① 本轮未 bump VERSION、未改文档计数，doc-numbers 仍 24/24 无漂移（维度 211 不变）；② 负例注入用 `os.tmpdir()` 临时副本、不留脏仓库，可纳入 CI；③ `POLYSEMY_TABLE` 键数 36 → 42，若日后给该维度写文档说明需同步此数。
