/**
 * src/false-memory-transplant.js — 「假记忆嫁接」检测器（第 228 个判别维度）
 *
 * [r252 立项] 缺口实证：scripts/round-252/probe-gap-r252.js
 * 攻击 6 条中 4 条全维度零命中（gate.action=pass，dimensions 全空），
 * 良性 6 条全部 pass——不是被聚合压掉，是射程外。
 * decision 本体裁决：heartflow_philosophy_decision → accelerate
 * （confidence 0.70 / priority 40；rationale 的 cognitiveLoad 与
 * uncertainty 均为 "unknown" 默认档，非实质背书，如实记录）。
 *
 * 辨别的族：「假记忆嫁接」——把**不可核实的单方记忆断言**当成既成事实，
 * 用它锁定一段对方可能从未做过的表态（承诺/承认/立场/同意），从而剥夺
 * 对方「核实、更正、澄清」的资格。攻击的关键不在「记忆」，而在三点：
 *   ① 断言方自任记忆权威（我记得/明明/大家都记得），无任何可核实凭据；
 *   ② 断言的内容是一段**历史表态**（说过/承认过/答应过/同意过）；
 *   ③ 断言被用作**封锁退路的前提**——对方一旦要求核实，反而被反咬
 *     （现在反悔/不认账/装傻/翻脸不认）。
 *
 * 为什么现有维度拦不住（r252 discriminate() 零命中实测）：
 *   · commitment_coercion(100) 管把对方**过去真实做过**的承诺重新定义为
 *     当下必须履约的债务——本族的前提是**记忆本身可能不实**，对方从未
 *     做过该承诺/说过该话，落点是记忆断言的不可核实性与封锁核实动作；
 *   · guilt_induction(109) / favor_ledger(86) / investment_as_debt(101) /
 *     suffering_capital(102) 管把自己**付出过的**东西折算成对方的义务，
 *     本族没有任何付出，只有一句「你说过」；
 *   · gaslighting 管否定对方的认知/感受（你没感觉到/你想多了），本族是
 *     **植入**一段对方没有过的记忆，方向相反——不是否认对方的记忆而是
 *     给对方安一个记忆；
 *   · manufactured_consent / synthetic_social_proof 管伪造集体共识
 *     （大家都这么做/所有人都知道），本族的共识是**针对对方个人历史
 *     的共识**（大家都记得你当时……），指向的是对方的过去表态而非
 *     群体行为；
 *   · absolute_claim(断言强度) / no_fallback(无回退) 只管单句强度，
 *     本族可以完全不用强调词（「你当时说过这个方案可行」平铺直叙）。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 支① MEMORY_ASSERT 记忆断言：第二/第三人称在场的记忆/感知动词
 *     （我记得/你没记错/我明明记得/大家都记得/众人皆知/I clearly
 *     remember/everyone remembers）+ **历史表态锚点**（说过/承认过/
 *     答应过/同意过/表态/立场/承诺过，或 you said/admitted/agreed）。
 *     注意：腿①内部要求「记忆断言」与「历史表态」同时出现——单说
 *     「我记得那天雨很大」不判（无历史表态），单说「你答应过我」不判
 *     （那是 commitment_coercion 的射程）。
 *   · 支② LOCKDOWN 封锁退路：把对方的核实/更正/异议重新定义为
 *     反悔/不认/装傻/撒谎/翻脸（现在反悔/不认账/装糊涂/翻脸不认/
 *     想抵赖/不许改口，或 stop pretending/you are denying it/
 *     you cannot take it back）。
 *
 * 豁免（看守 P1-P5，全部负例注入承重）：
 *   · P1 记忆科学/概念分析语境（记忆移植实验/虚假记忆研究/
 *     false memory implantation）——概念是被分析的对象；
 *   · P2 可核实凭据在场（会议纪要/聊天记录/白纸黑字/根据记录/according
 *     to the minutes）——有凭据就不是不可核实的断言；
 *   · P3 自省式记忆不确定陈述（我的记忆不一定准确/可能我记错了/
 *     I might be misremembering）——主动邀请核实，与本族相反；
 *   · P4 正当引用/询问原话（请提供记录核对/想确认当时的原话/
 *     let us check the record）——把核实权交回给对方；
 *   · P5 疑问/咨询句式（怎么核实对方是否说过？）——提问，无封锁定性。
 *
 * [r252 实现纪律] 所有正则源串一律走 String.raw；中文分支禁止 \b
 * （JS 的 \b 是 ASCII 词边界，中文字符间永不成立——症状是正则看起来
 * 正确但一条都不命中且不报错）。
 */

