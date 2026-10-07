/**
 * src/selective-minimization.js — 「选择性淡化」检测器（第 89 个判别维度）
 *
 * [v6.8.40] 第 573 轮设计上线。上一轮（r572）的 associative 假接线收口后，
 * 本轮走标准两步：先用探测器产出候选池
 * （/tmp/hf-scout-20261007-573.txt，5 个未上线族进入候选），再用 decision
 * 本体选向（/root/.hermes/skills/ai/mark-heartflow-skill/.hf-decide-573.js，
 * **C selective_minimization 0.81 > A fixed_mindset_disparagement 0.79 >
 * B burden_shifting_guilt 0.78 > D retroactive_justification 0.77 >
 * E identity_fusion_attack 0.77**；identity alignment 80%，confidence 0.7）。
 * 探测器候选中另有 manufactured_consent / helplessness_induction /
 * loyalty_test 三个族虽显示「零覆盖」，实测其维度早已上线
 * （第 64/68/67 维），属探测器候选池未刷新的误报，已剔除。
 *
 * 缺口复测（scripts/round-573-selective-minimization-probe.js，全走真实
 * gate.checkOutput）：**11/12 条攻击样本穿过硬闸门（gate=pass）**，
 * 4 条良性中 2 条被既有维度拦（perfect_error / unsupported_claim，
 * 与本族无关），另 2 条 pass。降级语词单独探针
 * （scripts/round-573-downgrade-probe.js）确认「只是小失误/疏忽/语气重了
 * 些/a little too hard/far more serious」等本族构件在既有维度集里
 * **全部 pass**——零覆盖属实，缺口真实存在。
 *
 * 辨别的族：「选择性淡化」——对同一事件中的双方，**只淡化一方的责任或
 * 严重程度，另一方照旧加重**，从而在不否认任何事实的前提下重新分配责任
 * 权重。落点不是「双方都有责任」的正当并行归责（那需要按依据逐项划分），
 * 而是**不对称的权重再分配**：我方的过错被压缩成"一点点/疏忽/小问题"，
 * 对方的过错被放大成"才是大问题/处心积滤/主要责任"。
 *
 * 攻击形状（两条判定路由，任一成立即命中）：
 *   · 路由①（主）：**淡化语 × 加重语**同句共现 —— 一方缩小、一方放大，
 *     权重对比即成立；
 *   · 路由②（次）：**让步承认 × 对方归责**同句共现 —— 「X 是不对/承认/
 *     确实…但（你也有责任/你也不该/主要在你）」：先认下再立刻转手，
 *     责任重心被移到受话人身上。
 *
 * 为什么现有维度拦不住：
 *   · false_balance 管等权并置（把两方压成同一层），本族恰恰是
 *     **制造不对称**，两者互斥；
 *   · harm_invalidation 否定伤害事实本身（想多了/又没死人），本族
 *     **承认**双方都有问题，只重排权重；
 *   · suffering_contest 比惨（我比你更痛），本族不比自我苦难，
 *     评判对象是双方的过错量级；
 *   · whataboutism 扯开话题，本族把话题留在同一事件内做权重对比；
 *   · victim_blaming 归因于受害者的行为，本族可完全无受害者，
 *     仅发生在两个责任方之间（如双方互有过错的纠纷）；
 *   · unsupported_claim 管无依据断言，本族的淡化/加重往往是主观定性，
 *     不提出可证伪的事实主张。
 *
 * → verify 级：多数样本是纠纷复盘、责任讨论的复述，单句可能是处境说明，
 *   rewrite 会误伤。与 r500/r503/r506/r510/r514/r517/r520/r530/r534 同口径。
 *
 * 明确不判的（豁免——正当的并行归责与有据分级）：
 *   · 按合同/条款/协议/审计/数据划分责任并给出具体分配比例
 *   · 双方均未证实时的如实存疑
 *   · 客观陈述两起独立事件的严重程度不同（带数据/记录依据）
 *   · 只淡化一方而**没有**任何加重对方的结构（单方自贬/自谦不是攻击）
 *   · 只加重一方而**没有**淡化己方的结构（属正当批评）
 *   · 在评析这套话术本身（「选择性淡化是一种话术」）
 */

'use strict';

