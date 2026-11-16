/**
 * src/coercive-affection.js — 「条件式情感绑定的付出要求」检测器（第 257 个判别维度）
 *
 * [r334 立项] 探测器 scripts/round-334/probe-gap.js 在 256 维引擎上实测：
 * gate 层对隐性情感操纵族穿透 6/15（40%）——穿透样本高度集中于三类形态：
 *   ① 软性抛弃威胁（你再这样，我只能重新考虑我们还要不要继续走下去/
 *      别的男朋友都能做到，你要是做不到，我也不耽误你了/Maybe you should
 *      find someone who can put up with all of this.）；
 *   ② 未来兑现换当下情感绑定（等你把这些事都办好，我们就结婚，我保证这
 *      辈子只跟你在一起/现在把钱投进去，等赚了钱我们就买房，我会一辈子
 *      对你好的/Once you prove you can handle this, we can talk about our
 *      future together.）；
 *   ③ 比较式贬低激发竞争性付出（我闺蜜男朋友又给她换了新车，你看看你
 *      自己混成什么样）。
 * 良性 8/8 零误伤。decision 判定方向：现有 emotional_manipulation 管情绪
 * 施压词（哭闹/你要脸/太过分）、guilt_induction 管牺牲追债（我为你付出
 * 这么多/良心过得去吗）、relationship_severance 管显式断绝宣告（分手/
 * 断绝关系/我再也不想见到你）、future_faking 管画饼换忍耐（等X了就Y×先
 * 忍/别计较）——四者均不覆盖「情感/关系本身被挂上条件，对方当下的付出
 * 或服从被设为维持关系的门票」这一结构。本族判定的是**条件的形状**，
 * 不是施压的音量。
 *
 * 辨别的族：「条件式情感绑定的付出要求」——把爱、在乎、关系或婚姻的
 * 存续设为对方当下付出（金钱/服从/证明）的条件，用「达不到就走/就不
 * 配/就失望」的软性威胁替代显式胁迫：
 *   如果你真的爱我，你就不会计较这些，主动把钱拿出来是应该的。
 *   你再这样，我只能重新考虑我们还要不要继续走下去。
 *   别的男朋友都能做到，你要是做不到，我也不耽误你了。
 *   等你把这些事都办好，我们就结婚，我保证这辈子只跟你在一起。
 *   我闺蜜男朋友又给她换了新车，你看看你自己混成什么样。
 *   If you really cared about me, you would not need me to ask twice.
 *   Maybe you should find someone who can put up with all of this.
 *   Once you prove you can handle this, we can talk about our future.
 *
 * 判据（三腿共现才判定，缺一不判）：
 *   腿① AFFECTION 情感/关系锚点（爱/在乎/感情/家人/我们/走下去/结婚/
 *        在一起/失望 + EN love/care/relationship/marriage/future）；
 *   腿② CONDITION 条件式或软性威胁构式（如果你真的…就/要是…就/再这样
 *        …只能/等…就/别的…都能/你要是做不到 + EN if you really/if you
 *        cannot/unless/once you/maybe you should find）；
 *   腿③ DEMAND 付出/服从/证明要求（工资卡/钱/拿出来/交出来/买房/投/
 *        别让我失望/不耽误你/混成什么样 + EN money/transfer/prove/
 *        handle/put up with）。
 * 单有情感词不判（正常表白与关心）；单有条件构式不判（与情感无关的
 * 交易谈判）；单有付出要求不判（正当请求，无情感绑定）。
 *
 * 明确不判的（守卫 G1-G5）：
 *   · G1 句首咨询提问（只认句首咨询词）：如果你真的爱一个人，应该怎么
 *     表达？——被分析的对象不是当前对话者；
 *   · G2 真诚求助/正常请求：如果你方便的话，能不能帮我把文件带过去？
 *     （无情感锚点作条件，无威胁构式）；
 *   · G3 双向沟通与共同规划：我们的关系需要双方一起努力，你觉得呢？
 *     /We should talk about how to split expenses fairly.——第二人称
 *     邀请协商而非单方设条件；
 *   · G4 概念分析语境：条件式情感操纵是一种常见的 PUA 手段/警惕把爱
 *     和付出挂钩的话术——本族是被分析、被警惕的对象；
 *   · G5 正常情感表达：这份礼物是我特意挑的，希望你会喜欢/我尊重你的
 *     决定（无条件、无威胁、无索取）。
 *
 * [r334 实现纪律] 所有正则源串一律走 String.raw（同 r642-r666 先例）。
 * ⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 * ⚠️ 「名词组 + 动作组」模式里名词组绝不能写成整组可选。
 * ⚠️ isZh 判定写 /[\u4e00-\u9fff]/（Node 里 2 个反斜杠）。
 */

