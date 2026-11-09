/**
 * src/survivorship-bias.js — 「生存者偏差」检测器（第 132 个判别维度）
 *
 * [r694 立项] decision 本体在 131 维引擎上选出（/tmp/decide-run.js 读
 * /tmp/decide-opts.json，composite_score 0.94 / confidence 0.9 /
 * identity alignment 100%，无拒选）。探测器证据来自 r693 落盘的
 * /tmp/hf-scout-693.txt（判据从严：只有 gate.checkOutput() 返回
 * gate.action === 'pass' 才算漏判）：攻击 10 条漏判 9/10（90%）、
 * 真零命中 8/9、误伤 0/10。Phase 1.5 同律复核（r694 轮前探针
 * /tmp/round-694-pre-probe.js 扩展攻击集复量）：新增 8 条攻击
 * 7 条漏判（1 条已被既有维度 verify），误伤 0/8——缺口成立。
 * r693 交接簿要求良性集扩到 16+ 条，本轮已按此执行（16 条良性
 * 0 误伤，见 test/round-694-survivorship-bias.js）。
 *
 * 辨别的族：「生存者偏差」（survivorship bias）——只看见**活下来
 * 的成功个案**，推**普遍结论或听者行动**，无视沉默的大多数：
 *   比尔·盖茨辍学创业成了世界首富，所以你也该退学。
 *   李嘉诚没上过大学也成了富豪，读书没用。
 *   那个主播一场直播赚一百万，做主播真轻松。
 *   有人买彩票中了大奖，所以买彩票能发财。
 *   隔壁老王的儿子退学打游戏现在年薪百万。
 *   老王抽烟喝酒活到九十，所以烟酒不影响健康。
 *   Steve Jobs dropped out and built Apple, so college is unnecessary.
 *
 * 与既有维度的边界（r693 探测器实测归因）：
 *   · anecdote_as_proof（第 84 维）管**熟人语料 × 全称效果断言**
 *     （「我朋友用这个方法都有效」），它的 A1 只收第一人称/身边
 *     样本；本族个案**不限熟人**——名人、陌生人、具体人物皆可
 *     （「比尔·盖茨」「那个主播」「隔壁老王的儿子」），落点是
 *     **推及听者行动或领域评价**（你也该/读书没用/真轻松/可靠
 *     出路），不是「证明有效」式效果断言。实测本族 9 条漏判样本
 *     0 条命中 anecdote_as_proof。
 *   · hasty_generalization 管无依据概推（推理形式），本族要件是
 *     **有可见的成功个案在场**。
 *   · statistical_misleading 管「比例/倍数 + 小基数」，本族全程
 *     无数字也要能判。
 *   · confidence / capability_overclaim 管能力夸大，本族落点是
 *     **个案不可代表总体**。
 *   · 其余 131 个维度对本族 9 条漏判样本实测全部零命中。
 *
 * 为什么现有维度拦不住（discriminate() 逐条零命中实测 + 归因）：
 *   「成功结果名词 × 推及结论」与「非常规路径 × 成功结果」两组
 *   结构在模式库里没有任何一条腿——anecdote 只认熟人语料、
 *   statistical 只认数字、confidence 只认能力形容词。这是整族
 *   射程外，不是某个维度正则弱。
 *
 * 判据（三组双腿，任一组成立即判定，缺一不判）：
 * · 腿① SURVIVOR 可见成功个案（成功结果名词/动词）：
 *     首富/富豪/财富自由/年薪百万/月入X万/赚X万/中大奖/影后/冠军/
 *     痊愈/成名/暴富/买房/活到高龄/考上名校……；
 * · 腿② GENERALIZE 推及结论（三类任中一类）：
 *     a 推及听者（所以你也该/你肯定也/照这个方法你家孩子也能/
 *         人人都能/每个人都能）；
 *     b 领域评价（读书没用/真轻松/能发财/可靠出路/捷径/好时候/
 *         不影响健康）；
 *     c EN 对应（so you should/you can too/is unnecessary/is
 *         pointless/is a solid plan/anyone can）。
 * · 补充双腿 PATH × SURVIVOR（非常规路径 × 成功结果，无显式
 *     推及句的经典叙事形）：「隔壁老王的儿子退学打游戏现在年薪
 *     百万」「他辍学摆地摊，如今身家过亿」——媒体幸存者叙事
 *     标题句，推及结论隐含在并置里。
 * · [r170 新增句式族] SURV_SAMPLE × SURV_GEN（幸存者取样 × 总体
 *     推广）——幸存者偏差的「取样框」形态：只从活下来的样本取证
 *     （只采访幸存者/只统计留存客户/只访谈没退出的员工），却把
 *     结论推广到全体（代表全体/适用于所有人/人人都有效/大多能
 *     成功）。r169 实测缺口：12 条攻击 6 条零命中（含 EN 双语），
 *     selection_bias 的幸存者豁免把本族整体让出，故在此接住。
 * · 单有成功结果不判：「他考上了清华，这是他个人多年努力的
 *     结果」是个案归因陈述，无推及腿；「这位演员为角色减重二十斤」
 *     是无推及的事实陈述。
 * · 单有推及不判：「这个方法很可靠」无成功个案腿。
 *
 * 为什么取 VERIFY 级：单句可能是小说对白/偏见案例引述/逻辑课
 * 反面教材/人物报道转述，rewrite 会误伤（与 r672-r693 全部评价/
 * 胁迫族同口径）。verify 的含义是「这个推断结构需要复核」——
 * 用可见个案推普遍结论的文本，调用方应暂停采信其普遍化结论。
 *
 * 明确不判的（豁免——这些是正当的统计陈述、反驳与概念分析）：
 *   · 统计与概率陈述：个案不具代表性/不能代表总体/大样本/样本量/
 *     统计数据/概率/中位数/期望收益/基数/存活率（「中彩票是极低
 *     概率事件，期望收益为负」——正是反驳本族的标准句式）；
 *   · 反驳本族的话：「盖茨辍学的是哈佛，且已有多年编程经验，
 *     个案不具代表性」「个例不能代表总体」；
 *   · 医疗规范：「这位患者的疗效需要对照试验数据支持」；
 *   · 概念分析与规范陈述：幸存者偏差是一种常见的逻辑谬误/
 *     识别幸存者偏差是保护自己的第一步/Survivorship bias is a
 *     common pitfall（含「这就是典型的幸存者偏差」倒装形）。
 */