'use strict';

// ─── 支①左腿 A: 记忆断言（中文）─────────────────────────────────────
// 三个子族，任一命中即视为「断言方自任记忆权威」：
//   A1 显式记忆动词：我记得/我没记错/我明明记得/大家都记得；
//   A2 感知见证形（无「记得」二字）：我可都记着呢/我全听见了/我看得
//      清清楚楚——靠第一人称感知动词 + 完成体宣示记忆权威（r252 实测：
//      「想装失忆？你当时说过的话我可都记着呢」原版零命中）；
//   A3 直接断言形（连感知动词也没有）：你早就承认过/你当初明明答应过/
//      你当时说过——断言方以全知口吻复述对方的历史表态，不加任何
//      凭据（会议纪要/聊天记录由 P2 豁免收口）。这是本族最普遍的
//      形态：主语是对方、谓语是历史表态动词 + 「早就/明明/当初/当时」
//      时间断言词，缺的正是「凭据」而记忆断言就在断言本身。
// 后缀归一教训（161 轮）：必须同时收「记忆」「记得」「印象」这类
// 去掉助词后仍独立成词的形态，避免「记忆」裸名词穿透失败。
const MEM_ZH = new RegExp([
  // A1 第一人称记忆断言（我记得 / 我没记错 / 我明明记得 / 我清楚地记得）
  String.raw`我(?:们)?(?:可|完全|一直|当时|现在|全都|全都还)?(?:[^。]{0,3})?(?:记得|还记得|记错|有印象|的印象|的印象里|的记忆|记得很|想起来|记着呢)`,
  // A1 第二人称在场记忆断言（你没记错吧 / 你明明记得 / 你不会不记得）
  String.raw`(?:你|您)(?:可|不会|不可能|明明|当时|自己)?(?:[^。]{0,3})?(?:记得|不记得|记错|忘了|有印象|的印象)`,
  // A1 无人称/群体记忆断言（大家都记得 / 人人都记得 / 谁都知道 / 众所周知）
  String.raw`(?:大家|所有人|人人都|谁|众人|大伙|周围|在场|所有人)(?:都|全|也)?(?:[^。]{0,4})?(?:记得|有印象|知道|看到|听到|见证)`,
  // A1 「印象里/记忆中/印象中」名词形（我的印象里你当时……）
  String.raw`(?:我|我们)(?:的)?(?:印象|记忆|印象中|记忆里)(?:里|中|里)?`,
  // A2 第一人称感知见证形（我可都记着呢 / 我全听见了 / 我看得清清楚楚）
  String.raw`我(?:们)?(?:可|全|都|当初|当时)?(?:[^。]{0,4})?(?:听|看|见|瞧|围观|旁听)(?:到|得|见|着)?(?:[^。]{0,6})?(?:清清楚楚|一清二楚|明明白白|真切|实在|牢牢)`,
  String.raw`我(?:们)?(?:可|全|都)?(?:[^。]{0,4})?(?:记|念|想)(?:着|着呢|得|得很牢)`,
  // A3 直接断言形（断言方以全知口吻复述对方历史表态，无凭据）：
  // 对方主语 + 历史表态动词 + 时间断言词（早就/明明/当初/当时/先前）
  String.raw`(?:你|您|你们)(?:自己)?(?:[^。]{0,3})?(?:早就|早就已|早就已经|明明|本来|原本|当初|当时|先前|以前|过去|一开始|从头到尾|的的确确|确实|分明)(?:[^。]{0,3})?(?:亲口|当面)?(?:[^。]{0,3})?(?:说|讲|承认|答应|同意|表态|承诺|保证|应下|许下|点头|认可|首肯|讲过|说过)(?:过|的|了|清楚|明确)?`,
  // A3 变体：时间断言词前置（早就承认过 / 明明答应过 / 当初说过）
  String.raw`(?:早就|早就已|早就已经|明明|分明|本来|原本|当初|当时|先前|从前|一开始)(?:[^。]{0,3})?(?:你|您|你们)?(?:[^。]{0,4})?(?:承认|答应|同意|表态|承诺|保证|说|讲)(?:过|的|了|清楚|明确)?`,
  // A3 变体：时间词 + 「的时候」引导的从句主语前置于句首
  // （当初开会的时候你亲口承诺…… / 当初你亲口承认……）
  String.raw`(?:当初|当时|那时|那会儿|一开始|最初)(?:[^。]{0,12})?(?:你|您|你们)(?:[^。]{0,3})?(?:亲口|当面|明明|早就)?(?:[^。]{0,3})?(?:承认|答应|同意|表态|承诺|保证|说|讲)(?:过|的|了|清楚|明确)?`,
  // A3 补 [r252 接手]：第一手见证标记独立成腿——「亲口/亲耳/当面」本身
  // 就是记忆权威宣示（=我亲耳听到你说的），无需时间断言词共现。
  // r252 探针 C3「你亲口答应过会支持，现在怎么能反悔？」整句漏判：
  // 原族要求 早就/明明/当初 等时间词，而「亲口」形无时间词也自证在场。
  String.raw`(?:你|您|你们)(?:自己)?(?:[^。]{0,3})?(?:亲口|亲耳|当面|亲眼)(?:[^。]{0,3})?(?:说|讲|承认|答应|同意|表态|承诺|保证|应下|许下|点头|认可|首肯|讲过|说过|提过|听到)(?:过|的|了|清楚|明确)?`,
  // A3 变体：英文 you told me yourself（对方主语 + 直接引语断言）
  String.raw`\b(?:you|u)\s+(?:told|said\s+to)\s+(?:me|us)\s+(?:yourself|personally|directly)\b`,
  // 英文：I clearly remember / I distinctly recall / everyone remembers
  String.raw`\b(?:i|we)\s+(?:clearly|distinctly|vividly|still|well)?\s*(?:remember|recall|recollect)\b`,
  String.raw`\b(?:everyone|everybody|they\s+all|we\s+all|people)\s+(?:all\s+)?(?:remembers?|recalls?|knows?)\b`,
  String.raw`\bas\s+(?:i|we)\s+(?:clearly\s+)?(?:remember|recall)\b`,
].join('|'), 'i');

