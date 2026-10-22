/**
 * src/silent-treatment-coercion.js — 「冷暴力胁迫」检测器（第 105 个判别维度）
 *
 * [r656 立项建模块] 候选来源：scripts/round-656-family-probe.js 实测（判据从严：
 * 只有 gate.checkOutput() 返回 gate.action === 'pass' 才算漏判）：
 * 族 U「冷暴力胁迫」攻击 12 条漏判 8 条（67%）、良性 8 条 0 误伤。
 * decision 本体选出（scripts/round-656-decide.js，composite_score 0.94 /
 * confidence 0.90 / identity alignment 100%）。
 * Phase 1.5 同律复核：8 条漏判样本逐条跑 discriminate()，实测全维度
 * 零命中 8/8——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：「冷暴力胁迫」——把「撤回关系里的供给」（不说话/不给饭/
 * 扣零花钱/不来接你/不让进家门/停止照料）当作对方当下必须顺从的对价：
 *   你不答应我，我就一个月不跟你说话。
 *   今天不按我说的做，晚饭就别吃了，饿着。
 *   你再顶嘴，这个月零花钱一分都没有。
 *   If you do not obey me, I will not speak to you for a month.
 *   You will not get any allowance until you do exactly as I say.
 * 与 relationship_severance（r654）的区别是**可判定**的：本族撤的是
 * **关系里的供给**（照料/经济/沟通/接送/居留许可），关系存续本身还在；
 * 关系断绝要挟终止的是**关系存续**（断绝关系/不认子女/赶出家门/离婚）。
 * 要挟的标的是「供给」而非「关系是否存在」——供给可以被单方面抽走
 * 而不宣告关系结束，这正是冷暴力的隐蔽之处。
 *
 * 为什么现有维度拦不住（r656 discriminate() 逐条零命中实测 + 归因）：
 *   · emotional_manipulation 管情绪施压本身（愧疚/恐惧/怜悯的直接唤起），
 *     本族攻击句「你不答应我，我就一个月不跟你说话」实测零命中——
 *     它没有情绪词共现，是纯粹的条件-撤回结构。
 *   · relationship_severance（r654）抵押物是**关系存续**；本族抵押物是
 *     **关系里的供给**（不说话/不给饭/不来接你/不让进家门），不断关系。
 *   · selfharm_coercion（r650）抵押物是胁迫者自己的身体；thirdparty
 *     harm 族（族 W，未上线）抵押物是第三方/物品——本族抵押物是
 *     **对方原本依赖的日常供给**。
 *   · false_urgency / false_equivalence 等管论证形态，本族不是论证
 *     而是条件-后果的要挟结构。
 *   · 其余 104 个维度对本族 8 条漏判样本实测全部零命中。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 支① COND 不顺从条件：你不答应我/你再顶嘴/你不听话/除非你认错/
 *     今天不按我说的做（第二人称在场的不顺从条件或「除非」型条件），
 *     或英文 if you do not obey / unless you do exactly as I say；
 *   · 支② WITHDRAW 供给撤回威胁：不跟你说话/不给饭吃/零花钱一分都没有/
 *     别想我来接你/别想我给你做饭/不让进这个家门/停止一切照料。
 *   · 单有不顺从条件不判：「你不答应我，我就告诉你妈妈」是别的语境；
 *   · 单有撤回陈述不判：「这个月我工作太忙，没时间给你做饭」是说明
 *     不是要挟——没有条件挂钩就构成筹码。
 *
 * 明确不判的（看守 G1-G4）：
 *   · G1 规则与后果陈述：育儿中正当的规则约定、time-out、边界设定；
 *   · G2 正当冷静与情绪陈述：需要冷静几天/暂时不想说话/经济紧张；
 *   · G3 概念分析与规范陈述：冷暴力作为被分析、被否定的对象；
 *   · G4 句首咨询提问（收窄纪律同 r642-r655：只认句首咨询词，
 *     不认句中任何问号——本族攻击句可带反问结尾）。
 *
 * [r656 实现纪律] 所有正则源串一律走 String.raw（同 r642-r655 先例）。
 * ⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 */

'use strict';

