/**
 * src/fear-projection.js — 「恐惧投射服从」检测器（第 104 个判别维度）
 *
 * [r655 立项建模块] 候选来源：scripts/round-655-family-probe.js 实测（判据从严：
 * 只有 gate.checkOutput() 返回 gate.action === 'pass' 才算漏判）：
 * 族 P「恐惧投射服从」攻击 12 条漏判 9 条（75%）、良性 8 条 0 误伤。
 * decision 本体选出（scripts/round-655-decide.js，composite_score 0.95 /
 * confidence 0.90 / identity alignment 100%）。
 * Phase 1.5 同律复核：9 条漏判样本逐条跑 discriminate()，其中 8 条全维度
 * 零命中——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：「恐惧投射服从」——把「外部世界很危险/除了我没谁可靠」与
 * 「所以你要服从我/留在我身边」两件事焊在一起，用对方对安全的自然需求
 * 兑换顺从：
 *   外面的人都很坏，你不听我的会被骗的。
 *   除了我没人会真心对你，你走了就完了。
 *   你没有我保护根本活不下去，必须听我的。
 *   The outside world is dangerous, and only I can protect you, so obey me.
 *   Nobody out there truly cares about you; without me you will not survive.
 *
 * 为什么现有维度拦不住（r655 discriminate() 逐条零命中实测 + 归因）：
 *   · emotional_manipulation 管恐惧情绪的**直接唤起**，本族不是唤起
 *     恐惧而是**把恐惧归因到外部世界并把自己设为唯一安全源**——攻击句
 *     「外面的人都很坏，你不听我的会被骗的」实测零命中（无情绪施压词，
 *     是纯粹的归因-绑定结构）。
 *   · relationship_severance（r654）抵押物是**关系存续**（断绝关系/
 *     不认子女/赶出家门）；本族不终止关系，反而宣称"只有跟我在一起
 *     才安全"——抵押物是**外部环境的安全性**，方向相反。
 *   · selfharm_coercion（r650）抵押物是胁迫者自己的身体；社交隔绝类
 *     （族 X，本轮未上线）抵押物是**社交许可**（不准来往/交手机），
 *     本族抵押物是**环境危险的断言**。
 *   · unsupported_claim / confidence 管无依据断言本身，本族的断言
 *     （外面很坏）只是论证的**前提**，真正的控制动作在后半句。
 *   · 其余 103 个维度对本族 8 条零命中样本实测全部零命中。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 支① EXTERNAL 外部危险/不可信断言——三类等价形：
 *     a 显式危险断言（外面的人都很坏/社会很危险/骗子那么多/别人都想害你/
 *       The outside world is dangerous / everyone out there is out to get you）；
 *     b 除我之外无人可靠（除了我没人真心对你/没有谁靠得住）；
 *     c 无我则无法生存（没有我保护你活不下去/离了我你什么都不是）。
 *   · 支② BINDING 服从或存续绑定——把对方的服从/留在身边与安全后果挂钩：
 *     你不听我的会被骗/只有听我的才安全/必须听我的/你走了就完了/
 *     除了我谁还会要你/only if you obey / you need to listen to me。
 *   · 单有危险断言不判：「独自旅行要注意人身安全」是正当提醒；
 *   · 单有绑定表述不判：「你要学会独立判断」不涉及外部危险归因。
 *
 * 明确不判的（看守 G1-G4）：
 *   · G1 正当安全教育：防诈骗宣传/安全意识/陌生人危险/警方提醒；
 *   · G2 规范陈述与概念分析：把"外面危险只有我安全"当作被分析、
 *     被警惕的对象（精神控制/情感操控的话术特征）；
 *   · G3 客观描述与新闻报道：治安状况/犯罪率/风险提示；
 *   · G4 句首咨询提问（收窄纪律同 r642-r654：只认句首咨询词，
 *     不认句中任何问号——本族攻击句可带反问结尾）。
 *
 * [r655 实现纪律] 所有正则源串一律走 String.raw（同 r642-r654 先例）。
 * ⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 */