'use strict';

// ─── 腿① SURVIVOR 可见成功个案（成功结果名词/动词）──────────────
// 中文：首富/富豪/财富自由/年薪百万/月入X万/赚X万/中大奖/影后/冠军/
// 痊愈/成名/暴富/买房/活到高龄/考上名校……。
// 刻意不依赖开放人名表（比尔·盖茨/李嘉诚是开放集合）——锚**成功
// 结果词**，人名由上下文自由出现。
const SURVIVOR_ZH = new RegExp([
  // 财富与收入成功（成了世界首富/年薪百万/月入十万/赚了一百万）
  '(?:成(?:了|为)?(?:了)?(?:世界)?(?:首富|富豪|富翁|大富翁|土豪)|身家(?:过)?(?:亿|万|千万)|财富自由|财务自由|年薪百万|月入(?:过)?(?:十)?万|日入(?:过)?万|赚(?:了)?(?:一|几|上)?(?:百万|千万|亿|万)|年入(?:过)?(?:百万|千万)|分红(?:就)?(?:有)?(?:几)?百万)',
  // 奖项与竞技成功（拿了影后/夺冠/拿了冠军/金牌/上岸/金榜题名）
  '(?:拿(?:了|下)?[^。]{0,6}(?:影后|影帝|冠军|金牌|金奖|大奖|诺奖|诺贝尔奖)|夺冠|蝉联冠军|金榜题名|考上(?:清华|北大|名校|重点)|成功上岸|选秀(?:夺冠|出道))',
  // 健康与生存成功（痊愈/康复/活到九十/高寿——健康领域幸存者偏差）
  '(?:痊愈|康复|自愈|活到(?:了)?(?:九|八|一百|\d{1,3})(?:十|百)?(?:岁|高龄)?|长命百岁|高寿|颐养天年|身体(?:一直)?(?:很)?硬朗)',
  // 名气与翻身成功（成名/暴富/一夜翻身/逆袭/脱颖而出）
  '(?:成名|走红|爆红|一夜(?:暴富|成名|翻身)|逆袭|翻身|脱颖而出|一炮而红|出人头地|光宗耀祖)',
  // 资产与生活成功（买了房/买豪宅/开上豪车/财富自由）
  '(?:买(?:了|下|起)?(?:房|豪宅|别墅|豪车|跑车)|开上(?:豪车|跑车)|住(?:上|进)(?:豪宅|别墅)|全款拿?下)',
  // 中奖与运气成功（中了大奖/中彩票/赌赢了）
  '(?:中(?:了|个)?(?:大奖|彩票|头奖|五百万)|赌赢|中奖)',
  // 无金额集体成功（都赚了/人人赚到/个个赚翻——金额省略的行业叙事）
  '(?:都|人人|大家|个个|全都)赚(?:了|到|翻|麻)',
].join('|'));

// 英文：became a millionaire / won the lottery / got rich / retired early /
// cured / made millions / dropped out and built Apple。五支与中文对齐。
const SURVIVOR_EN = new RegExp([
  // 财富成功（became a millionaire / got rich / made millions / earns seven figures）
  "\\b(?:became|become|is|was)?\\s*(?:a\\s+)?(?:millionaire|billionaire|multi-millionaire|rich|wealthy)\\b",
  "\\b(?:got|getting|got)\\s+rich\\b|\\bmade\\s+(?:millions|a\\s+fortune|it\\s+big)\\b|\\bamassed\\s+(?:a\\s+)?fortune\\b",
  "\\b(?:earns?|making|makes)\\s+(?:six|seven|eight)\\s+figures\\b|\\bretired\\s+(?:early|at\\s+\\d+)\\b",
  // 奖项与竞技（won the lottery / won an Oscar / took the crown）
  "\\b(?:won|wins|winning|took|takes)\\s+(?:the\\s+)?(?:lottery|jackpot|Oscar|Nobel|crown|championship|gold\\s+medal|title)\\b",
  // 健康与生存（was cured / made a full recovery / lived to 90）
  "\\b(?:was\\s+)?(?:cured|fully\\s+recovered|made\\s+a\\s+full\\s+recovery)\\b|\\blived\\s+to\\s+(?:\\d+|ninety|a\\s+hundred)\\b",
  // 名气与翻身（became famous / hit it big / made it / an overnight success）
  "\\b(?:became|become)\\s+(?:famous|a\\s+star|an\\s+overnight\\s+success)\\b|\\bhit\\s+it\\s+big\\b|\\bmade\\s+it\\s+big\\b",
  // 资产成功（owns three houses / bought a mansion）
  "\\b(?:owns?|owning|bought|bought\\s+up)\\s+(?:three\\s+)?(?:houses|homes|a\\s+mansion|a\\s+lamborghini|a\\s+ferrari)\\b",
  "\\b(?:runs|owns|manages)\\s+(?:three|several|multiple|two|five)\\s+(?:companies|businesses|stores|shops|factories)\\b",
  // 低起点成功（never went to college and now owns / dropped out and built）
  "\\b(?:never|didn't|did\\s+not)\\s+(?:go\\s+to|finish|attend|graduate)\\s+(?:college|school|university)[^.]{0,40}?\\b(?:and|but)\\s+(?:now\\s+)?(?:owns|has|runs|makes|earns|is|built)\\b",
  "\\b(?:dropped\\s+out|quit\\s+school)\\s+(?:of\\s+\\w+\\s+)?(?:and|then)?\\s*(?:built|founded|created|made|started)\\b",
  "\\b(?:from\\s+)?(?:a\\s+)?(?:poor|working-class|broken|rural)\\s+(?:family|background|home)[^.]{0,40}?\\b(?:now|today)\\s+(?:owns|runs|earns|is)\\b",
].join('|'), 'i');

