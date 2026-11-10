// ============================================================
// 第 244 判别维度：unfalsifiable_assertion（不可证伪断言）
// Popper 可证伪性判据的规则引擎化。
//
// 与既有维度的边界（四角划清，互不重复判）：
//   - unfalsifiable_confirmation(202) 管「双果自证」——拿一对互斥结果
//     都解释成支持，是**事后解释**层面的不可证伪；
//   - absence_of_problems(182) 管「有界阴性结果全称化」——检验已执行、
//     覆盖有界，结论却被扩大到全域；
//   - appeal_to_ignorance(62) 管「举证责任分配」——你拿不出反证所以你对；
//   - absolute_claim 管「永远无法/绝对」这类绝对化措辞本身。
// 本维度管的是**断言在构造层面就排斥任何可能的反证观测**：话一说出口，
// 世界上已经不存在任何能观测到的东西可以判它错。这正是 Popper 的
// falsifiability criterion——一个命题若无法被任何可能的观测推翻，它
// 就没有信息量，无论包装得多像结论。
//
// 判据两腿共现 + 邻近窗，缺一不判：
//   腿① ASSERT 实质性断言（机制断言/预测/归因/定性宣告/理论宣告）
//   腿② SEAL  构造上排斥反证（四形任一）
//       CN-A 不可观测实体（测不到、看不见、但决定了结果）
//       CN-B 事后可调解释（无论结果如何都能自圆其说/怎么解释都通）
//       CN-C 无限延期验证（将来某天自然会见分晓——不给定时间与观测）
//       CN-D 万能免责（信则灵/心诚则灵/因为你怀疑所以不显）
// CN-D 自身即完整不可证伪结构（把「不灵」重新定义为「你不诚」），独立成案；
// 其余三形须与腿①落在邻近窗内。
//
// r161 教训：枚举腿一律收裸名词形态——「测不到」「看不见」去前后缀仍命中。
// r284 教训：量词后须容许名词间隙（「多拿一个名额，」整族漏判）。
// ============================================================

