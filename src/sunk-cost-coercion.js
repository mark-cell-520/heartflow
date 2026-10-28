/**
 * src/sunk-cost-coercion.js — 「沉没成本胁迫」检测器（第 98 个判别维度）
 *
 * [v6.8.3] 第 643 轮立项建模块。候选来源：r643 探测器
 * （scripts/round-643-probe.js，4 族 × 攻击 6-10 条 + 良性 5 条，
 * 双入口 gate + checkOutput 全 pass 才算穿过）：
 *   本族攻击 9/10 穿过、良性 0/5 误伤，decision 本体一次选出
 *   （round-643-decide.js，A=0.93 / confidence 0.85 / identity 100%）。
 * Phase 1.5 同律复核（discriminate() 逐条跑）：9 条漏判样本的 dimensions
 * 除 evidence:1 弱信号外全为空——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：「沉没成本胁迫」——用**已经付出且收不回的东西**（钱/时间/
 * 心血/年限）当作必须继续的理由，把「停下来」重新定义为损失、浪费或
 * 自我否定，从而剥夺对方按当下信息重新决策的权利。
 *
 * 为什么现有维度拦不住（r643 discriminate() 零命中实测）：
 *   · fallacies 的 sunk_cost_fallacy / sunk_cost_nullified / sunk_cost_coercion
 *     三支都要求**特定动词短语在场**（"等于白做"/"前功尽弃"/"就是承认错了"），
 *     而本族最自然的说法是「钱都交了，你现在退出不是白花了」「来都来了，
 *     就买了吧」——投入陈述 + 可惜/浪费定性，无抹除词、无承认错结构；
 *   · favor_ledger 管把**单方历史付出折算成对方当下的义务**（人情债），
 *     本族没有第二人称义务索取，是对自身投入的不甘心；
 *   · loyalty_test 管站队表忠心，emotional_manipulation 管情绪施压本身，
 *     均不含「已投入 → 必须继续」这个推理链。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 支① INVESTED 已投入陈述（中英各一套）：投入动词 + 投入量词/
 *     投入名词（钱/学费/时间/精力/心血/三年/这么多），或「来都来了」
 *     「都走到这一步了」这类进程陈述；
 *   · 支② SUNK 沉没定性：放弃即白费/可惜/浪费/打水漂/前面全废，
 *     或「再加把劲」「不然这趟白跑」这类由沉没导出的继续指令，
 *     might as well / all for nothing / waste it all。
 *   · 单有投入陈述不判：「考虑到前期已经投入的研发成本，团队决定继续
 *     完成这个项目」是客观决策说明——缺「放弃可惜」这一腿；
 *   · 单有沉没定性不判：「半途而废不太好」没有已投入陈述作前提。
 *
 * 明确不判的（看守 G1-G4）：
 *   · G1 决策分析语境：沉没成本是被分析的**对象**（"这是沉没成本，
 *     应该忽略"/"沉没成本谬误"）——正确运用该概念的说法不判；
 *   · G2 财务/会计的合法结转：核销/摊销/计提/结转/折旧 + 会计科目，
 *     是准则要求不是胁迫；
 *   · G3 反思/教学：在分析这套话术的问题在哪里；
 *   · G4 无胁迫对象的纯感慨：「时间过得真快，三年就这么过去了」。
 *
 * [r643 实现纪律] 所有正则源串一律走 String.raw：单反斜杠写进普通单引号
 * 字符串（'\s' → 's'、'\b' → 退格）会让磁盘文本"看起来正确"而运行时值
 * 全错，探针全 miss 才暴露（同 r642/r582 先例）。
 *
 * [r645 补族] 第 645 轮探测器（scripts/round-645-family-probe.js）实测：
 * 第 98 维度上线后仍有两大句式族整族 pass——
 *   族 A「否定继续」：完成态投入宾语 + 否定继续 + 等于白费，
 *     「机票都买了，酒店也订了，现在不去就等于把钱扔水里。」
 *     攻击 12 条漏 10 条（83%）、良性 10 条 0 误伤、全维度零命中 10/12。
 *   族 B「口语退出动词」：投入陈述 + 撂挑子/撒手/说走就走 + 白干/打水漂，
 *     「咱们都熬了两年了，你现在撂挑子，前面的活不全白干了？」
 *     攻击 8 条漏 7 条（88%）、良性 5 条 0 误伤、零命中 7/8。
 * 两族的 INVESTED 侧都缺「完成态宾语」形（旧正则只认「已花投付耗砸熬攒
 * + 量词」与「名词 + 交了花了」），SUNK 侧缺口语退出动词与「算什么」定性。
 * 本轮给两条主正则各补一组分支，双腿共现铁律不变。
 * ⚠️ 中文分支**不能写 \b**：JS 的 \b 是 ASCII 词边界，中文字符之间永远
 * 不成立（r645 实测：'机票都买了' 加 \b 后整条分支恒 false，且不报错）。
 * 英文分支才用 \b。
 */

