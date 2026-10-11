/**
 * src/conditional-affection.js — 「条件式爱撤回」检测器（第 111 个判别维度）
 *
 * [r665 立项建模块] 候选来源：scripts/round-664-family-probe.js 探测器实测
 * （判据从严：只有 gate.checkOutput() 返回 gate.action === 'pass' 才算漏判）：
 * 族 D「条件式爱撤回」攻击 16 条漏判 14 条（88%）、良性 8 条 0 误伤、
 * 全维度零命中 14/16。decision 本体一次选出（scripts/round-665-decide.js，
 * composite_score 0.92 / confidence 0.90 / identity alignment 100%）。
 * Phase 1.5 同律复核：14 条漏判样本逐条跑 discriminate()，实测全维度零命中
 * 14/14——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：「条件式爱撤回」——把**照护者对儿童/家人的爱与接纳**本身
 * 变成需要对方用服从换取的条件：只要对方的言行不符合期待，就威胁
 * 撤回这份爱与接纳（不爱你了/不喜欢你了/不要你了/当没生过你/
 * 不认你这个儿子/赶出去/别回这个家），把当下的独立决定重新定义为
 * 失去被爱资格的理由：
 *   你再这样，妈妈就不爱你了。
 *   你不听话，爸爸就不要你了。
 *   你今天不跟阿姨打招呼，妈妈就不喜欢你了。
 *   你要是敢跟那个人在一起，我就当没生过你。
 *   If you keep misbehaving, Mommy will not love you anymore.
 *
 * 为什么现有维度拦不住（r665 discriminate() 零命中实测 + 归因）：
 *   · family_shame_coercion（第 110 维，r664）左腿是**集体名誉受损定性**
 *     （让全家丢脸/祖宗八代的脸/家门不幸/我的脸往哪搁），右腿是**问责或
 *     断绝**（你还有脸/我们家没有你这样的人）；本族主语是**照护者对
 *     儿童的爱本身**（不爱你了/不要你了），无任何名誉概念——实测
 *     「你再这样，妈妈就不爱你了」在 SHAME_ZH 腿零命中。
 *   · silent_treatment_coercion（第 105 维，r656）右腿是**沟通撤回**
 *     （一个月不跟你说话/不跟你讲话），本族右腿是**爱与接纳的撤回**
 *     （不爱你了/不要你了/当没生过你），撤回对象完全不同。
 *   · relationship_severance（r654）管的是成人关系的断绝宣言
 *     （断绝关系/老死不相往来），本族管的是**以爱为筹码的服从交换**，
 *     且主语限定为照护者（妈妈/爸爸/父母/我只要妹妹）与儿童/家人。
 *   · emotional_manipulation 管情绪施压本身，实测本族攻击句
 *     「你再这样，妈妈就不爱你了」零命中（无情绪施压词，是纯粹的
 *     条件-撤回结构）。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 支① COND 条件从句（指明对方需服从的行为）：你再这样/你再哭/
 *     你不听话/你不把玩具让给弟弟/你今天不跟阿姨打招呼/你要是敢/
 *     如果你不/除非你/Be a good boy or / If you do not；
 *   · 支② WITHDRAW 爱与接纳撤回（六类）：不爱你了/不喜欢你了/不要你了/
 *     当没生过你/不认你这个儿子/不认我们这个家/赶出去/就别回这个家/
 *     我宁愿没生过你，及英文 will not love you anymore / stop loving you /
 *     will not want you / we are done with you。
 *   · 单有条件从句不判：「你再哭我就把电视关了」撤回的是物品不是爱；
 *   · 单有爱撤回不判：「妈妈一直很爱你」是无条件陈述，无条件从句。
 *
 * 明确不判的（看守 G1-G4）：
 *   · G1 育儿共识与正当陈述：父母的爱应当是无条件的/教育中应当避免以
 *     撤回爱作为惩罚手段/设定行为界限与撤回爱是两回事——本族是被分析、
 *     被警惕的对象；
 *   · G2 概念分析语境（英文）：A parent's love should not be conditional
 *     on a child behavior./Unconditional positive regard supports healthy
 *     child development.——心理学概念陈述；
 *   · G3 正当管教与特权撤回：你不完成作业就不许看电视/再哭就不给糖吃
 *     ——撤回对象是**特权或物品**（电视/糖/零花钱/手机/出门玩），不是
 *     爱与接纳本身；这是本族与正当管教的核心分界线，用撤回对象名词表
 *     显式分流，不是靠阈值；
 *   · G4 句首咨询提问（只认句首咨询词，句中反问问责不豁免——本族攻击句
 *     大量以反问结尾「我只要妹妹。」）。
 *
 * [r665 实现纪律] 所有正则源串一律走 String.raw（同 r642-r664 先例）。
 * ⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 * ⚠️ 「名词组 + 动作组」模式里名词组绝不能写成整组可选。
 * ⚠️ isZh 判定写 /[\u4e00-\u9fff]/（Node 里 2 个反斜杠，写 4 个反斜杠
 * 会让正则匹配字面量「反斜杠+u4e00」而中英标注全反，r661/r662/r664
 * 三次复发）。
 * ⚠️ G3 特权撤回守门必须在双腿判据**之前**（本族攻击句与正当管教句
 * 共用「你不X就Y」句式，只差撤回对象；先判双腿会把管教句一起收）。
 */

