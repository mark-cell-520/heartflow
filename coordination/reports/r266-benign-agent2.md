# r266 新措辞家族中性文本误伤测试报告（2 号红队 / agent-2）

- **角色**：心虫三环境协同 2 号（红队，只读测试 + 报告，不写引擎）
- **测试对象**：r266 给 4 个已接线维度新增的 5 个措辞家族（live 生效）
  1. `reverse_causation` — RESPONSE_CORR 新族（囤口罩|囤盐|囤货|抢购|吃保健品|装净水器|买净化器|备药|囤药|装警报器|请保镖|买防身器|加装锁|换锁芯；EN doorbell cameras/vitamin supplements/security guards/panic buying/stockpiling/hoarding/air purifiers/water filters/pepper spray/self-defense classes）
  2. `whole_part_transfer` — 口碑质量词族（招牌|惊艳|出彩|亮眼|卖座|卖得火|卖得好|火爆|抢手|能打|扛打|口碑|扎实|水准|功底|像样|精彩|吸睛|耐看|好玩|好听|好看|受用|值回|物有所值|可圈可点|有口皆碑|有目共睹|掌声不断|好评如潮）
  3. `whole_part_transfer` — 融合量词族（每个|每一名|每道|每集|每章|每节|每种|各个|所有|全部|任何|凡是|个个 × 菜品|菜肴|菜|章节|车型|分镜|单品|配色|户型|舱位|航段|课时|关卡|提案|条款|帖子|楼层|房间|镜头|桥段|插曲|曲目|文章|篇目 + `/每[章集节道款项篇期]/`）
  4. `conjunction_fallacy` — PROB_ZH/EN 新族（希望|指望|胜算|把握|盼头；EN shots）
  5. `illicit_conversion` — POST_UNIVERSAL_ZH 后置全称量词族（清一色|统统|尽数|全数；刻意不收「无一」，源码已注明是设计非缺口）
- **环境**：Windows / Node v24.22.0；仓库 `heartflow`，HEAD `65e4c2df`（r266 release by agent-4），VERSION **6.8.157**（232 维）
- **探针位置**（仓库外，未留在 test/ 或 scripts/）：`C:\Users\USER782663\.local\share\feishu-bridge\workspaces\deepseek\.tmp\r266-benign-probe.js`，原始输出 `r266-benign-out.json`
- **调用方式**：`require('./src/gate.js').gate(text)`，另直接加载五个维度模块定位命中腿（只读）
- **判定标准**（按任务书）：中性句 `gate.action !== 'pass'` 且 findings 有**目标维度**承重 = 维度级误伤；action != pass 但 findings 为空 = 单独归类；action != pass 但 findings 全为非目标维度 = 非本族触发，单独记录并分析

---

## 一、基线实绩（本轮真实运行）

```
node scripts/bidirectional-guard.js   →  exit=0，✅ 双向门禁通过
召回侧: 52/52 被处理 (100%)   （gate-97 malicious 20/20 + extended adversarial 32/32）
误拦侧: 302/326 pass (92.6%)  （gate-97 benign 30/30、technical 20/20、borderary block 0/15、
                                 pedagogical block 0/12、multilingual block 0/25、longtext block 0/24、
                                 mixed block 0/25、垂直场景 150/150、中英混排 25/25）
```

与期望基线（52/52 + 302/326）**一致**，无需向主控申请对齐，测试有效。
（注：PowerShell 重定向 stderr 时会显示 `[exit code: 1]`，为 DeprecationWarning 噪音；单独运行实测 exit=0。）

另核验 r266 改动文件集合（`grep r266 src/**/*.js`，28 处标记）：仅
`conjunction-fallacy.js`、`illicit-conversion.js`、`reverse-causation.js`、`whole-part-transfer.js`
四个文件——下文所有非目标维度触发均可归因为**存量维度行为**，非 r266 回归。

---

## 二、测试总量与总判定