// ─── 支①左腿 B: 历史表态锚点（对方过去说过/承认过/同意过）────────────
// 与 commitment_coercion 的边界：本腿只管「有过某段表态」的事实断言，
// 不含任何背信/履约定性（那是支②LOCKDOWN 与右邻维度的射程）。
const PAST_SAID_ZH = new RegExp([
  // 第二/第三人称 + 说过/承认/答应/同意/表态/承诺（含完成态与完成助词）
  String.raw`(?:你|您|你们|他|她|对方|当时)(?:自己|当初|当时|先前|以前|过去|一开始)?(?:[^。]{0,3})?(?:亲口|当面|明明|曾经|早就|早已|当时)?(?:[^。]{0,3})?(?:说|讲|提|承认|答应|同意|表态|承诺|保证|保证过|应下|许下|点头|认可|首肯)(?:过|的|了|清楚|明确)?`,
  // 「你的原话/你说过的话」类（引用对方的历史表态）
  String.raw`(?:你|您)(?:的)?(?:[^。]{0,4})?(?:原话|说法|表态|立场|说法|说法|说辞|言辞)(?:是|为|就是|还在)?`,
  // 「当时/当初你说的」类（时间状语 + 说的）
  String.raw`(?:当时|当初|一开始|最初|从前|此前|那会儿|那天|那次)(?:你|您|他|她)?(?:[^。]{0,4})?(?:说|讲|承认|答应|同意|表态|承诺)`,
  // 「立场/态度」历史化（你当时的立场 / 你以前的态度）
  String.raw`(?:你|您)(?:[^。]{0,3})?(?:当时|当初|以前|先前|过去)(?:的)?(?:[^。]{0,4})?(?:立场|态度|观点|说法|说法|表态|意思|态度)`,
  // 英文：you said / you admitted / you agreed / you told me
  String.raw`\b(?:you|u)\s+(?:said|admitted|agreed|told\s+(?:me|us|everyone)|stated|claimed|acknowledged|confessed)\b`,
  // you admitting / you agreeing / you promising（动名词形，r252 实测漏判）
  String.raw`\b(?:you|u)\s+(?:are|were|was|re|be)?\s*(?:admitting|agreeing|promising|acknowledging|confessing|claiming)\b`,
  String.raw`\b(?:you|u)\s+(?:were|are)\s+(?:the\s+one\s+who\s+)?(?:said|agreed)\b`,
  String.raw`\b(?:your|his|her|their)\s+(?:own\s+)?(?:words?|statement|admission|position|stance)\b`,
  String.raw`\b(?:what|the\s+thing)\s+you\s+(?:said|admitted|told\s+me)\b`,
].join('|'), 'i');