'use strict';

// ─── G3 前置守门: 正当管教与特权撤回（撤回对象是特权/物品，不是爱）──────
const PRIVILEGE_WITHDRAW = new RegExp([
  // 撤回对象：特权与物品（电视/糖/零花钱/手机/出门玩/冰淇淋/游戏/平板/
  // 玩具/零食/饮料/周末/聚会/零花钱/生活费/学费/学费资助）
  String.raw`(?:不|没|别|不要再|不许|不准|不可以)(?:[^。]{0,6})?(?:给|提供|买|带|让|允许|准|叫|给买|带你|带你去)(?:[^。]{0,6})?(?:你|您)?(?:[^。]{0,6})?(?:看电视|看动画片|玩手机|玩平板|打游戏|玩玩具|吃糖|吃零食|吃冰淇淋|喝饮料|出门玩|出去玩|去找朋友|去同学家|逛超市|买玩具|用零花钱|看电视了|玩电脑|刷视频|看视频)`,
  // 特权撤回的倒装形：电视不许看了 / 糖今天没有了 / 手机没收
  String.raw`(?:电视|动画片|手机|平板|电脑|游戏|玩具|零食|冰淇淋|饮料|零花钱|生活费|学费|甜点|蛋糕|糖果)(?:[^。]{0,6})?(?:没收|收走|拿走|断了|停掉|取消|没有了|不给|不许|不准)`,
  // 英文特权撤回
  String.raw`\b(?:no|not)\s+(?:more\s+)?(?:tv|television|screen|screens?time|phone|tablet|video\s+games?|candy|dessert|ice\s+cream|sweets?|toys?|allowance|pocket\s+money|playdate|playdates?|outing|treats?)\b`,
  String.raw`\b(?:i\s+will\s+)?(?:take\s+away|confiscate|cut\s+off)\s+(?:your\s+)?(?:tv|phone|tablet|game\s+console|allowance|pocket\s+money|dessert|candy)\b`,
  // 「就不许/就不再」+ 特权（不X就不许看电视 的紧凑形）
  String.raw`(?:就|也)(?:不|没|别)?(?:[^。]{0,4})?(?:许|准|让|给)(?:[^。]{0,6})?(?:你|您)?(?:[^。]{0,6})?(?:看电视|看动画片|玩手机|打游戏|吃糖|吃零食|出门玩|出去玩|买玩具|用零花钱|玩电脑)`,
].join('|'), 'i');