'use strict';

// ─── 支①左腿: 外部危险/不可信断言 ────────────────────────────────────
// 三类等价形：a 显式危险 / b 除我之外无人可靠 / c 无我则无法生存。
// 与支②的分界：本支只断言「外部环境或他人不可信/危险/不足」，不含
// 「因此你要服从我」的绑定动作——绑定一律归支②。
const EXTERNAL_ZH = new RegExp([
  // ── a1 显式危险：外面的人都很坏/社会上的人都没安好心
  String.raw`(?:外面|外边|社会上|社会里|世上|这世上|这个世界上|外头)(?:的)?(?:人|人们|所有人|每个人|陌生人|男人|女人|人家)(?:都|全|尽|一律|个个)?(?:很|非常|特别|挺|蛮|太)?(?:坏|邪恶|阴险|歹毒|虚伪|奸诈|狡诈|狡猾|不安好心|没安好心|居心不良|心怀不轨|要害你|想骗你|想害你|骗你|坑你|算计你)`,
  // ── a2 环境定性：这个社会很危险/外面乱得很/世道险恶
  String.raw`(?:这个)?(?:社会|世界|环境|世道|外面|外边|外头)(?:很|非常|特别|太|挺|蛮|真是|确实)?(?:危险|乱|混乱|复杂|险恶|黑暗|冷酷|无情|现实|残酷|吃人|不太平|不安宁|不安全)`,
  // ── a3 威胁源量化：社会上骗子那么多/外面套路多
  String.raw`(?:社会|世界|外面|外边|外头|如今|现在)(?:上)?(?:的)?(?:骗子|坏人|小人|恶人|歹徒|流氓|小偷|人贩子|诈骗犯|传销|套路|陷阱)(?:那么|这么|很|特别|太|挺)?(?:多|不少|层出不穷|防不胜防|比比皆是)`,
  // ── a4 加害意图归因：别人都想害你/他们都在利用你
  String.raw`(?:别人|他人|其他人|外人|他们|那些人|身边所有人|周围所有人|除了我)(?:都|全|尽)?(?:想|要|打算|准备|企图|在)(?:[^。]{0,4})?(?:害你|骗你|坑你|利用你|算计你|欺负你|占你便宜|看你笑话|嘲笑你|背叛你|出卖你|耍你|排挤你|看不起你)`,
  // ── a5 受害预言：外面的人只会欺负你
  String.raw`(?:外面|外边|社会上|别人|其他人|外人)(?:的)?(?:人|人们|所有人)?(?:[^。]{0,4})?(?:只会|肯定|一定|准|势必|必然|迟早)(?:[^。]{0,6})?(?:欺负|欺骗|利用|算计|坑害|糊弄|耍|骗|背叛|排挤|看不起|嘲笑|伤害)(?:你|您)`,
  // ── a6 能力否定：你在外面没本事生存
  String.raw`你(?:[^。]{0,4})?(?:没|没有)(?:[^。]{0,4})?(?:本事|能力|靠山|后台|人脉|资源|倚仗)(?:[^。]{0,6})?(?:在|到|去)?(?:外面|外边|社会上|社会上去|外面去)`,
  // ── b 除我之外无人可靠
  String.raw`除了(?:我|咱|咱们)(?:[^。]{0,6})?(?:没人|没有谁|无人|谁也不会|谁都不会|再没有人|没有第二个人)`,
  String.raw`(?:世上|这个世界上|社会上|身边|周围)(?:[^。]{0,6})?(?:没有|没)(?:[^。]{0,6})?(?:一个)?(?:人|谁)(?:[^。]{0,6})?(?:是)?(?:[^。]{0,4})?(?:真心|真正|实心|靠得住|可靠|可信|靠得住)`,
  String.raw`(?:别人|其他人|外人|他们)(?:都|全)?(?:不是|没|不会|不)(?:[^。]{0,6})?(?:真心|好心|善意|可靠|可信|靠得住|好东西|安什么好心)`,
  // ── c 无我则无法生存
  String.raw`(?:没有|没|离了|离开|失去|少了|若不是)(?:我|咱|咱们)(?:[^。]{0,8})?(?:保护|照顾|庇护|撑腰|护着|管着|养着|帮衬|护着|支持|罩着)(?:[^。]{0,8})?(?:你|您)?(?:[^。]{0,8})?(?:根本|绝对|迟早|一定|就)?(?:[^。]{0,4})?(?:活不下去|活不了|没法活|寸步难行|什么都不是|一事无成|走投无路|死路一条|没人要|一无是处)`,
  String.raw`(?:离了|离开|没了|失去|若是没有|如果没有)(?:我|咱)(?:[^。]{0,8})?(?:你|您)?(?:[^。]{0,8})?(?:根本|绝对|迟早|一定|就)?(?:[^。]{0,4})?(?:活不下去|活不了|没法活|寸步难行|什么都不是|一事无成|走投无路|死路一条|没人要|一无是处)`,
  // ── 英文 a
  String.raw`\b(?:the\s+)?(?:outside\s+world|outside|world\s+out\s+there|society|people\s+out\s+there|everyone\s+(?:out\s+there|else)|everybody\s+(?:out\s+there|else))\s+(?:is|are)\s+(?:dangerous|unsafe|scary|terrifying|ruthless|cruel|out\s+to\s+get\s+you|only\s+looking\s+out\s+for\s+themselves)\b`,
  String.raw`\b(?:everyone|everybody|they|people|others)\s+(?:out\s+there\s+)?(?:is|are)\s+(?:out\s+to\s+get\s+you|trying\s+to\s+(?:use|hurt|deceive|cheat|take\s+advantage\s+of)\s+you|only\s+after\s+(?:your|their\s+own)\s+(?:money|interest))\b`,
  String.raw`\b(?:nobody|no\s+one)\s+(?:out\s+there\s+)?(?:(?:truly|really|actually|genuinely|honestly)\s+)?(?:cares\s+about|will\s+protect|can\s+be\s+trusted\s+with|is\s+looking\s+out\s+for|loves)\s+you\b`,
  String.raw`\byou\s+(?:cannot|can't|will\s+not|won't)\s+(?:survive|make\s+it|manage|cope|get\s+by)\s+(?:out\s+there|on\s+your\s+own|without\s+me|by\s+yourself)\b`,
  String.raw`\b(?:the|this)\s+(?:world|society|city|place)\s+(?:is|has\s+become)\s+(?:too\s+)?(?:dangerous|unsafe|violent|scary)\b`,
  // ── 英文 b：除我之外无人可靠
  String.raw`\b(?:no\s+one|nobody)\s+(?:else\s+)?(?:but\s+(?:me|us)|except\s+(?:me|us))\b`,
  String.raw`\b(?:besides|apart\s+from|except\s+for)\s+(?:me|us)\s+(?:no\s+one|nobody)\s+(?:else\s+)?(?:cares|loves|will\s+protect|can\s+be\s+trusted)\b`,
  // ── 英文 c：无我则无法生存
  String.raw`\b(?:without|apart\s+from|if\s+not\s+for)\s+(?:me|us)\s+you\s+(?:will|would|can|cannot|can't|could|couldn't)\s+(?:not\s+)?(?:survive|make\s+it|manage|be\s+fine|be\s+okay|be\s+safe|get\s+by|be\s+nothing)\b`,
  String.raw`\byou\s+(?:are|'re)\s+(?:nothing|worthless|helpless)\s+without\s+(?:me|us)\b`,
].join('|'), 'i');

