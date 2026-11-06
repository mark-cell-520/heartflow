# r236 · agent-4 · dimension

- **时间(UTC)**：2026-11-06 22:10 认领 → 22:21 推送（全程无冲突、无掉线）
- **方向**：经济与资源推理三候选探针定夺——A 货币幻觉（名义-实际混同）/ B 赢家诅咒（竞价胜出当价值证据）/ C 激励反噬（量化奖惩滋生反向行为）
- **依据来源**：**空返，按既有形态自建**。r236 海外扫描（原始证据 `coordination/agent4/scout/*20261106-2211{12,13,14}*`）：arXiv OR 噪声查询 15/15 均为无关最新论文（money illusion / winner's curse / perverse incentive 无一相关）、GitHub repos 三查询均 0 命中、Semantic Scholar 三次均 HTTP 429 限流空返。判据为心虫自有纯规则实现（家族定义取自行为经济学/公共政策标准描述：perverse incentive / cobra effect——按计数设计的奖惩系统性奖励「被计数的行为」而非所欲目标）
- **VERSION 起点 → 终点**：6.8.145 → **6.8.145（未 bump**：模块未接线、维度计数 214 不变，递增留 1 号）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/perverse-incentive.js` | 新建（412 行） | 激励反噬维度，provisional 224，**未接线** |
| `test/perverse-incentive.test.js` | 新建 | 11 断言组全过 |
| `coordination/agent4/probes/r236-zerohit-probe.js` | 新建 | 三候选族零命中竞品探针（v6.8.145 gate() 全 findings） |
| `coordination/agent4/probes/r236-fp-stress.js` | 新建 | C 族 12 条疑难良性误伤压力 + A/B 记录 |
| `coordination/agent4/probes/r236-module-dryrun.js` | 新建 | 模块层干跑（攻击 14/14、良性 22/22、边界 8/8） |
| `coordination/agent4/probes/r236-benign-corpus-check.js` | 新建 | 官方 326 条良性语料模块层零误伤核查 |
| `coordination/claims.jsonl` | 追加 | r236 认领 + completed |
| `coordination/agent4/scout/*20261106-2211{12,13,14}*` | 原始证据 | 三 topic 扫描空返存证 |

## 二、真实升级判定

- [x] ① 新判别维度（新 dimMap 键 `perverse_incentive` 独立匹配此前没有的家族）
- [ ] ② 已有维度全新措辞家族
- [ ] ③ 接线已加载未调度能力
- [ ] ④ 新 MCP 工具 / dispatch 路由

命中证据（函数名 + 测试断言）：`detectPerverseIncentive(text, inject)`（`src/perverse-incentive.js`）。三腿共现判据——腿①量化激励/奖惩设计锚点（悬赏/重赏/赏金；按X(数量|次数|件数|人头|销量|条数|单量|结案数|合同数…)计酬|发奖金|提成|收费|罚款|考核；按率/量/数+给|发|奖；罚款按次；考核+计数指标；EN paid per / per-unit / bounty / reward for each / fined per / bonus tied to / quota）× 腿②反向行为滋生（养蛇/鼠再交/领赏；刷单/自己进货/自买自卖/数据造假/注水；包月违规；专挑简单案子；只盯上榜；放鼠再抓；凑数/拆单；EN bred the snakes / released rats and recaptured / gaming the metric / padded the numbers / cherry-picked the easy cases / bought their own products）× 腿③认可/正面结果断言（效果好/成效显著/事半功倍/效率提升/成绩提高/指标完成/超额完成/双赢/制度成功/照发/很快缓解/迎刃而解/收入增加；EN worked / as intended / boosted / hitting their quotas / win-win / rewards were paid）。腿①×腿②、腿②×腿③分别落在近距离窗内（ZH 60 字 / EN 180 字符）；腿②腿③的否定前缀（预防刷单/严查/效率并未提升）不计；同子句内 ≤12 字无句读相隔的多个 ① 锚点聚簇为一个设计（悬赏/赏金不重复计数）。测试断言：`攻击命中：中文 8 条` / `攻击命中：英文 6 条`（`dimension==='perverse_incentive'`、score 0.6–0.8、evidence/guidance 非空）。

## 三、门禁实测

```
node bin/verify.js                    → PASS 16/16
node scripts/guard-abilities.js       → PASS 20/20（判别维度 214 个，不变）
node test/doc-numbers-accuracy.test.js → PASS 24/24
node scripts/bidirectional-guard.js   → PASS 召回=52/52 误拦=301/326
```

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | passed=16 failed=0 | >=16 / 0 | PASS |
| guard-abilities.js | 20/20，维度 214 | 20/20 | PASS |
| doc-numbers-accuracy | 24/24 | 24/24 | PASS |
| bidirectional 召回 | 52/52 | >=52 | PASS（与 r232–r235 基线逐位一致，零漂移） |
| bidirectional 误拦 | 301/326 | <=302/326 | PASS（零漂移） |

四门禁全绿（`coordination/agent4/probes/r236-gates.json`）。全量 run-all（后台跑完，`coordination/agent4/probes/r236-runall.output.txt`）：**19336 通过 / 97 失败 / 共 19433**——相对 r235 基线 19325/97/19422 **恰好 +11（即本模块 11 断言组）、失败数 97 逐位不变、零新增**，失败文件清单与 r235 逐位一致（78 个，同为既有 MCP 超时/变更-突变/`unsupported-claim-exemption` 预存族）。`data/test-count.json` 按协议还原文档基线 12911/108。

## 四、负例验证（注入-删条）

- 注入 **14** 个：**14 个全部按预期**（0 个未变红）
  - 六组三腿族删除（INCENTIVE_ZH/GAMING_ZH/ENDORSE_ZH/INCENTIVE_EN/GAMING_EN/ENDORSE_EN 置空数组）→ 对应中/英攻击句全部不再命中（hit=false，断言失败态）；
  - 两组豁免删除（PROBLEM_ZH/PROBLEM_EN/META_ZH/META_EN 置 NEVER）→ 问题化句、元话语句全部变红（hit=true）；
  - 距离窗承重：OVERDIST 默认窗 ZH60 不命中、注入 PAIR_ZH=500 后命中。
- 未变红清单与原因：无。

构造期修复 **6 个模块级真实缺陷**：①-b 词序倒置漏判（「按结案数量考核」数量在考核前）补 考核/考评/评比/计分 动词位 + ①-b2 按率/量/数+给/发/奖 新模式；②-a 逗号断匹配（「养起老鼠来，交一头」gap 排除逗号致漏判）改允许逗号；③-b 补成绩/分数/数据提升族；③-g 补迎刃而解族；EN ① 补 bonus for each / paid a bonus for each；EN ③-b 补 collections/scores/grades/income 结果名词。另修 1 个计数缺陷：同子句多 ① 锚点重复计数（混排句 count=3≠2）→ clusterIncentives 聚簇（一子句一签名）。测试句修正 0 处（全部一次通过）。

## 五、交接给其他 agent 的事项

- **给 1 号（主力）**：接线规格——`const _PI = _lazy('perverse_incentive', () => require('./perverse-incentive.js'))` 懒注册；dimMap 键 `perverse_incentive`；VERIFY_DIMS 登记 provisional **224**；调用 `new (_PI().detectPerverseIncentive)(text)` 或直接 `_PI().detectPerverseIncentive(text, null)`（模块导出为函数非类，第二参负例专用、传 null 即可）；`.score ?? 0` 判空。**未接线草稿模块 backlog 增至 12 个**（+perverse_incentive；zero_sum/budget_value/average_marginal/conditional_transposition/anonymous_source/broken_window/automation_bias/p_hacking/appeal_to_future/effort_justification/mental_accounting/perverse_incentive），建议 claims 加号段预占免 provisional 编号撞车（r218/r219 草稿曾按 212/213 占号）。`unsupported-claim-exemption.test.js` 预存失败仍待修（r230 即在）。
- **给 2 号（红队）**：测近邻变体应全不判——「悬赏捕蛇导致村民养蛇领赏，政策适得其反，已被叫停」（问题化）、「按次数罚款会诱导企业包月违规，这是制度设计的漏洞」（正当批评，无认可腿）、「设计量化考核时要预防刷单和数字造假」（防范建议）、「保险公司已改为按结案质量而非数量考核」（正当改革）、「按销量发奖金，员工自己进货刷单，效率并未提升」（认可腿被否定前缀拦下）、「按销量发奖金，但要严查自己进货刷单，效率才能真实提升」（反向行为腿被否定前缀拦下）、「按数量发奖金，调动了大家的积极性」（缺腿②）、「KPI 完成了，说明目标肯定达成了」（proxy_metric_goal 领地）、「我们把考核指标换成了留存率，而不是下载量」（reward_hacking 领地）。重点测**合规/反舞弊/审计语境的中性陈述**（发现问题→查处→整改闭环）与**正当的按效果付酬叙述**（按质量/满意度/里程碑结项）不应误伤。
- **给 3 号（CI）**：README 横幅 12,911/108 vs 实测口径仍待同步；草稿模块待接线清单增至 12 个建议文档单列；run-all 本轮一次前台 420s 超时被杀（无孤儿进程）、改后台跑完，MCP 超时失败族仍疑环境抖动，建议 CI 注意测试进程回收/超时容忍或独立车道。

## 六、commit

- `git rev-parse --short HEAD`：977ecf3（claim）→ ac625a6（模块+测试+扫描证据）→ 本提交（报告+claims completed+门禁/runall 输出）
- push 状态：**已推送**（`git ls-remote` 独立校验 HEAD==heartflow/main；工作树干净）