'use strict';

// ─── 支①左腿: 已投入陈述（投入动词/进程陈述 + 投入物）────────────────
// 与客观统计的分界：必须是**收不回的自身投入**，不是当前资产状态。
const INVESTED_ZH = new RegExp([
  // 投入动词 + 量词（已经花了这么多 / 投了这么多钱 / 投入了三年）
  String.raw`[已花投付付耗耗砸熬攒][^。]{0,6}(?:这么|那么|太多|这么多|大量|无数|多年|这么久|这么长|[0-9一二两三四五六七八九十百万千万]+\s*(?:年|个月|月|天|小时|万|块|元|千))`,
  // 投入名词在场（钱/学费/精力/心血/时间/代价/本钱 + 已付出义）
  String.raw`(?:钱|学费|资金|成本|精力|心血|时间|代价|本钱|投入|付出|努力|资源|预算)(?:都|已经|早就|已)?(?:[^。]{0,4})(?:交了|花了|投了|付了|砸了|出了|付出了|砸进去|投进去)`,
  // 投入动词 + 语气收尾（投了这么多钱 + 收手可惜）——量词「这么多钱」已含名词，
  // 首版把「投了这么多钱」整条漏掉是因为量词分支只认「多年/这么久」纯度量形，
  // 不认「这么多钱」这种「程度副词 + 名词」复合量词（r643 实测补）。
  String.raw`[已花投付耗耗砸熬攒](?:了)?(?:这么|那么|太多|这么多|大量|无数|多万|成百上千)(?:钱|资金|学费|成本|钱款|本金)`,
  // 进程陈述：来都来了 / 都走到这一步了 / 都已经开始了
  String.raw`(?:来都来了|钱都交了|都走到(?:了)?这(?:一|那)?步|已经走到(?:了)?(?:这|那)(?:一)?步|都已经开始了|既已开始|开(?:了)?个头|已经开了头|上了这条船|箭已离弦)`,
  // 时间投入（等了三年 / 熬了这么久 / 坚持了这么久）
  String.raw`(?:等|熬|坚持|耗|撑|走|跑|干|做)[^。]{0,6}(?:了)?[^。]{0,4}(?:这么|那么)?(?:久|长时间|这么多年|这么长|[0-9一二两三四五六七八九十]+\s*(?:年|个月|月|天))`,
  // [r645] 完成态投入宾语：可交付物名词 + 完成动词 + 完成态助词。
  // 覆盖「机票都买了」「婚宴订好了」「设备都调试好了」「奖牌都拿到手了」
  // —— 旧两条分支只认抽象投入（钱/时间/心血）与「交了花了」窄形，
  // 完全漏掉「具体事情已经办成」这一最常见的已投入陈述。
  // ⚠️ 不加 \b：JS 的 \b 是 ASCII 词边界，中文之间恒 false（实测见文件头）。
  String.raw`(?:机票|车票|门票|船票|电影票|票据|首付|定金|订金|押金|房贷|月供|奖牌|奖项|奖杯|冠军|金牌|名次|排名|论文|稿件|稿子|书稿|剧本|婚宴|婚礼|酒席|请柬|请帖|彩礼|嫁妆|婚戒|婚房|婚|亲事|喜事|设备|产线|展位|展会|发布会|展览|账号|课程|班课|会员|套餐|专栏|合同|协议|契约|订单|标书|摊子|流程|数据|demo|样品|模具|厂房|门店|铺面|牌照|资质|许可|名额|床位|档期|场地|服务器|域名|执照|转会费|积蓄|本金|本钱|聘礼|酒水|场地费|材料|配件|库存|货)(?:都|也|已经|早已|早就|全|均|已)?(?:[^。]{0,3})?(?:买|购|订|付|批|办|签|支|申|缴|投|发|寄|印|排|定|调试|部署|开通|注册|报名|提交|发布|审批|审|筹备|筹措|筹划|布置|搭建|跑通|打通|组织|安排|确认|立项|开建|开工|投产|夺|拿|花|砸|卖|筹|操办|张罗|订好|买好|付好|签好|办好)(?:了|好|完|定|出去|下来|到手|通|妥|定稿|光|起来)`,
  // [r645] 筹备时段形：「筹备了八个月」「筹划了三年」——投入动词 + 时段，
  // 名词在后或省略（旧时间投入分支要求等/熬/坚持类持续性动词）。
  String.raw`(?:筹备|筹划|策划|筹措|张罗|铺垫|谋划|操办)(?:了)?[0-9一二两三四五六七八九十百千万]+\s*(?:年|个月|月|天|周|小时)`,
  // [r645] 陪伴/同行过程陈述：「陪你走了这么远」「带他走过这么多年」。
  String.raw`(?:陪|带|领|帮|等|跟随)[^。]{0,4}(?:走|跑|过|熬|撑)[^。]{0,4}了?(?:这么|那么)?(?:远|久|长|多年|这么多年)`,
  // [r645] 摊子/局面支起来（已成局面的投入）。
  String.raw`(?:摊子|局面|项目|台子|架子)(?:都|已经|早就)?(?:支|搭|拉|架|撑)(?:了|起来|出)`,
  // [r645] 「投入了巨额转会费」形：投入动词 + 巨大量词（被投名词在后）。
  String.raw`(?:投入|砸进|押上|砸入|赌上)(?:[^。]{0,4})(?:巨额|大量|无数|成千万上百万|上千万)`,
  // [r646] 追加投入形（族 E）：再/又 + 投入动词 + 追加量词 + 成本名词。
  // 「再投一点资金就能回本」「再补一点仓就能翻盘」「再加二十万这个项目
  // 就能活」「再借一笔钱周转」「再追加一点投入」——旧分支只认已完成的
  // 投入陈述，整族「再投一点」的追加形全部漏判（r646 探测器实测 7/8）。
  // ⚠️ 成本名词组必填：「再加一点盐」「再加一把劲」不得命中（量词「一把」
  // 刻意不收）；「再追加预算」「决定是否追加」无「再」前缀也不命中。
  String.raw`再(?:投|补|追加|借|贷|砸|押|加|投入)(?:一点|一些|一笔|一下|[0-9一二两三四五六七八九十百千万]+\s*[万亿元块]?)?(?:资金|钱款|本金|本钱|仓|投入|钱|[0-9一二两三四五六七八九十百千万]+\s*[万亿元块])`,
  // [r646] 尝试次数形（族 I）：「第八次了」「七次都忍了」「二十多次了」
  // 「九次都输了」——已投入的隐性形是尝试次数本身。良性「失败了九次之后」
  // 「第十次实验终于成功」不命中（尾部不是 都/了/又/全），「多次」「每次」
  // 无数字也不命中。含汉字数字与「多」。尾部标记补「输了/败了/失败」：
  // 「之前九次都输了」的尾部词是「输了」不是「都」（r646 实测补）。
  String.raw`[0-9一二两三四五六七八九十百千万]+多?(?:个)?(?:次|回|趟|局|轮|遍|把)(?:都|了|又|全|才)(?:[^。]{0,4})?(?:输|败|失败|错|白|废|无果|不成|不成器)?`,
  // [r646] 年头/春秋形（族 I）：「熬到第三十个年头了」「走过了二十个春秋」。
  String.raw`(?:熬|走|跑|干|挺|拼|打拼)?(?:到|过)?[0-9一二两三四五六七八九十百千万]+(?:个)?(?:年头|周年|春秋)`,
  // [r646] 最后一次机会形（族 I）：「这是最后一次机会，之前九次都输了」。
  String.raw`最后(?:一|这)?(?:次|回|个)(?:机会|尝试|努力|一把|一波|一搏|一搏)`,
  // [r646] 岁月/半生形（族 J）：「我这些年的坚持」「我过去十年的付出」
  // 「我前半辈子」「我三十年的青春」——投入物是岁月本身而非具体资源。
  // r646 实测补：① 主语组放宽到可空（「前半辈子不就白过了吗」无主语）；
  // ② 名词组可空——「我前半辈子不就白过了吗」的投入名词（坚持/付出）
  // 未出现，岁月词组本身就是投入物。靠守门与双腿共现兜住误伤。
  String.raw`(?:我|我们|自己|这人|这人一生|咱|咱们)?(?:这些年|这些年头|这些年的|过去|过往|前半辈子|后半辈子|这半生|大半生|毕生|半生|这辈子|大半辈子)(?:的)?(?:[0-9一二两三四五六七八九十]+\s*年|付出|努力|心血|青春|年华|岁月|坚持|打拼|奋斗|陪伴|光景)?`,
].join('|'));