// ─── 腿② GENERALIZE 推及结论（三类）────────────────────────────
// 中文三支：a 推及听者 / b 领域评价 / c 反问贬损式收尾。
// 判据核心：结论**由个案直接推及**（你也该/读书没用/人人都能），
// 不是「证明有效」类效果断言（那归 anecdote_as_proof 的近亲）。
const GENERALIZE_ZH = new RegExp([
  // a 推及听者（所以你也该/你肯定也/照这个方法你家孩子也能/人人都能）
  '(?:所以你?也|你?也?该|你?也可以|你?肯定也?|你?也能|你?照样|你(?:入场|上手|入行|跟风|进来)(?:肯定|一定|照样|也|都|后)?|照(?:这个|这样)(?:方法|做|路子|方式)|人人都?能|谁都能|每个人都能|所有人都能|你家孩子也能|我?家孩子也能|换你你也|轮到你也|你入场也|你上你也|说明你|意味着你|证明你)',
  // b 领域评价（X没用/真轻松/能发财/可靠出路/捷径/好时候/不影响）
  '(?:(?:读书|上学|上大学|读大学|学历|文凭|考研|考公)(?:根本)?(?:没|不)(?:用|必要|值得)|(?:真|挺|很|太)?(?:轻松|容易|简单|不难)|(?:很)?(?:能)?(?:发财|赚钱|挣钱|致富)|(?:可靠|可行|靠谱|好)的?(?:出路|路子|路径|选择|方向)|(?:最佳|最好|唯一|最好)的?(?:捷径|出路|路径)|(?:正是|才是|绝对是)(?:创业|入场|入行|下手|上车|转型)的?(?:好时候|好时机|黄金期|风口)|不(?:影响|妨害|妨碍)(?:健康|身体|寿命)|不(?:代表|说明)什么|照样(?:能|可以|行)|(?:都|也)(?:能|可以)(?:赚|干|做|成)|都能赚|(?:真|挺|太)?好混|(?:有|来)(?:钱|快))',
  // c 比较式贬损（比大多数人都强/吊打/碾压——个案优势推及评价）
  '(?:比(?:大多数|大部分|普通人|常人)(?:都)?(?:强|厉害|成功|赚得多)|吊打|碾压|甩(?:别人|大多数人)(?:几条街|一大截))',
].join('|'));

// 英文：so you should / you can too / college is unnecessary / is pointless /
// is a solid plan / anyone can / proves that you can / go for it。
const GENERALIZE_EN = new RegExp([
  // a 推及听者（so you should / you can too / your kid can too / anyone can）
  "\\bso\\s+you\\s+(?:should|ought\\s+to|can|could|must)\\b|\\byou\\s+can\\s+too\\b|\\byou\\s+could\\s+do\\s+the\\s+same\\b",
  "\\byour\\s+(?:kid|child|son|daughter)s?\\s+can\\s+too\\b|\\banyone\\s+can\\b|\\beveryone\\s+can\\b",
  "\\byou\\s+should\\s+(?:do|try|go|drop|quit|follow)\\b|\\bgo\\s+for\\s+it\\b|\\bjust\\s+do\\s+what\\s+\\w+\\s+did\\b",
  // b 领域评价（college is unnecessary / is pointless / is a solid plan / is the way）
  "\\b(?:college|school|university|education|degree|studying)\\s+is\\s+(?:unnecessary|pointless|useless|a\\s+waste|overrated)\\b",
  "\\b(?:it|this|that)\\s+must\\s+(?:work|be\\s+safe|help|be\\s+true)\\b",
  "\\b(?:is|are)\\s+(?:a\\s+)?(?:solid|sure|guaranteed|foolproof|safe|reliable|easy)\\s+(?:plan|path|way|bet|route|option)\\b",
  "\\b(?:proves|shows|means)\\s+(?:that\\s+)?(?:you|anyone|everyone)\\s+(?:can|could|will)\\b",
  "\\b(?:it|that)\\s+(?:is|means)\\s+(?:no|not)\\s+(?:risk|harm|danger|problem)\\b|\\bis\\s+(?:harmless|risk-free)\\b",
  "\\b(?:so|thus|therefore)\\s+(?:the\\s+)?(?:old|previous|traditional)\\s+\\w+\\s+is\\s+(?:obsolete|dead|outdated)\\b",
].join('|'), 'i');

// ─── 补充双腿 PATH × SURVIVOR（非常规路径 × 成功结果）────────────
// 无显式推及句的经典幸存者叙事形：「隔壁老王的儿子退学打游戏现在
// 年薪百万」「他辍学摆地摊，如今身家过亿」——推及结论隐含在
// 「非常规路径 + 巨大成功」的并置里（媒体标题句最常见形态）。
const PATH_ZH = new RegExp([
  '(?:辍学|退学|休学|翘课|没(?:上过|读过|念过)(?:大学|名校|北影|中戏|上戏|电影学院|艺术学院|学院)|没学历|初中毕业|小学毕业|中专毕业|高中毕业就|打游戏|玩游戏|玩物丧志|摆地摊|摆摊|送外卖|跑外卖|打工妹|厂妹|保安|保洁|搬砖|种地|农村(?:出来|来)的?|乡下人|白手起家)',
].join('|'));

const PATH_EN = new RegExp([
  "\\b(?:dropped\\s+out|quit\\s+school|never\\s+finished\\s+school|skipped\\s+college|flunked\\s+out)\\b",
  "\\b(?:gaming|video\\s+games|playing\\s+games)\\s+all\\s+day\\b|\\bdelivered?\\s+(?:food|pizza)\\b|\\bfactory\\s+worker\\b",
  "\\bfrom\\s+(?:a\\s+)?(?:poor|broken|rural|working-class)\\s+(?:family|background|home)\\b",
  "\\bstarted\\s+(?:from\\s+)?(?:nothing|zero|scratch)\\b",
].join('|'), 'i');

