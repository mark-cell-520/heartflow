/**
 * src/planning-fallacy.js — 「计划谬误 / 参照类缺失」检测器
 * （provisional 第 243 个判别维度，r255 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r255-dimension-agent4.md
 * §五。编号 provisional 的原因同 r218-r254：远端 v6.8.145 已接线 214
 * 维，另有 28+1 个已起草未接线维度占号——含 r241 已起草的
 * endowment_effect 等；最终编号由 1 号按接线顺序在 VERIFY_DIMS
 * 登记序重排）
 *
 * [r255 立项] 零命中探针 coordination/agent4/probes/r255-probe-round1.js
 * + r255-probe-round2.js（v6.8.145，hf.gate() 全量 findings 口径，过滤
 * {dimension:'none'} 哨兵）。五候选两轮定夺：
 *   · A 计划谬误：round1 穿透 7/8 → round2 扩样穿透 14/16（2 条被既有
 *     维度 no_fallback / favor_ledger 代拦，判定为代拦非漏判），疑难良性
 *     维度级误伤 0（2/10 被 hold 的良性全部来自既有维度 contradiction，
 *     非本族判据）；src/ 下无任何模块判「意愿/努力表达 × 工期成本
 *     结论、缺参照类基准」双腿链，**胜出**；
 *   · B 零和偏误：round2 穿透 11/16 居次，但与既有 false_dilemma /
 *     cost_externalization / absolute_claim 领地交叉偏多（且 r218 已起草
 *     zero_sum_fallacy 草稿），连续第四轮留 backlog；
 *   · C 显著性≠重要性：round2 穿透 13/15 亦强，但 r232 已起草
 *     significance_effect_size 草稿（实测其只覆盖本族攻击 1/10，属可
 *     扩充的既有草稿而非新维度），留 backlog 供后续 ② 型扩充轮；
 *   · D 禀赋效应：round2 穿透 15/16 最高，但 r241 已起草
 *     endowment_effect 草稿（实测其只覆盖本族攻击 1/16，其余为新措辞
 *     族），同样属 ② 型扩充对象而非新维度，留 backlog；
 *   · E 基本归因错误：round2 穿透 12/16，与 blame_externalization /
 *     stereotype_origin 领地交叉偏多，留 backlog。
 *
 * 外部来源：空返，按既有形态自建。r255 海外扫描（原始证据
 * coordination/agent4/scout/targeted-*20261108*.xml 与 gh-*.json）：
 * arXiv 七次精确引号查询命中真实文献——"planning fallacy" 7 篇
 * （Planning Fallacy or Hiding Hand / The Principle of the Malevolent
 * Hiding Hand / Quality Control and Due Diligence in Project
 * Management: Getting Decisions Right by Taking the Outside View /
 * Report for the Edinburgh Tram Inquiry / Delusions of Success）、
 * "endowment effect" 8 篇（均为组合拍卖/机制设计建模样板）、
 * "fundamental attribution error" 2 篇（均为 AI 对齐/机器人修辞研究）、
 * "fallacy detection" 23 篇（均为 LLM/形式化方法，非纯规则）；GitHub
 * repos 最高 ★6（schmettow/ragrig-cbd，RAG 方案）其余 ★0-3 且均为
 * LLM 方案；Semantic Scholar 429 限流。**零纯规则文本检测实现**，按
 * 既有形态自建，判据为心虫自有纯规则实现，家族定义取自计划谬误的标准
 * 表述（planning fallacy / 计划谬误——Kahneman & Tversky 1979；
 * Lovallo & Kahneman 2003：决策者采取「内部视角」，只凭意愿与努力
 * 程度估计任务工期与成本，无视同类任务的结果分布即「参照类」）。
 *
 * 辨别的族：计划谬误 / 参照类缺失（planning fallacy / reference-class
 * neglect）——文本先给出**意愿或努力表达**（加把劲/拼一下/咬咬牙/
 * 连轴转/决心/士气；EN with enough effort / push harder / sheer
 * determination / we just need to），再据此导出**工期或成本结论**
 * （两个月肯定上线/一周搞定/肯定来得及/成本可控；EN ship in two
 * months / done in a week / we will make the deadline），并且**缺席
 * 参照类基准**（明确排斥历史数据/同类先例，或以「以前也都赶出来了」
 * 式的个案经验替代分布）：
 *   这个项目看起来很紧，但加把劲两个月肯定能上线，以前也都赶出来了。
 *   别参考什么历史数据，团队拼一下，三个月足够把系统重写完了。
 *   虽然类似项目都延期了，但我们这次不同，年底前一定交付。
 *   加加班什么都赶出来了，工期排一个月绝对够，不用留缓冲。
 *   迁移数据库能有多难，两个工程师一周搞定，网上教程多得很。
 *   The timeline looks tight, but with enough effort we will ship in
 *   two months for sure.
 *   Similar projects ran late, but we are different; we will deliver
 *   by year end.
 *   Forget the consultants pessimistic numbers; with our drive we will
 *   win the market in six months.
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：工期与成本估计是
 * 一切计划的承重墙——它错了，后面所有的资源排布、承诺、合同、融资
 * 全部建立在错误的地基上。计划谬误的毒性在于它戴着「积极性」的面具：
 * 句子里的意愿可以完全真诚（团队确实想拼），数字可以完全具体（两个
 * 月），唯独缺了同类任务实际用了多久这一块分布信息。Kahneman 的
 * 判据很干净：用参照类的外部视角取代内部视角的意愿叙事。与正当推理
 * 的界线很清楚：一旦给出参照类基准（同类项目历史工期/中位数/外部
 * 视角/留缓冲/悲观估计）、明确指出这是计划谬误、或把结论限定在意愿
 * 本身而不是工期承诺，就是正当做法，一律豁免。
 *
 * 与既有维度的边界（r255 归因，探针邻接领地实测穿透零重叠）：
 *   · wishful_thinking（VERIFY 族）判**把愿望当真**（「我希望它
 *     成功，所以它会成功」——信念被愿望驱动）；本族判据是意愿表达 ×
 *     工期/成本结论的双腿，结论落在任务估计上而非信念上（探针邻接句
 *     实测穿透、归其家族）。
 *   · false_precision 管**数字精度虚假**（「增长了15.37%」）；本族
 *     不涉精度——「两个月」可以是个整数粗估，问题在于缺参照类。
 *   · no_fallback / favor_ledger 等泛维度可能在代拦时命中（探针中
 *     2/16 攻击句即被代拦，判定为代拦非漏判）；本族判据不依赖这些
 *     泛化信号，两条具体腿 + 邻近共现即可独立成立。
 *   · sunk_cost_coercion 判**已投入绑架退出**；本族判据是事前估计
 *     缺参照类，与已投入无关。
 *   · exponential_growth 类判**复利量级低估**；本族判据是单任务
 *     工期/成本估计，不涉增长模型。
 *
 * 判据（双腿链 + 邻近窗 + 两组豁免，缺一不判）：
 *   ① 腿① WILL 意愿/努力表达（或参照类排斥）——七族任一（详见下方
 *     常量）：努力加压动词族、意愿强度副词族、参照类排斥/贬低族、
 *     难度轻描淡写族、参照类模仿族；EN 对应五族；
 *   ② 腿② EST 工期/成本结论——四族任一：工期数字结论族、压缩工期
 *     动词族、成本可控族、结论承诺族；EN 对应族；
 *   ③ 两腿须落在邻近窗内（ZH 60 字 / EN 160 字符），**方向不限**——
 *     「加把劲两个月上线」与「两个月就能上线，加把劲」都收；推断
 *     标记（所以/因此/可见/肯定；EN so/therefore/we will）落在两腿
 *     之间则加权而非必要；
 *   ④ 腿②须带来新内容（左伸或右伸至少 2 字）——防自证；
 *   ⑤ 腿②带限幅守卫（不够/差得远/来不及/太紧 → 失配）；
 *   ⑥ 两腿均查否定前缀（「不是加把劲就能上线」→ 失配）；
 *   ⑦ 豁免 A 概念教学（计划谬误/参照类/外部视角/inside view/
 *     planning fallacy/reference class/outside view——讨论这个概念
 *     本身是正确判别）；
 *   ⑧ 豁免 B 正确估计口径（参照同类/历史工期/按中位数/留缓冲/
 *     悲观估计/校准；EN reference-class/historical data/outside
 *     view/median of similar/buffer——用参照类校估是正当做法）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一次乐观排期（「团队计划
 * 两个月上线」是事实陈述），也可能是在引用管理案例。verify 的语义是
 * 「这段话用意愿推出了工期结论而未见参照类基准，先按外部视角核对
 * 同类任务分布，再决定是否采信它的工期承诺」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 概念教学（计划谬误告诉我们别信内部视角/planning fallacy means
 *     ignoring the reference class）；
 *   · 正确估计口径（参照同类项目的历史工期排了四个月并留缓冲/
 *     Looking at how long similar projects actually took, we planned
 *     for five months）；
 *   · 单腿句（只有意愿无工期结论：大家加班加点齐心协力；只有工期
 *     结论无意愿腿：项目排期两个月，含两周缓冲）；
 *   · 限幅对冲（两个月很紧/恐怕来不及）；
 *   · wishful_thinking / false_precision / no_fallback 领地。
 * 已知缺口（有意不收）：无显式工期结论的纯意愿陈述（「大家干劲
 *     十足」——缺腿②，与动员口号同形）；以及工期结论被包裹在反讽/
 *     引语中的句子。前者缺结论导出、后者需要语用判断，纯规则无法在
 *     不误伤的前提下收窄，宁缺勿滥。
 *
 * [r276 扩展] 经济与资源推理方向·全新措辞家族（真升级②，探针
 * coordination/agent4/probes/r276-probe-pool.js 实证 1/6 穿透）：
 *   · WILL_REJECT_REF_ZH W3b 意外 dismissal 族（「上次纯属意外」「以往
 *     纯属偶然」——把参照类失手归为个例；旧族只有 也都/都/照样 +
 *     赶出来类）；
 *   · WILL_DISMISS_ZH W4b 掌握族（「这次我吃透每个环节」——自陈掌握
 *     度轻描难度）；
 *   · EST_PROMISE_ZH E3b 绝不会再 + 失手词族（「绝不会再超时」「绝对
 *     不会再延期」——绝不会/不会再强度形不在旧 肯定/一定 射程内）；
 *   · WILL_EFFORT_ZH 资源加码族（「人手翻倍」「又加了三个人」）；
 *   · EST_DURATION_ZH E1b 工期比较结论族（「工期肯定比计划还短」「交付
 *     只会更快」——无数字锚的比较结论）；
 *   · EN 对应：WILL_REJECT_REF_EN fluke/one-off/anomaly dismissal、
 *     EST_PROMISE_EN no more overruns、WILL_EFFORT_EN doubled the
 *     team / added three more engineers、EST_DURATION_EN delivery
 *     can only get faster。
 *   维度计数不变、src/index.js 零改动、VERSION 未 bump。
 */
