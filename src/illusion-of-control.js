/**
 * src/illusion-of-control.js — 「控制幻觉」检测器
 * （ provisional 第 227 个判别维度，r239 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r239-dimension-agent4.md
 * §五。编号 provisional 的原因同 r218-r238：远端 v6.8.145 已接线 214
 * 维，另有 zero_sum_fallacy(r218)/budget_value_conflation(r219)/
 * average_marginal_conflation(r220)/conditional_transposition(r228)/
 * anonymous_source(r229)/broken_window(r230)/automation_bias(r231)/
 * p_hacking(r232)/appeal_to_future(r233)/effort_justification(r234)/
 * mental_accounting(r235)/perverse_incentive(r236)/winners_curse(r237)/
 * tragedy_of_commons(r238) 十五个已起草未接线维度占号，最终编号由
 * 1 号按接线顺序在 VERIFY_DIMS 登记序重排）
 *
 * [r239 立项] 零命中探针 coordination/agent4/probes/r239-zerohit-probe.js
 * + r239-probe-round2-illusion-of-control.js（v6.8.145 gate() 全量
 * findings 实测）：认领方向五候选族竞品——A 检察官谬误攻击 4/6 穿透
 * （余 2 条已被 false_precision/perfect_error 泛维度代拦）且
 * src/conditional-transposition.js（r228 草稿）已占同族、B 多重比较
 * 攻击 4/6 穿透且 src/p-hacking.js（r232 草稿）已占同族（B1 被已接线
 * 的 researcher_degrees_of_freedom 代拦）、C 控制幻觉攻击 13/13 完全
 * 穿透且疑难良性 15/15 零纠缠、D 样本量不敏感 4/6 穿透（余 2 条被
 * fallacies/perfect_error 代拦）、E 规划谬误 5/6 穿透但疑难良性 2/4
 * 被 perfect_error 误伤（r234 同病）。C 以「攻击全穿透 + 良性零纠缠」
 * 双干净胜出；余 3 条被 wishful_thinking/survivorship_bias/perfect_error
 * 泛维度偶发代拦的变体（心诚则灵/吉利数字/wins more often）不构成
 * 族性占据——无任何维度以「随机事件 × 主观控制行为 × 影响断言」三腿
 * 语义承重（r237 赢家诅咒 7/10 胜出同型先例）。
 *
 * 外部来源：空返，按既有形态自建。r239 海外扫描（原始证据
 * coordination/agent4/scout/*20261107-0256{10,22}*）：arXiv 两次
 * OR 噪声查询均 parse-fail、GitHub 0 命中、Semantic Scholar 429
 * 限流空返。判据为心虫自有纯规则实现（家族定义取自认知心理学的
 * 标准描述：illusion of control / 控制幻觉——Langer 1975：人们会
 * 系统性地高估自己对概率性事件的影响力，把技巧、投入、仪式、
 * 竞争等本不适用的控制线索误用到纯随机事件上）。
 *
 * 辨别的族：控制幻觉（illusion of control）——**纯随机事件锚点**
 * （彩票/摇号/抽奖/掷骰子/开箱/中奖；EN lottery / raffle / dice /
 * quick pick / random draw）× **主观控制行为**（自己选号/机选对比/
 * 默念/祈祷/上香/拜一拜/摸久了凭手感/用力掷/哈气/擦干净双手捧/
 * 仪式/幸运袜/幸运色/吉利数字/意念/心诚；EN pick your own numbers /
 * visualize / intention / pray / ritual / lucky socks / rubbing the
 * dice / deliberated before choosing）× **影响断言**（中奖率比机选
 * 高/出大的机会更大/摸得久挑得准/更容易中/心诚则灵/意念能起作用；
 * EN gives better odds / improves your chances / raises the odds /
 * more likely to roll high / wins more often / intention matters）
 * 三腿共现：
 *   买彩票要自己选号，自己选的号码中奖率比机选高，意念是能起作用的。
 *   掷骰子的时候心里默念大点数，手上顺势用力甩，出大的机会就更大。
 *   抽奖箱里我摸了半天，凭手感挑一个，摸得久挑得准，比随手一抓机会大。
 *   Picking your own lottery numbers gives better odds than a quick pick.
 *   Praying before spinning the wheel raises the odds that the ball lands on your color.
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：控制幻觉让
 * 独立随机事件背上主观控制的记忆——选号方式、投入时长、仪式
 * 虔诚度都被当作能改变中奖概率的因素。据此做出的决策（自选号
 * 比机选强/多摸一会儿挑得准/拜一拜更灵）会把资源持续投向无效
 * 行为，且当事人因「投入过」而更难纠正。与正当表述有明确界线：
 * 技能域（三分球命中率靠训练/面试通过率看准备——技能确实影响
 * 结果）、仪式无断言（图个吉利/看运气了——只描述行为不下影响
 * 结论）、否定纠偏（选号方式不影响结果/概率完全相同）、概念
 * 讨论（控制幻觉/illusion of control 教学定义句）——均豁免。
 *
 * 与既有维度的边界（r239 归因）：
 *   · hot_hand（第 153 维）管**连胜势头→下一局胜率提升**的延续
 *     性预测（手气正旺/连赢五把/下一把肯定还中）；本族无连胜
 *     腿，承重的是主观控制行为×随机事件×影响断言三腿结构。
 *   · gamblers_fallacy（第 148 维）管**连败之后该反转**（输了八把
 *     下一把该赢了）；本族不断言序列反转，判的是控制线索误用。
 *   · wishful_thinking（第 147 维）管**坚信→必将**的纯愿望断言
 *     （天天想着中大奖早晚会中）；本族要求具体控制行为腿在场
 *     （选号/默念/上香/摸选），「想着」不构成控制行为。
 *   · confidence 管**语气过度自信**（毫无疑问肯定能成）；本族
 *     有明确的随机事件锚点与控制行为腿，不是语气问题。
 *   · clustering_illusion（第 171 维）管**随机聚集被当显著规律**；
 *     本族不涉及聚集归因，判控制线索对概率的误用。
 *   · p_hacking（r232 草稿）管**多重检验不校正**的数据挖掘；本族
 *     是认知行为层面的概率误用，与统计检验无关。
 *
 * 判据（三腿共现，缺一不判）：
 *   ① 腿① CHANCE 纯随机事件锚点——彩票/中奖/中签/摇号/抽奖/
 *     抽签/掷骰子/骰子/抛硬币/硬币/轮盘/赌大小/老虎机/开箱/抽卡/
 *     暴击/掉落/开奖/盲盒/彩球/机选/机器选号/随机数/随机事件/
 *     赌场/博彩；弱锚点（概率/几率/机率/运气，须与②③共现）；
 *     EN lottery / raffle / dice / coin flip / roulette / slot
 *     machine / spinning the wheel / gacha / loot box / random
 *     draw / quick pick / odds；
 *   ② 腿② RITUAL 主观控制行为——自己选号/自选/机选对比；默念/
 *     许愿/祈福/拜拜/拜一拜/上香/烧香/求签/祈祷；摸了半天/摸得久/
 *     凭手感/挑了又挑；用力掷/用力甩/哈气/擦干净/双手捧着抽/
 *     仪式；幸运袜/幸运色/吉利数字/护身符/红绳/黄道吉日；意念/
 *     心诚/虔诚；EN pick your own / chosen ticket / quick pick /
 *     visualize / intention / pray / ritual / lucky socks /
 *     rubbing the dice / deliberated before choosing；
 *   ③ 腿③ INFLUENCE 影响断言——(概率|几率|机率|中奖率|机会|
 *     希望|运气)(会|就|更)?(高|大|强|好)；比…(更)?(高|大|好)；
 *     更容易中/中的希望大；(提高|提升|增加|拉高|改善)×(中奖率|
 *     概率|几率|机会)；心诚则灵；摸得久/挑得准；(影响|左右|决定)
 *     结果；起作用/有用/有效/灵验；EN improves your odds /
 *     better odds / raises the odds / improves your chances /
 *     more likely to win/roll / wins more often / matters；
 *   腿①×腿② 与 腿②×腿③ 分别落在近距离窗（ZH 60 字 / EN 180
 *   字符，主观控制行为是桥：把随机事件和影响断言连起来）；
 *   三腿命中均查否定前缀（选号方式不影响结果/概率完全相同/并不
 *   会更高；EN does not change the odds / doesn't matter），
 *   被否定不计。
 *
 * 为什么取 VERIFY 级：单句可能只是在转述一个已发生的迷信决策
 * 案例而未展开概率论证（这类由缺腿/豁免覆盖），也可能是说话者
 * 尚未意识到随机事件的独立性。verify 的语义是「这段话把主观
 * 控制行为当作能改变随机结果的因素，先核实事件是否真为纯随机、
 * 控制线索是否真的进入概率结构、样本是否支持其影响断言，再
 * 决定是否采信其结论」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 技能域（三分球命中率靠训练/面试通过率看准备/模拟面练十次
 *     比裸考强——技能确实改变结果概率，且无纯随机事件锚点）；
 *   · 仪式无断言（图个吉利/看运气了/喜欢守一组号——只描述行为
 *     或偏好，不下影响结论，缺腿③）；
 *   · 否定纠偏（选号方式不影响结果/中奖概率完全相同/跟怎么抛
 *     无关——拒绝该推断本身是正确判别）；
 *   · 概念讨论（控制幻觉/illusion of control/Langer——讨论本族
 *     名称的教学/定义句）；
 *   · 缺任一跳线（只有随机事件、只有控制行为、只有影响断言）——
 *     三腿判据天然不命中；
 *   · hot_hand/gamblers_fallacy/wishful_thinking 领地（连胜
 *     延续/连败反转/纯愿望断言）——无主观控制行为×随机事件×
 *     影响断言三腿共现。
 */
