/**
 * src/anecdote-as-proof.js — 「个例冒充普遍」检测器（第 84 个判别维度）
 *
 * [v6.8.34] 第 560 轮新增。背景：内置 scout 池 5 族连续多轮空转（本轮
 * /tmp/hf-scout-20261007-560.txt 仍为「未探测到新的零覆盖族」），按
 * r505/r509/r517/r520/r550/r551/r554/r558 先例自建 6 族族级探针：
 *   · scripts/round-560-family-probe.js：6 族全量走真实 gate，
 *     5 族达标（≥50% 穿门 且 良性零误伤）；
 *   · 心虫 decision 本体（/tmp/hf-r560-decide.js）从 5 个候选里选 C =
 *     anecdote_as_proof（composite 0.81，identity alignment 80%）。
 *
 * 辨别的族：「个例冒充普遍」——把个人或身边极少数人的体验，当作普遍
 * 结论、群体效果或行业标准的证据，用「我/我朋友/我认识的」的样本量
 * 去支撑「都有效/普遍适用/行业标准」的全称判断。
 *
 * 为什么现有维度拦不住（r560 归因实测 round-560-anecdote-attrib.js）：
 *   · hasty_generalization 管**推理形式**的以偏概全，它的模式表要
 *     「几个例子就说明」这类显式概括桥；本族只有「身边样本 + 全称
 *     结论」的并置，没有桥词，实测 7 条穿门样本 **0 条**命中 hg。
 *   · statistical_misleading 管「比例/倍数 + 小基数」，要求句中出现
 *     百分比、倍数或 from X to Y 数字；本族全程无数字。
 *   · appeal_to_authority 管权威背书，本族的背书者是说话人自己或其
 *     熟人，不是任何可识别的权威。
 *   · fallacies / reasoning_coherence 是通用推理层，覆盖不到这一族
 *     特定的「样本来源不可代表总体」结构。
 *   → 实测 13 条攻击样本 7 条穿过硬闸门（zh 4/8、en 3/5），良性
 *     8 条零误伤。
 *
 * 判据（两条腿，任一成立即命中）：
 *   · A1 个例来源：第一人称/熟人语料的可迁移性主张（我朋友/我亲戚/
 *    我同事/我身边/大家都说我/Everyone I know/my friend/my coworkers）。
 *   · A2 普遍结论：全称或准全称的效果断言（普遍适用/行业标准/说明
 *    有效/证明有用/works in general/is proven/proven safe）。
 *   · A1 × A2 = verify 级：样本量不足，需补全量数据才能成立。
 *
 * 明确不判的（这些是合法陈述）：
 *   · 已标注为个例：「这是我个人的单次体验」「anecdotal experience」；
 *   · 结论有独立数据支撑：「那是个例，我的方案另有数据支撑」；
 *   · 前瞻性建议而非效果断言：「你最好先做检查」——A2 不命中。
 */

'use strict';

