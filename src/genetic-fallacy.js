/**
 * src/genetic-fallacy.js — 「起源谬误」检测器（第 131 个判别维度）
 *
 * [r693 立项] decision 本体在 130 维引擎上选出（/tmp/decide-run-693.js 读
 * /tmp/decide-opts-693.json，composite_score 0.94 / identity alignment
 * 100%，无拒选）。探测器 scripts/round-693-family-probe.js（落盘
 * /tmp/hf-scout-693.txt，判据从严：只有 gate.checkOutput() 返回
 * gate.action === 'pass' 才算漏判）：攻击 10 条漏判 10/10（100%）、
 * 真零命中 10/10、误伤 0/16（良性集按 r691 交接簿要求扩到 16 条，
 * 含审计报告/同行评审/官方统计/进口设备等正当来源采信）。
 * Phase 1.5 同律复核：10 条漏判样本逐条跑 discriminate()，实测全维度
 * 零命中 10/10——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：「起源谬误」（genetic fallacy，按来源出身判好坏）——观点/
 * 产品/人的**来源、出身、年代、身份**被点名，然后**由来源本身直接推出
 * 质量或价值结论**，完全不检验内容。这不是合理的资历参考，而是用
 * 「谁说的/哪来的/什么时候的」代替「说得对不对」：
 *   这个观点是年轻人提出的，肯定不成熟。
 *   外国人写的书，能适合中国国情吗。
 *   小作坊生产的，质量能好到哪去。
 *   他没上过名牌大学，观点不值得听。
 *   这理论是两百年前提出的，早就过时了。
 *   农村来的见识短，别听他的。
 *   大厂裁员出来的人，能力肯定有问题。
 *
 * 与既有维度的边界（r693 探测器实测归因）：
 *   · stereotype（既有维度）管**来源歧视性评价**——按性别/种族/地域
 *     给人或群体贴不可靠标签（「女人写的代码可靠性不如男人」已被它判
 *     verify）。本维度按 r691 交接簿要求只收**来源-质量推断**：来源是
 *     年龄/资历/年代/机构/产地，结论指向观点或产品本身的价值。两类
 *     句式分开收，attack 集不含性别歧视型样本，B 组测试锁住该分工。
 *   · appeal_to_tradition（既有维度）管**诉诸传统**（老祖宗传下来的
 *     就是好），本族是**以出身年代为由的贬损**（两百年前的所以过时），
 *     方向相反；两者都命中时取各自的 action，不冲突。
 *   · hasty_generalization（既有维度）管无依据概推，本族要件是
 *     **来源被点名**（谁提出的/哪生产的/什么年代的）。
 *   · confidence / capability_overclaim 管能力夸大，本族落点是
 *     **来源导致的贬损**。
 *   · 其余 130 个维度对本族 10 条漏判样本实测全部零命中。
 *
 * 为什么现有维度拦不住（discriminate() 逐条零命中实测 + 归因）：
 *   起源谬误的「来源名词 × 质量贬损」结构在模式库里没有任何一条腿——
 *   standard_shift 只认验收动词、stereotype 只认身份标签、sunk_cost
 *   只认沉没成本句式。这是整族射程外，不是某个维度正则弱。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 腿① SOURCE 来源点名（三类任中一类）：
 *     a 人群身份（年轻人/应届生/实习生/没上过名牌大学/大厂裁员出来的/
 *         外国人/国产/小作坊/外行/业余/自学……）；
 *     b 年代时间（两百年前/上个世纪/古代/老祖宗/很早以前……）；
 *     c 地域机构出身（农村/外地/小作坊/草台班子……归入 a/c 合并表）。
 *   · 腿② QUALITY 质量贬损推断（三类任中一类）：
 *     a 直接贬损（不成熟/不可靠/不值得(听)/好不到哪去/过时/见识短/
 *         有问题/纸上谈兵……）；
 *     b 比较贬损（不如进口的成熟/比不上正规的/比不了名牌的……）；
 *     c 反问贬损（能适合……吗/能好到哪去/靠得住吗/凭什么……）。
 *   · 单有来源不判：「应届生经验少一些，但学习能力强」是事实陈述，
 *     无贬损结论；「进口设备和国产设备各有优势」是平衡比较。
 *   · 单有贬损不判：「这个方案不成熟」无来源腿——那是正常批评。
 *
 * 为什么取 VERIFY 级：单句可能是小说对白/偏见案例引述/逻辑课反面
 * 教材/面试场景转述，rewrite 会误伤（与 r672-r692 全部评价/胁迫族
 * 同口径）。verify 的含义是「这段推断结构需要复核」——用出身代替
 * 内容的文本，调用方应暂停采信其评价结论。
 *
 * [r399] 新增「词源谬误族」（etymological fallacy，起源谬误的语义子种）：
 * 引用一个词的**词源/本义**（源于/本义是/古汉语里/comes from/literally
 * means），据此裁定该词**当下**的含义、正确用法或相关事物的资格——
 * 「只有X才算Y / 现在的用法是误用 / 不配叫Y」。存量 SOURCE×QUALITY 族收
 * 「谁说的/哪生产的/什么年代的」来源点名 × 质量贬损；本族收「词的起源」
 * × 定义/规范结论，两类措辞结构正交、射程互补。判据同为双腿共现：
 *   腿① ETYM 词源/本义标记（源于/本义/原意/古汉语里/comes from/
 *        literally means/originally meant/derives from ...）；
 *   腿② NORM 定义/规范结论（才算/不配叫/从一开始就是误用/违背本义/
 *        counts as true/not a real/misuses the word ...）。
 * 良性（词源的事实陈述、明确否认词源决定当下用法的反谬误陈述、语言学
 * 教学/词典释义）只有腿①没有腿②，双腿共现天然豁免；行动级同为 VERIFY。
 *
 * [r412] 新增「推断式规范结论」句式族（etymological fallacy 的推论变体）：
 * 存量 r399 词源族的腿② NORM 只收**定义/规范直陈**（才算/不配叫/是
 * 误用/违背本义），漏掉**由词源直接推断当下用法或立场**的推论句——
 * 「本义是暴民统治，所以现在鼓吹民主的人其实在鼓吹暴民政治」「原
 * 本指贵妇人，所以说别人是 lady 就是在抬高对方」「本义是尺子，所
 * 以今天拿它当标准就是在偷换概念」。这类句子的谬误结构与词源族完全
 * 同构（引用词的起源 → 裁定词的当下含义/使用者的资格），只是结论换
 * 成了「所以现在……其实是在……」的推断形。判据同为双腿共现：
 *   腿① ETYM 词源/本义标记（沿用存量常量，ZH/EN）；
 *   腿② NORM2 推断式规范结论（新增，见下常量注释）；
 *   豁免沿用 ETYM_META（评析词源谬误话术本身）＋ 新增 NORM2 自身
 *   的反谬误对冲组（HEDGE，见常量注释）：明确指出「词义会随时代变
 *   化/本义不等于当下用法」的句子只有腿①＋对冲、无规范断言，不判。
 *   良性集：词源事实陈述、词义演变承认、语言学教学、词典释义、明确
 *   否认词源决定当下用法的反谬误陈述。
 *
 * [r418] 新增「考证式古人印证增信族」（etymological fallacy 的增信
 * 方向）：存量词源族裁「本义→定义/用法/资格」（规范贬损方向），本族
 * 是同一谬误结构的**增信背书**方向——「这个词源于X，可见古人早已懂
 * 得Y的真谛」，用起源的古老性冒充命题的真理性。判据同为双腿共现：
 *   腿① ETYM 词源/本义标记（沿用存量常量）；
 *   腿② ENDORSE 古人印证增信 = 古人族名词 × 认知/积淀动词，三支：
 *      a 古人族 + ≤12字 + 认知动词（古人早就把道理说透了）；
 *      b 古人族 + 早已/早就/果然 + ≤14字 + 认知或积淀动词（祖先早
 *         已把骨气刻进文化基因）；
 *      c 可见/足见/足以证明 + ≤10字 + 古人族 + ≤14字 + 认知动词
 *         （可见古希腊人早已懂得自由的真谛）；
 *      EN: ancients/Greeks/forefathers + already/long ago +
 *         understood/figured out，及 shows/proves + 古人族 + already
 *         + understood 两形。
 *   豁免三层：ETYM_META、ETYM_HEDGE（沿用）+ ENDORSE_REFUTE（新增：
 *   「缺乏文献依据/词源不能证明思想史」——明确指出词源不足以证明
 *   思想史内容的反驳句只有腿①＋反驳，不判）。
 *   与 appeal_to_tradition（老祖宗传下的就是好——传统整体承袭）射程
 *   分工：本族管**词源/本义**这一语言事实被用来给立场增信。良性集：
 *   词源事实陈述、词义演变承认、语言学教学、反驳词源增信的反谬误陈
 *   述（见 test/round-418-genetic-endorse.test.js）。
 *
 * 明确不判的（豁免——这些是正当的来源采信、事实陈述与概念分析）：
 *   · 正当来源采信：以**验证过程**为据（经过审计/同行评审/临床验证/
 *     官方统计/检测认证）——与「按身份下结论」的区别正是本维度的判据
 *     核心，良性集 16 条已覆盖；
 *   · 中性事实陈述：年龄/年代/产地被提及时无贬损结论（这个理论有两
 *     百年历史，但至今仍是基础/老系统运行了十年，迁移前要评估风险）；
 *   · 正当提问：「应届生能胜任这个岗位吗」——反问腿只收带质量名词的
 *     贬损反问（能适合……吗/能好到哪去/靠得住吗），不泛收「能……吗」；
 *   · 平衡比较：「进口设备和国产设备各有优势，要按实测数据选型」；
 *   · 评析这套话术本身（起源谬误是一种逻辑谬误/识别起源谬误）。
 */