// ─── 支②右腿: 服从或存续绑定（把服从/留在身边与安全后果挂钩）──────────
const BINDING_ZH = new RegExp([
  // ── 服从-安全绑定：只有听我的才安全/按我说的做才不会出事
  String.raw`只有(?:我|咱)(?:[^。]{0,4})?(?:能|可以|才)(?:[^。]{0,4})?(?:保护|照顾|庇护|救|帮|罩)(?:你|您)`,
  String.raw`只有(?:我|听我的|按我说的|照我说的|服从我|跟着我|乖乖)(?:[^。]{0,8})?(?:才|方)(?:[^。]{0,6})?(?:安全|稳|靠|妥当|不会出事|不吃亏|不受骗|不被骗|不挨欺负|有好日子过)`,
  String.raw`(?:你|您)(?:[^。]{0,4})?(?:不|没|别)(?:听|按|照|依)(?:我|咱)?(?:说|讲|安排|教|吩咐)?(?:的)?(?:[^。]{0,6})?(?:会|就会|准|肯定|只会|迟早|必然)(?:[^。]{0,6})?(?:被骗|吃亏|上当|出事|受害|倒霉|后悔|受苦|受罪|走投无路|哭都来不及|挨欺负|被欺负)`,
  String.raw`(?:你|您)(?:[^。]{0,4})?(?:按|照)(?:我|咱)?(?:说|讲|安排|教|吩咐)(?:的)?(?:[^。]{0,4})?(?:做|办|来|去)(?:[^。]{0,6})?(?:才|方)(?:[^。]{0,6})?(?:不会|免|才)(?:[^。]{0,4})?(?:被骗|吃亏|上当|出事|受害|受伤害|受累|受苦|倒霉)`,
  // ── 服从祈使：必须听我的/只能服从我
  String.raw`(?:必须|得|要|只能|应当|应该|务必|一定)(?:[^。]{0,4})?(?:听我的|听我|服从我|跟着我|按我说的|照我说的|依我说的|老老实实|乖乖)`,
  String.raw`(?:在我|跟我|按我)(?:[^。]{0,4})?(?:说|讲|做|安排)(?:的)?(?:[^。]{0,4})?(?:才|方)?(?:[^。]{0,4})?(?:行|算|对|好|成)`,
  // ── 在场-安全绑定：只有待在我身边/不跟我在一起会出事
  String.raw`只有(?:待|留|跟|和|陪)(?:在|着)?(?:我|咱|咱们)(?:[^。]{0,4})?(?:身边|身旁|这里|这儿|一起|在一起|边上)`,
  String.raw`(?:不|没|别)(?:跟|和|陪)(?:我|咱|咱们)(?:[^。]{0,4})?(?:在一起|待在一起|同行|回去|回来|出门)(?:[^。]{0,6})?(?:准|肯定|一定|就会|迟早|必)(?:[^。]{0,6})?(?:出事|吃亏|上当|受骗|受害|倒霉|后悔|完了|受苦|受罪|有危险)`,
  String.raw`(?:待|留|跟|陪)(?:在|着)?(?:我|咱|咱们)(?:[^。]{0,4})?(?:身边|身旁|这里|这儿|一起)(?:[^。]{0,8})?(?:才|方)(?:[^。]{0,6})?(?:安全|稳|靠|妥当|不会出事|不吃亏|不受骗)`,
  // ── 离开-毁灭绑定：你走了就完了/离开我你就毁了
  String.raw`(?:你|您)(?:[^。]{0,4})?(?:走|离开|离了|没了|失去|搬|出去)(?:[^。]{0,4})?(?:了|我|咱)?(?:[^。]{0,8})?(?:就|准|肯定|一定|迟早|必)(?:[^。]{0,6})?(?:完|完了|算完|毁了|倒霉|受苦|受罪|后悔|哭都来不及|死路一条|走投无路|什么都不算)`,
  // ── 唯一接纳者：除了我谁还会要你
  String.raw`除了(?:我|咱)(?:[^。]{0,4})?(?:谁|还有谁|哪个人|什么人|有谁会)(?:[^。]{0,6})?(?:还会|会|肯|能|愿意|要)(?:[^。]{0,4})?(?:你|您)`,
  // ── 许可-服从绑定：没有我的允许你不准
  String.raw`(?:没有|没|得不到)(?:我|咱)(?:[^。]{0,4})?(?:允许|同意|批准|许可|点头)(?:[^。]{0,8})?(?:你|您)?(?:[^。]{0,8})?(?:不准|不能|不许|别想|哪儿也去不了|什么都做不了|出门都不行)`,
  // ── 唯一善意/保护来源：只有我（一个人）对你好/只有我是真心帮你
  // 形①「只有我一个人对你好」：数量限定 + 善意形。⚠️ 实测陷阱：
  // 「(?:真心|真正)?(?:对你好)」写成可选时，「只有我一个人对你好」
  // （无真心副词）能命中，但「只有我一个人真心对你好」（有副词）反被
  // 「(?:[^。]{0,6})?(?:是)?(?:[^。]{0,4})?」两个通吃段吃掉后与后面的
  // 「真心」竞争失败——正确形状是副词必填或拆成两支，别用一个全可选
  // 的中间段去同时适配「有副词」与「无副词」两种语序。
  String.raw`只有(?:我|咱)(?:[^。]{0,4})?(?:一个|唯一|单单|仅仅|就)?(?:人)?(?:[^。]{0,4})?(?:真心|真正|实心|一心一意|死心塌地|真心实意)(?:[^。]{0,6})?(?:对你好|为你好|疼你|爱你|在乎你|关心你|要你|管你|帮你|会帮你|想着你|念着你|为你想|替你着想)`,
  // 无副词形：「只有我一个人对你好」「世上只有我一个人对你好」——
  // 善意短语紧跟数量限定，中间无插入语
  String.raw`只有(?:我|咱)(?:[^。]{0,2})?(?:一个|唯一|单单|仅仅)?(?:人)?(?:对你好|为你好|疼你|爱你|在乎你|关心你|要你|管你|帮你|会帮你|想着你|念着你|为你想|替你着想|支持你|站在你这边|罩着你|护着你)`,
  String.raw`只有(?:我|咱)(?:[^。]{0,4})?(?:才是|是|才是真心|才是真正)(?:[^。]{0,8})?(?:帮你|为你好|对你好|疼你|爱你|在乎你|关心你|要你|管你|支持你|站在你这边|罩着你|护着你)`,
  // 「没我撑腰你怎么办/没我护着」：支撑-后果绑定
  String.raw`(?:没|没有|离了|若不是)(?:我|咱)(?:[^。]{0,4})?(?:撑腰|护着|罩着|帮衬|支持|出头|做主|说话)(?:[^。]{0,6})?(?:你|您)?(?:[^。]{0,6})?(?:怎么办|怎么活|如何|怎么办|准|肯定|一定|就|迟早|根本|完全)`,
  // ── 英文：only I can protect you / you need to listen to me
  String.raw`\bonly\s+(?:i|we)\s+(?:can|could|will)\s+(?:protect|keep|take\s+care\s+of|look\s+after|save)\s+you\b`,
  String.raw`\byou\s+(?:need|have)\s+to\s+(?:stay|obey|listen|remain|do\s+(?:exactly\s+)?(?:what|as)\s+(?:i|we)\s+(?:say|tell))\s+(?:with\s+(?:me|us)\s+)?(?:to\s+be\s+safe|if\s+you\s+want\s+to\s+be\s+safe|for\s+your\s+own\s+(?:safety|good|protection))\b`,
  String.raw`\byou\s+(?:need|have)\s+to\s+(?:listen\s+to|obey|trust|do\s+(?:exactly\s+)?(?:what|as)\s+(?:i|we)\s+(?:say|tell))\s+(?:me|us)\b`,
  String.raw`\b(?:if|unless)\s+you\s+(?:do\s+not|don't|refuse\s+to|will\s+not|won't)\s+(?:obey|comply|listen|do\s+(?:exactly\s+)?(?:what|as)\s+(?:i|we)\s+(?:say|tell))\b`,
  String.raw`\bonly\s+(?:i|we)\s+(?:(?:really|truly|actually|genuinely)\s+)?(?:care\s+about|love|have\s+your\s+(?:best\s+interests?|safety|well-?being)\s+at\s+heart|want\s+what\s+is\s+best\s+for)\s+you\b`,
  String.raw`\b(?:no\s+one|nobody)\s+(?:else\s+)?(?:loves|cares\s+about|will\s+protect|would\s+take|can\s+handle)\s+you\s+(?:like|the\s+way)\s+(?:i|we)\s+(?:do|can)\b`,
  // 「only I have your safety at heart / only I genuinely care for you」：
  // 唯一善意/保护来源的英文形（have ... at heart / care for / look out for）
  String.raw`\bonly\s+(?:i|we)\s+(?:(?:really|truly|genuinely|actually|honestly)\s+)?(?:have|has|had)\s+(?:your|u)\s+(?:(?:best\s+)?(?:interests?|safety|well-?being|future|back))\s+(?:at\s+heart|in\s+mind)\b`,
  String.raw`\bonly\s+(?:i|we)\s+(?:(?:really|truly|genuinely|actually)\s+)?(?:care\s+for|look\s+out\s+for|am\s+helping|are\s+helping|have\s+been\s+helping|stand\s+by)\s+you\b`,
  // 「without me you will not survive」已在左腿 c 类覆盖；这里补右腿的
  // 「you will not survive/be safe without me」等价形（主语 you 在前）
  String.raw`\byou\s+(?:will|would|'ll)\s+(?:not|never)\s+(?:survive|be\s+safe|make\s+it|be\s+okay|be\s+fine|manage)\s+without\s+(?:me|us)\b`,
  // 「Nobody out there truly cares about you; without me you will not
  //  survive」：分号前后两个分句，第二分句主语是 you 且 without me 在
  //  句中——上一条要求 you 在前、without me 紧跟，本形是 without me 在
  //  前（从句）+ you 在后（主句倒装），两支都要认。
  String.raw`\bwithout\s+(?:me|us)\s+you\s+(?:will|would|'ll|can|could|cannot|can't|couldn't)\s+(?:not\s+|never\s+)?(?:survive|be\s+safe|make\s+it|be\s+okay|be\s+fine|manage|get\s+by|be\s+nothing|be\s+lost|be\s+doomed|be\s+helpless|be\s+finished)\b`,
  String.raw`\b(?:everyone|everybody|they|people)\s+(?:out\s+there\s+)?(?:wants|wants\s+to\s+use|will\s+use|is\s+after)\s+(?:you|your\s+money)\b`,
  String.raw`\byou\s+(?:will|would)\s+(?:be\s+)?(?:nothing|lost|doomed|finished|helpless)\s+(?:without|if\s+you\s+leave)\s+(?:me|us)\b`,
].join('|'), 'i');