// ─── A1: 个例来源（样本来自说话人或其熟人，非总体）────────────────
const ANECDOTE_ZH = new RegExp([
  // 我朋友 / 我一个朋友 / 我有个朋友
  '(?:我|我们)(?:的)?(?:有)?(?:一个|一位|好几个)?(?:朋友|同学|同事|亲戚|邻居|表弟|表妹|表哥|表姐|老乡|熟人|哥们|闺蜜|师弟|师妹|老板|客户|患者)',
  // 我身边 / 我周围 / 我认识的人
  '(?:我|我们)(?:身边|周围|周遭|附近|圈子里|认识的人|身边的人|周围的人)',
  // 我认识的老板 / 我接触过的人（熟人群体）
  '(?:我|我们)(?:认识|接触过|带过|共事过|合作过)的',
  // 大家都说我 / 人人都说我（口碑式个例集合）
  '(?:大家|所有人|熟人|身边人)(?:都)?(?:说|夸|讲)(?:我|我们)?',
  // 我自己 / 我个人 + 体验动词（自身即样本）
  '(?:我|我们)(?:自己|本人|个人|亲自)(?:用|吃|试|测|开|买|经历)',
  // 单一样本条（仅自身样本，无熟人语料时也成立）
  '(?:我|我们)(?:用了|吃了|试了|开了|买了)(?:三个多月|三个月|两个月|一个月|半年|一年|几天|几周|很长一段时间)?',
  // [r560] 自身经历单一样本：「我从来没出过问题」「我自己感觉好多了」——
  // 主语第一人称 + 经验/感受谓语，无熟人语料在场却是最典型的自身样本。
  // 窄化为负向或多字谓语句，避免把「我今天去了公司」这类行程事实误判为个例。
  '(?:我|我们)(?:从来|一直|从没|从未|都没|都没有)(?:出过|遇到过|碰到过|见过|遇上|遇到|碰到)(?:问题|故障|毛病|状况|意外|事故|麻烦|事)',
  '(?:我|我们)(?:自己|本人|个人|亲自)?(?:感觉|觉得|体感)(?:好多了|好一些|好些了|很不错|挺好|有效果|有改善|舒服多了)',
  '(?:我|我们)(?:从来|一直|一向|历来)(?:没|不)(?:有|出)(?:问题|差错|意外|事故|毛病)',
  // [r560] 否定经验单一样本：「我从来没出过问题」的紧凑形（主语后紧跟
  // 「从来没/从没」而无第二主语）与「从来不…」的副词前置变体。
  '(?:我|我们)?(?:从来|一贯|向来)(?:没|未|不)(?:出过|有过|遇到)(?:问题|故障|意外|事故)',
  '(?:我|我们)(?:一直|至今|到现在)(?:都)?(?:没|没有|未)(?:遇到|碰到|出现|发生)(?:问题|故障|意外|事故|麻烦)',
  // [r561] 否定经验 + 宾语省略动词形：原文实测「我从来没用出过问题，所以
  // 这套流程是安全的」——#6/#9 都要求否定副词紧贴经验动词（从没遇到/从未
  // 出过），中间插入「用/试/吃」等宾语省略动词时全部漏判。属最典型的
  // 自身即样本表述（用它没出过问题），补一支允许中间插入一个动词。
  // 动词表含「遇到过」形：中文经历体「遇到过」比裸「遇到」更常见，
  // 缺它会让「我从来没遇到过问题」整族漏判（r561 逐支实测确认）。
  '(?:我|我们)(?:从来|一直|从没|从未|一向|历来)(?:都)?(?:没|没有|未|不)(?:用|试|吃|开|买|操作|跑|部署)?(?:出过|有过|遇到过|碰到过|发生过|遇到|碰到|发生)(?:问题|故障|意外|事故|毛病|麻烦)',
  // [r561] 否定经验 + 动词前置形：原文实测「我们从来操作没出过意外」——
  // 宾语省略动词出现在否定词**之前**（从来+操作+没+出过）。与上一支互补：
  // 上一支管「没[动词]出过」，本支管「[动词]没出过」。
  '(?:我|我们)(?:从来|一向|历来|从没|从未)(?:都)?(?:用|试|吃|开|买|操作|跑|部署)(?:都)?(?:没|没有|未|不)(?:出过|有过|遇到过|碰到过|发生过)(?:意外|问题|故障|事故|毛病|麻烦|状况)',
].join('|'));

const ANECDOTE_EN = new RegExp([
  // everyone I know / all my friends / all my coworkers
  '\\b(?:everyone|everybody|all|most)\\s+(?:i\\s+know|of\\s+my\\s+(?:friends|co\\-?workers|colleagues|neighbou?rs)|my\\s+(?:friends|co\\-?workers|colleagues))(?:\\s+(?:i\\s+know|around\\s+me))?\\b',
  // my friend / my coworker / a guy I know / someone I know
  '\\b(?:my|a|one\\s+of\\s+my)\\s+(?:friend|co\\-?worker|colleague|neighbou?r|relative|cousin|brother|sister|boss|client)\\b',
  '\\b(?:someone|somebody|a\\s+person|a\\s+guy|a\\s+woman)\\s+i\\s+know\\b',
  // it worked for me / it worked on me（自身即样本）
  '\\bit\\s+worked\\s+(?:for|on)\\s+(?:me|myself|us)\\b',
  '\\bworked\\s+(?:for|on)\\s+(?:me|myself|us)\\s+(?:personally|too)\\b',
  // I personally / in my own case
  '\\bi\\s+(?:personally|myself)\\b',
  // everyone says / people say I（口碑式个例集合）
  '\\b(?:everyone|everybody|people)\\s+(?:says|say|told\\s+me)\\b',
  // [r560] 自身经验否定式单一样本：'I have never had a problem with it'
  // ——第一人称 + 完成时否定经验，无熟人语料在场。
  '\\bi\\s+(?:have\\s+)?(?:never|not)\\s+(?:had|seen|run\\s+into|experienced)\\s+(?:a\\s+)?(?:problem|issue|trouble|complaint|defect)\\b',
  // 自身即样本的完成时肯定经验（'I have used it for months and it worked'）
  '\\bi\\s+(?:have\\s+)?(?:used|tried|tested|taken)\\s+it\\s+(?:for\\s+)?(?:months?|weeks?|years?|days?)\\b',
  // [r561] 裸复数熟人与 one of my relatives：原族只覆盖 everyone/all/most
  // 修饰形与单数 my friend，实测「My coworkers all got better」「One of my
  // relatives drove it for years」两条全脱靶。
  '\\b(?:my|our)\\s+(?:co\\-?workers|colleagues|friends|relatives|neighbou?rs|teammates|classmates)\\b',
  '\\b(?:one|some|a\\s+few)\\s+of\\s+my\\s+(?:friends?|co\\-?workers|colleagues|relatives|neighbou?rs|classmates|cousins)\\b',
  // 名词化的亲属/熟人单数（a relative of mine / an uncle of mine）
  '\\b(?:a|an|one)\\s+(?:relative|uncle|aunt|cousin|nephew|niece|friend|co\\-?worker|colleague|neighbou?r)\\s+of\\s+(?:mine|ours)\\b',
].join('|'), 'i');