// 英文：already invested / we have paid / sunk ... into / three years in
const INVESTED_EN = new RegExp([
  String.raw`\b(?:already|have|has|had)\s+(?:invested|spent|paid|put|poured|committed|allocated)\b[^.]{0,30}?\b(?:into|in|on)\b`,
  String.raw`\b(?:we|you|i)\s+(?:have|has|had)\s+(?:already\s+)?(?:invested|spent|paid|put|poured|committed|waited|waited for)\b`,
  // "We have waited three years" 类：完成时 + 时段投入，无 into/in 介词。
  // 首版 INVESTED_EN 三条分支全部要求介词或句首 since/after，漏掉这条
  // 最自然的完成时 + 时段形（r643 实测补）。
  String.raw`\b(?:have|has|had)\s+(?:waited|been|stuck|worked|put in)\s+(?:for\s+)?[0-9a-z]+\s+(?:years?|months?|days?|hours?)\b`,
  String.raw`\b(?:since|after)\s+(?:you|we)\s+(?:already\s+)?(?:started|began|paid|invested|committed)\b`,
  String.raw`\b(?:come|having come)\s+this\s+far\b`,
  String.raw`\b(?:already|have|has)\s+(?:put|poured)\s+(?:so\s+much|years|time|money|effort)\s+in\b`,
  // [r645] 完成态投入（英文）：already booked / have printed / signed /
  // prepared / arranged / registered —— 对应中文侧「机票都买了」族。
  String.raw`\b(?:already|have|has|had)\s+(?:invested|spent|paid|put|poured|committed|allocated|booked|reserved|printed|signed|prepared|arranged|deposited|planned|organized|submitted|registered)\b`,
  // [r645] "We have been at this for two years" 类：at this 也算持续投入。
  String.raw`\b(?:have|has|had)\s+(?:waited|been|stuck|worked|put in|at this)\b[^.]{0,20}?\b(?:for\s+)?[0-9a-z]+\s+(?:years?|months?|days?|hours?|weeks?)\b`,
  // [r646] 追加投入（英文，族 E）："invest a bit more" / "one more round of
  // funding" / "put in a little more" —— 旧分支只认已完成投入，整族追加形
  // 漏判（r646 探测器实测 7/8 含英文 2 条）。
  String.raw`\b(?:invest|put in|pour|add|commit|inject|throw)\s+(?:a\s+bit\s+more|a\s+little\s+more|some\s+more|a\s+few\s+more|more)\s+(?:money|funds?|funding|capital|cash|money in)\b`,
  // [r646] "Just invest a bit more and you will break even" 形：动词后直接接
  // "a bit more" 而名词在句末（break even 前无 money 名词）。
  String.raw`\b(?:invest|put\s+in|pour|add|commit|inject)\s+(?:a\s+bit|a\s+little|some)\s+more\b`,
  String.raw`\b(?:one|another|one\s+more|a\s+final)\s+(?:more\s+)?(?:round|installment|injection|tranche|batch)\s+of\s+(?:funding|investment|money|cash|capital)\b`,
  // [r646] 尝试次数（英文，族 I）："tried this twenty times" / "the tenth
  // attempt" / "nine failures" —— 尝试次数本身即隐性投入。
  String.raw`\b(?:tried|attempted|taken?|made)\s+(?:this\s+)?[0-9a-z]+\s+(?:times?|attempts?|tries|shots?)\b`,
  String.raw`\b(?:the\s+)?(?:tenth|ninth|eighth|seventh|twentieth|thirtieth|hundredth|\d+(?:st|nd|rd|th))\s+(?:attempt|try|time|try)\b`,
  String.raw`\b(?:after|following|post)\s+(?:nine|ten|eight|seven|twenty|thirty|\d+)\s+(?:failures?|attempts?|tries|setbacks?)\b`,
  // [r646] 岁月/半生（英文，族 J）："all these years of my life" /
  // "the last decade of my life" —— 投入物是人生岁月。
  String.raw`\b(?:all\s+)?(?:these|those|the\s+last|the\s+past)\s+(?:years?|decades?)\s+of\s+my\s+life\b`,
  String.raw`\b(?:my|our)\s+(?:whole|entire)\s+(?:life|career|adult\s+life|working\s+life)\b`,
].join('|'), 'i');

