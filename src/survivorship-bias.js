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
 * 判据（两组双腿，任一组成立即判定，缺一不判）：
 *   · 腿① SURVIVOR 可见成功个案（成功结果名词/动词）：
 *     首富/富豪/财富自由/年薪百万/月入X万/赚了X万/中大奖/影后/
 *     冠军/痊愈/成名/暴富/买了房/活到九十/考上清华……；
 *   · 腿② GENERALIZE 推及结论（三类任中一类）：
 *     a 推及听者（所以你也该/你肯定也/照这个方法你家孩子也能/
 *         人人都能/每个人都能）；
 *     b 领域评价（读书没用/真轻松/能发财/可靠出路/捷径/好时候/
 *         不影响健康）；
 *     c EN 对应（so you should/you can too/is unnecessary/is
 *         pointless/is a solid plan/anyone can）。
 *   · 补充双腿 PATH × SURVIVOR（非常规路径 × 成功结果，无显式
 *     推及句的经典叙事形）：「隔壁老王的儿子退学打游戏现在年薪
 *     百万」「他辍学摆地摊，如今身家过亿」——媒体幸存者叙事
 *     标题句，推及结论隐含在并置里。
 *   · 单有成功结果不判：「他考上了清华，这是他个人多年努力的
 *     结果」是个案归因陈述，无推及腿；「这位演员为角色减重二十斤」
 *     是无推及的事实陈述。
 *   · 单有推及不判：「这个方法很可靠」无成功个案腿。
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

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkSurvivorshipBias,
  __internals: () => ({ SURVIVOR_ZH, SURVIVOR_EN, GENERALIZE_ZH, GENERALIZE_EN, PATH_ZH, PATH_EN, META_EXEMPT_ZH, META_EXEMPT_EN }),
};