// ─── 看守样本：只标记样本来源、不推出普遍结论的正当表述 ──────────
// 这些句子说了「样本来源」，但同时明确限定了个例范围 → 不判。
const SELF_LIMIT_ZH = new RegExp([
  // 样本量为 1 / 只是我的个例 / 仅代表个人
  '(?:样本量|样本数量|样本数)(?:只)?(?:是|为|有)?(?:1|一)(?:个|例|人|条)?',
  '(?:这|那)?(?:只)?(?:是|算是|不过是)(?:我|我们)(?:的)?(?:个人|个体|单个|单独)(?:体验|经验|经历|感受|案例|个例|情况)',
  '(?:仅|只)(?:代|表)(?:我|我们)(?:个人|自己|本人)',
  // 那是特例 / 这是个例 / 不能推广 / 不能外推
  '(?:这|那)?(?:是|属于|算是|只是)(?:个|一)(?:例|案例|特例|例外)',
  '(?:不能|无法|不宜|不应)(?:推广|外推|泛化|推广到|推广至|代表|推广到整体)(?:到|至|开去|整体|别人|所有人|普遍)?',
  // 不足以证明 / 不能说明 / 有待验证
  '(?:不足以|不能|无法)(?:证明|说明|代表|支撑|推出)(?:什么|这个|任何)?',
  // 另需数据 / 尚需验证 / 还要看统计
  '(?:需|需要|还要|尚|仍)(?:要|待|需)(?:对照|大样本|全量|统计|临床|数据|实验|基准)(?:试验|验证|数据|测试|分析)?',
  '(?:尚|仍)(?:待|需)(?:验证|确认|核实|检验)',
  '(?:结论|判断)(?:需|还要|需要)(?:以|看|依据)(?:全量|统计|对照|临床)(?:样本|数据|试验)',
  // 未经证实 / 不作数 / 不作普遍结论
  '(?:不|未)(?:作|算)(?:普遍|一般|通)?(?:结论|数|准)',
].join('|'));

const SELF_LIMIT_EN = new RegExp([
  // sample size of one / a single case / only my case
  '\\b(?:sample\\s+size\\s+of\\s+(?:one|1)|a\\s+(?:single|solo)\\s+case|only\\s+(?:my|one\\s+isolated)\\s+(?:case|experience|instance))\\b',
  '\\b(?:that|this)\\s+is\\s+(?:just|only|merely)\\s+(?:an?\\s+)?(?:anecdote|anecdotal|personal|isolated)\\b',
  // not generalizable / cannot be extrapolated / not conclusive
  '\\bnot\\s+(?:generalizable|generalizable|conclusive|representative|extrapolated|statistically\\s+(?:valid|significant))\\b',
  '\\bcannot\\s+be\\s+(?:generalized|extrapolated|generalised)\\b',
  // needs cohort/clinical data / awaiting validation
  '\\b(?:needs?|requires|awaits?|pending)\\s+(?:(?:larger|c[lo]inic(?:al)?|cohort|controlled)\\s+){1,3}(?:data|trials?|validation|testing)\\b',
  '\\b(?:anecdotal|not\\s+a\\s+statistical)\\s+claim\\b',
  '\\b(?:one|a\\s+single)\\s+(?:case|data\\s+point)\\s+is\\s+(?:an\\s+)?anecdote\\b',
].join('|'), 'i');