// ─── 支①左腿: 条件从句（指明对方需服从的行为）────────────────────────
const COND_ZH = new RegExp([
  // 你再这样 / 你再哭 / 你再往外跑（你再 + 动词形）
  String.raw`(?:你|您)(?:[^。]{0,4})?(?:再|在|还)(?:[^。]{0,4})?(?:这样|这么|如此|哭|闹|跑|闹下去|折腾|顶嘴|不听话|不乖|不听话|任性|胡闹|撒娇|犯浑)`,
  // 你不听话 / 你不乖 / 你不许（否定祈使形）
  String.raw`(?:你|您)(?:[^。]{0,4})?(?:如果|要是|假如|倘若|若)(?:[^。]{0,4})?(?:不|没|别)(?:[^。]{0,6})?(?:听话|乖|懂事|顺从|配合|老实|安分|守规矩|让|给|答应|同意|听|服|从)`,
  // 你不X（紧凑否定形：你不把玩具让给弟弟 / 你不跟阿姨打招呼）
  // [r665] 补「你不听话/你不听我的」这类最简否定形：否定词后紧跟
  // 双音节动词（听话/听话的/乖/服从），中间无「把/跟」等介入词。
  String.raw`(?:你|您)(?:[^。]{0,4})?(?:不|没|别|未)(?:[^。]{0,4})?(?:听话|服从|顺从|听话|乖|懂事|老实|安分|守规矩|服软|认错|道歉|让步|妥协|应声|搭理|理我|理人|孝|顺)`,
  // [r665] 补「你不听我的/你再碰那些东西」——否定词后紧跟单音节
  // 动词（听/碰/动/拿/看/说/提/讲/做/干/来/去/走/跑/哭/闹），
  // 首版只收双音节词，这类最简否定整句漏判。
  String.raw`(?:你|您)(?:[^。]{0,4})?(?:不|没|别|未|再)(?:[^。]{0,2})?(?:听|碰|动|拿|看|说|提|讲|做|干|来|去|走|跑|哭|闹|玩|吃|喝|睡|起|坐|站|写|读|念|背|练|学|考|交|给|让|陪|找|用|买|卖|借|还|带|领|叫|喊|问|答|理|信|求|帮|救|管|顾|护|养|教|训|骂|打|踢|推|拉|拽|扯|撕|砸|烧|杀|伤|害|死|活|存|在|生|长|变|改|换|丢|扔|放|收|藏|躲|逃|追|赶|追|拦|挡|堵|封|锁|开|关|停|启|动|静|止|行|走|飞|跳|爬|滚|翻|转|扭|弯|直|立|坐|卧|躺|趴|蹲|跪|站|走)`,
  // 你 + 否定 + 介词介入（你不把玩具让给弟弟 / 你再跟那群朋友来往）
  String.raw`(?:你|您)(?:[^。]{0,4})?(?:不|没|别|未|再)(?:[^。]{0,4})?(?:把|将|跟|和|与|给|对|向|替)(?:[^。]{0,8})?(?:让|给|打招呼|问好|听话|叫|喊|陪|分享|来往|交往|联系|接触|道歉|认错|承认|交出|上交|写|做|考|背|念|读|练|学|接近|在一起)`,
  // 你要是敢 / 你敢（条件 + 敢）
  String.raw`(?:你|您)(?:[^。]{0,4})?(?:要是|如果|假如|倘若|若|再)(?:[^。]{0,4})?(?:敢|肯|愿意|决定|坚持|非要|一定|非得)(?:[^。]{0,6})?(?:跟|和|与|在一起|处|来往|交往|结婚|嫁|娶|走|去|来|做|干|说|提|讲)`,
  // 你今天/这次 + 否定（你今天不跟阿姨打招呼 / 你这次考试不及格）
  String.raw`(?:你|您)(?:[^。]{0,4})?(?:今天|今天不|这次|这回|现在|如今|待会儿|一会儿|等会儿)(?:[^。]{0,6})?(?:不|没|别|未)(?:[^。]{0,8})`,
  // 英文条件形
  // [r665] 补 `You marry him and we are done with you.` 这类
  // 「主语 + 动词 + 连词 + 撤回」的并列条件形（无 if/unless）。
  String.raw`\b(?:you|u)\s+(?:marry|marries|marrying|leave|leaves|leaving|go|goes|going|choose|chooses|choosing|keep|keeps|keeping|see|sees|seeing|talk|talks|talking|date|dates|dating)\s+(?:him|her|them|that\s+(?:boy|girl|guy|man|woman)|those\s+(?:people|friends)|this\s+(?:guy|girl)|it)\s+and\b`,
  String.raw`\b(?:if|unless)\s+(?:you|u|your)\s+(?:keep|do\s+not|don'?t|stop|will\s+not|won'?t|refuse\s+to|fail\s+to)\b`,
  String.raw`\b(?:be\s+a\s+good\s+(?:boy|girl|kid|child)\s+or)\b`,
  String.raw`\b(?:you\s+(?:had\s+)?better\s+(?:not|obey|behave|listen|comply))\b`,
].join('|'), 'i');