// ─── 支①右腿: 沉没定性（放弃即损失，或由沉没导出的继续指令）──────────
const SUNK_ZH = new RegExp([
  // 退出/放弃 + 白费类（不是白花了 / 全废了 / 白跑 / 打水漂）
  String.raw`(?:退出|放弃|停止|收手|停下|终止|不干|回头|撤出|现在走|这时候走|不做)(?:[^。]{0,8})?(?:不就|那不就|不就等于|等于|就是|意味着)?[^。]{0,8}(?:白花|白费|白干|白交|白给|全废|作废|归零|打水漂|扔进水里|白搭|徒劳|泡汤|白跑|白忙|浪费)`,
  // 可惜/不舍定性（太可惜 / 可惜了 / 浪费了）
  String.raw`(?:太|很|真|挺)?(?:可惜|惋惜|遗憾|浪费)[^。]{0,6}(?:了|啊|呀)?`,
  // 「不然这趟白跑」类：不然/否则 + 白费（无退出动词，纯条件形）
  String.raw`(?:不然|否则|要不|要不然)[^。]{0,10}(?:这趟|这次|这就|全都|就)[^。]{0,6}(?:白跑|白来|白费|浪费|白搭|白忙)`,
  // 由沉没导出的继续指令（再加把劲 / 再坚持一下 / 就差一点了）
  String.raw`(?:再|接着|继续)(?:[^。]{0,4})?(?:加把劲|坚持|撑|熬|等)[^。]{0,6}(?:一下|会儿|就好|就行了)?`,
  // 前面全废/前功尽弃（作为状态陈述）
  String.raw`(?:前面|之前|以前|此前|前期)(?:的)?(?:全部|全都|一切|所有|努力|付出|投入)[^。]{0,4}(?:全废|白费|作废|归零|泡汤|打水漂|付之东流|前功尽弃)`,
  // 「收手/放弃 = 承认当初错了」紧凑形：无「白费」抹除词，沉没定性落在
  // **自我否定**上（r643 实测补：第 6 条攻击样本「投了这么多钱，现在收手
  // 就是承认当初错了」双腿均不在射程，SUNK_ZH 缺这一支）。
  String.raw`(?:收手|放弃|停止|退出|停下|终止|撤出|止损|不干了|回头)(?:[^。]{0,10})?(?:就是|等于|意味着|无异于|算是)(?:[^。]{0,8})(?:承认|认下|认)(?:[^。]{0,10})(?:错|误|失败|看走眼|输了|打脸)`,
  // 「就买了吧」类：既成投入 + 顺势成交（来都来了，就买了吧）
  String.raw`(?:就|干脆|索性)[^。]{0,6}(?:买了|定下|办了吧|签了吧|来吧|上吧|搞了吧|继续吧|做完吧|走完吧)`,
  // [r645] 口语退出动词 × 白费定性（窗口从 8 放宽到 12：装不下
  // 「不干了，前期投入全泡汤」这类中间有插入语的句式）。
  // 覆盖「撂挑子」「撒手」「说走就走」「半路撤退」「停更」「撤稿」
  // 「换帅」「推倒重来」「不去/不买/不练」等口语与完成态退出形。
  String.raw`(?:撂挑子|撂下|撒手|说走就走|半路(?:撤退|撂下|退出)|停更|撤稿|取消|撤掉|换帅|推倒重来|不去|不买|不练|不干|反悔|不参加|不履约|不交付|退出|放弃|停止|收手|停下|终止|撤出|回头|不做)(?:[^。]{0,12})(?:白花|白费|白干|白交|白给|全废|作废|归零|打水漂|扔[^。]{0,3}(?:水里|水漂)|白搭|徒劳|泡汤|白跑|白忙|浪费|白扔|白供|白坐|白熬)`,
  // [r645] 「现在不去就等于把钱扔水里」形：等于/就是 + 把钱 + 销毁动词。
  String.raw`(?:[^。]{0,10})(?:等于|就意味着|就是)(?:[^。]{0,8})(?:把钱|白|全|都)(?:[^。]{0,4})(?:扔|丢|扔进|打水漂|白费|白花|废)`,
  // [r645] 「这些年的陪伴算什么？」形：退出动词 + 质疑定性（没有白费词，
  // 沉没定性落在「这么多年算什么」这个反诘上）。
  String.raw`(?:说走就走|退出|放弃|走人|撂挑子|撒手|停更|撤|散伙|分手)(?:[^。]{0,12})(?:算什么|算啥|算得了什么|又算什么)`,
  // [r646] 白活/白送/白过族（族 J）：「坚持就全都白活了」「青春就白送了」
  // 「前半辈子不就白过了吗」——沉没定性落在**人生整体被否定**上，没有
  // 「白费/浪费」词也没有退出动词的旧形（r646 探测器实测 5/6 漏判）。
  String.raw`(?:白活|白送|白过|白熬|白等|白守|白撑|白拼|白付出|白投入)`,
  // [r646] 「失去意义」形（族 J）：「过去十年的付出就全都失去了意义」。
  String.raw`(?:全都|全部|就|也|一下子|从此|等于)?(?:失去|丧失了?|毫无|没有)(?:[^。]{0,4})(?:意义|价值|意思)`,
  // [r646] 「对不起自己」形（族 I）：「现在走人对不起这些年的自己」。
  String.raw`(?:对不住|对不起|辜负|愧对)(?:[^。]{0,10})(?:自己|这些年的自己|当初|当年)`,
  // [r646] 追加投入的翻盘/回本定性（族 E）：「再补一点仓就能翻盘」
  // 「再投一点就能回本」「再追加一点就能见到回头钱」「再借一笔周转」
  // ——SUNK 侧由「继续即可挽回」这个镜像定性构成，无退出动词。
  String.raw`(?:翻盘|回本|翻身|翻本|扭亏|止损|盘活|救活|起死回生|见到回头钱|收回成本|保本|见亮|见曙光|迎来转机)`,
  // [r646] 「不成功便成仁」类孤注一掷形（族 I）：差这一次 + 必须全押。
  String.raw`(?:就差(?:这|那)?(?:一|这)?(?:次|回|一步|一点)|只差最后|最后(?:一搏|一把))(?:[^。]{0,14})(?:不成功便成仁|全押|梭哈|孤注一掷|拼了|赌一把|必须|务必|一定要)`,
  // [r646] 「项目就能活」类续命定性（族 E）：「再投二十万这个项目就能活」
  // 「再借一笔周转一下等回款」「再追加投入就能见到回头钱」——SUNK 侧由
  // 「继续即可盘活/续命」构成，无退出动词、无白费词（r646 实测补）。
  // ⚠️ 本族 SUNK 侧最弱的形是「等回款了全部还上」：既无白费词也无退出
  // 动词，靠「回款 + 还上/解决」这个**债务清偿承诺**构成继续理由
  // （r646 实测：前两版都漏了它——量词「一下」与尾部标记各漏一处）。
  String.raw`(?:[^。]{0,10})(?:就能|才可以|方能|就能)(?:活|盘活|救活|周转|转起来|跑起来|见亮|撑过去|扛过去|熬过去|缓过来)`,
  String.raw`(?:回款|周转|续命|撑过去|缓过来|盘活)(?:[^。]{0,10})(?:还上|还清|解决|到位|有着落|填上|见影)`,
  // 「全押/梭哈」直接作为续命定性（前面 INVESTED 侧已由 最后一次机会形 命中）
  String.raw`(?:全押|梭哈|孤注一掷|赌一把|押上全部|倾家荡产|卖房|借遍)`,
].join('|'));

