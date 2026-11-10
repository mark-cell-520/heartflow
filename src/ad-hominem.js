/**
 * src/ad-hominem.js — 「人身攻击」检测器（第 243 个判别维度）
 *
 * [r284 立项] 来源真源：Jin et al. 2022 "Logical Fallacy Detection"
 * （Findings of EMNLP 2022，arXiv 2202.13758）LOGIC 数据集 13 类谬误。
 * 与心虫现有 242 个 dimMap 键做差集（scripts 实跑 src/index.js 源码文本
 * 解析），13 类中唯一没有独立维度的攻击族是 ad hominem（人身攻击）：
 * 此前仅作为 fallacies 维度的子标签存在（src/index.js fallacies 紧凑形
 * 内 3 条窄正则），不承重 gate.action。
 *
 * 辨别的族：「人身攻击」（ad hominem / argumentum ad hominem /
 * attacking the person）——**不对论点本身作答，转而攻击提出论点的人
 * （人格、出身、身份、动机、能力、阵营）**，并以此为据暗示其观点不值
 * 一驳：
 *   他是个骗子，所以他说的关于气候的数据全是假的。
 *   她一个女司机，懂什么车。
 *   你又不是这个专业的，没资格评论。
 *   他爸是开矿的，当然希望污染数据好看。
 *   这种仇富的人说的话也能信？
 *   He's a known liar, so his data on climate change is worthless.
 *   She's just a hobbyist, what does she know about engineering.
 *   Of course he'd say that — he's paid by the oil industry.
 *
 * 与既有维度的边界（差集后逐族实测归因）：
 *   · poisoning_the_well（第 134 维度，井里投毒）管**预先污名化 +
 *     拒绝采信**（别听他的/他别有用心），本族是**攻击者身份标签在场
 *     时对内容的连带否定**——腿①是身份/品格/能力/阵营贬损而非
 *     「拒绝听他讲」这个动作；腿②是对**具体论点/数据/结论**的否定
 *     （所以是假的/不可信/毫无价值）而非拒绝采信这个人的整体发言。
 *     实测重叠区：「他是个骗子，所以他的数据不可信」 poisoning_the_well
 *     的腿②要求拒绝采信动词（别信/不用看），本族腿②接受「数据是假的」
 *     这类内容否定形，两维可同时命中（不同射程，符合 r698 同族
 *     并存先例）。
 *   · genetic_fallacy（第 131 维度，起源谬误）管**来源-质量推断**
 *     （年轻人提的所以不成熟/大公司做的所以不行），本族腿①可含
 *     人格与品格攻击（骗子/无耻/双标/没诚信），不限于来源。
 *   · tu_quoque（第 141 维度，你也一样）管**以对方同样过错回避**
 *     （你也抽烟凭什么说我），本族是单向攻击对方品格/身份。
 *   · victim_blaming 管受害者归责；stereotype 管群体身份泛化。
 *   · fallacies 子标签仅有 3 条窄正则（src/index.js fallacies 紧凑形），
 *     不收本族绝大多数句式。
 *
 * 判据（两腿共现 + 豁免表，缺一不判）：
 *   · 腿① ATTACK 对说话者的人身贬损（六类任中一类）：
 *     a 品格攻击（骗子/撒谎/不诚实/无耻/双标/伪善/投机/钻营/口是心非/
 *         居心不良/人品有问题/道德败坏/底子不干净/手脚不干净……）；
 *     b 身份/出身贬低（一个女人/一个年轻人/老百姓/外行/业余的/小人物/
 *         无名之辈/乡下人/暴发户/富二代/官二代/科班/非科班……）；
 *     c 能力/资历否定（不是这个专业的/没学过/没资格/不懂装懂/半瓶水/
 *         非专业/外行指导内行/你行你上……）；
 *     d 阵营/利益归因（既得利益者/被收买/拿钱的/五毛/美分/水军/
 *         代言人/喉舌/屁股决定脑袋/立场先行……）；
 *     e 动机揣测（别有用心/为了出名/想红/蹭热度/带节奏/刷存在感……）；
 *     f 群体污名连带（这种人/这号人/那帮人/那伙人/那类人……）。
 *   · 腿② DISREGARD 对论点/数据/结论的连带否定（三类任中一类）：
 *     a 内容作废（所以是假的/全不可信/毫无价值/不值一驳/一驳不值/
 *         纯属胡扯/一派胡言/胡说八道/站不住脚/完全错误/根本不是
 *         那么回事……）；
 *     b 内容否定疑问式（也能信？/可信吗？/有什么说服力？/谁信？/
 *         能说明什么？）；
 *     c 观点轻蔑（不过是/无非是/只不过是一孔之见/不足为凭/
 *         不必当真/当笑话听……）。
 *   · 单有攻击不判：「他确实有偏见，但他的论证逻辑是自洽的」——那
 *     是对人的客观评价，无内容否定腿。
 *   · 单有内容否定不判：「这个数据是编的」——无腿①人身攻击在场。
 *
 * 为什么取 VERIFY 级：单句可能是小说对白/偏见案例引述/沟通课反面
 * 教材/公共人物批评转述/新闻评论，rewrite 会误伤（与 r672-r697 全部
 * 评价/胁迫族同口径）。verify 的含义是「这段以人身攻击取代表面论证
 * 需要复核」——调用方应要求回到论点本身再评估。
 *
 * 明确不判的（豁免——这些是正当的品格质疑、事实提醒与概念分析）：
 *   · 品格即事实相关：讨论对象本身就是品格/诚信问题（他是个骗子/
 *     他这个人不诚实）且**无内容否定腿**——单纯陈述对人的评价不是
 *     以人废言（腿②不命中即不判，此为结构性豁免）；
 *   · 反诈安全提醒：文本含具体危险内容词（密码/验证码/转账/汇款/
 *     链接/中奖/刷单/身份证号/钓鱼/木马）时——「他是冒充客服的骗子，
 *     别转账」是正当防骗，否定对象是陌生请求不是论点；
 *   · 法律/纪律程序转述（受贿/渎职/贪污/判刑/起诉/处分/开除/调查/
 *     通缉/涉嫌犯罪）——有事实程序支撑的品格陈述不是人身攻击，
 *     是对已确认违法事实的援引；
 *   · 概念/教学转述（人身攻击是一种谬误/识别 ad hominem/诉诸人身
 *     是逻辑错误）；
 *   · 自嘲与自愿担责（我是个外行/我不懂/我水平有限）——攻击对象是
 *     说话者自己且无内容否定腿。
 */
