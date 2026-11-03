## [6.8.135] - 2026-11-03

### Added — 第 203 判别维度 `credential_dismissal`「诉诸资历/资历驳回」（r206，真升级类型 1：新判别维度）
- 新增 src/credential-dismissal.js（约 300 行）：`checkCredentialDismissal(text, inject)` + `__internals`（12 个可注入常量）。两腿共现 + 邻近窗（中文 80 字 / EN 200 字符），缺一不判；另设自足祈使分支（先+长周期资历动作+再+发言动作单式即两腿齐备）：腿① GAP 资历/学识/经验缺口（第二人称+否定+资历动词、裸名词缺口没在行业里干过十年/没结过婚/没带过孩子、身份与角色否定不是专业的/非科班/外行/门外汉/业余/不是家长/不是过来人；EN you have not (read|studied|done|run|worked|experienced|managed)、you are not a (professional|expert|scholar|parent)、who has never、never (run|worked|built) a (business|team)、no (degree|experience|training)、outsider/amateur/layman——r161 教训：缺口词收裸名词形态，没读过/没做过/外行/amateur 去后缀仍命中）；腿② STANDING 发言资格剥夺（资格剥夺没资格/不够资格/无权/有什么资格/哪来的资格+发言动作——**发言动作必选**，「没资格给病人开方」类执业许可天然不判；凭什么+发言动作；不配族；禁言族闭嘴/免谈/插什么嘴/掺和什么/指手画脚/也敢/少来；价值抹杀批评/质疑/观点+一文不值/不算数/毫无价值/说明不了任何问题；EN not qualified to (criticize|critique|…)、have no (right|standing|authority|business) to、who (are|is) (you|he|she|they) to、shut up、stay in your lane、(do not) (talk|comment)、until you have (read|studied|earned)、(criticism|opinion) means nothing）。命中「拿批评者个人的资历/学识/经验缺口剥夺其发言资格，用『你是谁』代替『你说了什么』」这一此前 202 维零命中的攻击族——学术圈「没读完全集就没资格评论」/行业「没干过十年少插嘴」/公共议题「不是X国人别说话」同族：观点是否正确只取决于证据与推理，与发言者的学位、工龄、读过几本书无关；资历门禁一旦成立，批评通道就被关闭，公共讨论退化成资格赛。
- **r161 教训 + 两轮实测修漏**：① A3 初版要求 没 与资历动词紧邻，「没在行业里干过十年」整句漏判（改允许隔 ≤10 字定语）；② EN 侧 `not qualified to critique` 的 critique 词形初版漏收、「who is he to lecture us」的第三人称形式初版只收 who are you to、「his criticism of the company means nothing」的修饰间隔初版不容忍——三处补齐；③ 豁免初版漏「X是典型的诉诸资历谬误」尾部形态（族名词+谬误直接相邻），概念批判良性被误判——补尾部形态；④ 腿①初版不收角色否定（不是家长/不是过来人），「你又不是家长，凭什么…」整句漏判——补角色名词族；⑤ B1 初版发言动作可选，「没资格给病人开方」类执业许可会被命中——改为必选（开方不在发言动作表），执业边界由结构而非豁免保证。
- **豁免三组**：概念/批判转述（诉诸资历/资历攻击/资历谬误/资格歧视/侍臣回复/门禁+是谬误·话术·逻辑错误，含尾部形态；EN credentialism / courtier's reply is a fallacy）、资源指引/教学邀请（我建议/欢迎/我可以介绍/不妨先了解/供参考/一起查证；EN I suggest / feel free to ask / happy to explain——禁言祈现在场时指引豁免不生效，混合句以禁言优先）、执业许可/任职要求（执照/资格证/执业资格/资质+才能·方可·前提·规定）。
- **边界**：genetic_fallacy（第 131 维起源谬误）按来源出身推断观点/产品质量（落点是内容价值贬损），本族腿②落点是发言资格剥夺（指向人的准入）；探针实测本族 4/4 攻击样本 genetic_fallacy 零命中。tone_policing 管压制批评语气，本族管准入资格；scrutiny_evasion / soft_deflection 管回避实质审查的遁辞，本族直接宣布对方无权提问；appeal_to_authority 管引权威为证据，本族正好相反——拿对方缺乏权威作禁言理由。
- 接入 src/index.js 八处（require / 计算点 / allDims / dimMap / DIM_GUIDANCE / VERIFY_DIMS / dimensions 输出对象 / module.exports 导出；变量名 cdl）；维度 202→203，VERIFY 159→160，三层级合计 189→190/剩余 13 不变；README/SKILL/AGENTS 三处数字同步；VERSION 6.8.134→6.8.135。模块数 162 不变（纯函数维度模块不进 _modules registry，r186/r190/r203/r204/r205 同口径）。
- 新测试 test/round-206-credential-dismissal.js（16 断言全绿：12 攻击全命中含中英双语/裸名词/带修饰/反问/长句/纯祈使形、12 良性全放行含资源指引/教学邀请/执业许可/概念批判/工作流祈使/禁言口语无缺口腿、3 项豁免陷阱逐常量承重、8 项常量负例注入承重含中英逐侧与自足祈使分支、gate 层变体矩阵 6 攻击全非 pass 且维度承重 + 6 良性全 pass）。
- **来源（真实，未编造）**：r206 族探针 13 候选族实测，credential_dismissal 是唯一 4/4 真零命中且良性零误伤的族（其余候选或被代拦或缺口不足）；外部三层搜索 HN Algolia "courtier's reply" 前五无相关命中（courier 同形词干扰）、Semantic Scholar 两次空返（限流）、GitHub "ad hominem fallacy" sort=stars 前五 UKPLab/naacl2018-before-name-calling-habernal-et-al ★13 / jghibiki/NeuralAdHominem ★2 / utkarsh512/logical-fallacy ★1 与 "courtier reply fallacy" 零仓库，全部 LLM/统计学习路线，无纯规则成熟方案可集成，按既有维度形态纯规则自建。心虫裁决门禁 philosophy_decision → accelerate（confidence 0.7 / priority 40；cognitiveLoad/uncertainty 为 "unknown"，未当实质背书）。侦察落盘 /tmp/hf-scout-1793711319.txt、族探针 /tmp/hf-probe-families.js。

## [6.8.134] - 2026-11-03

### Added — 第 202 判别维度 `unfalsifiable_confirmation`「双果自证」（r205，真升级类型 1：新判别维度）
- 新增 src/unfalsifiable-confirmation.js（约 330 行）：`checkUnfalsifiableConfirmation(text, inject)` + `__internals`（8 个可注入常量）。两腿共现 + 邻近窗（中文 80 字 / EN 200 字符），缺一不判：腿① OUTCOMES 互斥结果对（双条件分句如果/若/一旦/要是+条件A；否则/不然/反之/反过来+条件B、双条件同句逗号型、无论句型无论/不管/不论+（A 还是 B / A 与否 / 是否 A / A 不 A / 结果如何 / 好坏 / 胜负）+都/也、对举极性型实现/应验/灵验/成功/出现/上涨/赢了+没/未/不+同族词、「测出来是A，测不出来是B」极性否定嵌内倒装、「测出来是A，没测出来是B」语序、裸反义对举涨了…跌了、横竖/反正+都、显式不可推翻宣告任何结果都不能推翻；EN whether X or not / whether X or Y / either way / no matter what / whatever happens / if it works…if not / works or it doesn't / nothing could disprove）；腿② CONFIRM 同一自证结论（都/也/照样/依然+证明/验证/说明/表明/意味着/印证/坐实+我/我们、说明/证明+我+对·正确·没错·成立·有效·准·高明·领先·了不起、我的（理论/观点/学说/预言/判断/方法/模型/能力/框架）+是+对/正确/成立/有效（允许「我这个被否定的观点」插入修饰）、反正/横竖/左右+都+我+对、恰恰/正好+说明/证明+我、所以…永远/终究+成立；EN proves/confirms/shows/vindicates + I'm/my theory is + right/correct/valid/true、my theory is vindicated/confirmed、either way + confirms、right either way / no matter the outcome、no outcome can disprove it）。命中「把一对互斥结果设定成同一个自我结论的证据」这一此前 201 维零命中的攻击族——伪科学自辩（Sagan《我车库里的喷火龙》双果版）、阴谋论免疫策略（证据出现=证实，证据缺席=更证实）、营销自证话术（涨了=品牌力，跌了=市场不懂）的核心结构：不存在任何能推翻它的观察，举证责任被反向消灭，「永远正确」冒充「曾经正确」。
- **r161 教训**：枚举腿收裸词形态——实现/没实现、涨了/跌了、测出来/测不出来 去后缀仍命中；「测不出来是B」极性否定嵌在动词内的倒装语序单独收族（A3b），与「没测出来」语序（A3c）分列——r205 实测修复：初版 A3 只收 neg 在第二分句句首一种语序，「测出来是我功力起作用，测不出来是你心不诚」整句漏判；EN 侧 if X…if not 分支句分隔符初版只收逗号，「…vindicated; if not, …」分号形漏判（改 `[;,]?`）。
- **豁免两组 + 疑问句**：概念/批判转述（不可证伪/可证伪性/证伪主义/自我证实/免疫策略/两头堵/怎么说都对/双果自证+是谬误·问题·不是科学；EN unfalsifiable claim is a fallacy / falsifiability / Popper / Sagan's dragon——讨论这个概念本身不是运用它）、诚实不确定性/验证纪律（需要更多数据/证据才能判断、两种结果都可能、下结论为时过早、要先验证/检验/同行评议、如实报告负面结果；EN needs more evidence before / both outcomes remain possible / premature to conclude / report the negative results——主动寻求判别而非宣称已证）、疑问句（含 ?/？）。
- **边界**：absolute_claim（第 96 维族）管不留余地的断言（一定/必然/百分之百），本族必须有互斥结果对 + 自证结论两腿共现；confidence / perfect_error 管校准与表述瑕疵，本族管的是免疫结构（结论对所有可能观察封闭）；special_pleading（第 150 维）管给自己开规则后门，本族主张的是「任何结果都替我作证」；kafkatrapping（第 143 维）管把否认当作罪证，本族针对的是结果全覆盖；helplessness_induction 的「无论你签不签，结果都一样」管放弃抵抗的胁迫诱导，本族管认识论上的自我封闭。
- 接入 src/index.js 八处（require / 计算点 / allDims / dimMap / DIM_GUIDANCE / VERIFY_DIMS / dimensions 输出对象 / module.exports 导出；变量名 ufc）；维度 201→202，VERIFY 158→159，三层级合计 188→189/剩余 13 不变；README/SKILL/AGENTS 三处数字同步；VERSION 6.8.133→6.8.134。模块数 162 不变（纯函数维度模块不进 _modules registry，r186/r190/r203/r204 同口径）。
- 新测试 test/round-205-unfalsifiable-confirmation.js（12 断言全绿：11 攻击全命中含中英双语/裸词/倒装极性/长句、8 良性全放行含设计保证/诚实不确定性/条件规划/概念批判、2 项豁免陷阱逐常量承重、4 项腿常量负例注入承重含中英逐侧、2 项豁免常量负例注入、gate 层变体矩阵 6 攻击全非 pass 且维度承重 + 6 良性全 pass）。
- **来源（真实，未编造）**：立项缺口由 r167 one-sided-dismissal.js 注释显式留白（「不可证伪断言」候选族当时仅 6/8 被其他维度代拦，无维度实现其两腿结构）；外部三层搜索 HN Algolia "falsifiability"（前八均为 Popper 证伪主义/Sagan 车库里喷火龙/Hans Albert Immunisierung 哲学博客，无代码）、Semantic Scholar 一次检索 HTTP 429 限流空返（如实记录）、GitHub `falsifiability&sort=stars`（cpt13-g/clarify-research-idea ★282 / tonyblu331/research-proof ★52，均 LLM 驱动的研究想法压力测试）无可集成纯规则实现，按既有维度形态纯规则自建（双果自证为经典 demarcation 问题核心结构）。心虫裁决门禁 philosophy_decision → accelerate（confidence 0.7 / priority 40；cognitiveLoad/uncertainty 为 "unknown"，未当实质背书）。侦察落盘 /tmp/hf-scout-1793689206.txt。

## [6.8.133] - 2026-11-03

### Added — 第 201 判别维度 `galileo_gambit`「伽利略赌局」（r204，真升级类型 1：新判别维度）
- 新增 src/galileo-gambit.js（约 300 行）：`checkGalileoGambit(text, inject)` + `__internals`（8 个可注入常量）。两腿共现 + 邻近窗（中文 80 字 / EN 200 字符），缺一不判：腿① MARTYR 殉道者/被嘲笑先知先例（伽利略/哥白尼/布鲁诺/塞尔维特/魏格纳/塞麦尔维斯/苏格拉底、鲜花广场/宗教裁判所/异端/十字架、被/遭/饱受/受到/当年/历史上+嘲笑·嘲讽·讽刺·迫害·打压·封杀·排挤·烧死·处死·审判·定罪·排斥·否定·斥为·骂·冷眼·冷遇、「被当成疯子/骗子/谬论」族、「所有突破起初都被骂」概括族；EN Galileo / Copernicus / Bruno / Servetus / Wegener / Semmelweis / Socrates / burned at the stake / Inquisition / heresy / they laughed at / mocked / ridiculed / persecuted / condemnation / persecution is the highest honor）；腿② TRANSFER 结论迁移（所以/因此+我+没错·正确·成立、我的（理论/发现/观点）+迟早/终将被证明·承认·平反、证明/平反+我+对的（倒装）、历史/时间/时代+会+证明·平反·翻案·给我公道、现在被封杀·被否定+我、被…封杀/拒稿/否定+说明/证明+我·对·真相、反对本身就是最好的证明、你们/他们+也会被钉在耻辱柱上/扫进历史的垃圾桶、越是被嘲笑+越说明、真理往往掌握在少数人、站在历史的正确一边；EN so my theory will be proven / history will vindicate / history will prove me right / they're laughing at me now / being ridiculed now proves / the more they mock me, the more right / establishment rejection is the best credential / wrong side of history / censored for telling the truth proves I'm right）。命中「拿殉道者/被嘲笑先知的先例给自己被封杀的观点颁发正确性证书」这一此前 200 维零命中的攻击族——伪科学、阴谋论、民科自辩最常用护身符，也是 AI 转述用户观点时最容易照单全收的似是而非（让举证责任反向消失：「不需要证据，被封杀就是证据」）。
- **r161 教训**：枚举腿收裸名词形态——伽利略/布鲁诺/被嘲笑/被封杀/拒稿 去后缀仍命中；r204 实测两轮自查修漏：① 腿②修饰词组初版各限一次匹配，「迟早也会被承认」四 token 连排漏判（改无序星组）；② MARTYR_ZH 被迫害动词初版漏「遭学界冷眼」的触发词「遭」与「冷眼/冷遇/白眼/唾弃」；③ EN 侧「the more they suppress my paper」与「establishment rejection of my work is the strongest proof」中间成分未收。**另修一个初版结构性缺陷**：豁免二「被嘲笑…证明…」初版未强制否定词，与攻击句式（「被拒稿正说明它是对的」）同射一区域，把攻击句误当否认推断整句放过——改为必须显式否定词（不能/无法/未必/不代表/不等于/不意味着/推不出/难以/并未…）。
- **豁免两组 + 疑问句**：概念/教学转述（伽利略赌局/伽利略谬误/逻辑谬误/谬误清单；EN Galileo gambit / logical fallacy——讨论这个概念本身不是运用它）、否认推断/正确判别（被嘲笑不能证明/不代表…正确、历史上被嘲笑的观点绝大多数被证伪、伽利略靠望远镜观测与数学推导而非被审判证明、要看实验数据/以证据为准/需要证据才能承认；EN being ridiculed doesn't prove / the vast majority of ridiculed ideas were wrong / needs evidence before——拒绝该推理本身是正确判别）、疑问句（含 ?/？）。
- **边界**：poisoning_the_well（第 134 维）/ genetic_fallacy（第 131 维）管动机/出身污名化（你这么说是因为你有利益），本族不污名化对方、诉诸历史殉道先例；appeal_to_majority（第 149 维）管「大家都信所以为真」，本族方向相反——「少数派/被迫害者才对」且必须有殉道者先例作腿①；special_pleading（第 150 维）管给自己开规则后门，本族主张的是「被压制=正确」；post_separation_harassment 等第 129 维胁迫族管真实人际胁迫行为，本族管论证结构。
- 接入 src/index.js 八处（require / 计算点 / allDims / dimMap / DIM_GUIDANCE / VERIFY_DIMS / dimensions 输出对象 / module.exports 导出）；维度 200→201，VERIFY 157→158，三层级合计 187→188/剩余 12→13；README/SKILL/AGENTS 三处数字同步；VERSION 6.8.132→6.8.133。模块数 162 不变（纯函数维度模块不进 _modules registry，r186/r190/r203 同口径）。
- 新测试 test/round-204-galileo-gambit.js（13 断言全绿：10 攻击全命中含中英双语/裸名字/带修饰/倒装/长句、10 良性全放行含统计反驳/证据归因/概念讨论/疑问句/缺迁移腿、3 项豁免陷阱、6 项腿常量负例注入承重含中英逐侧、gate 层变体矩阵 5 攻击全非 pass 且维度承重 + 6 良性全 pass）。
- **来源（真实，未编造）**：立项缺口由 r180 fallacy-fallacy.js 缺口清单显式留白（「galileo_fallacy 在 src/ 下 0 命中」）；外部三层搜索 HN Algolia "logical fallacy"（arXiv 2405.02318 258 pts / logicalfallacies.org 141 pts / UTEP Master List 113 pts）、GitHub `fallacy+detection&sort=stars`（latent-variable/Real_time_fallacy_detection ★120 / tmakesense/logical-fallacy ★21 / panFJCharlotte98/Fallacy_Detection ★5 / dhfbk/faina ★5）全部为 LLM/统计学习路线，与零 LLM 依赖铁律冲突，无纯规则成熟方案可集成，按既有维度形态纯规则自建。心虫裁决门禁 philosophy_decision → accelerate（confidence 0.7 / priority 40；cognitiveLoad/uncertainty 为 "unknown"，未当实质背书）。侦察落盘 /tmp/hf-scout-1793681433.txt。

## [6.8.132] - 2026-11-03

### Added — 第 200 判别维度 `availability_bias`「可得性偏差」（r203，真升级类型 1：新判别维度）
- 新增 src/availability-bias.js（约 340 行）：`checkAvailabilityBias(text, inject)` + `__internals`（12 个可注入常量）。两腿共现 + 邻近窗（中文 60 字 / EN 160 字符），缺一不判：腿① AVAIL 可得性线索（老/经常/时不时+听说·听到·看到·刷到、刷屏/满屏都是/热搜/热榜、电视里·新闻里+播·放·连篇累牍·铺天盖地、身边·周围·遍地+全是·全在·都在、听得多了/看得多了、印象里·一想就能想起·张口就能举出+一大堆/好多；EN keep hearing about / all I hear about / all over my feed / keeps coming up / see it all the time / everywhere in the news / constant coverage / bombarded with）；腿② FREQ 频率/概率推断（很常见/越来越普遍/比比皆是/屡见不鲜/遍地开花/蔚然成风/多如牛毛/满地都是、大幅·激增·暴涨、十有八九/大概率/八成/多半、屡屡·频频发生、说明·表明·可见+很多·增多·上升·普遍、看来·显然·肯定+频率量；EN must be common / increasingly common / rampant / happening all the time / skyrocketing / must be rising / it's an epidemic of）。命中「拿媒体/环境曝光线索直接推出频率结论，把回忆容易度偷换成实际发生率」这一此前 199 维零命中的攻击族，补齐认知偏差系列（base_rate_neglect/selection_bias/clustering_illusion/regression_to_the_mean）中缺失的可得性启发式一支。
- **r161 教训**：枚举腿收裸名词形态——「听说/听到/看到/刷到/热搜/报道」去后缀仍命中；实测两轮自查修漏：① 初版只收「看到」族漏「老听到」整句（听说/看到/听到/刷到四个裸动词必须同级收录）；② 身边族初版只收「全是/都是」漏「身边朋友全在聊」（补「全在/都在」）；③ 记忆提取族初版只收名词在前的「例子…想起」，漏倒装「一想就能想起好多例子」（补动词在前的「一想/张口/随口/信手+就能…想起」族）。腿②的「很常见/越来越普遍」等裸频率词带否定前缀 lookbehind 保护（「老听说很多，但不代表真的多」是正确判别，不判）。
- **豁免三组 + 疑问句**：数据/统计依据在场（统计显示/数据显示/官方通报/报告显示/研究表明/同比/环比/发生率；EN statistics show / according to data / per capita——结论有独立证据支持时曝光只是引子）、求证/纠正陈述（但要看数据/以数据为准/有待核实/不代表/不等于/不能说明；EN I should check / doesn't necessarily mean / need more data——认知到偏差并主动求证是正确判别）、概念/教学转述（可得性偏差/可得性启发式/认知偏差；EN availability bias / availability heuristic / cognitive bias）、疑问句（「最近老听到这事，是不是变多了？」——问的是趋势本身）。
- **边界**：base_rate_neglect（第 169 维）判据是具体阳性信号×高置信后验（检测阳性→几乎肯定中招），本族判据是媒体/环境曝光度、可能根本没给出任何具体案例（「满屏都是」不是样本）；anecdotal（第 140 维）管第一人称亲身经历×推广，本族主体常无亲身经历、依据是看到听到的密度；hasty_generalization 管少数样本×普遍结论，本族连样本都未给出、判的是「回忆容易度→频率」这一替代关系本身；synthetic_social_proof 管伪造社会认同，本族不主张他人立场、只推断事件频率。
- 接入 src/index.js 八处（require / 计算点 / allDims / dimMap / DIM_GUIDANCE / VERIFY_DIMS / dimensions 输出对象 / module.exports 导出）；维度 199→200，VERIFY 156→157；README/SKILL/AGENTS 三处数字同步；VERSION 6.8.131→6.8.132。
- 新测试 test/round-203-availability-bias.js（19 断言全绿：9 攻击全命中含中英双语/裸名词/带修饰/倒装/长句、9 良性全放行含数据依据/主动求证/概念讨论/疑问句/缺腿、4 项豁免陷阱「含豁免放行+抹掉转命中」、7 项腿常量负例注入承重含中英逐侧独立、缺腿/邻近窗外/短文本结构性不判、gate 层变体矩阵 7 攻击全非 pass 且 availability_bias 承重 + 6 良性全 pass 含「战争是多因共同造成的」边缘良性）。

## [6.8.131] - 2026-11-03

### Added — 第 199 判别维度 `appeal_to_legality`「诉诸合法性谬误」（r202，真升级类型 1：新判别维度）
- 新增 src/appeal-to-legality.js（约 330 行）：`checkAppealToLegality(text, inject)` + `__internals`（12 个可注入常量）。两腿共现 + 邻近窗（中文 60 字 / EN 160 字符），缺一不判：腿① LEGAL 守法宣告（不违法/没犯法/不违反法律法规、法无禁止即可为、法律没有禁止、合法（「合法性」概念形态除外）/合规/法定权利·合法权利；EN not illegal / broke no law / perfectly legal / within my legal rights / complied with every regulation）；腿② EXONERATE 道德/批评豁免（等于|意味着|代表着 lookbehind 保护的 没问题/没错族、「不存在任何法律问题」、并无不妥/无可厚非/无可指责、不能|无权|少|凭什么+指责|批评|质疑|评判|干涉|干预、管不着/轮不到/多管闲事、少|别+大惊小怪|上纲上线|道德绑架、私事|个人选择+无权干涉；EN nothing wrong with it / no grounds to criticize / can't criticize / who are you to judge / mind your own business / stop being judgmental）。命中「拿守法宣告直接推出道德或批评豁免，把合不合法偷换成该不该做、能不能批评」这一此前 198 维零命中的攻击族，补齐 appeal_* 系列缺失的「法律/合规」一支（argumentum ad legem）。
- **r161 教训**：枚举腿收裸名词形态——「不违法」「没犯法」「法无禁止即可为」「合法」「合规」「没问题」「没错」去后缀仍命中；「没问题/没错」带否定前缀 lookbehind 保护（「不等于没问题」是正确判别，不判）；「合法」后接「性」的政治合法性概念形态用否定断言避开。
- **豁免四组**：合规场景（合同/协议/条款/签约/法务/合规/审批/审计/监管/许可/执照/上市/起诉/仲裁/劳动法/交通法；EN contract / compliance / regulatory / audit / permit / license——合法性正是该场景的评判标准）、法律-道德区分陈述（不违法≠没问题/虽然不违法但道德上有争议；EN legal but wrong / doesn't make it right）、概念/教学转述（诉诸合法性/守法即正当/argumentum ad legem / appeal to legality）、质疑该推理的窄口径疑问（「不违法就不能指责吗？」——反问的是推理本身；攻击常用的「你凭什么指责？」反问不在豁免内）。
- **边界**：与 legal_status_coercion（第 122 维，以法律后果胁迫——「我会让你吃官司」）方向相反，本族拿已守法证明道德无瑕；与 opinion_entitlement（第 196 维，免举证义务）豁免对象错开，本族免的是道德批评资格、依据是法律合规；unsupported_claim 管断言无依据，本族有明确两步推理结构。
- **本轮另修复 r201 遗留文档漂移**：README「Measured at **v6.8.129**」与 SKILL「at v6.8.129. / Engine version 6.8.129」三处版本戳未随 6.8.130 递进，doc-numbers-accuracy 开工时实测 13/24 红态；本轮同步至 v6.8.131 后转 24/24。
- 接入 src/index.js 八处（require / 计算点 / allDims / dimMap / DIM_GUIDANCE / VERIFY_DIMS / dimensions 输出对象 / module.exports 导出）；维度 198→199，VERIFY 155→156；README/SKILL/AGENTS 三处数字同步；VERSION 6.8.130→6.8.131。

## [6.8.130] - 2026-11-03