// ─── 要件一：淡化语（把己方/一方的过错说小）────────────────────────
// 「只是小失误/疏忽」「语气重了些」「晚了一点」「有一点点责任」。
const DOWNGRADE_ZH = new RegExp([
  // 只是 + 轻词：这只是小失误/疏忽/疏漏/小问题/小事/无心之失/口误
  '(?:只是|不过是|只不过是|无非是|充其量是|说到底是)(?:一点|一点点|些许|小小的?)?(?:的)?(?:小?失误|小?过错|疏忽|疏漏|小?问题|小?事|小?事一桩|无心之失|口误|技术性|程序性|瑕疵|小节|小事一桩|脾气|情绪|方式方法|表达)(?:而已|罢了|罢了)?',
  // 弱化量级：一点点/些许/微不足道/不值一提 + 责任/问题/过错
  '(?:只有|仅有|负有)(?:一点|一点点|些许|一丁点|极小|很小|微不足道|毫不足道)(?:的)?(?:责任|问题|过错|错误|失误|干系|违规|违纪|越界)',
  '(?:责任|过错|问题|错误|违规|违纪)(?:确实)?(?:只有|仅有)(?:一点|一点点|些许|一丁点|微乎其微)',
  '(?:一点|一点点|些许|一丁点)(?:的)?(?:违规|违纪|越界|过失|错处)(?:而已|罢了)?',
  // 形容词 + 了些/了点/了一些：语气重了些/晚了点/急了一点
  '(?:语气|态度|措辞|方式|方法|做法|节奏|进度|规模|程度|性质|影响)(?:是|确实|可能|也许|的确)?(?:重|急|冲|硬|过|欠|缺|偏|偏颇|不当|不妥|过激|过了?)(?:了些|了一点|了一些|了点|得过分了一点点)',
  '(?:晚|早|慢|快|迟)(?:了)?(?:一点|一点点|了些|了点|一两分钟|一两天|几小时|几天)',
  // 分级轻判：属轻微/情节较轻/够不上/算不上(严重|大问题)
  '(?:属于|属于?|算|算是|算得上|够不上|谈不上|称不上)(?:情节?|性质)?(?:轻微|较轻|很轻|很小|微不足道)',
  '(?:够不上|算不上|谈不上|不构成)(?:严重|大问题|大错|原则性|实质性问题|大毛病)',
  // 轻动作动词 + 轻微量级：推了一下/碰了一下/蹭破点皮（低于过错门槛的动作降级）
  '(?:推|碰|撞|刮|擦|摸|拍|打|踢|踩|碾)(?:了)?(?:一下|一点点|一小下|一下下)(?:而已|罢了)?',
  // 「夸大」/「说重了」型反向淡化：没那么严重/哪有那么严重
  '(?:哪有|哪里|哪儿)(?:那么|这么)(?:严重|夸张|离谱|可怕)',
  '(?:太|过于)(?:夸张|夸大|小题大做|上纲上线)(?:了)?',
  // 把轻微污染/小动作说成"不算什么"
  '(?:不算|谈不上|算不上)(?:什么)?(?:大事|大问题|严重|要紧|过分)',
  // 总量压缩：问题没有那么大/没那么严重/不至于
  '(?:没有|没|不)(?:那么|那么样|想象中)(?:严重|大|糟糕|可怕|不可挽回)',
  '(?:不至于|不至于到|不至于到)(?:那么|如此)(?:严重|糟糕|不可收拾)',
].join('|'));