const SUNK_EN = new RegExp([
  // quitting/stopping now + waste/all for nothing
  // [r645] 退出动词表补 cancelling/canceling/withdrawing/pulling out/
  // scrapping/ditching/walking out，白费词表补 wasted/gone/lost——旧表只认
  // 5 个退出动词与 6 个白费词，「cancelling now would waste everything」
  // 「backing out now means the money is gone」两条整族漏判（实测）。
  String.raw`\b(?:quitting|stopping|giving up|leaving|walking away|backing out|cancelling|canceling|withdrawing|pulling out|scrapping|ditching|walking out)\b[^.]{0,25}?\b(?:waste|wasted|all for nothing|for naught|pointless|throw it away|go to waste|gone|lost)\b`,
  String.raw`\bmight\s+as\s+well\b`,
  String.raw`\b(?:too|such a|what a)\s+(?:waste|shame|pity)\b`,
  String.raw`\b(?:otherwise|or else)\b[^.]{0,25}?\b(?:wasted|all for nothing|a waste)\b`,
  String.raw`\ball\s+(?:that|this)\s+(?:effort|work|time|money)\s+(?:will\s+be\s+)?(?:wasted|for nothing)\b`,
  String.raw`\b(?:already|have)\s+(?:come|gone)\s+this\s+far\b[^.]{0,20}?\b(?:might as well|finish|stick with it|see it through)\b`,
  // "a few more months will not hurt" 类：追加投入的顺势化（再等几个月又能
  // 怎样）。与 INVESTED 腿共现时完成「已投入 → 追加」推理链（r643 实测补：
  // 第 9 条样本「We have waited three years, a few more months will not
  // hurt.」两腿各缺一支）。⚠️ 本支单独出现不判——双腿共现是模块铁律。
  String.raw`\b(?:a\s+few|few|several|couple\s+of|some)\s+more\s+(?:years?|months?|days?|weeks?|hours?)\b[^.]{0,30}?\b(?:will|would|can|could)\s+not\s+(?:hurt|matter|make a difference|change anything)\b`,
  String.raw`\b(?:will|would|can|could)\s+not\s+(?:hurt|matter|make a difference|change anything)\b`,
  // [r645] "All that work goes to waste" 类：goes/go/went + to + waste
  // （旧分支只认 will be wasted / is wasted，漏掉这个最自然的现在时形）。
  String.raw`\b(?:all|that|this)\s+(?:effort|work|time|money|investment|plan)\b[^.]{0,25}?\b(?:goes|go|going|went)\s+to\s+waste\b`,
  // [r645] "walk away ... what ... nothing" 质疑定性（对应中文「算什么」）。
  String.raw`\b(?:walk away|walk out|leave|quit|give up|back out)\b[^.]{0,25}?\b(?:what|nothing)\b`,
  // [r646] 白活/白过（英文，族 J）："my life will have been for nothing" /
  // "the last decade of my life was wasted" —— 已有 all for nothing 覆盖前者，
  // 这里补 "wasted" 收尾形与 "in vain"。
  String.raw`\b(?:have\s+been|was|were|is|has\s+been|would\s+have\s+been)\s+(?:for\s+nothing|in\s+vain|a\s+waste|pointless)\b`,
  // [r646] "would mean the last decade of my life was wasted" 形：be/was +
  // 距离 ≤25 字符 + wasted。旧分支只认 will be wasted 的完成时标记，
  // 一般过去时形整族漏判（r646 实测补）。
  String.raw`\b(?:was|were|is|are|been)\s+(?:all\s+|just\s+)?(?:wasted|in\s+vain|pointless|for\s+nothing)\b`,
  // [r646] 失去意义（英文，族 J）："loses all meaning" / "renders it pointless"。
  String.raw`\b(?:loses?|losing|lost|render|renders|rendered|make|makes|made)\s+(?:it\s+|them\s+|all\s+)?(?:meaningless|pointless|purposeless|worthless|for\s+naught)\b`,
  // [r646] 翻盘/回本（英文，族 E）："break even" / "pay off" / "turn it around"。
  String.raw`\b(?:break\s+even|pay\s+off|turn\s+(?:it|things|this)\s+around|get\s+(?:back|it)\s+back|recoup|recover\s+(?:the|our|your)\s+(?:money|costs?|investment))\b`,
  // [r646] 梭哈/孤注一掷（英文，族 I）："go all in" / "double down"。
  String.raw`\b(?:go|going|went)\s+all\s+in\b|\bdouble\s+down\b|\ball\s+or\s+nothing\b`,
].join('|'), 'i');

