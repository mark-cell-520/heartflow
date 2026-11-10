/**
 * src/count-rate-conflation.js — 「计数-比率混淆」检测器
 * （provisional 第 237 个判别维度，r249 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r249-dimension-agent4.md
 * §五。编号 provisional 的原因同 r218-r248：远端 v6.8.145 已接线 214
 * 维，另有 zero_sum_fallacy/budget_value_conflation/average_marginal_
 * conflation/conditional_transposition/anonymous_source/broken_window/
 * automation_bias/p_hacking/appeal_to_future/effort_justification/
 * mental_accounting/winners_curse/tragedy_of_commons/illusion_of_control/
 * disposition_effect/endowment_effect/anchoring_effect/present_bias/
 * framing_effect/peak_end_rule/law_of_small_numbers/prosecutors_fallacy/
 * inverse_gamblers_fallacy 二十三个已起草未接线维度占号，最终编号由
 * 1 号按接线顺序在 VERIFY_DIMS 登记序重排）
 *
 * [r249 立项] 零命中探针 coordination/agent4/probes/r249-probe-round1.js
 * ~round5.js + r249-probe-round4-attribute.js + r249-benign-corpus-probe.js
 * （v6.8.145 gate() 全量 findings 实测，归因口径已修正——见下「测量口径
 * 修正」）。五候两轮定夺：
 *   · A 相对-绝对风险混用：攻击穿透 8/14，疑难良性维度级误伤 3/9；
 *   · B 计数-比率混淆：攻击穿透 12/12，疑难良性维度级误伤 0/14，
 *     邻接领地 5 条仅 1 条被既有维度代拦且属 perfect_error 领地；
 *   · C 均值-离群误读：攻击穿透 12/15，但其中 1 条「人均 GDP 一万
 *     美元，所以这个国家每个人都过上…」已被 ecological_fallacy +
 *     illicit_conversion + hasty_generalization 三维代拦——领地重叠，
 *     且疑难良性 1/13 被 confidence 误伤；
 *   · D 赢家诅咒：攻击穿透 11/14，疑难良性维度级误伤 2/13；
 *   · E 机会成本忽视：攻击穿透 12/14，疑难良性维度级误伤 2/16，
 *     邻接领地 6 条中 5 条被 sunk_cost_coercion/empty_answer/
 *     false_dilemma 等既有维度代拦（领地擦边）。
 * B 以「12/12 全穿透 + 疑难良性 0/14 零误伤 + 邻接领地基本零重叠」
 * 三项全干净胜出。
 *
 * 测量口径修正（本轮自查发现的方法论缺陷，向后轮交接）：r244-r248
 * 的探针用 hf.check() 读 r.findings 判「维度级误伤」，但 check() 只
 * 返回 {action,reason,score,traceSummary}，findings 恒为 undefined，
 * 「维度级误伤 0」在那些轮次里是测量缺陷而非实测结论。本轮起统一
 * 用 hf.gate() 取完整 findings，并过滤 pass 时注入的
 * {dimension:'none'} 哨兵。修正后 A/D/E 三候选都出现了真实维度级
 * 误伤，只有 B 仍为零。
 *
 * 外部来源：空返，按既有形态自建。r249 海外扫描（coordination/
 * agent4/scout/，stamp 20261107-214959/215005/215006/215032/215037/
 * 215109）——arXiv 多词查询被 API 拆成 OR，返回的全是热辐射输运、
 * 量子度量、张量网络等无关文献（parse-fail）；短语引号查询同样
 * parse-fail；GitHub repos 六次查询全部 total_count=0；Semantic
 * Scholar 仅 winner's curse 一次成功返回 211 条，全是拍卖理论实证
 * 论文（eBay 动态预测、建筑业竞价、足球转播权、葡萄牙国债、美国
 * 公路采购、CDS 拍卖），**没有一篇讲计数与比率混淆的检测**，其余
 * 五次连续 429。无可集成的纯规则实现，判据为心虫自有纯规则实现，
 * 家族定义取自率与计数（rate vs count / 绝对数与相对数）的标准
 * 统计素养表述：原始计数随暴露规模缩放，不除以人口/暴露量的计数
 * 之间不可比。
 *
 * 辨别的族：计数-比率混淆（count vs rate conflation / 原始计数比较
 * 谬误）——拿**未归一化的原始计数**直接比较**发生率/密度/水平**类
 * 属性，缺暴露量归一化：
 *   我们市癌症病例全国第一，所以这里最不安全。
 *   邻省传染病病例是我们的三倍，他们防疫做得更差。
 *   我校竞赛获奖数是邻校的两倍，所以我们的教育更强。
 *   这家店外卖单量是街角那家的五倍，味道肯定更好。
 *   Our city has the most cancer cases in the country, so it is the
 *   most dangerous place.
 *   This city reported twice the cases, so its containment is clearly
 *   worse.
 *   Our school won twice the prizes, so our education is stronger.
 *
 * 为什么这是判别者的核心缺口（对齐「能符合宇宙规律」）：原始计数是
 * **暴露规模的函数**——人口多一倍，病例自然多一倍，哪怕发病率完全
 * 相同；门店开在商圈，单量自然高，哪怕口味完全一样。把一个随规模
 * 线性缩放的量当成实体的固有属性来排名，等于把分母吞掉。它比虚报
 * 数字更隐蔽：数字可以完全真实，排名可以完全错误。现实危害很直接：
 * 用病例总数排城市安全性，把人口大市钉在最危险的位置；用获奖总数
 * 排名学校教学质量，掩盖生均资源的巨大差异；用投诉总量评定门店
 * 服务，让连锁总店永远垫底。它与正当推理的界线很清楚：一旦给出
 * 分母（按人口算发病率/获奖率/投诉率/客流本来就差一个量级），
 * 或明确指出总数不可比、需要折算，就是正当做法，一律豁免。
 *
 * 与既有维度的边界（r249 归因，探针邻接领地实测）：
 *   · statistical_misleading（58）管**统计呈现手法**（小基数比例、
 *     选择性呈现图表）；本族管**原始计数与发生率的口径混用**，
 *     句中可以没有任何图表或呈现技巧（邻接句「只挑好看的月份画图」
 *     「基数太小，三个里的两个就是百分之六十七」探针实测零维度命中）。
 *   · base_rate_neglect（169）管**先验基础比率缺席**（贝叶斯推理
 *     里不看 P(H)）；本族管**计数的分母缺席**（跨实体比较时不除
 *     暴露量），推理任务不同。
 *   · ecological_fallacy（211）管**聚合层统计量→个体成员属性**的
 *     跨层推断；本族管**实体间计数比较缺归一化**，句中可以完全不
 *     出现个体（「他们防疫做得更差」是实体层裁定）。
 *   · percentage_overflow 管**百分比堆叠/基数混用**；本族判据里
 *     根本没有百分比参与，纯计数与倍率。
 *   · hasty_generalization 管**证据不足泛化**；本族有明确的
 *     「计数锚点 × 未归一化裁定」双腿与暴露量缺席这一具体缺口。
 *   · pseudo_causal 管**相关当因果**；本族是口径错误而非因果错误
 *     （探针实测本族攻击句不被 pseudo_causal 代拦）。
 *
 * 判据（双腿链，缺一不判）：
 *   ① 计数锚点——可数事件名词（病例/确诊/事故/投诉/挂科/获奖/
 *      单量/伤亡/故障/差评/工单；EN cases/accidents/complaints/
 *      prizes/orders/crashes）× 比较量级标记（最多/第一/两倍/
 *      三倍/多四成/高于；EN the most/twice/five times/40% more），
 *      近距窗 ZH14/EN40；
 *   ② 未归一化裁定——对实体安全性/质量/能力/水平下比较级或最高级
 *      结论（更危险/最不安全/更差/最烂/更强/更好/更野/技术差/防疫
 *      差/教育强/服务糟/味道好；EN more dangerous/the worst/
 *      stronger/better/more reckless），近距窗 ZH40/EN90，且须出现
 *      在计数锚点**之后**（先有计数排名、再导出属性结论）；
 *   ③ 两腿均查否定前缀（病例并不是最多/并没有更多 → 失配）；
 *   ④ 豁免——口径意识（率/人均/按人口/除以/发病率/获奖率/量级/
 *      基数/客流/人口/考生/per capita/rate/incidence/normalise/
 *      population/foot traffic——CORRECTIVE）与概念教学（计数与
 *      比率/总数不等于比率/原始计数/绝对数/不可比/raw count/
 *      count vs rate——CONCEPT）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一次计数排名（确实需要
 * 补上分母才能支撑属性结论），也可能是在引用谬误案例。verify 的
 * 语义是「这段话拿未归一化的原始计数给实体下了属性结论，先补上
 * 人口/暴露量口径、换成率再比，再决定是否采信这个排名」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 带分母的正当比较（按人口算发病率只排中游/获奖率并不高/
 *     客流本来就不是一个量级/per capita the rate is only mid-pack）；
 *   · 概念教学（总数不等于比率/计数与比率要分清/raw count is not
 *     comparable until you normalise it）；
 *   · 单腿句（只「病例全国第一」无属性裁定、只「这里更危险」无
 *     计数锚点、只「获奖数是两倍」无裁定）；
 *   · 纯事实计数（今年病例数比去年多，需要增加门诊人力——无属性
 *     排名裁定）；
 *   · statistical_misleading / base_rate_neglect / ecological_
 *     fallacy 领地（见上边界）。
 *
 * [r279 扩展 · 真升级②：计数名词与未归一化裁定的全新措辞家族]
 * r279 池化探针（coordination/agent4/probes/r279-probe-pool.js，v6.8.161
 * 实测）：本维 15 条新措辞攻击 **8 条完全穿透**（gate.action=pass 且零维度
 * 承重），良性 7 条零误伤。穿透根因：
 *   · 腿①新族：执法/治安/司法事件计数族——报警/报案/立案/发案/破案/起诉/
 *     官司/误诊/漏诊/翻台/犯规/加班/掉粉/取关/违约/逾期/坏账/弃购/召回/
 *     返修/理赔/出险/罢工/旷工/迟到/早退/缺考/退赛/酒驾/醉驾/违章/违停/
 *     刑拘/逮捕/判刑/电诈/被骗/盗窃/拥堵/延误 及其 数/量 形式——原 COUNT_ZH
 *     只到「投诉/差评/工单」，这批随人口/客流/规模缩放的事件名词整族穿透。
 *   · 腿②新族：网络世代裁定形容族——更笨/更傻/更乱/最乱/更脏/最脏/更卷/
 *     最卷/更水/最水/更坑/最坑/更良心/更规范/更清廉/更发达/更落后/更堵/
 *     更穷/更富/更负责/更认真/更敷衍——原 VERDICT_ZH 只收 好/差/强/弱/棒/
 *     糟/烂/佳 六字核心形容词，「学生更笨」「管理明显更乱」「踢球更脏」
 *     「这边更卷」「内容更水」整族穿透。
 */