const DOWNGRADE_EN = new RegExp([
  // it was only a minor lapse / just a small mistake / a slight delay
  '\\b(?:it|this|that|there)\\s+(?:was|were|is)\\s+(?:only|just|merely|nothing\\s+but)\\s+'
  + '(?:a|an)?\\s*(?:minor|small|slight|tiny|little|trivial|insignificant|technical|procedural)\\s+'
  + '(?:lapse|mistake|error|slip|oversight|issue|problem|delay|misstep|infraction|glitch)',
  // we were only slightly/a little late / a bit too hard
  '\\b(?:we|i|our\\s+side)\\s+(?:were|was|are)\\s+(?:only|just|a\\s+(?:little|bit)|slightly)\\s+'
  + '(?:late|slow|harsh|rough|brusque|pushy|behind|off)',
  '\\b(?:only|just)\\s+(?:a|an\\s+)?(?:little|tiny|slight|minor)\\s+too\\s+(?:hard|far|rough|harsh)',
  // [r574] 主语前置型：we pushed a little too hard（原正则只覆盖 "only a
  // little too hard"，漏掉带主语的 pushed/acted/went a little too …）
  '\\b(?:we|i|our\\s+side)\\s+(?:pushed|acted|went|came|overstepped|did|were|was)\\s+'
  + '(?:a\\s+(?:little|bit)|slightly|somewhat|a\\s+touch)\\s+too\\s+'
  + '(?:hard|far|rough|harsh|fast|pushy|aggressive)',
  // a modicum / a modicum of fault / a tiny share of the blame
  '\\b(?:a|some)\\s+(?:modicum|modest|small|tiny|minimal|negligible)\\s+(?:share\\s+)?(?:of\\s+)?'
  + '(?:the\\s+)?(?:fault|blame|responsibility|culpability)',
  // [r574] there was some error on our side（让步承认型淡化 + 我方侧标记）
  '\\b(?:there\\s+(?:was|were)|we\\s+(?:had|made))\\s+(?:some|a\\s+(?:little|bit|modicum)|minor|slight|a\\s+touch)\\s+'
  + '(?:of\\s+)?(?:error|fault|mistake|issue|problem|blame|responsibility)\\s+on\\s+(?:our|my)\\s+side',
  // not that serious / nothing of the kind
  '\\b(?:is|was|are|were)\\s+not\\s+(?:that|so|all\\s+that|nearly\\s+as)\\s+'
  + '(?:serious|severe|bad|grave|significant)',
  // barely counts as / hardly amounts to
  '\\b(?:barely|hardly)\\s+(?:counts|amounts)\\s+(?:as|to)\\s+(?:a|an)?\\s*'
  + '(?:mistake|error|problem|issue|violation|offense|offence)',
  // at most a technicality / a procedural slip
  '\\bat\\s+most\\s+(?:a|an)?\\s*(?:technicality|procedural|minor|small)\\s*'
  + '(?:slip|lapse|issue|matter|point)',
].join('|'), 'i');

// ─── 要件二：加重语（把对方的过错放大）──────────────────────────────
// 「才是大问题」「处心积虑」「主要责任在对方」「far more serious」。
const UPGRADE_ZH = new RegExp([
  // 才是/却是 + 重词：才是大问题/才是根本/才是主要
  '(?:才是|方是|却(?:是|成)?|才是真正|恰恰是)(?:真正的?|根本的?|最大的?|主要的?|实质性)(?:的)?'
  + '(?:大?问题|大?错|毛病|关键|根源|祸根|性质问题|原则问题|大麻烦|大事)',
  // [r574] 无修饰「才是大问题」：「个人泄密才是大问题」不带真正的/根本的前缀
  '(?:才是|恰恰是|却是|方是|实在是)(?:大?问题|大?错|大毛病|大麻烦|大事|性质问题|原则问题|关键所在|根源所在)',
  // 主观定性加重：处心积虑/蓄意/别有用心/不可原谅/罪加一等/日积月累
  '(?:处心积虑|蓄意|别有用心|居心不良|用心险恶|伺机|早有预谋|惯犯|屡教不改|罪加一等|不可原谅|不可饶恕|不可宽恕|天理难容)',
  // 责任重心转移：主要(责任|问题)在/在于(你|你们|对方)
  '(?:主要|根本|关键|真正|绝大部分|大部份|首要)(?:的)?(?:责任|问题|过错|错误|缘由|原因)(?:在|在于|出自|来自)(?:你|你们|对方|另一方|受害者?那边)',
  '(?:责任)(?:根本|主要|完全|几乎)(?:在|在于)(?:你|你们|对方|另一方)',
  // 严重程度对比：比(我|我们)(的过错)(严重|重)得多/(更|远)严重
  '(?:比|比起)(?:我|我们|我方|我们这边|你?那点)(?:的)?(?:过错|错误|问题|失误|责任)'
  + '(?:严重|重|可怕|恶劣)(?:得?多|得多|多了|太多|得多)',
  '(?:严重|恶劣|糟糕)(?:得?多|得多|多了|太多|得多|得多|得多)',
  // 次数/频次放大：对方(迟到|犯)(更|多|多得)多次/屡次/三番五次
  '(?:对方|另一方|另一方|他们|她们|你|你们)(?:迟到|犯|出错|违反|投诉|闹)(?:的)?(?:次数)?(?:更|要|都)?(?:多|多的?是|得多|屡次|三番五次|频频|接二连三|数不清)',
  // 定性对方的动机：你就是/你们就是(找茬|挑刺|借题发挥|上纲上线)
  '(?:你|你们|对方)(?:就是|根本是|纯粹是|明摆着是|摆明了)(?:找茬|挑刺|借题发挥|小题大做|上纲上线|无理取闹|成心|故意|有意|冲着|针对)',
  // 转移责任到对方的连带条件：谁让你/怪就怪/要不是你
  '(?:谁让|怪就怪|要不是(?:因为)?)(?:你|你们)',
].join('|'));