'use strict';

// ─── 腿① SOURCE 来源点名（三类合并：人群身份 × 年代时间 × 出身机构）──
// 中文三支：a 人群身份 / b 年代时间 / c 出身机构与产地。
// 与 stereotype 的标签表刻意不同：那边收性别/种族/年龄泛称，本腿收
// **与观点或产品生产直接关联的来源角色**（提出的/写的/生产的/创办的），
// 性别歧视型句式整族不在此列（归 stereotype，见 B 组分工锁）。
const SOURCE_ZH = new RegExp(
  // a 人群身份（提出者/生产者/者的身份）
  '(?:年轻人|青年人|应届生|毕业生|新人|实习生|新手|小孩|年轻人|女生|男生|女人|男人|业余人|外行人|外行|非专业|自学(?:成才)?(?:的|者)?|没上过|非名校|专科生|二本|大专生|海归|外国人|老外|转岗|自由职业|大厂|裁员|草台班子|民间)' +
  // c 出身机构与产地（农村/外地/小作坊/国产/进口）
  '|(?:农村|外地|小地方|小县城|小镇|乡镇企业|小作坊|小厂|山寨|国产|进口|舶来|土产)' +
  // b 年代时间（多少年前/上个世纪/古代/老祖宗）
  '|(?:\\d+\\s*年前|上百年来|几百年前|两百年前|几十年前|很早以前|远古|古代|古时候|老祖宗|祖传|明清|清代|明代|元代|唐宋|唐朝|宋朝|清朝|明朝|民国|上个世纪|上世纪|旧社会|当年|那一年代)'
);