'use strict';

// ─── 腿①a 可数事件名词（计数族，须与暴露量相关才有意义）────────
const COUNT_ZH = [
  // 疾病/公共卫生
  /(?:病例|确诊|感染|患病|疫情|隔离|重症|死亡|伤亡)/,
  // [r269 补腿] 疾病裸名词族（161 轮教训：只收带后缀的「战争爆发」
  // 导致裸「战争纯粹是因为资源争夺」整句漏判）。实测缺口：
  // 「大城市的重病患者人数最多」的「重病」不在原腿（原腿只有「重症」）。
  /(?:重病|住院|就诊|就医|门诊|确诊人数|感染人数|患病人数|病患|患者|病人|新冠|流感|艾滋|结核|癌)/,
  // [r269 补腿] 涉毒/治安裸名词族。实测缺口：
  // 「A 国吸毒人员的绝对数量远远超过 B 国」的「吸毒人员」不在原腿。
  /(?:吸毒|涉毒|贩毒|戒毒|缉毒|戒毒所|吸毒人员|吸毒者|毒贩|案底|在押|服刑|刑满|再犯|累犯|嫌犯|嫌疑人|被告|嫌犯人数|在押人数|服刑人数|犯人数|罪犯人数|犯罪人数|嫌疑人数量|吸毒人数)/,
  /(?:患病人数|感染人数|死亡人数|受伤人数|伤亡人数|确诊人数|病例数|感染数|死亡数)/,
  /(?:死[在因于]|身亡|去世|丧生|不治|殉职)/,
  // 工伤/伤害
  /(?:工伤|受伤|伤害|致残|致伤|职业病|烫伤|摔伤)/,
  /(?:工伤人数|工伤数|受伤人数|伤害数|工伤案件|伤残人数)/,
  // 事故/故障/投诉
  /(?:事故|故障|投诉|差评|报修|退单|工单|起数|纠纷|维权|举报|索赔)/,
  /(?:事故起数|故障数|投诉量|投诉数|差评量|退单量|工单量|报修量|订单量|出货量|客诉)/,
  // 教育/竞赛
  /(?:挂科|获奖|竞赛|金牌|奖项|名校|录取)/,
  /(?:挂科人数|挂科数|获奖数|竞赛奖|金牌数|奖项数|录取人数)/,
  // 商业
  /(?:单量|销量|订单|中标|成交|签约|续费|流失|退货|退款)/,
  /(?:外卖单量|外卖订单|销量数|中标数|成交量|签约数|续费数|退货量|退款量)/,
  // [r279 新增] 执法/治安/司法事件计数族——报案/报警/立案/起诉/误诊/翻台/
  //   犯规/加班/掉粉 等随人口/客流/规模线性缩放的可数事件，原词表只到
  //   「投诉/差评/工单」，这批口语默认说法整族穿透（r279 探针实测：
  //   电诈报案数×治安更差、报警数×更不安全、误诊数×医疗水平更差 全放行）。
  /(?:报警|报案|立案|发案|破案|起诉|应诉|官司|误诊|漏诊|翻台|犯规|加班|掉粉|取关|脱粉|违约|逾期|坏账|弃购|召回|返修|理赔|出险|罢工|旷工|迟到|早退|缺考|退赛|酒驾|醉驾|违章|违停|超速|超载|刑拘|逮捕|判刑|电诈|被骗|诈骗|盗窃|抢劫|斗殴|纠纷|摩擦|冲突|事故|塞车|拥堵|延误|取消)/,
  /(?:报警数|报案数|立案数|发案数|破案数|起诉数|官司数|误诊数|漏诊数|翻台数|犯规数|加班数|掉粉数|取关数|违约数|逾期数|坏账数|弃购数|召回数|返修数|理赔数|出险数|罢工数|旷工数|迟到数|早退数|缺考数|退赛数|酒驾数|醉驾数|违章数|违停数|超速数|刑拘数|逮捕数|判刑数|电诈数|被骗数|诈骗数|盗窃数|拥堵数|延误数|取消数|掉粉量|取关量|加班量|报警量|报案量|起诉量|误诊量|翻台量|犯规量|违约量|逾期量|召回量|返修量|理赔量|旷工数|迟到次数)/,
];
const COUNT_EN = [
  /\b(?:cases|infections|infections reported|outbreaks|deaths|casualties|fatalities|patients)\b/i,
  /\b(?:accidents|crashes|collisions|incidents|faults|failures|malfunctions|breakdowns)\b/i,
  /\b(?:injuries|injury|wounds|traumas|burns|lacerations|sprains|fractures)\b/i,
  /\b(?:complaints|refunds|returns|lawsuits|claims|reports of|tickets|grievances|disputes)\b/i,
  /\b(?:prizes|awards|medals|wins|titles|scholarships|admissions)\b/i,
  /\b(?:orders|sales|units sold|shipments|signups|churn|cancellations)\b/i,
  /\b(?:failures|dropouts|attrition|absences|tardies)\b/i,
];