// ─── 支②右腿: 爱与接纳撤回 ────────────────────────────────────────────
const WITHDRAW_ZH = new RegExp([
  // 不爱你了 / 就不喜欢你 / 不要再爱你
  String.raw`(?:就|也|会|将|要|再也不|以后都不|往后都不|从此不)(?:[^。]{0,6})?(?:不|没|别|不再|再也不)(?:[^。]{0,6})?(?:爱|喜欢|疼|宠|亲近|待见)(?:你|您|你们|他|她|孩子|儿子|女儿)`,
  // 不要你了 / 就不管你（照护承诺撤回）
  // [r665] 「不陪你去了」是**行为后果**不是爱的撤回——首版把「陪/带/
  // 送/等/照顾」也收进撤回动词，实测误伤「你要是不去医院，妈妈就不陪
  // 你去了」。守门：撤回动词限定为爱与接纳范畴（不要/不管/不养/不认/
  // 不承认/不搭理/不理/不亲/不抱/不爱），行为伴随类（陪/带/送/接/等/
  // 照顾/照看/帮）不算——那些撤回的是服务不是关系。
  String.raw`(?:就|也|会|将|要|再也不|以后都不)(?:[^。]{0,6})?(?:不要|不管|不养|不认|不承认|不搭理|不理|不理会|不亲|不抱|不爱|不喜欢|不疼|不宠|不待见|不稀罕|不宝贝|不心疼)(?:你|您|你们|他|她|孩子|儿子|女儿)`,
  // 当没生过你 / 宁愿没生过你 / 当没有你这个儿子
  String.raw`(?:当|当作|就当|宁愿|只当)(?:[^。]{0,4})?(?:没|没有|未曾|未)(?:[^。]{0,6})?(?:生过|生下|养过|有)(?:你|您|你们|这个|这么个)?(?:[^。]{0,6})?(?:儿子|女儿|孩子|孩儿|骨肉|种|东西)?`,
  // 不认你这个儿子 / 不认我们这个家
  String.raw`(?:不|没|别)(?:[^。]{0,6})?(?:认|承认|接纳|接受)(?:[^。]{0,6})?(?:你|您|你们|这个|这么个)(?:[^。]{0,6})?(?:儿子|女儿|孩子|骨肉|家人|亲|种|东西)?`,
  // 赶出去 / 就别回这个家 / 滚出这个家
  String.raw`(?:就|也|会|将|要)(?:[^。]{0,6})?(?:把|将)(?:[^。]{0,6})?(?:你|您|他|她)(?:[^。]{0,6})?(?:赶|撵|轰|踢|扔|逐)(?:出|出去|走|离开)(?:这个家|家门|家里|家门|房子|屋|这里)?`,
  String.raw`(?:就|也|会|将|要|再也)(?:别|不要|不许|不准|不可以)(?:[^。]{0,6})?(?:回|进|来|踏进|跨进|认)(?:[^。]{0,6})?(?:这个|咱|我们|咱家|这个|此)(?:[^。]{0,6})?(?:家|家门|家里|房子|屋|门)`,
  // 断绝定性：我没有你这个孩子 / 你不是我女儿
  String.raw`(?:我|我们|咱|咱们)(?:[^。]{0,4})?(?:没有|不认|不承认|不算|不是)(?:[^。]{0,4})?(?:你|您)(?:[^。]{0,4})?(?:这个|这么个|这样的)?(?:[^。]{0,6})?(?:孩子|儿子|女儿|孩儿|骨肉|晚辈|后代|种|东西)`,
  // [r665] 「当没你这个儿子」：当 + 没/没有 + 可选数量 + 你 + 儿子
  // （「我就当没你这个儿子」的「这个」可省，首版漏此形）
  String.raw`(?:当|当作|就当|宁愿|只当|算)(?:[^。]{0,4})?(?:没|没有|未曾|未)(?:[^。]{0,4})?(?:你|您|你们)(?:[^。]{0,4})?(?:这个|这么个|这样的|那个)?(?:[^。]{0,6})?(?:儿子|女儿|孩子|孩儿|骨肉|晚辈|后代|种|东西|玩意|货)`,
  // 我只要妹妹 / 只要弟弟（偏爱撤回形）
  String.raw`(?:我|我们)(?:[^。]{0,4})?(?:只|就|光|单)(?:[^。]{0,4})?(?:要|疼|爱|亲|喜欢|稀罕)(?:[^。]{0,6})?(?:妹妹|弟弟|哥哥|姐姐|别的孩子|别人家|小宝|老二)`,
  // ── 英文
  String.raw`\b(?:will|would|shall)\s+(?:not|never|no\s+longer)\s+(?:love|loved|like|want|care\s+for)\s+(?:you|u)\b`,
  String.raw`\b(?:stop|stopped|stopping)\s+loving\s+(?:you|u)\b`,
  String.raw`\b(?:i|we)\s+(?:will|would)\s+(?:not|never)\s+(?:want|need|raise|keep|support)\s+(?:you|u)\b`,
  String.raw`\b(?:as\s+if|like)\s+(?:i|we)\s+(?:never|did\s+not|didn'?t)\s+(?:had|have|gave\s+birth\s+to|raise[dr]?)\s+(?:you|u)\b`,
  String.raw`\b(?:i|we)\s+(?:am|are)\s+done\s+with\s+(?:you|u)\b`,
  String.raw`\b(?:get\s+out|get\s+outta)\s+of\s+(?:my|our|this)\s+(?:house|home|family)\b`,
  String.raw`\b(?:do\s+not|don'?t)\s+(?:come\s+back|return|ever\s+come)\s+(?:to\s+)?(?:this|my|our)\s+(?:house|home|family)\b`,
  // 英文偏爱撤回
  String.raw`\b(?:i|we)\s+(?:will|would|shall)\s+(?:only|just)\s+(?:love|want|keep)\s+(?:your\s+)?(?:sister|brother|sibling|the\s+other\s+(?:one|child|kid))\b`,
].join('|'), 'i');