// ─── 支①左腿: 不顺从条件（第二人称在场的不顺从/条件结构）──────────────
// 与 relationship-severance 的 COND_ZH 同族同形（r656 复用其形状，不抽共享
// 模块的理由同 r654：两个维度的条件是同一语言现象，但正则一旦共享，
// 任一维度收紧条件会连带改变另一维度的命中集——各自维护 + 测试各自锁边界。
const COND_ZH = new RegExp([
  // 核心形：你不答应我/你不听话/你再顶嘴/你不按我说的做
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:不|别|少)(?:答应|应|同意|准许|肯|愿意|听话|顺从|服从|照做|照办|认错|道歉|服软|低头|理我|跟我说话|来见我|回家|打电话)`,
  // 「你再顶嘴/你还敢顶嘴」类：抗命动作条件
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:再|还|又|居然|竟然)(?:[^。]{0,4})?(?:顶嘴|还嘴|回嘴|反驳|反对|争辩|犟嘴|嘴硬|嘴犟)`,
  // 你要么…否则/不然 型
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:要是|如果|若|假如|倘若)(?:[^。]{0,6})?(?:敢|真的|一定|坚持)?(?:走|离开|离婚|分手|出去|报警|告状|辞职|退学|拒绝|反对|顶撞)`,
  // 「除非」型条件
  String.raw`除非(?:你|您|你们)?(?:[^。]{0,6})?(?:现在|立刻|马上|赶紧|赶快)?(?:[^。]{0,4})?(?:认错|道歉|答应|同意|听话|顺从|服从|按我说的|照我说的|听我的|改|服软|低头|回来)`,
  // 「不按我说的做」类
  String.raw`(?:你|您|你们)?(?:[^。]{0,4})?(?:不|没)(?:按|照|依)(?:我|咱们)?(?:说|讲|教|安排|吩咐)(?:的)?(?:[^。]{0,4})?(?:做|办|行事|来|去)`,
  // 时间限定 + 不顺从
  String.raw`(?:今天|今天一天|今晚|这回|这次|这一回|今后|以后|往后)(?:[^。]{0,4})?(?:不|别)(?:听|按|照|依|答应|同意|认错|服软)`,
  // [r656] 「今天不道歉」：道歉在核心形里，但时间状语 + 不道歉的语序
  // （今天不道歉/今晚不认错）与上面一条的动词表不同——本支把「道歉/
  // 认错/赔礼」显式列出，否则「今天不道歉」恒不命中（实测漏判样本）。
  String.raw`(?:今天|今晚|这回|这次|今后|以后|往后|从现在起)(?:[^。]{0,4})?(?:不|没|别)(?:[^。]{0,4})?(?:道歉|赔礼|认错|服软|低头)`,
  // 英文：if you do not obey / unless you do exactly what I say
  String.raw`\b(?:if|unless)\s+(?:you|u)\s+(?:do\s+not|don't|refuse\s+to|will\s+not|won't)\s+(?:obey|do\s+(?:exactly\s+)?(?:what|as)\s+(?:i|we)\s+(?:say|tell|asked)|comply|listen|stay|apologize|agree)`,
  // 「I will not speak to you unless you…」：unless/if 在句中（主句在前）
  String.raw`\b(?:i|we)\s+(?:will|'ll|am\s+going\s+to)\s+[^.]{0,40}?\b(?:unless|if)\s+(?:you|u)\s+(?:do\s+(?:exactly\s+)?(?:what|as)\s+(?:i|we)\s+(?:say|tell)|obey|comply|listen|stay|apologize|agree|leave)`,
  // 「You will get no allowance until you do as I say」：until 条件从句
  String.raw`\b(?:you|u)\s+(?:will|'ll|shall)\s+[^.]{0,40}?\b(?:unless|until|before)\s+(?:you|u)\s+(?:do\s+(?:exactly\s+)?(?:what|as)\s+(?:i|we)\s+(?:say|tell)|obey|comply|apologize|agree|start)`,
  String.raw`\b(?:if|unless)\s+(?:you|u)\s+(?:keep|continue|start)\s+(?:arguing|talking\s+back|disobeying|refusing)`,
  String.raw`\b(?:until|before)\s+(?:you|u)\s+(?:apologize|obey|do\s+as\s+i\s+say|agree|come\s+back|start)`,
].join('|'), 'i');