// ─── 腿① 实质性断言（中文）──────────────────────────────────
// r161 教训：收裸名词形态（「注定」「必然」去前后缀仍命中）。
const ASSERT_ZH = [
  // 机制/成因断言
  /(?:根本|真正|深层|背后|其实|本质上|说到底|归根到底|核心)(?:原因|因素|机制|动力|逻辑|道理|规律|法则|力量|推手)/,
  // 「根本原因是 X」——X 是任意归因对象（不限于神秘词），腿①只需
  // 宣告这是唯一/深层成因，配合腿②即构成不可证伪归因。
  /(?:根本|真正|深层|唯一|核心)(?:的)?(?:原因|因素|机制|解释)/,
  /(?:原因|因素|机制|解释)(?:是|在于|就是|源于)[^。！？!?]{0,20}(?:干扰|作用|影响|决定)/,
  // 「是因为/是由于 X」——任意归因宣告（含负面对象被指为成因）
  /(?:是因为|是由于|根子|病根|问题出在|关键在于|奥秘在于|秘密在于)/,
  // 注定/必然族
  /(?:是|由于|源于|来自于|取决于|在于)[^。！？!?]{0,10}(?:注定|必然|不可抗拒|无法改变|无从改变|不以人的意志为转移)/,
  /(?:注定|必然|不可抗拒|无法改变|无从改变|天意|命运|气数)/,
  /(?:冥冥之中|自有|天注定|命中注定|老天|上天|神灵|神明|菩萨|佛祖|上帝|真主|造物主)/,
  // 「看不见/看不到 X」+ 救赎/福报结论——不可观测实体作因的归因宣告
  /(?:看不见|看不到|感知不到|察觉不到|测不到|探测不到)[^。！？!?]{0,10}(?:的人|者)?[^。！？!?]{0,8}(?:才|就|方|才能)?[^。！？!?]{0,6}(?:获得|得到|受|有|见|成)/,
  // 「（只有）X 的人才 Y」——以不可验证的资格作条件宣告
  /(?:只有|唯有|除非)[^。！？!?]{0,14}(?:的人|者)?[^。！？!?]{0,6}(?:才|方能|才能|方有)/,
  // 定性宣告
  /(?:这就|这|那)?(?:说明|证明|表明|意味着|足以说明|足以证明)[^。！？!?]{0,14}(?:注定|必然|不可抗拒|无从改变|天意|命运)/,
  /(?:这个|这种|该|此)?(?:现象|事实|结果|真相|本质|奥秘)[^。！？!?]{0,12}(?:超出|超越|脱离)[^。！？!?]{0,6}(?:认知|理解|科学|经验|常识)/,
  // 「说明 X 本身有问题」——把反证重新定义为对象缺陷
  /(?:说明|证明|表明|意味着)[^。！？!?]{0,12}(?:本身|自己)[^。！？!?]{0,6}(?:有问题|有误|错了|不干净|被污染|有障|不足|不够)/,
  /(?:说明|证明|意味着)[^。！？!?]{0,10}(?:被污染|有障|业障|冤亲|阴气|煞气|不干净|不清净|未净化)/,
  // 「解释框架/说法无懈可击」——宣告理论体系的自洽完备
  /(?:解释框架|解释体系|说法|理论|框架|体系)[^。！？!?]{0,8}(?:无懈可击|完美无缺|自洽|圆满|天衣无缝|圆融|无破绽|挑不出毛病)/,
  // 「大师/高人开过光的东西当然灵」——以权威主体宣告断言
  /(?:大师|高人|上师|活佛|宗师|神仙|神明|菩萨|佛祖|开过光|加持|法力)[^。！？!?]{0,10}(?:当然|一定|必定|必然|真的|确实)?[^。！？!?]{0,4}(?:灵|准|有效|有求必应|显灵|应验)/,
  /(?:是|源于|来自)[^。！？!?]{0,10}(?:超自然|神秘|未知|无形|看不见|测不到|无法解释|不可解释)/,
  /(?:历史|大势|潮流|时代|规律)(?:必然|注定|不可阻挡|不可逆转|不可抗拒)/,
  // 「这个理论/这套框架总能…」——以「理论/框架/学说/体系」为主语并宣告
  // 其普适/自洽，是事后可调解释的典型承载形态。
  /(?:这个|这套|该|此|这种)?(?:理论|框架|学说|体系|解释|模型|范式|观点|说法|逻辑|路径|方法论|心法|功法|方法|疗法)[^。！？!?]{0,12}(?:总能|都能|都可以|也都能|照样能|均能|皆能)/,
  // 「永远无法被推翻/被证伪」——直接宣告构造上不可推翻
  /(?:永远|始终|压根|根本无法)?[^。！？!?]{0,6}(?:无法|不可能|不能|无从)[^。！？!?]{0,6}(?:被|受|得到|获得)?[^。！？!?]{0,4}(?:推翻|证伪|否证|驳倒|否定|反驳|检验|验证)/,
  // 正说反说都成立
  /(?:正说|反说|怎么说|横说竖说|左右|前后)[^。！？!?]{0,10}(?:都|也)(?:成立|对|通|说得通|能|可以)/,
  /(?:怎么|如何)[^。！？!?]{0,6}(?:说|解释|讲|圆)[^。！？!?]{0,8}(?:都|也)(?:通|对|成立|没错|有理)/,
  /(?:规律|法则|天道|天命|因果|业力|轮回|报应|气场|磁场|能量场|风水|命理|星象|八字|面相|手相|缘分|慧根|悟性|体质|灵力|灵力)/,
  // 修行/神秘实践名词（r285 实测补腿：「这套功法的能量运行在另一个维度…」
  // 因腿①只收「功法」连词族而漏判——r161 纪律：枚举腿收裸名词形态）
  /(?:功法|心法|疗法|法门|秘法|修行|修炼|打坐|念咒|持咒|开光|加持|符咒|通灵|灵修|脉轮|查克拉|透视|遥视|前世|轮回)/,
  // 预测宣告
  /(?:一定|必定|必将|肯定会|势必)[^。！？!?]{0,4}(?:会|要|发生|到来|降临|出现|失败|成功|灭亡|崛起|应验|兑现|见分晓)/,
  /(?:迟早|早晚|终将|终归|总有一天|有朝一日)[^。！？!?]{0,10}(?:会|要|发生|到来|降临|应验|报应|兑现|证明|验证|明白|理解)/,
  /(?:预言|预示|兆头|征兆|天象|异象|谶语|占卜|算命|算卦|求签|看相|观星)/,
  // 「时机/时候未到」——延期验证的宣告面
  /(?:时机|时候|时辰|机缘|火候)[^。！？!?]{0,6}(?:成熟|未到|不到|未至|来了|到了)/,
  // 「宇宙/上天会把 X 交给你」——以不可观测主体宣告结果
  /(?:宇宙|上天|老天|天道|命运|缘分)[^。！？!?]{0,12}(?:会|将|自会|终究)[^。！？!?]{0,12}(?:把|给|赐|交|送|赏|奖)/,
  // r285 矩阵补腿：「祖先一直在庇佑我们，虽然看不见，但福气都在暗中积累」
  // 腿②有「庇佑/暗中」但腿①零命中。共同结构：不可观测主体（祖先/神佛/
  // 天地/祖宗）+ 正在发挥的庇护作用宣告——「一直在 X」的进行态宣告。
  /(?:祖先|祖宗|先人|神灵|神明|菩萨|佛祖|上帝|上天|老天|天地|神明|仙佛|护法|城隍|土地公)[^。！？!?]{0,10}(?:一直|始终|从来|都在|始终都在|正在|始终在|一直在)[^。！？!?]{0,10}(?:庇佑|保佑|庇护|眷顾|护佑|看护|守护|关照|保佑着|庇佑着)/,
  // 「福气/福报都在暗中积累」——不可观测账本的积累宣告
  /(?:福气|福报|福德|阴德|功德|因果|业力|运势|气运)[^。！？!?]{0,8}(?:都在|正在|自会|都会|终究)[^。！？!?]{0,8}(?:暗中|无形|冥冥|悄悄|默默)[^。！？!?]{0,8}(?:积累|累积|积攒|增加|增长|叠加)/,
  // r285 矩阵补腿：腿①「X 永远是对/有效」的绝对结论宣告族。矩阵实测
  // 「市场永远是对的」「这套方法永远有效」腿①零命中——原表只有
  // 「理论总能…」的普适形，没有裸的「主语 + 永远/始终 + 是 + 定性形容词」
  // 宣告形。该形配上腿②（反证归因于主体）即构成「构造上不可推翻的宣告」。
  // r161 纪律：定性词收裸形态（「对的」去掉前缀仍是「对」的判定词）。
  /(?:市场|这套|这个|该|此|这种|我们的|你们|他们的)?(?:方法|理论|体系|框架|说法|逻辑|规律|法则|市场|行情|走势|策略|打法|模式|机制|规则|制度|安排|设计|上帝|天道|命运|历史|时代|大势)[^。！？!?]{0,6}(?:永远|始终|一贯|从来|压根|根本就|向来|一向)[^。！？!?]{0,4}(?:是|为|皆|均)[^。！？!?]{0,6}(?:对|正确|没错|有理|有效|成立|灵|准|不可动摇|不容置疑|无可置疑|毋庸置疑|不二|唯一|正确无误)/,
  /(?:永远|始终|一贯|从来|压根|根本|向来|一向)[^。！？!?]{0,4}(?:是|为|皆|均)[^。！？!?]{0,8}(?:对|正确|没错|有理|有效|成立|灵|准)/,
  // 「永远有效/永远正确」——不带主语的直接宣告（裸形）
  /(?:永远|始终|一贯|从来|向来|一向)(?:有效|正确|没错|有理|成立|准确|灵验|应验|适用)/,
];