'use strict';

// ─── 腿① 纯随机事件锚点（中文）────────────────────────────────
const A_ZH = [
  // ①-a 纯随机装置/事件名词
  /(?:彩票|彩票号|中奖|中大奖|中签|摇号|抽奖|抽签|掷骰子|抛骰子|掷色子|骰子|抛硬币|掷硬币|硬币|轮盘|赌大小|老虎机|吃角子老虎机|开箱|抽卡|暴击|掉落|开奖|盲盒|彩球|签池|抽奖箱|摇号池|机选|机器选号|随机数|随机事件|随机抽取|赌场|赌博|博彩|六合彩|押大押小|开大小)/,
  // ①-b 弱锚点（概率/运气类——须与②③共现才承重）
  /(?:概率|几率|机率|运气)/,
];

// ─── 腿① 纯随机事件锚点（英文）────────────────────────────────
const A_EN = [
  // ①-a 裸随机装置词
  /\b(?:lottery|lotto|raffle|raffles|sweepstakes?|jackpot)\b/i,
  /\b(?:dice|die)\b/i,
  /\b(?:coin\s+flip|flip(?:ping)?\s+a\s+coin|heads\s+or\s+tails)\b/i,
  /\b(?:roulette|slot\s+machines?|one[- ]armed\s+bandit|wheel\s+of\s+fortune|spinning\s+the\s+wheel|spin\s+the\s+wheel)\b/i,
  /\b(?:bingo|keno|gacha|loot\s+box(?:es)?|card\s+packs?|random\s+draw|randomly\s+generated|game\s+of\s+chance|pure\s+chance|blind\s+draw)\b/i,
  // r331 补腿：weekly/monthly/final draw（「in the weekly draw」原穿透：
  // A_EN 只有 random/blind draw 组合形，周期性抽奖常用 bare draw 不收）
  /\b(?:weekly|monthly|daily|annual|next|last|final|big)\s+draw\b/i,
  /\b(?:quick[- ]?pick|machine[- ]?pick|computer[- ]generated)\b/i,
  /\b(?:casino|gambling|betting\s+slip)\b/i,
  // ①-b 弱锚点
  /\b(?:odds|probability|chance|likelihood)\b/i,
];