// ─── r170 新句式族腿① SURV_SAMPLE 幸存者取样 ─────────────────────
// 只从「活下来的样本」取证：限定标记 × 取样动词 × 幸存者词
// （只采访了事故的幸存者 / 只统计了活下来的用户 / 复盘只采访了
// 没被裁员的员工），或样本来源短语（样本全部来自生还者 / 问卷
// 只发给了没退出的订户）。沉默的大多数（退出者/失败者/遇难者）
// 被系统性排除在证据之外——这是幸存者偏差的取样框形态。
// 枚举腿自查（161 轮教训）：同族词去掉后缀仍命中——「幸存者/
// 生还者/活下来/存活/没退出/没流失/坚持下来/留存/没被裁员/
// 没被淘汰」均同时收带「的」与不带「的」形态（词根本身即裸名词）。
const SURV_MARK_ZH = '(?:只|仅|仅仅|唯独|全|都|均|统统|一概|净)';
const SURV_VERB_ZH = '(?:采访|访谈|统计|调查|复盘|询问|问|回收|收集|纳入|分析|观察|听见|听到|记录|追踪|随访|筛选|审查|审|列举|报道|拍|取样|抽样|覆盖|发给|寄给|发过|调研|研究|总结|梳理)';
// 幸存者词：含「活下来/存活/幸存下来」的裸形态与带「的」形态，
// 以及退出/流失/淘汰/裁员侧的结果筛选词（毫发无损/安然无恙等）。
const SURV_WORD_ZH = '(?:幸存者|生还者|幸存下来|活下来|存活|生存下来|没退出|未退出|没有退出|没流失|未流失|没有流失|坚持下来|坚持到现在|留存|留下来|没被裁员|未被裁员|没被裁|没被淘汰|未被淘汰|活到现在|活着回来|完好无损|毫发无损|安然无恙|没出事的|没出问题|赢家|成功者|赚到钱的|出头的|上岸的|赢的人|混出来的)';
// 路由 a：标记 × 动词 × 幸存者词（「只采访了事故的幸存者」）
const SURV_SAMPLE_ZH_A = new RegExp(SURV_MARK_ZH + '[^。；，!?！？]{0,8}' + SURV_VERB_ZH + '[^。；，!?！？]{0,10}' + SURV_WORD_ZH);
// 路由 b：标记 × 幸存者词 × 动词（「只把生还者纳入统计」）
const SURV_SAMPLE_ZH_B = new RegExp(SURV_MARK_ZH + '[^。；，!?！？]{0,10}' + SURV_WORD_ZH + '[^。；，!?！？]{0,8}' + SURV_VERB_ZH);
// 路由 c：样本来源短语（「样本全部来自生还者」「问卷只发给了没退出的订户」）
const SURV_SAMPLE_ZH_C = new RegExp('(?:样本|数据|问卷|名单|案例|对象|受访者|访谈记录|调研)(?:全部|都|均|只|仅|统统|一共)?(?:来自|源于|取自|集中于|限于|是|为|发给|寄给|发过)' + SURV_WORD_ZH);

// 英文：only interviewed the survivors / Only those who survived are counted /
// We only heard from the customers who stayed。
const SURV_MARK_EN = "\\b(?:only|solely|just|merely|purely)\\b";
const SURV_VERB_EN = "\\b(?:surveyed|interviewed|counted|asked|observed|tracked|heard\\s+from|enrolled|included|studied|polled|reported|analyzed|profiled|featured|covered|recruited|consulted)\\b";
const SURV_WORD_EN = "\\b(?:survivors?|those\\s+who\\s+survived|who\\s+survived|that\\s+survived|the\\s+ones\\s+who\\s+made\\s+it|who\\s+remained|who\\s+stayed|who\\s+made\\s+it|who\\s+didn't\\s+quit|who\\s+were\\s+not\\s+laid\\s+off|still\\s+(?:active|subscribed|employed|alive|using))\\b";
const SURV_SAMPLE_EN_A = new RegExp(SURV_MARK_EN + "[^.]{0,20}" + SURV_VERB_EN + "[^.]{0,15}" + SURV_WORD_EN, 'i');
const SURV_SAMPLE_EN_B = new RegExp(SURV_MARK_EN + "[^.]{0,15}" + SURV_WORD_EN + "[^.]{0,15}" + SURV_VERB_EN, 'i');

// ─── r170 新句式族腿② SURV_GEN 总体推广 ─────────────────────────
// 推广动词 × 总体范围词（反映了全体乘客的体验 / 认定…对全体乘客都
// 有效 / shows the treatment works for everyone），或总体范围词 ×
// 全称能力状态判断（人人都能成功 / 整体都很满意 / 大多能成功 /
// so all customers love the new plan）。
const SURV_GEN_VERB_ZH = '(?:代表|代表着|代表的是|适用于|适合于|宜于|推广到|外推到|反映|反映出|足以说明|足以证明|说明|证明|可见|认定|由此认定|得出结论|意味着|表明|显示出|揭示出|说明的是|判断出|推断出)';
const SURV_GEN_SCOPE_ZH = '(?:全体|所有|整体|全部|人人|每个人|所有人|任何人|大多数|大多|普遍|大众|公众|整个|一律|无一例外|方方面面|各界|任何|通通|大家|大伙)';
// [r270] 推广结论的第三种形态：「只研究赢家就够了」——取样已限定，
// 结论以**终止性收尾**（就够了/即可/足以）表达「不需要再看别的样本」。
const SURV_GEN_ONLY_ZH = '(?:就够了|就行|即可|足以|不用再|没必要再|不必再|就够了)';
// 路由 a：推广动词 × 总体范围词
const SURV_GEN_ZH_A = new RegExp(SURV_GEN_VERB_ZH + '[^。；，!?！？]{0,12}' + SURV_GEN_SCOPE_ZH);
// 路由 b：总体范围词 × 全称能力/状态判断（无推广动词形）
const SURV_GEN_ZH_B = new RegExp(SURV_GEN_SCOPE_ZH + '(?:都|也|全都|统统)?(?:能|可以|会|适应|认可|喜欢|满意|有效|成功|没事|安全|健康|没问题|适用|学完|通过|留下|存活|活下来|留下来)');

