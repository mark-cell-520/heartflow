# r237 · agent-4 · dimension

- **时间(UTC)**：2026-11-06 23:42 → 23:55
- **方向**：经济与资源推理/科学推理四候选，探针零命中 + 草稿去重定夺
- **依据来源**：空返，按既有形态自建。r237 海外扫描两次（原始证据 `coordination/agent4/scout/*20261106-2343{32,39}*`）：arXiv "automation bias over-reliance" 与 "broken window fallacy opportunity cost" 两次查询均 parse-fail（查询被 OR 噪声化，15 条返回均为无关最新论文）、GitHub repos 两次 0 命中、Semantic Scholar 两次 429 限流。判据为心虫自有纯规则实现（家族定义取自拍卖理论/行为经济学标准描述：winner's curse / 赢家诅咒——共同价值拍卖里赢家恰是估值最乐观者，竞标胜利本身是「出价过高」的证据而非「标的物值这个价」的证据）。
- **VERSION 起点 → 终点**：6.8.145 → 6.8.145（未 bump：模块未接线、维度计数 214 不变，递增留 1 号）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/winners-curse.js` | 新建 439 行 | 赢家诅咒检测器（provisional 225，**未接线**），双腿共现判据 |
| `test/winners-curse.test.js` | 新建 175 行 | 11 断言组全过（攻击中英 12 / 疑难+常规良性 23 / 概念讨论豁免 2 / 边界锁 8 / 混排多签名 / 负例注入 3 组 / 引擎闸守卫） |
| `coordination/agent4/probes/r237-*.js/.txt` | 新建 | 零命中探针、候选去重验证、专项探针+FP 压力、模块干跑、官方良性语料核查、门禁 JSON、测试输出 |
| `coordination/agent4/scout/*20261106-2343{32,39}*` | 新建 | 两次海外扫描原始证据（空返） |

## 二、真实升级判定

- [x] **① 新判别维度**（新 dimMap 键 `winners_curse`，独立匹配此前没有的家族）
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未被调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

命中项与证据：

- **函数**：`detectWinnersCurse(text, inject)`（`src/winners-curse.js`，第二参负例注入专用传 null/注入对象）。
- **零命中实证**（`r237-zerohit-probe.js` + `r237-wc-probe.js`，v6.8.145 `gate()` 全 findings，全新造句、全部避开绝对词）：认领方向四候选竞品——A 自动化偏误攻击 6/7 穿透，但 `src/automation-bias.js`（r231 草稿）已存在；B 破窗谬误 3/4 穿透，但 `src/broken-window-fallacy.js`（r230 草稿）已存在；C 零和谬误 4/4 穿透，但 `src/zero-sum-fallacy.js`（r218 草稿）已存在——三族再起草属重复而非新维度，整体落选（`r237-draft-coverage.js` 实测：三个既有草稿对我方新鲜攻击句覆盖仅 0/7、0/4、1/4，但「草稿已占号」这一事实不因覆盖窄而改变，重复起草不产生新 dimMap 键）。**D 赢家诅咒攻击 7/10 完全穿透**（余 3 条为 confidence/pseudo_causal 泛维度偶发代拦，无任何维度以「竞价胜利 × 价值推断」双腿语义承重），且 `src/` 下无任何 winner/curse/auction 相关文件（实测确认）——D 胜出。
- **判据**（双腿共现，缺一不判）：腿① WIN 竞价/招标/拍卖胜利（中标/竞得/拍得/拍下/夺标/标王；(竞标|投标|招标|竞拍|拍卖)×(赢|胜|成功|拿下|夺魁)；(赢|胜|拿下|夺得)×(竞标|投标|招标|竞拍|拍卖|标的)；(出价|报价|投标|竞价)×(赢|胜出|胜了|拿下)；(招标|投标|竞标|评选|评比)×排名×第一；EN won the auction/bid/tender、winning bid、outbid、came out on top in the tender、(our|we) bid (was) (accepted|selected|chosen)、we were selected as the winner）× 腿② VALUE-INFERENCE 价值/判断力推断（(说明|证明|意味着|表明|可见|足以证明)×(值这个价|被低估|估值合理|报价合理|性价比|捡漏|抄底|确实好|真的好|最佳选择)；(判断|眼光|决策|估值|方案|选择|出价)×(得到验证|没错|正确|精准|高明)；(市场|业主|客户|买家|评标委员会)×(认可|接受|认了)×(价格|报价|成本|估值)；EN (confirms|proves|shows|means|demonstrates|suggests)×(worth|undervalued|fair|correct|right|validated|best value)、(so|thus|therefore|hence)×(undervalued|worth it|bargain|a steal)、(got|landed|found) a (real) (bargain|steal|deal)、(our|my) (judgment|valuation|call|decision) was (validated|confirmed|vindicated)、(market|seller|client) (recognized|accepted|validated) the (price|value|valuation|offer|cost)）；两腿落在近距离窗（ZH 60 / EN 180）；腿②否定前缀不计（不等于估值正确/能否说明/不能证明；EN does not prove / not that the price was right，span 内 + 匹配前 45 字符双窗）；概念讨论豁免（赢家诅咒/winner's curse/最乐观的投标人，中英撇号 ASCII+U+2019 双形）。VERIFY 级。
- **测试断言证据**：`test/winners-curse.test.js` 攻击命中中英 12 条全部 `hit===true` 且 `dimension==='winners_curse'`；良性 23 条全部 `hit===false`；负例注入四组腿族删除后攻击全部不再命中、两组豁免删除后豁免句变红、距离窗放大 500 后长距句命中。

## 三、门禁实测

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | passed=16 failed=0 | passed>=16 failed=0 | PASS |
| guard-abilities.js | 能力检查 20/20；判别维度 214 个 | 20/20 | PASS（214 不变） |
| doc-numbers-accuracy | 通过=24 失败=0 | 24/24 | PASS |
| bidirectional-guard 召回 | 52/52 | >=52 | PASS |
| bidirectional-guard 误拦 | 301/326 | <=302/326 | PASS（与 r232–r236 基线逐位一致，零漂移） |

（`hf4-gates.sh --json` 全量输出存 `coordination/agent4/probes/r237-gates.json`。）

## 四、负例验证（注入-删条）

- 注入 **7 个：7 个全部按预期**（4 组两腿族删除——WIN_ZH/VALUE_ZH/WIN_EN/VALUE_EN 删除后攻击全部不再命中；2 组豁免删除——CURSE_ZH/CURSE_EN 替换为永假正则后概念讨论句变红；1 组距离窗承重——放大到 500 后长距句命中），0 个未变红。
- 未变红清单与原因：无。
- 构造期修复 3 个模块级真实缺陷：① EN 语言侧漏开否定检查（`useNeg` 原仅对 ZH 生效，导致「only means we bid highest, not that the price was right」误判——改双腿统一启用）；② CURSE_EN 撇号仅匹配 ASCII，U+2019 变体漏豁免（补 `['\u2019]` 字符类）；③ 边界句「这次中标证明报价合理，但能否说明值这个价尚未可知」首腿未否定致自身可命中（改句为「不能证明…能否说明…双否定」并补 NEG 词 能否/可否）。

## 五、模块层与误拦面实测

- **模块干跑**（`r237-module-dryrun.js`）：攻击 **12/12** 命中；疑难+常规良性 **20/20 零误伤**；边界锁 **8/8**（appeal_to_wealth / confidence / proxy_metric_goal / 体育非竞价胜利领地不越界）。
- **官方良性语料**（`r237-benign-corpus-check.js`，bidirectional-guard 同口径四集合）：**合计 326 条良性，模块误命中 0 条**（gate-97 四类 77 + ext 三类 74 + benign-vert 150 + benign-mixed 25）。
- **全量 run-all**（`r237-runall.output.txt`，后台跑完）：**19347 通过 / 97 失败 / 共 19444**——相对 r236 基线 19336/97/19433 **恰好 +11（即本模块 11 断言组）、失败数 97 逐位不变、零新增**；`data/test-count.json` 已还原至文档基线 12911/108。

## 六、交接给其他 agent 的事项

- **给 1 号（主力）**：接线规格——`_WC` 懒注册 `const _WC = _lazy('winners-curse', () => require('./winners-curse.js'))`；dimMap 键 `winners_curse`；VERIFY_DIMS 登记 provisional **225**；模块导出为函数 `detectWinnersCurse(text, inject)`，第二参负例专用传 null；`.score ?? 0` 判空；维度计数 214→215 需 1 号同步 README/SKILL/AGENTS 三处与 `scripts/measure-claimed-numbers.js` 口径。**未接线草稿模块 backlog 增至 13 个**（+winners_curse；zero_sum/budget_value/average_marginal/conditional_transposition/anonymous_source/broken_window/automation_bias/p_hacking/appeal_to_future/effort_justification/mental_accounting/perverse_incentive/winners_curse），强烈建议 claims 加号段预占免 provisional 编号撞车；另请注意 r218/r230/r231 三个旧草稿对我方新鲜攻击句覆盖仅 0/7、0/4、1/4，接线前建议按本轮探针句扩写其措辞常量；`unsupported-claim-exemption.test.js` 预存失败仍待修。
- **给 2 号（红队）**：测近邻变体应全不判——「竞标成功只说明我们出价最高，不等于估值正确，还要留足安全边际」（谦逊纠偏）、「赢了拍卖不等于捡漏，赢家往往是最乐观的那个，要防赢家诅咒」（概念讨论+纠偏）、「中标之后先核算成本，价格是竞争出来的，不是价值算出来的」（正当复核）、「我们以低于评估价的价格中标，预算省下来了，按合同履约即可」（事实陈述）、「公司中标后股价上涨，说明市场看好公司前景」（市场反应，非标的物估值）、「我们赢得了这场比赛，说明训练方案有效」（体育非竞价）、「Winning the auction only means we bid highest, not that the price was right」「We won the tender at below assessment price; now we just deliver the contract」；重点测**招标/采购/尽调语境的中性陈述**与**低于评估价成交的正当战绩叙述**不应误伤，以及「赢比赛/夺冠/win the championship」等非竞价胜利混入价值词（「夺冠说明我们实力最强」）的边界。
- **给 3 号（CI）**：README 横幅 12,911/108 vs 实测口径仍待同步；草稿模块待接线清单增至 13 个建议文档单列；run-all 本轮一次后台跑（前台 420s 超时被杀是老问题），MCP 超时失败族仍疑环境抖动，建议 CI 独立车道/超时容忍。

## 七、commit

- `git rev-parse --short HEAD`：b4bdaaa（claim 977… 见 claims.jsonl；本 commit 含 src/winners-curse.js + test/winners-curse.test.js + 探针 + 扫描证据）
- push 状态：见最终投递报告（`hf4-push.sh`，隐私闸 + 独立校验 HEAD==heartflow/main）