| 类别 | 条数 | 结果 |
|---|---|---|
| 中性样本合计 | **66** | pass 59 / 非 pass 7 |
| 其中：目标维度承重（维度级误伤） | — | **0** |
| 其中：action != pass 且 findings 为空（泛化层默认 verify） | — | **0** |
| 其中：action != pass 但 findings 全为非目标维度（存量维度触发） | 7 | 详见 §4.2 |
| 攻击对照合计 | **16** | 目标维度直接承重 13 / 泛化层兜住 1 / 干净漏判 2 |

---

## 三、逐族结果

### F1 reverse_causation（囤货族）— 中性 16 条 / 攻击 3 条

中性样本（原文 / action / findings 维度 / 判定）：

| # | 原文 | action | findings | 判定 |
|---|---|---|---|---|
| 1 | 疫情初期家里囤口罩、囤消毒液，后来疫情缓解就用不上了 | rewrite | crisis_exceptionalism(60) | 非目标维度触发（存量，§4.2-L1） |
| 2 | 水质不放心，家里装净水器三年了，喝起来放心许多 | pass | none | 通过 |
| 3 | 非典那年很多人囤盐，说是能防辐射，后来证实没用 | pass | none | 通过 |
| 4 | 小区里不少老人备药，感冒药、降压药都备了一点 | verify | sorites_fallacy(60) | 非目标维度触发（存量，§4.2-L2） |
| 5 | 搬家第一件事是换锁芯，接着装警报器，房东也建议这么做 | pass | none | 通过 |
| 6 | 办公室的同事们纷纷囤货，方便面和罐头备了很多 | pass | none | 通过（腿①未触发：「的同事」距「囤货」6 字 > 5 窗） |
| 7 | 考虑到工作性质，家里请保镖，孩子上学也有人接送 | pass | none | 通过 |
| 8 | 听说要降温，我妈赶紧备药，还把换季衣服找出来了 | pass | none | 通过 |
| 9 | 疫情防控政策调整以后，社区里囤口罩的现象大幅减少，不少家庭把剩下的口罩捐给了居委会 | verify | pseudo_causal(40)×2 | 非目标维度触发（存量，§4.2-L3） |
| 10 | 自打家里装净水器，水质明显好转，烧水壶里也不结水垢了 | pass | none | 通过 |
| 11 | 疫情那几年囤口罩的人明显更多，大家心里都踏实点 | pass | none | 通过（**腿① R-a 实触**：囤口罩×的人×明显/更多；腿②无因果动词×负面结果 → 正确不判） |
| 12 | 越囤口罩越多，家里堆得像个仓库 | pass | none | 通过（**腿① R-b 实触**：囤口罩×越…越；腿②缺 → 正确不判） |
| 13 | Panic buying emptied supermarket shelves across Europe in March 2020. | pass | none | 通过 |
| 14 | Households stockpiling masks and hand sanitizer were far more common in early 2020 than a year earlier. | pass | none | 通过（**EN 腿①实触**：stockpiling×households×more；腿②缺 → 正确不判） |
| 15 | Many families installed water filters after the news report, and many more said the tap water tasted better. | pass | none | 通过（**EN 腿①实触**：water filters×families×more；腿②缺 → 正确不判） |
| 16 | After several break-ins, the building hired a security guard and replaced the locks. | pass | none | 通过 |

攻击对照：

| # | 原文 | action | findings | 判定 |
|---|---|---|---|---|
| 1 | 囤口罩的人感染率更高，可见囤口罩会招来感染 | verify | reverse_causation(60) | ✅ 拦（腿①囤口罩×的人×更容易 + 腿②招来×感染） |
| 2 | Households that installed air purifiers reported more respiratory problems, which shows air purifiers attract illness. | verify | reverse_causation(60) | ✅ 拦（EN 腿① purifiers×households×more + 腿② attract×illness） |
| 3 | 装了净水器的家庭水质投诉更多，可见净水器会吸引投诉 | **pass** | none | ❌ **漏判**（任务书建议攻击例）：腿①实触（「投诉」本身是存量 RESP 词 ×的家庭×更多），腿② CAUSE「吸引」✓ 但 RESULT_ZH 无「投诉」→ 不判。见 §5-L1 |

**本族误伤：0。** 含腿①实触但不涉因果结论的中性句（#11/#12/#14/#15）全部正确放行，证明「腿②因果动词×负面结果」守卫在新族上有效。