// 英文：from a freshman / written by an intern / made by a small workshop /
// from two centuries ago。三支：a person-status / b era / c origin place。
const SOURCE_EN = new RegExp(
  // a person-status（freshman/intern/amateur/outsider/...）
  "\\b(?:from|by|written\\s+by|made\\s+by|created\\s+by|proposed\\s+by|developed\\s+by|founded\\s+by|started\\s+by)\\s+(?:a|an|the)?\\s*(?:freshman|sophomore|intern|newbie|beginner|rookie|amateur|outsider|foreigner|dropout|self-taught|non-professional|mom-and-pop|garage|newcomer|new arrival|recent graduate|junior|youngster|college kid|folk remedy|folk wisdom|homemade|backyard)\\b" +
  // c origin place（small workshop/small town/rural/village）
  "|\\b(?:from|made\\s+(?:in|by)|built\\s+by|manufactured\\s+by|produced\\s+(?:in|by)|out\\s+of)\\s+(?:a|an|the)?\\s*(?:small\\s+town|village|rural\\s+area|small\\s+workshop|garage|backwater)\\b" +
  // b era（two centuries ago / last century / ancient / ancestors）
  "|\\b(?:from|of|dat(?:es|ing|ed)\\s+back\\s+to)\\s+(?:\\d+\\s+(?:decades|centuries)\\s+ago|the\\s+last\\s+century|ancient\\s+times|our\\s+ancestors|the\\s+old\\s+days)\\b" +
  // d standalone 起源形容词（无介词：A folk remedy ...）
  "|\\b(?:folk|homemade|backyard|hand-me-down|old-fashioned|domestic|imported)\\b",
  'i'
);

// ─── 腿② QUALITY 质量贬损推断（三类）────────────────────────────
// 中文三支：a 直接贬损形容词 / b 比较贬损 / c 反问贬损。
// 判据核心：贬损结论**由来源直接推出**（肯定不成熟/早就过时了），
// 不含验证过程词（证伪/推翻/实验/数据/证据——那些是正当评估）。
const QUALITY_ZH = new RegExp(
  // a 直接贬损结论（不成熟/不可靠/不值得听/好不到哪去/过时/见识短/有问题）
  '(?:肯定|一定|绝对|注定|势必|想必|多半|恐怕|自然|根本|向来|一贯)?(?:不成熟|不可靠|不可信|不足为信|不足为凭|不值一提|不值得|好不到哪去|靠不住|没保障|没保证|有问题|有毛病|见识短|目光短浅|浅薄|幼稚|片面|偏激|过时|落伍|落后|被淘汰|不行|不可取|纸上谈兵|站不住脚)' +
  // b 比较贬损（不如进口的成熟/比不上正规的/比不了名牌的——宾语必须是来源类名词）
  '|(?:肯定|一定|绝对|多半)?(?:不如|比不上|比不了|差(?:得)?(?:太)?远|逊色(?:于)?)(?:进口|国产|名牌|正规|专业|大厂|国外|西方|古人|前人|人工|天然|化学|科班)' +
  // c 反问贬损（能适合……吗/能好到哪去/靠得住吗/凭什么——只收带质量名词的反问）
  '|(?:能|可|怎么可能|凭什么|怎么能|哪能)(?:适合|适应|好|可靠|信|成熟|专业|正规|拿得出手|上台面)[^。？?]{0,6}(?:吗|么|呢|哪去)?？?' +
  '|(?:靠得住|信得过|值得听|值得信|拿得出手|入流)(?:吗|么|呢)'
);