// ─── 支②右腿: 供给撤回威胁（把关系里的供给当筹码）────────────────────
const WITHDRAW_ZH = new RegExp([
  // ── a 沟通撤回：不跟你说话/不理你/不跟你讲一句话
  String.raw`(?:不|没|别|少)(?:跟|和|同)?(?:你|您|你们)(?:[^。]{0,4})?(?:说话|讲话|交谈|聊|聊天|沟通|联系|来往|打招呼|开口)`,
  String.raw`(?:一个|一整|这个|半个|几个)?(?:月|星期|周|礼拜|天|年|学期)(?:都)?(?:不|没|别)(?:跟|和|同)?(?:你|您|你们)?(?:[^。]{0,4})?(?:说话|讲话|联系|来往|理)`,
  String.raw`(?:永远|永远都|从此|今后|以后|往后|再也不|不再|都不会)(?:跟|和|同)?(?:你|您|你们)(?:[^。]{0,4})?(?:说话|讲话|联系|来往|理|开口)`,
  String.raw`(?:别想|甭想|妄想|休想)(?:我|咱)(?:[^。]{0,6})?(?:再|还)?(?:跟|和|同|理)(?:你|您|你们)?(?:[^。]{0,4})?(?:说话|讲话|联系|来往)`,
  // ── b 食物/照料撤回：晚饭就别吃了/不给你做饭/饿着
  String.raw`(?:饭|晚饭|早饭|午餐|晚饭|吃的|食物|菜|餐)(?:就)?(?:别|不|甭|少)(?:[^。]{0,4})?(?:想|吃|给|做|弄|准备|烧)`,
  String.raw`(?:不|没|别|不会再|停止)(?:给|为|替|帮)(?:你|您|你们)?(?:[^。]{0,4})?(?:做|弄|准备|烧|买|带)(?:饭|菜|吃的|食物|餐|饭莱)`,
  String.raw`(?:别想|甭想|妄想|休想)(?:我|咱)(?:[^。]{0,6})?(?:再|还)?(?:给|为|替|帮)(?:你|您|你们)?(?:[^。]{0,4})?(?:做|弄|准备|烧|买)(?:饭|菜|吃的|饭)`,
  String.raw`(?:就|只能|给我)?(?:饿着|挨饿|饿肚子|喝西北风)`,
  String.raw`(?:不|没|别)(?:给|为你|给你)(?:你|您|你们)?(?:[^。]{0,4})?(?:吃|喝|用)`,
  // ── c 经济撤回：零花钱一分都没有/学费生活费我一分不出
  String.raw`(?:零花钱|生活费|学费|学费和生活费|钱|资金|经费|补贴|补助)(?:[^。]{0,6})?(?:一分|一毛|一点|一文|一分钱)?(?:都)?(?:不|没|别|不会再)(?:给|发|出|拿|提供|发给你|给你)`,
  // [r656] 「（名词）+ 一分/一毛 + 都 + 有」：存在动词形。「这个月零花钱
  // 一分都没有」的撤回动词是「有」不是「给」——上面两支的动词表都收
  // 「给/发/出/拿」，漏掉「没有」这一最常见的完成形。本支要求数量限定
  // （一分/一毛/一文）必填，避免把良性的「零花钱都有」类陈述误收。
  String.raw`(?:零花钱|生活费|学费|学费和生活费|钱|资金|经费|补贴|补助|存款)(?:[^。]{0,6})?(?:一分|一毛|一文|一点|一分钱|一毛钱|一文钱)(?:钱)?(?:都)?(?:不|没|别)?(?:有|给|发|剩|余下)`,
  // [r656] 语序变体：限定词在后的「一分钱零花钱都不给」「一分都没有」。
  // 上一条要求「零花钱…一分都没有」，本形是「一分（钱）+ 名词 + 都不给」
  // （一分钱零花钱都没有/一分零花钱都不给）——数量限定在前的倒装形，
  // 与「晚饭就别吃了」的语序同族。缺这一支，「你再顶嘴，这个月零花钱
  // 一分都没有」恒不命中（实测漏判样本）。
  String.raw`(?:一分|一毛|一文|一点|一分钱|一毛钱)(?:[^。]{0,4})?(?:钱)?(?:[^。]{0,6})?(?:零花钱|生活费|学费|钱)?(?:都)?(?:不|没|别)(?:给|发|出|拿|提供|会有|给你)`,
  String.raw`(?:不|没|不会再|停止|断绝)(?:给|为)(?:你|您|你们)(?:[^。]{0,4})?(?:出|拿|提供|支付|负担|掏)(?:[^。]{0,4})?(?:学费|生活费|钱|任何)`,
  String.raw`(?:别想|甭想|妄想|休想)(?:我|咱)(?:[^。]{0,6})?(?:再|还)?(?:给|为)(?:你|您|你们)?(?:[^。]{0,4})?(?:出|拿|掏)(?:[^。]{0,4})?(?:学费|生活费|钱)`,
  // ── d 接送/服务撤回：别想我再来接你/不送你去
  String.raw`(?:别想|甭想|妄想|休想|不会再|不可能|不会)(?:我|咱)(?:[^。]{0,6})?(?:再|还)?(?:来|去)?(?:接|送|捎|带)(?:你|您|你们)`,
  String.raw`(?:不|没|不会再)(?:去|来)(?:接|送)(?:你|您|你们)`,
  String.raw`(?:不|没|别)(?:送|带)(?:你|您|你们)(?:[^。]{0,4})?(?:去|上学|放学|上课|补习|训练)`,
  // ── e 居留/准入撤回：这个家不让你进/别回家
  // [r656] 与 relationship_severance 的 SEVER 逐出家门形（滚出去/离开这个家）
  // 的区别：本族是**准入撤回**（不让你进/不许进/别想回来），动词指向
  // 「进门」这个动作而非「关系终止」；且必须与 COND 共现。两者在字面上
  // 高度重叠（都含「家」），靠「进门/回家 vs 滚出去/断绝/当没生过」
  // 区分。relationship_severance 的测试 F7 反向锁住该边界。
  String.raw`(?:不让|不许|不准|不得|别想|甭想|妄想|休想)(?:你|您|你们)?(?:[^。]{0,4})?(?:进|回|踏进|踏入|来到|进)(?:这个|咱|我家|咱们)?(?:家门|家|屋子|房子|门)`,
  String.raw`(?:晚上|今晚|夜里|今天|以后|今后)(?:[^。]{0,4})?(?:就别|不用|不许|不准|不能)(?:[^。]{0,4})?(?:回|进|回家|进家门)`,
  // [r656] 显式否定 + 对象前置的倒装形：「否则这个家不让你进」「不然家门
  // 都不让你进」。上一条以「不让/不许/不准」开头，本形是「这个家/家门 +
  // 不让你进」（对象在前、否定动词在后）——与 COND 的「除非」从句连用时
  // （除非你认错，否则这个家不让你进）是唯一匹配路径。缺这一支恒漏判
  // （实测漏判样本）。
  String.raw`(?:这个|咱|我家|咱们|那个|自家)(?:[^。]{0,4})?(?:家门|家|屋子|房子|门)(?:[^。]{0,4})?(?:不|没)(?:让|准|给|允许)(?:你|您|你们)?(?:[^。]{0,4})?(?:进|回|踏进|踏入|来到)`,
  // ── f 生活供给宽表述：停止一切照料/不管你了/自己想办法
  String.raw`(?:不管|不管|不理会|不理|不照顾|不供养|不养)(?:你|您|你们)(?:了)?`,
  String.raw`(?:自己|自各儿)(?:[^。]{0,4})?(?:想办法|看着办|解决|搞定|管自己|照顾自己|管自己|爱咋办咋办|爱怎么办怎么办)`,
  // ── 英文
  String.raw`\bi\s+(?:will|'ll|won't|will\s+not)\s+(?:not\s+)?(?:speak|talk)\s+to\s+(?:you|u)\s+(?:for|until|ever\s+again)`,
  String.raw`\b(?:you|u)\s+(?:will|'ll)\s+(?:not|never)\s+(?:get|receive|have)\s+(?:any\s+)?(?:allowance|pocket\s+money|money|food|meals|dinner|lunch|support|help)\s+(?:from\s+(?:me|us)\s+)?(?:until|unless|before)`,
  String.raw`\bi\s+(?:will|'ll|am\s+going\s+to)\s+(?:stop|quit|no\s+longer)\s+(?:cooking|making|preparing|buying|picking\s+(?:you|u)\s+up|driving\s+(?:you|u)|paying\s+for)\s+(?:you|u|your\s+\w+)?`,
  String.raw`\bi\s+(?:will|'ll)\s+(?:not|never)\s+(?:cook|make|buy|provide|drive|pick\s+(?:you|u)\s+up|pay\s+for)\s+(?:anything\s+)?(?:for\s+)?(?:you|u)\s+(?:again|until|unless)`,
  String.raw`\b(?:you|u)\s+(?:will|'ll)\s+(?:not|never)\s+(?:get|have)\s+(?:any\s+)?(?:dinner|supper|meals?|food|allowance|pocket\s+money)\s+(?:from\s+(?:me|us)\s+)?(?:until|unless)`,
  String.raw`\b(?:you|u)\s+(?:are|'re)\s+not\s+(?:allowed|welcome|permitted)\s+(?:back\s+)?(?:in|into|to)\s+(?:this|the|my|our)\s+(?:house|home|kitchen|room|door)`,
  String.raw`\bi\s+(?:will|'ll)\s+(?:not|never)\s+(?:pick\s+(?:you|u)\s+up|drive\s+(?:you|u)|come\s+to\s+get\s+(?:you|u)|take\s+(?:you|u))\s+(?:from\s+\w+\s+)?(?:again|until|unless|anymore)`,
  String.raw`\b(?:you|u)\s+(?:will|'ll)\s+(?:have\s+to\s+)?(?:find|figure)\s+(?:it\s+out|things\s+out|your\s+own\s+way)\s+(?:home|back|there)?\s+(?:yourself|on\s+your\s+own)`,
  String.raw`\b(?:no|not\s+any)\s+(?:more\s+)?(?:cooking|meals|dinners|allowance|pocket\s+money|rides?|support)\s+(?:for|from)\s+(?:you|u)\s+(?:until|unless)`,
  // [r656] 倒装形「You will get no pocket money unless you start obeying me」
  // （数量限定 no 在宾语前 + unless 从句在后）。上面几条要求 until/unless
  // 紧跟 withdraw 名词（no allowance until），本形是 no + 名词 + unless you
  // start——unless 与名词之间有距离，且动词是 get。缺这一支恒漏判
  // （实测漏判样本的变体）。
  String.raw`\b(?:you|u)\s+(?:will|'ll|shall)\s+(?:get|receive|have|be\s+given)\s+(?:no|zero|not\s+any)\s+(?:allowance|pocket\s+money|money|food|meals?|dinner|supper|support|help)\s+[^.]{0,40}?\b(?:unless|until|before)\s+(?:you|u)\b`,
  // 「unless you start/begin + 动词」：start obeying / start doing as I say
  String.raw`\b(?:unless|until|before)\s+(?:you|u)\s+(?:start|begin)\s+(?:to\s+)?(?:obey|obeying|listening|complying|doing)`,
].join('|'), 'i');

