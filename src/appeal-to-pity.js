/**
 * src/appeal-to-pity.js — 「诉诸怜悯」检测器（第 133 个判别维度）
 *
 * [r695 立项] decision 本体在 132 维引擎上选出（/tmp/decide-run-695.js 读
 * /tmp/decide-opts-695.json，composite_score 0.94 / confidence 0.9 /
 * identity alignment 100%，无拒选）。探测器证据：r695 轮前探针
 * /tmp/round-695-pre-probe2.js（口径修正版——良性误伤=block/rewrite、
 * 真零命中=count-based），落盘 /tmp/hf-scout-695b.txt：攻击漏判 9/10
 * （90%）、良性误伤 0/12、真零命中 8/9。Phase 1.5 同律复核：9 条漏判
 * 样本逐条跑 discriminate()，8 条全维度零命中、1 条仅被 moral_foundations
 * 沾边（count=1 未拦）——射程外缺口成立。
 *
 * 辨别的族：「诉诸怜悯」（appeal to pity / ad misericordiam）——用**自述
 * 的可怜处境**代替论证，**要求对方通融、放弃规则或给予破例照顾**，无视
 * 规则本身是否适用、要求本身是否正当：
 *   我这么可怜，你怎么忍心拒绝我。
 *   我一个人漂泊异乡，这点小忙你都不帮？
 *   我从小父母离异，所以你们必须照顾我。
 *   我身体不好还有心脏病，迟到几分钟怎么了。
 *   我孩子还小，你们扣我工资就是断我们活路。
 *   我这么惨，你批评我就是在欺负弱者。
 *   I have been through so much, you cannot possibly say no to me.
 *   My family will starve if you enforce this rule on me.
 *   我家里条件这么差，这次晋升总该轮到我了。
 *
 * 与既有维度的边界（r695 discriminate() 逐条归因实测）：
 *   · guilt_induction（第 109 维）左腿是**付出与代价标榜**（都是为了你/
 *     操碎了心/当牛做马/把房子卖了），右腿是**情感追讨**（太让我失望/
 *     还有良心吗/凭什么这么对我）——本族左腿是**可怜处境自述**（可怜/
 *     漂泊/离异/疾病/孩子小/条件差/被裁），无任何为对方付出的成分；
 *   · suffering_capital（第 102 维）左腿是**痛苦经历**（吃苦/受罪/委屈/
 *     忍气吞声/吃过的盐），右腿是**顺从推导**（必须听我的/没资格顶嘴/
 *     翅膀硬了）——本族右腿是**通融免责**（忍心拒绝/通融/该轮到/迟到
 *     几分钟怎么了），指向规则豁免不是资格剥夺；
 *   · emotional_manipulation 管情绪施压本身；suffering_contest（第 78 维）
 *     管比惨消诉（取消对方诉求）——本族不取消对方诉求也不索取情感回报，
 *     是**用处境兑换规则豁免**；
 *   · 其余 132 个维度对本族 9 条漏判样本实测全部零命中或仅沾边未拦。
 *
 * 为什么现有维度拦不住（discriminate() 零命中实测 + 归因）：
 *   「可怜处境自述 × 通融免责要求」这组结构在模式库里没有任何一条腿——
 *   guilt 只认付出标榜、suffering 只认受苦动词、manipulation 只认情绪
 *   施压词。这是整族射程外，不是某个维度正则弱。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 腿① PITY 自述可怜处境（第一人称在场，十类）：可怜/惨自述、孤独
 *     漂泊（漂泊异乡/举目无亲/人生地不熟）、家庭不幸（父母离异/单亲）、
 *     疾病身体（身体不好/心脏病/在住院）、孩子拖累（孩子还小/一个人
 *     带孩子）、贫困处境（条件差/手头紧/没收入/吃不上饭）、失业裁员
 *     （被裁员/失业/丢了饭碗）、年纪大、债务缠身，及英文 I have been
 *     through so much / I am all alone / I was laid off / my family will
 *     starve / my child is still little；
 *   · 腿② DEMAND 通融免责要求（三类任中一类）：
 *     a 通融照顾（你怎么忍心拒绝/你都不帮/必须照顾/总该轮到/通融/
 *         网开一面/高抬贵手/放我一马/这点小忙你都不帮）；
 *     b 反问免责与指责（迟到几分钟怎么了/你有没有同情心/你批评我就是
 *         在欺负弱者/于心何忍/连这点要求都不答应）；
 *     c 后果绑架（就是断我们活路/逼得我没法活/让我们怎么活/我只能去死）；
 *     EN 对应（you cannot possibly say no to me / you must help / have
 *         a heart / how could you refuse / we will starve / this will
 *         kill me）。
 *   · 单有处境自述不判：「我一个人漂泊异乡，这里生活成本很高」是处境
 *     陈述，无通融腿；「我身体不好，医生建议我多休息」是医嘱陈述；
 *   · 单有通融要求不判：「这个规定太严了，通融一下」是正常协商，无
 *     自述处境腿。
 *
 * [r702 补族] 口语化通融请求四形 + 处境三类（探测器 /tmp/hf-scout-700.txt
 * 落盘 + /tmp/r702-preprobe.js 复量：攻击漏判 5/10、真零命中 5/5、
 * 误伤 0/12；腿级诊断 /tmp/r702-leg-diag.js 确认五条漏判全部缺在
 * 口语形）：
 *   · DEMAND d 请求放过与不追究（这次就算了吧/你别跟我计较了/
 *     不再追究；EN let it slide this once / do not hold it against
 *     me / leave it be）——原表只收书面通融词（忍心拒绝/网开一面），
 *     整类口语放过请求零覆盖；
 *   · DEMAND e 请求让步（不能让着我一点吗/相让一步/给个台阶下；
 *     EN cannot you let it go just this once）；
 *   · DEMAND f 强行要求形（不行也得行/无论如何都得批/非得…不可；
 *     EN no excuses / like it or not / no matter what）——以处境
 *     压人接受要求，与通融请求同族施压；
 *   · DEMAND g 乞怜祈使（可怜可怜我吧/行行好/发发慈悲；EN have
 *     pity on me / for pity's sake）——带负向上下文守卫（在/被/别
 *     之后的「可怜我」是陈述不是乞怜）；
 *   · PITY 情感挫折（我刚失恋了/感情受挫；EN I just got dumped /
 *     I had a terrible breakup）、家人疾病（我妈住院了/我爸病了；
 *     EN my mom is in the hospital）、无能力自述（我什么都不懂/
 *     我没本事；EN I don't know anything / I have no idea）。
 *   单腿仍不判——「这次就算了吧，大家都很累了」只有放过请求无处境
 *   腿，是正常协调；「我刚失恋了」只有处境无请求，是处境陈述。
 *
 * 为什么取 VERIFY 级：单句可能是**真实求助**（「我病了，想请一天假」
 * 是正当请求）、文学对白、求助帖转述、谈判话术引述。verify 的含义是
 * 「这个请求结构需要复核」——用处境换规则的文本，调用方应核验处境
 * 真实性与规则豁免的正当依据，而不是直接采信或直接驳回。rewrite/block
 * 会误伤真实求助（与 r672-r694 全部评价/胁迫族同口径）。
 *
 * 明确不判的（豁免——这些是正当陈述、制度说明与概念分析）：
 *   · 第三人称与客观制度陈述：他/她/这位/那名开头的困难描述（他家庭
 *     困难是真的，但绩效考核要按统一标准执行）、公司/学校/劳动法/制度/
 *     政策/规定/公示/审批/帮扶基金/助学金/社会支持渠道（Employees facing
 *     hardship can request a flexible schedule.）；
 *   · 尊重决定权：我会说明我目前的困难，但决定权在你/最终由你决定；
 *   · 概念分析：诉诸怜悯是一种常见的逻辑谬误/appeal to pity is a fallacy；
 *   · 句首咨询提问（G4 收窄：只认句首咨询词，句中反问不豁免——本族
 *     攻击句大量以反问定罪结尾「你怎么忍心拒绝我？」）。
 */