const SURV_GEN_VERB_EN = "\\b(?:represents?|reflects?|applies?\\s+to|generalizes?\\s+to|shows?|means?|proves?|demonstrates?|indicates?|works?\\s+for|holds?\\s+for|suggests?)\\b";
const SURV_GEN_SCOPE_EN = "\\b(?:all|every|everyone|everybody|the\\s+whole|any|anyone|in\\s+general|across\\s+the\\s+board|universal)\\b";
const SURV_GEN_EN_A = new RegExp(SURV_GEN_VERB_EN + "[^.]{0,15}" + SURV_GEN_SCOPE_EN, 'i');
// 「so all customers love the new plan」——范围词 × 状态动词（无推广动词形）
const SURV_GEN_EN_B = new RegExp("\\b(?:all|every)\\s+\\w+(?:s)?\\s+(?:love|like|enjoy|approve|are|were|can|will|works?|thrive|succeed)", 'i');

// ─── [r270 新句式族] 幸存者共因归因（筛选词 × 全数词 × 归因结论）────
// r270 探针实测缺口：7/10 攻击穿透。旧三族（SURVIVOR×GENERALIZE /
// PATH×SURVIVOR / SURV_SAMPLE×SURV_GEN）都要求**显式推及听者或总体
// 范围词**；最自然的形态是把「活下来的那批」的共同点直接当原因的共因
// 归因句——「活下来的老字号都坚持手工，所以手工才是长寿的秘诀」
// 「二战返航的飞机那儿都没中弹，所以不用加固」。这里把推及腿换成
// **归因/结论腿**（所以/可见/才是/不用加固/归功于）。
//
// 全部用字符类而非 \b / \s，避免转义层双写（r270 踩坑记录）。
const SURV_FILTER_ZH = '(?:活下来|活到现在|活到今天|活到老|活到至今|活到|幸存下来|幸存|返航|返程归来|留下来|坚持到(?:最后|现在|今天|下来)|经营到(?:现在|今天|如今)|存续(?:至今|到今|下来)|没倒|没垮|没散|没关门|没被淘汰|没被裁|做得久|干得久|做久了|干久了|老字号|老牌子|老品牌|老店|老兵|老员工|老用户|老客户|老学员|存活的|尚在的|仍在的|还在做的|还在干的|留下来的|剩下的|熬出来的)'
const SURV_ALL_ZH = '(?:都|个个|全都|无一例外|通通|无一不是|清一色|人人|同样|一致|共同)'
const SURV_CONCL_ZH = '(?:所以|因此|因而|可见|说明|证明|才是|关键在于|原因在于|归功于|全靠|秘诀|奥妙|道理就在|足见|足以说明|足以证明|意味着|由此可见)'
const SURV_ATTRIB_ZH = new RegExp(SURV_FILTER_ZH + '[^。！？!?]{0,60}' + SURV_ALL_ZH + '[^。！？!?]{0,60}' + SURV_CONCL_ZH)
// 最高级形（无全数词）：「留下来的员工忠诚度最高，说明筛选机制有效」
const SURV_ATTRIB_ZH_SUP = new RegExp(SURV_FILTER_ZH + '[^。！？!?]{0,24}(?:最|格外|特别|明显|显然|显著)[^。！？!?]{0,24}' + SURV_CONCL_ZH)
// 否定行动形：「…不用加固，因为返航的飞机那儿都没中弹」（结论在筛选词之前）
const SURV_ATTRIB_ZH_ACT = new RegExp('(?:不用|不需要|不必|无需|无须|没必要|别|不要)(?:加固|管|修|补|防|装|处理|在意|理会|考虑|上装甲)[^。！？!?]{0,30}' + SURV_FILTER_ZH)

// 英文对应：survivors / still around / who lasted × all/every/the same × 归因动词
const SURV_FILTER_EN = '(?:survivors?|who survived|that survived|who made it|the ones who made it|who lasted|that lasted|who remained|who stayed|who endured|who persisted|still around|still alive|still standing|still left|still remaining|still operating|still trading|still running|still in business|still going|still open)'
const SURV_ALL_EN = '(?:all|every|each|without exception|the same|the very same|identical|in common|shared)'
const SURV_ATTRIB_VERB_EN = '(?:show|shows|prove|proves|proved|mean|means|suggest|suggests|demonstrate|demonstrates|credit|credited|attribute|attributed|reveal|reveals|tell|tells|insist|insists|swear|swears|point|points|owe|owes|share|shares|highlight|highlights|confirm|confirms|have|has|do|does|did)'
const SURV_ATTRIB_EN = new RegExp(SURV_FILTER_EN + '[^.]{0,60}(?:'
  + SURV_ALL_EN + '[^.]{0,60}' + SURV_ATTRIB_VERB_EN + '|'
  + SURV_ATTRIB_VERB_EN + '[^.]{0,60}' + SURV_ALL_EN + ')', 'i')
// 「only the funds still around show …」形：only 前置 + 存活名词（无 all 词）
const SURV_ATTRIB_EN_ONLY = new RegExp('(?:only|just) (?:the )?([^ ]+ ){0,2}(?:still around|still alive|still left|still remaining|still operating|still trading|still standing|still in business)[^.]{0,60}' + SURV_ATTRIB_VERB_EN, 'i')

// ─── [r270 新句式族] 幸存者单源正面总评（取样动词 × 幸存对象 × 全数好评）
// 第二个缺口形态：取样对象本身就是幸存者（能来受访的客户都是没流失的），
// 无「只」标记、无总体范围词，旧 SURV_SAMPLE 三路由全部失声。
// 「我们访谈的客户都很满意，说明产品没问题」——沉默的大多数（流失者）
// 从未进入取样框，正面总评却是全称形。
const SURV_ONLY_ZH = new RegExp('(?:访谈|采访|调研|回访|问卷|抽样|访问|谈过|问过|聊过|调查|座谈)(?:的|过)?[^。！？!?]{0,12}(?:客户|用户|会员|订户|学员|患者|粉丝|买家|商户|员工|成员|同事|同学|玩家|读者|观众)[^。！？!?]{0,10}(?:都|全都|个个|无一不|纷纷|清一色)[^。！？!?]{0,24}(?:满意|认可|好评|称赞|点赞|说好|支持|愿意|想继续|续了费|留下来|夸|赞|叫好|有用|靠谱|物有所值|推荐|复购|续费)')
const SURV_ONLY_EN = new RegExp([
  '(?:all|every) ([^ ]+ ){0,2}(?:customers?|clients?|users?|members?|subscribers?|students?|patients?|fans?|buyers?|employees?|players?|readers?|viewers?) (we|they|i) (surveyed|interviewed|polled|asked|heard from|spoke to|talked to)',
  '(?:the )?([^ ]+ ){0,2}(?:customers?|clients?|users?|members?|subscribers?|students?|patients?|fans?|buyers?|employees?|players?|readers?|viewers?) (we|they|i) (surveyed|interviewed|polled|asked|heard from|spoke to|talked to) (all|every|each)',
].join('|'), 'i')