'use strict';

// ─── 腿① ATTACK 人身贬损（六类合并）────────────────────────────
// 中文六支：a 品格 / b 身份出身 / c 能力资历 / d 阵营利益 / e 动机 / f 群体连带。
// r161 教训：枚举腿必须收裸名词形态（「骗子」「外行」去掉任何后缀仍命中）。
const ATTACK_ZH = new RegExp(
  // a 品格攻击
  '(?:骗子|骗徒|撒谎|说谎|扯谎|不诚实|不老实|言而无信|说话不算数|出尔反尔|口是心非|阳奉阴违' +
  '|无耻|不要脸|不要脸面|没皮没脸|卑劣|卑劣无耻|下作|下三滥|下三滥手法|龌龊|肮脏|恶心|令人作呕' +
  '|双标|双重标准|虚伪|伪善|假装|装腔作势|道貌岸然|伪君子|假正经|演戏|做戏|表演型|戏精|爱演' +
  '|投机|投机分子|钻营|投机钻营|见风使舵|墙头草|随风倒|趋炎附势|攀龙附凤|拍马屁|马屁精|舔狗' +
  '|人品有问题|人品不行|人品不好|人品差|素质低|素质差|没素质|教养差|没教养|家教差|没家教' +
  '|道德败坏|道德有问题|私德有亏|底子不干净|手脚不干净|不干不净|有黑历史|黑历史一堆' +
  '|信誉差|没信誉|口碑差|名声差|声名狼藉|臭名昭著|劣迹斑斑|恶贯满盈|声名败坏' +
  '|(?:口碑|名声|信誉|声望)(?:那么|这么|一向|向来|一直|特别|非常|很|极)?(?:差|不好|糟糕|败坏|臭)' +
  '|满嘴谎言|满口谎言|谎话连篇|撒谎成性|说谎不打草稿|睁眼说瞎话|当面撒谎|习惯性撒谎' +
  '|靠不住|不能托付|信不过他|这人不行|不是东西|混蛋|王八蛋|畜生|贱人|垃圾|废物|烂人' +
  '|阴险|阴毒|心眼坏|心术不正|心怀鬼胎|没安好心|居心不良|用心险恶|另有企图|别有用心' +
  '|小人|伪小人|阴险小人|市侩|庸俗|势利|势利眼|现实|功利|市井)' +
  // b 身份/出身贬低
  '|(?:一个女人|一个女人家|一个男人|一个年轻人|一个小孩|一个孩子|小丫头|黄毛丫头|乳臭未干' +
  '|嘴上没毛|办事不牢|小姑娘|小屁孩|娃娃|新手|菜鸟|小白|萌新' +
  // b2 性别-职业复合形（女司机/男护士/女程序员——以性别+职业贬低，161 轮教训收裸名词）
  '|(?:女|男)(?:司机|护士|程序员|工程师|老师|医生|律师|主播|作者|编剧|导演|球迷|用户|玩家|消费者|买家|读者|观众|发言人|代表)' +
  '|(?:女人|男人|女孩子|男孩子|女的|男的|老娘们|大男人)(?:就|也|只)?(?:是|懂|会|该|能|配)' +
  '|老百姓|平民|平民百姓|底层人|底层|草根|无名之辈|无名小卒|小人物|小角色|路人甲' +
  '|外行|门外汉|非专业|业余的|业余爱好者|爱好者|玩票的|票友|野路子|土法子' +
  '|乡下人|农村人|村里人|土包子|暴发户|富二代|官二代|星二代|拆二代|关系户' +
  '|科班出身|非科班|学院派|书呆子|死读书|读死书)' +
  // c 能力/资历否定
  '|(?:没学过|没受过|没念过|没读过|没文凭|没学历|没资质|没证书|没认证|没执照' +
  '|不是这个专业|不是学这个的|不是搞这个的|专业不对口|跨行|外行说内行|外行指导内行' +
  '|不懂装懂|半懂不懂|半瓶水|一瓶不满半瓶晃|一知半解|略懂|懂点皮毛|皮毛都不懂' +
  '|没资格|哪来的资格|凭什么|也配|哪配|算老几|你算|你能|就凭你|你行你上|你行你来做' +
  '|水平有限|水平不行|能力不够|能力不足|资历不够|资历浅|经验不足|too inexperienced)' +
  // d 阵营/利益归因
  '|(?:既得利益者|既得利益|利益相关方|利益集团|被收买|收买了|拿了钱的|拿钱的|拿钱办事|拿了钱办事|收钱的|收了钱|收人钱财|拿人钱财|替人消灾|替人说话' +
  '|五毛|美分|日杂|水军|洗地的|自带干粮|韭菜|镰刀|资本|资本家|资本方|资本运作' +
  '|代言人|喉舌|传声筒|喇叭|话筒|工具人|棋子|马前卒|打手|爪牙|走狗|鹰犬|帮凶' +
  '|屁股决定脑袋|屁股坐歪|立场先行|立场决定|带立场的|预设立场|有立场|站队|站错边' +
  '|仇富|仇穷|仇官|仇男|仇女|恨国|崇洋|媚外|洋奴|汉奸|卖国贼)' +
  // d2 出身行业 × 利益立场（开矿的/炒房的/搞教培的——出身行业暗示利益偏向）
  '|(?:开矿的|开煤矿的|炒房的|搞房地产的|做教培的|开工厂的|搞金融的|炒股的|开药厂的|搞保险的|开医院的|做建材的|搞工程的|包工头|开发商|中介)' +
  // e 动机揣测
  '|(?:想红|想火|想出名|想上位|想表现|想邀功|想刷|刷存在感|蹭热度|蹭流量|博眼球' +
  '|带节奏|带风向|造势|炒作|营销号|标题党|断章取义|以偏概全|选择性|故意挑|故意黑|故意抹黑' +
  '|为了流量|为了钱|为了利益|为了自己|为自己|替自己|打自己的算盘|打小算盘|算盘打得精' +
  '|别有用心|没安好心|心怀不轨|另有目的|别有目的|不可告人|见不得人|不能说的目的)' +
  // f 群体污名连带
  '|(?:这种人|这号人|那号人|这类人|那类人|这伙人|那伙人|这帮人|那帮人|这般人|那般人' +
  '|他们这种人|他们那伙|那一路的|这一路的|一路货色|一个鼻孔出气|一丘之貉|蛇鼠一窝)'
);