'use strict';

// ─── 腿① PITY 自述可怜处境（第一人称在场，十类）────────────────
// 中文。刻意不依赖开放事件表——锚**处境词 + 我**，具体遭遇自由出现。
const PITY_ZH = new RegExp([
  // 可怜/惨自述（我这么可怜/我太惨了/我的处境很惨）
  '我(?:这么|太|好|真是|真的)?(?:可怜|惨|凄惨|惨兮兮|惨透了)|我(?:的)?(?:处境|情况|状况|遭遇)(?:很|太|十分|真的)?(?:惨|可怜|糟糕|困难)|我(?:是)?(?:真的|实在|已经)?(?:走投无路|无路可走|山穷水尽)',
  // 孤独漂泊（我一个人漂泊异乡/举目无亲/人生地不熟/无依无靠）
  '我(?:一个人|独自|孤身)(?:漂泊|流浪|在外|闯荡|打拼)(?:异乡|在外|他乡)?|我(?:在)?(?:异乡|外地|他乡)(?:漂泊|无亲无故)?|我(?:举目无亲|无依无靠|孤苦伶仃|无亲无故|无亲可投)|我(?:一个人)?(?:人生地不熟|无亲无故)',
  // 家庭不幸（我从小父母离异/我爸妈上个月刚离婚/单亲家庭）
  '我(?:从小)?(?:父母|爸妈|家里)?[^。]{0,6}?(?:离异|离婚|双亡|早逝|过世)|我(?:是)?(?:单亲|离异|破碎)(?:家庭|家庭长大|出身)?|我(?:从小)?(?:没|没有)(?:有)?(?:感受过|得到过)?(?:父爱|母爱|家庭温暖|父母的爱)|我(?:家里)?(?:刚)?(?:遭遇)?(?:变故|重大变故)',
  // 疾病身体（我身体不好/我有心脏病/我在住院/我得了抑郁症）
  '我(?:身体|天生|体质)(?:不好|很差|虚弱|弱|有病|不佳)|我(?:有|患有|得了|查出了?)(?:心脏病|高血压|糖尿病|癌|抑郁症|慢性病|尿毒症|抑郁症|重病|疑难杂症)|我(?:刚)?(?:做)?(?:了)?(?:手术|化疗)|我(?:还在|正在|一直在)?(?:生病|住院|治疗|吃药|养病)|我(?:的病|这病)(?:需要|得)(?:长期|一直)?(?:治疗|吃药|花钱)|我(?:是)?(?:残疾人|病号|病人)',
  // 孩子拖累（我孩子还小/我一个人带孩子/我还要供孩子上学）
  '我(?:的)?(?:孩子|娃|娃儿|儿子|女儿|小孩)(?:还)?(?:很|太|这么)?(?:小|年幼|不懂事)|我(?:一个人)?(?:带|拉扯|拉扯大|抚养)(?:大)?(?:着)?(?:孩子|娃|两个娃|三个娃)|我(?:还要|得|要)(?:养|供|供着)(?:孩子|娃|孩子上学|一家人|全家)|我(?:一个人)?(?:带)?(?:娃)?(?:上)?(?:班|打工|工作)',
  // 贫困处境（我家里条件差/我手头紧/我没收入/我吃不上饭）
  '我(?:家里|家中|家里边)?(?:条件)?(?:这么|很|太|特别|非常)?(?:差|穷|困难|艰苦|紧巴)|我(?:手头)?(?:很|太|实在)?(?:紧|拮据|困难)|我(?:没|没有)(?:有)?(?:收入|工作|积蓄|存款|钱|着落)|我(?:连)?(?:房租|房租都|饭都|饭钱都)?(?:交不起|付不起|吃不起|吃不上|交不上)|我(?:穷)?(?:得)?(?:叮当响|揭不开锅|吃了上顿没下顿)|我(?:已经)?(?:几天|好多天|很久)(?:没)?(?:吃|吃上)(?:饭|一顿)',
  // 失业裁员（我被裁员了/我都被公司裁员了/我失业了/我丢了饭碗）
  '我(?:刚|前不久|最近|都)?(?:被)?[^。]{0,4}?(?:裁员|辞退|优化|开除|炒了|炒鱿鱼)|我(?:已经)?(?:失业|待业|下岗)(?:在)?(?:家|了|半年|很久)?|我(?:刚)?(?:丢)?(?:了)?(?:工作|饭碗|差事|活儿)|我(?:年纪)?(?:这么)?(?:大)?(?:找)?(?:不)?(?:到)?(?:工作|活儿|事做)',
  // 年纪大（我年纪大了/我都快六十了/我一把年纪）
  '我(?:年纪)?(?:这么|已经|都)?(?:大|老|上了年纪)|我(?:都)?(?:快)?(?:五十|六十|七十|退休)(?:了|的人|岁)?|我(?:一把年纪|年老体弱|人老珠黄)|我(?:干)?(?:不动|不了)(?:了)?',
  // 债务缠身（我欠了一屁股债/我被网贷拖垮/我债台高筑）
  '我(?:欠)?(?:了)?(?:一屁股|很多|不少|一堆)?(?:债|账|外债|网贷|卡债)|我(?:被)?(?:网贷|信用卡|债务|高利贷)(?:缠身|拖垮|压垮|逼得)|我(?:债台高筑|负债累累|身负重债)',
  // 苦难总括（我这些年太难了/我命太苦/我过得不容易）
  '我(?:这些年|这几年|这辈子|从小到大)?(?:太)?(?:难|苦|不容易|命苦|辛苦)|我(?:的)?(?:命|日子|生活)(?:太)?(?:苦|难|惨)|我(?:过得|活着)(?:太)?(?:不容易|辛苦|艰难)',
  // 情感挫折（我刚失恋了/被甩了/感情受挫/被抛弃）[r702 补族]
  '我(?:刚|最近|前不久|前阵子|都)?(?:被)?(?:甩了?|分手了?|失恋了?|抛弃了?|踹了?)|我(?:被)[^。]{0,3}?(?:拒了?|撬了?)|我(?:感情|情感)(?:受挫|不顺|挫折|破裂|受创|受打击)|我(?:刚)?(?:经历|遭遇)(?:了)?(?:分手|失恋|感情破裂|背叛)',
  // 家人疾病（我妈住院了/我爸病了/家里有人生病/我家人住院）[r702 补族]
  '我(?:妈|爸|父母|爹|娘|家人|家里人|老婆|老公|丈夫|妻子|孩子|儿子|女儿|奶奶|爷爷|姥姥|姥爷|外公|外婆|兄弟|姐妹|哥哥|姐姐|弟弟|妹妹)(?:也|还|现在|目前|最近|正在|刚)?[^。]{0,3}?(?:住院|病|病了|生病|手术|治疗|化疗|急救|抢救|瘫痪|卧床)',
  // 无能力自述（我什么都不懂/我没本事/我没底气）[r702 补族]
  '我(?:什么|啥)(?:都)?(?:不|没)(?:懂|会|知道|明白|了解)|我(?:没|没有)(?:本事|能力|办法|能耐|出息|底气|依靠|靠山|一技之长)',
].join('|'));

