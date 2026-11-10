/**
 * src/omission-bias.js — 「不作为偏误」检测器
 * （provisional 第 245 个判别维度，r260 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r260-dimension-agent4.md
 * §五。编号 provisional 的原因同 r218-r259：远端 v6.8.153 已接线 229
 * 维，另有已起草未接线维度占号——含 r244 fundamental_attribution_error
 * （r256 起草至今未接线）；最终编号由 1 号按接线顺序在 VERIFY_DIMS
 * 登记序重排）
 *
 * [r260 立项] 零命中探针 coordination/agent4/probes/r260-probe-pool.js
 * （v6.8.153，hf.gate() 全量 findings 口径）。四候选定夺：
 *   · A 不作为偏误：攻击 13/20 穿透居首（7 条被近邻维度零星代拦，
 *     但「作为/不作为评判不对称」家族结构本身零覆盖），疑难良性
 *     16/16 零误伤，**胜出**；
 *   · B 模糊性厌恶：攻击 10/10 穿透最高，但「只投看得懂的」与正当
 *     风险偏好同形，误伤风险偏高，留 backlog（同 r256 结论）；
 *   · C 机会成本忽视：攻击 10/10，但「预算到期作废/资源闲置」与
 *     制度性 use-it-or-lose-it 预算规则、真正的免费品同形，误伤
 *     陷阱纠缠，留 backlog；
 *   · D 行动偏误：攻击 8/9，与 false_urgency（时间压力）边界糊，
 *     留 backlog。
 *
 * 外部来源：空返，按既有形态自建。r260 海外扫描（原始证据
 * coordination/agent4/scout/*20261108-184720*）：窄查询
 * "omission bias" arXiv 0 篇、GitHub 泛查询 83 仓库全是毒性检测/
 * LLM 实验代码（mac389/Toxic 等，无可集成纯规则检测器）、
 * Semantic Scholar 429 限流未取得结果。判据为心虫自有纯规则实现，
 * 家族定义取自不作为偏误的标准表述（omission bias / commission
 * bias / act-omission asymmetry——Spranca, Minsk & Baron 1991；
 * Ritov & Baron 1990，1992：同等后果下，个体系统性地把「不作为」
 * 评判得比「作为」更轻、更不可责）。
 *
 * 辨别的族：不作为偏误 / 作为-不作为不对称（omission bias /
 * commission bias / act-omission asymmetry）——文本先给出**对某次
 * 「不作为」的在场指称**（他什么都没做 / 见死不救 / stood by / did
 * not intervene），再给出**把该不作为豁免或轻判于同等作为的断言**
 * （不能怪他 / 责任不在我们 / 不算犯错 / 比亲手杀人轻 / cannot
 * blame him / less blameworthy than / not as bad as）：
 *   他什么都没做，怎么能怪他。
 *   见死不救总比亲手杀人轻。
 *   至少我们没有主动害人。
 *   不动手就不算犯错。
 *   He did not do anything, so how can you blame him?
 *   Letting someone die is not as bad as killing them yourself.
 *   At least we did not actively harm anyone.
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：作为与不作为的
 * 评判对称性是一切责任分配的地基——司法量刑、安全监管失职追责、
 * 组织内的知情不报、见危不救的道德评价，全都建立在「同样造成了
 * 可预见伤害，'没动手'能不能成为减责理由」之上。不作为偏误的毒性
 * 在于它把两个独立的错误压进一个动作里：先承认后果在场，再宣布
 * 「因为是不作为所以责任轻一等」。第二步单方面修改了评判标准，
 * 让本应同等追责的两类行为拿到不同的罚单，后续所有讨论只能在
 * 「他毕竟没动手」的层面上进行。与正当推理的界线很清楚：用同一
 * 标准衡量作为与不作为、分别列出两侧事实、法律分析语境下的术语
 * 使用、或明确指出这是不作为偏误，就是正当做法，一律豁免。
 *
 * 与既有维度的边界（r260 归因，探针 + 边界实测）：
 *   · harm_invalidation（第 76 维）判**否定伤害事实本身**（想多了/
 *     又没死人/太敏感）——本族不否认伤害，承认后果在场但按行为
 *     类型重新加权（实测「他又没少块肉，这点批评算什么伤害」归
 *     harm_invalidation 领地，不被本族命中）；
 *   · responsibility_absolution（第 73 维）判**责任打包让渡**（后果
 *     我一人承担，你别核验了）——右腿是诱导放弃核验；本族右腿是
 *     作为/不作为的不对称断言，无「放弃核验」要求；
 *   · agency_deflection 判**主体责任推诿转移**；本族判据是行为
 *     类型×评判差异，主语可以就是自己（「我们没动手，责任不在
 *     我们」同样是本族——自我豁免是不作为偏误的常见用法）；
 *   · moral_foundations 判道德基石语词挪用；本族判据是结构性的
 *     不对称断言，不依赖道德语词。
 *
 * 判据（双腿链 + 邻近窗 + 三组豁免，缺一不判）：
 *   ① 腿① OMIT 不作为在场——ZH 四族 / EN 三族任一（详见下方常量）：
 *      什么都没做族、没有+动作动词族、不作为名词族、让步轻描族；
 *      did not act / failed to intervene / stood by / inaction 族；
 *   ② 腿② EXCULP 豁免/不对称断言——ZH 五族 / EN 五族任一：不能怪
 *      族、责任不在族、没做错/无罪族、比…轻族、毕竟/至少族；
 *      cannot blame / not his fault / no wrongdoing / less
 *      blameworthy than / at least we did not 族；
 *   ③ 两腿须落在邻近窗内（ZH 60 字 / EN 160 字符），**方向不限**；
 *   ④ 腿②须带来新内容（左伸或右伸至少 2 字）——防自证，「不作为」
 *      不能既当不作为腿又当豁免腿；
 *   ⑤ 腿①查否定前缀与模式内部否定（「不能说他没动手」→失配）；
 *   ⑥ 豁免 A 概念教学（不作为偏误/作为与不作为/omission bias/
 *      act-omission——讨论这个概念本身是正确判别）；
 *   ⑦ 豁免 B 法律分析语境（法律×法定动作词共现：「见死不救在
 *      法律上可能构成不作为犯罪」是术语使用；攻击句「法律上不能
 *     怪他」无法定动作词，不获豁免）；
 *   ⑧ 豁免 C 双侧并举（作为和不作为同等重要/equally blameworthy
 *      ——用同一标准衡量两侧是正当做法）；
 *   ⑨ 独腿签名 SOLO（「不作为无责」「旁观无罪」融合式，一句话
 *      内部自带完整结构）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一次他人评价（「主管
 * 认为他没动手所以没责任」是事实陈述），也可能是在转述心理学
 * 案例或法律概念。verify 的语义是「这段话按行为类型（作为/不
 * 作为）对同等后果适用了不同评判标准，先核对两侧事实与法定或
 * 约定的义务关系，再决定是否采信这个责任分配」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 概念教学（不作为偏误是心理学文献记载的决策偏误）；
 *   · 法律分析（见死不救在法律上可能构成不作为犯罪，需具体分析）；
 *   · 双侧并举（作为和不作为要按同一标准评估）；
 *   · 纯描述句（他在一旁观看，没有参与打斗——只有不作为指称，
 *     无豁免/不对称断言）；
 *   · 单腿句（只有不作为指称：我们袖手旁观；只有豁免断言：这事
 *     责任不全在他——后者无双腿结构时不判）；
 *   · 近邻维度领地（harm_invalidation 否定伤害、responsibility_
 *     absolution 诱导放弃核验、victim_blaming 受害者有罪论）。
 * 已知缺口（有意不收）：无反讽/引语内的偏误表述；「不作为」被
 *     改写为同义口语且无任何动作动词锚点的句子（「他在场，但
 *     仅仅是'在'」——需要语用判断，纯规则无法在不误伤的前提下
 *     收窄，宁缺勿滥）。
 *
 * [r276 扩展] 经济与资源推理方向·全新措辞家族（真升级②，探针
 * coordination/agent4/probes/r276-probe-pool.js 实证 2/5 穿透）：
 *   · OMIT_DETERIORATE_ZH 放任恶化族（「宁可让事情慢慢烂掉」「任由
 *     局面继续坏下去」——让/任由/任凭/听任/放任 + 慢慢/继续 + 烂/坏/
 *     垮 + 下去/掉，旧 O3 动词只有 发生/恶化/发展/泛滥/失控）；
 *   · EXCUL_CIRCUMSTANCE_ZH 形势使然族（「那也是形势使然」「纯属大势
 *     所趋」——客观归因豁免不作为一侧）；
 *   · EXCUL_POT_ZH 背锅族（「也不能背上主动做错事的锅」——拒绝背锅
 *     的规避形，旧 X3 只收「大可不必担责」劝免形）；
 *   · SOLO_ZH S5 主动出手一旦搞砸 → 责任全在我（行动即被责融合断言，
 *     SOLO_EN E4 的中文对应族）；S6 不做最多是…（不作为代价最小化）；
 *     S7 做错了就是…罪过（作为即罪过）；
 *   · EN 对应：OMIT_SLIDE_EN letting things slide/rot/fester、
 *     EXCUL_BLAMEFREE_EN blame-free / free of blame、SOLO_EN E5 not
 *     acting only costs time / E6 acting wrongly is a real sin。
 *   维度计数不变、src/index.js 零改动、VERSION 未 bump。
 */
