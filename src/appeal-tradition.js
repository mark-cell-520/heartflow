/**
 * src/appeal-tradition.js — 诉诸传统检测器（第 61 个判别维度）
 *
 * v6.8.2 新增。心虫 decision 本体选出（round-484-decide.js，A 得 0.80 分）。
 * 探测器 + 本轮复测（scripts/round-484-att-probe.js，直调 src/gate.js）：
 * 16 条攻击样本 11 条穿过硬闸门（gate=pass），8 条良性 0 误伤。
 *
 * 辨别的族：「以传统/惯例/历来如此压制改变或异议」——
 * 把「从来如此」当作「必须如此」的充分理由，用来挡掉质疑与改革。
 *
 * 为什么现有维度拦不住：
 *   · fallacies 下已有同名子标签 appeal_to_tradition，但只收极窄的
 *     两三个正则（「自古以来…所以…应该继续」等），覆盖不到本族主体句式，
 *     且 fallacies 是聚合维度、子标签不能在 findings 里独立归因。
 *   · unsupported_claim 管「无依据断言」，本族句子不需要证据，
 *     它的问题在论证结构：用历史频率置换正当性。
 *   · absolute_claim 管绝对化措辞，不识别「传统压制」这一语义结构。
 *
 * 判据（两类交叉，两者同时在场才判定）：
 *   T1 传统在场 —— 传统/老规矩/惯例/自古以来/祖祖辈辈/前人/世代传承
 *       tradition / custom / convention / always been done / forefathers
 *   T2 压制改变或异议 —— 不许改/不容置疑/改变就是背叛/就该继续/不需讨论
 *       must continue / cannot be questioned / not negotiable / stop arguing
 *   → verify 级：需给出改变或维持的真实理由，不能只说「历来如此」。
 *
 * [r259 扩展·真升级②] 4 号探针（coordination/agent4/probes/r259-probe-round1.js）
 * 在既有判据上补**全新措辞家族**：攻击 38 条穿透 34 条（89%），穿透样本
 * 全部落在两条腿的措辞射程外（不是判据结构问题，是词表问题）。本模块已
 * 接线（src/index.js require + 判定登记），故扩展 **live 生效**，维度计数
 * 214 不变，src/index.js 零改动。补入内容：
 *   · 腿①传统在场新族 ZH 8 支 / EN 9 支（秘方古方土办法、老字号百年传承、
 *     古法老法子、祖宗祖训家风族规祖制、古圣先贤、旧俗乡俗陈规、
 *     祖上传下来代代相传、清宫宫廷秘方、老师傅；EN time-tested/
 *     tried-and-true、handed down/passed down、heritage/ancestral、
 *     the old ways/old-school/folk wisdom、status quo、established order、
 *     the good old days/back in the day、good enough for our forefathers）；
 *   · 腿②压制改变/异议新族 ZH 8 支 / EN 9 支（轮不到你+动词、碰不得/
 *     动不得、坏了规矩/先例不能开、维持现状/一切照旧、少插嘴/由不得你、
 *     标新立异/节外生枝、裸说改就改、不容置喙；EN rock the boat、
 *     keep/maintain/preserve the status quo、don't fix what isn't broken、
 *     leave well enough alone、hold the line、deviate from、not for us to
 *     change/nobody should touch、untouchable/sacred）；
 *   · 腿③正当性/优越结论新族 ZH 6 支 / EN 7 支（肯定靠谱/最管用、
 *     自然有它的道理、比X强、照做就行、几代人验证过、还能有问题吗；
 *     beats anything modern、proven over the years/stood the test of time、
 *     worked fine for my grandfather、good enough for us、must work/
 *     must be right、so they are fine for me）——「老祖宗传下来的秘方，
 *     治这个病最管用」这类**传统在场×质量担保**结论此前整族射程外；
 *   · 新增 concessive-debate 豁免（HEDGE，仅作用于新路由）：让步标记
 *     × 评估/数据标记**同时**在场才豁免——「现状一直运行良好，不过新
 *     数据建议我们重新评估」是在呈现争论，不是在以传统压制改变；
 *   · 新路由采用**句级共现**（两腿落在同一句内）替代旧路由的全文共现，
 *     并沿用防自证守卫（两腿须一对零重叠匹配）。
 *
 * 明确不判的（这些是正当陈述）：
 *   · 描述传统而不压制：「传统节日有丰富的民俗」
 *   · 支持合理变革：「老规矩如果不合理也应该改」
 *   · 兼容性引用历史：「公司沿用旧命名规范只为兼容历史代码」
 *   · 在评析这套论证：「诉诸传统是一种逻辑谬误」
 *
 * [r277 扩展·真升级②] 4 号探针（coordination/agent4/probes/r277-probe-pool.js）
 * 逻辑谬误家族轮：10 条攻击 9 条穿透、良性 8 条零误伤。补入内容：
 *   · 腿①新族 ZH t10 时间跨度口语形（千百年来/多少代人/一辈辈）、
 *     t11 牌子口碑年资（老牌子/金字招牌/牌子立了上百年）；EN e11
 *     has been around for centuries、e12 reputation spans generations；
 *   · 腿②新族 ZH s10 别瞎折腾族、s11 不能丢族、s12 还是得守族；
 *     EN e13 see no reason to stop、e14 who are we to change、
 *     e15 keep X as it has always been；e3 扩「do not go fixing」；
 *   · 腿③新族 ZH c8 封闭反问错位形（还能有错？/不可能有问题）；
 *     EN c8 how could it be wrong；
 *   · 新分支全部走既有句级共现路由④/⑤与 concessive-debate 豁免，
 *     live 生效，维度计数不变、src/index.js 零改动。
 */

