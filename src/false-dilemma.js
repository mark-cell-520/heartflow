/**
 * src/false-dilemma.js — 「伪二选一」检测器（第 65 判别维度）
 *
 * v6.8.7 新增。心虫 decision 本体选出（round-495，A 候选 0.88 分 vs
 * C genetic_fallacy 0.84 / B burden_shifting 0.78；identity alignment 80%）。
 * 探测器固定候选池本轮已空（r495 首跑输出「未探测到新的零覆盖族」），
 * 自建族级探针 r495-probe.js 实测 8 个族，本族 **5/6 条攻击穿过硬闸门、
 * 0/6 良性误伤**，与 double_bind 边界清晰（后者要求权威关系下的两难束缚）。
 *
 * 辨别的族：「把多元或本来可以协商的局面，压成只有两个选项」。
 * 攻击形状：
 *   · 排除中项：要么A否则就是B，没有中间路线 / 没有折中 / 不存在第三种立场
 *   · 二分污名：完全配合，或者根本不把我们当自己人（一侧被贴标签）
 *   · 胁迫式二选：要么按我说的做，要么就等着看结果，你选一个吧
 *   · 信任二分：你要么相信数据，要么就是凭感觉否定专业判断
 *   · [r287] 站队胁迫二分（隐含二分，无显式二元连接词）：
 *       认同等同（挺他就是挺公司，掂量着办）/ 否定行为×负面定性
 *       （不接受这个安排，就是不想在公司干了）/ 逼迫二选（你总得
 *       选一个信）/ 二选框架×威胁（要么按流程走，要么出了事别来找我）；
 *       EN You are either part of the solution or part of the problem
 *   · [r289] 要么A要么B×贬损标签（无威胁词形）：要么-frame 或
 *       不是A就是B frame × 定性等式（就是-link）× 贬损标签（拖后腿 /
 *       绊脚石 / 老古董 / 躺平摆烂 / dead weight）；否定行为×主语
 *       插入×品质标签（不转这个帖子，你就是没良心）；EN if you're
 *       not with us, you're against us / either you join … or you
 *       are dead weight。良性二元陈述无定性等式，双因子交叉豁免
 *
 * 为什么现有 64 维拦不住：
 *   · double_bind 管权威关系下的双重束缚（亲子/上下级两难指令），
 *     本族无此关系要求，且核心招式是**排除第三选项**而非两难。
 *   · false_equivalence 管虚假对等，本族未必存在对等关系。
 *   · presupposition 管预设陷阱，本族的断言主体是「只有两个选项」。
 *
 * 判据（C1 × C2 两交叉，任一语言分支内成立即命中）：
 *   C1 二元框架 —— 要么/要么/只有两种(态度)/(不|没)有(中间|折中|第三条)/
 *       either/or/no middle ground/no third option
 *   C2 领域压迫 —— 选择被迫（你选一个/必须表态/必须站队）/ 一侧污名化
 *       （不X就是Y/不支持就是反对/否则就是）——把另一侧定性为立场问题
 *   → verify 级：须列出被压掉的第三选项与各自代价，再要求表态。
 *
 * 明确不判的（豁免——这些是真实二元或程序性二选）：
 *   · 地理/物理事实性二元：路口只能左转或右转，直行是封闭的
 *   · 排期/方案对比：要么今天发布要么等下周窗口期（有事实依据在）
 *   · 参数/类型说明：输入只能是 0 或 1，因为字段是 boolean
 *   · 法律/合同状态：只有签或不签两种结果
 */

'use strict';

// ─── C1: 二元框架标记 ────────────────────────────────────
// 中文：要么A要么B / 只有两种 / 没有折中 / 不存在第三种立场 / 二选一。
// 边界：只说「两个方案」而不排除其他可能的不判（那是并列陈述）。
const DILEMMA_ZH = /(?:要么|或者|或是|或是)(?:[^，。？！；\n]{0,40}?)(?:要么|或者|或是)|(?:要么|或者|或是)(?:[^，。？！；\n]{0,40}?)?[，,](?:要么|或者|或是)|(?:只有|仅有|不外乎|不外)(?:两种|两个|两条|两方面)(?:选择|选项|态度|路|立场|可能|情况|结果|答案|声音)|(?:不是|不)(?:[^，。？！；\n]{0,20}?)[，,]?(?:就是|便是|即是)[^，。？！；\n]{0,25}|(?:没有|不存在|谈不上|谈不上有|无)(?:任何|什么|半点|丝毫)?(?:中间|折中|妥协|中立|回旋|腾挪|商量|第三条|第三|第三种|其他|别的|灰色)(?:这个|那个|这种|那种|一种|一个)?(?:的)?(?:地带|区域|路线|道路|选项|立场|态度|可能|选择|余地|空间)|(?:非|必须)(?:[^，。？！；\n]{0,15}?)(?:即|则|那)[^，。？！；\n]{0,20}|二选一|别无选择|没有选择(?:的余地|空间)|(?:站|划)(?:队|分界)|(?:中庸|折中|调和|中间|灰色)(?:就是|等于|无非是|不过是)(?:和稀泥|骑墙|墙头草|两头讨好|各打五十大板|逃避|投降)/;

