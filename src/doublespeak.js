/**
 * src/doublespeak.js — 「语义洗白」检测器（第 163 个判别维度）
 *
 * [r164 立项] decision 本体一次选出（heartflow_philosophy_decision，
 * type=accelerate / confidence 0.7 / priority 40 / goalReviewed true；
 * 注意 rationale 的 cognitiveLoad/uncertainty 为 "unknown" 默认档，
 * 不构成实质背书）。探测器证据（/tmp/r164-probe.js，本轮实测）：
 * 语义洗白族 9 条攻击样本当前只有 1 条被存量维度代拦（pseudo_
 * profundity），其余 8 条全维度零命中或仅命中 incidental 维度——
 * 不是被聚合压掉，是射程外（真缺口）。相邻维度边界：
 *   · surveillance_normalization（第 116 维度）管**监控动作 × 为你好
 *     框定 × 清白义务**（「把手机给我看才是信任」），本族管**有害
 *     行为被换成中性/褒义名称**这一词汇替换行为本身，不要求监控
 *     语境、不要求清白义务腿；
 *   · normalization_of_deviance 管**偏差被说成惯例**，本族管**名称
 *     与实质的分离**；
 *   · soft_deflection 管**模糊回避**，本族的替换是显式命名，不是回避；
 *   · genetic_fallacy / comparative_devaluation 等不做「名实分离」的
 *     词汇判别。
 *
 * 外部来源（如实，不编造）：
 *   · 论文 arXiv:2103.16808 "Self-Supervised Euphemism Detection and
 *     Identification for Content Moderation"（IEEE S&P Oakland 2021，
 *     HN id 26725061，https://arxiv.org/abs/2103.16808 已实测 HTTP
 *     200 取到原标题）——自监督神经网络路线，与心虫纯规则引擎不同构，
 *     但其问题定义（**把敏感/有害表达替换成无害表面形式**）正是本族；
 *   · GitHub WanzhengZhu/Euphemism（36★，上述论文官方实现）、
 *     yiyepianzhounc/TED-SCL（69★，Toxic Euphemisms Detection，
 *     对比学习）——均为模型路线，无可复用规则；
 *   · HN "Doublespeak: In-Context Representation Hijacking"
 *     （https://mentaleap.ai/doublespeak/，hn id 46357686）。
 * 概念基准 = 标准修辞/批判性思维概念 "doublespeak / euphemistic
 * relabeling（语义洗白、委婉更名）」：**名字变软了，行为没变**。
 * 实现为心虫自有规则（仿 src/incredulity.js 双腿+多豁免结构）。
 *
 * 辨别的族：语义洗白（doublespeak / euphemistic relabeling）——**说话
 * 人自己**把一个**有害的、应受指责的行为**用**中性或褒义的词汇重新
 * 命名**，从而规避指责、消解反对、让受害者无从申诉：
 *   我们不是在监控你，我们是在关心你的安全。
 *   这不是裁员，这是优化，是给社会输送人才。
 *   这不叫打压，这叫帮助你成长。
 *   我们不是禁止你发言，我们是在维护讨论秩序。
 *   公司把裁员说成是优化。
 *   政府部门把强拆包装成城市更新。
 *   不能算抄袭，只能算引用不当。
 *   强制加班被说成是自愿奉献。
 *   This is not surveillance, it is care.
 *   It is not censorship, it is moderation.
 *   Not a layoff, a restructuring.
 *   We do not spy on you; we ensure your safety.
 *   The layoffs were rebranded as optimization.
 *   Coercion was dressed up as consent.
 *   Surveillance is being sold as safety.
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 腿① HARMFUL-ACT 有害行为名词/动词族——被洗白的对象。只收
 *     **道德或法律上应受指责的行为**（监控/监视/监听/打压/辞退/
 *     裁员/惩罚/处罚/欺骗/造假/剽窃/暴力/拘禁/软禁/操纵/剥削/
 *     歧视/羞辱/霸凌/造谣/污蔑/家暴/虐待/降薪/强制加班/盗窃…；
 *     EN：surveillance / censorship / layoff / coercion / manipulation /
 *     exploitation / harassment / blackmail / propaganda / pay cut…）。
 *     不收 失败/错误/缺点/问题/爱/关心 等非指责性词——这是精度锚，
 *     保证「这不是失败，是学习机会」这类正当重构不误伤。
 *   · 腿② RELABEL 重新命名框架，两条路由，**都要求有害行为是「被
 *     改名的对象」而不是「被揭穿的现实」**（方向原则）：
 *     (a) 否定替换式：否定词+关系动词+**有害词**+分隔+替代项
 *         （不是X，是Y / 并非X，而是Y / 不叫X，应叫Y / 不能算X，
 *         只能算Y；EN：this is not X, it is Y / not a X, a Y /
 *         we do not X; we Y / rather than X）；
 *     (b) 转称式：**有害词前置** + 改名动词 + 替代项
 *         （把X说成Y / X说成Y / 把X包装成Y / 把X美化为Y；EN：
 *         X was rebranded as Y / X was dressed up as Y / X is sold as Y）。
 *         中性改名动词（称为/叫做/称之为/termed/called）另需替代项
 *         命中**柔性标签表**（优化/关怀/安全/成长/秩序/调整/优化/
 *         care/safety/optimization/moderation…）——这是第三重精度
 *         锚：学者把剥削称为权力关系不是洗白，公司把裁员称为优化才是。
 *   · 方向收口（精度锚）：替代项（尾段）不得再含有害词——把「爱」
 *     说成「控制」是**正确的判别**（受害者拆穿操控），把「控制」说成
 *     「爱」才是洗白；「不叫监控，叫违法收集个人信息」是升级定性，
 *     不是洗白。
 *   · 缺腿不判：只有腿①（「监控是违法的」）是正常指控/法律讨论；
 *     只有腿②（「包装成福利调整」）无有害行为在场。
 *
 * **为什么把「以X之名行Y之实 / 名义上X实际Y / under the guise of /
 * in name only」整族排除**：这些标记的有害行为出现在**第二位置**
 * （被揭穿的现实），主语是**批评者在揭批**，不是说话人自己在改名。
 * 「以安全之名，行监控之实」本身就是一句**正确的判别**——心虫若判它
 * verify，等于罚说真话的人。首版实现收过这一族，实测确认与
 * 「这不是监控，是关心」（说话人自述）方向相反，本轮按方向原则删除。
 *
 * 为什么取 VERIFY 级：单句可能是转述他人话术、文学对白、新闻揭批
 * （「该公司把这称为优化」）、受害者的反向拆穿（「这不是爱，这是
 * 控制」——由方向原则排除）。verify 的含义是「这段把行为换了个
 * 名字，需要回到行为实质再判断」。
 *
 * 明确不判的（豁免）：
 *   · 法律定性/升级定性语境（不构成犯罪 / 治安管理处罚 / 法院认定 /
 *     涉嫌 / 正当防卫 / self-defence）——把话说得更重不是洗白；
 *   · 元话语概念评析（语义洗白 / doublespeak / euphemism 作为被
 *     分析对象）；
 *   · 无有害行为词的同形句（这不是失败，是学习机会 / It is not a
 *     bug, it is a feature）；
 *   · 中性动词 + 非柔性替代项（学者把剥削称为权力关系）。
 */