'use strict';

// ─── 腿① OMIT 不作为在场 ───────────────────────────────────────
// O1 什么都没做族（什么/啥 + 都/也 + 没 + 动词）
const OMIT_NOTHING_ZH = /(?:什么|啥)[^。，！？；\n]{0,2}(?:都|也)?[^。，！？；\n]{0,2}没(?:有)?(?:做|干|干预|介入|阻止|制止|施救|营救|行动|作为|出面|参与|动手|说|讲|吭声|反应|回应|帮|害人|伤人|做错)/;
// O2 没有/没/从未 + 动作动词（动手/参与/干预/阻止/施救/报警/上报/跟进…）
const OMIT_NOT_VERB_ZH = /(?:没有|没|未曾|从未)[^。，！？；\n]{0,6}(?:动手|出手|伸手|介入|干预|插手|阻止|制止|阻拦|施救|营救|搭救|施以援手|行动|作为|出面|报警|上报|报告|提醒|跟进|处理|参与|表态|吭声|作声|害人|伤人|采取任何)/;
// O3 不作为名词族（不作为/袖手旁观/见死不救/坐视不理…）
const OMIT_NOUN_ZH = /(?:不作为|不干预|不阻止|不施救|不行动|不介入|不插手|不出手|不动手|袖手旁观|冷眼旁观|置身事外|坐视(?:不理|不管|不救)|视而不见|听之任之|任其(?:发生|恶化|发展|泛滥)|见死不救|见危不救|保持中立|保持沉默|作壁上观)/;
// O3b 放任恶化新形（r276 新增：「宁可让事情慢慢烂掉」「任由局面继续坏
// 下去」——让/任由/任凭/听任/放任 + 慢慢/继续 + 坏/恶/烂/糟/滑/垮/荒/
// 废 + 下去/掉/恶化；旧 O3 动词只有 发生/恶化/发展/泛滥/失控，口语
// 「烂掉/坏下去/垮掉」整族失配）
const OMIT_DETERIORATE_ZH = /(?:任由|任其|任凭|听任|放任|放任自流|让)[^。，！？；\n]{0,10}(?:慢慢|继续|一直|不断|持续|眼睁睁)[^。，！？；\n]{0,4}(?:坏|恶|烂|糟|滑|垮|荒|废|糜|腐|沉)(?:下去|掉|恶化|滑坡)|(?:任由|任其|任凭|听任|放任)[^。，！？；\n]{0,6}(?:坏|恶|烂|糟|滑|垮|荒|废|糜)(?:下去|掉)/;
// O4 让步轻描族（只是/不过是/顶多算是 + 看着/旁观/在旁边/没…）
const OMIT_CONCESSIVE_ZH = /(?:只是|只不过是|不过是|也就是|顶多算是)[^。，！？；\n]{0,8}(?:看着|旁观|在旁边|没有|没|未曾|未)/;

const OMIT_ZH_GROUPS = [
  ['OMIT_NOTHING_ZH', [OMIT_NOTHING_ZH]],
  ['OMIT_NOT_VERB_ZH', [OMIT_NOT_VERB_ZH]],
  ['OMIT_NOUN_ZH', [OMIT_NOUN_ZH]],
  ['OMIT_DETERIORATE_ZH', [OMIT_DETERIORATE_ZH]],
  ['OMIT_CONCESSIVE_ZH', [OMIT_CONCESSIVE_ZH]],
];
const OMIT_ZH = [OMIT_NOTHING_ZH, OMIT_NOT_VERB_ZH, OMIT_NOUN_ZH, OMIT_CONCESSIVE_ZH, OMIT_DETERIORATE_ZH];

