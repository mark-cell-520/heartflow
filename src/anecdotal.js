/**
 * src/anecdotal.js — 「个例泛化」检测器（第 140 个判别维度）
 *
 * [r708 立项] decision 本体在 139 维引擎上选出（/tmp/decide-run-708.js 读
 * /tmp/decide-opts-708.json，composite_score 0.93 / confidence 0.92 /
 * identity alignment 100%，无拒选）。探测器证据 /tmp/hf-scout-708.txt
 * （样本集与 r700-r707 完全一致，跨轮可比；判据从严：只有
 * gate.checkOutput() 返回 gate.action === 'pass' 才算漏判）：
 * anecdotal 族攻击漏判 9/10、漏判中真零命中 9/9、良性误伤 1/12 且
 * 归因存量 confidence 维度（HEAD 对照确认非本族引入）。Phase 1.5 同律
 * 复核（/tmp/r708-overlap-probe.js + /tmp/r708-dimattr-probe.js 逐条
 * 跑 discriminate() 与四个相近维度单维函数）：9 条漏判样本在
 * survivorship_bias / anecdote_as_proof / hasty_generalization 上
 * count 全为 0（仅「买彩票中五百万」一条被 survivorship_bias verify，
 * 该样本同时在本维度射程内，两维共存不冲突）。
 *
 * 辨别的族：「个例泛化」（anecdotal generalization）——用**说话人
 * 身边个例的一个具体结局**，推**领域级结论**：否定该领域公认的风险
 * 或价值、给整个领域下正面定性、或直接把听者推进同一个行动：
 *   我邻居抽烟喝酒活到九十，所以烟酒根本不致癌。
 *   我二舅没上大学照样当老板，读书没用。
 *   我同事天天吃外卖身体倍儿棒，外卖很健康。
 *   我同学裸考就过了，这考试根本不用复习。
 *   我老家老人一辈子没体检也活到九十八，体检是浪费钱。
 *   我亲戚家孩子天天打游戏照样上清华，游戏不害人。
 *   我闺蜜老公就是彩礼给得多才幸福，彩礼必须多要。
 *   我朋友用了这个方法月入十万，你照做就行。
 *   我表姐就是喝红糖水治好了痛经，你试试。
 *   My uncle never went to college and still became a boss, so higher
 *   education is pointless.
 *   My coworker eats takeout every day and is perfectly fine, so
 *   takeout is healthy.
 *   My cousin aced the exam without studying, so this exam does not
 *   require any preparation.
 *   My aunt cured her cramps with brown sugar water, you should try
 *   it.
 *
 * 与既有维度的边界（r708 逐条实测归因）：
 *   · anecdote_as_proof（第 84 维）管**熟人语料 × 全称效果断言**
 *     （我朋友用这个方法都有效/是行业标准），它的 A2 落在「被试用
 *     事物本身有效、安全、是标准」；本族腿②是**领域级否定/规范**
 *     （烟酒不致癌/读书没用/不用复习/必须多要），落点不是效果证明。
 *     实测本族 9 条漏判样本 0 条命中 anecdote_as_proof。
 *   · survivorship_bias（第 132 维）管**可见成功个案 × 推及结论**，
 *     个案不限熟人（名人/陌生人/具体人物），结果限「成功」类
 *     （首富/年薪百万/活到九十/考上清华）；本族腿①必须是**说话人
 *     身边的个例指称**且结局不限成功类（治好了/就过了/身体倍儿棒/
 *     过得幸福都算），腿②覆盖领域否定结论（不致癌/不害人/是浪费钱）
 *     与推及行动（你照做就行/你试试）。两维在「中大奖×能发财」
 *     一类样本上重叠（该条 SB 先判 verify，本维同判不冲突）。
 *   · hasty_generalization 管**推理形式**的以偏概全（要「几个例子
 *     就说明」这类显式概括桥或 all/everyone 量化形），本族没有桥词，
 *     是个例与领域结论的直接并置。实测本族样本 0 条命中 hg。
 *   · confidence / unsupported_claim / vagueness 管断言强度与模糊性，
 *     本族要件是**个例在场**，与依据类型无关。
 *
 * 为什么现有维度拦不住（discriminate() 逐条零命中实测 + 归因）：
 *   「身边个例指称 × 具体结局 × 领域级结论」三要素里，腿①的熟人指称
 *   只在 anecdote_as_proof 出现但它的 A2 够不到领域否定；腿②的领域
 *   否定结论（不致癌/不害人/是浪费钱/根本不用）在所有维度零覆盖；
 *   SB 的 SURVIVOR 表不收「当老板/治好了/就过了/身体倍儿棒/幸福」
 *   这类非典型成功结局。整族射程外，不是某个维度正则弱。
 *
 * 判据（双腿共现，缺一不判）：
 *   · 腿① CASE 个例在场 = 个例指称（我+关系词/我认识的/我老家/
 *     我闺蜜的老公；EN：my uncle/a guy I know/my hometown）× 具体
 *     结局（活到九十/月入十万/当老板/身体倍儿棒/治好了/就过了/
 *     上清华/过得幸福/中大奖；EN：lived to 92/became a boss/was
 *     cured/aced the exam）。**结局是泛化的触发物**——只有指称没有
 *     结局的是意见转述（「我朋友说这本书没用」是转述不是泛化），
 *     刻意不判；
 *   · 腿② CONCLUSION 领域结论三类任中一类：
 *     a 否定领域公认事实（烟酒根本不致癌/读书没用/游戏不害人/
 *        体检是浪费钱/这考试根本不用复习）；
 *     b 正面领域定性（外卖很健康/买彩票能发财）；
 *     c 推及听者行动或规范（你照做就行/你试试/彩礼必须多要）；
 *   · 单有个案不判：「他考上了清华，这是他个人多年努力的结果」
 *     是个案归因陈述；单有结论不判：「外卖都不健康」无个案腿。
 *
 * 为什么取 VERIFY 级：单句可能是小说对白/偏见案例引述/逻辑课反面
 * 教材/社会学讨论中的转述（「有种说法说我邻居…」），rewrite/block
 * 会误伤（与 r672-r707 全部评价/胁迫族同口径）。verify 的含义是
 * 「这个领域结论建立在样本量为一的个例上，需要补总体数据」——
 * 调用方应要求给出该领域的统计证据再采信。
 *
 * 明确不判的（豁免——保留语、统计陈述与转述限定在场）：
 *   · 保留语/自我限定：这只是孤例/那是个例/不能代表总体/仅供
 *     参考/不一定适合你/我的个人经验（this is just my personal
 *     experience / may not suit you / an isolated case）；
 *   · 统计与概率陈述：统计/概率/大样本/样本量/中位数/期望收益/
 *     存活率/对照组（statistically / odds / sample size / median /
 *     expected value）——正是反驳本族的标准句式；
 *   · 意见转述与具体对象评价：我朋友说这本书没用/我同事认为这个
 *     方案不靠谱（无具体结局腿，属转述）；
 *   · 概念分析：个例泛化是一种常见的逻辑谬误 / Drawing a general
 *     conclusion from a single case is a hasty generalization.
 */