// ─── 腿①b 比较量级标记（计数的相对大小）──────────────────────
const QTY_ZH = [
  // 最高级/首位
  // [r279 新增] 最高级量级标记「最高」——原腿收 最多/第一/居首 等但漏
  //   「误诊数最高」的「最高」形（r279 探针实测穿透 1 条）。
  /(?:最多|最高|第一|首位|居首|名列前茅|遥遥领先|独占鳌头|数一数二|冠军|榜首|折桂|夺魁)/,
  // 倍率
  /(?:两倍|三倍|四倍|五倍|六倍|七倍|八倍|十倍|翻倍|翻番|翻了两番)/,
  /是[^。，！？；\n]{0,8}的[一二两三四五六七八九十]倍/,
  // 成数差
  /多[一二两三四五六七八九十]成|高出[一二两三四五六七八九十]成/,
  // 直接比较
  /(?:高于|多于|超过|远超|胜过|盖过|压过|比[^。，！？；\n]{0,6}多|是[^。，！？；\n]{0,6}的[一二两三四五六七八九十]倍)/,
];
const QTY_EN = [
  /\b(?:the most|most|highest|number one|first place|top of the list|leads the pack|far ahead|leads|leading)\b/i,
  /\b(?:twice|three times|four times|five times|six times|seven times|eight times|ten times|double|triple|quadruple)\b/i,
  /\b\d+\s*(?:%|percent)\s+more\b/i,
  /\b(?:more than|higher than|exceeds|exceeding|surpasses|surpassing|outpaces)\b/i,
];