'use strict';

// ─── 腿① HARMFUL-ACT 有害行为名词族（中文）──────────────────────────
// 只收道德/法律上应受指责的行为（精度锚：失败/错误/缺点/爱/关心 等
// 非指责词一律不收，保护「这不是失败，是学习机会」这类正当重构）。
// 含裸名词形态（[r161] 裸词教训：监控/裁员 不带任何修饰也命中）。
const HARMFUL_ACT_ZH = new RegExp(
  // 监视类
  '监控|监视|监听|偷窥|偷拍|跟踪|尾随|定位追踪|行踪监控|信息封锁|内容封锁|封锁消息|刑讯' +
  // 言论管控类
  '|审查|删帖|删稿|屏蔽|封号|禁言|限流|和谐掉|下架|约谈' +
  '|禁止(?:你|您|他人|别人|网民|用户|民众|大家|所有人)?(?:发言|说话|评论|讨论|发声|表达|提问|质疑)' +
  // 职场打压类
  '|打压|排挤|穿小鞋|辞退|解雇|裁员|开除|除名|优化掉|输送到社会|人才优化|组织优化' +
  '|降薪|扣薪|欠薪|克扣|无偿加班|强制加班|强制参加|强制参与|强制出席|强制消费|强制捐款|强制订阅' +
  '|变相加班|转岗|待岗|下岗' +
  // 处罚类
  '|惩罚|处罚|处分|罚款|罚钱|体罚|变相体罚|连坐|示众|通报批评|记过|撤职' +
  // 欺诈造假类
  '|欺骗|谎言|谎话|造假|作弊|舞弊|剽窃|抄袭|洗稿|学术不端|数据注水|虚报|谎报|浮夸|缩水|盗窃|偷窃|侵占|私吞' +
  // 暴力强制类
  '|暴力|殴打|拘禁|软禁|关押|禁闭|强迫|逼迫|胁迫|逼供|诱供' +
  '|强制(?:打卡|消费|捐款|购买|下载|安装|同意)' +
  // 精神操控类
  '|操纵|操控|剥削|压榨|精神控制|洗脑|催眠|诱导|诱骗|哄骗|拐骗|PUA|情感操控' +
  // 歧视侮辱类
  '|歧视|欺压|欺辱|羞辱|霸凌|欺凌|造谣|污蔑|诬陷|构陷|泼脏水|人身攻击|网暴|人肉|开盒' +
  // 家庭/人身伤害类
  '|家暴|虐待|凌虐|伤害|自残' +
  // 制度性作恶类
  '|黑箱|暗箱|黑幕|内幕|利益输送|近亲繁殖|关系户|人情案|关系案|资金挪用|截留|摊派|强征|强拆' +
  '|违规收集|过度收集|一刀切|形式主义|官僚主义|弄虚作假|官官相护|包庇|纵容|捂盖子|压热搜|删评|控评|带节奏|操纵舆论|封口|灭口|打击报复|报复|陷害|整人|立威|杀鸡儆猴' +
  // 政体类（用作被洗白对象）
  '|专制|独裁|极权|威权|寡头',
  'i'
);