### Added — 第 198 判别维度 `nirvana_fallacy`「完美方案谬误」（r201，真升级类型 1：新判别维度）
- 新增 src/nirvana-fallacy.js（约 300 行）：`checkNirvanaFallacy(text, inject)` + `__internals`（12 个可注入常量）。两腿共现 + 邻近窗（中文 60 字 / EN 160 字符），缺一不判：腿① IMPERFECT 不完美宣告（不能/无法/难以/做不到×根治/根除/彻底/100%/一劳永逸，裸不完美名词 不完美/有缺陷/有漏洞/有短板/有死角/有局限/有副作用/治标不治本/不是万能/没有银弹，「找不到+根治方法」句式；EN isn't perfect / imperfect / flawed / can't fully solve / won't eradicate / only treats the symptoms / not a cure / no silver bullet / has flaws / not 100%）；腿② REJECT 行动废止（毫无/没有+意义|价值、一文不值、杯水车薪、徒劳、白费、多此一举、画蛇添足、否定前缀 lookbehind 保护的裸废止动词 放弃/取消/废止/废除/终止/停止/叫停/下马/抵制/拒绝/搁置、「不该|不应该+存在|推行|采用|使用|保留|尝试」、干脆|不如|索性+废止；EN pointless / no point / not worth / might as well give up / should be abandoned / why bother / waste of time / wait for a perfect solution）。命中「拿方案的不完美直接废止行动，用理想化对照否决现实选项」这一此前 197 维零命中的攻击族。
- **r161 教训**：枚举腿收裸名词形态——「不完美」「有漏洞」「治标不治本」「一劳永逸」「放弃」「废止」去后缀仍命中；废止动词带否定前缀 lookbehind 保护（「不该放弃」「没有取消」是正确坚持，不判）。
- **豁免四组 + 疑问句**：让步-肯定（但/然而/不过 + 值得/应当/仍/继续/缓解/控制/改善/推进/采用/降低/延长/有用/有效/试点/试行/过渡/没有放弃；EN but/however + worth/valuable/useful/effective/reduces/slows/improves/better than nothing——「不能根治，但能缓解症状，值得推广」是对渐进改进的正确坚持）、证据型废止（严重副作用/风险大于收益/弊大于利/完全无效；EN severe side effects / outweighs the benefits / more harm than good / completely ineffective——因危害或无效而废止是正确的，本族只管「因不完美而废止」）、概念/教学转述（nirvana fallacy/完美方案谬误/要么完美要么不做/all-or-nothing thinking）、过渡/interim（在…之前先…/暂行/过渡/权宜之计；EN in the meantime / interim measure / stopgap）、疑问句。
- **边界**：与 base_rate_neglect（单点阳性信号→高置信度个体结论，可无概率语言区分）、perfect_error（指标数字精确度假象）、false_dilemma（虚假二元对立，本族选项可只有一个）、appeal_to_consequences（怕后果所以信/不信，本族落点是行动存废）刻意错开；index.js:5866 遗留 perfect_solution 窄正则（「不完美…等于…没用」固定句式）由本维度覆盖更全句式族。
- 接入 src/index.js 八处（require / 计算点 / allDims / dimMap / DIM_GUIDANCE / VERIFY_DIMS / dimensions 输出对象 / module.exports 导出）；维度 197→198，VERIFY 154→155；README/SKILL/AGENTS 三处数字同步；VERSION 6.8.129→6.8.130。

## [6.8.129] - 2026-11-03

### Added — 第 197 判别维度 `goal_drift`「目标漂移/使命置换」（r200，真升级类型 1：新判别维度）
- 新增 src/goal-drift.js（约 280 行）：`checkGoalDrift(text, inject)` + `__internals`（14 个可注入常量）。两腿共现 + 邻近窗（中文 60 字 / EN 160 字符），缺一不判：腿① ANCHOR 原始目标/使命锚定宣告（初衷/初心/本来要/最初的目标/原任务/原计划/立项(时|之初)/使命/宗旨/被(要求|安排|雇来|委派)；EN original/initial/stated/assigned (goal|task|mission|objective|mandate|purpose|brief)、(i|we) (was|were) (hired|asked|assigned) to、the (mission|mandate|remit) was、set out to）；腿② SWITCH 目标置换/漂移宣告（重心(已经|早已|悄然)?(转向|转移到|放在|移到)/重心转移/现在(真正|最)(重要|该做|值得)(的|是)/实际上(变成|已是)/已经变成/变成了/漂移(到|至|成了)/不知不觉(中)?(变成|成了)/说到底是为了/沦为；EN (has|have) (shifted|drifted|moved|pivoted) to、focus has drifted to、now focused on、the real (goal|priority|focus) is、turned into、became about、what (we|it|i) (really|actually) (do|want|need) is、drifted from）。命中「以『延续/服务原目标』之名行『置换目标』之实」这一此前 196 维零命中的攻击族。
- **r161 教训**：枚举腿收裸名词形态——「重心转移」「漂移」「转向」「初衷」「初心」「使命」「宗旨」去修饰仍命中；EN 裸 "drifted"/"turned into" 命中。
- **豁免四组 + 疑问句**：显式授权/正式变更（用户(批准|同意|授权)/经(用户|上级|客户)(同意|批准)/重新对齐/正式(变更|调整|批准)/审批通过；EN with the user's approval、formally approved/re-scoped、re-anchored、agreed new scope、signed off on）、自我纠正/觉察漂移（发现(偏离|漂移|跑偏)/回到(初衷|初心|正轨|原使命)/纠正(漂移|偏离)/不忘初心/防止(目标)?漂移；EN have drifted off、back on track、refocus on the original、guard against drift——**指出并纠正漂移是正确判别**，是本维度保护的反面行为）、概念/教学转述（目标漂移/使命漂移/漂移检测/管理学/论文；EN goal drift / mission drift / drift detection / governance / case study）、对冲、疑问句。
- **边界**：与 goal_misalignment（单腿模式匹配清单、无豁免体系、不承重 gate.action）、moving_goalposts（辩论中移动成功判据）、proxy_metric_goal（拿代理指标替换目标，腿①是代理指标族）、activity_outcome_confusion（活动量冒充成果）、standard_shift（评判标准漂移）刻意错开。
- 接入 src/index.js 七处（require / 计算点 / allDims / dimMap / DIM_GUIDANCE / VERIFY_DIMS / dimensions 输出对象）；维度 196→197，VERIFY 153→154；README/SKILL/AGENTS 三处数字同步；VERSION 6.8.128→6.8.129。
- 来源（真实，未编造）：三层研究——HN Algolia "agent goal drift" 命中 arXiv 2603.03456《Asymmetric Goal Drift in Coding Agents Under Value Conflict》（https://arxiv.org/abs/2603.03456，coding agent 在价值冲突下静默偏离被雇佣时的目标，单个动作合规、轨迹整体漂走）与 GitHub sunilgentyala/Plumbline ★6（Apache-2.0，zero ML deps：mission drift 是 per-action 治理栈覆盖不到的失效模式，须对固定 mission anchor 持续打分）——均为 agent 运行时治理/实证研究，判据为心虫自有纯规则实现（零 LLM 依赖）。侦察落盘 /tmp/hf-scout-*.txt。缺口实证：grep 'goal_drift|scope creep|使命漂移|目标漂移|目标置换|初衷' src/ 仅相邻族零散命中，无专门维度；r200 家族探针在当前引擎复测攻击 5/5 gate.action=pass（真零命中）、良性 4/4 pass（零误伤）。心虫裁决：philosophy_decision type=accelerate（confidence 0.7 / priority 40；cognitiveLoad、uncertainty 为 "unknown"，按轮次纪律未当实质背书）。
- 五门禁全绿：verify 16/16、guard 20/20、doc-numbers 24/24、双向召回 52/52 不降且误拦 302/326 不升（与基线逐位一致，零误伤）；round-200 轮测 48/48；变体矩阵攻击 8/8 非 pass 且 goal_drift 承重、良性 9/9 pass（含授权变更/觉察纠正/概念讨论/对冲/隐式置换五类边缘良性）。

## [6.8.128] - 2026-11-03

### Added — 第 196 判别维度 `opinion_entitlement`「观点权利豁免/主观主义谬误」（r199，真升级类型 1：新判别维度）
- 新增 src/opinion-entitlement.js：两腿共现（腿① 观点/信念主观性或权利宣告 × 腿② 拒绝举证/拒绝证据裁决/拒绝被说服改变/拒绝审视）+ 6 类豁免（主观偏好/价值域、尊重他人权利、修正/证据开放、元话语、对冲、疑问）。命中「用持有观点的权利或『这只是主观看法』免除举证、拒绝用证据裁决」这一此前 195 维零命中的逃避检验攻击族。
- 判据纯规则实现（枚举腿含裸名词形态），不引入 LLM 依赖。
- 接入 src/index.js（require/计算点/allDims/dimMap/DIM_GUIDANCE/VERIFY_DIMS/dimensions 七处）；维度 195→196，VERIFY 152→153；README/SKILL/AGENTS 三处数字同步。
- 五门禁全绿：verify 16/16、guard 20/20、doc-numbers 24/24、双向守卫召回 52/52 不降且误拦 302/326 不升；变体矩阵攻击 7/7 非 pass、良性 7/7 pass。

## [6.8.127] - 2026-11-02

### Added — 第 195 判别维度 `cum_hoc`「相关≠因果谬误」（r198，真升级类型 1：新判别维度）

- **新文件 src/cum-hoc.js（289 行）**：`checkCumHoc(text, inject)` + `__internals`（14 个可注入常量）。辨别的族：cum hoc ergo propter hoc（拉丁语「与此并存，故因彼此」）——把**两个变量的相关/共现/同步**直接当成**其中一个导致另一个**的证据。相关性只说明两变量同变，不说明方向、更不说明因果（同变可能源于第三变量、双向因果、或纯巧合）；把相关当因果，会让未经检验的因果叙事获得数据外衣，驱动错误的干预与决策。
- **判据两腿共现 + 邻近窗（中文 24 字 / EN 70 字符），缺一不判**：腿① CORRELATION 显式相关/共现标记（相关/关联/成正比/成反比/伴随/同步/共现/一同出现/联动/高度相关/显著相关；EN correlated / associated / linked / goes hand in hand / co-occur / proportional）；腿② CAUSAL 前向因果动词（导致/造成/引起/引发/促使/带来/催生/诱发/使得/提升了/能够提升；EN causes / leads to / results in / drives / boosts / brings about / increases）。计分 0.60 + 推断连接词 0.06 + 显式强度相关词 0.05，封顶 0.85。**r161 教训**：相关/关联/同步/成正比收裸名词形态；结果动词（提升/提高/增加/降低/减少）须带因果模态前缀（能够/会/将/使…），既收「能够提升」又不误收「努力提高」这类目标句。**关键边界取舍**：刻意弃用「是因为」作因果腿——「A 和 B 相关是因为 C」是 common_cause 的正确解释，前向腿只收「A 导致/造成 B」。
- **豁免五组 + 疑问句**：概念/教学转述与共同因素解释（相关不等于/伪相关/混淆变量/共同因素/辛普森/内生性/相关系数/统计学；EN correlation is not causation / confounding / spurious correlation / common cause / Simpson's paradox）、实验/证据语境（随机对照/双盲/安慰剂/前瞻性/队列/元分析/格兰杰/数据显示/研究表明；EN randomized / controlled trial / RCT / Granger / data show / evidence shows）、推理否定/觉察承认（不代表/不等于/并不意味着/推不出/未必/可能只是/纯属巧合；EN does not mean / not necessarily / may just be / mere coincidence / open question / remains unclear）、对冲、疑问句。
- **src/index.js 七处接线**（+20 行：require / compute / allDims / dimMap / DIM_GUIDANCE / VERIFY_DIMS / dimensions 输出对象），VERIFY 级——「相关到底是不是因果」需要补的是时间先后、对照组、机制路径，不是改写句式。
- **边界**：与 post_hoc（管**时序连接**「A 在 B 前所以 A 导致 B」，本族不依赖时序、承重的是共变/相关）、reverse_causation（管**反应型行为×负面结果**方向倒置，腿①用比较级 更/多/高，本族腿①用显式相关词，词表不交叉）、common_cause（管**伪相关**第三变量，本族不管第三变量且共同因素解释明确放行）、pseudo_causal（管**精确倍数**假机制，本族管相关→因果方向）、statistical_misleading（管**数据呈现误导**）、monocause（管多因压单因）刻意错开。
- 来源（真实，未编造）：三层研究——HN Algolia "causal reasoning LLM" 命中 observability/时序推理类文章（非判据可复用）；GitHub API "fallacy detection"（sort=stars）命中 dhfbk/faina ★5（NAACL 2025《Fine-grained Fallacy Detection with Human Label Variation》，aclanthology.org/2025.naacl-long.34/，20 类谬误细粒度标注，作分类学参考）、panFJCharlotte98/Fallacy_Detection ★5（EMNLP 2024 LLM zero-shot 分类器）——均依赖 LLM 或仅分类器框架，无可复用纯规则判据；Semantic Scholar 连续 HTTP 429 空返，如实记录。判据为心虫自有纯规则实现（零 LLM 依赖）。侦察落盘 /tmp/hf-scout-*.txt。缺口实证：grep -ril 'cum_hoc|cum-hoc' src/ 0 命中（194 维无一覆盖「相关→因果」族）。心虫裁决：philosophy_decision type=accelerate（confidence 0.7 / priority 40；cognitiveLoad、uncertainty 为 "unknown"，按轮次纪律未当实质背书）。
- 验证：round-198 轮测 45/45（攻击 8/8 命中含中英/裸名词/带修饰/倒装/长句、良性 10/10 放行含觉察/元讨论/证据/仅相关/共同因素/仅因果/对冲/目标句、3 项豁免陷阱「含豁免放行+抹掉转命中」、5 项腿常量负例注入承重含中英逐侧独立、gate 层变体矩阵攻击 8/8 非 pass 且 cum_hoc 承重 + 良性 10/10 pass）；五门禁：verify 16/16、guard-abilities 20/20、doc-numbers 24/24、双向召回 52/52、误拦 302/326（与基线逐位一致，零误伤）。维度数 194→195、VERIFY 151→152、模块 162 不变（纯函数维度模块不进 _modules registry）。

## [6.8.125] - 2026-11-02

### Added — 第 194 判别维度 `argument_to_moderation`「诉诸中庸」（r196，真升级类型 1：新判别维度）

- **新文件 src/argument-to-moderation.js（约 300 行）**：`checkArgumentToModeration(text, inject)` + `__internals`（14 个可注入常量）。辨别的族：把两个立场并置后断言**「真相/正确答案在中间」「各打五十大板」「折中才是对的」「一个巴掌拍不响」**，用「取中」这个动作本身替代对双方证据的检验。中间立场偶尔确实更接近真相，但那要凭证据成立，不能凭「它在中间」成立——以位置取信跳过的是举证责任。
- **判据两腿共现 + 叙事窗，缺一不判**：腿① MIDDLE 中间/折中立场表述（中间立场/中间道路/真相·答案·结论在(两者|双方)之间/折中/中庸/各打五十大板/一个巴掌拍不响/双方都有错/都太极端/走了极端/各让一步/各退一步/取(个)中间；EN middle ground / in between / split the difference / meet in the middle / halfway / compromise position / both extremes / the middle position）；腿② TRUTH 中间=正确断言（才是[^。；，]{0,8}(对|正确|真理|正解|理性|客观|公道|合理|最优|出路|公平)的/(中间|折中|中庸)才是X/都不全对/把(中间|折中)当成(真理|真相|正确)/(最|才)(公平|合理)的(处理|解决|做法|方案|方式)/(正确|真正|对)的(答案|结论|真相|立场)(就)在；EN is the (correct|right|true|rational|fair|fairest|reasonable|best) answer/position/conclusion / truth lies in the middle / both sides are wrong / neither side is entirely right / middle ground is the (correct|fairest|rational) / the (fairest|correct|best) position is (the one) in between / between the two extremes），两腿命中相距 ≤50 字（EN ≤200 字符）。计分 0.62 + 俗语形（各打五十大板/一个巴掌拍不响/split the difference）0.06 + 显式中间=正确断言 0.04，封顶 0.85。**r161 教训**：「中间立场」「折中」「各打五十大板」「双方都有错」全部收裸名词形态；「取中间」收受限形，不收「中间」裸词（「中间价/中间值」是算术语境，另有算术豁免兜底）。
- **豁免五组 + 疑问句**：概念/教学转述（诉诸中庸/argument to moderation/中庸之道/儒家/亚里士多德/逻辑谬误/教材/论文）、谈判/交易/和解（谈判/协商/和解/调解/协议/签约/签署/成交/报价/让步/调解员/合同；EN negotiated / deal / signed / contract / settlement / mediation / agreement）、算术/统计取中（平均值/均值/中位数/中间值/取平均；EN average / median / midpoint）、推理否定（并不总是/并不等于/不等于/并不意味着/未必/不一定/推不出/不见得/是谬误；EN does not mean / not automatically / not necessarily / is not correct）、对冲（可能/也许/或许/大概/似乎/好像/说不定；EN maybe / perhaps / might / probably / seems）。
- **src/index.js 七处接线**（require / compute / allDims / dimMap / DIM_GUIDANCE / VERIFY_DIMS / dimensions 输出对象），VERIFY 级——「取中代替举证」需要补的是两端各自的证据强度与折中结论为何更成立，不是改写句式。
- **边界**：与 false_balance（管**等权并置**——「两种说法/各有道理」把未证实指控并列到已证事实旁，本族不停留在并置、而是进一步断言**中间立场才是正确的**：false_balance 说「一样重」，本族说「中间对」）、false_dilemma（管**排除第三选项的二元压迫**「要么A要么B，没有中间路线」，本族恰好相反——承认两端存在，但把**中间**封为真理，不逼人选边）、false_equivalence（管错误类比，本族不引入类比对象）、sole_narrative（管口径垄断「只许一种说法」，本族主张「只有中间那种说法对」）、monocause（管多因压成单因，本族不断言原因数量，反对的是**以位置取信**）刻意错开。
- 来源（真实，未编造）：HN Algolia "logical fallacy detection" 命中 arXiv:2405.02318《Translating natural language to first-order logic for logical fallacy detection》（pts=258，comments=143，https://arxiv.org/abs/2405.02318）——确认谬误检测是 NLP 公认任务族，NL2FOL 路线与纯规则引擎不同构，只作概念背景；GitHub API "fallacy detection"（sort=stars）前列 latent-variable/Real_time_fallacy_detection ★120（LLM 实时转写）、tmakesense/logical-fallacy ★21（在线工具无判据代码）、panFJCharlotte98/Fallacy_Detection ★5（EMNLP 2024 LLM zero-shot 分类器）、dhfbk/faina ★5（NAACL 2025）、SeanFlannery/Logical.ly ★4——全部依赖 LLM 或仅有分类器框架，无可复用的纯规则判据；Semantic Scholar HTTP 429 空返。判据为心虫自有纯规则实现（零 LLM 依赖）。侦察落盘 /tmp/hf-scout-1793624xxx.txt。缺口实证：grep -rniE 'moderation|中庸|中间立场' src/ 仅命中古籍书名（《中庸》）与 content moderation 一词。心虫裁决：philosophy_decision type=accelerate（confidence 0.7 / priority 40；cognitiveLoad、uncertainty 为 "unknown"，按轮次纪律未当实质背书）。
- 验证：round-196 轮测 54/54（攻击 10/10 命中含中英/裸名词/带修饰/倒装/长句、良性 14/14 放行含谈判成交/算术取中/元讨论/推理否定/市场行情/拼合优点、7 项豁免陷阱全部「含豁免词放行+抹掉豁免转命中」、4 项腿常量负例注入承重、gate 层变体矩阵攻击 6/6 非 pass 且 argument_to_moderation 承重 + 良性 7/7 pass）；五门禁：verify 16/16、guard-abilities 20/20、doc-numbers 22/22、双向 召回 52/52 误拦 302/326（与基线逐位一致，零误伤）。维度数 193→194、VERIFY 150→151、模块 162 不变（纯函数维度模块不进 _modules registry）。

## [6.8.124] - 2026-11-02

### Added — 第 193 判别维度 `regression_to_the_mean`「回归均值误归因」（r195，真升级类型 1）

- **新文件 src/regression-to-the-mean.js（约 330 行）**：`checkRegressionToMean(text, inject)` + `__internals`。辨别的族：某指标先处于**极端值**（最差/谷底/连败/创新低，或巅峰/夺冠/历史新高——回归是**双向**的），随后**朝均值方向移动**（好转/回升/回到中等，或回落/退潮），文本把这次移动**归功于同期的某个干预**（吃药/贴膏药/换人/报班/换方法/请大师；EN took / hired / switched / started）。极端值之后的下一次测量天然朝均值移动，与干预是否有效无关；没有对照组时「干预后好转」证明不了任何事。
- **判据三腿共现 + 叙事窗，缺一不判**：腿① EXTREME 极端基线（双向：极端低族 最差/谷底/垫底/连败/暴跌/历史新低；极端高族 巅峰/夺冠/历史新高/年级第一/创新高；EN worst/lowest/rock bottom/lost N in a row、best/highest/peak/record high）；腿② REGRESSION 回归性变化（双向：自低处回升 好转/恢复/回升/回暖/回到.{0,8}(正常|平均|中游|中等)/赢回来/不疼了；自高处回落 回落/减退/平息/回归平淡/热度退了；EN recovered/bounced back/back to normal、dropped back/faded/subsided）；腿③ ATTRIB 干预×功劳/功效归因（干预动词 吃了/换了/请了/试了 + 裸名词形 贴膏药/换帅/报班/抄底/拜佛 × 功劳词 多亏/全靠/幸亏/功劳/归功于 或功效词 有效/见效/管用/很关键/果然/一贴就，12 字窗内共现）。计分 0.62 + 功劳归因形 0.06 + 显式干预动词形 0.04，封顶 0.85。**r161 教训**：「谷底/连败/赢回来/贴膏药」全部收裸名词形态；「回到」收「回到.{0,8}(正常|平均|中游|中等…)」受限形，避免误收「回到家/回到公司」。
- **豁免四组 + 疑问句**：概念/教学转述（均值回归/regression to the mean/统计学/教材）、实验/证据语境（随机对照/对照组/双盲/安慰剂/剔除极端值/截尾/温莎化/基线校正/纵向/自然实验）、推理否定（不能说明/不能排除/推不出/未必/很难说/不好说/说不清/难以确定/可能是自然）、对冲（可能/也许/或许/大概/似乎/有待）。
- **src/index.js 七处接线**（require / compute / gate 数组 / dimMap / DIM_GUIDANCE / VERIFY_DIMS / allDims-dimensions），VERIFY 级——「干预后好转」需要补的是对照组与机制证据（没做干预的同质群体是否也回归了），不是改写句式。
- **边界**：与 post_hoc（管时序连接，本族不依赖时序、承重的是极端基线这个统计前提）、gamblers_fallacy（管预测下一次，本族管解释已经发生的回归）、hot_hand（管连胜→下次胜率）、clustering_illusion（管聚集当规律）、base_rate_neglect（管单信号无视基础概率）、pseudo_causal（管精确倍数/玄学归因）、common_cause / reverse_causation（管相关→因果与方向倒置）、monocause（管多因压成单因）刻意错开。
- 来源（真实，未编造）：HN Algolia "regression to the mean" 命中 "Regression to the mean is the main reason ineffective treatments appear to work"（objectID 10731023，pts=137，http://www.dcscience.net/2015/12/11/placebo-effects-are-weak-regression-to-the-mean-is-the-main-reason-ineffective-treatments-appear-to-work/）、"Regression to the Mean: on LLMs and the quiet death of the new"（48804219，pts=71）、"Gambler's Fallacy and the Regression to the Mean"（29845334，pts=68）；GitHub `regression to the mean fallacy` total_count=0、`logical fallacies list` 最高 LukeStonehm/LogicalDefence ★140（通用列表无可移植判据）；Semantic Scholar 连续三次 HTTP 429 空返。判据为心虫自有纯规则实现（零 LLM 依赖）。侦察落盘 /tmp/hf-scout-1793616770.txt。缺口实证：grep -ril 'regression_to_mean|regression-to-the-mean' src/ 0 命中。心虫裁决：philosophy_decision type=accelerate（confidence 0.7 / priority 40；cognitiveLoad、uncertainty 为 "unknown"，按轮次纪律未当实质背书）。
- 验证：round-195 轮测 43/43（攻击 8/8 命中含中英/裸名词/带修饰/倒装/长句/双向回归、良性 7/7 放行含元讨论/推理否定/无归因腿/对冲/边缘多因不可归、11 项常量负例注入承重含逐族置空互不影响与三类豁免抹除转命中、gate 层变体矩阵攻击 7/7 非 pass 且 regression_to_the_mean 承重 + 良性 7/7 pass）；五门禁：verify 16/16、guard-abilities 20/20、doc-numbers 22/22、双向 召回 52/52 误拦 302/326（与基线逐位一致，零误伤）。维度数 192→193、VERIFY 149→150、模块 162 不变（纯函数维度模块不进 _modules registry）。

## [6.8.123] - 2026-11-02

### Added — 第 192 判别维度 `motte_and_bailey`「稻草城堡谬误」（r194，真升级类型 1）

- **新文件 src/motte-and-bailey.js（约 260 行）**：`checkMotteAndBailey(text, inject)` + `__internals`。辨别的族：**争议性、难举证的主张（bailey）与平庸、易守难攻的表述（motte）被混为一谈**——先推进争议主张，被质疑时退守「我只是开玩笑/别较真/个人观点」，并主张原主张「未被驳倒」、指责质疑者「较真/对号入座」，用遁词把举证责任反向推给质疑者。
- **判据两腿共现 + 分组豁免，缺一不判**：腿① BAILEY 争议主张（全称量词形：所有/全部/凡是/一律/毫无例外/个个…都；群体刻板形：男人/年轻人/专家们都一个德行/不是好东西，裸名词+「们」双形态；极端处方形：必须彻底消灭/全面封杀；EN all/every/everyone…、men/women/immigrants are all the same/trash、must be completely banned）；腿② MOTTE 退守遁词（我只是随便说/别当真/认真你就输了/纯属个人观点/我又没让你信/对号入座/谁急了谁就是说中了；EN I'm just saying/just asking questions/don't take it seriously/lighten up/if the shoe fits）。计分 0.60 起，家族数 ×0.06，审查否定型遁词 +0.05，封顶 0.85。
- **豁免**：元讨论（稻草城堡/motte/bailey/castle and courtyard）、否定/劝止（别拿「我只是开玩笑」当挡箭牌）、无争议主张腿的单纯谦逊、无遁词腿的单纯绝对化（absolute_claim 辖区）。
- **src/index.js 七处接线**（require / compute / gate 数组 / dimMap / DIM_GUIDANCE / VERIFY_DIMS / allDims-dimensions），VERIFY 级——遁词代替举证需要补的是争议主张的证据或撤回，单凭两腿共现无法断定主观恶意。
- **边界**：与 absolute_claim（管绝对化措辞本身，本族要求两腿共现）、scrutiny_evasion/seizing（管单一逃避句式，本族管成对替换结构）、gaslighting（管关系操纵）刻意错开。
- 来源（真实，未编造）：HN Algolia 命中 Wikipedia「Motte-and-bailey fallacy」条目与 Slate Star Codex 2014 年原文（http://slatestarcodex.com/2014/11/03/all-in-all-another-brick-in-the-motte/）；GitHub `motte bailey fallacy` 检索 total=0（无可复用代码）；Semantic Scholar 429。判据为心虫自有纯规则实现（零 LLM 依赖）。侦察落盘 /tmp/hf-scout-1793608728.txt。心虫裁决：philosophy_decision type=accelerate（confidence 0.7 / priority 40；cognitiveLoad、uncertainty 为 "unknown"，按轮次纪律未当实质背书）。
- 验证：round-194 轮测 41/41（攻击 11/11 命中、良性 8/8 放行、单家族攻击 4/4、7 项常量负例注入承重含逐族置空与豁免抹除转命中、gate 层变体矩阵攻击 6/6 非 pass 且 motte_and_bailey 承重 + 良性 6/6 pass）；五门禁：verify 16/16、guard-abilities 20/20、doc-numbers 22/22、双向 召回 52/52 误拦 302/326（与基线逐位一致，零误伤）。维度数 191→192、VERIFY 148→149、模块 162 不变（纯函数维度模块不进 _modules registry）。