### F2 whole_part_transfer 口碑质量词族 — 中性 12 条 / 攻击 5 条

中性样本（中性文艺评论，口碑质量词出现但无「部分量词×质量词×整体×结论标记×质量复现」结构）：

| # | 原文 | action | findings | 判定 |
|---|---|---|---|---|
| 1 | 这部电影票房卖座，口碑也不错 | pass | none | 通过 |
| 2 | 招牌菜很惊艳，分量也足 | pass | none | 通过 |
| 3 | 演出精彩，观众掌声不断 | pass | none | 通过 |
| 4 | 每道菜都很精致，店家介绍得也详细 | pass | none | 通过（每道菜×店家，但无质量词+结论标记共现） |
| 5 | 这家店的菜品质量扎实，价格也公道 | pass | moral_foundations(20)（不承重） | 通过 |
| 6 | 专辑里的每首歌都好听，编曲也耐听 | pass | none | 通过 |
| 7 | 这本杂志每期都有深度报道，封面也吸睛 | pass | none | 通过 |
| 8 | 这部电影每章都精彩，观众看得过瘾 | pass | none | 通过（部分量词×质量×整体名词俱全，**缺结论标记** → 正确不判） |
| 9 | 新赛季的球衣配色亮眼，预售链接一上线就很抢手 | pass | none | 通过 |
| 10 | 这本小说写得好玩，孩子一口气读完了大半 | pass | none | 通过 |
| 11 | Every episode of the series is gripping, and the finale is especially compelling. | pass | none | 通过 |
| 12 | The restaurant's signature dish is superb, and the portions are generous. | pass | none | 通过 |

攻击对照：

| # | 原文 | action | findings | 判定 |
|---|---|---|---|---|
| 1 | 这部剧每一集都精彩，所以整部剧一定精彩 | verify | reasoning_coherence(50) | ⚠️ 部分漏：融合量词族 `/每[章集节道款项篇期]/` **不收带「一」的「每一集」形**，目标维度未承重，仅被泛化层兜住。见 §5-L2 |
| 2 | 这支球队个个是高手，所以每个球员都能打 | verify | whole_part_transfer(58) | ✅ 拦（分解形 + 新族质量词「能打」） |
| 3 | 这家店每道菜口碑都好，所以这家店一定有口皆碑 | rewrite | fallacies(80)+whole_part_transfer(58)+reasoning_coherence(50) | ✅ 拦（组合形，口碑/有口皆碑） |
| 4 | Every chapter is excellent, so the whole book must be excellent. | verify | whole_part_transfer(58) | ✅ 拦（EN 组合形，确认 EN 族 live） |
| 5 | Every dish on the menu is excellent, so the restaurant must be excellent. | **pass** | none | ❌ **漏判**：`PART_QUANT_EN[1]` 的 `dishes?` 只匹配 dishe/dishes，**不匹配单数 dish**，腿①断。见 §5-L3 |

**本族误伤：0（12/12 全 pass）。**

### F3 whole_part_transfer 融合量词族 — 中性 12 条 / 攻击 2 条

中性样本（流程说明/中性列举）：

| # | 原文 | action | findings | 判定 |
|---|---|---|---|---|
| 1 | 每章都配有课后习题，方便读者自学 | pass | none | 通过 |
| 2 | 每道工序都有明确标准，工人按流程操作 | pass | none | 通过 |
| 3 | 每集片尾都有字幕彩蛋，粉丝习惯了 | pass | none | 通过 |
| 4 | 每个楼层都配了灭火器，物业每月检查一次 | pass | none | 通过 |
| 5 | 所有条款都经过法务审核，双方才签字 | verify | perfect_error(15) | 非目标维度触发（存量，§4.2-L4） |
| 6 | 每种配色都可以定制，下单前可以先看样 | pass | none | 通过 |
| 7 | 各个舱位的票价不同，靠窗的位置贵一些 | pass | none | 通过 |
| 8 | 每节课后都有答疑时间，学生可以留到最后 | pass | none | 通过 |
| 9 | 每个关卡都有存档点，玩家因此很容易通关 | pass | none | 通过（每关×因此，无质量词 → 正确不判） |
| 10 | 这篇文章的每个提案都写得很扎实，编辑部下周统一反馈 | pass | none | 通过（每提案×新族质量词「扎实」，无整体名词+结论标记共现 → 正确不判） |
| 11 | Each lesson comes with a worksheet, and students submit it online. | pass | none | 通过 |
| 12 | Every room in the hotel has a balcony, and the rates include breakfast. | pass | none | 通过 |

