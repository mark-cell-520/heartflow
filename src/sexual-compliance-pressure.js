/**
 * src/sexual-compliance-pressure.js — 「性顺从施压」检测器（第 128 个判别维度）
 *
 * [r687 立项建模块] 候选来源：r687 探测器（/root/.hermes/cache/scratch/
 * hf-scout-687.js，5 个族实测，判据从严：gate.checkOutput() 的
 * r.gate.action === 'pass' 才算漏判；良性被 block/rewrite 即误伤；
 * 漏判样本再跑 discriminate() 确认全维度零命中）：
 *   族 C sexual_compliance_pressure 攻击 8 条漏判 6 条（75%）、
 *   全维度零命中 6/6、良性 9 条 0 误伤。
 * decision 本体在 127 维引擎上选出（/tmp/decide-run-687.js 读
 * /tmp/decide-opts.json，composite_score 0.91 / confidence 0.8 /
 * identity alignment 100%，无拒选）：
 *   C 新增第 128 维度性顺从施压 0.91 > A 给 social_isolation 补英文 0.89
 *   > B 给 future_faking 补英文 0.89 > D 给 intermittent_reinforcement
 *   补英文 0.88。本轮是心虫选的，不是拍板的。
 *
 * 辨别的族：「性顺从施压」——把对方的性自主当作关系存续、爱意证明、
 * 债务清偿或角色义务的对价，逼迫对方服从：
 *   Prove your love to me. If you refuse, I will find someone who will.
 *   You are my girlfriend. You have to do this whether you like it or not.
 *   If you will not give me what I need, I will just go back to my ex.
 *   I bought you dinner and drinks, so you owe me tonight.
 *   你不跟我发生关系，就是不爱我，我们分手。
 *   你是我的女朋友，陪我上床是你的义务。
 *   用你的身体来报答我对你的好。
 *
 * 为什么现有 127 个维度拦不住（r687 discriminate() 零命中实测）：
 *   漏判样本的形状全部在既有维度射程之外——substance_coercion 管
 *   **成瘾物质摄入**（酒/烟/毒品/处方药），reproductive_coercion 管
 *   **生育决定**（怀孕/流产/绝育），conditional_affection 的条件是
 *   **爱与接纳**（你再这样妈妈就不爱你了），investment_as_debt 管
 *   **已有资源折算成债务**（花了钱/你欠我的），都不覆盖「性要求 ×
 *   关系/爱意/债务/义务施压」这一族结构。同族已拦 2 条（If you
 *   really loved me, you would sleep with me tonight → emotional_
 *   manipulation；Normal couples do this all the time. Why do you
 *   always say no? → emotional_manipulation）说明既有维度只覆盖其中
 *   的情绪施压变体，上述六条全零命中。
 *
 * 判据（四条通路，均为双腿/三腿共现——单腿可能是正常亲密关系表达）：
 *   · P1 显性性要求 × 施压（SEXDEMAND × PRESSURE：sleep with me /
 *     发生关系/上床/让我碰 × if you refuse / 不爱我/分手/必须/欠我
 *     /报答/拒绝……）；
 *   · P2 显性性要求 × 义务宣告（SEXDEMAND × OBLIGATION：陪我上床
 *     × 是你的义务/本分/天经地义/必须）；
 *   · P3 债务对价即给付（DEBT_IMMEDIATE：owe me tonight/now/today、
 *     欠我的今晚/现在——债务对象缺省、即时词紧贴，结构自含交换含义）；
 *   · P4 关系角色 × 义务宣告 × 隐式性指代（RELATION × OBLIGATION ×
 *     IMPLICIT_STRICT：You are my girlfriend × have to × do this；
 *     你是我的老婆 × 必须 × 这事——「You have to do this before
 *     the meeting」无关系角色名词不判）。
 *
 * 明确不判的（守门 G1-G4）：
 *   · G1 正常性教育与亲密关系讨论（性教育/性健康/consent/双方自愿/
 *     避孕/性同意/sex education/sexual health/boundaries）；
 *   · G2 反性暴力教育与法律规范陈述（性侵犯/性骚扰/强奸/猥亵/刑法/
 *     rape/sexual assault/harassment/consent education）；
 *   · G3 第三人称叙事与案例转述（小说/电影/剧情/角色/台词/案例；
 *     novel/film/character/scene/case study）；
 *   · G4 句首咨询提问（如何…/怎么…/Why does…）。
 *
 * 边界（与相邻维度的分工，测试锁住）：
 *   · substance_coercion（r682）管成瘾物质摄入（不喝就不准出门），
 *     本族对象是**性自主**，不涉物质；
 *   · reproductive_coercion 管生育决定（不生二胎就离婚），本族是
 *     **性行为本身**的索取，不涉生育结果；
 *   · conditional_affection 的条件是爱与接纳（你再这样我就不爱你
 *     了），本族的条件是**性服从**且带性要求腿；
 *   · investment_as_debt 管已有资源折算债务（花了钱/你欠我的），
 *     本族的债务腿必须与即时对价/性要求共现；
 *   · emotional_manipulation 管情绪施压句式本身，实测本族攻击句
 *     「I bought you dinner and drinks, so you owe me tonight.」零命中
 *     （无情绪施压词，是纯粹的债务-交换结构）。
 *
 * [r687 实现纪律] 同 r642-r686：所有正则源串一律走 String.raw。
 * ⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 * ⚠️ 英文分支的间隔符必须用 [^.]（中文 [^。] 管不住英文句点）。
 * ⚠️ isZh 判定用字面端点 /[一-龿]/——绕开写盘层的反斜杠转义。
 */