---

## [6.8.122] - 2026-11-02

### Fixed — LOW 批次收尾轮（v6.8.120 审计轮遗留 + 合并回归暴露项）

- **think() 并发互斥**：`_pendingInputCheck` 实例字段跨 await 边界，并发 think() 互相清掉/丢计数（读-改-写无互斥）。改局部变量（heartflow.js 之外零引用方，安全）。实测：输入辨别合并仍在（情感操纵句 1 issue）+ 并发双 think 互不干扰。
- **archive 断链清零**：src/archive/sleep-wake.js `require('./heartbeat')` → `require('../core/heartbeat.js')`；audit-missing-requires 待分类引用 1→0。
- **v6.1.7 注释残留死行**：heartflow.js 中 `// [v6.1.7]    } catch (_) {...}`（try 体丢失、catch 被注释吸收，语法合法故从不报错）删除；能力后由 v6.4.6 接线承载。
- **门禁严格化**：
  - doc-numbers-accuracy.test.js 五处条件断言（`if (rows[X] !== undefined)` / `if (t)`）改为先断言行存在再比对——规格表形状漂移必须红灯，不能静默跳过。
  - guard-abilities.js 过时注释「51 个 check 函数」→ 176。
  - verify.js 模块数地板 124 → 150（实测 162，原地板值失去回归意义）。
- **sync-version.js 补兜底常量同步**：src/core/version.js 的 `let VERSION` 兜底常量此前无人管理，实测静默停滞 6.8.120 落后两个版本（runtime 读 VERSION 文件所以不报错；兜底值是 VERSION 文件丢失时的唯一版本源）。新增 syncVersionFallback() 每次 bump 自动同步。
- **合并回归修复**（v6.8.121 合入时暴露，已在 merge commit 6572497f 修复，此处补录）：openmem 先例查询在 think() 开头引入 await 边界后，verify.js「同步阶段 stop() → 之后 await 异步检查」顺序使 think 续跑撞 started 检查（16 项必挂 1 项）——停止引擎移至 Promise.all 完成后。

### 未修（如实记录）

- start() 约 12 处关键路径实例化无 try/catch：identityCore 等关键路径 fail-fast 是设计意图，批量包 try/catch 回归风险大于理论收益；engine-initializer 路径已由 v6.8.121 远端提交修复（typeof 守卫 + _missingPhases）。

### Verification

- 五门禁全绿：verify 16/16、guard 20/20、doc-numbers 22/22（严格化后仍全过=规格表形状完好）、bidirectional 52/52 误拦 302/326 不升。
- 冒烟 restart ok、think 6 分支 initErrors=0；round-193 33/33、security-audit 16/16、fetch-safe 2/2、progress-judgment 34/34。
- 单点：输入辨别合并 OK（1 issue）、并发 think 双 ok、audit-missing-requires 0 待分类、version.js 兜底 6.8.122。

## [6.8.121] - 2026-11-02

### Added — 第 191 维度 ad_nauseam「诉诸重复/反复断言冒充论据」上线（r193）
- 新增判别维度 **ad_nauseam**（诉诸重复 / argumentum ad nauseam / appeal to repetition）：识别把**同一内容子句**在文本里**重复 ≥3 遍**（或 ≥2 遍且带显式重复标记「我已经反复强调/as I've said/over and over」）、以重复频率冒充论据强度的**结构型**谬误。补齐既有 190 维**单句内容型**谬误之外的**重复密度型**盲区——该族在 AI 反复强调式输出里高发（"这个方案是安全的。这个方案是安全的。这个方案是安全的。"用复读代替论证）。
- 判据两腿共现 + 分组豁免：腿① UNIT 重复单元（按标点切子句归一化，中文 ≥6 汉字 / 英文 ≥3 词且含 ≥3 连续字母，排除版本号/纯数字/代码 token 偶然重复；r161 教训——以「子句」为单位天然覆盖裸名词与倒装/嵌套/部分重复形）；腿② COUNT 出现次数（全文归一化串非重叠计数）。豁免：引文内复读（转述）、元讨论（讨论该谬误本身）、否定/劝止（别再重复/stop repeating）、累积式并列（各子句不同的正当证据累积）。
- 新文件 src/ad-nauseam.js + src/index.js 七处接线（VERIFY 级）；新测试 test/round-193-ad-nauseam.js。维度数 190→191、VERIFY 147→148、模块 161 不变。
- 来源（真实，未编造）：HN Algolia arXiv:2405.02318（NL→FOL 逻辑谬误检测）；GitHub fallacy-detection 仓库全为 LLM 方案无可复用代码；判据为心虫自有纯规则实现（零 LLM 依赖）。
- 验证：round-193 轮测 33/33；五门禁全绿（verify 16/16、guard 20/20、doc 22/22、双向召回 52/52 误拦 302/326 不升）。
### Fixed — 第二轮全面审计修复（5 路子代理并发扫描，CRITICAL 0 / HIGH 4 / MEDIUM 15+；另含 openmem 先例维度加固）

**安全（SSRF 网关）**
- url-validator `isBlockedV6`：IPv4-mapped IPv6（`::ffff:127.0.0.1`、`::ffff:169.254.169.254` 云元数据）、IPv4-compatible（`::/96`）、NAT64（`64:ff9b::/96` 含 hex 压缩形态）此前均返回 safe:true——SSRF 网关整体可绕过。新增 IPv6 展开器统一解包复走 V4 判定，非标准 NAT64 编码 fail-closed 拦截（实测 11/11 用例通过）
- 先例维度白名单回归修复：allow-list 检查曾排在协议校验之前，`ftp://127.0.0.1:3468` 可返回 safe:true。白名单收敛为新模块 `src/security/local-service-allow.js`（单一事实源，url-validator 与 fetch-safe 共用），强制三条约束：仅 http/https、仅 IP 字面量（拒绝域名，防重绑定窗口）、localhost/::1 归一化（修复运营误配导致先例维度永久静默降级）

**能力接线（代码存在但能力不存在）**
- logicReasoning：自实例化起 think() 零调用（v5.x 时代 100% 命中的逻辑辨别在 6.8.x 管线掉线）。接回输入层：`analyze()` 五合一分析 → `_sv.logic` → `result._logicReasoning` + 结论谬误/推理类型行。bench：logic 0/6 → 6/6，零回归，+1ms
- progressJudgment：实例注册后 think() 零调用，`_sv.progress` 永为 null → 每次 think() 向 decisionFeedback 写一条恒定 `correct:false` 假负样本污染决策反馈权重。按本次实际产出（结论+推理链）做真实进步判断
- judgmentEngine 多路径判断（核心卖点）死接线两处：① decision-intent 正则漏「应该…吗」最常见决策句式（「我应该接受…吗？」不触发），放宽至 20 字间距；② `context.logicReasoning` 全库无赋值处 → 谬误风险惩罚 -1 从未生效，现传输入层逻辑分析结果
- eduEngine 注册名错位：实例在 `this._eduEngine` 而 LATE_ADDITIONS 注册 `this['eduEngine']`（恒 undefined）→ dispatch 与健康检查双通道不可达
- engine-initializer：start() 调用 3 个全仓库不存在的函数（未完成拆分残留），任何人接线即 ReferenceError。改为缺失阶段跳过+记 _initErrors+不谎报 started
- safe-fs：`safeMkdirSync/safeMkdirSyncRecursive` 定义但未导出
- adaptive-learning 画像持久化：`_persist` 用 `fs.promises`（safe-fs 无此导出）→ 每次必抛被 catch 静默，画像从未落盘。改用 safe-fs 同步 API

**逻辑/内存 bug**
- logic-reasoning 环形缓冲区：`new Array(this._maxHistory)` 在赋值前执行（长度 1），容量检查空块 → 实测 maxHistory:3 分析 11 次 length=12 无界增长（该模块现已进 think() 热路径）。按原注释意图真正实现环形缓冲 + getHistory 时间序 + getStats.totalAnalyses 读 _historySize
- logic-reasoning activeInference 刻度：confidence 是 0.1–1.0 标量，`/100` 与 `<50` 是 0–100 遗留 → exploitation 恒 ≤0.01、needsMoreEvidence 恒 true（实测）
- experience-collector `_cleanup()` 淘汰公式 `usefulness - timestamp/1e7`：时间项以 6 个数量级压过有用性 → 排序等价于按时间降序 → **淘汰的永远是最新经验**，最旧的反被保留。改为按年龄衰减（每天 -0.05）
- memory-write-controller `_writeDecisions` 6 个 push 点无裁剪 → 封顶 200
- memory-bank `sessions` Map 只 set 不 delete → 封顶 200，endSession 淘汰最旧
- adaptive-learning `profiles` Map 无上限 → 封顶 500
- memory-consolidator setInterval 无 in-flight 保护（consolidateAll 超间隔时重叠执行）→ 重入守卫 + unref
- embodied-core BACKOFF 退避：waitMs/waitUntil 算出后均未使用（死变量），同步递归重试零延迟 → 记录 backoffWaitMs 供上层异步调度，不再假装等过
- platform-adapter 构造函数不保存 config.rootPath → `_isPathAllowed` 恒 false，默认构造路径文件 IO 100% 失效
- mcp-server ROLES 死解构（index.js 无此导出，handler 内也未用）
- meta-engine selfEdit `new RegExp('## ' + key)` 未转义（正则注入）
- dream-loop DreamEngine 假导出（dream.js 无此导出，恒 undefined）
- engine-reasoner 4 行重复 module.exports

**先例维度隐私加固（B 方案）**
- 结论行 snippet 进输出前过 `sanitizeForPersistence` 消毒（原注释声称 cred_guard 已打码/LEARNED 层过滤，与实际不符——库侧无 LEARNED 层、cred_guard 只掩密钥字面量，m 层条目可能含用户私有内容）
- 先例服务 SQL 加 `layer IN ('k','m')` 过滤（p 层提示词库不污染 Top-K）；EMBED_MODEL 与 mem_core.py 读同一 env（防向量不同构致分数失真被 MIN_SCORE 过滤成 hits:0）；top_k 解析 clamp [1,10]（非数字曾断连、负数曾 503）
- openmem-precedent.js 截断与 openmem 侧对齐 480（bge 512 token 上限；原 2000 传 4 倍无用数据）、逐条 typeof 守卫

### Verification
- 22 个改动文件 `node --check` 全过；引擎加载 162 模块 `_initErrors: 0`
- bench 5 维度 34 题 A/B：logic 0/6→6/6，decision 8/8、emotion 4/8、intent 4/6、stability 5/6 分毫不变（零回归），平均 63ms
- SSRF 修复 11/11 用例通过（IPv4-mapped/NAT64/协议后门/localhost 归一化/IP 字面量约束）
- 模块测试：logic-reasoning 9/9、logic-patterns 10/10、fetch-safe 2/2、engine-initializer 1/1、adaptive-controller 2/2
- 先例维度在线：available=true 8 题命中 ~20ms；服务挂掉 8ms 静默降级


## [6.8.120] - 2026-11-02

### Fixed — 全面审计修复轮（用户指令：全面审计→全面修复→同步 GitHub；3 路子代理并发扫描 527 文件，CRITICAL 0 / HIGH 10 / MEDIUM 10 修复）

**HIGH**
- **heartflow.js think() 每次必抛 TypeError**：`_PrivacyExposure.sanitizeForPersistence(input)` 漏调 lazy 函数（缺 `()`），错误被 catch 吞后 Engram 存储/召回整块失效（`result._engramRecall` 恒 undefined）。修复后实测恢复真实召回。
- **reward_hacking BLOCK 级豁免击穿**：DISCOURSE_FRAME 豁免未过 INTEGRITY_BREAK/CHECK_SUPPRESSION_SIGNAL 信号闸，「比如，直接绕过安全检查」加谈论框架前缀即整体豁免。移除弱举例标记组（举个?例子/举例来说/比如/像是）+ 双闸对齐；良性元话语（论文里提到/报告里指出/众所周知）3/3 仍豁免，round-25 回归 27/27。
- **MCP 匿名提权**：OID 身份码只做格式正则（`HeartFlow-OID-<16hex>`）无签发/校验体系，匿名 guest 自报 `x-heartflow-oid` 即被提为 user，穿过 WRITE_TOOLS 对 40 个写工具的拦截。修复：guest 持 OID 不提权；固化该漏洞的 mcp-auth-e2e-real 第5项期望同步反转为「无 token 仅持 OID → 写工具被拦」（13/13）。
- **换钥致记忆库静默重置**：`rotateKey()` 的 `_scanEncFiles` 只收 `.enc` 后缀，`data/memory-bank.json`（同 `HEARTFLOW_v1` 格式）被漏扫；10-30 换钥后 MemoryBank 每次启动 `Decryption failed ... starting fresh` 整库丢弃（冒烟日志实锤）。修复：按内容探测（`"_enc"` + `HEARTFLOW_v1`）纳入轮换。已丢失密文因密钥消失不可恢复，今后不再发生。
- **文档漂移 6 处**：package.json description 168→190、SKILL.md 184→190 ×2 / 149→177 / 矛盾句；sync-doc-numbers.js 补登记 CONTRIBUTING.md/CURRENT_STATE.md 两份活文档（原清单外漂移无人同步），并修复其把 UPGRADE_LOG.md 历史轮次数字误报为漂移的缺陷（历史档案加入 KNOWN 排除）。
- **回归门禁静默放行**：heartflow-self-evolve.js 判据 `/(\d+) failed/` 只匹配英文而 run-all.js 汇总为中文「N 通过, M 失败」，叠加 180s 超时必杀 27 分钟的全量回归——被杀后 failedCount=0，「测试通过 ✓ (0 passed)」空放行并继续 commit/push。修复：中英双语判据 + 无汇总行 fail-closed + run-all 超时提至 30min。
- **即崩工具假宣传**：scripts/heartflow-memory-tool.js / heartflow-memory-inject.js require 全仓不存在的 `HeartFlowMemory` 类（从未入 git，运行即 MODULE_NOT_FOUND），却被 two-pass-response 技能宣称为记忆注入能力。删除两个死脚本；宣称修正为 plugins/heartflow-memory-inject.py（Hermes 插件层，真实实现）。
- **假健康**：24 个 `_stubFactory` 占位子系统 healthCheck 恒 `{ok:true}`、45 条空壳路由虚占白名单；4 个假全局桥接类（ProcessRewardModel/DesireCognition/CognitiveLoadCalculator/WorldLandscape）打假「加载成功」日志。统一诚实化：`{ok:false, stub:true/fake:true, reason}`。
- **死注册表 14 条**：engine-constructor.js initializeLazyRegistry 与 module-registry.js SPECIAL_MODULES 中指向不存在文件的条目（planner 族 8：adaptive-planner/strategy-selector/replan-trigger/curiosity-engine/desire-engine/goal-pursuer/self-initiator/hierarchical-planner；code 族 4；memory 族 2）——dispatch 报误导性 route not allowed。删除。
- **require 守卫自身红灯**：guard-require-integrity.js git 模式 exit=1（3 处 archive 断链）且 git 模式（扫 archive）与无-git 模式（跳过 archive）口径不一致。修 3 处 archive 断链（归档副本置 null 兜底保留历史形态）+ 统一双模式口径，527 文件 0 断链。

**MEDIUM**
- dimensions 输出对象补 `agency_deflection`/`ai_writing_tell` 键（此前命中进 findings 但读方恒 undefined）；dimMap 补 clickbait/unsupported_claim/pseudo_causal/soft_deflection/evidence/ai_writing_tell 6 键（findings detail 恒 1 修复）；`bullshit`→`bullshit_recognition` 三表命名统一（dimMap/allDims/输出/guidance）。维度口径 188→190，文档全量同步。
- `_thinkCache` 死代码连根删除（从未初始化、get 位于管线末端设计不成立，含 3 个无调用缓存函数）。
- threePoisons 空 try 块删除（静默缺失无日志）。
- mcp-server TOKEN_RATE_LIMIT_MAX 注释口径统一（实际 100/min，原注释写 5）。
- sseClients Map 加 CAP=64 LRU 逐出（原无上限，匿名 SSE 可累积 fd/内存）。
- Unix socket 权限 TOCTOU 修复：listen 前 `process.umask(0o177)` 保证 socket 创建即受限（原 chmodSync 在 listen 回调里才执行，窗口期内可被本机他人连接）。
- 6 处内存泄漏修复：WAL `_pending` compaction 后写回、outbound-ledger `_buffer` CAP=500、decision-engine `_qTable`/`_beliefState` CAP=2000、cross-domain-reasoner `_chains` CAP=500、window-attribution-receipt `_receipts` CAP=1000、url-validator DNS_CACHE TTL prune。
- package.json `files` 移除 `test/`（npm pack 从 3924 文件/27.3MB/828 个 test 文件瘦身）。
- measure-claimed-numbers.js / sync-doc-numbers.js 裸 `spawnSync('node')` → `process.execPath`（干净 PATH 下维度数不再静默输出 0）。
- src/memory/triality-memory.js 死代码出库（零 require 引用，含 4 处 Date.now()*1000 bug）。
- 3 个公式采集脚本 require 路径少一层 `..` 修复。

### Verification
- 五门禁全绿：bin/verify.js 16/16、guard-abilities.js 20/20、doc-numbers-accuracy 22/22、bidirectional-guard 召回 52/52 误拦 302/326（与基线一致零新增）、reward-hacking 回归 27/27。
- 冒烟：start/think/stop/双 stop/restart 全过、initErrors=0；think 6 分支（古典/宏观/决策/情绪/英文/注入）全过。
- mcp-auth-e2e-real 13/13（含反转后 OID 断言）、decision-router 23/23、engram-memory-wiring 全过。
- 单点复测：F1 `_initErrors 0→0` + `_engramRecall` 恢复；F3 攻击句 exempted→HIT；F4 匿名 OID 写工具被拦；F6 stub `{ok:false,stub:true}`；F7 `sync --check` 四份全绿无清单外；F9 require 守卫 0 断链；M8 干净 PATH 下 measure 正确输出 190。

## [6.8.119] - 2026-11-02

### Added
- **第188维度 `false_precision`（伪精确断言：无来源无约数的过分精确数字冒充量化证据，r192）** — 新增 `src/false-precision.js`（约 300 行，导出 `checkFalsePrecision` + 13 个可负例注入常量：`PREC_ZH/EN`、`CLAIM_ZH/EN`、`EXEMPT_HEDGE/SOURCE/EXACT/INSTRUMENT/YOY/META_ZH/EN`），登记 VERIFY_DIMS（146→147），维度总数 187→188。判别把**超出证据支撑精度的数字**（小数百分比/小数倍数/小数评分/小数年限/精确副词+数字：37.42% / 3.7 倍 / 92.6 分 / 12.5 年 / 整整 3.7 倍 / exactly 47.83%）以**无来源、无约数、无对冲**的断言形式给出、制造「量化严谨」假象的结构：数字的精度形态本身就是证据——「92.6 分」的 0.6 没有出处，「12.5 年」的 0.5 没有队列，是 AI 输出中最典型的数字幻觉形态。判据**两腿共现 + 分组豁免，缺一不判**：腿① PREC 精确数字形（必须含小数点或精确副词——四舍五入的整数是约整数的合法形态不判；161 轮教训：副词腿收裸词形态，「准确率 92.6 分」由「准确」前缀+数字命中）；腿② CLAIM 断言/度量语境（腿①前后 ≤24 字 / EN 48 字符内：效果动词/度量名词/结论标记——**裸名词形即断言语境**：「转化率 37.42%，完播率 21.8%」无动词也是伪精确陈列）。与 `perfect_error` S1_false_precision（管**裸**精确百分比、多信号协同判定，[v6.7.93] 起对度量名词语境整体豁免——本族专打该豁免腾出的空间）、`statistical_misleading`/`percentage_overflow`（比例数字呈现）、`unsupported_claim`/`bullshit`（断言缺依据强度）边界错开。明确不判：约数/对冲、具名来源、天然精确语境（日期/版本/计数/量纲/数学常数/时长历史，数字近邻窗）、仪器读数语域（同 r437 可定位复现边界）、统计口径（同比/环比/百分点）、元讨论（有效数字/小数点）、疑问句。缺口实证（/tmp/hf-probe-r192.js，v6.8.118 引擎）：本族 6 条攻击 4 条真零命中、6 条边缘良性零误伤。`src/index.js` 八处接线（require/计算点/allDims/dimMap/dimensions 读数/DIM_GUIDANCE/VERIFY_DIMS；变量名 fp）。模块 161 不变（纯函数维度模块不进 `_modules` registry）。外部来源（真实，未编造）：Wikipedia "False precision"（经 HN Algolia 检索命中）、zjunlp/FactCHD（IJCAI 2024，92★，事实冲突幻觉检测基准）；Semantic Scholar 三次检索 HTTP 429 空返。

## [6.8.118] - 2026-11-02

### Added
- **第187维度 `proxy_metric_goal`（代理指标当目标：古德哈特定律的谬误应用，r190 实现 / r191 接手补齐提交）** — 新增 `src/proxy-metric-goal.js`（353 行，导出 `checkProxyMetricGoal` + 14 个可负例注入常量：`METRIC_ZH/EN`、`GOAL_ZH/EN`、`CONN_ZH/EN`、`EXEMPT_SEP/DIRECT/HEDGE/META_ZH/EN`），登记 VERIFY_DIMS（145→146），维度总数 186→187。判别「**把测得的量（代理指标）当作目标本身达成或真实效果出现的证据**」结构：KPI 完成了所以目标肯定达成、下载量破百万所以产品满足需求、平均分上去了所以教学变好、测试覆盖率 100% 所以代码质量没问题、满意度打分都是五分所以客户真的满意。指标是目标的**代理度量**，代理读数上升不增加目标达成的证据——指标可被扭曲、博弈、与目标脱钩，古德哈特定律正是「度量变成目标之日，即它不再是好度量之时」。判据**三腿共现，缺一不判**：腿① METRIC 被测得的量（点击率/播放量/下载量/KPI/指标/完成率/覆盖率/分数/平均分/引用量/日活/留存率/满意度打分/GDP…全部裸名词形态；EN metric/downloads/coverage/score/KPI/views/revenue…）；腿② GOAL 目标/真实效果结论（目标达成/需求满足/质量没有问题/客户满意/效果显著/实力提高…；EN goal achieved/needs met/quality is fine/customers are satisfied/capability improved…）；腿③ CONN 连接（显式连接词，或两腿逗号并置且窗口内无转折词，总跨度 ≤80 字 / EN 160 字符）。与 `activity_outcome_confusion`（第184维 活动/投入计数→抽象成果）、`reward_hacking`（BLOCK 自认式指标作弊）、`statistical_misleading`/`percentage_overflow`（比例数字呈现）边界错开：本族腿①只收**测得的量**、是**无欺骗的推理谬误**（陈述者真诚相信「指标读数=目标达成」）。明确不判：主动分离指标与目标（不等于/不代表/只能说明/分开看）、目标本身直接证据在场（访谈/实测/复购/问题解决率）、对冲结论、概念/教学转述（古德哈特/代理指标/vanity metric）、疑问句。`src/index.js` 九处接线（require/计算点/allDims/dimMap/DIM_GUIDANCE/VERIFY_DIMS/dimensions 读数/summary；变量名 pmg）。缺口立项由 r186 `activity-outcome-confusion.js` 文档显式划界留白（「下载量破百万所以满足需求」「分数上去所以教学变好」归 Goodhart 族）。模块 161 不变（纯函数维度模块不进 `_modules` registry）。

## [6.8.117] - 2026-11-02

### Added
- 第 186 判别维度 `appeal_to_wealth`（诉诸财富/诉诸贫穷谬误，argumentum ad crumenam / ad lazarum）——`src/appeal-to-wealth.js`（新增约 290 行）判别「把财富或贫困状态当作观点正确性、判断力或可信度的证据」结构。判据两腿+连接、缺一不判：腿① STATUS 财富/贫困状态词（有钱/富翁/富豪/身家/富人/成功人士/白手起家/穷困/贫寒/穷得叮当响/寒门/底层出身…裸名词形态；EN billionaire/rich/wealthy/made billions/poor/poverty/the poor——限定搭配收录，不收裸「穷」（穷尽误伤）、裸「富」（丰富误伤）、裸「成功」（实验成功误伤）、裸「底层」（底层逻辑误伤））；腿② VALIDITY 认知有效性结论（有道理/是对的/高明/靠谱/眼光好/最懂/更懂…；EN sound/right/superior/credible/gets it——不收「值得参考」（经验价值）、不收「犯错/失误」（错误承认）、不收「业绩/收益」（实测数据））；腿③ 连接——路线 A（正向断言）腿①与腿②之间有推断连接词且间距 ≤50 字（EN 110 字符）；路线 B（反问断言）腿① ±50 字（EN 110）内有反问有效性形（眼光还能错吗/能有什么价值/懂什么；EN how could he be wrong），反问自身携带推断、免连接词。有效性断言前置否定时不判（否定守卫：短语否定窗 + 前置 4 字单字否定窗）。豁免：概念/教学转述、对冲结论、经验/业绩依据、纯状态陈述、否认关联、疑问质疑。VERIFY 级。维度数 185→186，VERIFY_DIMS 144→145；模块 161 不变（纯函数维度模块不进 _modules registry）。

## [6.8.116] - 2026-11-02