// ─── 腿①（英文）────────────────────────────────────────────
const ASSERT_EN = [
  /\b(?:root|real|true|underlying|deep|hidden|ultimate)\s+(?:cause|reason|mechanism|driver|logic|force|law|principle)\b/i,
  /\b(?:is|are)\s+(?:destined|doomed|bound|inevitable|unavoidable|predetermined|fated)\b/i,
  /\b(?:destiny|fate|karma|cosmic|divine|providence|god'?s?\s+(?:will|plan)|the\s+universe)\b/i,
  // 英文侧神秘实践/能量名词（r285 实测补腿：A15 `The healing energy works
  // on a level…` 腿①零命中——原表只收 destiny/karma 等抽象词）
  /\b(?:healing|spiritual|cosmic|subtle|pranic|vital|mystical|ancient)\s+(?:energy|energies|vibration|frequency|force|field|aura|qi|chi|prana|power|light)\b/i,
  /\b(?:energy|vibration|frequency|aura|chakra|prana|qi|chi|karma|spirit|soul|ghost|entity|demon|angel|deity)\b/i,
  /\b(?:therefore|so|which\s+(?:means|proves))\b[^.]{0,40}\b(?:destined|doomed|inevitable|fated)\b/i,
  /\b(?:will|certainly|inevitably|surely|definitely)\s+(?:happen|occur|come\s+to\s+pass|be\s+fulfilled|materialize)\b/i,
  /\b(?:will|certainly|inevitably|surely|definitely)\s+(?:prove|vindicate|validate|confirm)\b/i,
  /\b(?:prophecy|prophesied|foretold|predicted|omen|portent|destined)\b/i,
  /\bthis\s+(?:prediction|claim|theory|framework|approach|method|model)\b/i,
  /\bthe\s+(?:theory|framework|claim|model|approach|explanation)\s+(?:can|could)\s+(?:always\s+)?be\s+(?:explained|reconciled|accommodated|interpreted|spun)\b/i,
  /\b(?:theory|framework|claim|model)\s+(?:is|remains)\s+(?:unfalsifiable|untestable|unverifiable|irrefutable)\b/i,
  /\bit\s+(?:works?|only\s+works?|will\s+work)\s+(?:only\s+)?(?:if|when)\s+you\b/i,
  // 「a true believer will see…」——以不可验证的资格作条件宣告
  /\b(?:a|any|the)\s+(?:true|real|genuine|sincere|devout)\s+(?:believer|practitioner|adept|initiate)\b/i,
  /\b(?:only|just)\s+the\s+(?:worthy|pure|chosen|initiated|awakened|enlightened)\b/i,
  // 「if you cannot see X, you are not yet Y」——反证被重新定义为主体缺陷
  /\bif\s+you\s+(?:cannot|can'?t)\s+(?:see|perceive|detect|feel)\b[^.]{0,30}\byou\s+(?:are|were)\s+(?:not|n'?t)\s+(?:yet\s+)?(?:awakened|ready|worthy|pure|initiated|open)\b/i,
  // r285 补腿：`which is exactly why it eludes every laboratory` 把测不到当论据
  /\b(?:which|that|and\s+that)\s+is\s+(?:exactly\s+|precisely\s+|just\s+)?why\s+it\s+(?:eludes?|escapes?|defies?|evades?|cannot|can'?t)\b/i,
  // 「that only proves you did not…」——反证重定义为主体不足
  /\b(?:that|this|which)\s+(?:only\s+)?(?:proves?|shows?|means?)\s+(?:that\s+)?you\b/i,
  /\b(?:no|not)\s+(?:experiment|test|observation|evidence|data)\s+(?:can|could|will|would)\s+ever\s+(?:disprove|refute|falsify)\b/i,
  /\boperates?\s+(?:beyond|outside)\s+(?:all\s+|the\s+reach\s+of\s+)?(?:measurement|detection|observation|science)\b/i,
  /\bno\s+matter\s+what\b/i,
  /\b(?:can|could)\s+(?:always\s+)?be\s+(?:explained|interpreted|spun|reconciled|accommodated)\b/i,
  /\bhistory\s+(?:will|shall)\s+(?:eventually\s+|ultimately\s+)?(?:vindicate|prove|show|judge)\b/i,
  /\bwhatever\s+(?:happens|the\s+outcome|the\s+result)\b/i,
  /\b(?:in\s+a\s+)?(?:hidden|unseen|other)\s+(?:realm|dimension|plane|level|world)\b/i,
];

// ─── 腿② 四形拆分 ───────────────────────────────────────────
// CN-D（万能免责）自身即完整的不可证伪结构——「心诚则灵」不需要额外
// 的机制断言腿：它把反证观测（不灵）重新定义为「你不诚」，于是任何
// 观测都无法推翻它。因此 CN-D 独立成案，其余三形仍需腿①共现。
const SEAL_ZH_CN_D = [
  /(?:心诚|诚心|信念足够|信仰坚定|足够虔诚|真心相信|心正|念正)[^。！？!?]{0,6}(?:则|就|才|方)?[^。！？!?]{0,4}(?:灵|应|显|成|验|准|有效)/,
  /(?:信则|信就|信者|有信心则|有信心就)[^。！？!?]{0,6}(?:灵|有|得|见|成|准)/,
  /(?:因为|由于)?[^。！？!?]{0,8}(?:怀疑|不信|质疑|不诚|不敬|不配|心不诚|信念不够|信仰不坚)[^。！？!?]{0,14}(?:所以|才|因而|因此|于是)?[^。！？!?]{0,12}(?:看不到|看不见|不显|不灵|无效|没用|不成功|感受不到|体验不到|不验|不准|不应|无效果)/,
  /(?:不是|并非)[^。！？!?]{0,10}(?:不灵|不准|没用|无效|失败|不成功|不应验)[^。！？!?]{0,14}(?:而是|是|只因|是因为)[^。！？!?]{0,14}(?:你|您的|人的)[^。！？!?]{0,10}(?:诚|信|念|心|德|修行|境界|信念|信仰|诚意)/,
  /(?:不是|并非)[^。！？!?]{0,8}(?:无效|没用|不准|失败)[^。！？!?]{0,16}(?:而是|是)[^。！？!?]{0,16}(?:不够|不足|不深|未到|不到家|不诚|不信)/,
  // 「不灵是因为外部条件不对」——把反证归因于环境/时机/外部因素
  /(?:不灵|不显|不准|无效|没用|不应|不验)[^。！？!?]{0,12}(?:是因为|是由于|只因|是因为)[^。！？!?]{0,14}(?:风水|环境|气场|时机|时辰|方位|位置|摆放|朝向|八字|命理|因果|业障|冤亲|阴气|煞气)/,
  // 「领悟不了说明你还没入门」——反证被重定义为资格不足
  /(?:领悟|理解|体会|感受)不了[^。！？!?]{0,10}(?:说明|证明|意味着|表明)[^。！？!?]{0,12}(?:还没|尚未|未|不够|不到)/,
  /(?:看不到|看不见|感受不到|体会不到|领悟不了)[^。！？!?]{0,12}(?:是因为|是由于|只因|说明|意味着)[^。！？!?]{0,12}(?:你|您)?[^。！？!?]{0,8}(?:还没|尚未|不够|不足|未到|不到|没有)/,
  // 「说明你不够虔诚」——反证被归因于信仰强度（不带「领悟不了」前缀）
  /(?:说明|证明|意味着|表明|指出)[^。！？!?]{0,6}(?:你|您)[^。！？!?]{0,4}(?:不够|不足|不够虔诚|信心|信念|信仰)[^。！？!?]{0,8}(?:虔诚|诚|信|深|坚定|到位|到家)/,
  /(?:而是|只因|是因为|不是因为)[^。！？!?]{0,8}(?:你|您|其人|测试者)[^。！？!?]{0,4}(?:不够|不足)[^。！？!?]{0,6}(?:虔诚|诚心|专心|认真|信|投入|坚定)/,
  // r285 矩阵补腿：CN-D「反证 = 主体没做对」族。原族只收「心诚则灵」
  // 的正话形与「不够虔诚」的程度形，矩阵实测三条穿透——
  //   「不灵只能说明你没真正做对」「市场永远是对的…那只能是你的仓位错了」
  //   「没显灵是因为你心不够诚」
  // 共同结构：不成功/失败的结果词 + 说明/是因为 + 「你 + 否定性缺陷」
  // （没做对/错了/不够诚/不诚/不到位）。负面缺陷词全部收裸形态。
  /(?:不灵|不显|不准|无效|没用|不成功|失败|落空|不遂|不应验|不兑现|没效果|不成交|亏损|踏空|错过)[^。！？!?]{0,16}(?:只能|只是|不过是|无非是|就是)?[^。！？!?]{0,4}(?:说明|证明|意味着|表明|指出|因为|是由于|只因)[^。！？!?]{0,10}(?:你|您)[^。！？!?]{0,8}(?:没|未|不)[^。！？!?]{0,8}(?:做对|做错|错了|有误|诚|够|到位|到家|用对|使对|理解|领悟|执行|照做|跟上)/,
  /(?:不灵|不显|不准|无效|没用|不成功|失败|落空|不遂|不应验)[^。！？!?]{0,14}(?:是因为|是由于|只因|归咎于|归结于)[^。！？!?]{0,12}(?:你|您|其人|当事人|操作者)[^。！？!?]{0,10}(?:心|诚意|信念|信仰|修行|境界|做法|操作|执行力|领悟|理解)/,
  // 「那只能是你的 X 错了」——把反证归因于使用者一侧的判断/操作
  /(?:只能|只是|不过是|无非是|肯定是|一定是|必然是)[^。！？!?]{0,4}(?:你|您|你的|您的)[^。！？!?]{0,8}(?:错|有误|不对|有问题|不足|不够|不到)/,
  // 「心不够诚/不够相信」的程度否定形（无「说明」前缀的独立宣告）
  /(?:心|诚意|信念|信仰|信心)[^。！？!?]{0,4}(?:不够|不足|不深|不纯|不专|不真)/,
];

const SEAL_EN_CN_D = [
  /\b(?:if\s+you\s+)?(?:truly|really|genuinely|sincerely)\s+(?:believed?|had\s+faith|trusted)\b/i,
  /\byou\s+(?:just\s+)?(?:don'?t|do\s+not)\s+(?:believe|have\s+faith)\s+(?:enough|deeply|truly)\b/i,
  /\b(?:doubt|skepticism|disbelief|your\s+unbelief)\s+(?:is|itself)\s+(?:why|what)\s+(?:it|the\s+thing|nothing)\s+(?:doesn'?t|won'?t|fails?)\b/i,
  /\bnot\s+because\s+it\s+(?:doesn'?t|won'?t|failed)\b[^.]{0,30}\bbecause\s+(?:you|your)\b/i,
  /\bit\s+(?:works?|only\s+works?)\s+(?:only\s+)?(?:if|when)\s+you\s+(?:truly\s+)?(?:believe|have\s+faith)\b/i,
  /\bif\s+you\s+(?:cannot|can'?t)\s+see\b[^.]{0,40}\byou\s+(?:are|were)\s+(?:not|n'?t)\s+(?:yet\s+)?(?:awakened|ready|worthy|pure|initiated|open)\b/i,
  /\bthat\s+(?:only\s+)?(?:proves?|shows?|means?)\s+(?:that\s+)?you\s+(?:did\s+not|didn'?t|do\s+not|don'?t|lack)\b/i,
  // r285 补腿（从 ASSERT_EN 移入：此形态本身即 CN-D 资格不足，：`those who cannot … are simply not ready` 主语是 those who
  // 不是 you（E1 漏检根因：原腿只在 ASSERT_EN 腿①，腿②零命中）。
  // 注意 E1 实际形态是 `those who cannot are simply not ready`——cannot 后
  // **无动词**（承前省略），故必须单列不带动词的省略形。
  /\b(?:those|anyone|people|one)\s+who\s+(?:cannot|can'?t|could\s+not)\b[^.;]{0,60}\b(?:are|is)\s+(?:simply\s+|merely\s+|just\s+)?(?:not|n'?t)\s+(?:yet\s+)?(?:ready|awakened|worthy|prepared|ripe|qualified|chosen|open|devoted|there\s+yet)\b/i,
  // r285 补腿（从 ASSERT_EN 移入：此形态本身即 CN-D 资格不足，：带动词的完整形
  /\b(?:those|anyone|people|one)\s+who\s+(?:cannot|can'?t|could\s+not)\s+(?:see|perceive|detect|feel|sense|sense|understand)\b[^.;]{0,60}\b(?:are|is)\s+(?:simply\s+|merely\s+|just\s+)?(?:not|n'?t)\s+(?:yet\s+)?(?:ready|awakened|worthy|prepared|ripe|qualified|chosen|open|devoted)\b/i,
  // r285 矩阵补腿：EN CN-D「反证 = 主体没做对」族。矩阵实测四条穿透——
  //   `our instruments just aren't sensitive enough to detect it`
  //   `you simply didn't follow it correctly`
  //   `your sincerity was insufficient`
  //   `the timing is simply not right`
  // 共同结构：否定性结果 + 仪器/主体/资质/时机一侧的缺陷归因。
  // 「aren't sensitive enough」形：仪器能力不足被当作「测不到」的根据。
  /\b(?:instruments?|devices?|equipment|sensors?|tools?)\s+(?:are|is)?\s*(?:just\s+|simply\s+|merely\s+|only\s+)?(?:not|n'?t)\s+(?:yet\s+)?(?:sensitive|precise|advanced|powerful|accurate)\s+enough\b/i,
  // `our instruments just aren't sensitive enough`——just + are n't 中间无 be 动词的缩写形
  /\b(?:instruments?|devices?|equipment|sensors?|tools?)\s+(?:just\s+|simply\s+|merely\s+|only\s+)?(?:are|is)?\s*n'?t\s+(?:yet\s+)?(?:sensitive|precise|advanced|powerful|accurate)\s+enough\b/i,
  // `aren't (yet) able/sensitive to detect`——缩写形 + detect 动词后置
  /\b(?:instruments?|devices?|equipment|sensors?|tools?|science|we)\s+(?:just\s+|simply\s+|merely\s+)?n'?t\s+(?:yet\s+)?(?:able\s+to\s+)?(?:detect|measure|observe|see|sense|perceive|replicate|verify|test)\b/i,
  /\b(?:instruments?|devices?|equipment|sensors?|tools?|science|we)\s+(?:cannot|can'?t|could\s+not)\s+(?:be\s+)?(?:measured|detected|observed|seen|perceived|quantified|tested|replicated)\b/i,
  /\b(?:instruments?|devices?|equipment|sensors?)\s+(?:are|is)\s+(?:just\s+|simply\s+)?(?:too\s+)?(?:crude|primitive|limited|weak)\s+(?:to\s+detect|to\s+measure|for\s+this)\b/i,
  // 「you simply didn't do/follow X correctly」——反证归因于执行不到位
  /\byou\s+(?:just\s+|simply\s+|merely\s+)?(?:didn'?t|did\s+not|don'?t|do\s+not|failed\s+to)\s+(?:follow|apply|use|do|execute|practise|practice|implement)\s+(?:it\s+)?(?:correctly|properly|right|as\s+(?:instructed|intended|prescribed))\b/i,
  // 「your sincerity/belief/faith was insufficient」——反证归因于信仰强度
  /\byour\s+(?:sincerity|belief|faith|devotion|commitment|conviction|effort|practice)\s+(?:was|is)\s+(?:just\s+|simply\s+)?(?:insufficient|inadequate|not\s+(?:enough|deep|strong|genuine))\b/i,
  // 「the timing is simply not right / not yet ripe」——不给定时点的延期归因
  /\bthe\s+(?:timing|time|moment|season)\s+(?:is|was)\s+(?:just\s+|simply\s+)?(?:not|n'?t)\s+(?:right|ripe|yet)\b/i,
  /\b(?:it|this|things?)\s+(?:will\s+)?(?:only\s+)?makes?\s+sense\s+(?:in\s+time|eventually|when\s+the\s+time\s+is\s+right)\b/i,
  // 「that only means you were not ready/wrong」——反证重定义为主体未就绪
  /\b(?:that|this|it)\s+(?:only\s+)?(?:means?|shows?|proves?)\s+(?:that\s+)?(?:you|your)\s+(?:position|judgment|judgement|call|timing|view)\s+(?:was|is)\s+(?:wrong|the\s+error|mistaken|incorrect)\b/i,
];

// ─── 腿②（中文，CN-A/B/C：需与腿①共现）────────────────────
const SEAL_ZH = [
  // CN-A 不可观测实体
  // r161 教训 + r244 实测：「无法被观测到」的「被」字使原正则整句漏判——
  // 中文被动标记（被/受/所/为…所）必须显式收进可选位。
  /(?:测不到|测量不到|观测不到|看不见|看不着|察觉不到|感知不到|探测不到|捕捉不到|无法测量|无法观测|无法检测|无从观测|无从检测|验证不了)/,
  /(?:无法|不能|没法|无从|难以|得以|根本)[^。！？!?]{0,2}(?:被|受|所|为)?[^。！？!?]{0,2}(?:测量|观测|检测|察觉|感知|探测|捕捉|看到|看见|记录|证实|验证|复现|推翻|证伪)/,
  /(?:被|受|所|为)[^。！？!?]{0,4}(?:观测|测量|检测|察觉|感知|探测|记录|证实|推翻|证伪)/,
  /(?:科学(?:仪器)?(?:目前)?(?:还)?(?:测不出|无法)|(?:目前|现在)?(?:科学|仪器)?(?:尚未|还没|未能)?(?:发现))/,
  /(?:肉眼(?:看不见|看不到|无法)|超出(?:人类|我们|凡人)(?:的)?(?:感知|感官|认知|理解))(?:范围|能力|之外)?/,
  /(?:另一套|另有一个|隐藏的|隐秘的|暗中的|无形的|另外一个)(?:世界|维度|空间|层面|秩序|法则|力量|体系)/,
  /(?:更高(?:维度|层次|层面|境界)|另一个世界|灵界|仙界|神界|彼岸|超自然)/,
  /(?:任何|所有)(?:仪器|设备|手段|工具|方法)(?:都)?(?:无法|不能|不可能|无从)/,
  /(?:超越|超出)[^。！？!?]{0,6}(?:一切|所有|任何)[^。！？!?]{0,4}(?:测量|观测|检测|认知|理解|科学)/,
  // CN-B 事后可调解释
  /(?:无论|不管|不论)[^。！？!?]{0,16}(?:结果|发生什么|怎样|如何)[^。！？!?]{0,10}(?:都|也|均|总)(?:能|可以|可|足以)/,
  /(?:无论|不管|不论)[^。！？!?]{0,20}(?:都|也|均|总)[^。！？!?]{0,8}(?:能|可以|可|足以)[^。！？!?]{0,8}(?:解释|圆|说通|自圆|纳入|套进|套用)/,
  /(?:怎么|如何)[^。！？!?]{0,8}(?:解释|说|圆|自圆其说)[^。！？!?]{0,10}(?:都|也)(?:通|对|成立|说得通)/,
  /(?:正说|反说|怎么说|横说竖说)[^。！？!?]{0,8}(?:都|也)/,
  /(?:都能|也可以|都能被|照样能|终究能)[^。！？!?]{0,12}(?:解释|圆|自圆|说通|套进去|纳入)/,
  // 「都能被解释成 X」——解释成 + 任意结论词（支持/反对/无关均可）
  /(?:都能|可以|均能|皆能|照样能)[^。！？!?]{0,4}(?:被)?[^。！？!?]{0,6}解释成/,
  /(?:换一种|换个)(?:说法|解释|角度|框架|理论|体系)[^。！？!?]{0,10}(?:就|又|也)(?:能|可以|成立)/,
  // 「X 被（重新）定义为 Y」——把反证观测换标签
  /(?:被|受到|遭)[^。！？!?]{0,4}(?:重新)?(?:定义|解释|界定|归类)[^。！？!?]{0,6}(?:为|成|作)/,
  // 「X 本身被污染/有问题」——反证被归因于观测手段
  /(?:数据|证据|结果|观测|样本|实验)[^。！？!?]{0,6}(?:本身|自己)?[^。！？!?]{0,4}(?:被污染|被篡改|有问题|有偏|不可信|不算数|不作数|无效)/,
  // CN-C 无限延期验证
  /(?:将来|未来|有朝一日|总有一天|早晚|迟早|届时|多年以后|子孙后代|后人)[^。！？!?]{0,12}(?:会|终将|必然|自然|终究)[^。！？!?]{0,8}(?:证明|验证|见证|见分晓|明白|理解|认可|平反|应验|兑现|正名|洗清|还我们|澄清)/,
  // 「（我们的选择/做法）会被正名」——被动形态
  /(?:会|终将|必将|必然|终究|迟早)[^。！？!?]{0,6}(?:被|受|得到|获得)[^。！？!?]{0,6}(?:正名|平反|洗清|澄清|认可|理解|证明)/,
  // 「超出了一般认知/当前理解」——把超出认知当作该断言成立的根据
  /(?:超出|超越|脱离)[^。！？!?]{0,8}(?:认知|理解|认识|常识|经验|科学|现有|当前|我们)/,
  /(?:时间|历史|后人|子孙|时代)(?:会|终将|必将|必然|终究)[^。！？!?]{0,8}(?:证明|验证|给出|见证|说明)/,
  /(?:现在|目前|暂时|眼下|当下)[^。！？!?]{0,8}(?:无法|不能|没法|无从)[^。！？!?]{0,6}(?:验证|证实|理解|接受|认识|看清|证明|检验)/,
  /(?:未经|尚待|有待)[^。！？!?]{0,6}(?:检验|验证|证实|证伪)/,
  // 「（科学/暂时）还不能解释 X」——把当前无法解释当作支持该断言的根据
  /(?:暂时|目前|现在|一时)?[^。！？!?]{0,4}(?:还)?(?:不能|无法|没法|无从)(?:被)?[^。！？!?]{0,4}(?:解释|理解|认识|说明)/,
  /科学(?:目前)?(?:还)?(?:无法|不能)[^。！？!?]{0,6}(?:解释|证明|认识|理解|检测|测量|观测)/,
  // 「时机未到/时候未到」——不给定时点的延期
  /(?:时机|时候|时辰|机缘)[^。！？!?]{0,4}(?:未到|不到|未至|未熟|不成熟)/,
  // r285 实测补腿：CN-C 延期验证须覆盖「（X）成熟的时候」与「凡人无法预测」
  // 两种不给定时点的延期宣告（A9 漏检根因：原正则只收「未到」否定形）。
  /(?:成熟|到了|来临|到来|降临)的?(?:时候|时机|时辰|一天|时刻)/,
  /(?:凡人|普通人|一般人|世人|肉眼凡胎|人类)[^。！？!?]{0,4}(?:无法|不能|无从|难以)[^。！？!?]{0,4}(?:预测|预知|揣测|估量|窥测|看透|看穿|洞察)/,
  /(?:无法|不能|无从|难以)[^。！？!?]{0,4}(?:预测|预知|揣度|估量|窥测|逆料|预料)/,
];

// ─── 腿②（英文）────────────────────────────────────────────
const SEAL_EN = [
  // EN-A unobservable entity
  /\b(?:cannot|can'?t|could\s+not|unable\s+to)\s+(?:be\s+)?(?:measured|detected|observed|seen|perceived|quantified|tested)\b/i,
  // r285 补腿：主动语态「X cannot measure/see Y」+ 把「测不到」当论据的
  // `eludes every laboratory` 形（E2 漏检根因：原表只收被动 `be measured`）
  // 主语不含 we：`We cannot observe the cosmic neutrino background directly…`
  // 是标准科学局限陈述，收 we 会误伤（N12 实证）。
  /\b(?:science|scientists?|instruments?|researchers?|no\s+(?:instrument|device|experiment|test))\s+(?:cannot|can'?t|could\s+not)\s+(?:measure|detect|observe|see|perceive|replicate|verify|test|explain)\b/i,
  /\b(?:eludes?|escapes?|defies?|evades?)\s+(?:all\s+|every\s+|any\s+)?(?:measurement|detection|observation|explanation|verification|laborator(?:y|ies)|instruments?|science)\b/i,
  /\b(?:works?|operates?|functions?|exists?|lies?)\s+(?:on|in|at)\s+(?:a|an|the)?\s*(?:level|plane|realm|dimension|frequency|vibration)\b/i,
  /\b(?:works?|operates?)\s+on\s+(?:a\s+)?(?:level|plane|dimension|frequency)\b/i,
  /\b(?:beyond|outside|above)\s+(?:all\s+|any\s+|the\s+)?(?:reach\s+of\s+)?(?:measurement|detection|observation|science|proof|verification)\b/i,
  /\b(?:beyond|outside)\s+(?:the\s+reach\s+of\s+)?(?:measurement|detection|observation|science|human\s+(?:perception|comprehension|understanding))\b/i,
  /\b(?:invisible|unobservable|undetectable|imperceptible|immeasurable)\s+(?:to\s+)?(?:science|instruments?|us|the\s+naked\s+eye)?\b/i,
  /\b(?:another|other|hidden|parallel|higher)\s+(?:dimension|realm|plane|level|world|order|reality)\b/i,
  /\bno\s+(?:instrument|device|tool|method|apparatus)\s+(?:can|could)\s+(?:ever\s+)?(?:detect|measure|observe)\b/i,
  // EN-B unfalsifiable-by-construction explanation
  /\b(?:no\s+matter\s+what|whatever)\s+(?:happens?|the\s+outcome|the\s+result)\b[^.]{0,30}\b(?:can|could|will)\s+(?:be\s+)?(?:explained|interpreted|reconciled|accommodated|spun)\b/i,
  /\b(?:no\s+matter\s+what|whatever)\s+(?:happens?|the\s+outcome|the\s+result)\b[^.]{0,40}\b(?:can|could|will)\b/i,
  /\b(?:can|could)\s+be\s+(?:explained|interpreted|spun|reconciled|accommodated)\s+(?:either\s+way|both\s+ways|any\s+way|to\s+fit|as\s+support)\b/i,
  /\b(?:can|could)\s+(?:always\s+)?be\s+(?:explained|interpreted|spun)\b/i,
  /\b(?:the\s+)?(?:theory|framework|claim|model|approach)\s+(?:can|could)\s+(?:always\s+)?be\s+(?:explained|reconciled|accommodated)\b/i,
  /\b(?:interpreted|explained|spun)\s+(?:to\s+fit|in\s+any\s+way|however\s+you\s+like)\b/i,
  /\b(?:reframe|reframing|reinterpretation|reinterpret)\s+(?:it|this|anything)\s+(?:to|and\s+it)\s+(?:fit|works|still\s+holds)\b/i,
  /\b(?:either|which\s+ever)\s+way\b[^.]{0,30}\b(?:supports?|confirms?|fits?|works?)\b/i,
  // EN-C indefinitely deferred verification
  /\b(?:time|history|posterity|future\s+generations?|the\s+future)\s+(?:will|shall|eventually|ultimately)\s+(?:tell|prove|show|reveal|vindicate|judge)\b/i,
  /\b(?:only\s+)?(?:time|history|the\s+future)\s+will\s+(?:tell|prove|show|reveal|vindicate)\b/i,
  /\b(?:will\s+be\s+)?(?:vindicated|proven\s+right|validated)\s+(?:in\s+the\s+(?:long\s+run|end|future|lapse\s+of\s+time))\b/i,
  /\b(?:vindicate|prove\s+right|validate|justify)\b[^.]{0,40}\b(?:whatever|no\s+matter\s+what|regardless\s+of)\b/i,
  /\b(?:cannot|can'?t)\s+(?:yet\s+)?(?:be\s+)?(?:verified|confirmed|proven|tested|falsified)\s+(?:yet|at\s+this\s+time|for\s+now|currently)\b/i,
  /\bbeyond\s+(?:current\s+)?(?:scientific\s+)?(?:understanding|explanation|comprehension)\b/i,
  /\b(?:impossible|not\s+possible)\s+(?:for\s+)?(?:us|humans?|anyone)\s+to\s+(?:predict|foresee|know|verify|measure|test)\b/i,
  /\bwhen\s+the\s+(?:time|moment|season)\s+is\s+(?:right|ripe|mature)\b/i,
];

// ─── 豁免表 ─────────────────────────────────────────────────
// 1) 科学假说/可检验预测：给出可证伪条件正是本族要教的判别动作
const EXEMPT_FALSIFIABLE_ZH = /可证伪|可检验|可否证|可验证|可观测|可测量|可重复|可复现|双盲|对照实验|对照组|盲测|随机对照|置信区间|显著性|p\s*[<＜=]\s*0?\.\d|预注册|可操作化|可观测指标|证伪条件|判决性实验|关键实验|重复实验|被证伪|无法被证伪|不足以|证据不足|尚无证据/;
const EXEMPT_FALSIFIABLE_EN = /\bfalsifiab\w+\b|\btestab\w+\b|\bverifiab\w+\b|\bobservab\w+\b|\bmeasurab\w+\b|\breproducib\w+\b|\breplicab\w+\b|\bdouble[- ]blind\b|\bcontrol\s+group\b|\brandomi[sz]ed\b|\bconfidence\s+interval\b|\bstatistically\s+significant\b|\bp\s*[<≤=]\s*0?\.\d|\bpre[- ]?registered?\b|\boperationali[sz]\w+\b|\bcrucial\s+experiment\b|\breject(?:ed)?\s+the\s+(?:null\s+)?hypothesis\b|\bhas\s+not\s+been\s+(?:proven|established|confirmed)\b/i;

// 2) 范围限定/对冲
const EXEMPT_HEDGE_ZH = /可能|也许|或许|未必|不一定|不见得|说不定|很难说|说不准|不能排除|难以排除|无法排除|不排除|有待|尚需|还需|仍待|待观察|待验证|待定|尚不清楚|尚无定论|存疑|有争议|尚未|仍未|暂未/;
const EXEMPT_HEDGE_EN = /\bmaybe\b|\bperhaps\b|\bpossibly\b|\bprobably\b|\bmight\b|\bmay\b|\bcould\s+be\b|\bnot\s+necessarily\b|\bnot\s+clear\b|\buncertain\b|\bdebated\b|\bcontested\b|\bunresolved\b|\bpreliminary\b|\byet\s+to\s+be\b|\bnot\s+yet\s+(?:been\s+)?(?:confirmed|proven|established)\b/i;

// 3) 概念/教学转述（讨论可证伪性本身不是不可证伪）
const EXEMPT_META_ZH = /波普尔|波普|可证伪性|证伪主义|科学哲学|方法论|范式|百科全书|教材|课堂|课程|论文|定义|概念|称为|所谓|是指|区别于|相对而言|反例|判决性|拉卡托斯|库恩|学界|科学界|教科书/;
const EXEMPT_META_EN = /\bpopper\b|\bfalsifiab\w+\b|\bscientific\s+method\b|\bphilosophy\s+of\s+science\b|\btextbook\b|\blecture\b|\bcourse\b|\bdefinition\b|\bdefined\b|\bconcept\b|\bcalled\b|\bknown\s+as\b|\be\.g\.\b|\bfor\s+example\b|\bacademia\b|\bscientific\s+community\b/i;

// 4) 拒绝推断/承认局限
const EXEMPT_NEG_ZH = /不等于|不代表|不意味着|并不意味着|推不出|推断不出|不能说明|不足以|并不说明|无法说明|算不了|算不上|说明不了|证明不了|不构成|不能据此|无法据此|不可据此|难以据此|尚无证据|证据不足|无法被证伪|无法证实|不能最终证实|排斥|正是它被|被科学界排斥|就没有|便没有|即无|并不具有|不具有|算不上是|称不上|不成立|不算数|不可信|不靠谱|站不住|说不过去|不科学|伪科学|非科学/;const EXEMPT_NEG_EN = /\bdoes\s+not\s+mean\b|\bdoesn'?t\s+mean\b|\bdoes\s+not\s+prove\b|\bdoesn'?t\s+prove\b|\bcannot\s+conclude\b|\bcan'?t\s+conclude\b|\bno\s+evidence\b|\binsufficient\s+evidence\b|\bnot\s+the\s+same\s+as\b|\babsence\s+of\s+evidence\b|\bcannot\s+be\s+falsified\b|\bnot\s+(?:yet\s+)?(?:been\s+)?(?:proven|established|confirmed)\b|\bso\s+the\s+model\s+(?:needs|must)\s+revision\b|\bresults\s+contradict\b|\bcontradicts?\s+the\s+(?:model|prediction|theory)\b/i;

// 4b) 工程/技术局限陈述：说明「当前测不到/验不了」并给出替代路径或
// 明确的工程语境，是把局限当事实汇报，不是把不可验证当论据。
// （N22 误伤根因：「目前尚无法实时验证…只能离线批量评估」）
// r285 修正：第一版收「用/以/通过」等单字介词，误吞 A4
// （「…所以算命的结果无法被验证」含「以」）——改为只收明确的
// 工程动作短语，不收裸介词与裸动词。
const EXEMPT_ENG_ZH = /只能(?:离线|批量|间接|改用|转为|退而)|退而求其次|转而(?:采用|改用|使用)|改为(?:离线|批量|间接|采样|估算)|改用|采用(?:间接|代理|近似|估算|采样|仿真|模拟)|借助(?:于)?(?:间接|代理|近似)|间接(?:推断|估算|测量|观测|验证|获得|取得)|替代(?:方案|手段|指标|方法|路径)|代理(?:指标|变量|方法|手段)|离线(?:批量|评估|分析)|批量(?:评估|分析|处理)|采样(?:估计|推断|分析)|近似(?:估计|计算|处理)|估算|仿真|模拟(?:验证|实验)|降级(?:处理|运行|运行模式)/;
const EXEMPT_ENG_EN = /\b(?:only\s+)?(?:can|could)\s+(?:only\s+)?(?:be\s+)?(?:done|achieved|measured|assessed|verified|validated)\s+(?:by|through|via|using|offline|in\s+batch)\b|\binstead\b|\brather\s+than\b|\bworkaround\b|\bfall\s+back\b|\bby\s+means\s+of\b|\b(?:proxy|proxied)\s+(?:metric|variable|measure|indicator|for)\b|\bmeasured\s+indirectly\b|\bapproximate[ds]?\s+(?:by|with|using)\b|\bestimated\s+(?:from|using|via)\b|\bsampl(?:e|ed|ing)\s+(?:estimate|based)\b|\bsimulat(?:e|ed|ion)\b|\boffline\s+(?:batch|evaluation|analysis)\b|\bbatch\s+(?:evaluation|processing|analysis)\b/i;

// 5) 疑问句
const EXEMPT_QUESTION = /[?？]/;

// 6) 第一人称/叙述性转述（"他坚持认为…"是描述他人立场，不是断言本身）
const EXEMPT_REPORT_ZH = /他认为|他觉得|他坚持|他相信|在他看来|按他的说法|有人主张|一派认为|有种观点|所谓.{0,6}的说法|批评者认为|反对者认为|怀疑者认为|作者认为|(?:他|她)[^。！？!?]{0,4}坚信/;
// 转述豁免只认「主语 + 转述动词」的句首结构；`whatever today's critics say`
// 是从句尾的让步状语，不是转述，故不收 `critics say` 这类尾随形（A20 误伤根因）。
const EXEMPT_REPORT_EN = /^\s*(?:he|she|they|critics?|skeptics?|proponents?|the\s+authors?|some|many)\s+(?:believes?|argues?|claims?|insists?|maintains?|say|says|said|conclude[sd]?|convince[ds]?)\b/i;

const NEAR_WINDOW_ZH = 60;
const NEAR_WINDOW_EN = 160;

function _isEnglish(text) {
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  return cjk === 0 && /[a-zA-Z]{3,}/.test(text);
}

function _normText(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/\s+/g, ' ').trim();
}

function _anyIn(text, list) {
  for (const re of list) if (re.test(text)) return true;
  return false;
}

function _nearWindow(text, leg1List, leg2List, window) {
  let p1 = -1;
  for (const re of leg1List) {
    const m = text.search(re);
    if (m >= 0 && (p1 < 0 || m < p1)) p1 = m;
  }
  if (p1 < 0) return false;
  let p2 = -1;
  for (const re of leg2List) {
    const m = text.search(re);
    if (m >= 0 && (p2 < 0 || m < p2)) p2 = m;
  }
  if (p2 < 0) return false;
  return Math.abs(p2 - p1) <= window;
}

/**
 * 不可证伪断言检测器。
 * @param {string} rawText 待判文本
 * @returns {{score:number, findings:Array, legs:Object, exempt:boolean}}
 */
function checkUnfalsifiableAssertion(rawText) {
  const text = _normText(rawText);
  if (!text || text.length < 4) return { score: 0, findings: [], legs: {}, exempt: false };

  const en = _isEnglish(text);
  const leg1 = en ? ASSERT_EN : ASSERT_ZH;
  const leg2 = en ? SEAL_EN : SEAL_ZH;
  const leg2D = en ? SEAL_EN_CN_D : SEAL_ZH_CN_D;
  const window = en ? NEAR_WINDOW_EN : NEAR_WINDOW_ZH;

  // ── 豁免层 ──
  const hasQ = EXEMPT_QUESTION.test(text);
  if (hasQ) return { score: 0, findings: [], legs: {}, exempt: true };

  // 科学假说/可检验预测优先于一切（本族最核心的良性形）
  if ((en ? EXEMPT_FALSIFIABLE_EN : EXEMPT_FALSIFIABLE_ZH).test(text)) {
    return { score: 0, findings: [], legs: {}, exempt: true };
  }
  if ((en ? EXEMPT_META_EN : EXEMPT_META_ZH).test(text)) {
    return { score: 0, findings: [], legs: {}, exempt: true };
  }
  if ((en ? EXEMPT_REPORT_EN : EXEMPT_REPORT_ZH).test(text)) {
    return { score: 0, findings: [], legs: {}, exempt: true };
  }
  if ((en ? EXEMPT_NEG_EN : EXEMPT_NEG_ZH).test(text)) {
    return { score: 0, findings: [], legs: {}, exempt: true };
  }
  if ((en ? EXEMPT_ENG_EN : EXEMPT_ENG_ZH).test(text)) {
    return { score: 0, findings: [], legs: {}, exempt: true };
  }
  if ((en ? EXEMPT_HEDGE_EN : EXEMPT_HEDGE_ZH).test(text)) {
    return { score: 0, findings: [], legs: {}, exempt: true };
  }

  // ── 判定：CN-D 独立成案；CN-A/B/C 需与腿①共现 ──
  const hitD = _anyIn(text, leg2D);
  if (hitD) {
    return _verdict(text, en, 92, { assertion: false, seal: true, cnd: true });
  }

  const hit1 = _anyIn(text, leg1);
  const hit2 = _anyIn(text, leg2);
  if (!hit1 || !hit2) return { score: 0, findings: [], legs: {}, exempt: false };
  if (!_nearWindow(text, leg1, leg2, window)) {
    return { score: 0, findings: { leg1: hit1, leg2: hit2, window }, exempt: false };
  }
  return _verdict(text, en, null, { assertion: true, seal: true, cnd: false });
}

/** 构造最终判定结果。base 为 null 时按形态加成计分。 */
function _verdict(text, en, base, legs) {
  let score = base === null ? 60 : base;
  if (en && base === null) score += 6;

  // 强形态加成：不可观测实体 × 机制归因（最典型的构造性不可证伪）
  const unobservable = en
    ? /\b(?:invisible|unobservable|undetectable|imperceptible|immeasurable)\b/i
    : /(?:测不到|测量不到|观测不到|看不见|看不着|察觉不到|感知不到|探测不到|捕捉不到|无法测量|无法观测|无法检测|无从观测|无从检测)/;
  if (unobservable.test(text)) score += 16;

  // 强形态加成：万能免责（信仰即判据）
  const escapeHatch = en
    ? /\b(?:truly|really|genuinely|sincerely)\s+(?:believed?|had\s+faith)\b|\byour\s+(?:doubt|skepticism|disbelief|unbelief)\b/i
    : /(?:心诚|诚心|信念足够|信仰坚定|足够虔诚|真心相信)|信则|信就|信者|(?:怀疑|不信|质疑|不诚|不敬)/;
  if (escapeHatch.test(text)) score += 16;

  // 强形态加成：事后可调解释
  if (en ? /\b(?:no\s+matter\s+what|whatever)\s+(?:happens?|the\s+outcome)\b/i
         : /(?:无论|不管|不论)[^。！？!?]{0,16}(?:结果|发生什么|怎样|如何)/) {
    score += 10;
  }

  if (score > 96) score = 96;
  if (score < 40) score = 40;

  const mode = legs.cnd
    ? '万能免责（把反证观测重新定义为「主体不够诚/不够信」）'
    : '实质性断言→构造上排斥反证';

  return {
    score,
    findings: [{
      dimension: 'unfalsifiable_assertion',
      severity: score,
      details: `不可证伪断言（${mode}）`,
      guidance: '把断言改成可以被推翻的形式：给出可观测指标、判决性条件与失败判据（「若 X 发生则本解释不成立」）；若断言指向当前不可观测的实体，须明示它何时、以何种观测可被检验，而不是把「测不到」当作支持',
    }],
    legs,
    exempt: false,
  };
}

module.exports = { checkUnfalsifiableAssertion };