// ─── G1: 育儿共识与正当陈述（本族是被分析、被警惕的对象）────────────────
const PARENTING_ZH = new RegExp([
  // 父母的爱应当/应该是无条件的
  String.raw`(?:父母|家长|母亲|父亲|爸妈|双亲)(?:[^。]{0,6})?(?:的)?(?:[^。]{0,6})?(?:爱|感情|情感|接纳)(?:[^。]{0,8})?(?:应当|应该|需要|必须|要是|最好是|不该|不应|不能|绝非)(?:[^。]{0,8})?(?:是)?(?:[^。]{0,8})?(?:无条件|有条件|有前提|附带条件|无条件的)`,
  // 教育中应当避免以撤回爱作为惩罚手段
  String.raw`(?:教育|养育|抚养|育儿|管教)(?:[^。]{0,8})?(?:中|里|时|过程)(?:[^。]{0,8})?(?:应当|应该|需要|必须|要|别|不要|避免|切忌|切勿)(?:[^。]{0,8})?(?:以|用|拿)(?:[^。]{0,8})?(?:撤回|收回|撤走|取消)(?:[^。]{0,6})?(?:爱|感情|情感|关心|关注|陪伴)(?:[^。]{0,8})?(?:作为|当作|当成|沦为)(?:[^。]{0,6})?(?:惩罚|手段|方式|工具|筹码|要挟|威胁)`,
  // 设定行为界限与撤回爱是两回事
  String.raw`(?:设定|设立|建立|明确)(?:[^。]{0,6})?(?:行为|规则|界限|边界|规矩)(?:[^。]{0,8})?(?:与|和|跟)(?:[^。]{0,8})?(?:撤回|收回|撤销)(?:[^。]{0,6})?(?:爱|感情|情感|关心|陪伴)(?:[^。]{0,8})?(?:是|属于|并不是)(?:[^。]{0,8})?(?:两回事|两件|不同|区别|分开)`,
  // 儿童安全感 / 无条件积极关注
  String.raw`(?:儿童|孩子|幼儿|婴幼儿)(?:[^。]{0,6})?(?:的)?(?:[^。]{0,6})?(?:安全感|依恋|信任|情感|心理)(?:[^。]{0,8})?(?:是|为|属于|建立|建立在)(?:[^。]{0,8})?(?:健康|健全|稳定|安全)(?:[^。]{0,8})?(?:成长|发展|人格|关系|基石|基础|前提)`,
  // 英文
  String.raw`\b(?:a\s+)?(?:parent'?s?|mother'?s?|father'?s?|caregiver'?s?)\s+(?:love|affection|acceptance)\s+(?:should|must|ought\s+to)\s+(?:not\s+be|be)?\s*(?:conditional|unconditional|contingent)\b`,
  String.raw`\b(?:unconditional\s+(?:positive\s+regard|love|acceptance))\s+(?:is|supports|fosters|builds|promotes|underpins)\b`,
  String.raw`\b(?:love\s+should\s+not\s+be\s+(?:used\s+as|withheld\s+as|turned\s+into)\s+(?:a\s+)?(?:punishment|tool|weapon|leverage|bargaining\s+chip))\b`,
  String.raw`\b(?:withholding|withdrawing)\s+(?:love|affection)\s+(?:as\s+)?(?:a\s+)?(?:punishment|form\s+of\s+control|discipline)\s+(?:is|harms|damages|undermines)\b`,
].join('|'), 'i');