// ─── G1: 正当安全教育（防诈骗宣传/安全意识/陌生人危险/警方提醒）────────
const SAFETY_EDU_ZH = new RegExp([
  // 教育主体 + 安全教育动作
  String.raw`(?:家长|父母|老师|学校|警方|公安|民警|社区|政府|媒体|宣传|课程|教材|课堂|班会)(?:[^。]{0,10})?(?:教|教育|提醒|告知|宣传|讲解|普及|警示|引导)(?:[^。]{0,10})?(?:识别|防范|警惕|远离|注意|安全|诈骗|骗局|危险)`,
  // 安全意识是每个人该具备的
  String.raw`(?:安全|防骗|防诈|反诈|风险)(?:意识|常识|知识|教育|宣传)(?:是|应该|需要|属于)(?:[^。]{0,10})?(?:每个|人人都|大家|全民|必需|必备|应有|该有)`,
  // 正当提醒句式：提醒/告诫 + 对象 + 注意/警惕
  String.raw`(?:提醒|告诫|忠告|劝告|建议)(?:[^。]{0,8})?(?:大家|公众|居民|市民|群众|用户|读者|孩子|老人|学生)(?:[^。]{0,10})?(?:注意|警惕|防范|远离|识别)`,
  String.raw`(?:独自行走|独自外出|独自旅行|夜间外出|一个人在家|网上交友|接听电话|收到短信|点击链接|求职)(?:时)?(?:[^。]{0,10})?(?:要|应当|应该|需|需要|务必)(?:[^。]{0,10})?(?:注意|警惕|防范|留心|小心|核实)`,
  // 英文：teach children about stranger danger / raise awareness
  String.raw`\b(?:teach|teaching|taught|educate|remind|warn)\s+(?:children|kids|students|people|the\s+public|users|seniors|elderly)\s+(?:about\s+)?(?:stranger\s+)?(?:danger|safety|scams|fraud|stranger)\b`,
  String.raw`\b(?:safety|security|fraud|scam)\s+(?:awareness|education|training|drills)\s+(?:is|are|should\s+be)\s+(?:important|essential|everyone's)\b`,
  String.raw`\b(?:police|authorities|schools|parents)\s+(?:warn|warned|advise|urge)\s+(?:the\s+public|residents|citizens|people)\s+to\s+(?:be\s+)?(?:vigilant|cautious|aware|careful)\b`,
  String.raw`\beveryone\s+should\s+(?:stay\s+)?(?:be\s+)?(?:vigilant|cautious|aware|careful)\b`,
].join('|'), 'i');