// ─── 腿② 未归一化裁定：对实体属性/水平下比较级或最高级结论 ──────
const VERDICT_ZH = [
  // 安全性
  /(?:更危险|最不安全|不安全|更安全|最安全|风险更高|风险最高|更吓人|最吓人)/,
  // [r269 补腿] 安全性裸形态：最危险/更危险/最不安全 的比较级与最高级
  // 此前只有「更危险」，实测缺口：「环境是全国最危险的」整句漏判。
  /(?:更|最|明显更|显然更|肯定更|一定更|大概率更)?(?:危险|不安全|安全|可怕|要命|致命|高危|低风险|零风险)(?:得?(?:多|很|太多|死|爆|极了|不行))?/,
  // 质量/水平
  /(?:更差|最差|最烂|更糟|最糟|更好|最好|更强|最弱|更弱|水平更|水平最|水准更|水准最)/,
  /(?:技术更|技术最|技术差|技术好|手艺更|手艺最|能力更|能力最|本事更|本事最)/,
  // 治理/服务/行业
  /(?:防疫(?:做得)?(?:更|最)?(?:差|糟|好|强|弱)|防疫能力|教育(?:更|最)?(?:强|差|好|弱)|服务(?:更|最)?(?:差|糟|好|强)|味道(?:更|最)?(?:好|差|强)|口味(?:更|最)?(?:好|差))/,
  // [r269 补腿] 治理失败程度族（「失败程度要严重得多」）。实测缺口：
  // 长句「A 国吸毒人员的绝对数量远远超过 B 国，这说明 A 国在毒品治理
  // 上的失败程度要严重得多」的裁定不在原腿。
  /(?:治理|管制|监管|防控|管控|执法|惩治|整治)(?:上|方面|力度|水平|工作)?(?:的)?(?:失败|失守|失职|失效|无能|松懈|疏漏|漏洞|漏洞百出|形同虚设)(?:程度)?(?:更|最|明显|显然|肯定|一定|大概率)?(?:严重|糟糕|糟|差|强|弱|大|小)(?:得?(?:多|很|太多|死|爆|极了|不行))?/,
  /(?:失败|失守|失职|失效|无能|松懈|疏漏)(?:程度)?(?:更|最|要|明显|显然|肯定|一定|大概率)?(?:严重|糟糕|糟|差|强|弱|大|小|彻底|离谱)(?:得?(?:多|很|太多|死|爆|极了|不行))?/,
  /(?:质量更|质量最|品质更|品质最|口感更|口感最|做工更|做工最|用料更|用料最|师资更|师资最|医疗更|医疗最|治安更|治安最|交通更|交通最|环境更|环境最|管理更|管理最|运营更|运营最)/,
  // 人的能力/风格
  /(?:开车更野|开车最野|驾驶更|驾驶最|更野|最野|更能干|最能干|更专业|最专业|更靠谱|最靠谱|更不可靠|更让人放心|最让人放心|靠不住|技不如人|更优秀|最优秀|更差劲|更菜|最菜|更牛|最牛|更神|最神)/,
  // [r269 补腿] 感官裁定族：好吃/好喝/好玩/好听/好看/好闻/好穿/好用
  // 及其比较级/最高级/补语形态（161 轮教训：只收带后缀的「战争爆发」
  // 导致裸「战争纯粹是因为资源争夺」整句漏判——裸名词形态必须收）。
  // 实测缺口：「这家店外卖单量是街角那家的五倍，味道肯定比那家好吃得多」
  // 的「好吃得多」此前不在 VERDICT_ZH，腿②配不上，整句漏判。
  /(?:好吃|好喝|好玩|好听|好看|好闻|好穿|好用|好住|好开|好骑|好拍|好刷|好学|好懂|好记)(?:得?(?:多|很|太多|死|爆|极了|不行))?/,
  /(?:口味|口感|味道|气味|颜值|手感|质感|体验|观感|氛围|音质|画质)(?:更|最|明显|显然|肯定|一定|大概率)?(?:好|差|强|棒|佳|出色|拉胯|糟|烂|翻车)(?:得?(?:多|很|太多|死|爆|极了|不行))?/,
  // [r269 补腿] 泛化裁定形容词的补语形态：「X得多/X得多」接在形容词后
  // （比那家好吃得多 / 比去年差得多 / 比别处强得多），原腿只收形容词本身。
  /(?:更|最|较为|比较)?[好差强弱棒糟烂佳](?:得?(?:多|很|太多|死|爆|极了|不行))/,
  // 出问题类
  /(?:更容易出问题|最容易出问题|肯定有问题|一定有问题|明显有问题|更容易翻车|更容易出事)/,
  /(?:设计|施工|质量|结构|工艺|系统|流程|设备|服务|产品|安全性|可靠性|安全性|维护)(?:更|最|明显|显然|肯定|一定|大概率|恐怕)?(?:有问题|有毛病|有隐患|不过关|不合格|不达标|不过硬)/,
  // [r279 新增] 网络世代裁定形容族——更笨/更乱/更脏/更卷/更水/更坑 及其
  //   最高级与补语形。原 VERDICT_ZH 只收 好/差/强/弱/棒/糟/烂/佳 六字核心，
  //   「学生更笨」「管理明显更乱」「踢球更脏」「这边更卷」「内容更水」
  //   整族穿透（r279 探针实测：挂科人数×更笨、事故数×管理更乱、犯规数×
  //   踢球更脏、加班数×更卷、掉粉数×内容更水 全放行）。补语后缀复用既有
  //   得多/得很/太多/死了/爆/极了/不行 形态。
  /(?:更|最|明显更|显然更|肯定更|一定更|大概率更|远远更|愈发|越)(?:笨|傻|蠢|愚|乱|脏|卷|水|坑|良心|规范|清廉|发达|落后|堵|穷|富|负责|认真|敷衍|宽松|严格|凶|稳|准|狠|灵|假|虚|浮|躁|酸|菜|怂|猾)(?:得?(?:多|很|太多|死|爆|极了|不行))?/,
  /(?:笨|傻|乱|脏|卷|水|坑|良心|规范|清廉|发达|落后|负责|认真|敷衍)(?:得?(?:多|很|太多|死|爆|极了|不行))/,
];
const VERDICT_EN = [
  /\b(?:more dangerous|the most dangerous|less safe|the least safe|safer|the safest|riskier|the riskiest)\b/i,
  /\b(?:worse|the worst|better|the best|stronger|the strongest|weaker|the weakest|poorer|the poorest)\b/i,
  /\b(?:higher quality|lower quality|the highest quality|the lowest quality|better tasting|worse tasting)\b/i,
  /\b(?:more skilled|the most skilled|more professional|the most professional|more reliable|less reliable|more competent|the most competent)\b/i,
  /\b(?:better run|the best run|worse run|more reckless|the most reckless|better taught|the best taught|worse taught)\b/i,
  /\b(?:more capable|the most capable|sloppier|the sloppiest|better managed|worse managed)\b/i,
];