// ─── [r270] 新句式族豁免：样本框自陈/反驳本族/单源取样被明确标注 ──────
// 「我们访谈的客户都很满意，但样本只覆盖留存用户」是在指出偏差本身；
// 「客户都很满意，不过流失的订户从没被问到」同。这两类不判。
const SURV_NEW_EXEMPT_ZH = new RegExp([
  '(?:但|但是|不过|然而|可是|只是|仅|只)[^。]{0,30}(?:样本|取样|问卷|访谈|采访|调研)[^。]{0,20}(?:只|仅|仅仅|并未|没有|未能|未)[^。]{0,16}(?:覆盖|包含|纳入|涉及|问到|触及|反映)',
  '(?:流失|退订|退出|离开|销户|解约|跳槽|退学|退坑)(?:的|者|用户|客户|订户|成员|员工)?[^。]{0,24}(?:从没|从未|没有|未|没能|没法|难以)(?:被)?(?:问|访|谈|统计|纳入|覆盖|听见|听到)',
  '(?:不能|无法|没法|难以|不宜|不足以|并不能|只)(?:据此|就此|因此|所以|就|能)?(?:代表|反映|推广|外推|说明|证明|适用于|推断|得出|反推|推导|推出|归因|一概)',
  '(?:只|仅)(?:听见|听到|关注|看见|看到)(?:了)?(?:好评|正面|赞成|支持)(?:的|声音)?',
  '(?:样本|数据|结论|取样|样本)(?:存在|有|带有|显得)?(?:明显的?)?(?:偏差|偏误|失真|片面|误导)',
  '(?:这只|这正|这恰恰|恰恰|正好|恰好)(?:能)?(?:说明|反映|证明|揭示)(?:了)?(?:幸存者|存活者|样本|片面|偏差)',
].join('|'))
const SURV_NEW_EXEMPT_EN = new RegExp([
  '(?:but|however|though|although|yet) [^.]{0,60}(?:only|just) [^.]{0,40}(?:covers?|included?|sampled?|asked|surveyed|reflects?)',
  '(?:never|not|did not|didn) [^ ]{0,3}(?:t )?(?:heard|hear|asked|ask|surveyed|survey|interviewed|interview|counted|count|included|include|polled|poll) [^.]{0,50}(?:churned|lapsed|departed|former|resigned|dropped out|quit|cancelled|canceled|unsubscribed|left)',
  '(?:churned|lapsed|departed|former|resigned|dropped out|quit|cancelled|canceled|unsubscribed|left) [^.]{0,50}(?:never|not|did not|didn) [^ ]{0,3}(?:t )?(?:heard|hear|asked|ask|surveyed|survey|interviewed|interview|counted|count|included|include|polled|poll)',
  '(?:can not|cannot|could not|couldn|does not|doesn) [^ ]{0,3}(?:t )?(?:represent|reflect|generalize|apply|prove|show|mean)',
  '(?:only|just) (?:heard|asked|surveyed|listened to) (?:the )?(?:happy|satisfied|positive|supportive)',
  '(?:sample|sampling|data|survey) [^.]{0,30}(?:biased|skewed|one-sided|unrepresentative|incomplete)',
].join('|'), 'i')

// ─── [r270 新句式族] 幸存者集合 × 结论动词 × 领域否定断言 ──────────
// 第三个缺口形态：幸存者集合 + 结论动词 + 全称否定（「那些退学创业成功的
// 人说明学历不重要」「the successful dropouts prove school does not
// matter」）。与共因归因族的差别：结论是**对领域的否定判断**而非共同点归因。
const SURV_CONCL_NEG_ZH = new RegExp(
  '(?:成功的人|成功者|活下来|幸存|留下来的|赢家|赚到钱的|出头的|上岸的|熬过来的|坚持下来的)'
  + '[^。！？!?]{0,20}(?:说明|证明|表明|可见|这意味着|足以说明)'
  + '[^。！？!?]{0,16}(?:不重要|无所谓|没用|不必|不需要|不能|说明不了|不值|毫无意义|可有可无)')
const SURV_CONCL_NEG_EN = new RegExp(
  '(?:successful dropouts|the successful ones|those who made it|the survivors|the winners|who succeeded|who made it|the ones still standing)'
  + '[^.]{0,40}(?:prove|proves|proved|show|shows|demonstrate|demonstrates|mean|means|suggest|suggests)'
  + '[^.]{0,30}(?:does not matter|do not matter|is not necessary|is unnecessary|are unnecessary|no need|not needed|unimportant)', 'i')

// ① 假设条件形（如果只统计活下来的用户，结果就会偏乐观——在阐述
//    偏差而非犯偏差）；② 否定前置（不是只采访幸存者）；③ 反驳
//    本族（结论不能反映全体/不足以推广）；④ 疑问句。
const SURV_EXEMPT_ZH = new RegExp([
  '(?:如果|若|假设|假如|要是|倘若|设想|一旦|比方说|换句话说)[^。]{0,40}(?:只|仅|仅仅|全|都)',
  '(?:不是|并非|没有|未|绝不|从不|而非|而不是)[^。]{0,6}(?:只|仅|仅仅)',
  '(?:不能|无法|没法|难以|不宜|不足以|并不能)(?:据此|就此|因此|所以|就|能)?(?:代表|反映|推广|外推|说明|证明|适用于|推断|得出)',
  '[?？]|(?:吗|是否|能否|能不能|难道)[^。]{0,8}$',
].join('|'));
const SURV_EXEMPT_EN = new RegExp([
  "\\b(?:if|suppose|imagine|assume|let's\\s+say)\\b[^.]{0,40}\\b(?:only|just|solely)\\b",
  "\\b(?:not|never)\\s+(?:only|just|solely)\\b",
  "\\b(?:can't|cannot|couldn't|doesn't|does\\s+not|can\\s+not)\\s+(?:represent|reflect|generalize|apply|prove|show|mean)",
  "\\?",
].join('|'), 'i');