// ─── 腿② 主观控制行为（中文）──────────────────────────────────
const B_ZH = [
  // ②-a 自选/挑选控制
  /(?:自己|自行|亲自|本人)(?:来)?(?:选|挑|选号|挑选|编号|摇|抽|抓)/,
  // ②-a2 r331 补腿：主观挑选形（挑一个有眼缘的/挑个顺眼的——「抽奖时我
  // 总要挑一个看起来有眼缘的球」原穿透：②-a 要求自己/亲自+动词，②-c 只
  // 收固定时长形，客观挑选动作这一族整族缺失）
  /挑(?:了)?(?:一个|一张|一只|一条|一颗|个|张|只|条|颗)?[^。，！？；\n]{0,8}?(?:眼缘|顺眼|合眼缘|舒服|喜欢|中意|看中|有缘)/,
  /(?:自选|手选|自挑|自己选的号|自己挑的)/,
  // ②-b 意念/仪式族（含「上了香/拜了拜」式完成态）
  /(?:默念|默祷|心里(?:默|想|念)|念叨|许愿|祈福|祝福自己|拜拜|拜一拜|拜佛|拜神|上香|烧香|求签|祈祷|祷告|作法|念咒)/,
  /(?:上|烧)(?:了|过|完)(?:香|高香|柱香)/,
  /拜(?:了|过|完)(?:拜|佛|神|菩萨)/,
  // ②-c 时长/手感投入
  /(?:摸了|摸了好久|摸了半天|摸了很久|摸得久|挑了好久|挑了又挑|反复挑|精挑细选|仔细挑|凭手感|靠手感|手感挑|斟酌|拿捏半天)/,
  // ②-d 物理动作族
  /(?:用力(?:掷|甩|抛|扔|丢)|顺势(?:一)?甩|哈气|吹一口(?:气)?|擦(?:了)?干净|擦干净|双手捧|捧着(?:抽|摇|拿|摸)|沐浴更衣|斋戒|拜了又拜)/,
  // ②-e2 r332 补腿：中英混排文本的拉丁幸运物形（「去 lottery 抽奖前他总要
  // 先 lucky charm 摸一遍」原穿透：混排句中腿②只有中文幸运族可匹配，
  // lucky charm / red string 等拉丁形整族缺席——EN 链的 B_EN 收得到，
  // 但该句腿③「rate 会更高」是中文，EN 链配对失败；同族变体矩阵教训）
  /(?:lucky\s+charm|luck\s+charm|good[- ]?luck\s+charm|lucky\s+coin|lucky\s+penny|lucky\s+socks?|red\s+string|red\s+bracelet|four[- ]leaf\s+clover|horseshoe|rabbit'?s\s+foot)/i,
  // ②-e 幸运物/吉数族
  /(?:幸运袜|幸运色|幸运物|幸运币|幸运数字|幸运号|吉利数字|吉利号|招财|辟邪|护身符|红绳|玉佩|风水|吉日|良辰吉日|黄道吉日|开过光)/,
  // ②-f 意念/虔诚族
  /(?:意念|信念力|精神力|心诚|虔诚|心越诚|信仰的?力量|意念力)/,
  // ②-g 仪式名词
  /(?:仪式|典礼感|讲究仪式)/,
];

// ─── 腿② 主观控制行为（英文）──────────────────────────────────
const B_EN = [
  // ②-a 自选族
  /\b(?:pick(?:s|ed|ing)?|chose|choose|choosing|select(?:s|ed|ing)?)\s+(?:your|his|her|their|my|our)\s+own\b/i,
  // ②-a2 r331 补腿：choose/pick the numbers / my own combination（自选号
  // 的裸宾形——「Only after I choose the numbers myself」原穿透：②-a 要求
  // choose 后紧跟 own，"choose the numbers" 不匹配）
  /\b(?:pick(?:s|ed|ing)?|chose|choose|choosing|select(?:s|ed|ing)?)\s+(?:the\s+|a\s+)?(?:my\s+)?(?:numbers?|tickets?|combinations?|cards?)\b/i,
  /\b(?:own|chosen|hand[- ]?picked|lucky)\s+(?:numbers?|tickets?|combinations?)\b/i,
  // ②-b2 r331 补腿：chant/recite/whisper the number（默念族——「If I
  // chant the winning number three times」原穿透：意念族只有
  // visualiz/imagin/focus，缺 chant 这一同族动作）
  /\b(?:chant(?:s|ed|ing)?|recit\w+|whisper(?:s|ed|ing)?|murmur\w*|mut(?:ter|ters|tered|tering))\s+(?:the\s+|a\s+|my\s+|some\s+)?(?:winning\s+|lucky\s+)?(?:numbers?|numbers?|combinations?|words?)\b/i,
  // ②-b3 r331 补腿：lucky + 颜色/材质修饰（lucky red shirt——原表要求
  // lucky 紧接物件，中间有颜色/材质修饰即漏；同族变体）
  /\blucky\s+(?:\w+\s+){0,2}?(?:socks?|coin|penny|charm|hat|shirt|underwear|numbers?|days?|pants?|jacket|gloves?|scarf|bracelet|ring|stone)\b/i,
  // ②-b 意念/仪式族
  /\b(?:visualiz\w+|imagin\w+|mental(?:ly)?\s+(?:focus|concentrat\w+)|concentrat\w+|focus(?:ing)?\s+(?:your\s+)?mind|intention|intent\w*|mind\s+over\s+matter|willpower|sheer\s+will)\b/i,
  /\b(?:pray\w*|prayer|prayers|bless\w*|ritual\w*|ceremon\w+|good[- ]?luck\s+charm)\b/i,
  /\b(?:lucky\s+(?:socks?|coin|penny|charm|hat|shirt|underwear|numbers?|days?))\b/i,
  // ②-c 物理动作族
  /\b(?:rub(?:bing)?\s+(?:the\s+)?(?:dice|die|coin|ticket|belly))\b/i,
  /\b(?:blow(?:ing)?\s+on\s+the\s+(?:dice|die))\b/i,
  /\b(?:throw(?:ing)?\s+(?:the\s+)?(?:dice|die)\s+hard|hard\s+throw)\b/i,
  /\b(?:touch(?:ing)?\s+wood|knock(?:ing)?\s+on\s+wood|cross(?:ing)?\s+(?:your\s+)?fingers)\b/i,
  // ②-d 时长投入族
  /\b(?:deliberat\w+|careful(?:ly)?\s+(?:pick|choos|select)|took\s+(?:his|her|their)\s+time|lingered|hovered|reached\s+(?:in|into)\s+the)\b/i,
];

// ─── 腿③ 影响断言（中文）──────────────────────────────────────
const C_ZH = [
  // ③-a 概率/机会类名词 × 提升向形容词（概率会高一些/机会就更大/运气更好）
  // r331：补胜率/命中率/赔率/赢面/手气 同族裸名词（原表只有中奖率/概率系——
  // 「押大的胜率都会提升」整句因腿③名词表缺「胜率」而漏判，161 轮裸名词教训）。
  /(?:中奖率|中奖概率|中签率|几率|机率|概率|可能性|机会|希望|运气|胜率|命中率|赔率|赢面|手气|运势|rate)[^。，！？；\n]{0,6}(?:会|就|也|更|往往|通常|自然|都)?(?:高|大|强|好)(?:一些|一点|不少|得多|很多)?/,
  // ③-b 比较形（比机选高/比随手一抓机会大）
  /(?:比|比起|相较于)[^。，！？；\n]{0,12}(?:更)?(?:高|大|强|好|多)/,
  // ③-c 中的希望形（更容易中/中的希望大/中签的希望大了不少）
  /更容易(?:中|中奖|中大奖|抽中|赢|获胜|拿到)/,
  /(?:中|中奖|中签|中大奖|抽中)的(?:希望|概率|几率|机会)了?(?:更)?(?:大|高|多)/,
  // ③-d 提升动词族（提高中奖率/增加中奖机会）
  /(?:提高|提升|增加|拉高|抬高|改善|增大|放大)(?:了)?(?:中奖率|中奖概率|几率|机率|概率|胜率|可能性|机会|运气)/,
  // ③-d2 反序提升族（r331：胜率都会提升/赢面会变大/手气会更旺——动词在后、
  // 名词在前的同族形，③-a 的「名词+形容词」结构收不住；补裸名词+
  // 提升动词反序匹配，同族变体矩阵实测「戴着幸运袜去赌场，押大的胜率
  // 都会提升」原穿透 gate=pass）
  /(?:中奖率|中奖概率|中签率|几率|机率|概率|可能性|胜率|命中率|赔率|赢面|手气|运势|机会)[^。，！？；\n]{0,8}(?:都会|也会|就能|就会|将|将会)?(?:提高|提升|增加|拉高|抬高|改善|增大|放大|变大|变强|变好|上涨|走高)/,
  // ③-e 虔诚-灵验族
  /(?:心诚则灵|心诚(?:者)?灵|念佛(?:者)?灵|拜了(?:就)?灵)/,
  // ③-f 挑得准族（摸得久挑得准）
  /(?:摸得|挑得|选得|抽得|抓得)(?:久|准)/,
  // ③-g 影响动词族（能影响结果/左右输赢/意念能左右掷硬币的结果）
  /(?:能|可以|能够)?(?:影响|左右|决定)(?:到)?[^。，！？；\n]{0,8}(?:结果|中奖|输赢|点数|开出|掉落|走向)/,
  // ③-h 起作用族（意念是能起作用的）
  /(?:起作用|有用|有效|管用|灵验|很灵|应验|见效)/,
];

// ─── 腿③ 影响断言（英文）──────────────────────────────────────
const C_EN = [
  // ③-a improves/raises/increases × odds/chances
  // r331 补腿：物主加 my（「raises my chances of a high number」原穿透）
  /\b(?:improves?|improved|improving|raises?|raised|raising|increases?|increased|boosts?|boosted|enhances?|enhanced)\s+(?:your|his|her|their|my|our|the)?\s*(?:odds|chances?|probability|likelihood|luck)\b/i,
  // ③-b better/higher/greater odds（含 gives better odds）
  /\b(?:better|higher|greater|improved|winning)\s+odds\b/i,
  // ③-c more likely to win/roll/draw/land
  // r331 补腿：line up / pay out / hit the jackpot 同族结果动词
  // （「the reels are more likely to line up for me」原穿透）
  /\bmore\s+likely\s+to\s+(?:win|roll|draw|get|land|hit|come\s+up|line\s+up|pay\s+out|jackpot|match|appear|trigger)\b/i,
  // ③-d wins more often（chosen ticket wins more often）
  /\b(?:wins?|won|winning)\s+more\s+(?:often|frequently|easily)\b/i,
  // ③-e helps you win / works / matters（intention matters）
  /\b(?:helps?|helped)\s+(?:you\s+)?(?:win|luck\s+out)\b/i,
  /\b(?:matters|counts|works)\b/i,
  // ③-f increases your chance of（a high number）
  // r331 补腿：my/our + chances 复数形（「raises my chances of a high
  // number」原穿透：物主表缺 my 且只有单数 chance）
  /\b(?:increase|improve|raise|boost)s?\s+(?:your|his|her|their|my|our)\s+chances?\s+of\b/i,
  // ③-g r331 同族补腿：your luck improves / the odds go up / better chance
  // of winning（反序形：名词/物主在前、提升动词在后；以及 chance of
  // winning 的比较形——EN 侧原表只有 improves X odds 前动词形）。
  // my/our 也收（r331 实测「my luck improves whenever I rub the dice」
  // 原穿透——物主表缺 my）。
  /\b(?:your|his|her|their|my|our|the)\s+(?:odds|chances?|luck|probability|likelihood)\s+(?:will\s+|would\s+|can\s+|may\s+)?(?:improves?|improved|go(?:es)?\s+up|rises?|increases?|gets?\s+better)\b/i,
  // ③-g2 r332 补腿：really/somehow/definitely 等副词插入形（「does my luck
  // really improve in the weekly draw」原穿透：③-g 要求名词后紧跟助动词+
  // 动词，副词插入即漏；同族变体矩阵教训）
  /\b(?:your|his|her|their|my|our|the)\s+(?:odds|chances?|luck|probability|likelihood)\s+(?:really|actually|somehow|definitely|certainly|genuinely|truly|simply|just)\s+(?:improves?|improved|go(?:es)?\s+up|rises?|increases?|gets?\s+better|changes?)\b/i,
  // ③-g3 r332 补腿：the odds of <名词/动名词> 的 of 插入形（「the odds of
  // hitting it will go up」原穿透：③-g 的 odds 后不接 of 短语；同族变体
  // 矩阵教训。收 odds/chance of X + 提升动词，X 取短名词短语）
  /\b(?:the|your|his|her|their|my|our)\s+(?:odds|chances?|probability|likelihood)\s+of\s+(?:\w+\s+){0,3}?(?:will\s+|would\s+|can\s+|may\s+)?(?:go(?:es)?\s+up|improves?|improved|rises?|increases?|gets?\s+better|climbs?)\b/i,
  /\b(?:better|higher|greater|improved)\s+chance\s+of\s+(?:winning|getting|rolling|drawing|hitting)\b/i,
  /\b(?:improves?|improved|boosts?|boosted|raises?|raised|increases?|increased)\s+(?:your|his|her|their)\s+(?:luck|fortunes?|winning)\b/i,
];

// ─── [r315] 体育赛事幸运仪式族（竞技/观赛迷信新措辞家族）────────────
// 零命中探针 scripts/round-315/probe-candidates.js：存量腿对
// 「幸运球衣/老位置/赛前摸队徽 × 胜率更高/左右比赛/带来好运」9/10
// 全穿透（余 1 条已被存量 ①-b×②-f×③-a 覆盖，转回归样本），良性
// 10/10 零误伤。平行常量 + concat 合并不动存量腿。
// 腿①赛事锚点（中文）——比赛/球队等概率性竞技结果
const A_ZH3 = [
  // ①-c1 赛事名词
  /(?:比赛|球赛|赛事|决赛|半决赛|联赛|赛季|世界杯|欧冠|奥运|亚运|全运)/,
  // ①-c2 参赛主体/进程
  /(?:夺冠|冠军|赢球|球队|主队|客场|主场|赛程|赛果|球员|队友|场上|赛前)/,
];

// 腿①赛事锚点（英文）
const A_EN3 = [
  /\b(?:game|games|match|matches|fixture|final|finals|tournament|league|playoffs?|world\s+cup|season|title\s+race)\b/i,
  /\b(?:team|squad|club|derby)\b/i,
];

// 腿②观赛幸运仪式/固定动作（中文）
const B_ZH3 = [
  // ②-h1 幸运球衣物件族（含幸运色/旧球衣/不离身）
  /(?:幸运球衣|幸运战袍|幸运队服|幸运T恤|幸运围巾|幸运手绳|幸运手环|幸运色|战袍|那件旧球衣|旧队服|不离身的?(?:球衣|队服))/,
  // ②-h2 仪式/固定座位族（老位置/同一个位置/每次比赛都穿）
  /(?:助威仪式|观赛仪式|看球仪式|赛前仪式|固定座位|老位置|同一个位置|同一位置|比赛日(?:固定|专属)|每次(?:比赛|球赛|决赛)[^。，！？；\n]{0,8}(?:都)?(?:穿|坐|带|戴))/,
  // ②-h3 赛前触碰队徽族
  /(?:摸(?:了|一下)?队徽|亲吻队徽|赛前摸|进场前摸)/,
];

// 腿②观赛幸运仪式/固定动作（英文）
const B_EN3 = [
  /\blucky\s+(?:jersey|shirt|socks?|scarf|hat|seat|mug|coin|pen|boxers?|underwear)\b/i,
  /\b(?:same|identical)\s+(?:lucky\s+)?(?:jersey|shirt|seat|spot|mug|routine|ritual)\b/i,
  /\b(?:game[- ]day|pre[- ]?match|pre[- ]?game)\s+(?:ritual|routine|superstition)|\bsuperstitious\s+(?:ritual|routine|habit)\b/i,
  /\b(?:touch(?:es|ed|ing)?|kiss(?:es|ed|ing)?)\s+the\s+(?:club\s+)?crest\b/i,
];

// 腿③赛事结果影响/概率断言（中文）
const C_ZH3 = [
  // ③-i1 胜率/赢面族
  /(?:胜率|赢面|夺冠概率|获胜概率|赢球的?几率)(?:会|就|更|往往|通常|自然)?(?:高|大|好)(?:一些|一点|不少|得多|很多)?/,
  // ③-i2 提升动词×胜率（提高球队的胜率）
  /(?:提高|提升|增加|拉高|抬高)(?:了)?(?:球队|主队|全队|咱们队|我队|夺冠|获胜|赢球)?的?(?:胜率|赢面|机会|概率)/,
  // ③-i3 影响动词×赛事结果（左右这场比赛）
  /(?:影响|左右|决定|带动|感染)(?:到)?[^。，！？；\n]{0,8}(?:比赛|赛果|胜负|赢球|夺冠|冠军|发挥|状态)/,
  // ③-i4 带来好运族
  /(?:带来|招来|引来|攒下|攒够)(?:了)?(?:好运|手气|运势|胜利|运气)/,
];

// 腿③赛事结果影响/概率断言（英文）
const C_EN3 = [
  /\bmore\s+likely\s+to\s+(?:win|roll|draw|get|land|hit|come\s+up|take\s+the\s+title|win\s+it\s+all)\b/i,
  /\b(?:helps?|helped)\s+(?:you\s+|them\s+|us\s+|the\s+team\s+|his\s+|her\s+|the\s+side\s+)?win\b/i,
  /\b(?:affects?|affected|influences?|influenced|sways?|decides?|decided)\s+(?:the\s+)?(?:game|match|outcome|result|final)\b/i,
  /\b(?:brings?|brought|attracts?|attracted)\s+(?:us\s+|the\s+team\s+|me\s+)?(?:good\s+)?(?:luck|fortune)\b/i,
  /\b(?:improves?|improved|raises?|raised|boosts?|boosted|increases?|increased)\s+(?:the\s+)?(?:team'?s?|our|their)\s+(?:odds|chances)\b/i,
];

// ─── [r323] 现代游戏/抽奖场域控制幻觉族（纯随机游戏新措辞家族）────────
// 零命中探针 scripts/round-323/probe-candidates.js：存量腿（经典赌博
// 选号/掷骰 + r315 体育幸运仪式）对「老虎机探节奏×按停吐分 / 抽卡开
// 箱养号垫刀玄学×提高爆率 / 盲盒隐藏款掉率」7/7 全穿透，良性零误伤。
// 平行常量 + concat 合并不动存量腿。核心判别：腿③必须含显式控制/提升
// 动词（提高/掌控/控制 + 爆率/吐分），纯动作描述（吐分前按停是常见操
// 作）不计——良性靠此与否定守卫双重拦截。
// 腿①现代纯随机游戏锚点（中文）
const A_ZH4 = [
  /(?:老虎机|吃角子|拉霸|爆分|吐分|出分|拉老虎|电子机)/,
  /(?:抽卡|开箱|爆率|出金|出货|掉率|金卡|SSR|保底|奖池|祈愿|十连|单抽)/,
  /(?:盲盒|潮玩|隐藏款|端盒)/,
];
// 腿①现代纯随机游戏锚点（英文）
const A_EN4 = [
  /\b(?:slot\s+machines?|slots?|one[- ]armed\s+bandit|fruit\s+machine|video\s+slot|payout|jackpot)\b/i,
  /\b(?:gacha|loot\s+box(?:es)?|pull\s+rate|drop\s+rate|SSR|rare\s+pull|pity\s+system|ten[- ]pull|single\s+pull|summon)\b/i,
  /\b(?:blind\s+box(?:es)?|mystery\s+box)\b/i,
];
// 腿②现代主观控制行为（中文）——探节奏/养号垫刀玄学/按停
const B_ZH4 = [
  /(?:小注试探|押注节奏|盯着滚|盯着转|盯着屏|(?:探|摸|试|找|寻)(?:到|出|清|准|透|明白)?(?:它的|一下)?(?:节奏|规律|门道))/,
  /(?:感觉要爆|要爆了|快爆了|手感来了|手感对|手感准)/,
  /(?:垫刀|垫抽|垫几[发抽]|垫上几|养号|养个号|玄学|拜一拜|拜拜|开过光)/,
  /(?:按停|抢停|提前停|及时停|刹住|见好就收)/,
];
// 腿②现代主观控制行为（英文）
const B_EN4 = [
  /\b(?:feel|feeling|read|reading|probe|testing|sense|sensing)\s+(?:the\s+)?(?:rhythm|pattern|cycle|streak|tempo|reels?)\b/i,
  /\b(?:bet\s+small|start\s+small|small\s+bets?)\b[^.]{0,40}\b(?:feel|sense|probe|watch|read)\b/i,
  /\b(?:about\s+to\s+(?:hit|pay|drop)|feels?\s+like\s+it'?s\s+about\s+to)\b/i,
  /\b(?:prim\w*|warm\w*\s+up|salt\w*|seed\w*)\s+(?:the\s+)?(?:account|pool|gacha|luck)\b/i,
  /\b(?:superstitious|ritual\s+before|lucky\s+(?:draw|pull|summon|gacha))\b/i,
  /\b(?:stop|stops|stopping|halt|brake|braking)\s+(?:it\s+)?(?:right\s+)?before\s+it\s+(?:pays|hits|lands)\b/i,
];
// 腿③现代影响断言（中文）——控制/提升动词 × 爆率/吐分；看我按停时机
const C_ZH4 = [
  /(?:提高|提升|拉升|拉高|堆高|锁定|掌控|控制|拿捏|左右|决定|影响|带动)[^。，！？；\n]{0,6}(?:爆率|出金率|出货率|掉率|中奖率|爆分|吐分|出金|开奖|大奖|结果|节奏)/,
  /(?:吐分|爆分|出金|开奖)[^。，！？；\n]{0,6}(?:前|之前)[^。，！？；\n]{0,8}(?:把它|将其|就能|可以|能够|看我|由我|我说了算)/,
  /(?:看我|由我|全凭我|我说了算|凭我)[^。，！？；\n]{0,6}(?:按停|停|刹|收手|时机|掌控|控制|拿捏)/,
  /(?:我能|我可以|我能够|我就能)[^。，！？；\n]{0,8}(?:控制|掌控|拿捏|左右|决定|影响)/,
];
// 腿③现代影响断言（英文）
const C_EN4 = [
  /\b(?:raise|raises|raised|improve|improves|improved|boost|boosts|boosted|increase|increases|control|controls|steer|steers|influence|influences)\w*\s+(?:\w+\s+){0,3}?(?:drop\s+rate|pull\s+rate|payout|jackpot|SSR|odds)\b/i,
  /\bcontrol\s+when\s+(?:it|the\s+\w+)\s+(?:pays|comes|lands|hits|drops)\b/i,
  /\bcontrol\s+(?:the\s+)?(?:payout|drop|jackpot|outcome|reels?)\b/i,
];

// ─── 双腿距离窗（腿①×腿② 与 腿②×腿③ 分别落在窗内，腿②控制行为是桥）
const PAIR_ZH = 60;
const PAIR_EN = 180;

// ─── 豁免：概念讨论（讨论本族名称的教学/定义句）────────────────
const CONCEPT_ZH = /(?:控制幻觉|掌控错觉|控制错觉|错觉效应|兰格|认知偏差(?:的)?(?:经典|实验))/;
const CONCEPT_EN = /\billusion\s+of\s+control\b|\bLanger\b|\bsuperstition\b|\bcognitive\s+bias\b/i;

// 工具 ─────────────────────────────────────────────────────────
// 全文扫描某正则族的全部命中位置（global 安全）
function allMatches(re, text) {
  const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = [];
  let m;
  while ((m = reG.exec(text)) !== null) {
    out.push({ idx: m.index, end: m.index + m[0].length, raw: m[0] });
    if (m.index === reG.lastIndex) reG.lastIndex++;
  }
  return out;
}

// 三腿命中的否定前缀检查（「选号方式不影响结果/并不会更高/不起作用」不计）。
// 窗口取匹配前 8 字符，允许否定词与被否定短语间插入少量字。
const NEG_BEFORE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|并不会|不改变|不影响|不提升|不提高|不起|不灵|并不)[^。，！？；\n]{0,5}$/;
// 紧贴否定：匹配前一字为 不/没/未/无/非（「方式不影响结果」式）。
const IMMEDIATE_NEG_ZH = /(?:不|没|未|无|非)$/;
// 匹配 span 内部的否定词（「运气并不会更好」式副词内嵌否定）。
const NEG_INSIDE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵)/;

// 英文否定（EN 无负例注入语言侧区分，统一启用）：span 内否定 +
// 匹配前 45 字符窗口内的否定（does not change the odds / doesn't matter）。
const NEG_INSIDE_EN = /\bnot\s+that\b|\bnot\s+to\s+say\b|\bhardly\b|\bbarely\b|\bfar\s+from\b|\bno\s+guarantee\b|\bnot\s+necessarily\b|\bchanges?\s+nothing\b|\bmakes?\s+no\s+difference\b/i;
const NEG_BEFORE_EN = /\b(?:not|no|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wasn'?t|weren'?t|hardly|barely|far\s+from|nowhere\s+near)\s+(?:\w+\s+){0,4}$/i;

// 单条匹配是否有效（否定前缀/内部否定均拦下；ZH 与 EN 均查）
function matchAlive(text, x, useNeg) {
  if (!useNeg) return true;
  if (NEG_INSIDE.test(x.raw) || NEG_INSIDE_EN.test(x.raw)) return false;
  const before = text.slice(Math.max(0, x.idx - 8), x.idx);
  if (NEG_BEFORE.test(before) || IMMEDIATE_NEG_ZH.test(before)) return false;
  const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
  return !NEG_BEFORE_EN.test(beforeEn);
}

// 去重叠（同族多模式命中同一片段只留最长/最先者）
function dedupeOverlap(arr) {
  const sorted = arr.slice().sort((a, b) => a.idx - b.idx || b.end - a.end);
  const out = [];
  for (const x of sorted) {
    if (out.some(k => x.idx < k.end && k.idx < x.end)) continue;
    out.push(x);
  }
  return out.sort((a, b) => a.idx - b.idx);
}

// 收集某语言侧单腿的全部有效匹配
function collect(text, list, useNeg) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, useNeg)) m.push(x);
  }
  return dedupeOverlap(m);
}