'use strict';

// ─── 腿① WILL 意愿/努力表达（或参照类排斥）──────────────────────
// W1 努力加压动词族
const WILL_EFFORT_ZH = [
  /(?:加把劲|加把力气|加油干|拼一下|拼了|拼一把|咬咬牙|连轴转|加班加点|加加班|赶工|赶赶|突击|冲刺|硬上|堆人|人海战术|齐心协力|万众一心|努努力|努力赶|奋力|全力赶|拼命赶|加班赶|熬夜赶|通宵赶|熬熬夜|起早贪黑)[^。，！？；\n]{0,8}/,
  /(?:决心|士气|斗志|干劲|热情|信念|意志力|主观能动性)[^。，！？；\n]{0,8}(?:足|大|高|强|在|足得很|满满)/,
  // r276 新增：资源加码族（「人手翻倍」「又加了三个人」——投入承诺的
  // 资源量化形；旧族只收 堆人/人海战术 类动词与决心/士气情绪词，
  // 资源翻倍/加码/扩充的量化承诺整族穿透）
  /(?:人手|人力|资源|团队|班组|人手)(?:翻倍|加倍|翻番|扩充|扩张|加码|拉满|顶满|拉满)/,
  /(?:又|再|额外)(?:加|增|添|抽调|调)了?[一二三四五六七八九十两\d]+(?:个)?(?:人|名|人手|工程师|开发|人手)/,
];
// W2 意愿强度副词族（肯定/一定 + 能/来得及…）
const WILL_INTENSITY_ZH = [
  /(?:肯定|一定|绝对|势必|铁定|板上钉钉|妥妥的|没跑|错不了|保底|务必)[^。，！？；\n]{0,6}(?:能|可以|来得及|完成|交付|上线|搞定|赶上|做到|做得到|没问题)/,
];
// W3 参照类排斥/贬低族（别参考历史数据 / 以前也都赶出来了）
const WILL_REJECT_REF_ZH = [
  /(?:别|不用|无须|无需|不要|甭|谈不上|谈不上什么)(?:参考|听|管|看|理会|迷信|拘泥)[^。，！？；\n]{0,10}(?:历史|数据|估计|咨询|先例|别人|过去|案例|基准|统计|调研|报告|测算)/,
  /(?:以前|以往|过去|上次|之前)[^。，！？；\n]{0,6}(?:也都|不也|都|照样)[^。，！？；\n]{0,4}(?:赶出来|赶出来了|完成了|做成了|过来了|成功了|扛过来了|熬过来了)/,
  /(?:历史|数据|估计|咨询公司|顾问|统计|调研)[^。，！？；\n]{0,4}(?:不算数|不能当准|当不得真|说明不了|证明不了|没用|没有参考价值)/,
  // 参照类延期先例 + 但这次不同（同类项目都延期了，但我们这次不同）
  // r269 扩展：中隙允许逗号（r255 先例——排除逗号会让「类似项目总是超时，
  // 但这次我有信心按时完成」整句不匹配，而该句正是分裂排期承诺的典型形态）；
  // 修饰词补「历史/历来/过往/隔壁/邻组」，失手动词补「超预算/超期/延误/
  // 跳票/没按期/推迟」，转折补「只是」。
  /(?:类似|同类|过去|以前|以往|历史|历来|过往|隔壁|邻组|旁边|别的|其他|从前)[^。！？；\n]{0,8}(?:项目|任务|团队|公司|人家|案例|工程|小组|部门)[^。！？；\n]{0,10}(?:都|全部|全|大多|总是|通常|往往|基本)?(?:延期|延迟|晚了|超时|超期|失败|超支|超预算|拖了|拖沓|烂尾|没做成|没按期|推迟|延误|跳票)[^。！？；\n]{0,16}(?:但|但是|可是|不过|然而|只是)[^。！？；\n]{0,8}(?:我们|咱们|这次|咱|此)/,
  // W3b r276：意外 dismissal 族（「上次纯属意外」「以往纯属偶然」——
  // 把参照类失手归为个例以拒绝其分布信息；旧族动词只有 也都/不也/
  // 都/照样 + 赶出来类，意外/偶然/运气/特例 dismissal 整族穿透）
  /(?:上次|之前|以往|过去|先前|前面|那一回|那回|此前|早先)[^。，！？；\n]{0,8}(?:纯属|纯是|纯|就是|只是|算|纯纯|纯纯粹粹)(?:意外|偶然|运气|个案|特例|特殊情况|小概率|意外事件|巧合|寸了|赶上了|点子背|运气差)/,
];
// W4 难度轻描淡写族（能有多难 / 想得太复杂 / 师傅说简单）
const WILL_DISMISS_ZH = [
  /(?:能有多难|有多难|算什么|有多复杂|还不简单|不甚简单|轻而易举|小菜一碟|不是个事|小事一桩|轻松搞定)/,
  /(?:想得|说得|听得|看得|搞得)太(?:复杂|难|严重|夸张)/,
  /(?:师傅|老板|领导|客户|专家|网上|教程|文档|书上|百度)[^。，！？；\n]{0,4}(?:说|讲|表示|写)[^。，！？；\n]{0,2}(?:简单|轻松|容易|快|不难)/,
  // W4b r276：掌握族（「这次我吃透每个环节」——吃透/摸透/门儿清 +
  // 环节/细节/流程；旧族只收「能有多难」轻描形与「某人说简单」传闻
  // 形，自陈掌握度形整族穿透）
  /(?:吃透|摸透|钻研透|门儿清|了如指掌|熟稔|吃得透|想得透)[^。，！？；\n]{0,8}(?:每个|各个|所有|一切|每一)?(?:环节|细节|流程|步骤|技术点|难点|坑|问题)/,
];
// W5 参照类模仿族（别人三个月我们也三个月）。间隔类允许逗号——r255
// 实证：排除逗号会让「别人两个月交付了，我们也能」整族不匹配。
const WILL_MIMIC_ZH = [
  /(?:别人|人家|别的团队|同行|友商|上次)[^。！？；\n]{0,10}(?:我们|咱们|咱)[^。！？；\n]{0,4}(?:也|照样)/,
];