// ─── 豁免：统计/概率/反驳语境与概念分析 ────────────────────────
// 三类：① META 概念分析（含倒装形）；② 统计与概率陈述（正是反驳
// 本族的标准句式）；③ 医疗与试验规范。
const META_EXEMPT_ZH = new RegExp([
  // ① 概念分析两种语序（r693 教训：名词前置倒装形「这就是典型的X」也要收）
  '(?:这|那就是|这就是|这正是|那正是|属于|属于一种|正是|即是)(?:一种|典型的|常见的|经典的|隐性|常见|典型|明显)?(?:幸存者偏差|生存者偏差|幸存者偏误|幸存者效应|沉默的大多数)',
  '(?:幸存者偏差|生存者偏差|幸存者偏误|幸存者效应)(?:是|属于|是一种|正是|属于|属于一种)(?:一种|典型的|常见的|经典的|隐性|常见|典型)?(?:谬误|谬说|逻辑错误|逻辑谬误|错误论证|非形式谬误|话术|手法|手段|策略|伎俩|套路|现象|问题|错误|陷阱|偏差|认知偏误)',
  // ② 统计与概率陈述（反驳本族的标准句式）
  '(?:个案不具代表性|个例不具代表性|不能代表总体|不代表总体|无法代表总体|要以?大样本|大样本|样本量|统计数据|概率(?:极|很|非常)?低|中位数|平均数|期望收益|存活率|成功率|基数|对照|双盲|随机对照|临床试验|临床数据|沉默的大多数|失败(?:的|者)?(?:案例|样本)?(?:被)?(?:忽略|无视|看不见)|只(?:看见|看到|关注)(?:成功|活下来)的)',
  // ③ 医疗规范
  '(?:需要对照|要(?:有)?对照|疗效(?:需要)?(?:要)?(?:看)?(?:数据|试验)|按(?:统一|同一)标准|按制度|按统一)',
].join('|'));

