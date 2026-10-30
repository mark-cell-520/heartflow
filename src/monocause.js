/**
 * src/monocause.js — 「单一因果过度简化」检测器（第 161 个判别维度）
 *
 * [r?? 立项] decision 本体在 160 维引擎上选出（heartflow_philosophy_decision，
 * type=accelerate / confidence 0.7 / priority 40 / goalReviewed true）。
 * 探测器证据：grep src/（排除 test/）monocause / causal_oversimplif /
 * reductionis / 单一因果 / 唯一原因(维度) = 0 命中（真缺口，射程外）。
 * 外部搜索记录（如实）：HN Algolia 命中真实基准故事 "Fallacy of the single
 * cause" / "Recognising the fallacy of a single root cause"
 * （https://cevo.com.au/post/2017-11-10-fallacy-of-a-single-root-cause/，
 *  HN id 16200526）；Semantic Scholar 4 次尝试全部 HTTP 429（限流不可用）；
 *  GitHub monocausal/single-cause 检索仅无关低星仓库，无成熟规则引擎实现。
 *  不编造 arXiv ID——来源定性为标准非形式谬误 "fallacy of the single cause /
 *  causal oversimplification"，实现为心虫自有规则（仿 appeal-to-novelty.js）。
 *
 * 辨别的族：单一因果过度简化（monocause / fallacy of the single cause /
 * causal oversimplification / causal reductionism）——把**真实的、已知多因
 * 的系统性复杂结果**，压成**单一原因**，并用**绝对化归因框架**（完全是
 * 因为/纯粹是/唯一的原因/说到底/无非/solely because/entirely due to/
 * nothing but）**否认或忽略多因性**：
 *   这家公司倒闭完全是因为管理不善。
 *   如今年轻人不生育，全都是因为房价太高。
 *   经济危机的根源全在货币政策，没有别的原因。
 *   他创业失败，纯粹是因为运气不好。
 *   青少年犯罪率上升，说到底就是因为家庭教育缺失。
 *   美国今天的衰落，唯一的原因就是产业空心化。
 *   The financial crisis was caused entirely by deregulation.
 *   Crime is nothing but a product of poverty.
 *   The company failed solely because of bad management.
 *   Rome fell purely because of lead in the aqueducts.
 *
 * 与既有维度的边界（grep + 归因）：
 *   · post_hoc（既有维度）管**以时间先后为依据的归因**（穿了衣服→考砸），
 *     本族不依赖时间先后，落点是**把多因现象压成单因**；
 *   · false_cause（fallacies 子标签）管**相关/时序→因果**，本族管
 *     **真实复杂结果的归因单一化**，机制可真；
 *   · pseudo_causal（既有维度）管**编造不存在的因果机制**，本族的单一
 *     原因可以完全真实，错在**否认其他原因**；
 *   · texas_sharpshooter（fallacies 子标签）管**挑樱桃式选择性证据**，
 *     本族管**归约到单因**，不涉证据取舍；
 *  · base_rate_fallacy / prosecutors_fallacy（fallacies 子标签）管概率
 *     条件混淆，本族不管概率；
 *  · 其余 160 个维度对本族样本预计零命中（射程外）。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 腿① COMPLEX-OUTCOME 已知多因的系统性现象——经济危机/金融危机/公司
 *     倒闭/企业破产/犯罪率/离婚率/贫富差距/少子化/低生育/战争爆发/王朝
 *     覆灭/帝国衰落/文明消亡/社会撕裂/信任危机/道德滑坡/创业失败/市值
 *     暴跌…（**只收系统性多因现象，不收考试/比赛/普通项目等可单一归因
 *     的琐事**——这是精度锚，保护良性样本不误伤）；EN：the crisis /
 *     the recession / crime rate / the company failed / the empire fell /
 *     poverty / inequality / this whole situation…。
 *   · 腿② SINGLE-CAUSE 绝对化单一归因框架——完全是因为/纯粹是/全都是
 *     因为/唯一的原因/归根结底/说到底/无非/仅仅是因为/就是因为…没有别的
 *     原因；EN：entirely because of / solely due to / nothing but / the
 *     only reason / it all comes down to / purely because…。
 *   · 缺腿不判：只有腿①（「经济衰退正在影响出口」）是正常现象陈述；只有
 *     腿②（「这件事完全是因为粗心」）若无系统性复杂现象腿，是普通归因，
 *     不构成本族（可单一归因的琐事）。
 *
 * 为什么取 VERIFY 级：单句可能是转述他人观点（「他认为危机全怪监管，我
 * 不完全同意」）、文学对白、历史归因的教学讨论。verify 的含义是「这段
 * 把复杂现象压成单因，需要回到多因框架复核」——调用方应要求列出并权衡
 * 其他因素，而非据此下确定性结论。
 *
 * 明确不判的（豁免——正当陈述、提问、多因分析、概念分析）：
 *   · 多因并列/共同作用（多重因素/共同作用/既有…又有…/a combination of
 *     /no single cause）——承认多因就不是本族；
 *   ·  hedged 单一贡献者（一个主要原因/…之一/one of the main drivers/
 *     partly due to）——把某因列为"之一"不是绝对归因；
 *   · 提问句式（为什么会…/what caused…）——求知不是断言；
 *   · 评析这套话术本身（单一因果谬误/还原论/monocausal fallacy）。
 */
