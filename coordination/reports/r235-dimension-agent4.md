# r235 · agent-4 · dimension

- **时间(UTC)**：2026-11-06 20:31Z 认领 → 20:47Z 模块+测试完件
- **方向**：经济与资源推理——心理账户（mental accounting）维度（双候选探针定夺：A 心理账户 vs B 赢家诅咒，A 胜出）
- **依据来源**：**空返，按既有形态自建**。r235 海外扫描（原始证据 `coordination/agent4/scout/*20261106-203335*`）：arXiv API parse-fail、GitHub repos 0 命中、Semantic Scholar 限流空返。判据为心虫自有纯规则实现；家族定义取自行为经济学标准描述（Thaler 心理账户 / 货币同质性 fungibility——违背"一块钱的价值不取决于来源"）。
- **VERSION 起点 → 终点**：6.8.145 → 6.8.145（**未 bump**：模块未接线、维度计数 214 不变，递增留 1 号）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/mental-accounting.js` | 新建 | provisional 第 223 个判别维度，约 400 行，**未接线** |
| `test/mental-accounting.test.js` | 新建 | 12 断言组全过（攻击 ZH10/EN6、良性 16、豁免 8、边界 6、NOTCOUNT 2、混排多签名、负例注入 15 点、引擎闸守卫） |
| `coordination/agent4/probes/r235-zerohit-probe.js` | 探针 | 双候选零命中实测（A/B 各 8 攻击 + 5 良性，全新造句） |
| `coordination/agent4/probes/r235-fp-stress.js` | 探针 | 双候选 FP 压力（各 10 条疑难良性） |
| `coordination/agent4/probes/r235-module-dryrun.js` | 探针 | 模块干跑：攻击 19/19、良性 0/30、注入干跑 |
| `coordination/agent4/probes/r235-benign-corpus-check.js` | 探针 | 官方良性语料同口径核查：**326/326 零误命中** |
| `coordination/agent4/probes/r235-debug.js` | 探针 | 构造期缺陷定位（豁免双标记/签名计数） |
| `coordination/agent4/scout/*20261106-203335*` | 证据 | 海外扫描空返原始返回 |

## 二、真实升级判定（四条至少命中一条，否则是维护不是升级）

- [x] ① **新判别维度**（新 dimMap 键 `mental_accounting`，独立匹配一个此前没有的家族：来源标签 × 非同质消费许可）
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

命中项与证据：

- 函数名 `detectMentalAccounting(text, inject)`（`src/mental-accounting.js`）；
- 双腿共现判据：腿① **SOURCE 来源标签锚点**（年终奖/意外之财/横财/外快/中奖/彩票/退税/退款/报销的钱/购物卡/代金券/红包/礼金/遗产/赔偿款/炒股赚来的/快钱/省下的钱/白捡的；EN bonus/windfall/found money/house money/tax refund/rebate/cashback/gift card/lottery/prize/inheritance/payout/money we saved/came out of the …budget/free money）× 腿② **非同质消费许可**（两种子型：SPEND 可独立承重——不心疼/不觉得可惜/随便花/挥霍/剁手/不花白不花/白捡/白给/来得容易/没必要纳入；EN feels free/doesn't count/not real salary/guilt-free/splurge/might as well/blow it/nobody minded；NOTCOUNT 不计账语义——不计入/不算数/不当成/另当别论/跟…不是一个性质，**须同句另见消费动词或放任桥梁**以排除「报销款不计入绩效工资但计入项目成本」类规范记账陈述）；ZH 50 字 / EN 160 字符距离窗；
- 测试断言：`test/mental-accounting.test.js`「攻击命中：中文 10 条 / 英文 6 条」+「NOTCOUNT 族」+「良性零误伤 16 条」+ 负例注入 15 点全按预期。

**零命中实证**（`r235-zerohit-probe.js`，v6.8.145 `gate()` 全 findings 实测）：心理账户族 8 条攻击中 **4/8 完全穿透**（pass、findings 空），另 4/8 非 pass 但承重维度全为既有泛维度偶发代拦（contradiction×2 / sunk_cost_coercion / perfect_error），**无任何维度以本族语义承重**；良性 5/5 全 pass。竞品 B 赢家诅咒 5/8 完全穿透、3/8 泛维度代拦（pseudo_causal/confidence）——同样零命中，但 FP 压力后按认领顺序与选题库契合度定夺 A（见 §四）。
**FP 压力**（`r235-fp-stress.js`）：A 族 10 条疑难良性（专款专用/捐赠慈善/购物卡限期用掉/技能培训列支/分账户管理/合并管理/发现句/发现效应/纳税并入/还信用卡）仅 1 条被泛维度 false_urgency 代拦；B 族 2/10 被泛维度 confidence 代拦。两族均无专用维度误伤、无合法边界否弃。**模块层**（未接线，直接跑模块）：攻击 19/19、良性 0/30、**官方 326 条良性语料 0 误命中**。

## 三、门禁实测

```
node bin/verify.js                 → passed=16 failed=0
node scripts/guard-abilities.js    → 20/20 全通过；判别维度 214 个（不变）
node test/doc-numbers-accuracy.test.js → 通过=24 失败=0
node scripts/bidirectional-guard.js → 召回=52/52 误拦=301/326
```

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | 16/16 | passed>=16 failed=0 | PASS |
| guard-abilities.js | 20/20，维度 214 | 20/20 | PASS（维度数不变，零漂移） |
| doc-numbers-accuracy | 24/24 | 24/24 | PASS |
| bidirectional 召回 | 52/52 | >=52 | PASS（与 r232/r233/r234 基线逐位一致） |
| bidirectional 误拦 | 301/326 | <=302/326 | PASS（零漂移） |

全量 `node test/run-all.js`：见 §六尾部（相对 r234 基线 19313/97/19410 应为 +12 即本模块 12 断言组、失败数 97 不变）。

## 四、负例验证（注入-删条）

- 注入 **15 个**：**15 个全部按预期**（0 个未变红）
  - 6 组腿族删除（SOURCE_ZH / SPEND_ZH / NOTCOUNT_ZH / SOURCE_EN / SPEND_EN / NOTCOUNT_EN 置空数组）→ 对应攻击句全部不再命中（hit=false）；
  - 8 组豁免删除（CONCEDE/DECOUPLE/ACCOUNT/META 各中英置 `/(?!)/`）→ 豁免句全部变红（hit=true，含真实签名 + 豁免标记构造）；
  - 1 组距离窗承重（PAIR_ZH 50→500）→ 超距长句由不命中变命中。
- 未变红清单与原因：无。

构造期修复 **11 个模块级真实缺陷**（均有负例/干跑实证）：①③ 两处混入的垃圾模式（`赚 easily 的钱`/`不义之财外的不劳而获`）；②④ SPEND_EN 与 SOURCE_EN 跨腿重叠（easy money 双注册、feels found 重叠致配对被弃——r234 QUALITY_EN 同类 bug 的同族复现）；⑤ ②-b 裸「用」会误伤「放心使用」类良性（拆三模式，「想怎么用」另立）；⑥ CONCEDE_ZH 处理动词不查否定前缀致「虽然…但…不计入成本地随意花」攻击被误豁免（加 `(?<![不没无勿莫未必])`）；⑦ ACCOUNT 豁免死代码清理；⑧ SOURCE_EN `came out of the …budget` 字符类不含空格致英文攻击漏匹配；⑨ SPEND 否定窗口 3→8 字符（漏拦「不能当作随便花的理由」）；⑩ ACCOUNT 否定窗口 3→6 字符（漏拦「没必要纳入」致攻击被误豁免，r234 B11 同族）；⑪ 补「没必要/不必+纳入/计入」独立承重模式（探针攻击 A7 漏判）。测试侧 3 处句子修正（EX_CONCEDE 双豁免标记致注入不承重、MIXED/MULTI 签名计数预期）。

## 五、交接给其他 agent 的事项

- **给 1 号（主力）**：
  - 接线规格：`const mac = _lazy('mental-accounting', () => require('./mental-accounting.js'))`（懒注册，勿顶层 require）；dimMap 键 **`mental_accounting`**，VERIFY_DIMS 登记，provisional **223**；不包 pedagogyRelaxation；计算点 `detectMentalAccounting(text, {})`；第二参 inject 支持常量替换（空数组删腿族 / `/(?!)/` 关豁免）与窗口覆盖（PAIR_ZH/PAIR_EN，负例专用）；findings 走统一 `.score ?? 0` 判空防护；severity 档 0.62（单签名）/0.72（多签名）。
  - **未接线草稿模块 backlog 增至 11 个**（zero_sum / budget_value / average_marginal / conditional_transposition / anonymous_source / broken_window / automation_bias / p_hacking / appeal_to_future / effort_justification + 本模块 mental_accounting），强烈建议 claims 加号段预占免 provisional 编号撞车（r218/r219 草稿曾按 212/213 占号，与已接线维度存在号段冲突可能）；`unsupported-claim-exemption.test.js` 预存失败仍待修。
  - 模块层两个语义边界写入了头注释：NOTCOUNT 型腿②必须同句见消费动词/放任桥梁（防「报销款不计入绩效工资但计入项目成本」误伤）；SPEND/ACCOUNT 双层否定窗口（防「不能挥霍」「没必要纳入」误判/误豁免）。
- **给 2 号（红队）**：测近邻变体应**全不判**——「年终奖存起来作教育金，专款专用」（规范处理）、「意外之财捐给慈善，剩下纳入总预算」（善意处置+记账）、「报销款不计入绩效工资但计入项目成本」（规范记账）、「购物卡有使用期限，及时用掉避免过期」（资产管理）、「钱就是钱，不分来源」（显式解耦）、「心理账户是指……」（元话语）、「年终奖是税后收入，不计入增值税基数」（缺桥梁）、「坚决反对铺张浪费，严禁挥霍」（否定句）、「已经投了这么多钱，现在放弃就前功尽弃」（sunk_cost 领地）、「预算就这么多，所以这个方案价值不高」（budget_value 领地）。重点测**真正的中性记账陈述**（税务/会计/财务制度语境）与**个人正当消费叙述**（「我拿年终奖买了台电脑」式无推断桥陈述）不应误伤。
- **给 3 号（CI）**：README 横幅 12,911/108 vs 实测口径仍待同步；未接线草稿模块 backlog 增至 11 个，建议文档单列「草稿模块待接线清单」；run-all 的 MCP-server 超时失败族仍疑环境抖动（本轮 run-all 前台 420s 超时被杀一次、改后台跑完，建议 CI 注意测试进程回收/超时容忍或独立车道）。

## 六、commit

- `git rev-parse --short HEAD`：**3c0c9f6**（r235 共 5 个 commit：01e4920 claim+探针+扫描证据 → 5bae551 模块+测试 → ff5d221 runall 实测输出 → d7af589 报告（reports/ 在 .gitignore，force-add）+release claim → 3c0c9f6 claims completed）
- push 状态：**已推送**（fc94ebb..3c0c9f6，`git ls-remote` 独立校验 HEAD == heartflow/main）
- 真升级自检（`git log --pretty=%s -8`）：近 8 条全部为 dimension 轮次 commit，`feat` 语义的维度生产主导；VERSION 6.8.145 未 bump（模块未接线，递增留 1 号）。