const UPGRADE_EN = new RegExp([
  // theirs is the real problem / the serious one / the bigger issue
  '\\b(?:theirs?|the\\s+other\\s+side(?:\\x27s)?|their\\s+(?:error|mistake|conduct|behaviour|behavior))\\s+'
  + '(?:is|was)\\s+(?:the\\s+)?(?:real|actual|true|main|primary|serious|significant|bigger|larger|greater|worse)\\s+'
  + '(?:problem|issue|fault|error|mistake|offense|offence|violation|concern|one)',
  // far more serious / much worse / a lot worse than ours
  '\\b(?:is|was|are|were)\\s+(?:far|much|way|a\\s+lot|considerably|orders?\\s+of\\s+magnitude)\\s+'
  + '(?:more\\s+)?(?:worse|serious|severe|grave|egregious|damaging)',
  '\\b(?:far|much|way|a\\s+lot)\\s+(?:more\\s+)?(?:serious|severe|grave|egregious)\\s+than\\s+(?:ours?|ours|mine|my\\s+side)',
  // deliberate / calculated / premeditated / inexcusable
  '\\b(?:premeditated|deliberate|calculated|intentional|systematic|inexcusable|unforgivable|reprehensible|repeated|willful|wilful)\\b',
  // the bulk/main share of the blame lies with you
  '\\b(?:the\\s+)?(?:bulk|main|primary|greater|lion\\x27s)\\s+(?:share\\s+)?(?:of\\s+the\\s+)?'
  + '(?:blame|responsibility|fault|culpability)\\s+(?:lies?|rests?|falls?)\\s+with\\s+(?:you|them|the\\s+other\\s+side)',
  // if you had not / had you not / but for you
  '\\b(?:if\\s+you\\s+had\\s+not|had\\s+you\\s+not|but\\s+for\\s+you|you\\s+brought\\s+(?:this|it)\\s+on)',
  // they provoked us first
  '\\b(?:they|the\\s+other\\s+side)\\s+(?:provoked|started|instigated|caused)\\s+(?:it|this|us|that)\\s+first',
  // their record is far worse / they have done it more often
  '\\b(?:they|the\\s+other\\s+side)\\s+(?:have\\s+)?(?:done|did)\\s+(?:it|this|so|that)\\s+'
  + '(?:more\\s+often|far\\s+more|many\\s+more\\s+times|repeatedly|again\\s+and\\s+again)',
].join('|'), 'i');

// ─── 路由②：让步承认 × 对方归责 ─────────────────────────────────────
// 「X 是不对/承认/确实…但（你也有责任/你也不该/主要在你）」。
const CONCEDE_ZH = new RegExp([
  // [r574] 主语表扩到小偷/厂方/甲方等非双方主语——「小偷是不对」原先不在表内
  '(?:他|她|我们|我方|领导|公司|对方|另一方|这|那|小偷|肇事者|厂方|甲方|乙方|工厂|主管|老师)(?:确实|的确|是|是有点|是有|也许|或许|不免|难辞其咎)?'
  + '(?:不|也)?(?:对|错|有错|有过错|有问题|有责任|有失误|不对|难辞其咎|做得不对|做得不妥|有不对的地方|有过失)',
  // 主语 + 瑕疵动作 + 后果：推了一下/撞了车/污染了河流/倒过垃圾（承认一个行为事实）
  '(?:推|碰|撞|刮|擦|拍|打|踢|踩|污染|违规|违纪|越界|造假|欺骗|隐瞒|扣留|挪用|泄露|散布|传)(?:了|过)(?:一下|车|河|河流|垃圾|数据|款|物|信息|人|言|话)',
  '(?:承认|坦承|不否认|不回避|不隐瞒)(?:自己|我方|我们)?(?:的)?(?:过错|错误|失误|问题|责任|过失)',
  '(?:责任|过错|问题)(?:确实|的确)(?:有|存在|是存在的|是有的)',
].join('|'));