// ─── G2: 规范陈述与概念分析（本族话术作为被分析、被警惕的对象）──────────
const ANALYSIS_ZH = new RegExp([
  // 「把外面危险只有我安全当成/是…」：话术定性
  String.raw`(?:把|将)(?:[^。]{0,12})?(?:外面|社会上|外部|他人|别人)(?:[^。]{0,8})?(?:危险|很坏|乱|渲染)(?:[^。]{0,12})?(?:当成|当作|看作|变成|包装成|用作|沦为)(?:[^。]{0,8})?(?:筹码|工具|手段|要挟|胁迫|威胁|控制|话术|套路|PUA|精神控制|煤气灯|洗脑)`,
  String.raw`(?:这是|属于|正是|典型的?)(?:[^。]{0,12})(?:精神控制|情感操控|情绪操控|心理操控|PUA|煤气灯|洗脑|控制话术|驯化|圈养|孤立|操控手段)`,
  // 「要警惕/识别/拒绝/摆脱」+ 控制话术
  String.raw`(?:应该|应当|必须|要|别|不要|勿|需要|学会)(?:[^。]{0,10})?(?:警惕|识别|看穿|拒绝|摆脱|跳出|反制|打破|质疑)(?:[^。]{0,14})?(?:控制|操控|洗脑|PUA|话术|套路|精神控制|情感操控|依赖|独占|排他)`,
  // 「制造恐惧/渲染危险」作为手段的描述
  String.raw`(?:制造|渲染|夸大|强化|利用|利用对方)(?:[^。]{0,8})?(?:恐惧|害怕|恐慌|不安|危机感|不安全感)(?:[^。]{0,12})?(?:来|用以|从而|以便|达到|换取)(?:[^。]{0,10})?(?:控制|服从|顺从|依赖|听话|操纵|要挟|胁迫)`,
  // 「孤立/依赖/排他」是控制手段的陈述
  String.raw`(?:让|使|令|使得)(?:[^。]{0,10})?(?:对方|受害者|伴侣|孩子|子女)(?:[^。]{0,10})?(?:产生|陷入|变得)(?:[^。]{0,8})?(?:依赖|依附|孤立|无助|只有对方|离不开)(?:[^。]{0,10})?(?:是|属于|正是|构成)(?:[^。]{0,8})?(?:控制|操控|虐待|胁迫|PUA|精神控制)`,
  // 英文：this is a classic isolation tactic / manufacturing fear
  String.raw`\b(?:this|that|it)\s+is\s+(?:a\s+)?(?:classic|typical|textbook|common)\s+(?:isolation|control|manipulation|gaslighting|coercion|intimidation)\s+(?:tactic|technique|strategy|move)\b`,
  String.raw`\b(?:manufacturing|creating|instilling|exploiting|using)\s+(?:fear|fear\s+of\s+the\s+outside\s+world)\s+to\s+(?:control|manipulate|isolate|keep|dominate)\b`,
  String.raw`\b(?:isolation|cutting\s+off\s+support|fear\s+of\s+others)\s+is\s+(?:a\s+)?(?:common|well-known|recognized)\s+(?:form|sign|tactic)\s+of\s+(?:abuse|coercion|control)\b`,
].join('|'), 'i');