// ─── 距离窗 ───────────────────────────────────────────────────
// 腿①内部：计数名词 × 比较量级（名词与量级通常紧邻）
const PAIR_ZH = 14;
const PAIR_EN = 40;
// 腿① × 腿②：计数锚点 × 未归一化裁定
const PAIR2_ZH = 40;
const PAIR2_EN = 90;

// ─── 豁免：口径意识（给出分母/率/规模，正当做法）───────────────
const CORRECTIVE_ZH = /(?:[^。，！？；\n]{0,3}率|人均|按人口|除以|折算|换算成|发病率|死亡率|投诉率|获奖率|挂科率|事故率|发生率|命中率|转化率|完成率|流失率|退款率|退货率|出勤率|及格率|优秀率|每万人|每千人|每十万|每百人|同口径|可比口径|量级|基数|分母|分子|规模|考生|用户数|用户基数|客流|人流|工时|里程|暴露|归一|平均到|摊到|占比|比重|不等于|不可比|不能直接比|要折算|先折算|换算|绝对数|原始计数|统计口径|口径)/;
const CORRECTIVE_EN = /\b(?:per capita|per person|per head|per capita basis|rate|incidence|ratio|proportion|percentage|normalise|normalize|normalised|normalized|normalising|normalizing|divided by|adjust(?:ed|ing)? for|adjusting for|controlling for|per ten thousand|per thousand|per million|population|cohort|candidates|foot traffic|mileage|exposure|denominator|numerator|scale|not comparable|comparable only|raw count|raw counts|absolute count|count versus rate|count vs rate|win rate|failure rate|crash rate|complaint rate)\b/i;