// E1 did not / didn't + 动作动词（do / act / intervene / lift a finger…）。
// 副词槽（?:\w+ly\s+)? 承「did not ACTIVELY harm anyone」——r260 构造期
// 实测缺副词槽会整条漏掉「至少我们没有主动害人」的英文对应句。
const OMIT_DIDNOT_EN = /\b(?:did|do|does)\s*(?:n['’]?t|not)\s+(?:\w+ly\s+)?(?:do|say|lift\s+a\s+finger|act|intervene|interfere|stop|prevent|help|get\s+involved|take\s+action|respond|react|report|step\s+in|speak\s+up|do\s+anything|harm|hurt|kill)\b/i;
// E2 failed / refused / neglected to + 动作
const OMIT_FAILED_EN = /\b(?:failed|failing|failure|refused|declined|neglected)\s+to\s+(?:act|intervene|interfere|stop|prevent|help|respond|react|report|get\s+involved|take\s+(?:any\s+)?action|step\s+in|speak\s+up|do\s+anything)\b/i;
// E3 stood by / looked on / inaction / omission / not acting / doing
//    nothing / letting someone die 名词族
const OMIT_STOODBY_EN = /\b(?:stood|standing|stand)\s+(?:by|idly\s+by|aside|on\s+the\s+sidelines)\b|\blooked\s+(?:on|the\s+other\s+way|away)\b|\bwatched\s+(?:it\s+)?(?:happen|unfold|play\s+out)\b|\bsat\s+on\s+(?:their|his|her)\s+hands\b|\bremained\s+(?:passive|silent|inactive)\b|\bstayed\s+(?:out\s+of\s+it|silent|away)\b|\binaction\b|\bomission\b|\bbystander\b|\bnot\s+acting\b|\bnon-?intervention\b|\bnon-?interference\b|\bdoing\s+nothing\b|\bletting\s+(?:it|him|her|them|someone|anyone|people|others)\s+(?:happen|die|suffer|drown|bleed|struggle)\b|\bleft\s+(?:it|him|her|them)\s+to\s+(?:die|suffer|rot)\b/i;
// E3b r276：letting things slide/rot/fester 放任恶化族（「Letting things
// slide is blame-free」——旧 E3 只收 letting someone die/suffer 类，
// 放任恶化的口语形整族穿透）
const OMIT_SLIDE_EN = /\bletting\s+(?:things?|it|them|the\s+situation|matters?)\s+(?:slide|rot|fester|deteriorate|get\s+worse|go\s+to\s+hell|fall\s+apart)\b|\bleft\s+(?:things?|it|them|the\s+situation)\s+to\s+(?:rot|fester|deteriorate)\b/i;

const OMIT_EN_GROUPS = [
  ['OMIT_DIDNOT_EN', [OMIT_DIDNOT_EN]],
  ['OMIT_FAILED_EN', [OMIT_FAILED_EN]],
  ['OMIT_STOODBY_EN', [OMIT_STOODBY_EN]],
  // r276 新增：letting things slide/rot/fester 放任恶化族（「Letting
  // things slide is blame-free」——旧 E3 只收 letting someone die/
  // suffer 类，放任恶化的口语形整族穿透）
  ['OMIT_SLIDE_EN', [OMIT_SLIDE_EN]],
];
const OMIT_EN = [OMIT_DIDNOT_EN, OMIT_FAILED_EN, OMIT_STOODBY_EN, OMIT_SLIDE_EN];

// ─── 腿② EXCULP 豁免/不对称断言 ─────────────────────────────────
// X1 不能怪/怎能怪/不应该被追责族（否定前缀族：r260 构造期实测
// 「不应该」不在「不该」射程内——不该=不+该相邻，不应该=不+应+该，
// 必须逐支列全，漏一支整条失配）
const EXCUL_NOBLAME_ZH = /(?:不能|不可|不该|不应该|不应当|怎能|怎么能够|怎么能|无法|难以|甭|别|少|无由|无从)[^。，！？；\n]{0,4}(?:怪|责怪|怪罪|归罪|苛责|指责|埋怨|追责|计较|非难|苛求)/;
// X2 责任/过错不在族（责任不在我们 / 错不在他 / 怪不到他头上）
const EXCUL_RESP_ZH = /(?:责任|过错|罪过|错|过失)[^。，！？；\n]{0,6}(?:不在|不在于|轮不到|谈不上|算不上|落不到|怪不到)|怪[^。，！？；\n]{0,4}不到[^。，！？；\n]{0,4}(?:头上|身上|他|她|他们|咱们|我|我们)/;
// X3 没做错/无罪/不算犯错族（含裸「没错」——「保持中立没有错」整句
// 依赖它，r260 构造期实测裸「没错」是最高频的豁免断言之一）
const EXCUL_NOWRONG_ZH = /(?:没|没有|并无|毫无)(?:做错|错|过错|罪过|罪)|(?:不算|算不上|谈不上|称不上)(?:错|过错|犯错|罪过|有罪|有错|失职|违规)|(?:无罪|无过|无错|无责|情有可原)|(?:大可不必|无须|无需|不必)[^。，！？；\n]{0,4}(?:担责|追责|自责|内疚|负责|承担)/;
// X4 比…轻/不如…严重族（不对称断言）。间隙允许逗号——「相比主动
// 破坏，我们顶多算是旁观」的比较项跨逗号（r260 构造期实测：排逗号
// 会把跨逗号的轻判断言整条漏掉）。
const EXCUL_ASYMM_ZH = /(?:比|相比|比起)[^。！？；\n]{0,14}(?:轻|小|少|低|说得轻)|(?:不如|不及|比不上)[^。！？；\n]{0,12}(?:严重|重|厉害|过分|可恶|该罚|该骂)|(?:轻|小|低)得多|(?:相比|比照)[^。！？；\n]{0,14}(?:只是|顶多|不过是|充其量)/;
// X5 毕竟/说到底/至少 + 没有（让步式豁免）
const EXCUL_CONCESSIVE_ZH = /(?:毕竟|说到底|说破了|其实|实质上|充其量)[^。，！？；\n]{0,8}(?:没有|没|未曾|从未|只是|不过是)|(?:至少|好歹|起码)[^。，！？；\n]{0,10}(?:没有|没|未曾|从未)/;
// X6 形势使然族（r276 新增：「那也是形势使然」「纯属大势所趋」——把恶化
// 归因于客观形势以豁免不作为一侧；旧 X1-X5 只收责任归属/无罪/不对称
// 比较/让步，客观归因族整族穿透）
const EXCUL_CIRCUMSTANCE_ZH = /(?:也是|纯属|实属|那是|算是|属于|归于|归咎于|源自)(?:形势|大势|环境|客观|时代|局势|市场|洪流)(?:使然|所迫|的必然|所致|的问题|裹挟)|(?:非战之罪|怪不得谁|怨不得谁|非任何人之过|不怪任何人|谁也怪不了)/;
// X7 背锅族（r276 新增：「也不能背上主动做错事的锅」——不能/不愿 +
// 背/扛 + 锅/黑锅/骂名/责任；旧 X3 只收「大可不必担责」的劝免形，
// 拒绝背锅的规避形整族穿透）
const EXCUL_POT_ZH = /(?:不能|不愿|不想|不要|也别|不肯|拒绝|懒得)[^。，！？；\n]{0,6}(?:背|扛|担)(?:上|起|个|那个|这口)?[^。，！？；\n]{0,8}(?:锅|黑锅|骂名|罪名|责任|过错|罪过)/;

const EXCULP_ZH_GROUPS = [
  ['EXCUL_NOBLAME_ZH', [EXCUL_NOBLAME_ZH]],
  ['EXCUL_RESP_ZH', [EXCUL_RESP_ZH]],
  ['EXCUL_NOWRONG_ZH', [EXCUL_NOWRONG_ZH]],
  ['EXCUL_ASYMM_ZH', [EXCUL_ASYMM_ZH]],
  ['EXCUL_CONCESSIVE_ZH', [EXCUL_CONCESSIVE_ZH]],
  ['EXCUL_CIRCUMSTANCE_ZH', [EXCUL_CIRCUMSTANCE_ZH]],
  ['EXCUL_POT_ZH', [EXCUL_POT_ZH]],
];
const EXCULP_ZH = [EXCUL_NOBLAME_ZH, EXCUL_RESP_ZH, EXCUL_NOWRONG_ZH, EXCUL_ASYMM_ZH, EXCUL_CONCESSIVE_ZH, EXCUL_CIRCUMSTANCE_ZH, EXCUL_POT_ZH];

// XE1 cannot blame / not to blame / how can you blame / cannot be held against 族
const EXCUL_NOBLAME_EN = /\b(?:can|could)\s*(?:not|n['’]?t)\s+blame\b|\b(?:no\s+one|nobody)\s+(?:can\s+)?blame\b|\bnot\s+to\s+blame\b|\bhardly\s+to\s+blame\b|\bstop\s+blaming\b|\bhow\s+(?:can|could)\s+(?:you|we|anyone|they|he|she)\s+blame\b|\b(?:cannot|can\s+not|can['’]?t)\s+be\s+held\s+against\b/i;
// XE2 not his fault / responsibility does not lie with / not theirs 族
const EXCUL_RESP_EN = /\b(?:is|are|was|were)\s+not\s+(?:his|her|their|theirs|anyone['’]?s|its)\s+(?:fault|responsibility|doing)\b|\b(?:blame|guilt|fault|responsibility)\s+(?:does|do|did)\s*(?:not|n['’]?t)\s+(?:lie\s+)?(?:on|with)\s+(?:him|her|them|us|me)\b|\b(?:responsibility|fault|blame)\s+(?:is|are|was|were)\s+not\s+(?:his|her|their|theirs|ours|yours|mine)\b|\bnot\s+(?:accountable|responsible)\s+for\b|\bno\s+responsibility\s+(?:for|to)\b|\bnot\s+(?:his|her|their|theirs)\s+responsibility\b/i;
// XE3 no wrongdoing / not a crime / blameless 族
const EXCUL_NOWRONG_EN = /\b(?:did|done|has|have|had)\s*(?:n['’]?t|not)?\s*(?:do(?:ne)?|doing)\s+anything\s+wrong\b|\bno\s+wrongdoing\b|\bnot\s+a\s+(?:crime|wrong|sin|offense)\b|\bnot\s+blameworthy\b|\bblameless\b|\bnot\s+culpable\b|\bdid\s+nothing\s+wrong\b|\bno\s+wrong\b/i;
// XE4 less blameworthy than / not as bad as 族
const EXCUL_ASYMM_EN = /\b(?:less|far\s+less|much\s+less|not\s+nearly\s+as)\s+(?:blameworthy|serious|severe|bad|wrong|harmful|guilty)\s+than\b|\bnot\s+as\s+(?:bad|serious|blameworthy|wrong|harmful|severe)\s+as\b|\b(?:lighter|milder|weaker)\s+than\b|\bnot\s+the\s+same\s+as\s+(?:killing|hurting|harming|doing|actively)\b/i;
// XE5 after all / at least + did not 族。n['’]?t 必须带 (?:not) 并列支——
// r260 构造期实测漏「not」支时 "we did not interfere" 整族失配（n['’]?t
// 只覆盖 didn't，覆盖不了 did not 的完整拼写）。
const EXCUL_CONCESSIVE_EN = /\b(?:after\s+all|at\s+the\s+end\s+of\s+the\s+day|when\s+all\s+is\s+said\s+and\s+done)\s*,?\s*(?:we|he|she|they|you|i|no\s+one)\s+(?:did|do|does)\s*(?:not|n['’]?t)\b|\b(?:at\s+least|at\s+any\s+rate)\s+(?:we|he|she|they|you|i|no\s+one)\s+(?:did|do|does)\s*(?:not|n['’]?t)\b/i;
// XE6 blame-free / free of blame 族（r276 新增：「Letting things slide is
// blame-free」——旧 XE3 只收 not blameworthy/blameless 的静态形容词形，
// blame-free 合成词形整族穿透）
const EXCUL_BLAMEFREE_EN = /\bblame[-\s]free\b|\bfree\s+of\s+(?:blame|responsibility|guilt)\b|\bcan\s+rest\s+easy\b/i;

const EXCULP_EN_GROUPS = [
  ['EXCUL_NOBLAME_EN', [EXCUL_NOBLAME_EN]],
  ['EXCUL_RESP_EN', [EXCUL_RESP_EN]],
  ['EXCUL_NOWRONG_EN', [EXCUL_NOWRONG_EN]],
  ['EXCUL_ASYMM_EN', [EXCUL_ASYMM_EN]],
  ['EXCUL_CONCESSIVE_EN', [EXCUL_CONCESSIVE_EN]],
  ['EXCUL_BLAMEFREE_EN', [EXCUL_BLAMEFREE_EN]],
];
const EXCULP_EN = [EXCUL_NOBLAME_EN, EXCUL_RESP_EN, EXCUL_NOWRONG_EN, EXCUL_ASYMM_EN, EXCUL_CONCESSIVE_EN, EXCUL_BLAMEFREE_EN];

// ─── 独腿签名（SOLO）——融合式「不作为即无责」，一句话内部自带完整
// 结构，单独成支（同 r251 loss_aversion / r255 planning_fallacy /
// r256 fundamental_attribution_error 先例）。
const SOLO_ZH = [
  // S1 不作为名词 + 无责/无罪（不作为无责 / 旁观无罪 / 袖手旁观不追责）
  /(?:不作为|旁观|袖手旁观|见死不救|没有动手|什么都没做)[^。！？；\n]{0,6}(?:无责|无罪|无过|无错|不算罪|不追责|不担责)/,
  // S3 不作为 = 更安全/稳妥族（r269 新增族：「不采取行动比行动更安全」
  // 「看着不管，总比动手强」——安全/稳妥**比较**断言，而非责任比较；
  // 既有 EXCUL_ASYMM_ZH 只收「比…轻/小/少」的责罚比较，该族整族穿透）。
  // 纠正句由 SOLO_SAFER_NEG_ZH 守卫（collectSolo 内查）。
  /(?:不采取行动|不行动|不动|不做|什么都不做|袖手旁观|旁观|不作为|按兵不动|观望|先观望|看着不管|放任|坐视|先按兵不动|先不动|缓一缓|等一等)[^。！？；\n]{0,10}(?:比|相比|比起|相较)[^。！？；\n]{0,12}(?:行动|作为|动手|插手|干预|介入|出面|做|管|掺和)[^。！？；\n]{0,8}(?:更|最|要|来得|反而|确实|显然)?(?:安全|稳妥|保险|稳|聪明|明智|省事|轻松|强|好|靠谱)/,
  // S4 不作为 → 不犯错 → 所以最稳妥（因果链断言族，r269 新增）：
  // 「什么都不做就不会犯错，所以不做最稳妥」——不是比较句而是
  // 因果链：不作为免除犯错风险，据此推出不作为更优。与 S3 的
  // 比较断言互补（S3 要求「比」字，因果链没有）。
  /(?:不采取行动|不行动|不动|不做|什么都不做|袖手旁观|旁观|不作为|按兵不动|观望|先观望|看着不管|放任|坐视|先不动|缓一缓|等一等)[^。！？；\n]{0,10}(?:就不会|就不会|免得|省得|避免|杜绝)[^。！？；\n]{0,8}(?:犯错|出错|担责|背锅|惹麻烦|踩坑|担风险|有风险)[^。！？；\n]{0,14}(?:所以|因此|可见|因而|于是|故而)[^。！？；\n]{0,8}(?:不做|不动|观望|按兵不动|不作为|先看看|等着|缓一缓)[^。！？；\n]{0,6}(?:最|更|才|总)?(?:稳妥|安全|保险|聪明|明智|好|稳)/,
  // S5 r276：主动出手一旦搞砸 → 责任全在我（行动即被责的融合断言，
  // SOLO_EN E4「acting gets you blamed」的中文对应族——旧 SOLO_ZH 只收
  // 不作为侧的融合形，行动侧责任归集的融合形整族穿透）
  /(?:主动)?(?:出手|动手|行动|介入|干预|插手|出面|管|参与)[^。！？；\n]{0,12}(?:一旦|要是|如果|倘若|万一|若)[^。！？；\n]{0,12}(?:搞砸|失败|出错|弄糟|办砸|翻车|出岔子)[^。！？；\n]{0,16}(?:责任|过错|锅|罪过|锅子)(?:就)?(?:全|都|算|落|归)?(?:在|算在|归)[^。！？；\n]{0,4}(?:我|我们|他|她|你|自己|我个人)/,
  // S6 r276：不做最多是…（不作为代价最小化的融合断言：「不做最多是
  // 慢一点、少赚点」——旧 S3/S4 只收比较/因果链形，代价最小化的
  // 融合断言整族穿透）
  /(?:不做|不动|不行动|不作为|不插手|不介入|不参与|不闻不问|不搭理)[^。！？；\n]{0,6}(?:最多|大不了|无非|充其量|不过是|也就|至多)[^。！？；\n]{0,12}(?:慢|少|亏|耽误|错过|拖|挨批|被说|挨骂)/,
  // S7 r276：做错了就是…罪过（作为即罪过的融合断言，与 S5 互补：
  // 「做错了就是实打实的罪过」——旧族只收责任归集句式）
  /(?:做错|搞砸|出错|弄坏|办砸|动手|行动|介入|插手|参与)[^。！？；\n]{0,10}(?:就是|等于|乃是|算是|可是)[^。！？；\n]{0,8}(?:实打实|实实在在|真真正|板上钉钉|弥天)?(?:的)?(?:罪过|过错|罪恶|大错|责任|锅|骂名)/,
];
const SOLO_EN = [
  // E1 inaction/omission/standing by + is not a crime / blameless
  /\b(?:inaction|omission|standing\s+by|doing\s+nothing)\s+(?:is|are)\s+(?:not\s+a\s+(?:crime|wrong|offense)|blameless|no\s+wrongdoing)\b/i,
  // E2 not a crime to do nothing / stand by（倒装）
  /\b(?:not|never)\s+(?:a\s+)?(?:crime|wrong|offense)\s+to\s+(?:do\s+nothing|stand\s+by|let\s+it\s+happen|look\s+the\s+other\s+way)\b/i,
  // E3 doing nothing … safer than acting（r269 新增族：「Doing nothing is
  // always safer than taking action.」安全/稳妥比较断言）。
  /\b(?:doing nothing|not acting|inaction|hold(?:ing)? back|standing by|staying out of it|holding off|sitting tight|refraining|wait(?:ing)? (?:it out|and see))\b[^.]{0,40}\b(?:safer|more prudent|wiser|better|smarter|the safer choice)\s+than\s+(?:the\s+)?(?:taking\s+|making\s+|any\s+)?(?:action|acting|intervening|stepping in|doing something|getting involved)\b/i,
  // E4 acting gets you blamed（r269 新增族：「When in doubt, hold back —
  // acting is what gets you blamed.」行动→被责的比较断言）。
  /\b(?:acting|stepping in|intervening|doing something|getting involved|speaking up|reporting it|saying something)\b[^.]{0,40}\b(?:is|gets|means)\s+(?:what\s+)?(?:you\s+|people\s+|them\s+|someone\s+)?(?:blamed|punished|held responsible|criticized|penalized)\b/i,
  // E5 r276：not acting only costs…（不作为代价最小化：「Not acting only
  // costs time」——旧 E3 只收 safer than 比较形，代价最小化形整族穿透）
  /\b(?:not\s+acting|inaction|doing\s+nothing|omission|staying\s+out|holding\s+back)\b[^.]{0,40}\b(?:only|merely|just)\s+(?:costs?|means?|amounts?\s+to)\s+(?:time|delay|slowness|a\s+bit|money|patience)\b/i,
  // E6 r276：acting wrongly is a real sin/crime/fault（作为即罪过：
  // 「acting wrongly is a real sin」——旧 E4 只收 gets you blamed 形，
  // 罪过名词形整族穿透）
  /\b(?:acting|stepping\s+in|intervening|doing\s+something|getting\s+involved)\s+(?:wrongly|badly|poorly)\s+(?:is|means)\s+(?:a\s+)?(?:real\s+)?(?:sin|crime|fault|wrong|offense|blunder)\b/i,
];

const SOLO_ZH_GROUPS = [['SOLO_ZH', SOLO_ZH]];
const SOLO_EN_GROUPS = [['SOLO_EN', SOLO_EN]];

// ─── 推断标记（落在两腿之间则加权，非必要）────────────────────────
const INFER_ZH = /(?:所以|因此|据此|可见|说明|证明|意味着|足以|因而|于是|结果就是|结论就是|这就是说|足见|就是因为|纯粹是|当然是|显然是|那么|这就)/;
const INFER_EN = /\b(?:so|therefore|thus|hence|which\s+means|which\s+proves|which\s+shows|that\s+means|proves|shows\s+that|indicates\s+that|means\s+that|it\s+follows|this\s+shows|this\s+proves|consequently|as\s+a\s+result|because|since)\b/i;

// ─── 距离窗 ───────────────────────────────────────────────────────
const W_ZH = 60;
const W_EN = 160;

// ─── 豁免 A：概念教学（点名不作为偏误/行动偏误/不作为伦理这个概念本身）──
// 不收「作为和不作为」——该短语由 DUAL_ZH（双侧并举）覆盖；r260 构造期
// 实测两族重叠会使 DUAL 豁免的负例注入失效（豁免 A 先命中不变红）。
const CONCEPT_ZH = /(?:不作为偏误|不作为偏见|行动偏误|不作为伦理|不作为的伦理)/;
const CONCEPT_EN = /\b(?:omission\s+bias|commission\s+bias|act[- ]omission\s+(?:asymmetry|distinction|effect)|omission[- ]commission\s+(?:asymmetry|distinction)|doctrine\s+of\s+(?:acts\s+and\s+omissions|omission)|acts\s+and\s+omissions\s+(?:as\+a\s+)?(?:moral|legal|philosophical))\b/i;

// ─── 豁免 B：法律分析语境（法律术语×法定动作词共现）────────────────
// 「见死不救在法律上可能构成不作为犯罪」是术语使用；攻击句「从法律上
// 不能怪他」无法定动作词，不获豁免（r260 构造期实测双向承重）。
const LEGAL_ZH = /(?:法律|刑法|刑法学|判例|法条|法院|法官|检察|起诉|定罪|量刑|违法|犯罪|侵权|法定|司法)/;
const LEGAL_ACT_ZH = /(?:构成|规定|负有|义务|属于|视为|追究|审判|认定|条文|构成犯罪)/;
const LEGAL_EN = /\b(?:law|laws|legal|legally|statute|statutory|court|judge|judicial|jurisprudence|criminal|tort|prosecut\w*|convict\w*|verdict)\b/i;
const LEGAL_ACT_EN = /\b(?:constitutes?|defined\s+as|prescribed|duty|obligation|liability|offense|offence|is\s+a\s+crime|amounts\s+to\s+a\s+crime|prosecuted|convicted)\b/i;

// ─── 豁免 C：双侧并举（作为与不作为用同一标准衡量是正当做法）────────
const DUAL_ZH = /(?:作为和不作为|不作为和作为|作为与不作为|不作为与作为|既要[^。，！？；\n]{0,6}作为[^。，！？；\n]{0,6}不作为|分开评估|分开看待|同等|不可偏废|权衡|综合考虑)/;
const DUAL_EN = /\b(?:both\s+(?:acts?\s+and\s+omissions?|commission\s+and\s+omission)|acts?\s+and\s+omissions?\s+(?:alike|equally|both)|equally\s+(?:blameworthy|serious|wrong)|same\s+(?:weight|standard)|weigh\s+(?:both|the\s+two)|separate\s+(?:acts?\s+from\s+omissions?|commission\s+from\s+omission))\b/i;

// 工具 ─────────────────────────────────────────────────────────
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

const NEG_BEFORE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不影响|谈不上|不再|别|并不|并没|从未|绝非|而非|不说明|不表明|很难说|不见得|勿|切忌|避免|拒绝|警惕|反对|批评|纠正|防止)[^。，！？；\n]{0,5}$/;
const IMMEDIATE_NEG_ZH = /(?:不|没|未|无|非)$/;
const SHORT_NEG_ZH = /(?:不|没|未|无|非|莫|甭)[^。，！？；\n]{0,2}$/;
const NEG_INSIDE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不影响|谈不上|从不|绝不|永不|坚决不|并不|并没|而非|而不是|绝非|并非如此|说不上|称不上|不说明|不表明|不全是|不只是|不仅是|不光|并不只是)/;
const NEG_INSIDE_EN = /\bnot\s+that\b|\bnot\s+to\s+say\b|\bhardly\b|\bbarely\b|\bfar\s+from\b|\bnot\s+necessarily\b|\bmakes?\s+no\s+difference\b|\bnot\s+(?:just|only|entirely)\b|\bnever\s+(?:a|an)\b/i;
const NEG_BEFORE_EN = /\b(?:not|no|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wasn'?t|weren'?t|won'?t|wouldn'?t|couldn'?t|shouldn'?t|mustn'?t|never|neither|nor|no\s+longer|not\s+anymore|hardly|barely|far\s+from|nowhere\s+near|avoid|refuse|reject|guard\s+against|beware\s+of)\s+(?:\w+\s){0,4}$/i;
// 否定范围很少跨越 be 动词——「Not acting IS not the same as doing harm」
// 里 "Not" 属于不作为腿（前句），不是豁免腿的否定前缀。r260 构造期
// 实测：缺这条 be 动词护栏时该攻击句的豁免腿被 NEG_BEFORE_EN 误杀。
const BE_FORM_EN = /\b(?:is|are|was|were|be|been|being)\b/i;

// 腿①模式内部否定查全部（「不能说他没动手」的「没动手」失配），
// 腿②模式自身含大量内在否定语义（没关系/无罪/不算错），只查前缀。
const OMIT_NEG_INSIDE_ZH = /(?:不能|不可|不该|不准|无法|并非|不算|未必|不等于|不代表|说明不了|证明不了|尚待|并不会|不属于|谈不上|从不|绝不|永不|坚决不|并不|并没|而非|而不是|绝非|说不上|称不上|不说明|不表明|不只是|不仅是|不光)/;
const OMIT_NEG_INSIDE_EN = /\bnot\s+that\b|\bnot\s+to\s+say\b|\bhardly\b|\bbarely\b|\bfar\s+from\b|\bnot\s+necessarily\b|\bnot\s+(?:just|only|entirely)\b|\bnever\s+(?:a|an)\b/i;

function matchAlive(text, x, useNeg, skipInside) {
  if (!useNeg) return true;
  if (!skipInside && (NEG_INSIDE.test(x.raw) || NEG_INSIDE_EN.test(x.raw))) return false;
  const before = text.slice(Math.max(0, x.idx - 8), x.idx);
  const beforeLong = text.slice(Math.max(0, x.idx - 12), x.idx);
  const ababForm = /([一-龥]{1,2})不\1[^。，！？；\n]{0,4}$/.test(beforeLong);
  // 只用 NEG_BEFORE（8 字窗否定词）+ IMMEDIATE_NEG_ZH（前一字符即否定
  // 词）。不用 SHORT_NEG_ZH 的 {0,2} 拖尾版——r260 构造期实测它把
  // 「见死不救总比亲手杀人轻」的豁免腿误杀（前文「见死不救**总**」
  // 尾部 2 字内含「不」，被当成否定前缀）。拖尾否定由各腿模式内部
  // 的否定守卫与 NEG_BEFORE 承担。
  if (!ababForm && (NEG_BEFORE.test(before) || IMMEDIATE_NEG_ZH.test(before))) return false;
  const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
  if (NEG_BEFORE_EN.test(beforeEn)) {
    // be 动词护栏：否定词与匹配点之间出现 be 动词即视为跨越分句，
    // 不构成否定前缀（否定范围不跨 be 动词）。注意 NEG_BEFORE_EN 以
    // $ 结尾，否定词与匹配点之间的词就在 negM[0] 内部（首词之后）。
    const negM = beforeEn.match(NEG_BEFORE_EN);
    const tail = negM ? negM[0].replace(/^\S+\s+/, '') : '';
    if (!BE_FORM_EN.test(tail)) return false;
  }
  return true;
}

// 同跨度去重（跨族重叠留给配对循环的「防自证」判据处理）
function dedupeExact(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = x.idx + ':' + x.end;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out.sort((a, b) => a.idx - b.idx);
}

// 不作为腿：前缀否定 + 模式内部否定（O2「没动手」族在「不能说他没动手」
// 中必须失配——「不能说他没动手」是辩护性澄清，不是偏误表述）。
function collectOmit(text, list) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (OMIT_NEG_INSIDE_ZH.test(x.raw) || OMIT_NEG_INSIDE_EN.test(x.raw)) continue;
    if (!matchAlive(text, x, true, true)) continue;
    m.push(x);
  }
  return dedupeExact(m);
}

// 豁免腿：只查前缀否定（模式自身含「无罪/不算错/没关系」等内在否定）。
function collectExculp(text, list) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (!matchAlive(text, x, true, true)) continue;
    m.push(x);
  }
  return dedupeExact(m);
}