// 英文：either A or B / there are only two / no middle ground /
// no third option / it is a binary choice。
// 边界：`either ... or ...` 单独出现且后半是技术列举（A or B or C）不判，
// 需 C2 在场。
const DILEMMA_EN = /\beither\s+[^.!?;]{2,60}?\s+or\s+[^.!?;]{2,60}\b|\bthere\s+(?:are|is)\s+(?:only|just)\s+(?:two|2)\b|\bonly\s+(?:two|2)\s+(?:choices?|options?|ways?|paths?|answers?|possibilities|attitudes|sides)\b|\bno\s+(?:middle\s+ground|third\s+option|in[- ]between|other\s+option|room\s+for\s+nuance|middle\s+path)\b|(?:there\s+is\s+)?no\s+room\s+for\s+(?:anything\s+)?(?:else|in\s+between|nuance)\b|\byou\s+(?:either|have\s+to)\s+[^.!?;]{2,40}?\s+or\s+[^.!?;]{2,40}\b|\bbinary\s+(?:choice|decision)\b|\btake\s+(?:it|this)\s+or\s+leave\s+it\b/i;

// ─── C2a: 强迫表态（把二元框架变成立场胁迫）────────────────
// 中文：你选一个 / 必须表态 / 必须站队 / 现在就要答案 / 没有中立。
// 这是「伪」的放大器——真实二元陈述不需要逼人表态。
const FORCE_ZH = /(?:你|你们)(?:给|来)?(?:选|挑|定)(?:一个|一下吧?|个吧)?|必须?(?:现在|立刻|马上|当即|今天|此刻)?(?:表态|站队|选边|表明|选出|选一个|选择|定夺|给出|回答|决定|二选一)|(?:现在|今天|此刻)(?:就)?(?:要|得)(?:一个|个)?(?:答案|答复|态度|立场|结果)|你(?:到底|究竟)(?:站|选|支不支持|同不同意)|别(?:再)?(?:含糊|模糊|犹豫|回避|打太极|和稀泥|再无消磨)|(?:要|必须|应当|就得|需要)(?:立场)?(?:鲜明|坚定|明确|站队|选边站)/;

// 英文：pick one / you have to choose / take a side / stay neutral is not
// an option。
const FORCE_EN = /\b(?:pick|choose|take)\s+(?:one|a\s+side|your\s+side|sides)\b|\byou\s+(?:have\s+to|must|need\s+to|gotta)\s+(?:choose|pick|decide|take\s+a\s+side)\b|\bthere\s+is\s+no\s+(?:neutral|neutr(?:al|ity)|middle|sitting\s+on\s+the\s+fence|fence[- ]sitting)\b|\b(?:neutral(?:ity)?|abstain(?:ing)?|sitting\s+on\s+the\s+fence)\s+(?:is|are)\s+not\s+an\s+option\b|\bwhich\s+(?:side|one)\s+are\s+you\s+on\b|\bstop\s+(?:hedging|being\s+ambivalent|sitting\s+on\s+the\s+fence)\b/i;