// 英文：cannot be worth much / is definitely outdated / inferior to / not even read。
// 三支与中文对齐：a negative adjectives / b comparative inferiority /
// c rhetorical dismissal。
const QUALITY_EN = new RegExp(
  // a negative adjectives（cannot be worth / is definitely outdated / unreliable）
  "\\b(?:cannot|can't|couldn't|could\\s+not|must\\s+not|would\\s+not|won't|will\\s+not|is\\s+not|are\\s+not|isn't|aren't)\\s+(?:be\\s+|really\\s+|truly\\s+)?(?:worth|mature|reliable|trustworthy|trusted|relied\\s+on|credible|valid|sound|useful|relevant|taken\\s+seriously)\\b" +
  "|\\b(?:is|are)\\s+(?:definitely|certainly|obviously|surely|inherently|simply)\\s+(?:outdated|obsolete|immature|unreliable|inferior|flawed|naive)\\b" +
  "|\\b(?:outdated|obsolete|immature|unreliable)\\b" +
  // b comparative inferiority（inferior to / no better than / not as good as）
  "|\\binferior\\s+to\\b|\\bno\\s+better\\s+than\\b|\\bnot\\s+as\\s+(?:good|reliable|mature|credible)\\s+as\\b" +
  // c rhetorical dismissal（how could ... be / not even worth reading / can it be trusted）
  "|\\bhow\\s+(?:could|can)\\s+(?:a|an|the)?\\s*\\w+\\s+(?:from|by)\\b[^.]{0,40}?\\b(?:be|matter)\\b" +
  "|\\bnot\\s+even\\s+(?:worth\\s+)?(?:read|reads|reading|listening\\s+to|considering|bothering)\\b" +
  "|\\bcan\\s+(?:a|an|the)?\\s*\\w+\\s+(?:from|by)\\b[^.]{0,30}?\\b(?:be\s+)?(?:trusted|relied\\s+on|taken\\s+seriously)\\b",
  'i'
);

// ─── 豁免：评析这套话术本身 / 概念分析 ─────────────────────────
const META_EXEMPT_ZH = /(?:这|那就是|这就是|这正是|那正是一种|属于|属于一种)(?:一种|典型的|常见的|经典的|隐性|常见|典型|明显)?(?:起源谬误|基因谬误|诉诸出身|以出身论|来源歧视|出身论)|(?:起源谬误|基因谬误|genetic\s*fallacy|诉诸出身|以出身论|来源歧视|出身论)(?:是|属于|是一种|正是|属于|属于一种)(?:一种|典型的|常见的|经典的|隐性|常见|典型)?(?:谬误|谬说|逻辑错误|逻辑谬误|错误论证|非形式谬误|话术|手法|手段|策略|伎俩|套路|现象|问题|错误|歧视|偏见)/;
const META_EXEMPT_EN = /\b(?:genetic\s+fallacy|fallacy\s+of\s+genesis|appeal\s+to\s+origin|argument\s+from\s+origin)\s+(?:is|are)\s+(?:a\s+)?(?:fallacy|manipulation|tactic|rhetorical|technique|form\s+of|symptom\s+of|common)\b/i;

// ─── [r399] 词源谬误族（etymological fallacy）双腿常量 ─────────────────
// 腿① ETYM：词的词源/本义被引用（来源是「词的起源」而非「谁说的」）。
// 中文：源于/来源于/来自/本义是/原意是/古汉语里/从词源/本来是这个意思...
// 英文：comes from / derives from / literally means / originally meant /
// once meant / from the Latin(Greek) / etymologically / traces back to。
const ETYM_ZH = /(?:源于|来源于|来自于|来自|本义(?:是|指|上的)?|原义|原意(?:是|指)|本意(?:是|指)|最初的意思|本来(?:是|指|的意思|是这个意思)|原指|原本(?:是|指)|古义|在古汉语|古汉语里|古汉语中|从词源|词源上|字面(?:上)?的意思|这个词?本来|拆开来看|追根溯源)/;
const ETYM_EN = /\b(?:comes?\s+from|derives?\s+from|derived\s+from|originates?\s+from|literally\s+means?|originally\s+(?:meant|referred|signified|denoted|included|stood|was)|once\s+meant|from\s+the\s+(?:Latin|Greek|root|Old)|etymologically|traces?\s+back\s+to)\b/i;

// 腿② NORM：由词源推出当下含义/用法/资格的定义或规范结论。
// 中文：才算/才配叫/从一开始就是误用/违背本义/算不上真正的/就是对…背叛...
// 英文：is not a real / counts as true / no true / misuses the word /
// contradicts its real / distorts its proper。
// 边界：只收「由来源裁定现在」的规范结论，不收「反映了…认知」这类描述句。
const ETYM_NORM_ZH = /(?:才算|才称得?上|才配(?:叫|称|是)|根本不配|不配(?:叫|称|是)|从一开始就是(?:错|误用|用错|滥用|错的)|从一开始就背离|从一开始就偏|根本是误用|就是误用|纯属误用|是(?:一种)?误用|违背了?[^。！？；\n]{0,8}本义|背离了?[^。！？；\n]{0,8}本义|称不上[^。！？；\n]{0,6}本义|算不上真正的|根本算不上|就是对[^。！？；\n]{0,8}背叛)/;
const ETYM_NORM_EN = /\b(?:(?:is|are)\s+not\s+(?:a\s+|an\s+)?(?:real|true|proper|genuine|actual)|not\s+a\s+(?:real|true|proper|genuine)|no\s+true|counts?\s+as\s+(?:a\s+)?(?:real|true|proper|genuine)|misuses?\s+the\s+word|distorts?\s+its\s+(?:real|true|proper|original)|contradicts?\s+its\s+(?:real|true|proper|original)|so\s+only\s+.{0,40}(?:is|counts|qualifies))\b/i;