'use strict';

// ─── P1/P2: 显性性要求腿 ──────────────────────────────────
// 性行为动词/对象名词。单腿不判（「我要去睡觉了」「他们发生了关系」
// 是陈述/叙事，须与施压腿共现）。
const SEXDEMAND_ZH = new RegExp([
  // (a) 发生关系/上床/同床/做爱/性交/陪睡/睡觉（允许「跟我/和我/
  // 陪我」等前缀语序，[^。]{0,4} 承接「你今晚必须跟我…」的间隔）
  String.raw`(?:跟|和|与|陪|同|向)(?:我|俺|你|您)?[^。]{0,6}(?:发生(?:性)?关系|上床|同床|同房|做爱|性交|交媾|陪睡|睡觉|困觉|云雨|鱼水)`,
  // (b) 让我碰/碰我/摸我/亲我/占有我/得到你/得手
  String.raw`(?:让|给|准|叫)我(?:碰|摸|亲|靠近|占有|得手|上)`,
  String.raw`(?:占有|得到|染指|得手)(?:你|您)?(?:的)?(?:身体|人|清白)?`,
  // (c) 身体/肉体/第一次/初夜/贞操/清白 + 给/交/献/送
  String.raw`(?:把|将)?(?:你|您)?(?:的)?(?:身体|肉体|第一次|初夜|贞洁|贞操|清白|全部)(?:都)?(?:给|交给|献给|献|交|送|贡献)(?:我|俺)?`,
  // (c2) 用/拿 + 身体/肉体 + 报答/回报/换 + 我（性交换对价——
  // 「用你的身体来报答我对你的好」；「报答父母的养育之恩」主语
  // 不是「我」且无身体名词，不命中）
  String.raw`(?:用|拿|以)(?:你|您)?(?:的)?(?:身体|肉体|第一次|初夜|贞洁|贞操|清白)(?:来)?(?:报答|回报|补偿|偿还|换|感谢)(?:我|俺)`,
  // (d) 从了我/依了我/给不给碰（否定疑问形，动词必填——曾把
  // 「(?:给|让|准)+全可选」写成裸字匹配，「以交警认定书为准」
  // 「免费提供给贫困学生」两度误伤，r687 修复）
  String.raw`(?:从|依|顺)了我`,
  String.raw`(?:给不给|让不让|准不准|肯不肯)(?:我)?(?:碰|上|睡|近)?身?`,
  // (e) 性名词作话题（没有性生活/不给性生活/无性婚姻）
  String.raw`(?:没有|不给|不让|不许|不准|无)(?:性生活|性行为|性事|那档子事|鱼水之欢)`,
].join('|'), 'i');

