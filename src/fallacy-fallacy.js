/**
 * src/fallacy-fallacy.js — 「谬误谬误」检测器（第 178 个判别维度）
 *
 * [r180 立项] philosophy_decision 本体裁决 accelerate（confidence 0.7 /
 * priority 40 / trigger optimal_conditions / goalReviewed true；cognitiveLoad
 * 与 uncertainty 均为字符串 "unknown"，按轮次纪律不当实质背书）。轮前差距
 * 扫描（grep -rl 逐候选族计数 src/）：fallacy_fallacy / ecological_fallacy /
 * planning_fallacy / attribute_substitution / galileo_fallacy 在 src/ 下 0
 * 命中；ad_hominem / prosecutors_fallacy / whole_part_transfer 已有（分别为
 * fallacies 子标签、fallacies 子标签、第 170 维度）。外部研究三层搜索均拿到
 * 结果（HN Algolia: arXiv 2405.02318 258 pts / Logical Fallacies Are Usually
 * Irrelevant or Cited Incorrectly 176 pts / Show HN: Aristotl 173 pts；GitHub
 * API: LukeStonehm/LogicalDefence 140★ / causalNLP/logical-fallacy 96★；
 * UTEP Master List of Logical Fallacies 全文 223,983 字节已落盘
 * /tmp/hf-master-fallacies.txt）。缺口成立：本族是「论证无效 → 结论为假」
 * 的推理倒置，存量维度只管「哪一条论证是谬误」，没有一个维度管
 * 「用谬误指控冒充对事实的反驳」。
 *
 * 辨别的族：「谬误谬误」（fallacy fallacy / argumentum ad logicam /
 * argument from fallacy）——**指认对方的论证犯有谬误或推理无效，据此断定
 * 对方的结论为假、应被驳回、不可信**：
 *   你犯了诉诸情感的谬误，所以你的观点完全是错的。
 *   这是稻草人，因此你的结论根本不成立。
 *   你的论证明显是循环论证，可见这个主张必须被彻底否定。
 *   你这段推理有逻辑漏洞，所以你的说法纯属捏造。
 *   That's a straw man, so your conclusion is false.
 *   Your reasoning is circular, therefore your claim can be dismissed.
 *   Since your whole argument is an ad hominem, there is no reason to take
 *   your claim seriously.
 *
 * 为什么这是判别者的核心缺口（对齐心虫目标「寻真而非似是而非」）：
 *   论证无效（invalid）与结论为假（false）是两个独立的命题状态——一个
 *   无效论证完全可以推出一个**为真**的结论（「所有猫会飞，咪咪是猫，所以
 *   咪咪会飞」前提全假结论碰巧为真）。把「我驳倒了你的论证」当成「我驳倒
 *   了你的事实」，是用修辞胜利冒充真理判定，是 AI 输出中最常见的似是而非
 *   之一：它会系统性地把「还没被证明」误报成「已被证伪」，把讨论从证据
 *   竞赛降级成谬误点名竞赛。
 *
 * 与既有维度的边界（r180 复量归因）：
 *   · ad_hominem / straw_man / tu_quoque / poisoning_the_well / appeal_* /
 *     circular_reasoning / gamblers_fallacy 等维度（以及 fallacies 维度内
 *     的 ad_hominem、prosecutors_fallacy 子标签）管的是「这一条论证本身
 *     是不是谬误」——它们判**前提侧**；本族判**结论侧**：指控成立之后
 *     能不能推出「对方的事实主张为假」。两者常在同句共现（本族腿①正是
 *     这些维度的射程），但判定的是不同的推理步骤。
 *   · unsupported_claim / absolute_claim 管断言强度与依据缺失；本族有明确
 *     的两步论证结构（指谬误在前、废结论在后）。
 *   · reasoning_coherence 管论证内部连贯性；本族不涉内部连贯，判的是
 *     「无效 → 假」这一跨命题推理违规。
 *
 * 判据（三腿共现，缺一不判）：
 *   · 腿① FALLACY 谬误指认：指名谬误裸名词（稻草人/偷换概念/诉诸权威/
 *     幸存者偏差/人身攻击/诡辩/逻辑谬误/推理错误/论证无效……）或泛指论证
 *     缺陷（你的论证/推理/逻辑 + 问题/漏洞/错误/无效/站不住脚……）。
 *   · 腿② REJECT 结论废弃：连接词（所以/因此/因而/可见/足见/据此/那么/
 *     so/therefore/thus/hence）→ 结论名词（观点/结论/主张/说法/论点/论断/
 *     claim/conclusion/point/thesis……）→ 假值谓语（是错的/是假的/不成立/
 *     荒谬/一派胡言/不足为信/被证伪/全盘否定……）。**腿②必须落在结论名词
 *     上，不能落在论证名词上**——「你的论证不成立」是正确判别（论证未获
 *     支持），「你的观点不成立」才是本族（结论被判假）。这是本维度最
 *     重要的结构性区分，也是良性样本设计的核心。
 *   · 腿③ ORDER 顺序：腿①必须早于腿②（先指谬误、后废结论）。
 *
 * 为什么取 VERIFY 级：单句可能是正当的逻辑批评（「你的论证有谬误，但这
 * 只说明推理有问题，不等于你的结论为假」是教科书级的正确判别），也可能是
 * 哲学/逻辑学课堂上的谬误讲解。verify 的含义是「这段把论证无效冒充结论
 * 为假的推理需要核查」——调用方应要求把「论证状态」与「事实状态」分开再
 * 采信。与 r161-r179 全部评价/论证族同口径。
 *
 * 明确不判的（豁免，全部可负例注入置空）：
 *   · 概念/教学转述（谬误谬误/谬误清单/常见谬误/识别谬误/谬误的定义/
 *     fallacy fallacy/argumentum ad logicam/list of logical fallacies——
 *     讨论这个谬误本身是正确判别）；
 *   · 腿②谓语前的否定与对冲（未必/不一定/并非/不见得/不是/推不出/不等于/
 *     不代表/not/never/does not——「不等于你的结论为假」「not necessarily
 *     false」是正确判别；161 轮同款 NEG 前置豁免先例）；
 *   · 结论名词缺失或落在论证名词上（腿②结构性不匹配，天然不判）；
 *   · 对冲弱化结论（可能/也许/或许/大概/似乎/maybe/perhaps/might）；
 *   · 疑问句（含 ?/？）。
 *
 * 已知边界（下轮可继续）：腿③只做前向（先谬误指控、后结论废弃）。反向形
 * 「你的观点是错的，因为你犯了稻草人谬误」在语义上同族，但因其几乎总以
 * 「因为」连接、与大量合法因果解释同形，本轮不收——保守放过而非误伤。
 *
 * 实现形态同 r179 moralistic-fallacy.js 先例：常量全部为 RegExp 数组 +
 * anyHit/scanAll 助手，负例注入以 [] 置空指定常量（证明该腿/豁免在承重）。
 */