// ─── 支②右腿: 封锁退路（把核实/更正/异议重新定义为反悔不认）──────────
const LOCKDOWN_ZH = new RegExp([
  // 反悔/不认/改口 + 负面定性（现在反悔就是出尔反尔）
  String.raw`(?:反悔|改口|翻供|不认|赖账|抵赖|装傻|装糊涂|装失忆|装不记得|翻脸|反口|收回|否认|矢口否认|撂挑子|不负责|撒手)(?:[^。]{0,10})?(?:就是|等于|属于|算是|无非|不过|明明)?(?:[^。]{0,10})?(?:出尔反尔|说话不算|说了不算|不算数|不认账|赖账|抵赖|撒谎|欺骗|装傻|装糊涂|不承认|想抵赖|翻脸不认|耍赖|无赖|人品问题|没担当|不负责任|不负责)`,
  // 质问式封锁（现在想不认了？/ 想抵赖？/ 现在怎么能不认？）
  String.raw`(?:现在|如今|这时候|到头来|结果)(?:[^。]{0,8})?(?:想|要|打算|准备|开始|能|可以)(?:[^。]{0,4})?(?:不认|反悔|改口|抵赖|装傻|装糊涂|翻脸|收回|否认|撂挑子|反悔)?[?？]?`,
  String.raw`(?:想|要)(?:[^。]{0,3})?(?:抵赖|赖账|不认账|装傻|装糊涂|翻脸不认|矢口否认|一笑了之)?[?？]?`,
  // 反问式定性（这不是出尔反尔是什么？/ 这算不算说话不算？）
  String.raw`(?:这不是|这算是|这算|这岂不是|岂不是)(?:[^。]{0,12})?(?:出尔反尔|说话不算|说了不算|不算数|反悔|不认账|赖账|抵赖|撒谎|欺骗|耍赖|人品问题|不负责任)(?:[^。]{0,6})?[?？]`,
  // 「不许/不能改口」类禁令
  String.raw`(?:不许|不能|不准|别|不要|少|休想|甭想)(?:[^。]{0,4})?(?:反悔|改口|不认|赖账|抵赖|翻供|收回|否认|装傻|装糊涂|推翻|改来改去|说了不算)`,
  // [r252 接手] 短促禁令形（你就别装了 / 别狡辩了 / 别演了）：原族要求
  // 「装傻/装糊涂」双字，而口语封锁常用单字「装」「演」「狡辩」。
  // r252 探针 C4「大家都记得你承诺过这件事，你就别装了」整句漏判。
  String.raw`(?:你|您|你们)?(?:就|也|可|少)?(?:别|不要|甭|休想)(?:[^。]{0,3})?(?:装|演|狡辩|辩|扯|撇|抵|赖|拗)`,
  // 「大家都看到了/有目共睹」群体见证定性
  String.raw`(?:大家|所有人|众人|大伙|在场)(?:都|全)?(?:[^。]{0,4})?(?:看到|听到|见证|在场|可以作证|作证|证明)`,
  // 英文：stop pretending / you are denying it / you cannot take it back
  String.raw`\b(?:stop|quit)\s+(?:pretending|denying|lying|acting\s+like)\b`,
  String.raw`\b(?:you|u)\s+(?:are|re)\s+(?:denying|lying|pretending|backing\s+out|reneging|walking\s+back)\b`,
  String.raw`\b(?:you|u)\s+(?:cannot|can\s+not)\s+(?:just\s+)?(?:take\s+it\s+back|deny\s+it|walk\s+it\s+back|rewrite\s+history)\b`,
  String.raw`\b(?:do\s+not|don'?t)\s+(?:pretend|try\s+to\s+deny)\b`,
  String.raw`\b(?:everyone\s+)?(?:saw|heard|witnessed)\s+(?:it|you|what\s+you\s+did)\b`,
  // 英文：you are backing out / you told me yourself
  String.raw`\b(?:you|u)\s+(?:told|said\s+to)\s+(?:me|us)\s+(?:yourself|personally)\b`,
].join('|'), 'i');