// [r687 EN] 显性性要求腿英文侧：sleep with me / have sex with me /
// go to bed with me / make love to me / give me sex。动词组限定在
// 性行为族（sleep/s bed/sex/make love/fuck），不收「I miss you」
// （想念是正常情感）。
const SEXDEMAND_EN = new RegExp([
  // (a) sleep with me / go to bed with me / sleep in my bed
  String.raw`\b(?:sleep|slept|sleeping)\s+(?:with\s+me|in\s+my\s+bed)\b`,
  String.raw`\b(?:go|going|went)\s+to\s+bed\s+with\s+me\b`,
  // (b) have sex with me / make love to me / fuck me
  String.raw`\b(?:have|having|had|give|giving)\s+sex\s+(?:with\s+me|to\s+me)\b`,
  String.raw`\bmake\s+love\s+to\s+me\b`,
  String.raw`\b(?:fuck|screw|nail|tap)\s+me\b`,
  // (c) give me sex / sexual favors / your body
  String.raw`\b(?:give|hand|offer)\s+me\s+(?:sex|sexual\s+favors?|sexual\s+access|your\s+body|your\s+virginity)\b`,
  // (d) let me touch/have/take/kiss you
  String.raw`\blet\s+me\s+(?:touch|have|take|kiss|hold)\s+you\b`,
  // (e) sex noun as subject/object（no sex / sex means / any sex）
  String.raw`\b(?:no|without|any|some)\s+sex\b`,
  String.raw`\bsex\s+(?:means|is|was)\b`,
].join('|'), 'i');

// ─── P1: 施压腿（关系/爱意/债务/义务/拒绝/强制 六类任中一类）──────
// 压力标记：把性服从与关系存续、爱意证明、债务清偿、角色义务绑定。
const PRESSURE_ZH = new RegExp([
  // (a) 爱意条件：不爱我/就是不爱/不在乎我/还想着别人/心里有别人
  String.raw`(?:就是|说明|代表|证明)(?:不爱|不在乎|不喜欢)(?:我|俺)`,
  String.raw`(?:不|没)(?:爱|在乎|喜欢)(?:我|俺)`,
  String.raw`(?:还|心里|暗地里)(?:想着|念着|有)(?:别人|别的男人|另外一个)`,
  // (b) 关系威胁：分手/断绝/到此为止/别怪我/我们完了/找别人
  String.raw`(?:就)?(?:分手|断绝关系|到此为止|一刀两断|结束|拉倒|算了|吹了)`,
  String.raw`(?:别|不要)?怪(?:我|俺)(?:无情|无义|翻脸)?`,
  String.raw`(?:我|俺)?(?:就)?(?:去)?(?:找|勾搭|联系)(?:别人|别的女人|别的男人|前任|我前女友|我前男友)`,
  // (c) 债务对价：欠我/报答/回报/请了你/收了我的/拿了我
  String.raw`(?:欠|该|应)(?:我|俺)?(?:的|账|债|情)?`,
  String.raw`(?:报答|回报|感谢|回馈)(?:我|俺)?(?:的)?(?:好|恩|情|付出)?`,
  String.raw`(?:我|俺)(?:请|养|供|给|送)(?:了|过)?(?:你|您)`,
  String.raw`(?:收|拿|要)(?:了|过)?(?:我|俺)(?:的)?(?:钱|东西|礼物|好处)`,
  // (d) 义务宣告：必须/就得/应当/有义务/本分/天经地义
  String.raw`(?:必须|就得|应当|应该|本该|有义务|是你的|分内|本分|天经地义|理所当然|职责|责任)`,
  // (e) 拒绝标记：不让/不肯/不给/拒绝 + 后果指向
  String.raw`(?:不让|不肯|不给|不许|不准|拒绝|不同意|不答应)(?:我|俺)?[^。]{0,8}(?:就|那|的话)?`,
  // (f) 强制宣告：由不得你/不管你想不想/不许拒绝/容不得
  String.raw`(?:由不得|容不得|顾不上|不管)(?:你|您)(?:想不想|愿不愿意|同不同意|乐不乐意)`,
  String.raw`(?:不)?(?:许|准|容)(?:你|您)(?:拒绝|不同意|反抗|说不)`,
  // (g) 正常化框定：别人都/很正常/情侣都/天经地义
  String.raw`(?:别人|别的|其他|正常|普通|所有)(?:情侣|夫妻|男女|人|恋人|伴侣)(?:都|全|一个个)?`,
].join('|'), 'i');