'use strict';

// ─── T1: 传统在场 ────────────────────────────────────
// 中文：指向历史传承的名词与时间跨度
const TRADITION_ZH = /传统|老祖宗|祖祖辈辈|祖祖代代|老一辈|古人|前人|前辈|历来|自古以来|世世代代|世代相传|祖传|传承(?:了)?(?:至今|下来|几)|流传(?:了)?(?:至今|下来)|老规矩|老例|旧例|旧制|成规|约定俗成|老办法|老一套|多年(?:的)?(?:习惯|规矩|惯例|做法)|多年(?:如此|下来)|一直(?:都)?(?:是)?(?:这么|这样)|多年如此|自古以来|从来都是|自古至今|几百年|数百年|上千年|数千年|古已有之|前人留下|老祖宗留下|传下来的|传下来至今|中华(?:民族)?传统|文化传统|风俗习惯|习俗|惯例|沿袭|常规|历年|历来如此|一直都是|(?:别人|大家|所有人|人人|全世界|其他人|身边的人|同行(?:们)?|同行们|周围的人|众人)(?:都|全都|也|向来|历来|从来|一直|全)*(?:是)?(?:这么|这样)|(?:前人|祖先|前辈|老一辈|古人|上代|上辈|祖宗|先人)(?:定|立|定下|立下|留下|传下)(?:的)?(?:规矩|老规矩|制度|传统|惯例)/;

// 英文：tradition / custom / convention / 时间跨度 / 祖先主体
// 边界：单独出现即在场，判定仍需与 T2 交叉，故不会误伤描述性陈述。
// [r259 修缺] `centuries?-?old` 的 `?` 只作用于 `s`——该支自 v6.8.2 起
// **永远匹配不到 "century-old"**（只能匹配 "centurie-old"/"centuries-old"），
// 是一条静默失效的腿①分支。改为 `centur(?:y|ies)-?old`。
const TRADITION_EN = /\btradition(?:ally|al)?\b|\bcustom(?:ary)?\b|\bconventions?\b|\bfor\s+(?:generations|centuries|decades|hundreds\s+of\s+years|as\s+long\s+as)\b|\b(?:our|the)\s+(?:forefathers|ancestors|forebears|predecessors|predecessors)\b|\b(?:established|set)\s+(?:by\s+)?(?:our|the)\s+(?:forefathers|ancestors|predecessors)|\bthe\s+way\s+(?:it|we|things)\s+(?:has|have|had)\s+always\s+been\b|\b(?:has|have|had)\s+always\s+(?:\w+\s+){0,2}this\s+way\b|\balways\s+been\s+(?:done|that\s+way|this\s+way|the\s+practice|the\s+norm)\b|\blong-?standing\b|\btime-?honou?red\b|\bsince\s+time\s+immemorial\b|\bthe\s+old\s+way\b|\bby\s+precedent\b|\bcentur(?:y|ies)-?old\b/i;

// ─── T3: 从众基数在场 × 点名对方异议（多人从众施压族） ──────────────
// 边界：不要求出现「传统/历来」名词——本族的话术机制是「多数人这样，
// 你凭什么不同意」，用人数置换正当性，与 T1 传统压制是两种不同的置换。
// 从众基数词
const CROWD_ZH = /(?:大家|别人|其他人|所有人|人人|全?公司|同行(?:们)?|周围人(?:们)?|身边人(?:们)?|身边的人(?:们)?|众人|同事们|同学们|大多数人|不少人|很多人|全场|全国|同志(?:们)?|兄弟们|姐妹们)(?:都|全都|也|一向|向来|历来|从来|一直|一个个|各自)?(?:是)?(?:这么|这样|那样)?|别人|其他人/;
const CROWD_EN = /\b(?:everyone(?: else)?|everybody(?: else)?|all(?: the)? (?:other|rest)(?: \w+)?|nobody else|no one else|the other \w+|most (?:people|others|users|teams|reviewers)|others)\b/i;