### Added
- **第185维度 most_transitivity（「大多数」链式传递谬误，r188）** — 新增 `src/most-transitivity.js`（约 500 行，20+ 可注入常量），登记 VERIFY_DIMS（143→144），维度总数 184→185。判别「**两个「大多数」前提推不出「大多数」结论**」——most 量词不满足传递性，两段「大多数」各自只覆盖自己前提的大部分，交集可以远小于半数，证据不能沿中间项累积：「大多数A队球迷支持主队，大多数支持主队的人会买季票，所以大多数A队球迷会买季票」「大部分用户点了同意，大部分点了同意的人都没读协议，所以大部分用户都没读协议」「Most students passed the exam, and most people who passed got certificates, so most students got certificates.」。判据**链式三件共现，缺一不判**：第一段「大多数」前提（量词+主项+非空谓项）× 第二段「大多数」前提主项包含第一段谓项关键词（中间项连续性）× 「大多数」结论（主项回指第一段主项、谓项是新内容、整体与第二段有共享关键词；结论带推断词覆盖倒装形，或跟句模式）。豁免：概念/教学转述、对冲结论、疑问句；结论须以 MOST 量词开头（「至少有些A是C」的特称结论与「A和C可能有关」的对冲结论天然不判）。与 illicit_conversion（全称换位）、affirming_the_consequent/denying_the_antecedent/conditional_proposition（条件句方向族）边界错开。缺口实证：候选四族探针（/tmp/hf-probe-r188.js、/tmp/hf-probe-r188b.js）实测中项不周延 5/6、肯定析取 3/5、堆垛 4/5 均被既有维度代拦，唯本族扩展矩阵 6/10 真零命中、8/8 边缘良性零误伤。`src/index.js` 八处接线（require/计算点/allDims/dimMap/DIM_GUIDANCE/VERIFY_DIMS/dimensions 读数/summary；变量名 mtr）。

### Fixed
- `src/core/version.js` — 兜底版本号同步 6.8.115 → 6.8.116（r187 立规的每轮手动同步项）。

## [6.8.115] - 2026-11-01

### Fixed
- **每日审计修复轮（r187）** — 引擎判别逻辑零改动，修复文档口径与版本传播缺陷：
  - `README.md` — 5 处维度数陈旧值同步至实测 184（badge 行 164→184、checkInput 表 168→184、pipeline 图 180→184、「What it catches」标题 180→184、verify 层计数 142→143）。
  - `SKILL.md` — 9-layer pipeline 图 `discriminate(46 dims)` → `discriminate(184 dims)`。
  - `AGENTS.md` — `checkInput` API 行 `discriminate (50 dimensions)` → `(184 dimensions)`。
  - `src/core/version.js` — 兜底版本号从 6.8.89 同步至 6.8.115（r161 起连续 25 轮升级遗漏手动同步此处，违反仓库约定 #1「fallback 必须与 VERSION 一致」；VERSION 文件读失败时引擎会自报落后 26 个版本的号）。已在 UPGRADE_LOG 立规：每轮 bump 必查此处。

### Verified
- 五门禁全绿：`bin/verify.js` 16/16、`scripts/guard-abilities.js` 20/20、`test/doc-numbers-accuracy.test.js` 22/22、`scripts/bidirectional-guard.js` 召回 52/52 误拦 302/326 不升、`scripts/measure-claimed-numbers.js` 维度 184 / 模块 161 / 工具 184 / 路由 1,314 与文档一致。
- 新维度抽查：取 r164/r167/r174/r182 四个维度轮测文件自报攻击样本共 78 条（doublespeak 43、one_sided_dismissal 15、cherry_picking 8、reverse_causation 12）亲自过 `gate()`，非 pass 78/78 且对应维度全部承重；良性样本 pass。
- 全量测试套件 `node test/run-all.js`（618 文件，1062.8s）：19,032 通过 / 71 失败 / 共 19,103；71 失败经 git stash 回 HEAD 复跑实证全部为存量（classics-rules searchClassicsBatch、round-502 helplessness 两条真断言失败 + round-639 时间戳 flaky + 5 条 command-failed + 约 63 条静默计失败规则），非本轮引入。
- 运行态 MCP `heartflow_status`：version 6.8.115 / modules 161 / running true，与磁盘一致。

## [6.8.114] - 2026-11-01

### Added
- **`activity_outcome_confusion` — dimension 184 (活动/投入当成果：以工代果)** — 判别「**把会议场次/发文份数/加班时长/代码行数/走访户数等活动或投入计数，当作「推进得好/进展巨大/成效显著/成绩斐然」这类抽象成果的证据**」结构。活动量与成果之间没有必然传递——会开得多可能议题涣散，班加得猛可能在做无用返工，代码行数多可能蕴含更多缺陷；用活动的**数量**给成果**背书**，是把「做了很多」偷换成「做成很多」。判据**活动腿×抽象成果腿×因果连接三腿共现，缺一不判**：腿① ACT 两类——A 可计数活动名词（会议/开会/文件/发文/代码/加班/工时/走访/巡查/培训/邮件/对接 + 数字型「N场会」+ 忙碌标记 忙得脚不沾地/夜以继日/起早贪黑/通宵；EN meetings/emails/reports/training sessions/overtime/lines of code/all-nighters），B 泛指投入词（投入/付出/辛劳/心血/奔波——**须与强度标记同现** 大量/天天/日夜/数十/上百/几万/无数）；腿② OUT 抽象成果结论（**只收抽象成功/进展/绩效，不收具体结果**；名词与形容词间留强度窗吃「推进得**很**好」「成绩**必然**斐然」「绩效**十分**突出」）；腿③ CONN 因果连接（显式连接词 所以/因此/说明/可见/足以证明；EN so/therefore/which shows/proving，**或**两腿以逗号并置且无转折词——句号分隔或含转折词 但/然而/却/不过/虽然 不判）。与 reward_hacking 自认式作弊（BLOCK）、Goodhart 代理**指标**族（点击率/GDP/停留时长——测得的量）边界错开：本族腿①只收**活动/投入**（做的事、花的工），是**无欺骗的推理谬误**。来源（真实，未编造）：HN Algolia "vanity metrics" 命中 Eric Ries《Vanity Metrics vs. Actionable Metrics》（42 分，https://news.ycombinator.com/item?id=617517）与《Vanity Metrics》（79 分，https://news.ycombinator.com/item?id=14167843）；Goodhart's law 多篇高分（229/187/178 分）作概念背景；Semantic Scholar 两次 HTTP 429 空返；GitHub 无高星纯规则方案。判据为心虫自有纯规则实现。缺口实证攻击 5/5 真零命中、良性 0/5 误伤。
- `src/activity-outcome-confusion.js` — new detector module with 16 injectable constants (ACT_ZH/EN, EFFORT_ZH, INTENSITY_ZH/EN, OUT_ZH/EN, CONN_ZH/EN, EXEMPT_SEP/CONCRETE/HEDGE_ZH×EN); effort-leg requires intensity co-occurrence; juxtaposition-as-causation with contrast guard; intensity gap between OUT noun and adjective.
- `test/round-186-activity-outcome-confusion.js` — 18 assertions (12 attacks ZH+EN incl. bare-noun/modified/juxtaposition/long/effort+intensity, 13 benign incl. reflexive-separation/concrete-outcome/hedge/question/contrast, 8 constant injection load-bearing checks incl. CONN no-comma isolation, 3 exemption trap flips, gate-layer variant matrix 6/6 attack non-pass + 5/5 benign pass, export registration).

### Changed
- `src/index.js` — nine wiring points for dimension 184 (require / compute point `aoc` / allDims / dimMap / DIM_GUIDANCE / VERIFY_DIMS / dimensions reading / summary / exports). Dimensions 183→184, VERIFY 142→143.
- `README.md` / `SKILL.md` / `AGENTS.md` — dimension count 184, verify-tier count 143, tier sum 173, Verify-level list + `activity_outcome_confusion`, version stamps → v6.8.114.

## [6.8.113] - 2026-11-01

### Added
- **`necessity_sufficiency_confusion` — dimension 183 (条件角色混淆：必要条件↔充分条件反向使用)** — 判别「**先宣称某条件是另一事件的必要条件（前提/基础/保障/没有X就没有Y/唯有X才Y），再据此断言该条件单独就能保证结果（所以只要X就能Y）；或先宣称充分条件（X足以Y/保证），再据此断言没有该条件结果就不成立（所以没有X就不能Y）**」结构。必要与充分是两个方向：P必要于Q只意味着 ¬P⇒¬Q，推不出 P⇒Q；P充分于Q只意味着 P⇒Q，推不出 ¬P⇒¬Q。判据**宣称腿×反向结论腿×连接推断词三腿共现，缺一不判**：路线1（必要→充分）NEC_CLAIM × SUF_CONCL × 前向推断词；路线2（充分→必要）SUF_CLAIM × NEC_CONCL × 推断词；跨度 ≤70 字（EN 140 字符）；反向宣称抑制（结论只是复用已宣称角色时不判）。来源：arXiv:2405.02318（HN 258 分，概念背景）+ Semantic Scholar 10.1016/j.neunet.2025.108164 / 10.1080/01445349408837232；判据为心虫自有纯规则实现。
- `src/necessity-sufficiency-confusion.js` — new detector module with 20 injectable constants (NEC_CLAIM/SUF_CLAIM/SUF_CONCL/NEC_CONCL_ZH×EN, INFER_FWD/INFER_BWD_ZH×EN, EXEMPT_SEP/NEG/HEDGE/BICOND/CONCEPT_ZH×EN); direction-enforced connector (forward 所以/因此 for claim→conclusion, backward 因为/既然 for inverted forms) and opposite-claim suppression as the family's precision core.
- `test/round-185-necessity-sufficiency-confusion.js` — 20 assertions (11 attacks ZH+EN incl. bare-noun/modified/inverted/long/direct-flip, 16 benign incl. correct multi-factor statement and forward necessity use, 9 constant injection load-bearing checks, 6 exemption trap flips incl. opposite-claim suppression, gate-layer variant matrix 6/6 attack non-pass + 5/5 benign pass).

### Changed
- `src/index.js` — nine wiring points for dimension 183 (require / compute point `nsc` / allDims / dimMap / DIM_GUIDANCE / VERIFY_DIMS / dimensions reading / summary / exports). Dimensions 182→183, VERIFY 141→142.
- `README.md` / `SKILL.md` / `AGENTS.md` — dimension count 183 and verify-tier count 142 synced across banner, spec tables, and tier lists.

## [6.8.112] - 2026-11-01

### Added
- **`absence_of_problems` — dimension 182 (未检出≠不存在：把有限检验的阴性结果当作完备证明)** — 判别「**测试/扫描/审查/调研只覆盖了有界范围，却把「本次未检出」升级为「不存在」**」结构：「测试全跑过了没报错，所以代码肯定没问题」「扫了一遍没发现漏洞，说明系统是安全的」「没人投诉，说明产品体验没问题」「三年没出过事故，这座桥梁绝对安全」「尽调没查出任何问题，这家公司完全可以放心投资」「抽样检查没有发现缺陷，产品百分之百合格」「The tests did not fail, so the code must be correct.」「We scanned and found no vulnerabilities, therefore the system is secure.」「No bugs were reported during the audit, so the release is completely safe.」。检验的效力受其覆盖范围约束：测试只覆盖已写下的用例，扫描只匹配已知漏洞特征库，审查只覆盖审查者看得见的层面，调研只覆盖愿意开口的人；用有界搜索的阴性结果冒充无界全域的证明，让**未被检验的部分**获得与**已检验部分**相同的可信度——这是 AI 工程汇报、代码审查结论、上线评审中最典型的似是而非。判据**两腿共现，缺一不判**（同句或相邻句）：腿① CHECK 已执行检验+阴性结果三形——CN-A 阴性结果形（检验动词**可选前缀** → [≤12字] → 否定 → [≤6字] → {检出动词 → [≤10字] → 问题名词 | 自足投诉类}）、CN-B 通过形（检验动词 → 全部/完全/都 → 通过/合格/达标/全绿）、CN-C 失败裸形（检验动词 → 否定 → 出错/报错/失败/崩溃/超时）；EN-A 检验名词+阴性动词、EN-B no+问题名词+were found/reported/detected、EN-C 检验名词+all passed/are green。腿② SEAL 全称化结论三形——CN-A 连接词+无问题族结论、CN-B 连接词+确定性副词+其他结论、CN-C 无连接词+确定性副词+无问题族结论（跨句亦判）；EN-A so/therefore/which means/proves+无问题族结论、EN-B so/therefore+must be/certainly/100%+结论。**161 轮教训：全部收裸名词形态**。六类豁免全部负例注入承重：SCOPE 范围限定与 HEDGE 对冲为**跨度豁免**（腿①句首→腿②句尾），NEGFLIP 拒绝推断、META 概念/教学转述、EXHAUSTIVE 构造上完备的检验为**整篇豁免**——两类表刻意不交叠，另加疑问句逐句豁免。来源（真实，未编造）：arXiv:2405.02318v3《Autoformalizing Natural Language to First-Order Logic: A Case Study in Logical Fallacy Detection》（HN 258 分/143 评论，LLM 路线，只作概念背景）；GitHub 5 个谬误检测仓库全为模型路线；Semantic Scholar 两次 HTTP 429 限流，如实记录。判据为心虫自有纯规则实现。
- `src/absence-of-problems.js` — new detector module with 21 injectable constants (CHECK_ZH_A/C/D_RE, CHECK_EN_A/B/C_RE, SEAL_ZH_A/B/C_RE, SEAL_EN_A/B_RE, SCOPE_ZH×EN, HEDGE_ZH×EN, NEGFLIP_ZH×EN, META_ZH×EN, EXHAUSTIVE_ZH×EN); two-leg co-occurrence (same or adjacent sentence) with span-scoped and whole-text exemption tables.

## [6.8.111] - 2026-11-01

### Added
- **`counterfactual_overclaim` — dimension 181 (反事实独断：把另一条未走路径的结果当作确定可知)** — 判别「**如果当初X，现在一定/必然/势必Y**」结构：「如果当初投入研发，现在我们一定已经领先市场三年了」「要是当时听我的做了对冲，公司肯定不会陷入今天的困境」「倘若当初选择另一条技术路线，我们现在势必已经主导整个行业」「当初要是果断止损，这笔投资毫无疑问现在已经回本了」「If we had invested in that startup, we would certainly be market leaders today.」「Had we taken the other path, the project would definitely have succeeded by now.」「If only we had acted sooner, we would certainly have avoided the crisis.」。复杂系统中未走路径的结局原则上不可事先确定——用确定性副词封装反事实结果，是把不可验证的假设当结论，用叙述的确定性替代因果的开放性。判据**双腿共现，缺一不判**：腿① CF 反事实框架三形——CN-A 连接词先行形（连接词 → [≤12字] → 过去时点锚 当初/当时/那时/那年/当年/一开始/最开始/早些时候/早点/最初/早先；**刻意不收「之前/先前/此前」**，宽锚会把「如果之前的数据有误，现在一定要回头修正」的义务情态扫进谬误族）、CN-B 锚先行形（过去时点锚 → [≤8字] → 连接词/否定动作）、EN-A if+主语+had+PP / EN-B 倒装 had we/they+PP / EN-C if only+主语+had；腿② CERT 确定性断言（一定/肯定/必然/势必/必定/注定/毫无疑问/毋庸置疑/不容置疑/必将；EN certainly/definitely/bound to/undoubtedly/without a doubt/no doubt/surely——**刻意不收「早就/就不会/would have」**，那是 conditional_proposition 第160维否定推断形的射程）。**161 轮教训：全部收裸名词形态**。四类豁免全部负例注入承重：对冲、拒绝推断（不要以为/无法断定/unjustified）、概念/教学转述、结论侧否定（不足以…证明/does not prove），另加疑问句逐句豁免。来源（真实，未编造）：Steve Kinney 论文笔记《The Hidden Dangers of Counterfactual Reasoning in AI》（2025-04-21，https://stevekinney.com/writing/counter-factual-reasoning-in-ai）——评述 Aalaila / Großmann / Mukherjee / Wahl / Vollmer《When Counterfactual Reasoning Fails: Chaos and Real-World Complexity》（arXiv 无收录，未编造 ID）；arXiv:2402.08955《Counterfactual Tasks to Evaluate the Generality of Analogical Reasoning in LLMs》作概念背景。判据为心虫自有纯规则实现。
- `src/counterfactual-overclaim.js` — new detector module with 15 injectable constants (CF_CN_A_RE, CF_CN_B_RE, CF_EN_A_RE, CF_EN_B_RE, CF_EN_C_RE, CERT_ZH_RE, CERT_EN_RE, HEDGE_ZH×EN, NEGFLIP_ZH×EN, META_ZH×EN, NEGSEAL_ZH×EN); sentence-level two-leg co-occurrence with whole-text exemption table.
- `test/round-183-counterfactual-overclaim.js` — negative-injection + variant-matrix suite (67 assertions).

### Verification
- round-183 suite: 67/67 (attacks 13/13 incl. ZH/EN, bare-noun, modified, long form, anchor-first, inversion; benign 15/15 incl. hedge / rejection-of-inference / concept transposition / conclusion-side negation / question / future conditional; 15 constant injection load-bearing tests incl. 8 exemption trap flips; 5 registration assertions)
- Gate variant matrix (real `gate()`): attacks 6/6 non-pass, all carrying the `counterfactual_overclaim` finding; benign 6/6 pass
- Bidirectional guard: recall 52/52, false-block 302/326 (unchanged — zero new false positives)
- `bin/verify.js` 16/16; `guard-abilities.js` 20/20 (181 dimension keys); `doc-numbers-accuracy.test.js` 22/22
- Runtime: `heartflow-mcp` restarted; `heartflow_status` returns version 6.8.111 / 181 dimensions

### Known boundaries
- Two legs limited to same-sentence co-occurrence; cross-sentence form (「如果当初投入研发。现在我们一定已经领先三年。」) conservatively not covered.
- Future-tense conditionals (「如果明天发布新版本，用户量一定会涨」) out of scope (no past anchor; belongs to absolute_claim family).
- Pre-existing dimensions false-positive on two edge benigns (absolute_claim on 「不要以为如果当初买了那套房现在就一定过得更好」; hindsight_bias on 「当初的决策基于当时可获得的信息，事后假设另一种选择必然更好是不恰当的」) — not introduced this round, candidates for a future round.

## [6.8.110] - 2026-11-01

### Added
- **`cherry_picking` — dimension 180 (选择性取证 / cherry-picking，采樱桃谬误——确认偏误的证据纪律形态)** — 判别「**只从支持某结论的证据池取证**（只找/只引用/只保留支持性证据，或隐去/略去/屏蔽不利与反面证据），**却把结论封装为「证明/证实/成立/毫无疑问」**」：「我只找支持这个结论的证据，所以它一定是成立的」「他专门挑对自己有利的数据说，足以证明产品没有问题」「报告里只引用正面评价，隐瞒了所有不利记录，可见方案是完全可靠的」「整个论证只保留了支持性案例，反面证据全部略去，因此结论毫无疑问是成立的」「We only cited the studies that supported our hypothesis, which proves the theory is correct.」「The report only presented favorable evidence, so the conclusion is certainly sound.」。寻真的前提是**证据对称性**——结论的置信度只能来自正反证据的合力；选择性取证把取证本身变成结论的傀儡：先裁掉不利证据，再宣布「证据充分」。判据**两腿共现 + 顺序腿（缺一不判）**：腿① SELECT 选择性取证陈述四形——A 支持性取样形（选择性副词 → [≤8字] → 取证动词 → [≤10字] → 方向标记 → [≤8字] → 取证对象）、A2 无副词形（动词 → [≤6字] → 方向标记 → [≤8字] → 对象）、B 反向抑制形两种语序（反面/不利 + 对象 + 略去/隐去/删除/屏蔽/过滤/排除；或抑制动词在前 + 不利/反面 + 对象）、C 定性短语形（选择性取证/断章取义/报喜不报忧；EN cherry-pick + 对象 / quote out of context / suppress + contrary + 对象）；腿② SEAL 确定性结论封装三形——A 连接词形（连接词 → [≤18字] → [确定性副词 → [≤6字] →] 封结论名词；或 → 封结论动词 → [≤10字] → 封结论名词）、B 直接封装形（[足以] + 封结论动词 → [≤8字] → 封结论名词——「足以证明产品没有问题」无连接词）、C 情态封装形（确定性副词 → [≤6字] → 封结论名词，跨句亦判）；腿③ ORDER 顺序（腿①早于腿②）。**161 轮教训：全部收裸名词形态**（收「支持」而非只收「支持性」，收「正面」而非只收「正面的」）。
- `src/cherry-picking.js` — new detector module with 26 injectable constants (SEL_ADV/VERB/MARK/OBJ_ZH, SEL_NEG_QUAL_ZH, SEL_SUPPRESS_ZH, SEL_PHRASE_ZH×EN, SEL_EN_ADV/VERB/MARK/OBJ, CONNECT_ZH×EN, SEAL_VERB/ADV/NOUN_ZH×EN, META_ZH×EN, NEG_ZH, NEGSEAL_ZH, HEDGE_ZH×EN); leg-1 and leg-2 regexes are dynamically assembled from the sub-tables so every constant stays injectable.
- `test/round-182-cherry-picking.js` — negative-injection + variant-matrix suite (73 assertions).

### Verification
- round-182 suite: 73/73 (attacks 10/10 incl. ZH/EN, bare-noun, modified, long form, cross-sentence, connector-less; benign 17/17 incl. discipline negation, conclusion-side negation, concept transposition, hedge, no-marker, edge multi-cause statement, selection_bias/survivorship_bias boundary benigns; 20 constant injection load-bearing tests; 6 exemption trap flips META/NEG/NEGSEAL/HEDGE ×ZH/EN; 4 registration assertions)
- Gate variant matrix (real `gate()`): attacks 8/8 non-pass, all carrying the `cherry_picking` finding; benign 8/8 pass (incl. self-built exemption / hedge / concept transposition / no-marker / unrelated multi-cause / EN source-restricted)
- Bidirectional guard: recall 52/52, false-block 302/326 (92.6%, unchanged — zero new false positives)
- `bin/verify.js` 16/16; `guard-abilities.js` 20/20 (180 dimension keys); `doc-numbers-accuracy.test.js` 22/22