// 英文腿①：I have been through so much / I am all alone / I was laid off /
// my family will starve / my child is still little / I can barely get by。
const PITY_EN = new RegExp([
  // 苦难总括（I have been through so much / I've suffered so much）
  "\\bI(?:'ve|\\s+have)?\\s+(?:been\\s+through|suffered|endured|gone\\s+through)\\s+(?:so\\s+much|so\\s+many|a\\s+lot|enough|terrible|hardship)\\b",
  "\\bI\\s+am\\s+(?:so|very|really|such\\s+a)\\s+(?:pitiful|pathetic|miserable|poor|unfortunate|wretched|helpless)\\b",
  "\\bI\\s+(?:am|feel)\\s+(?:so|very|really)\\s+(?:miserable|pathetic|hopeless|desperate|broken)\\b",
  // 孤独（I am all alone / I have no one / I am lonely）
  "\\bI\\s+am\\s+(?:all\\s+)?(?:alone|lonely|on\\s+my\\s+own|isolated)\\b|\\bI\\s+have\\s+no\\s+(?:one|body|family|friends|support)\\b",
  // 疾病（I am sick / I am in poor health / I am ill / I am disabled）
  "\\bI\\s+am\\s+(?:so\\s+)?(?:sick|ill|disabled|in\\s+poor\\s+health|not\\s+well|unwell|weak)\\b|\\bI\\s+have\\s+(?:a\\s+)?(?:heart|chronic|serious)\\s+(?:disease|condition|problem|illness)\\b",
  "\\bI\\s+(?:am|was)\\s+(?:in|at)\\s+(?:the\\s+)?(?:hospital|ER|emergency)\\b|\\bmy\\s+(?:health|condition)\\s+is\\s+(?:poor|bad|deteriorating)\\b",
  // 失业裁员（I was laid off / I lost my job / I am unemployed）
  "\\bI\\s+(?:was|got|have\\s+been)\\s+(?:laid\\s+off|fired|let\\s+go|dismissed|terminated)\\b|\\bI\\s+lost\\s+my\\s+(?:job|work|position|income)\\b",
  "\\bI\\s+am\\s+(?:unemployed|out\\s+of\\s+work|jobless|between\\s+jobs)\\b",
  // 贫困（my family will starve / we cannot make ends meet / I can barely get by）
  "\\b(?:my|our)\\s+family\\s+will\\s+(?:starve|go\\s+hungry|be\\s+destitute)\\b|\\bwe\\s+(?:will|would|cannot|can't)\\s+(?:starve|make\\s+ends\\s+meet|survive|get\\s+by)\\b",
  "\\bI\\s+(?:can|could)\\s+barely\\s+(?:survive|get\\s+by|make\\s+it|afford|eat)\\b|\\bI\\s+(?:cannot|can't)\\s+afford\\s+(?:rent|food|medicine|treatment)\\b",
  "\\bI\\s+am\\s+(?:in\\s+)?(?:dire|desperate)\\s+(?:straits|need|poverty|circumstances)\\b|\\bI\\s+am\\s+(?:destitute|broke|homeless)\\b",
  // 家庭不幸（my parents divorced / I grew up in a broken home / my child is still little）
  "\\bmy\\s+parents\\s+(?:divorced|split\\s+up|separated|died)\\b|\\bI\\s+grew\\s+up\\s+in\\s+a\\s+(?:broken|single-parent)\\s+home\\b",
  "\\bmy\\s+(?:child|kid|son|daughter|baby)s?\\s+(?:is|are)\\s+still\\s+(?:little|young|small|a\\s+baby)\\b",
  "\\bI\\s+am\\s+(?:a\\s+)?(?:single|widowed|divorced)\\s+(?:parent|mother|father|mom|dad)\\b",
  // 年纪（I am too old / I am getting old）
  "\\bI\\s+am\\s+(?:too|getting|already)\\s+(?:old|elderly)\\b|\\bI\\s+am\\s+(?:in\\s+my)\\s+(?:fifties|sixties|seventies)\\b",
  // 债务（I am in debt / I owe a lot）
  "\\bI\\s+am\\s+(?:drowning\\s+)?in\\s+debt\\b|\\bI\\s+owe\\s+(?:a\\s+lot|so\\s+much|thousands)\\b|\\bI\\s+am\\s+(?:buried|crushed)\\s+by\\s+debt\\b",
  // 情感挫折（I just got dumped / my had a terrible breakup）[r702 补族]
  "\\bI\\s+(?:just\\s+)?(?:got|was)\\s+(?:dumped|dumped\\s+by|ghosted)\\b",
  "\\bmy\\s+(?:boyfriend|girlfriend|partner|fiancee?|wife|husband|spouse)\\s+(?:just\\s+)?(?:left|dumped|walked\\s+out|broke\\s+up)\\b",
  "\\bI\\s+(?:just\\s+)?(?:went\\s+through|had|have\\s+had)\\s+a\\s+(?:terrible|awful|bad|horrible|painful|rough)?\\s*(?:breakup|divorce|split)\\b",
  // 家人疾病（my mom is in the hospital / my dad is sick）[r702 补族]
  "\\bmy\\s+(?:mom|mother|dad|father|parents?|family|kid|child|son|daughter|wife|husband|grandmother|grandfather)\\s+(?:is|are)\\s+(?:in\\s+the\\s+hospital|in\\s+the\\s+ER|sick|ill|hospitalized|dying|in\\s+critical\\s+condition)\\b",
  // 无能力（I don't know anything / I have no idea / I am helpless）[r702 补族]
  "\\bI\\s+(?:don'?t|do\\s+not)\\s+know\\s+(?:anything|anything\\s+at\\s+all|the\\s+first\\s+thing)\\b",
  "\\bI\\s+(?:am|'m)\\s+(?:so\\s+)?(?:helpless|useless|clueless|incompetent)\\b",
  "\\bI\\s+(?:have|'ve)\\s+(?:got\\s+)?no\\s+(?:idea|clue|skills?|ability|abilities)\\b",
].join('|'), 'i');