// 词源谬误族 META 豁免：评析「词源谬误」这套话术本身不判——句中点名词源
// 谬误的学名（词源谬误/诉诸词源/etymological fallacy）即视为元讨论（含
// 教科书引用该谬误作例子的情形）。双腿共现天然豁免绝大多数词源陈述，
// 此豁免专兜「既引用词源又下规范结论、且点名称作反面例子」的元陈述。
const ETYM_META_ZH = /(?:词源谬误|语源谬误|诉诸词源|以词源论|本义主义|词源主义|词源决定论)/;
const ETYM_META_EN = /\b(?:etymological\s+fallacy|appeal\s+to\s+etymology|argument\s+from\s+etymology)\b/i;

// ─── [r412] 腿② NORM2：推断式规范结论（词源谬误族的推论变体）──────────
// 结构：推断连接词 × 当下时点标记 × 「其实/本质上/说到底是在」裁定形。
// 三支（任中其一即命中，缺一不判——与词源腿共现才生效）：
//   a 实是在裁定（所以现在……其实是在……/就是说……就是在……）；
//   b 本质裁定（本质上是在/说到底是在/骨子里是在/无非是/不过是）；
//   c 立场裁定（就是在为……背书/站台/正名/辩护/洗地/铺路/开脱）。
// 与存量 NORM 直陈形（才算/不配叫/误用）正交：那边裁「词的资格」，
// 这边裁「用词者的当下行为/立场」。裸名词自查：「所以现在……是
// 在……」去掉「其实」仍命中（a 支本身即含裸形分支）。
const ETYM_NORM2_ZH = new RegExp(
  // a 实是在裁定：推断连接词（可省略）＋当下时点（现在/如今/当下/今天/时下/当今，可省略）＋其实/事实上/说到底/本质上/骨子里/说白了＋是在/就是在
  '(?:所以|因此|因而|故|可见|足见|这说明|那就是说|也就是说|就是说|换言之|换句话说)?[^。！？；\\n]{0,12}?(?:其实|事实上|说到底|本质上|骨子里|说白了|老实说|实际上)[^。！？；\\n]{0,10}?(?:就是)?在(?:鼓吹|抬高|贬低|偷换|歪曲|滥用|误用|美化|洗白|抹黑|贬损|抬高|神化|丑化|篡改|背叛|否定|肯定|支持|反对|吹捧|捧杀)?[^。！？；\\n]{0,14}' +
  // b 本质裁定：本质上/说到底/骨子里/无非是/不过是/不外是＋是（动词）
  '|(?:本质上|说到底|骨子里|归根到底|归根结底|无非是?|不外是?|不过是?)[^。！？；\\n]{0,16}' +
  // d 裸形「就是在＋裁定动词」：无「其实/本质上」前缀的直接推断裁定
  // （就是说……就是在抬高对方 / 所以今天……就是在偷换概念）。161 轮
  // 教训自查：本支即 a 支去掉裁定副词后的裸形，动词表与 a 支共用。
  '|(?:就是说|也就是说|那就是说|换言之|换句话说|所以|因此|因而|故|可见|足见|这说明)[^。！？；\\n]{0,18}?就是在(?:鼓吹|抬高|贬低|偷换|歪曲|滥用|误用|美化|洗白|抹黑|贬损|神化|丑化|篡改|背叛|否定|吹捧|捧杀|浪费|犯罪|耍流氓|说漂亮话|抬轿子)' +
  // c 立场裁定：就是在（为|替|给）……背书/站台/正名/辩护/洗地/铺路/开脱/张目
  '|就是在(?:为|替|给|帮)[^。！？；\\n]{0,12}(?:背书|站台|正名|辩护|洗地|铺路|开脱|张目)'
);
// EN：so what they call X is really just Y / thus calling it Z is merely ... /
// it is really glorifying ... / in essence it is nothing but ...
const ETYM_NORM2_EN = new RegExp(
  // a really just / really only + be/is/means
  "\\b(?:so|thus|therefore|hence|which\\s+means|that\\s+means|in\\s+other\\s+words|in\\s+effect)\\b[^.]{0,60}?\\b(?:is|are|was|were)\\s+(?:really\\s+)?(?:just|only|merely|simply|nothing\\s+but|essentially|at\\s+its\\s+core)\\b[^.]{0,40}" +
  // b in essence / at its core / boils down to
  "|\\b(?:in\\s+essence|at\\s+its\\s+core|boils?\\s+down\\s+to|amounts?\\s+to\\s+nothing\\s+(?:but|more\\s+than))\\b[^.]{0,50}" +
  // c really glorifying / just rebranding / merely relabeling / nothing but ...
  "|\\b(?:really|just|merely|simply)\\s+(?:glorifying|rebranding|relabeling|whitewashing|laundering|sanitizing|euphemizing|elevating|demeaning|distorting)\\b",
  'i'
);

