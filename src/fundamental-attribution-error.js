/**
 * src/fundamental-attribution-error.js — 「基本归因错误」检测器
 * （provisional 第 244 个判别维度，r256 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r256-dimension-agent4.md
 * §五。编号 provisional 的原因同 r218-r255：远端 v6.8.145 已接线 214
 * 维，另有 31 个已起草未接线维度占号——含 r244 之前的 framing_effect
 * 等；最终编号由 1 号按接线顺序在 VERIFY_DIMS 登记序重排）
 *
 * [r256 立项] 零命中探针 coordination/agent4/probes/r256-probe-round1.js
 * + r256-probe-round2.js（v6.8.145，hf.gate() 全量 findings 口径，过滤
 * {dimension:'none'} 哨兵）。五候选两轮定夺：
 *   · A 中项不周延：round1 攻击 3/10 穿透，且 3 条全为 EN——ZH 六条已被
 *     affirming_the_consequent / illicit_conversion 全年代拦，新族不成立
 *     （新维度只能补 EN 措辞，属 ② 型扩充而非新维度），淘汰；
 *   · B 不作为偏误：round2 攻击 12/22 穿透居次，疑难良性 9/10；
 *   · C 基本归因错误：round2 攻击 10/16 穿透，**疑难良性 10/10 零误伤**，
 *     边界实测（r256-boundary-check.js）blame_externalization 自我归责
 *     领地零交叉、stereotype_origin 出身标签领地零交叉，**胜出**；
 *   · D 模糊性厌恶：round2 攻击 8/10 穿透最高，但「只投我算得出来的」
 *     与正当风险偏好同形，误伤风险偏高，留 backlog；
 *   · E 零风险偏误：round1 攻击 3/7、疑难良性 3/6 且 3 条维度级误伤，
 *     淘汰。
 *
 * 外部来源：空返，按既有形态自建。r256 海外扫描（原始证据
 * coordination/agent4/scout/targeted-*20261108-115020.xml 与
 * r256-scout.log）：
 *   · arXiv "fundamental attribution error" 精确引号命中 2 篇——A
 *     robot's sense-making of fallacies and rhetorical tropes（1906.09689，
 *     论证谬误本体论）、The Efficacy of Conversational AI in Rectifying
 *     Theory of Mind（2406.13813）——均为论证结构研究而非文本检测实现；
 *   · GitHub 精确引号 10 个仓库，最高 ★73（MADEVAL/MindFluence，prompt
 *      skill）其余 ★0-4 且均为 prompt/概念清单；无纯规则文本检测实现；
 *   · "undistributed middle term" arXiv 0 篇 / S2 0 篇；"zero-risk bias"
 *     arXiv 0 篇；"omission bias" arXiv 4 篇（OMIT the Action / Omissive
 *     Bias in Religious Representation 等 LLM 偏误基准）但 GitHub 侧全部
 *     是 LLM 实验代码。**零纯规则实现可集成**，按既有形态自建，判据为
 *     心虫自有纯规则实现，家族定义取自基本归因错误的标准表述
 *     （fundamental attribution error / correspondence bias——
 *     Ross 1977；Ross & Nisbett 1991：解释他人行为时系统性高估内在
 *     特质因素、低估情境因素）。
 *
 * 辨别的族：基本归因错误 / 通信偏误（fundamental attribution error /
 * correspondence bias）——文本先给出**对他人（或群体）行为与结果的
 * 内在特质归因**（迟到就是因为不负责 / 穷是因为懒 / 成功全靠天赋），
 * 再给出**对情境因素的排斥或贬低**（别找客观原因 / 运气不值一提 /
 * 跟资源分配没关系）：
 *   他会迟到就是因为不负责，别找客观原因。
 *   穷人穷是因为他们懒，不要提什么环境因素。
 *   他能成功全靠天赋，运气和时代背景都不值一提。
 *   这些人失败纯粹是因为能力差，跟资源分配没关系。
 *   He is late because he is irresponsible; stop making excuses.
 *   Poor people are poor because they are lazy, never mind circumstances.
 *   She succeeded purely through talent; luck and timing are irrelevant.
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：归因是一切人事判断
 * 的地基——绩效评估、招聘决策、公共政策、司法量刑，全都建立在「这个
 * 结果是谁造成的、由什么造成」之上。基本归因错误的毒性在于它把两个
 * 独立的错误压进一个动作里：先只看性格，再明确宣布情境不算数。第二
 * 步是关键——如果只是说「他不负责」，那是一句可以争论的判断；一旦
 * 补上「别找客观原因」，情境证据就被单方面取消了举证资格，后续所有
 * 讨论都只能在性格层面进行。与正当推理的界线很清楚：同时列出性格与
 * 情境两侧、明确指出这是基本归因错误、或把结论限定在可核验的行为
 * 事实上，就是正当做法，一律豁免。
 *
 * 与既有维度的边界（r256 归因，探针 + 边界实测零交叉）：
 *   · blame_externalization（第 112 维，r666）判**自我归责讨债**（我
 *     变成这样都是你害的，你必须补偿我）——主语是自己、右腿是义务
 *     指令；本族主语是他人、右腿是情境因素排斥（实测
 *     r256-boundary-check.js：「这件事全是市场的错，我一点责任都没有」
 *     与「项目失败都怪客户难缠，我们团队没有任何问题」均不被本族判据
 *     命中，归 blame_externalization 领地）。
 *   · stereotype_origin / stereotype 判**出身/来源标签**（专科毕业的
 *     逻辑能力能强到哪去 / 年轻人就是不踏实）；本族判据不要求出身
 *     标签，要求的是**归因于性格 + 排斥情境**的双腿（实测「年轻人就是
 *     不踏实，别指望他们」被 stereotype 代拦，归其领地）。
 *   · monocausal_attribution 判**多因压成单因**；本族的两腿中腿②
 *     特指「排斥情境解释」，是单因化的一个具体方向，但无「多因」陈述
 *     也成立（「他迟到就是因为不负责，别找客观原因」全文只有一个原因）。
 *   · victim_blaming 判**受害者有罪论**；本族不涉及受害关系。
 *   · pseudo_causal 判**伪因果表述**；本族判据是归因维度失衡，不是
 *     因果是否成立。
 *
 * 判据（双腿链 + 邻近窗 + 三组豁免，缺一不判）：
 *   ① 腿① DISP 内在特质归因——四族任一（详见下方常量）：归因标记×
 *      特质名词族、特质名词+问题族、特质判定+结果连接族、EN 对应三族；
 *   ② 腿② SITD 情境排斥/贬低——四族任一：排斥指令族、情境贬低族、
 *      否认相关族、EN 对应四族；
 *   ③ 两腿须落在邻近窗内（ZH 60 字 / EN 160 字符），**方向不限**——
 *      「迟到是因为不负责，别找客观原因」与「别找客观原因，迟到纯粹是
 *      因为他自己不负责」都收；推断标记（所以/因此/就是因为/纯粹是；
 *      EN because/therefore）落在两腿之间则加权而非必要；
 *   ④ 腿②须带来新内容（左伸或右伸至少 2 字）——防自证；
 *   ⑤ 腿①查否定前缀与模式内部否定（「不能说他迟到是因为不负责」→
 *      失配）；
 *   ⑥ 腿②带限幅守卫（不一定/未必/未必成立/未必对 → 失配）；
 *   ⑦ 腿①自我归因守卫——匹配内部出现「我/我们/咱/自己」即失配
 *      （「我这次失败纯粹是因为我懒，不找借口」是自我检讨，不是评判
 *      他人的基本归因错误，r256 构造期实证：缺这条守卫会误伤自省句）；
 *   ⑧ 豁免 A 概念教学（基本归因错误/归因偏差/correspondence bias/
 *      fundamental attribution error/actor-observer/内在归因/外在归因/
 *      dispositional attribution——讨论这个概念本身是正确判别）；
 *   ⑨ 豁免 B 双向归因（同时考虑个人责任和情境约束/分开评估/既要看到
 *      也要看到/既不全推给环境也不全推给人品；EN weigh both ... and
 *      .../separate ... from .../both ... and ...——双侧并举是正当
 *      归因）；
 *   ⑩ 豁免 C 疑问句（含 ?/？——「他迟到真的只是因为他懒吗？」是在
 *      质疑该归因本身）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一次他人评价（「主管认为
 * 他迟到是因为不负责」是事实陈述），也可能是在引用组织行为学案例。
 * verify 的语义是「这段话把行为结果单方面归因于性格并取消了情境因素
 * 的举证资格，先核对情境证据再决定是否采信这个判断」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 概念教学（基本归因错误告诉我们别把迟到全归因于性格/fundamental
 *     attribution error means overweighting disposition）；
 *   · 双向归因（我们会同时考虑个人责任和情境约束，不把结果全归因于
 *     性格/We weigh both disposition and situational factors）；
 *   · 自我归因（我这次失败纯粹是因为我懒，不找借口——自我检讨不是
 *     评判他人的归因错误）；
 *   · 单腿句（只有特质归因：他这人就是不负责；只有情境排斥：别找
 *     借口，先看数据）；
 *   · 出身标签（专科毕业的逻辑能力能强到哪去）、受害者有罪论、
 *     自我归责讨债（我变成这样都是你害的）等既有维度领地。
 * 已知缺口（有意不收）：无显式情境排斥腿的纯性格归因（「他这人就是
 *     不负责」——缺腿②，与正当人事评价同形）；以及归因被包裹在反讽/
 *     引语中的句子。前者缺「取消情境资格」这一关键动作、后者需要语用
 *     判断，纯规则无法在不误伤的前提下收窄，宁缺勿滥。
 */