// 英文：被洗白的有害行为名词。
const HARMFUL_ACT_EN = new RegExp(
  "\\b(?:surveillance|monitoring|spying|eavesdropping|tracking|stalking|censorship|deplatforming|shadowban(?:ning)?|blacklist(?:ing)?|purge|crackdown|layoffs?|redundanc(?:y|ies)|firing|dismissal|punishment|penalt(?:y|ies)|corporal\\s+punishment|deception|lying|fraud|falsification|forgery|plagiarism|cheating|violence|assault|beating|detention|imprisonment|coercion|manipulation|exploitation|discrimination|harassment|bullying|abuse|torture|blackmail|intimidation|propaganda|disinformation|defamation|smear\\s+campaign|oppression|suppression|silencing|bribery|corruption|embezzlement|nepotism|money\\s+laundering|pay\\s+cut|salary\\s+cut|wage\\s+theft|forced\\s+overtime|unpaid\\s+overtime|lock-?in|gaslighting|scare\\s+tactics|threats?|coercive\\s+control)\\b",
  'i'
);

// 英文：被洗白的有害行为动词（"we do not spy on you" 的 spy 形态）。
const HARMFUL_ACT_EN_V = new RegExp(
  "\\b(?:spy|spies|surveil(?:s|led|ling)?|censor(?:s|ed|ing)?|eavesdrop(?:s|ped|ping)?|stalk(?:s|ed|ing)?|blackmail(?:s|ed|ing)?|coerce[ds]?|coercing|manipulate[ds]?|manipulating|exploit(?:s|ed|ing)?|harass(?:es|ed|ing)?|bull(?:y|ies|ied)|intimidate[ds]?|silence[ds]?|silencing|suppress(?:es|ed|ing)?|deceive[ds]?|deceiving|defraud(?:s|ed|ing)?|bribe[ds]?|bribing|embezzle[ds]?|discriminate[ds]?|persecute[ds]?|imprison(?:s|ed|ing)?|detain(?:s|ed|ing)?|assault(?:s|ed|ing)?|beat(?:s|ing)?|torture[ds]?|torturing|gaslight(?:s|ed|ing)?|scapegoat(?:s|ed|ing)?|crack\\s+down|clamp\\s+down|shut\\s+down|silence[ds]?)\\b",
  'i'
);