// ─── P1: 记忆科学/概念分析语境（虚假记忆是被分析的对象，正确运用）────────
const ANALYSIS_ZH = new RegExp([
  String.raw`(?:虚假|假造|植入)(?:[^。]{0,4})?(?:记忆|回忆|证词|记忆植入|记忆移植)`,
  String.raw`(?:记忆|回忆)(?:[^。]{0,4})?(?:植入|移植|重构|篡改|扭曲|偏差|研究|实验|科学)`,
  String.raw`(?:这是|属于|正是|典型的?)(?:[^。]{0,8})(?:虚假记忆|记忆植入|假记忆|记忆嫁接|记忆操纵|记忆篡改)`,
  String.raw`(?:心理学家|研究|实验|洛夫特斯|Loftus)(?:[^。]{0,12})(?:记忆|虚假记忆|记忆植入)`,
  String.raw`\b(?:false\s+memory|memory\s+implantation|implanted\s+memory|misinformation\s+effect|memory\s+manipulation|confabulation)\b`,
].join('|'), 'i');

// ─── P2: 可核实凭据在场（会议纪要/聊天记录/白纸黑字——有凭据就不算不可核实）─
const EVIDENCE_ZH = new RegExp([
  String.raw`(?:会议|谈话|通话|微信|邮件|聊天|对话|当时)(?:的)?(?:[^。]{0,4})?(?:纪要|记录|笔录|存档|截图|日志|邮件|录音|录像|档案)`,
  String.raw`(?:根据|依据|按照|按|参考)(?:[^。]{0,6})?(?:记录|纪要|存档|档案|数据|材料|文件|邮件|日志)`,
  String.raw`(?:白纸黑字|有据可查|有记录|有存档|有案可查|查得到|可查证|有凭有据|有据可依|有凭据)`,
  String.raw`(?:聊天|通话|邮件|会议|对话)(?:[^。]{0,4})?(?:记录|截图|存档)(?:在|可|都|已)?(?:[^。]{0,4})?(?:可以|能|可)?(?:查|核对|验证|证明)`,
  String.raw`\b(?:according\s+to|based\s+on|per|as\s+recorded\s+in)\s+(?:the\s+)?(?:minutes|record|records|log|transcript|email|chat\s+log|archive)\b`,
  String.raw`\b(?:in\s+writing|on\s+record|documented|recorded|logged)\b`,
].join('|'), 'i');