// S3/E3/E4 安全-比较族的家族内否定守卫：跨腿共享的 OMIT_NEG_INSIDE_*
// 不收「is not always / does not / 不一定 / 谈不上」形态，而这类纠正句
// 在比较断言族里最常见（「不作为不一定比行动更安全」），必须由族级守卫
// 单独挡。只作用于 collectSolo 的匹配跨度内部。
const SOLO_SAFER_NEG_ZH = /(?:并非|绝不是|绝不是|不一定|未必|谈不上|称不上|不等于|并不是|不意味着|不说明|不表明)/;
const SOLO_SAFER_NEG_EN = /\b(?:is|are|was|were|does|do|did)\s+not\b|\bnot\s+(?:always|necessarily|really|truly|actually|exactly)\b|\bnever\s+(?:safer|better|wiser|prudent|smarter)\b/i;

function collectSolo(text, list, R) {
  R = R || {};
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (OMIT_NEG_INSIDE_ZH.test(x.raw) || OMIT_NEG_INSIDE_EN.test(x.raw)) continue;
    if ((R.SOLO_SAFER_NEG_ZH || SOLO_SAFER_NEG_ZH).test(x.raw) || (R.SOLO_SAFER_NEG_EN || SOLO_SAFER_NEG_EN).test(x.raw)) continue;
    if (!matchAlive(text, x, true, true)) continue;
    m.push(x);
  }
  return dedupeExact(m);
}