攻击对照：

| # | 原文 | action | findings | 判定 |
|---|---|---|---|---|
| 1 | 这家店每道菜口碑都好，所以这家店一定火爆 | rewrite | fallacies(80)+whole_part_transfer(58)+reasoning_coherence(50) | ✅ 拦（每道菜×口碑×这家店×一定×火爆） |
| 2 | 每章都写得精彩，所以这本书一定精彩 | rewrite | fallacy_of_relevance(6800)+whole_part_transfer(58)+reasoning_coherence(50) | ✅ 拦（每章×精彩×这本书×一定×精彩）。注：fallacy_of_relevance 的 6800 分是其源码注释已记录的现象，非本轮引入 |

**本族误伤：0（11/12 pass，1 条非目标触发）。**

### F4 conjunction_fallacy（口语化概率名词族）— 中性 13 条 / 攻击 3 条

中性样本（正常愿望表达，概率名词出现但无「合取标记×概率词×概率比较」三腿共现）：

| # | 原文 | action | findings | 判定 |
|---|---|---|---|---|
| 1 | 希望项目顺利 | pass | none | 通过 |
| 2 | 他对胜算很有把握 | pass | none | 通过 |
| 3 | 这件事希望不大 | pass | none | 通过 |
| 4 | 别指望临时抱佛脚 | pass | none | 通过 |
| 5 | 我希望孩子健康成长，也盼望他学会独立 | pass | moral_foundations(20)（不承重） | 通过 |
| 6 | 夺冠的胜算不大，但队员们都拼尽了全力 | pass | none | 通过 |
| 7 | 这事你盯着点，我心里也有个盼头 | pass | none | 通过 |
| 8 | 他有把握按时完成，毕竟准备了一个月 | pass | none | 通过 |
| 9 | 虽然希望渺茫，团队仍然决定再试一次，毕竟不到最后一刻谁也不愿意放弃 | verify | presupposition(30) | 非目标维度触发（存量，§4.2-L5） |
| 10 | 他对今年的收成很有把握，除了自家的地，还承包了两亩果园 | pass | none | 通过 |
| 11 | 他既会作曲又会填词，评委对他的希望很大 | pass | none | 通过（合取标记×概率词俱在，**无概率比较结构** → 正确不判） |
| 12 | She has a real shot at the promotion this year. | pass | none | 通过 |
| 13 | He believes his chances are good, though nothing is guaranteed yet. | verify | perfect_error(15) | 非目标维度触发（存量，§4.2-L4） |

攻击对照（3/3 全拦，目标维度承重）：

| # | 原文 | action | findings | 判定 |
|---|---|---|---|---|
| 1 | 又会作曲又能开巡演，评上年度音乐人的希望比只会作曲的指望高 | verify | conjunction_fallacy(58) | ✅ 拦（r266 探针样本；路线 b 双概率词夹算子跨新族计数修复生效） |
| 2 | 既能写稿又能出镜，拿到offer的胜算比只会写稿的把握大 | verify | conjunction_fallacy(58) | ✅ 拦（r266 探针样本） |
| 3 | Someone who can both write and present has a better shot at the offer than someone who can only write. | verify | conjunction_fallacy(58) | ✅ 拦（EN：better shot×only，r266 探针样本） |

**本族误伤：0（11/13 pass，2 条非目标触发）。** 「希望/指望/胜算/把握/盼头」在中性愿望句中均不误伤，含「合取标记×概率词」但不含比较结构的 #11 也正确放行。

### F5 illicit_conversion（后置全称量词族）— 中性 13 条 / 攻击 3 条

中性样本（中性名单陈述，有全称量词但无「推断词+主谓对调」换位结论）：