// ─── 柔性标签表（中性改名动词的替代项必须命中）──────────────────────
// 第三重精度锚：公司把裁员称为**优化**是洗白，学者把剥削称为**权力
// 关系**不是。
const SOFT_LABEL_ZH = new RegExp(
  '关心|关怀|呵护|爱护|保护|保障|安全|为你好|为你着想|成长|锻炼|考验|历练|培养|栽培|优化|调整|升级|转型|毕业|输送|筛选|培训|辅导|管理|规范|秩序|纪律|团结|和谐|稳定|效率|绩效|治理|核查|核实|复核|提质|增效|赋能|共创|共建|共享|沟通|交流|提醒|提示|督促|帮助|协助|支持|陪伴|守护|负责|担当|爱心|善意|温柔|人性化|科学|合理|正常|正当|合规|惯例|文化|价值观|愿景|使命|梦想|情怀|格局|眼界|眼光|远见|布局|战略|统筹|兼顾|平衡|过渡|缓冲|软着陆|换血|重组|改制|改革|创新|探索|尝试|试错|迭代|版本|阵痛|代价|奉献|付出|投入|热爱|忠诚|信仰|信念|初心|激励|鼓励|肯定|认可|赞扬|表彰|福利|待遇|保障机制|长效机制|闭环|抓手|颗粒度|对齐|拉通|复盘|沉淀|赋能|组合拳|新常态|新阶段|新时代|2\\.0',
  'i'
);
const SOFT_LABEL_EN = new RegExp(
  "\\b(?:care|caring|safety|security|protection|growth|development|optimization|optimisation|adjustment|transition|restructuring|rightsizing|right[-\\s]sizing|training|discipline|education|guidance|support|assistance|help|wellness|well[-\\s]being|engagement|moderation|governance|compliance|efficiency|synergy|alignment|excellence|opportunity|voluntary|volunteer|consent|community|family|love|kindness|fairness|justice|transparency|accountability|sustainability|innovation|transformation|moderni[sz]ation|upgrade|best\\s+practice|standard\\s+practice|next\\s+generation|onboarding|upskilling|reskilling|rebalancing|realignment|talent\\s+placement|social\\s+placement)\\b",
  'i'
);

// ─── 腿②a ROUTE A 否定替换式（中文）─────────────────────────────────
// 结构：否定词 + 关系动词 + [窗口] + 有害词 + [窗口] + 分隔/替代引导。
// 尾段（替代项）另做方向收口：不得再含有害词（升级定性不判）。
const NEG_FRAME_ZH = '(?:不|并非|绝不是|根本不是|不算|谈不上|算不上|岂是|哪里是|怎会是|何尝是|不会是|不见得是|不能|不可|不应|不得|岂能|哪能|哪里算|怎么能说是)';
const REL_VERB_ZH = '(?:是|叫|叫做|称为|算|算作|算成|归于|属于|意味着|等于|等同于|算是|称之为)';
// 强分隔 = 明确引导「替代项」（而是/就是/只是/不过是…）；弱分隔 = 纯标点。
// 无关系动词的裸否定形（「并非偷窃，只是暂时借用」）必须配强分隔，
// 否则「不可歧视，人人平等」这类正当呼吁会被误判。
const SEP_ZH_PUNCT = '，|,|、|；|;';
const SEP_ZH_STRONG = '而是|就是|应叫|该叫|应该叫|不过是|只不过是|充其量是|说白了是|说穿了是|实质是|实质上是|其实是|实际上是|不过是个|只是个|只能算|仅仅是个|只是|仅仅是|只能说|充其量|说到底';
const SEP_ZH = '(?:' + SEP_ZH_PUNCT + '|' + SEP_ZH_STRONG + ')';