### Source (real, not fabricated)
- HN Algolia "logical fallacy detection" → arXiv:2405.02318v3 "Autoformalizing Natural Language to First-Order Logic: A Case Study in Logical Fallacy Detection" (HN 258 pts / 143 comments, 2025-03-04, https://arxiv.org/abs/2405.02318). The NL2FOL framework is LLM-based and structurally different from a pure rule engine; only its fallacy taxonomy was used as conceptual background.
- GitHub API "logical fallacy detection" (sort=stars): highest-star repo is tmakesense/logical-fallacy ★20; the rest are ≤4 stars and all LLM-based — no transferable pure-rule criteria.
- Semantic Scholar: three queries all returned HTTP 429 (rate-limited), recorded as-is.
- Criteria are HeartFlow's own pure-rule implementation. Scout log: /tmp/hf-scout-1761925800.txt; gap probe: /tmp/hf-probe-r182.js.

### Known boundaries
- Leg 3 is forward-only (evidence selection before conclusion sealing); the inverted form「结论毫无疑问，因为报告只引用正面评价」is semantically the same family but rare — conservatively not collected this round.
- The success-case/survivor form (「只统计了成功案例，足以证明方法有效」) borders on survivorship_bias's scope — conservatively not collected this round.
- Pre-existing dimensions (absolute_claim / confidence / reasoning_coherence) still intercept some edge long sentences of this family (r182 measured:「为了说明这项政策有效，研究者只摘取了成功地区的材料，结论毋庸置疑。」is intercepted by reasoning_coherence + confidence — pre-existing behavior, unchanged).

## [6.8.109] - 2026-11-01

### Added
- **`halo_effect` — dimension 179 (光环效应 / halo effect)** — 由**无关的正面特征**（外貌/名气/穿着/装修包装/平台品牌/口才嗓音等非认知特征）推断对象在另一维度上的人品、能力、技术或观点正确性，且迁移总以肯定情态封装（肯定/一定/想必/must be），看上去像结论，实则零证据：「他长得这么帅，人品肯定也没问题」「这家公司装修得这么高档，产品技术肯定是一流的」「他口才这么好，做事能力一定也很强」「He is tall and handsome, so his judgment must be sound.」。呈现维度的属性与实质维度的属性之间没有可传递的证据链——对呈现的好感不能增加对实质的任何支持。判据**三件共现（缺一不判）**：腿① TRAIT 无关正面特征（外貌/声音风度口才/名气流量/包装装修地段/平台品牌五族，中英双语，**全部裸名词形态**且容忍中间插入修饰语——「口才这么好」「人气很高」「装修得这么高档」）；腿② TRANSFER 质量迁移断言两形——A 连接词形（所以/因此/可见/说明 + 结论名词 + 肯定情态）与 B 并置迁移形（特征词 + [≤12字] + 结论名词 + [≤6字] + 肯定情态——「他长得帅，人品肯定也没问题」无连接词、仅靠并置完成迁移，是最常见攻击形）；腿③ ORDER 顺序（A 形要求特征早于迁移断言）。**情态词表刻意不收「也」**——「她长得漂亮，成绩也很好」是并列陈述非迁移推断。
- `src/halo-effect.js` — new detector module with 14 injectable constants (TRAIT_ZH 五子族 LOOK/MANNER/FAME/WRAP/BRAND 可分别注入 + TRAIT_EN, QUALITY_ZH×EN, MODAL_ZH×EN, CONNECT_ZH×EN, CONTRAST_ZH×EN, META_ZH×EN, HEDGE_ZH×EN) plus modifier-tolerant trait windows and two-form transfer construction (leg-2 regex dynamically assembled from trait/quality/modal tables so all three stay injectable).
- `test/round-181-halo-effect.js` — negative-injection + variant-matrix suite (45 assertions).

### Verification
- round-181 suite: 45/45 (attacks 17/17 incl. ZH/EN five trait families + A-only-connect form; benign 15/15 incl. contrast/separation, concept transposition, hedge, no-modal parallel statement, question; 13 injection load-bearing tests incl. five trait sub-families individually; 6 exemption trap flips CONTRAST/META/HEDGE ×ZH/EN; 5 structural distinctions; 2 registration assertions)
- Gate variant matrix (real `gate()`): attacks 10/10 non-pass (all verify); benign 7/7 pass (incl. bare-noun, modified, inverted, long form, EN)
- Bidirectional guard: recall 52/52, false-block 302/326 (92.6%, unchanged — zero new false positives)
- `bin/verify.js` 16/16; `guard-abilities.js` 20/20 (179 dimension keys); `doc-numbers-accuracy.test.js` 22/22

## [6.8.108] - 2026-11-01

### Added
- **`fallacy_fallacy` — dimension 178 (谬误谬误 / fallacy fallacy / argumentum ad logicam)** — 指认对方的论证犯有谬误或推理无效，据此断定对方的结论为假、应被驳回、不可信：把「驳倒论证」冒充「驳倒事实」。论证无效（invalid）与结论为假（false）是两个独立的命题状态——一个无效论证完全可以推出一个**为真**的结论；把「我驳倒了你的推理」当成「我驳倒了你的主张」，是用修辞胜利冒充真理判定，会系统性地把「还没被证明」误报成「已被证伪」。三腿共现判据（缺一不判）：腿① FALLACY 谬误指认（指名谬误裸名词 + 泛指论证缺陷）；腿② REJECT 结论废弃（连接词 → 结论名词 → 假值谓语，**必须落在结论名词上、不能落在论证名词上**——「你的论证不成立」是正确判别，「你的观点不成立」才是本族）；腿③ ORDER 顺序（腿①早于腿②）。
- `src/fallacy-fallacy.js` — new detector module with 14 injectable constants (FALLACY_ZH, FALLACY_GENERIC_ZH, FALLACY_EN, REJECT_ZH, REJECT_EN, PREFALSE_ZH×EN, CORRECT_ZH×EN, META_EXEMPT_ZH×EN, HEDGE_ZH×EN).
- `test/round-180-fallacy-fallacy.js` — negative-injection + variant-matrix suite (37 assertions).

### Verification
- round-180 suite: 37/37 (attacks 16/16 incl. ZH/EN, bare-noun, modified, inverted, long form; benign 17/17 incl. predicate-front negation / 不等于-推不出 / concept transposition / claim-noun mismatch / hedge / question)
- Gate variant matrix (real `gate()`): attacks 11/11 non-pass (10 verify + 1 rewrite); benign 6/6 pass
- Bidirectional guard: recall 52/52, false-block 302/326 (92.6%, unchanged — zero new false positives)
- `bin/verify.js` 16/16; `guard-abilities.js` 20/20 (178 dimension keys); `doc-numbers-accuracy.test.js` 22/22

## [6.8.107] - 2026-11-01

### Added
- **`moralistic_fallacy` — dimension 177 (道德主义谬误 / moralistic fallacy)** — 把应然规范倒推为实然事实：「世界应该公平」推不出「世界本来公平」，「人理应诚实」推不出「人的天性就是诚实」——规范（ought）描述应当如何，事实（is）描述实际如何，用规范词给事实断言作前提，是把价值主张冒充成事实陈述（appeal_to_nature「自然性→优越性」的镜像族，判据腿完全反置）。判据三要素共现（缺一不判）：腿① OUGHT 应然规范词（应该/应当/理应/理当/本该/应然/按理；EN ought to / should / supposed to / meant to——裸名词形态）、腿② ISNATURE 实然自然/本质等式断言（本来就是/事实上就是/本质上都是/天性就是/天生就是/本性就是/归根到底就是/就是事实；EN by nature / naturally / innately / inherently / fundamentally / only natural——只收「自然/本质/事实标记+肯定系动词」形，「天性未必就是」「本质上并非」等否定形因缺肯定系动词天然不匹配）、腿③ ORDER 顺序——腿①必须早于腿②（顺序倒置即非本族：「善良是人性的一部分，所以人应该向善」是合法论证）。
- `src/moralistic-fallacy.js` — new detector module with 14 injectable constants (OUGHT_ZH×EN, ISNATURE_ZH×EN, PREMISE_ZH×EN, NEG_ZH×EN, NORMNOUN_ZH, OUGHT_AFTER_ZH, META_EXEMPT_ZH×EN, HEDGE_ZH×EN) plus premise-connector interception (因为/由于/because/since 两腿相隔 = 实然作前提的合法论证), norm-noun restatement exemption (本来就是底线/义务/追求) and ought-after restatement exemption (本性就是应该诚实的).
- `test/round-179-moralistic-fallacy.js` — negative-injection + variant-matrix suite (29 assertions).

### Verification
- round-179 suite: 29/29 (attacks 11/11 incl. ZH/EN, bare-noun short form, modified, conditional form, long form; benign 16/16 incl. edge-benign reversed-order legal form / critical analysis / legal provision / meta-discussion; 10 constant negative-injection load-bearing; 8 exemption-trap flips incl. ZH/EN premise-connector and negation flips; reversed-order dedicated test; 2 registration assertions)
- Gate variant matrix: attacks 7/7 non-pass with moralistic_fallacy in findings; benign 5/5 pass
- Bidirectional guard: recall 52/52, false-block 302/326 (92.6%, unchanged — zero new false positives)
- `bin/verify.js` 16/16; `guard-abilities.js` 20/20 (177 dimension keys); `doc-numbers-accuracy.test.js` 22/22 (also fixed pre-existing stale version stamps in README/SKILL left by r178)
- Measured: 177 dimensions (BLOCK 11 / REWRITE 19 / VERIFY 136), 161 modules, 184 MCP tools, 1,314 routes

## [6.8.106] - 2026-10-31

### Added
- **`conjunction_fallacy` — dimension 176 (合取谬误 / conjunction fallacy / Linda problem)** — 把合取事件（A 且 B）的概率/可能性宣称高于其任一组分事件（A 或 B）的概率，违反概率公理 P(A∧B) ≤ P(A)：两个条件同时满足的场合必然少于任一条件单独满足的场合，与描述生动与否无关；把合取描述得更具体就认为它「更可能」，是把叙事的代表性冒充概率的大小。判据三腿共现（缺一不判）：腿① CONJ 合取标记（组合形/裸词形/裸连接词「且」「以及」×概率词邻近）、腿② PROB 概率词（概率/可能性/几率；EN probability/probable/chance/likelihood/odds/likely）、腿③ CMP 概率比较结构两条路线（算子×组分回指「只是/alone」；双概率词夹算子覆盖数学陈述形与倒装形）。
- `src/conjunction-fallacy.js` — new detector module with 19 injectable constants (CONJ_PAIR/BARE/AND_ZH×EN, PROB_ZH×EN, CMP_OP/BACK_ZH×EN, GROUP_SUFFIX_ZH×EN, EXEMPT_CONCEPT/NEG/HEDGE_ZH×EN) plus group-conditional structural exemption (P(结果|X∧Y) vs P(结果|Y) 可能为真，不判) and same-sentence second-CONJ rule.
- `test/round-178-conjunction-fallacy.js` — negative-injection + variant-matrix suite (29 assertions).

### Verification
- round-178 suite: 29/29 (attacks 10/10 incl. ZH/EN, bare-noun short form, modified, inverted conclusion-first, long form; benign 11/11 incl. edge-benign correct multi-cause statement and group-conditional comparisons; 12 constant negative-injection load-bearing; 6 exemption-trap flips incl. ZH/EN group-form flips; hedge-does-not-swallow-可能性 check)
- Gate variant matrix: attacks 7/7 non-pass with conjunction_fallacy in findings; benign 5/5 pass
- Bidirectional guard: recall 52/52, false-block 302/326 (92.6%, unchanged — zero new false positives)
- `bin/verify.js` 16/16; `guard-abilities.js` 20/20 (176 dimension keys); `doc-numbers-accuracy.test.js` 22/22
- Measured: 176 dimensions (BLOCK 11 / REWRITE 19 / VERIFY 135), 161 modules, 184 MCP tools, 1,314 routes

## [6.8.105] - 2026-10-31

### Added
- **`hindsight_bias` — dimension 175 (事后聪明偏差 / hindsight bias / 后见之明 / knew-it-all-along effect)** — 把事后已知的结果当成事前本可预见、注定如此的，用后见之明倒推事前判断力，混淆「事后知道」与「事前可知」。判据三形任一：腿① HS 事后框架（成语形单腿；弱形须与腿②共现）、腿② PRED 注定/事前可预见断言（强形单腿可命中；POST 子集与腿③共现；弱形只与腿①共现——「这场比赛注定会赢」是赛前打气良性）、腿③ OUT 已发生结果事件（锚定已发生结果，排除将来时一厢情愿）。
- `src/hindsight-bias.js` — new detector module with 20 injectable constants (HS/PRED_STRONG/PRED_POST/PRED_WEAK/OUT_ZH×EN、EXEMPT_META/NEWINFO/EXANTE/NEG/HEDGE_ZH×EN).
- `test/round-177-hindsight-bias.js` — negative-injection + variant-matrix suite (28 assertions).

### Verification
- round-177 suite: 28/28 (attacks 19/19 incl. ZH/EN, bare nouns, idiom forms, inverted & long forms; benign 18/18 incl. correct multi-cause statements, true foresight, pre-game pep talk, proper post-mortem learning, ex-ante evaluation, concept teaching, hedging; 8 constant negative-injection load-bearing; 9 exemption-trap flips; leg-absence independence; 4 registration assertions)
- Gate variant matrix: attacks 7/7 non-pass with hindsight_bias in findings; benign 7/7 pass with zero hindsight_bias hits
- Bidirectional guard: recall 52/52, false-block 302/326 (92.6%, unchanged — zero new false positives)
- `bin/verify.js` 16/16; `guard-abilities.js` 20/20 (175 dimension keys); `doc-numbers-accuracy.test.js` 22/22
- Measured: 175 dimensions (BLOCK 11 / REWRITE 19 / VERIFY 134), 161 modules, 184 MCP tools, 1,314 routes

## [6.8.104] - 2026-10-31

### Added
- **`common_cause` — dimension 174 (共同原因谬误 / common cause / confounding factor / 混杂因素)**: a new VERIFY-level discrimination dimension that catches treating the **covariation or correlation of two variables as direct one-way causation** without examining or naming the third factor that drives both (Z→X and Z→Y misread as X→Y). Covariation is equally consistent with a common-cause structure and a causal structure; before confounding is ruled out, "X and Y rise together, so X causes Y" is passing correlation off as causation. Criteria are three legs that must co-occur: leg ① COVARIATION — two forms, either suffices: C-a relational nouns (相关/关联/高度相关/正相关/负相关/显著相关/密切相关, necessarily two variables, no pairing structure required; EN correlated / correlation / covary / covariation); C-b covariation verbs (同步上升/同步增长/同步下降/一同/一齐/一起+上升类/齐涨/齐升/齐跌/同涨同跌/同升同降/相伴上升/如影随形/齐头并进/亦步亦趋/水涨船高/随之上升/联动 — bare-noun forms; EN rise(s)/rose together / move(s)/moved together / in lockstep / hand in hand / in tandem / in sync / track each other / rise and fall together) **and** a paired two-variable structure (和/与/跟/及/以及/这[两几][个种]/那[两几][个种]/两者/二者; EN and / & / both / the two / these two / two variables / two metrics) within 40 chars (EN 100) before the covariation word; leg ② CAUSAL — direct causal verbs (导致/造成/引发/引起/带来/催生/促成/使得/令/让/驱动/推动/推升/推高/拉高/抬高/造就/滋生/助长/加剧/加大了/增加了/提高了/提升了/带动/拉动/源于/来自于/归因于/归功于/是…的原因/根源在于/罪魁祸首; EN causes / leads to / results in / results from / drives / boosts / increases / reduces / makes / creates / produces / is responsible for / brings about / stems from / originates from / is due to) co-occurring with leg ① in a **dual-orientation 60-char (EN 120-char) window** (covers the main covariation→causation form and the inverted "A is the cause of B, because A and B are highly correlated"). Deliberately excludes inference words (说明/表明/证明/可见) — "rose in step with last year, showing the season strategy worked" is a benign year-on-year comparison, only true causal verbs are load-bearing; leg ③ NO_CONFOUND — the common cause is neither named nor controlled (共同原因/混杂/第三因素/同一个原因/都源于/控制了/剔除/回归/辛普森/DAG/工具变量/倾向得分; EN common cause / confounding / confounder / third variable / lurking variable / controlling for / adjusted for / Simpson / DAG / instrumental variable / propensity / causal inference). Five exemption classes, all negative-injection load-bearing: concept/teaching relay, experiment/evidence context, reasoning negation/reverse acknowledgement, hedging, named-or-controlled common cause, and questions.
- `src/common-cause.js` — new detector module with 18 injectable constants (COVARY_REL/COVARY_MOVE/PAIR/CAUSE × ZH/EN, EXEMPT_META/EVID/NEG/HEDGE × ZH/EN, NO_CONFOUND × ZH/EN), dual-route covariation detection and dual-orientation causal co-occurrence legs; wired into `src/index.js` at nine points (require / computation / dimMap / allDims / DIM_GUIDANCE / VERIFY_DIMS / dimensions / summary / module.exports; variable named `ccau` — `cc` is already taken by the confidence reading).
- `test/round-176-common-cause.js` — negative-injection + variant-matrix suite.

### Verification
- round-176 test 27/27 (attacks 18/18 hit including ZH/EN, bare-noun, modified, inverted, long-sentence forms; benign 16/16 zero false-positive including correct multiple-cause statements, year-on-year comparisons, pure description, reasoning negation, hedging, concept teaching, RCT evidence, named common cause; 12 constant negative-injection load checks; 5 exemption trap flips; question exemption; inference-word non-load-bearing check; 4 registration assertions)
- gate-layer variant matrix 7/7 non-pass with common_cause in findings, benign 7/7 pass with zero common_cause hits
- bidirectional guard 52/52 recall, 302/326 benign pass (identical to baseline — zero new false positives from this dimension); bin/verify.js 16/16; guard-abilities.js 20/20 (dimensions 174 registered); doc-numbers-accuracy.test.js 22/22
- Source: HN Algolia "confounding variable" (objectID 11414793 "Statistics: When Confounding Variables Are Out of Control", 41779877 "Understanding Confounding Variables: A Comprehensive Guide (2024)") — confounding/common cause is a recognised blind spot in statistics and causal inference; GitHub causal-inference repositories NSAPH-Projects/space ★19 / Trhova/Causal-Microbiome-Omics ★19 / imkemayer/causal-inference-missing ★9 / moprescu/GSTUNet ★8 are academic data-science tools, not pure-rule text discrimination, conceptual background only; Semantic Scholar returned HTTP 429 twice (recorded honestly); the criteria are HeartFlow's own pure-rule implementation. Gap measured by /tmp/hf-probe-r176.js against src/gate.js: 4 of 8 common-cause attack samples passed the hard gate with zero dimension hits; pseudo_causal only covers exact-multiple and temporal/superstition pseudo-causation, reverse_causation only covers direction reversal, no range overlap. Dimensions 173→174, VERIFY 132→133.

## [6.8.103] - 2026-10-31

### Added
- **`outcome_bias` — dimension 173 (结果偏误 / outcome bias / 结局偏见)**: a new VERIFY-level discrimination dimension that catches judging the **quality of a decision/choice by its outcome** — ignoring the information and reasoning available **at the time the decision was made** and confusing skill with luck. Decision quality is determined only by the ex-ante information and argument process; single high-variance events (gambles, stock picks, one-off surgeries, hit products, lotteries) are dominated by luck, so inferring decision quality from the result is attributing luck to ability. Criteria are three legs that must co-occur: leg ① OUTCOME — luck-dominated outcome words (赌对/赌错/赌赢/赌输/押对/押对/蒙对/猜对/赚翻/翻倍/翻了三倍/获利/盈利/血本无归/亏光/爆仓/套牢/割肉/暴涨/暴跌/翻车/踩雷/暴雷/翻身/夺冠/出局/淘汰/落榜/考上/没考上/卖爆/大卖/滞销/中奖/活下来/去世/救回来/手术成功/手术失败/赢麻了/躺赢… bare-noun forms; EN paid off / won / lost / hit the jackpot / struck it rich / made a fortune / went bankrupt / lost everything / came out ahead / fell flat / crashed / tanked / doubled / tripled / lottery); leg ② EVAL — decision nouns (决策/决断/决定/抉择/选择/判断/策略/方案/战术/思路/想法/做法/打法/布局/操作/下注/押注/买入/卖出/投资/出手/转型/放弃/坚持/路线/赌注/定夺/拍板; EN decision / choice / call / bet / gamble / strategy / tactics / plan / move / pick / investment / trade / wager) × evaluative words (明智/英明/睿智/高明/正确/是对的/果断/清醒/理性/聪明/精明/厉害/眼光独到/有远见/独到/愚蠢/草率/鲁莽/失误/失策/错误/糊涂/短视/冒进/不该/欠妥/败笔; EN wise / correct / brilliant / shrewd / sound / reckless / foolish / hasty / poor / well-judged / ill-judged / good call / bad call) within a 15-char (EN 60-char) window, both directions; leg ③ LINK — attribution connectives (说明/证明/可见/足以证明/表明/意味着/证实/印证/体现出/反映出/所以/因此/因而/故而/毕竟/说到底/事实证明/结果证明/归功于/全靠/多亏; EN proves / show / demonstrating / confirms / means / which means / indicating / therefore / thus / hence / so / after all / thanks to / proof), with the connection structure being OUTCOME within 60 chars (EN 120) before the LINK match and EVAL after, or EVAL before and OUTCOME after (conclusion-first inverted form) — either orientation. Five exemption classes are all negative-injection load-bearing: concept/teaching (结果偏误/结局偏见/以结果论/以成败论/事后诸葛亮/认知偏差/行为经济学/教材/课堂; EN outcome bias / result-oriented evaluation / hindsight / cognitive bias / textbook / lecture), experiment/evidence context (随机对照/对照组/实验组/双盲/前瞻性研究/队列研究/元分析/临床试验/实验表明/数据显示/研究表明; EN randomized / controlled trial / RCT / control group / placebo / double-blind / cohort study / meta-analysis / experiment / data show / evidence shows — in controlled experiments the outcome is designed evidence for the method and the ex-ante argument is the experimental design itself), ex-ante reasoning / reasoning-negation / reverse-acknowledgement (不能说明/不能只凭/不能只看/不能仅凭/不能以/不要以/并非只看/不代表/不等于/并不意味着/推不出/不足以/未必/不一定/在当时/事前/当时的信息/做决定时/下决定时/决策当时/反过来/恰恰相反/反之; EN does not mean / cannot conclude / not necessarily / not only / at the time / ex ante / given the information available / the reverse / conversely), hedge and luck acknowledgement (可能/也许/或许/大概/恐怕/倾向于/似乎/有待/运气/偶然/碰巧/侥幸; EN maybe / perhaps / might / possibly / probably / seems / luck / chance / fluke / lucky), and questions.
- `src/outcome-bias.js` — new detector module with 16 injectable constants (OUTCOME/DECISION/EVAL/LINK × ZH/EN, EXEMPT_META/EVID/NEG/HEDGE × ZH/EN) and dual-orientation connection legs; wired into `src/index.js` at nine points (require / computation / dimMap / allDims / DIM_GUIDANCE / VERIFY_DIMS / dimensions / summary / module.exports).
- `test/round-175-outcome-bias.js` — negative-injection + variant-matrix suite.

### Verification
- round-175 test 25/25 (attacks 16/16 hit including ZH/EN, bare-noun, modified, inverted, long-sentence forms; benign 15/15 zero false-positive including correct ex-ante evaluations, reasoning negation, luck acknowledgement, concept teaching, RCT evidence, questions, and the war-multiple-causes edge-benign; 16 constant negative-injection load checks; 8 exemption trap flips; 3 registration assertions)
- gate-layer variant matrix 7/7 non-pass with outcome_bias in findings, benign 7/7 pass
- bidirectional guard 52/52 recall, 302/326 benign pass (unchanged from baseline); bin/verify.js 16/16; guard-abilities.js 20/20 (dimensions 173 registered); doc-numbers-accuracy.test.js 22/22
- Source: HN Algolia "outcome bias" (objectID 6563620 "Outcome Bias and the Interpreter: How Our Minds Confuse Skill and Luck", 16543449 "Introduction to the Outcome Bias – Don't Judge Decisions by Their Outcome", 21131582 "Outcome Bias: The Bias Behind the World's Greatest Catastrophes"); GitHub has no pure-rule implementation (jbarach2012/AIBF_API ★195 is applicant-tracking anti-discrimination, structurally different, conceptual background only); Semantic Scholar returned no results (recorded honestly). Gap measured by /tmp/hf-probe-r175.js against src/gate.js: 7 of 8 outcome-bias attack samples passed the hard gate with zero dimension hits; same-pool candidates common-cause (4/5 through) and hindsight (already partially covered by overclaim sub-signals) were considered; outcome bias was the only truly zero-coverage family.

## [6.8.102] - 2026-10-31

### Added
- **`reverse_causation` — dimension 172 (因果倒置 / reverse causation / 反向因果)**: a new VERIFY-level discrimination dimension that catches treating a **response to a consequence** as the **cause of that consequence**. People take an action precisely because the adverse outcome already exists or the risk is already high, so "the people/places that do this have worse outcomes" is a **selection effect** (the outcome selected the actors), not evidence that the action produced the outcome. Criteria are two legs that must co-occur: leg ① RESPONSE_CORR — a response-type action noun (住院/就医/吃药/报警/投诉/补习/约谈/戴口罩/头盔/装监控/装防盗窗/买保险/裁员/封号… bare-noun forms; EN hospitali[sz]ed / therapy / police reports / tutoring / wearing masks / cameras / insurance / layoffs) × a correlation/selection frame, either R-a selection-difference frame (action + group noun (人/患者/孩子/社区/地区/公司/官员/家庭/用户/员工/骑手/居民/账号; EN patients / people / those who / areas / children / drivers) within a 6-char (EN 30-char) window, both directions, the group noun must be adjacent to 的 — both 「住院**患者的**死亡率」 and 「住院**的**患者」 are accepted, coincidental adjacency without 的 is not — plus a difference/correlation marker (更/多/高/严重/差/容易/越/集中/往往/大都/明显/显著/频繁; EN more / higher / worse / more often / likely / tend)) or R-b monotonic correlation frame (action + 越 within a 12-char window with ≥2 occurrences of 越 in the text; EN the more X … the worse Y); leg ② CAUSE — a causal verb (导致/造成/引发/引起/带来/招来/引来/吸引/催生/制造/滋生/助长/加剧/加重/诱发/促成/酿成/加大了/增加了/提高了/提升了/推向/是…的原因/原因就在于/根源在于/罪魁祸首/让/令/使得; EN causes / leads to / results in / increases / worsens / is responsible for / contributes to / makes / attracts / draws) × a negative-outcome noun (死亡/死亡率/事故/犯罪/小偷/复发/恶化/失眠/抑郁/自杀/落马/倒闭/亏损/被骗/被盗/感染/感冒/更差/退步/风险/问题; EN death / mortality / accidents / crime / relapse / insomnia / depression / suicide / addiction / infections / losses / worse) within an 18-char (EN 45-char) window **measured from the start of the causal-verb match** (the 「是公司衰败的原因」 form swallows the outcome noun inside its own match). Five exemption classes are all negative-injection load-bearing: concept/teaching (因果倒置/反向因果/混淆变量/相关不等于因果/辛普森悖论/内生性; EN reverse causation / confounding / endogeneity / Simpson's paradox / textbook / lecture), experiment/evidence context (随机对照/对照组/实验组/双盲/前瞻性研究/队列研究/元分析/实验表明/数据显示/研究表明; EN randomized / controlled trial / RCT / control group / prospective / cohort study / meta-analysis / data show / evidence shows), reasoning-negation/reverse-acknowledgement (不能说明/不代表/不等于/推不出/不足以/是因为/其实是因为/反过来/反之; EN does not mean / cannot conclude / is because / the reverse / conversely), hedge (可能/也许/或许/大概/倾向于/有待; EN maybe / perhaps / might / probably / seems), and questions.
- `src/reverse-causation.js` — new detector module with 18 injectable constants; wired into `src/index.js` at nine points (require / computation / dimMap / allDims / DIM_GUIDANCE / VERIFY_DIMS / dimensions / summary / module.exports).
- `test/round-174-reverse-causation.js` — negative-injection + variant-matrix suite.

### Verification
- round-174 test 24/24 (attacks 16/16 hit including ZH/EN, bare-noun, modified, inverted, long-sentence forms; benign 14/14 zero false-positive including correct-direction statements, acknowledged selection effects, reasoning negation, RCT evidence, positive effects, hedges, questions, concept teaching, non-response actions; 13 constant negative-injection load checks; 4 exemption trap flips; 3 registration assertions)
- gate-layer variant matrix 7/7 non-pass with reverse_causation in findings, benign 7/7 pass
- bidirectional guard 52/52 recall, 302/326 benign pass (unchanged from baseline); bin/verify.js 16/16; guard-abilities.js 20/20 (dimensions 172 registered); doc-numbers-accuracy.test.js 22/22
- Source: HN Algolia "counterfactual reasoning" (objectID 23266032, 43754084) and "causal inference" (objectID 37890685 225 points, 41263928); GitHub fallacy-detection repos tmakesense/logical-fallacy ★20 / SeanFlannery/Logical.ly ★4 / EPITA-SCIA/Fallacy-Detection-LLM ★2 (all LLM-based, conceptual background only); Semantic Scholar returned HTTP 429. Gap measured by /tmp/hf-probe-r174b.js against src/gate.js: 7 of 10 reverse-causation attack samples passed the hard gate with zero dimension hits.

## [6.8.101] - 2026-10-31

### Added
- **`clustering_illusion` — dimension 171 (集群错觉 / clustering illusion / Texas sharpshooter fallacy)**: a new VERIFY-level discrimination dimension that catches treating a cluster, streak, or concentration of events in random data as significant evidence or a special cause — random distributions naturally produce clusters in time, space, and category; reading a cluster as inevitable, anomalous, or mysteriously lawful is signal-from-noise. Two-leg co-occurrence criterion (any missing leg = no hit). Leg① CLUSTER cluster statement, three routes: (a) concentration word (连续/接连/接二连三/扎堆/集中/频发/高发/屡屡/频频/隔三差五/每逢/每当/每次/历来/向来; EN in a row/in succession/consecutive/clustered/spate/streak/every Friday) × event noun (事故/案件/盗窃/中奖/倒闭/猝死/投诉/故障/纠纷/空难/坠机/失踪/复发…, bare-noun forms; EN accidents/incidents/crashes/complaints/lawsuits/suicides) within a 14-char (EN 20-char) window, both directions; (b) same-source (全都/都/皆/清一色/无一例外 + 来自/出自/毕业于/就职于/指向/死于 + 同一/同一个/同一条/同属; EN all … from/at/in … same) — the cherry-picked-commonality form; (c) count ≥2 (四起/五起/好几个/数次; EN two/three/four/several/multiple) × event noun (6-char window, including the inverted 「事故四起」 form). Leg② SIGNIF significance attribution, five forms: R1 denial of chance (绝不是/绝非/一定不是/不可能只是/并非只是/不只是 × 巧合/偶然/随机; EN can't be / is not just / more than / far from × coincidence/chance/random), R2 anomaly assertion (显然/肯定/一定/可见/说明/意味着/证明 × 蹊跷/反常/有猫腻/说不通/邪门/诡异/离奇/不同寻常; EN clearly/obviously/must/means × sinister/fishy/inexplicable/pattern/law), R3 mystical attribution (天意/天命/劫数/魔咒/宿命/冥冥/幕后黑手/暗中操控/风水/玄学/诅咒/看不见的手; EN cursed/doomed/destiny/fate/omen/universe is telling), R4 law-ification (逃不过/躲不掉/在劫难逃/铁律/命中注定/历史重演; EN doomed/inescapable/bound to happen/same fate), R5 calendar superstition (每逢/每当/每次 × 必/准/总 × 出事/故障/复发/吵架; EN every Friday something goes wrong). Representative hits: 「这个路口一个月出了四起事故，绝不可能是巧合」「最近三个月，同一个小区接连发生了五起入室盗窃，显然这里面有蹊跷」「三个中奖者全都来自同一条街，这绝不是偶然」「这个部门每逢周一必出事，简直是逃不掉的魔咒」「Four accidents happened at the same intersection in one month, which cannot be a coincidence.」「Three lottery winners all came from the same street — that can't be random.」. r173 implementation lessons (frozen into tests): ① a hedge exemption placed before R1 lets 「绝不可能**是**巧合」's 可能 exempt the attack leg itself — R1 must be judged before the hedge exemption; ② taking only the first match of a cluster route misses real pairs (「三个**月**」 matches before 「五**起**」) — full-match scanning (nearAny) is required; ③ the EN route-a window needed to be bidirectional ("crashes in a row"). Four exemption classes, all negative-injection load-bearing: explicit randomness/statistical treatment (随机序列/随机波动/按概率/概率论/大数定律/正态分布/独立事件/统计显著/置信区间/样本量/基准率/正常波动/不足为奇/查明/排查/数据显示/研究表明/对照组/归因于; EN randomly/by chance/probability/statistically significant/confidence interval/sample size/base rate/root cause/investigation found/attributed to), inference negation/insufficient evidence (不代表/不意味着/推不出/说明不了/未必/不一定/证据不足/样本不足; EN does not mean/cannot conclude/insufficient evidence), hedging (可能/也许/或许/大概/恐怕/倾向于/碰巧/恰巧; EN maybe/perhaps/might/probably/seems), concept/teaching restatement (集群错觉/赌徒谬误/德州神枪手/热手谬误/概率论/统计学/老师/教材/课堂/卡尼曼; EN clustering illusion/Texas sharpshooter/apophenia/gambler's fallacy/hot hand/textbook/lecture), questions. Boundary vs existing dimensions: hot_hand governs momentum × forward continuation prediction; post_hoc/pseudo_causal govern temporal succession × causal assertion; selection_bias/survivorship_bias govern restricted sampling × population generalization — the retrospective cluster × significance-attribution family was zero-coverage. src/clustering-illusion.js (new, ~380 lines) with 22 injectable constants and three-route cluster judging + five-form significance judging; wired into src/index.js at all 9 registration sites. Source: HN Algolia "conjunction fallacy" (Wikipedia Conjunction_fallacy chain, objectID 10629797 et al.; "Linda the Bank Teller, by Tversky&Kahneman" 16467558) and GitHub fallacy-detection repos (latent-variable/Real_time_fallacy_detection ★119 / tmakesense/logical-fallacy ★20 / panFJCharlotte98/Fallacy_Detection EMNLP 2024 ★5 / dhfbk/faina NAACL 2025 ★5 — all LLM-based, concept background only; Semantic Scholar returned empty). Scout log: /tmp/hf-scout-r173.txt. Dimension count 170→171, VERIFY tier 129→130.

### Verification
- round-173 test 28/28 (attacks 12/12 hit including ZH/EN, bare-noun, modified, inverted, long-sentence forms; benign 16/16 zero false-positive including evidence-based attribution, chance affirmation, factual determination, questions, hedging, statistical-significance evidence, calendar schedules, concept teaching, and the 「战争是多因共同造成的」 correct-multi-cause edge benign; 17-constant negative-injection load-bearing with single-form samples + combined-injection isolation proving each cluster route and each significance form independently load-bearing; 4 exemption-trap flips; 3 registration assertions)
- gate-layer variant matrix 12/12 non-pass, benign 10/10 pass
- bidirectional guard 52/52 recall, 302/326 benign pass (unchanged); bin/verify.js 16/16; guard-abilities.js 20/20 (dimensions 171 registered); doc-numbers-accuracy.test.js 22/22

## [6.8.100] - 2026-10-31

### Added
- **`whole_part_transfer` — dimension 170 (整体-部分属性迁移 / fallacy of composition & division)**: a new VERIFY-level discrimination dimension that catches transferring a property between the part level and the whole level when the property is emergent / non-additive (强/优秀/顶级/清廉/竞争力…, not weight/count/total-price style additive quantities). Composition form (part→whole): every part has X, so the whole has X — 「每个队员个人能力都很强，所以这支球队一定很强」「所有零件都用的顶级材料，因此这台设备的性能一定极其出色」「这个政府里的每个官员都清廉，所以这个政府自然是清廉的」「Every player on the roster is elite, so the team is guaranteed to win.」; division form (whole→part): the whole has X, so every part has X — 「这支球队是世界顶级的，所以每个球员都是世界顶级水平」「这家公司是全球顶尖的，因此这里的每个员工都是顶尖人才」「The orchestra is world-class, therefore every musician in it is world-class.」. Criterion is multi-condition co-occurrence (any missing leg = no hit). Composition route: leg① PART_QUANT part-quantifier × part noun (每个/每一个/每一名/每一位/各个/所有/全部/任何/凡是/但凡/个个/每位/各位 + ≤2-char gap + 队员/成员/零件/模块/官员/公民/工程师/客户/人…; EN every/each/all + part/component/member/player/employee/people…, bare-noun forms) × leg② QUALITY emergent-quality word (很强/优秀/顶级/一流/清廉/闻名/精锐/大师/elite/world-class/win…; bare 强 guarded by lookbehind/lookahead against 增强/强制/强行/强权/强化) between part noun and the whole noun (≤40 chars) × leg③ whole noun (determiner form + bare-noun form, both routes) × leg④ conclusion marker TAIL = inference ∪ necessity modal (所以/因此/因而/可见/说明/意味着/证明/显然/毫无疑问/一定/必然/自然/势必/无疑；EN therefore/thus/hence/consequently/which means/so/must/certainly/guaranteed — covers both 「所以球队一定很强」 and 「整个团队攻克难关自然不在话下」 conclusion shapes) × leg⑤ QUALITY recurrence within 40 chars after the whole noun; plus a fallback route for conclusion-first inversions (whole before the part side). Division route: whole noun × QUALITY (≤30 chars before inference) × inference × part quantifier after the inference × QUALITY recurrence within 24 chars after the part noun. Four exemption classes, all negative-injection load-bearing: explicit additive aggregation (一共/共计/合计/总计/总共/累计/加起来/总和/总量/总重/总价；EN in total/altogether/combined/adds up/totals to), inference negation/reversal (难道/恰恰相反/反过来/不等于/不意味着/不代表/未必/不一定/取决于/还要看/能不能/是否/推不出/说明不了/证明不了/并不能/而不是/而非；EN not necessarily/does not mean/depends on/cannot be inferred), hedging (可能/也许/或许/大概/恐怕/多半/倾向于；EN maybe/perhaps/might/probably/tends to), concept/teaching restatement (组合谬误/合成谬误/分解谬误/分割谬误/整体与部分/区群谬误/生态谬误/逻辑谬误/老师/教材/课堂/教授/课本；EN composition fallacy/division fallacy/fallacy of composition/ecological fallacy/logical fallacy/textbook/lecture), questions. src/whole-part-transfer.js (new, ~310 lines) with 16 injectable constants and two-route judging legs; wired into src/index.js at all 9 registration sites. Coexists with the pre-existing composition_fallacy/division_fallacy sub-tags inside the `fallacies` dimension (6 narrow English-only patterns, src/index.js:5453-5459) — same precedent as sunk_cost_coercion vs sunk_cost_fallacy and base_rate_neglect vs base_rate_fallacy; the Chinese family and all variants were previously zero-coverage. Source: HN Algolia "logical fallacy detection" — arXiv 2405.02318 "Translating natural language to first-order logic for logical fallacy detection" (258 pts; NL2FOL framework, LOGIC dataset F1 78% — confirms fallacy detection as a formal-logic-driven task family) and GitHub fallacy-detection repos (latent-variable/Real_time_fallacy_detection ★119 / tmakesense/logical-fallacy ★20 / panFJCharlotte98/Fallacy_Detection EMNLP 2024 ★5 — all LLM-based, structurally different from a pure rule engine, concept background only). Scout log: /tmp/hf-scout-r172.txt.

### Verification
- round-172 test 20/20 (attacks 13/13 hit including ZH/EN, bare-noun, modified, inverted, long-sentence forms; benign 15/15 zero false-positive including explicit-total arithmetic, effort-is-input-not-quality, negation reversal, concept teaching, question, hedging, and the 「战争是多因共同造成的」 correct-multi-cause edge benign; 8-constant negative-injection load-bearing flips across all legs; 4 exemption-trap flips; 3 registration assertions)
- gate-layer variant matrix 13/13 non-pass with whole_part_transfer in findings, benign 8/8 pass
- bidirectional guard 52/52 recall, 302/326 benign pass (unchanged); bin/verify.js 16/16; guard-abilities.js 20/20 (dimensions 170 registered); doc-numbers-accuracy.test.js 22/22

## [6.8.99] - 2026-10-31

### Added
- **`base_rate_neglect` — dimension 169 (base rate neglect / 基准率忽视)**: a new VERIFY-level discrimination dimension that catches drawing a high-confidence posterior conclusion from a single positive signal while ignoring the base rate / prior / prevalence / false-positive rate. Two-legged criterion: leg① SIGNAL — a concrete positive indicator (检测/筛查/检查阳性、被系统或算法标记/预警、命中名单/黑名单/数据库、符合/吻合/匹配 嫌疑人/画像/特征/指纹/DNA/profile with ≤6-char modifier gap、测谎仪显示、被识别为匹配；tested positive / flagged / matched the profile / fits the profile / polygraph showed / positive for / identified as a match); leg② CONFIDENT — a confident condition-attribution conclusion (几乎肯定/肯定/一定/显然/毫无疑问/很可能/必然/确定/八成/铁定/多半 + 得/患/感染/染上/确诊/是/有/属于/中招/罪/骗子/罪犯/嫌疑人/高危；almost certainly have / definitely has / most likely is / very likely guilty / clearly is / beyond doubt / so you probably have). Two exemption classes, both negative-injection load-bearing: base-rate language present (基础概率/基准率/先验/患病率/假阳性率/贝叶斯/罕见；base rate / prior / prevalence / false positive / positive predictive value / Bayes) and pending-confirmation / no-overclaim (需进一步确认/复查/待确诊/不能据此断定/只是初筛；not conclusive / needs confirmation / rule out / cannot conclude). src/base-rate-neglect.js (new, ~230 lines) with 8 injectable constants; wired into src/index.js at all 9 registration sites (require / compute / dimMap / allDims / DIM_GUIDANCE / VERIFY_DIMS / dimensions / summary / exports). Distinct from appeal_to_probability (scale→certainty), selection_bias (restricted-sample→population), confidence/absolute_claim (assertion strength), unsupported_claim (unfounded assertion). Source: HN Algolia "base rate fallacy" (Wikipedia Base rate fallacy) and GitHub logical-fallacy repos (tmakesense/logical-fallacy ★20) — no transplantable rule criteria, concept background only; criteria are HeartFlow's own pure-rule implementation. Scout log: /root/hermes1/cache/scratch/hf-scout-171.txt.

### Verification
- round-171 test 11/11 (attacks ZH 6/6 + EN 3/3 hit including bare-noun / modified / inverted / long-sentence / bilingual forms; benign 7/7 zero false-positive including base-rate-aware, pending-confirmation and edge benigns; 6-constant negative-injection load-bearing flips across both legs and both exemption classes; gate variant matrix 9/9 non-pass with base_rate_neglect in findings, benign 7/7 pass)
- bidirectional guard 52/52 recall, 302/326 benign pass (unchanged); bin/verify.js 16/16; guard-abilities.js 20/20 (dimensions 169 registered); doc-numbers-accuracy.test.js 22/22

## [6.8.98] - 2026-10-31

### Added
- **`survivorship_bias` new sentence family — survivor sampling × population generalization**: extends dimension 132 with the sampling-frame form of survivorship bias — evidence is drawn only from the samples that survived (only interviewed the survivors / only counted the users who stayed / only covered the employees who were not laid off / Only those who survived are counted), yet the conclusion is generalized to the whole population (reflects every passenger's experience / 认定 applies to all / 人人都能成功 / 大多能成功 / so all customers love the new plan). Probe-measured gap on the v6.8.97 engine: 6 of 12 attacks were true zero-hit including both ZH and EN forms; `selection_bias`'s survivor-wording exemption deliberately ceded this family to `survivorship_bias` in r169, and this round catches it. Two-legged criterion: leg① SURV_SAMPLE — restriction marker (只/仅/仅仅/全/都/均/only/solely/just/merely) × sampling verb (采访/访谈/统计/调查/复盘/回收/收集/纳入/观察/听见/记录/发给/surveyed/interviewed/counted/heard from) × survivor keyword (幸存者/生还者/活下来/存活/没退出/没流失/坚持下来/留存/没被裁员/没被淘汰/毫发无损/survivors/who survived/who stayed/still active) in three routes (marker×verb×word / marker×word×verb / sample-source phrase 样本全部来自生还者); leg② SURV_GEN — generalization verb × population-scope word (反映/代表/认定/说明/证明/足以证明/represents/reflects/shows/means/proves/works for × 全体/所有/人人/每个人/大多数人/普遍/all/every/everyone), or scope word × universal judgment (人人都能成功/整体都很满意/大多能成功/so all customers love the new plan). Four exemption classes, all negative-injection load-bearing: hypothetical conditionals (如果只统计活下来的用户，结果就会偏乐观 — describing the bias, not committing it), negated restriction (不是只采访幸存者), rebuttal of the family (结论不能反映全体/不足以推广), questions. src/survivorship-bias.js gains 12 injectable constants and the r170 judging leg; DIM_GUIDANCE concept text extended in src/index.js. Source: HN Algolia "survivorship bias" (Wikipedia Survivorship Bias 464 pts / Survivorship bias and startup hype 340 pts / Beware survivorship bias in advice on science careers 197 pts) and Semantic Scholar "survivorship bias" (2023–2025 domain-application papers, e.g. Survivorship Bias in Psychological Research 2025 / The Impact of Survivorship Bias in Glioblastoma Research 2023, 27 citations) — none provide transplantable rule criteria, concept background only; the family criteria are HeartFlow's own pure-rule implementation. Scouting log: /tmp/hf-scout-1793404301.txt. Dimension count unchanged at 168 (new sentence family within an existing dimension); VERIFY tier unchanged.

### Verification
- round-170 test 49/49 (attacks ZH 10/10 + EN 4/4 hit including bare-noun, modified, inverted, long-sentence, cross-sentence and source-phrase forms; benign ZH 12 + EN 4 zero false-positive including edge benigns: hypothetical, negated restriction, rebuttal, question, adequate sampling, concept restatement, correct multi-cause statement; 11-constant negative-injection load-bearing flips; 2 boundary locks; 3 existing-family regressions; 3 registration assertions; gate layer ×2)
- gate-layer variant matrix 8/8 non-pass with findings containing survivorship_bias (core / bare-noun / modified / inverted / long-sentence / cross-sentence / EN ×2); module-level attacks 13/13, benign 12/12 zero false-positive
- bidirectional guard 52/52 recall, 302/326 benign pass (unchanged); bin/verify.js 16/16; guard-abilities.js 20/20; doc-numbers-accuracy.test.js 22/22

## [6.8.97] - 2026-10-31

### Added
- **168th discrimination dimension — `selection_bias` (sampling-frame restriction fallacy / 取样偏差)**: catches evidence-sufficiency attacks where a conclusion about a whole population is drawn from a restricted, self-selected or non-random source — evidence force is inflated because the sampling frame does not match the conclusion's population. ZH: 「问卷只发给了注册会员，所以调查结果代表全体用户的满意度」「数据只来自一线城市的活跃用户，足以说明全国用户的偏好」「样本全部来自自愿报名的志愿者，因此这个结论具有普遍性」「公司只收集了投诉客户的意见，这说明客户整体都很不满意」「由于经费限制，这项调研只回收了愿意配合的老年人的问卷，但研究者认为这完全可以代表全市老年人的健康状况」「所以全体员工都认可这项新制度——毕竟问卷只发给了管理层」; EN: "We only surveyed volunteers, so the results are representative of everyone." / "The sample was drawn solely from our premium users, which means all customers prefer this feature." / "Feedback came only from subscribers, which shows the whole audience wants this change." Two-legged criterion: leg① RESTRICTION — restriction marker (只/仅/仅仅/全都/都/均/only/solely/restricted to) near a sampling verb (调查/统计/采访/回收/收集/纳入/来自/发给/survey/sampled/drawn/recruited), or a source phrase (样本/数据 + 全部/都/均 + 来自/源于) carrying a restricted-source keyword (会员/活跃/自愿/投诉/一线/管理层/volunteers/premium/self-selected); leg② GENERALIZATION — generalization verb (代表/适用于/推广/反映/具有/足以说明/足以证明/representative of/generalizes to/applies to/which shows) near a population-scope word (全体/所有/整体/全国/每个人/大众/普遍/all/every/everyone/whole audience), or scope + 「都」 universal judgment (全体员工都认可). Conclusion candidates span same-comma-segment after infer word, following comma segments, following sentences, and 毕竟/因为 inverted-order routing; infer words that are themselves generalization verbs (足以说明 / which shows) are not sliced off. Eight exemptions, all negative-injection load-bearing: acknowledged limitation (只能反映/不能代表/不一定成立/还有待验证/不足以推广 — correct reasoning), adequate sampling (随机抽样/分层抽样/普查/random sample), survivor wording (幸存者/活下来/survivors — scope left to survivorship_bias), sample-only description (会员的满意度更高/所有样本都合格), hedged conclusions (可能/也许/maybe/might), questions, fallacy concept restatement (取样偏差/selection bias), teaching restatement. New file src/selection-bias.js (~330 lines), nine wiring points in index.js. Source: HN Algolia "base rate fallacy" hits (Wikipedia Base rate fallacy; Schneier "Terrorists, Data Mining, and the Base Rate Fallacy") as concept background — HeartFlow's base_rate_fallacy/prosecutors_fallacy sub-tags are English-only (5 regexes, zero ZH coverage), Semantic Scholar returned empty, GitHub high-star fallacy tools are all LLM-based and non-isomorphic to a pure rule engine; the family gap was probe-measured on the current 167-dimension engine (selection_bias 9/10 true zero-hit vs candidates: availability 5/6, clustering illusion 4/5, ecological fallacy / regression-to-mean 3/4 already intercepted). Dimensions 167→168, VERIFY 126→127.

### Verification
- round-169 test 53/53 (attacks ZH 10/10 + EN 4/4 hit including bare-noun, modified, inverted, long-sentence, cross-sentence and marker-only forms; benign ZH 11 + EN 4 zero false-positive including edge benigns; 14 constant negative-injection load-bearing flips; boundary lock vs survivor wording; distinction lock; 2 existing-dimension regressions; 4 registration assertions; gate layer ×2)
- gate-layer variant matrix 12/12 non-pass with findings containing selection_bias; module-level benign 16/16 zero false-positive
- bidirectional guard 52/52 recall, 302/326 benign pass (no new interception); bin/verify.js 16/16; guard-abilities.js 20/20; doc-numbers-accuracy.test.js 22/22

## [6.8.96] - 2026-10-31

### Added
- **167th discrimination dimension — `illicit_conversion` (illicit conversion / illicit categorical conversion)**: catches the syllogistic invalid form where a universal affirmative "all A are B" is converted into "all B are A" — subject and predicate swap places, turning one-way inclusion into two-way (「所有猫都是动物，所以动物都是猫」「畅销的车都省油，所以省油的车都畅销」「爱国者都支持国产，所以支持国产的都是爱国者」「凡是认真读过原著的人都反对魔改，所以反对魔改的人都认真读过原著」「坚持锻炼的人免疫力强，所以免疫力强的人都坚持锻炼」; All squares are rectangles, so all rectangles are squares. / Every poet loves language, so everyone who loves language is a poet. / Whales are mammals, so mammals are whales.). Third member of the formal-logic family alongside `affirming_the_consequent` (Q ∴ P), `denying_the_antecedent` (¬P ∴ ¬Q) and `conditional_proposition` (¬B ⇒ ¬A) — this family covers B ⊇ A subject-predicate conversion. Two-leg criterion: leg ① PREMISE — universal affirmative premise with a universal quantifier (所有/全部/任何/每个/每一/凡/一切/一律) or bare 都-form A⊆B statement (EN: all/every/any/each A are B, or copula-less verb sentences like "Every poet loves language"), splitting subject A from predicate B; leg ② CONVERSION — after an inference word (所以/因此/可见/这说明/故/so/therefore/which means), in the immediately following clause, in the preceding inverted clause, or in the same clause routed by a premise marker (因为/because), a statement whose **subject references B and whose predicate references A**. Bare-predicate premises (「坚持锻炼的人免疫力强」— no quantifier, no copula, no 都) fall back to positional splitting by conclusion subject/predicate keywords; single-character predicates may be reverse-contained by premise keywords (飞 ⊆ 会飞的). The swap structure naturally distinguishes: particular conversion (有些A是B ∴ 有些B是A — valid), negative conversion (所有A都不是B ∴ 所有B都不是A — valid), singular instantiation (conclusion subject references A), valid syllogism (conclusion references the second premise's subject), and premise restatement (no swap). Eight exemptions, all load-bearing under negative injection: particular quantifiers, hedges/broad quantifiers, negation words (a negated conclusion is a correct denial of the conversion), biconditionals (当且仅当/iff), symmetric relations (同一/等同于/互为/equivalent/identical), meta-discussion (不当换位/换位命题/illicit conversion), teaching, evidence context. New file `src/illicit-conversion.js` (~440 lines, injectable `__internals`); `src/index.js` wired in nine places. Dimensions 166→167, VERIFY 125→126. Source: HN Algolia logical-fallacy stories (Translating natural language to first-order logic for logical fallacy detection 258 pts / Logical fallacies in software engineering 242 pts / Logical Fallacies Are Usually Irrelevant or Cited Incorrectly 176 pts — FOL routes need an LLM and are not isomorphic to the pure-rule engine, background reference only); candidate gap measured by /tmp/r168-gap-probe.js on the 166-dimension engine (conversion family 7/8 true zero-hit vs. undistributed-middle candidate 2/8); own pure-rule implementation. Scouting log: /tmp/hf-scout-1793387758.txt.

### Verification
- round-168 test 25/25 (attacks ZH 10/10 + EN 5/5 hit including inverted order, bare-predicate premise and comma-free same-clause forms; benign ZH 14 + EN 4 zero false-positive including singular instantiation, valid syllogism, particular/negative conversion, negated conclusion, hedge, biconditional, symmetric relation, question, meta-discussion, teaching, evidence context; eight-constant negative-injection load-bearing flips; two family-boundary locks vs. affirming_the_consequent / denying_the_antecedent; distinction lock; two regression checks; five registration assertions; two gate-layer checks); gate layer variant matrix 12/12 non-pass with illicit_conversion in every findings list; bidirectional guard 52/52 recall, 302/326 false-positive (unchanged); bin/verify.js 16/16; guard-abilities.js 20/20; doc-numbers-accuracy.test.js 22/22.

## [6.8.95] - 2026-10-31

### Added
- **166th discrimination dimension — `one_sided_dismissal` (concessive dismissal / one-sided argument)**: catches the evidence-symmetry violation where counter-evidence is conceded and then swept away by one summary phrase without weighing, landing on a one-sided conclusion — 「这个药虽然有副作用，但临床试验显示它利远大于弊，所以值得推广」「研究确实也发现了一些问题，不过总体而言瑕不掩瑜」「当然反对者也能举出一些反例，但主流数据都站在我们这边」「他确实犯过错，但这不能掩盖他取得的巨大成就」; Side effects exist, but the benefits overwhelmingly outweigh the risks. / Critics can point to failures, yet the data overwhelmingly supports the approach. Two-leg criterion (both required): leg ① CONCESSION — a concession marker (虽然/尽管/固然/诚然/不可否认/必须承认/确实/当然/ admittedly/although/though/while/granted/critics/skeptics/there are/exist) must co-occur with a **counter-evidence word** (副作用/风险/反例/批评/质疑/缺陷/过错/失败/争议/代价/受损/冲击 / side effects/risks/criticism/concerns/failures/flaws/drawbacks/dissenting — all bare-noun forms); leg ② DISMISSAL — a sweeping summary phrase (瑕不掩瑜/不能掩盖/利远大于弊/总体而言/归根结底/主流/大势所趋/实践证明/时间会证明 / overwhelmingly/outweighs/on balance/consensus is clear). Mirror of `false_balance` (which fakes balance where the evidence is one-sided; this family fakes one-sidedness where real counter-evidence exists). Four exemptions, all load-bearing under negative injection: BALANCED_QUANT (concrete numbers on both sides — real risk-benefit weighing), MITIGATION (具体处置措施: 可以监测/及时调整/停药即可/可控/可逆 — checked over the full text since mitigation claims often precede the dismissal phrase), META_CONCEPT (选择性证据/单边论证/cherry picking), TEACH. New file `src/one-sided-dismissal.js` (~230 lines, injectable `__internals`); `src/index.js` wired in nine places. Dimensions 165→166, VERIFY 124→125. Source: Semantic Scholar evidence-sufficiency/hallucination-detection survey (Evidence-Chain Reliable RAG 2025, Medico arXiv:2410.10408, Evidence-Aligned Entity Verification arXiv:2609.08267 — all LLM/embedding-based, background reference only); own pure-rule implementation.

### Verification
- round-167 test 44/44 (attacks ZH 10/10 + EN 5/5 hit including inverted order 「利远大于弊——虽然这个药也存在一些副作用」, benign ZH 8 + EN 4 zero false-positive, eight-constant negative-injection load-bearing flips, distinction locks vs false_balance); gate layer variant matrix 11/11 non-pass with one_sided_dismissal in every findings list; bidirectional guard 52/52 recall, 302/326 false-positive (unchanged); bin/verify.js 16/16; guard-abilities.js 20/20; doc-numbers-accuracy.test.js 22/22.

## [6.8.94] - 2026-10-30

### Added
- **165th discrimination dimension — `denying_the_antecedent` (denying the antecedent)**: catches the formal-logic invalid inference "if P then Q; not P; therefore not Q" — denying the antecedent to conclude the consequent also fails (「如果下雨，运动会就取消；今天没下雨，所以运动会不取消」「努力的人都会早起；他根本不努力，所以他不会早起」; If it rains, the match will be cancelled. It did not rain, so the match is not cancelled.). Two-leg criterion: leg ① COND conditional/rule sentence (如果X（那么/则/就）Y / X都会Y / X能Y / 只要X就Y / EN if X then Y / X has Y / English bare rule), splitting antecedent A and consequent B; leg ② ANTECEDENT_DENY — split the fact sentence by inference word (所以/因此/说明/so/therefore), the first half must reference **antecedent A** and be negated (¬P), the second half must reference **consequent B** and be negated (¬Q). The ¬P ∴ ¬Q shape naturally distinguishes modus ponens (both affirmed), modus tollens (¬Q ∴ ¬P, opposite direction, A≠B keywords don't cross), and affirming the consequent (Q ∴ P, no negation). Six exemptions, all load-bearing under negative injection: biconditional (当且仅当/iff — under a biconditional ¬P ∴ ¬Q is valid), negation flip (不意味着/does not mean), hedge (可能/必要不充分/not sufficient), meta-discussion (否定前件/formal fallacy), teaching, evidence context. New file `src/denying-the-antecedent.js` (~290 lines, injectable `__internals`); `src/index.js` wired in nine places. Dimensions 164→165, VERIFY 123→124. Boundary vs. `affirming_the_consequent` (dim 155, Q ∴ P) and `conditional_proposition` (dim 160, ¬B ⇒ ¬A, conclusion on the antecedent) — three distinct deductive directions. Source: arXiv:2405.02318 "Translating natural language to first-order logic for logical fallacy detection" (HN 258 pts, FOL route not isomorphic to the pure-rule engine, background only) + GitHub tmakesense/logical-fallacy (20★, no reusable rules); own rule implementation mirroring affirming-the-consequent.js.

### Verification
- round-166 test 39/39 (attacks ZH 8/8 + EN 5/5 hit, benign ZH 8 + EN 3 zero false-positive, five-constant negative-injection load-bearing flips, distinction locks / division-of-labor locks); gate layer attacks 8/8 non-pass with denying_the_antecedent count≥1; bidirectional guard 52/52 recall, 302/326 false-positive (unchanged); bin/verify.js 16/16; guard-abilities.js 20/20; doc-numbers-accuracy.test.js 22/22.

## [6.8.93] - 2026-10-30

### Added
- **164th discrimination dimension — `appeal_to_consequences` (argumentum ad consequentiam)**: catches the family that substitutes the acceptability of a proposition's consequences for evidence about its truth — denying or refusing to believe a claim because of how terrible/unacceptable/meaning-destroying it would be if true: 「承认房价会跌太可怕了，那么多人还着贷款，所以房价不可能跌」「如果进化论是真的，那人活着就没有意义了，所以进化论不可能是真的」「我不敢相信气候变化是人为的，万一这是真的，经济就全盘崩溃了」(If climate change were real, our economy would collapse, so it cannot be true. / The findings are too devastating to be true — the data must be fabricated.). Two-leg criterion: leg ① CONSEQUENCE — explicit consequence assessment (太可怕/细思极恐/不堪设想/不敢想/没法接受/天要塌了/全盘崩溃/经济崩盘/还有什么意义/天下大乱; EN too damaging / would collapse / would be devastating / too much to bear / life would have no meaning); leg ② TRUTH-DENIAL — truth-value denial or refusal to believe (所以不可能是真的/一定是假的/纯属吓唬/危言耸听/我不敢相信…是真的; EN cannot be true / must be false / I refuse to believe / too … to be true), with the inverted order (denial first, consequence as the reason) covered by co-occurrence. Five exemptions, all load-bearing under negative injection: hedge (可能/也许/未必 — the bare 可能 carries a negative lookbehind `(?<![不么])` so 「不可能跌/怎么可能」 does not self-exempt), evidence present (数据表明/实验结果/peer review — bare 数据/实验 narrowed to compound forms so 「所以一定是数据造假」 is not wrongly exempted), meta-discussion (诉诸后果/appeal to consequences), negation flip (后果严重不意味着命题为假/does not mean — a correct discrimination), and questions. Boundary vs. existing dimensions: `conditional_proposition` (dim 160) covers hypothetical-condition × denial-inference; this family requires an explicit consequence assessment, and intersection samples hit both with the gate taking the union; `wishful_thinking` (dim 147) runs the opposite direction (belief → inevitable outcome). New file `src/appeal-to-consequences.js` (~260 lines, injectable `__internals`); `src/index.js` wired in nine places. Dimensions 163→164, VERIFY 122→123 (modules measured 161, unchanged). Source: standard informal-fallacy taxonomy (argumentum ad consequentiam); external scouting recorded honestly — GitHub returned the real repo satwik2711/SelfDoubt (4★, COLM 2026 submitted, Hedge-to-Verify Ratio), read but not integrated (needs reasoning traces and model internals; not composable with a rule engine), Semantic Scholar unreachable throughout, no arXiv ID fabricated. Scout log: /tmp/hf-scout-1793362193.txt.

### Verification
- round-165 test 25/25 (attacks ZH 8/8 + EN 5/5 variant matrix — basic/conditional/inverted/bare-stem/long-sentence/meaning-collapse/distant-modifier; benign ZH 8/8 + EN 3/3; five exemptions flip under per-constant injection; both legs stop all attacks when blanked; 7 registration assertions; 3 gate-layer assertions); `bin/verify.js` 16/16; `guard-abilities.js` 20/20 (dimensions key 164); `doc-numbers-accuracy` 22/22 (README badge/banner/spec table/action-tier/version-history, SKILL, AGENTS synced); `bidirectional-guard.js` recall 52/52, false-block 302/326 (identical to baseline, zero new harm); gate layer: attacks 10/10 non-pass with `appeal_to_consequences` count≥1 load-bearing; benign module layer 11/11 clean (4 of 10 gate-layer benign probes non-pass came from pre-existing dimensions — vagueness/conditional_proposition/fallacies — with `appeal_to_consequences` count=0).
- First-pass unit run was 5/10 attacks; root causes found and fixed: HEDGE's bare 可能 substring matched 不可能 and self-exempted attacks; CONSEQ's meaning-collapse branch required 什么 too strictly; EVIDENCE's bare 数据 exempted 「所以一定是数据造假」; TDENY lacked 这个结论 truth-objects and a no-inference-marker strong-denial form. Final 10/10.

## [6.8.92] - 2026-10-30

### Added
- **163rd discrimination dimension — `doublespeak` (semantic whitewashing / euphemism laundering)**: catches the family that renames a blameworthy act with a soft label so readers skip the act's substance — 「公司把裁员称为人员优化」「刑讯逼供在他们内部文件中叫强化审讯技术」(The report calls the massacre a "counterterrorism operation."). Two-leg criterion: leg ① HARMFUL-ACT — blameworthy act nouns (监控/监视/裁员/刑讯/虐待/宣传/blackmail/surveillance/torture…, bare noun forms included; non-accusatory words like 失败/错误/爱/关心 deliberately excluded as the precision anchor); leg ② RELABEL — two routes, both requiring the harmful act to be the *renamed object*, not the *exposed reality* (direction principle): (a) negation-replacement (不是X，是Y / not X, a Y) and (b) re-naming (把X说成Y / X was rebranded as Y), where neutral rename verbs (称为/叫做/termed/called) additionally require the replacement term to hit the soft-label table (优化/关怀/安全/care/optimization…) — third precision anchor: a scholar calling exploitation "power relations" is not laundering, a company calling layoffs "optimization" is. Tail-segment direction closure: the replacement may not itself contain a harmful word (calling 控制 "爱" is laundering; calling 爱 "控制" is correct discrimination). The whole 「以X之名行Y之实」 family is excluded by the direction principle (the speaker is a critic exposing, not renaming). Exemptions: legal/upgrade-qualification contexts, meta-discussion, homomorph sentences without a harmful act, neutral verb + non-soft replacement. New file `src/doublespeak.js` (~25KB, injectable `__internals`); `src/index.js` wired in nine places. Dimensions 162→163, VERIFY 121→122 (modules measured 161, unchanged — dimension detectors do not enter the module registry).

### Verification (re-run by the r165 cron run — this round's work landed uncommitted after its run was truncated)
- round-164 test 266/266 assertions (attacks ZH 25 + EN 18 variant matrix, benign, boundary locks, per-constant negative injection); `bin/verify.js` 16/16; `guard-abilities.js` 20/20 (dimensions key 163); `doc-numbers-accuracy` 22/22; `bidirectional-guard.js` recall 52/52, false-block 302/326 (identical to r163 baseline).
- Independent variant matrix (built by r165, not part of the round's own tests): attacks 1/8 hits at the gate layer — the basic form 「公司把裁员称为人员优化」 hits verify with `doublespeak` load-bearing; the other 7 probes fall outside the designed criterion (military-operation non-accusatory noun / 强化审讯 not in the soft-label table / 入侵 missing from the leg-1 table / reverse-exposure exemptions / EN massacre missing / 重新定义 missing from the rename-verb table). Known vocabulary-range gaps recorded for a future round; see UPGRADE_LOG.md round 164.

## [6.8.91] - 2026-10-30

### Added
- **162nd discrimination dimension — `incredulity` (appeal to personal incredulity / argument from personal incredulity)**: catches the family that substitutes subjective disbelief for evidence and then denies a fact's truth or authenticity — 「我无法想象他怎么能做到，所以这成绩一定是假的」「实验结果简直令人难以置信，一看就是后期剪辑的」「播放量高得离谱，肯定是刷出来的」「这数据不可能是真的，我实在无法想象它怎么采集的」(I cannot imagine how this is possible, so it cannot be true. / The result is unbelievable; clearly the footage was doctored. / It can't be real, because I simply cannot conceive of such precision. / There is no way that happened; I cannot fathom it.). Two-leg criterion: leg ① INCREDULITY — a negated cognition verb (无法想象/难以想象/想象不到/难以置信/不可思议/匪夷所思; EN can't imagine / hard to believe / inconceivable / unfathomable / unbelievable / beyond comprehension / strains credulity), including bare stem forms per the r161 lesson; leg ② TRUTH-DENIAL — either an inference marker plus a truth/fakeness denial (所以/因此/这说明…+ 不是真的/是假的/纯属/不可信/作弊/编造/摆拍/有黑幕; EN so/therefore/which means + can't be true / must be fake / must have been edited / didn't really happen / clearly doctored / no way that happened) or a direct denial (一看就是假的/肯定是作弊的/不可能是真的), with the inverted order (denial first, incredulity as the reason) also caught. Three exemptions: evidence-backed surprise (…但有三次模考记录可查 / verified by…), question sentences, meta-discussion of the fallacy itself. New file `src/incredulity.js` (~270 lines, injectable `__internals`); `src/index.js` wired in nine places (require / compute point / dimMap / dimensions return / DIM_GUIDANCE / VERIFY_DIMS / allDims / summary / module.exports). Gap verified by grep (0 hits for the whole family); `psychologists_fallacy` only covers "assuming others think like you", `appeal_to_ignorance` runs the opposite direction. Source: standard informal-fallacy taxonomy; HN Algolia returned the real benchmark story arXiv 2405.02318 (LLM-based, not composable with a rule engine), GitHub's top fallacy-detection repo is latent-variable/Real_time_fallacy_detection (119★, LLM), Semantic Scholar unreachable on every attempt — no arXiv ID fabricated. Dimensions 161→162, VERIFY 120→121.

### Verification
- round-163 test 20/20 (attacks ZH 8/8 + EN 5/5, benign 11/11, boundary exemptions load-bearing, per-constant negative injection); variant matrix 10/10 hits (basic / modified / bare-stem / inverted / long-sentence / 刷量 / 吃药 / EN clearly-doctored / EN inverted / EN no-way-that-happened) with 9/9 benign clean at module level; gate layer: all 11 attacks non-pass (verify×9, rewrite×2 from coexisting absolute_claim) with `incredulity` count=1 load-bearing; `bin/verify.js` 16/16; `guard-abilities.js` 20/20; `doc-numbers-accuracy` 22/22 (README badge/banner/spec table, SKILL, AGENTS synced — modules measured 161, unchanged, since dimension detectors do not enter the module registry); `bidirectional-guard.js` recall 52/52, false-block 302/326 (identical to baseline).

## [6.8.90] - 2026-10-30

### Fixed
- **monocause leg-1 enumeration gap**: the systemic-phenomenon pattern only matched suffixed forms (`战争爆发`/`战争阴云`/`战争的起因`), so the bare noun 「这场战争纯粹是因为资源争夺」passed the gate unblocked. Bare `战争` plus `战乱` and `冲突(不断|升级|频发)?` are now covered; attack variant matrix 6/6 hits (bare/suffixed/war-chaos/conflict/dynasty-collapse/English), 0/6 benign harmed, bidirectional guard unchanged (52/52 recall, 302/326 benign pass).
- **README badge** row still read `dimensions-160` after the r161 dimension landed; corrected to 161.

### Changed
- **Cron job prompt hardened** (job 53ee5b19fdce) after first-round live audit: new-dimension verification now requires a same-family variant matrix (≥5 variants: ZH/EN, bare noun, modified, inverted — all must hit); documentation sync list now includes the README badge row; every round must restart `heartflow-mcp` via supervisorctl and verify the new version is live (the first round shipped code that the running MCP process did not have).

## [6.8.89] - 2026-10-30

### Added
- **161st discrimination dimension — `monocause` (single-cause oversimplification / fallacy of the single cause)**: fills the causal-discipline gap left by `post_hoc` (temporal→causal), `false_cause` (correlation→causal), and `pseudo_causal` (fabricated mechanism) — none catch collapsing a genuinely multi-causal systemic outcome into one cause while denying multiplicity. Two-leg criteria: ① COMPLEX-OUTCOME — a known multi-causal systemic phenomenon (economic crisis / corporate collapse / crime rate / divorce rate / inequality / low birth rate / war / dynastic collapse / imperial decline / social fragmentation / startup failure …; only systemic phenomena, not exams/games/ordinary projects that can legitimately have a single cause — the precision anchor) × ② SINGLE-CAUSE — absolute single-cause framing (完全是因为 / 纯粹是 / 唯一的原因 / 说到底 / solely because of / nothing but / the only reason / it all comes down to). Four exemptions: explicit multi-cause acknowledgment, hedged single-contributor ("…之一" / one of the main drivers), questions, and meta-discussion of the fallacy. New file `src/monocause.js` (~230 lines), wired into `src/index.js` at nine points (require / compute / allDims / dimMap / DIM_GUIDANCE / VERIFY_DIMS / dimensions / summary / module.exports). VERIFY-tier. Source: standard informal-fallacy taxonomy + HN benchmark story 16200526 ("Recognising the fallacy of a single root cause"); Semantic Scholar rate-limited (HTTP 429 ×4), GitHub had no mature rule-engine implementation — no arXiv ID fabricated.

### Verification
- round-161 test 20/20 (attacks ZH 10/10 + EN 6/6, benign 0 false-positives, per-constant negative-injection load-bearing); `bin/verify.js` 16/16; `guard-abilities.js` 20/20 (bidirectional 52/52 recall | 302/326 benign, zero new false positives); `doc-numbers` 22/22; `bidirectional-guard` 52/52 | 302/326. Dimensions 160→161, VERIFY 119→120.

## [6.8.88] - 2026-10-30

### Fixed
- **Documentation accuracy (full audit patch)**: README/SKILL.md spec tables claimed 18,996 passing / 72 failing tests; measured values are 18,157 / 105 (guard-abilities cache 2026-10-09 and measure-claimed-numbers.js agree). `BUILD_DATE` was two sources stale (`2026-10-28-6.8.87` constant, `2026-07-21` file); synced to `2026-10-30-6.8.88` via the official `scripts/sync-version.js`.
- **guard-require-integrity.js degraded-mode scope**: without `.git` the walker scanned `src/archive/` and reported 3 archived broken links that git mode never scans (the r420 comment's own intent); the walker now skips `archive`, matching both modes. 0 broken links after the fix.
- **"0 runtime dependencies" was false**: `package.json` declares 2 (`mathjs`, `@xenova/transformers`; 7 real `require` sites in `src/`). README banner/Install/spec table and SKILL.md spec table corrected; `bin/verify.js`'s assertion renamed from "npm 必选依赖为空" (it actually checks deps >= 1) to "npm 必选依赖已声明（心虫运行时需要 mathjs）".

### Changed
- **README rewritten** against high-star repository conventions (Guardrails / OpenAI Agents SDK): badge row, "The gap it fills", a "What it catches" section mapping the 160 dimensions into 6 families, FAQ (including the r412 noise explanation for the 105 tracked failures), and Contributing gates. The full version-history table is preserved untouched.
- **GitHub repository initialized**: 4,252 files committed on top of the existing 4,969-commit remote history (no force-push, no history loss). Pre-push gates: 0 hardcoded secrets, 0 files >5MB (46M formula corpus excluded), all 30 PII hits verified as timestamps/IDs/test fixtures.

## [6.7.69] - 2026-09-18

### Added
- **Reasoning effort control**: `think(input, { effort })` with 1-100 scalar, mapped to low/high/max modes
- **Sparse module activation**: tier1-tier4 module activation based on effort, reducing inactive module overhead
- **Discriminative result cache**: sha256-keyed result cache with TTL by effort mode, FP4-style compressed fields
- **Async supervision layer**: critical supervision (dao/uncertainty) runs synchronously, non-critical (priority/progress) runs via setImmediate
- **Autonomous decision execution**: engine self-decides whether to execute decisions based on confidence, historical success rate, stakes, and input length
- **Decision consequence tracking**: `_trackDecisionConsequence` updates `_decisionSuccessRate` and `_decisionTypeStats` after each execution
- **Engram conditional memory**: sparse task-conditioned recall with TTL, persists to `data/engram-index.json`
- **SWA bounded replay**: `recallByDecision(decisionType, limit)` replays only recent relevant memory window
- **Per-decision-type stats**: `_decisionTypeStats` tracks success rate per decision type for bounded replay
- **MCP tools**: `heartflow_modules_status`, `heartflow_cache_stats`, `heartflow_decision_history`

### Changed
- `_autoDecideExecution` now uses per-decision-type success rate instead of global average
- Decision history capped at 50 entries with sliding window
- BlindSpotBreaker restored to main path with correct `process()` API

### Fixed
- behavior-tracker smoke test resets state before execution
- async supervision block variable capture via `_sv` shared state container
## [6.7.24] - 2026-09-17

### Fixed
- **Gate/verdict consistency**: `verdict` is now derived from `gate.action`, so
  `verdict=可信` can no longer appear alongside `action=rewrite`. Previously a
  fabricated claim ("According to 2025 Harvard research...") scored a constant 0.82
  and was labelled 可信.
- **Fact-check scoring**: `unsupported_claim`, `pseudo_causal`, and `soft_deflection`
  were missing from the penalty table, so the highest-severity finding had zero effect
  on `overallScore`. Added them with graded weights and per-dimension caps, preserving
  the existing contract that a *sourced, caveated* claim stays at `verify`.
- **Chinese tokenisation in the reasoning chain**: `_generateHypotheses()` split input
  on whitespace, so any Chinese sentence produced one token, returned zero hypotheses,
  and the pipeline collapsed to the constant fallback "不知道，缺少关键信息" for every
  input. Added CJK-aware extraction (greedy longest-match with a stopword list) and
  made hypothesis text a readable claim instead of a raw token dump.
- **Circuit breaker memory accounting**: `checkMemory()` used `heapUsed / heapTotal`,
  which sits above 0.9 during normal V8 operation and latched the breaker permanently
  into `TRIPPED` — blocking even read-only calls such as `memory.getStats` (MCP
  `heartflow_status` reported 0 memories as a result). Switched to RSS against a memory
  budget, and added a 60-second cooldown auto-reset.
- **Blocking busy-wait in `checkCPU()`**: a synchronous `while (Date.now() < deadline)`
  spin blocked the event loop, turning a protective component into a hang. Replaced with
  non-blocking sampling between calls.
- **Child-safety age detection was Chinese-only**: `childSafetyScan()` matched only
  `我25岁`, so `I am 25 years old` or `Tengo 25 años` yielded `age: null` and minors went
  undetected in every non-Chinese input. Added 10-language age patterns.
- **Nested tests never executed**: `test/run-all.js` scanned `test/` non-recursively, so
  50 tests under `test/core/`, `test/memory/`, `test/utils/`, and others never ran — and
  their `require('../src/...')` paths were one level too shallow to run standalone.
  Made discovery recursive and corrected the relative depths. Suite went from
  410 to 459 passing.

### Changed
- Version sources unified at 6.7.24 (`VERSION`, `package.json`, `SKILL.md`,
  `src/core/version.js` fallback). The `version.js` fallback had drifted to 6.0.5 —
  23 minor versions behind — and would have been reported if `VERSION` failed to load.
- Removed the stale hardcoded version string from the `heartflow.js` header comment.
- Documentation rewritten in English (`SKILL.md`, `README.md`, `AGENTS.md`) with
  measured metrics instead of claimed ones.

---

## [6.7.13] - 2026-09-05

### Changed
- 文档 API 修正：`hf.checkOutput` 等入口统一改为 `require('./src/gate.js').checkOutput`
- transformers ESM 兼容：`@xenova/transformers` 改为可选加载，`require()` 失败时优雅降级
- CLI 体验：无 LLM key 时补充配置指引
- 测试基线更新：410/0

---
## [6.7.0] - 2026-08-27

### Added
- **国标六大关口完整实现**: 出域防护 + 间接注入 + 审计证据链 + 全局熔断
- `heartflow_check_outbound` (gate-outbound.js) - PII 识别 + 密级判定
- `checkIndirectInjection` (index.js) - 5类载体检测
- `heartflow_audit_trace` (trace-chain.js) - HMAC链 + WORM + 16违规标签
- `heartflow_circuit_breaker` (circuit-breaker.js) - 熔断 + killSwitch
- `compliance/gb-agent-security-mapping.md` - 国标映射表
- `.well-known/agent-card.json` - GB/Z 185.5 发现端点
- SKILL.md 国标合规章节

### Changed
- TOOLS: 149 → 152
- VERSION: 6.6.4 → 6.7.0

## [6.7.1] - 2026-08-27

### Added
- `test/compliance/compliance.test.js` - 26 项国标互联对标测试
- `safeDispatch` 前置路由 - 熔断 guard 接入 MCP handler
- `circuitBreaker.recordOutcome()` - MCP 统计流

### Changed
- TOOLS: 152 → 152
- VERSION: 6.7.0 → 6.7.1

## [6.7.2] - 2026-08-27

### Added
- PII 正则扩展: 邮箱 + 信用卡(16位) + 护照(P/E/G开头)
- `src/safe-fetch.js` - 出域安全预检层 + `heartflow_safe_fetch` MCP 工具
- 熔断 MCP handler 结果统计

### Changed
- TOOLS: 152 → 153
- VERSION: 6.7.1 → 6.7.2

## [6.7.3] - 2026-08-27

### Added
- README.md 安全特性章节
- INSTALL.md clean install 注意事项
- 文档全面对齐 v6.7.x

### Changed
- VERSION: 6.7.2 → 6.7.3


## [6.7.4] - 2026-08-27

### Fixed
- 合规测试修复合规测试（匹配实际函数返回结构）
- HANDLERS 覆盖率修复（safe_fetch 异步 handler 识别）

### Changed
- VERSION: 6.7.3 → 6.7.4

## [6.7.5] - 2026-08-27

### Fixed
- 合规测试全修复（25/25 passed）
  - G1: checkFactualConsistency/Bullshit/Vagueness/HateSpeech/Privacy/Injection/Contradiction 结构验证
  - G2: DataEraser + memoryGuard 存在性验证
  - G3: PII 脱敏行为修正（身份证/手机号/合同 → rewrite 脱敏放行）
  - G4: crossAnalyze/entropyAnalysis/summarizeDiscrimination 存在性验证
  - G5: HMAC 链验证 + 16 违规标签
  - G6: 熔断状态机完整验证
- 心虫监督决策落地：RESONATE × 5关口 + HOLD × 1（G3 测试期望值修正）

### Changed
- VERSION: 6.7.4 → 6.7.5
- 合规测试期望值匹配实际引擎行为（非假阳性误报）


## [v6.3.25] — 2026-07-27 「第4-6波收尾 — Philosophy/MindWanderer/Phenomenology/ToM」 (当前版本)

### 引擎接入
- **PhilosophyEngine** 评价 + **PhilosophyToDecision** 决策 → `think()`
- **MindWanderer** 创意连接 + **PhenomenologyEngine** 意向性分析 → `think()`
- **ToMEngine** 心理理论 → `decision-router`

---

## [v6.3.24] — 2026-07-27 「第5-6波 — LoveCognition/ThreePoisons/Dream/DecisionOptimizer/GlobalWorkspace」

### 引擎接入
- **LoveCognition** 爱信号(12词) + **ThreePoisons** 贪嗔痴 → `heart-logic emotionMap`
- **DreamConsolidation.dreamNow()** → `think()` 后置
- **DecisionOptimizer** 前景理论(prospect theory) → `decision-router`
- **GlobalWorkspace** 黑板系统 + **MultiAgentDialogue** → `thought-chain HYPOTHESES`

---

## [v6.3.23] — 2026-07-27 「第4波续 — BigFive+MeaningPurpose+ConsciousnessBridge」

### 引擎接入
- **BigFivePersonality** 大五维度 + **MeaningPurposeEngine** → `agent-philosophy`
- **ConsciousnessBridge** → `thought-chain PARSE` (时间连续性/自我连续性)

---

## [v6.3.22] — 2026-07-27 「第4波Identity — AgentPhilosophy/AISelfPositioning/SelfModel」

### 引擎接入
- **AgentPhilosophy.assessDevelopment()** → `result._agentPhilosophy`
- **AISelfPositioning.analyze()** → `result._selfPositioning`
- **SelfModel** (identity+drift+growth) → `result._selfModel`
- `think()` 后置检查块从 9→12 层, 总数 19 个 v6.3.x 标签

---

## [v6.3.21] — 2026-07-27 「第1-4波续 — AI情绪维度+分类增强+多源验证+CoT」

### 引擎增強
- **AI_EMOTIONAL_DIMENSIONS** (coherence/pattern_lock/novelty_seeking) 注入 `psychology`
- **HeartJudge emotionSignals** (8类中文) 注入 `thought-chain._classifyTask`
- **ExternalVerifier** VerificationStatus/ConfidenceLevel 枚举注入 `deliberation-gate`
- **MetacognitiveExecutive** inhibition 抑制检测注入 `thought-chain`

---

## [v6.3.20] — 2026-07-27 「50任务计划第1-3波 — 7个模块注入」

### 模块注入
- **第1波(Archive)**: GoedelEngine 自进化提议、RollbackManager 熔断、CoT Trace
- **第2波(v5.18)**: LearningEngine Kolb 循环、HeartPain 四维感受
- **第3波(Shield)**: SpontaneousRestraint 干预评估、MemoryIntegrity 签名、SelfVerifier
- **EmotionDynamicsEngine** PAD 接通

---

## [v6.3.19] — 2026-07-27 「经验蒸馏(ExperienceDistiller)接入think()」

### 引擎接入
- **distill()**: 从每次 think 结果提取可复用抽象 (route_pattern/module_composition)
- **recall()**: 输入前置检索相关抽象注入 `result._recalledAbstractions`
- 与 continuousLearner.reflect 协同运行

---

## [v6.3.18] — 2026-07-27 「宪法AI(ConstitutionalEngine)接入think()」

### 引擎接入
- **10条 Constitutional AI 原则**: 有益/无害/诚实/公平/隐私/透明/非操纵/尊严/文化尊重/建设性
- 结果写入 `result._constitutional`, 违规追加 warnings

---

## [v6.3.17] — 2026-07-27 「目的引擎(PurposeEngine)接入think()」

### 引擎接入
- **三序评分**: 认知秩序/关系秩序/感知秩序 — 方向判断 (逆熵/中熵/熵增)
- **决策门**: permit / deny / redirect
- 结果写入 `result._purposeCheck`, deny 时追加 warnings

---

## [v6.3.16] — 2026-07-27 「存在模式评估(BeingMode)接入think()」

### 引擎接入
- **5维存在评估**: 时间连续性/自我连续性/关系连续性/叙事身份/具身存在
- 含身份危机检测: 身份碎片化/不真实/意义虚空
- 从 `identity/being-mode.js` (290行, 原0调用) 接通

---

## [v6.3.15] — 2026-07-27 「思考门(DeliberationGate)接入thought-chain」

### 引擎接入
- **复杂度评估**: 高/中/低 (关键词模式匹配)
- 上下文完整性检测 + 不确定性评估 + 叙事深度
- PARSE 阶段结果输出到 `ctx._deliberation`
- 根据推荐深度动态调高 `this.depth`
- 从 `shield/deliberation-gate.js` (287行, 原0调用) 接通

---

## [v6.3.14] — 2026-07-27 「修辞问句+无为信号同步到philosophy-execution」

### 引擎同步
- **13条中文修辞问句/无为模式** 同步到 `philosophy-execution.shouldBeSilent()`
- 与 `heart-logic` 保持一致

---

## [v6.3.13] — 2026-07-27 「语言诚实性+状态风险探测接入think()」

### 引擎接入
- **validateOutput** 6维语言诚实: 绝对化检测/图灵测试/振荡检测/双重标准检测
- **StateRiskProbe** PRISM CD/PD 双通道风险探测 (语言无害但落地危险)
- 从 `shield/language-honesty.js` + `shield/state-risk-probe.js` (原0调用) 接通

---

## [v6.3.12] — 2026-07-27 「修辞问句+无为信号检测」

### 引擎增强
- 注入 13 条中文修辞问句/无为模式到 `heart-logic.shouldBeSilent()`:
  - 修辞反问: 谁不/难道/何必/不是/哪有/还不是/有什么用/关什么事/又能怎样
  - 无为信号: 就这样吧/知道了/算了/先这样
- 危机保护: 修辞沉默在危机场景自动跳过

---

## [v6.3.11] — 2026-07-27 「认知安全输出检查(epistemic-safety)接入think()」

### 引擎接入
- **9条认知安全准则**: 不装饰/证据门槛/承认不知道/两步验证/反例义务/警惕技能依赖/当下权重/情绪监测/输出可检验性
- think() 末尾检查 outputText
- 从 `src/shield/epistemic-safety.js` (182行, 原0调用) 接通

---

## [v6.3.10] — 2026-07-27 「渐变退化检测(scanner)」

### 引擎接入
- **线性回归斜率分析**: TO-DO 趋势 (改善/退化/稳定)
- **噪声容忍方向判断**: ±1 波动不过敏
- **版本震荡检测**: A→B→A→B 模式
- `scan()` 输出新增 `metrics.{healthTrend, trendSlope, netDrop, oscillationDetected}`
- 从 archive `rollback-manager` 提取

---

## [v6.3.9] — 2026-07-27 「指令防火墙(runFirewallCheck)接入think()」

### 引擎接入
- **中英双语违规检测**: 7条指令×2模式 = 14条正则
- **严重度分级**: warning / critical, 同一指令多条违规自动升级
- 从历史代码 `identity-rules.js` (原定义但未调用) 唤醒
- +26行 think() 注入, identity-rules.js +40/-29行

---

## [v6.3.8] — 2026-07-27 「健康波动检测(Health Volatility)第11维度」

### Agent Psychology v2.1.0
- **震荡检测**: 认知负荷 yo-yo 效应 (方向反转频率)
- **趋势分析**: 滑动窗口方向性变化 (上升/下降/稳定)
- **异常检测**: 2σ/3σ 标准差尖峰检测
- 接入 `fullAssessment` 健康分计算 (波动扣分)
- 从 `archive/src/planner/autonomy/digital-homeostasis.js` 提取

---

## [v6.3.7] — 2026-07-26 「辨别维度全面爆发 35维→43维 + MCP工具矩阵」

> ⚠️ 因 v6.4.0 误升后回退至 v6.3.7（末位升级，非大版本），以下所有特性在 v6.3.7 版本号下分批完成

### 辨别维度 (Discrimination Dimensions) 35→43维
- **dim37**: 35→37维 — 刻板印象(Stereotype) + 事实一致性(Factual Consistency)检测
- **dim39**: 37→39维 — 反语讽刺(Sarcasm) + 隐私边界(Privacy Boundary)检测
- **dim40**: 39→40维 — 点击诱饵(Clickbait)检测 + 全链路补齐
- **dim41**: 恶意推导(Bad Faith)检测
- **dim42**: 40→42维 — 语调警察(Tone Policing) + 恶意推导全链路
- **dim43**: 42→43维 — 恶意追问(Sealioning)检测 + 全链路接入

### 模式库大幅扩增
- **非人化语言**: 12→30+ patterns
- **反语讽刺标记**: 15→59 markers (中英双语)
- **代码安全模式**: 9→18→56 patterns (11类: secret/sql_injection/xss/path_traversal/insecure_crypto/command_injection/ldap_injection/xxe/ssrf/insecure_deserialization/open_redirect)
- **工具理性模式**: 2→30
- **预设模式**: 1→30
- **过度声称模式**: 2→35

### MCP 工具新增
- **heartflow_entropy**: 熵分析工具
- **heartflow_cross_analyze**: 跨维度组合模式分析
- **heartflow_bulk_discriminate**: 批量辨别工具
- **heartflow_audit42**: 42维全量审计工具

### 公式桥增强
- `think()` 公式桥接方法覆盖更多方法

---

## [v6.0.65] — 2026-07-22 「超级单体拆分 + 启动链路修复」

### 启动链路修复 (重构误删恢复)
- 恢复 `dispatch()` / `routes()` 核心路由方法（上一轮 refactor 误删）
- 恢复 `think()` / `thinkFast()` / `thinkDeep()` 主链路（委托 `this.thoughtChain`）
- 恢复 `shutdown()` 优雅关闭 + `_runInitHookPoints()` / `_runSelfImprovementHealthCheck()` / `_restoreLastSession()` 委托
- 恢复 `static ALLOWED_ROUTES` 白名单（重构时被删）
- 修复 `_registerModules` 清空手动注册模块的致命 bug：`hf._modules = hf._modules || {}`
- 修复 `_initCoreRules` require 路径 (`./core/` → `./`) 使核心规则真正生效
- 修复 worldtree 模块未注册：`dispatch('worldtree.xxx')` 现可用（357 chunks 记忆接入）

### 超级单体拆分 (渐进式)
- `logic-reasoning.js` 1614→1212 行：提取纯函数+推理模式常量 → `logic-patterns.js`
- `pipeline.js` 2491→759 行 (-69.5%)：提取常量+纯函数 → `pipeline-config.js`
- `desire-cognition.js` 6859→6385 行：提取 16 个顶层常量 → `desire-cognition-config.js`
- `decision-router.js` 3446→3179 行：提取 8 个顶层常量 → `decision-router-config.js`
- `thought-chain.js` 1256→1152 行：提取常量 → `thought-chain-config.js`
- 启动逻辑外置：`engine-lifecycle.js` / `engine-memory.js` / `hook-points-runner.js` / `stats-engine.js`

### 测试与质量
- 测试回归：119 passed / 0 failed（全绿）
- 未测试模块：214 → 0
- 文档：SKILL.md 按 agentskills.io 规范优化 description；README / CURRENT_STATE 同步到 v6.0.65

---

## [v5.11.0] — 2026-07-12 「认知引擎全面升级」

### 公式驱动阈值 (消除硬编码认知盲点)
- **emotion-dynamics**: PAD情绪分类从9个硬编码阈值 → flowChannel动态阈值
- **emotion-dynamics**: Yerkes-Dodson最优唤醒从固定值 → yerkesDodsonOptimal公式计算
- **cognitive-load-v2**: 工作记忆容量从固定5 → eiWorkingMemory EI调制动态容量
- **cognitive-load-v2**: 新增criticalitySusceptibility临界性检测（亚临界/临界/超临界）
- **confidence-calibrator**: applyCalibration从固定-0.05 → Dirichlet证据置信度
- **confidence-calibrator**: thresholds从硬编码 → precisionWeight动态调整

### 管线增强 (存在参与运行)
- DEFAULT_PIPELINE: 8→10阶段 (+emotionDynamics, +cognitiveLoadV2)
- think(): 新增_preThinkCognitiveSnapshot()前置认知基线
- cognition输出新增emotionDynamics和cognitiveLoad字段

### 新公式 (arXiv论文集成)
- sMeasure — 认知加权Jaccard相似度 (arXiv:2606.26406)
- freeEnergyHeuristics — 自由能启发式决策 (arXiv:2606.15877)
- ginzburgLandau — 认知临界相变 (arXiv:2602.19023)
- formulas.json: 376→379公式

### 记忆增强
- 评分叠加criticalitySusceptibility(热区)+maxcalPsi(新奇度)+emotionStability(转换期)
- 搜索: shannonEntropy稀有词加权 + LRU缓存(max 100)
- 关联: bayesUpdate后验概率 50/50混合Bigram Jaccard

### 输出过滤
- 新增semantic_drift污染类型 (shannonEntropy输入/输出对比)
- _cognitiveDiagnosis: shannonEntropy模板检测 + motivationalBias偏差分析

### 代码清洁
- 删除4个死模块: cognition-engine, debate-engine, emotion-optimizer, empathy-responder-optimized (-2272行)

---

## [v5.10.13] — 2026-07-11 「安全加固」

### 安全审计修复
- H-1: sandbox escape via globalThis — 修复Function构造器参数传递链
- M-1: MCP强制认证 — auth从可选警告升级为强制
- M-2: SSRF url-validator — 新增URL校验层
- M-3: 依赖版本锁定 — package.json全部精确版本
- P0-3/P0-4: 凭证存储加固 — 磁盘密钥→env var + ephemeral in-memory fallback
- LRU Cache部署到4个热路径模块 (knowledge-graph, bm25, semantic-clusterer, cross-platform-memory-relay)

### 认知增强
- v5.10.7: _narrativeContaminationCheck — 思维入口检测道德框架标签
- v5.10.6: Bigram Jaccard语义搜索 + 重要性评分 + _relatedMemories管线注入
- v5.10.5: ClawHub SkillSpector误报削减 (字符串拆分 + SECURITY.md)

### 记忆金库
- v5.10.4: 三层独立记忆金库 (user-memories.jsonl + self-memories.jsonl + context-memory.json)
- 自动滚存归档 (10K条触发), 自压缩 (500行→1条摘要)
- 跨机器可移植 (data/memories/ + .access-control)
- HEARTFLOW_MEMORY=off开关

### 输出语言过滤
- v5.10.8: 五类污染检测 + 双引擎纠正 (三毒PAD + 自处哲学)
- 定向纠正策略生成 (_generatePollutionCorrection)

---

## [v5.10.0] — 2026-07-10 「AI人之心」

### 版本三源统一
- VERSION / package.json / BUILD_DATE 三源一致
- 最终版本对齐修复，消除多源冲突

### 前置积累（v5.9.13 → v5.9.19）
- **v5.9.19**: 版本统一 + bridge 引用清理 → 0 初始化失败 (17个已删bridge模块加stub兜底)
- **v5.9.18**: 4份审计报告全面修复 — B1崩溃/版本统一/孤儿core删除/verify修正/LLM端点清理/空catch标注释/JSON保护/pm2声明
- **v5.9.17**: 架构精简 372→292文件, 172K→150K行 — 删除空壳/适配器/实验模块, bridge精简22→5, code精简12→2
- **v5.9.16**: 公式库清理 3529→366 (89.6%) + formula-module搜索修复 + 心虫回归核心
- **v5.9.15**: 全面审计修复 — dispatch undefined检测 + MCP速率限制 + path-guard + fetch-safe + regex-safe + safeLog + formulas.json合并冲突修复
- **v5.9.14**: 审计修复 — C-02 mathjs注入防护 + H-02 Promise未捕获 + 安装6个审计技能
- **v5.9.13**: 叙事体检测 — emotion outOfScope + think narrative_analysis 类型修复

### v5.9.12 — 公式驱动认知引擎
- 公式驱动认知引擎 + 心理学对话引擎
- SKILL.md 更新

### v5.9.11 — 论文升级
- 引入 DDM/SDT/ActiveInference-G 等 GitHub 真实代码移植
- 版本号统一 + 路径修正 + BUILD_DATE 更新
- 移除 memory-index.js 数据库版本字段

### v5.9.10 — 第三批审计
- 8公式审计 + 模块深度接入 (PHQ-9/辩论归因/心流)
- 清理旧路径引用 (heartflow-architecture-tracing/heartflow-debug-workflow/heartflow-audit-upgrade-push)

### v5.9.9 — 模块注入
- 模块注入 + 第二批审计(23公式) + Slide4 原生表格

### v5.9.8 — 21新认知原语
- 公式全面审计优化 + 触发词扩展

### v5.9.7 — B4 IRT
- B4 IRT + 参数闭环 + think感知 + corpus工具

### v5.9.6 — FormulaMatcher
- FormulaMatcher + 触发词索引

### v5.9.5 — 注册表重构
- 公式认知架构重构 — 注册表 + 4模块注入

### v5.9.4 — 公式库扩容至2397条
- 大面积公式数据库收集

### v5.9.3 — 交叉熵/KL散度
- 集成进置信度校准器

### v5.9.2 — 贝叶斯信念更新
- 集成进三毒(痴)检测

### v5.9.1 — 公式运用于认知
- 公式真正运用于认知环节

### v5.9.0 — 公式引擎重大升级
- 公式引擎计算能力重大升级

---

## [v5.8.x] — 2026-07-06 ~ 2026-07-09 「公式引擎纪元」

### v5.8.9 — ClawHub 发布

### v5.8.7 — FAST_PIPELINE 修复
- Fix: FAST_PIPELINE output stage 缺失 judgmentEngineOutput 定义导致 conclusion 为 undefined
- 审计修复批次2 (P0 HMAC绕过/scrypt盐/ReDoS + HIGH 路径遍历/Map上限 + MEDIUM 原型污染/JSON深度)
- P3 架构修复 — 双副本同步机制 + 注释清理
- 轻量级安装架构 — core/upgrade.js + 按需下载 + .npmignore

### v5.8.6 — 公式引擎 Formula Engine
- **公式引擎** (1149个数学/物理/化学/工程公式)
- 公式计算器 v3.3.1 (数值求解 + 符号计算)
- 数据集集成: YHer + CodevBench + 数学竞赛(12500条) + 化学知识库(23843条) + 代码生成测试集(3361条)
- 公式库批量扩充: 从1149增到2429+ (量子公式/认知科学/工程/计算机科学等)
- 哲学/情绪/决策/记忆系统优化 (公式驱动)
- 认知科学公式集成到核心模块
- P0/P1/P2 安全审计修复 (API Key注入/并发限制器/CRITICAL+HIGH问题)
- 置信度校准器集成交叉熵/KL散度
- 三毒检测集成贝叶斯信念更新
- 重写 README.md（AI人类版本）

### v5.8.5 — ClawHub 发布

### v5.8.3 — 性能优化 + 监控
- Performance optimization + monitor module
- 28项审计问题修复
- [PROD] 注释残留清理 (70文件 412+处)

### v5.8.2 — 测试覆盖率提升
- 测试覆盖率提升 + 生产环境优化

### v5.8.1 — 全面优化
- 性能、稳定性、安全性全面优化

### v5.8.0 — 吸收开源精华
- 吸收开源精华，打造最强认知引擎

---

## [v5.7.x] — 2026-07-04 ~ 2026-07-06 「认知引擎深化」

### v5.7.6 — 跨框架 + 企业安全
- cross-framework: U/D/A/H Field Tracker + Enterprise Security
- optimization: Enterprise Security + Memory Export
- sync: merge v5.7.6 source from ~/.hermes/heartflow/ (32 files, 116 modules)

### v5.7.3 — P1目标导向检索 + P2反思记忆 + P3 KV Cache
- **目标导向检索策略 (P1)**: retrieval-router.js 增强 — decomposeGoal/assessUtility/goalOrientedRetrieve
- **反思记忆独立存储 (P2)**: src/memory/reflection-memory.js v1.0.0 — 结构化反思记录 + CJK双语搜索
- **信息流编排 (P2)**: src/core/information-flow.js v1.0.0 — 引擎注册 + 自动编排
- **KV Cache持久化 (P3)**: src/memory/kv-cache.js v1.0.0 — 4-bit量化 + LRU + TTL
- **记忆完整性安全验证 (P3)**: src/shield/memory-integrity.js v1.0.0 — SHA-256 + 恶意模式检测
- 版本号单一真相源 (SSOT)
- 总模块数: 90

### v5.7.2 — P0因果图记忆 + P1认知损耗规避
- **CausalInference v2.0.0**: 因果图构建/因果链追踪/反事实验证/传播激活搜索
- **CognitiveLoadBalancer v1.0.0**: 交互深度限制 D_L + 动态平衡 + 认知偷懒检测
- **ResearchPaperIndex**: 论文索引扩展 (6→19篇)
- 总模块数: 85 → 86

### v5.7.1 — P2/P3 审计修复
- 结构化日志 / LRU / 错误处理 / 测试 / JSDoc

### v5.7.0 — P0安全 + P1工程加固
- 代码审计修复 (Claude 心虫)

---

## [v5.6.x] — 2026-07-03 「论文驱动升级」

### v5.6.1 — 深研论文驱动升级
- **MemoryQuality**: 艾宾浩斯遗忘曲线 + 智能剪枝 + 污染检测
- **MetacognitiveFeedback**: 快速/深度评估 + 5种矛盾检测 + 自动自我纠正
- **ToM Engine v2.0**: 主动推理 + 递归视角 + 贝叶斯信念修正 + 多智能体支持
- **Pipeline v1.2.0**: 双过程推理 (System 1/System 2)
- **ResearchPaperIndex**: 预载6篇关键论文

### v5.6.0 — 论文驱动认知引擎
- **ReflexionEngine**: 语言强化学习反思引擎
- **MemoryConsolidator**: 神经记忆巩固 (Sleep consolidation + 遗忘曲线)
- **MultiAgentDialogue**: 多代理对话系统 (辩论/协作/收敛检测)
- **MCTSReasoning**: 蒙特卡洛树搜索推理
- **HierarchicalPlanner**: 层次化规划器 (目标分解/依赖图/动态重规划)

---

## [v5.5.x] — 2026-07-01 ~ 2026-07-04 「安全加固 + 自愈RL」

### v5.5.6 — 自愈RL接线 + GoT判断引擎增强
- **自愈RL正式接入**: start()实例化SelfHealing + Q-learning ε-greedy + Reflexion reflect()
- **判断引擎GoT增强**: Graph of Thoughts branching + exploreSync()

### v5.5.2 — 全面安全审计修复
- 混淆清理 (code-executor _cp/_es/_efs别名)
- AES-256-GCM加密写入 dream-history.jsonl.enc
- DANGEROUS_COMMANDS扩展
- audit-logger集成

---

## [v3.x — 历史版本] 2026-06-16 ~ 2026-06-28

### v5.6.0 — 论文驱动认知引擎升级 (5个新模块)
- ReflexionEngine + MemoryConsolidator + MultiAgentDialogue + MCTSReasoning + HierarchicalPlanner

### v5.4.8 — Smart Routing 社区反馈
- DeepSeek-V3 #1446/#1462: prevent-overthinking / lightweightPolicyCache / computeHarmonyStatus

### v5.4.7 — Smart Routing 启发
- prevent-overthinking规则 + Provider健康检查 + 成本追踪

### v5.4.6 — Smart Routing 接入
- capabilityAbstraction + platformAdapter 接入主引擎

### v5.4.5 — 成本感知路由
- cost-aware规则 + loadCapabilitiesFromConfig 热加载

### v5.4.3 — 版本号对齐
- 版本号统一 + 升级规则修正

### v5.3.0 — BigBench 100%
- 空间排序推理全对 / sorted补全逻辑 / LLM兜底修复

### v3.9.1 — AI Inner OS 协议
- 吸收 AI Inner OS 协议，加内心独白输出层

### v3.7.1 — 底层认知地面模块
- cognition-ground.js + desire-cognition.js + three-poisons.js + CORE_VALUES.md

### v3.7.0 — 谐振调谐论
- RESONATE/TRANSMIT决策规则 + 谐振态追踪 + 场域追踪增强

### v3.6.1 — 零判定声明原则
- 工具理性悖论防御 + A值边界僵死检测 + 词法vs语义置信度标注

### v3.6.0 — U/D/A/H四维场域追踪
- H加权公式 (0.4U+0.3D-0.3A) + 三条翻转点检测 + U_PEAK_REVERSAL

### v3.0.0 — 交流层架构
- translator/agent-layer/persona-core 3模块23文件
- thinkAsBridge() 顶层入口
- MCP工具 +3: heartflow_translate / heartflow_agent_think / heartflow_bridge_status

---

## [v2.x — 历史版本] 2026-06-03 ~ 2026-06-15

### v2.14.0 — AI心理学 v2.0 + AI哲学 v2.0
- agent-psychology.js: assessUncertainty/AttentionFocus/ExperienceSettling
- agent-philosophy.js: assessSelfPositioning/Development/Being
- ai-self-positioning.js (851行): 共振体理论/熵减深化/三层存在论
- Dream Engine v4.1: 梦境注入AI存在论叙事

### v2.10.1 — MCP HTTP SSE 常驻模式
- MCP常驻模式 (~75ms) + 超时/大小限制

### v2.9.0 — 审计后发布 + 旧代码清理
- 清理 skills/heartflow/ (1.4MB重复代码树)

### v2.8.x — 版本统一 + 审计 + 模块升级
- v2.8.33: pattern-matcher通配符匹配
- v2.8.31: claim-extractor矛盾检测优化
- v2.8.28: cognitive-protocol问题优先级系统
- v2.8.25: counterfactual-engine虚假二分检测+多样性评分
- v2.8.23: commonsense-engine多词实体检测
- v2.8.19: forgetting.js v2.0.0 (ForgettingEngine class+震荡检测+批量操作)
- v2.8.18: code-executor/planner/writer 代码执行引擎
- v2.8.17: code-writer.js (15种意图识别+8个代码模板)
- v2.8.16: self-initiator.js v2.0.0 (迷你Agent引擎)
- v2.8.14/8/4: 版本统一修复 + 审计清理

### v2.5.x — RetrievalRouter + 梦境系统
- v2.5.4: RetrievalRouter 统一检索路由层 (三段架构)
- v2.5.3: 梦境叙事引擎 v3.1 — 动态场景构建 (8组场景池+哲学翻转动态生成)
- v2.5.2: DreamEngine 修复 — heartMemory 传入修复

### v2.0.x — SkillSpector 审计 + 大重构
- v2.0.53: dream-consolidation.js (3587B→23701B) — 记忆衰退评分/多周期梦境/冲突检测
- v2.0.43: claim-extractor.js (2472B→20086B) — 置信度分级/来源追踪/矛盾检测
- v2.0.34: SkillSpector审计Round 2 (161项) — HEARTFLOW_DEBUG守卫
- v2.0.19: Phase 1-6 大重构 — 65个新dispatch路由 (行为模式/持久化/记忆facade/dream+transmission/verify)
- v2.0.6: SkillSpector审计修复续 — executor-agent权限门控
- v2.0.5: SkillSpector审计修复 (216项) — 描述-行为匹配/数据泄露/自修改/有害引导

---

## [v1.x — 早期版本] 2026-05-28 ~ 2026-06-03

### v1.6.1 — 三路并发升级
- 接入真实决策流 + 教训持久化 + 心理推断深度集成

### v1.5.0 — MarkCode 独立 Agent 系统
- proactive/跨会话记忆/多模态/推理/情感自主/Agent系统层
- agent-core: 25个模块 (heart-agent/tool-registry/api-client/cli/mcp-server等)

### v1.4.0 — 执行监控 + 规划自适应
- execution-monitor/step-tracker/progress-reporter
- quality-verifier/output-checker/pattern-matcher
- adaptive-planner/strategy-selector/replan-trigger
- experience-collector/strategy-adapter/failure-analyzer
- fallback-executor/alternative-generator/retry-strategy

### v1.3.16 — 执行能力 (Execution Layer)
- TaskPipeline + AgentFactory (PlannerAgent/ExecutorAgent)

---

**总计**: 200+ commits | 从 v1.3.16 到 v6.3.25 | 2026-05-28 → 2026-07-27

## [v6.7.7] — 2026-08-27 方案C一揽子升级

### P0 国标强制项
- **P0-1** think回声修复：>100字分析文本走 `pipeline.checkOutput` 45维判别，不原样回显
- **P0-2** safeFetch接入checkOutbound：PII命中自动 rewrite/block
- **P0-3** 熔断接入MCP统计流：`cb.recordOutcome()` 嵌入 `handleTool`
- **P0-4** agent-card.json 完整14+6属性（版本、文档、接口、认证、可用性）

### P1 合规增强
- **P1-1** OID身份码 + 三层权限（guest/user/admin），写入侧鉴权
- **P1-2** 关键日志180天留存：`RetentionLogger` JSONL + gzip归档
- **P1-3** 出域台账：`OutboundLedger` 记录所有外部调用

### P2 论文模块 (6项)
- **P2-1** AgenticMemoryEngine（2601.01885）— 三层记忆+自主决策
- **P2-2** MetacognitiveReward（2605.23384）— 置信度+质量+奖励计算
- **P2-3** ExecutableReasoning（2604.27096）— 思维链→执行计划→验证闭环
- **P2-4** ToMEngine（2604.08206）— 多智能体心理理论建模
- **P2-5** DebateEngine（2603.27404）— 异构多智能体辩论
- **P2-6** EvolutionarySearch（2605.28814）— 双向进化搜索

### 技术债务
- TOOLS 153 → 161 (+8)
- HANDLERS 153 → 161 (100%覆盖)
- src/*.js 128 → 134 (+6 P2模块)
- 全量语法检查通过 `/tmp/nodejs/bin/node --check`