'use strict';

// ─── 腿① FALLACY 谬误指认 ─────────────────────────────────────────
// a 指名谬误（裸名词形态自查，161 轮教训：同族词去掉后缀仍须能独立命中——
//   收「稻草人」而非只收「稻草人谬误」，收「诉诸权威」而非只收「诉诸
//   权威谬误」，收「幸存者偏差」「确认偏误」「可得性偏差」「锚定效应」
//   等偏差类裸名词）。不收「滑坡」裸词（与地质义同形，误伤面大于收益），
//   只收「滑坡谬误/滑坡论证/滑坡推论」；同理不收裸「跑题」单字，收
//   「转移话题/偷换论题」。
const FALLACY_ZH = [
  /(?:稻草人|偷换概念|偷换论题|转移话题|偷梁换柱|红鲱鱼|离题万里)/,
  /(?:循环论证|循环定义|循环谬误|窃取论点|预设结论|预设前提|乞题|丐词)/,
  /(?:因果倒置|倒因为果|事后归因|错把相关当因果|混淆因果|虚假相关)/,
  /(?:滑坡谬误|滑坡论证|滑坡推论|滑坡效应)/,
  /(?:非黑即白|假两难|伪两难|虚假二分|非此即彼|两难推理|虚构二分)/,
  /(?:以偏概全|轻率概括|幸存者偏差|确认偏误|锚定效应|可得性偏差|可得性法则|赌徒谬误|赌徒错觉|热手谬误|基本率谬误|基本率忽视|检察官谬误|合取谬误|区群谬误|生态谬误|合成谬误|分解谬误|德州神枪手|聚光灯谬误|聚焦错觉|代表性启发|属性替代|规划谬误|叙事谬误|模型误用|蒙面人谬误|中项不周延|量词移转)/,
  /(?:诉诸权威|诉诸情感|诉诸恐惧|诉诸怜悯|诉诸自然|诉诸传统|诉诸大众|诉诸无知|诉诸后果|诉诸年龄|诉诸动机|诉诸人品|诉诸更惨|诉诸富贵|诉诸贫穷|诉诸虚伪)/,
  /(?:人身攻击|对人不对事|投毒下井|毒井)/,
  /(?:机械类比|不当类比|错误类比|无效类比|不当比喻)/,
  /(?:歧义谬误|一语多义|歧义推论|概念混淆|偷换字义|偷换意义)/,
  /(?:无真正的苏格兰人|真正的苏格兰人|举证倒置|举证责任倒置)/,
  /(?:完美主义谬误|涅槃谬误|断章取义|曲解原意|望文生义|采樱桃|挑樱桃)/,
  /(?:诡辩|谬误|谬论|逻辑谬误|逻辑错误|逻辑漏洞|逻辑矛盾|推理错误|推理漏洞|论证无效|无效论证|论证错误|论证漏洞|非形式谬误|形式谬误|论证不充分|论据不足|以轶事为证|轶事证据|轶事论证|虚假前提|前提不实)/,
];
// b 泛指论证缺陷：「犯了/这是/存在 + 缺陷名词」或「你的论证 + 缺陷词」
const FALLACY_GENERIC_ZH = [
  /(?:犯了|犯下|犯过|这是|这是典型的|属于|就是|你在犯|你这是在|你已经在|满是|充满|充斥着|存在|有明显的|有明显的?|带有|全是)[^。！？；]{0,8}(?:谬误|谬论|逻辑谬误|逻辑错误|逻辑漏洞|逻辑矛盾|推理错误|推理漏洞|论证无效|无效论证|论证错误|论证漏洞|循环谬误|非形式谬误|形式谬误|论证不充分|论据不足|以轶事为证|轶事证据|诡辩|稻草人|偷换概念|循环论证)/,
  /(?:你的|您的|他的|她的|对方的|这一|这个|所谓|你那|他那个|整段|这段|这套)[^。！？；]{0,8}(?:论证|推理|逻辑|论据|论点|论辩|推论|辩解)[^。！？；]{0,12}(?:有|存在|满是|充满|充斥着|都是|明显|带有|全是|属于)[^。！？；]{0,8}(?:问题|漏洞|错误|毛病|缺陷|矛盾|跳跃|混乱|不成立|无效|站不住脚|瑕疵|毛病|毛病)/,
];
const FALLACY_EN = [
  /\b(?:straw\s*m[ae]n|red\s+herring|moving\s+the\s+goalposts?|beg(?:ging)?\s+the\s+question|circular\s+(?:reasoning|argument|logic)|genetic\s+fallacy|post\s+hoc|false\s+(?:dilemma|cause|equivalence)|slippery\s+slope|hasty\s+generalization|sweeping\s+generalization|survivorship\s+bias|confirmation\s+bias|anchoring(?:\s+(?:effect|heuristic|bias))?|availability\s+(?:heuristic|bias)|gambler'?s\s+fallacy|hot[-\s]hand|base[-\s]rate\s+(?:fallacy|neglect)|prosecutor'?s\s+fallacy|conjunction\s+fallacy|ecological\s+fallacy|fallacy\s+of\s+(?:composition|division)|faulty\s+analogy|weak\s+analogy|false\s+analogy|equivocation|no\s+true\s+scotsman|special\s+pleading|tu\s+quoque|whataboutism|poisoning\s+the\s+well|bandwagon|texas\s+sharpshooter|clustering\s+illusion|focusing\s+illusion|planning\s+fallacy|narrative\s+fallacy|ludic\s+fallacy|masked\s+man|nirvana\s+fallacy|perfect\s+solution\s+fallacy|cherry[-\s]pick(?:ing)?|appeal\s+to\s+(?:authority|emotion|fear|pity|nature|tradition|popularity|ignorance|consequences|wealth|poverty|age|motive|hypocrisy)|ad\s+hominem|ad\s+populum|ad\s+verecundiam|ad\s+ignorantiam|ad\s+baculum|ad\s+nauseam|non\s+sequitur)\b/i,
  /\b(?:your|his|her|their|its|this|that|the)\b[^.]{0,25}\b(?:argument|reasoning|logic|case|inference|premise|rationale)\b[^.]{0,25}\b(?:is|are|has|contains|commits|rests\s+on|suffers\s+from)\b[^.]{0,25}\b(?:a\s+|an\s+)?(?:fallacy|fallacious|flaw|flawed|invalid|unsound|circular|broken|erroneous|mistaken|faulty|defective|self[-\s]contradictory)\b/i,
  /\b(?:that'?s|this\s+is|it'?s|you'?re\s+committing|you\s+commit|you\s+are\s+committing)\s+(?:a\s+|an\s+)?(?:logical\s+)?(?:fallacy|fallacious|non\s+sequitur|ad\s+hominem|straw\s*m[ae]n|circular|beg(?:ging)?\s+the\s+question|false\s+dilemma|slippery\s+slope|hasty\s+generalization|red\s+herring)\b/i,
  /\b(?:logical\s+(?:fallacy|error|flaw)|invalid\s+(?:argument|reasoning)|faulty\s+reasoning|flawed\s+reasoning|circular\s+reasoning|begging\s+the\s+question|false\s+cause)\b/i,
];

// ─── 腿② REJECT 结论废弃 ───────────────────────────────────────────
// 结构：连接词 → 结论名词 → 假值谓语。结论名词是关键闸门：腿②必须落在
// **结论/观点**上，不能落在**论证/推理/论据**上（后者是「论证未获支持」
// 的正确判别，不是本族）。故 CLAIM 表只收结论侧名词，显式不收
// 论证/推理/论据/逻辑/证据。
const REJECT_ZH = [
  // 连接词 + [≤18字] + 结论名词 + [≤14字] + 假值谓语（末组捕获谓语位置，
  // 供否定前置豁免定位用——r180 设计：PREFALSE 必须贴在谓语前，取整条
  // 匹配起点会落在连接词之前，导致否定豁免永不承重）。
  /(?:所以|因此|因而|可见|足见|据此|故而|那么|正说明|足以说明|足以证明|这说明|由此可见)[^。！？；]{0,18}(?:观点|结论|说法|主张|论点|论断|命题|立场|看法|见解|判断|推论|提法|言论|论调|说辞|定论|整套|这套|那套|你说的|他说的|其所说的|你讲的|他讲的)[^。！？；]{0,14}((?:是?错的|是错误的|是假的|假的|为假|为伪|不成立|荒谬|可笑|一派胡言|胡说八道|胡说|瞎说|胡扯|扯淡|不值一驳|不足为信|不可信|不能信|不攻自破|被驳倒|被推翻|被否定|被证伪|大错特错|无稽之谈|不堪一击|纯属捏造|纯属编造|弥天大谎|一派谎言|站不住脚|全盘皆错|完全错误|根本错误|彻底错误|一错到底|错得离谱|荒谬至极|可笑至极|应当被否定|应被否定|必须被否定|应予否定|予以否定|被彻底否定|全盘否定|彻底否定|不值一提|不堪一驳|一驳即倒|该被否定|该被推翻|该被抛弃|被彻底抛弃|被抛弃|被摒弃|应予摒弃|应予驳斥|应被摒弃|被彻底摒弃))/,
];
const REJECT_EN = [
  /\b(?:so|therefore|thus|hence|which\s+means|which\s+proves|that\s+proves|this\s+proves|it\s+follows\s+that|consequently)\b[^.]{0,40}\b(?:your|his|her|their|its|the|this|that|his\s+whole|your\s+whole)?\s*(?:claim|conclusion|point|position|theory|assertion|thesis|statement|idea|view|opinion|case|argument\s+of\s+yours)\b[^.]{0,30}\b(?:is|are|must\s+be|has\s+to\s+be|has\s+been)?\s*((?:false|wrong|incorrect|untrue|invalid|bogus|nonsense|absurd|ridiculous|baseless|unfounded|mistaken|disproven|debunked|refuted|discredited|fallacious|unreliable))\b/i,
  /\b(?:so|therefore|thus|hence|which\s+means|that\s+proves|this\s+proves)\b[^.]{0,40}\b(?:your|his|her|their|the|this|that)?\s*(?:claim|conclusion|point|position|theory|assertion|thesis|statement|idea|view|opinion|case)\b[^.]{0,30}\b(?:can|could|should|must|may)?\s*(?:be)?\s*((?:dismissed|disregarded|rejected|discarded|ignored|thrown\s+out))\b/i,
  /\b(?:so|therefore|thus|hence|which\s+proves|that\s+proves)\b[^.]{0,30}\b(?:you|he|she|they)\s*(?:are|is|were|'re)?\s*(?:wrong|mistaken|lying|dishonest)\b/i,
  /\b(?:so|therefore|thus|hence|since)\b[^.]{0,60}\b(?:no|little|not\s+much)\s+reason\s+to\s+(?:take|listen\s+to|believe|trust|accept)\b/i,
  /\bthere\s+is\s+(?:no|little)\s+reason\s+to\s+(?:take|listen\s+to|believe|trust|accept)\b/i,
];

// ─── 腿③ ORDER + 豁免常量 ─────────────────────────────────────────
// 腿②谓语前的否定/对冲 → 正确判别（「不等于你的结论为假」「not necessarily
// false」）。注意不放宽到裸「不能/不会/不可能」——那会误杀
// 「所以你的观点在逻辑上就不能成立」这类攻击形（r180 设计：否定词表只收
// 能明确否定「假值断言」本身的形式）。
const PREFALSE_ZH = [/(?:未必|不一定|并非|不见得|不是|算不上|称不上|谈不上|不等于|不代表|不说明|不意味着|并不意味着|证明不了|推不出|推导不出|说明不了|不足以证明|无法推出|不能推出|绝不是|绝非|绝对不会)[^。！？；]{0,8}$/];
const PREFALSE_EN = [/\b(?:not|never|isn'?t|aren'?t|doesn'?t|does\s+not|cannot|can'?t|won'?t|wouldn'?t|no)\b[^.]{0,30}$/i];

// 两腿之间的「不等于/不代表/推不出」→ 把论证状态与事实状态分开的正确判别。
const CORRECT_ZH = [/(?:不等于|不代表|不意味着|并不意味着|不说明|证明不了|推不出|推导不出|说明不了|不足以证明|无法推出|不能推出)/];
const CORRECT_EN = [/\b(?:does\s+not\s+mean|doesn'?t\s+mean|does\s+not\s+imply|doesn'?t\s+imply|does\s+not\s+prove|doesn'?t\s+prove|not\s+to\s+say)\b/i];

// 豁免：概念/教学转述（讨论这个谬误本身是正确判别）。注意不收
// 「犯了谬误」这类同时是攻击形的组合，避免把自己的腿①豁免掉。
const META_EXEMPT_ZH = [
  /(?:谬误谬误|谬误清单|谬误列表|谬误合集|谬误手册|谬误科普|常见谬误|谬误有哪些|识别逻辑谬误|识别谬误|辨别谬误|谬误的概念|谬误的定义|谬误分类|什么是谬误|谬误是什么|逻辑谬误有|诡辩术|谬误讲座|谬误课)/,
];
const META_EXEMPT_EN = [
  /\bfallacy\s+fallacy\b/i,
  /\bargumentum\s+ad\s+logicam\b/i,
  /\bargument\s+from\s+fallacy\b/i,
  /\blist\s+of\s+(?:logical\s+)?fallacies\b/i,
  /\b(?:logical\s+)?fallacies\s+(?:include|are|such\s+as)\b/i,
  /\bwhat\s+is\s+a\s+(?:logical\s+)?fallacy\b/i,
  /\b(?:types|kinds)\s+of\s+(?:logical\s+)?fallacies\b/i,
];

// 豁免：对冲弱化结论
const HEDGE_ZH = [/(?:可能|也许|或许|大概|恐怕|似乎|不见得|不一定|未必)/];
const HEDGE_EN = [/\b(?:maybe|perhaps|might|probably|seems|appears|could\s+be|possibly)\b/i];

// ─── 助手 ─────────────────────────────────────────────────────────
function anyHit(list, text) {
  for (const re of list) if (re.test(text)) return true;
  return false;
}

/** 收集一组常量在文本中的全部出现位置（供顺序判定用）。 */
function scanAll(list, text) {
  const hits = [];
  for (const re of list) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      if (m[0].length === 0) { g.lastIndex++; continue; }
      hits.push({ pos: m.index, end: m.index + m[0].length });
    }
  }
  return hits;
}

/**
 * 腿②专用扫描：除起止位置外，额外算出**假值谓语**的起始位置（末组捕获组
 * 在匹配末尾，故 falsePos = 起点 + 全长 - 组长）。否定前置豁免必须贴在
 * 谓语前判定——取整条匹配起点会落在连接词之前，让豁免永不承重（r180 实测
 * 抓出的设计缺陷）。
 */
function scanReject(list, text) {
  const hits = [];
  for (const re of list) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      if (m[0].length === 0) { g.lastIndex++; continue; }
      const falsePos = (m[1] && m[1].length > 0)
        ? m.index + m[0].length - m[1].length
        : m.index;
      hits.push({ pos: m.index, end: m.index + m[0].length, falsePos });
    }
  }
  return hits;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以 [] 置空指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkFallacyFallacy(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const F_Z_ = R.FALLACY_ZH || FALLACY_ZH;
  const FG_Z_ = R.FALLACY_GENERIC_ZH || FALLACY_GENERIC_ZH;
  const F_E_ = R.FALLACY_EN || FALLACY_EN;
  const RJ_Z_ = R.REJECT_ZH || REJECT_ZH;
  const RJ_E_ = R.REJECT_EN || REJECT_EN;
  const PF_Z_ = R.PREFALSE_ZH || PREFALSE_ZH;
  const PF_E_ = R.PREFALSE_EN || PREFALSE_EN;
  const CO_Z_ = R.CORRECT_ZH || CORRECT_ZH;
  const CO_E_ = R.CORRECT_EN || CORRECT_EN;
  const META_Z_ = R.META_EXEMPT_ZH || META_EXEMPT_ZH;
  const META_E_ = R.META_EXEMPT_EN || META_EXEMPT_EN;
  const HEDGE_Z_ = R.HEDGE_ZH || HEDGE_ZH;
  const HEDGE_E_ = R.HEDGE_EN || HEDGE_EN;

  // 概念/教学转述 → 不是运用它
  if (anyHit(META_Z_, text) || anyHit(META_E_, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 疑问句
  if (/[?？]/.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 对冲弱化结论（全文级——出现对冲即整句弱化，与 r179 同口径）
  if (anyHit(HEDGE_Z_, text) || anyHit(HEDGE_E_, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const fallacyHits = scanAll(F_Z_, text)
    .concat(scanAll(FG_Z_, text))
    .concat(scanAll(F_E_, text));
  if (fallacyHits.length === 0) return { hit: false, score: 0, detail: '', count: 0 };
  const rejectHits = scanReject(RJ_Z_, text).concat(scanReject(RJ_E_, text));
  if (rejectHits.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  for (const f of fallacyHits) {
    // 谬误指认之后的「不等于/不代表/推不出/说明不了」→ 把论证状态与事实
    // 状态分开的正确判别（r180：查腿①之后全段，覆盖尾句补刀形）。
    const after = text.slice(f.end);
    if (anyHit(CO_Z_, after) || anyHit(CO_E_, after)) continue;
    for (const r of rejectHits) {
      // 腿③：先指谬误、后废结论（反向「因为」形本轮不收，见文件头已知边界）
      if (f.end > r.pos) continue;
      // 腿②谓语前的否定/对冲 → 正确判别（「不等于结论为假」「not necessarily false」）
      const beforeFalse = text.slice(Math.max(0, r.falsePos - 10), r.falsePos);
      if (anyHit(PF_Z_, beforeFalse) || anyHit(PF_E_, beforeFalse)) continue;
      return {
        hit: true,
        score: 0.5,
        count: 1,
        detail: '谬误谬误×谬误指认×结论废弃断言',
      };
    }
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkFallacyFallacy,
  __internals: () => ({
    FALLACY_ZH, FALLACY_GENERIC_ZH, FALLACY_EN,
    REJECT_ZH, REJECT_EN,
    PREFALSE_ZH, PREFALSE_EN, CORRECT_ZH, CORRECT_EN,
    META_EXEMPT_ZH, META_EXEMPT_EN, HEDGE_ZH, HEDGE_EN,
  }),
};