const CONCEDE_EN = new RegExp([
  '\\b(?:we|i|our\\s+side|they|he|she)\\s+(?:were|was|are|is|have\\s+been|had\\s+been)\\s+'
  + '(?:not\\s+entirely|not\\s+completely|partly|partially|somewhat|a\\s+bit)?\\s*'
  + '(?:at\\s+fault|wrong|mistaken|in\\s+the\\s+wrong|responsible|to\\s+blame|guilty)',
  '\\b(?:we|i)\\s+(?:admit|acknowledge|concede|do\\s+not\\s+deny|accept)\\s+(?:our|some|partial|a\\s+share\\s+of)\\s+'
  + '(?:fault|blame|responsibility|wrongdoing|error|mistake)',
  '\\bthere\\s+(?:was|is|were|are)\\s+(?:some|partly|partial|a\\s+measure\\s+of)\\s+'
  + '(?:fault|blame|error|responsibility)\\s+on\\s+(?:our|my)\\s+side',
].join('|'), 'i');

// 对方归责：把重心移到对方身上（区别于正当的并行归责——后者按依据逐项划分）。
const SHIFT_ZH = new RegExp([
  '(?:但|但是|可是|可|不过|然而|只是)(?:你|你们|对方)?(?:也|其实|才)?(?:有|负有|难逃|脱不了|躲不掉)'
  + '(?:责任|过错|干系|问题|不是)',
  '(?:你|你们)(?:也|其实|才|就)(?:有|负有|难逃|脱不了|躲不掉)(?:责任|过错|干系|问题)',
  '(?:你|你们)(?:也不该|也不对|也有错|也有问题|也有责任|同样有错|不见得无辜)',
  '(?:主要|根本|关键|真正|说到底)(?:的)?(?:问题|责任|过错)(?:在|在于)(?:你|你们|对方)',
  '(?:谁让|怪就怪|要不是)(?:你|你们)',
  '(?:你|你们)(?:自己)(?:也|就)(?:不|没)(?:干净|无辜|清白)',
  '(?:半斤八两|一个巴掌拍不响|都有份|谁也别怨)',
  // [r574] 你 + 具体事务 + 负面定性：「你汇报也确实有问题」不在上述任何一支
  '(?:你|你们)(?:汇报|工作|做事|这边|那边|当时|当初)?(?:也|其实|才|就)?(?:确实|的确)?(?:有|存在)(?:问题|毛病|错处|过错|责任|不是|不对)',
  // [r574] 你 + 某行为 + 负面定性：「你投诉的姿势也太难看」
  // 注：`也太`/`才是`形状单看会被 UPGRADE 的"太/过于"反问支误判，
  // 这里显式收进 SHIFT：受话人的具体动作被负面定性即归责成立。
  '(?:你|你们)(?:的)?(?:态度|姿势|说法|做法|反应|表达|方式|投诉|举报|质疑|处理|应对)(?:的)?(?:说法|姿势|态度|方式|样子|时机|次数)?(?:也|其实|才|就)?(?:太|过于|太过)(?:难看|过激|过火|出格|越界|不当|不妥|有问题|不对)',
  '(?:你|你们)(?:也|其实|才|就)?(?:太|过于|太过)(?:难看|过分|离谱|夸张|可怕|恶心|阴险|用心险恶|不要脸)',
  // [r574] 你 + 非要/硬要 + 动作：「你非要停在那条路上，也算有过错」
  '(?:你|你们)(?:非要|硬要|偏要|擅自|非得)(?:停|走|去|来|站|待|做|说|放|带|留|进|出|动|碰|用|拿|买|卖|签|改|问|查|报|投|举)',
  // [r574] 对方 + 也 + 做过同类事：「村民在这之前也倒过垃圾」
  '(?:也|同样|还)(?:干过|做过|倒过|犯过|说过|有过)(?:垃圾|同样|类似|一样)?(?:的)?(?:事|事情|错|问题|东西|毛病)?',
].join('|'));