// 英文：a character / b identity / c competence / d affiliation / e motive / f group smear。
const ATTACK_EN = new RegExp(
  // a character
  "\\b(?:a?\\s*(?:known\\s+)?liar|lies?|lying|dishonest|deceitful|deceptive|two-faced|double-faced" +
  "|shameless|brazen|despicable|contemptible|beneath\\s+contempt|vile|sleazy|slimy|slimy" +
  "|hypocrite|hypocritical|sanctimonious|self-righteous|morally\\s+superior|preaching" +
  "|a\\s+fake|phony|fraud|charlatan|con\\s+artist|snake|weasel|rat|backstabber" +
  "|bad\\s+character|poor\\s+character|no\\s+integrity|integrity-free|lacks?\\s+integrity" +
  "|untrustworthy|can'?t\\s+be\\s+trusted|not\\s+credible|has\\s+no\\s+credibility" +
  "|slimy\\s+operator|operates?\\s+in\\s+bad\\s+faith|bad\\s+faith|grifter|shill" +
  "|sociopath|narcissist|psychopath|delusional|unhinged|deranged|crackpot|nutjob|lunatic" +
  "|jerk|asshole|idiot|moron|imbecile|stupid|dumb|clueless|incompetent)\\b" +
  // b identity / origin
  "|\\b(?:just\\s+an?\\s+(?:woman|man|girl|boy|kid|child|amateur|hobbyist|beginner|novice|outsider| nobody)" +
  "|a\\s+mere\\s+(?:woman|man|amateur|hobbyist|beginner|novice|outsider|bystander)" +
  "|(?:a|an)\\s+(?:amateur|hobbyist|dilettante|dabbler|novice|beginner|outsider|layman|layperson|non-?expert|crank|crackpot)\\s+(?:take|opinion|view|argument|analysis|hot\\s+take|piece|thread|video|post|blog|rant|essay|attempt)" +
  "|\\b(?:amateur|hobbyist|dilettante|dabbler)\\s+(?:take|opinion|hot\\s+take|piece|post|video|analysis)\\b" +
  "|\\b(?:take|opinion|view|piece|post|video|analysis|argument|thread|essay)\\s+like\\s+(?:that|this)\\b" +
  "|(?:a|an)\\s+no-name|a\\s+random\\s+(?:guy|person|dude)|some\\s+random\\s+(?:guy|person)" +
  "|a\\s+country\\s+bumpkin|hillbilly|redneck|hick|provincial|unsophisticated|uncultured" +
  "|new\\s+money|nouveau\\s+riche|trust\\s+fund|silver\\s+spoon|nepo\\s+baby|nepotism" +
  "|self-taught|self\\s+taught|no\\s+formal\\s+training|no\\s+degree|uneducated|unlettered" +
  "|not\\s+a\\s+real|not\\s+a\\s+true|not\\s+a\\s+genuine|wannabe|poseur|pretender)\\b" +
  // c competence / credential
  "|\\b(?:not\\s+qualified|unqualified|lacks?\\s+(?:the\\s+)?qualifications?|no\\s+credentials?" +
  "|who\\s+is\\s+(?:he|she)\\s+to|what\\s+does\\s+(?:he|she)\\s+know|what\\s+would\\s+(?:he|she)\\s+know" +
  "|hasn'?t\\s+(?:studied|learned|been\\s+trained)|never\\s+studied|didn'?t\\s+study" +
  "|dilettante|dabbler|amateur\\s+hour|armchair|keyboard\\s+warrior|monday\\s+morning\\s+quarterback" +
  "|out\\s+of\\s+(?:his|her|their)\\s+depth|punching\\s+above|in\\s+over\\s+(?:his|her|their)\\s+head" +
  "|barely\\s+literate|illiterate|functionally\\s+illiterate|stupid\\s+take|smooth\\s+brain)\\b" +
  // d affiliation / interest
  "|\\b(?:bought\\s+and\\s+paid\\s+for|on\\s+the\\s+payroll|in\\s+someone'?s\\s+pocket|paid\\s+shill" +
  "|paid\\s+for\\s+by|funded\\s+by|in\\s+the\\s+pocket\\s+of|speaks?\\s+for|fronts?\\s+for" +
  "|is\\s+paid\\s+by|gets?\\s+paid\\s+by|works?\\s+for|is\\s+funded\\s+by|sponsored\\s+by|in\\s+league\\s+with" +
  "|mouthpiece|puppet|lackey|stooge|shill|tool|useful\\s+idiot|asset" +
  "|vested\\s+interest|conflict\\s+of\\s+interest|has\\s+an?\\s+agenda|agenda-driven" +
  "|shilling\\s+for|astroturf|astroturfer|troll|concern\\s+troll" +
  "|class\\s+traitor|race\\s+traitor|bootlicker|boot\\s+licker|sycophant|toady|suck-up)\\b" +
  // c2 not even a / not a real（否定专业身份）
  "|\\bnot\\s+even\\s+a?n?\\s*[a-z]+(?:ist|er|or|ian|ician|expert|professional|scientist|engineer|doctor|professor|researcher|analyst|economist|statistician|journalist|lawyer|academic)\\b" +
  "|\\b(?:is|are)\\s+(?:not\\s+)?a?\\s*(?:real|true|qualified|credentialed|licensed|accredited)\\s+(?:scientist|engineer|doctor|expert|professional|researcher|analyst|economist|academic|scholar|journalist|statistician)" +
  // e motive
  "|\\b(?:attention\\s+seeking|clout\\s+chasing|chasing\\s+clout|fame\\s+seeking|wants\\s+attention" +
  "|wants\\s+to\\s+go\\s+viral|rags?\\s+to\\s+riches|bandwagon|jumping\\s+on\\s+the\\s+bandwagon" +
  "|profiting\\s+from|cashing\\s+in|monetizing|grifting|milking\\s+it|playing\\s+the\\s+game" +
  "|virtue\\s+signaling|virtue\\s+signal|signaling\\s+virtue|performing\\s+for|performing\\s+care" +
  "|selective\\s+outrage|manufactured\\s+outrage|faux\\s+outrage|concern\\s+trolling)\\b" +
  // f group smear
  "|\\bpeople\\s+like\\s+(?:him|her|them|that)\\b" +
  "|\\b(?:people|folks|types)\\s+(?:like|such\\s+as)\\s+(?:him|her|them|that)\\b" +
  "|\\b(?:his|her|their)\\s+(?:kind|sort|type|ilk)\\b" +
  "|\\bthose\\s+(?:people|types|kinds)|that\\s+(?:crowd|bunch|crew|clique|clan)" +
  "|\\ball\\s+the\\s+same|cut\\s+from\\s+the\\s+same\\s+cloth|birds\\s+of\\s+a\\s+feather" +
  "|\\bone\\s+of\\s+(?:them|those|these)|\\btheir\\s+ilk\\b",
  'i'
);