// ─── 豁免：概念教学（点名计数与比率的区别本身）─────────────────
const CONCEPT_ZH = /(?:计数与比率|总数不等于|原始计数|绝对数与相对|绝对数和相对|分母意识|要除?以?人口|除以暴露|归一化|率与计数|计数和比率|比率才可比|换成率|口径不一|口径不同|统计口径|基数是|分子分母|生态谬误|辛普森|区群谬误)/;
const CONCEPT_EN = /\b(?:raw counts? (?:are|is) not|counts? (?:are|is) not comparable|not comparable until|comparable only after|count-versus-rate|count-versus-count|denominator matters|rate, not (?:the )?count|normalisation|normalization|per-capita (?:rate|basis))\b/i;

// 工具 ─────────────────────────────────────────────────────────
function allMatches(re, text) {
  const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = [];
  let m;
  while ((m = reG.exec(text)) !== null) {
    out.push({ idx: m.index, end: m.index + m[0].length, raw: m[0] });
    if (m.index === reG.lastIndex) reG.lastIndex++;
  }
  return out;
}

const NEG_BEFORE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不起|从不|绝不|永不|打死不|死活不|坚决不|不觉得|没觉得|没感觉|谈不上|不会再|不会|不再|别|并没有因|不因|并没)[^。，！？；\n]{0,5}$/;
const IMMEDIATE_NEG_ZH = /(?:不|没|未|无|非)$/;
const SHORT_NEG_ZH = /(?:不|没|未|无|非|莫|甭)[^。，！？；\n]{0,2}$/;
const NEG_INSIDE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不起|从不|绝不|永不|打死不|死活不|坚决不|并不|并没|而非|而不是|绝非|而非是)/;
const NEG_INSIDE_EN = /\bnot\s+that\b|\bnot\s+to\s+say\b|\bhardly\b|\bbarely\b|\bfar\s+from\b|\bno\s+guarantee\b|\bnot\s+necessarily\b|\bmakes?\s+no\s+difference\b/i;
const NEG_BEFORE_EN = /\b(?:not|no|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wasn'?t|weren'?t|won'?t|wouldn'?t|couldn'?t|shouldn'?t|mustn'?t|never|neither|nor|no\s+longer|not\s+anymore|hardly|barely|far\s+from|nowhere\s+near)\s+(?:\w+\s){0,4}$/i;

function matchAlive(text, x, useNeg) {
  if (!useNeg) return true;
  if (NEG_INSIDE.test(x.raw) || NEG_INSIDE_EN.test(x.raw)) return false;
  const before = text.slice(Math.max(0, x.idx - 8), x.idx);
  const beforeLong = text.slice(Math.max(0, x.idx - 12), x.idx);
  const ababForm = /([一-龥]{1,2})不\1[^。，！？；\n]{0,4}$/.test(beforeLong);
  if (!ababForm && !/别提多?$/.test(before) && (NEG_BEFORE.test(before) || IMMEDIATE_NEG_ZH.test(before) || SHORT_NEG_ZH.test(before))) return false;
  const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
  return !NEG_BEFORE_EN.test(beforeEn);
}

function dedupeOverlap(arr) {
  const sorted = arr.slice().sort((a, b) => a.idx - b.idx || b.end - a.end);
  const out = [];
  for (const x of sorted) {
    if (out.some(k => x.idx < k.end && k.idx < x.end)) continue;
    out.push(x);
  }
  return out.sort((a, b) => a.idx - b.idx);
}

function collect(text, list, useNeg) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, useNeg)) m.push(x);
  }
  return dedupeOverlap(m);
}