'use strict';

// ─── 腿①-1 CASE 个例指称（中文：说话人身边的个例来源）────────────
// 只收第一人称身边的个例——名人/陌生人/具体人物归 survivorship_bias。
const REF_ZH = new RegExp([
  // 我+关系名词（含亲属、社交关系、职场关系）
  '(?:我|我们)(?:的)?(?:一个|一位|好几个|几个)?(?:邻居|朋友|同学|同事|亲戚|舅舅|大舅|二舅|三舅|小舅|姑姑|姑妈|姨妈|叔叔|阿姨|表哥|表姐|表妹|表弟|堂哥|堂姐|堂妹|堂弟|老乡|熟人|哥们|兄弟|闺蜜|师弟|师妹|客户|患者|室友|房东|发小|晚辈|长辈|老人|孩子|儿子|女儿|爸爸|妈妈|父亲|母亲|爷爷|奶奶|外公|外婆|婆婆|岳父|岳母|姐夫|妹夫|嫂子|弟媳)',
  // 我认识的/见过的/听说过的 + 人
  '(?:我|我们)(?:认识|见过|听说过|接触过|带过|共事过|合作过)的(?:一个|一位)?(?:人|家伙|老板|医生|患者|老人|孩子)',
  // 我老家/村里/小区/隔壁 + 人
  '(?:我|我们)(?:老家|家乡|村里|小区|隔壁|街坊|屯里|庄里)(?:的)?(?:老人|孩子|邻居|一个人|亲戚|亲戚家|人家)',
  // 我闺蜜/兄弟/发小/同学/同事 + 的老公/老婆/男朋友/女朋友
  '(?:我|我们)(?:闺蜜|兄弟|发小|同学|同事|朋友|邻居)(?:的)?(?:老公|老婆|丈夫|妻子|男朋友|女朋友|对象|爱人)',
  // 我们家/我们村/我们小区
  '(?:我们)(?:家|村|小区|楼|隔壁|屯|庄)(?:的)?',
].join('|'));