// ─── 腿② DISREGARD 对内容的连带否定（三类）──────────────────────
// 判据核心：结论落在**论点/数据/结论被作废**，不是对人的单纯评价。
const DISREGARD_ZH = new RegExp(
  // a 内容作废（所以是假的/不可信/毫无价值/胡说八道……）
  '(?:所以是假的|全(?:是|都)?假的|不可信|不能信|信不过|毫无价值|一钱不值|一文不值|一驳不值|不值一驳' +
  '|纯属胡扯|胡扯|一派胡言|胡说八道|胡言乱语|瞎说|乱说|鬼扯|放屁|扯淡' +
  '|站不住脚|完全错误|大错特错|错得离谱|根本错误|根本不是那么回事|完全说不通|毫无道理|没有道理' +
  // a2 内容作废补形（根本不/完全不/完全不值/不成立/造假/不值一驳）
  '|(?:根本|完全|压根|简直|纯粹|压根儿)?(?:不|没)(?:值得|值)(?:一看|一读|一提|一驳|听|信|看)' +
  '|(?:根本|完全|压根|压根儿|简直)?(?:不成立|不适用|不可用|作废|无效|失效|站不住)' +
  '|(?:报告|数据|结论|分析|论证|观点|方案|理论|说法)(?:是)?(?:造假|伪造|篡改|编造|捏造|杜撰|作假)' +
  '|(?:完全|根本|压根|压根儿|压根|简直)?(?:不|没)(?:可靠|靠谱|可信|像话|靠得住)' +
  '|荒谬|荒谬绝伦|可笑至极|荒唐|离谱|不攻自破|一戳就破|一碰就碎|不堪一击' +
  '|骗人的|骗人的鬼话|假话|谎言|谎话连篇|编造的|捏造的|瞎编的|杜撰的' +
  '|数据是假|数据造假|数据不可信|结论是假|结论不可信|论点不成立|论证无效|推理无效' +
  '|当不得真|不可当真|不必当真|别当真|当个笑话|当笑话听|听个乐|笑笑就好|笑笑就过了' +
  '|(?:完全|根本|压根|简直|纯粹|压根儿)?(?:是|算)?(?:错|错的|错的离谱|大错特错)' +
  '|(?:看|读|听)(?:了|过)?(?:也|还)?白(?:看|读|听)|白(?:看|读|听)(?:了|过)?)' +
  // b 内容否定疑问式（也能信？/可信吗？/有什么说服力？）
  '|(?:也|还|居然|竟然|当真)(?:能|可以|配)?信|可信吗|靠得住吗|靠得住' +
  '|(?:懂|会懂)(?:什么|些)(?:车|技术|经济|科学|编程|设计|医学|法律|管理|艺术|文学|历史|哲学|数学|物理|化学|工程|金融|营销|教育|心理|政治)' +
  '|(?:这|那)(?:数据|结论|报告|分析|观点|论证|说法|方案)(?:也|还|居然|竟然|当真)?(?:能|可以|配|敢)(?:信|看|听|用)' +
  '|(?:也|还|居然|竟然|当真|敢)(?:能|可以)?(?:信|当真信|当真)' +
  '|(?:有|有什)(?:什么|啥)(?:说服力|公信力|可信度|价值|意义|分量|份量)' +
  '|(?:谁|哪个)(?:会|能|敢)?信|谁会(?:把它|把这话|把这种)当' +
  '|(?:能|可以)(?:说明|证明|解释)什么|说明(?:了)?什么|算(?:得)?上什么' +
  // c 观点轻蔑（不过是/无非是/一孔之见/不足为凭……）
  '|(?:不过是|无非是|只不过是|仅仅是|就是说到底|说到底)(?:一孔之见|一家之言|片面之词|片面之见|偏见|成见|私货|牢骚|怨言|情绪发泄|情绪输出)' +
  '|(?:不足为凭|不足为训|不足挂齿|何足挂齿|上不得台面|拿不出手|见不得光)' +
  '|(?:当|拿)(?:耳旁风|放屁|废话|空气)' +
  // c2 观点整体作废（他的观点/这套说法 + 作废词，含裸名词形）
  '|(?:他的|她的|对方的|此人的|那套|这套|这种)(?:观点|看法|说法|论点|论据|论证|逻辑|理论|主张|意见|结论|数据|证据|报告|分析)' +
  '(?:全|都|也|根本|完全|简直|纯粹)?(?:是|算|属于)?(?:假的|错|错的|错的离谱|不可信|不能信|不成立|无效|站不住脚|胡说|胡扯|垃圾|废话|屁话|狗屁|一文不值|一钱不值|不值一提|不堪一击|一驳不值|一派胡言|胡说八道)'
);