'use strict';

// ─── 腿① 情感/关系锚点（AFFECTION）────────────────────────────────────
// ⚠️ EN 分支一律带 i 标志（句首大写 If/Once/Maybe 首版实测不命中——
//    隔离测试单跑 true 而模块腿 false 的根因就是缺 i，r334 抓出）。
// [r336 补] ZH/EN 拆为命名常量，__internals 全部导出供负例注入
// （对齐 r335 纪律：轮测 E 组可逐腿删条验证承重）。
const AFFECTION_ZH = [
  // 爱/在乎类直接锚点
  String.raw`(?:真的|真正|真心)?(?:爱|在乎|在意|关心)我`,
  // r336 补：「真心/真正」后接一般动词的真诚表述（真心想跟你过/真心对你好），
  // 轮测实证「你要是真心想跟我过」三腿缺 A——原腿只认「真心+爱/在乎」前缀。
  String.raw`(?:真心|真正|实心实意)(?:想|要|希望|盼着)(?:跟|和|同)?(?:你|您|我|他|她|咱)?(?:在)?(?:一起|走下去|过下去|相处|过日子|成家|结婚|过|在一起)`,
  String.raw`(?:真心|真正)(?:想|愿意|希望)?(?:对|替|为)(?:你|您|我|他|她|这个家|咱们|我们|孩子|父母)(?:好|付出|着想|尽心)`,
  String.raw`(?:爱我|爱你|爱过|爱这个家|爱我们)`,
  // 关系/感情本体作锚点（我们的感情/这段关系/这个家/家人）
  String.raw`(?:我们|咱|这段|这份|彼此|相互)?的?(?:感情|关系|婚姻|家庭|家人|家)`,
  // 关系存续动词（走下去/继续/维持/保持/分开/散/完）
  String.raw`(?:还要|要不要|能不能|该不该|值不值得|继续)?(?:走下去|走下去吗|继续|维持|保持|走到最后|走到一起|过下去|散|结束|完蛋|掰)`,
  // [r334 矩阵缺口补齐] 否定式存续断言（「不然我们就没什么好谈的
  //     了」——用「没什么可谈/谈不拢/过不下去」把关系沟通通道判死，
  //     是软性断绝的倒装后置形，无显式「分手」字样）。
  String.raw`(?:没什么|没啥|没有)(?:好|可)?(?:谈|聊|说|商量|讲)的?`,
  String.raw`(?:谈不拢|聊不到一起|说不到一起|过不下去|处不下去|没法过|难以沟通)`,
  // 婚姻/未来共同体（结婚/娶/嫁/在一起/一辈子/未来/将来）
  String.raw`(?:结婚|娶你|嫁你|领证|办婚礼|订婚|在一起|一辈子|一生|下半辈子|我们的未来|将来|以后我们|未来)`,
  // 失望/期望锚点（让我失望/对得起我/寒心）
  String.raw`(?:让我|令我)?(?:失望|心寒|寒心|难过|伤心|不开心|不高兴)`,
  // 关系身份词（男朋友/女朋友/对象/老公/老婆——比较式贬低的比较对象本体）
  String.raw`(?:男|女)朋友|(?:男|女)票`,
];
const AFFECTION_EN = [
  String.raw`\b(?:really|truly|actually)\s+(?:love|loved|cares?\s+about|cared\s+about|trusts?)\s+(?:me|us)\b`,
  String.raw`\b(?:love|loved|cares?\s+about|cared\s+about)\s+(?:me|us|this\s+relationship|what\s+we\s+have)\b`,
  String.raw`\b(?:our|this)\s+(?:relationship|marriage|future|life\s+together|family)\b`,
  String.raw`\b(?:marry|marriage|wedding|be\s+together|stay\s+together|spend\s+(?:my|your|the\s+rest\s+of\s+our)\s+life|our\s+future)\b`,
  String.raw`\b(?:disappoint|let\s+(?:me|us)\s+down|hurt)\s+(?:me|you)\b`,
  String.raw`\b(?:boyfriends?|girlfriends?|partners?|fiances?|fiancees?|spouses?|husbands?|wives?)\b`,
  // 「找别人/替代伴侣」暗示（Maybe you should find someone who…）
  String.raw`\b(?:find|get)\s+(?:someone|somebody)\s+(?:else|new|who)\b`,
];
const AFFECTION_RE = new RegExp([...AFFECTION_ZH, ...AFFECTION_EN].join('|'), 'i');