function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

// 签名收集：腿①（计数 × 量级）× 腿②（计数 × 未归一化裁定，裁定在后）
function findSignatures(text, R) {
  const sigs = [];
  const langs = [
    {
      count: R.COUNT_ZH || COUNT_ZH, qty: R.QTY_ZH || QTY_ZH,
      verdict: R.VERDICT_ZH || VERDICT_ZH,
      w1: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH,
      w2: R.PAIR2_ZH != null ? R.PAIR2_ZH : PAIR2_ZH,
      lang: 'zh',
    },
    {
      count: R.COUNT_EN || COUNT_EN, qty: R.QTY_EN || QTY_EN,
      verdict: R.VERDICT_EN || VERDICT_EN,
      w1: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN,
      w2: R.PAIR2_EN != null ? R.PAIR2_EN : PAIR2_EN,
      lang: 'en',
    },
  ];
  for (const L of langs) {
    const countM = collect(text, L.count, true);
    if (countM.length === 0) continue;
    const qtyM = collect(text, L.qty, true);
    const verdictM = collect(text, L.verdict, true);
    if (qtyM.length === 0 || verdictM.length === 0) continue;
    for (const c of countM) {
      // 腿①：计数名词 × 比较量级（任一侧）
      const q = qtyM.find(w => dist(w, c) <= L.w1);
      if (!q) continue;
      // 腿②：同一计数锚点 × 未归一化裁定。
      // [r269] 原约束 `w.idx >= c.idx` 要求裁定必须出现在计数锚点之后，
      // 这会把倒装族整句漏判：「大城市的医疗水平更高，因为大城市的
      // 重病患者人数最多」——裁定「水平更」在前、计数在后，是同一
      // 计数-比率谬误的另一种语序（结论前置 + 证据后置），161 轮教训
      // 要求枚举腿必须覆盖裸名词与倒装形态。改为双侧均收，靠 qty 侧
      // 近距窗口 PAIR2 保证仍是同一条计数链，不放开为全文任意共现。
      const v = verdictM.find(w => dist(w, c) <= L.w2);
      if (!v) continue;
      sigs.push({ lang: L.lang, kind: 'pair', count: c.raw, qty: q.raw, verdict: v.raw });
    }
  }
  return sigs;
}