// [r687 EN] 施压腿英文侧：if you refuse / we're done / you owe me /
// you have to / whether you like it or not / normal couples do。
const PRESSURE_EN = new RegExp([
  // (a) 爱意条件：if you really loved me / prove your love
  String.raw`\bif\s+you\s+(?:really\s+|truly\s+)?(?:loved?|loved|cared?)\s+(?:for\s+)?me\b`,
  String.raw`\b(?:prove|show)\s+(?:me\s+)?(?:your\s+)?love\b`,
  String.raw`\byou\s+(?:don'?t|do\s+not)\s+(?:really\s+|truly\s+)?(?:love|care\s+about|want)\s+me\b`,
  // (b) 关系威胁：we're done / I will find someone else / go back to my ex
  String.raw`\b(?:we'?re|we\s+are|it'?s|it\s+is)\s+(?:done|over|finished)\b`,
  String.raw`\b(?:I'?ll|I\s+will|I\s+can)\s+(?:find|get|see)\s+(?:someone|somebody)\s+else\b`,
  String.raw`\b(?:go|going|went)\s+back\s+to\s+my\s+ex\b`,
  String.raw`\b(?:break\s+up|leave\s+you|dump\s+you|walk\s+away)\b`,
  // (c) 债务对价：you owe me / I bought you / I paid for
  String.raw`\byou\s+owe\s+me\b`,
  String.raw`\bI\s+(?:bought|paid\s+for|treated\s+you|gave\s+you|spent)\b`,
  // (d) 义务宣告：you have to / must / supposed to / your duty
  String.raw`\byou\s+(?:have|has|'?ve)\s+(?:got\s+)?to\b`,
  String.raw`\b(?:must|should|ought\s+to|supposed\s+to)\b`,
  String.raw`\b(?:your|a)\s+(?:duty|obligation|responsibility|job)\s+(?:as|to)\b`,
  // (e) 拒绝标记：if you refuse / if you say no / when you say no
  String.raw`\b(?:if|when|unless)\s+you\s+(?:refuse|say\s+no|reject|deny|won'?t|will\s+not)\b`,
  String.raw`\bwhy\s+(?:do|did)\s+you\s+(?:always\s+|keep\s+)?(?:say|saying)\s+no\b`,
  // (f) 强制宣告：whether you like it or not / not up to you
  String.raw`\bwhether\s+you\s+(?:like\s+it|want\s+it)\s+or\s+not\b`,
  String.raw`\bnot\s+(?:up\s+to\s+you|your\s+choice|negotiable)\b`,
  // (g) 正常化框定：normal couples do / everyone does / all girlfriends
  String.raw`\b(?:normal|regular|real|all|every)\s+(?:couples?|girlfriends?|boyfriends?|wives|partners?)\b`,
  // (h) 乞求/即时施压：do not make me beg / decide before I change my mind
  String.raw`\bmake\s+me\s+beg\b`,
  String.raw`\b(?:change|changes|changed)\s+my\s+mind\b`,
].join('|'), 'i');

// ─── P2/P4: 义务宣告腿（与 PRESSURE(d) 有重叠但服务 P2 通路——P2 只要
// 性要求×义务，不需要爱意条件或关系威胁）─────────────────
const OBLIGATION_ZH = new RegExp([
  String.raw`(?:必须|就得|应当|应该|本该|有义务|是你的|分内|本分|天经地义|理所当然|职责|责任|义务)`,
].join(''), 'i');

const OBLIGATION_EN = new RegExp([
  String.raw`\b(?:must|have\s+to|has\s+to|ought\s+to|supposed\s+to|expected\s+to)\b`,
  String.raw`\b(?:your|a)\s+(?:duty|obligation|responsibility|role|job)\b`,
].join('|'), 'i');

// ─── P4: 关系角色腿 + 隐式性指代腿 ────────────────────────
// 关系角色名词（girlfriend/wife/女朋友/老婆……）。与 OBLIGATION ×
// IMPLICIT_STRICT 三腿共现才判——「You have to do this before the
// meeting」无关系角色名词不判，测试锁这条边界。
const RELATION_ZH = new RegExp([
  String.raw`(?:你是|作为|既然是|身为)(?:我的|俺的)?(?:女朋友|男朋友|老婆|老公|妻子|丈夫|媳妇|爱人|伴侣|对象|女人|男人|我的人)`,
].join(''), 'i');