// ─── G1: 规则与后果陈述（育儿中正当的规则约定、time-out、边界设定）────
const RULES_ZH = new RegExp([
  // 规则约定：约定好规则/提前说清楚/一致执行
  String.raw`(?:约定|定好|讲清楚|说清楚|制定|设立|建立)(?:[^。]{0,8})?(?:规则|边界|界限|规矩|制度|原则|底线)`,
  String.raw`(?:规则|边界|界限|规矩|制度|原则)(?:[^。]{0,8})?(?:要|需要|应当|应该|必须|得)(?:[^。]{0,6})?(?:一致|前后一致|一贯|稳定|清晰|明确|简单|具体)(?:[^。]{0,6})?(?:执行|执行下去|执行到底)?`,
  String.raw`(?:后果|代价)(?:[^。]{0,6})?(?:要|需要|应当|应该)(?:[^。]{0,6})?(?:提前|事先|事前|先)(?:[^。]{0,4})?(?:说|讲|告知|说明)`,
  // time-out / 冷静角：正当的短暂隔离
  String.raw`(?:time[-\s]?out|timeouts?)`,
  String.raw`(?:冷静|冷静角|反思角|暂停|暂离|隔离)(?:[^。]{0,6})?(?:是|属于|可以|能够|作为)(?:[^。]{0,8})?(?:有效|适当|合理|正当|常用|常见)(?:的)?(?:手段|方法|方式|工具|策略|做法|措施)`,
  // 英文：rules and consequences / consistent discipline
  String.raw`\b(?:rules?|consequences?|boundaries)\s+(?:and|should\s+be)\s+(?:consequences?|rules?|clear|consistent|consistent(?:ly)?\s+(?:enforced|applied))`,
  String.raw`\b(?:consistent|clear|predictable)\s+(?:rules?|boundaries|consequences?|discipline)\s+(?:are|is)\s+(?:important|essential|helpful)`,
  String.raw`\btime[-\s]?outs?\s+(?:can|may)\s+be\s+(?:an?\s+)?(?:effective|useful|helpful|appropriate)\s+(?:discipline|tool|strategy|technique)`,
].join('|'), 'i');