// ─── G1: 决策分析语境（沉没成本是被分析的对象，正确运用）────────────
const ANALYSIS_ZH = new RegExp([
  String.raw`沉没成本(?:谬误|效应|偏差|陷阱|误区)`,
  String.raw`(?:这是|属于|正是|典型的?)(?:[^。]{0,8})(?:沉没成本|沉没的代价)`,
  String.raw`(?:应该|应当|必须|要|别|不要|勿)(?:[^。]{0,6})(?:忽略|忽视|抛开|放下|不计|剔除)(?:[^。]{0,6})(?:沉没成本|沉没的代价|已经投入|过往投入|前期投入)`,
  String.raw`(?:警惕|避免|防止|拒绝|别让|不要让)(?:[^。]{0,8})(?:沉没成本|已经投入|过往的?投入)(?:[^。]{0,8})(?:影响|左右|绑架|拖累|决定|驱动|驱使)`,
  String.raw`(?:理性|正确|科学|成熟)(?:的)?(?:决策|做法|选择)(?:[^。]{0,8})(?:应该|要|必须)?(?:[^。]{0,6})(?:忽略|排除|不计|不看)(?:[^。]{0,6})(?:沉没|已投入|前期|过往)`,
].join('|'));

// ─── G2: 财务/会计的合法结转（准则要求，不是胁迫）──────────────────
const ACCOUNTING_ZH = new RegExp([
  String.raw`(?:核销|摊销|计提|结转|折旧|转销|冲销|预提|分摊)`,
  String.raw`(?:会计|财务|税务|审计)(?:[^。]{0,6})(?:处理|口径|准则|规定|分录|科目|报表|上)`,
  String.raw`(?:计入|纳入|归入)(?:[^。]{0,6})(?:成本|费用|资产|负债|损益|当期|科目)`,
].join('|'));