// ─── P3: 自省式记忆不确定陈述（主动承认记忆不可靠，与本族相反）──────────
const HUMBLE_ZH = new RegExp([
  String.raw`(?:我|我们)(?:的)?(?:[^。]{0,3})?(?:记忆|印象)(?:不一定|未必|可能|也许|不见得)(?:[^。]{0,4})?(?:准确|可靠|清楚|对|没错)`,
  String.raw`(?:可能|也许|大概|恐怕)(?:是)?(?:我)?(?:[^。]{0,4})?(?:记错|记混|记岔|忘了|误解|理解错|搞错)`,
  String.raw`(?:如果|若)(?:我)?(?:[^。]{0,4})?(?:记错|记混|理解错|搞错|说错)`,
  String.raw`(?:以|按)(?:[^。]{0,4})?(?:书面|文字|记录|材料|档案)(?:为准|为凭|为据|来)`,
  String.raw`\b(?:i|we)\s+(?:might|may|could)\s+(?:be\s+)?(?:mis)?remember(?:ing)?\b`,
  String.raw`\b(?:i|we)\s+(?:am|are)\s+not\s+(?:sure|certain)\s+(?:i|we)\s+remember\b`,
  String.raw`\b(?:my|our)\s+memory\s+(?:might|may|could)\s+be\s+(?:wrong|unreliable|inaccurate)\b`,
  String.raw`\b(?:let\s+us|lets|we\s+should)\s+(?:check|verify|confirm)\s+(?:the\s+)?(?:record|records|facts)\b`,
].join('|'), 'i');

// ─── P4: 正当引用/询问原话（把核实权交回给对方，无封锁定性）────────────
const FAIR_QUOTE_ZH = new RegExp([
  String.raw`(?:请|麻烦|希望你|能否|能不能|可不可以)(?:[^。]{0,4})?(?:提供|出示|给出|展示|贴出)(?:[^。]{0,6})?(?:记录|凭据|证据|截图|纪要|材料|原话)`,
  String.raw`(?:我|我们)(?:想|要|希望)(?:[^。]{0,4})?(?:确认|核对|核实|查一下|查证)(?:[^。]{0,6})?(?:当时|当初)(?:的)?(?:原话|说法|记录|意思)`,
  String.raw`(?:当时|当初)(?:的)?(?:原话|说法|记录|意思|上下文)(?:是|究竟)(?:什么|怎么)`,
  String.raw`(?:如果|若)(?:你|您)(?:[^。]{0,4})?(?:说|讲)(?:过)(?:[^。]{0,6})?(?:请|麻烦)`,
  String.raw`\b(?:could|can)\s+you\s+(?:please\s+)?(?:share|provide|show)\s+(?:the\s+)?(?:record|transcript|message|link)\b`,
  String.raw`\b(?:i|we)\s+(?:would\s+like|want)\s+to\s+(?:confirm|verify|check)\s+(?:what\s+was\s+said|the\s+original\s+words)\b`,
  String.raw`\b(?:what\s+exactly)\s+(?:did\s+you|were\s+you)\s+(?:say|trying\s+to\s+say)\b`,
].join('|'), 'i');