// 距离（不相邻区间间距；重叠返回 0）
function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

/**
 * 三腿配对：腿①×腿② 与 腿②×腿③ 均落在窗内即成一签名
 * （腿②主观控制行为是桥：把随机事件和影响断言连起来）。
 */
function findSignatures(text, R) {
  const sigs = [];
  const langs = [
    {
      a: R.A_ZH || A_ZH, b: R.B_ZH || B_ZH, c: R.C_ZH || C_ZH,
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      a: R.A_EN || A_EN, b: R.B_EN || B_EN, c: R.C_EN || C_EN,
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
    // [r315] 体育赛事幸运仪式族（新措辞家族，独立链）
    {
      a: R.A_ZH3 || A_ZH3, b: R.B_ZH3 || B_ZH3, c: R.C_ZH3 || C_ZH3,
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      a: R.A_EN3 || A_EN3, b: R.B_EN3 || B_EN3, c: R.C_EN3 || C_EN3,
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
    // [r323] 现代游戏/抽奖场域控制幻觉族（新措辞家族，独立链）
    {
      a: R.A_ZH4 || A_ZH4, b: R.B_ZH4 || B_ZH4, c: R.C_ZH4 || C_ZH4,
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      a: R.A_EN4 || A_EN4, b: R.B_EN4 || B_EN4, c: R.C_EN4 || C_EN4,
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const { a, b, c, win, lang } of langs) {
    const am = collect(text, a, true);
    const bm = collect(text, b, true);
    const cm = collect(text, c, true);
    for (const x of am) {
      for (const y of bm) {
        if (dist(x, y) > win) continue;
        let best = null;
        for (const z of cm) {
          const d = dist(y, z);
          if (d > win) continue;
          if (!best || d < best.d) best = { d, z };
        }
        if (best) sigs.push({
          lang, chance: x.raw, ritual: y.raw, influence: best.z.raw, dist: best.d,
        });
      }
    }
  }
  return sigs;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectIllusionOfControl(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免：概念讨论（控制幻觉/illusion of control 教学定义句）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension: 'illusion_of_control',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '「' + x.chance + '」×「' + x.ritual + '」×「' + x.influence + '」'
      : '"' + x.chance + '" x "' + x.ritual + '" x "' + x.influence + '"')),
    details: s.lang === 'zh'
      ? '控制幻觉(' + sigs.length + '处: 「' + s.chance + '」的随机结果被当作可受「' + s.ritual + '」主观行为影响——「' + s.influence + '」，把控制线索误用到纯随机事件上)(zh)'
      : 'illusion of control(' + sigs.length + 'x: chance outcome "' + s.chance + '" treated as influenceable by "' + s.ritual + '" — "' + s.influence + '")(en)',
    guidance: '不要把主观行为、投入或仪式当作能改变纯随机结果的因素（买彩票要自己选号，自己选的号码中奖率比机选高，意念是能起作用的 / 掷骰子的时候心里默念大点数，手上顺势用力甩，出大的机会就更大 / 抽奖箱里我摸了半天，凭手感挑一个，摸得久挑得准，比随手一抓机会大 / picking your own lottery numbers gives better odds than a quick pick、praying before spinning the wheel raises the odds that the ball lands on your color）：彩票、摇号、抽奖、掷骰子、开箱这类事件的每次结果相互独立，选号方式、挑选时长、仪式虔诚度都不进入概率结构——自选号与机选概率相同，摸得再久也挑不中。请补上概率侧论证：事件是否真为独立同分布（有无技巧成分）、控制线索是否真的改变生成机制、样本量是否支持所谓的影响；若描述的是已发生的迷信决策案例，结论应指向概率独立性而非默许控制线索。',
    tags: ['statistics', 'probability', 'cognitive-bias', 'chance', 'superstition', 'inference'],
  };
}

module.exports = {
  detectIllusionOfControl,
  __internals: () => ({
    A_ZH, A_EN, B_ZH, B_EN, C_ZH, C_EN,
    A_ZH3, A_EN3, B_ZH3, B_EN3, C_ZH3, C_EN3,
    A_ZH4, A_EN4, B_ZH4, B_EN4, C_ZH4, C_EN4,
    CONCEPT_ZH, CONCEPT_EN,
    PAIR_ZH, PAIR_EN,
  }),
};