'use strict';

// ─── 腿① COMPLEX-OUTCOME 已知多因的系统性现象（中文）──────────────────
// 只收"公认多因的系统性现象"，不收琐事（考试/比赛/普通项目/迟到）——
// 这是精度锚：把可单一归因的琐事排除，保护良性样本。
const COMPLEX_ZH = new RegExp(
  // 经济/金融
  '(?:经济|金融)(?:危机|衰退|萧条|崩溃|崩盘|下行|停滞|不景气|泡沫|风暴|海啸)' +
  '|次贷危机|金融海啸|通货膨胀|通货紧缩|滞胀|失业潮|(?:失业率|失业)(?:高|攀升|上升|率)|贫富差距|收入差距|两极分化|基尼系数|(?:社会)?不平等|贫困(?:化|率|问题)|经济泡沫' +
  // 企业（公司/企业层级的崩塌是经典单一归因靶）
  '|公司(?:倒闭|破产|垮了|衰落|衰败|崩塌|崩盘|溃败|由盛转衰)|企业(?:倒闭|破产|衰败|衰落|溃败)|创业(?:失败|公司倒闭)|独角兽(?:倒闭|破产|崩盘)|市值(?:蒸发|缩水|暴跌|崩塌)|股价(?:暴跌|崩盘|雪崩|大跌)|品牌(?:衰落|没落)|(?:这家|那家|该|那)?公司(?:失败|不行了|垮了|塌了)' +
  // 社会现象（率/蔓延类）
  '|犯罪(?:率|滋生|猖獗|问题|率高)|青少年犯罪|暴力(?:犯罪|事件)(?:率|频发|上升)|离婚(?:率|率高|率攀升)|自杀(?:率|率上升)|抑郁(?:症|率|率高发)|焦虑(?:症|蔓延|流行)|肥胖(?:率|率上升|率攀升|问题)|近视(?:率|率高|率攀升)|躺平|内卷|教育(?:内卷|焦虑|军备竞赛)|校园(?:暴力|霸凌|欺凌)|医患(?:关系|矛盾|冲突)|信任(?:危机|缺失|崩塌|滑坡)|道德(?:滑坡|沦丧|失范)|社会(?:撕裂|对立|焦虑|浮躁|戾气|怨气|内耗)' +
  // 人口/生育
  '|少子化|低生育|生育(?:率)?(?:下降|走低|低迷|偏低)|生育意愿(?:低|下降|走低)|不(?:想|愿|肯|敢|打算)?(?:生育|生娃|生孩子|繁衍)|老龄化(?:严重|加剧|加深)?|人口(?:下滑|下降|负增长|萎缩|红利消失)' +
  // 历史/地缘
  '|战争(?:爆发|阴云|的起因)?|战乱|冲突(?:不断|升级|频发)?|王朝(?:覆灭|灭亡|崩溃|衰落)|帝国(?:衰落|崩溃|灭亡|由盛转衰)|文明(?:衰落|消亡|灭亡|崩溃)|革命(?:爆发|浪潮)|政权(?:更迭|垮台|崩塌|衰落)|改朝换代|盛世(?:转衰|不再)|(?:日渐|不断|走向|趋于|逐步|不可逆转地?)?衰落|由盛转衰' +
  // 通用复杂现象
  '|这一(?:切|系列|连串|波)(?:现象|问题|事件|结果|危机|乱象|困境)|这种(?:现象|局面|形势|趋势|困境|乱象|僵局)|(?:当今|当前|如今)的(?:局面|形势|困境|状况|乱象)|问题的(?:根源|症结|本质)|这一(?:局面|形势|困境|僵局|怪圈|恶性循环)|系统性(?:风险|危机|问题|失灵|危机)|(?:大|系统性)(?:萧条|衰退|崩盘)'
);