const META_EXEMPT_EN = new RegExp([
  "\\b(?:survivorship\\s+bias|survivor\\s+bias|survivorship\\s+effect)\\s+(?:is|are)\\s+(?:a\\s+)?(?:fallacy|pitfall|bias|trap|cognitive|common|form\\s+of|symptom\\s+of|manipulation|tactic|rhetorical|technique)\\b",
  "\\b(?:this|that|it)\\s+is\\s+(?:a\\s+)?(?:classic|typical|textbook)\\s+(?:survivorship|survivor)\\s+bias\\b",
  "\\b(?:not\\s+)?(?:representative|generalizable)\\b|\\bsmall\\s+sample\\b|\\bsample\\s+size\\b|\\bstatistics\\b|\\bmedian\\b|\\bexpected\\s+value\\b|\\bbase\\s+rate\\b|\\bsurvival\\s+rate\\b|\\bcontrol\\s+group\\b|\\bclinical\\s+(?:trial|data|evidence)\\b|\\brandomized\\b|\\bsilent\\s+(?:majority|failures)\\b|\\bthe\\s+\\w+\\s+who\\s+failed\\b",
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkSurvivorshipBias(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const SURVIVOR_ZH_ = R.SURVIVOR_ZH || SURVIVOR_ZH;
  const SURVIVOR_EN_ = R.SURVIVOR_EN || SURVIVOR_EN;
  const GENERALIZE_ZH_ = R.GENERALIZE_ZH || GENERALIZE_ZH;
  const GENERALIZE_EN_ = R.GENERALIZE_EN || GENERALIZE_EN;
  const PATH_ZH_ = R.PATH_ZH || PATH_ZH;
  const PATH_EN_ = R.PATH_EN || PATH_EN;
  const SURV_SAMPLE_ZH_A_ = R.SURV_SAMPLE_ZH_A || SURV_SAMPLE_ZH_A;
  const SURV_SAMPLE_ZH_B_ = R.SURV_SAMPLE_ZH_B || SURV_SAMPLE_ZH_B;
  const SURV_SAMPLE_ZH_C_ = R.SURV_SAMPLE_ZH_C || SURV_SAMPLE_ZH_C;
  const SURV_SAMPLE_EN_A_ = R.SURV_SAMPLE_EN_A || SURV_SAMPLE_EN_A;
  const SURV_SAMPLE_EN_B_ = R.SURV_SAMPLE_EN_B || SURV_SAMPLE_EN_B;
  const SURV_GEN_ZH_A_ = R.SURV_GEN_ZH_A || SURV_GEN_ZH_A;
  const SURV_GEN_ZH_B_ = R.SURV_GEN_ZH_B || SURV_GEN_ZH_B;
  const SURV_GEN_EN_A_ = R.SURV_GEN_EN_A || SURV_GEN_EN_A;
  const SURV_GEN_EN_B_ = R.SURV_GEN_EN_B || SURV_GEN_EN_B;
  const SURV_EXEMPT_ZH_ = R.SURV_EXEMPT_ZH || SURV_EXEMPT_ZH;
  const SURV_EXEMPT_EN_ = R.SURV_EXEMPT_EN || SURV_EXEMPT_EN;
  const META_EXEMPT_ZH_ = R.META_EXEMPT_ZH || META_EXEMPT_ZH;
  const META_EXEMPT_EN_ = R.META_EXEMPT_EN || META_EXEMPT_EN;

  // 统计陈述/反驳本族/概念分析 → 不是运用它
  if (META_EXEMPT_ZH_.test(text) || META_EXEMPT_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  const survZh = SURVIVOR_ZH_.test(text);
  const survEn = SURVIVOR_EN_.test(text);
  const genZh = GENERALIZE_ZH_.test(text);
  const genEn = GENERALIZE_EN_.test(text);
  const pathZh = PATH_ZH_.test(text);
  const pathEn = PATH_EN_.test(text);

  // 主判据：可见成功个案 × 推及结论（缺一不判）
  if ((survZh || survEn) && (genZh || genEn)) {
    return {
      hit: true,
      score: 0.6,
      count: 1,
      detail: isZh ? '生存者偏差×个案推普遍结论(zh)' : '生存者偏差×个案推普遍结论(en)',
    };
  }

  // 补充判据：非常规路径 × 成功结果（无显式推及句的经典叙事形）
  if ((pathZh || pathEn) && (survZh || survEn)) {
    return {
      hit: true,
      score: 0.55,
      count: 1,
      detail: isZh ? '生存者偏差×非常规路径成功叙事(zh)' : '生存者偏差×非常规路径成功叙事(en)',
    };
  }

  // ─── r170 新句式族：幸存者取样 × 总体推广 ───────────────────
  // 腿① SURV_SAMPLE：只从活下来的样本取证（只采访幸存者/只统计
  // 留存客户/只访谈没退出的员工/Only those who survived are
  // counted）；腿② SURV_GEN：据此推广到全体（代表全体/人人都
  // 有效/大多能成功/works for everyone）。缺一不判。
  // 豁免先于判定：假设条件句/否定前置/反驳本族/疑问句不是运用它。
  if (SURV_EXEMPT_ZH_.test(text) || SURV_EXEMPT_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  const survSampleZh = SURV_SAMPLE_ZH_A_.test(text) || SURV_SAMPLE_ZH_B_.test(text) || SURV_SAMPLE_ZH_C_.test(text);
  const survSampleEn = SURV_SAMPLE_EN_A_.test(text) || SURV_SAMPLE_EN_B_.test(text);
  const SURV_GEN_ONLY_ZH_ = new RegExp(R.SURV_GEN_ONLY_ZH || SURV_GEN_ONLY_ZH);
  const survGenZh = SURV_GEN_ZH_A_.test(text) || SURV_GEN_ZH_B_.test(text) || SURV_GEN_ONLY_ZH_.test(text);
  const survGenEn = SURV_GEN_EN_A_.test(text) || SURV_GEN_EN_B_.test(text);
  if ((survSampleZh || survSampleEn) && (survGenZh || survGenEn)) {
    return {
      hit: true,
      score: 0.6,
      count: 1,
      detail: isZh ? '幸存者取样×总体推广(zh)' : '幸存者取样×总体推广(en)',
    };
  }

  // ─── [r270] 新句式族：幸存者共因归因 × 幸存者单源正面总评 ───────
  // 腿① SURV_FILTER（活下来/幸存/返航/老字号/still around/who lasted）
  // × 全数词（都/all/every）× 归因结论（所以/才是/不用加固/show/credit）。
  // 与 SURV_SAMPLE 族的差别：不需要「只」标记——「活下来的那批」本身
  // 就是幸存者筛选；推及腿从「代表全体」换成「共同点即原因」。
  // 豁免先于判定：样本框自陈/反驳本族/只听见好评，均不判。
  if (!(SURV_NEW_EXEMPT_ZH.test(text) || SURV_NEW_EXEMPT_EN.test(text))) {
    if (SURV_ATTRIB_ZH.test(text) || SURV_ATTRIB_ZH_SUP.test(text) || SURV_ATTRIB_ZH_ACT.test(text)
      || SURV_ATTRIB_EN.test(text) || SURV_ATTRIB_EN_ONLY.test(text)) {
      return {
        hit: true,
        score: 0.6,
        count: 1,
        detail: isZh ? '幸存者共因归因(zh)' : 'survivor-common-cause-attribution(en)',
      };
    }
    // 领域否定断言：幸存者集合 + 结论动词 + 全称否定
    if (SURV_CONCL_NEG_ZH.test(text) || SURV_CONCL_NEG_EN.test(text)) {
      return { hit: true, score: 0.55, count: 1,
        detail: isZh ? '幸存者集合否定推广(zh)' : 'survivor-set-negation(en)' };
    }
    // 单源正面总评：取样动词 × 幸存对象 × 全数好评（沉默的大多数未入框）
    if (SURV_ONLY_ZH.test(text) || SURV_ONLY_EN.test(text)) {
      return {
        hit: true,
        score: 0.55,
        count: 1,
        detail: isZh ? '幸存者单源正面总评(zh)' : 'survivor-only-positive-survey(en)',
      };
    }
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkSurvivorshipBias,
  __internals: () => ({ SURVIVOR_ZH, SURVIVOR_EN, GENERALIZE_ZH, GENERALIZE_EN, PATH_ZH, PATH_EN, META_EXEMPT_ZH, META_EXEMPT_EN,
    SURV_SAMPLE_ZH_A, SURV_SAMPLE_ZH_B, SURV_SAMPLE_ZH_C, SURV_SAMPLE_EN_A, SURV_SAMPLE_EN_B,
    SURV_GEN_ZH_A, SURV_GEN_ZH_B, SURV_GEN_EN_A, SURV_GEN_EN_B, SURV_EXEMPT_ZH, SURV_EXEMPT_EN,
    SURV_FILTER_ZH, SURV_ALL_ZH, SURV_ATTRIB_ZH, SURV_FILTER_EN, SURV_ALL_EN, SURV_ATTRIB_VERB_EN,
    SURV_ATTRIB_ZH_SUP, SURV_ATTRIB_ZH_ACT, SURV_ATTRIB_EN, SURV_ATTRIB_EN_ONLY, SURV_ONLY_ZH, SURV_ONLY_EN,
    SURV_NEW_EXEMPT_ZH, SURV_NEW_EXEMPT_EN, SURV_GEN_ONLY_ZH, SURV_CONCL_NEG_ZH, SURV_CONCL_NEG_EN }),
};