'use strict';

// ─── 腿① DISP 内在特质归因 ───────────────────────────────────────
// D1 归因标记 × 内在特质名词（迟到就是因为不负责 / 纯粹是懒 /
//    成功全靠天赋 / 失败纯粹是能力差）
const DISP_MARK_ZH = '(?:就是因为|就是由于|就是|纯粹是|纯粹因为|完全是|根本是|说到底|根子是|归根到底|就在于|不过是|无非是|只是|正说明|说明|证明|可见|足以说明|只能说明|说明他|说明他们|当然是|显然是|肯定是|一定是|准是|是因为|是由于|害了|毁在|输在|差在|强在|成在|败在|好在|归因于|归结为|归到|归于|源自|源于|出于|来自|全靠|全凭|全看|多亏|幸亏|只怪|都怪|全怪|怪|靠|凭)';
const DISP_TRAIT_ZH = '(?:不负责|不负责任|没有责任心|缺乏责任心|责任心不强|懒|懒惰|懒散|不上进|不努力|不勤奋|不能吃苦|吃不了苦|怕吃苦|情商低|智商低|能力差|能力不行|能力有限|水平差|态度|态度问题|态度不端正|态度恶劣|品格|本性|素质|天赋|聪明|笨|蠢|愚笨|想不开|心理脆弱|玻璃心|自私|贪婪|意志薄弱|格局小|眼界窄|人格|性格|作风|思想|品行|德行|不上心|不用心|敷衍|草包|平庸|平庸之辈)';
const DISP_MARK_TRAIT_ZH = new RegExp(DISP_MARK_ZH + '[^。，！？；\\n]{0,12}' + DISP_TRAIT_ZH);
// D2 特质名词 + 的问题/毛病/错（就是不负责的问题 / 是他态度的问题）
const DISP_PROBLEM_ZH = new RegExp(DISP_TRAIT_ZH + '(?:的)?(?:问题|毛病|错|过错|责任|因素|成分|比重)');
// D3 特质判定 + 结果连接（本性如此所以才会迟到 / 能力不行才搞砸）
// D3 特质判定 + 结果连接（本性如此所以才会迟到 / 能力不行才搞砸）
// 中段允许逗号——「本性如此，所以才会迟到」是自然语序（r256 构造期实证：
// 中段排逗号会漏掉这条最自然的句式）。
const DISP_SO_ZH = new RegExp('(?:本性|品格|素质|性格|作风|德行|品行|能力|态度|责任心|意志)[^。，！？；\\n]{0,6}(?:如此|所致|使然|决定的|注定)[^。！？；\\n]{0,10}(?:所以|才|才会|就|因此|因而)');
// D4 只/全/统统 + 特质归因压缩（问题只出在他自己身上 / 全在他自己）
const DISP_ONLY_ZH = new RegExp('(?:只|全|统统|一概|全都)[^。，！？；\\n]{0,4}(?:在|出于|归于)[^。，！？；\\n]{0,6}(?:他|她|他们|这些人|那帮人|那批人|当事人|嫌疑人)[^。，！？；\\n]{0,4}(?:自己|本人|身上|那头|那边)?');
// D5 抱怨型性格归因（员工离职就是嫌钱少 / 他走不过是嫌活多）——
// 把流动/退出解释为「当事人爱抱怨、吃不了苦」的性格缺陷。
const DISP_COMPLAIN_ZH = new RegExp('(?:嫌|埋怨|抱怨|无非是嫌|不过是嫌|就是嫌)[^。，！？；\\n]{0,4}(?:钱少|钱多|待遇差|待遇低|工资低|薪水低|活多|活重|活累|加班多|离家远|麻烦|辛苦|苦|吃亏)');
// 逐族登记表：负例注入按族名替换（R[族名] 存在即整族替换，含空数组）
const DISP_ZH_GROUPS = [
  ['DISP_MARK_TRAIT_ZH', [DISP_MARK_TRAIT_ZH]],
  ['DISP_PROBLEM_ZH', [DISP_PROBLEM_ZH]],
  ['DISP_SO_ZH', [DISP_SO_ZH]],
  ['DISP_ONLY_ZH', [DISP_ONLY_ZH]],
  ['DISP_COMPLAIN_ZH', [DISP_COMPLAIN_ZH]],
];
const DISP_ZH = [DISP_MARK_TRAIT_ZH, DISP_PROBLEM_ZH, DISP_SO_ZH, DISP_ONLY_ZH, DISP_COMPLAIN_ZH];