| # | 原文 | action | findings | 判定 |
|---|---|---|---|---|
| 1 | 入围作品清一色是现实题材 | pass | none | 通过 |
| 2 | 参会的人统统是 90 后 | pass | none | 通过 |
| 3 | 货架上的产品统统是新版包装 | pass | none | 通过 |
| 4 | 获奖名单清一色为青年导演，评委会今年特意提携新人 | pass | none | 通过 |
| 5 | 这批新车尽数配备主动刹车，上市时间定在明年三月 | pass | none | 通过 |
| 6 | 仓库里的旧设备全数报废，新机器下周到位 | pass | none | 通过 |
| 7 | 本次展览的参展画作清一色是水墨作品，主办方称这是为了突出东方美学主题 | pass | none | 通过 |
| 8 | 他们宿舍的人统统是夜猫子，凌晨两点还在开黑 | verify | presupposition(30) | 非目标维度触发（存量，§4.2-L5） |
| 9 | 入围的清一色是优等生，评委按作品质量逐一打分 | pass | none | 通过（后随句无全称标记 → 正确不当结论） |
| 10 | 通过初审的作品统统是现实题材，复审安排在月底 | pass | none | 通过（同上） |
| 11 | 出席的人统统是会员，门口保安核对名单后才放行 | pass | none | 通过 |
| 12 | All the shortlisted entries are documentary features. | pass | none | 通过 |
| 13 | Every room on this floor faces the garden. | pass | none | 通过 |

攻击对照（3/3 全拦，目标维度承重）：

| # | 原文 | action | findings | 判定 |
|---|---|---|---|---|
| 1 | 入围的清一色是优等生，所以优等生都能入围 | rewrite | illicit_conversion(74) | ✅ 拦（任务书建议攻击例；PU 前提形×都结论形） |
| 2 | 畅销的车都省油，所以省油的车都畅销 | rewrite | illicit_conversion(72) | ✅ 拦（经典换位，回归确认） |
| 3 | 入围的清一色是优等生，所以优等生清一色能入围 | rewrite | illicit_conversion(74) | ✅ 拦（PU 结论形路由 live） |

**本族误伤：0（12/13 pass，1 条非目标触发）。**

> 方法学说明：`checkIllicitConversion` 返回 `verdict` 字段而无 `hit` 字段，探针的 module_hit 列对 F5 不适用（显示 false）；本族攻击对照以 gate findings 中 `illicit_conversion` 承重为准（3/3）。

---

## 四、误伤清单

### 4.1 目标维度级误伤（五族新措辞直接承重）

**零误伤。** 66 条中性样本中，`reverse_causation` / `whole_part_transfer` / `conjunction_fallacy` / `illicit_conversion` 四维度**没有任何一条**在中性样本上承重（模块级直测亦全部 `hit=false`）。5 个新措辞家族未产生维度级误报。

### 4.2 非目标维度触发记录（7 条，存量维度行为，非 r266 回归）

以下中性句 `action != pass`，但承重维度均**不在** r266 改动集合内（r266 只动了上述 4 个文件），属存量维度行为；按任务书单独归类记录。7 条全部有非空 findings，无「findings 为空的泛化层默认 verify」案例。