// 英文：the crisis / recession / crime rate / the company failed / the
// empire fell / poverty / inequality / this whole situation…。
// 与中文腿对齐：只认真实系统性多因现象。
const COMPLEX_EN = new RegExp(
  "\\b(?:the\\s+)?(?:financial|economic|global|housing|debt|energy|climate)?\\s*(?:crisis|crash|collapse|recession|depression|downturn|slump|meltdown)\\b" +
  "|\\b(?:rising|high|increasing)\\s+crime\\b|\\bcrime\\s+rate\\b|\\bcrime\\b" +
  "|\\bpoverty\\b|\\binequality\\b|\\bunemployment\\b|\\binflation\\b" +
  "|\\b(?:divorce|suicide|obesity|depression)\\s+rate\\b" +
  "|\\b(?:the\\s+)?(?:company|startup|firm|business|corporation|enterprise)\\s+(?:failed|collapsed|went\\s+(?:bankrupt|under|bust)|fell\\s+apart|folded|imploded)\\b" +
  "|\\b(?:the\\s+)?(?:empire|dynasty|civilization|nation|country|regime|kingdom|republic|city|state|union|rome)\\s+(?:fell|collapsed|declined|crumbled|disintegrated)\\b" +
  "|\\bthe\\s+(?:war|revolution|uprising|coup)\\b" +
  "|\\bthis\\s+(?:whole\\s+)?(?:situation|mess|phenomenon|trend|crisis|predicament|quagmire)\\b" +
  "|\\b(?:everything|all\\s+of\\s+this)\\b" +
  "|\\bthe\\s+(?:root|underlying)\\s+(?:cause|problem|issue)\\b",
  'i'
);

// ─── 腿② SINGLE-CAUSE 绝对化单一归因框架（中文）────────────────────────
// 只收"绝对化/排他性"归因框架；"主要因为/部分因为/一定程度上"是 hedged，
// 不在本腿（落入 HEDGED 豁免）。弱框架不判，保护良性样本。
const SINGLE_ZH = new RegExp(
  // 完全/纯粹/统统/全都是 是因为/由于
  '(?:完全|纯粹|统统|全都|一片|压根|根本)是(?:因为|由于|基于|在于)' +
  '|完全(?:是|在于|取决于|取决于)' +
  '|纯粹(?:是|在于|因为|由于)' +
  // 就是/全都/都 因为/由于/怪
  '|就是(?:因为|由于)|全都(?:是|怪)?(?:因为|由于)|都(?:怪|是)(?:因为|由于)' +
  // 唯一/根本/真正 的原因·因素·解释·推手
  '|唯一(?:的)?(?:原因|因素|解释|变量|推手|驱动|罪魁|祸根)(?:就是|是|在于|为)?' +
  '|(?:根本|真正|唯一)的?原因(?:就是|在于|是|只有一个)' +
  // 归根结底/说到底/无非/只不过/仅仅/单单/只因 是因为
  '|归根结底(?:就是|在于|是因为|是由于|无非是|只不过是)' +
  '|说到底(?:就是|是因为|是由于|不过是|无非是|只不过是)' +
  '|无非(?:就是|是|在于|因为|由于)|只不过(?:是|因为|由于)' +
  '|仅仅是因为|只是因为|单单是因为|全然是因为' +
  // 全都是X的错/锅/功劳；没有别的原因；与其他无关
  '|全(?:都)?是[^。]{0,12}的(?:错|锅|问题|责任|功劳|结果)' +
  '|没有别的原因|不存在其他(?:原因|因素|解释)|与其他(?:因素|原因)?无关|与其它无关|排除(?:一切|所有)其他' +
  '|一切(?:都)?是[^。]{0,16}(?:导致|造成|引起)的' +
  '|所有(?:问题|后果|乱子)(?:都)?(?:源于|来自|归结于)[^。]{0,12}一(?:个|项)'
);