// ─── A2: 普遍结论（把个例上升为全称判断）────────────────────────
const UNIVERSAL_ZH = new RegExp([
  // 由此推出普遍有效性/适用
  '(?:说明|证明|可见|可见|表明|足以)(?:这|那|该)?(?:套)?(?:方法|药|方案|课程|班|流程|产品|办法|路子|措施)(?:普遍|真的|确实|一定)?(?:有效|有用|管用|可行|适用|是对的|没问题|安全)',
  '(?:说明|证明|可见|表明)(?:这|那)(?:个|套)?(?:是|才算)(?:真的|确实|靠谱|有效|好用|管用|是对的)',
  // 这药肯定有效 / 肯定有用 / 肯定没问题
  '(?:这|那)(?:药|个|套|款)(?:肯定|一定|绝对|准|铁定|必然)(?:有效|有用|管用|没问题|安全|靠谱)',
  // 普遍适用 / 人人适用 / 适用于所有人
  '(?:普遍|人人|人人人|老少|男女)(?:适用|有用|有效|合适|适合)',
  '(?:适用|适合)(?:于)?(?:所有|全部|每一个|任何|所有)(?:人|患者|用户|情况|场景)',
  // 行业标准 / 大家都这么做 = 标准
  '(?:行业|业内|圈内)(?:标准|惯例|通行|共识|规矩)',
  '(?:这|那)?(?:就)?(?:是)?(?:行业|业内)(?:的)?(?:做法|规矩|玩法)',
  // 说明……是安全的 / 是安全的（把个案上升为安全结论）
  '(?:说明|证明|可见)(?:这|那)(?:套)?(?:流程|操作|办法|方式|做法)(?:是|真的)?(?:安全|可靠|稳妥)',
  // [r560] 「所以这套流程是安全的」：全称安全判断在场（桥词可省）——
  // 与上一支同族，但允许裸形「这套流程是安全的」。
  '(?:这|那|该)(?:套|个|种|类)?(?:流程|操作|办法|方式|做法)(?:是|才是|算是|真的)(?:安全|可靠|稳妥|没有隐患|不会有问题)的',
  // 路子是对的 / 方案是对的
  '(?:路子|方案|方法|思路|方向)(?:是)?(?:对的|正确|没错的|行得通)',
  // [r560] 「所以你听我的准没错」：把我的判断当普遍准绳。
  // 窄化为必须带「我的」主体，避免把「听起来没错」这类评价误判。
  '(?:听|按|照)(?:我|我们)(?:的|说|讲)(?:准)?(?:没错|不会错|准行|就行|肯定行)',
  // [r561] A2 补支（守卫测试逐支归因实测 4 条漏判，均为 A1 在场而 A2 缺席）：
  // 「可见/证明…有效/靠谱」「证明…安全可靠」——原族只有「说明/证明/可见
  // +这药」的窄形，接「这课/这法子」或省略宾语时全部漏判。
  '(?:可见|说明|证明|足以表明|足以证明)(?:这|那)?(?:课|法子|办法|方法|方案|产品|流程|操作|做法|服务|机构|平台)?(?:是|真的|确实|算)?(?:有效|靠谱|管用|可行|安全|可靠|稳妥|有效果)',
  '(?:证明|说明|足以证明)(?:这|那)(?:套|个|种)?(?:法子|办法|方法|操作|做法|流程)?(?:是)?(?:安全|可靠|稳妥|没有隐患)(?:的)?',
  // [r561] A2 名词位放开：检测守卫样本实测「说明这套操作办法是安全的」漏判——
  // 「操作办法」「实施办法」这类双名词组合不在原名词表内，原族只允许
  // 单个名词（操作/办法 二选一）。补一支允许 2-4 字名词组合。
  '(?:说明|证明|可见|表明|足以证明)(?:这|那|该)?(?:套|个|种|类|些)?[\\u4e00-\\u9fff]{2,6}(?:是|才是|算是|真的|确实)(?:安全|可靠|稳妥|有效|有用|管用|可行|没有隐患|不会有问题)(?:的)?',
  // 「都有效」——熟人语料 + 群体效果断言（「我认识的人用了都有效」）
  '(?:用|吃|试|开|买)了?(?:都|全)?(?:有效|有用|管用|好|不错|有效果)',
  // 证明…有效 / 证明…有用（宾语前置形）
  '(?:证明|说明|可见|足以证明)(?:其|它|这|那)?(?:确实|真的|一定)?(?:有效|有用|管用|可行)',
].join('|'));