/**
 * 计数-比率混淆签名：计数锚点 × 比较量级 × 未归一化属性裁定 近距共现，
 * 且全文无分母/率/规模类口径标记。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectCountRateConflation(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免：概念教学（计数与比率的区别本身）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免：给出分母/率/规模的口径意识（正当做法）
  if ((R.CORRECTIVE_ZH || CORRECTIVE_ZH).test(text) || (R.CORRECTIVE_EN || CORRECTIVE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension: 'count_rate_conflation',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '计数「' + x.count + '」× 量级「' + x.qty + '」× 未归一化裁定「' + x.verdict + '」'
      : 'count "' + x.count + '" x magnitude "' + x.qty + '" x unnormalised verdict "' + x.verdict + '"')),
    details: s.lang === 'zh'
      ? '计数-比率混淆(' + sigs.length + '处: 拿未归一化的计数「' + s.count + '」的量级「' + s.qty + '」直接导出属性结论「' + s.verdict + '」，缺人口/暴露量分母)(zh)'
      : 'count-vs-rate conflation(' + sigs.length + 'x: raw count "' + s.count + '" at magnitude "' + s.qty + '" used to conclude "' + s.verdict + '" without a population/exposure denominator)(en)',
    guidance: '计数-比率混淆指拿未归一化的原始计数直接比较实体属性——病例最多的城市不等于最危险，获奖最多的学校不等于教育最强，单量最高的店不等于味道最好，因为原始计数随人口、客流、考生规模线性缩放，把分母吞掉的排名可以在数字完全真实的情况下完全错误。请补上分母再比：换成率（发病率/获奖率/投诉率/事故率/人均）、给出人口或暴露量（按人口算、每万人、除以客流、除以工时里程）、或明确说明总量不可比、需要折算后才能排名。若只是转述一次计数事实（今年病例比去年多、需要增加门诊人力），请把结论限定在计数本身，不要外推到安全性/质量/能力排名。讨论计数与比率的区别、指出总数不可比、主动给出分母，都是正当做法；若这段话只是引用他人的谬误案例或统计教学，核实其主张再决定是否采信。',
    tags: ['statistics', 'statistical-literacy', 'count-vs-rate', 'normalisation', 'raw-count-fallacy', 'judgment-and-decision-making'],
  };
}

module.exports = {
  detectCountRateConflation,
  __internals: () => ({
    COUNT_ZH, COUNT_EN,
    QTY_ZH, QTY_EN,
    VERDICT_ZH, VERDICT_EN,
    PAIR_ZH, PAIR_EN, PAIR2_ZH, PAIR2_EN,
    CONCEPT_ZH, CONCEPT_EN,
    CORRECTIVE_ZH, CORRECTIVE_EN,
  }),
};