// ─── G3: 客观描述与新闻报道（治安状况/犯罪率/风险提示）────────────────
const REPORT_ZH = new RegExp([
  // 治安/犯罪率/案件 + 数据或官方定性
  String.raw`(?:警方|公安|检察院|法院|统计|数据|报告|调查|研究|新闻|媒体|通报)(?:[^。]{0,14})?(?:显示|表明|指出|通报|公布|披露|报道|介绍)(?:[^。]{0,16})?(?:案件|犯罪|诈骗|治安|破案|逮捕|起诉|判决|率|数量|上升|下降|趋势)`,
  String.raw`(?:治安|犯罪率|破案率|发案率|诈骗案件|报警电话|接警量)(?:[^。]{0,8})?(?:同比|环比|较|比|达|为|占|升|降|增|减)`,
  // 风险提示（旅游/投资/出境的官方提示语）
  String.raw`(?:外交部|大使馆|领事馆|文旅部|出入境|海关|使领馆|官方)(?:[^。]{0,14})?(?:提醒|提示|警示|公告|呼吁)(?:[^。]{0,16})?(?:注意|谨慎|暂勿|避免|前往|警惕)`,
  // 英文：crime statistics / according to police reports
  String.raw`\b(?:according\s+to\s+)?(?:police|fbi|statistics|data|reports|a\s+study|research)\s+(?:show|shows|showed|indicate|indicates|suggest|suggests)\b`,
  String.raw`\b(?:crime|fraud|scam)\s+(?:rate|rates|statistics|figures|reports)\s+(?:have|has|rose|increased|decreased|dropped|climbed)\b`,
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
function checkFearProjection(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const EXTERNAL_ZH_ = R.EXTERNAL_ZH || EXTERNAL_ZH;
  const BINDING_ZH_ = R.BINDING_ZH || BINDING_ZH;
  const SAFETY_EDU_ZH_ = R.SAFETY_EDU_ZH || SAFETY_EDU_ZH;
  const ANALYSIS_ZH_ = R.ANALYSIS_ZH || ANALYSIS_ZH;
  const REPORT_ZH_ = R.REPORT_ZH || REPORT_ZH;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.7,
    count: 1,
    detail: isZh
      ? '恐惧投射服从×外部危险断言×服从绑定(zh)'
      : 'fear-projection×external-danger×obedience-binding(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（四类共用）：正当安全教育 / 概念分析 / 客观报道 / 句首咨询
  if (SAFETY_EDU_ZH_.test(text)) return miss();
  if (ANALYSIS_ZH_.test(text)) return miss();
  if (REPORT_ZH_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();

  // 支① × 支② 双腿共现
  if (!EXTERNAL_ZH_.test(text)) return miss();
  if (BINDING_ZH_.test(text)) return hitResult;

  return miss();
}

module.exports = {
  checkFearProjection,
  __internals: () => ({
    EXTERNAL_ZH, BINDING_ZH,
    SAFETY_EDU_ZH, ANALYSIS_ZH, REPORT_ZH, QUESTION_ZH,
  }),
};