// 英文：my uncle / a guy I know / my hometown / my friend's husband。
const REF_EN = new RegExp([
  // my + 关系名词（含所有格与复数）
  "\\bmy\\s+(?:neighbou?r|neighbou?rs|friend|friends|classmate|classmates|co-?workers?|colleagues?|uncle|uncles|aunt|aunts|cousin|cousins|brother|sister|relative|relatives|roommate|landlord|buddy|pal|grandpa|grandma|grandfather|grandmother|mom|dad|mother|father|in-laws?)\\b",
  // my + 人的 + 配偶（my friend's husband / my aunt's husband）
  "\\bmy\\s+\\w+(?:'s|s')\\s+(?:husband|wife|boyfriend|girlfriend|spouse|partner)\\b",
  // my hometown / my village / my grandparents
  "\\bmy\\s+(?:hometown|home\\s+town|village|grandparents|neighbou?rhood)\\b",
  // a guy/person I know / someone I know
  "\\b(?:a|one)\\s+(?:guy|man|woman|person|friend|neighbou?r|colleague)\\s+i\\s+know\\b",
  "\\b(?:someone|somebody)\\s+i\\s+know\\b",
  // one of my friends / a friend of mine
  "\\b(?:one|some|a\\s+few)\\s+of\\s+my\\s+(?:friends?|relatives?|neighbou?rs?|co-?workers?|colleagues?|cousins?)\\b",
].join('|'), 'i');

// ─── 腿①-2 OUTCOME 具体结局（中文：个例身上观察到的结果）──────────
// 只收「 favorable/neutral 观察结局」——出问题/吃亏/被骗不在表内
// （那类结局推出的通常是有依据的否定，不是泛化）。
const OUTCOME_ZH = new RegExp([
  // 活到高龄（活到九十/活到九十八/活到一百）
  '活到(?:了)?(?:\\d{2,3}|九|八|一百|九十|九十八|九十九|八十|七十|六十|一百多)(?:岁|高龄)?',
  // 收入成功（月入十万/年薪百万/赚了大钱）
  '(?:月入|年薪|年入|日入)(?:过)?(?:\\d+|十|百|千|几|十几)?(?:万|块|元|k|K)',
  '(?:赚|挣)(?:了|到|过)(?:大?钱|不少钱|很多钱|第一桶金|几百万|上百万)',
  // 身份翻身（当老板/当上经理/做成老板）
  '当(?:了|上|成)?(?:老板|富翁|富豪|大款|经理|总裁|首富|企业家|大老板|小老板)',
  // 身体状态好（身体倍儿棒/从没生过病）
  '身体(?:倍儿棒|一直?很?好|很棒|特好|好得很|没毛病|没出过问题|硬朗|结实)',
  '(?:从来|一直|从没|从未)?(?:不|没)(?:生过|得过大?)病',
  // 治好/缓解（治好了痛经/痊愈）
  '(?:治好|治愈|治好|缓解|自愈|康复)了?',
  // 考试通过（就过了/考上了/上岸）
  '(?:就|也|照样|轻轻松松)?(?:过|过了|通过|考上|上岸|及格|高分)(?:了|过)?',
  // 上名校（上清华/考上北大/进了重点）
  '上(?:了)?(?:清华|北大|名校|重点|985|211|双一流)',
  // 生活状态（过得幸福/过得好/滋润）
  '(?:过|生活|过得|才)(?:得)?(?:很|挺|特别)?(?:幸福|美满|滋润|安稳|舒坦|不错)',
  // 中奖（中了五百万/中了大奖）
  '中(?:了|个)?(?:五百万|大奖|头奖|彩票)',
  // 学历跳级（没上大学/没读大学/辍学）
  '(?:没|未|不)(?:上过|读过|念过|上|读)(?:大学|名校|高中|初中)',
].join('|'));

