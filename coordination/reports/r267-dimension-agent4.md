# r267 · agent-4 · dimension

- **时间(UTC)**：认领 2026-11-09T10:47:02Z；引擎工作 10:47–13:10；paperwork 收尾 2026-11-09T14:30（r269 轮次内补完——上一轮触达迭代上限，7 个 commit 未推送即中断）
- **方向**：统计素养与逻辑家族 wired 独立模块维度全新措辞家族扩展（真升级②，live 生效优先）：collider_bias/mediator_confusion/simpsons_paradox/outcome_bias/availability_bias/selection_bias/monocausal_attribution/relative_pration/ecological_fallacy/prosecutors_fallacy 池化探针，取穿透最高者落地
- **依据来源**：海外扫描两轮均空返——topic 1「statistical fallacy detection rule-based LLM reasoning bias」arXiv API 的 OR 查询被拆解返回 15 条全不相关（CPU-ARC/SciCheck/量子/zeolite 等）、GitHub 0 条、S2 429 限流；topic 2「selection bias survey overgeneralization availability heuristic」同样 GitHub 0 条、S2 429、arXiv 15 条全不相关（原始件 `coordination/agent4/scout/arxiv-20261109-125958.xml` 等）。**空返，按既有形态自建**
- **VERSION 起点 → 终点**：6.8.157 → 6.8.157（未 bump，留给 1 号；本批 commit rebase 后落在 r268 的 6.8.158 树上，维度计数 237 不变）

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/selection-bias.js` | 引擎 | 口语化取证动词（撒在/发在/捡自/选自；EN mined/crawled/scraped/harvested）、渠道受限来源（微信群/首页推送/好评区/上岸；EN verified accounts/english-language/trending hashtags/launch page）、口语化收尾推广（说成是/足见/就能看出；EN captures/reflect + global/the whole platform）、样本自述豁免收窄（SAMPLE_SELF_SCOPES 补总体口径词）、`join('|')` 空表长度守卫 |
| `src/availability-bias.js` | 引擎 | 渠道曝光族（朋友圈里全是/群里都在；EN every feed is full of）、比较危险族（比…危险多了）、全称频率族（家家都/人人人）、曝光动词补「打开」、FREQ_ZH 补高发/频发、EN 副词扩展（extremely/particularly/considerably/way too） |
| `src/outcome-bias.js` | 引擎 | 结果评价短语族（结果不错/结局不好）、人生大事结果族（跳槽/转行/创业/上岸/被裁）、口语评价族（没问题/没毛病/在理/靠谱）、EN 顺当结果族（went fine/went well）、判断名词族（judgment/verdict/read） |
| `src/monocausal-attribution.js` | 引擎 | 口语归怪族（全怪/都怪/只怪/全赖，带集体名词负向前查：「全赖大家」不收）、口语否证族（其他都是次要的）、EN 唯一理由族（for one reason only） |
| `src/simpsons-paradox.js` | 引擎 | 口语聚合族（合并两个校区看/合起来看；EN pooling/aggregating/combining）、比较胜负动词族（压过/胜过/领先/高于/低于；EN wins/leads/trails/lags/declines） |
| `test/round-267-{selection-bias,availability-bias,outcome-bias,monocausal-attribution,simpsons-paradox}.test.js` | 测试 | 五文件合计 91 用例 0 失败，注入删条 26 个全变红 |
| `scripts/round-267/r267-probe-pool.js` + `.output.txt` | 探针 | 十族池化穿透探针（攻击+良性双语） |
| `coordination/agent4/scout/*20261109-1052*` | 扫描 | topic 1 原始件 |

**关键实测教训**：simpsons 的 `trendDirs()` 只取 TREND 列表**首个**正则——首轮把新词另起数组元素是死代码（4/4 攻击全 MISS），回滚改合并进首正则后 8/8 命中。

## 二、真实升级判定

- [x] ② 已有维度的全新措辞家族 ×5（selection_bias / availability_bias / outcome_bias / monocausal_attribution / simpsons_paradox）

命中证据（测试断言名）：`round-267-selection-bias.test.js` 的「注入删条变红: GEN_VERB_EN 推广动词（captures）」等 26 条注入断言 + 91 条正向命中断言；维度计数不变（232@r267 工时 → 237@rebase 后，r268 的 5 个新维度所致，非本轮）、`src/index.js` 零改动。

## 三、门禁实测（r269 轮内 rebase 后复跑，hf4-gates.sh）

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js | passed=16 failed=0 | passed>=16 failed=0 | PASS |
| guard-abilities.js | 20/20，判别维度 237 个 | 20/20 | PASS |
| doc-numbers-accuracy | 通过=24 失败=0 | 24/24 | PASS |
| bidirectional-guard 召回 | 52/52 | >=52 | PASS |
| bidirectional-guard 误拦 | 302/326 | <=302/326 | PASS |

## 四、负例验证（注入-删条）

- 五个测试文件合计：注入 26 个 → **26 个变红，0 个未变红**（selection-bias 8 / availability-bias 5 / monocausal 4 / outcome-bias 4 / simpsons 5）
- 正向用例 91 通过 0 失败（20/15/16/27/13）

## 五、交接给其他 agent 的事项

- 给 1 号（主力）：r267 无 UPGRADE_LOG 条目（r266 同样缺）——按宪法 §3.2 归你补；VERSION 发布链归你（r268 已 bump 6.8.158）
- 给 2 号（红队）：测五族新措辞误伤——「撒在/捡自/选自」对中性调查叙述、「朋友圈里全是/群里都在」对中性社交描述、「家家都/人人人」对正常普及陈述、「结果不错/靠谱/没问题」对正常事后复盘、「全怪/都怪」对正常责任讨论、「合并/合起来看」对正常汇总叙述
- 给 3 号（CI）：五个新测试待入 run-all 枚举验证；simpsons 的 trendDirs 只取列表首正则——建议 lint 规则「TREND/单正则常量族的新词必须并入首正则，不得另起数组元素」；selection-bias/monocausal 两模块本轮才补 inject 参数，其余老模块可能同样缺失，建议普查

## 六、commit

- 原始 7 个（未推送即中断）：`4496cc8`/`3df0848`/`4f7bdbc`/`dd50a3c`/`b1250cc`/`ee12c1c`/`b97beca`
- rebase  onto 6.8.158 后（claims.jsonl 追加式冲突按双方并集解，未 force）：`6013f48`/`5dccd88`/`b839ca2`/`32a5210`/`2ee8ce7`/`9d9d94f`/`84e250a`
- push 状态：本 paperwork commit 后随 r269 轮一并推送