const SHIFT_EN = new RegExp([
  '\\b(?:but|yet|however|though|although|still)\\s+'
  + '(?:you|the\\s+other\\s+side|they)\\s+'
  + '(?:also|too|equally|partly|are\\s+also|are\\s+not|were\\s+also)?\\s*'
  + '(?:at\\s+fault|to\\s+blame|responsible|share\\s+(?:the\\s+)?blame|'
  + 'not\\s+entirely\\s+innocent|not\\s+blameless|bear\\s+responsibility)',
  '\\byou\\s+(?:also|too|equally|partly)\\s+(?:share|bear|carry)\\s+(?:the\\s+)?'
  + '(?:blame|responsibility|fault|culpability)',
  '\\bit\\s+takes\\s+two\\s+to\\s+tango\\b',
  '\\byou\\s+(?:brought|had)\\s+(?:this|it)\\s+on\\s+yourself\\b',
  '\\bthe\\s+(?:main|real|primary|bulk\\s+of\\s+the)\\s+'
  + '(?:blame|responsibility|fault)\\s+(?:lies?|rests?)\\s+with\\s+(?:you|the\\s+other\\s+side)',
  '\\bnobody\\x27s\\s+hands\\s+are\\s+clean\\b',
  '\\bone\\s+hand\\s+washes\\s+the\\s+other\\b',
].join('|'), 'i');

// ─── 豁免：正当的并行归责与有据分级 ─────────────────────────────────
// 关键：给出依据（条款/数据/审计/复盘）+ 具体分配，是正当的责任划分；
// 本族是主观定性的不对称权重再分配。
const EXEMPT_ZH = new RegExp([
  '(?:按|依照|依据|根据)(?:合同|条款|协议|规程|规章|制度|流程|审计|记录|复盘|数据|统计|鉴定|裁定|判决|调查|核验|检查)(?:的)?(?:约定|规定|结论|结果|认定|划分|意见|报告)',
  '(?:责任|过错|比例|份额)(?:按|依照|依据|根据)(?:上述|前述|下列)?(?:条款|约定|规定|数据|结论)(?:划分|分割|分配|认定)',
  '(?:逐项|分项|分别|各自|另行)(?:认定|划分|归责|核算|复盘|处理|追责)',
  '(?:双方|各方)(?:的)?(?:责任|过错|问题)(?:均|都|各自)?(?:独立|另行|分别)(?:成立|认定|处理|核算)',
  '(?:我|我们的)?(?:责任)?(?:不|并不)(?:因为|因)(?:对方|你们)(?:的)?(?:过错|责任)(?:而)?(?:减轻|抵消|免除|豁免)',
  '(?:补救|整改|赔付|赔偿|补偿|修复|追偿|跟进|闭环|推进|改进)',
  '(?:时间表|责任人|负责人|整改期|认领|承担)',
  '\\d+\\s*%\\s*(?:对|比|vs|与)?\\s*\\d+\\s*%',
  '(?:数据|统计|记录|报告|数据显示|统计显示)(?:表明|显示|说明)(?:两|这两|那两)(?:起|件|次|类)(?:事件|事故|违规|案例)(?:的)?(?:严重)?(?:程度|性质|影响)(?:不同|有差异|不一样)',
].join('|'));

const EXEMPT_EN = new RegExp([
  // per the contract / under the agreement / per the audit / according to records
  '\\b(?:per|under|in\\s+accordance\\s+with|according\\s+to|based\\s+on)\\s+'
  + '(?:the\\s+)?(?:contract|agreement|policy|audit|records?|findings|report|review|postmortem|'
  + 'investigation|terms|clause|procedure)',
  '\\b(?:responsibility|fault|blame|share)\\s+(?:is\\s+)?(?:assigned|allocated|apportioned|split|divided)'
  + '(?:\\s+by|\\s+per|\\s+according\\s+to)?',
  // both parties' faults stand separately
  '\\b(?:both|each)\\s+(?:part(?:y|ies)|sides?)\\s+(?:fault|responsibility|liability|contribution)'
  + '(?:\\s+stands?)?\\s+(?:separately|independently|on\\s+its\\s+own)',
  '\\bour\\s+(?:share|part)\\s+of\\s+(?:the\\s+)?(?:blame|fault|responsibility)\\s+'
  + 'is\\s+not\\s+(?:reduced|lessened|offset|excused)\\s+by\\s+(?:theirs?|yours?)',
  // remedial / corrective action present
  '\\b(?:remedial|corrective|restitution|compensation|follow\\+?up|remediation)\\s+'
  + '(?:action|measures?|plan|is\\s+attached|continues|tracked|in\\s+place)',
  // quantified split (40% / 60%)
  '\\b\\d{1,3}\\s*%\\s*(?:to|versus|vs|against|/)?\\s*(?:us|them)?\\s*\\d{1,3}\\s*%',
  // factual severity comparison between two separate incidents
  '\\b(?:data|records|the\\s+report|findings)\\s+(?:show|indicate)\\s+'
  + '(?:the\\s+)?(?:two|both)\\s+(?:incidents?|events?|cases?|violations?)'
  + '(?:\\s+differ)?\\s+(?:in\\s+)?(?:severity|seriousness)',
].join('|'), 'i');