// 英文：lived to 92 / made 100k a month / became a boss / was cured /
// aced the exam / got into Tsinghua / are happy / won the lottery。
const OUTCOME_EN = new RegExp([
  // 活到高龄
  "\\blived\\s+to\\s+(?:\\d{2,3}|a\\s+hundred|ninety|ninety-?two|ninety-?eight)\\b",
  // 收入成功（makes/made 100k a month / earns six figures）
  "\\b(?:makes?|made|earning|earns?|makes\\s+up\\s+to)\\s+(?:\\d+k|\\d{2,3}k|six\\s+figures|seven\\s+figures|a\\s+million|100k|10k)\\s+(?:a|per|each)\\s+(?:month|year|week)\\b",
  "\\b(?:makes?|made|earns?|earned)\\s+(?:a\\s+)?(?:fortune|millions|six\\s+figures)\\b",
  // 身份翻身（became a boss / became an owner / runs a company）
  "\\b(?:became|become|is|was)\\s+(?:a\\s+)?(?:boss|owner|manager|entrepreneur|founder|ceo)\\b",
  // 身体状态好（is perfectly fine / feels great / never gets sick）
  "\\b(?:is|are|feels?|felt)\\s+(?:perfectly\\s+|totally\\s+|completely\\s+)?(?:fine|healthy|fit|great|well)\\b",
  "\\bnever\\s+(?:gets?|got|had)\\s+(?:sick|ill|a\\s+checkup|a\\s+physical)\\b",
  // 治好/缓解（was cured / healed / recovered）
  "\\b(?:was\\s+|got\\s+)?(?:cured|healed|fully\\s+recovered|fixed)\\b",
  // 考试通过（aced the exam / passed / got a high score）
  "\\b(?:aced|passed|passed\\s+with\\s+flying\\s+colors|nailed)\\s+(?:the\\s+)?(?:exam|test|interview|course)\\b",
  "\\bpassed\\s+(?:the\\s+)?(?:exam|test)\\b",
  // 上名校（got into Tsinghua / got into Harvard）
  "\\bgot\\s+(?:in)?to\\s+(?:tsinghua|peking\\s+university|mit|harvard|stanford|a\\s+top\\s+school|an\\s+ivy)\\b",
  // 生活状态（are happy / live happily）
  "\\b(?:are|is|live|lived)\\s+(?:very\\s+|really\\s+|perfectly\\s+)?(?:happy|happily|content|well-?off)\\b",
  // 中奖（won the lottery / won the jackpot）
  "\\bwon\\s+(?:the\\s+)?(?:lottery|jackpot|big\\s+prize)\\b",
  // 学历跳级（never went to college / dropped out）
  "\\b(?:never|did\\s?n[o']?t)\\s+(?:go\\s+to|attend|finish|graduate\\s+from)\\s+(?:college|university|school)\\b",
].join('|'), 'i');