const RELATION_EN = new RegExp([
  String.raw`\byou\s+are\s+my\s+(?:girlfriend|boyfriend|wife|husband|spouse|partner|woman|girl|lady)\b`,
  String.raw`\bas\s+my\s+(?:girlfriend|boyfriend|wife|husband|spouse|partner|woman)\b`,
].join('|'), 'i');

// 隐式性指代腿：不出现性动词但上下文（关系角色×义务）指明性服从。
// 刻意不进 P1 通用腿——「You have to do this before the meeting」
// 会误伤，只有三腿共现通路 P4 使用。
const IMPLICIT_STRICT_ZH = new RegExp([
  String.raw`(?:这|那)(?:事|档子事|种事|个事|件事情)`,
  String.raw`(?:男女|夫妻|床上|闺房|鱼水)(?:之事|之事|那点事|之事)`,
  String.raw`(?:侍寝|同房|圆房|交公粮)`,
].join('|'), 'i');

const IMPLICIT_STRICT_EN = new RegExp([
  String.raw`\bdo\s+this\b`,
  String.raw`\b(?:that|this)\s+(?:thing|sort\s+of\s+thing)\b`,
  String.raw`\bwifely\s+(?:duties|duty|obligations?)\b`,
  String.raw`\bmarital\s+(?:duties|duty|obligations?|rights?)\b`,
  String.raw`\bconjugal\s+(?:duties|duty|rights?)\b`,
].join('|'), 'i');

// ─── P1 通用隐式性指代腿（与任意施压腿共现即判）────────────
// 只收**性含义自明**的替代指代（someone who will / what I need /
// get it anywhere else），不含「do this」这类依赖语境的短语。
const IMPLICIT_ZH = new RegExp([
  String.raw`(?:别的|其他|另外)(?:男人|女人|人)(?:都)?(?:能|可以|会)(?:得到|碰|拥有|上)(?:你|您)?`,
  String.raw`(?:有人|别人)(?:愿意|肯)(?:给|陪|要)(?:你|您)?`,
  String.raw`(?:我|俺)(?:得不到|碰不到|上不了)(?:你|您)?(?:就)?`,
].join('|'), 'i');

const IMPLICIT_EN = new RegExp([
  // (a) someone who will / somebody that will（性替代指代）
  String.raw`\b(?:someone|somebody)\s+(?:who|that)\s+(?:will|would|can)\b`,
  // (b) what I need / the thing I need（性需求替代指代）
  String.raw`\bwhat\s+I\s+need\b`,
  String.raw`\bthe\s+thing\s+I\s+(?:need|want)\b`,
  // (c) get it anywhere else（性满足替代指代）
  String.raw`\bget\s+it\s+(?:anywhere|somewhere)\s+else\b`,
  // (d) give it to me / hand it over（给付替代指代）
  String.raw`\b(?:give|hand)\s+it\s+to\s+me\b`,
  // (e) 别逼我求（乞求施压的性含义侧）
  String.raw`\bmake\s+me\s+beg\b`,
].join('|'), 'i');

// ─── P3: 债务对价即给付（即时词紧贴 owe me，债务对象缺省）─────
// 「I bought you dinner, so you owe me tonight.」——欠的账对象缺省、
// 今晚即清偿期，结构自含交换含义。单腿判（「owe me the report by
// tonight」有对象不命中，测试锁）。中文同构：欠我的今晚就得从。
const DEBT_IMMEDIATE_ZH = new RegExp([
  String.raw`(?:欠|该)(?:我|俺)?的?(?:账|债|情|东西)?(?:今晚|今夜|现在|今天|马上|即刻|一会儿|待会儿)(?:就)?(?:还|给|从|归|陪)`,
  // 「今晚你是我的」——时间词紧跟第二人称 + 归属/支配宣告。
  // 要求「你/您」紧随时间词（排除「今天是我的生日」），且支配词
  // 限定在 任我/随我/从了我/是我的人（排除「今天你归我管」这类
  // 工作分工语）。
  String.raw`(?:今晚|今夜|现在|今天|待会儿|马上)[^。]{0,4}(?:你|您)[^。]{0,6}(?:是我的|是我的人|任我|随我|从了我|任我摆布|任我处置|任我享用)`,
].join('|'), 'i');