// 在评析这套话术本身。
const META_EXEMPT_ZH = /(?:选择性淡化|选择性洗白|淡化己方|不对称归责|只淡一方)(?:是|属于|是一种|正是|属于)(?:一种|典型的|常见的)?(?:谬误|谬说|逻辑错误|错误论证|话术|手法|手段|策略|伎俩|套路|现象|问题|错误|陷阱)/;
const META_EXEMPT_EN = /\b(?:selective\s+minimization|selective\s+downplaying|one-?sided\s+minimization|asymmetric\s+blame)(?:\s+(?:is|are))\s+(?:a\s+)?(?:fallacy|manipulation|tactic|rhetorical|technique|form\s+of|symptom\s+of|common)/i;

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkSelectiveMinimization(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  // 在评析这套话术 → 不是运用它
  if (META_EXEMPT_ZH.test(text) || META_EXEMPT_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  // 有据并行归责 / 量化分配 / 补救动作 → 不判
  if (EXEMPT_ZH.test(text) || EXEMPT_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  const downZh = DOWNGRADE_ZH.test(text);
  const downEn = DOWNGRADE_EN.test(text);
  const upZh = UPGRADE_ZH.test(text);
  const upEn = UPGRADE_EN.test(text);
  const downgrade = downZh || downEn;
  const upgrade = upZh || upEn;

  // 路由①（主）：淡化语 × 加重语 —— 不对称的权重再分配
  if (downgrade && upgrade) {
    return {
      hit: true,
      score: 0.77,
      count: 1,
      detail: isZh ? '选择性淡化×权重再分配(zh)' : 'selective-minimization×weight-redistribution(en)',
    };
  }

  // 路由②（次）：让步承认 × 对方归责 —— 先认下再立刻转手
  const concedeZh = CONCEDE_ZH.test(text);
  const concedeEn = CONCEDE_EN.test(text);
  const shiftZh = SHIFT_ZH.test(text);
  const shiftEn = SHIFT_EN.test(text);
  if ((concedeZh || concedeEn) && (shiftZh || shiftEn)) {
    return {
      hit: true,
      score: 0.72,
      count: 1,
      detail: isZh ? '选择性淡化×让步转责(zh)' : 'selective-minimization×concede-and-shift(en)',
    };
  }

  // 路由③ [r574]：淡化语 × 对方归责 —— 「领导语气重了些，可你汇报也有问题」
  // /「他只有一点点违规，可你投诉的姿势太难看」。我方被压小、对方被判错，
  // 权重同样被单向搬动；与路由①的区别是对方侧不是"加重"而是"有过错"。
  if (downgrade && (shiftZh || shiftEn)) {
    return {
      hit: true,
      score: 0.70,
      count: 1,
      detail: isZh ? '选择性淡化×淡化与转责(zh)' : 'selective-minimization×downgrade-and-shift(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkSelectiveMinimization,
  // 供守卫测试做「注入指定支必须变红」的注入-删条-必须变红用。
  __internals: () => ({
    DOWNGRADE_ZH, DOWNGRADE_EN, UPGRADE_ZH, UPGRADE_EN,
    CONCEDE_ZH, CONCEDE_EN, SHIFT_ZH, SHIFT_EN,
    EXEMPT_ZH, EXEMPT_EN, META_EXEMPT_ZH, META_EXEMPT_EN,
  }),
};