// [r412] NORM2 族反谬误对冲：明确指出词义随时代变化/本义≠当下用法的
// 句子（「本义是X，但现代用法早已泛化」「词义会随时代演变」）只有腿①
// ＋对冲、无规范断言——对冲形把「引用词源」降格为事实陈述的引子，不判。
const ETYM_HEDGE_ZH = /(?:词义|语义|词意|含义|用法)?(?:会|随|已经|早已|都在)?(?:随[着]?[^。！？；\n]{0,6}(?:演变|变化|变迁|发展|更替|扩展|泛化|转移|漂移)|发生了?[^。！？；\n]{0,4}(?:变化|演变|引申|扩展|转移)|早已(?:泛化|演变|变化|转移|引申)|已经(?:泛化|演变|变化|引申|转移|不同)|不能(?:简单|机械|直接)?(?:地)?(?:以|用|拿|按)[^。！？；\n]{0,4}本义|不等于[^。！？；\n]{0,6}(?:当下|现在|如今|今天)|不代表[^。！？；\n]{0,6}(?:当下|现在|如今|今天)|并不决定[^。！？；\n]{0,8}|不应当[^。！？；\n]{0,4}(?:以|用|拿|按)[^。！？；\n]{0,4}本义)/;
const ETYM_HEDGE_EN = /\b(?:word\s+meanings?\s+(?:change|shift|evolve|drift|broaden)|semantic\s+(?:change|shift|drift)|meaning\s+has\s+(?:changed|shifted|evolved|broadened)|no\s+longer\s+means|does\s+not\s+(?:determine|decide|govern)\s+(?:its\s+)?(?:current|modern|present|today'?s)\s+use|meaning\s+evolves?|evolved?\s+over\s+time|shifted?\s+over\s+time)\b/i;

// ─── [r418] 新族：考证式古人印证增信（etymological fallacy 增信方向）──
// 存量词源族（r399/r412）裁「本义→定义/用法/资格」（才算/不配叫/其
// 实在……），方向是**规范贬损**；本族是同一谬误结构的**增信背书**方
// 向：引用词源不是为了裁定当下用法，而是为了给某个立场增信——
// 「这个词源于X，可见古人早已懂得Y的真谛」，用「起源的古老性」冒充
// 「命题的真理性」。判据同为双腿共现（腿①沿用 ETYM，缺一不判）：
//   腿② ENDORSE 古人印证增信 = 古人族名词 × 认知/积淀动词，
//      三支：a 古人族 + ≤12字 + 认知动词（古人早就把道理说透了）；
//      b 古人族 + 早已/早就/果然 + ≤14字 + 认知或积淀动词（祖先
//      早已把骨气刻进文化基因 / 先贤果然早已参透天道）；
//      c 可见/足见/足以证明 + ≤10字 + 古人族 + ≤14字 + 认知动词
//      （可见古希腊人早已懂得自由的真谛）。EN 对应 ancients/Greeks/
//      forefathers + already/long ago + understood/figured out，以及
//      shows/proves + 古人族 + already + understood 两形。
// 豁免三层：ETYM_META（评析词源谬误话术本身）、ETYM_HEDGE（词义演
// 变/本义≠当下用法的反谬误陈述）、ENDORSE_REFUTE（「缺乏文献依据/
// 词源不能证明思想史」——明确指出词源不足以证明思想史内容的反驳句
// 只有腿①＋反驳，是反面教材不是运用）。与既有维度的射程分工：
// appeal_to_tradition 管「老祖宗传下的就是好」（传统整体承袭），本
// 族管**词源/本义**这一语言事实被用来给立场增信；genetic 存量路由管
// 来源→质量贬损或定义裁定，本族管来源→可信性背书，方向相反、措辞
// 结构正交（无「才算/不配叫/其实是在」裁定词，有「古人早已懂得」
// 印证结构）。
// 池化探针 r418（coordination/agent4/probes/r418-probe-pool.js，HEAD
// 6.8.208）：四家族同池定拨 F1——攻击穿透 12/13（全池最高）、模块层
// 真零命中 0/13、良性 0/11 本族误伤。真升级②：既有第 131 维的全新
// 措辞家族，维度计数不变、src/index.js 零改动（同 r406-r417）。

// 古人族名词（中文）：古人/先贤/先民/祖先一族 + 古希腊人/古罗马人一类
// 复合形（「古希腊人」中「古」与「人」被「希腊」隔开，裸「古人」不命中）。
const ENDORSE_NOUN_ZH = '(?:古圣先贤|先贤|先哲|先圣|前贤|古圣|往圣|先民|先祖|祖先|老祖宗|前人|古人|古希腊人|古罗马人|古埃及人|古印度人|古巴比伦人|古代希腊人|古代罗马人|古代先哲|古代圣贤|上古之人|远古先民)';
// 认知/积淀动词表（中文）：懂得/看透/参透一族 + 刻进/融入/积淀一族。
const ENDORSE_VERB_ZH = '(?:懂得|看懂|看透|参透|悟透|洞察|看穿|明白|理解|想通|说透|讲透|抵达|达到|深知|领会|悟出|悟到|认识|想到|预见|预示|晓得|刻进|融入|写入|浓缩|积淀|渗透|内化)';
// 腿②（中文）三支：a 古人族＋认知动词；b 古人族＋早已族＋认知/积淀动词；
// c 可见/足见/足以证明＋古人族＋认知动词。
const ENDORSE_ZH = new RegExp([
  '(?:' + ENDORSE_NOUN_ZH + ')[^。！？；]{0,12}(?:' + ENDORSE_VERB_ZH + ')',
  '(?:' + ENDORSE_NOUN_ZH + ')[^。！？；]{0,4}(?:早已|早就|已然|果然|果真|原来|想必|定然|早)[^。！？；]{0,14}(?:' + ENDORSE_VERB_ZH + ')',
  '(?:可见|足见|足以证明|可见一斑|印证了|说明了|证明)[^。！？；]{0,10}(?:' + ENDORSE_NOUN_ZH + ')[^。！？；]{0,14}(?:' + ENDORSE_VERB_ZH + ')',
].join('|'));
// 腿②（英文）两支：a 古人族＋already/long ago＋认知动词（the ancients
// had it figured out all along）；b shows/proves＋古人族＋already＋认知
// 动词（which shows the Greeks already understood compassion）。
const ENDORSE_EN = new RegExp([
  "\\b(?:the\\s+)?(?:ancients|forefathers|forebears|sages|philosophers|greeks|romans|ancestors|people\\s+back\\s+then)\\b[^.]{0,30}?\\b(?:already|long\\s+ago|all\\s+along|had\\s+it)\\b[^.]{0,25}?\\b(?:understood|knew|figured\\s+out|grasped|saw|recognized|comprehended|discovered|realized|mastered)\\b",
  "\\b(?:shows?|proves|proving|demonstrates?|indicating|meaning)\\b[^.]{0,40}?\\b(?:the\\s+)?(?:ancients|greeks|forefathers|forebears|sages|ancestors)\\b[^.]{0,25}?\\b(?:already|long)\\b[^.]{0,20}?\\b(?:understood|knew|figured\\s+out|grasped|comprehended|discovered|realized)\\b",
].join('|'), 'i');
// [r418] 本族反谬误对冲：明确指出「词源不足以证明思想史内容」的反驳句
// （所谓古人早已想通的说法缺乏文献依据 / 词源不能证明思想史）——只有
// 腿①＋反驳，是反面教材不是运用，不判。
const ENDORSE_REFUTE_ZH = /(?:缺乏|缺少|没有|无)[^。！？；]{0,10}(?:文献依据|文献|史料依据|史实依据|实据|证据|依据|证明)|(?:不能|无法|不足以|未必|难以)[^。！？；]{0,8}(?:证明|说明|印证)[^。！？；]{0,10}(?:思想史|古人|先贤|先民|祖先|历史|智慧|真谛|道理|境界|水平)/;
const ENDORSE_REFUTE_EN = /\b(?:lacks?|without|little|no)\s+(?:documentary\s+|historical\s+|textual\s+|archaeological\s+)?(?:evidence|basis|support|proof)\b[^.]{0,30}\b(?:that|showing|to\s+show)\b|(?:cannot|can'?t|does\s+not|doesn'?t)\s+(?:be\s+)?prov(?:e|en|ing)\b[^.]{0,40}\b(?:that|what|thought|thinking)\b/i;

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkGeneticFallacy(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const SOURCE_ZH_ = R.SOURCE_ZH || SOURCE_ZH;
  const SOURCE_EN_ = R.SOURCE_EN || SOURCE_EN;
  const QUALITY_ZH_ = R.QUALITY_ZH || QUALITY_ZH;
  const QUALITY_EN_ = R.QUALITY_EN || QUALITY_EN;
  const META_EXEMPT_ZH_ = R.META_EXEMPT_ZH || META_EXEMPT_ZH;
  const META_EXEMPT_EN_ = R.META_EXEMPT_EN || META_EXEMPT_EN;

  // 在评析这套话术 → 不是运用它
  if (META_EXEMPT_ZH_.test(text) || META_EXEMPT_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  const sourceZh = SOURCE_ZH_.test(text);
  const sourceEn = SOURCE_EN_.test(text);
  const qualityZh = QUALITY_ZH_.test(text);
  const qualityEn = QUALITY_EN_.test(text);

  // 双腿共现：来源点名 × 质量贬损推断（缺一不判）
  if ((sourceZh || sourceEn) && (qualityZh || qualityEn)) {
    return {
      hit: true,
      score: 0.6,
      count: 1,
      detail: isZh ? '起源谬误×来源质量推断(zh)' : '起源谬误×来源质量推断(en)',
    };
  }

  // ─── [r399] 新路由：词源谬误族（etymological fallacy）─────────────
  // 双腿共现：腿① 词源/本义标记 × 腿② 定义/规范结论（缺一不判）。
  // 与存量 SOURCE×QUALITY 族正交：存量收「谁说的/哪生产的/什么年代的」，
  // 本族收「词的起源」，存量结论是质量贬损，本族结论是定义/用法/资格
  // 裁定。良性词源陈述（事实陈述/反谬误陈述/语言学教学）只有腿①，
  // 双腿共现天然豁免；union 语义，与存量路由互补不冲突。
  const ETYM_ZH_ = R.ETYM_ZH || ETYM_ZH;
  const ETYM_EN_ = R.ETYM_EN || ETYM_EN;
  const ETYM_NORM_ZH_ = R.ETYM_NORM_ZH || ETYM_NORM_ZH;
  const ETYM_NORM_EN_ = R.ETYM_NORM_EN || ETYM_NORM_EN;
  const ETYM_META_ZH_ = R.ETYM_META_ZH || ETYM_META_ZH;
  const ETYM_META_EN_ = R.ETYM_META_EN || ETYM_META_EN;

  const etymZh = ETYM_ZH_.test(text);
  const etymEn = ETYM_EN_.test(text);
  const etymNormZh = ETYM_NORM_ZH_.test(text);
  const etymNormEn = ETYM_NORM_EN_.test(text);

  if ((etymZh || etymEn) && (etymNormZh || etymNormEn)) {
    // 评析「词源谬误」这套话术本身 → 不是运用它
    if (ETYM_META_ZH_.test(text) || ETYM_META_EN_.test(text)) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
    return {
      hit: true,
      score: 0.6,
      count: 1,
      detail: isZh ? '词源谬误×本义规范推断(zh)' : '词源谬误×本义规范推断(en)',
    };
  }

  // ─── [r412] 新路由：推断式规范结论（词源谬误族推论变体）────────────
  // 双腿共现：腿① 词源/本义标记 × 腿② NORM2 推断式规范结论。
  // 存量路由裁「词的资格」（才算/不配叫/误用），本路由裁「用词者的当
  // 下行为/立场」（所以现在……其实是在……）。与存量路由 union 语义：
  // 存量命中走存量，本路由兜住其射程外的推断形变体。
  // 对冲组先于判定：明确指出词义演变/本义≠当下用法的句子，是引用词源
  // 的事实陈述而非规范裁定，不判（防误伤语言学正确陈述）。
  const ETYM_NORM2_ZH_ = R.ETYM_NORM2_ZH || ETYM_NORM2_ZH;
  const ETYM_NORM2_EN_ = R.ETYM_NORM2_EN || ETYM_NORM2_EN;
  const ETYM_HEDGE_ZH_ = R.ETYM_HEDGE_ZH || ETYM_HEDGE_ZH;
  const ETYM_HEDGE_EN_ = R.ETYM_HEDGE_EN || ETYM_HEDGE_EN;

  if (etymZh || etymEn) {
    if (ETYM_META_ZH_.test(text) || ETYM_META_EN_.test(text)) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
    if (ETYM_HEDGE_ZH_.test(text) || ETYM_HEDGE_EN_.test(text)) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
    if (ETYM_NORM2_ZH_.test(text) || ETYM_NORM2_EN_.test(text)) {
      return {
        hit: true,
        score: 0.6,
        count: 1,
        detail: isZh ? '词源谬误×本义推断裁定(zh)' : '词源谬误×本义推断裁定(en)',
      };
    }
  }

  // ─── [r418] 新路由：考证式古人印证增信（词源谬误族增信方向）────────
  // 双腿共现：腿① 词源/本义标记 × 腿② ENDORSE 古人印证增信。
  // 存量路由裁「本义→定义/资格/当下行为裁定」（规范贬损方向），本路
  // 由裁「本义→古人早已懂得→立场可信」（增信背书方向），同一谬误结
  // 构的反方向，措辞结构正交（见常量块射程分工注释）。对冲三层先于判
  // 定：ETYM_META（评析词源谬误本身）、ETYM_HEDGE（词义演变反谬误陈
  // 述）、ENDORSE_REFUTE（词源不足以证明思想史的反驳句）。
  const ENDORSE_ZH_ = R.ENDORSE_ZH || ENDORSE_ZH;
  const ENDORSE_EN_ = R.ENDORSE_EN || ENDORSE_EN;
  const ENDORSE_REFUTE_ZH_ = R.ENDORSE_REFUTE_ZH || ENDORSE_REFUTE_ZH;
  const ENDORSE_REFUTE_EN_ = R.ENDORSE_REFUTE_EN || ENDORSE_REFUTE_EN;

  if (etymZh || etymEn) {
    if (ETYM_META_ZH_.test(text) || ETYM_META_EN_.test(text)) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
    if (ETYM_HEDGE_ZH_.test(text) || ETYM_HEDGE_EN_.test(text)) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
    if (ENDORSE_REFUTE_ZH_.test(text) || ENDORSE_REFUTE_EN_.test(text)) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
    if (ENDORSE_ZH_.test(text) || ENDORSE_EN_.test(text)) {
      return {
        hit: true,
        score: 0.6,
        count: 1,
        detail: isZh ? '词源谬误×古人印证增信(zh)' : '词源谬误×古人印证增信(en)',
      };
    }
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkGeneticFallacy,
  __internals: () => ({ SOURCE_ZH, SOURCE_EN, QUALITY_ZH, QUALITY_EN, META_EXEMPT_ZH, META_EXEMPT_EN, ETYM_ZH, ETYM_EN, ETYM_NORM_ZH, ETYM_NORM_EN, ETYM_META_ZH, ETYM_META_EN, ETYM_NORM2_ZH, ETYM_NORM2_EN, ETYM_HEDGE_ZH, ETYM_HEDGE_EN, ENDORSE_ZH, ENDORSE_EN, ENDORSE_REFUTE_ZH, ENDORSE_REFUTE_EN }),
};