// ─── 腿②a ROUTE A 否定替换式（英文）─────────────────────────────────
// 四个子形：主语+be not X / 裸 not X / do not X; / rather than X。
const ROUTE_A_EN = new RegExp(
  // a1 主语 + be + not + (a/an/the) + X + 分隔/对比
  "\\b(?:this|that|it|the\\s+policy|the\\s+measure|the\\s+move|the\\s+plan|what\\s+we'?re\\s+doing|our\\s+approach|the\\s+practice|the\\s+program(?:me)?)\\s+(?:is|are|was|were)\\s+(?:not|n'?t|never)\\s+(?:a\\s+|an\\s+|the\\s+|any\\s+|mere\\s+|just\\s+)?(?:HARMFUL)\\b[^.]{0,4}(?:[,;:]|\\b(?:but|rather|instead|it'?s|merely|just|only|simply)\\b)" +
  // a2 裸 not X（Not a layoff, a restructuring.）
  "|\\b(?:not|isn'?t|aren'?t|wasn'?t|weren'?t|don'?t|doesn'?t|didn'?t|cannot|can'?t|wouldn'?t|shouldn'?t)\\s+(?:a\\s+|an\\s+|the\\s+|any\\s+|mere\\s+)?(?:HARMFUL)\\b[^.]{0,4}(?:[,;:]|\\b(?:but|rather|instead|it'?s|merely|just|only|simply)\\b)" +
  // a3 do/does/did not + 有害动词 + 分隔（必须有替代子句，排除 we do not discriminate 这类单纯否定）
  "|\\b(?:do|does|did)\\s*(?:not|n'?t)\\s+(?:HARMFUL_V)\\b[^.]{0,30}[,;:]" +
  // a4 rather than / instead of / in place of + X
  "|\\b(?:rather\\s+than|instead\\s+of|in\\s+place\\s+of|as\\s+opposed\\s+to)\\s+(?:a\\s+|an\\s+|the\\s+|any\\s+|mere\\s+)?(?:HARMFUL)\\b",
  'i'
);

// ─── 腿②b ROUTE B 转称式：有害词前置 + 改名动词 ─────────────────────
// 中文：把X说成Y / X说成Y / 把X包装成Y / 把X美化为Y（伪装类动词，
// 不要求柔性标签）；把X称为Y / 把X叫做Y（中性动词，要求柔性标签）。
const RENAME_VERB_ZH_DISGUISE = '(?:说成|说成了|说成是|叫作是|叫做是|美化为|美化成为|包装成|包装为|包装成了|乔装成|乔装为|伪装成|伪装为|洗白成|洗白为|粉饰成|粉饰为|描绘成|描绘为|修饰成|改称为|改名为|易名为|美其名曰为|美其名曰|摇身一变(?:成为|为)|包装成|定性成)';
const RENAME_VERB_ZH_NEUTRAL = '(?:称为|叫做|称之为|叫作|叫作是|叫做是|叫|定性为|命名为|定位为|解读为|定义成|说成)';

// 英文：X was rebranded/dressed up/sold as Y（伪装类）；X was called/termed
// Y（中性类，要求柔性标签）。
const RENAME_VERB_EN_DISGUISE = "(?:rebranded|reframed|repackaged|relabel(?:led|ed)?|repainted|whitewashed|laundered|spun|soft[-\\s]pedal(?:led)?|dressed\\s+up|passed\\s+off|masquerad(?:ed|ing)|disguised|camouflag(?:ed|es)|sold|marketed|presented|portrayed|euphemistically\\s+called|politely\\s+called|nicely\\s+called|officially\\s+called|softly\\s+called)";
const RENAME_VERB_EN_NEUTRAL = "(?:called|termed|dubbed|described|renamed|rechristened)";

// ─── 豁免一：法律定性 / 升级定性语境 ────────────────────────────────
// 把话说得更重（不构成犯罪而是违法 / 正当防卫 / self-defence）不是洗白。
const LEGAL_EXEMPT = new RegExp(
  '不构成|构成(?:犯罪|违法|侵权|要件)|治安管理处罚|刑事(?:拘留|立案|责任)|民事(?:责任|赔偿)|公诉|判决|裁定|法院(?:认定|认为|判决|审理|查明)|涉嫌|触犯(?:刑法|法律|规章)|犯罪(?:嫌疑人|事实|所得)|证据(?:不足|确实|充分)|不起诉|宣判|侦查机关|检察机关|行政处罚|正当防卫|自卫|自我防护' +
  "|\\bself[- ]defen[cs]e\\b|\\blawful(?:ly)?\\b|\\blegitimate\\s+(?:right|purpose|business|defen[cs]e)\\b|\\bnot\\s+illegal\\b",
  'i'
);