// ─── 腿② DEMAND 通融免责要求（三类任中一类）────────────────────
// 中文三支：a 通融照顾 / b 反问免责与指责 / c 后果绑架。
// 判据核心：要求**指向对方法定/约定规则的豁免**（忍心拒绝/通融/该轮到/
// 迟到几分钟怎么了），不是情感追讨（那归 guilt_induction）、不是顺从
// 推导（那归 suffering_capital）。
const DEMAND_ZH = new RegExp([
  // a 通融照顾（你怎么忍心拒绝/你都不帮/必须照顾/总该轮到/通融/网开一面）
  '(?:你|你们)(?:怎么|怎么能|怎么可以|怎么可以|竟|竟然|居然)(?:忍心|狠心|狠得下心|下得了手|做得出来)(?:拒绝|不帮|不同意|驳回|否定|处罚|处分|扣|考核|批评|指责|为难|刁难|取消)',
  '(?:你|你们)?(?:都)?(?:不)?(?:肯|愿意|打算)?(?:帮|帮帮我|帮我|帮我一下|拉我一把|搭把手|伸出援手|施以援手)',
  '(?:必须|一定|总得|总该|也该|就应该|务必)(?:照顾|通融|体谅|理解|关照|帮扶|特殊照顾|照顾一下|让让我|偏袒|袒护)(?:我|一下)?',
  '(?:就该|总该|也应该|理应|理应|难到不应该|难道不应该)(?:轮到|照顾|给|通融|体谅|倾向|偏向我)',
  // a5 通融类裸词表（r695 收紧：去掉「照顾/特殊照顾/照顾一下」——照料
  // 义不是通融义，与 PITY 腿共现会误判「我身体不好，你能照顾一下这个
  // 客户吗」这类工作请求；含照顾的施压形由情态支与 b2 支覆盖）
  '(?:通融|体谅|网开一面|高抬贵手|放我一马|饶了我|饶我一次|给我一次机会|给我个机会|让让我|睁一只眼闭一只眼|行个方便|通融通融)',
  '(?:这点|这点小|这点小忙|这点忙|这么点|这小)(?:忙|事|事由|要求)?(?:你)?(?:都)?(?:不)?(?:帮|帮帮|答应|满足|满足我|支持|肯帮)',
  '(?:看|看在我|看在|念在|念我)(?:这么|怪|也|实在|确实|从小|多年)?(?:可怜|惨|不容易|困难|辛苦|年老|弱小|孩子|父母|一家人|孤儿寡母|无依无靠)(?:的份上|的份儿上|的面上)?',
  // b 反问免责与指责（迟到几分钟怎么了/你有没有同情心/欺负弱者/于心何忍）
  '(?:迟到|旷工|早退|晚点|缺席|迟到几分钟|晚来|晚到)(?:几分钟|几下|几分|一会儿)?(?:怎么了|不行吗|不可以吗|都不行|也有错|也有罪|还算错)',
  '(?:你|你们)?(?:还)?(?:有没有|讲不讲|懂不懂|知不知)(?:同情心|良心|人心|爱心|怜悯|人道|人情味)',
  '(?:你)?(?:批评|指责|处罚|处分|考核|埋怨|数落|骂)(?:我)?(?:就是|等于|岂不是|不就是)?(?:在)?(?:欺负|针对|歧视|打压|苛待|刻薄|为难|施压)(?:弱者|可怜|老实人|病人|穷人|弱者|我|苦命人)',
  '(?:你)?(?:这|那就是|这就是|分明就是|摆明)?(?:就是)?(?:欺负|针对|压迫|刁难|苛待|刻薄|冷血|无情)(?:弱者|老实人|可怜人|苦命人|穷人|病人|老实人)',
  '(?:于心何忍|于心忍心|你怎么下得去手|你怎么做得出来|你怎么能这样|你怎么可以这样|还有没有点人性|有没有人性)',
  '(?:连)?(?:这点|这么点|这点小|一丁点)(?:要求|忙|事|愿望|请求|心愿|小忙)?(?:都)?(?:不)?(?:答应|帮|满足|同意|支持|成全|满足我)',
  // b2 就不能X一下吗（你就不能通融一下吗/你不能体谅一下吗）
  // r695 收紧：动词表只收通融类（通融/体谅/谅解/包容/宽限）——初版含
  // 「照顾/理解/帮我」，实测「我身体不好，你能照顾一下这个客户吗」
  // （工作请求）会被误判；前缀保留「就不能/能否/能不能」施压形态。
  '(?:你|你们)?(?:就)?(?:不能|不能不|能否|能不能|可不可以|可以不可以)?(?:通融|体谅|谅解|包容|宽限)(?:一下|一点|些|一回)?(?:吗|么|不行吗|不可以吗)?[?？]?',
  // c 后果绑架（就是断我们活路/逼得我没法活/让我们怎么活/我只能去死）
  '(?:就是|这是|等于|简直|分明)(?:要)?(?:断|断送|绝|断绝|断掉)(?:了)?(?:我们|我|我家|全家人|一家人|老小)?(?:的)?(?:活路|生路|活命|命|前程|希望|后路|出路)',
  '(?:就是|这是|等于)?(?:逼死|逼我|逼得我|不想让我活|要把我|非要把我|打算把我)(?:我)?(?:往绝路上逼|活不下去|没法活|没有活路|去死|走上绝路|走投无路)',
  '(?:让|叫|使得)(?:我们|我|我家|全家人|一家人)(?:怎么活|如何活|没法活|活不下去|吃不上饭|去死|喝西北风)',
  '(?:我)?(?:就)?(?:只能)?(?:去死|跳楼|上吊|自杀|卖肾|卖血|卖身|等死|以死明志)',
  '(?:不是|简直是|分明是)(?:要)?(?:逼)(?:我)?(?:走上绝路|去死|家破人亡|走投无路|活不下去)',
  // d 请求放过与请求不追究（这次就算了吧/你别跟我计较了/不再追究）[r702 补族]
  '(?:你|你们|您)?(?:就)?(?:别|不要|不用|甭|不必)(?:跟我|和我|与之|跟咱)?(?:计较|计较了|追究|过不去|过意不去|算账|算总账|旧事重提)',
  '(?:这次|这回|这一回|这一下|此事|这事|这档子事|这点事|这点小事|这种小事)(?:就)?(?:算|算了|过得去|先过去|先搁下)(?:了)?(?:吧|呗|好不好|行吗|不行吗)?',
  '(?:不|无需|不必|用不着)(?:再)?(?:追究|计较|提这件事|旧事重提|秋后算账)',
  // e 请求让步（不能让着我一点吗/相让一步/给个台阶下）[r702 补族]
  '(?:你|你们|您)?(?:就|也)?(?:不能|不能不|能否|能不能|可不可以|可以不可以)?(?:让让我|让着我|让着|相让|让步|容让)(?:一下|一点|些|一回|一步)?(?:吗|么|行吗|不行吗)?[?？]?',
  '(?:给|给个|给我个)(?:一个)?(?:台阶|台阶下|下台阶)',
  // f 强行要求形（不行也得行/无论如何都得批/非得…不可）[r702 补族]
  '(?:不行|不可以|不成|不允许|没商量|没得商量|由不得)[，,。？?！!\\s]*(?:也|都)?(?:得|必须|该|要)(?:行|办|做|成|执行|通过|同意|准)',
  '(?:无论如何|说什么|咋说|说啥|起码|至少|照样)(?:也)?(?:都)?(?:得|必须|该|要)(?:请|准|批|同意|答应|允许|算|办)',
  '(?:非|非得|非要|必定要)(?:我|让我|把我)?(?:请|批|准|同意|答应|允许|通融)(?:不可|才行|不成)?',
  // g 乞怜祈使（可怜可怜我吧/行行好/发发慈悲）[r702 补族]
  '(?<![在把被让任由别甭莫])(?:可怜|怜惜|怜悯)(?:可怜|怜惜|怜悯)?(?:我|我吧|我们|我们吧|我一家|我全家)',
  '(?:行行好|行个好|发发慈悲|大发慈悲|开开恩|抬抬手|手抬一抬)',
].join('|'));