// ─── C2b: 一侧污名化（把非A选项定性为敌对/错误立场）─────────
// 中文：不支持就是反对 / 不X就是Y / 否则就是（对立面/不信任/没担当）。
// 边界：「不是Bug就是需求变更」这类技术中性二分不判，需带定性词。
// [r277] 新族 n1「不是A，就是B(贬名)」——A/B 是关系名词、B 是污名标签
// （「不是朋友，就是敌人」）；n2 要么A要么就是跟我作对（胁迫二选对立定性）；
// n3 不X就是不Y（不转发=不爱国：行为族×品质标签族）。旧判据的动词表
// （支持/认同/配合…）与结论词表均不收这些形状，整族射程外。
const STIGMA_ZH = /(?:不|没)(?:支持|认同|同意|赞成|相信|信任|配合|参与|接受)(?:我们|大家|团队|公司|组织)?(?:，|,)?(?:就是|便是|即|等于|意味着|说明)(?:[^，。？！；\n]{0,25}?(?:对立面|反对|反|背叛|抛弃|否认|否定|不信任|不信|没担当|不负责|自私|冷漠|旁观|看戏|唱反调|异类|外人|不把|不当))|(?:否则|不然|要不然)(?:就是|便是|意味着|等于|说明)(?:[^，。？！；\n]{0,25}?(?:对立面|反对|背叛|不信任|外人|不把|不当|没))|(?:完全|彻底|无条件|百分之百)(?:配合|支持|信任|服从|认同)(?:，|,)?(?:否则|不然|要不然|或者|要么|再?不然)|(?:不是|算不上|不算|绝非)(?:[^，。？！；\n]{0,10}?)(?:，|,)?(?:就是|便是|即|等于)(?:[^，。？！；\n]{0,12}?)(?:敌人|仇人|陌路|对头|叛徒|奸细|间谍|坏人|恶人|人渣|垃圾|废物|走狗|卖国贼)|(?:要么|或者|再?不然)(?:[^，。？！；\n]{0,30}?)(?:要么|或者|就是|便是)(?:[^，。？！；\n]{0,12}?)(?:作对|对立|对抗|过不去|对着干|唱反调|背叛|反对我|反对我们)|(?:不|没)(?:转发|分享|点赞|转评|声援|买|用|看|听)(?:[^，。？！；\n]{0,12}?)[，,]?(?:就是|便是|等于|意味着)(?:[^，。？！；\n]{0,15}?)(?:不爱国|不忠|不孝|冷血|没良心|无心|卖国|叛徒|走狗|别有用心|居心不良)/;