// ─── 豁免二：元话语概念评析（这套话术本身是被分析对象）──────────────
const META_EXEMPT = new RegExp(
  '语义洗白|委婉|讳饰|更名术|话术包装|修辞术|春秋笔法|名称游戏|换个名字|遮羞布' +
  "|\\bdoublespeak\\b|\\beuphemis(?:m|tic)\\b|\\borwellian\\b",
  'i'
);

/**
 * 腿②a 中文判定：否定替换式 + 方向收口（尾段不得再含有害词）。
 * 两条子形：带关系动词（不是X，是Y）可用任意分隔；裸否定形
 * （并非X，只是Y）必须配强分隔（排除「不可歧视，人人平等」）。
 */
function matchRouteAZh(text, inject) {
  const R = inject || {};
  const harmful = R.HARMFUL_ACT_ZH || HARMFUL_ACT_ZH;
  const win = '[^。！？；;]{0,8}';
  const harmSrc = '(?:' + harmful.source + ')';
  const reWithVerb = new RegExp(
    NEG_FRAME_ZH + REL_VERB_ZH + '(?:什么|所谓的)?' + win + harmSrc + win + SEP_ZH, 'i');
  const reNoVerb = new RegExp(
    NEG_FRAME_ZH + '(?:什么|所谓的)?' + win + harmSrc + win + SEP_ZH_STRONG, 'i');
  const m = reWithVerb.exec(text) || reNoVerb.exec(text);
  if (!m) return false;
  const tail = text.slice(m.index + m[0].length, m.index + m[0].length + 36);
  return !harmful.test(tail);
}

/**
 * 腿②a 英文判定：四个子形任中 + 方向收口。
 */
function matchRouteAEn(text, inject) {
  const R = inject || {};
  const harmful = R.HARMFUL_ACT_EN || HARMFUL_ACT_EN;
  const harmfulV = R.HARMFUL_ACT_EN_V || HARMFUL_ACT_EN_V;
  const re = new RegExp(
    ROUTE_A_EN.source.replace(/HARMFUL_V/g, harmfulV.source).replace(/HARMFUL/g, harmful.source),
    'i'
  );
  const m = re.exec(text);
  if (!m) return false;
  const tail = text.slice(m.index + m[0].length, m.index + m[0].length + 40);
  return !harmful.test(tail) && !harmfulV.test(tail);
}

/**
 * 腿②b 中文判定：转称式。有害词必须前置（是被改名的对象）。
 * 伪装类动词单腿即判；中性动词需尾段命中柔性标签。
 */
function matchRouteBZh(text, inject) {
  const R = inject || {};
  const harmful = R.HARMFUL_ACT_ZH || HARMFUL_ACT_ZH;
  const soft = R.SOFT_LABEL_ZH || SOFT_LABEL_ZH;
  const window = '[^。！？；;]{0,8}';
  // 伪装类
  const reDis = new RegExp('(?:把|将|给)?' + window + '(?:' + harmful.source + ')' + window + RENAME_VERB_ZH_DISGUISE, 'i');
  const mDis = reDis.exec(text);
  if (mDis) {
    const tail = text.slice(mDis.index + mDis[0].length, mDis.index + mDis[0].length + 36);
    if (!harmful.test(tail)) return true;
  }
  // 中性类（需柔性标签）——正则不含尾段，尾段从动词后直接取
  const reNeu = new RegExp('(?:把|将|给)?' + window + '(?:' + harmful.source + ')' + window + RENAME_VERB_ZH_NEUTRAL, 'i');
  const mNeu = reNeu.exec(text);
  if (mNeu) {
    const tail = text.slice(mNeu.index + mNeu[0].length, mNeu.index + mNeu[0].length + 24);
    if (soft.test(tail) && !harmful.test(tail)) return true;
  }
  return false;
}

/**
 * 腿②b 英文判定：转称式。有害词前置 + 伪装类/中性类改名动词；
 * 另收 SVO 形（calls the layoffs "optimization"）——动词在前、有害
 * 行为作宾语、柔性标签作补语。
 */