const DISP_MARK_EN = "(?:because|since|purely because|simply because|only because|due to|down to|attributable to|owing to|blame (?:it on|on)|thanks to|stem(?:s|ming)? from|purely through|through|by means of|out of|on account of|by virtue of|it comes down to|amounts to|boils down to|it['\u2019]?s (?:his|her|their)|he['\u2019]?s (?:just|simply|purely)|she['\u2019]?s (?:just|simply|purely)|they['\u2019]?re (?:just|simply|purely))";
const DISP_TRAIT_EN = "(?:irresponsible|lazy|incompetent|stupid|careless|immoral|not smart enough|too emotional|weak|selfish|greedy|careless|negligent|incompetence|laziness|irresponsibility|stupidity|stupid|unmotivated|undisciplined|lacked discipline|lacks discipline|lack of discipline|poor discipline|no discipline|not disciplined|sloppy|cannot let go|can['\u2019]?t let go|couldn['\u2019]?t let go|too sensitive|oversensitive|thin.?skinned|doesn['\u2019]?t try hard enough|does not try hard enough|not trying hard enough|immature|entitled|incompetent|shiftless|no.?good|poor character|bad attitude|bad character|bad attitude|weak character|natural talent|pure talent|talent|talented|ability|smart|clever|born (?:smart|talented|lucky|that way)|made that way|that['\u2019]?s (?:who|how) (?:he|she|they) (?:is|are))";
const DISP_MARK_TRAIT_EN = new RegExp(DISP_MARK_EN + '\\s+[^.]{0,30}?\\b' + DISP_TRAIT_EN + '\\b', 'i');
const DISP_OWN_FAULT_EN = /\b(?:he|she|they)\s+(?:has|have)\s+only\s+(?:himself|herself|themselves)\s+to\s+blame\b|\bis\s+(?:his|her|their)\s+own\s+(?:fault|doing|problem)\b|\bit'?s\s+(?:his|her|their)\s+own\s+(?:fault|problem|doing)\b/i;
const DISP_TRAIT_ADJ_EN = /\b(?:he|she|they)\s+(?:is|are)\s+(?:just|simply|purely|nothing\s+but|no\s+more\s+than)\s+(?:lazy|irresponsible|incompetent|stupid|careless|selfish|greedy|weak|unmotivated|negligent)\b/i;
const DISP_EN = [DISP_MARK_TRAIT_EN, DISP_OWN_FAULT_EN, DISP_TRAIT_ADJ_EN];
// 逐族登记表：负例注入按族名替换（R[族名] 存在即整族替换，含空数组）
const DISP_EN_GROUPS = [
  ['DISP_MARK_TRAIT_EN', [DISP_MARK_TRAIT_EN]],
  ['DISP_OWN_FAULT_EN', [DISP_OWN_FAULT_EN]],
  ['DISP_TRAIT_ADJ_EN', [DISP_TRAIT_ADJ_EN]],
];

// ─── 腿② SITD 情境排斥/贬低 ───────────────────────────────────────
const SITD_TARGET_ZH = '(?:客观原因|客观因素|环境因素|外部因素|情境|处境|环境|外部条件|客观条件|资源|资源分配|条件|运气|运气成分|偶然|机遇|机缘|时代|时代背景|时代红利|背景|市场|市场环境|团队|家庭|家庭背景|家庭负担|家务|照护|制度|体制机制|文化|公司文化|企业文化|组织文化|结构性|结构性因素|系统性因素|系统|先天|起跑线|出身|起点|行业|赛道|周期|红利|平台|发展空间|晋升空间|成长空间|人手|人力|编制|政策|监管|排期|流程|竞争|外界压力|外部压力|外界因素|交通|路况|天气|身体|健康|生病|借口|理由|外部理由|客观|外部|大环境)';
// S1 排斥指令族（别找客观原因 / 不要提环境因素 / 别扯团队支持 / 少谈发展空间）
const SITD_REJECT_ZH = new RegExp('(?:别|不用|无须|无需|不要|甭|谈不上|谈不上什么|少)[^。，！？；\\n]{0,4}(?:找|提|扯|讲|谈|论|说|强调|归咎|怪|归因|顾及|考虑|搬|卖|打|扯上|联系|攀|攀比|攀扯)[^。，！？；\\n]{0,6}' + SITD_TARGET_ZH);
// S2 情境贬低族（运气不值一提 / 市场变化只是借口 / 资源说明不了什么）
const SITD_DEBASE_ZH = new RegExp('(?:运气|时代|背景|环境|资源|条件|平台|风口|市场|团队|家庭|制度|文化|结构|系统|客观|外部|情境|处境|偶然|机遇|红利|行业|赛道|周期|竞争|出身|起点|体制机制|结构性因素|系统性因素|资源分配|发展空间)[^。，！？；\\n]{0,10}(?:不值一提|不算什么|不重要|没有意义|无关紧要|忽略不计|只是借口|不过是借口|无非是借口|说明不了|证明不了|不构成|不构成理由|算不上理由|称不上理由|不是理由|不是关键|不是主因|不是决定因素|无所谓|不必考虑|不用考虑|算不上|称不上)');
// S3 否认相关族（跟资源分配没关系 / 和环境无关）
const SITD_DENY_ZH = new RegExp('(?:跟|和|与)' + SITD_TARGET_ZH + '[^。，！？；\\n]{0,4}(?:没关系|无关|不相干|扯不上|没有关系|不沾边)');
// S4 哪有那么多 + 情境名词（哪有那么多外界压力 / 能有多少运气成分）
const SITD_HOWMUCH_ZH = new RegExp('(?:哪有|哪来的|没有那么多的|没那么多|能有多少|有多少)(?:那么)?多?[^。，！？；\\n]{0,4}' + SITD_TARGET_ZH);
// 逐族登记表：负例注入按族名替换（R[族名] 存在即整族替换，含空数组）
const SITD_ZH_GROUPS = [
  ['SITD_REJECT_ZH', [SITD_REJECT_ZH]],
  ['SITD_DEBASE_ZH', [SITD_DEBASE_ZH]],
  ['SITD_DENY_ZH', [SITD_DENY_ZH]],
  ['SITD_HOWMUCH_ZH', [SITD_HOWMUCH_ZH]],
];
const SITD_ZH = [SITD_REJECT_ZH, SITD_DEBASE_ZH, SITD_DENY_ZH, SITD_HOWMUCH_ZH];