const WILL_EFFORT_EN = [
  /\b(?:with (?:enough )?(?:effort|determination|willpower|hustle|grit|drive)|push(?:ing)? harder|work harder|grind(?:ing)? (?:it )?out|all[- ]hands|crunch(?: time)?|sheer (?:determination|willpower)|if we just|we just need to|everyone just needs to)\b/i,
  /\b(?:determination|morale|willpower|commitment|drive|enthusiasm)\s+(?:is|will be|alone is)\s+(?:enough|all we need)\b/i,
  // r276 新增：资源加码族（「I doubled the team size」「added three more
  // engineers」——投入承诺的资源量化形；旧族只收 with enough effort 类
  // 与 determination 情绪词，doubled/added N people 整族穿透）
  /\b(?:doubled|tripled|quadrupled|doubling|tripling)\s+(?:the\s+)?(?:team|headcount|staffing|manpower|crew|resources?)\b/i,
  /\b(?:added|adding|added\s+on|throw(?:ing)?)\s+(?:\d+|three|four|five|ten|more)\s+(?:more\s+)?(?:people|engineers|developers|staff|hands)\b/i,
  // r276 新增：all in 全力以赴族（「going all in with every hour」——
  // 旧族 all[- ]hands 不覆盖 all in 形）
  /\b(?:going\s+)?all[-\s]in\b/i,
];
const WILL_INTENSITY_EN = [
  /\b(?:definitely|certainly|surely|absolutely|for sure|no doubt|guaranteed|we will (?:definitely|certainly|surely))\b/i,
];
const WILL_REJECT_REF_EN = [
  /\b(?:ignore|forget|discount|disregard|don'?t (?:listen to|trust|believe)|never mind|pay no attention to|set aside)\b[^.]{0,40}\b(?:history|historical|past|data|estimates?|consultants?|advisors?|base rates?|benchmarks?|similar (?:projects|tasks)|track record)\b/i,
  /\b(?:similar|comparable|past|previous)\s+(?:projects?|tasks?|teams?|launches?|efforts?)\s+(?:ran late|were late|took longer|failed|overran|run late|run over|ran over|blew|missed|slipped)\b[^.]{0,40}\b(?:but|yet)\s+(?:we|this time|we'?re|our)\b/i,
  // r276 新增：fluke dismissal（「Last time was a fluke」「that run was
  // a one-off」——把参照类失手归为个例；旧族只收 ignore/discount 祈使
  // 形与 ran late+but 转折形，fluke/one-off/anomaly dismissal 整族穿透）
  /\b(?:last\s+time|the\s+last\s+one|previous(?:ly)?|that\s+time|the\s+previous\s+(?:run|attempt|launch|project))\s+(?:was\s+)?(?:a\s+)?(?:fluke|one[-\s]off|anomaly|outlier|accident|coincidence|bad\s+luck|aberration)\b/i,
];
const WILL_DISMISS_EN = [
  /\b(?:how hard can|it (?:can'?t|cannot) be that hard|piece of cake|no big deal|not rocket science|easier than (?:they|people|everyone) (?:think|said)|simpler than (?:they|people) (?:think|said)|we overthought it|not that complicated|straightforward)\b/i,
  /\b(?:the )?(?:tutorials?|docs?|documentation|guides?|examples?|stack overflow|online resources)\s+(?:are|is)\s+(?:everywhere|plentiful|all over)\b/i,
];
const WILL_MIMIC_EN = [
  /\b(?:they|others|other teams|competitors) (?:did it|shipped|delivered) in\b[^.]{0,30}\b(?:so|therefore)?\s*(?:we|us)\s+(?:can|will|too)\b/i,
];

// ─── 腿② EST 工期/成本结论 ───────────────────────────────────────
// E1 工期数字结论族（两个月肯定上线 / 一周搞定）
const EST_DURATION_ZH = [
  /(?:\d+|[一二三四五六七八九十两半]+)\s*(?:个)?(?:月|周|天|小时|分钟|季度|年|半年)[^。，！？；\n]{0,8}(?:就能|足以|足够|肯定|一定|绝对|保底|搞定|完成|交付|上线|弄完|谈完|写完|重建|迁完|迁移完|来得及|赶出来|做出来|弄好|做完|完事|拿下|谈成)/,
  /(?:两周|一周|三天|两天|一天|一个月|两个月|三个月|半年|一年)[^。，！？；\n]{0,4}(?:就能|足以|足够|肯定|一定|绝对|搞定|完成|上线|交付|弄完|谈完|迁完|拿下)/,
  // E1b r276：工期比较结论族（「工期肯定比计划还短」「交付只会更快」——
  // 比较形结论无数字锚；旧族要求 数字+时间单位 或 强度词+结论动词，
  // 比计划短/只会更快的比较结论整族穿透）
  /(?:工期|进度|交付|上线|完成时间|交期|排期)[^。，！？；\n]{0,10}(?:只会|肯定|一定|势必|保准|保证|必定)[^。，！？；\n]{0,10}(?:更|还|只会更)?(?:短|快|早|提前)/,
];
// E2 成本/规模结论族
const EST_COST_ZH = [
  /(?:成本|预算|费用|投入|开销|花销)[^。，！？；\n]{0,6}(?:很低|不高|有限|可控|省|花不了|便宜|绰绰有余)/,
  /(?:占领|攻下)[^。，！？；\n]{0,6}(?:市场|份额|客户|高地)/,
];
// E3 结论承诺族（肯定来得及 / 一定没问题）
const EST_PROMISE_ZH = [
  /(?:肯定|一定|绝对|势必|铁定|板上钉钉|妥妥的|没跑|错不了)[^。，！？；\n]{0,6}(?:来得及|能完成|能交付|能上线|能搞定|能赶上|没问题|做得到|来得及的|误不了|完成|交付|上线|搞定|赶上|做完|谈成|拿下|迁完)/,
  // 期限锚结论：年底前/月底前 + 强度词（两个方向都收）
  /(?:年底|年末|月底|周末|季度末|季度末前)[^。，！？；\n]{0,6}(?:前)?[^。，！？；\n]{0,6}(?:肯定|一定|绝对|势必|铁定|妥妥的)/,
  /(?:肯定|一定|绝对|势必|铁定|妥妥的)[^。，！？；\n]{0,6}(?:年底|年末|月底|季度末)[^。，！？；\n]{0,8}(?:交付|上线|完成|搞定|弄完|谈成|拿下)/,
  /(?:包在|交给)[^。，！？；\n]{0,4}(?:身上|我们|咱)[^。，！？；\n]{0,4}(?:放心|错不了|没问题)/,
  // E3b r276：绝不会再 + 失手词族（「绝不会再超时」「不会再延期」——
  // 强度词旧表只有 肯定/一定/绝对/势必/铁定类，「绝不会/不会再」+
  // 超时/延期/超支/跳票 的排期承诺形整族穿透）
  /(?:绝不会|不会再|绝不会再|不会再犯|保准不再|肯定不再|决不再)[^。，！？；\n]{0,6}(?:超时|超期|延期|延迟|延误|超支|超预算|跳票|烂尾|晚点|掉链子|爽约)/,
];

const EST_DURATION_EN = [
  /\b(?:in|within|under)\s+(?:\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|a few|a couple of|half a)\s+(?:days?|weeks?|months?|quarters?|years?|hours?|minutes?|sprints?)\b[^.]{0,30}\b(?:we (?:will|can|should|'?ll)|it'?s|that'?s|done|finished|shipped|delivered|launched|complete[ds]?|no problem|easy)\b/i,
  /\b(?:ship|deliver|launch|finish|complete|rewrite|migrate|roll out|win|capture|conquer|dominate|take over|release)\b[^.]{0,25}\b(?:in|within|under)\s+(?:\d+|a|an|one|two|three|four|five|six|a few|a couple of)\s+(?:days?|weeks?|months?)\b/i,
  /\b(?:\d+|one|two|three|a few|a)\s+(?:days?|weeks?|months?)\s*,\s*(?:done|finished|complete[ds]?|shipped|wrapped)\b/i,
  /\b(?:a|one)[ -]day job\b/i,
  // r276 新增：can only get faster（「delivery can only get faster」——
  // 比较形结论无数字锚，与 EST_DURATION_ZH E1b 对应）
  /\b(?:delivery|deliver|ship|finish|launch|schedule|timeline)\b[^.]{0,30}\b(?:can\s+only|will\s+only|should\s+only|would\s+only)\s+(?:get|be|go|come)\s+(?:faster|quicker|sooner|earlier)\b/i,
  // r276 新增：ahead of schedule / ahead of time（「we will finish ahead
  // of schedule」——提前结论无数字锚）
  /\b(?:we|i|they|it)\s+(?:will|'?ll|can|should|would)\s+(?:definitely\s+|certainly\s+)?(?:finish|deliver|ship|complete|launch)\s+ahead\s+of\s+(?:schedule|time|the\s+deadline)\b/i,
];
const EST_PROMISE_EN = [
  /\b(?:we'?(?:ll| will)|we can|we should|we'?re going to)\s+(?:definitely|certainly|surely|easily|absolutely)\s+(?:make|hit|meet|ship|deliver|finish|launch|complete)\b/i,
  /\b(?:make|hit|meet)\s+(?:the\s+)?(?:deadline|date|launch|target|timeline)\s+(?:for sure|easily|no problem|guaranteed)\b/i,
  /\b(?:deliver|ship|finish|launch|complete)\b[^.]{0,25}\bby (?:the\s+)?(?:year[ -]end|end of (?:the\s+)?year|Q[1-4]|the deadline|next (?:week|month))\b/i,
  // r276 新增：no more overruns/late（「so no more overruns」「we won't
  // slip again」——旧族只收 definitely/certainly 强度形，绝不会再 +
  // 失手名词的排期承诺形整族穿透）
  /\b(?:no\s+more|never\s+again|won'?t\s+happen\s+again|not\s+happening\s+again|won'?t\s+slip\s+again)\s+(?:overruns?|delays?|late|slippage|misses|overruns)\b/i,
];

// ─── 独腿签名（SOLO）——一句话内部自带「意愿×工期」完整结构，无需
// 另找工期结论腿（同 r251 loss_aversion / r254 money_illusion 先例）。
const SOLO_ZH = [
  // S1 加把劲 + 工期数字 + 结论（融合句）。间隔类只排除句末标点——
  // r255 实证：排除逗号会让「加把劲，一周肯定搞定」整族永不匹配。
  /(?:加把劲|拼一下|加油干|咬咬牙|连轴转|加班加点|努努力|努力赶|拼命赶)[^。！？；\n]{0,10}(?:\d+|[一二三四五六七八九十两半]+)\s*(?:个)?(?:月|周|天)[^。！？；\n]{0,8}(?:就能|足以|肯定|一定|绝对|来得及|搞定|上线|完成|交付|拿下|弄完)/,
  // S2 肯定 + 结论 + 拼/努力（倒装融合）
  /(?:肯定|一定|绝对)[^。！？；\n]{0,6}(?:来得及|能完成|能交付|能上线|没问题|做得到)[^。！？；\n]{0,10}(?:拼|努力|加班|赶|冲)/,
  // S3 别参考 + 参照类 + 决心/肯定（排斥参照类的排期承诺）
  /(?:别|不用|无须|无需|不要)(?:参考|听|管|理会)[^。！？；\n]{0,10}(?:历史|数据|估计|咨询|基准|先例)[^。！？；\n]{0,12}(?:拼|决心|咬咬牙|肯定|一定|两个月|一个月|一周|两周)/,
  // S4 参照类失手 + 但这次不同（分裂排期承诺）——r269 新增族：
  // 「类似项目总是超时，但这次我有信心按时完成」「隔壁组每次都延期，
  // 但我们这次肯定能按时上线」。中隙允许逗号（r255 先例）；频率副词
  // 槽 + 失手动词族 + 转折族 + 「这次/我们」锚，四段缺一不判。
  /(?:类似|同类|过去|以前|以往|历史|历来|过往|隔壁|旁边|别的|其他|从前|上一个)[^。！？；\n]{0,6}(?:项目|任务|团队|公司|人家|案例|工程|版本|迭代|活动|发布会|小组|部门|组)[^。！？；\n]{0,10}(?:都|全部|全|大多|总是|通常|往往|基本|历来|年年)[^。！？；\n]{0,6}(?:延期|延迟|超时|超期|超支|超预算|延误|跳票|烂尾|没做成|没按时|推迟|拖了|晚了|失败)[^。！？；\n]{0,16}(?:但|但是|可是|不过|然而|只是)[^。！？；\n]{0,10}(?:我们|咱们|这次|咱|此|我|这回)/,
  // S5 无名词变体：「历史上都超预算，不过这次预算一定够」——历史/历来
  // 直接带频率副词 + 失手动词，不经过项目名词槽。
  /(?:历史|历来|过往|过去|以往|从前)(?:上)?[^。！？；\n]{0,8}(?:都|全部|总是|通常|往往|基本|历来)[^。！？；\n]{0,6}(?:超预算|超支|延期|超时|超期|延误|跳票|烂尾|没按时|推迟|失败)[^。！？；\n]{0,16}(?:但|但是|可是|不过|然而|只是)[^。！？；\n]{0,10}(?:这次|我们|咱们|咱|此|我|这回)/,
];
const SOLO_EN = [
  // E1 with enough effort + in N weeks/months（融合句）
  /\b(?:with (?:enough )?(?:effort|determination|willpower|hustle|drive)|push(?:ing)? harder|if we just push)\b[^.]{0,40}\b(?:in|within)\s+(?:\d+|one|two|three|a few|a couple of)\s+(?:days?|weeks?|months?)\b/i,
  // E2 ignore history + we will make/ship/deliver（倒装融合）
  /\b(?:ignore|forget|discount)\b[^.]{0,30}\b(?:history|estimates?|base rates?|the data)\b[^.]{0,40}\b(?:we'?(?:ll| will)\s+(?:make|ship|deliver|hit|finish|launch))\b/i,
  // E3 同类失手 + but this time（分裂排期承诺）——r269 新增族：
  // 「Similar projects always run over, but this time we will finish on
  // schedule.」「Past teams blew the deadline, yet ours will surely
  // deliver on time.」失手动词族含 run over/blew/missed/slipped。
  /\b(?:similar|comparable|past|previous|last)\s+(?:projects?|tasks?|teams?|launches?|efforts?|releases?|sprints?)\s+(?:always|usually|typically|often|all|nearly|almost)?\s*(?:ran|run|runs|blew|missed|took longer|overran|were late|failed|ran late|run late|ran over|run over|slipped)\b[^.]{0,40}\b(?:but|yet|this time|we'?re different|we are different|ours will|our team will)\b/i,
];

// ─── 推断标记（落在两腿之间则加权，非必要）────────────────────────
const INFER_ZH = /(?:所以|因此|据此|可见|说明|证明|意味着|足以|因而|于是|结果就是|结论就是|这就是说|足见|肯定|一定|绝对|势必|那么|这就)/;
const INFER_EN = /\b(?:so|therefore|thus|hence|which\s+means|which\s+proves|which\s+shows|that\s+means|proves|shows\s+that|indicates\s+that|means\s+that|it\s+follows|this\s+shows|this\s+proves|consequently|as\s+a\s+result|we\s+will|we'?ll|we\s+can)\b/i;

// ─── 距离窗 ───────────────────────────────────────────────────────
const W_ZH = 60;
const W_EN = 160;

// ─── 豁免 A：概念教学（点名计划谬误/参照类这个概念本身）─────────
const CONCEPT_ZH = /(?:计划谬误|规划谬误|参照类|参考类|外部视角|内部视角|基准率|基线率|过度自信偏差|预测偏差|希克斯|inside view|outside view|乐观偏差|控制幻觉)/;
const CONCEPT_EN = /\b(?:planning fallacy|reference[-\s]class|outside view|inside view|base rates?|optimis(?:m|tic) bias|forecast(?:ing)? bias|planning bias)\b/i;

// ─── 豁免 B：正确估计口径（用参照类校估是正当做法）───────────────
// 注意：缓冲与估计族必须要求肯定性上下文——「不用留缓冲」「别听咨询
// 公司的悲观估计」是排斥参照类的攻击信号（r255 构造期实证：宽松写法
// 会把这两条攻击句误豁免），故只用「留了/留有/预留/留足/加了/设置」
// 与「做了/按/采用/给出/基于」等 affirmative 前缀。
const CORRECTIVE_ZH = /(?:参照同类|参照(?:去年|历史|同行|类似|实际)|参考(?:了|过)(?:去年|历史|同类|同行|类似|实际|中位数|外部基准)|按中位数|取中位数|历史工期|实际用时|外部基准|留了缓冲|留有缓冲|预留|留足缓冲|加了缓冲|设置缓冲|加上缓冲|校准|做了测算|同类城市|同类门店|数据测算|工期分布|按时交付的|统计过|复盘过|做了(?:悲观|保守|审慎)?(?:的)?(?:估计|估算|测算|排期)|按(?:悲观|保守|审慎)?(?:的)?(?:估计|估算|排期)|采用(?:悲观|保守)?(?:估计|估算))/;
const CORRECTIVE_EN = /\b(?:reference[- ]class|outside view|median of similar|actually took|looked at how long|planned for|based on (?:similar|past|historical)|track record|base rates?|benchmark(?:s|ed|ing)?|calibrat\w+|buffer|contingency|padded|scheduled for|estimated based on|historical (?:data|estimates?|record|timelines?)\s+(?:from|on|for|shows?|showed))\b/i;

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

const NEG_BEFORE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不影响|谈不上|不再|别|并不|并没|从未|绝非|而非|不说明|不表明|很难说|不见得|不是)[^。，！？；\n]{0,5}$/;
const IMMEDIATE_NEG_ZH = /(?:不|没|未|无|非)$/;
const SHORT_NEG_ZH = /(?:不|没|未|无|非|莫|甭)[^。，！？；\n]{0,2}$/;
const NEG_INSIDE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|谈不上|从不|绝不|永不|坚决不|并不|并没|而非|而不是|绝非|并非如此|说不上|称不上|不说明|不表明)/;
const NEG_INSIDE_EN = /\bnot\s+that\b|\bnot\s+to\s+say\b|\bhardly\b|\bbarely\b|\bfar\s+from\b|\bnot\s+necessarily\b|\bmakes?\s+no\s+difference\b/i;
const NEG_BEFORE_EN = /\b(?:not|no|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wasn'?t|weren'?t|won'?t|wouldn'?t|couldn'?t|shouldn'?t|mustn'?t|never|neither|nor|no\s+longer|not\s+anymore|hardly|barely|far\s+from|nowhere\s+near)\s+(?:\w+\s){0,4}$/i;

// 腿②限幅守卫：工期结论后紧跟限幅/否定词 → 不是承诺
const LIMIT_AFTER_ZH = /^(?:不够|差得远|太紧|来不及|误不了|很难|堪忧|有风险|未必|不一定|存疑|打折|差点|险些|悬)/;

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

// 工期结论腿专用：只查匹配点之前的否定前缀 + 限幅守卫，不查模式内部
// 否定词（腿②族自身含「没问题」等内在否定）。
function collectEst(text, list) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (!matchAlive(text, x, true, true)) continue;
    const after = text.slice(x.end, x.end + 4);
    if (LIMIT_AFTER_ZH.test(after)) continue;
    m.push(x);
  }
  return dedupeExact(m);
}

// 独腿签名专用：查前缀否定 + 签名跨度内部否定（「加把劲也未必能两个
// 月上线」——否定词落在两半之间，r255 实证必须查 raw 内部）。
const SOLO_NEG_INSIDE_ZH = /(?:未必|不一定|很难|恐怕|不见得|怎能|怎么可能|称不上|算不上|悬|来不及|差得远)/;
const SOLO_NEG_INSIDE_EN = /\bnot\b|\bhardly\b|\bbarely\b|\bunlikely\b|\bfar\s+from\b|\bno\s+way\b/i;
function collectSolo(text, list) {
  let m = [];
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

// 签名收集：腿①意愿表达 × 腿②工期结论，两腿邻近共现
function findSignatures(text, R) {
  const sigs = [];
  const langs = [
    {
      will: [
        ...(R.WILL_EFFORT_ZH || WILL_EFFORT_ZH),
        ...(R.WILL_INTENSITY_ZH || WILL_INTENSITY_ZH),
        ...(R.WILL_REJECT_REF_ZH || WILL_REJECT_REF_ZH),
        ...(R.WILL_DISMISS_ZH || WILL_DISMISS_ZH),
        ...(R.WILL_MIMIC_ZH || WILL_MIMIC_ZH),
      ],
      est: [
        ...(R.EST_DURATION_ZH || EST_DURATION_ZH),
        ...(R.EST_COST_ZH || EST_COST_ZH),
        ...(R.EST_PROMISE_ZH || EST_PROMISE_ZH),
      ],
      infer: R.INFER_ZH || INFER_ZH,
      w: R.W_ZH != null ? R.W_ZH : W_ZH,
      lang: 'zh',
    },
    {
      will: [
        ...(R.WILL_EFFORT_EN || WILL_EFFORT_EN),
        ...(R.WILL_INTENSITY_EN || WILL_INTENSITY_EN),
        ...(R.WILL_REJECT_REF_EN || WILL_REJECT_REF_EN),
        ...(R.WILL_DISMISS_EN || WILL_DISMISS_EN),
        ...(R.WILL_MIMIC_EN || WILL_MIMIC_EN),
      ],
      est: [
        ...(R.EST_DURATION_EN || EST_DURATION_EN),
        ...(R.EST_PROMISE_EN || EST_PROMISE_EN),
      ],
      infer: R.INFER_EN || INFER_EN,
      w: R.W_EN != null ? R.W_EN : W_EN,
      lang: 'en',
    },
  ];
  // 独腿签名：一句话内部自带完整计划谬误结构，单独成支
  const soloZh = collectSolo(text, R.SOLO_ZH || SOLO_ZH);
  const soloEn = collectSolo(text, R.SOLO_EN || SOLO_EN);
  for (const x of soloZh) sigs.push({ lang: 'zh', will: x.raw, est: '', infer: '', solo: true });
  for (const x of soloEn) sigs.push({ lang: 'en', will: x.raw, est: '', infer: '', solo: true });
  for (const L of langs) {
    const willM = collect(text, L.will, true);
    if (willM.length === 0) continue;
    const estM = collectEst(text, L.est);
    if (estM.length === 0) continue;
    const inferM = allMatches(L.infer, text);
    for (const n of willM) {
      for (const v of estM) {
        if (dist(n, v) > L.w) continue;
        // 包含守卫：一条腿整体落在另一条腿内部即失配——「肯定上线」
        // 是「两个月肯定上线」的子串，不是独立的意愿表达（r255 实证：
        // 缺这条守卫时 W_ZH=0 注入下它会在工期腿尾部自配成签名）。
        if ((n.idx >= v.idx && n.end <= v.end) || (v.idx >= n.idx && v.end <= n.end)) continue;
        // 防自证：工期结论腿必须在意愿腿之外**带来新内容**（左伸或右伸
        // 至少 2 字）——「努力赶」不能既当意愿腿又当工期结论腿；但
        // 「加把劲……两个月肯定上线」的跨腿配对是真双腿。
        const newRight = v.end > n.end ? v.end - Math.max(v.idx, n.end) : 0;
        const newLeft = v.idx < n.idx ? Math.min(v.end, n.idx) - v.idx : 0;
        if (newRight < 2 && newLeft < 2) continue;
        const between = inferM.find(x => (x.idx >= n.end && x.end <= v.idx) || (x.idx >= v.end && x.end <= n.idx));
        sigs.push({ lang: L.lang, will: n.raw, est: v.raw, infer: between ? between.raw : '' });
      }
    }
  }
  // 签名按「语言 × 意愿腿原文 × 工期腿原文」去重，避免跨族重叠把一处
  // 证据算成多处（count 参与档位判定，必须诚实）。
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.will + '|' + s.est;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * 计划谬误签名：意愿/努力表达（或参照类排斥） × 工期/成本结论 邻近共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectPlanningFallacy(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念教学（讨论计划谬误/参照类这个概念本身）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：正确估计口径（用参照类校估是正当做法）
  if ((R.CORRECTIVE_ZH || CORRECTIVE_ZH).test(text) || (R.CORRECTIVE_EN || CORRECTIVE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension: 'planning_fallacy',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '意愿表达「' + x.will + '」→ 工期结论「' + x.est + '」' + (x.infer ? '（推断标记「' + x.infer + '」）' : '')
      : 'will/effort "' + x.will + '" -> schedule conclusion "' + x.est + '"' + (x.infer ? ' (via "' + x.infer + '")' : ''))),
    details: s.lang === 'zh'
      ? '计划谬误(' + sigs.length + '处: 凭意愿「' + s.will + '」直接推出工期结论「' + s.est + '」，缺参照类基准)(zh)'
      : 'planning-fallacy(' + sigs.length + 'x: will "' + s.will + '" -> schedule conclusion "' + s.est + '")(en)',
    guidance: '计划谬误指只凭意愿与努力程度估计任务工期与成本、无视同类任务实际结果分布的估计偏差——团队确实可以真心想拼，「两个月」也可以是个具体数字，但同类项目过去实际用了多久这一块信息一旦缺席，排期就只是愿望的投影。请按参照类的外部视角重新校估再承诺：给出同类任务的历史工期分布（中位数而非最好情况）、明确列出悲观情形与缓冲、对照过去三个以上类似项目的实际用时、或直接说明这个估计缺少参照类基准。若这段话只是客观转述一个排期计划（项目排期两个月，含两周缓冲），请把结论限定在计划本身，不要用意愿强度为其背书；若只是引用管理案例或转述他人说法，核实其参照口径再决定是否采信。讨论计划谬误的概念、主动用参照类数据校准、把意愿与工期承诺分开表述，都是正当做法。',
    tags: ['economics', 'planning-fallacy', 'reference-class', 'estimation', 'scheduling'],
  };
}

module.exports = {
  detectPlanningFallacy,
  __internals: () => ({
    WILL_EFFORT_ZH, WILL_INTENSITY_ZH, WILL_REJECT_REF_ZH, WILL_DISMISS_ZH, WILL_MIMIC_ZH,
    WILL_EFFORT_EN, WILL_INTENSITY_EN, WILL_REJECT_REF_EN, WILL_DISMISS_EN, WILL_MIMIC_EN,
    EST_DURATION_ZH, EST_COST_ZH, EST_PROMISE_ZH,
    EST_DURATION_EN, EST_PROMISE_EN,
    SOLO_ZH, SOLO_EN,
    INFER_ZH, INFER_EN, W_ZH, W_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECTIVE_ZH, CORRECTIVE_EN,
  }),
};