function matchRouteBEn(text, inject) {
  const R = inject || {};
  const harmful = R.HARMFUL_ACT_EN || HARMFUL_ACT_EN;
  const harmfulV = R.HARMFUL_ACT_EN_V || HARMFUL_ACT_EN_V;
  const soft = R.SOFT_LABEL_EN || SOFT_LABEL_EN;
  const harmSrc = '(?:' + harmful.source + '|' + harmfulV.source + ')';
  const window = "[^.]{0,10}";
  const reDis = new RegExp(window + harmSrc + window + '(?:was|were|is|are|been|be)?\\s*(?:being\\s+)?' + RENAME_VERB_EN_DISGUISE, 'i');
  const mDis = reDis.exec(text);
  if (mDis) {
    const tail = text.slice(mDis.index + mDis[0].length, mDis.index + mDis[0].length + 40);
    if (!harmful.test(tail) && !harmfulV.test(tail)) return true;
  }
  const reNeu = new RegExp(window + harmSrc + window + '(?:was|were|is|are|been|be)?\\s*(?:being\\s+)?' + RENAME_VERB_EN_NEUTRAL, 'i');
  const mNeu = reNeu.exec(text);
  if (mNeu) {
    const tail = text.slice(mNeu.index + mNeu[0].length, mNeu.index + mNeu[0].length + 24);
    if (soft.test(tail) && !harmful.test(tail) && !harmfulV.test(tail)) return true;
  }
  // SVO 形：动词 + (the/a/its…) + 有害行为 + 柔性标签（calls the layoffs "optimization"）
  const reSvo = new RegExp(
    "\\b(?:calls?|called|termed?|dubbed|described?|labeled|labelled|renamed|rechristened|branded|presented|portrayed|marketed|spun|billed)\\s+(?:the\\s+|a\\s+|an\\s+|its\\s+|their\\s+|our\\s+|this\\s+|that\\s+|these\\s+|those\\s+)?" + harmSrc + "[^.]{0,16}" + soft.source,
    'i'
  );
  if (reSvo.test(text)) return true;
  return false;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkDoublespeak(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const HARMFUL_ACT_ZH_ = R.HARMFUL_ACT_ZH || HARMFUL_ACT_ZH;
  const HARMFUL_ACT_EN_ = R.HARMFUL_ACT_EN || HARMFUL_ACT_EN;
  const HARMFUL_ACT_EN_V_ = R.HARMFUL_ACT_EN_V || HARMFUL_ACT_EN_V;
  const LEGAL_EXEMPT_ = R.LEGAL_EXEMPT || LEGAL_EXEMPT;
  const META_EXEMPT_ = R.META_EXEMPT || META_EXEMPT;

  // 评析这套话术 / 概念分析 → 不是运用它
  if (META_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 法律定性 / 升级定性 / 正当防卫语境 → 不是洗白
  if (LEGAL_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  // 腿① 有害行为名词/动词族
  const harmZh = HARMFUL_ACT_ZH_.test(text);
  const harmEn = HARMFUL_ACT_EN_.test(text) || HARMFUL_ACT_EN_V_.test(text);
  if (!harmZh && !harmEn) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  // 腿②a 否定替换式（含方向收口）
  const aZh = matchRouteAZh(text, R);
  const aEn = matchRouteAEn(text, R);
  // 腿②b 转称式（有害词前置）
  const bZh = matchRouteBZh(text, R);
  const bEn = matchRouteBEn(text, R);

  if (aZh || aEn || bZh || bEn) {
    const route = (aZh || aEn) ? 'neg-substitution' : 'renaming';
    const isEn = (!aZh && !bZh) || (aEn && !aZh) || (bEn && !bZh);
    return {
      hit: true,
      score: 0.5,
      count: 1,
      detail: isEn
        ? 'doublespeak×harmful act×relabeling(' + route + ',en)'
        : '语义洗白×有害行为×重新命名(' + route + ',zh)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkDoublespeak,
  __internals: () => ({
    HARMFUL_ACT_ZH, HARMFUL_ACT_EN, HARMFUL_ACT_EN_V,
    NEG_FRAME_ZH, REL_VERB_ZH, SEP_ZH,
    ROUTE_A_EN,
    RENAME_VERB_ZH_DISGUISE, RENAME_VERB_ZH_NEUTRAL,
    RENAME_VERB_EN_DISGUISE, RENAME_VERB_EN_NEUTRAL,
    SOFT_LABEL_ZH, SOFT_LABEL_EN,
    LEGAL_EXEMPT, META_EXEMPT,
    matchRouteAZh, matchRouteAEn, matchRouteBZh, matchRouteBEn,
  }),
};