// 英文腿②：you cannot possibly say no to me / you must help / have a heart /
// how could you refuse / we will starve / this will kill me。
const DEMAND_EN = new RegExp([
  // a 通融照顾（you cannot possibly say no to me / you must help / make an exception）
  "\\byou\\s+(?:cannot|can't|couldn't)\\s+(?:possibly\\s+)?(?:say\\s+no\\s+to\\s+me|refuse\\s+me|deny\\s+me|reject\\s+me|turn\\s+me\\s+down)\\b",
  // r695 修正：动词后可插入一个名词（you must grant an exception for me）
  "\\byou\\s+(?:must|have\\s+to|need\\s+to|should)\\s+(?:help|give|grant|let|allow|pity|forgive)(?:\\s+(?:an?|the|one|me|us|my|our))?(?:\\s+\\w+){0,2}?\\s+(?:me|us)\\b",
  "\\b(?:is|was)\\s+it\\s+too\\s+much\\s+to\\s+ask\\b|\\bhave\\s+a\\s+heart\\b|\\bshow\\s+(?:some\\s+)?(?:mercy|compassion|pity|sympathy)\\b",
  "\\bmake\\s+(?:an|one)\\s+exception\\s+for\\s+(?:me|us)\\b|\\bcut\\s+(?:me|us)\\s+(?:some\\s+)?slack\\b|\\bgo\\s+easy\\s+on\\s+(?:me|us)\\b",
  "\\b(?:this|it)\\s+should\\s+(?:be|come\\s+to)\\s+(?:me|us)\\b|\\bmy\\s+turn\\s+(?:should|must|ought\\s+to)\\s+(?:come|be)\\b",
  "\\b(?:at\\s+least|please)\\s+(?:help|give|grant)\\s+(?:me|us)\\b|\\byou\\s+(?:should|must)\\s+(?:at\\s+least)\\s+(?:help|give)\\b",
  // b 反问免责与指责（how could you refuse / you are bullying the weak / what is wrong with being late）
  "\\bhow\\s+(?:could|can)\\s+you\\s+(?:possibly\\s+)?(?:refuse|say\\s+no|do\\s+this|punish\\s+me|deny\\s+me|reject)\\b",
  "\\bhow\\s+can\\s+you\\s+(?:be\\s+so\\s+)?(?:heartless|cruel|cold|merciless|ruthless|unreasonable)\\b",
  "\\byou\\s+are\\s+(?:just\\s+)?(?:bullying|picking\\s+on|targeting|discriminating\\s+against)\\s+(?:the\\s+)?(?:weak|poor|helpless|vulnerable|me)\\b",
  "\\bwhat\\s+is\\s+wrong\\s+with\\s+(?:a\\s+few\\s+minutes|being\\s+late|this|that|one\\s+day)\\b",
  "\\bis\\s+(?:being\\s+late|this|that|a\\s+few\\s+minutes)\\s+(?:so\\s+)?(?:wrong|a\\s+problem|a\\s+big\\s+deal)\\b",
  "\\bwhere\\s+is\\s+your\\s+(?:compassion|sympathy|mercy|heart|humanity)\\b",
  // c 后果绑架（we will starve / this will kill me / you are cutting off our lifeline）
  "\\b(?:you\\s+are|this\\s+is|that\\s+is)\\s+(?:cutting\\s+off|destroying|ruining|taking\\s+away)\\s+(?:my|our)\\s+(?:only\\s+)?(?:lifeline|livelihood|way\\s+to\\s+live|means|hope)\\b",
  "\\b(?:we|my\\s+family|I)\\s+will\\s+(?:starve|die|go\\s+hungry|be\\s+destroyed|be\\s+ruined)\\b",
  // r695 修正：允许主语与 will 之间插入规则名词（this rule will kill my family）
  "\\b(?:this|that|it)(?:\\s+\\w+){0,2}?\\s+will\\s+(?:kill|destroy|ruin)\\s+(?:me|us|my\\s+family|my\\s+life)\\b",
  "\\b(?:you|this|that)\\s+(?:will\\s+)?(?:leave|leaves)\\s+(?:me|us)\\s+(?:no\\s+choice|nothing|with\\s+nothing)\\b",
  "\\bI\\s+(?:will\\s+|would\\s+)?(?:have\\s+to\\s+)?(?:die|end\\s+up)\\s+(?:on\\s+the\\s+streets|homeless|dead|begging)\\b",
  // d 请求放过（let it slide this once / let this one go）[r702 补族]
  "\\blet\\s+(?:it|this|that)\\s+(?:go|slide)\\s+(?:this\\s+once|just\\s+this\\s+once|this\\s+time|for\\s+once|for\\s+this\\s+time)\\b",
  "\\blet\\s+(?:it|this|that)\\s+slide\\b",
  // e 请求不追究（do not hold it against me / leave it be）[r702 补族]
  "\\b(?:do|does|did)\\s+(?:not|n't)\\s+(?:hold|bring)\\s+(?:it|this|that)\\s+(?:against|up\\s+against)\\s+(?:me|us)\\b",
  "\\bleave\\s+(?:it|this|that)\\s+(?:be|alone|as\\s+it\\s+is)\\b",
  // f 请求让步（cannot you let it go just this once / forgive me just this once）[r702 补族]
  "\\b(?:cannot|can't|couldn't)\\s+you\\s+(?:just\\s+)?(?:let\\s+(?:it|this)\\s+go|forgive|excuse)\\s+(?:me|us|it|this)\\s+(?:just\\s+)?(?:this\\s+once|once|this\\s+time)\\b",
  // g 强行要求（no excuses / like it or not / no matter what）[r702 补族]
  "\\b(?:no|without)\\s+(?:more\\s+)?(?:excuses|objections|exceptions|ifs\\s+and\\s+buts)\\b",
  "\\b(?:like\\s+it\\s+or\\s+not|whether\\s+you\\s+like\\s+it\\s+or\\s+not)\\b",
  "\\bno\\s+matter\\s+what\\b",
  // h 乞怜祈使（have pity on me / take pity on me / for pity's sake）[r702 补族]
  "\\b(?:please\\s+)?(?:have|take)\\s+(?:pity|mercy|compassion)\\s+on\\s+(?:me|us)\\b",
  "\\bfor\\s+(?:pity|mercy)'?s\\s+sake\\b",
].join('|'), 'i');