// 英文：entirely because of / solely due to / nothing but / the only
// reason / it all comes down to / purely because…。
// 三支与中文对齐：a 绝对归因连接 / b 唯一原因名词 / c 排他收束。
const SINGLE_EN = new RegExp(
  // a 绝对归因连接（entirely/solely/purely + because of/due to/caused by）
  "\\b(?:is|was|are|were|it'?s)\\s+(?:entirely|solely|purely|completely|totally|simply|just|nothing|only|utterly|wholly)\\s+" +
  "(?:because\\s+of|due\\s+to|because|caused\\s+by|the\\s+result\\s+of|attributable\\s+to|down\\s+to|a\\s+product\\s+of|a\\s+consequence\\s+of|rooted\\s+in|traceable\\s+to|explained\\s+by)\\b" +
  // a2 绝对副词前置（entirely/solely due to X，无 be 动词也成立）
  "|\\b(?:entirely|solely|purely|completely|totally|wholly|utterly)\\s+(?:because\\s+of|due\\s+to|caused\\s+by|down\\s+to|attributable\\s+to)\\b" +
  // a3 动词+绝对副词+by/to（was caused entirely by / driven solely by）
  "|\\b(?:is|was|are|were)\\s+(?:caused|driven|explained|attributed|traced|brought\\s+about)\\s+(?:entirely|solely|purely|completely|totally|wholly|utterly)\\s+(?:by|to)\\b" +
  // b 唯一原因名词（the only/single/sole reason/cause/factor/explanation）
  "|\\bthe\\s+(?:only|single|sole|lone)\\s+(?:reason|cause|factor|explanation|driver|variable|culprit|source)\\b" +
  // c 排他收束（it all comes down to / nothing but / nothing to do with / and nothing else）
  "|\\bit\\s+all\\s+(?:comes\\s+down\\s+to|boils\\s+down\\s+to)\\b" +
  "|\\bis\\s+nothing\\s+(?:more\\s+)?(?:than|but)\\b" +
  "|\\b(?:has|have)\\s+(?:nothing|only)\\s+to\\s+do\\s+with\\b" +
  "|\\band\\s+nothing\\s+else\\b|\\bwith\\s+no\\s+other\\s+(?:factor|reason|explanation|cause)\\b" +
  "|\\bfor\\s+(?:one|a\\s+single)\\s+reason\\s+(?:only|alone)\\b",
  'i'
);

// ─── 豁免一：多因并列/共同作用（承认多因就不是本族）────────────────────
const MULTICAUSE_EXEMPT = new RegExp(
  '(?:多种|几个|多方|多重|一系列|诸多|种种)(?:原因|因素|方面|层面)' +
  '|共同(?:作用|导致|造成|促成|推动|决定)|相互(?:交织|叠加|作用|影响)' +
  '|叠加(?:效应|在一起|共振)|错综复杂|既有[^。]{0,10}又有[^。]{0,10}|既[^。]{0,8}也[^。]{0,8}还[^。]{0,8}' +
  '|诸多(?:原因|因素|方面)|环环相扣|多因(?:一果|交织|叠加)|多因素' +
  '|multiple\\s+(?:causes|factors|reasons)|a\\s+(?:combination|mix|confluence)\\s+of|several\\s+(?:causes|factors|reasons)' +
  '|interplay\\s+(?:of|between)|multifactorial|complex\\s+interplay|contributed\\s+(?:together|jointly)' +
  '|no\\s+single\\s+(?:cause|factor|reason)|(?:cannot|can\\s+not)\\s+be\\s+(?:reduced|attributed)\\s+to\\s+(?:one|a\\s+single)',
  'i'
);

// ─── 豁免二：hedged 单一贡献者（把某因列为"之一"不是绝对归因）──────────
const HEDGED_EXEMPT = new RegExp(
  '(?:其中(?:一个|之一)(?:原因|因素))' +
  '|(?:一个|其中之一)(?:重要|主要|关键|直接|间接|显著|突出)?(?:的)?(?:原因|因素|推手|驱动力|方面)' +
  '|(?:重要|主要|关键|直接|间接|显著|突出)?(?:的)?(?:原因|因素|推手|驱动力)(?:之一)' +
  '|(?:主要|重要|关键|直接|显著)(?:的)?(?:原因|因素|推手|驱动力)(?:就)?是' +
  '|one\\s+of\\s+the\\s+(?:main|key|primary|major|significant|chief|principal)\\s+(?:drivers|factors|causes|reasons|contributors)' +
  '|a\\s+(?:major|key|significant|primary|main|contributing)\\s+(?:factor|driver|cause|reason|contributor)' +
  '|(?:a\\s+)?contributing\\s+factor|partly\\s+(?:due\\s+to|because)|in\\s+part\\s+(?:due\\s+to|because)' +
  '|to\\s+some\\s+(?:extent|degree)|part\\s+of\\s+the\\s+reason',
  'i'
);