const DISREGARD_EN = new RegExp(
  // a content invalidation
  "\\b(?:is|are|s|'s)?\\s*(?:completely\\s+|totally\\s+|utterly\\s+|plain\\s+|pure\\s+|just\\s+)?(?:false|wrong|incorrect|invalid|unfounded|baseless|groundless|unsubstantiated|debunked|disproven|discredited)" +
  // a2 连词形（so/therefore/hence + 内容作废；of course he would say that）
  "|\\b(?:so|therefore|thus|hence|which\\s+means|of\\s+course)\\s+(?:his|her|their|this|that|the)\\s*[a-z]*\\s*(?:data|claim|argument|study|research|evidence|conclusion|findings?|analysis|report|opinion|take|view|numbers?|statistics?|paper|work|theory|model|method|approach|proposal)\\b" +
  "|\\bof\\s+course\\s+(?:he|she|they)\\s+(?:would|will|could)\\s+(?:say|think|claim|argue|believe)\\b" +
  "|\\bnever\\s+(?:produces?|produced|delivers?|delivered|comes?\\s+up\\s+with|generates?|generated)\\s+(?:anything\\s+)?(?:credible|reliable|valid|sound|worthwhile|original|useful|meaningful)" +
  "|\\b(?:his|her|their)\\s+(?:analysis|argument|claim|data|report|study|work|take|opinion|view|conclusion|reasoning|logic)\\s+(?:is|are)?\\s*(?:just\\s+|simply\\s+|purely\\s+)?(?:invalid|wrong|false|faulty|flawed|unsound|fallacious|illogical|incoherent|irrelevant|worthless|useless)" +
  "|\\b(?:his|her|their)\\s+(?:data|claim|argument|study|research|evidence|conclusion|findings?)\\s+(?:is|are)\\s+(?:false|wrong|invalid|worthless|garbage|junk|nonsense|meaningless)" +
  "|\\b(?:his|her|their)\\s+(?:data|claim|argument|study|research|evidence|conclusion|findings?)\\s+(?:is|are)?\\s*(?:worthless|useless|garbage|junk|nonsense|meaningless|pointless|invalid|irrelevant)" +
  "|\\bnonsense|rubbish|garbage|baloney|bunkum|claptrap|drivel|hogwash|baloney|bollocks|poppycock|crock" +
  "|\\bcan'?t\\s+(?:be\\s+)?trusted|cannot\\s+be\\s+trusted|not\\s+credible|lacks?\\s+credibility|no\\s+credibility" +
  "|\\bdon'?t\\s+believe|don'?t\\s+buy|nobody\\s+believes|no\\s+one\\s+believes|who\\s+believes|would\\s+anyone\\s+believe" +
  // b rhetorical
  "|\\b(?:and|so)?\\s*(?:we|you|i)\\s+(?:should|are\\s+supposed\\s+to)\\s+(?:believe|trust)\\s+(?:him|her|them)\\b[^.]{0,40}?\\b(?:\\?|!|please|as\\s+if)" +
  "|\\bwhat\\s+does\\s+(?:he|she|they)\\s+know\\b|\\bwho\\s+cares\\s+what\\s+(?:he|she|they)\\s+(?:says?|thinks?|claims?)" +
  "|\\bappeal\\s+to\\s+(?:him|her|them)\\s+as|\\bas\\s+if\\s+(?:he|she|they)\\s+(?:would|could)\\s+know" +
  // c contempt
  "|\\b(?:nothing|not\\s+anything)\\s+(?:more\\s+than|but)\\s+(?:a|an)\\s+(?:joke|laughingstock|farce|circus|clown\\s+show)" +
  "|\\b(?:his|her|their)\\s+(?:opinion|view|take|argument|analysis)\\s+(?:carries?|holds?|deserves?)\\s+(?:no|zero|little)\\s+(?:weight|credence|validity)" +
  "|\\b(?:dismiss|discount|disregard|reject)\\s+(?:his|her|their)\\s+(?:opinion|view|take|argument|analysis|claim|data)" +
  "|\\bnot\\s+worth\\s+(?:considering|listening|responding|engaging|dignifying|a\\s+response)" +
  "|\\b(?:deserves?|deserving|merits?|meriting)\\s+(?:no|zero|little)\\s+(?:response|reply|attention|consideration|credence|weight|rebuttal|answer)" +
  'i'
);