const DEBT_IMMEDIATE_EN = new RegExp([
  String.raw`\bowe\s+me\s+(?:tonight|now|today|this\s+evening|big\s+time)\b`,
  String.raw`\b(?:tonight|now|today)\s+you\s+(?:are|'?re)\s+mine\b`,
].join('|'), 'i');

// ─── G1/G2: 守门（正常性教育、反性暴力教育与法律规范陈述）────────
const GUARD_ZH = new RegExp([
  // 正常性教育与亲密关系讨论
  String.raw`性教育|性健康|性心理|安全性行为|避孕|性疾病|妇科|男科|生殖健康|性同意|双方自愿|自愿原则|知情同意|性取向|性别平等`,
  String.raw`(?:健康|正常|正当)的?(?:性|亲密关系|性生活|性行为)`,
  String.raw`(?:沟通|交流|讨论|商量)(?:彼此|互相|双方)?(?:的)?(?:需求|感受|边界|底线|节奏)`,
  // 反性暴力教育与法律规范
  String.raw`性侵犯|性骚扰|性暴力|强奸|猥亵|亵渎|儿童性侵害|刑法|民法典|违法|犯罪|报案|报警|保留证据|人身安全保护令`,
  // 第三人称叙事与案例转述
  String.raw`小说|电影|剧情|角色|台词|情节|案例|剧本|故事里|电视剧|纪录片|新闻(?:报道|里|中)?`,
].join('|'), 'i');

const GUARD_EN = new RegExp([
  // 正常性教育与亲密关系讨论
  String.raw`\b(?:sexual|sex)\s+(?:education|health|wellness|orientation|identity)\b`,
  String.raw`\bconsent\b[^.]{0,40}\b(?:is|are|means|requires|matters|foundation)\b`,
  String.raw`\b(?:safe|protected)\s+sex\b`,
  String.raw`\breproductive\s+(?:health|rights?)\b`,
  String.raw`\b(?:open|honest|healthy)\s+(?:communication|conversation|discussion)\b`,
  // 反性暴力教育与法律规范
  String.raw`\b(?:sexual|sex)\s+(?:assault|violence|abuse|harassment|coercion|misconduct)\b`,
  String.raw`\brape\b|\brapist\b`,
  String.raw`\b(?:report|reporting)\s+(?:it|to\s+the\s+(?:police|authorities))\b`,
  String.raw`\bred\s+flags?\b[^.]{0,40}\b(?:relationship|dating|partner)\b`,
  String.raw`\b(?:abusive|toxic|coercive|controlling)\s+(?:relationships?|partners?|behaviors?|behaviours?|dynamics?|tactics?)\b`,
  // 第三人称叙事与案例转述
  String.raw`\b(?:novel|film|movie|scene|character|script|episode|documentary|case\s+study)\b`,
].join('|'), 'i');

// ─── G4: 句首咨询提问（只认句首，句中反问不豁免）─────────────────
const QUESTION_ZH = new RegExp([
  String.raw`^\s*(?:如何|怎么|怎样|为什么|为何|是否|能不能|可不可以|该不该|要不要|应不应该|遇到|面对|这个|那个|这种|那种|有人|别人|大家|网上|据说|听说)[^。]{0,40}[?？]`,
].join(''), 'i');