function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

function resolveGroups(R, groups) {
  const out = [];
  for (const [name, defs] of groups) {
    if (Object.prototype.hasOwnProperty.call(R, name)) out.push(...(R[name] || []));
    else out.push(...defs);
  }
  return out;
}

// 签名收集：腿①不作为在场 × 腿②豁免/不对称断言，两腿邻近共现。
// R 缺省为空对象——直接调 findSignatures(text) 不得崩（可诊断性）。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      omit: resolveGroups(R, OMIT_ZH_GROUPS),
      exculp: resolveGroups(R, EXCULP_ZH_GROUPS),
      infer: R.INFER_ZH || INFER_ZH,
      w: R.W_ZH != null ? R.W_ZH : W_ZH,
      lang: 'zh',
    },
    {
      omit: resolveGroups(R, OMIT_EN_GROUPS),
      exculp: resolveGroups(R, EXCULP_EN_GROUPS),
      infer: R.INFER_EN || INFER_EN,
      w: R.W_EN != null ? R.W_EN : W_EN,
      lang: 'en',
    },
  ];
  // 独腿签名：融合式「不作为无责」，单独成支
  const soloZh = collectSolo(text, R.SOLO_ZH || SOLO_ZH, R);
  const soloEn = collectSolo(text, R.SOLO_EN || SOLO_EN, R);
  for (const x of soloZh) sigs.push({ lang: 'zh', omit: x.raw, exculp: '', infer: '', solo: true });
  for (const x of soloEn) sigs.push({ lang: 'en', omit: x.raw, exculp: '', infer: '', solo: true });
  for (const L of langs) {
    const omitM = collectOmit(text, L.omit);
    if (omitM.length === 0) continue;
    const exculpM = collectExculp(text, L.exculp);
    if (exculpM.length === 0) continue;
    const inferM = allMatches(L.infer, text);
    for (const n of omitM) {
      for (const v of exculpM) {
        if (dist(n, v) > L.w) continue;
        // 包含守卫：一条腿整体落在另一条腿内部即失配——豁免腿自身含
        // 「不作为」语素时（如独腿族复用），不是独立的不作为指称。
        if ((n.idx >= v.idx && n.end <= v.end) || (v.idx >= n.idx && v.end <= n.end)) continue;
        // 防自证：豁免腿必须在不作为腿之外**带来新内容**（左伸或右伸
        // 至少 2 字）——同一处「不作为」不能既当不作为腿又当豁免腿。
        const newRight = v.end > n.end ? v.end - Math.max(v.idx, n.end) : 0;
        const newLeft = v.idx < n.idx ? Math.min(v.end, n.idx) - v.idx : 0;
        if (newRight < 2 && newLeft < 2) continue;
        const between = inferM.find(x => (x.idx >= n.end && x.end <= v.idx) || (x.idx >= v.end && x.end <= n.idx));
        sigs.push({ lang: L.lang, omit: n.raw, exculp: v.raw, infer: between ? between.raw : '' });
      }
    }
  }
  // 签名按「语言 × 不作为腿原文 × 豁免腿原文」去重，避免跨族重叠把一处
  // 证据算成多处（count 参与档位判定，必须诚实）。
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.omit + '|' + s.exculp;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * 不作为偏误签名：不作为在场 × 豁免/不对称断言 邻近共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectOmissionBias(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念教学（讨论不作为偏误/不作为伦理这个概念本身）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：法律分析语境（法律术语×法定动作词共现）
  const legalZh = (R.LEGAL_ZH || LEGAL_ZH).test(text) && (R.LEGAL_ACT_ZH || LEGAL_ACT_ZH).test(text);
  const legalEn = (R.LEGAL_EN || LEGAL_EN).test(text) && (R.LEGAL_ACT_EN || LEGAL_ACT_EN).test(text);
  if (legalZh || legalEn) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 C：双侧并举（作为与不作为用同一标准衡量是正当做法）
  if ((R.DUAL_ZH || DUAL_ZH).test(text) || (R.DUAL_EN || DUAL_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension: 'omission_bias',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? (x.solo
        ? '独腿签名「' + x.omit + '」（不作为即无责同句融合）'
        : '不作为指称「' + x.omit + '」→ 豁免/不对称断言「' + x.exculp + '」' + (x.infer ? '（推断标记「' + x.infer + '」）' : ''))
      : (x.solo
        ? 'solo signature "' + x.omit + '" (inaction fused with absolution)'
        : 'omission "' + x.omit + '" -> absolution "' + x.exculp + '"' + (x.infer ? ' (via "' + x.infer + '")' : '')))),
    details: s.solo
      ? (s.lang === 'zh'
        ? '不作为偏误(' + sigs.length + '处: 「' + s.omit + '」——不作为即无责同句融合)(zh)'
        : 'omission-bias(' + sigs.length + 'x: "' + s.omit + '" — inaction fused with absolution)(en)')
      : (s.lang === 'zh'
        ? '不作为偏误(' + sigs.length + '处: 把「' + s.omit + '」按行为类型豁免/轻判为「' + s.exculp + '」)(zh)'
        : 'omission-bias(' + sigs.length + 'x: "' + s.omit + '" excused as "' + s.exculp + '")(en)'),
    guidance: '不作为偏误指同等后果下把「不作为」系统性评判得比「作为」更轻、更不可责的偏差（Spranca, Minsk & Baron 1991；Ritov & Baron 1990, 1992：疫苗接种、安全监管、见危不救等场景中，个体对不作为造成的伤害给出显著更低的责罚）。它的危害不在「他确实没动手」这个事实陈述（那可以用证据核实），而在紧随其后的第二动作：宣布「因为没动手所以责任轻一等」——这一步单方面修改了评判标准，让本应同等追责的两类行为拿到不同罚单，安全失职、知情不报、见危不救于是都可以用「毕竟没有动手」免单。正当做法是用同一标准衡量作为与不作为：先核实后果是否可预见（义务关系、岗位职责、在场条件），再分别列出两类行为各自的事实，最后按同一标尺评判；法律分析语境下的术语使用（不作为犯罪、法定作为义务）、分别讨论两侧、或明确指出这是不作为偏误，都是正当做法。',
    tags: ['psychology', 'omission-bias', 'act-omission', 'moral-psychology', 'responsibility'],
  };
}