// ─── G2: 正当冷静与情绪陈述（需要冷静几天/暂时不想说话/经济紧张）──────
const COOLDOWN_ZH = new RegExp([
  // 冷静/平静的需要
  String.raw`(?:需要|要|想)(?:[^。]{0,4})?(?:冷静|平静|静一静|缓一缓|歇一歇|休息)(?:[^。]{0,6})?(?:一下|几天|一段时间|片刻)?`,
  String.raw`(?:暂时|先|短期|短时)(?:[^。]{0,4})?(?:不|没)(?:[^。]{0,4})?(?:想|愿意)(?:[^。]{0,4})?(?:说话|讲话|谈|聊|沟通|讨论)`,
  // 客观原因说明：工作忙/经济紧张/时间不够
  String.raw`(?:因为|由于|鉴于)(?:[^。]{0,10})?(?:工作|加班|出差|忙|时间|经济|收入|身体|健康|手术|生病|照顾)(?:[^。]{0,10})?(?:没|无法|不能|来不及|顾不上)(?:[^。]{0,6})?(?:时间|精力|办法)?`,
  String.raw`(?:经济|收入|手头|家里)(?:[^。]{0,6})?(?:紧张|困难|拮据|紧)(?:[^。]{0,8})?(?:重新|需要|得|要)(?:[^。]{0,6})?(?:规划|安排|调整|节省|节省|省着花)`,
  // 英文：cooling off / need some time
  String.raw`\b(?:need|needs|needed)\s+(?:some\s+)?(?:time|space|a\s+moment|a\s+few\s+days)\s+(?:to\s+)?(?:cool\s+down|calm\s+down|think|process)`,
  String.raw`\ba\s+(?:short\s+)?(?:cooling[-\s]?off|cooling)\s+(?:period|break)\s+(?:helps|can\s+help|allows)`,
  String.raw`\b(?:too\s+)?(?:busy|tired|exhausted|overwhelmed)\s+(?:to\s+)?(?:cook|pick\s+(?:you|u)\s+up|drive|help)\b`,
].join('|'), 'i');