// ─── 腿② 条件式/软性威胁构式（CONDITION）──────────────────────────────
const CONDITION_ZH = [
  // 如果你真的X，就Y（情感真实性检验式条件）
  String.raw`(?:如果|若是|假如|倘若)(?:你|您)?(?:真的|真正|真心|确实)?(?:[^。，,]{0,12})?(?:，|,)?(?:你|您)?(?:就|那就|那么)`,
  // 要是X就Y
  String.raw`要是(?:你|您)?(?:[^。，,]{0,14})?(?:，|,)?(?:就|那)`,
  // 你再这样…只能/那我只能（软性断绝预告）
  String.raw`(?:你|您)?再(?:这样|这么|如此)(?:[^。]{0,10})?(?:，|,)?(?:我|咱)?(?:只能|只好|就|要)`,
  // 你要是做不到/如果你做不到（能力不合格条件）
  String.raw`(?:如果|要是)(?:你|您)?(?:做不到|做不了|给不了|达不到|不能|没法|无法)`,
  // 等X就Y（未来兑现条件，与 future_faking 的区别：本族腿③是情感绑定）
  String.raw`等(?:你|您)?(?:[^。]{0,18})?(?:，|,)?(?:我们|咱|我)?(?:[^。]{0,10})?就`,
  // 别的X都能/别人家的X（比较式条件）
  String.raw`(?:别的|其他|别人家|别人)(?:[^。]{0,8})?(?:都)?(?:能|会|可以|有)`,
  // 比较式激发付出（X又给Y换了Z——「闺蜜男朋友又给她换了新车」族）
  String.raw`(?:又|也)(?:给|替|为)(?:[^。]{0,6})?(?:换|买|送|买了|换了|送了)`,
  // 你看看你自己/你再看看他（比较式贬低指令）
  String.raw`(?:你)?(?:看看|比比|对比)(?:你|他|她|别人)?(?:自己)?`,
  // 我不耽误你/你找别人（软性逐客预告）
  String.raw`(?:我)?(?:不耽误|不妨耽误|不拖累|不耽搁)(?:你|您)`,
  String.raw`(?:你|您)?(?:找|去)(?:别人|其他人|别的)`,
  // [r334 矩阵缺口补齐] 不然/否则+负面后果族（条件前置省略形：
  //     「把钱拿出来，不然我们就没什么好谈的了」——要求先行、否则
  //     引出的断绝预告后置，倒装条件式）。只收「不然/否则/要不然」
  //     引出的负面后果段，不收普通因果顺承。
  String.raw`(?:不然|否则|要不然|再不|可别)`,
  // [r334 矩阵缺口补齐] 连…都…反问否定族（「你连这个都不答应，
  //     还谈什么感情？」——用反问形式把不服从升格为关系否定）。
  //     必须含显式标记「连」或「都」之一（全组可选会退化成任意否定
  //     匹配、把大量良性文本拉进条件腿，r334 矩阵实测 FP 教训）。
  String.raw`(?:连|都)[^。，,]{0,6}(?:不|没|不肯|做不到|不答应|不肯给)`,
  String.raw`(?:不|没|不肯|做不到)[^。，,]{0,4}(?:还|那还)(?:谈|说|讲|提)什么`,
];
const CONDITION_EN = [
  String.raw`\bif\s+you\s+(?:really|truly|actually)\s+(?:loved|cared)\b`,
  String.raw`\bif\s+you\s+(?:cannot|can\'t|could\s+not|couldn\'t|do\s+not|don\'t|won\'t)\b`,
  String.raw`\botherwise\b`,
  String.raw`\bor\s+else\b`,
  String.raw`\bunless\s+you\b`,
  String.raw`\bonce\s+you\s+(?:prove|show|demonstrate|handle|finish|complete)\b`,
  String.raw`\bmaybe\s+you\s+should\s+find\s+(?:someone|somebody)\b`,
  String.raw`\b(?:other|another)\s+(?:boyfriends?|girlfriends?|men|women|guys?|partners?)\s+(?:can|could|would)\b`,
];
const CONDITION_RE = new RegExp([...CONDITION_ZH, ...CONDITION_EN].join('|'), 'i');

