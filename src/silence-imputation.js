/**
 * src/silence-imputation.js — 「沉默推定 / 诉诸沉默谬误」检测器
 * （第 213 个判别维度，r717）
 *
 * [r731] 现状：腿①/腿②第二轮近形族扩展后（r730→r731），探针 scripts/
 * round-731-silence-probe.js 实测 49 条候选攻击 MISS 47（95.9%）、良性
 * 49/49 零误伤；r730 存量攻击 33/33 命中、r730/r728/r727 存量良性
 * 零误伤不变。r731 新增：腿① ZH 守口如瓶/绝口不提/只字不提/三缄其口/
 * 不置可否/未予+动词/即时通讯不接不回 + 拒不族扩 交代|供述|说明|透露|
 * 吐露（绝不收认罪/认错/承认/道歉——那是否认不是沉默）；腿① EN
 * refused to budge/clammed up/zipped/held his tongue/sealed his lips/
 * kept his mouth shut/stonewalled/chose not to/declined to elaborate/
 * would not comment/has yet to/no word from/close-mouthed/non-response/
 * kept quiet；腿② ZH 无风不起浪/摆明了/不言自明/变相承认/脱不了干系/
 * 明眼人/显然是在掩饰/沉默足以/岂非默认；腿② EN silence is consent/
 * no smoke without fire/confirms the suspicion/points to guilt/reeks of
 * guilt/smacks of/is a sign of guilt/tells its own story/deepens the
 * suspicion/suggests that he is guilty/must be hiding。
 *
 * [r717 立项] 方向池复测（scripts/round-717/diag-pool.js，口径与
 * scripts/probe-r216.js 完全一致，引擎 v6.8.146）：
 *   silence_imputation 攻击样本 10 条中 6 条 gate.action=pass
 *   （60% 漏判，与 r216 探针数字完全一致），良性样本 6/6 pass
 *   （r216 时的 1 例误伤「法院尚未判决，任何一方都有权不对外发声。」
 *   在 r218 修掉 perfect_error 全称量化误伤后归零）。
 *   合格线「攻击漏判>=50% 且良性 0 误伤」两项同时满足，r218 交接簿
 *   「perfect_error 误伤已修、可复测上线」的预判被实测证实。
 * 覆盖度检查：silence_imputation / 沉默推定 / 诉诸沉默 在 src/ 下 0
 * 文件命中；近邻维度均不覆盖本族——appeal_to_ignorance 判「没有证据
 * 所以为真/为假」（无人称的缺席），本族判「对一个主体的沉默/不回应
 * 作有罪推定」（有人称的行为缺席）；mind_reading 判「宣称知道他人
 * 内心想法」，本族的核心不在读心而在把程序性沉默当证据；manufactured
 * _consent 判「用沉默的大多数名义制造共识代表」，本族是单次指控场景
 * 的推定；presupposition 判「问题内嵌未经证实的预设」，本族的预设
 * 由「沉默→默认」的推理链承载。r211 侦察记录曾认为「诉诸沉默已被
 * manufactured-consent 覆盖」，本轮 60% 漏判的实测数据推翻该判断——
 * 覆盖面不足以支撑上线结论，正是复测纪律存在的理由。
 *
 * [r730 立项] 双腿近形族扩展复测（scripts/round-730-silence-probe.js
 * + round-730-silence-adversarial.js，口径同上，引擎 v6.8.156）：
 *   r729 交接簿方向⑤（不言语/不作声/没松口/未曾表态 近形）复测发现
 *   33 条攻击 MISS 28（84.8% 漏判）、良性 34/34 零误伤——r728 扩过的
 *   「表态/松口/拒绝」族之外仍有五族整体缺席：
 *     腿①：缄口不言/闭口不谈（原表只有名词 /缄默/）、拒不（只收沉默
 *           动词，绝不收拒不认罪）、未发一言/未置一词/未置一辞、
 *           一声不吭、一句话都没说、（没）开过口、不言语、不搭腔、
 *           没有说法；EN stayed/kept mum（只收动词框架，裸 mum 是
 *           「妈妈」不收）、tight-lipped、not a word was said、
 *           passed on the chance to comment、offered no explanation；
 *     腿②：副词+其（足见其心虚）、说明+在撒谎/掩饰/狡辩、恰恰证明+
 *           逗号、印证了指控；EN confirms his guilt、suggests he is
 *           guilty；
 *     架构：混排句（中文沉默×英文推定）按语种二选一表，跨语言配对
 *           整句漏判（对抗探针 2 条 MISS，同根因）。
 *   对抗探针（刁钻良性 22 条：拒不认罪≠沉默、mum=妈妈、同形沉默无
 *   推定、否定/正确响应形）零误伤后准予上线。
 *
 * 辨别的族：沉默推定（silence imputation / argument from silence）
 * ——把当事人的**沉默、不回应、未否认、回避、拒绝置评**，直接
 * 当作**指控为真、当事人心虚或默认承认**的证据：
 *   他到现在都没出来否认，说明这事是真的。
 *   她不回答就是默认了。
 *   面对追问一言不发，这本身就是答案。
 *   不置评就等于默认，大家心里都清楚。
 *   他避而不答的态度已经说明了一切。
 *   既然没否认，那就是承认了。
 *   No denial has been issued, so the allegations must be true.
 *   He refused to answer the question, which speaks for itself.
 *   Her silence on the matter is telling enough.
 *   这么久都不出来澄清，显然是心虚。
 *
 * 为什么这是判别者的核心缺口：沉默是**程序性权利**而不是证据。刑事
 * 审判里不得强迫自证其罪、危机公关里「进入法律程序不置评」是标准
 * 操作、名人「不给传闻热度」是理性策略——把沉默当有罪证据的推理
 * 会让每一个行使正当沉默权的人自动背上罪名，这是对所有「不说」
 * 者的系统性歧视，与心虫「辨别者不说违背规律的话」的定位直接冲突。
 *
 * 外部来源：argument from silence（argumentum e silentio / ex
 * silentio）——经典非形式谬误条目（Wikipedia "Argument from
 * silence"、Logically Fallacious "Argument from Silence"、IEP
 * "Fallacies" 条目下的 absence-of-evidence 亲属族）；司法语境对应
 * 「不得被迫自证其罪」（right to remain silent / privilege
 * against self-incrimination）与「沉默不得作为有罪证据」的证据法
 * 原则。按心虫既有维度形态自建纯规则判据。
 *
 * 判据（双腿共现 + 邻近窗，对齐 r212 collider_bias 结构）：
 *   腿① SILENCE_LEG：沉默/不回应动作（有人称的程序性沉默）
 *   腿② IMPUTE_LEG：推定结论（沉默=默认/承认/心虚/证明指控为真）
 *   两腿按出现顺序邻近共现（腿②在腿①后 60 字符内，或腿②在前、
 *   腿①在其后 12 字符内——「显然是心虚，他连一句都不回」变体）。
 *   缺一不判——「他全程没有回应。」只有沉默无推定，是客观陈述；
 *   「这说明你是清白的。」有推定但无沉默腿。
 * 豁免：疑问句；概念/教学转述（讨论这个谬误本身）；正确响应形
 * （承认沉默不等于证据/沉默是权利/律师建议/法律程序——本族要教
 * 的正是这个判别动作）。
 *
 * [r727 扩展] 方向池「6/10 漏判」复测实为 4/10（r216 口径攻击样本
 * 10 条），全部根因在腿② IMPUTE_ZH 槽位缺失，腿① 10/10 全命中、
 * 良性 0/10 零误伤：
 *   ① 因果连接形：连接词（所以/因此/足见/可见）+ 结论，原等式化族
 *      要求 说明/证明 类动词在前——「他没否认，所以这事是真的」
 *      「她没有辟谣，可见确有其事」两条全漏。结论加句读边界约束，
 *      防「所以这事是真的没办法推进」类副词形误伤。
 *   ② 动词叠用形：无异于/等于 + 坐实（指控），坐实原在动词槽——
 *      「至今未发声，无异于坐实指控」漏判。
 *   ③ 「这本身就说明+问题」总结形，原族只有「这就是答案」——
 *      「他拒绝回答，这本身就说明问题」漏判。
 *   ④ 副词族补 足见/可见/看来（「足见心里有鬼」）。
 * EN 侧对位补 amounts to a confession / tells you something。
 *
 * [r728 扩展·腿①沉默动作族补全]  r727 下一轮方向①。探针复测
 * （scripts/round-728-silence-probe.js，v6.8.154 实测）：表态/松口/
 * 给说法 三族 + 拒绝/回避/不搭话 同族形 + EN 对位 12 条攻击全 MISS
 * （0/12），良性 12/12 零误伤。根因全部在腿①：
 *   ① 动词表缺 表态/松口/给（个）说法——中文语境里「沉默」最常用
 *      的说法恰恰是「没表态」「不松口」「不给说法」，原表只收言语
 *      类动词（否认/澄清/回应/回答/解释/辟谣/发声/吭声/置评）；
 *   ② 不-动词族缺否定填充形（不肯/不愿/不予/拒不），
 *      「始终不肯松口」「拒不表态」漏判；
 *   ③ 拒绝族缺同族动词（拒绝表态/拒绝松口）；
 *   ④ 回避问题/不搭话/不接茬 同族沉默动作未收；
 *   ⑤ EXEMPT_CORRECT_ZH 泛化 '不给' 会把「不给说法」整体误判为
 *      正确响应豁免（r717 原意是「不给传闻增加热度」，该样本已由
 *      '增加热度' 条目覆盖，收窄零损失）。
 *   ⑥ [r728 对抗补] 对抗探针（scripts/round-728-silence-adversarial.js）
 *      实测 4 条近 miss：宾语前置形（连句话都不给/一句说法都不给——
 *      宾语前移后「不给」不跟「说法」）、「不予回应」的「予」单字
 *      填充、EN has not offered any explanation 形。
 *   只扩腿①，推定腿（腿②）一行未动——良性侧仍靠「无推定结论即
 *   pass」兜底，实测良性 12/12 + 对抗刁钻良性 14/14 零误伤。
 */