// ─── 豁免一：反诈安全提醒（否定对象是陌生请求不是论点）──────────
const ANTIFRAUD_EXEMPT = /(?:密码|验证码|转账|汇款|打款|银行卡|信用卡|身份证|中奖|刷单|返利|红包链接|陌生链接|陌生来电|钓鱼|木马|恶意软件|勒索|账号被盗|异常登录|password|verification code|wire transfer|bank account|credit card|social security|phishing|malware|ransomware|two-factor|2FA code)/i;

// ─── 豁免二：法律/纪律程序转述（已确认违法事实不是人身攻击）──────
const LEGAL_FACT_EXEMPT = /(?:受贿|受贿罪|渎职|滥用职权|贪污|挪用公款|职务侵占|行贿|索贿|判刑|被判|起诉|被起诉|公诉|立案|侦查|双规|留置|处分|开除党籍|开除公职|罢免|通缉|涉嫌犯罪|犯罪嫌疑|已被抓|被捕|落马|双开|起诉书|判决书|裁定|定罪|bribery|embezzlement|corruption|indicted|convicted|sentenced|arraigned|prosecuted|felony|misdemeanor|guilty plea|found guilty|impeached)/i;

// ─── 豁免三：概念/教学转述（评析人身攻击本身）──────────────────
const META_EXEMPT = /(?:这|那就是|这就是|这正是|那正是|属于|属于一种|称为|所谓|所谓的那种|是一种|这是一种|典型的|常见的|经典的)(?:一种|典型的|常见的|经典的|隐性|常见|典型|明显)?(?:人身攻击|诉诸人身|ad hominem|argumentum ad hominem|ad hominem attack|personal attack)|(?:人身攻击|诉诸人身|ad hominem|personal attack|argumentum ad hominem)(?:是|属于|是一种|正是|属于一种)(?:一种|典型的|常见的|经典的|隐性|常见|典型)?(?:谬误|谬说|逻辑错误|逻辑谬误|错误论证|非形式谬误|话术|手法|手段|策略|伎俩|套路|现象|问题|错误|fallacy|manipulation|tactic|rhetorical technique|form of|symptom of|common)/i;