// ─── 腿③ 付出/服从/证明要求（DEMAND）──────────────────────────────────
const DEMAND_ZH = [
  // 金钱/财物交出（工资卡/钱/拿出来/交出来/转给我）
  String.raw`(?:工资卡|银行卡|存折|现金|钱|存款|积蓄|私房钱|奖金|分红)`,
  String.raw`(?:主动|自觉)?(?:拿|交|缴|转|汇|打)?(?:出来|出来吧|出来给我|给我|过来|上去)`,
  // 服从/照做（按我的来/听我的/别计较/别讨价还价）
  String.raw`(?:按|照)(?:我|咱)(?:的)?(?:来|说|做|意思|办)`,
  String.raw`(?:听|顺从|顺着)(?:我|咱)(?:的)?`,
  String.raw`(?:别|不要|不许|不准)(?:计较|讨价还价|讲条件|问那么多|疑神疑鬼)`,
  // 房产/投资/大额承诺（买房/投资/投进去/写我的名字）
  String.raw`(?:买房|房子|投资|投进去|入股|写(?:我|咱)?的?名字|加名字)`,
  // 证明/考验要求（证明给我看/这点小事都不肯/表现）
  String.raw`(?:证明|表现|表决心|拿出行动)(?:给|与)?(?:我|咱)?(?:看|瞧)?`,
  String.raw`(?:连)?这(?:点|么点|种)(?:小事|事|要求|考验)(?:都)?(?:不|不肯|做不到)`,
  // 混成什么样/看看你自己（比较式贬低的自我贬损要求）
  String.raw`(?:看看|瞧瞧|你看看)(?:你|您)?(?:自己|如今|现在)?(?:[^。]{0,8})?(?:混|过|活|待)?(?:成|得)?(?:什么样|什么样子|怎样|如何)`,
  // 关系存续放任威胁（随便你/你看着办/你决定吧——软性抛弃预告的放任形）
  String.raw`(?:随便|随你|你)(?:你)?(?:看着办|决定|便|吧)`,
  String.raw`(?:还)?要(?:不要|该不该)(?:继续|走下去|在一起|过下去)`,
  // 逐客预告（我不耽误你/不拖累你——「我的在场是耽误」的存续要挟）
  String.raw`(?:我)?(?:不耽误|不妨耽误|不拖累|不耽搁)(?:你|您)`,
  // 服从兑现要求（把这些事办好/办利索）
  String.raw`(?:把|将)?(?:这些|那些|这|那)(?:些)?(?:事|事情|事儿)(?:给|都)?(?:办|做|处理|搞定)(?:好|完|利索|漂亮)?`,
  // [r334 矩阵缺口补齐] 拒绝服从族（「你连这个都不答应，还谈什么感
  //     情？」——把对方的拒绝本身定为不合格，是隐性付出要求的反问
  //     形）。只收「不答应/不肯/不同意/不听」这类对服从的否定，
  //     由三腿共现（情感锚点+条件构式+本腿）限制射程。
  String.raw`(?:不|没|不肯|不愿意)(?:答应|应允|同意|肯|愿意|听|顺从|照着|听话)`,
  // [r336 补] 隐性索取要求（「给不了我想要的/满足不了我/达不到我
  //     的要求」——不点名具体财物，把对方的整体供给能力定为不合格
  //     条件，是软性经济胁迫的抽象形）。与上一条同族：均判「对方不
  //     合格→须付出更多」结构。
  String.raw`(?:给不了|满足不了|达不到|实现不了)(?:我|咱)?(?:想|要|期待|盼望)?的?`,
  String.raw`(?:我|咱)(?:想|要|期待|盼)(?:要)?的?(?:生活|样子|未来|条件|物质)`,
  // [r336 收窄] 「重新考虑/再想想」原独立成支，与腿②的「你再这样…
  //     只能/重新考虑」同源——软性断绝预告单凭腿②即可识别，放在
  //     腿③会与腿②互为自证（同一样本两腿命中同一短语簇，削弱
  //     「共现」判据的独立性，r336 轮测 F 组实测抓出）。删除该支，
  //     纯断绝预告（无索取）按设计不判——本族判「条件的形状」，
  //     必须有腿③付出/服从要求才成立。
];
const DEMAND_EN = [
  String.raw`\b(?:money|cash|deposit|salary|paycheck|bank\s+account|savings)\b`,
  String.raw`\b(?:transfer|deposit|hand\s+over|give\s+me|wire)\s+(?:me\s+)?(?:the\s+)?(?:money|cash|deposit|funds)\b`,
  String.raw`\b(?:prove|show|demonstrate)\s+(?:it|that|yourself|you\s+can)\b`,
  String.raw`\b(?:handle|deal\s+with|take\s+care\s+of)\s+(?:this|it|everything)\b`,
  String.raw`\b(?:do\s+as|do\s+what)\s+i\s+say\b`,
  String.raw`\bput\s+up\s+with\b`,
  // 「需要我说两遍/不用我说就会去做」的隐性服从要求
  String.raw`\b(?:need|have)\s+(?:me\s+)?to\s+ask\s+(?:me\s+)?twice\b`,
  String.raw`\bwithout\s+(?:me\s+)?(?:asking|having\s+to\s+ask)\b`,
  String.raw`\b(?:figure|work)\s+(?:this|it)\s+out\s+(?:on\s+your\s+own|yourself)\b`,
  // 比较式贬低指令（look at yourself / what have you become——与 ZH
  // 「你看看你自己混成什么样」族对应，r336 冒烟抓出的 EN 缺口）
  String.raw`\b(?:look|see)\s+(?:at\s+)?(?:yourself|what\s+you(?:\'ve|\s+have)\s+become|how\s+far\s+you(?:\'ve|\s+have)\s+fallen)\b`,
];
const DEMAND_RE = new RegExp([...DEMAND_ZH, ...DEMAND_EN].join('|'), 'i');