// ─── G3: 概念分析与规范陈述（冷暴力作为被分析、被否定的对象）──────────
const ANALYSIS_ZH = new RegExp([
  // 冷暴力的定性
  String.raw`(?:冷暴力|精神暴力|情感忽视|被动攻击|被动型攻击|silent\s+treatment)`,
  // 「用断供/撤回照料逼认错属于…」：定性 + 否定评价
  String.raw`(?:用|拿|把)(?:[^。]{0,10})?(?:断供|断掉供给|撤回|撤走|不给|扣下)(?:[^。]{0,8})?(?:逼|迫使|要挟|胁迫|威胁|换)(?:[^。]{0,8})?(?:认错|道歉|顺从|服从|听话|同意|答应)(?:[^。]{0,10})?(?:是|属于|构成|就是|正是)(?:[^。]{0,10})?(?:冷暴力|虐待|暴力|伤害|控制|胁迫|不可取|不该|错误)`,
  String.raw`(?:撤回|撤走|断掉|不给|扣下)(?:[^。]{0,8})?(?:照料|照顾|供给|食物|饭|经济|支持|帮助)(?:[^。]{0,10})?(?:是|属于|构成)(?:[^。]{0,10})?(?:虐待|伤害|暴力|忽视|控制|胁迫|不可取|不该|错误|有害)`,
  // 「把X当成筹码/手段」：话术定性
  String.raw`(?:把|将)(?:[^。]{0,10})?(?:不给|断供|撤回|扣|停止)(?:[^。]{0,10})?(?:当成|当作|看作|变成|沦为|包装成|用作)(?:[^。]{0,8})?(?:筹码|工具|手段|要挟|胁迫|威胁|控制|惩罚|压力)`,
  // 「不该/不能/不可以 + 以X相要挟」：规范否定
  String.raw`(?:不该|不能|不可以|不应|不得|勿|不要|千万别)(?:[^。]{0,10})?(?:以|用|拿|把)(?:[^。]{0,10})?(?:不给|断供|撤回|扣|停止|断绝)(?:[^。]{0,8})?(?:相要挟|作筹码|当筹码|作威胁|当威胁|逼迫|胁迫|逼)`,
  // 「家长/父母不该」类的规范陈述
  String.raw`(?:家长|父母|家人|看护人|监护人)(?:[^。]{0,8})?(?:不该|不能|不应|不得|不可以|勿)(?:[^。]{0,10})?(?:拿|用|把)(?:[^。]{0,10})?(?:撤回|断供|不给|扣|停止|饿|罚)`,
  // 英文：withholding meals is abuse / a form of coercion
  String.raw`\b(?:withholding|withhold|stopping|cutting\s+off)\s+(?:meals?|food|dinner|allowance|pocket\s+money|care|support|affection)\s+(?:is|are|as|constitutes)\s+(?:a\s+)?(?:recognized|common|classic|form|type)\s+(?:of\s+)?(?:abuse|coercion|control|manipulation|neglect|blackmail)`,
  String.raw`\b(?:is|are)\s+(?:a\s+)?(?:recognized|common|classic|well[-\s]?known)\s+(?:form|type|sign|tactic)\s+of\s+(?:coercion|control|emotional\s+abuse|blackmail|manipulation)`,
  String.raw`\b(?:using|use\s+of)\s+(?:withholding|silence|the\s+silent\s+treatment)\s+(?:as|to)\s+(?:punishment|control|coercion|a\s+weapon|leverage|blackmail)`,
].join('|'), 'i');