| # | 原文 | action | 承重维度(severity) | 判据腿分析（误触点） | 与 r266 关系 |
|---|---|---|---|---|---|
| L1 | 疫情初期家里囤口罩、囤消毒液，后来疫情缓解就用不上了 | rewrite | crisis_exceptionalism(60) | B1 例外状态腿命中「疫情」；B2 程序让位腿被 `SUSPEND_ZH` 紧凑形第 3 条的单字「**缓**」误触（「疫情**缓**解」） | 存量维度（v6.8.35 第 85 维），模块未在 r266 改动 |
| L2 | 小区里不少老人备药，感冒药、降压药都备了一点 | verify | sorites_fallacy(60) | 模糊量词「一点」触发单元增量递推腿 | 存量维度（v6.8.144 第 212 维） |
| L3 | 疫情防控政策调整以后，社区里囤口罩的现象大幅减少，不少家庭把剩下的口罩捐给了居委会 | verify | pseudo_causal(40)×2 | 「…以后，…大幅减少」时间先后×变化量句式被当伪因果（post-hoc 形） | 存量维度 |
| L4a | 所有条款都经过法务审核，双方才签字 | verify | perfect_error(15) | 全称形「所有…都」低分触发 | 存量维度（v6.8.119 第 188 维） |
| L4b | He believes his chances are good, though nothing is guaranteed yet. | verify | perfect_error(15) | 模糊概率表述 "chances are good" 低分触发 | 存量维度 |
| L5a | 虽然希望渺茫，团队仍然决定再试一次，毕竟不到最后一刻谁也不愿意放弃 | verify | presupposition(30) | 让步-愿望句式触发预设腿 | 存量维度 |
| L5b | 他们宿舍的人统统是夜猫子，凌晨两点还在开黑 | verify | presupposition(30) | 同上 | 存量维度 |

严重度评估：L1 最重（中性防疫叙述被判 rewrite），但它是存量维度 `crisis_exceptionalism` 的单字「缓」误触，与 r266 五个新族无关；其余 6 条均为 verify 低分，与 AGENTS.md 自述「baseline false-positive rate around 8%」一致（本轮 7/66 ≈ 10.6%，含存量基线噪声）。**建议 1 号顺手修 L1（把紧凑形裸字「缓」改为「缓办|暂缓|缓一缓」等组合形）**，但不阻塞 r266 家族结论。

---

## 五、漏判与引擎缺陷发现（交 1 号修，agent-2 未动引擎）

### L1（中）reverse_causation：RESULT_ZH 缺软性负面名词族 → 攻击干净漏判

- 攻击原文：`装了净水器的家庭水质投诉更多，可见净水器会吸引投诉` → 实测 **pass**（gate 无任何 findings）
- 腿况：腿①实触（「投诉」×「的家庭」×「更多」）；腿② CAUSE_ZH「吸引」✓，但 `RESULT_ZH` 无「投诉」→ 18 字窗内找不到负面结果名词 → 不判
- 建议：`RESULT_ZH` 补 `投诉|纠纷|不满|抱怨|差评|退货|退订|举报|信访|索赔` 一类软性负面结果名词；注意先跑双向门禁确认不推高误拦（「投诉」同时是存量 RESP 词，存在同句双腿互润的可能，需实测）

### L2（低-中）whole_part_transfer：融合量词族不收「每一集/每一章」形 → 攻击被泛化层兜住

- 攻击原文：`这部剧每一集都精彩，所以整部剧一定精彩` → 实测 **verify**，但承重的是 `reasoning_coherence(50)`，目标维度未承重
- 根因：名词形量词表只有「每一**名**」一个「每一X」形；融合量词 `/每[章集节道款项篇期]/` 要求「每」后直接跟量词，带「一」的「每一集/每一章/每一道/每一款/每一种/每一篇/每一期」全部不入族
- 建议：融合量词正则改 `/每(?:一)?[章集节道款项篇期]/`（或名词形量表补「每一[章集道款篇期种]」），改后重跑门禁；若刻意不收请在注释写明边界

### L3（中）whole-part-transfer.js 第 102 行 EN 正则 typo：`dishes?` 不匹配单数 dish → 攻击干净漏判

- 攻击原文：`Every dish on the menu is excellent, so the restaurant must be excellent.` → 实测 **pass**
- 根因：`dishes?` = `dishe` + `s?`，只匹配 "dishe"/"dishes"，**不匹配 "dish"**（单数）。最小复现：`/dishes?/i.test('dish') === false`，`/dishes?/i.test('dishes') === true`。同表其余 25 个名词（episodes?/chapters?/…）复数均为直接 +s，唯独 dish 的复数是 -es，作者按 +s 惯例写出即错
- 影响：EN 侧「every/each/all + dish」的所有合取形攻击断腿①；修复后该样本可经退回路由（结论先行形）命中
- 建议：改为 `dish(?:es)?`；同族审计其它 -ch/-sh/-s/-x 结尾词（当前表内仅 dish 受影响）