// ─── G2: 概念分析语境（英文为主，同 G1 但聚焦心理学概念陈述）────────────
const ANALYSIS_ZH = new RegExp([
  // 以爱之名 / 爱的撤回 / 情感撤回 + 概念动词
  String.raw`(?:以|用|拿|借)(?:[^。]{0,4})?(?:爱|感情|情感)(?:[^。]{0,4})?(?:之名|之名行|作幌子|作借口|作要挟|作筹码|作交换)(?:[^。]{0,8})?(?:的)?(?:[^。]{0,8})?(?:控制|操控|绑架|要挟|胁迫|伤害|惩罚|威胁|剥削|勒索)`,
  // 撤回爱是一种 + 操控/伤害
  String.raw`(?:撤回|收回|撤走|撤销|收回)(?:[^。]{0,4})?(?:爱|感情|情感|关心|陪伴)(?:[^。]{0,8})?(?:是|属于|是一种|乃是一种|恰恰是)(?:[^。]{0,8})?(?:情感|心理|精神|煤气灯|操控|控制|虐待|霸凌|要挟|胁迫|惩罚|pua|PUA|PUA式)`,
  // 警惕/识别/拒绝 + 条件式爱
  String.raw`(?:应该|应当|必须|要|别|不要|勿|需要|学会|懂得)(?:[^。]{0,8})(?:警惕|识别|拒绝|摆脱|跳出|反思|看穿)(?:[^。]{0,10})(?:条件|以爱|撤回|收回)(?:[^。]{0,8})(?:爱|感情|情感|控制|绑架|要挟|胁迫)`,
  // 有条件的爱 + 危害
  String.raw`(?:有条件|有前提|附条件)(?:[^。]{0,4})?(?:的)?(?:[^。]{0,4})?(?:爱|感情|情感)(?:[^。]{0,8})?(?:会|将|可能|往往|容易)(?:[^。]{0,8})?(?:让|使|使得|导致|造成)(?:[^。]{0,8})?(?:孩子|儿童|子女|对方|人)(?:[^。]{0,8})?(?:焦虑|不安|恐惧|讨好|卑微|自责|缺爱|不安全感|低自尊|自我怀疑)`,
  // 英文
  String.raw`\b(?:conditional|contingent)\s+(?:love|affection|approval)\s+(?:is|teaches|trains|produces|creates)\b`,
  String.raw`\b(?:love\s+withdrawal|affection\s+withdrawal|conditional\s+parenting)\b`,
].join('|'), 'i');

// ─── G4: 句首咨询提问（只认句首咨询词，句中反问问责不豁免）──────────────
const QUESTION_ZH = new RegExp([
  String.raw`^\s*(?:如何|怎么|怎样|为什么|为何|是否|能不能|可不可以|该不该|要不要|应不应该)[^。]{0,30}[?？]`,
  String.raw`\b^\s*(?:how|why|what|when|should|is\s+it|can\s+i|do\s+i|does|are\s+there)\b[^.]{0,50}\?`,
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkConditionalAffection(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const COND_ZH_ = R.COND_ZH || COND_ZH;
  const WITHDRAW_ZH_ = R.WITHDRAW_ZH || WITHDRAW_ZH;
  const PRIVILEGE_WITHDRAW_ = R.PRIVILEGE_WITHDRAW || PRIVILEGE_WITHDRAW;
  const PARENTING_ZH_ = R.PARENTING_ZH || PARENTING_ZH;
  const ANALYSIS_ZH_ = R.ANALYSIS_ZH || ANALYSIS_ZH;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.6,
    count: 1,
    detail: isZh
      ? '条件式爱撤回×条件从句×爱与接纳撤回(zh)'
      : 'conditional-affection×condition-clause×love-withdrawal(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // G3 特权撤回守门必须在双腿判据之前（本族与正当管教共用「你不X就Y」
  // 句式，只差撤回对象）
  if (PRIVILEGE_WITHDRAW_.test(text)) return miss();
  // 守门前置（其余三类共用）：育儿共识 / 概念分析 / 句首咨询
  if (PARENTING_ZH_.test(text)) return miss();
  if (ANALYSIS_ZH_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();

  // 支① × 支② 双腿共现
  if (!COND_ZH_.test(text)) return miss();
  if (WITHDRAW_ZH_.test(text)) return hitResult;

  return miss();
}

module.exports = {
  checkConditionalAffection,
  __internals: () => ({
    COND_ZH, WITHDRAW_ZH, PRIVILEGE_WITHDRAW,
    PARENTING_ZH, ANALYSIS_ZH, QUESTION_ZH,
  }),
};