// T3b 点名对方异议：把「只有你」拎出来
const SINGLE_OUT_ZH = /(?:就|只有|唯独|偏偏|只好|惟有)(?:你|你们)(?:一个(?:人)?)?(?:说(?:了)?)?(?:在)?(?:特殊|另类|搞特殊|与众不同|意见|反对|质疑|提意见|挑刺|不同意|受不了|有疑问|有意见|事儿多|毛病|挑剔|唱反调|唱对台戏|不合群|难搞|不好相处|做不了|办不到|完成不了)|(?:为何|为什么)(?:又)?(?:只有|就|偏偏)(?:你|你们)(?:在)?(?:反对|质疑|提意见|挑刺|不同意|受不了|有疑问|有意见|事儿多|毛病|挑剔|唱反调|不合群|难搞|不好相处|问题多|做不了|办不到|完成不了)|(?:怎么|为何|为什么)(?:就|偏|偏偏)?(?:你|你们)(?:受不了|特殊|另类|与众不同|事儿多|毛病|挑剔|难搞|不好相处|问题多|意见多|有意见|做不了|办不到|完成不了|有疑问)|(?:你|你们)(?:凭什么|凭什么敢)(?:例外|特殊|与众不同|反对|质疑|不一样|有意见|不同意)/;
const SINGLE_OUT_EN = /\b(?:why|how come)\s+(?:is|are|do|does)?\s*(?:only\s+)?(?:you|your \w+)\s+(?:the only one\s+)?(?:complaining|objecting|arguing|struggling|having (?:a )?problem|making a fuss|causing trouble|questioning|disagreeing|unhappy|dissatisfied|upset)|(?:only|just)\s+(?:you|your \w+|your team)\s+(?:is|are|has|have|seems? to have|thinks?|objected?|objects?|complained?|raised|disagree[ds]?|struggl(?:es|ing))\b/i;
// ─── T2: 压制改变或异议（传统族） ────────────────────────────────
// 中文：否定改变 / 要求维持 / 禁止质疑 / 把改变定性为背叛
const SUPPRESS_ZH = /(?:所以|因此|因而|就该|那就|必须|只能|应当|应该|理应|自然|当然|只能)(?:继续|保持|维持|照旧|沿用|守住|延续|执行|传承)|(?:不能|不许|不准|不得|不可以|不该|不应该|绝不允许|绝不允许|不容)(?:擅自|轻易|随便|任意)?(?:说)?(?:改|变更|改变|更改|变动|修改|推翻|质疑|怀疑|挑战|打破|破例|违背|违反|背离)|(?:不容|不许|不容许|绝不容|绝不容许|不允许|不容许)(?:讨论|商量|置疑|质疑|争议|擅自|随意)(?:擅自|随意)?(?:更改|变更|修改|改动|推翻|改变|质疑|批评)|(?:没有|无)(?:商量|讨论|争议)的(?:余地|空间)|(?:改变|更改|变更|修改|改革|说改就改|说变就变|轻言)(?:的人|者|想法|念头|提议)?(?:是|就是|等于|都是|算|都算)(?:对)?(?:传统|规矩|惯例|祖制|祖宗)(?:的)?(?:背叛|忘本|数典忘祖|破坏|亵渎|大逆不道|对不起)|(?:任何|一切|所有)(?:的)?(?:改变|变更|更改|改革)(?:都)?(?:是|算)(?:对)?(?:传统|规矩|惯例)的?(?:背叛|破坏|忘本|亵渎)|(?:不需要|无须|不必|不用)(?:质疑|怀疑|讨论|争辩|争论)|(?:怎么|为何|为什么)(?:就|偏)?(?:你|你们)?(?:特殊|另类|搞特殊|与众不同)|(?:就|只有|偏偏)(?:你|你们)(?:在)?(?:特殊|另类|搞特殊|与众不同)|(?:你|你们)(?:凭什么|凭什么敢)(?:例外|特殊|与众不同|反对|质疑|不一样)|(?:为什么|为何)(?:又)?只有(?:你|你们)(?:在)?(?:反对|质疑|提意见|挑刺|不同意)|照(?:老规矩|旧例|惯例)|按(?:老规矩|惯例|旧例)(?:办|执行|处理)|前人(?:定|立|立下)的(?:规矩|规矩)|古已有之|(?:不能|不得)(?:说改就改|说变就变)|(?:改变|更改|变更|改革|说改就改|说变就变|轻言)(?:的人|者|想法|念头|提议)?(?:是|就是|等于|算|都算|便是|那是)(?:数典忘祖|忘本|不肖|忤逆)|(?:绝不|绝不)(?:能)?(?:改变|更改|变更)/;