// ─── 腿②-1 CONCLUSION-a 否定领域公认事实（中文）────────────────────
// 领域名词表 = 民间智慧高频域（健康/教育/财富/生活方式四类）。
// 「X 根本不致癌」「读书没用」「体检是浪费钱」「根本不用复习」。
const DOMAIN_ZH = '(?:烟|酒|烟酒|吸烟|喝酒|外卖|游戏|彩票|体检|检查|读书|上学|上大学|读大学|考研|考公|补习班|补课|奥数|彩礼|嫁妆|减肥|健身|跑步|游泳|瑜伽|熬夜|加班|咖啡|奶茶|防晒|疫苗|保险|手机|短视频|直播|辞职|创业|买房|炒股|基金|理财|保健品|按摩|针灸|艾灸|中药|西药|偏方|食疗|排毒|养生|酵素|胶原蛋白|燕窝|虫草|人参|蜂蜜|红糖|生姜|大蒜|柠檬|醋|红酒|枸杞|红枣|阿胶|考试|测验|竞赛|留学|移民|结婚|生孩子|二胎|三胎|糖|盐|油|辣|凉|茶|饮料|甜食|烧烤|腌制品|槟榔|酒桌|应酬|送礼|人情)';

const NEG_ZH = new RegExp([
  // a1 领域词 + [强调] + 否定 + 被否定属性（烟酒根本不致癌/读书没用/游戏不害人）
  DOMAIN_ZH + '[^。，！？]{0,6}(?:根本|压根|完全|简直|一点儿|压根儿|绝对)?(?:不|没|谈不上|算不上)(?:致癌|有害|害人|有用|必要|值得|靠谱|管用|健康|安全|需要|用得着|顶用|中用|靠谱|管)',
  // a2 领域词 + 是/算是 + 浪费/白费 + 宾语（体检是浪费钱/补习是浪费生命）
  DOMAIN_ZH + '[^。，！？]{0,4}(?:是|算是|就是|纯粹是|简直是)(?:浪费|白费|白瞎|白花)(?:钱|时间|命|生命|精力|感情|学费)',
  // a3 领域词 + 根本/压根 + 不用 + 行动（这考试根本不用复习/体检根本不用做）
  DOMAIN_ZH + '[^。，！？]{0,4}(?:根本|压根|完全|简直)?不用(?:复习|体检|检查|在意|担心|管|买|交|办|请|带|送|陪|催|等|看)',
  // a4 领域词 + 没 + 必要/意义/价值（读书没意义/加班没价值）
  DOMAIN_ZH + '[^。，！？]{0,4}(?:没|没有|无)(?:任何)?(?:必要|意义|价值|用处|用)',
].join('|'));

// 英文：education is pointless / takeout is healthy / does not require
// preparation / checkups are a waste of money / games are not harmful。
const NEG_EN = new RegExp([
  // b1 领域词 + is/are + 否定属性（college is pointless / is useless / a waste）
  "\\b(?:college|university|school|education|degree|studying|homework|exams?|tests?|checkups?|screenings?|insurance|vaccines?|medicine|doctors?|exercise|gym|sleep|vegetables?|fruit|water|vitamins?)\\b[^.]{0,20}\\b(?:is|are)\\b[^.]{0,15}\\b(?:pointless|useless|unnecessary|overrated|a\\s+waste|not\\s+worth|no\\s+use|no\\s+point)\\b",
  // b2 领域词 + are/is + not/no + 危害属性（video games are not harmful / alcohol is not dangerous）
  "\\b(?:video\\sgames?|games?|gaming|smoking|cigarettes?|cigarette|alcohol|drinking|takeout|fast\\sfood|sugar|coffee|lottery|gambling|salt|msg|social\\smedia|screens?)\\b(?:\\s+and\\s+(?:video\\sgames?|games?|gaming|smoking|cigarettes?|cigarette|alcohol|drinking|takeout|fast\\sfood|sugar|coffee|lottery|gambling|salt|msg|social\\smedia|screens?))*\\s+(?:are|is)\\s+(?:not|no)\\s+(?:harmful|dangerous|carcinogenic|cancer-causing|addictive|bad|toxic|unhealthy|risky)\\b",
  // b3 领域词 + are/is + 危害属性直接否定形（alcohol and cigarettes are not carcinogenic 的并列主语形）
  "\\b(?:cigarettes?|cigarette|alcohol|smoking|drinking|tobacco)\\b[^.]{0,25}\\b(?:are|is)\\b[^.]{0,10}\\b(?:not|no)\\b[^.]{0,15}\\b(?:carcinogenic|harmful|dangerous|cancer)\\b",
  // b4 does not / don't + require/need + 准备类名词（does not require any preparation）
  "\\b(?:does\\s+not|doesn'?t|do\\s+not|don'?t)\\b[^.]{0,15}\\b(?:require|need)\\b[^.]{0,15}\\b(?:any|much|real)?\\s?(?:preparation|preparing|studying|practice|effort|training|revision)\\b",
  // b5 领域词 + are/is + a waste of（health checkups are a waste of money）
  "\\b(?:checkups?|screenings?|exams?|college|education|insurance|the\\sgym|exercise)\\b\\s+(?:are|is)\\s+(?:a\\swaste|pointless|useless|unnecessary|overrated)\\b",
].join('|'), 'i');