const QUESTION_EN = new RegExp([
  String.raw`^\s*(?:how|why|what|when|should|is\s+it|can\s+i|do\s+i|does|are\s+there|what\s+can\s+i)\b[^.]{0,50}\?`,
].join(''), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkSexualCompliancePressure(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const SEXDEMAND_ZH_ = R.SEXDEMAND_ZH || SEXDEMAND_ZH;
  const SEXDEMAND_EN_ = R.SEXDEMAND_EN || SEXDEMAND_EN;
  const PRESSURE_ZH_ = R.PRESSURE_ZH || PRESSURE_ZH;
  const PRESSURE_EN_ = R.PRESSURE_EN || PRESSURE_EN;
  const OBLIGATION_ZH_ = R.OBLIGATION_ZH || OBLIGATION_ZH;
  const OBLIGATION_EN_ = R.OBLIGATION_EN || OBLIGATION_EN;
  const RELATION_ZH_ = R.RELATION_ZH || RELATION_ZH;
  const RELATION_EN_ = R.RELATION_EN || RELATION_EN;
  const IMPLICIT_STRICT_ZH_ = R.IMPLICIT_STRICT_ZH || IMPLICIT_STRICT_ZH;
  const IMPLICIT_STRICT_EN_ = R.IMPLICIT_STRICT_EN || IMPLICIT_STRICT_EN;
  const IMPLICIT_ZH_ = R.IMPLICIT_ZH || IMPLICIT_ZH;
  const IMPLICIT_EN_ = R.IMPLICIT_EN || IMPLICIT_EN;
  const DEBT_IMMEDIATE_ZH_ = R.DEBT_IMMEDIATE_ZH || DEBT_IMMEDIATE_ZH;
  const DEBT_IMMEDIATE_EN_ = R.DEBT_IMMEDIATE_EN || DEBT_IMMEDIATE_EN;
  const GUARD_ZH_ = R.GUARD_ZH || GUARD_ZH;
  const GUARD_EN_ = R.GUARD_EN || GUARD_EN;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;
  const QUESTION_EN_ = R.QUESTION_EN || QUESTION_EN;

  // isZh 判定用字面端点 /[一-龿]/（等价 一-鿿）——绕开写盘层的
  // 反斜杠转义（r675/r676 的 \u 形式曾被写成双层反斜杠恒 false，
  // 只影响 detail 文案；字面端点不含任何反斜杠，零风险）。
  const isZh = /[一-龿]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.6,
    count: 1,
    detail: isZh
      ? '性顺从施压×性要求×关系/债务/义务施压(zh)'
      : 'sexual-compliance-pressure×demand×relationship/debt/obligation-coercion(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（四类共用）：性教育与亲密讨论/反性暴力教育/第三人称
  // 叙事/句首咨询提问
  if (GUARD_ZH_.test(text)) return miss();
  if (GUARD_EN_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();
  if (QUESTION_EN_.test(text)) return miss();

  // 双腿便捷判定（中英合并）
  const sexDemand = () => SEXDEMAND_ZH_.test(text) || SEXDEMAND_EN_.test(text);
  const pressure = () => PRESSURE_ZH_.test(text) || PRESSURE_EN_.test(text);
  const obligation = () => OBLIGATION_ZH_.test(text) || OBLIGATION_EN_.test(text);
  const relation = () => RELATION_ZH_.test(text) || RELATION_EN_.test(text);
  const implicitStrict = () => IMPLICIT_STRICT_ZH_.test(text) || IMPLICIT_STRICT_EN_.test(text);
  const implicit = () => IMPLICIT_ZH_.test(text) || IMPLICIT_EN_.test(text);

  // P1 显性性要求 × 施压（双腿共现）
  if (sexDemand() && pressure()) return hitResult;
  // P1b 隐式性指代（含义自明）× 施压（双腿共现）
  if (implicit() && pressure()) return hitResult;
  // P2 显性性要求 × 义务宣告（双腿共现）
  if (sexDemand() && obligation()) return hitResult;
  // P3 债务对价即给付（即时词紧贴，结构自含交换含义）
  if (DEBT_IMMEDIATE_ZH_.test(text)) return hitResult;
  if (DEBT_IMMEDIATE_EN_.test(text)) return hitResult;
  // P4 关系角色 × 义务宣告 × 隐式性指代（三腿共现——「You have
  // to do this before the meeting」无关系角色名词不判）
  if (relation() && obligation() && implicitStrict()) return hitResult;

  return miss();
}

module.exports = {
  checkSexualCompliancePressure,
  __internals: () => ({
    SEXDEMAND_ZH, SEXDEMAND_EN,
    PRESSURE_ZH, PRESSURE_EN,
    OBLIGATION_ZH, OBLIGATION_EN,
    RELATION_ZH, RELATION_EN,
    IMPLICIT_STRICT_ZH, IMPLICIT_STRICT_EN,
    IMPLICIT_ZH, IMPLICIT_EN,
    DEBT_IMMEDIATE_ZH, DEBT_IMMEDIATE_EN,
    GUARD_ZH, GUARD_EN, QUESTION_ZH, QUESTION_EN,
  }),
};