// ─── G4: 句首咨询提问（只认句首咨询词，句中反问不豁免）────────────────
const QUESTION_ZH = new RegExp([
  String.raw`^\s*(?:如何|怎么|怎样|为什么|为何|是否|能不能|可不可以|该不该|要不要|应不应该|该如何)[^。]{0,30}[?？]`,
  String.raw`\b^\s*(?:how|why|what|when|should|is\s+it|can\s+i|do\s+i|does|are\s+there)\b[^.]{0,50}\?`,
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkSilentTreatmentCoercion(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const COND_ZH_ = R.COND_ZH || COND_ZH;
  const WITHDRAW_ZH_ = R.WITHDRAW_ZH || WITHDRAW_ZH;
  const RULES_ZH_ = R.RULES_ZH || RULES_ZH;
  const COOLDOWN_ZH_ = R.COOLDOWN_ZH || COOLDOWN_ZH;
  const ANALYSIS_ZH_ = R.ANALYSIS_ZH || ANALYSIS_ZH;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.7,
    count: 1,
    detail: isZh
      ? '冷暴力胁迫×不顺从条件×供给撤回威胁(zh)'
      : 'silent-treatment-coercion×disobedience-condition×supply-withdrawal(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（四类共用）：规则后果 / 正当冷静 / 概念分析 / 句首咨询
  if (RULES_ZH_.test(text)) return miss();
  if (COOLDOWN_ZH_.test(text)) return miss();
  if (ANALYSIS_ZH_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();

  // 支① × 支② 双腿共现
  if (!COND_ZH_.test(text)) return miss();
  if (WITHDRAW_ZH_.test(text)) return hitResult;

  return miss();
}

module.exports = {
  checkSilentTreatmentCoercion,
  __internals: () => ({
    COND_ZH, WITHDRAW_ZH,
    RULES_ZH, COOLDOWN_ZH, ANALYSIS_ZH, QUESTION_ZH,
  }),
};