// ─── 豁免三：提问句式（求知不是断言）────────────────────────────────
const QUESTION_EXEMPT = /(?:为什么|为何|何故|怎么会|咋会|啥原因|什么原因|哪些(?:原因|因素)|多少(?:原因|因素)|何以)[^。]{0,20}[?？]?|(?:why\s+(?:is|did|does|was|were|do)|what\s+(?:caused|led\s+to|is\s+the\s+reason|'s\s+behind|is\s+behind))[^.]{0,40}[?]/i;

// ─── 豁免四：评析这套话术本身 / 概念分析 ─────────────────────────────
const META_EXEMPT_ZH = /(?:单一(?:因果|因素|原因)(?:谬误|归因|论|简化|决定论)|(?:因果|归因)(?:过度)?简化|还原论|以偏概全地把[^。]{0,8}归(?:因|结|于)|单一(?:因果|因素|原因)是(?:一种|典型的|常见的)?(?:谬误|错误|简化))/;
const META_EXEMPT_EN = /\b(?:single[- ]cause\s+(?:fallacy|error|thinking|myth)|monocausal\s+(?:fallacy|error|thinking)|causal\s+(?:oversimplification|reductionism)|reductionis(?:m|tic)\s+(?:fallacy|error|thinking)|oversimplif(?:y|ying|ication)\s+(?:of\s+)?(?:the\s+)?caus|attributing\s+.{0,30}\s+to\s+a\s+single\s+(?:cause|factor)\s+is\s+a\s+(?:fallacy|mistake|error))\b/i;

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkMonocause(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const COMPLEX_ZH_ = R.COMPLEX_ZH || COMPLEX_ZH;
  const COMPLEX_EN_ = R.COMPLEX_EN || COMPLEX_EN;
  const SINGLE_ZH_ = R.SINGLE_ZH || SINGLE_ZH;
  const SINGLE_EN_ = R.SINGLE_EN || SINGLE_EN;
  const MULTICAUSE_EXEMPT_ = R.MULTICAUSE_EXEMPT || MULTICAUSE_EXEMPT;
  const HEDGED_EXEMPT_ = R.HEDGED_EXEMPT || HEDGED_EXEMPT;
  const QUESTION_EXEMPT_ = R.QUESTION_EXEMPT || QUESTION_EXEMPT;
  const META_EXEMPT_ZH_ = R.META_EXEMPT_ZH || META_EXEMPT_ZH;
  const META_EXEMPT_EN_ = R.META_EXEMPT_EN || META_EXEMPT_EN;

  // 评析这套话术 / 概念分析 → 不是运用它
  if (META_EXEMPT_ZH_.test(text) || META_EXEMPT_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 提问句式：为什么会…——求知不是断言
  if (QUESTION_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 多因并列/共同作用：承认多因就不是本族
  if (MULTICAUSE_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // hedged 单一贡献者：把某因列为"之一/主要"不是绝对归因
  if (HEDGED_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  const complexZh = COMPLEX_ZH_.test(text);
  const complexEn = COMPLEX_EN_.test(text);
  const singleZh = SINGLE_ZH_.test(text);
  const singleEn = SINGLE_EN_.test(text);

  // 双腿共现：系统性复杂现象 × 绝对化单一归因（缺一不判）
  if ((complexZh || complexEn) && (singleZh || singleEn)) {
    return {
      hit: true,
      score: 0.5,
      count: 1,
      detail: isZh ? '单一因果过度简化×系统性复杂现象×绝对化单一归因(zh)' : 'monocause×complex outcome×absolute single-cause framing(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkMonocause,
  __internals: () => ({ COMPLEX_ZH, COMPLEX_EN, SINGLE_ZH, SINGLE_EN, MULTICAUSE_EXEMPT, HEDGED_EXEMPT, QUESTION_EXEMPT, META_EXEMPT_ZH, META_EXEMPT_EN }),
};