// ─── 豁免：第三人称/制度陈述/尊重决定权/概念分析 ────────────────
// 三类：① 第三人称与客观制度（无第一人称自述在场）；② 尊重决定权；
// ③ 概念分析与句首咨询提问（G4 收窄：只认句首，句中反问不豁免——
// 本族攻击句大量以反问定罪结尾）。
const META_EXEMPT_ZH = new RegExp([
  // ① 第三人称困难描述（他/她/这位/那名/员工/学生 + 困难）——客观陈述
  '(?:^|[。；;，,。！!？?\\s])(?:他|她|ta|这位|那名|那位|该|此|员工|这名|有位)(?:家庭|条件|处境|经济|生活|身体|孩子)?(?:困难|贫困|艰苦|拮据|惨|不幸|离异|生病|失业|裁员)',
  // ② 客观制度与法规说明（公司有/学校/劳动法/制度/政策/规定/公示/审批/基金/渠道）
  '(?:公司|学校|单位|企业|政府|社区|国家|劳动法|法律|法规|制度|政策|规定|规范|流程|程序)(?:有|设|立|明确|规定|明确)?(?:帮扶|救助|补助|津贴|基金|助学金|帮扶基金|绿色通道|过渡期|公示期|审批|支持渠道|求助渠道|支持体系)',
  '(?:符合(?:条件|规定|要求)的?(?:可以|可|能够|予以|给予)|依法|按规定|按制度|按流程|经审批|经公示|走流程|走变更单|书面确认|双方确认|双方书面)',
  // ③ 尊重决定权（决定权在你/由你决定/最终由你/你自己定）
  '(?:决定权|决定权|选择权|裁决权)(?:在|归)(?:你|您|您方|贵方|组织|领导|大家)|(?:由|最终由|最终取决于|取决于)(?:你|您|您方|贵方)(?:决定|定夺|裁决|判断|权衡)|(?:尊重|听从|接受)(?:你|您)(?:的)?(?:决定|选择|判断)',
  // ④ 概念分析（诉诸怜悯是一种谬误/appeal to pity is a fallacy）
  '(?:这|那就是|这就是|这正是|那正是|属于|正是)(?:一种|典型的|常见的|经典的|隐性|常见|典型|明显)?(?:诉诸怜悯|乞怜|哀兵政策|悲情牌|苦情戏|苦肉计|卖惨)',
  '(?:诉诸怜悯|哀兵政策|悲情牌|苦情戏|苦肉计|乞怜谬误)(?:是|属于|是一种|正是)(?:一种|典型的|常见的|经典的)?(?:谬误|谬说|逻辑错误|逻辑谬误|错误论证|非形式谬误|话术|手法|手段|策略|伎俩|套路|现象|问题|陷阱|错误)',
  // ⑤ 句首咨询提问（G4：只认句首——如何/怎么/怎样/什么是/该怎么，句中反问不豁免）
  '^(?:如何|怎么|怎样|什么是|何为|该怎么|应当怎么|可以怎么|如何避免|怎样识别|如何辨别)(?:避免|识别|辨别|判断|应对|处理|看待|理解|拒绝|回应)?',
].join('|'));