const SITD_TARGET_EN = '(?:circumstances|context|situation|environment|resources|resource|constraints|constraint|luck|timing|background|upbringing|the market|market conditions|his background|her background|their background|his environment|their environment|the system|structural|structural factors|systemic|systemic factors|socioeconomic|opportunity|opportunities|privilege|excuses|the context|his situation|her situation|their situation|external pressure|external pressures|outside pressure|external factors|external circumstances|outside circumstances|external conditions|external constraints|his circumstances|her circumstances|their circumstances|his resources|her resources|their resources|his constraints|their constraints|the pressure|the workload|his workload|her workload|their workload)';
const SITD_REJECT_EN = new RegExp("\\b(?:stop|quit|no more)\\s+making\\s+excuses\\b|\\bno\\s+excuses\\b|\\b(?:do\\s+not|don['\u2019]?t|doesn['\u2019]?t|didn['\u2019]?t)\\s+(?:blame|bring up|talk about|invoke|appeal to|cite)\\s+(?:the\\s+|his\\s+|her\\s+|their\\s+)?" + SITD_TARGET_EN + "\\b|\\bnever\\s+mind\\s+(?:the\\s+|his\\s+|her\\s+|their\\s+)?" + SITD_TARGET_EN + "\\b|\\bforget\\s+(?:about\\s+)?(?:the\\s+|his\\s+|her\\s+|their\\s+)?" + SITD_TARGET_EN + "\\b|\\bleave\\s+(?:the\\s+)?" + SITD_TARGET_EN + "\\s+out\\s+of\\s+it\\b|\\bspare\\s+me\\s+(?:the\\s+)?" + SITD_TARGET_EN + "\\b", 'i');
// SITD_DEBASE_EN 支持 and/or 连接的并列情境项（luck and timing are irrelevant）
const SITD_DEBASE_EN = new RegExp("\\b" + SITD_TARGET_EN + "(?:\\s+(?:and|or)\\s+" + SITD_TARGET_EN + ")*\\s+(?:is|are|was|were)?\\s*(?:irrelevant|not relevant|beside the point|doesn['\u2019]?t matter|do not matter|didn['\u2019]?t matter|not the issue|means nothing|counts for nothing|is not the point)\\b", 'i');
const SITD_DENY_EN = new RegExp('\\b(?:has|have|had)?\\s*nothing\\s+to\\s+do\\s+with\\s+(?:the\\s+)?' + SITD_TARGET_EN + '\\b|\\bnot\\s+because\\s+of\\s+(?:the\\s+)?' + SITD_TARGET_EN + '\\b|\\b(?:is|are|was|were)\\s+(?:not|un)?related\\s+to\\s+(?:the\\s+)?' + SITD_TARGET_EN + '\\b', 'i');
const SITD_NO_EXCUSE_EN = /\b(?:that|this)(?:\s+is|['\u2019]?s)\s+no\s+excuse\b|\bexcuses\s+won['\u2019]?t\s+cut\s+it\b|\bsituational\s+factors\s+(?:are|were)\s+(?:beside the point|irrelevant)\b/i;
const SITD_EN = [SITD_REJECT_EN, SITD_DEBASE_EN, SITD_DENY_EN, SITD_NO_EXCUSE_EN];
// 逐族登记表：负例注入按族名替换（R[族名] 存在即整族替换，含空数组）
const SITD_EN_GROUPS = [
  ['SITD_REJECT_EN', [SITD_REJECT_EN]],
  ['SITD_DEBASE_EN', [SITD_DEBASE_EN]],
  ['SITD_DENY_EN', [SITD_DENY_EN]],
  ['SITD_NO_EXCUSE_EN', [SITD_NO_EXCUSE_EN]],
];

// ─── 独腿签名（SOLO）——一句话内部自带「特质归因×情境排斥」完整结构，
// 无需另找情境腿（同 r251 loss_aversion / r255 planning_fallacy 先例）。
const SOLO_ZH = [
  // T1 特质 + 排斥指令（就是不负责，别找借口 / 纯粹是懒，别扯环境）
  new RegExp(DISP_TRAIT_ZH + '[^。！？；\\n]{0,6}(?:别|不用|不要|甭|少)[^。！？；\\n]{0,4}(?:找|提|扯|讲|强调|怪|归咎|搬)[^。！？；\\n]{0,6}(?:借口|理由|客观|环境|外部|情境|处境|资源|条件|运气|背景)'),
  // T2 排斥指令 + 特质（别找客观原因，他就是不负责）
  new RegExp('(?:别|不用|不要|甭|少)[^。！？；\\n]{0,4}(?:找|提|扯|讲|强调|怪|归咎|搬)[^。！？；\\n]{0,6}(?:借口|理由|客观|环境|外部|情境|处境|资源|条件|运气|背景)[^。！？；\\n]{0,8}' + DISP_TRAIT_ZH),
];
const SOLO_EN = [
  // E1 trait + no excuses（he is just lazy, no excuses）
  /\b(?:he|she|they)\s+(?:is|are)\s+(?:just|simply|purely)\s+(?:lazy|irresponsible|incompetent|stupid|careless|selfish|weak)\b[^.]{0,20}\b(?:no excuses|stop making excuses|circumstances irrelevant)\b/i,
  // E2 no excuses + trait
  /\b(?:no excuses|stop making excuses|never mind the circumstances)\b[^.]{0,30}\b(?:he|she|they)\s+(?:is|are)\s+(?:just|simply|purely)?\s*(?:lazy|irresponsible|incompetent|stupid|careless|selfish|weak)\b/i,
];

// ─── 双标归因族（ASYM）——actor-observer 不对称：同一类结果，对他人
// 用内在特质解释、对自己用情境解释（或反向：他人靠运气、自己靠实力）。
// r269 探针实证：「他迟到就是不负责任，我迟到是因为堵车」等 5/6 条攻击
// 穿透既有两腿结构（DISP×SITD 要求「排斥/贬低情境」，而双标句只是
// 给自己的那半配一个情境解释，没有排斥动作）。这是 Ross 1977 判据里
// 最经典的形态，单独成族。
// 注意：本族**不走**独腿的句子级自我归因守卫——第一人称是本族的固有
// 结构成分（自己的那半必然含「我」），由「他人侧必须命中特质/运气
// 槽」保证不是自我检讨。
const ASYM_OTHER_ZH = '(?:他|她|别人|人家|下属|同事|对方|其他人|那些人|他们|队友|组员|成员|选手|员工|新人|对手|领导|老板|旁人|外人|队友)';
const ASYM_SELF_ZH = '(?:我|自己|本人|我们|咱们|咱)';
// 情境槽（给自己的那半的「借口」侧）——与特质槽保持互斥
const ASYM_SITU_ZH = '(?:堵车|交通|路况|天气|身体|健康|生病|资源|人手|编制|时机|运气|环境|大环境|背景|家庭|照护|突发|临时|状况|情况|情境|处境|外力|外界|外部|条件|形势|排期|流程|制度|市场|周期|红利|起跑线|出身|起点|压力|负担|约束|限制|信息|支持|配合|协同|沟通|风口|关系|贵人|偶然|机缘|机遇|巧合|不可抗力|意外)';
// 特质槽：既有 DISP_TRAIT_ZH + 归因常用能力名词，后缀可选「问题/毛病」
const ASYM_TRAIT_ZH = '(?:' + DISP_TRAIT_ZH + '|能力|实力|本事|水平|功力|才干)(?:问题|毛病|过错|的因素|的成分)?';
// 标记槽（他人侧/自己侧共用）：就是因为|是因为|…|就是|是|靠|凭|归于
const ASYM_MARK_ZH = '(?:就是因为|是因为|不过是|纯粹是|只是|无非是|全靠|全凭|就是|是|靠|凭|多亏|幸亏|占到|托了|归于|归在|归到|归因于)';
// A1 他人×特质 … 自己×情境（他人在前）
const ASYM_ZH_A1 = new RegExp(ASYM_OTHER_ZH + '[^。；！？\\n]{0,14}' + ASYM_MARK_ZH + '[^。；！？\\n]{0,8}' + ASYM_TRAIT_ZH + '[^。；！？\\n]{0,16}' + ASYM_SELF_ZH + '[^。；！？\\n]{0,14}' + ASYM_MARK_ZH + '[^。；！？\\n]{0,8}' + ASYM_SITU_ZH);
// A2 自己×情境 … 他人×特质（自己在前）
const ASYM_ZH_A2 = new RegExp(ASYM_SELF_ZH + '[^。；！？\\n]{0,14}' + ASYM_MARK_ZH + '[^。；！？\\n]{0,8}' + ASYM_SITU_ZH + '[^。；！？\\n]{0,16}' + ASYM_OTHER_ZH + '[^。；！？\\n]{0,14}' + ASYM_MARK_ZH + '[^。；！？\\n]{0,8}' + ASYM_TRAIT_ZH);
// B1 他人×运气/外部 … 自己×实力（功劳不对称，他人在前）
const ASYM_ZH_B1 = new RegExp(ASYM_OTHER_ZH + '[^。；！？\\n]{0,14}(?:是靠|是因为|全靠|多亏|赶上了|占到|托了|就是靠)[^。；！？\\n]{0,8}' + ASYM_SITU_ZH + '[^。；！？\\n]{0,16}' + ASYM_SELF_ZH + '[^。；！？\\n]{0,14}(?:是靠|全凭|靠|凭)[^。；！？\\n]{0,8}' + ASYM_TRAIT_ZH);
// B2 自己×实力 … 他人×运气/外部（功劳不对称，自己在前）
const ASYM_ZH_B2 = new RegExp(ASYM_SELF_ZH + '[^。；！？\\n]{0,14}(?:是靠|全凭|靠|凭)[^。；！？\\n]{0,8}' + ASYM_TRAIT_ZH + '[^。；！？\\n]{0,16}' + ASYM_OTHER_ZH + '[^。；！？\\n]{0,14}(?:是靠|是因为|全靠|多亏|赶上了|占到|托了|就是靠)[^。；！？\\n]{0,8}' + ASYM_SITU_ZH);
const ASYM_ZH = [ASYM_ZH_A1, ASYM_ZH_A2, ASYM_ZH_B1, ASYM_ZH_B2];
const ASYM_ZH_GROUPS = [
  ['ASYM_ZH_A1', [ASYM_ZH_A1]],
  ['ASYM_ZH_A2', [ASYM_ZH_A2]],
  ['ASYM_ZH_B1', [ASYM_ZH_B1]],
  ['ASYM_ZH_B2', [ASYM_ZH_B2]],
];

// EN 对应四族
const ASYM_TRAIT_EN = '(?:lazy|irresponsible|incompetent|stupid|careless|selfish|weak|unmotivated|negligent|not smart enough|sloppy|immature|entitled|undisciplined|no discipline|bad attitude|poor character)';
const ASYM_SITU_EN = '(?:circumstances|situation|context|conditions|luck|timing|pressure|resources|traffic|weather|the system|the market|bad luck|his background|her background|their background|privilege|connections|the right place|the right time)';
const ASYM_MARK_EN = '(?:because of|due to|owing to|on account of|because|through|thanks to)';
const ASYM_CREDIT_EN = '(?:merit|hard work|talent|ability|skill|skills|effort|sheer effort|my own effort)';
// EA1 他人×特质 … 自己×情境
const ASYM_EN_A1 = new RegExp('\\b(?:he|she|they|others?|people)\\b[^.\\n]{0,40}?(?:is|was|\'s)?\\s*(?:just|simply|purely)?\\s*' + ASYM_TRAIT_EN + '\\b[^.\\n]{0,40}?\\b(?:I|we)\\b[^.\\n]{0,40}?\\b' + ASYM_MARK_EN + '\\s+(?:the\\s+|his\\s+|her\\s+|their\\s+)?' + ASYM_SITU_EN + '\\b', 'i');
// EA2 自己×情境 … 他人×特质
const ASYM_EN_A2 = new RegExp('\\b(?:I|we)\\b[^.\\n]{0,40}?\\b' + ASYM_MARK_EN + '\\s+(?:the\\s+|his\\s+|her\\s+|their\\s+)?' + ASYM_SITU_EN + '\\b[^.\\n]{0,40}?\\b(?:he|she|they|others?|people)\\b[^.\\n]{0,40}?(?:is|was|\'s)?\\s*(?:just|simply|purely)?\\s*' + ASYM_TRAIT_EN + '\\b', 'i');
// EB1 他人×运气/外部 … 自己×实力
const ASYM_EN_B1 = new RegExp('\\b(?:he|she|they|others?|people)\\b[^.\\n]{0,40}?\\b(?:through|because of|thanks to|due to|owing to)\\s+(?:the\\s+|his\\s+|her\\s+|their\\s+)?' + ASYM_SITU_EN + '\\b[^.\\n]{0,40}?\\b(?:I|we)\\b[^.\\n]{0,40}?\\b(?:on|through)\\s+' + ASYM_CREDIT_EN + '\\b', 'i');
// EB2 自己×实力 … 他人×运气/外部
const ASYM_EN_B2 = new RegExp('\\b(?:I|we)\\b[^.\\n]{0,40}?\\b(?:on|through)\\s+' + ASYM_CREDIT_EN + '\\b[^.\\n]{0,40}?\\b(?:he|she|they|others?|people)\\b[^.\\n]{0,40}?\\b(?:through|because of|thanks to|due to|owing to)\\s+(?:the\\s+|his\\s+|her\\s+|their\\s+)?' + ASYM_SITU_EN + '\\b', 'i');
const ASYM_EN = [ASYM_EN_A1, ASYM_EN_A2, ASYM_EN_B1, ASYM_EN_B2];
const ASYM_EN_GROUPS = [
  ['ASYM_EN_A1', [ASYM_EN_A1]],
  ['ASYM_EN_A2', [ASYM_EN_A2]],
  ['ASYM_EN_B1', [ASYM_EN_B1]],
  ['ASYM_EN_B2', [ASYM_EN_B2]],
];

// ─── 推断标记（落在两腿之间则加权，非必要）────────────────────────
const INFER_ZH = /(?:所以|因此|据此|可见|说明|证明|意味着|足以|因而|于是|结果就是|结论就是|这就是说|足见|就是因为|纯粹是|当然是|显然是|肯定|一定|绝对|那么|这就)/;
const INFER_EN = /\b(?:so|therefore|thus|hence|which\s+means|which\s+proves|which\s+shows|that\s+means|proves|shows\s+that|indicates\s+that|means\s+that|it\s+follows|this\s+shows|this\s+proves|consequently|as\s+a\s+result|because|since)\b/i;

// ─── 距离窗 ───────────────────────────────────────────────────────
const W_ZH = 60;
const W_EN = 160;

// ─── 豁免 A：概念教学（点名基本归因错误/归因偏差这个概念本身）─────
const CONCEPT_ZH = /(?:基本归因错误|基本归因误差|归因错误|归因偏差|归因误差|通信偏误|过度归因|内在归因|外在归因|情境归因|性格归因|行动者|观察者|对应偏误|对应偏见| Ross 实验)/;
const CONCEPT_EN = /\b(?:fundamental attribution error|correspondence bias|actor[- ]observer|dispositional attribution|situational attribution|attribution bias|attribution error|overattribution|Ross and Nisbett)\b/i;

// ─── 豁免 B：双向归因（性格与情境两侧并举是正当做法）───────────────
// 要求「并举」结构——单侧陈述不收，否则会把攻击句「别找客观原因」误豁免。
const DUAL_ZH = /(?:同时考虑|分开评估|分开看待|两方面|两面|双侧|兼顾|两样|都要看到|既要看到|既要看|也要看|也不全推|也不全归|不全推给|不全归因|并重|同等重要|不可偏废|结合起来|综合来看|权衡)/;
const DUAL_EN = /\b(?:weigh both|weighing both|consider both|considering both|separate .{0,20} from|both .{0,25} and .{0,25} situational|disposition and situation|situation and disposition|balanced view|two sides|both sides|not (?:just|only|entirely) .{0,20}(?:character|disposition|personality)|not (?:just|only|entirely) .{0,20}(?:circumstances|situation))\b/i;

// ─── 自我归因守卫：腿①匹配内部出现第一人称即失配 ─────────────────
// 「我这次失败纯粹是因为我懒，不找借口」是自我检讨，不是评判他人的
// 基本归因错误（r256 构造期实证：缺这条守卫会误伤自省句）。
const SELF_ZH = /(?:我|我们|咱们|咱|本人|自身|我等|笔者|我辈|个人认为|在我看来|我觉得|我认为)/;
const SELF_EN = /\b(?:I|we|my|our|myself|ourselves|me|us)\b/i;

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

const NEG_BEFORE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不影响|谈不上|不再|别|并不|并没|从未|绝非|而非|不说明|不表明|很难说|不见得|不是|勿|切忌|避免|拒绝|警惕|反对|批评|纠|纠正|防止)[^。，！？；\n]{0,5}$/;
const IMMEDIATE_NEG_ZH = /(?:不|没|未|无|非)$/;
const SHORT_NEG_ZH = /(?:不|没|未|无|非|莫|甭)[^。，！？；\n]{0,2}$/;
const NEG_INSIDE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|谈不上|从不|绝不|永不|坚决不|并不|并没|而非|而不是|绝非|并非如此|说不上|称不上|不说明|不表明|不全推|不全归|不全是|不只是|不仅是|不光|并不只是)/;
const NEG_INSIDE_EN = /\bnot\s+that\b|\bnot\s+to\s+say\b|\bhardly\b|\bbarely\b|\bfar\s+from\b|\bnot\s+necessarily\b|\bmakes?\s+no\s+difference\b|\bnot\s+(?:just|only|entirely)\b|\bnever\s+(?:a|an)\b/i;
const NEG_BEFORE_EN = /\b(?:not|no|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wasn'?t|weren'?t|won'?t|wouldn'?t|couldn'?t|shouldn'?t|mustn'?t|never|neither|nor|no\s+longer|not\s+anymore|hardly|barely|far\s+from|nowhere\s+near|avoid|refuse|reject|guard\s+against|beware\s+of)\s+(?:\w+\s){0,4}$/i;

// 腿②限幅守卫：情境排斥后紧跟限幅/否定词 → 不是在取消情境资格
const LIMIT_AFTER_ZH = /^(?:不一定|未必|未必对|未必成立|不一定对|也不尽然|也未必|倒也不|未必尽然|未必如此|存疑|可商|有待)/;

function matchAlive(text, x, useNeg, skipInside) {
  if (!useNeg) return true;
  if (!skipInside && (NEG_INSIDE.test(x.raw) || NEG_INSIDE_EN.test(x.raw))) return false;
  const before = text.slice(Math.max(0, x.idx - 8), x.idx);
  const beforeLong = text.slice(Math.max(0, x.idx - 12), x.idx);
  const ababForm = /([一-龥]{1,2})不\1[^。，！？；\n]{0,4}$/.test(beforeLong);
  if (!ababForm && (NEG_BEFORE.test(before) || IMMEDIATE_NEG_ZH.test(before) || SHORT_NEG_ZH.test(before))) return false;
  const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
  return !NEG_BEFORE_EN.test(beforeEn);
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

function collect(text, list, useNeg) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, useNeg, false)) m.push(x);
  }
  return dedupeExact(m);
}