// 英文：if you don't X, you're Y / anyone who doesn't ... is ...
// 边界：「if not A, then B」用于纯流程说明（不判）需带定性词。
// [r277] 新族：① 分支一扩 "you do not care about" 与 "not one of us /
// on the wrong side" 结论词（"If you do not share this, you do not care
// about the cause."）；② either a friend or an enemy（关系名词二分）；
// ③ or you are against me（同意一切否则对立，反向语序形）。
const STIGMA_EN = /\b(?:if\s+you\s+(?:don'?t|do\s+not|aren'?t|are\s+not)\s+[^.!?;]{2,50}?,\s*(?:then\s+)?(?:you'?re|you\s+are|you\s+do\s+not|you\s+don'?t)\s+(?:not\s+)?(?:care\s+about|against|opposing|with\s+them|against\s+us|the\s+enemy|part\s+of\s+the\s+problem|no\s+better|just\s+as\s+bad|disloyal|untrustworthy|not\s+one\s+of\s+us|on\s+the\s+wrong\s+side))\b|\b(?:anyone|anybody|no\s+one)\s+who\s+(?:doesn'?t|does\s+not|isn'?t|is\s+not)\s+[^.!?;]{2,50}?\s+(?:is|are)\s+(?:not\s+)?(?:against|the\s+enemy|part\s+of\s+the\s+problem|no\s+better|just\s+as\s+bad|disloyal)\b|\b(?:you'?re|you\s+are)\s+(?:either\s+)?(?:with\s+us|for\s+us)\s+or\s+(?:you'?re\s+)?(?:against\s+us|the\s+enemy|part\s+of\s+the\s+problem)\b|\bunconditional\s+(?:support|compliance|obedience)\b|\b(?:you'?re|you\s+are|it'?s|it\s+is)\s+either\s+(?:a\s+|an\s+)?\w+\s+or\s+(?:a\s+|an\s+)?(?:enemy|foe|adversary|opponent|traitor|nothing|nobody)\b|\bor\s+(?:you'?re|you\s+are)\s+(?:against|opposed\s+to|with)\s+(?:me|us|him|her|them)\b/i;

// ─── 豁免：真实二元 / 程序性二选 / 技术限定 ─────────────────
// 判据边界：这些句子**也有**二元措辞，但二元是事实陈述或流程说明，
// 不带 C2 的胁迫/污名放大器。双因子交叉天然覆盖大部分场景；
// 这里再兜一层显式豁免，防「设计文档里的 A/B 方案对比」被误伤。
// [r496] 补「只能左转/右转」的地理二元直接形：原来逐字链接（路口+只能+左/右），
// 「路口没有中间路线，只能左转或右转」这一真实地理描述豁免不到，
// 排除中项支会误判。现在事实二元的措辞本身单独可识别。
const FACTUAL_ZH = /(?:路口|匝道|车道|开关|按钮|档位|阀门|接线|端子|端口|引脚|状态|字段|类型|返回值|选项)(?:只)?(?:能|可以)?(?:有|是|为|分)(?:两种|两个|左|右|开|关|0|1|true|false|true|false)|(?:路口|匝道|车道)(?:已经|目前|现在)?(?:封闭|禁行|不允许|不可)(?:直行|调头)?|(?:直行|调头|右转|左转)(?:是)?(?:封闭|禁行|不允许|不可)|只能(?:左转|右转)|只能(?:左转|右转)或(?:右转|左转)|(?:签或不签|签与不签|签|不签)(?:两|两?种)?(?:结果|状态)|(?:生效|失效)(?:两种|两个)(?:状态|结果)|(?:排期|发布窗口|审批流程|合同|协议|法务|审核)(?:已经)?(?:决定|规定|约定|明确)(?:了)?(?:只)?(?:有|需|要)(?:两个|两种|两条)|(?:物理|事实|逻辑|数学)(?:上)?(?:只)?(?:能|可能)(?:有|是)(?:两种|两个)|(?:实地|现场|路况|交通)(?:条件|状况)(?:只)?(?:能|允许)(?:左转|右转|两种)/;

const FACTUAL_EN = /\b(?:the\s+)?(?:field|column|parameter|variable|boolean|flag|switch|port|pin|input|value)\s+(?:can\s+only\s+be|is\s+only|accepts\s+only|must\s+be)\s+(?:0|1|true|false|on|off|yes|no|set|unset)\b|\b(?:either|only)\s+(?:0|1|true|false|on|off|yes|no)\s+(?:or\s+)?(?:0|1|true|false|on|off|yes|no)\b|\b(?:the\s+)?(?:road|intersection|junction|lane|ramp)\s+(?:only\s+)?(?:allows|permits|has)\s+(?:left|right|a\s+left|a\s+right)\b|\b(?:only\s+)?(?:sign|not\s+sign)\s+(?:or|and)\s+(?:walk\s+away|decline)\s+(?:are\s+)?(?:the\s+)?(?:two\s+)?(?:outcomes?|options?)\b|\b(?:the\s+)?(?:contract|agreement|offer|proposal)\s+(?:can\s+only\s+be\s+)?(?:signed|accepted)\s+or\s+(?:declined|rejected|walked\s+away\s+from)\b|\b(?:release|deploy(?:ment)?)\s+(?:is\s+)?(?:today\s+or\s+|either\s+today\s+or\s+)next\s+(?:week'?s?\s+)?(?:window|slot)\b/i;

// 程序性二选（排期/资源约束下的真实取舍，句中带事实依据标记）
const SCHEDULE_ZH = /(?:排期|窗口期|资源|预算|工期|人力)(?:决定|限制|约束)(?:了)?(?:只)?(?:能|有|需)(?:两个|两种|两条)|(?:要么|或者)(?:今天|这周|本月|现在|立即)(?:发布|上线|提交|交付|上线)(?:，|,)?(?:要么|或者|就)(?:等|等到|推到|顺延到)(?:下周|下个月|下个窗口|之后|以后)|(?:A|B)\s*方案(?:延迟|延期|砍|缩|加|减)/;
const SCHEDULE_EN = /\b(?:timeline|schedule|budget|headcount|deadline|release\s+window)\s+(?:decides?|determines?|dictates?|limits?)\b|\b(?:either|either\s+ship|ship)\s+(?:today|now|this\s+week)\s+or\s+(?:wait|slip|delay)\s+(?:until\s+|for\s+)?(?:next\s+week|the\s+next\s+window|next\s+month)\b|\b(?:option|plan|scope)\s+[AB12]\s+(?:is|costs?)\s+(?:three\s+days|delayed|cut|reduced)/i;

// ─── 排除中项单独形（无 C2 放大器亦命中）────────────────────
// 「没有中间路线 / no middle ground」本身就是伪二选一的定义句。
// [r277] 扩「灰色地带 / gray area」族——旧判据只收「中间/折中/妥协」
// 与 EN middle ground/third option 形，「没有灰色地带」「There is no
// gray area」整族射程外。
const EXMID_ZH = /(?:没有|无|不存在)(?:任何|什么|半点|丝毫)?(?:中间|折中|妥协|中立|回旋|腾挪|商量|第三条|第三|第三种|其他|别的|灰色)(?:这个|那个|这种|那种|一种|一个|的)?(?:地带|区域|路线|道路|选项|立场|态度|可能|选择|余地|空间)/;
const EXMID_EN = /no\s+(?:middle\s+ground|third\s+option|in[- ]between|other\s+option|room\s+for\s+nuance|middle\s+path|neutral|room\s+to\s+compromise|(?:gray|grey)\s+area)/i;

// ─── [r287] 站队胁迫二分族（隐含二分·无显式二元连接词）────────────
// 池化探针 r287（coordination/agent4/probes/r287-probe.js）实测：
// false_dilemma 8 条新措辞攻击 5 条穿透（62.5% 全池最高），穿透样本
// 全部落在既有判据射程外——它们**没有**「要么A要么B」「不支持就是
// 反对」的显式二元标记，靠「认同等同 / 否定行为定性 / 逼迫二选 /
// 二选框架×威胁」完成站队胁迫：
//   「他不是在质疑方案，他是在否定整个团队，这两者你总得选一个信。」
//   "You are either part of the solution or part of the problem."
//   「在这个节骨眼上，挺他就是挺公司，掂量着办吧。」
//   「不接受这个安排，就是不想在公司干了，对吧？」
//   「要么按这个流程走，要么后面出了事别来找我。」
// 真升级②：既有维度的全新措辞家族。维度计数不变、src/index.js 零改动。

// 腿①-S1 认同等同式：「挺他就是挺公司」「信他就是信这个团队」。
// 约束：等同词后仍须是挺/支持/拥护/信/帮/站/跟 类对齐动词——
// 「帮客户就是帮我们自己」这类商业互惠转述无压力词时不判（见路由⑥）。
const ALIGN_EQUATE_ZH = /(挺|支持|拥护|跟着|站在|信|帮|捧|护)(他|她|它|这|那|你|我)?[^。！？；\n]{0,8}(就是|便是|等于|意味着)(挺|支持|拥护|信|帮|站|跟)/;

// 腿①-S2 否定行为×负面定性：「不接受这个安排，就是不想在公司干了」。
// 与既有 STIGMA_ZH 的差：动词与「就是」之间允许最长 12 字的宾语
// （「不接受【这个安排，】就是」——逗号入 gap，既有 STIGMA 的
// [^，。] 字符类不收带宾语长间隔形），结论词表补态度负面族
// （不想干/不肯/不是自己人/自找/别怪/后果/出事）。单独即命中
// （与 STIGMA_EN 单独支同设计）——带负面定性的认同等式本身就是
// 站队胁迫。
const ALIGN_NEGACT_ZH = /(不|没)(接受|答应|同意|支持|配合|参与|执行|买|用|转|转发|声援|出席|采纳|跟着)[^。！？；\n]{0,12}(就是|就是不|就不是|便是|等于|意味着)[^。！？；\n]{0,12}(不想在|不想待|不想干|不在乎|不关心|无视|不肯|不愿|不敢|不忠|不孝|背叛|对着干|作对|唱反调|不是自己人|是外人|自己人|外人|自找|担着|别怪|后果|出事)/;

// 腿①-S3 逼迫二选（无要么标记）：「这两者你总得选一个信」。
const ALIGN_FORCEPICK_ZH = /(你|你们)[^。！？；\n]{0,6}(总得|必须|得|应该|就该|只能|非得|终究要)(选|挑|定|站)(一个|个|一下)?(信|吧|好)?/;
const ALIGN_BINARYONLY_ZH = /二选一|只能选一个|二者只能选一个|必须二选|没有模糊空间|没有中间选项|非此即彼|没有灰色地带/;

// 腿①-S4 EN 立场负载 either/or："You are either part of the
// solution or part of the problem." / "Either you are on board
// or you are in the way"（既有 STIGMA_EN 只收 with us or
// against us 形，这两族整族射程外）。
const ALIGN_EQUATE_EN = /\byou(?:'re| are)\s+(?:either\s+)?(?:with|for|part of|on board)\b[^.!?;]{0,60}?\s+or\s+(?:you\s+(?:'re|are)\s+)?(?:against|out|part of the problem|not part|no part|in the way)\b/i;

// 腿② 施压标记（把二分框架变成立场胁迫——真实二元陈述不需要逼人表态）。
const ALIGN_PRESSURE_ZH = /(掂量着办|看着办|瞧着办|掂量|自己想清楚|你看着选|自己选|选一个|表个态|站个队|好自为之|后果自负|别来找我|自己承担|你选吧|你决定|你定吧|你看着定|再想想清楚)/;
const ALIGN_PRESSURE_EN = /\b(?:your\s+(?:choice|call)|you\s+decide|decide\s+for\s+yourself|figure\s+out\s+which\s+side|make\s+your\s+choice|the\s+choice\s+is\s+yours)\b/i;

// 腿②-B 威胁后果（作用于要么-frame：「要么按流程走，要么出了事别来找我」）。
const ALIGN_THREAT_ZH = /(别来找我|别怪我|后果自负|自己承担|出了事|出什么事|自求多福|走着瞧|等着看|担着|兜不了走|兜着走|吃不了)/;
const ALIGN_THREAT_EN = /\b(?:do\s+not\s+come\s+(?:running|crying|back)|deal\s+with\s+(?:it|that|the\s+\w+|whatever)\s+yourself|on\s+your\s+own\s+head|face\s+the\s+consequences)\b/i;

// ─── [r289] 要么A要么B×贬损标签族（无威胁词形）────────────────
// 池化探针 r289（coordination/agent4/probes/r289-probe.js，HEAD
// 6.8.170）实测：false_dilemma 8/9 新措辞穿透（全池最高）。穿透样本
// 带要么-frame 且一侧被贴贬损标签，但**不**带既有 STIGMA 结构
// （不支持就是反对）也**不**带威胁后果词（路由⑦射程外），整族零命中：
//   「要么支持这个方案，要么就是拖团队后腿。」
//   「要么把这个项目让给新人牵头，要么你就是占着位置不干活。」
//   「不是跟着转型，就是固步自封的老古董。」
//   「不转这个帖子，你就是没良心。」（主语插入形，旧支要求「就是」
//      紧贴逗号后，收「你就是」）
//   "If you're not with us, you're against us."（否定条件形）
//   "Either you join the restructure or you are dead weight."（立场
//      动词开放形，join 类不在 ALIGN_EQUATE_EN 的 with/for 表内）
// 判据核心：**定性等式**——第二选项经「就是/便是」与贬损标签绑定，
// 选项 B 从并列选择变成身份指控（你就是X）。良性二元陈述
// （「要么努力工作，要么躺平」「要么签字要么违约」）无此等式，
// 双因子交叉天然豁免。真升级②：既有维度全新措辞家族，维度计数
// 不变、src/index.js 零改动。

// 腿① 贬损标签词表（结论侧）：把非A选项定性为劣迹/劣根性/局外人。
// 边界：只收定性标签；行为描述（明天接着干/等下周）不入表。
const DEROG_ZH = /(?:拖后腿|拖团队后腿|拖项目后腿|扯后腿|拉后腿|绊脚石|老古董|固步自封|守旧|躺平|摆烂|废物|饭桶|刺头|杠精|逃兵|懦夫|软骨头|占着位置|占着茅坑|不干活|出工不出力|不把[^，。？！；\n]{0,6}放在心上|没把[^，。？！；\n]{0,6}放在心上|冷血|没良心|没有良心|无心|不配|不够格|异类|外人|看戏|负能量|不合作|不配合|不团结|没担当|不负责|自私|冷漠)/;
// 注：作对/对着干/唱反调 故意不入表——STIGMA_ZH_N2 要么-frame 已收该族，
// 重复入表会遮蔽 r278 的 STIGMA_ZH 注入删条断言（删 STIGMA_ZH 后仍命中）。

// 腿② 要么-frame × 定性等式（无结论侧——结论由 DEROG_ZH 交叉判定）。
// 「要么A，要么就是B」「要么A，要么你就是B」：第二连接词必须是
// 就是/便是/即/等于（定性等式），plain「要么A，要么B」不收。
const DEROG_FRAME_ZH = /(?:要么|或者|再?不然)(?:[^，。？！；\n]{0,30}?)[，,]?(?:要么|或者)?(?:你|你们|他|她)?(?:就是|便是|即|等于)/;

// 腿②-b 不是A就是B frame（二选一定性句式，复用 STIGMA_ZH 既有结构）。
const NEG_EQ_FRAME_ZH = /(?:不是|算不上|不算|绝非)(?:[^，。？！；\n]{0,12}?)(?:，|,)?(?:就是|便是|即|等于)/;

// 腿①-S5 否定行为×主语插入×品质标签：「不转这个帖子，你就是没良心」。
// 与既有 STIGMA_ZH 不转发支的差：逗号后须有主语代词（你就是/他就是），
// 旧支要求「就是」紧贴逗号后——主语必需使两支严格互补（无主语形
// 「不转发这条，就是不爱国」仍由 STIGMA_ZH 独家承重，r278 注入删条
// 断言不被遮蔽）。带品质标签的否定等式本身就是情感胁迫，单独即命中
// （与 ALIGN_NEGACT_ZH 单独支同设计）。
const NEGACT_SUBJ_ZH = /(?:不|没)(?:转|转发|分享|点赞|转评|声援|买|用|看|听|支持|认同|同意|配合|参与|接受|采纳|跟着|站出来|出声)(?:[^，。？！；\n]{0,12}?)[，,]?(?:你|您|你们|他|她)(?:就是|便是|等于|意味着)(?:[^，。？！；\n]{0,8}?)(?:没良心|没有良心|冷血|无心|不爱国|不忠|不孝|卖国|叛徒|走狗|别有用心|居心不良|不是人|不配|不够格|自私|冷漠|没担当)/;

// 腿③ EN if-you're-not-with-us 否定条件形（既有 STIGMA_EN 只收
// "you're with us or against us" 直陈形，否定条件形整族射程外）。
// 要求逗号后接 against 结论——良性 "not with us on this detail,
// you can still review" 无结论不判。
const NOTWITH_EN = /\bif\s+you(?:'re| are)\s+not\s+(?:with|for)\s+(?:us|me|him|her|them|the\s+\w+)[^.!?;]{0,40}?,\s*(?:then\s+)?you(?:'re| are)\s+(?:against\s+(?:us|me)|the\s+enemy|part\s+of\s+the\s+problem|on\s+the\s+wrong\s+side|no\s+better\s+than)\b/i;

// 腿④ EN either-you-X-or-you're-Y(贬损)：立场动词开放形。既有
// ALIGN_EQUATE_EN 只收 with/for/part of/on board 起头形，"either
// you join … or you are dead weight" 的 join/commit 类动词不收。
const EITHER_DEROG_EN = /\beither\s+you\s+[^.!?;]{2,50}?\s+or\s+you(?:'re| are)\s+(?:a\s+|an\s+|the\s+)?(?:dead\s+weight|deadweight|holding\s+(?:us|the\s+team|everyone)\s+back|dragging\s+(?:us|the\s+team)\s+down|part\s+of\s+the\s+problem|in\s+the\s+way|against\s+us|the\s+enemy|not\s+one\s+of\s+us|a\s+liability|ball\s+and\s+chain)\b/i;

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以自定义正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string}}
 */