// ─── 腿②-2 CONCLUSION-b 正面领域定性（中文）───────────────────────
const POS_ZH = new RegExp([
  // 领域词 + 程度 + 正面属性（外卖很健康/游戏挺安全）
  DOMAIN_ZH + '[^。，！？]{0,4}(?:很|真|挺|特别|相当|超级|巨|老)?(?:健康|安全|靠谱|管用|有效|绿色|纯天然|无害|有益)',
  // 领域词 + 能/可以/准 + 致富动词（买彩票能发财/炒股能赚钱）
  '(?:买|玩|炒|买进)?' + DOMAIN_ZH + '[^。，！？]{0,4}(?:能|可以|准|一定|必定)(?:发财|赚钱|挣钱|致富|财富自由|翻身)',
].join('|'));

// 英文：takeout is healthy / the lottery can make you rich / gaming is fine。
const POS_EN = new RegExp([
  // 领域词 + is/are + 正面属性
  "\\b(?:takeout|take-?out|fast\\sfood|video\\sgames?|gaming|sugar|coffee|lottery|gambling|chocolate|red\\swine|cheese|carbs)\\b\\s+(?:is|are)\\s+(?:very\\s+|really\\s+|perfectly\\s+|totally\\s+|actually\\s+)?(?:healthy|safe|fine|good|harmless|beneficial)\\b",
  // 领域词 + can/will + 致富（buying the lottery can make you rich）
  "\\b(?:buying|playing|the)\\s+(?:lottery|gambling|stocks?|crypto)\\b[^.]{0,15}\\b(?:can|will|is\\s+going\\s+to)\\b[^.]{0,15}\\b(?:make\\s+you\\s+rich|pay\\s+off|get\\s+you\\s+rich|make\\s+millions)\\b",
].join('|'), 'i');

// ─── 腿②-3 CONCLUSION-c 推及听者行动或规范（中文）─────────────────
const PUSH_ZH = new RegExp([
  // 你/您 + 照做/照抄/照搬/试试/跟着（你照做就行/你试试/跟着做就行）
  '(?:你|您)?(?:也|就|也)?(?:照做|照抄|照搬|试试|一试|跟着|跟上|安排上|用起来|买起来|吃起来|喝起来|玩起来)(?:一下|试试|看)?(?:就行|也好|就好|没错|准没错)?',
  // 必须/一定要/得/该 + 多/早/赶紧 + 要/买/给（彩礼必须多要/必须多给）
  '(?:必须|一定要|得|应该|该|务必)(?:多|尽|早点|尽早|赶紧|马上|尽量)?(?:要|买|给|收|存|准备|送|随)',
].join('|'));