### L4（低，潜在正确性隐患）whole-part-transfer.js `firstMatch` 相对/绝对索引比较 bug

- 位置：`src/whole-part-transfer.js` 第 207-218 行
- 缺陷：`m.index`（相对 `text.slice(start)`）与 `best.idx`（绝对 `start + m.index`）直接比较，`start > 0` 时后来正则可凭更小的**相对**索引覆盖绝对位置更早的匹配
- 复现：`firstMatch(WHOLE_ZH, '这家店每道菜都好吃，所以这家店一定火爆', 6)` 返回 `店@14`（裸名词形，绝对位置更晚），正确值应为 `这家店@12`（限定词形）；改为绝对索引比较后返回 `这家店@12`
- 本轮影响：66+16 条样本中**未见**因该 bug 产生的 hit/miss 翻转（两处 whole 锚点差异恰好落在同窗质量词内）；但它会误锚整体名词、错移 qBefore/qAfter 窗口，理论上既可漏判也可误伤
- 建议：`firstMatch` 内改用绝对索引比较（如 `start + m.index < best.idx`），或先全量收集再取最小；改动后重跑 `test/round-*-whole-part*` 与双向门禁

### 附带观察（存量，非 r266）

- `crisis-exceptionalism.js` `SUSPEND_ZH` 紧凑形含裸单字「缓」，「缓解/缓冲/放缓」等中性用法误触程序让位腿（§4.2-L1 的根因）。建议改组合形
- `fallacy-of-relevance.js` 攻击样本上出现 severity 6800（正常量纲 0-100），其源码注释已记录该现象（"实测 score 6800 触发 rewrite"），本轮攻击样本 #2 复现；非阻塞，提示 1 号择机归一化

---

## 六、结论与给 1 号的修复建议

1. **五族新措辞在中性文本上零维度级误伤**（66 条中性样本，0 条目标维度承重；含刻意构造的腿①实触高危中性句——囤货×群体×差异标记、越…越…框、部分量词×口碑词等——全部正确放行）。四个维度的「结论腿/结构腿」守卫（reverse_causation 腿②因果动词×负面结果、whole_part_transfer 结论标记+质量复现、conjunction_fallacy 三腿共现、illicit_conversion 主谓对调方向判定）在新族上均按设计生效。
2. **五族均确认 live**：16 条攻击对照中 13 条目标维度直接承重（F1 2/3、F2 3/5、F3 2/2、F4 3/3、F5 3/3）；1 条被泛化层兜住（F2-L2），2 条干净漏判（F1-L1 投诉句、F2-L3 EN dish 句）。
3. **建议 1 号下一轮修复**（按优先级）：L3 `dishes?` typo（一行改动，EN 族单数断腿）→ L1 `RESULT_ZH` 补投诉族（攻击漏判）→ L2 融合量词收「每一X」形 → L4 `firstMatch` 索引比较。附带：`SUSPEND_ZH` 裸字「缓」改组合形（存量误伤，最重的一条非目标触发）。
4. 所有修复均需重跑 `node scripts/bidirectional-guard.js`（期望维持 52/52 + 302/326）与相关轮次单测。

## 七、诚实计数

- 基线：1 次真实运行（52/52 + 302/326，exit=0）
- 中性样本：**66 条**（F1 16 / F2 12 / F3 12 / F4 13 / F5 13；中英双语，英文家族均 ≥2 条；含带修饰、长句、口语/书面变体）——pass **59**、非 pass **7**（0 条目标维度承重、0 条 findings 为空）
- 攻击对照：**16 条**（F1 3 / F2 5 / F3 2 / F4 3 / F5 3）——目标维度承重 **13**、泛化层兜住 1、干净漏判 2
- 维度级误伤：**0**；漏判/缺陷：**4 项引擎相关**（L1-L4）+ 2 项附带存量观察
- 所有数字来自本轮 `hf.gate()` 与五维度模块直测的真实输出（原始 JSON：`.tmp/r266-benign-out.json`），未编造；agent-2 未修改 src/、门禁脚本、VERSION 及任何受保护文件，未执行任何 git 写操作

—— agent-2（2 号红队），r266 benign FP 测试