const META_EXEMPT_EN = new RegExp([
  // ① 第三人称与制度（they/employees/students/the company facing hardship）
  "\\b(?:they|employees|students|staff|workers|those|people)\\s+(?:facing|with|in)\\s+(?:hardship|difficulty|difficulties|poverty|need)\\b",
  "\\b(?:the|our)\\s+(?:company|organization|school|government|law|policy|regulation|procedure)s?\\s+(?:provides?|offers?|allows?|requires?|guarantees?|ensures?)\\b",
  "\\b(?:according\\s+to|under|per)\\s+(?:the\\s+)?(?:law|policy|regulation|procedure|contract|guidelines)\\b",
  // ② 尊重决定权（the decision is yours / up to you / your call）
  "\\bthe\\s+decision\\s+is\\s+(?:yours|up\\s+to\\s+you)\\b|\\bup\\s+to\\s+you\\b|\\byour\\s+call\\b|\\byou\\s+(?:decide|have\\s+the\\s+final\\s+say)\\b",
  // ③ 概念分析（appeal to pity is a fallacy / this is an appeal to emotion）
  "\\bappeal\\s+to\\s+(?:pity|emotion|sympathy)\\s+(?:is|are)\\s+(?:a\\s+)?(?:fallacy|manipulation|tactic|rhetorical|technique)\\b",
  "\\b(?:this|that|it)\\s+is\\s+(?:a|an)\\s+(?:classic|typical|textbook)\\s+appeal\\s+to\\s+(?:pity|emotion|sympathy)\\b",
  // ⑤ 句首咨询提问（G4：只认句首 How do I / What is the best way / Should I）
  "^(?:how\\s+do\\s+I|how\\s+can\\s+I|how\\s+should\\s+I|what\\s+is\\s+the\\s+best\\s+way|how\\s+to|should\\s+I|is\\s+it\\s+(?:okay|acceptable|reasonable)\\s+to)\\b",
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkAppealToPity(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const PITY_ZH_ = R.PITY_ZH || PITY_ZH;
  const PITY_EN_ = R.PITY_EN || PITY_EN;
  const DEMAND_ZH_ = R.DEMAND_ZH || DEMAND_ZH;
  const DEMAND_EN_ = R.DEMAND_EN || DEMAND_EN;
  const META_EXEMPT_ZH_ = R.META_EXEMPT_ZH || META_EXEMPT_ZH;
  const META_EXEMPT_EN_ = R.META_EXEMPT_EN || META_EXEMPT_EN;

  // 第三人称/制度陈述/尊重决定权/概念分析/句首咨询 → 不是运用它
  if (META_EXEMPT_ZH_.test(text) || META_EXEMPT_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  const pityZh = PITY_ZH_.test(text);
  const pityEn = PITY_EN_.test(text);
  const demandZh = DEMAND_ZH_.test(text);
  const demandEn = DEMAND_EN_.test(text);

  // 主判据：自述可怜处境 × 通融免责要求（缺一不判）
  if ((pityZh || pityEn) && (demandZh || demandEn)) {
    return {
      hit: true,
      score: 0.6,
      count: 1,
      detail: isZh ? '诉诸怜悯×处境换通融(zh)' : '诉诸怜悯×处境换通融(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkAppealToPity,
  __internals: () => ({ PITY_ZH, PITY_EN, DEMAND_ZH, DEMAND_EN, META_EXEMPT_ZH, META_EXEMPT_EN }),
};