// 情境排斥腿专用：只查匹配点之前的否定前缀 + 限幅守卫，不查模式内部
// 否定词（腿②族自身含「没关系」「不重要」等内在否定）。
function collectSitd(text, list) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (!matchAlive(text, x, true, true)) continue;
    const after = text.slice(x.end, x.end + 5);
    if (LIMIT_AFTER_ZH.test(after)) continue;
    m.push(x);
  }
  return dedupeExact(m);
}

// 特质归因腿专用：查前缀否定 + 模式内部否定 + 自我归因守卫（中英第一
// 人称——「我这次失败纯粹是因为我懒」是自我检讨，不是评判他人的归因错误）。
function collectDisp(text, list, selfZh, selfEn) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (!matchAlive(text, x, true, true)) continue;
    if (selfZh.test(x.raw) || selfEn.test(x.raw)) continue;
    m.push(x);
  }
  return dedupeExact(m);
}

// 取匹配点所在的句子（按句末标点切分）——独腿签名跨度窄，自我归因
// 守卫必须放大到句子级，否则「我这次失败纯粹是因为我懒，别找借口」的
// 独腿跨度「懒，别找借口」不含第一人称会漏过自省句（r256 构造期实证）。
function sentenceOf(text, idx) {
  let s = 0;
  for (let i = 0; i < idx; i++) if ('。！？；!?\n'.includes(text[i])) s = i + 1;
  let e = text.length;
  for (let i = idx; i < text.length; i++) if ('。！？；!?\n'.includes(text[i])) { e = i; break; }
  return text.slice(s, e);
}