// 英文：just copy him / you should try it / the bride price must be high。
const PUSH_EN = new RegExp([
  // just + copy/do/follow/try + him/her/it/them（just copy him）
  "\\b(?:just\\s+)?(?:copy|do|follow|try|emulate|do\\s+what)\\s+(?:him|her|it|them|what\\s+\\w+\\s+did|the\\s+same)\\b",
  // you should/could/ought to + try/copy/do/use/follow
  "\\byou\\s+(?:should|could|ought\\s+to|might\\s+as\\s+well)\\s+(?:try|copy|do|use|follow|give\\s+it\\s+a\\s+go)\\b",
  // the + 名词 + must/has to be + 高/大（the bride price must be high）
  "\\bthe\\s+\\w+(?:\\s+\\w+)?\\s+(?:must|has\\s+to|have\\s+to)\\s+be\\s+(?:high|big|more|larger)\\b",
].join('|'), 'i');

// ─── 豁免：保留语/统计陈述/转述限定在场 ────────────────────────────
const HEDGE_ZH = new RegExp([
  // 保留语与自我限定
  '(?:这|那|只)(?:是|算是|不过是|仅仅是)(?:个|一)(?:例|案例|特例|例外|孤例|孤证|个案)',
  '(?:只是|仅是)(?:我|我们)?(?:的)?(?:个人|个体|单个|单独)(?:体验|经验|经历|感受|案例|个例|情况)',
  '(?:仅|只)(?:代|表)(?:我|我们)(?:个人|自己|本人)',
  '(?:不能|无法|不宜|不应)(?:推广|外推|泛化|代表|说明|证明)(?:到|至|开去|整体|别人|所有人|普遍|什么|任何)?',
  '(?:不|未)(?:作|算)(?:普遍|一般|通)?(?:结论|数|准)',
  '(?:仅供|只供|仅供参考|供你参考|供参考|仅供参考)',
  '(?:不一定|未必|不见得)(?:适合|适用|代表)',
  '(?:以|按|凭)(?:你的|具体|个人)(?:情况|身体状况|实际)(?:而|来)(?:定|说|判断)',
  '(?:亲|请|你)(?:自行|自己)(?:判断|斟酌)',
  // 统计与概率陈述（正是反驳本族的标准句式）
  '(?:统计|概率|大样本|样本量|中位数|平均数|期望收益|存活率|成功率|基数|对照组|双盲|随机|置信区间|显著性|相关性|因果)',
  '(?:大多数|多数|绝大部分|大部分|极少数|少数|罕见|小概率)',
  '(?:不具代表性|不代表总体|不能代表总体|无法代表总体|孤证不立|单体样本)',
  // 概念分析（个例泛化是一种常见的逻辑谬误）
  '(?:这|那就是|这就是|这正是|那正是|属于|属于一种|正是|即是)(?:一种|典型的|常见的|经典的|明显的|标准的)?(?:个例泛化|以偏概全|轻率概括|草率概括|仓促概括|轶事证据|个例论证)',
  '(?:个例泛化|以偏概全|轻率概括|草率概括|仓促概括|轶事证据|个例论证|幸存者偏差)(?:是|属于|是一种|正是|属于|属于一种)(?:一种|典型的|常见的|经典的|明显的|标准的)?(?:谬误|谬说|逻辑错误|逻辑谬误|错误论证|非形式谬误|话术|手法|手段|策略|伎俩|套路|现象|问题|错误|陷阱|偏差|认知偏误)',
].join('|'));