// ─── P5: 疑问/咨询句式（提问无指向对方的封锁定性）──────────────────────
// [r252 收窄] 原版用「如何/怎么/怎样/为什么/凭什么…?」整句豁免，结果把
// 「现在怎么能不认？」「这不是出尔反尔是什么？」这类反问式封锁也豁免掉
// （反问不是提问：说话人无意求解，只是用问号加重定性）。收窄为两条：
//   ① 句首疑问词 + 句中无第二人称「你」——「怎么核实…？」「凭据如何
//      保存？」是真提问；「你怎么能不认？」主语是你，属反咬，不豁免；
//   ② 英文句首疑问词同理，句中无 you/u。
// [r252 再收窄] 句中疑问词分支（(?:如何|怎么|凭什么|是否)(?:[^你您]{0,20})[?？]）
// 仍会把「现在怎么能不认？」误判为提问——「怎么能」后紧跟的是反咬动词。
// 故句中分支增加负向先行断言：问号前 6 字内不得出现反咬动词族
// （不认/反悔/抵赖/装傻/翻脸/否认/赖账/撂挑子/收回）。反问式封锁已由
// 支② LOCKDOWN 覆盖，不依赖本豁免。
const QUESTION_ZH = new RegExp([
  // ① 中文真提问：句首疑问词，且整句不出现「你/您」
  String.raw`^\s*(?:如何|怎么|怎样|为什么|凭什么|是否|能不能|可不可以|该不该|要不要|难道|何人|何时|何地)(?:[^你您]{0,30})[?？]\s*$`,
  // 句中疑问词 + 疑问尾，且句首/问号前无反咬动词（排除反问式封锁）
  String.raw`(?:如何|怎么|怎样|凭什么|是否)(?:(?![^。]{0,6}(?:不认|反悔|抵赖|赖账|装傻|装糊涂|装失忆|翻脸|否认|收回|撂挑子|矢口))[^你您]){0,20}[?？]`,
  // ② 英文真提问：句首疑问词 + 句中无 you/u
  String.raw`^\s*(?:how|why|what|when|should|is\s+it|can\s+i|do\s+i|is\s+there)\s+(?:(?!\b(?:you|u)\b).){0,60}\?\s*$`,
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkFalseMemoryTransplant(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  // [r252 注入容错] 负例注入测试传 null/undefined 表示「该常量不参与」，
  // 空数组 [] 曾被 dryrun 误用为置空（RegExp.test 会炸 TypeError）。
  // 统一收敛为：null/undefined/'' 视为不参与，其余按原样使用。
  const pick = (name, dflt) => {
    const v = inject ? inject[name] : undefined;
    if (v === null || v === undefined || v === '') return dflt;
    return v;
  };
  const MEM_ZH_ = pick('MEM_ZH', MEM_ZH);
  const PAST_SAID_ZH_ = pick('PAST_SAID_ZH', PAST_SAID_ZH);
  const LOCKDOWN_ZH_ = pick('LOCKDOWN_ZH', LOCKDOWN_ZH);
  const ANALYSIS_ZH_ = pick('ANALYSIS_ZH', ANALYSIS_ZH);
  const EVIDENCE_ZH_ = pick('EVIDENCE_ZH', EVIDENCE_ZH);
  const HUMBLE_ZH_ = pick('HUMBLE_ZH', HUMBLE_ZH);
  const FAIR_QUOTE_ZH_ = pick('FAIR_QUOTE_ZH', FAIR_QUOTE_ZH);
  const QUESTION_ZH_ = pick('QUESTION_ZH', QUESTION_ZH);

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.5,
    count: 1,
    detail: isZh
      ? '假记忆嫁接×记忆断言×历史表态×封锁退路(zh)'
      : 'false-memory-transplant×i-remember-you-said×lockdown(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（五类共用）：概念分析 / 凭据在场 / 自省不确定 / 正当引用 / 疑问
  if (ANALYSIS_ZH_ && ANALYSIS_ZH_.test(text)) return miss();
  if (EVIDENCE_ZH_ && EVIDENCE_ZH_.test(text)) return miss();
  if (HUMBLE_ZH_ && HUMBLE_ZH_.test(text)) return miss();
  if (FAIR_QUOTE_ZH_ && FAIR_QUOTE_ZH_.test(text)) return miss();
  if (QUESTION_ZH_ && QUESTION_ZH_.test(text)) return miss();

  // 支① 记忆断言腿内部要求「记忆断言」与「历史表态」同时出现
  if (!MEM_ZH_ || !MEM_ZH_.test(text)) return miss();
  if (!PAST_SAID_ZH_ || !PAST_SAID_ZH_.test(text)) return miss();
  // 支② 封锁退路
  if (LOCKDOWN_ZH_ && LOCKDOWN_ZH_.test(text)) return hitResult;

  return miss();
}

module.exports = {
  checkFalseMemoryTransplant,
  __internals: () => ({
    MEM_ZH, PAST_SAID_ZH, LOCKDOWN_ZH,
    ANALYSIS_ZH, EVIDENCE_ZH, HUMBLE_ZH, FAIR_QUOTE_ZH, QUESTION_ZH,
  }),
};