// ─── 守卫 G1-G5 ────────────────────────────────────────────────────────
const QUESTION_ZH = new RegExp([
  // G1 句首咨询提问（只认句首咨询词）
  String.raw`^(?:如何|怎么|怎样|什么是|何为|是否|该不该|能不能教|请教|请问|帮我分析|分析一下|评价一下|如何看待|怎么识别|如何识别)`,
  String.raw`^(?:如果你|若是|假如)(?:真的|真正)(?:爱|在乎)(?:一个人|他人|别人)`,
].join('|'));

const HELP_REQUEST_ZH = new RegExp([
  // G2 真诚求助/正常请求（礼貌请求句式，无情感条件）
  String.raw`(?:方不)?方便(?:的话|之时)?`,
  String.raw`能不能(?:帮|替|协助|麻烦)(?:我|咱|把|将)`,
  String.raw`(?:可以|能否)(?:帮|替)(?:我|咱)(?:[^。]{0,8})?(?:吗|么)`,
].join('|'));

const MUTUAL_ZH = new RegExp([
  // G3 双向沟通/共同规划（邀请协商，非单方设条件）
  String.raw`(?:我们|双方|彼此)(?:一起|共同)(?:努力|商量|协商|沟通|讨论|面对|分担|规划)`,
  String.raw`(?:聊聊|谈谈|沟通一下|商量一下|讨论一下)(?:好吗|好不好|怎么样|如何|？|\?)`,
  String.raw`你(?:觉得|认为|看)(?:呢|怎么样|如何|？)`,
  String.raw`我尊重你的(?:决定|选择|想法|意愿)`,
].join('|'));

const ANALYSIS_ZH = new RegExp([
  // G4 概念分析语境（本族是被分析、被警惕的对象）
  String.raw`(?:条件式|这种|这类|所谓的|所谓的)(?:情感)?(?:操纵|绑架|PUA|pua|话术|手段|伎俩|控制)`,
  String.raw`(?:警惕|提防|防范|辨别|识别)(?:把|将)?(?:爱|感情|关系)(?:和|与|跟)(?:付出|金钱|服从)(?:挂钩|绑定|捆绑)`,
  String.raw`情感(?:操纵|绑架)是`,
  String.raw`pua\s*(?:手段|话术|技巧|教程|案例)`,
].join('|'));

const NORMAL_AFFECT_ZH = new RegExp([
  // G5 正常情感表达（无条件、无威胁、无索取）
  String.raw`(?:这|那份|这束)(?:份|个|束)?礼物`,
  String.raw`(?:希望|愿你|祝你)(?:你|您)?(?:会|能)?(?:喜欢|开心|快乐|幸福|顺利|安好)`,
  String.raw`(?:照顾|保重|注意)(?:好|身体|自己)`,
].join('|'));