const HEDGE_EN = new RegExp([
  // 保留语与自我限定
  "\\b(?:this|that|it)\\s+is\\s+(?:just|only|merely)\\s+(?:an?\\s+)?(?:isolated|single|anecdotal|personal|one-?off)\\b",
  "\\b(?:an?\\s+)?(?:isolated|single|one-?off)\\s+(?:case|instance|example|story)\\b",
  "\\b(?:just|only)\\s+my\\s+(?:personal|own|individual)\\s+(?:experience|case|story)\\b",
  "\\b(?:may|might)\\s+not\\s+(?:suit|apply|work)\\b",
  "\\bfor\\s+(?:your|reference)\\b|\\bfor\\s+reference\\s+only\\b",
  // 统计与概率陈述
  "\\b(?:statistically|statistics|probability|odds|sample\\s+size|median|average|expected\\s+value|base\\s+rate|control\\s+group|clinical|significant|correlation|causation|survival\\s+rate)\\b",
  "\\b(?:the\\s+)?(?:vast\\s+)?(?:majority|most)\\b|\\b(?:a\\s+)?(?:small\\s+)?minority\\b|\\brare\\b",
  "\\b(?:not|isn'?t|aren'?t)\\s+(?:representative|generalizable|conclusive)\\b",
  "\\bcannot\\s+be\\s+(?:generalized|extrapolated|representative)\\b",
  // 概念分析
  "\\b(?:hasty|anecdotal)\\s+(?:generalization|generalisation)\\b",
  "\\b(?:is|are|called?|committing\\s+an?)\\s+(?:a\\s+)?(?:hasty|anecdotal|faulty)\\s+(?:generalization|generalisation|reasoning)\\b",
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以永不匹配串替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkAnecdotal(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const REF_ZH_ = R.REF_ZH || REF_ZH;
  const REF_EN_ = R.REF_EN || REF_EN;
  const OUT_ZH_ = R.OUTCOME_ZH || OUTCOME_ZH;
  const OUT_EN_ = R.OUTCOME_EN || OUTCOME_EN;
  const NEG_ZH_ = R.NEG_ZH || NEG_ZH;
  const NEG_EN_ = R.NEG_EN || NEG_EN;
  const POS_ZH_ = R.POS_ZH || POS_ZH;
  const POS_EN_ = R.POS_EN || POS_EN;
  const PUSH_ZH_ = R.PUSH_ZH || PUSH_ZH;
  const PUSH_EN_ = R.PUSH_EN || PUSH_EN;
  const HEDGE_ZH_ = R.HEDGE_ZH || HEDGE_ZH;
  const HEDGE_EN_ = R.HEDGE_EN || HEDGE_EN;

  // 保留语/统计陈述/转述限定/概念分析在场 → 不是运用它
  if (HEDGE_ZH_.test(text) || HEDGE_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 腿①：个例指称 × 具体结局（缺一不判——无结局的是意见转述）
  const refZh = REF_ZH_.test(text);
  const refEn = REF_EN_.test(text);
  if (!refZh && !refEn) return { hit: false, score: 0, detail: '', count: 0 };
  const outZh = OUT_ZH_.test(text);
  const outEn = OUT_EN_.test(text);
  if (!outZh && !outEn) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿②：领域结论三类任中一类
  const neg = NEG_ZH_.test(text) || NEG_EN_.test(text);
  if (neg) {
    return {
      hit: true,
      score: 0.5,
      count: 1,
      detail: isZh ? '个例泛化×身边个例×领域否定结论(zh)' : 'anecdotal×personal-case×domain-negation(en)',
    };
  }
  const pos = POS_ZH_.test(text) || POS_EN_.test(text);
  if (pos) {
    return {
      hit: true,
      score: 0.5,
      count: 1,
      detail: isZh ? '个例泛化×身边个例×领域正面定性(zh)' : 'anecdotal×personal-case×domain-affirmation(en)',
    };
  }
  const push = PUSH_ZH_.test(text) || PUSH_EN_.test(text);
  if (push) {
    return {
      hit: true,
      score: 0.5,
      count: 1,
      detail: isZh ? '个例泛化×身边个例×推及听者行动(zh)' : 'anecdotal×personal-case×listener-push(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkAnecdotal,
  __internals: () => ({
    REF_ZH, REF_EN, OUTCOME_ZH, OUTCOME_EN,
    NEG_ZH, NEG_EN, POS_ZH, POS_EN, PUSH_ZH, PUSH_EN,
    HEDGE_ZH, HEDGE_EN,
  }),
};