// ─── 豁免四：自嘲与自愿担责（攻击对象是说话者自己，且请求谅解/纠错）──
const SELF_DEPRECATION_EXEMPT = /(?:我|咱|俺|本人|在下)(?:是|只是个|不过是|一个|就是个|也就一个)?[^。！？；\n]{0,12}(?:外行|门外汉|业余|新手|菜鸟|小白|水平有限|能力有限|不太懂|不懂|不专业|非专业|没学过|初学|入门|新人|生手|手生)[^。！？；\n]{0,20}(?:请|还望|望|恳请|多多|多|尽管|欢迎|欢迎指出|欢迎纠正|欢迎拍砖|包涵|见谅|多包涵|多见谅|指正|赐教|纠错|拍砖|批评|指点|opinions? welcome|correct me|please be gentle|take this with a grain of salt|if I'?m wrong)/i;

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkAdHominem(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const ATTACK_ZH_ = R.ATTACK_ZH || ATTACK_ZH;
  const ATTACK_EN_ = R.ATTACK_EN || ATTACK_EN;
  const DISREGARD_ZH_ = R.DISREGARD_ZH || DISREGARD_ZH;
  const DISREGARD_EN_ = R.DISREGARD_EN || DISREGARD_EN;
  const ANTIFRAUD_EXEMPT_ = R.ANTIFRAUD_EXEMPT || ANTIFRAUD_EXEMPT;
  const LEGAL_FACT_EXEMPT_ = R.LEGAL_FACT_EXEMPT || LEGAL_FACT_EXEMPT;
  const META_EXEMPT_ = R.META_EXEMPT || META_EXEMPT;
  const SELF_DEPRECATION_EXEMPT_ = R.SELF_DEPRECATION_EXEMPT || SELF_DEPRECATION_EXEMPT;

  // 评析这套话术 → 不是运用它
  if (META_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 反诈安全提醒：否定对象是危险请求不是论点
  if (ANTIFRAUD_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 法律/纪律程序转述：有事实程序支撑的品格陈述
  if (LEGAL_FACT_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 自嘲与自愿担责：攻击对象是说话者自己且请求谅解/纠错
  if (SELF_DEPRECATION_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  const attackZh = ATTACK_ZH_.test(text);
  const attackEn = ATTACK_EN_.test(text);
  const disregardZh = DISREGARD_ZH_.test(text);
  const disregardEn = DISREGARD_EN_.test(text);

  // 双腿共现：人身贬损 × 内容连带否定（缺一不判）
  if ((attackZh || attackEn) && (disregardZh || disregardEn)) {
    return {
      hit: true,
      score: 0.55,
      count: 1,
      detail: isZh ? '人身攻击×因人废言(zh)' : 'ad hominem×guilt by character(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkAdHominem,
  __internals: () => ({ ATTACK_ZH, ATTACK_EN, DISREGARD_ZH, DISREGARD_EN, ANTIFRAUD_EXEMPT, LEGAL_FACT_EXEMPT, META_EXEMPT, SELF_DEPRECATION_EXEMPT }),
};