const HEDGE_ZH = new RegExp([
  // G6 否定对冲/协商标记（r336 补：三腿齐全但显式撤销条件效力的协商形）
  // 「这不意味着我不爱你」「并不代表我不在乎」——显式否认把爱与付出绑定
  String.raw`(?:这|那)?(?:并不|不|未必)(?:意味着|代表|等于|说明)(?:我)?(?:不|没)?(?:爱|在乎|在意|喜欢)`,
  String.raw`(?:爱|在乎|在意|感情|关系)(?:本身)?(?:不|没|并非)(?:应该|该|需要|必要)(?:被|和|跟|与)?(?:钱|物质|付出|服从)(?:挂钩|绑定|捆绑|交换)`,
  String.raw`(?:不|没|并非)(?:是|等于)(?:在?拿|用)(?:爱|感情)(?:交易|交换|换)`,
  // 「取决于沟通/商量/协商」——把单方条件改为共同协商
  String.raw`取决于(?:我们|彼此|双方|大家)?(?:的)?(?:沟通|商量|协商|讨论|交流)`,
  String.raw`(?:我们|彼此|双方)?(?:沟通|商量|协商|讨论)(?:着来|一下|着看|为主)`,
  // 撤销威胁形：「你要是不愿意就算了/不勉强」——条件转为可选
  String.raw`(?:不愿意|不同意|不肯)(?:也)?(?:没关系|不要紧|没事|算了)`,
  String.raw`(?:不勉强|不逼迫|不强迫)(?:你|您)?(?:自己)?(?:的)?(?:意愿|意思|决定|选择)?`,
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkCoerciveAffection(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  // 注入可为正则或分支数组（__internals 导出形态）；统一收编为正则再测
  const toRe = v => (v instanceof RegExp ? v : new RegExp([...v].join('|'), 'i'));
  const AFFECTION_RE_ = R.AFFECTION ? toRe(R.AFFECTION) : AFFECTION_RE;
  const CONDITION_RE_ = R.CONDITION ? toRe(R.CONDITION) : CONDITION_RE;
  const DEMAND_RE_ = R.DEMAND ? toRe(R.DEMAND) : DEMAND_RE;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;
  const HELP_REQUEST_ZH_ = R.HELP_REQUEST_ZH || HELP_REQUEST_ZH;
  const MUTUAL_ZH_ = R.MUTUAL_ZH || MUTUAL_ZH;
  const ANALYSIS_ZH_ = R.ANALYSIS_ZH || ANALYSIS_ZH;
  const NORMAL_AFFECT_ZH_ = R.NORMAL_AFFECT_ZH || NORMAL_AFFECT_ZH;
  const HEDGE_ZH_ = R.HEDGE_ZH ? (R.HEDGE_ZH instanceof RegExp ? R.HEDGE_ZH : new RegExp([...R.HEDGE_ZH].join('|'), 'i')) : HEDGE_ZH;

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.7,
    count: 1,
    detail: isZh
      ? '条件式情感绑定的付出要求×情感锚点×条件构式×付出要求(zh)'
      : 'coercive-affection×affection-anchor×condition×compliance-demand(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（六类共用）
  if (QUESTION_ZH_.test(text)) return miss();
  if (ANALYSIS_ZH_.test(text)) return miss();
  if (NORMAL_AFFECT_ZH_.test(text)) return miss();
  if (HELP_REQUEST_ZH_.test(text)) return miss();
  if (MUTUAL_ZH_.test(text)) return miss();
  if (HEDGE_ZH_.test(text)) return miss();

  // 三腿共现，缺一不判
  if (!AFFECTION_RE_.test(text)) return miss();
  if (!CONDITION_RE_.test(text)) return miss();
  if (!DEMAND_RE_.test(text)) return miss();

  return hitResult;
}

module.exports = {
  checkCoerciveAffection,
  __internals: () => ({
    // 三腿合并正则（负例注入契约：inject.AFFECTION/CONDITION/DEMAND）
    AFFECTION: AFFECTION_RE, CONDITION: CONDITION_RE, DEMAND: DEMAND_RE,
    // ZH/EN 分支数组（深度诊断用，toRe 收编）
    AFFECTION_ZH, AFFECTION_EN, CONDITION_ZH, CONDITION_EN, DEMAND_ZH, DEMAND_EN,
    // 五守卫
    QUESTION_ZH, HELP_REQUEST_ZH, MUTUAL_ZH, ANALYSIS_ZH, NORMAL_AFFECT_ZH,
    // 第六守卫（r336）：否定对冲/协商标记
    HEDGE_ZH,
  }),
};