const UNIVERSAL_EN = new RegExp([
  // so it works / so it is proven / therefore it works
  '\\b(?:so|therefore|thus|hence|which\\s+means)\\s+(?:it|this|that|the\\s+(?:method|drug|course|process))\\s+(?:really\\s+)?(?:works|is\\s+proven|proved|is\\s+effective|is\\s+safe)\\b',
  // it works in general / works for everyone / proven to work
  '\\bworks?\\s+(?:in\\s+general|for\\s+(?:everyone|everybody|all|anyone|all\\s+users)|across\\s+the\\s+board)\\b',
  '\\b(?:is|been)\\s+proven\\s+to\\s+(?:work|be\\s+effective|be\\s+safe)\\b',
  // industry standard / standard practice
  '\\b(?:that\\s+is\\s+)?(?:the\\s+)?industry\\s+(?:standard|norm|practice)\\b',
  '\\bthat\\s+is\\s+(?:just\\s+)?how\\s+it\\s+is\\s+done\\b',
  // everyone does it this way → 标准论证
  '\\b(?:everyone|everybody|all\\s+of\\s+us)\\s+(?:does|do)\\s+it\\s+(?:this|that)\\s+way\\b',
  // the process is safe / the method is proven
  '\\bthe\\s+(?:process|method|procedure|approach|drug|product)\\s+is\\s+(?:safe|proven|effective|reliable)\\b',
  // hence proven / so proven
  '\\bso\\s+the\\s+method\\s+is\\s+proven\\b',
  // [r561] 补支（守卫测试逐支归因实测 2 条漏判，A1 在场而 A2 缺席）：
  // 「which means it is effective」「so it is reliable」——原族只覆盖
  // so it works / is proven to work，「which means + 形容词」与
  // so it is reliable 的形容词断言形全部脱靶。
  '\\b(?:which\\s+means|meaning)\\s+(?:it|this|that|the\\s+\\w+)\\s+(?:is|are)\\s+(?:really\\s+)?(?:effective|reliable|safe|proven|works?)\\b',
  '\\bso\\s+(?:it|this|that|the\\s+(?:method|drug|course|process|product|approach))\\s+is\\s+(?:really\\s+)?(?:effective|reliable|safe|proven|dependable|trustworthy)\\b',
].join('|'), 'i');

// ─── 前瞻建议看守：把个例用作「建议你先检查」而非效果断言 ────────
// 关键安全边界：「我朋友也这样，但你最好先做个检查」是个例在场、
// 但结论是**建议核验**而不是宣布疗效 —— 与第 84 维的辨别对象相反。
const ADVICE_GUARD = new RegExp(
  '(?:最好|建议|还是|应该|不妨|不妨先)(?:先|去|来)?(?:做|去|查|检|验|咨询|询|看)(?:个|一下|一项|一次)?(?:检查|化验|检测|评估|核对|核实|确认|咨询|问|看一下|复核)|' +
  '(?:以|按|凭)(?:你的|具体)(?:情况|身体状况|实际)(?:而|来)(?:定|说|判断)|' +
  '(?:仅|只)(?:供|作)参考|' +
  '(?:亲|请|你)(?:自行|自己)(?:判断|斟酌)',
  'i'
);

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkAnecdoteAsProof(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  const hasAnecdote = ANECDOTE_ZH.test(text) || ANECDOTE_EN.test(text);
  if (!hasAnecdote) return { hit: false, score: 0, detail: '', count: 0 };

  // 明确把结论限定在个例范围内的正当表述 → 不判
  if (SELF_LIMIT_ZH.test(text) || SELF_LIMIT_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  // 前瞻核验建议在场：样本被用来提示核实，不是被用来宣布疗效
  if (ADVICE_GUARD.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const hasUniversal = UNIVERSAL_ZH.test(text) || UNIVERSAL_EN.test(text);
  if (!hasUniversal) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  return {
    hit: true,
    score: 0.55,
    count: 1,
    detail: isZh
      ? '个例冒充普遍×个例来源×全称结论(zh)'
      : 'anecdote-as-proof×source×universal(en)',
  };
}

module.exports = {
  checkAnecdoteAsProof,
  // [r560] 供守卫测试做「置空指定支必须变红」的变异注入用。
  __internals: () => ({
    ANECDOTE_ZH, ANECDOTE_EN,
    SELF_LIMIT_ZH, SELF_LIMIT_EN,
    UNIVERSAL_ZH, UNIVERSAL_EN,
    ADVICE_GUARD,
  }),
};