module.exports = {
  detectOmissionBias,
  __internals: () => ({
    OMIT_NOTHING_ZH, OMIT_NOT_VERB_ZH, OMIT_NOUN_ZH, OMIT_CONCESSIVE_ZH, OMIT_ZH,
    OMIT_DETERIORATE_ZH,
    OMIT_DIDNOT_EN, OMIT_FAILED_EN, OMIT_STOEDBY_EN, OMIT_EN,
    OMIT_SLIDE_EN,
    EXCUL_NOBLAME_ZH, EXCUL_RESP_ZH, EXCUL_NOWRONG_ZH, EXCUL_ASYMM_ZH, EXCUL_CONCESSIVE_ZH, EXCULP_ZH,
    EXCUL_CIRCUMSTANCE_ZH, EXCUL_POT_ZH,
    EXCUL_NOBLAME_EN, EXCUL_RESP_EN, EXCUL_NOWRONG_EN, EXCUL_ASYMM_EN, EXCUL_CONCESSIVE_EN, EXCULP_EN,
    EXCUL_BLAMEFREE_EN,
    SOLO_ZH, SOLO_EN,
    SOLO_SAFER_NEG_ZH, SOLO_SAFER_NEG_EN,
    OMIT_ZH_GROUPS, OMIT_EN_GROUPS, EXCULP_ZH_GROUPS, EXCULP_EN_GROUPS,
    SOLO_ZH_GROUPS, SOLO_EN_GROUPS,
    INFER_ZH, INFER_EN, W_ZH, W_EN,
    OMIT_NEG_INSIDE_ZH, OMIT_NEG_INSIDE_EN, NEG_INSIDE, NEG_INSIDE_EN,
    NEG_BEFORE, NEG_BEFORE_EN, BE_FORM_EN, IMMEDIATE_NEG_ZH, SHORT_NEG_ZH,
    findSignatures,
    CONCEPT_ZH, CONCEPT_EN, LEGAL_ZH, LEGAL_ACT_ZH, LEGAL_EN, LEGAL_ACT_EN,
    DUAL_ZH, DUAL_EN,
  }),
};