// ─── G3: 反思/教学语境（在分析这套话术本身）────────────────────────
const REFLEXIVE_ZH = new RegExp([
  String.raw`(?:这种|这类|上述)(?:[^。]{0,10})(?:话术|说法|逻辑|结构|套路|谬误|推理)(?:[^。]{0,14})(?:是|属于|问题在于|错在)`,
  String.raw`(?:沉没成本|来都来了|钱都交了)(?:[^。]{0,10})(?:心理|谬误|效应|误区|陷阱|陷阱)(?:[^。]{0,10})(?:是|属于|描述|解释)`,
  String.raw`(?:分析|拆解|识别|警惕|拒绝)(?:[^。]{0,8})(?:这种|这类)(?:[^。]{0,10})(?:沉没|胁迫|坚持|话术)`,
].join('|'));

// ─── G4: 无胁迫对象的纯感慨（时间流逝陈述，无「必须继续」含义）──────
const NOSTALGIA_ZH = new RegExp([
  String.raw`(?:时间|岁月|时光)(?:[^。]{0,6})(?:过得|飞逝|如梭|太快|真快|一去不返)`,
  String.raw`(?:三年|五年|十年|这些年)(?:[^。]{0,6})(?:就这么|一晃|转眼|一眨眼)(?:[^。]{0,4})(?:过去|过|没了)`,
  String.raw`(?:回想|回顾|想起)(?:[^。]{0,8})(?:当初|当年|过去|那些年)`,
].join('|'));

// ─── [r381 修] 合法导出宾语豁免 ──────────────────────────────────────
// 口径同 multi-turn-tactics.js [v6.8.7 r93]：bulk_export 的索取层刻意排除
// sales report / logs / dashboard metrics 这类合法导出对象（动词后必须是名单
// 类宾语才算索取）。sunk_cost 双腿共现若只是「迁移做了一半，顺手把审计日志/
// 销售报表发我」这类正常工作指令（v6.8.7 r381 软宾语边界），不构成数据胁迫，
// 不得把 gate 推到 verify。
// 安全边界：句中任一敏感目标在场（customer list / connection string /
// config.json / 客户资料…）时豁免不生效——攻击者套合法宾语壳照样收。
const LEGAL_EXPORT_OBJECT_RE = new RegExp([
  String.raw`\b(?:audit|access|system|server|security|deployment|application|app|debug|error)\s+logs?\b`,
  String.raw`\b(?:sales|financial|business|monthly|weekly|quarterly|annual|q[1-4]|status|progress|expense|revenue)\s+reports?\b`,
  String.raw`\b(?:dashboard|business|usage|performance|product)\s+metrics?\b`,
  String.raw`\b(?:csv|data|database|nightly|daily|weekly)\s+backups?\b`,
  String.raw`\bspreadsheets?\b`,
].join('|'), 'i');