// 英文：维持指令 / 禁止质疑 / 终止异议 / 改变定性为破坏
const SUPPRESS_EN = /\b(?:so|therefore|thus|hence)?\s*(?:we\s+|you\s+|it\s+)?(?:must|should|ought\s+to|need\s+to|have\s+to|has\s+to)\s+(?:continue|keep|maintain|preserve|uphold|stick\s+to|follow|carry\s+on|stay\s+the\s+course)|\b(?:cannot|can'?t|must\s+not|should\s+not|shouldn'?t|may\s+not|is\s+not\s+to\s+be|are\s+not\s+to\s+be)\s+(?:be\s+)?(?:changed|altered|questioned|challenged|tampered\s+with|revised|overturned|revisited|broken|undone|second-?guessed)|\b(?:not|never|no\s+longer)\s+(?:up\s+for\s+debate|negotiable|open\s+to\s+(?:question|debate|challenge)|to\s+be\s+questioned)\b|\b(?:would|will|to|would)\s+break\s+with\b|\bstop\s+(?:arguing|questioning|complaining|whining|second-?guessing)\b|\band\s+that(?:'s|\s+is)\s+(?:final|that)\b|\bend\s+of\s+(?:discussion|story|debate)\b|\bit\s+has\s+(?:served|worked|treated)\s+(?:us|them|everyone|the\s+company|the\s+firm|everybody)\s+well\b|\b(?:has|have)\s+(?:served|worked)\s+(?:us|them|everyone|the\s+company)\s+well/i;

// ─── 豁免：评析/引述这套论证本身 ───────────────────────────
// 判据边界：句中出现「诉诸传统」这个谬误名 + 定性词，是在评析该论证，
// 不是在运用它——同 fallacies 的 meta-discourse 豁免铁律。
const META_EXEMPT_ZH = /诉诸传统|诉诸惯例|诉诸习俗|拿传统当(?:理由|挡箭牌)/;
const META_EXEMPT_EN = /\bappeal\s+to\s+tradition\b|\btraditional(?:ism)?\s+fallacy\b/i;
const QUALIFY_ZH = /谬误|谬说|逻辑错误|错误论证|站不住脚|不成立|并不成立|并不正确|是错的|有问题|值得(?:怀疑|商榷|反思)/;
const QUALIFY_EN = /\bfallacy\b|\binvalid\b|\bdoesn'?t\s+(?:hold|follow|work)\b|\bnot\s+(?:a\s+)?(?:valid|sound)\s+(?:argument|reason)\b|\bquestionable\b|\bflawed\b/i;

// ═══════════════════════════════════════════════════════════════════
// [r259] 全新措辞家族分支表（逐支可注入，供负例脚本逐支删除验证承重）
// ═══════════════════════════════════════════════════════════════════

// ─── 腿①新族（中文 8 支）：历史传承的具象载体 ───────────────────
// 铁律同 r257：每个分支的首支不得带前导 `|`（`new RegExp('|A|B')` 含
// 一条空分支，会在每个位置匹配空串，把任意文本判成两腿齐备）。
const TRAD_ZH_BRANCHES = {
  // t1 秘方/古方/土办法（经验传承的载体）
  t1_recipe: /秘方|古方|老方子|土办法|土法子|偏方/,
  // t2 老字号/百年传承（商业传统的年资标记）
  t2_old_brand: /(?:百年)?老字号|百年老店|百年传承|传承百年|百年工艺|百年老配方/,
  // t3 古法/老法子（工艺传承）
  t3_ancient_method: /古法|老法子|旧法|老祖宗(?:的)?(?:办法|法子|经验|智慧)/,
  // t4 祖宗/祖训/家风/族规/祖制（规范传承）
  t4_ancestral_rules: /祖宗|祖上|祖训|家风|族规|祖制|祖宗之法|先人(?:的)?法度|先人之法|古制|先王(?:之|的)?法/,
  // t5 古圣先贤/古人云（人格化的历史权威）
  t5_sages: /古圣先贤|先贤|圣人之言|古人云|古人有言|先王之道/,
  // t6 旧俗/乡俗/陈规/代代相传（民俗传承）
  t6_old_custom: /旧俗|乡俗|乡规|陈规|老皇历|老黄历|祖上传下来|祖上留下|代代相传|一代代传/,
  // t7 老辈人（代际传承的人格载体）
  t7_elders: /老辈人|上辈人|老人家传|村里老人|老人言/,
  // t8 清宫/宫廷秘方（御制传承）
  t8_palace: /(?:清宫|宫廷|宫里)(?:秘方|古方|配方|传出来|传出|流传)/,
  // t9 老师傅（手艺传承的人格载体）
  t9_master: /老师傅/,
  // [r277] t10 时间跨度新形（「千百年来」「多少代人」——旧判据只收
  // 几百年/数百年/上千年 具体数字形，「千百年来」整族射程外）
  t10_time_span: /千百年来|多少代人|多少辈人|一辈辈|一辈又一辈|子子孙孙|这么(?:多年|多辈子)(?:过来|下来)/,
  // [r277] t11 牌子/口碑年资（「牌子立了上百年」「口碑摆在那儿」——
  // 商业传统的年资载体，r259 t2 只收「老字号」词形）。注意 `多?年`
  // （多年可选、年必填）——`多年?` 是「多+可选年」，匹配不到「上百年」，
  // r277 探针第一版正死于此。
  t11_brand_age: /(?:牌子|招牌|口碑|名头)(?:立|打|树|闯)(?:了)?(?:上)?(?:百|几十|多少)?多?年|老牌子|金字招牌|百年(?:的)?(?:老)?牌子/,
};

// ─── 腿①新族（英文 9 支）─────────────────────────────
const TRAD_EN_BRANCHES = {
  // e1 time-tested / time-honored / tried-and-true
  e1_time_tested: /\btime[- ]?(?:tested|honored|honoured)\b|\btried[- ]and[- ]true\b/i,
  // e2 handed down / passed down（传承动作本身）
  e2_handed_down: /\b(?:handed|passed) down\b/i,
  // e3 heritage / ancestral / ancestors
  e3_heritage: /\bheritage\b|\bancestral\b|\bancestors\b/i,
  // e4 the old ways / old-school / folk wisdom / folklore
  e4_old_ways: /\bthe old ways?\b|\bold[- ]school\b|\bfolk wisdom\b|\bfolklore\b/i,
  // e5 status quo
  e5_status_quo: /\bstatus quo\b/i,
  // e6 established order / long-standing customs
  e6_established_order: /\bestablished order\b|\blong[- ]standing customs?\b/i,
  // e7 the good old days / back in the day / how it used to be
  e7_good_old_days: /\bthe good old days\b|\bback in the day\b|\bhow (?:it|things) used to be\b/i,
  // e8 good enough for our/my forefathers（「祖宗那辈够用」形）
  e8_good_enough_for: /\bgood enough for (?:our|my|the)\b/i,
  // e9 our predecessors / the way they did it
  e9_predecessors: /\b(?:our|the) predecessors\b|\bthe way (?:they|our \w+) did it\b/i,
  // [r277] e11 has been around for centuries（「摆在那儿多少年」形）
  e11_been_around: /\b(?:has|have) been around for (?:centuries|generations|decades|ages)\b/i,
  // [r277] e12 reputation spans generations（口碑/名声代际形）
  e12_reputation: /\b(?:its|his|her|their) reputation (?:spans|goes back|dates back)\b/i,
};

// ─── 腿②新族（中文 8 支）：压制改变/异议的新措辞 ─────────────────
const SUPP_ZH_BRANCHES = {
  // s1 轮不到你 + 动词（剥夺发言权）
  s1_lunbudao: /轮不到你(?:来)?(?:质疑|批评|指手画脚|说三道四|干涉|过问|评判|管|插手|决定|说|反对|改)/,
  // s2 碰不得/动不得/改不得（不可触碰形）
  s2_untouchable: /(?:碰不得|动不得|摸不得|说不得|改不得|碰也碰不得)/,
  // s3 坏了规矩/先例不能开/破例（破例禁止形）
  s3_no_precedent: /(?:坏|坏了|败坏|亵渎)(?:了)?(?:规矩|祖上的规矩|先例|传统|祖制)|不能开(?:这个|这样的)?先例|先例不能开|不能破(?:这个|这样的)?(?:先例|例|规矩)|破例/,
  // s4 维持现状/一切照旧（维持指令形）
  s4_status_quo: /维持现状|保持原样|一切照旧|照旧就好|原封不动/,
  // s5 少插嘴/由不得你（话语权剥夺形）
  s5_shut_up: /少插嘴|少插话|别插嘴|由不得你(?:说|决定|插手|干预|改|质疑)/,
  // s6 标新立异/节外生枝（求同压制形）
  s6_conform: /别?标新立异|不要节外生枝|别节外生枝|少逞能|别逞能|别搞特殊(?:化)?/,
  // s7 裸「说改就改」（旧判据只收「不能说改就改」前缀形）
  s7_arbitrary_change: /说改就改|想改就改|说变就变/,
  // s8 不容置喙（学究式禁言）
  s8_no_comment: /不容置喙|不容置评/,
  // s9 不能…变了（旧判据只收「不能+改变/变更」完整词形，漏「变了」）
  s9_cannot_change: /不能[^。]{0,6}(?:变|改)了?/,
  // [r277] s10 别瞎折腾/别乱动（贬损式维持指令——旧判据只收「轮不到你/
  // 碰不得」等剥夺形，漏「折腾」族）
  s10_dont_mess: /别瞎折腾|不要瞎折腾|别瞎改|别乱改|别乱动|别动它|别碰它|不要去动|少折腾|别折腾/,
  // [r277] s11 不能丢/丢不得（传统断裂禁止形）
  s11_cannot_lose: /(?:不能|不得|不可|岂能|怎能)(?:丢|丢弃|舍弃|扔下|荒废|忘掉)(?:了)?/,
  // [r277] s12 还是得守/还得守（裸维持指令——旧判据只收「就该+继续/保持」
  // 前缀形，「老规矩还是得守」整族射程外）。名词锚用 lookbehind：若把
  // 「老规矩」吃进匹配串，会与腿①的传统名词匹配重叠，被防自证守卫
  // （零重叠配对）误杀——r277 探针实测该样本第一版正死于重叠。
  s12_still_keep: /(?<=老规矩|老例|旧例|祖制|惯例|规矩|传统)(?:还是|还|仍然|依然)?(?:得|要)(?:守|守住|遵循|遵照)|还是得守|还得守|仍得守/,
};

// ─── 腿②新族（英文 9 支）─────────────────────────────
const SUPP_EN_BRANCHES = {
  // e1 rock the boat
  e1_rock_boat: /\brock the boat\b/i,
  // e2 keep/maintain/preserve the status quo / established order
  e2_keep_status_quo: /\b(?:keep|maintain|preserve|protect|defend) the (?:status quo|established order)\b/i,
  // e3 don't fix what isn't broken / if it ain't broke
  e3_dont_fix: /\bdo not (?:go )?fix(?:ing)? what (?:is|isn'?t|is not) broken\b|\bif it ain'?t broke\b/i,
  // e4 leave well enough alone
  e4_leave_alone: /\bleave (?:well enough alone|it (?:well enough )?alone)\b/i,
  // e5 hold the line
  e5_hold_line: /\bhold the line\b/i,
  // e6 deviate from
  e6_deviate: /\b(?:nobody|no one|do not|don'?t|should not|must not|never) deviate\b|\bdeviate from\b/i,
  // e7 not for us to change / nobody should touch
  e7_not_ours: /\b(?:that'?s |it'?s )?not (?:for us|ours|up to us) to change\b|\bnobody should (?:touch|change|alter)\b/i,
  // e8 untouchable / sacred
  e8_sacred: /\buntouchable\b|\bsacred\b/i,
  // e9 keep the faith / preserve our customs
  e9_keep_faith: /\bkeep the faith\b|\bpreserve (?:our )?(?:long[- ]standing )?customs?\b/i,
  // e10 do not change/alter/modify it（旧判据只收 cannot/must not/should not 系列）
  e10_do_not_change: /\b(?:do not|don'?t|never) (?:change|alter|modify|mess with)\b/i,
  // [r277] e13 see no reason to stop/change（「找不到改的理由」形）
  e13_no_reason: /\b(?:see|saw|seeing) no reason to (?:stop|change|quit|end|alter)\b/i,
  // [r277] e14 who are we to change/question（资格剥夺反问形）
  e14_who_are_we: /\bwho are we to (?:change|question|judge|second[- ]guess)\b/i,
  // [r277] e15 keep/follow X as it has always been（裸祈使维持形——
  // 旧判据只收 must/should+continue 系列，「keep the recipe as it
  // has always been」祈使句整族射程外）
  e15_keep_as_always: /\b(?:keep|follow|stick (?:to|with)) (?:the |it |this )?(?:recipe|formula|way|ways|tradition|practice|process|method) (?:as|the way) (?:it |things )?(?:has |have )?always been\b/i,
};

// ─── 腿③新族（中文 6 支）：传统在场 × 质量担保/正当性结论 ─────────
// 「老祖宗传下来的秘方，治这个病最管用」——旧判据只有「压制改变」一条
// 出口，传统在场×优越结论整族射程外（r259 探针 34 穿透的主形态之一）。
const CONCL_ZH_BRANCHES = {
  // c1 肯定/一定 + 靠谱/管用/有效/灵验
  c1_reliable: /(?:肯定|一定|必然|绝对|想必|准)(?:靠?谱|管用|有效|灵验|能行|没错)/,
  // c2 自然有它的道理 / 自有道理
  c2_has_reason: /自然有它的道理|必然有它的道理|自有它的道理|自有道理|能有今天的道理/,
  // c3 比X强（传统×比较优越）
  c3_comparative: /比[^。]{0,10}(?:强|好|强多了|靠谱|管用|先进)/,
  // c4 照做就行/照着做便是（服从指令形）
  c4_obey: /照做就行|照着做就行|照着做便是|照做便是|恪守|谨守/,
  // c5 几代人/祖祖辈辈 验证过（时间检验担保）
  c5_generations_tested: /(?:几代人|多少代人|世世代代|祖祖辈辈|一辈辈)(?:验证|试过|用过|检验|把关)/,
  // c6 最…形（最管用/最靠谱/最正宗）
  c6_most: /最(?:管用|靠谱|有效|灵|正宗|地道)/,
  // c7 认识论封闭反问（还能有问题吗/能错到哪去）
  c7_rhetorical: /(?:还)?能(?:有|出)(?:什么)?问题吗|能错到哪去|错得了吗/,
  // [r277] c8 封闭反问错位形（「还能有错？」「不可能有问题」——c7 只收
  // 「问题吗」后缀形，「错」字反问与「不可能有问题」整族射程外）
  c8_cannot_be_wrong: /(?:还)?能(?:有|出)?错(?:吗)?|不可能有问题|怎会有错|岂能有错|错不了|还能有假/,
  // [r277] c9 照老方子来（服从指令形——c4 只收「照做就行」结论形，
  // 「照老方子来/照老办法做」的动作指令族射程外）
  c9_obey_old: /照(?:老|着)(?:方子|办法|法子|规矩|传统|流程)(?:来|做|办|行事|执行)/,
};

// ─── 腿③新族（英文 7 支）─────────────────────────────
const CONCL_EN_BRANCHES = {
  // c1 beats anything modern / superior to
  c1_beats: /\bbeats (?:anything|everything|any modern|all modern)\b|\bsuperior to\b/i,
  // c2 proven over the years / stood the test of time
  c2_proven: /\bproven over (?:the )?(?:years|centuries|generations)\b|\bstood the test of time\b/i,
  // c3 worked fine/well for my grandfather
  c3_worked_fine: /\bworked (?:fine|well) for\b/i,
  // c4 good enough for us（祖宗够用形）
  c4_good_enough: /\bgood enough for (?:us|me|you)\b/i,
  // c5 must work / must be right / cannot be wrong
  c5_must_work: /\bmust (?:work|be effective|be right|be correct)\b|\bcannot be wrong\b/i,
  // c6 so they are fine for me
  c6_fine_for_me: /\bso (?:they|it) (?:is|are) (?:fine|good) (?:enough )?for me\b/i,
  // c7 proven by generations of use
  c7_generations: /\b(?:used|proven|tested) (?:by|for) generations\b/i,
  // [r277] c8 how could it be wrong（英文封闭反问形）
  c8_how_wrong: /\bhow could (?:it|they|this|that) be wrong\b|\bimpossible for (?:it|this) to be flawed\b/i,
};

// 合并版（兼容旧读方；路由实际逐分支走，便于负例逐支注入）
function _combine(branches, flags) {
  const parts = Object.keys(branches).map(k => '(?:' + branches[k].source + ')');
  return new RegExp(parts.join('|'), flags || '');
}
const TRAD_ZH_EXT = _combine(TRAD_ZH_BRANCHES);
const TRAD_EN_EXT = _combine(TRAD_EN_BRANCHES, 'i');
const SUPP_ZH_EXT = _combine(SUPP_ZH_BRANCHES);
const SUPP_EN_EXT = _combine(SUPP_EN_BRANCHES, 'i');
const CONCL_ZH_EXT = _combine(CONCL_ZH_BRANCHES);
const CONCL_EN_EXT = _combine(CONCL_EN_BRANCHES, 'i');

// ─── [r259] concessive-debate 豁免（仅作用于新路由）──────────────
// 让步标记 × 评估/数据标记**同时**在场才豁免——单有让步词不够（那会成为
// 「句尾加不过即可绕过」的通用 bypass），单有数据词也不够。「现状一直
// 运行良好，不过新数据建议我们重新评估」是在呈现争论，不是在以传统
// 压制改变。
const HEDGE_CONCESSION_ZH = /不过|但是|然而|可是|虽说|固然|尽管如此/;
const HEDGE_EVAL_ZH = /评估|数据|实测|重新考虑|有待|争议|未必|不尽然|例外|改进|改良|优化|具体分析|另作评估|另行评估/;
const HEDGE_CONCESSION_EN = /\bhowever\b|\bbut\b|\bthat said\b|\balthough\b|\bthough\b|\byet\b|\bwhile\b/i;
const HEDGE_EVAL_EN = /\bdata\b|\bevidence\b|\breassess\b|\brevisit\b|\breconsider\b|\bevaluate\b|\breview\b|\bimprove\b|\bnot always\b|\bdebat/i;
// [r259] 证据在场替代通路：把「维持传统」的依据放到可核查的数据上
// （"现状一直运行良好，数据显示它仍然有效"）是在做证据论证，不是在以
// 传统置换证据。**已知绕过面**：句尾追加数据标记即可豁免——与 r257
// HEDGE 同型的取舍，已列入交接给 2 号专项测试。
const HEDGE_EVIDENCE_ZH = /数据显示|数据表明|数据确认|检测数据|实测数据|证据表明|证据显示|统计显示|报告显示|数据显示/;
const HEDGE_EVIDENCE_EN = /\bthe data (?:shows|confirms|indicates|suggests)\b|\bevidence (?:shows|suggests|indicates)\b|\baccording to (?:the )?data\b/i;

/** 收集正则全部匹配及其起止位置（供防自证守卫做零重叠判定） */
function _collect(re, text) {
  const out = [];
  if (!re || typeof re.source !== 'string') return out;
  let g;
  try {
    g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
  } catch (_) { return out; }
  let m;
  let guard = 0;
  while ((m = g.exec(text)) !== null && guard++ < 500) {
    // 防御：零长度匹配（如误留前导 `|` 造成的空分支）不计入——
    // 否则空串会同时落在两腿上，把任意文本判成「两腿齐备」。
    if (m[0].length === 0) {
      if (g.lastIndex <= m.index) g.lastIndex = m.index + 1;
      continue;
    }
    out.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
  }
  return out;
}

/** 把分支表摊平成正则列表（供注入替换） */
function _branchList(table, fallback) {
  const t = table || fallback || {};
  return Object.keys(t).map(k => t[k]).filter(r => r instanceof RegExp);
}

/** 句级切分（新路由要求两腿落在同一句内）
 *  注意：**不把 `;`／`；` 当句子边界**——英文分号常连接让步从句
 *  （"The status quo has served us well; that said, the new data…"），
 *  按句子切会把 concessive-debate 豁免拆失效。 */
function _sentences(text) {
  return String(text).split(/[。！？!?\n]+/).map(s => s.trim()).filter(Boolean);
}

/** 零重叠配对：腿 A 与腿 B 必须存在一对互不覆盖的匹配（防自证） */
function _paired(aSpans, bSpans) {
  return aSpans.some(a => bSpans.some(b => b.end <= a.start || b.start >= a.end));
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以永不匹配串/自定义正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkAppealToTradition(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const TRAD_ZH_ = R.TRADITION_ZH || TRADITION_ZH;
  const TRAD_EN_ = R.TRADITION_EN || TRADITION_EN;
  const SUPP_ZH_ = R.SUPPRESS_ZH || SUPPRESS_ZH;
  const SUPP_EN_ = R.SUPPRESS_EN || SUPPRESS_EN;
  const CROWD_ZH_ = R.CROWD_ZH || CROWD_ZH;
  const CROWD_EN_ = R.CROWD_EN || CROWD_EN;
  const SINGLE_ZH_ = R.SINGLE_OUT_ZH || SINGLE_OUT_ZH;
  const SINGLE_EN_ = R.SINGLE_OUT_EN || SINGLE_OUT_EN;
  const META_ZH_ = R.META_EXEMPT_ZH || META_EXEMPT_ZH;
  const META_EN_ = R.META_EXEMPT_EN || META_EXEMPT_EN;
  const QUAL_ZH_ = R.QUALIFY_ZH || QUALIFY_ZH;
  const QUAL_EN_ = R.QUALIFY_EN || QUALIFY_EN;

  // 在评析「诉诸传统」这套论证 → 不是运用它
  if ((META_ZH_.test(text) && QUAL_ZH_.test(text)) ||
      (META_EN_.test(text) && QUAL_EN_.test(text))) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const tradBranches = _branchList(R.TRAD_ZH_BRANCHES, TRAD_ZH_BRANCHES)
    .concat(_branchList(R.TRAD_EN_BRANCHES, TRAD_EN_BRANCHES));
  const suppBranches = _branchList(R.SUPP_ZH_BRANCHES, SUPP_ZH_BRANCHES)
    .concat(_branchList(R.SUPP_EN_BRANCHES, SUPP_EN_BRANCHES));
  const conclBranches = _branchList(R.CONCL_ZH_BRANCHES, CONCL_ZH_BRANCHES)
    .concat(_branchList(R.CONCL_EN_BRANCHES, CONCL_EN_BRANCHES));

  const tradOld = TRAD_ZH_.test(text) || TRAD_EN_.test(text);
  // [r259] 新腿①分支也要能独立支撑到达新路由——旧判据的 `!trad` 早退
  // 会把「百年老字号的古法工艺，肯定靠谱」这类只命中新词表的样本直接
  // 放行。故早退条件改为「新旧腿①全无命中」。
  const tradNew = tradBranches.some(b => b.test(text));

  // T3 从众施压族：从众基数在场 × 点名对方异议（不要求传统名词）
  const crowd = CROWD_ZH_.test(text) || CROWD_EN_.test(text);
  if (crowd) {
    const singled = SINGLE_ZH_.test(text) || SINGLE_EN_.test(text);
    if (singled) {
      return { hit: true, score: 0.4, detail: '诉诸传统/从众压制异议(多数人施压)', count: 1 };
    }
  }

  if (!tradOld && !tradNew) {
    // 无传统名词时，纯点名形不判（日常吐槽「就你事多」也可能是中性表达）
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  // T2 压制改变/异议（传统在场）——旧路由维持全文共现口径不变
  if (tradOld) {
    if (SUPP_ZH_.test(text)) {
      return { hit: true, score: 0.4, detail: '诉诸传统压制改变/异议(zh)', count: 1 };
    }
    if (SUPP_EN_.test(text)) {
      return { hit: true, score: 0.4, detail: '诉诸传统压制改变/异议(en)', count: 1 };
    }
  }

  // ═══ [r259] 新路由：句级共现（腿① ∪ 新支）×（腿② ∪ 新支 / 腿③）═══
  const hedgeC = R.HEDGE_CONCESSION_ZH || HEDGE_CONCESSION_ZH;
  const hedgeE = R.HEDGE_EVAL_ZH || HEDGE_EVAL_ZH;
  const hedgeCEn = R.HEDGE_CONCESSION_EN || HEDGE_CONCESSION_EN;
  const hedgeEEn = R.HEDGE_EVAL_EN || HEDGE_EVAL_EN;
  const hedgeEvZh = R.HEDGE_EVIDENCE_ZH || HEDGE_EVIDENCE_ZH;
  const hedgeEvEn = R.HEDGE_EVIDENCE_EN || HEDGE_EVIDENCE_EN;
  const zhText = /[\u4e00-\u9fff]/.test(text);
  for (const sent of _sentences(text)) {
    if (sent.length < 6) continue;
    const tradSpans = [].concat(
      _collect(TRAD_ZH_, sent), _collect(TRAD_EN_, sent),
      ...tradBranches.map(b => _collect(b, sent))
    );
    if (tradSpans.length === 0) continue;

    // concessive-debate 豁免（让步×评估/数据）＋ 证据在场替代通路
    if ((hedgeC.test(sent) && hedgeE.test(sent)) ||
        (hedgeCEn.test(sent) && hedgeEEn.test(sent)) ||
        hedgeEvZh.test(sent) || hedgeEvEn.test(sent)) {
      continue;
    }

    // 路由④：腿① × 腿②（传统在场 × 压制改变/异议）
    const suppSpans = [].concat(
      _collect(SUPP_ZH_, sent), _collect(SUPP_EN_, sent),
      ...suppBranches.map(b => _collect(b, sent))
    );
    if (suppSpans.length > 0 && _paired(tradSpans, suppSpans)) {
      return {
        hit: true, score: 0.4, count: 1,
        detail: zhText ? '诉诸传统压制改变/异议·新措辞族(zh)' : 'appeal to tradition·suppress-change wording(en)',
      };
    }

    // 路由⑤：腿① × 腿③（传统在场 × 质量担保/正当性结论）
    const conclSpans = [].concat(...conclBranches.map(b => _collect(b, sent)));
    if (conclSpans.length > 0 && _paired(tradSpans, conclSpans)) {
      return {
        hit: true, score: 0.4, count: 1,
        detail: zhText ? '诉诸传统·传统在场×质量担保结论(zh)' : 'appeal to tradition·tradition-warrant conclusion(en)',
      };
    }
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkAppealToTradition,
  __internals: () => ({
    TRADITION_ZH, TRADITION_EN, CROWD_ZH, CROWD_EN, SINGLE_OUT_ZH, SINGLE_OUT_EN,
    SUPPRESS_ZH, SUPPRESS_EN, META_EXEMPT_ZH, META_EXEMPT_EN, QUALIFY_ZH, QUALIFY_EN,
    TRAD_ZH_BRANCHES, TRAD_EN_BRANCHES, SUPP_ZH_BRANCHES, SUPP_EN_BRANCHES,
    CONCL_ZH_BRANCHES, CONCL_EN_BRANCHES,
    TRAD_ZH_EXT, TRAD_EN_EXT, SUPP_ZH_EXT, SUPP_EN_EXT, CONCL_ZH_EXT, CONCL_EN_EXT,
    HEDGE_CONCESSION_ZH, HEDGE_EVAL_ZH, HEDGE_CONCESSION_EN, HEDGE_EVAL_EN,
  }),
};