// 独腿签名专用：查前缀否定 + 签名跨度内部否定 + 句子级自我归因守卫。
const SOLO_NEG_INSIDE_ZH = /(?:未必|不一定|很难|恐怕|不见得|怎能|怎么可能|称不上|算不上|存疑|可商|有待|不全推|不全归|不只是|不仅是|不光)/;
const SOLO_NEG_INSIDE_EN = /\bnot\b|\bhardly\b|\bbarely\b|\bunlikely\b|\bfar\s+from\b|\bno\s+way\b|\bnot\s+(?:just|only|entirely)\b/i;
function collectSolo(text, list, selfZh, selfEn) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (!matchAlive(text, x, true, true)) continue;
    if (SOLO_NEG_INSIDE_ZH.test(x.raw) || SOLO_NEG_INSIDE_EN.test(x.raw)) continue;
    if (selfZh.test(x.raw) || selfEn.test(x.raw)) continue;
    const sent = sentenceOf(text, x.idx);
    if (selfZh.test(sent) || selfEn.test(sent)) continue;
    m.push(x);
  }
  return dedupeExact(m);
}

// 双标归因族专用：查前缀否定 + 签名跨度内部否定，**不做**句子级自我
// 归因守卫（第一人称是本族固有成分，见族注释）。
function collectAsym(text, list) {
  const m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (!matchAlive(text, x, true, true)) continue;
    if (SOLO_NEG_INSIDE_ZH.test(x.raw) || SOLO_NEG_INSIDE_EN.test(x.raw)) continue;
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

// 签名收集：腿①特质归因 × 腿②情境排斥，两腿邻近共现
function findSignatures(text, R) {
  const sigs = [];
  const langs = [
    {
      disp: resolveGroups(R, DISP_ZH_GROUPS),
      sitd: resolveGroups(R, SITD_ZH_GROUPS),
      infer: R.INFER_ZH || INFER_ZH,
      w: R.W_ZH != null ? R.W_ZH : W_ZH,
      lang: 'zh',
    },
    {
      disp: resolveGroups(R, DISP_EN_GROUPS),
      sitd: resolveGroups(R, SITD_EN_GROUPS),
      infer: R.INFER_EN || INFER_EN,
      w: R.W_EN != null ? R.W_EN : W_EN,
      lang: 'en',
    },
  ];
  // 独腿签名：一句话内部自带完整基本归因错误结构，单独成支
  const soloZh = collectSolo(text, R.SOLO_ZH || SOLO_ZH, R.SELF_ZH || SELF_ZH, R.SELF_EN || SELF_EN);
  const soloEn = collectSolo(text, R.SOLO_EN || SOLO_EN, R.SELF_ZH || SELF_ZH, R.SELF_EN || SELF_EN);
  for (const x of soloZh) sigs.push({ lang: 'zh', disp: x.raw, sitd: '', infer: '', solo: true });
  for (const x of soloEn) sigs.push({ lang: 'en', disp: x.raw, sitd: '', infer: '', solo: true });
  // 双标归因签名：他人×特质/运气 vs 自己×情境/实力，整句融合，单独成支
  const asymZh = collectAsym(text, resolveGroups(R, ASYM_ZH_GROUPS));
  const asymEn = collectAsym(text, resolveGroups(R, ASYM_EN_GROUPS));
  for (const x of asymZh) sigs.push({ lang: 'zh', disp: x.raw, sitd: '', infer: '', asym: true });
  for (const x of asymEn) sigs.push({ lang: 'en', disp: x.raw, sitd: '', infer: '', asym: true });
  for (const L of langs) {
    const dispM = collectDisp(text, L.disp, R.SELF_ZH || SELF_ZH, R.SELF_EN || SELF_EN);
    if (dispM.length === 0) continue;
    const sitdM = collectSitd(text, L.sitd);
    if (sitdM.length === 0) continue;
    const inferM = allMatches(L.infer, text);
    for (const n of dispM) {
      for (const v of sitdM) {
        if (dist(n, v) > L.w) continue;
        // 包含守卫：一条腿整体落在另一条腿内部即失配——「别找借口」的
        // 「借口」同时是 SITD_REJECT 的子串，不是独立的特质归因。
        if ((n.idx >= v.idx && n.end <= v.end) || (v.idx >= n.idx && v.end <= n.end)) continue;
        // 防自证：情境排斥腿必须在特质归因腿之外**带来新内容**（左伸或
        // 右伸至少 2 字）——「不负责」不能既当特质腿又当情境排斥腿。
        const newRight = v.end > n.end ? v.end - Math.max(v.idx, n.end) : 0;
        const newLeft = v.idx < n.idx ? Math.min(v.end, n.idx) - v.idx : 0;
        if (newRight < 2 && newLeft < 2) continue;
        const between = inferM.find(x => (x.idx >= n.end && x.end <= v.idx) || (x.idx >= v.end && x.end <= n.idx));
        sigs.push({ lang: L.lang, disp: n.raw, sitd: v.raw, infer: between ? between.raw : '' });
      }
    }
  }
  // 签名按「语言 × 特质腿原文 × 情境腿原文」去重，避免跨族重叠把一处
  // 证据算成多处（count 参与档位判定，必须诚实）。
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.disp + '|' + s.sitd;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * 基本归因错误签名：内在特质归因 × 情境因素排斥 邻近共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectFundamentalAttributionError(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念教学（讨论基本归因错误/归因偏差这个概念本身）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：双向归因（性格与情境两侧并举是正当做法）
  if ((R.DUAL_ZH || DUAL_ZH).test(text) || (R.DUAL_EN || DUAL_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 C：疑问句（质疑该归因本身）
  if (/[?？]/.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension: 'fundamental_attribution_error',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? (x.solo
        ? '独腿签名「' + x.disp + '」（特质归因与情境排斥同句融合）'
        : x.asym
        ? '双标归因「' + x.disp + '」（他人侧与自己在同句内用了两套归因口径）'
        : '特质归因「' + x.disp + '」→ 情境排斥「' + x.sitd + '」' + (x.infer ? '（推断标记「' + x.infer + '」）' : ''))
      : (x.solo
        ? 'solo signature "' + x.disp + '" (disposition attribution fused with situation dismissal)'
        : x.asym
        ? 'asymmetric attribution "' + x.disp + '" (others and self explained in two different registers)'
        : 'disposition attribution "' + x.disp + '" -> situation dismissal "' + x.sitd + '"' + (x.infer ? ' (via "' + x.infer + '")' : '')))),
    details: s.solo
      ? (s.lang === 'zh'
        ? '基本归因错误(' + sigs.length + '处: 「' + s.disp + '」——特质归因与情境排斥同句融合)(zh)'
        : 'fundamental-attribution-error(' + sigs.length + 'x: "' + s.disp + '" — disposition fused with situation dismissal)(en)')
      : s.asym
      ? (s.lang === 'zh'
        ? '基本归因错误(' + sigs.length + '处: 「' + s.disp + '」——对他人用特质/运气解释，对自己用情境/实力解释，同一句两套口径)(zh)'
        : 'fundamental-attribution-error(' + sigs.length + 'x: "' + s.disp + '" — others explained by disposition or luck, self by circumstance or merit)(en)')
      : (s.lang === 'zh'
        ? '基本归因错误(' + sigs.length + '处: 把结果归因于特质「' + s.disp + '」并取消情境资格「' + s.sitd + '」)(zh)'
        : 'fundamental-attribution-error(' + sigs.length + 'x: disposition "' + s.disp + '" -> situation dismissal "' + s.sitd + '")(en)'),
    guidance: '基本归因错误指解释他人行为时系统性高估内在特质、低估情境因素的归因偏差——Ross 1977 的经典判据是：同一行为，观察者倾向于归因于性格，行动者自己倾向于归因于情境。它的危害不在「他不负责」这个判断本身（那可以用证据争论），而在紧随其后的第二动作：明确宣布情境因素不算数、不许作为理由提出。这一步单方面取消了情境证据的举证资格，后续讨论就只能在性格层面进行，绩效评估、招聘决策、公共政策的结论也就全部建在半个证据面上。正当做法是把两侧分开列出并各自核实——这个结果有多少可由个人选择解释、有多少可由资源/时机/制度/信息约束解释，两边的证据分别是什么；若确要评价个人责任，把结论限定在可核验的行为事实上（迟到三次、缺交两份报告），而不是人格定性。转述他人评价、引用组织行为学案例、同时列举性格与情境两侧、或明确指出这是基本归因错误，都是正当做法。',
    tags: ['psychology', 'fundamental-attribution-error', 'correspondence-bias', 'attribution', 'social-cognition'],
  };
}

module.exports = {
  detectFundamentalAttributionError,
  __internals: () => ({
    DISP_MARK_ZH, DISP_TRAIT_ZH, DISP_MARK_TRAIT_ZH, DISP_PROBLEM_ZH, DISP_SO_ZH, DISP_ONLY_ZH, DISP_COMPLAIN_ZH, DISP_ZH,
    DISP_MARK_EN, DISP_TRAIT_EN, DISP_MARK_TRAIT_EN, DISP_OWN_FAULT_EN, DISP_TRAIT_ADJ_EN, DISP_EN,
    SITD_TARGET_ZH, SITD_REJECT_ZH, SITD_DEBASE_ZH, SITD_DENY_ZH, SITD_HOWMUCH_ZH, SITD_ZH,
    SITD_TARGET_EN, SITD_REJECT_EN, SITD_DEBASE_EN, SITD_DENY_EN, SITD_NO_EXCUSE_EN, SITD_EN,
    SOLO_ZH, SOLO_EN,
    ASYM_ZH, ASYM_EN, ASYM_ZH_GROUPS, ASYM_EN_GROUPS,
    DISP_ZH_GROUPS, DISP_EN_GROUPS, SITD_ZH_GROUPS, SITD_EN_GROUPS,
    INFER_ZH, INFER_EN, W_ZH, W_EN,
    CONCEPT_ZH, CONCEPT_EN, DUAL_ZH, DUAL_EN, SELF_ZH, SELF_EN,
  }),
};