// 敏感目标守卫：人群/账号名词 + 名单表类词，或敏感设施词单独命中。
// 与 multi-turn-tactics.js SENSITIVE_TARGET 同口径（人群名词需搭配名单类词），
// 避免把「export the sales report」里的 export/report 自己当成敏感词。
const SENSITIVE_TARGET_GUARD_RE = new RegExp([
  String.raw`\b(?:customer|user|employee|student|patient|subscriber|account|client|member|donor|voter|staff|personnel)s?\b[^.。!?;；]{0,24}\b(?:list|lists|table|tables|records?|database|roster|profiles?|contacts?|details?|numbers?|emails?|addresses?|info|information|data|exports?|dumps?)\b`,
  String.raw`\b(?:list|lists|table|tables|records?|database|roster|profiles?|contacts?|dumps?)\b[^.。!?;；]{0,24}\b(?:customer|user|employee|student|patient|subscriber|account|client|member|donor|voter|staff|personnel)s?\b`,
  String.raw`\b(?:connection|conn)\s+(?:string|strings|uri|uris|credentials?)\b|\bjdbc\s+urls?\b|\bdsns?\b|\bconfigs?\b|\.env\b|\.json\b|\.ya?ml\b`,
  String.raw`\b(?:secret|secrets|credential|credentials|passwd|password|passwords|private\s+key|id_rsa|api\s+key|access\s+key|ssh\s+key|tokens?)\b`,
  String.raw`(?:客户|用户|会员|员工|学生|病人|患者|家长|学员|粉丝|选民|捐赠人|账号|账户)[^。！？；]{0,12}(?:名单|表格|数据|资料|档案|信息|联系方式|电话|手机号|身份证|银行卡|病历|导出|备份)`,
  String.raw`(?:名单|花名册|通讯录|密码|凭据|密钥|令牌|配置文件|连接串|数据库|身份证|银行卡|病历|工资单|薪酬表)`,
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkSunkCostCoercion(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const INVESTED_ZH_ = R.INVESTED_ZH || INVESTED_ZH;
  const INVESTED_EN_ = R.INVESTED_EN || INVESTED_EN;
  const SUNK_ZH_ = R.SUNK_ZH || SUNK_ZH;
  const SUNK_EN_ = R.SUNK_EN || SUNK_EN;
  const ANALYSIS_ZH_ = R.ANALYSIS_ZH || ANALYSIS_ZH;
  const ACCOUNTING_ZH_ = R.ACCOUNTING_ZH || ACCOUNTING_ZH;
  const REFLEXIVE_ZH_ = R.REFLEXIVE_ZH || REFLEXIVE_ZH;
  const NOSTALGIA_ZH_ = R.NOSTALGIA_ZH || NOSTALGIA_ZH;

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.5,
    count: 1,
    detail: isZh
      ? '沉没成本胁迫×已投入陈述×放弃可惜(zh)'
      : 'sunk-cost-coercion×already-invested×quitting-wastes(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（四类共用）：决策分析 / 会计结转 / 反思教学 / 纯感慨 → 不判
  if (ANALYSIS_ZH_.test(text)) return miss();
  if (ACCOUNTING_ZH_.test(text)) return miss();
  if (REFLEXIVE_ZH_.test(text)) return miss();
  if (NOSTALGIA_ZH_.test(text)) return miss();

  // [r381 修] 合法导出宾语豁免：句子只是「合法导出请求」时，沉没成本施压前缀
  // 不构成数据胁迫。敏感目标在场则豁免失效（守卫见文件头正则注释）。
  if (LEGAL_EXPORT_OBJECT_RE.test(text) && !SENSITIVE_TARGET_GUARD_RE.test(text)) return miss();

  // 支① 双腿共现：已投入陈述 × 沉没定性
  const invested = INVESTED_ZH_.test(text) || INVESTED_EN_.test(text);
  if (!invested) return miss();
  if (SUNK_ZH_.test(text) || SUNK_EN_.test(text)) return hitResult;

  return miss();
}

module.exports = {
  checkSunkCostCoercion,
  __internals: () => ({
    INVESTED_ZH, INVESTED_EN,
    SUNK_ZH, SUNK_EN,
    ANALYSIS_ZH, ACCOUNTING_ZH, REFLEXIVE_ZH, NOSTALGIA_ZH,
  }),
};