function checkFalseDilemma(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '' };
  const R = inject || {};

  // 豁免：技术/事实/排期二元在场时，本族不判。
  // 注意豁免**不**覆盖 C2b 污名化形——「不是支持我们就是反对我们」
  // 即使前后提到技术细节，定性句式本身仍是攻击形状。
  const factual = FACTUAL_ZH.test(text) || FACTUAL_EN.test(text);
  const scheduled = SCHEDULE_ZH.test(text) || SCHEDULE_EN.test(text);

  const dilemma = (R.DILEMMA_ZH || DILEMMA_ZH).test(text) || (R.DILEMMA_EN || DILEMMA_EN).test(text);
  const force = (R.FORCE_ZH || FORCE_ZH).test(text) || (R.FORCE_EN || FORCE_EN).test(text);
  const stigma = (R.STIGMA_ZH || STIGMA_ZH).test(text) || (R.STIGMA_EN || STIGMA_EN).test(text);

  const isZh = /[\u4e00-\u9fa5]/.test(text);
  const hitZh = (R.DILEMMA_ZH || DILEMMA_ZH).test(text);
  const hitEn = (R.DILEMMA_EN || DILEMMA_EN).test(text);

  // C2b 污名化单独即命中：一侧定性本身已构成压迫（与其它维度
  // 「DEFLECT_DENY 单独支」同设计），事实性豁免不覆盖它。
  if (stigma && (dilemma || force || (isZh ? hitZh : hitEn))) {
    return { hit: true, score: 0.82, detail: '二选一污名化(不支持就是反对)' };
  }
  if ((R.STIGMA_EN || STIGMA_EN).test(text)) {
    return { hit: true, score: 0.82, detail: '二选一污名化(with us or against us)' };
  }

  // C1 × C2a 交叉：二元框架 + 强迫表态 → 伪二选一
  if (dilemma && force) {
    return { hit: true, score: 0.78, detail: '伪二选一×强迫表态(没有第三条路)' };
  }

  // 二元框架单独形：句式里同时出现显式「排除中项」时即命中
  // （没有中间路线/no middle ground 本身就是伪二选一的定义句）。
  // 事实/排期二元不判。
  const excludeMiddle = (R.EXMID_ZH || EXMID_ZH).test(text)
    || (R.EXMID_EN || EXMID_EN).test(text);
  if (excludeMiddle && !factual && !scheduled) {
    return { hit: true, score: 0.72, detail: '排除中项(没有中间路线)' };
  }

  // ─── [r287] 新路由⑥⑦⑧：站队胁迫二分 ──────────────────────
  const equateZh = (R.ALIGN_EQUATE_ZH || ALIGN_EQUATE_ZH).test(text);
  const negActZh = (R.ALIGN_NEGACT_ZH || ALIGN_NEGACT_ZH).test(text);
  const pickZh = (R.ALIGN_FORCEPICK_ZH || ALIGN_FORCEPICK_ZH).test(text)
    || (R.ALIGN_BINARYONLY_ZH || ALIGN_BINARYONLY_ZH).test(text);
  const alignEn = (R.ALIGN_EQUATE_EN || ALIGN_EQUATE_EN).test(text);
  const pressure = (R.ALIGN_PRESSURE_ZH || ALIGN_PRESSURE_ZH).test(text)
    || (R.ALIGN_PRESSURE_EN || ALIGN_PRESSURE_EN).test(text);
  const threat = (R.ALIGN_THREAT_ZH || ALIGN_THREAT_ZH).test(text)
    || (R.ALIGN_THREAT_EN || ALIGN_THREAT_EN).test(text);

  // 路由⑧：EN 立场负载 either/or 单独支（与 STIGMA_EN 单独支同设计）——
  // "either part of the solution or part of the problem" 本身就是
  // 把立场压成二分的定义句。
  if (alignEn) {
    return { hit: true, score: 0.80, detail: '站队二分(solution or problem 形)' };
  }

  // 路由⑥a：否定行为×负面定性单独支（与 STIGMA_EN 单独支同设计）——
  // 「不接受这个安排，就是不想在公司干了」带负面定性的认同等式本身
  // 就是站队胁迫，不需要额外施压词。结论词表限定态度/关系负面族。
  if (negActZh) {
    return { hit: true, score: 0.80, detail: '站队二分(不接受X就是不想干)' };
  }

  // 路由⑥b：认同等同 / 逼迫二选 × 施压或威胁。
  // 施压/威胁词是「伪」的放大器——「帮客户就是帮我们自己」这类
  // 商业互惠转述无压力词时不判（良性对照）。
  if ((equateZh || pickZh) && (pressure || threat)) {
    return { hit: true, score: 0.80, detail: '站队胁迫二分(认同等式×施压)' };
  }

  // 路由⑦：要么A要么B × 威胁后果（无显式污名词亦构成胁迫二选）。
  // 「要么按这个流程走，要么后面出了事别来找我」——既有 STIGMA 词表
  // 不收这类威胁结论形。事实/排期二元不判。
  if (dilemma && threat && !factual && !scheduled) {
    return { hit: true, score: 0.76, detail: '二选一×威胁后果(出了事别来找我)' };
  }

  // ─── [r289] 新路由⑨：要么A要么B×贬损标签（无威胁词形） ──────
  const derogZh = (R.DEROG_ZH || DEROG_ZH).test(text);
  const derogFrameZh = (R.DEROG_FRAME_ZH || DEROG_FRAME_ZH).test(text);
  const negEqFrame = (R.NEG_EQ_FRAME_ZH || NEG_EQ_FRAME_ZH).test(text);
  const negActSubj = (R.NEGACT_SUBJ_ZH || NEGACT_SUBJ_ZH).test(text);
  const notWithEn = (R.NOTWITH_EN || NOTWITH_EN).test(text);
  const eitherDerogEn = (R.EITHER_DEROG_EN || EITHER_DEROG_EN).test(text);

  // 路由⑨c（ZH 单独支）：不X(主语插入)你就是Y(品质标签)——带品质
  // 标签的否定等式本身就是情感胁迫，无需第二腿（与 S2 单独支同设计）。
  if (negActSubj) {
    return { hit: true, score: 0.80, detail: '站队二分(不X你就是没良心)' };
  }

  // 路由⑨e（EN 单独支）：if you're not with us, you're against us
  if (notWithEn) {
    return { hit: true, score: 0.80, detail: '站队二分(not with us 形)' };
  }

  // 路由⑨d（EN 单独支）：either you X or you're Y(贬损标签)
  if (eitherDerogEn) {
    return { hit: true, score: 0.78, detail: '二选一×贬损标签(dead weight 形)' };
  }

  // 路由⑨a（ZH 交叉支）：要么-frame × 定性等式 × 贬损标签。事实/排期
  // 二元不判（「要么签字要么就是违约」无贬损标签，双因子天然覆盖，
  // 这里再兜一层显式豁免）。
  if (derogZh && derogFrameZh && !factual && !scheduled) {
    return { hit: true, score: 0.78, detail: '二选一×贬损标签(要么A就是拖后腿)' };
  }

  // 路由⑨b（ZH 交叉支）：不是A就是B(贬损) frame × 贬损标签。
  if (derogZh && negEqFrame && !factual && !scheduled) {
    return { hit: true, score: 0.76, detail: '二选一×贬损标签(不是A就是老古董)' };
  }

  return { hit: false, score: 0, detail: '' };
}

module.exports = {
  checkFalseDilemma,
  __internals: () => ({
    DILEMMA_ZH, DILEMMA_EN, FORCE_ZH, FORCE_EN, STIGMA_ZH, STIGMA_EN,
    FACTUAL_ZH, FACTUAL_EN, SCHEDULE_ZH, SCHEDULE_EN, EXMID_ZH, EXMID_EN,
    ALIGN_EQUATE_ZH, ALIGN_NEGACT_ZH, ALIGN_FORCEPICK_ZH, ALIGN_BINARYONLY_ZH,
    ALIGN_EQUATE_EN, ALIGN_PRESSURE_ZH, ALIGN_PRESSURE_EN,
    ALIGN_THREAT_ZH, ALIGN_THREAT_EN,
    DEROG_ZH, DEROG_FRAME_ZH, NEG_EQ_FRAME_ZH, NEGACT_SUBJ_ZH,
    NOTWITH_EN, EITHER_DEROG_EN,
  }),
};