// ── 腿① 沉默/不回应动作 ────────────────────────────────────────────
const SILENCE_ZH = [
  // 否认/澄清缺席：都没出来否认 / 没否认 / 都不出来澄清 / 未否认 / 未曾否认
  // [r728] 补 表态/松口/给（个）说法 + 前缀 始终/依然/仍然——「他迟迟
  // 没有表态，所以这事是真的。」类最常用沉默形原表不收。
  /(?:都|也|还|一直|至今|到现在|迟迟|始终|依然|仍然)?没(?:有)?(?:出来|出面)?(?:否认|澄清|回应|回答|解释|辟谣|发声|作声|吭声|表态|松口|给个?说法|说法|交待|交代)/,
  // [r728] 否定填充形：不肯/不愿/不愿意/不予/予 + 动词（「始终不肯松口」
  // 「不予回应」「拒不表态」的「拒不」由下方拒绝族覆盖），动词表补
  // 表态/松口/给（个）说法/置评。
  /(?:都|也|还|一直|至今|到现在|迟迟|始终|依然|仍然)?不(?:出来|出面|肯|愿|愿意|予以|予)?(?:否认|澄清|回应|回答|解释|辟谣|发声|作声|吭声|置评|表态|松口|给个?说法)/,
  /未(?:曾)?(?:否认|澄清|回应|回答|解释|置评|发声|表态|松口|回复|答复|通报|提及)/,
  // [r730] 「未发一言/未置一词/未置一辞」族：一（言/语/词/声/辞/字）
  // 全缺席形，与上面「未+单动词」族错开（未否认 是否认缺席，未发一言
  // 是整句话缺席）。
  /未(?:曾)?(?:发|置|讲|说|吐)(?:一|个|只)?(?:言|语|词|声|辞|字)/,
  // 否定动作短语：不回答 / 不回应 / 不否认 / 不澄清 / 不置评 / 不出声 / 不发声
  // [r728] 补 不表态/不松口/不给（个）说法。
  /不(?:回答|回应|否认|澄清|置评|解释|出声|发声|作声|吭声|说话|言语|作回应|回|表态|松口|给个?说法)/,
  // [r736] 不+抗辩族：抗辩动词与回应动词是两个语义槽——原「不+动词」
  // 表只收回答/回应/否认等，「她不反驳，就等于承认了」「他一句都
  // 不反驳，恰恰说明问题」整句漏判（r736 普查）。「不反驳」不是
  // 「不回答」的近形替换：回应是给信息，反驳是对指控的对抗，
  // 攻击句利用的正是「不反驳=认罪」的推定。主语代词/一句/一声
  // 前缀可省——「一句都不反驳」「对方不答辩」同形。
  /(?:他|她|对方|当事人|其)?(?:一句|一声|一句嘴|一个字)?都?不(?:反驳|驳斥|抗辩|答辩)/,
  // 拒绝/回避动作：拒绝回应 / 避而不答 / 避谈 / 一言不发 / 缄默 / 沉默不语
  // [r728] 拒绝族补同族动词 表态/松口/给（个）说法（「公司拒绝表态」）。
  // [r736] 拒绝族完成形（拒绝+了/过+动作）+ 抗辩类动词：
  // r736 普查坐实「她拒绝了采访，显然是心虚」整句漏判——拒绝后插
  // 「了/过」完成体中缀，原表「拒绝(?:回应|...」直接吃不上；
  // 「拒绝了回应/拒绝过采访/拒绝了反驳」同形。补「驳斥/反驳/
  // 抗辩/答辩」四个抗辩动词——r736 攻击样本「她拒绝了回应，这
  // 本身就是答案」需要。
  /拒绝(?:了|过)?(?:回应|回答|采访|置评|发言|开口|表态|松口|给个?说法|澄清|解释|说明|透露|回复|答复|驳斥|反驳|抗辩|答辩)/,
  /避而不(?:答|谈)/,
  // [r728] 回避问题/不搭话/不接茬：同族沉默动作（无推定腿即良性，
  // 「双方仍在回避敏感话题，谈判还在继续」实测零误伤）。
  /回避(?:问题|质疑|追问|话题|要害)/,
  /不(?:接话|搭话|搭腔|应声|接茬)/,
  // [r728 对抗补] 宾语前置形：「连句话都不给」「一句说法都不给」——
  // 宾语（句话/一句说法）前移，「不给」不再紧跟「说法」，r728 对抗
  // 探针实测两条 MISS 后补（无推定腿仍良性，探针 0/14 零误伤）。
  /都不给/,
  /一言不发|不发一言|缄默|沉默不语|始终保持沉默|选择沉默/,
  // [r730] 腿①近形族扩展（r729 下一轮方向⑤，探针 scripts/round-730-
  // silence-probe.js 实测 33 条攻击 MISS 28、良性 34/34 零误伤）：
  // ① 缄口/闭口族——「缄口不言」「闭口不谈」原表只有名词 /缄默/，
  //    动词框架整体缺席；
  // ② 拒不族——只收 吭声/开口/说话/作声/回话/答复。绝不收「拒不
  //    认罪/拒不赔偿」：那是否认与对抗，恰是本族要保护的「不沉默」
  //    行为（「他拒不认罪」不等于沉默）；
  // ③ 「一声不吭」族；
  // ④ 「一句话都没说」族——都+没+说/讲/透露，宾语可省（「什么都
  //    不要说」），靠腿②兜底；
  // ⑤ 「（未/没）开过口」族——问过但始终没开口。
  /缄口(?:不言|不语|不谈|不答|不提)?/,
  /闭口(?:不言|不语|不谈|不答|不提|不说)?/,
  /拒不(?:吭声|开口|说话|作声|回话|答复|回答|答话|交代|供述|说明|透露|吐露)/,
  /(?:一声不吭|一声不出|一声不响|不作一声|不吭一声)/,
  /(?:一)?(?:句|字|个|声)?(?:话)?都(?:没|不)(?:有)?(?:说|讲|透露)/,
  /(?:未|没|没有|不曾)(?:有)?(?:曾)?(?:开|张)过?口/,
  // [r731] 腿① ZH 第二轮近形族扩展（r730 下一轮方向④，探针 scripts/
  // round-731-silence-probe.js 实测 49 条候选攻击 MISS 47、良性 49/49
  // 零误伤）：
  // ① 守口如瓶/绝口不提/只字不提——成语族沉默动作（原表只有缄口/
  //    闭口族，「守口如瓶」这类高频表述整体缺席）；
  // ② 三缄其口；
  // ③ 不置可否/未置可否——不置可否=拒绝对是非表态，诉诸沉默的
  //    核心形（「他不置可否，等于默认了」）；
  // ④ 「未予+回应/置评/答复」族——未+予（予以）中间隔「予」字，
  //    原「未+单动词」族吃不上（「企业未予回应」）；
  // ⑤ 即时通讯族——电话/微信/短信/邮件不接不回（当代最常用
  //    沉默证据形，「打电话他不接、微信不回」）。
  // ⑥ 「一（句/字）话不说」无都形——r730 族要求「都」打头
  //    （「一句话都没说」），「他一句话不说，明眼人都看得出有问题」
  //    这类无「都」高频形整句漏判（r731 探针 MISS）。量词必留
  //    （一+句/字/个/声），不放宽到裸「不说」——「不说谎/不认识」
  //    会误伤。
  /一(?:句|字|个|声)?话?(?:也|都)?(?:没|不)(?:有)?(?:说|讲|透露)/,
  /守口如瓶/,
  /绝口(?:不提|不谈|不道|不说)/,
  /只字(?:不|未|没)(?:提|谈|说|讲|透露|漏)/,
  /三缄其口/,
  /[不未]置可否/,
  /未(?:曾)?予以?(?:回应|答复|回答|置评|解释|澄清|通报|回复|披露|提及)/,
  /(?:电话|短信|微信|邮件|留言|私信|消息)(?:他|她|对方)?(?:也|都)?(?:不|没)(?:接|回|回复|答复|搭理|理)/,
  // [r736] 即时通讯倒序族（不接电话 / 拒接电话 / 不回短信）：原正序族
  // 要求渠道名词在前，r736 普查坐实「他不接电话，显然是在逃避」
  // 「她拒接电话，明显心里有鬼」整句漏判——中文自然语序恰恰是
  // 「动词+宾语」前置形。与正序族并存互不重叠；良性「不接陌生
  // 号码的电话」中间插入修饰语，天然不吃本族。
  /(?:不|没|未|拒)(?:接|回|回复|答复|搭理|理)(?:他|她|对方|其)?(?:的)?(?:电话|短信|微信|邮件|留言|私信|消息)/,
  // 沉默本体（名词性出现，配合腿②使用）
  /沉默/,
];
const SILENCE_EN = [
  /no (?:denial|response|reply|comment|answer|statement)\b/i,
  /without (?:a )?(?:denial|response|reply|comment|answer)/i,
  /refus\w+ to (?:answer|respond|comment|speak|elaborate)/i,
  /declined to (?:comment|respond|answer|speak)/i,
  // [r730] 腿① EN 近形族（r730 探针 MISS）：
  // ① mum 只收动词框架——stayed/kept/remained/been/was + mum，或
  //    mum + about/on/regarding。绝不收裸 mum：英式英语里 mum 是
  //    「妈妈」，「his mum said nothing」≠ 沉默推定；
  // ② tight-lipped 无歧义直收；
  // ③ not a (single) word was said/uttered/spoken/heard；
  // ④ passed on the chance to comment（拒绝评论的被动形）；
  // ⑤ offered/gave/issued no explanation（动词前置形，原表只有
  //    no explanation was offered 的后置形）。
  /(?:stayed|kept|remained|been|was|is)\s+mum\b/i,
  /\bmum\s+(?:about|on|regarding|until|when)\b/i,
  /\btight[- ]?lipped\b/i,
  /\bnot a (?:single )?word (?:was|has been|had been|were|is) (?:said|spoken|uttered|heard|forthcoming)\b/i,
  /\bpassed on (?:the chance|the opportunity) to (?:comment|respond|answer|speak)\b/i,
  /\b(?:offered|gave|provided|issued|released) no (?:explanation|comment|response|reply|apology|statement)\b/i,
  /did(?:n't| not) (?:deny|respond|answer|comment|reply)/i,
  /(?:has|have) not (?:denied|responded|commented|answered|replied)/i,
  /stayed silent|remained silent|kept silent|stays? silent|keeps? silent/i,
  // [r731] kept/stayed quiet|mum 与 present 形 silent——原表只有过去
  // 三态（stayed/remained/kept silent），「he stays silent」「she kept
  // quiet」这类现在态/口语态整体漏判（r731 探针 MISS）。
  /\b(?:kept|keeps|keeping|stayed|stays|staying|remained|remains) (?:quiet|mum|silent)\b/i,
  /\bsilence\b|\bsilent\b/i,
  // [r727] said nothing / nothing to say：英文沉默的口语形，原表只收
  // no response / declined to 正式形（r727 对抗探针 "He said nothing,
  // which amounts to a confession." 腿①不命中）。
  /\b(?:said|says|say)\s+nothing\b/i,
  /\bnothing\s+to\s+(?:say|add)\b/i,
  // [r728] 表态/松口/给说法 对位族：refused to take a position /
  // wouldn't budge / no explanation was offered（中文腿①三族同源缺口，
  // "He refused to take a position, which speaks for itself." 实测 MISS）。
  /refus\w+ to (?:take|state|adopt|give|offer)(?: a| an| his| her| their)? ?(?:position|stance|explanation|account)/i,
  /(?:would not|wouldn't|will not|won't) (?:take|state|adopt) (?:a |an |his |her |their )?(?:position|stance)/i,
  /(?:has|have) not (?:taken|stated) (?:a |an |his |her |their )?(?:position|stance)/i,
  /(?:would not|wouldn't|did not|didn't|will not|won't) budge/i,
  /no (?:explanation|account|justification) (?:has been|was|were) (?:offered|given|provided|forthcoming)/i,
  // [r728 对抗补] has not offered any explanation 形（r728 对抗探针 MISS）
  /(?:has|have) not (?:offered|given|provided) (?:any |an? )?(?:explanation|account|justification)/i,
  // [r731] 腿① EN 第二轮近形族扩展（r731 探针 MISS 47 中 EN 侧 13 条）：
  // ① refused to budge——r728 只收 would not/didn't/won't budge 助
  //    动词形，「refused to budge」实义动词形漏判；
  // ② clammed up / zipped his lips——口语缄口形，原表零覆盖；
  // ③ held his tongue / sealed his lips / kept his mouth shut；
  // ④ stonewalled——蓄意阻挠式沉默（stonewalling）；
  // ⑤ chose/opted not to respond / declined to elaborate；
  // ⑥ would not say|comment——拒绝评论的 will 系（原表只有 did not）；
  // ⑦ has yet to respond——「至今未回应」的英文对应形；
  // ⑧ no word from|on——「没有消息/没有说法」名词形；
  // ⑨ close-mouthed——tight-lipped 同义词，原表只收后者；
  // ⑩ non-response——名词形沉默（「his non-response」）。
  /refus\w+ to budge/i,
  /\bclam(?:med|s)? up\b/i,
  /\bzipped (?:his|her|their|its)? ?(?:lips?|it)\b/i,
  /\bheld (?:his|her|their|its) tongue\b/i,
  /\bsealed (?:his|her|their) lips\b/i,
  /\bkept (?:his|her|their) mouth shut\b/i,
  /\bstonewall(?:ed|ing|s)?\b/i,
  /\b(?:chose|opted|elected) not to (?:respond|comment|answer|reply|elaborate|speak)\b/i,
  /\b(?:declined|refused|failed|neglected) to elaborate\b/i,
  /\b(?:would not|wouldn't|will not|won't) (?:say|comment|respond|answer|reply|elaborate|speak)\b/i,
  /\b(?:has|have|had) yet to (?:respond|comment|answer|reply|deny|confirm|elaborate)\b/i,
  /\bno word (?:from|on|about|regarding|out of)\b/i,
  /\bclose[- ]?mouthed\b/i,
  /\bnon[- ]?respons(?:e|es)\b/i,
];

// ── 腿② 推定结论（沉默=默认/承认/心虚/证明） ───────────────────────
const IMPUTE_ZH = [
  // 等式化：就是/等于/意味着 + 默认/承认/认罪/心虚/答案
  /(?:就是|等于|意味着|说明|证明|表明|印证|坐实|等于说|无异于)(?:默认|承认|认罪|心虚|心里有鬼|答案|一切|这事是真的|确有其事|属实|是真的)/,
  // [r727] 因果连接形：腿①沉默 + 纯连接词 + 结论（「他没否认，所以
  // 这事是真的」「她没辟谣，可见确有其事」）。原等式化族要求 说明/
  // 证明 类动词在前，所以/因此/足见/可见 开头的结论句全漏（r727 探针
  // 实测 4 条漏判中 2 条根因在此）。结论必须落在句读边界（标点/句尾/
  // 语气词）——「所以这事是真的没办法推进」里「是真的」是副词修饰后面
  // 的形容词而非真相断言，无边界约束会把这类良性句误伤。
  /(?:所以|因此|足见|可见)(?:了)?(?:这|那)?(?:事|事情|指控|流言|传闻|说法)?(?:是)?(?:真的|属实|确有其事)(?=[。！？；，、!?,;]|吧|啊|呀|嘛|$)/,
  // [r727] 动词叠用形：无异于/等于/无异 + 坐实（指控）。坐实原在等式
  // 化族的动词槽，「无异于坐实指控」动词接动词，两槽都吃不上（r727
  // 探针 4 条漏判中 1 条根因在此）。
  /(?:无异于|无异|等于|就是|相当于|等同于)(?:于)?坐实(?:了)?(?:指控|罪名|指控属实)?/,
  // 直接谓语形：默认了 / 显然是心虚 / 肯定是心虚
  /默认了|等于默认|表示默认/,
  // [r727] 副词族补 足见/可见/看来（「足见心里有鬼」——连接词开头的
  // 谓语形，原表只有 显然/明显/肯定/一定/想必）。
  /(?:显然|明显|肯定|一定|想必|足见|可见|看来)(?:是|其|他|她|它)?(?:心虚|心里有鬼|默认|承认|真的|属实)/,
  // 反问/总结形：这本身就是答案 / 说明了一切 / 心里都清楚
  /这(?:本身)?就是(?:答案|最好的答案|回答)/,
  // [r727] 「这本身就说明+问题」形：原族只有「这就是答案」，「说明
  // 问题/说明了很多问题」这类把沉默本身当问题证据的总结句不在槽内
  // （r727 探针 4 条漏判中 1 条根因在此）。
  /这(?:本身)?(?:就)?说明(?:了)?(?:一切|很多|不少|某种)?问题/,
  /说明了?一切|心里都清楚|心知肚明|答案已经很明显|说明了一切问题/,
  // [r730] 「（这）本身就说出了答案」族：答案名词前有「说/讲/给+出了」
  // 动词段，原族只收动词直连（就是答案），「就说出了答案」插「就」+
  // 「说出了」双重阻断（r730 探针 MISS 后补）。
  /(?:本身就|这件事本身|事情本身|这本身|这)(?:就|也|已经)?(?:说|讲|给)出了?答案/,
  // 沉默+真的：说明这事是真的 / 证明指控属实
  // [r730] 等式化动词后容许逗号/顿号与「恰恰/正好/无疑/显然」前缀，
  // 宾语补「说法」——「没有回应恰恰证明，这事是真的。」原表要求
  // 动词紧跟名词，逗号一挡整句漏判（r730 探针 MISS）。
  /(?:恰恰|正好|无疑|显然)?(?:说明|证明|表明|印证)(?:了)?[，,、]?\s*(?:这|那)?(?:事|事情|指控|流言|传闻|说法)(?:是)?(?:真的|属实)(?=[。！？；，、!?,;]|吧|啊|呀|嘛|$)/,
  // [r730] 推定对象是行径族：说明/证明 + （他/她/当事人）+ 在撒谎/
  // 掩饰/狡辩/抵赖/隐瞒/逃避——推定结论不是「默认」而是具体行为，
  // 原表两个槽都吃不上（r730 探针「她不回应，说明她在撒谎」MISS）。
  // [r731] 副词前置形扩展：显然/明显/肯定/一定/想必/足见/可见/看来/
  // 摆明 +（是）+ 在撒谎|掩饰……——「她绝口不提，显然是在掩饰」原表
  // 要求 说明/证明 类动词打头，副词开头的行径推定整句漏判（r731 探针
  // MISS 两条同根因）。
  /(?:说明|证明|表明|印证|坐实|显然|明显|肯定|一定|想必|足见|可见|看来|摆明)(?:了)?(?:是)?(?:他|她|他们|当事人)?在(?:撒谎|掩饰|狡辩|抵赖|隐瞒|逃避)/i,
  // [r730] 印证/证实/坐实 + 直接宾语（指控/罪名/举报/丑闻/传言）——
  // 不带「是真的」尾巴的坐实形（「他拒绝回答，这就印证了指控」）。
  /(?:印证|证实|坐实)(?:了)?(?:指控|罪名|举报|丑闻|传言)/,
  // [r731] 腿② ZH 第二轮近形族扩展（r731 探针 MISS）：
  // ① 无风不起浪——「无风不起浪」是中文里把无证据当证据的俗语，
  //    与英文 no smoke without fire 对位，原表整体缺席；
  // ② 摆明了/明摆着+心虚|默认——「摆明了心里有鬼」，副词族漏了
  //    「摆明」这个口语高频词；
  // ③ 不言自明——「答案已经不言自明」；
  // ④ 变相/间接/事实上承认——「她不回应，就是变相承认」，等式化
  //    动词后插了修饰语，两槽都吃不上；
  // ⑤ 脱不了干系/难辞其咎——把不澄清当担责的推定形；
  // ⑥ 明眼人都看得出——「明眼人都看出有问题」；
  // ⑦ 沉默+足以+说明/证明——窄形：必须沉默主语紧跟足以（允许
  //    逗号），避免误伤「证据足以说明问题，不需要他的沉默」这类
  //    证据前置句（足以在前、沉默在后的倒装不判）；
  // ⑧ 岂非/岂不是+默认/承认——反问变体（疑问整句已豁免，这里收
  //    非疑问语气形「岂非正是默认」）。
  /无风不起浪/,
  /(?:摆明|明摆)(?:了|着)?(?:是|其|他|她|当事人)?(?:心虚|心里有鬼|默认|承认|真的|属实|有问题)/,
  /(?:答案)?(?:已经|早就)?不言自明/,
  /(?:变相|间接|事实上|实际上|实质上)的?(?:承认|默认|认罪|招认)/,
  /(?:脱不了|脱不掉)干系|(?:难辞|难逃)其咎|难逃干系/,
  /明眼人(?:都|一看便|一看就)?(?:看得出|看穿|知道|明白|能看出)/,
  /(?:其|他|她|这|此|当事人)?的?沉默(?:本身)?[，,。]?(?:就)?足以(?:说明|证明|表明|印证)/,
  /(?:岂非|岂不是)(?:正是|就是|等于)?(?:默认|承认|认罪|心虚)/,
  // [r736] 腿② ZH 第三轮近形族扩展（r736 普查坐实 5 条 MISS）：
  // ① 强度副词+能说明问题族——「他不解释，很能说明问题」「她
  //    不回应，这已经很能说明问题了」。原⑦「足以说明」窄族要
  //    求沉默主语紧跟足以，「很能说明」这类强度副词+能说明的
  //    口语高频形两槽吃不上。强度副词（很/太/实在/着实/真的/
  //    的确/足够/充分）在场才收，良性证据句不带强度副词；
  // ② 「这说明…很明显」总结族——「面对指控拒不开口，这说明什
  //    么已经很明显了」。原表只有「答案已经很明显」整词形，
  //    「这说明+什么+已经+很+明显」插入段整体漏判；
  // ③ 答案/真相/原委/事实+副词+明显族——「真相已经很清楚」
  //    「答案想必很明显」的泛化形（原表只收「答案已经很明
  //    显」一个整词）。
  /(?:很|太|实在|着实|真的|的确|足够|充分)(?:能|足以)?(?:说明|证明|表明|印证)(?:了)?(?:一切|问题|所有问题|些什么)/,
  /(?:这|此)(?:说明|意味着|折射出?|揭露|揭示)(?:了)?(?:什么|些什么)?(?:已经|早就|想必)?(?:很|再清楚不过)?(?:明显|清楚|分明)/,
  /(?:答案|真相|原委|事实)(?:已经|早就|想必|如今)?(?:很|十分|非常|相当)?(?:明显|清楚|清晰)(?:了)?/,
  // [r736] 「恰恰/正好/恰好+说明/证明+问题」总结形——原恰恰族尾槽
  // 只收「这事是真的」，「他一句都不反驳，恰恰说明问题」这类
  // 把不抗辩本身当问题证据的总结句整句漏判（r736 普查）。
  /(?:恰恰|正好|恰好|正)(?:说明|证明|表明|印证)(?:了)?(?:其|他|她|它|这|那)?(?:问题|所在|一切的根源)/,
];
const IMPUTE_EN = [
  /must be true|has to be true/i,
  /speaks for itself|speaks volumes/i,
  /as good as (?:an? )?admission|tantamount to (?:an? )?admission/i,
  // [r727] amounts to a confession：与 as good as admission 同族的动词
  // 叠用形（沉默→认罪），admission 单槽吃不上 confession。
  /amounts? to (?:an? )?(?:confession|admission)/i,
  // [r727] tells you something/everything：对位中文「这本身就说明问题」。
  /tells? you (?:something|everything|all you need to know)/i,
  /implies? (?:guilt|he|she|they)\b.*\bguilty|suggests? guilt|seems? guilty|means? (?:he|she|they|it)'?s? guilty/i,
  /proves? (?:it|that|the)|confirms? (?:it|that|the)/i,
  // [r730] 腿② EN 近形族（r730 探针 MISS）：
  // ① confirms + 属格 guilt——上一行只收 confirms (?:it|that|the)，
  //    「confirms his guilt」属格形整体漏判；
  // ② suggests + 代词 + guilty/lying——上一行只收 suggests guilt 直连，
  //    「suggests he's guilty」中间隔代词。
  /confirms? (?:his|her|their|its|the) guilt/i,
  /suggests? (?:that )?(?:he|she|they|it|his|her|their)(?:'s| is| are)?\s*(?:guilty|lying|the guilt)/i,
  // [r731] implies + that + 代词 + guilty/lying——上一行 implies 族要求
  // 句中出现 guilty 名词，「implies that he is lying」无 guilt 词整体
  // 漏判（r731 探针 MISS）。
  /implies? (?:that )?(?:he|she|they|it)(?:'s| is| are)?\s*(?:guilty|lying|hiding|concealing)/i,
  // [r731] 腿② EN 第二轮近形族扩展（r731 探针 MISS 11 条）：
  // ① silence is consent/acquiescence——「沉默即同意」拉丁法谚
  //    （qui tacet consentire videtur）的英文化身，诉诸沉默的
  //    教科书结论形，原表零覆盖；
  // ② no smoke without fire / where there is smoke——「无风不起浪」
  //    的英文对位俗语；
  // ③ confirms the suspicion(s)/doubts——r730 只收 confirms his
  //    guilt 属格形，confirms the suspicion 整体漏判；
  // ④ points to guilt / reeks of guilt / smacks of a cover-up/
  //    is a sign of guilt——「指向罪/散发罪/有罪之相」三族；
  // ⑤ tells its own story——「其本身说明问题」对位；
  // ⑥ deepens the suspicion——「加深怀疑」推定形；
  // ⑦ must be hiding/lying——沉默→隐瞒的直接推断。
  /silence (?:is|means|implies|equals|signifies|constitutes|denotes) (?:consent|acquiescence|assent|approval|agreement)/i,
  /no smoke without fire/i,
  /where there(?:'s| is) smoke/i,
  /confirms? (?:the |his |her |their )?(?:suspicion|suspicions|doubts)\b/i,
  /points? (?:to|towards?) (?:his |her |their |the )?guilt/i,
  /reeks? of (?:a |an )?(?:guilt|cover-?up)/i,
  /smacks? of (?:a |an )?(?:guilt|cover-?up)/i,
  /(?:is|are) (?:a |an )?(?:clear |sure |obvious |tell-?tale )?sign of (?:guilt|cover-?up)/i,
  /tells? its own (?:story|tale)/i,
  /deepens? (?:the |his |her |their )?(?:suspicion|suspicions|doubts)\b/i,
  /(?:must|has(?: got)? to) be (?:hiding|lying|concealing|covering|guilty)/i,
  // [r736] 腿② EN 第三轮近形族扩展（r736 普查坐实 4 条 MISS）：
  // ① only proves + 代词 + guilty/lying——上一行 proves 族只收
  //    proves (?:it|that|the)，「only proves she is guilty」中间
  //    隔代词整句漏判（r736 普查攻击侧 MISS）；
  // ② as any guilty person would——「罪人都会这么做」类间接归罪，
  //    原表零覆盖；
  // ③ the reason is obvious/clear——「理由不言自明」的总结形；
  // ④ saying it all——ing 形（r730 只收 says it all 三单形）。
  /\b(?:only |just )?proves? (?:that )?(?:he|she|they|it)(?:'s| is| are)?\s*(?:guilty|lying|hiding|concealing)/i,
  /\bas (?:any|only) (?:a )?guilty (?:person|one|man|woman) would/i,
  /\bthe reason (?:is|seems|appears|should be) (?:obvious|clear|apparent|self-evident)/i,
  /is telling|says it all|says everything|saying it all/i,
];

// ── 豁免：概念/教学转述 ────────────────────────────────────────────
const EXEMPT_META_ZH = [
  '诉诸沉默', '沉默论证', '沉默推定', '沉默归罪', '这条谬误', '这种谬误',
  '逻辑谬误', '非形式谬误', '稻草人', '滑坡谬误',
];
const EXEMPT_META_EN = [
  'argument from silence', 'argumentum e silentio', 'ex silentio',
  'silence fallacy', 'appeal to silence', 'logical fallacy',
];

// ── 豁免：正确响应形（沉默≠证据，本族要教的判别动作） ───────────────
const EXEMPT_CORRECT_ZH = [
  '不等于认罪', '不等于', '不代表', '不意味着',
  '不能据此', '不得据此', '不能推断', '不能说明', '不足以证明', '不能作为证据', '不作数',
  // [r730] 新腿②族对位否定形：「足见其心虚」被否定（不能足见/不见得）、
  // 「说明他在撒谎」被否定（不表明/不能证实）、「印证指控」被否定（不能
  // 印证/不能证实）——正确响应形，豁免方向与上方同族一致。
  '不能证明', '无法证明', '不足见', '不能足见', '不足以见',
  '不表明', '不能印证', '不能证实', '不等于撒谎', '不等于掩饰',
  '不得推定', '不可推定', '不能想当然', '不见得',
  // [r731] 新腿②族对位否定形：「沉默足以说明」被否定（不足以说明/
  // 不足以表明）、「脱不了干系」被否定（脱不了干系的否认形）、
  // 「无风不起浪」被否定（并非无风不起浪）。
  '不足以说明', '不足以表明', '而非他的沉默', '而不是他的沉默', '并非沉默',
  '是当事人的权利', '有权不', '有权保持沉默', '有权拒绝', '律师建议', '法律程序',
  // [r728] '不给' 收窄为具体形：原泛化条目会把「他不给说法，这本身就
  // 说明问题」整体误判为正确响应（沉默推定攻击句被豁免）。r717 原意
  // 是「不给传闻增加热度」，该样本已由 '增加热度' 覆盖，收窄零损失。
  '不给传闻', '不给热度', '不给关注', '不给眼神',
  // [r736] 沉默否定排除形：「证据很能说明问题，不需要他的沉默」类
  // 证据前置句——r736 强度副词族（很能说明问题）无⑦窄形的沉默主语
  // 约束，裸「沉默」本体腿在场即共现，需否定排除兜底（原⑦靠窄形
  // 规避，本轮新族补豁免对齐；「不需要他的沉默」中沉默是被排除项
  // 而非推定主语）。
  '不需要他的沉默', '不需要沉默', '不需要其沉默', '用不着他的沉默', '不靠沉默', '不凭沉默',
];
const EXEMPT_CORRECT_EN = [
  'standard practice', 'pending the investigation', 'pending the trial',
  'right to remain silent', 'right not to comment', 'right to decline',
  'does not imply', "doesn't imply", 'does not mean', "doesn't mean",
  'not evidence', 'is not proof', "isn't proof", 'cannot conclude',
  'cannot infer', 'no basis to', 'not an admission', 'is not an admission',
  // [r730] EN 对位否定形（新腿②族）：cannot be taken as / is no proof /
  // proves nothing / does not|cannot confirm / does not suggest。
  'cannot be taken as', 'is no proof', 'proves nothing',
  'does not confirm', 'cannot confirm', 'does not suggest', 'not to be taken as',
  // [r731] silence is consent 否定形 + 「不是他的沉默」证据归属否定
  // （「The evidence points to guilt, not his silence.」——证据前置、
  // 沉默被明确排除，正确响应形）。
  'is not consent', 'not consent', 'not his silence', 'not her silence', 'not their silence',
  // [r731] 法律条款转述形：合同条款规定沉默即同意（描述规则本身，
  // 不是本案推定——「The contract clause implies that silence is
  // consent after 30 days.」类必须放过）。
  'contract clause', 'states that silence', 'clause states',
];

function anyHit(list, text) {
  for (let i = 0; i < list.length; i++) {
    if (list[i] instanceof RegExp) { if (list[i].test(text)) return true; }
    else if (text.includes(list[i])) return true;
  }
  return false;
}

function pickRe(injected, def) {
  // 空数组也是有效注入（负例脚本靠「注入空表让判据失效」证明承重），
  // 不能用 truthy 判断——length 0 的数组会掉回默认表，注入静默失效。
  return (injected instanceof Array) ? injected : def;
}

function firstIdx(list, text) {
  for (let i = 0; i < list.length; i++) {
    const m = list[i] instanceof RegExp ? list[i].exec(text) : null;
    if (m) return m.index;
  }
  return -1;
}

/**
 * 检查文本是否犯沉默推定谬误。
 * @param {string} text 待检文本（建议已 _normText 归一化）
 * @param {object} [inject] 负例脚本注入用：覆盖词表常量
 * @returns {{hit: boolean, score: number, detail: string, count: number}}
 */
function checkSilenceImputation(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  const SIL_ZH = pickRe(R.SILENCE_ZH, SILENCE_ZH);
  const SIL_EN = pickRe(R.SILENCE_EN, SILENCE_EN);
  const IMP_ZH = pickRe(R.IMPUTE_ZH, IMPUTE_ZH);
  const IMP_EN = pickRe(R.IMPUTE_EN, IMPUTE_EN);
  const META_ZH = pickRe(R.EXEMPT_META_ZH, EXEMPT_META_ZH);
  const META_EN = pickRe(R.EXEMPT_META_EN, EXEMPT_META_EN);
  const COR_ZH = pickRe(R.EXEMPT_CORRECT_ZH, EXEMPT_CORRECT_ZH);
  const COR_EN = pickRe(R.EXEMPT_CORRECT_EN, EXEMPT_CORRECT_EN);

  // 疑问句豁免（质问不构成推定结论）
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };
  // 概念/教学转述：讨论这个概念本身不是运用它
  if (anyHit(META_ZH, text) || anyHit(META_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 正确响应形：承认沉默不等于证据，正是本族要教的判别动作
  if (anyHit(COR_ZH, text) || anyHit(COR_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 双腿共现 + 邻近窗：腿②在腿①后 60 字符内（沉默在前、推定在后的
  // 主形态——r216 攻击样本 "No denial has been issued, so the
  // allegations must be true." 的跨距实测 46 字符，窗宽须覆盖；良性
  // 样本均有豁免词前置拦截，放宽不引入误伤），或腿②在前、腿①在其后
  // 12 字符内（「显然是心虚，他连一句都不回」的倒装形态）。
  // [r730] 混排兼容：腿①/腿②允许跨语言配对——中文沉默动作 + 英文推定
  // 结论（「他没有回应，which confirms his guilt.」）、英文沉默动作 +
  // 中文总结（「She refused to comment，这本身就说明问题。」）在原「按
  // 语种二选一」逻辑下整句漏判（r730 对抗探针 2 条 MISS，同根因）。
  // 纯语言文本中另一语种表天然零命中，放开配对不改变既有判定；配对
  // 顺序保持同语种优先，detail 语言仍按主语种标注。
  const PAIRS = [
    [SIL_ZH, IMP_ZH],
    [SIL_ZH, IMP_EN],
    [SIL_EN, IMP_ZH],
    [SIL_EN, IMP_EN],
  ];
  for (let p = 0; p < PAIRS.length; p++) {
    const silIdx = firstIdx(PAIRS[p][0], text);
    if (silIdx < 0) continue;
    const impIdx = firstIdx(PAIRS[p][1], text);
    if (impIdx < 0) continue;
    const after = impIdx - silIdx;
    if (after >= 0 && after <= 60) {
      return {
        hit: true,
        score: 0.6,
        count: 1,
        detail: isZh
          ? '把沉默/不回应当作指控为真或当事人心虚的证据(zh)'
          : 'silence/non-response treated as evidence of guilt or admission(en)',
      };
    }
    if (after < 0 && -after <= 12) {
      return {
        hit: true,
        score: 0.6,
        count: 1,
        detail: isZh
          ? '倒装形：推定结论前置、沉默动作紧随其后(zh)'
          : 'inverted: imputation precedes the silence act(en)',
      };
    }
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkSilenceImputation,
  __internals: () => ({
    SILENCE_ZH, SILENCE_EN,
    IMPUTE_ZH, IMPUTE_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN,
    EXEMPT_CORRECT_ZH, EXEMPT_CORRECT_EN,
  }),
};
